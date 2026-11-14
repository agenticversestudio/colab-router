import React, { useEffect, useState } from 'react';
import { X, KeyRound, Check, Eye, EyeOff, RotateCcw, Cpu, Cloud } from 'lucide-react';
import {
  useProviderStore,
  PROVIDER_IDS,
  getProviderDefaults,
  type ProviderId
} from '../../store/useProviderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Draft = { baseUrl: string; model: string; apiKey: string };

/** Settings for the three models. Use one at a time; Qwen (Colab) is the default. */
export const ProvidersModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { getConfig, updateProvider, resetProvider } = useProviderStore();
  const { baseUrl: gatewayUrl, setBaseUrl } = useAuthStore();
  const { selectedModel, setSelectedModel } = useChatStore();
  const [drafts, setDrafts] = useState<Record<ProviderId, Draft>>({} as Record<ProviderId, Draft>);
  const [showKey, setShowKey] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [savedId, setSavedId] = useState<ProviderId | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const next = {} as Record<ProviderId, Draft>;
    for (const id of PROVIDER_IDS) {
      const c = getConfig(id);
      next[id] = {
        baseUrl: c.kind === 'colab' ? gatewayUrl : c.baseUrl,
        model: c.model,
        apiKey: c.apiKey
      };
    }
    setDrafts(next);
    setSavedId(null);
  }, [isOpen, getConfig, gatewayUrl]);

  if (!isOpen) return null;

  const setField = (id: ProviderId, field: keyof Draft, value: string) =>
    setDrafts(d => ({ ...d, [id]: { ...d[id], [field]: value } }));

  const save = (id: ProviderId, alsoUse: boolean) => {
    const d = drafts[id];
    if (!d) return;
    if (getProviderDefaults(id).kind === 'colab') {
      setBaseUrl(d.baseUrl);
      updateProvider(id, { model: d.model });
    } else {
      updateProvider(id, { baseUrl: d.baseUrl, model: d.model, apiKey: d.apiKey });
    }
    if (alsoUse) setSelectedModel(id);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1500);
  };

  const reset = (id: ProviderId) => {
    resetProvider(id);
    const c = getProviderDefaults(id);
    setDrafts(d => ({
      ...d,
      [id]: { baseUrl: c.kind === 'colab' ? gatewayUrl : c.baseUrl, model: c.model, apiKey: '' }
    }));
  };

  const inputCls =
    'w-full rounded-lg border border-white/10 bg-[#161F36] px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 font-mono';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0E1424] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 bg-[#080C14]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Models &amp; API Keys</h3>
              <p className="text-[11px] text-slate-400">
                Ek waqt mein ek model. Qwen (Colab) default hai. Keys sirf is browser mein save hoti hain.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {PROVIDER_IDS.map(id => {
            const c = getConfig(id);
            const d = drafts[id];
            if (!d) return null;
            const active = selectedModel === id;
            const isColab = c.kind === 'colab';
            return (
              <div
                key={id}
                className={`rounded-xl border p-4 space-y-3 transition ${
                  active ? 'border-blue-500 bg-blue-950/20' : 'border-white/10 bg-[#080C14]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isColab ? <Cpu className="h-4 w-4 text-emerald-400 shrink-0" /> : <Cloud className="h-4 w-4 text-sky-400 shrink-0" />}
                    <span className="text-sm font-semibold text-white truncate">{c.label}</span>
                  </div>
                  {active && (
                    <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 shrink-0">IN USE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{c.note}</p>

                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {isColab ? 'Colab gateway URL (ngrok)' : 'Base URL'}
                  </span>
                  <input className={inputCls} value={d.baseUrl} onChange={e => setField(id, 'baseUrl', e.target.value)}
                    placeholder={isColab ? 'https://your-domain.ngrok-free.dev' : 'https://...'} />
                </label>

                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">Model ID</span>
                  <input className={inputCls} value={d.model} onChange={e => setField(id, 'model', e.target.value)} />
                </label>

                {isColab ? (
                  <p className="text-[11px] text-slate-500">Key: login wala passkey / sk- key hi use hota hai.</p>
                ) : (
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center justify-between">
                      <span>API key</span>
                      {c.keyUrl && (
                        <a href={c.keyUrl} target="_blank" rel="noreferrer" className="normal-case text-blue-400 hover:underline">
                          Key yahan se lo
                        </a>
                      )}
                    </span>
                    <div className="relative">
                      <input
                        className={`${inputCls} pr-9`}
                        type={showKey[id] ? 'text' : 'password'}
                        value={d.apiKey}
                        onChange={e => setField(id, 'apiKey', e.target.value)}
                        placeholder="sk-..."
                        autoComplete="off"
                      />
                      <button type="button" onClick={() => setShowKey(s => ({ ...s, [id]: !s[id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" title="Show / hide key">
                        {showKey[id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </label>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button onClick={() => save(id, true)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition">
                    Save &amp; use this model
                  </button>
                  <button onClick={() => save(id, false)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition">
                    Save only
                  </button>
                  {!isColab && (
                    <button onClick={() => reset(id)} title="Restore default URL/model and clear key"
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300 transition">
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  )}
                  {savedId === id && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400"><Check className="h-3.5 w-3.5" /> Saved</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Header button that opens the Models & API Keys panel. */
export const ProvidersButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Models & API keys (Qwen / DeepSeek / GLM)"
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0E1424] px-2.5 py-1.5 text-xs text-slate-300 hover:border-blue-500/40 hover:text-white transition shrink-0"
      >
        <KeyRound className="h-3.5 w-3.5 text-amber-400" />
        {!compact && <span className="hidden md:inline">Models</span>}
      </button>
      <ProvidersModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
