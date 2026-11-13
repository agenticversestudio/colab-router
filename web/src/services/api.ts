import { useAuthStore } from '../store/useAuthStore';

export interface ModelOption {
  id: string;
  name: string;
}

export const FALLBACK_MODELS: ModelOption[] = [
  { id: 'qwen3.8-27b-uncensored', name: 'Qwen 3.8 27B Uncensored (Dedicated Colab T4 GPU)' }
];

const SOVEREIGN_FALLBACK_KEY = 'sk-jaggu-7f89d3a4c5e21b0698f12a3d4e5f60718293a4b5c6d7e8f9';
const SOVEREIGN_PASSKEY = 'gqd@534$$AV';

export async function fetchAvailableModels(): Promise<ModelOption[]> {
  const { baseUrl: rawUrl, apiKey, passkey } = useAuthStore.getState();
  const baseUrl = (rawUrl || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
  const authKey = apiKey || SOVEREIGN_FALLBACK_KEY;
  try {
    const res = await fetch(`${baseUrl}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'x-passkey': passkey || SOVEREIGN_PASSKEY,
        'ngrok-skip-browser-warning': 'true'
      }
    });
    if (!res.ok) return FALLBACK_MODELS;
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((m: { id: string; name?: string }) => ({
        id: m.id,
        name: m.name || m.id
      }));
    }
  } catch {
    // Return standard fallback models if network/CORS fails
  }
  return FALLBACK_MODELS;
}

export async function fetchTelemetry() {
  const { baseUrl: rawUrl, apiKey, passkey } = useAuthStore.getState();
  const baseUrl = (rawUrl || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
  const authKey = apiKey || SOVEREIGN_FALLBACK_KEY;
  const startTime = performance.now();
  try {
    const res = await fetch(`${baseUrl}/ps`, {
      headers: {
        'Authorization': `Bearer ${authKey}`,
        'x-passkey': passkey || SOVEREIGN_PASSKEY,
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const pingMs = Math.round(performance.now() - startTime);
    if (!res.ok) throw new Error('Telemetry unavailable');
    const data = await res.json();

    // Parse GPU telemetry string: e.g. "Tesla T4, 14317 MiB, 1043 MiB, 0 %"
    let gpuName = 'Tesla T4';
    let vramUsedMb = 14317;
    let vramTotalMb = 15360;
    let gpuUtilization = 0;

    if (data.gpu_telemetry) {
      const parts = data.gpu_telemetry.split(',').map((s: string) => s.trim());
      if (parts.length >= 4) {
        gpuName = parts[0];
        vramUsedMb = parseInt(parts[1].replace(/[^0-9]/g, '')) || 14317;
        const vramFree = parseInt(parts[2].replace(/[^0-9]/g, '')) || 1043;
        vramTotalMb = vramUsedMb + vramFree;
        gpuUtilization = parseInt(parts[3].replace(/[^0-9]/g, '')) || 0;
      }
    }

    return {
      status: 'online' as const,
      gpuName,
      vramUsedMb,
      vramTotalMb,
      gpuUtilization,
      pingMs,
      ollamaPs: data.ollama_ps || '',
      lastUpdated: Date.now()
    };
  } catch {
    return {
      status: 'offline' as const,
      gpuName: 'Tesla T4 (Disconnected)',
      vramUsedMb: 0,
      vramTotalMb: 15360,
      gpuUtilization: 0,
      pingMs: 0,
      ollamaPs: '',
      lastUpdated: Date.now()
    };
  }
}
}
