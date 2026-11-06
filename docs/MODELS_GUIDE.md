# 🧠 2026 Supported Models & VRAM Sizing Guide

This guide details verified SOTA model architectures optimized for Google Colab runtimes, along with the hardware realities of massive MoE models.

---

## 1. Big models do NOT run on Colab (read this first)

Colab free gives ~12.7 GB system RAM, ~80 GB disk and a T4 with ~15 GB VRAM. These frontier models need far more:

| Model | Parameters | Weights / memory needed (quantized) | Runs on Colab free? |
| :--- | :--- | :--- | :--- |
| **GLM-5.x** (Zhipu AI) | 744B total / 40B active | 1-bit ≈ 223 GB, 2-bit ≈ 245 GB RAM (Unsloth docs) | **No** |
| **DeepSeek V4 Flash** | 284B total / 13B active | ≈ 129-167 GB (quantized) | **No** |
| **DeepSeek V4 Pro** | 1.6T total / 49B active | ≈ 498-865 GB | **No** |
| **Qwen3.8-27B** (IQ4_XS) | 27B dense | ≈ 14.3 GB | **Yes, tight fit, short context** |

Sources: [Unsloth GLM-5.2](https://unsloth.ai/docs/models/glm-5.2), [ThunderCompute: DeepSeek V4](https://www.thundercompute.com/blog/deploy-deepseek-v4-locally). Numbers are from those pages and may change.

**To use GLM / DeepSeek for free:** use the [OpenCode](https://opencode.ai) app, which offers hosted free models (`glm-5.3-flash-free`, `deepseek-v4.1-flash-free`). OpenCode's docs say free models work inside OpenCode only (not from other clients), they are "limited time", and data policies differ per model. This gateway does not serve them.

---

## 2. Google Colab Free Tier (Tesla T4 — 15.3 GB VRAM)

To achieve **100% GPU offload (zero CPU bottleneck)**, the combined weight of model tensors + KV cache must remain under **14.8 GB**.

> Speed / VRAM numbers below were measured by the maintainers on their own T4 runs. Your results will vary.

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec | Primary Strengths |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen 3.8 27B Uncensored** *(Default)* | `IQ4_XS` | 14.26 GB | 4,096 | 14.55 GB | ~11.8 t/s | Zero moral refusals, raw system code generation, exploit research |
| **DeepSeek-R1-Distill-Qwen-14B** (a Qwen model, not DeepSeek V4) | `Q4_K_M` | 9.04 GB | 8,192 | 10.80 GB | ~22.0 t/s | Chain-of-Thought reasoning (`<think>`), math, algorithmic logic |
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

### Preset B: DeepSeek-R1-Distill-Qwen-14B (small reasoning model; NOT DeepSeek V4)
```bash
HF_MODEL_URL=https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf
MODEL_FILENAME=DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf
OLLAMA_MODEL_TAG=deepseek-r1-14b
NUM_CTX=8192
NUM_PREDICT=8192
```

### Preset C: GLM-4 9B (small older model; NOT GLM-5)
```bash
HF_MODEL_URL=https://huggingface.co/bartowski/glm-4-9b-chat-GGUF/resolve/main/glm-4-9b-chat-Q4_K_M.gguf
MODEL_FILENAME=glm-4-9b-chat-Q4_K_M.gguf
OLLAMA_MODEL_TAG=glm-4-9b-chat
NUM_CTX=16384
NUM_PREDICT=8192
```

The payload downloads weights via 16-stream aria2c, compiles the custom Modelfile, and pre-warms into VRAM automatically.
