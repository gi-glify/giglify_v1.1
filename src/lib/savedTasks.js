import { supabase } from '../utils/supabase';
export async function fetchSavedTaskIds(userId) {
    const { data, error } = await supabase
        .from('saved_tasks')
        .select('task_id')
        .eq('user_id', userId);
    if (error)
        throw error;
    return new Set((data || []).map((row) => row.task_id));
}
export async function saveTask(userId, taskId) {
    const { error } = await supabase
        .from('saved_tasks')
        .upsert({ user_id: userId, task_id: taskId }, { onConflict: 'user_id,task_id', ignoreDuplicates: true });
    if (error)
        throw error;
}
export async function unsaveTask(userId, taskId) {
    const { error } = await supabase
        .from('saved_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('task_id', taskId);
    if (error)
        throw error;
}
//# sourceMappingURL=savedTasks.js.map