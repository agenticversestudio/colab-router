# 🚀 Colab Router - Setup & User Guide

This guide walks you through deploying your sovereign AI server using either:
- **Mode A (Simple):** Manual 1-Click Google Colab Notebook (ideal for quick sessions or testing).
- **Mode B (Pro):** Automated 24/7 Multi-Account Orchestrator Daemon (zero human intervention).

---

## Prerequisites

1. **Google Account:** 1 account (for Mode A) or 2-3 accounts (for Mode B 24/7 uptime).
2. **Ngrok Account:** Free token from [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken).
3. **Python 3.10+** (if running the orchestrator locally or on a server).

---

## Mode A: Manual 1-Click Colab Notebook (5 Minutes)

1. Open [Google Colab](https://colab.research.google.com).
2. Click **File ➔ Upload notebook** and upload [`colab/notebook.ipynb`](../colab/notebook.ipynb).
3. Change runtime: Click **Runtime ➔ Change runtime type ➔ T4 GPU**.
4. In Cell 1, paste your `NGROK_AUTHTOKEN` and choose an `GDQ_API_KEY` (e.g. `sk-mysecret`).
5. Click **Runtime ➔ Run all** (`Ctrl + F9`).
6. Scroll down to the output of Cell 2 to find your live ingress URL (e.g. `https://xxxx.ngrok-free.dev`).

---

## Mode B: 24/7 Multi-Account Orchestrator Setup

### Step 1: Clone and Configure Environment

```bash
git clone https://github.com/your-username/colab-router.git
cd colab-router
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` in a text editor and fill in:
- `NGROK_AUTHTOKEN`
- `NGROK_DOMAIN` (optional reserved domain)
- `GDQ_API_KEY`

### Step 2: Authenticate Multi-Account Vault

Run the interactive auth assistant:

```bash
python orchestrator/auth_helper.py
```

Follow the prompt to authenticate each Google account:
1. Enter `shift1` (or your first account name) ➔ Colab login browser opens ➔ grant permission.
2. Enter `shift2` ➔ Colab login browser opens for your second account ➔ grant permission.
3. Enter `shift3` ➔ Colab login browser opens for your third account ➔ grant permission.
4. Type `q` to save tokens into `./vault/`.

### Step 3: Launch the Orchestrator

**On Windows:**
Double click `orchestrator/run_orchestrator.bat` or run:
```powershell
python orchestrator/orchestrator.py
```

**On Linux / macOS:**
```bash
chmod +x orchestrator/run_orchestrator.sh
./orchestrator/run_orchestrator.sh
```

**Via Docker:**
```bash
docker-compose -f orchestrator/docker-compose.yml up -d
```

---

## Verifying Your Endpoint

Use the included status checker to verify that your GPU is online and model weights are locked:

```bash
python scripts/check_status.py
```

Run an SSE streaming benchmark:

```bash
python scripts/test_stream.py
```

---

## Connecting to Clients

### 1. Cursor / Windsurf / Cline (VS Code)
- **Base URL:** `https://your-ngrok-domain.ngrok-free.dev/v1`
- **API Key:** Value of `GDQ_API_KEY`
- **Model Name:** `qwen3.8-27b-uncensored` (or your configured model)

### 2. Python (`openai` SDK)
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://your-ngrok-domain.ngrok-free.dev/v1",
    api_key="sk-gdq-master-secret-key"
)

response = client.chat.completions.create(
    model="qwen3.8-27b-uncensored",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)

for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)
```

### 3. cURL (Command Line)
```bash
curl -N -X POST "https://your-ngrok-domain.ngrok-free.dev/v1/chat/completions" \
  -H "Authorization: Bearer sk-gdq-master-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.8-27b-uncensored",
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "stream": true
  }'
```
