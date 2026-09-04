export interface TaskQuestion {
    id: string;
    task_code: string;
    question_number: number;
    question_text: string;
    model_answer: string;
}
export interface TaskWithCode {
    id: string;
    task_code: string;
    title: string;
    description: string;
    category: 'academic' | 'rlhf' | 'data-verification';
    reward: number;
    estimated_time_minutes: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    field: string | null;
    device: 'any' | 'mobile' | 'desktop';
    is_active: boolean;
}
export interface QuestionRunAnswer {
    question_number: number;
    response: string;
    revealed_model_answer: boolean;
    self_marked: 'correct' | 'partial' | 'incorrect' | null;
}
export interface SubmittedContent {
    task_code: string;
    answers: QuestionRunAnswer[];
    completed_at: string;
}
//# sourceMappingURL=taskQuestions.types.d.ts.map