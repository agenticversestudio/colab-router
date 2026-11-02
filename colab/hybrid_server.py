#!/usr/bin/env python3
"""
Colab Router - Decoupled Colab Router Gateway (FastAPI + SSE Streaming)
=====================================================================
Stateless, OpenAI-compatible Inference Proxy running inside Google Colab.

Endpoints:
  - GET  /health               -> Gateway liveness probe
  - GET  /ps                   -> Real-time GPU VRAM telemetry (nvidia-smi) & Ollama runner state
  - GET  /v1/models            -> Model catalog
  - POST /v1/chat/completions  -> Streaming SSE and Non-Streaming completions
  - POST /auth/verify          -> Token/Passkey verification
"""

import os
import sys
import json
import time
import subprocess
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn

# UTF-8 Guard
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ----------------- Environment Configuration -----------------
GDQ_API_KEY = os.environ.get("GDQ_API_KEY", "sk-gdq-default-key")
GDQ_PASSKEY = os.environ.get("GDQ_PASSKEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
OLLAMA_MODEL_TAG = os.environ.get("OLLAMA_MODEL_TAG", "qwen3.8-27b-uncensored")

app = FastAPI(
    title="Colab Router Colab Router Gateway",
    version="3.0.0",
    docs_url="/docs",
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Authentication Helper -----------------
def is_authorized(req: Request) -> bool:
    # If no API key or passkey is configured, gateway is open
    if not GDQ_API_KEY and not GDQ_PASSKEY:
        return True

    auth_header = req.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    x_key = req.headers.get("x-api-key", "").strip()
    x_passkey = req.headers.get("x-passkey", "").strip()

    candidate = token or x_key or x_passkey
    if not candidate:
        # Check query param as fallback
        candidate = req.query_params.get("api_key", "")

    if GDQ_API_KEY and candidate == GDQ_API_KEY:
        return True
    if GDQ_PASSKEY and (candidate == GDQ_PASSKEY or x_passkey == GDQ_PASSKEY):
        return True

    return False

# ----------------- Service Status Probing -----------------
async def is_ollama_online() -> bool:
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get("http://127.0.0.1:11434/api/tags")
            return r.status_code == 200
    except Exception:
        return False

async def is_model_in_vram() -> bool:
    """Check whether the model is already loaded and running in GPU VRAM.
    Ollama's /api/ps shows models currently occupying GPU memory.
    Returns True if the model is warm and ready to serve instantly.
    """
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            r = await client.get("http://127.0.0.1:11434/api/ps")
            if r.status_code == 200:
                data = r.json()
                models = data.get("models", [])
                if models:
                    return True
    except Exception:
        pass
    return False

# ----------------- Endpoints -----------------
@app.get("/")
def index():
    return {
        "service": "Colab Router Colab Router Gateway",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "telemetry": "/ps",
            "models": "/v1/models",
            "chat": "/v1/chat/completions"
        }
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "Colab Router Gateway"}

@app.get("/warmup_status")
async def warmup_status():
    """Returns whether the model is ready to serve requests (warm in VRAM) or still loading."""
    ollama_ok = await is_ollama_online()
    model_warm = await is_model_in_vram() if ollama_ok else False
    return {
        "ollama_online": ollama_ok,
        "model_in_vram": model_warm,
        "ready": model_warm,
        "message": "Ready to serve!" if model_warm else (
            "Ollama is loading — model VRAM warmup in progress (~2-5 minutes after cold start)."
            if ollama_ok else "Ollama daemon is still starting up (~30-60 seconds)."
        )
    }

@app.post("/auth/verify")
async def verify_auth(req: Request):
    if is_authorized(req):
        return {"status": "ok", "authenticated": True}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key or Passkey")

@app.get("/ps")
async def process_status(req: Request):
    """Returns real-time GPU VRAM allocation from nvidia-smi and Ollama process runner state."""
    if not is_authorized(req):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    gpu_info = "GPU Telemetry Unavailable"
    try:
        res = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.used,memory.free,utilization.gpu", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=3
        )
        if res.returncode == 0:
            gpu_info = res.stdout.strip()
    except Exception as e:
        gpu_info = str(e)

    ollama_info = "Ollama Runner State Unavailable"
    try:
        res = subprocess.run(
            ["ollama", "ps"],
            capture_output=True, text=True, timeout=3
        )
        if res.returncode == 0:
            ollama_info = res.stdout.strip()
    except Exception as e:
        ollama_info = str(e)

    return {
        "status": "online",
        "gpu_telemetry": gpu_info,
        "ollama_ps": ollama_info,
        "timestamp": time.time()
    }

@app.get("/v1/models")
@app.get("/models")
async def list_models(req: Request):
    if not is_authorized(req):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    models_list = [
        {"id": OLLAMA_MODEL_TAG, "object": "model", "owned_by": "colab-router"},
        {"id": "default", "object": "model", "owned_by": "colab-router"}
    ]
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get("http://127.0.0.1:11434/api/tags")
            if r.status_code == 200:
                data = r.json()
                for m in data.get("models", []):
                    name = m.get("name", "")
                    if name and name not in [x["id"] for x in models_list]:
                        models_list.append({"id": name, "object": "model", "owned_by": "ollama"})
    except Exception:
        pass

    return {"object": "list", "data": models_list}

# ----------------- Fallback Groq Streamer (Optional) -----------------
async def stream_groq(model: str, messages: list, temperature: float = 0.6, max_tokens: int = None):
    if not GROQ_API_KEY:
        err = {"error": {"message": "Ollama is warming up and GROQ_API_KEY fallback is not configured.", "type": "model_warming_up"}}
        yield f"data: {json.dumps(err)}\n\n"
        yield "data: [DONE]\n\n"
        return

    payload = {
        "model": "qwen/qwen3.8-27b" if "qwen" in model.lower() else "openai/gpt-oss-120b",
        "messages": messages,
        "stream": True,
        "temperature": temperature,
        "max_tokens": max_tokens or 4096
    }
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", "https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload) as response:
                async for chunk in response.aiter_lines():
                    if chunk:
                        yield f"{chunk}\n\n"
    except Exception as e:
        err = {"error": {"message": f"Fallback error: {str(e)}", "type": "gateway_error"}}
        yield f"data: {json.dumps(err)}\n\n"
        yield "data: [DONE]\n\n"

# ----------------- Ollama SSE Streaming & Reasoning Sanitizer -----------------
async def stream_ollama(model: str, messages: list, temperature: float = 0.6, max_tokens: int = None):
    # Check if local Ollama is active; if warming up, optionally fallback to Groq
    ollama_ok = await is_ollama_online()
    if not ollama_ok:
        async for chunk in stream_groq(model, messages, temperature, max_tokens):
            yield chunk
        return

    # If Ollama is up but model isn't in VRAM yet, warn client then proceed
    # (request itself will still queue and wait; Ollama handles the load internally)
    model_warm = await is_model_in_vram()
    if not model_warm:
        # Emit a system notice as a comment so SSE doesn't break; real content follows
        warmup_notice = {
            "id": "warmup-notice",
            "object": "chat.completion.chunk",
            "choices": [{"delta": {"role": "assistant", "content": "⏳ [Model loading into GPU VRAM — first response may take 1-3 minutes. Subsequent responses are instant.]\n\n"}, "index": 0, "finish_reason": None}]
        }
        yield f"data: {json.dumps(warmup_notice)}\n\n"

    url = "http://127.0.0.1:11434/v1/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "temperature": temperature,
        "max_tokens": max_tokens or 4096
    }

    try:
        async with httpx.AsyncClient(timeout=1200.0) as client:
            async with client.stream("POST", url, json=payload) as response:
                async for chunk in response.aiter_lines():
                    if chunk:
                        # Forward SSE lines cleanly
                        if chunk.startswith("data: ") and chunk != "data: [DONE]":
                            try:
                                data = json.loads(chunk[6:])
                                choices = data.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    # Forward reasoning tokens as reasoning_content for UI compatibility
                                    if "reasoning" in delta and "reasoning_content" not in delta:
                                        delta["reasoning_content"] = delta["reasoning"]
                                        yield f"data: {json.dumps(data)}\n\n"
                                        continue
                            except Exception:
                                pass
                        yield f"{chunk}\n\n"
    except Exception as e:
        async for chunk in stream_groq(model, messages, temperature, max_tokens):
            yield chunk

# ----------------- Chat Completions Entrypoint -----------------
@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def completions(req: Request):
    if not is_authorized(req):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized: Access Key Required")

    try:
        body = await req.json()
    except Exception:
        body = {}

    req_model = body.get("model", OLLAMA_MODEL_TAG)
    ollama_model = OLLAMA_MODEL_TAG if req_model in ["default", "", "qwen"] else req_model
    messages = body.get("messages", [])
    stream = body.get("stream", True)
    temp = float(body.get("temperature", 0.6))
    max_tok = body.get("max_tokens")

    if stream:
        return StreamingResponse(
            stream_ollama(model=ollama_model, messages=messages, temperature=temp, max_tokens=max_tok),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    else:
        if not await is_ollama_online():
            return JSONResponse({"error": "Ollama is warming up, please retry in a few moments"}, status_code=503)

        url = "http://127.0.0.1:11434/v1/chat/completions"
        payload = {"model": ollama_model, "messages": messages, "stream": False, "temperature": temp, "max_tokens": max_tok or 4096}
        async with httpx.AsyncClient(timeout=1200.0) as client:
            r = await client.post(url, json=payload)
            return JSONResponse(r.json())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
