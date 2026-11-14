import React, { useState } from 'react';
import { Copy, Check, User, Sparkles } from 'lucide-react';
import type { Message } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ReasoningAccordion } from './ReasoningAccordion';
import { TokenSpeedBadge } from './TokenSpeedBadge';
import { useProviderConfig, toProviderId } from '../../store/useProviderStore';
import { useChatStore } from '../../store/useChatStore';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<Props> = ({ message, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const liveModel = useChatStore(s => s.selectedModel);
  // Saved replies keep the model that wrote them; old replies (no tag) were Qwen.
  const provider = useProviderConfig(toProviderId(message.model ?? (isStreaming ? liveModel : undefined)));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className={`group flex w-full gap-2.5 sm:gap-3.5 py-3 sm:py-4 px-2 sm:px-4 transition select-text ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Assistant Studio Avatar */}
      {!isUser && (
        <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-950/40 text-blue-400 shadow-sm mt-0.5">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#080C14]" />
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`relative flex flex-col min-w-0 ${
          isUser
            ? 'max-w-[90%] sm:max-w-[80%]'
            : 'w-full max-w-full sm:max-w-[92%]'
        }`}
      >
        {/* Assistant Header Tag */}
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="font-semibold text-slate-200">{provider.shortLabel}</span>
            <span>•</span>
            <span className={provider.kind === 'colab' ? 'text-emerald-400' : 'text-sky-400'}>
              {provider.kind === 'colab' ? 'Tesla T4 16GB' : 'Cloud API'}
            </span>
          </div>
        )}

        {/* Bubble Surface */}
        <div
          className={`rounded-2xl p-3.5 sm:p-4 shadow-md transition ${
            isUser
              ? 'rounded-tr-xs bg-[#1E293B] text-white border border-white/10 ml-auto'
              : 'rounded-tl-xs bg-[#0D1322] text-slate-100 border border-white/10'
          }`}
        >
          {/* Reasoning Trace if present */}
          {message.reasoningContent && (
            <ReasoningAccordion reasoning={message.reasoningContent} isStreaming={isStreaming} />
          )}

          {/* Formatted Markdown Content */}
          {isUser ? (
            <div className="whitespace-pre-wrap text-[14px] sm:text-[15px] leading-relaxed break-words font-sans">
              {message.content}
            </div>
          ) : (
            <div>
              {message.content ? (
                <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
              ) : isStreaming && !message.reasoningContent ? (
                <div className="flex items-center gap-2 py-1 text-xs text-slate-400 italic">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Synthesizing sovereign reasoning...</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Assistant Footer: Token Speed & Copy Action */}
          {!isUser && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2.5">
              <TokenSpeedBadge
                tokensPerSec={message.tokensPerSec}
                ttftMs={message.ttftMs}
                totalDurationMs={message.totalDurationMs}
              />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  title="Copy message"
                  className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/5 px-2 py-1 text-[11px] font-mono text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#151D30] text-slate-300 mt-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
