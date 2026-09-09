import { requireAdmin } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";
import { countRows, parseDateRange, sumRows } from "../_shared/metrics.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireAdmin(req);
    const range = parseDateRange(await req.json());
    const [
      newUsers, activeUsers, tasksStarted, tasksSubmitted, tasksApproved, tasksRejected,
      pendingRequesterApplications, taskDraftsAwaitingReview, verificationDepositsAwaitingAction,
      payoutsAwaitingAction, openProfileAppeals, unreadContactMessages, gradingQueueDepth,
      failedGradingJobs, rewardsApproved, rewardsPaid,
    ] = await Promise.all([
      countRows(db, "profiles", "created_at", range),
      countRows(db, "profiles", "updated_at", range),
      countRows(db, "task_submissions", "started_at", range),
      countRows(db, "task_submissions", "started_at", range, [{ column: "status", value: "submitted" }]),
      countRows(db, "task_submissions", "started_at", range, [{ column: "status", value: "approved" }]),
      countRows(db, "task_submissions", "started_at", range, [{ column: "status", value: "rejected" }]),
      countRows(db, "requester_applications", "submitted_at", range, [{ column: "status", value: ["pending", "review-ready"] }]),
      countRows(db, "requester_task_drafts", "created_at", range, [{ column: "status", value: "pending_review" }]),
      countRows(db, "verification_deposits", "created_at", range, [{ column: "status", value: ["pending", "held"] }]),
      countRows(db, "payout_requests", "created_at", range, [{ column: "status", value: ["requested", "under_review", "approved"] }]),
      countRows(db, "profile_edit_appeals", "created_at", range, [{ column: "status", value: "pending" }]),
      countRows(db, "contact_messages", "created_at", range, [{ column: "status", value: "received" }]),
      countRows(db, "grading_jobs", "created_at", range, [{ column: "status", value: ["queued", "processing", "retry"] }]),
      countRows(db, "grading_jobs", "created_at", range, [{ column: "status", value: "failed" }]),
      sumRows(db, "task_submissions", "reward_approved", "started_at", range, [{ column: "status", value: "approved" }]),
      sumRows(db, "task_submissions", "reward_paid", "started_at", range),
    ]);
    return json({
      range,
      newUsers,
      activeUsers,
      tasksStarted,
      tasksSubmitted,
      tasksApproved,
      tasksRejected,
      completionRate: tasksSubmitted === 0 ? 0 : (tasksApproved / tasksSubmitted) * 100,
      pendingRequesterApplications,
      taskDraftsAwaitingReview,
      verificationDepositsAwaitingAction,
      payoutsAwaitingAction,
      openProfileAppeals,
      unreadContactMessages,
      gradingQueueDepth,
      failedGradingJobs,
      rewardsApproved,
      rewardsPaid,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
