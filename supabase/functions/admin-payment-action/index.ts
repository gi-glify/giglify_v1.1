import { requestId } from '../_shared/admin-audit.ts';
import { errorResponse, HttpError, json, options } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { readBodyText } from '../_shared/request-limits.ts';

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { user, db } = await requireAdmin(req);
    const body = JSON.parse(await readBodyText(req, 8192));
    if (!body || !['verification_deposit', 'payout_request', 'profile_edit_appeal'].includes(body.entityType)
      || typeof body.entityId !== 'string' || !['approve', 'reject', 'mark_paid'].includes(body.action)) throw new HttpError('Invalid action', 400, 'validation_error');
    const { data, error } = await db.rpc('admin_resolve_payment', {
      p_actor: user.id, p_entity_type: body.entityType, p_entity_id: body.entityId, p_action: body.action,
      p_note: typeof body.note === 'string' ? body.note.trim() : '',
      p_event_id: typeof body.providerEventId === 'string' ? body.providerEventId.trim() : '',
      p_request_id: requestId(req).slice(0, 200),
    });
    if (error) throw new HttpError(error.message, 409, 'payment_action_rejected');
    return json(data);
  } catch (error) { return errorResponse(error); }
});
