# AGENTIC STUDIO â€” QA TEST PLAN & VERIFICATION PROTOCOL

**Document Version:** 1.0.0-PROD  
**Validation Suite:** Browser & GPU End-to-End Test Protocol  

---

## 1. TEST CASES & ACCEPTANCE MATRIX

| Test ID | Test Scenario | Execution Method | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Two-Factor Authentication Gate | Input valid & invalid ID/passkey | Invalid returns 401 & shake animation; valid unlocks workstation | PASS |
| **TC-02** | Zero Server Database Write | Inspect Colab filesystem during 20 queries | Zero SQLite/JSON history files written on Colab VM | PASS |
| **TC-03** | Viewport Dock Pinning | Send long code blocks on mobile & desktop | Input dock remains 100% visible and pinned at bottom | PASS |
| **TC-04** | SSE Streaming & Abort | Trigger generation and press "Stop" | Streaming halts instantly; token metrics calculated | PASS |
| **TC-05** | `<think>` Reasoning Accordion | Ask logic puzzle ("How many r's in strawberry?") | Accordion shows live thought stream; collapses on finish | PASS |
| **TC-06** | Dexie.js Persistence | Create 3 chats, refresh browser | All 3 chats and messages restored instantaneously from IndexedDB | PASS |
| **TC-07** | Model Switcher | Switch between Qwen 27B, DeepSeek, GLM | Active model badge updates; payload uses selected model | PASS |
| **TC-08** | Tesla T4 Telemetry | Verify `/ps` endpoint response | Shows live VRAM usage, GPU core %, and active shift | PASS |
| **TC-09** | Vector SVG Icons (No Mojibake) | Inspect all buttons & navigation elements | 100% Lucide SVG rendered; zero `Ã°Å¸â€â€™` corrupt chars | PASS |
| **TC-10** | Mobile Responsive Drawer | Test on screen width < 768px | Hamburger menu opens slide-out drawer; smooth touch close | PASS |

---

## 2. AUTOMATED VERIFICATION SCRIPTS
* Integration script `verify_agentic_studio.py` tests:
  1. Gateway `/health` check.
  2. Gateway `/v1/models` check.
  3. Gateway `/auth/login` check.
  4. Gateway `/ps` telemetry check.
  5. Gateway `/v1/chat/completions` live SSE stream check.
