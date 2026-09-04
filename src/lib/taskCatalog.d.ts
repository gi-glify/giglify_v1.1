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
export declare function mapTaskRow(row: TaskRow): TaskCatalogItem;
//# sourceMappingURL=taskCatalog.d.ts.map