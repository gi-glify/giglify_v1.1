export function mapTaskRow(row) {
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
export function mapLegacyTaskRow(row) {
    return mapTaskRow({ ...row, task_code: null });
}
//# sourceMappingURL=taskCatalog.js.map