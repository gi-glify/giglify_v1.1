import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Deposit exposes collapsible package and verification payment flows", async () => {
  const source = await readFile("src/pages/Deposit.tsx", "utf8");
  assert.match(source, /package-payment-toggle/);
  assert.match(source, /verification-payment-toggle/);
  assert.match(source, /AOS\.refreshHard\(\)/);
  assert.match(source, /aria-expanded/);
  assert.match(source, /max-h-0 opacity-0/);
  assert.match(source, /max-h-\[1600px\] opacity-100/);
});

test("authenticated layout keeps one reusable AOS instance for dynamic routes", async () => {
  const layout = await readFile("src/components/layout/AppLayout.tsx", "utf8");
  const app = await readFile("src/App.tsx", "utf8");
  assert.doesNotMatch(layout, /AOS\.init/);
  assert.match(app, /AOS\.init\(\{ duration: 600, once: false/);
  assert.match(layout, /AOS\.refreshHard\(\)/);
  assert.match(layout, /AOS\.refresh\(\)/);
});

test("notification toast uses the requested motion and danger behavior", async () => {
  const source = await readFile("src/components/ui/NotificationToast.tsx", "utf8");
  assert.match(source, /fixed top-4 right-4/);
  assert.match(source, /notification-toast-timer/);
  assert.match(source, /notification\.kind === 'danger'/);
  assert.match(source, /onTouchEnd/);
});

test("Deposit uses the approved provider tabs for both payment flows", async () => {
  const source = await readFile("src/pages/Deposit.tsx", "utf8");
  const providers = await readFile("src/lib/paymentProviders.ts", "utf8");
  assert.match(source, /<PaymentProviderTabs/);
  assert.match(source, /setPackageProvider/);
  assert.match(source, /setPaymentMethod/);
  assert.match(source, /getCheckoutLabel/);
  assert.match(source, /getProviderField/);
  assert.match(source, /onSubmit={handlePackagePayment}/);
  assert.match(source, /onSubmit={handleVerification}/);
  assert.match(source, /startPackagePayment/);
  assert.match(source, /createVerificationPayment/);
  assert.match(providers, /Paystack/);
  assert.match(providers, /M-Pesa/);
  assert.doesNotMatch(source, /FaCcStripe/);
});

test("Deposit renders shared payment progress and refreshes both payment records", async () => {
  const source = await readFile("src/pages/Deposit.tsx", "utf8");
  const api = await readFile("src/lib/paymentsApi.ts", "utf8");
  assert.match(source, /<PaymentProgress kind="package"/);
  assert.match(source, /<PaymentProgress kind="verification"/);
  assert.match(source, /fetchPackagePaymentStatus/);
  assert.match(source, /fetchVerificationPaymentStatus/);
  assert.match(source, /setInterval\(refresh, 4000\)/);
  assert.match(api, /from\('transactions'\)/);
  assert.match(api, /from\('verification_deposits'\)/);
});

test("terminal payment progress exposes a safe new-attempt fallback", async () => {
  const source = await readFile("src/components/ui/PaymentProgress.tsx", "utf8");
  assert.match(source, /onRetry/);
  assert.match(source, /Start a new payment/);
  assert.match(source, /progress\.canRetry/);
});

test("Deposit uses the four-step wizard and safe draft restoration", async () => {
  const source = await readFile("src/pages/Deposit.tsx", "utf8");
  assert.match(source, /<PaymentWizard/);
  assert.match(source, /parsePaymentIntent/);
  assert.match(source, /readPaymentDraft/);
  assert.match(source, /writePaymentDraft/);
  assert.match(source, /clearPaymentDraft/);
  assert.match(source, /setPackageStep\('result'\)/);
  assert.match(source, /setVerificationStep\('result'\)/);
});

test("payment wizard animates progress and keeps package cards visible", async () => {
  const indicator = await readFile("src/components/payment/PaymentStepIndicator.tsx", "utf8");
  const wizard = await readFile("src/components/payment/PaymentWizard.tsx", "utf8");
  const deposit = await readFile("src/pages/Deposit.tsx", "utf8");
  assert.match(indicator, /transition-\[width\]/);
  assert.match(indicator, /duration-500/);
  assert.match(wizard, /transition-\[opacity,transform\]/);
  assert.match(deposit, /id="packages"[\s\S]*id="package-payment-form"/);
  assert.match(deposit, /<div id="packages" className="mb-12/);
});

test("provider tabs expose keyboard and selection semantics", async () => {
  const source = await readFile("src/components/ui/PaymentProviderTabs.tsx", "utf8");
  assert.match(source, /aria-label=/);
  assert.match(source, /aria-controls=/);
  assert.match(source, /onKeyDown=/);
  assert.match(source, /tabIndex=/);
  assert.match(source, /FaPaypal/);
  assert.match(source, /CreditCard/);
  assert.match(source, /Smartphone/);
  assert.match(source, /idPrefix/);
});
