/**
 * Same-origin proxy for cloud model APIs (DeepSeek / Z.ai GLM / OpenRouter).
 * Why: many provider APIs don't send CORS headers, so the browser can't call them directly.
 * The user's own API key comes in the Authorization header and is passed straight through;
 * nothing is stored or logged here. Only the hosts below are allowed (not an open proxy).
 */
export const config = { runtime: 'edge' };

const ALLOWED_HOSTS = new Set([
  'api.deepseek.com',
  'api.z.ai',
  'open.bigmodel.cn',
  'openrouter.ai'
]);

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return jsonError(405, 'Use POST');

  const base = (req.headers.get('x-target-base') || '').trim().replace(/\/+$/, '');
  let target: URL;
  try {
    target = new URL(`${base}/chat/completions`);
  } catch {
    return jsonError(400, 'Invalid base URL');
  }
  if (target.protocol !== 'https:') return jsonError(400, 'Base URL must start with https://');
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return jsonError(400, `Base URL host not allowed: ${target.hostname}`);
  }

  const auth = req.headers.get('authorization');
  if (!auth) return jsonError(401, 'API key missing');

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth, Accept: 'text/event-stream' },
      body: await req.text()
    });
  } catch (e) {
    return jsonError(502, `Could not reach ${target.hostname}: ${e instanceof Error ? e.message : 'network error'}`);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no'
    }
  });
}
