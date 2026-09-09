import { requireAdmin } from "../_shared/auth.ts";
import { auditAdminAction, requestId } from "../_shared/admin-audit.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";

type DraftQuestion = { question_number?: number; question_text?: string; question_type?: string; context?: string; options?: unknown[]; model_answer?: string };

function taskCodeFor(draftId: string): string {
  return `requester-${draftId.replaceAll("-", "").slice(0, 20)}`;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { user, db } = await requireAdmin(req);
    const body = await req.json();
    const draftId = typeof body?.draftId === "string" ? body.draftId : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!draftId) throw new HttpError("draftId is required", 400, "validation_error");

    const { data: draft, error: draftError } = await db.from("requester_task_drafts")
      .select("id, requester_id, title, context, category, difficulty, reward, questions, status, reviewed_at, reviewed_by, admin_note")
      .eq("id", draftId)
      .single();
    if (draftError) throw draftError;
    if (draft.status !== "pending_review") throw new HttpError("This draft is no longer awaiting review", 409, "stale_record");

    const questions = Array.isArray(draft.questions) ? draft.questions as DraftQuestion[] : [];
    if (questions.length === 0 || questions.length > 10 || questions.some((question, index) => typeof question.question_text !== "string" || question.question_text.trim().length < 5 || (question.question_number !== undefined && Number(question.question_number) !== index + 1))) {
      throw new HttpError("A task must contain one to ten sequential valid questions", 400, "invalid_questions");
    }
    const taskCode = taskCodeFor(draft.id);
    const { data: existingTask, error: existingTaskError } = await db.from("tasks").select("id, task_code").eq("task_code", taskCode).maybeSingle();
    if (existingTaskError) throw existingTaskError;
    let task = existingTask;
    if (!task) {
      const { data: createdTask, error: taskError } = await db.from("tasks").insert({
        title: draft.title,
        description: draft.context,
        context: draft.context,
        category: draft.category,
        reward: draft.reward,
        estimated_time_minutes: Math.max(5, questions.length * 2),
        difficulty: draft.difficulty,
        device: "any",
        requires_desktop: false,
        is_active: true,
        task_code: taskCode,
        task_type: "saq",
      }).select("id, task_code").single();
      if (taskError) throw taskError;
      task = createdTask;
    }

    for (const [index, question] of questions.entries()) {
      const questionNumber = Number(question.question_number) || index + 1;
      const { error: questionError } = await db.from("task_questions").upsert({
        task_code: task.task_code,
        question_number: questionNumber,
        question_text: question.question_text.trim(),
        question_type: question.question_type === "mcq" ? "mcq" : "saq",
        context: typeof question.context === "string" ? question.context : draft.context,
        options: Array.isArray(question.options) ? question.options : [],
        model_answer: typeof question.model_answer === "string" ? question.model_answer : "Manual review required",
      }, { onConflict: "task_code,question_number" });
      if (questionError) throw questionError;
    }

    const before = draft;
    const { data: updatedDraft, error: updateError } = await db.from("requester_task_drafts")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id, admin_note: note || null })
      .eq("id", draft.id)
      .eq("status", "pending_review")
      .select("id, requester_id, title, status, reviewed_at, reviewed_by, admin_note")
      .single();
    if (updateError) throw updateError;
    await auditAdminAction(db, { actorUserId: user.id, action: "requester_task_published", entityType: "requester_task", entityId: draft.id, before, after: { draft: updatedDraft, taskId: task.id, taskCode: task.task_code }, reason: note, requestId: requestId(req) });
    return json({ draftId: draft.id, taskId: task.id, taskCode: task.task_code, status: "published" });
  } catch (error) {
    return errorResponse(error);
  }
});
