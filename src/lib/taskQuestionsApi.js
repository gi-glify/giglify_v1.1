// New file — drop at: src/lib/taskQuestionsApi.ts
// Uses the existing supabase client from src/utils/supabase.ts — does not
// create a second client or duplicate auth logic.
import { supabase } from '../utils/supabase';
/** Fetch one catalog task by its human-readable code (e.g. "TSK-005"). */
export async function fetchTaskByCode(taskCode) {
    const { data, error } = await supabase
        .from('tasks')
        .select('id, task_code, title, description, category, reward, estimated_time_minutes, difficulty, field, device, is_active')
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
        .from('task_questions')
        .select('id, task_code, question_number, question_text, model_answer')
        .eq('task_code', taskCode)
        .order('question_number', { ascending: true });
    if (error) {
        console.error('fetchTaskQuestions error:', error.message);
        return [];
    }
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
    if (error)
        console.error('finalizeSubmission error:', error.message);
    return !error;
}
//# sourceMappingURL=taskQuestionsApi.js.map