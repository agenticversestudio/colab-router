import { create } from 'zustand';
import { db } from '../db';
import type { Conversation, Message } from '../types';
import { streamChatCompletion } from '../services/sse';
import { executeClientMCP } from '../services/mcpRunner';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  abortController: AbortController | null;
  selectedModel: string;
  selectedPersonaPrompt: string;
  injectMemory: boolean;
  temperature: number;
  searchQuery: string;
  streamingMessageId: string | null;
  streamingContent: string;
  streamingReasoning: string;

  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: (title?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  clearActiveConversation: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  setSelectedModel: (model: string) => void;
  setSelectedPersonaPrompt: (prompt: string) => void;
  setInjectMemory: (enabled: boolean) => void;
  setTemperature: (temp: number) => void;
  setSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  abortController: null,
  selectedModel: 'qwen3.8-27b-uncensored',
  selectedPersonaPrompt: '',
  injectMemory: false,
  temperature: 0.6,
  searchQuery: '',
  streamingMessageId: null,
  streamingContent: '',
  streamingReasoning: '',

  loadConversations: async () => {
    const list = await db.conversations.orderBy('updatedAt').reverse().toArray();
    set({ conversations: list });
    if (list.length > 0 && !get().activeConversationId) {
      get().selectConversation(list[0].id);
    }
  },

  selectConversation: async (id: string) => {
    set({ activeConversationId: id, isLoading: true });
    const msgs = await db.messages.where('conversationId').equals(id).sortBy('createdAt');
    set({ messages: msgs, isLoading: false });
  },

  createConversation: async (title = 'New Sovereign Session') => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newConv: Conversation = {
      id,
      title,
      model: get().selectedModel,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.conversations.add(newConv);
    await get().loadConversations();
    await get().selectConversation(id);
    return id;
  },

  deleteConversation: async (id: string) => {
    await db.conversations.delete(id);
    await db.messages.where('conversationId').equals(id).delete();
    const remaining = get().conversations.filter(c => c.id !== id);
    set({ conversations: remaining });
    if (get().activeConversationId === id) {
      if (remaining.length > 0) {
        get().selectConversation(remaining[0].id);
      } else {
        set({ activeConversationId: null, messages: [] });
      }
    }
  },

  clearActiveConversation: async () => {
    const activeId = get().activeConversationId;
    if (!activeId) return;
    await db.messages.where('conversationId').equals(activeId).delete();
    set({ messages: [] });
  },

  sendMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || get().isStreaming) return;

    let convId = get().activeConversationId;
    if (!convId) {
      const preview = trimmed.slice(0, 32).replace(/\n/g, ' ');
      convId = await get().createConversation(preview);
    } else {
      const existing = get().messages;
      if (existing.length === 0) {
        const preview = trimmed.slice(0, 32).replace(/\n/g, ' ');
        await db.conversations.update(convId, { title: preview, updatedAt: Date.now() });
        get().loadConversations();
      }
    }

    const userMsgId = `msg_user_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      conversationId: convId,
      role: 'user',
      content: trimmed,
      createdAt: Date.now()
    };

    // Save user message to Dexie
    await db.messages.add(userMsg);
    set(state => ({ messages: [...state.messages, userMsg] }));

    // Check for Client MCP Tools execution (/image, /search, /calc, /video, /tools)
    const mcpResponse = await executeClientMCP(trimmed, convId);
    if (mcpResponse) {
      await db.messages.add(mcpResponse);
      await db.conversations.update(convId, { updatedAt: Date.now() });
      set(state => ({ messages: [...state.messages, mcpResponse] }));
      get().loadConversations();
      return;
    }

    // Prepare assistant message placeholder
    const assistantMsgId = `msg_ast_${Date.now()}`;
    const controller = new AbortController();

    set({
      isStreaming: true,
      abortController: controller,
      streamingMessageId: assistantMsgId,
      streamingContent: '',
      streamingReasoning: ''
    });

    // Build payload messages with PURE Base model defaults
    const currentHistory = get().messages;
    const historyPayload = currentHistory.map(m => ({
      role: m.role,
      content: m.content
    }));

    // System prompt is dynamically assembled with persona, memory, and active MCP servers
    const systemParts: string[] = [];
    if (get().selectedPersonaPrompt) {
      systemParts.push(get().selectedPersonaPrompt);
    }

    if (get().injectMemory) {
      const memoryFiles = await db.memory.toArray();
      if (memoryFiles.length > 0) {
        systemParts.push(memoryFiles.map(m => `[${m.filename}]:\n${m.content}`).join('\n\n'));
      }
    }

    // Inject active MCP tools into system prompt
    try {
      const mcpServers = await db.mcpServers.filter(s => s.enabled).toArray();
      if (mcpServers.length > 0) {
        const toolsList = mcpServers.map(s => `- ${s.name} (${s.category}): tools [${s.tools.join(', ')}]`).join('\n');
        systemParts.push(`[Active Connected MCP Tools on Workstation]:\n${toolsList}\nYou can instruct the user to use /image, /search, /calc, /video, or /tools to run tools directly.`);
      }
    } catch {
      // ignore
    }

    if (systemParts.length > 0) {
      historyPayload.unshift({
        role: 'system',
        content: systemParts.join('\n\n')
      });
    }

    let finalContent = '';
    let finalReasoning = '';

    await streamChatCompletion(
      historyPayload,
      get().selectedModel,
      {
        onChunk: (contentChunk, reasoningChunk) => {
          if (contentChunk) {
            finalContent += contentChunk;
          }
          if (reasoningChunk) {
            finalReasoning += reasoningChunk;
          }
          set({
            streamingContent: finalContent,
            streamingReasoning: finalReasoning
          });
        },
        onMetrics: async (metrics) => {
          const assistantMsg: Message = {
            id: assistantMsgId,
            conversationId: convId!,
            role: 'assistant',
            content: finalContent || '*(Completed)*',
            reasoningContent: finalReasoning || undefined,
            createdAt: Date.now(),
            tokensPerSec: metrics.tokensPerSec,
            ttftMs: metrics.ttftMs,
            totalDurationMs: metrics.totalDurationMs
          };
          await db.messages.add(assistantMsg);
          await db.conversations.update(convId!, { updatedAt: Date.now() });

          set(state => ({
            messages: [...state.messages, assistantMsg],
            isStreaming: false,
            abortController: null,
            streamingMessageId: null,
            streamingContent: '',
            streamingReasoning: ''
          }));
          get().loadConversations();
        },
        onError: async (errMsg) => {
          const errorMsg: Message = {
            id: assistantMsgId,
            conversationId: convId!,
            role: 'assistant',
            content: `⚠️ **Inference Gateway Notice:**\n${errMsg}`,
            createdAt: Date.now()
          };
          await db.messages.add(errorMsg);
          set(state => ({
            messages: [...state.messages, errorMsg],
            isStreaming: false,
            abortController: null,
            streamingMessageId: null,
            streamingContent: '',
            streamingReasoning: ''
          }));
        },
        onFinish: () => {
          set({
            isStreaming: false,
            abortController: null
          });
        }
      },
      controller.signal,
      get().temperature
    );
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({
        isStreaming: false,
        abortController: null
      });
    }
  },

  setSelectedModel: (model: string) => set({ selectedModel: model }),
  setSelectedPersonaPrompt: (prompt: string) => set({ selectedPersonaPrompt: prompt }),
  setInjectMemory: (enabled: boolean) => set({ injectMemory: enabled }),
  setTemperature: (temp: number) => set({ temperature: temp }),
  setSearchQuery: (query: string) => set({ searchQuery: query })
}));
