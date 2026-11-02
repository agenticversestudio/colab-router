# 🧠 Supported Models & VRAM Sizing Guide

This guide lists verified GGUF models optimized for Google Colab runtimes, with zero CPU offload bottleneck.

---

## 1. Google Colab Free Tier (Tesla T4 — 15.3 GB VRAM)

To achieve **100% GPU offload (zero CPU bottleneck)**, the combined weight of model tensors + KV cache must remain under **14.8 GB**.

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec | Primary Strengths |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen 3.8 27B Uncensored** *(Default)* | `IQ4_XS` | 14.26 GB | 4,096 | 14.55 GB | ~11.8 t/s | Zero refusals, massive knowledge, full compliance |
| **DeepSeek R1 Distill Qwen 14B** | `Q4_K_M` | 9.04 GB | 8,192 | 10.80 GB | ~22.0 t/s | Chain-of-Thought reasoning (`<think>`), math, logic |
| **GLM-4 9B Chat** | `Q4_K_M` | 5.82 GB | 16,384 | 8.20 GB | ~28.5 t/s | Ultra-fast, 32K context, code refactoring, bilingual |
| **Qwen 2.5 14B Instruct** | `Q4_K_M` | 8.99 GB | 16,384 | 11.20 GB | ~24.5 t/s | General coding, structured output, agents |
| **Mistral NeMo 12B Instruct** | `Q5_K_M` | 8.68 GB | 8,192 | 10.20 GB | ~26.0 t/s | Multi-language, strong reasoning |
| **Llama 3.1 8B Instruct** | `Q8_0` | 8.54 GB | 16,384 | 10.40 GB | ~34.0 t/s | General tasks, function calling |

---

## 2. Google Colab Pro Tier (NVIDIA L4 — 24 GB VRAM)

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen 2.5 32B Instruct** | `Q4_K_M` | 19.8 GB | 8,192 | 22.4 GB | ~16.5 t/s |
| **DeepSeek R1 Distill Qwen 32B** | `Q4_K_M` | 19.8 GB | 8,192 | 22.4 GB | ~16.0 t/s |
| **Qwen 3.8 27B Uncensored** | `Q5_K_M` | 18.2 GB | 8,192 | 21.0 GB | ~18.2 t/s |
| **GLM-4 9B Chat (32k CTX)** | `Q8_0` | 9.8 GB | 32,768 | 18.5 GB | ~26.0 t/s |

---

## 3. Google Colab Pro+ Tier (NVIDIA A100 — 40 GB / 80 GB VRAM)

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Llama 3.3 70B Instruct** | `IQ3_M` | 33.4 GB | 8,192 | 37.5 GB | ~14.0 t/s |
| **Qwen 2.5 72B Instruct** | `IQ3_M` | 34.2 GB | 8,192 | 38.2 GB | ~13.5 t/s |
| **DeepSeek R1 Distill Llama 70B**| `IQ3_M` | 33.5 GB | 8,192 | 37.8 GB | ~13.8 t/s |
| **DeepSeek R1 671B MoE** *(API Router)* | Cloud | N/A | 64,000 | N/A | Stream |

---

## 4. How to Switch Models in Colab Router

Simply set the environment variables in your `.env` or in `colab/notebook.ipynb`. Here are the 3 verified presets:

### Preset A: Qwen 3.8 27B Uncensored (Maximum Raw Brain, Zero Refusals)
```bash
HF_MODEL_URL=https://huggingface.co/JonathanColetti/Qwen3.8-27B-Uncensored-GGUF/resolve/main/Qwen3.8-27B-Uncensored-IQ4_XS.gguf
MODEL_FILENAME=Qwen3.8-27B-Uncensored-IQ4_XS.gguf
OLLAMA_MODEL_TAG=qwen3.8-27b-uncensored
NUM_CTX=4096
NUM_PREDICT=4096
```

### Preset B: DeepSeek-R1 Distill Qwen 14B (Reasoning, Math & Complex Logic)
```bash
HF_MODEL_URL=https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf
MODEL_FILENAME=DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf
OLLAMA_MODEL_TAG=deepseek-r1-14b
NUM_CTX=8192
NUM_PREDICT=8192
```

### Preset C: GLM-4 9B Chat (Ultra Fast, 32K Context, Deep Code Refactoring)
```bash
HF_MODEL_URL=https://huggingface.co/bartowski/glm-4-9b-chat-GGUF/resolve/main/glm-4-9b-chat-Q4_K_M.gguf
MODEL_FILENAME=glm-4-9b-chat-Q4_K_M.gguf
OLLAMA_MODEL_TAG=glm-4-9b-chat
NUM_CTX=16384
NUM_PREDICT=8192
```

The payload will download the new weights via 16-stream aria2c, configure the Modelfile, and pre-warm into VRAM automatically!
