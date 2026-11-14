import { create } from 'zustand';

/**
 * One model "provider" = base URL + API key + model ID (OpenAI-compatible).
 * Use one at a time. Qwen on Colab is the default.
 *
 *  - qwen-colab : Qwen 3.8 27B on your own Colab T4 (ngrok URL + passkey from login)
 *  - deepseek   : DeepSeek V4.1 Flash via DeepSeek's official API (too big for a T4)
 *  - glm        : GLM 5.3 via Z.ai's official API (too big for a T4)
 *
 * Keys you type are saved only in this browser (localStorage), never in the build.
 */
export type ProviderId = 'qwen-colab' | 'deepseek' | 'glm';

export interface ProviderConfig {
  id: ProviderId;
  label: string;        // full name for dropdowns
  shortLabel: string;   // name shown on chat bubbles
  kind: 'colab' | 'openai';
  baseUrl: string;      // OpenAI-style base, e.g. https://api.deepseek.com
  model: string;        // model ID sent in the request
  apiKey: string;       // only for kind === 'openai'
  keyUrl?: string;      // where to get a key
  note: string;
}

export const DEFAULT_PROVIDER: ProviderId = 'qwen-colab';

const DEFAULTS: Record<ProviderId, ProviderConfig> = {
  'qwen-colab': {
    id: 'qwen-colab',
    label: 'Qwen 3.8 27B (Colab T4) — Default',
    shortLabel: 'Qwen 3.8 27B',
    kind: 'colab',
    baseUrl: '', // comes from login / gateway URL
    model: 'qwen3.8-27b-uncensored',
    apiKey: '',
    note: 'Your own Colab GPU. Start the Colab notebook first (Runtime → Run all).'
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek V4.1 Flash (API)',
    shortLabel: 'DeepSeek V4.1 Flash',
    kind: 'openai',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-flash',
    apiKey: '',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    note: 'Official DeepSeek API (paid per token). OpenRouter also works: base https://openrouter.ai/api/v1.'
  },
  glm: {
    id: 'glm',
    label: 'GLM 5.3 (Z.ai API)',
    shortLabel: 'GLM 5.3',
    kind: 'openai',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    model: 'glm-5.3',
    apiKey: '',
    keyUrl: 'https://z.ai/manage-apikey/apikey-list',
    note: 'Official Z.ai API (paid per token). OpenRouter also works: model z-ai/glm-5.3.'
  }
};

export const PROVIDER_IDS: ProviderId[] = ['qwen-colab', 'deepseek', 'glm'];

const STORAGE_KEY = 'agentic_studio_providers';
const SELECTED_KEY = 'agentic_studio_selected_provider';

type Overrides = Partial<Record<ProviderId, Partial<Pick<ProviderConfig, 'baseUrl' | 'model' | 'apiKey'>>>>;

function loadOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Overrides;
  } catch {
    return {};
  }
}

/** Old builds stored the raw model name ("qwen3.8-27b-uncensored"); map anything unknown to Qwen. */
export function toProviderId(value: string | null | undefined): ProviderId {
  return value && (PROVIDER_IDS as string[]).includes(value) ? (value as ProviderId) : DEFAULT_PROVIDER;
}

interface ProviderStore {
  overrides: Overrides;
  selected: ProviderId;
  getConfig: (id: ProviderId) => ProviderConfig;
  updateProvider: (id: ProviderId, patch: Partial<Pick<ProviderConfig, 'baseUrl' | 'model' | 'apiKey'>>) => void;
  resetProvider: (id: ProviderId) => void;
  setSelected: (id: ProviderId) => void;
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  overrides: loadOverrides(),
  selected: toProviderId(localStorage.getItem(SELECTED_KEY)),

  getConfig: (id) => ({ ...DEFAULTS[id], ...(get().overrides[id] || {}) }),

  updateProvider: (id, patch) => {
    const clean = Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, (v ?? '').trim()])
    );
    const overrides = { ...get().overrides, [id]: { ...(get().overrides[id] || {}), ...clean } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    set({ overrides });
  },

  resetProvider: (id) => {
    const overrides = { ...get().overrides };
    delete overrides[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    set({ overrides });
  },

  setSelected: (id) => {
    localStorage.setItem(SELECTED_KEY, id);
    set({ selected: id });
  }
}));

export const getProviderDefaults = (id: ProviderId): ProviderConfig => DEFAULTS[id];

/** React hook: config for one provider that re-renders when its saved settings change. */
export function useProviderConfig(id: ProviderId): ProviderConfig {
  const override = useProviderStore(s => s.overrides[id]);
  return { ...DEFAULTS[id], ...(override || {}) };
}
