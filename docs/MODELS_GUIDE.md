# 🧠 2026 Supported Models & VRAM Sizing Guide

This guide details verified SOTA model architectures optimized for Google Colab runtimes, along with the hardware realities of massive MoE models.

---

## 1. The Enterprise Hardware Reality: Running 500B–750B MoE Models

Running frontier Mixture-of-Experts (MoE) models locally requires enterprise-grade multi-node GPU clusters:

| Model Architecture | Total / Active Parameters | Minimum Enterprise Hardware Needed | Estimated Cluster Cost | Colab Router Execution Path |
| :--- | :--- | :--- | :--- | :--- |
| **GLM-5** *(Zhipu AI)* | ~744B to 753B Total / ~44B Active | 8x NVIDIA H100 (80GB) or H200 (141GB), 1TB RAM | **$350,000 – $450,000** | Hybrid Gateway API / vLLM / KTransformers offload |
| **DeepSeek-V4.1-Flash** | 552B Total / 8B–16B Active (CED + CSA2) | 4x to 8x H200 or 128GB+ unified memory nodes | **$250,000 – $350,000** | Hybrid Gateway API / Causal Encoder-Decoder Stream |
| **DeepSeek-V4-Pro** | 1.6 Trillion Total / 49B Active | 16x NVIDIA Blackwell GB200 / H200 Clusters | **$800,000+** | Cloud Ingress Proxy |
| **Qwen3.8-27B Uncensored** | 27B Dense Native Vision-Language | 1x NVIDIA Tesla T4 (15.3 GB VRAM) | **$0 (Free Google Colab)** | 100% In-VRAM GPU Offload via Ollama Daemon |

---

## 2. Google Colab Free Tier (Tesla T4 — 15.3 GB VRAM)

To achieve **100% GPU offload (zero CPU bottleneck)**, the combined weight of model tensors + KV cache must remain under **14.8 GB**.

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec | Primary Strengths |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen 3.8 27B Uncensored** *(Default)* | `IQ4_XS` | 14.26 GB | 4,096 | 14.55 GB | ~11.8 t/s | Zero moral refusals, raw system code generation, exploit research |
| **DeepSeek-V4.1 / R1 Distill 14B** | `Q4_K_M` | 9.04 GB | 8,192 | 10.80 GB | ~22.0 t/s | Chain-of-Thought reasoning (`<think>`), math, algorithmic logic |
| **GLM-4 9B Chat** | `Q4_K_M` | 5.82 GB | 16,384 | 8.20 GB | ~28.5 t/s | Ultra-fast, 32K context, code refactoring, bilingual |
| **Qwen 2.5 14B Instruct** | `Q4_K_M` | 8.99 GB | 16,384 | 11.20 GB | ~24.5 t/s | General coding, structured output, agents |

---

## 3. How to Switch Models in Colab Router

Simply configure the three environment variables in `.env` or in `colab/notebook.ipynb`:

### Preset A: Qwen 3.8 27B Uncensored (Maximum Raw Brain, Zero Refusals)
```bash
HF_MODEL_URL=https://huggingface.co/JonathanColetti/Qwen3.8-27B-Uncensored-GGUF/resolve/main/Qwen3.8-27B-Uncensored-IQ4_XS.gguf
MODEL_FILENAME=Qwen3.8-27B-Uncensored-IQ4_XS.gguf
OLLAMA_MODEL_TAG=qwen3.8-27b-uncensored
NUM_CTX=4096
NUM_PREDICT=4096
```

### Preset B: DeepSeek-V4.1 / R1 Distill 14B (Reasoning, Math & Complex Logic)
```bash
HF_MODEL_URL=https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf
MODEL_FILENAME=DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf
OLLAMA_MODEL_TAG=deepseek-r1-14b
NUM_CTX=8192
NUM_PREDICT=8192
```

### Preset C: GLM-4 / GLM Titan (Ultra Fast, 32K Context, Deep Code Refactoring)
```bash
HF_MODEL_URL=https://huggingface.co/bartowski/glm-4-9b-chat-GGUF/resolve/main/glm-4-9b-chat-Q4_K_M.gguf
MODEL_FILENAME=glm-4-9b-chat-Q4_K_M.gguf
OLLAMA_MODEL_TAG=glm-4-9b-chat
NUM_CTX=16384
NUM_PREDICT=8192
```

The payload downloads weights via 16-stream aria2c, compiles the custom Modelfile, and pre-warms into VRAM automatically.
