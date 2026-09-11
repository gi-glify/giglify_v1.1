import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Deposit exposes collapsible package and verification payment flows", async () => {
  const source = await readFile("src/pages/Deposit.tsx", "utf8");
  assert.match(source, /package-payment-toggle/);
  assert.match(source, /verification-payment-toggle/);
  assert.match(source, /AOS\.refreshHard\(\)/);
  assert.match(source, /aria-expanded/);
});
