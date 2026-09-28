import { HttpError } from './http.ts';
import { providerBase, providerToken, requiredSecret } from './provider-auth.ts';
import type { ProviderName } from './provider-requests.ts';

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPayoutBridge(req: Request, raw: string): Promise<void> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(requiredSecret('PAYMENT_WEBHOOK_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const expected = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
  if (!equal(req.headers.get('x-payment-signature') || '', expected)) throw new HttpError('Invalid payout signature', 401, 'invalid_signature');
}

export async function verifyPaymentEvent(req: Request, raw: string, body: any, provider: ProviderName): Promise<void> {
  let valid = false;
  if (provider === 'paystack') {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(requiredSecret('PAYSTACK_SECRET_KEY')), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
    const expected = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    valid = equal(req.headers.get('x-paystack-signature') || '', expected);
  } else if (provider === 'mpesa') {
    valid = equal(new URL(req.url).searchParams.get('callback_secret') || '', requiredSecret('MPESA_CALLBACK_SECRET'));
  } else {
    const response = await fetch(`${providerBase('paypal')}/v1/notifications/verify-webhook-signature`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${await providerToken('paypal')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: req.headers.get('paypal-auth-algo'), cert_url: req.headers.get('paypal-cert-url'),
        transmission_id: req.headers.get('paypal-transmission-id'), transmission_sig: req.headers.get('paypal-transmission-sig'),
        transmission_time: req.headers.get('paypal-transmission-time'), webhook_id: requiredSecret('PAYPAL_WEBHOOK_ID'), webhook_event: body,
      }),
    });
    if (!response.ok) throw new HttpError('Provider verification unavailable', 502, 'provider_unavailable');
    valid = (await response.json()).verification_status === 'SUCCESS';
  }
  if (!valid) throw new HttpError('Invalid callback signature', 401, 'invalid_signature');
}

export type PaymentEvent = { id: string; reference: string; status: 'success' | 'failed' | 'pending'; amount: number | null; currency: string | null };
export function paymentEvent(provider: ProviderName, body: any): PaymentEvent {
  let event: PaymentEvent;
  if (provider === 'paystack') {
    event = { id: `${body.event}:${body.data?.id}`, reference: body.data?.reference,
      status: body.event === 'charge.success' ? 'success' : 'pending',
      amount: Number(body.data?.amount) / 100, currency: body.data?.currency };
  } else if (provider === 'paypal') {
    event = { id: body.id, reference: body.resource?.supplementary_data?.related_ids?.order_id,
      status: body.event_type === 'PAYMENT.CAPTURE.COMPLETED' ? 'success' : body.event_type === 'PAYMENT.CAPTURE.DENIED' ? 'failed' : 'pending',
      amount: Number(body.resource?.amount?.value), currency: body.resource?.amount?.currency_code };
  } else {
    const callback = body.Body?.stkCallback;
    const items = callback?.CallbackMetadata?.Item;
    const amount = Array.isArray(items) ? items.find((item: any) => item.Name === 'Amount')?.Value : undefined;
    event = { id: `${callback?.CheckoutRequestID}:${callback?.ResultCode}`, reference: callback?.CheckoutRequestID,
      status: callback?.ResultCode === 0 ? 'success' : typeof callback?.ResultCode === 'number' ? 'failed' : 'pending',
      amount: Number(amount), currency: 'KES' };
  }
  if (!event.id || !event.reference || event.id.includes('undefined')) throw new HttpError('Missing payment reference', 400, 'invalid_event');
  if (event.status === 'success' && (!Number.isFinite(event.amount) || event.amount! <= 0 || !event.currency)) throw new HttpError('Missing payment amount', 400, 'invalid_amount');
  if (!Number.isFinite(event.amount)) event.amount = null;
  return event;
}
