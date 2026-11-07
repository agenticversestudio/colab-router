import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  Lock,
  Sliders,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { FALLBACK_MODELS } from '../../services/api';

interface Props {
  onOpenMemory: () => void;
  onOpenPersonas: () => void;
  onOpenMCP: () => void;
  isLeftOpen: boolean;
  onToggleLeft: () => void;
  isRightOpen: boolean;
  onToggleRight: () => void;
}

export const AppHeader: React.FC<Props> = ({
  onOpenMemory,
  onOpenPersonas,
  onOpenMCP,
  isLeftOpen,
  onToggleLeft,
  isRightOpen,
  onToggleRight
}) => {
  const { selectedModel, setSelectedModel, clearActiveConversation } = useChatStore();
  const logout = useAuthStore(s => s.logout);
  const { status, pingMs, vramUsedMb, refresh } = useTelemetryStore();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await refresh();
    } finally {
      setTimeout(() => setIsReconnecting(false), 600);
    }
  };

  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#080C14]/95 px-3 md:px-4 backdrop-blur-xl z-20">
      {/* Left: Sidebar Collapse Toggle + Model Selector */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button
          onClick={onToggleLeft}
          title={isLeftOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#0E1424] text-slate-400 hover:border-blue-500/40 hover:text-white transition shrink-0"
        >
          {isLeftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4 text-blue-400" />}
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative shrink min-w-[140px] max-w-[240px]">
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="w-full appearance-none truncate rounded-xl border border-white/10 bg-[#0E1424] py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-200 outline-none hover:border-blue-500/40 transition cursor-pointer"
          >
            {FALLBACK_MODELS.map(m => (
              <option key={m.id} value={m.id} className="bg-[#0E1424] text-white">
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Live Reactive Hardware & Ingress Status Pill */}
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          title={status === 'online' ? `Connected: ${pingMs}ms latency. Click to re-check.` : 'Offline: Click to test and reconnect'}
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-mono whitespace-nowrap shrink-0 transition ${
            status === 'online'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              : status === 'connecting' || isReconnecting
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
          }`}
        >
          {isReconnecting ? (
            <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
          ) : (
            <span className={`h-1.5 w-1.5 rounded-full ${
              status === 'online' ? 'bg-emerald-400 animate-pulse' : status === 'connecting' ? 'bg-amber-400' : 'bg-rose-500'
            }`} />
          )}
          {isReconnecting ? (
            <span>Testing Connection...</span>
          ) : status === 'online' ? (
            <span>Tesla T4 • {(vramUsedMb / 1024).toFixed(1)}GB • {pingMs}ms</span>
          ) : status === 'connecting' ? (
            <span>Checking Engine...</span>
          ) : (
            <span className="font-semibold text-rose-300">Offline • Tap Reconnect</span>
          )}
        </button>
      </div>

      {/* Right: Workstation Action Controls */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Hermes Memory Button */}
        <button
          onClick={onOpenMemory}
          title="Hermes Memory"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0E1424] px-2.5 py-1.5 text-xs text-slate-300 hover:border-purple-500/40 hover:text-white transition"
        >
          <Brain className="h-3.5 w-3.5 text-purple-400" />
          <span className="hidden md:inline">Memory</span>
        </button>

        {/* Persona Studio Button */}
        <button
          onClick={onOpenPersonas}
          title="Persona Studio"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0E1424] px-2.5 py-1.5 text-xs text-slate-300 hover:border-blue-500/40 hover:text-white transition"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="hidden md:inline">Personas</span>
        </button>

        {/* MCP Tools Hub Button */}
        <button
          onClick={onOpenMCP}
          title="Studio MCP Tools & Registry"
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition shadow-sm"
        >
          <Sliders className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden md:inline">MCP Tools</span>
        </button>

        {/* Clear Chat */}
        <button
          onClick={() => {
            if (window.confirm("Clear all messages in active session?")) {
              clearActiveConversation();
            }
          }}
          title="Clear Chat Messages"
          className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0E1424] px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Clear</span>
        </button>

        {/* Lock Session */}
        <button
          onClick={logout}
          title="Lock Session"
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
        >
          <Lock className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Lock</span>
        </button>

        {/* Right Sidebar Collapse Toggle */}
        <button
          onClick={onToggleRight}
          title={isRightOpen ? 'Collapse Mission Control' : 'Expand Mission Control'}
          className="hidden xl:flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#0E1424] text-slate-400 hover:border-blue-500/40 hover:text-white transition shrink-0"
        >
          {isRightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4 text-purple-400" />}
        </button>
      </div>
    </header>
  );
};
