import { HttpError } from './http.ts';

export function requiredSecret(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError(`${name} is not configured`, 503, 'configuration_error');
  return value;
}

export function providerBase(provider: 'paypal' | 'mpesa'): string {
  const environment = requiredSecret('PAYMENT_ENVIRONMENT');
  if (environment !== 'live' && environment !== 'sandbox') throw new Error('PAYMENT_ENVIRONMENT must be live or sandbox');
  return provider === 'paypal'
    ? environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
    : environment === 'live' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
}

const tokens = new Map<string, { value: string; expires: number }>();
export async function providerToken(provider: 'paypal' | 'mpesa'): Promise<string> {
  const base = providerBase(provider);
  const cached = tokens.get(base);
  if (cached && cached.expires > Date.now()) return cached.value;
  const client = requiredSecret(provider === 'paypal' ? 'PAYPAL_CLIENT_ID' : 'MPESA_CONSUMER_KEY');
  const secret = requiredSecret(provider === 'paypal' ? 'PAYPAL_CLIENT_SECRET' : 'MPESA_CONSUMER_SECRET');
  const response = await fetch(base + (provider === 'paypal' ? '/v1/oauth2/token' : '/oauth/v1/generate?grant_type=client_credentials'), {
    method: provider === 'paypal' ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${btoa(`${client}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    ...(provider === 'paypal' ? { body: 'grant_type=client_credentials' } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok || typeof body.access_token !== 'string') throw new HttpError('Payment authentication failed', 502, 'provider_auth');
  tokens.set(base, { value: body.access_token, expires: Date.now() + Math.max(0, Number(body.expires_in || 300) - 60) * 1000 });
  return body.access_token;
}

export async function providerCredentials(provider: 'paystack' | 'paypal' | 'mpesa') {
  if (provider === 'paystack') return { secret: requiredSecret('PAYSTACK_SECRET_KEY') };
  return {
    accessToken: await providerToken(provider), baseUrl: providerBase(provider),
    ...(provider === 'mpesa' ? { shortCode: requiredSecret('MPESA_SHORTCODE'), passkey: requiredSecret('MPESA_PASSKEY') } : {}),
  };
}

export function paymentCallback(raw: string, provider: string): string {
  const url = new URL(raw);
  url.searchParams.set('provider', provider);
  if (provider === 'mpesa') url.searchParams.set('callback_secret', requiredSecret('MPESA_CALLBACK_SECRET'));
  return url.toString();
}
