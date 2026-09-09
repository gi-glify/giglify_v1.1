import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { fetchTaskByCode, fetchTaskQuestions, getOrCreateSubmission, saveAnswerProgress, finalizeSubmission, validateMcqAnswer, } from "../lib/taskQuestionsApi";
export default function TaskRunnerPage() {
    const { taskCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [submissionId, setSubmissionId] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [pendingReview, setPendingReview] = useState(false);
    const [index, setIndex] = useState(0);
    const [response, setResponse] = useState("");
    const [done, setDone] = useState(false);
    const [validation, setValidation] = useState(null);
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
                if (sub.status !== "in-progress") {
                    setPendingReview(true);
                    setLoading(false);
                    return;
                }
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
        setValidation(null);
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
    if (pendingReview) {
        return (_jsxs("div", { className: "container py-12 max-w-xl mx-auto text-center", children: [_jsx(CheckCircle2, { size: 40, className: "mx-auto mb-3 text-brand-600 dark:text-brand-400" }), _jsx("h1", { className: "font-display text-xl mb-2", children: "Pending approval" }), _jsx("p", { className: "text-sm mb-6", style: { color: "var(--text-muted)" }, children: "This task has already been submitted. Gig Buddy is grading it now, and you will receive a notification when the result is ready." }), _jsxs(Link, { to: "/tasks", className: "btn-primary text-sm inline-flex items-center gap-1", children: ["Back to tasks ", _jsx(ArrowRight, { size: 14 })] })] }));
    }
    const q = questions[index];
    const isLast = index === questions.length - 1;
    const answeredCount = answers.length;
    const persist = async () => {
        if (!submissionId)
            return;
        const updated = await saveAnswerProgress(submissionId, task.task_code, answers, {
            question_number: q.question_number,
            response,
        });
        setAnswers(updated);
    };
    const goNext = async () => {
        await persist();
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
    return (_jsxs("div", { className: "container py-8 max-w-2xl mx-auto", children: [_jsxs("button", { onClick: () => navigate("/tasks"), className: "text-sm flex items-center gap-1 mb-4", style: { color: "var(--text-muted)" }, children: [_jsx(ArrowLeft, { size: 14 }), " Back to tasks"] }), _jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h1", { className: "font-display text-xl", children: task.title }), _jsx("span", { className: "badge badge-blue", children: task.task_code })] }), _jsxs("div", { className: "card mb-4", "data-aos": "fade-up", children: [_jsx("p", { className: "text-sm font-semibold mb-2", children: "Task context" }), _jsx("p", { className: "text-sm", style: { color: "var(--text-muted)" }, children: task.context || task.description })] }), _jsxs("p", { className: "text-xs mb-4", style: { color: "var(--text-muted)" }, children: ["Question ", index + 1, " of ", questions.length, " \u00B7 ", answeredCount, " saved so far"] }), _jsx("div", { className: "flex gap-1 mb-6", children: questions.map((qq, i) => {
                    const isAnswered = answers.some((a) => a.question_number === qq.question_number);
                    return isAnswered ? (_jsx(CheckCircle2, { size: 14, className: "text-green-600 dark:text-green-400" }, qq.id)) : (_jsx(Circle, { size: 14, style: { color: i === index ? "var(--text)" : "var(--border)" } }, qq.id));
                }) }), _jsxs("div", { className: "card mb-4", "data-aos": "fade-up", "data-aos-delay": "80", children: [_jsx("p", { className: "text-sm font-semibold mb-3", children: q.question_text }), q.question_type === "mcq" ? (_jsx("div", { className: "space-y-2", children: q.options.map((option) => (_jsxs("label", { className: `flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${response === option.key ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-[var(--border)]"}`, children: [_jsx("input", { type: "radio", name: `question-${q.question_number}`, value: option.key, checked: response === option.key, onChange: (event) => setResponse(event.target.value), className: "mt-1" }), _jsxs("span", { children: [_jsxs("strong", { children: [option.key, "."] }), " ", option.label] })] }, option.key))) })) : (_jsx("textarea", { value: response, onChange: (e) => setResponse(e.target.value), onBlur: () => persist(), placeholder: "Write your answer here\u2026", rows: 5, className: "input-field w-full resize-none" })), validation && _jsx("div", { className: `alert ${validation.correct ? "alert-success" : "alert-warning"} mt-4`, children: validation.feedback }), _jsx("p", { className: "text-xs mt-3", style: { color: "var(--text-muted)" }, children: "Your response will be compared with the task rubric after submission." })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { onClick: goPrev, disabled: index === 0, className: "btn-secondary text-sm disabled:opacity-40", children: "Previous" }), _jsxs("button", { onClick: async () => {
                            if (q.question_type === "mcq") {
                                try {
                                    const result = await validateMcqAnswer({ taskCode: task.task_code, questionNumber: q.question_number, answer: response });
                                    setValidation(result);
                                    if (!result.correct)
                                        return;
                                }
                                catch (error) {
                                    setValidation({ correct: false, feedback: error instanceof Error ? error.message : "Unable to validate this answer." });
                                    return;
                                }
                            }
                            await goNext();
                        }, disabled: !response.trim(), className: "btn-primary text-sm flex items-center gap-1 disabled:opacity-40", children: [isLast ? "Submit for review" : "Next", " ", _jsx(ArrowRight, { size: 14 })] })] })] }));
}
//# sourceMappingURL=TaskRunner.js.map