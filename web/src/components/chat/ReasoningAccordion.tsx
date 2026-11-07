import React, { useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown, ChevronRight, Loader2, Copy, Check } from 'lucide-react';

interface Props {
  reasoning: string;
  isStreaming?: boolean;
}

export const ReasoningAccordion: React.FC<Props> = ({ reasoning, isStreaming = false }) => {
  const [isExpanded, setIsExpanded] = useState(isStreaming);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside reasoning during streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reasoning, isStreaming, isExpanded]);

  if (!reasoning && !isStreaming) return null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(reasoning);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const wordCount = reasoning.split(/\s+/).filter(Boolean).length;

  return (
    <div className="mb-3.5 overflow-hidden rounded-xl border border-purple-500/20 bg-purple-950/20 text-xs shadow-md transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left font-medium text-purple-300 hover:bg-purple-900/20 transition cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400 shrink-0" />
          ) : (
            <Brain className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          )}
          <span className="font-semibold text-purple-200">
            {isStreaming ? 'Reasoning stream active...' : 'Reasoning Process'}
          </span>
          <span className="rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-500/30">
            ~{wordCount} tokens
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Reasoning */}
          {!isStreaming && reasoning && (
            <button
              onClick={handleCopy}
              title="Copy Reasoning Trace"
              className="rounded p-1 text-purple-400 hover:bg-purple-500/20 hover:text-white transition"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          )}

          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-purple-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
          )}
        </div>
      </div>

      {/* Reasoning Body */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="border-t border-purple-500/10 bg-black/40 px-3.5 py-3 font-mono text-[11.5px] leading-relaxed text-purple-200/90 whitespace-pre-wrap max-h-72 overflow-y-auto selection:bg-purple-500/40"
        >
          {reasoning}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3.5 ml-1 bg-purple-400 animate-pulse align-middle" />
          )}
        </div>
      )}
    </div>
  );
};
