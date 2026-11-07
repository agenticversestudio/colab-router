import Dexie, { type Table } from 'dexie';
import type { Conversation, Message, HermesMemory, Persona, MCPTool } from '../types';

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  transport: 'streamableHttp' | 'sse' | 'rest';
  apiKey?: string;
  enabled: boolean;
  category: 'Image & Video' | 'Developer' | 'Search & Web' | 'System';
  tools: string[];
}

export class AgenticStudioDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  memory!: Table<HermesMemory, string>;
  personas!: Table<Persona, string>;
  mcpTools!: Table<MCPTool, string>;
  mcpServers!: Table<MCPServerConfig, string>;

  constructor() {
    super('AgenticStudioDB');
    this.version(2).stores({
      conversations: 'id, title, model, createdAt, updatedAt, pinned',
      messages: 'id, conversationId, role, createdAt',
      memory: 'id, filename, updatedAt',
      personas: 'id, name, isDefault, createdAt',
      mcpTools: 'id, name, enabled, type',
      mcpServers: 'id, name, category, enabled'
    });
  }
}

export const db = new AgenticStudioDatabase();

// Standard Presets for MCP Servers & Tools
export const POCKETSTRIKE_MCP_PRESETS: MCPServerConfig[] = [
  {
    id: 'ai_image_gen',
    name: 'AI Image Generator (Flux / SDXL)',
    description: 'High-speed image synthesis from natural language prompts using direct neural image pipeline.',
    url: 'https://image.pollinations.ai/prompt',
    transport: 'rest',
    enabled: true,
    category: 'Image & Video',
    tools: ['generate_image', 'edit_image', 'upscale_image']
  },
  {
    id: 'ai_video_gen',
    name: 'AI Video Synthesizer (Motion Canvas)',
    description: 'Text-to-video prompt generator and frame sequence rendering engine.',
    url: 'https://api.smithery.ai/mcp/v1/video-canvas',
    transport: 'streamableHttp',
    enabled: true,
    category: 'Image & Video',
    tools: ['generate_video_prompt', 'render_motion_preview']
  },
  {
    id: 'github_explorer',
    name: 'GitHub Code & Repositories',
    description: 'Directly search GitHub repos, inspect commit trees, read issues, pull requests, and source files.',
    url: 'https://api.smithery.ai/mcp/v1/github',
    transport: 'streamableHttp',
    enabled: true,
    category: 'Developer',
    tools: ['search_repositories', 'get_file_contents', 'list_commits', 'create_issue']
  },
  {
    id: 'brave_search',
    name: 'Live Web & News Search',
    description: 'Real-time global search, site indexing, and news scraping API.',
    url: 'https://api.smithery.ai/mcp/v1/brave-search',
    transport: 'streamableHttp',
    enabled: true,
    category: 'Search & Web',
    tools: ['web_search', 'search_news', 'extract_webpage']
  },
  {
    id: 'fastmcp_calc',
    name: 'FastMCP Cloud Calculator',
    description: 'Cloud arithmetic, math expression solver, statistics and data matrix operations.',
    url: 'https://bizarre-gold-antelope.fastmcp.app/mcp',
    transport: 'streamableHttp',
    enabled: true,
    category: 'System',
    tools: ['evaluate_math', 'solve_equation', 'matrix_calc']
  },
  {
    id: 'puppeteer_browser',
    name: 'Puppeteer Headless Automation',
    description: 'Render JavaScript single-page apps, take full-page screenshots, and extract dynamic DOM.',
    url: 'https://api.smithery.ai/mcp/v1/puppeteer',
    transport: 'streamableHttp',
    enabled: false,
    category: 'Developer',
    tools: ['navigate_page', 'capture_screenshot', 'click_selector', 'evaluate_script']
  }
];

export async function seedInitialData() {
  // Always sanitize memory so old forced greetings never persist in browser IndexedDB
  await db.memory.put({
    id: 'user_md',
    filename: 'USER.md',
    content: `# WORKSPACE CONTEXT
- Target: Autonomous Engineering & Software Architecture
- Style: Direct, technical, highly detailed code with zero fluff
- Compute: Full reasoning step-by-step unconstrained`,
    updatedAt: Date.now()
  });

  await db.memory.put({
    id: 'memory_md',
    filename: 'MEMORY.md',
    content: `# SYSTEM ARCHITECTURE DIRECTIVES
- Client State: 100% IndexedDB persistence (Zero Server Writes)
- Remote Engine: Pure base inference stream over Tesla T4 GPU
- Model: Qwen 3.8 27B / DeepSeek / GLM`,
    updatedAt: Date.now()
  });

  // Seed Personas
  const personaCount = await db.personas.count();
  if (personaCount === 0) {
    await db.personas.bulkAdd([
      {
        id: 'sovereign_base',
        name: 'Pure Base Model (Unconstrained / No Persona)',
        description: 'Raw compute power without canned greetings, personality quirks, or tone filters.',
        systemPrompt: '',
        avatar: 'cpu',
        isDefault: true,
        createdAt: Date.now()
      },
      {
        id: 'staff_architect',
        name: 'Staff Systems Architect',
        description: 'Elite software engineer focusing on systems design, performance, and clean code.',
        systemPrompt: 'You are a Staff Software Engineer & Systems Architect. Provide precise, production-grade solutions, architectural diagrams, and performant code without conversational filler.',
        avatar: 'terminal',
        createdAt: Date.now()
      },
      {
        id: 'deep_reasoner',
        name: 'Deep Scientific Reasoner',
        description: 'Step-by-step rigorous logical deduction for mathematics and complex engineering.',
        systemPrompt: 'You are a scientific deduction engine. Think through the prompt thoroughly step-by-step and show your complete logical path.',
        avatar: 'brain',
        createdAt: Date.now()
      }
    ]);
  }

  // Seed PocketStrike MCP Servers
  const mcpServerCount = await db.mcpServers.count();
  if (mcpServerCount === 0) {
    await db.mcpServers.bulkAdd(POCKETSTRIKE_MCP_PRESETS);
  }
}
