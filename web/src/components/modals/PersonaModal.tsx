import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Trash2, Cpu, Terminal, Brain, Check } from 'lucide-react';
import { db } from '../../db';
import type { Persona } from '../../types';
import { useChatStore } from '../../store/useChatStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonaModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const { selectedPersonaPrompt, setSelectedPersonaPrompt } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      loadPersonas();
    }
  }, [isOpen]);

  const loadPersonas = async () => {
    const list = await db.personas.toArray();
    setPersonas(list);
  };

  const handleSelectPersona = (prompt: string) => {
    setSelectedPersonaPrompt(prompt);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await db.personas.add({
      id: `persona_${Date.now()}`,
      name: newName.trim(),
      description: 'Custom User Persona',
      systemPrompt: newPrompt.trim(),
      avatar: 'terminal',
      createdAt: Date.now()
    });

    setNewName('');
    setNewPrompt('');
    setShowAddForm(false);
    loadPersonas();
  };

  const handleDelete = async (id: string) => {
    await db.personas.delete(id);
    loadPersonas();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="flex h-[90vh] sm:h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0E1424] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 bg-[#080C14]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Persona Studio</h3>
              <p className="text-[11px] text-slate-400">
                Choose or customize role instructions. Default is Pure Base.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of Personas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {personas.map(p => {
            const isActive = selectedPersonaPrompt === p.systemPrompt;
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-4 text-xs space-y-2 transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-950/20 shadow-md'
                    : 'border-white/10 bg-[#080C14]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      {p.avatar === 'cpu' && <Cpu className="h-3.5 w-3.5" />}
                      {p.avatar === 'terminal' && <Terminal className="h-3.5 w-3.5" />}
                      {p.avatar === 'brain' && <Brain className="h-3.5 w-3.5" />}
                    </div>
                    <span className="font-bold text-white">{p.name}</span>
                    {isActive && (
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectPersona(p.systemPrompt)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {isActive ? 'In Use' : 'Activate'}
                    </button>

                    {!p.isDefault && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-400 text-[11px]">{p.description}</p>
                {p.systemPrompt ? (
                  <div className="rounded-lg bg-black/40 p-2 font-mono text-[10px] text-slate-300">
                    {p.systemPrompt}
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-emerald-400">
                    Direct Model Output • Zero Prompt Injections • Highest Speed
                  </div>
                )}
              </div>
            );
          })}

          {/* New Persona Form */}
          {showAddForm ? (
            <form onSubmit={handleAdd} className="rounded-xl border border-blue-500/30 bg-[#080C14] p-4 space-y-3 text-xs">
              <h4 className="font-semibold text-white">Create New Persona</h4>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Persona Name (e.g. Senior Security Engineer)"
                required
                className="w-full rounded-lg border border-white/10 bg-[#161F36] p-2 text-white outline-none focus:border-blue-500"
              />
              <textarea
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
                placeholder="System Prompt Instructions..."
                rows={3}
                required
                className="w-full rounded-lg border border-white/10 bg-[#161F36] p-2 text-white outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-500"
                >
                  Save Persona
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-3 text-xs text-slate-400 hover:border-blue-500/40 hover:text-white transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Persona</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
