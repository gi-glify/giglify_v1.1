// New file — does not replace or import from src/types/index.ts.
// Drop at: src/types/taskQuestions.ts

export interface TaskQuestion {
  id: string;
  task_code: string;
  question_number: number;
  question_text: string;
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

// Shape written into task_submissions.submitted_content (jsonb) — no schema
// change needed, that column already exists and already accepts any JSON.
export interface QuestionRunAnswer {
  question_number: number;
  response: string;
}

export interface SubmittedContent {
  task_code: string;
  answers: QuestionRunAnswer[];
  completed_at: string; // ISO timestamp of last question answered
}
