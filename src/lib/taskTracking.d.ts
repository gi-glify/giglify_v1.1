export type TaskSubmissionStatus = 'in-progress' | 'submitted' | 'approved' | 'rejected';
export interface TaskSubmissionProgress {
    id: string;
    taskId: string;
    status: TaskSubmissionStatus;
    startedAt: string;
    completedAt: string | null;
    submittedContent: unknown;
    rewardPaid: number | null;
    rewardApproved: number | null;
    task: {
        taskCode: string | null;
        title: string;
        category: string;
        reward: number;
    } | null;
}
export interface TaskTrackingSummary {
    total: number;
    started: number;
    underReview: number;
    completed: number;
    needsAttention: number;
}
export declare function getTaskStatusMeta(status: string): {
    label: string;
    className: string;
    description: string;
};
export declare function summarizeTaskSubmissions(submissions: Array<{
    status: string;
}>): TaskTrackingSummary;
//# sourceMappingURL=taskTracking.d.ts.map