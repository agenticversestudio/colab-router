#!/usr/bin/env python3
"""
Colab Router - In-Container Fast Healing Script
================================================
Executed inside the Google Colab VM to cleanly kill hung processes,
restart the Ollama daemon, and re-lock the model in GPU VRAM.
"""

import os
import sys
import time
import requests

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

def heal():
    log("[*] Terminating stale Ollama and llama-server processes...")
    os.system("pkill -9 -f llama-server || true")
    os.system("pkill -9 -f ollama || true")
    time.sleep(2)

    log("[*] Restarting clean Ollama daemon with Flash Attention...")
    os.environ["OLLAMA_FLASH_ATTENTION"] = "1"
    os.environ["OLLAMA_KEEP_ALIVE"] = "-1"
    os.system("nohup /usr/local/bin/ollama serve > /content/ollama_stdout.log 2>&1 &")
    time.sleep(4)

    log("[*] Re-triggering detached model lock in GPU VRAM...")
    model_tag = os.environ.get("OLLAMA_MODEL_TAG", "qwen3.8-27b-uncensored")
    os.system(f"nohup python3 -c \"import requests; requests.post('http://127.0.0.1:11434/api/generate', json={{'model': '{model_tag}', 'keep_alive': -1}}, timeout=300)\" > /content/vram_lock.log 2>&1 &")
    time.sleep(5)

    log("[✓] Fast heal completed. Model loading into VRAM in background.")

if __name__ == "__main__":
    heal()
