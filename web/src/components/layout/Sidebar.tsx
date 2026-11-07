import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Cpu,
  ShieldCheck,
  Sparkles,
  Brain,
  Bot
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface Props {
  onCloseMobile?: () => void;
  onOpenMCP?: () => void;
  onOpenMemory?: () => void;
  onOpenPersonas?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  onCloseMobile,
  onOpenMCP,
  onOpenMemory,
  onOpenPersonas
}) => {
  const [search, setSearch] = useState('');
  const {
    conversations,
    activeConversationId,
    selectConversation,
    createConversation,
    deleteConversation
  } = useChatStore();

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    selectConversation(id);
    if (onCloseMobile) onCloseMobile();
  };

  const handleNewChat = () => {
    createConversation();
    if (onCloseMobile) onCloseMobile();
  };

  const handleOpenMCP = () => {
    if (onCloseMobile) onCloseMobile();
    if (onOpenMCP) onOpenMCP();
  };

  const handleOpenMemory = () => {
    if (onCloseMobile) onCloseMobile();
    if (onOpenMemory) onOpenMemory();
  };

  const handleOpenPersonas = () => {
    if (onCloseMobile) onCloseMobile();
    if (onOpenPersonas) onOpenPersonas();
  };

  return (
    <aside className="flex h-full w-full flex-col bg-[#080C14] border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Agentic Studio</h1>
            <p className="text-[10px] text-slate-400 font-mono">Sovereign Station</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98] transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Hub / Workstation Quick Tools */}
      {(onOpenMCP || onOpenMemory || onOpenPersonas) && (
        <div className="px-3 pb-3 grid grid-cols-3 gap-1.5 border-b border-white/5">
          {onOpenMCP && (
            <button
              onClick={handleOpenMCP}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-2 px-1 text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition"
              title="MCP Tool Command Center"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium leading-none">MCP Tools</span>
            </button>
          )}
          {onOpenMemory && (
            <button
              onClick={handleOpenMemory}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-500/20 bg-purple-500/5 py-2 px-1 text-slate-300 hover:bg-purple-500/10 hover:text-purple-300 transition"
              title="Hermes Long-Term Memory"
            >
              <Brain className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] font-medium leading-none">Memory</span>
            </button>
          )}
          {onOpenPersonas && (
            <button
              onClick={handleOpenPersonas}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-500/20 bg-amber-500/5 py-2 px-1 text-slate-300 hover:bg-amber-500/10 hover:text-amber-300 transition"
              title="Persona & Prompt Studio"
            >
              <Bot className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-medium leading-none">Personas</span>
            </button>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-white/5 bg-[#0E1424] py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No sessions found
          </div>
        ) : (
          filtered.map(conv => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-white font-medium border border-blue-500/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="truncate">{conv.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${conv.title}"?`)) {
                      deleteConversation(conv.id);
                    }
                  }}
                  title="Delete Session"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Security Badge */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="leading-tight">
            <span className="block font-medium text-slate-300">IndexedDB Vault</span>
            <span className="text-[10px] text-slate-500">100% Client-Side Private</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
