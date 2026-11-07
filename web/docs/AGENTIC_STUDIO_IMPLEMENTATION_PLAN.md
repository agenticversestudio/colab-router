# AGENTIC STUDIO â€” IMPLEMENTATION PLAN & WORK BREAKDOWN

**Document Version:** 1.0.0-PROD  
**Target Output:** Production-Grade React + Vite SPA with Dexie.js & PWA  
**Project Root:** `d:\Projects\Google\agentic-studio`  

---

## 1. PHASE STRUCTURE & MILESTONES

| Phase | Milestone Description | Target Status |
| :--- | :--- | :--- |
| **Phase 0** | Comprehensive Documentation Suite (PRD, Architecture, Plan, Security, QA) | In Progress |
| **Phase 1** | Project Scaffolding (Vite + React + TS + Tailwind + Lucide + Dexie + Zustand) | Pending |
| **Phase 2** | Client-Side Database Engine (Dexie.js Schemas & Hooks) | Pending |
| **Phase 3** | Security Gate & Session Authentication Modal | Pending |
| **Phase 4** | 3-Pane Workstation Layout (Desktop >=1024px) | Pending |
| **Phase 5** | Mobile 100dvh Responsive Layout & Slide-out Drawers (<1024px) | Pending |
| **Phase 6** | Streaming Chat Engine (SSE Consumer, AbortController, Speed Metrics) | Pending |
| **Phase 7** | Markdown & Code Block Engine (Syntax Highlighting, Copy Button) | Pending |
| **Phase 8** | Dynamic `<think>` Reasoning Block UI | Pending |
| **Phase 9** | Pinned Chat Input Dock (Auto-expanding Textarea, Keyboard Shortcuts) | Pending |
| **Phase 10** | Mission Control Telemetry Panel (Tesla T4 VRAM, GPU %, Shift Countdown) | Pending |
| **Phase 11** | Hermes Memory Manager (`USER.md`, `MEMORY.md` local editor) | Pending |
| **Phase 12** | Persona Studio & Custom System Prompts | Pending |
| **Phase 13** | Client-Side MCP Tool Hub (Web Search, Math, Code Sandbox) | Pending |
| **Phase 14** | PWA Manifest, Service Worker & Offline Fallback | Pending |
| **Phase 15** | Live Engine Verification & End-to-End Testing | Pending |

---

## 2. FILE STRUCTURE MATRIX
```
d:\Projects\Google\agentic-studio\
â”œâ”€â”€ docs\
â”‚   â”œâ”€â”€ AGENTIC_STUDIO_PRD.md
â”‚   â”œâ”€â”€ AGENTIC_STUDIO_ARCHITECTURE.md
â”‚   â”œâ”€â”€ AGENTIC_STUDIO_IMPLEMENTATION_PLAN.md
â”‚   â”œâ”€â”€ AGENTIC_STUDIO_SECURITY.md
â”‚   â””â”€â”€ AGENTIC_STUDIO_QA.md
â”œâ”€â”€ public\
â”‚   â”œâ”€â”€ favicon.svg
â”‚   â”œâ”€â”€ manifest.json
â”‚   â””â”€â”€ sw.js
â”œâ”€â”€ src\
â”‚   â”œâ”€â”€ components\
â”‚   â”‚   â”œâ”€â”€ auth\
â”‚   â”‚   â”‚   â””â”€â”€ AuthGate.tsx
â”‚   â”‚   â”œâ”€â”€ chat\
â”‚   â”‚   â”‚   â”œâ”€â”€ ChatContainer.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ChatDock.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ChatMessage.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ CodeBlock.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ReasoningAccordion.tsx
â”‚   â”‚   â”‚   â””â”€â”€ TokenSpeedBadge.tsx
â”‚   â”‚   â”œâ”€â”€ layout\
â”‚   â”‚   â”‚   â”œâ”€â”€ AppHeader.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ DesktopLayout.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MobileDrawer.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MobileHeader.tsx
â”‚   â”‚   â”‚   â””â”€â”€ Sidebar.tsx
â”‚   â”‚   â”œâ”€â”€ mission-control\
â”‚   â”‚   â”‚   â”œâ”€â”€ ShiftCountdown.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ StorageGauge.tsx
â”‚   â”‚   â”‚   â””â”€â”€ TelemetryPanel.tsx
â”‚   â”‚   â”œâ”€â”€ modals\
â”‚   â”‚   â”‚   â”œâ”€â”€ HermesMemoryModal.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ MCPToolsModal.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ PersonaModal.tsx
â”‚   â”‚   â”‚   â””â”€â”€ SettingsModal.tsx
â”‚   â”‚   â””â”€â”€ ui\
â”‚   â”‚       â”œâ”€â”€ Button.tsx
â”‚   â”‚       â”œâ”€â”€ Dropdown.tsx
â”‚   â”‚       â””â”€â”€ Modal.tsx
â”‚   â”œâ”€â”€ db\
â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ services\
â”‚   â”‚   â”œâ”€â”€ api.ts
â”‚   â”‚   â”œâ”€â”€ mcp.ts
â”‚   â”‚   â””â”€â”€ sse.ts
â”‚   â”œâ”€â”€ store\
â”‚   â”‚   â”œâ”€â”€ useAuthStore.ts
â”‚   â”‚   â”œâ”€â”€ useChatStore.ts
â”‚   â”‚   â””â”€â”€ useTelemetryStore.ts
â”‚   â”œâ”€â”€ types\
â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ App.tsx
â”‚   â”œâ”€â”€ index.css
â”‚   â””â”€â”€ main.tsx
â”œâ”€â”€ index.html
â”œâ”€â”€ package.json
â”œâ”€â”€ tailwind.config.js
â”œâ”€â”€ tsconfig.json
â””â”€â”€ vite.config.ts
```

---

## 3. ZERO-RISK VERIFICATION CHECKLIST
1. Verify remote Colab GPU endpoint `https://your-domain.ngrok-free.dev/health` and `/v1/models`.
2. Execute live chat completion stream over ngrok with reasoning tokens enabled.
3. Validate client IndexedDB storage by creating 5 chats, closing browser, and verifying immediate restore without hitting server.
4. Test mobile 100dvh viewport on touch devices to prove input dock never clips or hides behind virtual keyboard.
