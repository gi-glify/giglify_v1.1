import { requireUser } from '../_shared/auth.ts';
import { errorResponse, HttpError, json, options } from '../_shared/http.ts';
import { providerBase, providerToken } from '../_shared/provider-auth.ts';
import { rateLimit, readBodyText } from '../_shared/request-limits.ts';

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { user, db } = await requireUser(req);
    await rateLimit('paypal-capture', user.id, 20, 60);
    const { orderId } = JSON.parse(await readBodyText(req, 2048));
    if (typeof orderId !== 'string' || !/^[A-Z0-9]{10,32}$/.test(orderId)) throw new HttpError('Invalid order', 400, 'invalid_order');
    const { data: attempt, error: attemptError } = await db.from('payment_attempts').select('transaction_id').eq('provider', 'paypal').eq('provider_request_id', orderId).maybeSingle();
    if (attemptError) throw attemptError;
    let kind: 'package' | 'verification';
    let paymentId: string;
    let status: string;
    if (attempt) {
      const { data, error } = await db.from('transactions').select('id,status').eq('id', attempt.transaction_id).eq('user_id', user.id).single();
      if (error || !data) throw new HttpError('Payment not found', 404, 'not_found');
      kind = 'package'; paymentId = data.id; status = data.status;
    } else {
      const { data, error } = await db.from('verification_deposits').select('id,status').eq('method', 'paypal').eq('provider_reference', orderId).eq('user_id', user.id).single();
      if (error || !data) throw new HttpError('Payment not found', 404, 'not_found');
      kind = 'verification'; paymentId = data.id; status = data.status;
    }
    if (['success', 'held', 'verified'].includes(status)) return json({ kind, paymentId, status });
    if (!['created', 'pending', 'processing'].includes(status)) throw new HttpError('Payment is no longer payable', 409, 'invalid_state');
    const headers = { Authorization: `Bearer ${await providerToken('paypal')}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': `capture-${orderId}` };
    const url = `${providerBase('paypal')}/v2/checkout/orders/${orderId}`;
    let response = await fetch(`${url}/capture`, { method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(20000) });
    let body = await response.json();
    if (!response.ok && body.details?.some((detail: any) => detail.issue === 'ORDER_ALREADY_CAPTURED')) {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      body = await response.json();
    }
    if (!response.ok) throw new HttpError('Unable to capture payment. Please try again.', 502, 'capture_failed');
    const capture = body.purchase_units?.[0]?.payments?.captures?.[0];
    if (capture?.status !== 'COMPLETED') return json({ kind, paymentId, status: 'pending' });
    const { error } = await db.rpc('apply_verified_payment_event', {
      p_provider: 'paypal', p_event_id: `capture:${capture.id}`, p_reference: orderId, p_status: 'success',
      p_amount: Number(capture.amount?.value), p_currency: capture.amount?.currency_code, p_payload: body,
    });
    if (error) throw error;
    return json({ kind, paymentId, status: kind === 'package' ? 'success' : 'held' });
  } catch (error) { return errorResponse(error); }
});
