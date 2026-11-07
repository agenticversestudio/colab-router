# AGENTIC STUDIO â€” PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Document Version:** 1.0.0-PROD  
**Classification:** Sovereign Executive Grade  
**Target Platform:** Desktop Workstation (1024px+), Mobile Touch Screen (100dvh PWA)  
**Backend:** Autonomous Tesla T4 GPU Cloud Engine (Colab / Ngrok / Ollama)  
**Author:** Principal UI/UX Architect & Systems Engineer for Operator (AgenticVerse)  

---

## 1. EXECUTIVE SUMMARY & SOVEREIGN VISION
**Agentic Studio** is an executive-grade, sovereign AI Command & Control Workstation and conversational intelligence interface. Inspired by the tactical client-side architecture of PocketStrike, the conversation fluency of ChatGPT, and the dark minimalist precision of Linear, Agentic Studio provides direct access to high-parameter LLMs (`Qwen 3.8 27B`, `DeepSeek V4.1`, `GLM 5.3`) running on an autonomous Tesla T4 cloud infrastructure.

Agentic Studio enforces two immutable physical rules:
1. **Zero Server Pressure:** 100% of session persistence, chat history, full-text vector/string search, persona management, long-term memory (`USER.md`, `MEMORY.md`), and agent tool execution are executed exclusively inside the user's browser via IndexedDB (Dexie.js).
2. **Model Superpower Freedom:** The AI model is never artificially hobbled, forced into pre-canned friendly personas ("Hey Operator! What's up?"), or stripped of its reasoning compute. The complete `<think>` stream and inference compute are preserved unconstrained.

---

## 2. ROOT CAUSE ANALYSIS OF PREVIOUS FAILURES
Previous iterations suffered from several architectural defects which Agentic Studio completely resolves:
* **The Disappearing Chat Dock:** In standard CSS flexbox containers without explicit height capping, chat message lists expanding beyond the viewport push bottom input docks down into invisible screen overflow. *Solution:* Viewport locked at `height: 100dvh`, child message list constrained with `min-height: 0; overflow-y: auto;`, and input dock pinned with `position: sticky; bottom: 0; z-index: 20;`.
* **Mojibake Character Corruption (`Ã°Å¸â€â€™`):** Relying on raw utf-8 emoji bytes in headers or buttons caused encoding mismatches across Windows cp1252, web servers, and HTTP payloads. *Solution:* 100% vector SVG icons via Lucide React.
* **Server-Side Bloat & Latency:** In previous attempts, server-side SQLite or memory lookups added latency and exhausted ephemeral VM storage. *Solution:* Colab GPU VM handles ONLY raw token generation (`POST /v1/chat/completions`), 1KB telemetry (`GET /ps`), and auth handshake (`POST /auth/login`).
* **Unwanted Persona Injections:** Overly chatty pre-prompts degraded inference speed and broke coding responses. *Solution:* Pure base chat template with zero unprompted greeting personas.

---

## 3. CORE ARCHITECTURAL SPECIFICATIONS

### 3.1 Security & Authentication Gate
* **Two-Factor Access:**
  * Sovereign User ID: `your_user_id`
  * Master Passkey: `your_passkey`
  * API Bearer Token: `sk-your-api-key`
* **Session Security:** Session token stored in browser `sessionStorage`. Lock Session button immediately clears memory and locks UI behind the credential gate.

### 3.2 Desktop 3-Pane Workstation (>= 1024px)
1. **Left Sidebar (260px):**
   * Brand header with live GPU pulse status badge.
   * New Chat action button (`Ctrl+K` / `Cmd+K` shortcut).
   * Live client-side instant search filter.
   * Chat History grouped by Today, Yesterday, and Previous 7 Days.
   * Hermes Memory & Persona modal triggers.
   * Footer with Storage quota gauge and Lock Session button.
2. **Center Command Center (Fluid):**
   * Top bar: Model Switcher dropdown (`Qwen 3.8 27B Flagship`, `DeepSeek V4.1 Reasoning`, `GLM 5.3 Complex Logic`), clear session, export markdown/JSON.
   * Message Stream:
     * User prompt bubbles with edit/retry actions.
     * Assistant bubbles with live SSE rendering, syntax-highlighted code blocks with Copy & Language badges.
     * Expandable/collapsible `<think>` reasoning block with token timer and live thought stream.
     * Token speed badges (tokens/sec, TTFT, total duration).
   * Pinned Bottom Dock:
     * Expanding textarea (`Shift+Enter` for newline, `Enter` to send).
     * Stop generation button during active streaming.
     * Attach file/context button.
     * Token counter and temperature slider toggle.
3. **Right Mission Control Panel (300px):**
   * Active Shift Monitor: Colab token countdown (12-hour lifespan), Active Account indicator (`operator@example.com`).
   * Tesla T4 Telemetry: Live VRAM usage (e.g. 14,317 / 15,360 MiB), GPU Core Utilization %, Temperature.
   * Ngrok Ingress ping latency (ms) and base URL endpoint verification.
   * Quick Model switch actions.

### 3.3 Mobile Touch Interface (< 1024px)
* **Fullscreen Locked:** `height: 100dvh` with dynamic viewport unit handling to prevent virtual keyboard clipping.
* **Header:** Compact top bar with Hamburger menu (opens history drawer), Model badge, and Mission Control sheet trigger.
* **History Drawer:** Left slide-over drawer containing all sidebar actions, search, and storage metrics.
* **Telemetry Sheet:** Bottom or right slide-out panel for GPU vitals and shift status.
* **Pinned Dock:** Touch-optimized input box with 44px minimum tap targets.

---

## 4. CLIENT-SIDE DATA STORE (ZERO SERVER LOAD)
Using IndexedDB through Dexie.js with the following schema:
* `conversations`: `id`, `title`, `model`, `created_at`, `updated_at`, `system_prompt`, `pinned`
* `messages`: `id`, `conversation_id`, `role`, `content`, `reasoning_content`, `created_at`, `tokens_per_sec`, `ttft_ms`
* `hermes_memory`: `id`, `key` (`USER.md`, `MEMORY.md`), `content`, `updated_at`
* `personas`: `id`, `name`, `system_prompt`, `avatar`, `created_at`
* `mcp_tools`: `id`, `name`, `description`, `enabled`, `type`

---

## 5. VERIFICATION & SUCCESS METRICS
| Metric | Acceptance Criteria |
| :--- | :--- |
| First Token Latency (TTFT) | < 1200ms on warm Tesla T4 VRAM |
| UI Streaming FPS | Smooth 60 FPS animation without re-render stutter |
| Server Resource Overhead | 0KB database writes to remote Colab VM |
| Mobile Dock Stability | Pinned at bottom across Android Chrome & iOS Safari |
| Visual Standard | Dark Theme `#080C14`, Linear typography, Zero Mojibake |
