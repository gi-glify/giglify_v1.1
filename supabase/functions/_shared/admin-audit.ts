import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function requestId(req: Request): string {
  const supplied = req.headers.get("x-request-id")?.trim();
  return supplied || crypto.randomUUID();
}

export interface AdminAuditInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  requestId: string;
}

export async function auditAdminAction(db: SupabaseClient, input: AdminAuditInput): Promise<void> {
  const { error } = await db.from("admin_audit_logs").insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_json: input.before ?? null,
    after_json: input.after ?? null,
    reason: input.reason ?? null,
    request_id: input.requestId,
  });
  if (error) throw error;
}
