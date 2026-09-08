import { adminClient } from "../_shared/auth.ts";

const db = adminClient();

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expected = Deno.env.get("REQUESTER_CRON_SECRET");
  if (expected && req.headers.get("x-cron-secret") !== expected) return new Response("Unauthorized", { status: 401 });
  const { data: applications, error } = await db.from("requester_applications")
    .select("id, user_id")
    .eq("status", "pending")
    .lte("review_available_at", new Date().toISOString());
  if (error) return Response.json({ error: error.message }, { status: 500 });
  for (const application of applications || []) {
    await db.from("requester_applications").update({ status: "review-ready" }).eq("id", application.id).eq("status", "pending");
    await db.from("notifications").insert({ user_id: application.user_id, title: "Requester review window complete", detail: "Your requester application can now be reviewed. Open the requester page for the next step." });
  }
  return Response.json({ processed: applications?.length || 0 });
});
