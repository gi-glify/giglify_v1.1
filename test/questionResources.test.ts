import test from "node:test";
import assert from "node:assert/strict";
import { parseResourceFile } from "../scripts/import-question-resources.mjs";

test("parses MCQ choices and private correct answer", () => {
  const [task] = parseResourceFile("Coding.md", "# Category: Coding\n\n**Q1.** What is 2 + 2?\nA) 3\nB) 4\nC) 5\nD) 6\n\n**Answer: B) 4** — Arithmetic.");
  assert.equal(task.taskType, "mcq");
  assert.deepEqual(task.questions[0].options, [{ key: "A", label: "3" }, { key: "B", label: "4" }, { key: "C", label: "5" }, { key: "D", label: "6" }]);
  assert.equal(task.questions[0].correctOption, "B");
});

test("splits AI training task sets into expert SAQ tasks", () => {
  const tasks = parseResourceFile("AI_Training.md", "## Task Set 1: Audit\n\n**Q1. What should be checked?**\n\n**A1.** Check the source.\n\n## Task Set 2: Statistics\n\n**Q1. What is the result?**\n\n**A1.** Calculate it.");
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].taskType, "saq");
  assert.equal(tasks[0].difficulty, "expert");
  assert.match(tasks[0].description, /review/);
});
