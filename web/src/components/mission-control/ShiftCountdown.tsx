import React from 'react';
import { Clock, RefreshCw, UserCheck } from 'lucide-react';
import { useTelemetryStore } from '../../store/useTelemetryStore';

export const ShiftCountdown: React.FC = () => {
  const { activeShift, shiftHoursLeft } = useTelemetryStore();

  return (
    <div className="rounded-xl border border-white/10 bg-[#0E1424] p-3 text-xs">
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          Autonomous Shift
        </span>
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
          <UserCheck className="h-3.5 w-3.5 text-purple-400" />
          <span className="font-mono">{activeShift}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Session Lifetime:</span>
          <span className="font-mono text-white">{shiftHoursLeft}h remaining</span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (shiftHoursLeft / 12) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span>Auto-rotates to Shift 1 upon expiry</span>
          <RefreshCw className="h-3 w-3 text-slate-500 animate-spin-slow" />
        </div>
      </div>
    </div>
  );
};
