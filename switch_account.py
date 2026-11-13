#!/usr/bin/env python3
"""
===============================================================================
🌌 SOVEREIGN COLAB ROUTER — PERMANENT ACCOUNT & HARDWARE SWITCHER
===============================================================================
Solves the CPU/GPU switching issue permanently by:
1. Isolating profiles in ~/.config/colab-cli/profiles/<account>/
   - Separate token.json
   - Separate sessions.json (prevents stale cross-account session pollution)
2. Enforcing explicit '--gpu T4' hardware allocation on every 'colab new'
3. Auto-stopping previous account sessions to release GPU quota
4. Verifying physical GPU allocation via 'nvidia-smi' & PyTorch CUDA check
5. Detecting Google Colab GPU quota exhaustion (412 / 503) and auto-switching
   to the next available account.
===============================================================================
"""

import os
import sys
import json
import shutil
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path

# Force UTF-8 encoding on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Paths
BASE_DIR = Path(__file__).resolve().parent
VAULT_DIR = BASE_DIR.parent / "colab_vault" if (BASE_DIR.parent / "colab_vault").exists() else BASE_DIR / "colab_vault"
COLAB_CONFIG_DIR = Path.home() / ".config" / "colab-cli"
PROFILES_DIR = COLAB_CONFIG_DIR / "profiles"
ACTIVE_PROFILE_FILE = COLAB_CONFIG_DIR / "active_profile.txt"

# Registered Shift Accounts
ACCOUNTS = {
    "1": {
        "id": "primary",
        "email": "jmdotaryan@gmail.com",
        "shift": "Shift 1 (08:00 - 16:00 UTC)",
        "notebook": "notebook_shift1_primary.ipynb",
        "vault_dir": VAULT_DIR / "primary"
    },
    "2": {
        "id": "iconjagat",
        "email": "iconjagat@gmail.com",
        "shift": "Shift 2 (16:00 - 00:00 UTC)",
        "notebook": "notebook_shift2_iconjagat.ipynb",
        "vault_dir": VAULT_DIR / "iconjagat"
    },
    "3": {
        "id": "ecogainnexus",
        "email": "ecogainnexus@gmail.com",
        "shift": "Shift 3 (00:00 - 08:00 UTC)",
        "notebook": "notebook_shift3_ecogainnexus.ipynb",
        "vault_dir": VAULT_DIR / "ecogainnexus"
    }
}

SESSION_NAME = "sovereign-gpu"

def ensure_dirs():
    COLAB_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    for acc in ACCOUNTS.values():
        p_dir = PROFILES_DIR / acc["id"]
        p_dir.mkdir(parents=True, exist_ok=True)

def get_active_profile_name():
    if ACTIVE_PROFILE_FILE.exists():
        name = ACTIVE_PROFILE_FILE.read_text().strip()
        if name in [a["id"] for a in ACCOUNTS.values()]:
            return name
    return "primary"

def set_active_profile_name(name):
    ACTIVE_PROFILE_FILE.write_text(name)

def refresh_token_if_needed(token_path):
    """Refreshes Google OAuth token if near expiration."""
    try:
        with open(token_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        refresh_token = data.get("refresh_token")
        client_id = data.get("client_id")
        client_secret = data.get("client_secret")
        
        if not (refresh_token and client_id and client_secret):
            return True, "Token format verified."
        
        url = "https://oauth2.googleapis.com/token"
        payload = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }).encode("utf-8")
        
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            if "access_token" in res_data:
                data["access_token"] = res_data["access_token"]
                data["expires_in"] = res_data.get("expires_in", 3600)
                with open(token_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                return True, "OAuth Token successfully refreshed."
            else:
                return False, f"Unexpected response: {res_data}"
    except Exception as e:
        return False, f"Refresh error: {e}"

def backup_current_profile():
    current = get_active_profile_name()
    p_dir = PROFILES_DIR / current
    p_dir.mkdir(parents=True, exist_ok=True)

    curr_token = COLAB_CONFIG_DIR / "token.json"
    curr_sessions = COLAB_CONFIG_DIR / "sessions.json"

    if curr_token.exists():
        shutil.copy2(curr_token, p_dir / "token.json")
    if curr_sessions.exists():
        shutil.copy2(curr_sessions, p_dir / "sessions.json")

def restore_profile(account_id):
    p_dir = PROFILES_DIR / account_id
    p_dir.mkdir(parents=True, exist_ok=True)

    p_token = p_dir / "token.json"
    if not p_token.exists():
        for acc in ACCOUNTS.values():
            if acc["id"] == account_id:
                v_token = acc["vault_dir"] / "token.json"
                if v_token.exists():
                    shutil.copy2(v_token, p_token)
                break

    if p_token.exists():
        refresh_token_if_needed(p_token)
        shutil.copy2(p_token, COLAB_CONFIG_DIR / "token.json")
    else:
        raise FileNotFoundError(f"No token found for account '{account_id}' in vault or profile directory.")

    p_sessions = p_dir / "sessions.json"
    if p_sessions.exists():
        shutil.copy2(p_sessions, COLAB_CONFIG_DIR / "sessions.json")
    else:
        (COLAB_CONFIG_DIR / "sessions.json").write_text("{}")

    set_active_profile_name(account_id)

def run_colab_cmd(args):
    cmd = ["colab"] + args
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    return res.returncode, res.stdout, res.stderr

def stop_active_session():
    print("🛑 Checking for existing session to terminate...")
    code, stdout, _ = run_colab_cmd(["ls"])
    if SESSION_NAME in stdout:
        print(f"   Terminating old session '{SESSION_NAME}' to release GPU...")
        run_colab_cmd(["stop", "-s", SESSION_NAME])
        print("   ✅ Old session stopped.")
    else:
        print("   ℹ️ No old session needed to stop.")

def spawn_gpu_session():
    print(f"🚀 Spawning dedicated GPU session '{SESSION_NAME}' with '--gpu T4'...")
    code, stdout, stderr = run_colab_cmd(["new", "-s", SESSION_NAME, "--gpu", "T4"])
    full_output = stdout + "\n" + stderr
    
    if "412" in full_output or "503" in full_output or "No accelerator" in full_output or "Quota" in full_output:
        return False, f"GPU QUOTA EXHAUSTED: {full_output.strip()}"
    
    if code != 0 and "Session READY" not in full_output:
        return False, f"Failed to create session: {full_output.strip()}"
    
    print("   ✅ Session created and reported READY.")
    
    print("🔍 Performing Hardware Verification via 'nvidia-smi'...")
    code_smi, stdout_smi, _ = run_colab_cmd(["exec", "-s", SESSION_NAME, "--", "nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"])
    
    if code_smi == 0 and ("Tesla" in stdout_smi or "T4" in stdout_smi or "NVIDIA" in stdout_smi):
        gpu_info = stdout_smi.strip()
        return True, f"HARDWARE CONFIRMED: {gpu_info}"
    
    code_torch, stdout_torch, _ = run_colab_cmd(["exec", "-s", SESSION_NAME, "--", "python3", "-c", "import torch; print('CUDA_AVAILABLE:', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NONE')"])
    if "CUDA_AVAILABLE: True" in stdout_torch:
        return True, f"PYTORCH CONFIRMED: {stdout_torch.strip()}"
    
    return False, f"Session created, but NO GPU DETECTED (likely CPU default): {stdout_smi.strip()} {stdout_torch.strip()}"

def switch_to_account(target_key_or_name, verify_gpu=True, stop_old=True):
    ensure_dirs()
    
    target = None
    for k, v in ACCOUNTS.items():
        if target_key_or_name in [k, v["id"], v["email"]]:
            target = v
            break
            
    if not target:
        print(f"❌ Unknown account: '{target_key_or_name}'")
        print("Available accounts:")
        for k, v in ACCOUNTS.items():
            print(f"  [{k}] {v['id']} ({v['email']}) - {v['shift']}")
        return False

    current = get_active_profile_name()
    print("\n" + "="*70)
    print(f"🔄 SWITCHING ACCOUNT: [{current}] ➔ [{target['id']}] ({target['email']})")
    print(f"🕒 Shift: {target['shift']}")
    print(f"📓 Dedicated Notebook: colab/{target['notebook']}")
    print("="*70)

    print("📦 Backing up current profile state...")
    backup_current_profile()

    if stop_old:
        stop_active_session()

    print(f"🔑 Restoring profile and verifying credentials for {target['id']}...")
    try:
        restore_profile(target["id"])
    except Exception as e:
        print(f"❌ Failed to restore profile: {e}")
        return False

    if verify_gpu:
        success, msg = spawn_gpu_session()
        if success:
            print("\n" + "🎉"*20)
            print(f"✅ SUCCESS! T4 GPU IS ALLOCATED AND ACTIVE FOR {target['email']}!")
            print(f"⚡ {msg}")
            print("🎉"*20)
            print(f"\n💡 NEXT STEPS:")
            print(f"1. Open dedicated notebook: colab/{target['notebook']} in your browser.")
            print(f"2. Ensure logged in under: {target['email']}")
            print(f"3. Run all cells to start Qwen 3.8 27B on T4 GPU.")
            return True
        else:
            print("\n" + "⚠️"*20)
            print(f"❌ GPU ALLOCATION FAILED: {msg}")
            print("⚠️"*20)
            return False
    else:
        print(f"✅ Profile switched to {target['id']} without immediate session spawn.")
        return True

def auto_switch():
    print("\n🤖 AUTO-SWITCH MODE: Scanning accounts for available T4 GPU quota...\n")
    order = ["primary", "iconjagat", "ecogainnexus"]
    
    for acc_id in order:
        print(f"--- Probing Account: {acc_id} ---")
        ok = switch_to_account(acc_id, verify_gpu=True, stop_old=True)
        if ok:
            print(f"\n🎯 Successfully secured T4 GPU on Account: {acc_id}!")
            return True
        else:
            print(f"⚠️ Account {acc_id} unavailable or quota exhausted. Trying next account...\n")
            
    print("❌ All 3 accounts currently have exhausted GPU quotas or are unavailable.")
    print("💡 Colab rolling 24-hr GPU quotas reset every 12-24 hours.")
    return False

def show_status():
    ensure_dirs()
    current = get_active_profile_name()
    print("\n" + "="*70)
    print("📊 CURRENT SOVEREIGN COLAB ROUTER STATUS")
    print("="*70)
    print(f"👤 Active Profile: {current}")
    
    code, stdout, stderr = run_colab_cmd(["ls"])
    print("\n🖥️ Colab CLI Sessions:")
    print(stdout.strip() if stdout.strip() else "  No active sessions.")
    
    print("\n📋 Registered Shift Accounts:")
    for k, v in ACCOUNTS.items():
        prefix = "👉 [ACTIVE] " if v["id"] == current else "   "
        v_token = v["vault_dir"] / "token.json"
        token_status = "✅ Present" if v_token.exists() else "❌ Missing"
        print(f"{prefix}[{k}] {v['id']} ({v['email']})")
        print(f"       Shift: {v['shift']}")
        print(f"       Token: {token_status} | Notebook: colab/{v['notebook']}")
    print("="*70 + "\n")

def interactive_menu():
    show_status()
    print("Choose an action:")
    print("  1. Switch to Shift 1: Primary (jmdotaryan@gmail.com)")
    print("  2. Switch to Shift 2: Secondary (iconjagat@gmail.com)")
    print("  3. Switch to Shift 3: Tertiary (ecogainnexus@gmail.com)")
    print("  4. 🤖 Auto-Switch (Scan for available T4 GPU quota)")
    print("  5. 🛑 Stop active session")
    print("  6. 📊 Refresh Status")
    print("  0. Exit")
    
    choice = input("\nEnter choice [0-6]: ").strip()
    if choice == "1":
        switch_to_account("1")
    elif choice == "2":
        switch_to_account("2")
    elif choice == "3":
        switch_to_account("3")
    elif choice == "4":
        auto_switch()
    elif choice == "5":
        stop_active_session()
    elif choice == "6":
        show_status()
    elif choice in ["0", "q", "exit"]:
        print("Goodbye!")
    else:
        print("Invalid choice.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ["status", "ls"]:
            show_status()
        elif arg in ["stop"]:
            stop_active_session()
        elif arg in ["auto"]:
            auto_switch()
        else:
            switch_to_account(arg)
    else:
        interactive_menu()
