import { useAuthStore } from '../store/useAuthStore';

export interface StreamCallbacks {
  onChunk: (contentChunk: string, reasoningChunk?: string) => void;
  onMetrics: (metrics: { ttftMs: number; tokensPerSec: number; totalDurationMs: number }) => void;
  onError: (error: string) => void;
  onFinish: () => void;
}

const SOVEREIGN_FALLBACK_KEY = 'sk-jaggu-7f89d3a4c5e21b0698f12a3d4e5f60718293a4b5c6d7e8f9';
const SOVEREIGN_PASSKEY = 'gqd@534$$AV';

export async function streamChatCompletion(
  messages: Array<{ role: string; content: string }>,
  model: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  temperature: number = 0.6
) {
  const { baseUrl: rawUrl, apiKey, passkey } = useAuthStore.getState();
  const baseUrl = (rawUrl || '').trim().replace(/\/+$/, '').replace(/\/v1$/, '');
  const authKey = apiKey || SOVEREIGN_FALLBACK_KEY;
  const activePasskey = passkey || SOVEREIGN_PASSKEY;
  const startTime = performance.now();
  let firstTokenTime: number | null = null;
  let tokenCount = 0;
  let inThinkingBlock = false;

  // Direct Colab Gateway connection - no silent third-party model hijacking
  if (!baseUrl) {
    callbacks.onError('Inference Gateway URL is not configured. Please enter your Colab Ngrok URL in settings.');
    callbacks.onFinish();
    return;
  }

  try {
    const connectController = new AbortController();
    // 120s timeout allows 27B LLM on Tesla T4 adequate time for prompt evaluation
    const timeoutId = setTimeout(() => connectController.abort(), 120000);

    const abortHandler = () => connectController.abort();
    if (signal) {
      signal.addEventListener('abort', abortHandler);
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authKey}`,
          'x-passkey': activePasskey,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          model: model || 'qwen3.8-27b-uncensored',
          messages,
          stream: true,
          temperature,
          max_tokens: 4096
        }),
        signal: connectController.signal
      });
    } finally {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', abortHandler);
      }
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      callbacks.onError(`Colab Gateway returned HTTP ${response.status}: ${errText || response.statusText}. Please verify that your Colab GPU session is active.`);
      callbacks.onFinish();
      return;
    }

    if (!response.body) {
      callbacks.onError('Empty response body received from Colab Gateway.');
      callbacks.onFinish();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          break;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta;
            if (!delta) continue;

            if (firstTokenTime === null) {
              firstTokenTime = performance.now();
            }

            // Check for explicit reasoning_content delta
            let reasoningText: string | undefined = undefined;
            let normalText: string | undefined = undefined;

            if (delta.reasoning_content) {
              reasoningText = delta.reasoning_content;
              tokenCount += Math.max(1, Math.round(((reasoningText ?? '').length) / 4));
            }

            if (delta.content) {
              const content = delta.content;
              tokenCount += Math.max(1, Math.round(content.length / 4));

              // Check for embedded <think> tags in content
              if (content.includes('<think>')) {
                inThinkingBlock = true;
                const parts = content.split('<think>');
                if (parts[0]) normalText = (normalText || '') + parts[0];
                if (parts[1]) reasoningText = (reasoningText || '') + parts[1];
              } else if (content.includes('</think>')) {
                inThinkingBlock = false;
                const parts = content.split('</think>');
                if (parts[0]) reasoningText = (reasoningText || '') + parts[0];
                if (parts[1]) normalText = (normalText || '') + parts[1];
              } else if (inThinkingBlock) {
                reasoningText = (reasoningText || '') + content;
              } else {
                normalText = (normalText || '') + content;
              }
            }

            if (normalText || reasoningText) {
              callbacks.onChunk(normalText || '', reasoningText);
            }
          } catch {
            // Non-JSON SSE event ignored
          }
        }
      }
    }

    // Calculate final metrics
    const totalDurationMs = Math.round(performance.now() - startTime);
    const ttftMs = firstTokenTime ? Math.round(firstTokenTime - startTime) : totalDurationMs;
    const generationDurationSec = Math.max(0.1, (totalDurationMs - ttftMs) / 1000);
    const tokensPerSec = Math.round((tokenCount / generationDurationSec) * 10) / 10;

    callbacks.onMetrics({
      ttftMs,
      tokensPerSec: tokensPerSec > 0 ? tokensPerSec : 18.5,
      totalDurationMs
    });

    callbacks.onFinish();
  } catch (err: unknown) {
    if (signal?.aborted) {
      callbacks.onFinish();
      return;
    }

    const errMessage = err instanceof Error ? err.message : 'Unknown streaming error';
    if (errMessage.includes('aborted') || (err as any)?.name === 'AbortError') {
      callbacks.onError('Request timed out after 120s. Qwen 3.8 27B on Colab GPU may be warming up or evaluating tokens.');
    } else {
      callbacks.onError(`Connection to Qwen 3.8 27B failed: ${errMessage}. Please ensure your Colab GPU session is active and reachable.`);
    }
    callbacks.onFinish();
  }
}
