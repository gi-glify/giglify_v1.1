// New file — drop at: src/lib/taskQuestionsApi.ts
// Uses the existing supabase client from src/utils/supabase.ts — does not
// create a second client or duplicate auth logic.
import { supabase } from '../utils/supabase';
import { mapLegacyTaskRow, mapTaskRow } from './taskCatalog';
import { normalizeMcqAnswer } from '../utils/authFlows';
/** Fetch the active catalog tasks shown on the tasks page. */
export async function fetchTasks() {
    const primary = await supabase
        .from('tasks')
        .select('id, task_code, title, description, category, reward, estimated_time_minutes, difficulty, device, requires_desktop, is_active, task_type')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (!primary.error) {
        return { tasks: (primary.data ?? []).map((row) => mapTaskRow(row)), error: null };
    }
    // Deployments can be one migration behind. Retry without the optional
    // task_type column before falling back to the original task catalog.
    const withoutType = await supabase
        .from('tasks')
        .select('id, task_code, title, description, category, reward, estimated_time_minutes, difficulty, device, requires_desktop, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (!withoutType.error) {
        return { tasks: (withoutType.data ?? []).map((row) => mapTaskRow(row)), error: null };
    }
    const legacy = await supabase
        .from('tasks')
        .select('id, title, description, category, reward, estimated_time_minutes, difficulty, device, requires_desktop, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (!legacy.error) {
        return { tasks: (legacy.data ?? []).map((row) => mapLegacyTaskRow(row)), error: null };
    }
    console.error('fetchTasks error:', primary.error.message, legacy.error.message);
    return { tasks: [], error: new Error(primary.error.message) };
}
/** Fetch one catalog task by its human-readable code (e.g. "TSK-005"). */
export async function fetchTaskByCode(taskCode) {
    const { data, error } = await supabase
        .from('tasks')
        .select('id, task_code, title, description, category, reward, estimated_time_minutes, difficulty, field, device, is_active, task_type, context')
        .eq('task_code', taskCode)
        .single();
    if (error) {
        console.error('fetchTaskByCode error:', error.message);
        return null;
    }
    return data;
}
/** Fetch the 10 (or fewer) questions for a task, in order. */
export async function fetchTaskQuestions(taskCode) {
    const { data, error } = await supabase
        .from('task_question_prompts')
        .select('id, task_code, question_number, question_text, question_type, context, options')
        .eq('task_code', taskCode)
        .order('question_number', { ascending: true });
    if (error) {
        console.error('fetchTaskQuestions error:', error.message);
        return [];
    }
    return data;
}
export async function validateMcqAnswer(input) {
    const { data, error } = await supabase.functions.invoke('validate-mcq-answer', {
        body: { ...input, answer: normalizeMcqAnswer(input.answer) },
    });
    if (error) {
        let message = error.message || 'Unable to validate answer';
        const context = error.context;
        if (context) {
            try {
                const payload = await context.clone().json();
                if (typeof payload?.error === 'string')
                    message = payload.error;
            }
            catch {
                // Keep the SDK error when the Edge Function did not return JSON.
            }
        }
        throw new Error(message);
    }
    if (!data || typeof data.correct !== 'boolean')
        throw new Error('The answer validator returned an invalid response.');
    return data;
}
/**
 * Get the user's existing in-progress submission for this task, or create
 * a new one. Returns the submission id + whatever content has been saved
 * so a refresh mid-task doesn't lose progress.
 */
export async function getOrCreateSubmission(userId, taskId, taskCode) {
    const { data: existing, error: findErr } = await supabase
        .from('task_submissions')
        .select('id, status, submitted_content')
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .in('status', ['in-progress', 'submitted'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (findErr) {
        console.error('getOrCreateSubmission lookup error:', findErr.message);
    }
    if (existing)
        return existing;
    const initialContent = {
        task_code: taskCode,
        answers: [],
        completed_at: '',
    };
    const { data: created, error: createErr } = await supabase
        .from('task_submissions')
        .insert({ user_id: userId, task_id: taskId, status: 'in-progress', submitted_content: initialContent })
        .select('id, status, submitted_content')
        .single();
    if (createErr) {
        console.error('getOrCreateSubmission insert error:', createErr.message);
        return null;
    }
    return created;
}
/** Upsert one question's answer into submitted_content, saving progress as the user goes. */
export async function saveAnswerProgress(submissionId, taskCode, currentAnswers, answer) {
    const next = currentAnswers.filter((a) => a.question_number !== answer.question_number);
    next.push(answer);
    next.sort((a, b) => a.question_number - b.question_number);
    const content = {
        task_code: taskCode,
        answers: next,
        completed_at: new Date().toISOString(),
    };
    const { error } = await supabase
        .from('task_submissions')
        .update({ submitted_content: content })
        .eq('id', submissionId);
    if (error)
        console.error('saveAnswerProgress error:', error.message);
    return next;
}
/** Mark the submission as submitted for review — this is what makes it show up for admin approval / payout. */
export async function finalizeSubmission(submissionId) {
    const { error } = await supabase
        .from('task_submissions')
        .update({ status: 'submitted' })
        .eq('id', submissionId);
    if (error) {
        console.error('finalizeSubmission error:', error.message);
        return false;
    }
    // Queue grading so a provider quota limit stalls the job instead of
    // turning a valid submission into a user-facing failure.
    const { error: queueError } = await supabase
        .from('grading_jobs')
        .upsert({ submission_id: submissionId, user_id: (await supabase.auth.getUser()).data.user?.id, status: 'queued', next_attempt_at: new Date().toISOString() }, { onConflict: 'submission_id', ignoreDuplicates: true });
    if (queueError)
        console.error('grading queue error:', queueError.message);
    return true;
}
/** Fetch the signed-in user's task history for the task tracking page. */
export async function fetchTaskSubmissionProgress(userId) {
    const { data: submissionRows, error: submissionError } = await supabase
        .from('task_submissions')
        .select('id, task_id, status, reward_paid, reward_approved, submitted_content, started_at, completed_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });
    if (submissionError) {
        console.error('fetchTaskSubmissionProgress submissions error:', submissionError.message);
        return { submissions: [], error: new Error(submissionError.message) };
    }
    const rows = (submissionRows ?? []);
    if (!rows.length)
        return { submissions: [], error: null };
    const taskIds = [...new Set(rows.map((row) => String(row.task_id)))];
    const { data: taskRows, error: taskError } = await supabase
        .from('tasks')
        .select('id, task_code, title, category, reward')
        .in('id', taskIds);
    if (taskError) {
        console.error('fetchTaskSubmissionProgress tasks error:', taskError.message);
        return { submissions: [], error: new Error(taskError.message) };
    }
    const taskById = new Map((taskRows ?? []).map((task) => [String(task.id), task]));
    const submissions = rows.map((row) => {
        const task = taskById.get(String(row.task_id));
        return {
            id: String(row.id),
            taskId: String(row.task_id),
            status: String(row.status),
            startedAt: String(row.started_at),
            completedAt: row.completed_at ? String(row.completed_at) : null,
            submittedContent: row.submitted_content,
            rewardPaid: row.reward_paid == null ? null : Number(row.reward_paid),
            rewardApproved: row.reward_approved == null ? null : Number(row.reward_approved),
            task: task ? {
                taskCode: task.task_code ?? null,
                title: String(task.title),
                category: String(task.category),
                reward: Number(task.reward),
            } : null,
        };
    });
    return { submissions, error: null };
}
//# sourceMappingURL=taskQuestionsApi.js.map