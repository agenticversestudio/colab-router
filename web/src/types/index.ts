export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  createdAt: number;
  tokensPerSec?: number;
  ttftMs?: number;
  totalDurationMs?: number;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
  pinned?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar: string;
  isDefault?: boolean;
  createdAt: number;
}

export interface HermesMemory {
  id: string;
  filename: 'USER.md' | 'MEMORY.md';
  content: string;
  updatedAt: number;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'web_search' | 'math' | 'code_eval' | 'custom';
}

export interface TelemetryData {
  status: 'online' | 'offline' | 'connecting';
  gpuName: string;
  vramUsedMb: number;
  vramTotalMb: number;
  gpuUtilization: number;
  pingMs: number;
  activeModel: string;
  activeShift: string;
  shiftHoursLeft: number;
  lastUpdated: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  userId: string;
  passkey: string;
  apiKey: string;
  baseUrl: string;
}
