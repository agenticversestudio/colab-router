#!/usr/bin/env python3
"""
GDQ Colab Kit - Quick Telemetry & Health Checker
================================================
Checks if your Colab gateway is online, queries real-time GPU VRAM telemetry,
and prints model allocation metrics.
"""

import os
import sys
import json
import urllib.request

# Load endpoint from env or prompt
BASE_URL = os.environ.get("INGRESS_HEALTH_URL", "").replace("/v1/models", "").replace("/models", "").strip()
if not BASE_URL:
    BASE_URL = input("Enter your Colab Gateway URL (e.g. https://xxx.ngrok-free.dev or http://localhost:8000): ").strip()

BASE_URL = BASE_URL.rstrip("/")
API_KEY = os.environ.get("GDQ_API_KEY", "sk-gdq-default-key")
PASSKEY = os.environ.get("GDQ_PASSKEY", "")

def main():
    print("=" * 65)
    print(f"🔍 Probing GDQ Colab Gateway: {BASE_URL}")
    print("=" * 65)

    # 1. Health Probe
    try:
        req = urllib.request.Request(f"{BASE_URL}/health", headers={"ngrok-skip-browser-warning": "true"})
        with urllib.request.urlopen(req, timeout=5) as res:
            health_data = json.loads(res.read().decode())
            print(f"[✓] Gateway Liveness: {health_data.get('status')}")
    except Exception as e:
        print(f"[✗] Gateway Offline or Unreachable: {e}")
        sys.exit(1)

    # 2. Hardware Telemetry Probe (/ps)
    try:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "x-passkey": PASSKEY,
            "ngrok-skip-browser-warning": "true"
        }
        req = urllib.request.Request(f"{BASE_URL}/ps", headers=headers)
        with urllib.request.urlopen(req, timeout=8) as res:
            ps_data = json.loads(res.read().decode())
            print(f"\n📊 Hardware GPU Telemetry:")
            print(f"  {ps_data.get('gpu_telemetry', 'N/A')}")
            print(f"\n🧠 Ollama Active Runner:")
            print(f"  {ps_data.get('ollama_ps', 'N/A')}")
    except Exception as e:
        print(f"[!] Telemetry probe note: {e}")

    # 3. Available Models Probe
    try:
        headers = {"Authorization": f"Bearer {API_KEY}", "ngrok-skip-browser-warning": "true"}
        req = urllib.request.Request(f"{BASE_URL}/v1/models", headers=headers)
        with urllib.request.urlopen(req, timeout=5) as res:
            models_data = json.loads(res.read().decode())
            models = [m.get("id") for m in models_data.get("data", [])]
            print(f"\n📦 Loaded Models: {', '.join(models)}")
    except Exception as e:
        print(f"[!] Models probe note: {e}")

    print("\n✅ System is operational!")

if __name__ == "__main__":
    main()
