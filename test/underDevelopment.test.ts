import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isUnderDevelopment } from "../src/lib/underDevelopment.ts";

test("under-development mode defaults on unless the value is exactly false", () => {
  assert.equal(isUnderDevelopment(undefined), true);
  assert.equal(isUnderDevelopment(""), true);
  assert.equal(isUnderDevelopment("true"), true);
  assert.equal(isUnderDevelopment("FALSE"), true);
  assert.equal(isUnderDevelopment("false"), false);
});

test("the main app gates the authenticated experience after auth loading", async () => {
  const source = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.match(source, /UNDER_DEVELOPMENT_MODE/);
  assert.match(source, /UnderDevelopmentPage/);
  assert.match(source, /user && UNDER_DEVELOPMENT_MODE/);
});
