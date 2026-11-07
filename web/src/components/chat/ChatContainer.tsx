import React, { useEffect, useRef } from 'react';
import { Sparkles, Terminal, Code2, Brain } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { ChatMessage } from './ChatMessage';
import { ChatDock } from './ChatDock';

export const ChatContainer: React.FC = () => {
  const {
    messages,
    isStreaming,
    streamingContent,
    streamingReasoning,
    sendMessage
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as tokens stream in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, streamingReasoning]);

  const starterPrompts = [
    {
      title: 'Deep Architecture Analysis',
      prompt: 'Design a high-throughput, low-latency streaming pipeline using Redis pub/sub and FastAPI with zero packet loss.',
      icon: Terminal
    },
    {
      title: 'Algorithm Optimization',
      prompt: 'Write an optimized topological sort algorithm in TypeScript with full cycle detection and recovery.',
      icon: Code2
    },
    {
      title: 'Uncensored Problem Solving',
      prompt: 'Solve step-by-step with mathematical proof: In a group of 23 people, what is the exact probability of a birthday collision?',
      icon: Brain
    }
  ];

  return (
    <div className="flex h-full w-full flex-col min-h-0 overflow-hidden bg-[#080C14]">
      {/* Scrollable Message List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-2 py-3 sm:px-4 md:px-8 scroll-smooth"
      >
        <div className="mx-auto max-w-4xl space-y-3 pb-4">
          {messages.length === 0 && !isStreaming ? (
            /* Empty State Hero - Studio Quality */
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-3">
              <div className="relative mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-2xl shadow-blue-500/10">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Agentic Studio Sovereign AI
              </h2>
              <p className="mt-2.5 max-w-md text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tesla T4 16GB GPU VRAM Offloaded. Full unconstrained reasoning, live token telemetry, and zero third-party data retention.
              </p>

              {/* Starter Quick Actions Grid */}
              <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 text-left">
                {starterPrompts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendMessage(item.prompt)}
                      className="flex flex-col items-start rounded-2xl border border-white/5 bg-[#0D1322] p-3.5 sm:p-4 hover:border-blue-500/40 hover:bg-[#141C30] transition group cursor-pointer active:scale-98 shadow-sm"
                    >
                      <div className="mb-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400 group-hover:scale-105 transition">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition">
                        {item.title}
                      </span>
                      <span className="mt-1 line-clamp-2 text-[11px] text-slate-400 leading-relaxed">
                        {item.prompt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Existing Messages */
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}

          {/* Active Streaming Bubble */}
          {isStreaming && (
            <ChatMessage
              message={{
                id: 'streaming_temp',
                conversationId: 'temp',
                role: 'assistant',
                content: streamingContent,
                reasoningContent: streamingReasoning,
                createdAt: Date.now()
              }}
              isStreaming={true}
            />
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Pinned Bottom Chat Input Dock */}
      <ChatDock />
    </div>
  );
};
