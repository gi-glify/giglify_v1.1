import { adminClient } from '../_shared/auth.ts';
import { errorResponse, HttpError, json, options } from '../_shared/http.ts';
import { isPaymentMethod } from '../_shared/payment.ts';
import { paymentEvent, verifyPaymentEvent, verifyPayoutBridge } from '../_shared/payment-events.ts';
import { readBodyText } from '../_shared/request-limits.ts';

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const provider = new URL(req.url).searchParams.get('provider');
    if (!isPaymentMethod(provider)) throw new HttpError('Unsupported provider', 400, 'invalid_provider');
    const raw = await readBodyText(req, 262144);
    const body = JSON.parse(raw);
    if (body?.entityType === 'payout_request') {
      await verifyPayoutBridge(req, raw);
      if (typeof body.eventId !== 'string' || typeof body.entityId !== 'string' || body.status !== 'paid') throw new HttpError('Invalid payout event', 400, 'invalid_event');
      const { data, error } = await adminClient().rpc('record_reconciled_payout_event', {
        p_provider: provider, p_event_id: body.eventId, p_entity_id: body.entityId,
      });
      if (error) throw error;
      return json({ accepted: true, result: data });
    }
    await verifyPaymentEvent(req, raw, body, provider);
    if (provider === 'paypal' && !['PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.DENIED'].includes(body.event_type)) return json({ accepted: true, ignored: true });
    if (provider === 'paystack' && body.event !== 'charge.success') return json({ accepted: true, ignored: true });
    const event = paymentEvent(provider, body);
    const { data, error } = await adminClient().rpc('apply_verified_payment_event', {
      p_provider: provider, p_event_id: event.id, p_reference: event.reference,
      p_status: event.status, p_amount: event.amount, p_currency: event.currency, p_payload: body,
    });
    if (error) throw error;
    return json({ accepted: true, result: data });
  } catch (error) {
    return errorResponse(error instanceof SyntaxError ? new HttpError('Invalid JSON', 400, 'invalid_json') : error);
  }
});
