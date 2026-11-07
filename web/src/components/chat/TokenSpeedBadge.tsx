import React from 'react';
import { Zap, Clock, Cpu } from 'lucide-react';

interface Props {
  tokensPerSec?: number;
  ttftMs?: number;
  totalDurationMs?: number;
}

export const TokenSpeedBadge: React.FC<Props> = ({ tokensPerSec, ttftMs, totalDurationMs }) => {
  if (!tokensPerSec && !ttftMs) return null;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
      {tokensPerSec !== undefined && (
        <span className="flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-blue-300 font-mono">
          <Zap className="h-3 w-3 text-blue-400" />
          {tokensPerSec} t/s
        </span>
      )}
      {ttftMs !== undefined && (
        <span className="flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-purple-300 font-mono">
          <Clock className="h-3 w-3 text-purple-400" />
          TTFT: {ttftMs}ms
        </span>
      )}
      {totalDurationMs !== undefined && (
        <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-slate-300 font-mono">
          <Cpu className="h-3 w-3 text-slate-400" />
          {(totalDurationMs / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
};
