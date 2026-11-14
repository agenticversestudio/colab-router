import { create } from 'zustand';
import { fetchTelemetry } from '../services/api';
import type { TelemetryData } from '../types';

interface TelemetryStore extends TelemetryData {
  pollIntervalId: number | null;
  startPolling: () => void;
  stopPolling: () => void;
  refresh: () => Promise<void>;
}

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  status: 'offline',
  gpuName: 'Tesla T4',
  vramUsedMb: 0,
  vramTotalMb: 15360,
  gpuUtilization: 0,
  pingMs: 0,
  activeModel: 'qwen3.8-27b-uncensored',
  activeShift: 'Direct Connection',
  shiftHoursLeft: 0,
  lastUpdated: Date.now(),
  pollIntervalId: null,

  refresh: async () => {
    const data = await fetchTelemetry();
    set({
      status: data.status,
      gpuName: data.gpuName,
      vramUsedMb: data.vramUsedMb,
      vramTotalMb: data.vramTotalMb,
      gpuUtilization: data.gpuUtilization,
      pingMs: data.pingMs,
      lastUpdated: data.lastUpdated
    });
  },

  startPolling: () => {
    if (get().pollIntervalId) return;
    get().refresh();
    const interval = window.setInterval(() => {
      get().refresh();
    }, 15000);
    set({ pollIntervalId: interval });
  },

  stopPolling: () => {
    const id = get().pollIntervalId;
    if (id) {
      clearInterval(id);
      set({ pollIntervalId: null });
    }
  }
}));
