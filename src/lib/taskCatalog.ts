import type { Task } from '../types';

export interface TaskCatalogItem extends Omit<Task, 'category' | 'difficulty'> {
  taskCode: string | null;
  category: 'academic' | 'rlhf' | 'data-verification';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  device: 'any' | 'mobile' | 'desktop';
}

export interface TaskRow {
  id: string;
  task_code: string | null;
  title: string;
  description: string;
  category: TaskCatalogItem['category'];
  reward: number | string;
  estimated_time_minutes: number;
  difficulty: TaskCatalogItem['difficulty'];
  device: TaskCatalogItem['device'];
  requires_desktop: boolean;
  is_active: boolean;
}

export type LegacyTaskRow = Omit<TaskRow, 'task_code' | 'field'>;

export function mapTaskRow(row: TaskRow): TaskCatalogItem {
  return {
    id: row.id,
    taskCode: row.task_code,
    title: row.title,
    description: row.description,
    category: row.category,
    reward: Number(row.reward),
    estimatedTime: row.estimated_time_minutes,
    difficulty: row.difficulty,
    device: row.device,
    requiresDesktop: row.requires_desktop,
    status: 'available',
  };
}

export function mapLegacyTaskRow(row: LegacyTaskRow): TaskCatalogItem {
  return mapTaskRow({ ...row, task_code: null });
}
