# 🧠 Supported Models & VRAM Sizing Guide

This guide lists verified GGUF models optimized for Google Colab runtimes.

---

## 1. Google Colab Free Tier (Tesla T4 — 15.3 GB VRAM)

To achieve **100% GPU offload (zero CPU bottleneck)**, the combined weight of model tensors + KV cache must remain under **14.8 GB**.

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen 3.8 27B Uncensored** *(Default)* | `IQ4_XS` | 14.26 GB | 4,096 | 14.55 GB | ~11.8 t/s |
| **Qwen 2.5 14B Instruct** | `Q4_K_M` | 8.99 GB | 16,384 | 11.20 GB | ~24.5 t/s |
| **DeepSeek R1 Distill Qwen 14B** | `Q4_K_M` | 9.04 GB | 8,192 | 10.80 GB | ~22.0 t/s |
| **Llama 3.1 8B Instruct** | `Q8_0` | 8.54 GB | 16,384 | 10.40 GB | ~34.0 t/s |
| **Mistral NeMo 12B Instruct** | `Q5_K_M` | 8.68 GB | 8,192 | 10.20 GB | ~26.0 t/s |
| **Gemma 2 9B Instruct** | `Q5_K_M` | 6.84 GB | 8,192 | 8.40 GB | ~31.0 t/s |

---

## 2. Google Colab Pro Tier (NVIDIA L4 — 24 GB VRAM)

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Qwen 2.5 32B Instruct** | `Q4_K_M` | 19.8 GB | 8,192 | 22.4 GB | ~16.5 t/s |
| **DeepSeek R1 Distill Qwen 32B** | `Q4_K_M` | 19.8 GB | 8,192 | 22.4 GB | ~16.0 t/s |
| **Qwen 3.8 27B Uncensored** | `Q5_K_M` | 18.2 GB | 8,192 | 21.0 GB | ~18.2 t/s |

---

## 3. Google Colab Pro+ Tier (NVIDIA A100 — 40 GB / 80 GB VRAM)

| Model | Quantization | Size | Recommended Context | VRAM Used | Tokens/sec |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Llama 3.3 70B Instruct** | `IQ3_M` | 33.4 GB | 8,192 | 37.5 GB | ~14.0 t/s |
| **Qwen 2.5 72B Instruct** | `IQ3_M` | 34.2 GB | 8,192 | 38.2 GB | ~13.5 t/s |
| **DeepSeek R1 Distill Llama 70B**| `IQ3_M` | 33.5 GB | 8,192 | 37.8 GB | ~13.8 t/s |

---

## How to Switch Models in GDQ Colab Kit

Simply modify the three model variables in your `.env` or in `colab/notebook.ipynb`:

```bash
HF_MODEL_URL=https://huggingface.co/bartowski/Qwen2.5-14B-Instruct-GGUF/resolve/main/Qwen2.5-14B-Instruct-Q4_K_M.gguf
MODEL_FILENAME=Qwen2.5-14B-Instruct-Q4_K_M.gguf
OLLAMA_MODEL_TAG=qwen2.5-14b
NUM_CTX=8192
```

The payload will download the new weights via 16-stream aria2c, configure the Modelfile, and pre-warm into VRAM automatically!
