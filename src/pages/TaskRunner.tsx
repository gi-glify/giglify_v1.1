import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import {
  fetchTaskByCode,
  fetchTaskQuestions,
  getOrCreateSubmission,
  saveAnswerProgress,
  finalizeSubmission,
  validateMcqAnswer,
} from "../lib/taskQuestionsApi";
import type {
  TaskQuestion,
  TaskWithCode,
  QuestionRunAnswer,
} from "../types/taskQuestions";



export default function TaskRunnerPage() {
  const { taskCode } = useParams<{ taskCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<TaskWithCode | null>(null);
  const [questions, setQuestions] = useState<TaskQuestion[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuestionRunAnswer[]>([]);
  const [pendingReview, setPendingReview] = useState(false);

  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [done, setDone] = useState(false);
  const [validation, setValidation] = useState<{ correct: boolean; feedback: string } | null>(null);

  useEffect(() => {
    if (!taskCode || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [t, qs] = await Promise.all([
        fetchTaskByCode(taskCode),
        fetchTaskQuestions(taskCode),
      ]);
      if (cancelled) return;

      if (!t || qs.length === 0) {
        setLoading(false);
        return;
      }

      const sub = await getOrCreateSubmission(user.id, t.id, t.task_code);
      if (cancelled) return;

      setTask(t);
      setQuestions(qs);
      if (sub) {
        setSubmissionId(sub.id);
        if (sub.status !== "in-progress") {
          setPendingReview(true);
          setLoading(false);
          return;
        }
        const existing = (sub.submitted_content?.answers ??
          []) as QuestionRunAnswer[];
        setAnswers(existing);
        // Resume at the first unanswered question.
        const firstUnanswered = qs.findIndex(
          (q: TaskQuestion) =>
            !existing.some((a) => a.question_number === q.question_number),
        );
        setIndex(firstUnanswered === -1 ? qs.length - 1 : firstUnanswered);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [taskCode, user]);

  // Load saved response for the current question, if any.
  useEffect(() => {
    const q = questions[index];
    if (!q) return;
    const existing = answers.find(
      (a) => a.question_number === q.question_number,
    );
      setResponse(existing?.response ?? "");
    setValidation(null);
  }, [index, questions, answers]);

  if (!user) {
    return (
      <div className="container py-8">
        <p>Please sign in to work on tasks.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="skeleton h-6 w-1/3 mb-4" />
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  if (!task || questions.length === 0) {
    return (
      <div className="container py-8">
        <p style={{ color: "var(--text-muted)" }}>
          This task isn't available right now. It may not have been seeded yet,
          or the code in the URL doesn't match a task in the catalog.
        </p>
        <Link to="/tasks" className="btn-secondary text-sm mt-4 inline-block">
          Back to tasks
        </Link>
      </div>
    );
  }

  if (pendingReview) {
    return (
      <div className="container py-12 max-w-xl mx-auto text-center">
        <CheckCircle2
          size={40}
          className="mx-auto mb-3 text-brand-600 dark:text-brand-400"
        />
        <h1 className="font-display text-xl mb-2">Pending approval</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          This task has already been submitted. Gig Buddy is grading it now,
          and you will receive a notification when the result is ready.
        </p>
        <Link to="/tasks" className="btn-primary text-sm inline-flex items-center gap-1">
          Back to tasks <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = answers.length;

  const persist = async () => {
    if (!submissionId) return;
    const updated = await saveAnswerProgress(
      submissionId,
      task.task_code,
      answers,
      {
        question_number: q.question_number,
        response,
      },
    );
    setAnswers(updated);
  };

  const goNext = async () => {
    await persist();
    if (isLast) {
      if (submissionId) await finalizeSubmission(submissionId);
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  if (done) {
    return (
      <div className="container py-12 max-w-xl mx-auto text-center">
        <CheckCircle2
          size={40}
          className="mx-auto mb-3 text-green-600 dark:text-green-400"
        />
        <h1 className="font-display text-xl mb-2">Submitted for review</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {task.title} has been sent in. Once it's approved you'll see the $
          {task.reward.toFixed(2)} reward land in your balance.
        </p>
        <Link
          to="/tasks"
          className="btn-primary text-sm inline-flex items-center gap-1"
        >
          Back to tasks <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/tasks")}
        className="text-sm flex items-center gap-1 mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} /> Back to tasks
      </button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-xl">{task.title}</h1>
        <span className="badge badge-blue">{task.task_code}</span>
      </div>
      <div className="card mb-4" data-aos="fade-up">
        <p className="text-sm font-semibold mb-2">Task context</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{task.context || task.description}</p>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Question {index + 1} of {questions.length} · {answeredCount} saved so
        far
      </p>

      {/* Progress dots */}
      <div className="flex gap-1 mb-6">
        {questions.map((qq, i) => {
          const isAnswered = answers.some(
            (a) => a.question_number === qq.question_number,
          );
          return isAnswered ? (
            <CheckCircle2
              key={qq.id}
              size={14}
              className="text-green-600 dark:text-green-400"
            />
          ) : (
            <Circle
              key={qq.id}
              size={14}
              style={{ color: i === index ? "var(--text)" : "var(--border)" }}
            />
          );
        })}
      </div>

      <div className="card mb-4" data-aos="fade-up" data-aos-delay="80">
        <p className="text-sm font-semibold mb-3">{q.question_text}</p>
        {q.question_type === "mcq" ? (
          <div className="space-y-2">
            {q.options.map((option) => (
              <label key={option.key} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${response === option.key ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-[var(--border)]"}`}>
                <input type="radio" name={`question-${q.question_number}`} value={option.key} checked={response === option.key} onChange={(event) => setResponse(event.target.value)} className="mt-1" />
                <span><strong>{option.key}.</strong> {option.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onBlur={() => persist()}
            placeholder="Write your answer here…"
            rows={5}
            className="input-field w-full resize-none"
          />
        )}

        {validation && <div className={`alert ${validation.correct ? "alert-success" : "alert-warning"} mt-4`}>{validation.feedback}</div>}

        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          Your response will be compared with the task rubric after submission.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="btn-secondary text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={async () => {
            if (q.question_type === "mcq") {
              try {
                const result = await validateMcqAnswer({ taskCode: task.task_code, questionNumber: q.question_number, answer: response });
                setValidation(result);
                if (!result.correct) return;
              } catch (error) {
                setValidation({ correct: false, feedback: error instanceof Error ? error.message : "Unable to validate this answer." });
                return;
              }
            }
            await goNext();
          }}
          disabled={!response.trim()}
          className="btn-primary text-sm flex items-center gap-1 disabled:opacity-40"
        >
          {isLast ? "Submit for review" : "Next"} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
