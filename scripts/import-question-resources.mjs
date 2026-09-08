#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const RESOURCE_DIR = path.resolve(process.cwd(), "docs/resources");
const CATEGORY_BY_FILE = {
  AI_Training: "ai-training",
  Coding: "coding",
  Data_Labeling: "data-labeling",
  Design: "design",
  Research: "research",
  Translation: "translation",
  Writing: "writing",
};

const difficultyFor = (type, field) => type === "mcq"
  ? (field === "coding" || field === "data-labeling" ? "medium" : "easy")
  : "expert";
const rewardFor = (difficulty) => ({ easy: 1.5, medium: 3.5, hard: 9, expert: 24.5 })[difficulty];
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48);

function clean(value) {
  return value.replace(/\r/g, "").trim();
}

function parseAnswer(line) {
  const match = line.match(/^\*\*(?:Answer|A\d+)\.?\s*:?\s*([A-D])(?:\)|\.)?\s*(.*?)\*\*(?:\s*[—-]\s*(.*))?$/i);
  if (!match) return null;
  return { option: match[1].toUpperCase(), answer: clean(match[2] || ""), explanation: clean(match[3] || "") };
}

export function parseQuestions(block, type) {
  const lines = block.split("\n");
  const starts = [];
  lines.forEach((line, index) => {
    if (/^\*\*Q\d+\.?/.test(line.trim())) starts.push(index);
  });
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    const part = lines.slice(start, end);
    const heading = part.shift().trim().replace(/^\*\*Q\d+\.?\s*/, "").replace(/\*\*$/, "");
    const answerIndex = part.findIndex((line) => type === "mcq" ? /^\*\*Answer:/.test(line.trim()) : /^\*\*A\d+\./.test(line.trim()));
    const promptLines = answerIndex >= 0 ? part.slice(0, answerIndex) : part;
    const answerLine = answerIndex >= 0 ? part[answerIndex].trim() : "";
    const answer = type === "mcq" ? parseAnswer(answerLine) : { answer: clean(answerLine.replace(/^\*\*A\d+\.\*\*\s*/, "")) };
    const options = type === "mcq" ? promptLines.filter((line) => /^[A-D]\)/.test(line.trim())).map((line) => {
      const match = line.trim().match(/^([A-D])\)\s*(.*)$/);
      return { key: match[1], label: clean(match[2]) };
    }) : [];
    const questionText = type === "mcq"
      ? [heading, promptLines.filter((line) => !/^[A-D]\)/.test(line.trim())).join("\n")].filter(Boolean).join("\n")
      : [heading, promptLines.join("\n")].filter(Boolean).join("\n");
    const modelAnswer = type === "mcq"
      ? clean([answer?.answer, answer?.explanation].filter(Boolean).join(" — "))
      : clean(answer?.answer || "");
    return {
      questionNumber: index + 1,
      questionText: clean(questionText),
      context: "",
      questionType: type,
      options,
      correctOption: answer?.option || null,
      modelAnswer: modelAnswer || "Manual review required: no source answer was parsed.",
    };
  }).filter((question) => question.questionText);
}

export function parseResourceFile(fileName, markdown) {
  const base = path.basename(fileName, ".md");
  const category = CATEGORY_BY_FILE[base];
  if (!category) throw new Error(`Unsupported resource file: ${fileName}`);
  const type = base === "AI_Training" ? "saq" : "mcq";
  const headingMatches = [...markdown.matchAll(/^## Task Set \d+:\s*(.+)$/gm)];
  const sets = headingMatches.length ? headingMatches.map((match, index) => ({
    title: match[1].trim(),
    block: markdown.slice(match.index + match[0].length, headingMatches[index + 1]?.index ?? markdown.length),
  })) : [{ title: `${base} Question Bank`, block: markdown }];
  return sets.map((set) => {
    const difficulty = difficultyFor(type, category);
    const context = `This ${category.replace(/-/g, " ")} task is a ${set.title} review. Use the subject and evidence described in each question, apply the relevant quality standard, and explain your reasoning where requested.`;
    return {
      taskCode: `RES-${slug(base)}-${slug(set.title)}`.toUpperCase(),
      title: set.title,
      description: context,
      context,
      category,
      taskType: type,
      difficulty,
      reward: rewardFor(difficulty),
      estimatedTimeMinutes: type === "mcq" ? 8 : 30,
      sourceFile: fileName,
      sourceSet: set.title,
      questions: parseQuestions(set.block, type),
    };
  });
}

export async function readResources() {
  const files = (await fs.readdir(RESOURCE_DIR)).filter((file) => file.endsWith(".md")).sort();
  const tasks = [];
  for (const file of files) tasks.push(...parseResourceFile(file, await fs.readFile(path.join(RESOURCE_DIR, file), "utf8")));
  return tasks;
}

async function main() {
  const tasks = await readResources();
  console.log(`Parsed ${tasks.length} tasks and ${tasks.reduce((count, task) => count + task.questions.length, 0)} questions.`);
  if (process.argv.includes("--dry-run")) {
    console.log(tasks.map((task) => `${task.taskCode}: ${task.taskType}/${task.category}/${task.difficulty} (${task.questions.length} questions)`).join("\n"));
    return;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or use --dry-run.");
  const db = createClient(url, key, { auth: { persistSession: false } });
  for (const task of tasks) {
    const { data: taskRow, error: taskError } = await db.from("tasks").upsert({
      task_code: task.taskCode, title: task.title, description: task.description, context: task.context,
      category: task.category, task_type: task.taskType, difficulty: task.difficulty, reward: task.reward,
      estimated_time_minutes: task.estimatedTimeMinutes, device: "any", source_file: task.sourceFile,
      source_set: task.sourceSet, is_active: true,
    }, { onConflict: "task_code" }).select("id, task_code").single();
    if (taskError) throw taskError;
    const rows = task.questions.map((question) => ({
      task_code: taskRow.task_code, question_number: question.questionNumber, question_text: question.questionText,
      model_answer: question.modelAnswer, question_type: question.questionType, context: question.context,
      options: question.options, correct_option: question.correctOption,
    }));
    const { error: questionError } = await db.from("task_questions").upsert(rows, { onConflict: "task_code,question_number" });
    if (questionError) throw questionError;
    console.log(`Imported ${task.taskCode}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(error); process.exitCode = 1; });
