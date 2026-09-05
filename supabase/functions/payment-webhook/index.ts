import { adminClient } from '../_shared/auth.ts';
import { json, options } from '../_shared/http.ts';
import { audit, isPaymentMethod } from '../_shared/payment.ts';

type WebhookBody = {
  eventId?: string;
  eventType?: string;
  entityType?: 'verification_deposit' | 'payout_request';
  entityId?: string;
  status?: 'pending' | 'held' | 'verified' | 'failed' | 'refunded' | 'paid';
};

async function validSignature(request: Request, rawBody: string) {
  const secret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
  const signature = request.headers.get('x-payment-signature');
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return signature.length === expected.length && [...signature].every((char, index) => char === expected[index]);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return options(request);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, request);

  const provider = new URL(request.url).searchParams.get('provider');
  if (!provider || !isPaymentMethod(provider)) return json({ error: 'Unsupported payment provider' }, 400, request);
  const rawBody = await request.text();
  if (!(await validSignature(request, rawBody))) return json({ error: 'Invalid webhook signature' }, 401, request);

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, request);
  }
  if (!body.eventId || !body.eventType || !body.entityId || !body.entityType || !body.status) {
    return json({ error: 'eventId, eventType, entityId, entityType, and status are required' }, 400, request);
  }

  const supabase = adminClient();
  const { error: eventError } = await supabase.from('payment_provider_events').insert({
    provider,
    event_id: body.eventId,
    event_type: body.eventType,
    payload: { entityType: body.entityType, entityId: body.entityId, status: body.status },
  });
  if (eventError?.code === '23505') return json({ accepted: true, duplicate: true }, 200, request);
  if (eventError) return json({ error: eventError.message }, 500, request);

  if (body.entityType === 'verification_deposit') {
    const { data: deposit, error } = await supabase.from('verification_deposits').select('id, user_id, payout_account_id').eq('id', body.entityId).single();
    if (error || !deposit) return json({ error: 'Verification deposit not found' }, 404, request);
    const verified = body.status === 'verified';
    const { error: updateError } = await supabase.from('verification_deposits').update({ status: body.status, verified_at: verified ? new Date().toISOString() : null }).eq('id', body.entityId);
    if (updateError) return json({ error: updateError.message }, 500, request);
    if (verified) {
      await supabase.from('profiles').update({ payment_verification_status: 'deposit_pending' }).eq('id', deposit.user_id);
    }
    await audit(supabase, { userId: deposit.user_id, eventType: `verification_${body.status}`, entityType: 'verification_deposit', entityId: deposit.id, metadata: { provider, eventId: body.eventId } });
  } else {
    const { data: payout, error } = await supabase.from('payout_requests').select('id, user_id').eq('id', body.entityId).single();
    if (error || !payout) return json({ error: 'Payout request not found' }, 404, request);
    const { error: updateError } = await supabase.from('payout_requests').update({ status: body.status, paid_at: body.status === 'paid' ? new Date().toISOString() : null }).eq('id', body.entityId);
    if (updateError) return json({ error: updateError.message }, 500, request);
    await audit(supabase, { userId: payout.user_id, eventType: `payout_${body.status}`, entityType: 'payout_request', entityId: payout.id, metadata: { provider, eventId: body.eventId } });
  }

  return json({ accepted: true }, 200, request);
});
