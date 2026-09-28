import { requireUser } from '../_shared/auth.ts';
import { errorResponse, HttpError, json, options } from '../_shared/http.ts';
import { readBodyText, rateLimit } from '../_shared/request-limits.ts';

Deno.serve(async req => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { user, db } = await requireUser(req);
    await rateLimit('payment-return', user.id, 30, 60);
    const { reference } = JSON.parse(await readBodyText(req, 2048));
    if (typeof reference !== 'string' || reference.length > 200 || !reference) throw new HttpError('Invalid reference', 400, 'invalid_reference');
    const { data: attempt, error: attemptError } = await db.from('payment_attempts').select('transaction_id').eq('provider', 'paystack').eq('provider_request_id', reference).maybeSingle();
    if (attemptError) throw attemptError;
    if (attempt) {
      const { data, error } = await db.from('transactions').select('id,status').eq('id', attempt.transaction_id).eq('user_id', user.id).single();
      if (error || !data) throw new HttpError('Payment not found', 404, 'not_found');
      return json({ kind: 'package', paymentId: data.id, status: data.status });
    }
    const { data, error } = await db.from('verification_deposits').select('id,status').eq('method', 'paystack').eq('provider_reference', reference).eq('user_id', user.id).single();
    if (error || !data) throw new HttpError('Payment not found', 404, 'not_found');
    // Redirect parameters never authorize settlement; only verified callbacks do.
    return json({ kind: 'verification', paymentId: data.id, status: data.status });
  } catch (error) { return errorResponse(error); }
});
