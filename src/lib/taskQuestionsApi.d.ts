import type { TaskQuestion, TaskWithCode, QuestionRunAnswer } from '../types/taskQuestions';
/** Fetch one catalog task by its human-readable code (e.g. "TSK-005"). */
export declare function fetchTaskByCode(taskCode: string): Promise<TaskWithCode | null>;
/** Fetch the 10 (or fewer) questions for a task, in order. */
export declare function fetchTaskQuestions(taskCode: string): Promise<TaskQuestion[]>;
/**
 * Get the user's existing in-progress submission for this task, or create
 * a new one. Returns the submission id + whatever content has been saved
 * so a refresh mid-task doesn't lose progress.
 */
export declare function getOrCreateSubmission(userId: string, taskId: string, taskCode: string): Promise<{
    id: any;
    status: any;
    submitted_content: any;
} | null>;
/** Upsert one question's answer into submitted_content, saving progress as the user goes. */
export declare function saveAnswerProgress(submissionId: string, taskCode: string, currentAnswers: QuestionRunAnswer[], answer: QuestionRunAnswer): Promise<QuestionRunAnswer[]>;
/** Mark the submission as submitted for review — this is what makes it show up for admin approval / payout. */
export declare function finalizeSubmission(submissionId: string): Promise<boolean>;
//# sourceMappingURL=taskQuestionsApi.d.ts.map