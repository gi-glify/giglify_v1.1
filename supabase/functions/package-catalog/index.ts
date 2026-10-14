import { requireUser } from "../_shared/auth.ts";
import { errorResponse, HttpError, json, options } from "../_shared/http.ts";
import { VERIFICATION_KES, VERIFICATION_USD } from "../_shared/payment.ts";

function packageAmountKes(tier: string): number {
  const configured = Deno.env.get(`DARAJA_${tier.toUpperCase()}_AMOUNT_KES`)
    ?? Deno.env.get(`MPESA_${tier.toUpperCase()}_AMOUNT_KES`);
  if (!configured) throw new HttpError(`DARAJA_${tier.toUpperCase()}_AMOUNT_KES is not configured`, 503, "configuration_error");
  const amount = Number(configured);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new HttpError(`DARAJA_${tier.toUpperCase()}_AMOUNT_KES must be a positive whole number`, 503, "configuration_error");
  }
  return amount;
}

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { db } = await requireUser(req);
    const { data: plans, error } = await db
      .from("package_tiers")
      .select("tier, price_usd, validity_months, tasks_allowed, high_paying_eligible")
      .eq("is_active", true)
      .order("price_usd", { ascending: true });
    if (error) throw error;

    return json({
      plans: (plans ?? []).map((plan) => ({
        tier: plan.tier,
        priceUsd: Number(plan.price_usd),
        priceKes: plan.tier === "free" ? null : packageAmountKes(plan.tier),
        validityMonths: plan.validity_months,
        tasksAllowed: plan.tasks_allowed,
        highPayingEligible: plan.high_paying_eligible,
      })),
      verification: {
        amountUsd: VERIFICATION_USD,
        amountKes: Math.round(VERIFICATION_KES),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
