#!/usr/bin/env python3
"""
Colab Router - Multi-Account Authentication Helper
===================================================
Interactive CLI utility to authenticate Google accounts with `colab-cli`
and organize their tokens into the vault for multi-account shift rotation.
"""

import os
import sys
import shutil
import subprocess

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT_DIR = os.path.join(REPO_ROOT, "vault")
COLAB_CONFIG_DIR = os.path.expanduser("~/.config/colab-cli")
COLAB_TOKEN_PATH = os.path.join(COLAB_CONFIG_DIR, "token.json")

def main():
    print("=" * 65)
    print("🔑 Colab Router - Multi-Account Auth Vault Setup")
    print("=" * 65)
    print("This utility helps you authenticate each Google account via colab-cli")
    print("and archives its token into the local vault for 24/7 rotation.\n")

    os.makedirs(VAULT_DIR, exist_ok=True)
    os.makedirs(COLAB_CONFIG_DIR, exist_ok=True)

    while True:
        account_id = input("Enter Account identifier (e.g. shift1, shift2, or user email) [or 'q' to quit]: ").strip()
        if not account_id or account_id.lower() == 'q':
            break

        target_dir = os.path.join(VAULT_DIR, account_id)
        os.makedirs(target_dir, exist_ok=True)
        target_token = os.path.join(target_dir, "token.json")

        print(f"\n[*] Preparing authentication for: {account_id}")
        if os.path.exists(COLAB_TOKEN_PATH):
            os.remove(COLAB_TOKEN_PATH)

        print("[*] Launching `colab auth` (follow browser prompts to log into this account)...")
        res = subprocess.run(["colab", "auth"], capture_output=False)

        if os.path.exists(COLAB_TOKEN_PATH) and os.path.getsize(COLAB_TOKEN_PATH) > 10:
            shutil.copyfile(COLAB_TOKEN_PATH, target_token)
            print(f"✅ [SUCCESS] Token archived to: {target_token}")
        else:
            print("❌ [ERROR] Authentication did not generate token.json. Please retry.")

        print("-" * 65)

    print("\nVault inspection:")
    for item in os.listdir(VAULT_DIR):
        p = os.path.join(VAULT_DIR, item, "token.json")
        status = "VALID" if os.path.exists(p) else "MISSING"
        print(f"  • {item}: {status}")

    print("\n✅ Multi-account auth setup complete!")

if __name__ == "__main__":
    main()
