import { adminClient } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/http.ts";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function retryAt(seconds = 86400) {
  return new Date(Date.now() + Math.max(60, Math.min(seconds, 172800)) * 1000).toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  const secret = Deno.env.get("GRADING_QUEUE_SECRET");
  if (!secret || req.headers.get("x-grading-queue-secret") !== secret) return response({ error: "Unauthorized" }, 401);

  const db = adminClient();
  const dailyLimit = Number(Deno.env.get("GEMINI_DAILY_GRADING_LIMIT") || 15);
  const { data: jobs, error: findError } = await db.from("grading_jobs")
    .select("id, submission_id, user_id, attempts")
    .in("status", ["queued", "retry"]).lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true }).limit(1);
  if (findError) return response({ error: "Unable to read grading queue" }, 500);
  const job = jobs?.[0];
  if (!job) return response({ status: "idle" });

  const { data: claimed, error: claimError } = await db.from("grading_jobs")
    .update({ status: "processing", attempts: job.attempts + 1, started_at: new Date().toISOString(), last_error: null })
    .eq("id", job.id).in("status", ["queued", "retry"])
    .select("id, submission_id, user_id, attempts").maybeSingle();
  if (claimError || !claimed) return response({ status: "busy" });

  const { data: reserved, error: reserveError } = await db.rpc("reserve_grading_request", { p_daily_limit: dailyLimit });
  if (reserveError || !reserved) {
    const next = retryAt();
    await db.from("grading_jobs").update({ status: "retry", next_attempt_at: next, last_error: reserveError ? "Unable to reserve grading quota" : "Daily grading capacity reached" }).eq("id", job.id);
    return response({ status: "deferred", nextAttemptAt: next }, reserveError ? 503 : 200);
  }

  const baseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const grader = await fetch(`${baseUrl}/functions/v1/grade-task-submission`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", "x-grading-queue-secret": secret },
    body: JSON.stringify({ submissionId: claimed.submission_id, userId: claimed.user_id, jobId: claimed.id }),
  });
  const result = await grader.json().catch(() => ({}));
  if (grader.status === 429 || result?.retryable) {
    const next = retryAt(result?.retryAfterSeconds);
    await db.from("grading_jobs").update({ status: "retry", next_attempt_at: next, last_error: result?.error || "Gemini quota reached" }).eq("id", claimed.id);
    return response({ status: "retry", nextAttemptAt: next });
  }
  if (!grader.ok) {
    await db.from("grading_jobs").update({ status: "failed", last_error: result?.error || "Grading failed" }).eq("id", claimed.id);
    return response({ status: "failed" }, 502);
  }
  return response({ status: "completed", result });
});
