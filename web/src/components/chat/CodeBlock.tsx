import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode } from 'lucide-react';

interface Props {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<Props> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const displayLang = (language || 'text').toLowerCase();
  const isTerminal = ['sh', 'bash', 'zsh', 'cmd', 'powershell', 'shell'].includes(displayLang);

  return (
    <div className="my-3.5 overflow-hidden rounded-xl border border-white/10 bg-[#070B12] shadow-xl font-mono">
      {/* IDE Window Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0F1626] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          {isTerminal ? (
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
          ) : (
            <FileCode className="h-3.5 w-3.5 text-purple-400" />
          )}
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            {displayLang}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            {code.split('\n').length} lines
          </span>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white transition active:scale-95 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-slate-400" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content with Horizontal Scroll */}
      <div className="p-4 overflow-x-auto text-[12.5px] sm:text-[13px] leading-relaxed text-slate-200 scrollbar-thin">
        <pre className="font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
