import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// New file — drop at: src/pages/TaskRunner.tsx
// Does not modify Tasks.tsx, App.tsx, or any existing file. See the
// integration section of QUESTION_BANK_GUIDE.md for the one route + one
// link you add by hand to wire this in.
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Eye } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { fetchTaskByCode, fetchTaskQuestions, getOrCreateSubmission, saveAnswerProgress, finalizeSubmission, } from "../lib/taskQuestionsApi";
export default function TaskRunnerPage() {
    console.log('🔴 TaskRunnerPage is loading!');
    const { taskCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [submissionId, setSubmissionId] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [index, setIndex] = useState(0);
    const [response, setResponse] = useState("");
    const [revealed, setRevealed] = useState(false);
    const [selfMark, setSelfMark] = useState(null);
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (!taskCode || !user)
            return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [t, qs] = await Promise.all([
                fetchTaskByCode(taskCode),
                fetchTaskQuestions(taskCode),
            ]);
            if (cancelled)
                return;
            if (!t || qs.length === 0) {
                setLoading(false);
                return;
            }
            const sub = await getOrCreateSubmission(user.id, t.id, t.task_code);
            if (cancelled)
                return;
            setTask(t);
            setQuestions(qs);
            if (sub) {
                setSubmissionId(sub.id);
                const existing = (sub.submitted_content?.answers ??
                    []);
                setAnswers(existing);
                // Resume at the first unanswered question.
                const firstUnanswered = qs.findIndex((q) => !existing.some((a) => a.question_number === q.question_number));
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
        if (!q)
            return;
        const existing = answers.find((a) => a.question_number === q.question_number);
        setResponse(existing?.response ?? "");
        setRevealed(existing?.revealed_model_answer ?? false);
        setSelfMark(existing?.self_marked ?? null);
    }, [index, questions, answers]);
    if (!user) {
        return (_jsx("div", { className: "container py-8", children: _jsx("p", { children: "Please sign in to work on tasks." }) }));
    }
    if (loading) {
        return (_jsxs("div", { className: "container py-8", children: [_jsx("div", { className: "skeleton h-6 w-1/3 mb-4" }), _jsx("div", { className: "skeleton h-32 w-full" })] }));
    }
    if (!task || questions.length === 0) {
        return (_jsxs("div", { className: "container py-8", children: [_jsx("p", { style: { color: "var(--text-muted)" }, children: "This task isn't available right now. It may not have been seeded yet, or the code in the URL doesn't match a task in the catalog." }), _jsx(Link, { to: "/tasks", className: "btn-secondary text-sm mt-4 inline-block", children: "Back to tasks" })] }));
    }
    const q = questions[index];
    const isLast = index === questions.length - 1;
    const answeredCount = answers.length;
    const persist = async (mark, reveal) => {
        if (!submissionId)
            return;
        const updated = await saveAnswerProgress(submissionId, task.task_code, answers, {
            question_number: q.question_number,
            response,
            revealed_model_answer: reveal,
            self_marked: mark,
        });
        setAnswers(updated);
    };
    const handleReveal = async () => {
        setRevealed(true);
        await persist(selfMark, true);
    };
    const handleMark = async (mark) => {
        setSelfMark(mark);
        await persist(mark, true);
    };
    const goNext = async () => {
        await persist(selfMark, revealed);
        if (isLast) {
            if (submissionId)
                await finalizeSubmission(submissionId);
            setDone(true);
        }
        else {
            setIndex((i) => i + 1);
        }
    };
    const goPrev = () => {
        if (index > 0)
            setIndex((i) => i - 1);
    };
    if (done) {
        return (_jsxs("div", { className: "container py-12 max-w-xl mx-auto text-center", children: [_jsx(CheckCircle2, { size: 40, className: "mx-auto mb-3 text-green-600 dark:text-green-400" }), _jsx("h1", { className: "font-display text-xl mb-2", children: "Submitted for review" }), _jsxs("p", { className: "text-sm mb-6", style: { color: "var(--text-muted)" }, children: [task.title, " has been sent in. Once it's approved you'll see the $", task.reward.toFixed(2), " reward land in your balance."] }), _jsxs(Link, { to: "/tasks", className: "btn-primary text-sm inline-flex items-center gap-1", children: ["Back to tasks ", _jsx(ArrowRight, { size: 14 })] })] }));
    }
    return (_jsxs("div", { className: "container py-8 max-w-2xl mx-auto", children: [_jsxs("button", { onClick: () => navigate("/tasks"), className: "text-sm flex items-center gap-1 mb-4", style: { color: "var(--text-muted)" }, children: [_jsx(ArrowLeft, { size: 14 }), " Back to tasks"] }), _jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h1", { className: "font-display text-xl", children: task.title }), _jsx("span", { className: "badge badge-blue", children: task.task_code })] }), _jsxs("p", { className: "text-xs mb-4", style: { color: "var(--text-muted)" }, children: ["Question ", index + 1, " of ", questions.length, " \u00B7 ", answeredCount, " saved so far"] }), _jsx("div", { className: "flex gap-1 mb-6", children: questions.map((qq, i) => {
                    const isAnswered = answers.some((a) => a.question_number === qq.question_number);
                    return isAnswered ? (_jsx(CheckCircle2, { size: 14, className: "text-green-600 dark:text-green-400" }, qq.id)) : (_jsx(Circle, { size: 14, style: { color: i === index ? "var(--text)" : "var(--border)" } }, qq.id));
                }) }), _jsxs("div", { className: "card mb-4", children: [_jsx("p", { className: "text-sm font-semibold mb-3", children: q.question_text }), _jsx("textarea", { value: response, onChange: (e) => setResponse(e.target.value), onBlur: () => persist(selfMark, revealed), placeholder: "Write your answer here\u2026", rows: 5, className: "input-field w-full resize-none" }), !revealed ? (_jsxs("button", { onClick: handleReveal, className: "btn-secondary text-xs mt-3 flex items-center gap-1", children: [_jsx(Eye, { size: 12 }), " Reveal model answer"] })) : (_jsxs("div", { className: "mt-4 pt-4", style: { borderTop: "1px solid var(--border)" }, children: [_jsx("p", { className: "text-xs font-semibold mb-1", style: { color: "var(--text-muted)" }, children: "Model answer" }), _jsx("p", { className: "text-sm mb-3", children: q.model_answer }), _jsx("p", { className: "text-xs font-semibold mb-1.5", style: { color: "var(--text-muted)" }, children: "How did your answer compare?" }), _jsx("div", { className: "flex gap-1.5", children: [
                                    ["correct", "Matched it"],
                                    ["partial", "Partially"],
                                    ["incorrect", "Missed it"],
                                ].map(([value, label]) => (_jsx("button", { onClick: () => handleMark(value), className: `text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${selfMark === value
                                        ? "bg-brand-600 text-white border-brand-600"
                                        : "border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5"}`, children: label }, value))) })] }))] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { onClick: goPrev, disabled: index === 0, className: "btn-secondary text-sm disabled:opacity-40", children: "Previous" }), _jsxs("button", { onClick: goNext, disabled: !response.trim(), className: "btn-primary text-sm flex items-center gap-1 disabled:opacity-40", children: [isLast ? "Submit for review" : "Next", " ", _jsx(ArrowRight, { size: 14 })] })] })] }));
}
//# sourceMappingURL=TaskRunner.js.map