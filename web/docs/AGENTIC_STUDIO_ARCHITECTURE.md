# AGENTIC STUDIO â€” SYSTEM ARCHITECTURE & DESIGN SPECIFICATION

**Document Version:** 1.0.0-PROD  
**System Type:** Decoupled Client-Centric Sovereign AI Workstation  
**Frontend Stack:** React 18 / Vite / TypeScript / Tailwind CSS / Lucide React / Dexie.js / Zustand  
**Backend Engine:** Autonomous Google Colab Tesla T4 GPU Runtime + Ollama + Uvicorn + Ngrok  

---

## 1. SYSTEM TOPOLOGY DIAGRAM

```mermaid
graph TD
    subgraph Browser Client [Client-Side Browser Execution Layer]
        UI[Agentic Studio Workstation UI]
        Store[Zustand State Engine]
        DB[(Dexie.js IndexedDB)]
        SSE[Streaming SSE Consumer]
        Tools[Client MCP Tool Engine]
        
        UI -->|User Input| Store
        Store -->|Persist History| DB
        Store -->|Trigger Inference| SSE
        Tools -->|Local Context Injection| Store
    end

    subgraph Colab Remote [Autonomous Tesla T4 Cloud Engine]
        Gateway[FastAPI / Uvicorn Gateway:8000]
        Ollama[Ollama LLM Engine:11434]
        GPU[Tesla T4 GPU 16GB VRAM]
        
        Gateway -->|Forward Raw Tokens| Ollama
        Ollama -->|Direct VRAM Offload| GPU
    end

    SSE -->|POST /v1/chat/completions (Stream)| Gateway
    Store -->|GET /ps (Telemetry 15s)| Gateway
    Store -->|POST /auth/login| Gateway
```

---

## 2. LAYER BREAKDOWN & RESPONSIBILITY CONTRACT

### 2.1 The Client Layer (100% Local Compute & Persistence)
* **Local Identity & Key Management:** Credentials (`User ID`, `Passkey`, `API Bearer Token`) are stored strictly in `sessionStorage`. Zero keys or tokens are stored on public servers or logged remotely.
* **IndexedDB Architecture (Dexie.js):**
  * All chat messages, code blocks, reasoning traces, and conversation titles exist exclusively inside the user's browser sandbox.
  * Search is handled using client-side in-memory regex / token indexing.
  * Export/Import: Full JSON and Markdown serialization performed locally using native `Blob` and `URL.createObjectURL`.
* **Client MCP Execution Engine:**
  * Web Search (via client duckduckgo / CORS proxy), Calculator / Math evaluation (local JS math parser), Markdown renderer, and Code preview sandboxes run 100% on the client.

### 2.2 The Remote Engine Layer (Pure Token Generation & Telemetry)
The remote Colab VM has exactly 3 functional duties:
1. `POST /auth/login` and `POST /auth/verify`: Validates user credentials.
2. `POST /v1/chat/completions`: Receives JSON messages array, streams Server-Sent Events (SSE) back to client via native Ollama pipeline.
3. `GET /ps`: Executes `nvidia-smi` and `ollama ps`, returning lightweight 1KB JSON telemetry for live VRAM and GPU monitoring.

Zero conversation databases, zero user profiles, and zero logs are written to the remote server filesystem.

---

## 3. SSE STREAMING & REASONING PIPELINE
* **Stream Parser:** Implements an asynchronous reader over `fetch(endpoint).body.getReader()`.
* **Chunk Decoding:** Handles standard SSE `data: {...}` lines and `data: [DONE]`.
* **Reasoning Extraction:** Detects both Ollama's `<think>...</think>` tags and OpenAI-compatible `delta.reasoning_content`.
* **UI Live Accordion:**
  * During generation inside a reasoning block, displays an animated "Reasoning in progress..." badge with live token counter.
  * Upon receiving closing `</think>`, automatically collapses or stays pinned according to user preference, cleanly separating logical derivation from the final response.

---

## 4. CSS VIEWPORT & DOCK ANCHORING SPECIFICATION
To permanently prevent the "Disappearing Input Box" bug:
```css
/* Root viewport containment */
.app-container {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Chat scroll area */
.chat-scroll-area {
  flex: 1 1 0%;
  min-height: 0; /* CRITICAL: Allows flex child to shrink properly */
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Pinned bottom dock */
.input-dock {
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 30;
  background: rgba(8, 12, 20, 0.85);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
```

---

## 5. DESIGN TOKENS & VISUAL HIERARCHY
* **Background Primary:** `#080C14` (Deep obsidian)
* **Surface Secondary:** `#0E1424` (Subtle elevated charcoal)
* **Surface Border:** `rgba(255, 255, 255, 0.08)`
* **Brand Accent:** `#3B82F6` (Electric Blue) & `#8B5CF6` (Linear Purple)
* **Active Status:** `#10B981` (Emerald Green Pulse)
* **Warning / Alert:** `#F59E0B` (Amber)
* **Font Family:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
* **Code Font:** "JetBrains Mono", "Fira Code", monospace
