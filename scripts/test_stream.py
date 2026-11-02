#!/usr/bin/env python3
"""
Colab Router - SSE Streaming Inference Benchmark
==================================================
Tests streaming chat completions against your Colab Gateway,
measuring Time-to-First-Token (TTFT) and token generation speed (t/s).
"""

import os
import sys
import time
import json
import urllib.request

BASE_URL = os.environ.get("INGRESS_HEALTH_URL", "").replace("/v1/models", "").replace("/models", "").strip()
if not BASE_URL:
    BASE_URL = input("Enter your Colab Gateway URL (e.g. https://xxx.ngrok-free.dev or http://localhost:8000): ").strip()

BASE_URL = BASE_URL.rstrip("/")
API_KEY = os.environ.get("GDQ_API_KEY", "sk-gdq-default-key")
MODEL = os.environ.get("OLLAMA_MODEL_TAG", "qwen3.8-27b-uncensored")

def main():
    prompt = "Explain quantum computing in 2 short bullet points."
    print("=" * 65)
    print(f"🚀 Benchmarking Colab Router Gateway: {BASE_URL}")
    print(f"🧠 Model: {MODEL}")
    print(f"💬 Prompt: '{prompt}'")
    print("=" * 65)

    url = f"{BASE_URL}/v1/chat/completions"
    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
        "max_tokens": 150
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
    })

    t0 = time.time()
    print("Connecting SSE stream...")

    first_token_time = None
    token_count = 0

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            connect_time = time.time() - t0
            print(f"[✓] HTTP Handshake connected in {connect_time:.2f}s! Streaming response:\n")

            for line in resp:
                line = line.decode("utf-8").strip()
                if line.startswith("data: ") and line != "data: [DONE]":
                    if first_token_time is None:
                        first_token_time = time.time() - t0

                    try:
                        chunk = json.loads(line[6:])
                        delta = chunk["choices"][0]["delta"]
                        text = delta.get("content") or delta.get("reasoning_content") or ""
                        if text:
                            print(text, end="", flush=True)
                            token_count += 1
                    except Exception:
                        pass

        total_time = time.time() - t0
        gen_time = total_time - (first_token_time or total_time)
        speed = token_count / max(gen_time, 0.01)

        print("\n" + "=" * 65)
        print(f"⚡ First Token Latency (TTFT): {first_token_time:.2f}s")
        print(f"📈 Total Generated Tokens:    {token_count}")
        print(f"⏱️ Total Generation Time:     {gen_time:.2f}s")
        print(f"🚀 Throughput:                 {speed:.1f} tokens/second")
        print("=" * 65)

    except Exception as e:
        print(f"\n❌ [ERROR] Streaming failed: {e}")

if __name__ == "__main__":
    main()
