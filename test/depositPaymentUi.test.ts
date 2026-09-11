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
