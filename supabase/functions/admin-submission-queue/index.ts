import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

const allowedActions = ["retry", "manual_review", "approve", "reject"];

function bounded(value: unknown, fallback = 50): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 100) : fallback;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { user, db } = await requireAdmin(req);
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "list";
    if (action === "list") {
      const limit = bounded(body?.limit);
      const offset = Math.max(Number(body?.offset) || 0, 0);
      const status = typeof body?.status === "string" ? body.status : "";
      const gradingStatus = typeof body?.gradingStatus === "string" ? body.gradingStatus : "";
      const search = typeof body?.search === "string" ? body.search.trim() : "";
      let query = db.from("task_submissions")
        .select("id, user_id, task_id, status, grading_status, grading_percentage, grading_decision, grading_confidence, grading_feedback, graded_at, reward_approved, reward_paid, started_at, completed_at", { count: "exact" })
        .order("completed_at", { ascending: false, nullsFirst: false }).range(offset, offset + limit - 1);
      if (status) query = query.eq("status", status);
      if (gradingStatus) query = query.eq("grading_status", gradingStatus);
      if (search) query = query.ilike("id", `%${search}%`);
      const { data, error, count } = await query;
      if (error) throw error;
      const rows = data ?? [];
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      const taskIds = [...new Set(rows.map((row) => row.task_id))];
      const [{ data: profiles, error: profilesError }, { data: tasks, error: tasksError }] = await Promise.all([
        db.from("profiles").select("id, first_name, last_name").in("id", userIds),
        db.from("tasks").select("id, title, task_code").in("id", taskIds),
      ]);
      if (profilesError) throw profilesError;
      if (tasksError) throw tasksError;
      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      const taskMap = new Map((tasks ?? []).map((task) => [task.id, task]));
      return json({ submissions: rows.map((row) => ({ ...row, worker_name: [profileMap.get(row.user_id)?.first_name, profileMap.get(row.user_id)?.last_name].filter(Boolean).join(" ") || "Unnamed worker", task_name: taskMap.get(row.task_id)?.title || "Unavailable task", task_code: taskMap.get(row.task_id)?.task_code || null })), count: count ?? 0, limit, offset });
    }
    if (!allowedActions.includes(action)) throw new HttpError("Invalid submission action", 400, "validation_error");
    const submissionId = typeof body?.submissionId === "string" ? body.submissionId : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!submissionId) throw new HttpError("submissionId is required", 400, "validation_error");
    if ((action === "reject" || action === "manual_review") && !note) throw new HttpError("A review note is required", 400, "note_required");
    const { data: before, error: findError } = await db.from("task_submissions")
      .select("id, user_id, task_id, status, grading_status, grading_percentage, grading_decision, grading_confidence, grading_feedback, graded_at, reward_approved, reward_paid")
      .eq("id", submissionId).single();
    if (findError) throw findError;
    let after;
    if (action === "retry") {
      if (before.grading_status !== "failed") throw new HttpError("Only failed grading jobs can be retried", 409, "stale_record");
      const { error } = await db.from("grading_jobs").update({ status: "retry", next_attempt_at: new Date().toISOString(), last_error: null }).eq("submission_id", submissionId).eq("status", "failed");
      if (error) throw error;
      const { data, error: updateError } = await db.from("task_submissions").update({ grading_status: "pending" }).eq("id", submissionId).eq("grading_status", "failed").select("*").single();
      if (updateError) throw updateError;
      after = data;
    } else {
      if (action === "approve" && !["submitted", "manual_review"].includes(before.status) && before.grading_status !== "manual_review") throw new HttpError("Submission is not ready for approval", 409, "stale_record");
      if (action === "reject" && ["approved", "rejected"].includes(before.status)) throw new HttpError("Submission is already resolved", 409, "stale_record");
      const update = action === "manual_review"
        ? { status: "submitted", grading_status: "manual_review", grading_decision: "manual_review", grading_feedback: { admin_note: note } }
        : { status: action === "approve" ? "approved" : "rejected", grading_status: "graded", grading_decision: action === "approve" ? "manual_approved" : "manual_rejected", grading_feedback: { admin_note: note }, graded_at: new Date().toISOString(), reward_approved: action === "approve" ? Number(body?.rewardApproved) || before.reward_approved : 0 };
      const { data, error } = await db.from("task_submissions").update(update).eq("id", submissionId).eq("status", before.status).select("*").single();
      if (error) throw error;
      after = data;
    }
    await auditAdminAction(db, { actorUserId: user.id, action: `submission_${action}`, entityType: "task_submission", entityId: submissionId, before, after, reason: note, requestId: requestId(req) });
    return json({ submission: after });
  } catch (error) {
    return error instanceof SyntaxError ? errorResponse(new HttpError("Invalid JSON body", 400, "invalid_json")) : errorResponse(error);
  }
});
