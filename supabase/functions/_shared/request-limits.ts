import { adminClient } from './auth.ts';
import { HttpError } from './http.ts';

export async function readBodyText(req: Request, maximum = 32768): Promise<string> {
  if (Number(req.headers.get('content-length')) > maximum) throw new HttpError('Request too large', 413, 'body_too_large');
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError('Request body required', 400, 'invalid_body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maximum) { await reader.cancel(); throw new HttpError('Request too large', 413, 'body_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}

export async function rateLimit(scope: string, identity: string, limit: number, seconds: number): Promise<void> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await adminClient().rpc('consume_request_limit', { p_key: `${scope}:${key}`, p_limit: limit, p_seconds: seconds });
  if (error) throw new HttpError('Service temporarily unavailable', 503, 'rate_limit_unavailable');
  if (!data) throw new HttpError('Too many requests. Please try again later.', 429, 'rate_limited');
}
