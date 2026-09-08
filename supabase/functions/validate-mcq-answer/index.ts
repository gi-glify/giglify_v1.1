import { requireUser } from "../_shared/auth.ts";
import { json, options } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const preflight = options(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireUser(req);
    const body = await req.json();
    const taskCode = typeof body?.taskCode === "string" ? body.taskCode.trim().toUpperCase() : "";
    const questionNumber = Number(body?.questionNumber);
    const answer = typeof body?.answer === "string" ? body.answer.trim().toUpperCase() : "";
    if (!taskCode || !Number.isInteger(questionNumber) || !answer) return json({ error: "Invalid answer" }, 400);

    const { data, error } = await db.from("task_questions")
      .select("question_type, correct_option")
      .eq("task_code", taskCode)
      .eq("question_number", questionNumber)
      .single();
    if (error) return json({ error: "This question could not be found for verification." }, 404);
    if (data.question_type !== "mcq" || !data.correct_option) return json({ error: "This question is not an MCQ" }, 400);
    const correct = answer === data.correct_option.toUpperCase();
    return json({ correct, feedback: correct ? "Correct answer." : "Not quite. Review the task context before continuing." });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to validate answer" }, 500);
  }
});
