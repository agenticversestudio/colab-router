import React, { useEffect } from 'react';
import { Activity, Cpu, Server, Wifi, RefreshCw } from 'lucide-react';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { ShiftCountdown } from './ShiftCountdown';
import { StorageGauge } from './StorageGauge';

export const TelemetryPanel: React.FC = () => {
  const {
    status,
    gpuName,
    vramUsedMb,
    vramTotalMb,
    gpuUtilization,
    pingMs,
    refresh
  } = useTelemetryStore();

  useEffect(() => {
    useTelemetryStore.getState().startPolling();
    return () => useTelemetryStore.getState().stopPolling();
  }, []);

  const vramPercent = Math.min(100, Math.round((vramUsedMb / vramTotalMb) * 100));

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-4 bg-[#080C14] border-l border-white/10 select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Mission Control
          </h3>
        </div>
        <button
          onClick={() => refresh()}
          title="Refresh Telemetry"
          className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* GPU Hardware Card */}
      <div className="rounded-xl border border-white/10 bg-[#0E1424] p-3 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            {gpuName}
          </span>
          <span className={`flex items-center gap-1 font-mono text-[10px] ${
            status === 'online' ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`} />
            {status.toUpperCase()}
          </span>
        </div>

        {/* VRAM Gauge */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">VRAM Allocation:</span>
            <span className="font-mono text-white">
              {(vramUsedMb / 1024).toFixed(1)} / {(vramTotalMb / 1024).toFixed(1)} GB ({vramPercent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${vramPercent}%` }}
            />
          </div>
        </div>

        {/* Core Utilization */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
          <span className="text-slate-400">GPU Core Compute:</span>
          <span className="font-mono font-bold text-blue-400">{gpuUtilization}%</span>
        </div>
      </div>

      {/* Cloud Ingress Card */}
      <div className="rounded-xl border border-white/10 bg-[#0E1424] p-3 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Server className="h-3.5 w-3.5 text-purple-400" />
            Cloud Ingress
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
            <Wifi className="h-3 w-3" />
            {pingMs > 0 ? `${pingMs}ms` : 'Active'}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Private Encrypted Tunnel
          </span>
          <span className="font-mono text-[10px] text-purple-300 rounded bg-purple-500/10 px-1.5 py-0.5 border border-purple-500/20">
            TLS 1.3
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>End-to-End Encrypted</span>
          <span className="text-slate-400">Zero Retention</span>
        </div>
      </div>

      {/* Autonomous Shift Card */}
      <ShiftCountdown />

      {/* Local IndexedDB Card */}
      <StorageGauge />
    </div>
  );
};
