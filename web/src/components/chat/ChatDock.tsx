import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sliders, Paperclip, X } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export const ChatDock: React.FC = () => {
  const [input, setInput] = useState('');
  const [showSliders, setShowSliders] = useState(false);
  const [showContextInput, setShowContextInput] = useState(false);
  const [contextSnippet, setContextSnippet] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isStreaming, sendMessage, stopGeneration, temperature, setTemperature } = useChatStore();

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    let fullMsg = input.trim();
    if (contextSnippet.trim()) {
      fullMsg = `[Attached Context]:\n\`\`\`\n${contextSnippet.trim()}\n\`\`\`\n\n${fullMsg}`;
      setContextSnippet('');
      setShowContextInput(false);
    }
    if (!fullMsg || isStreaming) return;
    sendMessage(fullMsg);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full border-t border-white/10 bg-[#080C14]/95 backdrop-blur-2xl px-2.5 sm:px-4 md:px-6 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-4xl">
        {/* Context Attachment Drawer */}
        {showContextInput && (
          <div className="mb-2.5 rounded-2xl border border-white/10 bg-[#0D1322] p-3 text-xs shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-blue-400" />
                Attach Code / Document / Log Context
              </span>
              <button
                type="button"
                onClick={() => setShowContextInput(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <textarea
              rows={3}
              value={contextSnippet}
              onChange={e => setContextSnippet(e.target.value)}
              placeholder="Paste code snippet, stack trace, or raw data to include with prompt..."
              className="w-full resize-none rounded-xl border border-white/10 bg-black/50 p-2.5 font-mono text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/60 leading-relaxed"
            />
          </div>
        )}

        {/* Model Parameter Drawer Toggle */}
        {showSliders && (
          <div className="mb-2.5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0D1322] px-3.5 py-2.5 text-xs text-slate-300 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-400">Temperature:</span>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-28 sm:w-36 accent-blue-500 cursor-pointer"
              />
              <span className="font-mono text-blue-400 font-bold">{temperature.toFixed(2)}</span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
              Lower = Deterministic Code • Higher = Creative Thinking
            </span>
          </div>
        )}

        {/* Studio Input Pill Container */}
        <div className="flex items-end gap-1.5 sm:gap-2 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0D1322] p-1.5 sm:p-2 shadow-2xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
          {/* Temperature Slider Toggle */}
          <button
            type="button"
            onClick={() => setShowSliders(!showSliders)}
            title="Adjust Model Temperature"
            className={`rounded-xl p-2 sm:p-2.5 transition shrink-0 cursor-pointer ${
              showSliders ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
          </button>

          {/* Attach Context Button */}
          <button
            type="button"
            onClick={() => setShowContextInput(!showContextInput)}
            title="Attach Code / Data Context"
            className={`rounded-xl p-2 sm:p-2.5 transition shrink-0 cursor-pointer ${
              showContextInput ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Auto-expanding Input Area (text-[16px] prevents iOS Safari auto-zoom) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask sovereign model anything... (Shift+Enter for newline)"
            className="max-h-[160px] min-h-[36px] flex-1 resize-none bg-transparent py-1.5 px-2 text-[16px] sm:text-[14px] text-slate-100 placeholder-slate-500 outline-none leading-relaxed font-sans"
          />

          {/* Send / Stop Generation Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={stopGeneration}
              title="Stop Generation"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 active:scale-95 transition cursor-pointer"
            >
              <Square className="h-4 w-4 fill-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() && !contextSnippet.trim()}
              title="Send Message"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 disabled:opacity-30 disabled:hover:bg-blue-600 transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Micro-footer Studio Telemetry */}
        <div className="mt-1.5 flex items-center justify-between px-2 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tesla T4 Online (16GB VRAM)</span>
            </span>
            <span>•</span>
            <span className="text-slate-400">Qwen 3.8 27B Uncensored</span>
          </div>
          <span className="hidden sm:inline text-slate-500">100% Client-Side Privacy</span>
        </div>
      </div>
    </div>
  );
};
