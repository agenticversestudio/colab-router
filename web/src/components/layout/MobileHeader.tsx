import React from 'react';
import { Menu, Activity, ChevronDown, Sparkles } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { FALLBACK_MODELS } from '../../services/api';

interface Props {
  onToggleSidebar: () => void;
  onToggleTelemetry: () => void;
  onOpenMCP?: () => void;
}

export const MobileHeader: React.FC<Props> = ({
  onToggleSidebar,
  onToggleTelemetry,
  onOpenMCP
}) => {
  const { selectedModel, setSelectedModel } = useChatStore();

  return (
    <div className="flex h-14 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#080C14]/90 backdrop-blur-xl px-3 z-30">
      {/* Left: Navigation Menu */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          title="Open Navigation"
          className="rounded-xl border border-white/10 bg-[#0D1322] p-2 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="hidden xs:flex items-center gap-1.5 pl-1">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-tight text-white uppercase">Studio</span>
        </div>
      </div>

      {/* Center: Model Selector */}
      <div className="relative max-w-[150px] sm:max-w-[220px]">
        <select
          value={selectedModel}
          onChange={e => setSelectedModel(e.target.value)}
          className="w-full appearance-none truncate rounded-xl border border-white/10 bg-[#0D1322] py-1.5 pl-2.5 pr-7 text-xs font-semibold text-slate-200 outline-none focus:border-blue-500/50 shadow-sm cursor-pointer"
        >
          {FALLBACK_MODELS.map(m => (
            <option key={m.id} value={m.id} className="bg-[#0D1322] text-white">
              {m.name.split('(')[0].trim()}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Right: Quick MCP & Telemetry */}
      <div className="flex items-center gap-1.5">
        {onOpenMCP && (
          <button
            onClick={onOpenMCP}
            title="Open MCP Tools"
            className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] font-mono">Tools</span>
          </button>
        )}

        <button
          onClick={onToggleTelemetry}
          title="Open GPU Telemetry & Shift"
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2 text-blue-400 hover:text-blue-300 transition active:scale-95 cursor-pointer shadow-sm"
        >
          <Activity className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};
