import React, { useState, useEffect } from 'react';
import { Database, Trash2, Check } from 'lucide-react';
import { db } from '../../db';

export const StorageGauge: React.FC = () => {
  const [counts, setCounts] = useState({ convs: 0, msgs: 0, mem: 0 });
  const [cleared, setCleared] = useState(false);

  const loadStats = async () => {
    const c = await db.conversations.count();
    const m = await db.messages.count();
    const mem = await db.memory.count();
    setCounts({ convs: c, msgs: m, mem: mem });
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearHistory = async () => {
    if (window.confirm("Purge all local chat history? This cannot be undone.")) {
      await db.conversations.clear();
      await db.messages.clear();
      setCleared(true);
      await loadStats();
      setTimeout(() => setCleared(false), 2000);
      window.location.reload();
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0E1424] p-3 text-xs">
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          Local IndexedDB Sandbox
        </span>
        <span className="text-[10px] text-emerald-400 font-mono">100% Client</span>
      </div>

      <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono">
        <div className="rounded-lg bg-black/30 p-2">
          <div className="text-sm font-bold text-white">{counts.convs}</div>
          <div className="text-[10px] text-slate-400">Chats</div>
        </div>
        <div className="rounded-lg bg-black/30 p-2">
          <div className="text-sm font-bold text-white">{counts.msgs}</div>
          <div className="text-[10px] text-slate-400">Msgs</div>
        </div>
        <div className="rounded-lg bg-black/30 p-2">
          <div className="text-sm font-bold text-white">{counts.mem}</div>
          <div className="text-[10px] text-slate-400">Mem Docs</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
        <span className="text-[10px] text-slate-500">Zero Server Data Leakage</span>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition"
        >
          {cleared ? <Check className="h-3 w-3 text-emerald-400" /> : <Trash2 className="h-3 w-3" />}
          <span>{cleared ? 'Purged' : 'Purge DB'}</span>
        </button>
      </div>
    </div>
  );
};
