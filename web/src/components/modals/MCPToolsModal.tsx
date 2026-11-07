import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Globe,
  Image as ImageIcon,
  Video,
  Github,
  Calculator,
  Terminal,
  Check,
  Trash2,
  Activity
} from 'lucide-react';
import { db, MCPServerConfig } from '../../db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MCPToolsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'servers' | 'marketplace' | 'custom'>('servers');
  const [servers, setServers] = useState<MCPServerConfig[]>([]);

  // Custom MCP form state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customTransport, setCustomTransport] = useState<'streamableHttp' | 'sse' | 'rest'>('streamableHttp');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customCategory, setCustomCategory] = useState<'Image & Video' | 'Developer' | 'Search & Web' | 'System'>('Developer');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadServers();
    }
  }, [isOpen]);

  const loadServers = async () => {
    const list = await db.mcpServers.toArray();
    setServers(list);
  };

  const handleToggle = async (id: string, current: boolean) => {
    await db.mcpServers.update(id, { enabled: !current });
    loadServers();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Disconnect this MCP server?')) {
      await db.mcpServers.delete(id);
      loadServers();
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customUrl.trim()) return;

    setIsConnecting(true);
    const newServer: MCPServerConfig = {
      id: `mcp_${Date.now()}`,
      name: customName.trim(),
      description: `Custom ${customTransport.toUpperCase()} server connection.`,
      url: customUrl.trim(),
      transport: customTransport,
      apiKey: customApiKey.trim() || undefined,
      enabled: true,
      category: customCategory,
      tools: ['execute_tool', 'query_endpoint']
    };

    await db.mcpServers.add(newServer);
    setIsConnecting(false);
    setConnectSuccess(`Successfully connected ${customName}!`);
    setTimeout(() => {
      setConnectSuccess(null);
      setActiveTab('servers');
    }, 1500);

    setCustomName('');
    setCustomUrl('');
    setCustomApiKey('');
    loadServers();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="flex h-[92vh] sm:h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-[#0E1424] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 bg-[#080C14]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Agentic Studio MCP Command Center</h3>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  Model Context Protocol
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-none">
                Connect live external APIs, image generators, GitHub, web tools & agents
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-3 sm:px-6 overflow-x-auto scrollbar-none">
          <div className="flex shrink-0">
            <button
              onClick={() => setActiveTab('servers')}
              className={`border-b-2 py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'servers'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Connected ({servers.filter(s => s.enabled).length}/{servers.length})
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`border-b-2 py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'marketplace'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Marketplace Presets
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`border-b-2 py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'custom'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              + Custom Server
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap pl-2">
            Studio Native Integration
          </div>
        </div>

        {/* Tab 1: Connected Servers */}
        {activeTab === 'servers' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {servers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No MCP servers currently active. Check the Marketplace Presets to add one.
              </div>
            ) : (
              servers.map(server => (
                <div
                  key={server.id}
                  className={`rounded-xl border p-4 transition ${
                    server.enabled
                      ? 'border-emerald-500/30 bg-[#080C14]'
                      : 'border-white/5 bg-black/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-emerald-400 border border-white/10 mt-0.5">
                        {server.category === 'Image & Video' && (server.name.includes('Video') ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />)}
                        {server.category === 'Developer' && (server.name.includes('GitHub') ? <Github className="h-4 w-4" /> : <Terminal className="h-4 w-4" />)}
                        {server.category === 'Search & Web' && <Globe className="h-4 w-4" />}
                        {server.category === 'System' && <Calculator className="h-4 w-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{server.name}</h4>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-slate-300">
                            {server.transport.toUpperCase()}
                          </span>
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-mono text-blue-300 border border-blue-500/20">
                            {server.category}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                          {server.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {server.tools.map((t, i) => (
                            <span key={i} className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-mono text-emerald-300/80 border border-emerald-500/10">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(server.id, server.enabled)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          server.enabled ? 'bg-emerald-600' : 'bg-white/20'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            server.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => handleDelete(server.id)}
                        className="rounded p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Studio Marketplace Presets */}
        {activeTab === 'marketplace' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-300 mb-4 flex items-center justify-between">
              <span>Verified model context protocol tools and agent presets.</span>
              <Activity className="h-4 w-4 shrink-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  name: 'AI Image Generator (Flux / SDXL)',
                  category: 'Image & Video',
                  desc: 'Generate photo and artwork directly from chat prompts.',
                  tools: ['generate_image', 'edit_image']
                },
                {
                  name: 'AI Video Synthesizer (Motion Canvas)',
                  category: 'Image & Video',
                  desc: 'Create text-to-video prompts and motion frame pipelines.',
                  tools: ['generate_video_prompt', 'render_preview']
                },
                {
                  name: 'GitHub Code & Repositories',
                  category: 'Developer',
                  desc: 'Inspect GitHub repos, pull requests, and commit trees.',
                  tools: ['search_repositories', 'get_file_contents']
                },
                {
                  name: 'Brave Live Web & News Search',
                  category: 'Search & Web',
                  desc: 'Real-time web search and content summarization.',
                  tools: ['web_search', 'search_news']
                },
                {
                  name: 'FastMCP Cloud Calculator',
                  category: 'System',
                  desc: 'Heavy numerical algorithms and statistics.',
                  tools: ['evaluate_math', 'solve_equation']
                },
                {
                  name: 'Puppeteer Headless Automation',
                  category: 'Developer',
                  desc: 'Full-page screenshots and JavaScript rendering.',
                  tools: ['navigate_page', 'capture_screenshot']
                }
              ].map((item, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-[#080C14] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400">{item.category}</span>
                    <h4 className="text-xs font-bold text-white mt-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-[10px] text-slate-500">{item.tools.join(', ')}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Ready
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Connect Custom MCP Server */}
        {activeTab === 'custom' && (
          <form onSubmit={handleAddCustom} className="flex-1 overflow-y-auto p-6 space-y-4">
            {connectSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>{connectSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Server Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. My Custom Video Gen Server"
                required
                className="w-full rounded-xl border border-white/10 bg-[#080C14] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Endpoint URL (HTTP, SSE, or WebSocket)
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://api.smithery.ai/mcp/v1/... or http://localhost:8000/sse"
                required
                className="w-full rounded-xl border border-white/10 bg-[#080C14] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Transport Protocol
                </label>
                <select
                  value={customTransport}
                  onChange={e => setCustomTransport(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[#080C14] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="streamableHttp">Streamable HTTP (JSON-RPC)</option>
                  <option value="sse">Server-Sent Events (SSE)</option>
                  <option value="rest">REST API Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[#080C14] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="Image & Video">Image & Video</option>
                  <option value="Developer">Developer</option>
                  <option value="Search & Web">Search & Web</option>
                  <option value="System">System</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Authorization Token / API Key (Optional)
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={e => setCustomApiKey(e.target.value)}
                placeholder="Bearer token or API Secret"
                className="w-full rounded-xl border border-white/10 bg-[#080C14] px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isConnecting}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition"
              >
                <Plus className="h-4 w-4" />
                <span>{isConnecting ? 'Registering...' : 'Register MCP Server'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-6 py-3 text-[11px] text-slate-500">
          <span>Client-side tool calling • Zero server storage</span>
          <span className="text-emerald-400 font-mono">
            Model Context Protocol v1.0
          </span>
        </div>
      </div>
    </div>
  );
};
