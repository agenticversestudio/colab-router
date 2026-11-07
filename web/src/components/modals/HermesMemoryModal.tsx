import React, { useState, useEffect } from 'react';
import { X, Save, Brain, Check, Shield } from 'lucide-react';
import { db } from '../../db';
import { useChatStore } from '../../store/useChatStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HermesMemoryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<'USER.md' | 'MEMORY.md'>('USER.md');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);

  const { injectMemory, setInjectMemory } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      loadFile(activeFile);
    }
  }, [isOpen, activeFile]);

  const loadFile = async (filename: 'USER.md' | 'MEMORY.md') => {
    const doc = await db.memory.where('filename').equals(filename).first();
    if (doc) {
      setContent(doc.content);
    } else {
      setContent('');
    }
  };

  const handleSave = async () => {
    const existing = await db.memory.where('filename').equals(activeFile).first();
    if (existing) {
      await db.memory.update(existing.id, { content, updatedAt: Date.now() });
    } else {
      await db.memory.add({
        id: `mem_${Date.now()}`,
        filename: activeFile,
        content,
        updatedAt: Date.now()
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="flex h-[90vh] sm:h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0E1424] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 bg-[#080C14]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Hermes Sovereign Memory</h3>
              <p className="text-[11px] text-slate-400">Local markdown documents stored 100% in browser IndexedDB</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Memory Injection Safety Toggle */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#080C14] px-4 sm:px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Shield className="h-4 w-4 text-purple-400" />
            <span>Inject memory files into AI system prompt:</span>
          </div>
          <button
            type="button"
            onClick={() => setInjectMemory(!injectMemory)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              injectMemory ? 'bg-purple-600' : 'bg-white/20'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                injectMemory ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/30 px-6">
          <button
            onClick={() => setActiveFile('USER.md')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeFile === 'USER.md'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            USER.md (User Context)
          </button>
          <button
            onClick={() => setActiveFile('MEMORY.md')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
              activeFile === 'MEMORY.md'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            MEMORY.md (System Directives)
          </button>
        </div>

        {/* Markdown Textarea */}
        <div className="flex-1 p-6">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="h-full w-full resize-none rounded-xl border border-white/10 bg-[#080C14] p-4 font-mono text-xs leading-relaxed text-slate-200 outline-none focus:border-purple-500"
            placeholder={`Enter ${activeFile} instructions...`}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-6 py-3">
          <span className="text-[11px] text-slate-500">
            {injectMemory ? 'Memory injection active' : 'Disabled (Model runs pure base instruct)'}
          </span>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{saved ? 'Saved to Vault' : 'Save Memory'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
