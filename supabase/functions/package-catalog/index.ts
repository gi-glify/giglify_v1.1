import { requireUser } from "../_shared/auth.ts";
import { errorResponse, json, options } from "../_shared/http.ts";
import { VERIFICATION_KES, VERIFICATION_USD } from "../_shared/payment.ts";
import { notifyAndEmailUser } from "../_shared/user-notifications.ts";

const KES_PER_USD = 131;

function packageAmountKes(tier: string, priceUsd: number): number {
  const configured = Deno.env.get(`DARAJA_${tier.toUpperCase()}_AMOUNT_KES`)
    ?? Deno.env.get(`MPESA_${tier.toUpperCase()}_AMOUNT_KES`);
  const amount = configured ? Number(configured) : priceUsd * KES_PER_USD;
  if (!Number.isSafeInteger(amount) || amount <= 0) return Math.round(priceUsd * KES_PER_USD);
  return amount;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { user, db } = await requireUser(req);
    const { data: plans, error } = await db
      .from("package_tiers")
      .select("tier, price_usd, validity_months, tasks_allowed, daily_tasks_allowed, weekly_tasks_allowed, max_task_reward_usd, high_paying_eligible")
      .eq("is_active", true)
      .order("price_usd", { ascending: true });
    if (error) throw error;

    const { data: entitlement } = await db.from("package_entitlements")
      .select("tier, renewal_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    let expiryWarning: string | null = null;
    if (entitlement?.renewal_at) {
      const renewalAt = new Date(entitlement.renewal_at);
      const remainingMs = renewalAt.getTime() - Date.now();
      if (remainingMs > 0 && remainingMs <= 24 * 60 * 60 * 1000) {
        expiryWarning = renewalAt.toISOString();
        await notifyAndEmailUser(db, user.id, {
          title: "Package expires in 24 hours",
          detail: `Your ${entitlement.tier} package expires on ${renewalAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}. Renew before then to keep access to its task limits and reward range.`,
          subject: "Your Giglify package expires in 24 hours",
        });
      }
    }

    return json({
      plans: (plans ?? []).map((plan) => ({
        tier: plan.tier,
        priceUsd: Number(plan.price_usd),
        priceKes: plan.tier === "free" ? null : packageAmountKes(plan.tier, Number(plan.price_usd)),
        validityMonths: plan.validity_months,
        tasksAllowed: plan.tasks_allowed,
        dailyTasksAllowed: plan.daily_tasks_allowed,
        weeklyTasksAllowed: plan.weekly_tasks_allowed,
        maxTaskRewardUsd: plan.max_task_reward_usd === null ? null : Number(plan.max_task_reward_usd),
        highPayingEligible: plan.high_paying_eligible,
      })),
      verification: {
        amountUsd: VERIFICATION_USD,
        amountKes: Math.round(VERIFICATION_KES),
      },
      expiryWarning,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
