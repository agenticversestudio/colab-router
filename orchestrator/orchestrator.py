#!/usr/bin/env python3
"""
GDQ Colab Kit - Multi-Account Autonomous 24/7 Cloud Orchestrator Daemon
======================================================================
Production-Grade Orchestrator for Local Machines, VPS, Koyeb, Render, or Docker.

Features:
  - Built-in HTTP Health & Keep-Alive Server (Listens on os.environ.get('PORT', 8080))
  - Multi-Account Token Vault Ingestion via Environment Variables or Mounted Vault Directory
  - Headless Colab VM Provisioning via `google-colab-cli`
  - Preemptive Shift Handover (Zero GPU Quota Lockouts)
  - 30-Second Ingress Probing & Self-Healing Auto-Failover
"""

import os
import sys
import time
import json
import shutil
import logging
import threading
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone
import requests

# UTF-8 Encoding Guard
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(BASE_DIR)
LOGS_DIR = os.path.join(REPO_ROOT, "logs")
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
COLAB_SCRIPTS_DIR = os.path.join(REPO_ROOT, "colab")
VAULT_DIR = os.environ.get("VAULT_DIR", os.path.join(REPO_ROOT, "vault"))
STATE_FILE = os.path.join(REPO_ROOT, "state.json")
COLAB_CONFIG_DIR = os.path.expanduser("~/.config/colab-cli")

os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(VAULT_DIR, exist_ok=True)
os.makedirs(COLAB_CONFIG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOGS_DIR, "orchestrator.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("GDQOrchestrator")

# ----------------- Settings & Accounts -----------------
_HEALTH_URL_DEFAULT = "https://your-domain.ngrok-free.dev/v1/models"
HEALTH_URL = os.environ.get("INGRESS_HEALTH_URL", _HEALTH_URL_DEFAULT)

# Startup validation — fail fast with a clear message instead of silently polling a placeholder
if "your-domain" in HEALTH_URL or HEALTH_URL == _HEALTH_URL_DEFAULT:
    print(
        "\n" + "=" * 70 + "\n"
        "  ❌  ORCHESTRATOR STARTUP BLOCKED — INGRESS_HEALTH_URL NOT SET\n"
        "  Set INGRESS_HEALTH_URL in your .env file to your Ngrok public URL.\n"
        "  Example:  INGRESS_HEALTH_URL=https://abc123.ngrok-free.app/v1/models\n"
        "=" * 70 + "\n"
    )
    sys.exit(1)
API_KEY = os.environ.get("GDQ_API_KEY", "sk-gdq-default-key")
PASSKEY = os.environ.get("GDQ_PASSKEY", "")
SHIFT_MAX_HOURS = float(os.environ.get("SHIFT_MAX_HOURS", 3.5))
HEALTH_CHECK_INTERVAL = int(os.environ.get("HEALTH_CHECK_INTERVAL", 30))
CONSECUTIVE_FAILURES_LIMIT = int(os.environ.get("CONSECUTIVE_FAILURES_LIMIT", 5))
PORT = int(os.environ.get("PORT", 8080))
SESSION_NAME = os.environ.get("COLAB_SESSION_NAME", "gdq_colab_engine")

# Load multi-account roster from vault directory or environment
def discover_accounts():
    accounts = []
    # 1. Check vault subdirectories (e.g. vault/account1/token.json)
    if os.path.exists(VAULT_DIR):
        for item in sorted(os.listdir(VAULT_DIR)):
            subpath = os.path.join(VAULT_DIR, item)
            token_path = os.path.join(subpath, "token.json")
            if os.path.isdir(subpath) and os.path.exists(token_path):
                accounts.append({
                    "id": item,
                    "name": f"Shift - {item}",
                    "vault_token": token_path
                })

    # 2. Fallback to default 3 shifts if empty
    if not accounts:
        accounts = [
            {"id": "shift1", "name": "Shift 1 - Account A", "vault_token": os.path.join(VAULT_DIR, "shift1", "token.json")},
            {"id": "shift2", "name": "Shift 2 - Account B", "vault_token": os.path.join(VAULT_DIR, "shift2", "token.json")},
            {"id": "shift3", "name": "Shift 3 - Account C", "vault_token": os.path.join(VAULT_DIR, "shift3", "token.json")},
        ]
    return accounts

ACCOUNTS = discover_accounts()

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "current_account_index": 0,
        "shift_started_at": 0,
        "consecutive_failures": 0,
        "total_rotations": 0,
        "status": "idle"
    }

def save_state(state):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving state: {e}")

# ----------------- Koyeb / Render Health HTTP Server -----------------
class CloudHealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        state = load_state()
        curr_idx = state.get("current_account_index", 0)
        account_name = ACCOUNTS[curr_idx]["name"] if curr_idx < len(ACCOUNTS) else "Unknown"
        started = state.get("shift_started_at", 0)
        elapsed_hrs = (time.time() - started) / 3600.0 if started > 0 else 0.0

        resp_data = {
            "status": "online",
            "service": "GDQ Colab Kit Sovereign Orchestrator",
            "engine": state.get("status", "running"),
            "current_shift": account_name,
            "shift_elapsed_hours": round(elapsed_hrs, 2),
            "total_rotations": state.get("total_rotations", 0),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(resp_data, indent=2).encode("utf-8"))

    def log_message(self, format, *args):
        return

def start_cloud_http_server():
    server = HTTPServer(("0.0.0.0", PORT), CloudHealthHandler)
    logger.info(f"⚡ Cloud Health & Keep-Alive HTTP Server listening on port {PORT}")
    server.serve_forever()

# ----------------- Orchestrator Core -----------------
class GDQOrchestrator:
    def __init__(self):
        self.state = load_state()

    def probe_health(self) -> bool:
        try:
            headers = {"Authorization": f"Bearer {API_KEY}", "ngrok-skip-browser-warning": "true"}
            r = requests.get(HEALTH_URL, headers=headers, timeout=8)
            if r.status_code != 200:
                return False

            ps_url = HEALTH_URL.replace("/v1/models", "/ps").replace("/models", "/ps")
            ps_headers = {"Authorization": f"Bearer {API_KEY}", "x-passkey": PASSKEY, "ngrok-skip-browser-warning": "true"}
            r_ps = requests.get(ps_url, headers=ps_headers, timeout=8)
            if r_ps.status_code == 200:
                ps_data = r_ps.json()
                gpu_telemetry = ps_data.get("gpu_telemetry", "")
                ollama_ps = ps_data.get("ollama_ps", "")
                if "100% GPU" in ollama_ps or "MiB" in gpu_telemetry:
                    return True
            return True
        except Exception as e:
            logger.debug(f"Health probe notice: {e}")
            return False

    def fast_in_container_heal(self) -> tuple[bool, bool]:
        """Attempts an in-container revival before recreating the heavy VM.
        Returns: (healed: bool, session_lost: bool)
        """
        logger.info("[⚡] Attempting fast in-container service revival...")
        try:
            # Upload the dedicated fast_heal.py from repo (includes env-aware model tag)
            heal_script = os.path.join(SCRIPTS_DIR, "fast_heal.py")
            if not os.path.exists(heal_script):
                logger.warning(f"fast_heal.py not found at {heal_script}. Skipping fast heal.")
                return False, False

            # Set OLLAMA_MODEL_TAG env in the remote exec by prepending it
            model_tag = os.environ.get("OLLAMA_MODEL_TAG", "qwen3.8-27b-uncensored")
            wrapper_code = (
                f"import os\n"
                f"os.environ['OLLAMA_MODEL_TAG'] = '{model_tag}'\n"
                f"exec(open('/content/fast_heal.py').read())\n"
            )
            wrapper_script = os.path.join(SCRIPTS_DIR, "_heal_wrapper.py")
            with open(wrapper_script, "w", encoding="utf-8") as f:
                f.write(wrapper_code)

            # Upload heal script into container
            subprocess.run(
                ["colab", "upload", "-s", SESSION_NAME, heal_script, "/content/fast_heal.py"],
                capture_output=True, text=True, timeout=30
            )

            # Execute wrapper — use 180s timeout (model VRAM lock takes up to 120s)
            res = subprocess.run(
                ["colab", "exec", "-s", SESSION_NAME, "-f", wrapper_script],
                capture_output=True, text=True, timeout=180
            )
            out = f"{res.stdout.strip()} {res.stderr.strip()}".strip()
            if "not found" in out.lower() or "lost" in out.lower() or res.returncode not in (0, 1):
                logger.warning("[!] Colab session lost. Rotating shift immediately.")
                return False, True
            # Allow 45s for services to stabilize after background heal
            time.sleep(45)
            return self.probe_health(), False
        except subprocess.TimeoutExpired:
            logger.warning("[!] Fast heal timed out after 180s — session may be overloaded.")
            return False, False
        except Exception as e:
            logger.warning(f"Fast heal failed: {e}")
            return False, False

    def deploy_token(self, account_index: int):
        account = ACCOUNTS[account_index]
        src_token = account["vault_token"]
        dest_token = os.path.join(COLAB_CONFIG_DIR, "token.json")

        if not os.path.exists(src_token):
            logger.warning(f"Vault token missing for {account['name']} at {src_token}. Please authenticate via auth_helper.py.")
            return False

        shutil.copyfile(src_token, dest_token)
        logger.info(f"[✓] Active Colab CLI token deployed for: {account['name']}")
        return True

    def terminate_current_session(self):
        logger.info("[*] Releasing active Colab cloud sessions on server...")
        try:
            subprocess.run(["colab", "stop", "-s", SESSION_NAME], capture_output=True, text=True, timeout=15)
        except Exception:
            pass

    def launch_shift(self, account_index: int):
        account = ACCOUNTS[account_index]
        logger.info("=" * 65)
        logger.info(f"🚀 PROVISIONING SHIFT: {account['name']}")
        logger.info("=" * 65)

        if not self.deploy_token(account_index):
            time.sleep(5)
            self.rotate_shift("Missing token in vault")
            return False

        self.terminate_current_session()

        logger.info("[*] Instantiating Tesla T4 GPU VM on Colab...")
        res = subprocess.run(["colab", "new", "-s", SESSION_NAME, "--gpu", "T4"], capture_output=True, text=True)
        combined_output = f"{res.stdout.strip()} {res.stderr.strip()}".strip()
        logger.info(f"Colab Provision Status: {combined_output}")

        if res.returncode != 0 or "refused" in combined_output.lower() or "limit" in combined_output.lower():
            logger.warning(f"⚠️ GPU VM provision failed for {account['name']}. Rotating to backup account...")
            time.sleep(5)
            self.rotate_shift(f"GPU Quota/Precondition on {account['name']}")
            return False

        # Upload scripts
        server_local = os.path.join(COLAB_SCRIPTS_DIR, "hybrid_server.py")
        payload_local = os.path.join(COLAB_SCRIPTS_DIR, "colab_payload.py")

        logger.info("[*] Uploading server files directly to Colab container...")
        subprocess.run(["colab", "upload", "-s", SESSION_NAME, server_local, "/content/hybrid_server.py"], capture_output=True, text=True)
        subprocess.run(["colab", "upload", "-s", SESSION_NAME, payload_local, "/content/colab_payload.py"], capture_output=True, text=True)

        # Trigger detached payload execution
        launcher_file = os.path.join(SCRIPTS_DIR, "launch_payload.py")
        with open(launcher_file, "w", encoding="utf-8") as f:
            f.write("import os\nos.system('nohup python3 /content/colab_payload.py > /content/payload.log 2>&1 &')\n")

        logger.info("[*] Triggering detached setup payload on remote GPU...")
        subprocess.run(["colab", "exec", "-s", SESSION_NAME, "-f", launcher_file], capture_output=True, text=True, timeout=120)

        self.state["current_account_index"] = account_index
        self.state["shift_started_at"] = time.time()
        self.state["consecutive_failures"] = 0
        self.state["status"] = "booting"
        save_state(self.state)

        # Warmup loop
        logger.info("[*] Awaiting model lock into VRAM & Ingress tunnel activation...")
        warmup_start = time.time()
        while time.time() - warmup_start < 600:
            time.sleep(15)
            if self.probe_health():
                logger.info("=" * 65)
                logger.info(f"🚀 [✓] SHIFT IS ONLINE & RESPONDING TO CLIENTS!")
                logger.info("=" * 65)
                self.state["status"] = "running"
                save_state(self.state)
                return True

        logger.warning("[!] Warmup period elapsed; continuing health supervision.")
        return False

    def rotate_shift(self, reason: str):
        next_index = (self.state.get("current_account_index", 0) + 1) % len(ACCOUNTS)
        logger.info("=" * 65)
        logger.info(f"🔄 ROTATION TRIGGERED: {reason}")
        logger.info(f"Current Slot: {self.state.get('current_account_index', 0)} ➔ Next Slot: {next_index}")
        logger.info("=" * 65)

        self.state["current_account_index"] = next_index
        self.state["total_rotations"] += 1
        save_state(self.state)
        self.launch_shift(next_index)

    def run(self):
        logger.info("🌌 GDQ Colab Autonomous Orchestrator Started")

        if self.probe_health():
            logger.info("[✓] Gateway is already active and healthy!")
            if self.state["shift_started_at"] == 0:
                self.state["shift_started_at"] = time.time()
            self.state["status"] = "running"
            save_state(self.state)
        else:
            logger.info("[!] Gateway offline. Starting initial boot sequence...")
            self.launch_shift(self.state.get("current_account_index", 0))

        while True:
            try:
                time.sleep(HEALTH_CHECK_INTERVAL)
                now = time.time()

                # Preemptive Shift Handover
                elapsed_hrs = (now - self.state.get("shift_started_at", now)) / 3600.0
                if elapsed_hrs >= SHIFT_MAX_HOURS:
                    logger.info(f"⏰ Shift limit reached ({elapsed_hrs:.2f} hrs). Initiating scheduled rotation.")
                    self.rotate_shift("Scheduled Handover")
                    continue

                # Health Probing
                if self.probe_health():
                    self.state["consecutive_failures"] = 0
                    self.state["status"] = "running"
                else:
                    self.state["consecutive_failures"] += 1
                    failures = self.state["consecutive_failures"]
                    logger.warning(f"⚠️ Health failure {failures}/{CONSECUTIVE_FAILURES_LIMIT}")

                    healed, session_lost = self.fast_in_container_heal()
                    if healed:
                        logger.info("[✓] In-container fast heal succeeded! Engine back online.")
                        self.state["consecutive_failures"] = 0
                        self.state["status"] = "running"
                        save_state(self.state)
                        continue

                    if session_lost or failures >= CONSECUTIVE_FAILURES_LIMIT:
                        logger.error("❌ Session lost or gateway unresponsive. Initiating full failover rotation!")
                        self.rotate_shift("Crash Recovery Failover")
                        continue

                save_state(self.state)

            except KeyboardInterrupt:
                logger.info("Stopping Orchestrator on user command...")
                self.terminate_current_session()
                break
            except Exception as e:
                logger.error(f"Orchestrator loop exception: {e}")
                time.sleep(10)

if __name__ == "__main__":
    http_thread = threading.Thread(target=start_cloud_http_server, daemon=True)
    http_thread.start()

    orchestrator = GDQOrchestrator()
    orchestrator.run()
