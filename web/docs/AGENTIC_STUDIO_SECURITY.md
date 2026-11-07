# AGENTIC STUDIO â€” SECURITY & SOVEREIGN PRIVACY SPECIFICATION

**Document Version:** 1.0.0-PROD  
**Security Architecture:** Zero-Trust Client-Sovereign Architecture  
**Target Ingress:** `https://your-domain.ngrok-free.dev`  

---

## 1. SOVEREIGN CREDENTIAL SPECIFICATION
Access to Agentic Studio is governed by a cryptographic, three-tier barrier designed to resist brute-force, dictionary scanning, and automated crawler intrusions:

* **Sovereign User ID:** `your_user_id`
  * Represents the sovereign identity of Operator across the AgenticVerse.
  * Required on all interactive login operations.
* **Master Passkey:** `your_passkey`
  * High-entropy multi-token sequence combining the 3 core model prefixes (`g` - GLM, `q` - Qwen, `d` - DeepSeek), key version (`534`), and sovereign salt (`$$AV`).
* **Programmatic Bearer API Token:** `sk-your-api-key`
  * 64-character high-entropy hex string used for direct programmatic inference and CLI/SDK automation.
  * Transmitted securely via standard `Authorization: Bearer <TOKEN>` or `x-passkey` HTTP headers.

---

## 2. CLIENT-SIDE ZERO-KNOWLEDGE CONSTRAINTS
* **No Database Logging on Remote Server:** The remote Colab GPU VM operates in stateless mode. Messages sent for completion are processed directly by Ollama's VRAM forward-pass and immediately discarded from system memory upon stream termination.
* **Storage Isolation:** All conversations, reasoning chains, memory files, and personas are encrypted in browser IndexedDB via standard browser sandboxing and can be wiped with a single click in the UI via the "Emergency Purge" action.
* **Session Expiry & Memory Wipe:** Clicking "Lock Session" in the top bar or sidebar purges `sessionStorage`, clears in-memory state in Zustand, and immediately presents the credential lock gate.

---

## 3. NETWORK LEVEL HARDENING
* **CORS Origin Validation:** Gateway permits explicit origin handling with preflight protection.
* **Telemetry Throttling:** `GET /ps` is restricted to authenticated clients and throttled to prevent GPU polling overhead.
* **Anti-Scraper Barrier:** Endpoints without valid credentials return immediate `401 Unauthorized` responses without verbose stack traces.
