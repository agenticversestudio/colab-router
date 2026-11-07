import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface Props {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<Props> = ({ content, isStreaming = false }) => {
  return (
    <div className="markdown-body text-slate-200 text-[14px] sm:text-[15px] leading-relaxed break-words space-y-3 font-sans selection:bg-blue-500/30">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white mt-5 mb-2.5 pb-2 border-b border-white/10 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white mt-4 mb-2 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base md:text-lg font-semibold tracking-tight text-slate-100 mt-3.5 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-200 mt-3 mb-1 uppercase tracking-wider">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-[14px] sm:text-[15px] leading-relaxed text-slate-200 mb-2.5 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 my-2.5 text-[14px] sm:text-[15px] text-slate-200 marker:text-blue-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 sm:pl-6 space-y-1.5 my-2.5 text-[14px] sm:text-[15px] text-slate-200 marker:text-blue-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 text-slate-200">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-300">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-3 border-blue-500 bg-blue-500/10 px-4 py-2.5 rounded-r-xl text-slate-300 italic text-[13px] sm:text-[14px] leading-relaxed">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3.5 w-full overflow-x-auto rounded-xl border border-white/10 bg-[#090D16] shadow-sm">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#111827] text-slate-200 font-semibold border-b border-white/10 uppercase tracking-wider text-[11px]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-slate-200 border-r border-white/5 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 border-b border-white/5 border-r border-white/5 last:border-r-0 text-slate-300">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-4 border-white/10" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/40 hover:decoration-blue-400 transition break-all font-medium"
            >
              {children}
            </a>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
            }
            return (
              <code
                className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[12px] sm:text-[13px] text-emerald-300 font-medium tracking-tight"
                {...props}
              >
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Blinking Live Studio Cursor when streaming */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle rounded-sm shadow-sm shadow-blue-400/50" />
      )}
    </div>
  );
};
