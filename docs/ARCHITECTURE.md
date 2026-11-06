# 🏛️ Architecture Specification & Technical Mechanics

**Colab Router** transforms Google Colab into a high-availability, sovereign, OpenAI-compatible AI supercomputer. This document explains the underlying engineering design, memory mechanics, and failure mitigations.

---

## 1. System Topology

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        Cursor["Cursor / Windsurf / Cline\n(OpenAI Provider)"]
        WebUI["Open-WebUI / Agentic Studio\n(Browser IndexedDB)"]
        CustomApp["Custom Apps / LangChain / LiteLLM"]
    end

    subgraph Tunnel["Ingress Layer"]
        Ngrok["Ngrok Ingress Gateway\n(Reserved or Dynamic URL)"]
    end

    subgraph ColabHost["Google Colab VM (Tesla T4 GPU 15.3GB VRAM)"]
        FastAPI["Decoupled FastAPI Hybrid Gateway (:8000)\n• /v1/chat/completions\n• /v1/models\n• /ps (Real-Time Hardware Telemetry)\n• Passkey / Bearer Auth Gate"]
        OllamaEngine["Ollama Runtime (:11434)\n• 66/66 Layers Offloaded to CUDA0\n• 4096 Context Length\n• Flash Attention Enabled"]
        Watchdog["Autonomous In-Container Watchdog\n• Optional CUDA pulse (off by default)\n• Auto-Revives Dead Daemons"]
    end

    subgraph Controller["Orchestration Layer (Local / Koyeb / VPS)"]
        Daemon["GDQ Cloud Orchestrator\n• Preemptive Shift Timer (3.5h)\n• 30s Health Prober\n• Fast In-Container Recovery"]
        Vault["Secure Token Vault\n(Account 1, Account 2, Account 3)"]
        HealthKeepAlive["HTTP Health Server (:8080)"]
    end

    Clients -->|"HTTPS (REST + SSE)"| Ngrok
    Ngrok -->|"TCP Forward"| FastAPI
    FastAPI -->|"Localhost Proxy"| OllamaEngine
    Controller -->|"Probes Health"| FastAPI
    Controller -->|"CLI VM Provisioning"| ColabHost
    Vault -->|"OAuth Refresh"| Controller
    Watchdog -->|"Maintains GPU Lock"| OllamaEngine
```

---

## 2. Memory Dynamics on Tesla T4 (15.3 GB VRAM)

A 27-Billion parameter dense model typically requires ~54 GB in FP16 precision. To execute a 27B model on a single Tesla T4 (15.3 GB VRAM), careful quantization and context window tuning are required:

| Parameter | Configuration | Memory Footprint |
| :--- | :--- | :--- |
| **Model Quantization** | `IQ4_XS` (Importance Matrix Quantization) | **13.73 GB** |
| **KV Cache (`num_ctx 4096`)** | 16-bit Float Context Cache | **~0.82 GB** |
| **CUDA Compute Buffers** | Fused Attention & Overhead | **~0.15 GB** |
| **Total VRAM Allocated** | **100% GPU Offload (66/66 Layers)** | **14.54 GB / 15.36 GB (95%)** |
| **Free Margin** | Safe Buffer against CUDA OOM | **~0.82 GB Free** |

### ⚠️ The CPU Offloading Trap
If context length is expanded to 8,192 or 16,384 on a 27B model, Ollama automatically spills 6 to 10 layers into CPU system RAM. 
- **100% GPU (66/66 layers):** **11.5 - 12.0 tokens/second**, first-token latency **0.84s**.
- **Partial CPU (60 GPU / 6 CPU):** **2.8 - 3.1 tokens/second**, first-token latency **12.5s**.

Colab Router enforces **100% GPU offloading** with `num_ctx 4096` to maximize token throughput and eliminate client timeouts.

---

## 3. Colab limits (what you cannot get around)

From the official [Colab FAQ](https://research.google.com/colaboratory/intl/en-GB/faq.html):
- Free notebooks run **at most 12 hours**, depending on availability and usage. Runtimes time out when idle.
- GPUs are **not guaranteed** and usage limits are not published and fluctuate.
- Not allowed on free runtimes: web-service/file/media hosting, connecting to remote proxies, using multiple accounts to work around limits, and bypassing the notebook UI to work mainly through a web UI.

What this project does about it:
- **Detached execution (`nohup`):** services run independently of the notebook cell.
- **Self-healing watchdog:** restarts dead Ollama / gateway processes inside the VM.
- **Honest health:** `/ps` reports `engine: ollama` only when the model is truly loaded.
- **Backoff:** when Google has no free GPU, the orchestrator waits 5 / 10 / 20 / 40 / 60 min instead of hammering.

What it does **not** do: guarantee uptime. In practice, expect sessions of a few hours and gaps when Google has no free T4.

> The ngrok/tunnel part exposes a web service from Colab, which the FAQ lists as disallowed on free runtimes. Use it knowingly, for your own light use.

---

## 4. Multi-account rotation (off by default, risky)

The orchestrator can hand over between several Google accounts (`ACCOUNT_COUNT=2` or `3`). The Colab FAQ disallows *"using multiple accounts to work around access or resource usage restrictions"*, and in real logs it did not raise uptime (Google answered "Service Unavailable" for every account). It is kept only as an advanced option. **Default is one account.**
