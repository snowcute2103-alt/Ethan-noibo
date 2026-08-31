/**
 * Tên field TypeScript của các cột "tuỳ chọn" trên Task mà mỗi nhóm task
 * (team_task_categories.visible_columns) có thể bật/tắt hiển thị. Tách khỏi
 * lib/tasks.ts (file đó có `import 'server-only'`) vì đây là hằng số cần
 * dùng cả ở component client (task-board.tsx) lẫn data access layer — cùng
 * lý do STICKY_NOTE_TEXT_MAX_LEN phải lặp lại giữa actions.ts và
 * sticky-board.tsx, nhưng ở đây tách file chung thay vì lặp tay vì đây là
 * một mảng dài, lặp tay dễ lệch.
 */
export const TASK_COLUMN_KEYS = [
  'accountName',
  'channel',
  'videoCount',
  'product',
  'optionTag',
  'referenceLink',
  'note',
] as const;

export type TaskColumnKey = (typeof TASK_COLUMN_KEYS)[number];
