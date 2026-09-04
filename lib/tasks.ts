import 'server-only';
import { sql } from './db';
import { TASK_COLUMN_KEYS } from './task-columns';
import { monthRange, previousYearMonth } from './date';

export type TaskStatus = 'not_started' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

// Re-export để code hiện có (và các phase trước trong plan) import từ đúng
// chỗ; định nghĩa gốc nằm ở lib/task-columns.ts (KHÔNG có 'server-only') vì
// component client task-board.tsx cần dùng hằng số này ở runtime — 1 file
// server-only không bao giờ được import theo giá trị (không phải type-only)
// từ code client, dù chỉ là 1 hằng số vô hại.
export { TASK_COLUMN_KEYS };
export type { TaskColumnKey } from './task-columns';

export interface Task {
  id: number;
  teamId: number | null;
  ownerUserId: number | null;
  categoryId: number | null;
  taskDate: string;
  dueDate: string | null;
  assigneeUserId: number | null;
  assigneeFullName: string | null;
  assigneeAvatarUrl: string | null;
  accountName: string | null;
  title: string;
  channelName: string | null;
  channel: string | null;
  videoCount: number | null;
  product: string | null;
  optionTag: string | null;
  referenceLink: string | null;
  note: string | null;
  description: string | null;
  imageUrl: string | null;
  priority: TaskPriority;
  originalTaskDate: string | null;
  rolledOverAt: string | null;
  status: TaskStatus;
  sortOrder: number;
  duplicatedFromTaskId: number | null;
  createdBy: number | null;
  createdByFullName: string | null;
  createdByAvatarUrl: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  categoryId?: number | null;
  taskDate: string;
  assigneeUserId?: number | null;
  accountName?: string | null;
  title: string;
  channelName?: string | null;
  channel?: string | null;
  videoCount?: number | null;
  product?: string | null;
  optionTag?: string | null;
  referenceLink?: string | null;
  note?: string | null;
  status?: TaskStatus;
}

export type TaskPatch = Partial<TaskInput>;

/** Task cá nhân của người không thuộc đội KD nào — dùng các field công việc
 *  chung; không có category/assignee/channel/... vốn đặc thù cho task đội KD. */
export interface PersonalTaskInput {
  title: string;
  taskDate: string;
  dueDate?: string | null;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export type PersonalTaskPatch = Partial<PersonalTaskInput>;

export interface PersonalTaskComment {
  id: number;
  taskId: number;
  authorUserId: number;
  authorFullName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalTaskHistoryEntry {
  id: number;
  taskId: number;
  actorUserId: number | null;
  actorFullName: string | null;
  actorAvatarUrl: string | null;
  eventType: 'created' | 'updated' | 'commented' | 'image_updated' | 'rollover';
  changes: Record<string, unknown>;
  createdAt: string;
}

export interface PersonalTaskDetail {
  task: Task;
  comments: PersonalTaskComment[];
  history: PersonalTaskHistoryEntry[];
}

const TASK_SELECT_CORE = `
  t.id, t.team_id, t.owner_user_id, t.category_id, t.task_date::text AS task_date, t.due_date::text AS due_date, t.assignee_user_id,
  u.full_name AS assignee_full_name, u.avatar_url AS assignee_avatar_url, t.account_name, t.title, t.channel_name, t.channel, t.video_count,
  t.product, t.option_tag, t.reference_link, t.note, t.status, t.sort_order, t.duplicated_from_task_id,
  t.description, t.image_url, t.priority, t.original_task_date::text AS original_task_date, t.rolled_over_at,
  t.created_by, cb.full_name AS created_by_full_name, cb.avatar_url AS created_by_avatar_url
`;

/** Task đội không có comment cá nhân: trả 0 theo contract mà không chạy một
 * correlated subquery vô ích cho từng dòng task. */
const TEAM_TASK_SELECT = `${TASK_SELECT_CORE}, 0::int AS comment_count, t.created_at, t.updated_at`;

/** Personal card cần badge số bình luận; index
 * personal_task_comments(task_id, created_at) hỗ trợ probe theo từng task. */
const PERSONAL_TASK_SELECT = `${TASK_SELECT_CORE},
  (SELECT count(*)::int FROM personal_task_comments pc WHERE pc.task_id = t.id) AS comment_count,
  t.created_at, t.updated_at`;

// Join dùng chung ở mọi query task (đội KD lẫn cá nhân) — cb (creator) cho biết
// AI thực sự tạo dòng task này, khác owner_user_id/assignee_user_id. Task cá
// nhân do BGĐ tạo hộ (viewerIsBgd, xem requirePersonalTaskContext) dùng field
// này để board cá nhân hiện "Task sếp đưa" kèm tên/avatar người giao.
const TASK_JOINS = `LEFT JOIN users u ON u.id = t.assignee_user_id LEFT JOIN users cb ON cb.id = t.created_by`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTaskRow(row: any): Task {
  return {
    id: row.id,
    teamId: row.team_id,
    ownerUserId: row.owner_user_id,
    categoryId: row.category_id,
    taskDate: row.task_date,
    dueDate: row.due_date,
    assigneeUserId: row.assignee_user_id,
    assigneeFullName: row.assignee_full_name,
    assigneeAvatarUrl: row.assignee_avatar_url,
    accountName: row.account_name,
    title: row.title,
    channelName: row.channel_name,
    channel: row.channel,
    videoCount: row.video_count,
    product: row.product,
    optionTag: row.option_tag,
    referenceLink: row.reference_link,
    note: row.note,
    description: row.description,
    imageUrl: row.image_url,
    priority: row.priority ?? 'normal',
    originalTaskDate: row.original_task_date,
    rolledOverAt: row.rolled_over_at,
    status: row.status,
    sortOrder: row.sort_order,
    duplicatedFromTaskId: row.duplicated_from_task_id,
    createdBy: row.created_by,
    createdByFullName: row.created_by_full_name,
    createdByAvatarUrl: row.created_by_avatar_url,
    commentCount: row.comment_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListTasksFilter {
  categoryId?: number | null;
  fromDate: string;
  toDate: string;
}

/** Dùng chung cho cả 3 chế độ xem Ngày/Tuần/Tháng — chỉ khác fromDate/toDate. */
export async function listTasksForTeam(teamId: number, filter: ListTasksFilter): Promise<Task[]> {
  const params: unknown[] = [teamId, filter.fromDate, filter.toDate];
  let categoryClause = '';
  if (filter.categoryId !== undefined) {
    if (filter.categoryId === null) {
      categoryClause = 'AND t.category_id IS NULL';
    } else {
      params.push(filter.categoryId);
      categoryClause = `AND t.category_id = $${params.length}`;
    }
  }

  const rows = await sql.query(
    `SELECT ${TEAM_TASK_SELECT}
     FROM tasks t ${TASK_JOINS}
     WHERE t.team_id = $1 AND t.task_date BETWEEN $2 AND $3 ${categoryClause}
     ORDER BY t.task_date ASC, t.id ASC`,
    params
  );
  return rows.map(mapTaskRow);
}

// Gộp INSERT + đọc lại (kèm JOIN tên người phụ trách/người tạo) vào 1 câu
// SQL bằng CTE thay vì INSERT rồi gọi getTaskById riêng — giảm 1 round-trip
// HTTP tới Neon mỗi lần tạo task (đáng kể vì driver serverless của Neon gọi
// HTTP cho mỗi query, không giữ kết nối TCP).
export async function createTask(teamId: number, input: TaskInput, createdBy: number | null): Promise<Task> {
  const rows = await sql.query(
    `/* write */ WITH next_order AS (
       -- Task mới luôn xếp CUỐI nhóm (kiểu Excel: hàng mới thêm không chen vào
       -- giữa) — lấy sort_order lớn nhất đang có trong đội +1, KHÔNG để mặc
       -- định 0 (default cột) như trước: 1 khi trong đội đã có task từng bị
       -- kéo-thả (sort_order > 0), default 0 sẽ ĐỨNG TRƯỚC cả nhóm đó thay vì
       -- ở cuối — đúng lỗi "task mới nhảy lên đầu/giữa" người dùng gặp.
       SELECT coalesce(max(sort_order), 0) + 1 AS value FROM tasks WHERE team_id = $1
     ), ins AS (
       INSERT INTO tasks
         (team_id, category_id, task_date, assignee_user_id, account_name, title, channel_name, channel,
          video_count, product, option_tag, reference_link, note, status, sort_order, created_by)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, next_order.value, $15
       FROM next_order
       RETURNING *
     )
     SELECT ${TEAM_TASK_SELECT} FROM ins t ${TASK_JOINS}`,
    [
      teamId,
      input.categoryId ?? null,
      input.taskDate,
      input.assigneeUserId ?? null,
      input.accountName ?? null,
      input.title,
      input.channelName ?? null,
      input.channel ?? null,
      input.videoCount ?? null,
      input.product ?? null,
      input.optionTag ?? null,
      input.referenceLink ?? null,
      input.note ?? null,
      input.status ?? 'not_started',
      createdBy,
    ]
  );
  if (!rows[0]) throw new Error('Không tạo được task.');
  return mapTaskRow(rows[0]);
}

export async function getTaskById(taskId: number, teamId: number): Promise<Task | null> {
  const rows = await sql.query(
    `SELECT ${TEAM_TASK_SELECT} FROM tasks t ${TASK_JOINS}
     WHERE t.id = $1 AND t.team_id = $2`,
    [taskId, teamId]
  );
  return rows[0] ? mapTaskRow(rows[0]) : null;
}

/** SET động — chỉ cập nhật đúng field có mặt trong patch (giống
 *  updatePersonalTask bên dưới), thay vì đọc nguyên hàng rồi ghi đè cả 14
 *  cột như trước. Kéo-thả đổi status trên Kanban chỉ cần đổi 1 cột nhưng bản
 *  cũ tốn tới 3 round-trip (đọc, ghi, đọc lại) — bản này còn 1 round-trip
 *  nhờ RETURNING + JOIN gộp trong cùng câu SQL. */
export async function updateTask(taskId: number, teamId: number, patch: TaskPatch): Promise<Task> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const set = (column: string, value: unknown) => {
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  };

  if (patch.categoryId !== undefined) set('category_id', patch.categoryId);
  if (patch.taskDate !== undefined) set('task_date', patch.taskDate);
  if (patch.assigneeUserId !== undefined) set('assignee_user_id', patch.assigneeUserId);
  if (patch.accountName !== undefined) set('account_name', patch.accountName);
  if (patch.title !== undefined) set('title', patch.title);
  if (patch.channelName !== undefined) set('channel_name', patch.channelName);
  if (patch.channel !== undefined) set('channel', patch.channel);
  if (patch.videoCount !== undefined) set('video_count', patch.videoCount);
  if (patch.product !== undefined) set('product', patch.product);
  if (patch.optionTag !== undefined) set('option_tag', patch.optionTag);
  if (patch.referenceLink !== undefined) set('reference_link', patch.referenceLink);
  if (patch.note !== undefined) set('note', patch.note);
  if (patch.status !== undefined) set('status', patch.status);

  if (sets.length === 0) {
    const current = await getTaskById(taskId, teamId);
    if (!current) throw new Error('Không tìm thấy task.');
    return current;
  }

  sets.push('updated_at = now()');
  params.push(taskId, teamId);
  const rows = await sql.query(
    `/* write */ WITH upd AS (
       UPDATE tasks SET ${sets.join(', ')}
       WHERE id = $${params.length - 1} AND team_id = $${params.length}
       RETURNING *
     )
     SELECT ${TEAM_TASK_SELECT} FROM upd t ${TASK_JOINS}`,
    params
  );
  if (!rows[0]) throw new Error('Không tìm thấy task.');
  return mapTaskRow(rows[0]);
}

/** Ghi lại thứ tự kéo-thả trong bảng Giao Task — `orderedTaskIds` là ID theo
 *  đúng thứ tự hiển thị mới của 1 nhóm (thường là toàn bộ task của 1 người
 *  phụ trách đang hiện trên bảng), set-based bằng 1 câu UPDATE duy nhất thay
 *  vì lặp update từng dòng. team_id trong điều kiện WHERE chặn 1 quản lý đội
 *  này gửi ID task của đội khác. */
export async function reorderTasks(teamId: number, orderedTaskIds: number[]): Promise<void> {
  if (orderedTaskIds.length === 0) return;
  await sql.query(
    `/* write */ WITH bounds AS (
       -- Cộng thêm vào sort_order LỚN NHẤT hiện có của cả đội (không reset về
       -- 1,2,3...) — nếu gán lại từ 1 mỗi lần kéo-thả, task tạo mới sau đó
       -- (sort_order = max+1 của lúc tạo, xem createTask) rất dễ có giá trị
       -- NHỎ HƠN 1,2,3 vừa gán, khiến task mới lại đứng trước cả nhóm vừa
       -- kéo — cùng lỗi "nhảy vị trí" nhưng theo chiều ngược lại.
       SELECT coalesce(max(sort_order), 0) AS base FROM tasks WHERE team_id = $1
     ), payload AS (
       SELECT id, ord FROM unnest($2::int[]) WITH ORDINALITY AS r(id, ord)
     )
     UPDATE tasks t SET sort_order = bounds.base + payload.ord, updated_at = now()
     FROM payload, bounds
     WHERE t.id = payload.id AND t.team_id = $1`,
    [teamId, orderedTaskIds]
  );
}

export async function deleteTask(taskId: number, teamId: number): Promise<void> {
  await sql.query('DELETE FROM tasks WHERE id = $1 AND team_id = $2', [taskId, teamId]);
}

/** Nhân bản 1 task sang 1 ngày khác — dòng thật, độc lập, status reset về
 *  "chưa bắt đầu", duplicated_from_task_id chỉ để truy vết. Bỏ trống
 *  assigneeUserId (undefined) để giữ nguyên người phụ trách của task gốc,
 *  truyền vào 1 userId để nhân bản sang cho người khác.
 *
 *  Gộp "đọc task gốc" + "insert bản sao" + "đọc lại kèm JOIN" — vốn là 3
 *  round-trip riêng (getTaskById, INSERT, getTaskById) — thành 1 câu SQL duy
 *  nhất bằng CTE. Quan trọng với bulkDuplicateTasks/duplicateTasksToDates vì
 *  2 hàm đó gọi duplicateTask lặp lại tới hàng chục lần: còn 1 round-trip mỗi
 *  lần cũng giúp các lần gọi độc lập nhau, chạy song song được (Promise.all)
 *  thay vì phải await tuần tự. */
export async function duplicateTask(
  taskId: number,
  teamId: number,
  toDate: string,
  createdBy: number | null,
  assigneeUserId?: number | null
): Promise<Task> {
  const overrideAssignee = assigneeUserId !== undefined;
  const rows = await sql.query(
    `/* write */ WITH src AS (
       SELECT * FROM tasks WHERE id = $1 AND team_id = $2
     ), ins AS (
       INSERT INTO tasks
         (team_id, category_id, task_date, assignee_user_id, account_name, title, channel_name, channel,
          video_count, product, option_tag, reference_link, note, status, duplicated_from_task_id, created_by)
       SELECT team_id, category_id, $3::date,
              CASE WHEN $6 THEN $5::int ELSE assignee_user_id END,
              account_name, title, channel_name, channel, video_count, product, option_tag, reference_link, note,
              'not_started', id, $4::int
       FROM src
       RETURNING *
     )
     SELECT ${TEAM_TASK_SELECT} FROM ins t ${TASK_JOINS}`,
    [taskId, teamId, toDate, createdBy, assigneeUserId ?? null, overrideAssignee]
  );
  if (!rows[0]) throw new Error('Không tìm thấy task gốc.');
  return mapTaskRow(rows[0]);
}

// Next.js xoá message gốc của MỌI lỗi throw ra khỏi Server Action khi chạy
// production (chỉ giữ digest, tránh lộ chi tiết server) — kể cả lỗi validate
// cố ý viết cho người dùng đọc như dưới đây. Đánh dấu bằng class riêng để
// action ở actions.ts nhận diện, trả về qua giá trị return thay vì throw
// (không đi qua ranh giới server->client) thì message mới nguyên vẹn.
export class BulkDuplicateValidationError extends Error {}

const MAX_BULK_DUPLICATE_OCCURRENCES = 60;

export interface BulkDuplicatePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  occurrences: number;
}

/** Nhân bản nhiều task đã tick chọn theo chu kỳ lặp (tần suất + số lần) —
 *  mỗi task tự lấy taskDate của chính nó làm mốc lặp, không theo 1 ngày
 *  chung; có thể chọn thêm nhiều người phụ trách (tích task × lần lặp ×
 *  người, mỗi tổ hợp ra 1 dòng thật độc lập). */
export async function bulkDuplicateTasks(
  taskIds: number[],
  teamId: number,
  pattern: BulkDuplicatePattern,
  assigneeUserIds: number[],
  createdBy: number | null
): Promise<Task[]> {
  if (pattern.occurrences < 1 || pattern.occurrences > MAX_BULK_DUPLICATE_OCCURRENCES) {
    throw new BulkDuplicateValidationError(`Số lần nhân bản phải từ 1 đến ${MAX_BULK_DUPLICATE_OCCURRENCES}.`);
  }
  const uniqueTaskIds = [...new Set(taskIds)];
  if (uniqueTaskIds.length < 1) throw new BulkDuplicateValidationError('Chọn ít nhất 1 task.');
  const targets = [...new Set(assigneeUserIds)];
  const targetCount = Math.max(1, targets.length);
  if (uniqueTaskIds.length * pattern.occurrences * targetCount > MAX_BULK_DUPLICATE_OCCURRENCES) {
    throw new BulkDuplicateValidationError(`Số bản nhân bản (task × số lần lặp × số người) phải tối đa ${MAX_BULK_DUPLICATE_OCCURRENCES}.`);
  }

  // Một statement tạo toàn bộ tích task × lần lặp × người phụ trách. CTE
  // `valid` chặn INSERT hoàn toàn nếu chỉ một task gốc không thuộc đội, nên
  // không thể sinh dữ liệu một phần rồi mới phát hiện lỗi ở application.
  const rows = await sql.query(
    `/* write */ WITH requested AS (
       SELECT id, ord FROM unnest($2::int[]) WITH ORDINALITY AS r(id, ord)
     ), src AS (
       SELECT t.*, r.ord AS source_ord
       FROM requested r JOIN tasks t ON t.id = r.id AND t.team_id = $1
     ), valid AS (
       SELECT count(*) = cardinality($2::int[]) AS ok FROM src
     ), occurrences AS (
       SELECT n FROM generate_series(1, $4::int) AS n
     ), targets AS (
       SELECT user_id, true AS override_assignee, ord
       FROM unnest($5::int[]) WITH ORDINALITY AS a(user_id, ord)
       UNION ALL
       SELECT NULL::int, false, 1::bigint WHERE cardinality($5::int[]) = 0
     ), ins AS (
       INSERT INTO tasks
         (team_id, category_id, task_date, assignee_user_id, account_name, title, channel_name, channel,
          video_count, product, option_tag, reference_link, note, status, duplicated_from_task_id, created_by)
       SELECT src.team_id, src.category_id,
              CASE $3::text
                WHEN 'daily' THEN src.task_date + occurrences.n
                WHEN 'weekly' THEN src.task_date + occurrences.n * 7
                ELSE (
                  date_trunc('month', src.task_date)
                  + make_interval(months => occurrences.n)
                  + make_interval(days => extract(day FROM src.task_date)::int - 1)
                )::date
              END,
              CASE WHEN targets.override_assignee THEN targets.user_id ELSE src.assignee_user_id END,
              src.account_name, src.title, src.channel_name, src.channel, src.video_count, src.product, src.option_tag,
              src.reference_link, src.note, 'not_started', src.id, $6::int
       FROM src CROSS JOIN occurrences CROSS JOIN targets CROSS JOIN valid
       WHERE valid.ok
       RETURNING *
     )
     SELECT ${TEAM_TASK_SELECT} FROM ins t ${TASK_JOINS} ORDER BY t.id`,
    [teamId, uniqueTaskIds, pattern.frequency, pattern.occurrences, targets, createdBy]
  );
  const expectedCount = uniqueTaskIds.length * pattern.occurrences * targetCount;
  if (rows.length !== expectedCount) throw new BulkDuplicateValidationError('Không tìm thấy task gốc.');
  return rows.map(mapTaskRow);
}

/** Nhân bản nhiều task đã tick chọn sang nhiều ngày chọn tự do trên lịch
 *  (không theo chu kỳ như bulkDuplicateTasks), có thể chọn thêm nhiều người
 *  phụ trách — mỗi tổ hợp (task, ngày, người) ra 1 dòng thật độc lập; bỏ
 *  trống người phụ trách thì mỗi task giữ nguyên người của chính nó. */
export async function duplicateTasksToDates(
  taskIds: number[],
  teamId: number,
  dates: string[],
  assigneeUserIds: number[],
  createdBy: number | null
): Promise<Task[]> {
  const uniqueTaskIds = [...new Set(taskIds)];
  const uniqueDates = [...new Set(dates)];
  if (uniqueTaskIds.length < 1) throw new BulkDuplicateValidationError('Chọn ít nhất 1 task.');
  if (uniqueDates.length < 1) throw new BulkDuplicateValidationError('Chọn ít nhất 1 ngày đích.');
  const targets = [...new Set(assigneeUserIds)];
  const targetCount = Math.max(1, targets.length);
  if (uniqueTaskIds.length * uniqueDates.length * targetCount > MAX_BULK_DUPLICATE_OCCURRENCES) {
    throw new BulkDuplicateValidationError(`Số bản nhân bản (task × ngày × người) phải tối đa ${MAX_BULK_DUPLICATE_OCCURRENCES}.`);
  }
  const rows = await sql.query(
    `/* write */ WITH requested AS (
       SELECT id, ord FROM unnest($2::int[]) WITH ORDINALITY AS r(id, ord)
     ), src AS (
       SELECT t.*, r.ord AS source_ord
       FROM requested r JOIN tasks t ON t.id = r.id AND t.team_id = $1
     ), valid AS (
       SELECT count(*) = cardinality($2::int[]) AS ok FROM src
     ), dates AS (
       SELECT task_date, ord FROM unnest($3::date[]) WITH ORDINALITY AS d(task_date, ord)
     ), targets AS (
       SELECT user_id, true AS override_assignee, ord
       FROM unnest($4::int[]) WITH ORDINALITY AS a(user_id, ord)
       UNION ALL
       SELECT NULL::int, false, 1::bigint WHERE cardinality($4::int[]) = 0
     ), ins AS (
       INSERT INTO tasks
         (team_id, category_id, task_date, assignee_user_id, account_name, title, channel_name, channel,
          video_count, product, option_tag, reference_link, note, status, duplicated_from_task_id, created_by)
       SELECT src.team_id, src.category_id, dates.task_date,
              CASE WHEN targets.override_assignee THEN targets.user_id ELSE src.assignee_user_id END,
              src.account_name, src.title, src.channel_name, src.channel, src.video_count, src.product, src.option_tag,
              src.reference_link, src.note, 'not_started', src.id, $5::int
       FROM src CROSS JOIN dates CROSS JOIN targets CROSS JOIN valid
       WHERE valid.ok
       RETURNING *
     )
     SELECT ${TEAM_TASK_SELECT} FROM ins t ${TASK_JOINS} ORDER BY t.id`,
    [teamId, uniqueTaskIds, uniqueDates, targets, createdBy]
  );
  const expectedCount = uniqueTaskIds.length * uniqueDates.length * targetCount;
  if (rows.length !== expectedCount) throw new BulkDuplicateValidationError('Không tìm thấy task gốc.');
  return rows.map(mapTaskRow);
}

export async function getMonthProgress(teamId: number, yearMonth: string): Promise<{ done: number; total: number }> {
  const { from, to } = monthRange(yearMonth);
  const rows = await sql.query(
    `SELECT count(*) FILTER (WHERE status = 'done')::int AS done, count(*)::int AS total
     FROM tasks WHERE team_id = $1 AND task_date >= $2 AND task_date < $3`,
    [teamId, from, to]
  );
  return { done: rows[0]?.done ?? 0, total: rows[0]?.total ?? 0 };
}

export interface MonthDayCategoryCount {
  date: string;
  categoryId: number | null;
  count: number;
}

/** Số task theo từng ngày, chia theo nhóm của NGƯỜI PHỤ TRÁCH
 *  (team_members.category_id) — dùng cho lịch mini ở sidebar Giao Task, vừa
 *  tô màu "ngày có hoạt động" vừa hiện số lượng riêng từng nhóm (vd
 *  "Media: 5, Support: 3") ngay trên từng ô ngày. categoryId null nghĩa là
 *  task của người chưa được xếp vào nhóm nào. */
export async function getMonthTaskCategoryCounts(teamId: number, yearMonth: string): Promise<MonthDayCategoryCount[]> {
  // Lịch mini hiện liền tháng đang chọn + tháng liền trước (xem TaskCalendar)
  // — gộp khoảng ngày của cả 2 tháng trong 1 câu truy vấn thay vì gọi 2 lần.
  const { from } = monthRange(previousYearMonth(yearMonth));
  const { to } = monthRange(yearMonth);
  const rows = await sql.query(
    `SELECT t.task_date::text AS date, tm.category_id AS category_id, count(*)::int AS count
     FROM tasks t JOIN team_members tm ON tm.user_id = t.assignee_user_id AND tm.team_id = t.team_id
     WHERE t.team_id = $1 AND t.task_date >= $2 AND t.task_date < $3
     GROUP BY t.task_date, tm.category_id`,
    [teamId, from, to]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ date: r.date, categoryId: r.category_id, count: r.count }));
}

export interface DailyAssigneeCount {
  date: string;
  assigneeUserId: number | null;
  fullName: string | null;
  count: number;
  done: number;
}

export async function getDailyAssigneeBreakdown(teamId: number, yearMonth: string): Promise<DailyAssigneeCount[]> {
  // Biểu đồ cuối trang giờ hiện liền tháng đang chọn + tháng liền trước (xem
  // MonthlyDailyChart) — gộp khoảng ngày của cả 2 tháng trong 1 câu truy vấn.
  const { from } = monthRange(previousYearMonth(yearMonth));
  const { to } = monthRange(yearMonth);
  const rows = await sql.query(
    `SELECT t.task_date::text AS date, t.assignee_user_id, u.full_name, count(*)::int AS count,
            count(*) FILTER (WHERE t.status = 'done')::int AS done
     FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
     WHERE t.team_id = $1 AND t.task_date >= $2 AND t.task_date < $3
     GROUP BY t.task_date, t.assignee_user_id, u.full_name
     ORDER BY t.task_date ASC`,
    [teamId, from, to]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    date: row.date,
    assigneeUserId: row.assignee_user_id,
    fullName: row.full_name,
    count: row.count,
    done: row.done,
  }));
}

/** Danh sách sản phẩm của 1 đội — lấy từ các giá trị `product` đã từng lưu
 *  trên toàn bộ task của đội (không giới hạn theo khoảng ngày đang xem), nên
 *  gõ 1 sản phẩm mới khi tạo/sửa task là đủ để nó tự xuất hiện trong danh
 *  sách chọn ở những lần sau — không cần bảng riêng để quản lý sản phẩm. */
export async function getDistinctProductsForTeam(teamId: number): Promise<string[]> {
  const rows = await sql.query(
    `SELECT DISTINCT product FROM tasks WHERE team_id = $1 AND product IS NOT NULL AND product <> '' ORDER BY product`,
    [teamId]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => row.product as string);
}

export interface TeamMonthProgress {
  teamId: number;
  code: string;
  done: number;
  total: number;
  notStarted: number;
  inProgress: number;
  /** Chưa xong và đã qua ngày task_date so với `today` truyền vào — mốc "hôm nay" lấy theo giờ VN (xem lib/date.ts), không dùng CURRENT_DATE của DB (hạ tầng chạy UTC). */
  overdue: number;
}

/** 1 JOIN cho cả 6 đội — dùng cho view gộp BGĐ, tránh N+1. */
export async function getAllTeamsMonthProgress(yearMonth: string, today: string): Promise<TeamMonthProgress[]> {
  const { from, to } = monthRange(yearMonth);
  const rows = await sql.query(
    `SELECT t.id AS team_id, t.code,
            count(k.*) FILTER (WHERE k.status = 'done')::int AS done,
            count(k.*)::int AS total,
            count(k.*) FILTER (WHERE k.status = 'not_started')::int AS not_started,
            count(k.*) FILTER (WHERE k.status = 'in_progress')::int AS in_progress,
            count(k.*) FILTER (WHERE k.status != 'done' AND k.task_date < $3)::int AS overdue
     FROM teams t
     LEFT JOIN tasks k ON k.team_id = t.id AND k.task_date >= $1 AND k.task_date < $2
     GROUP BY t.id
     ORDER BY t.code ASC`,
    [from, to, today]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    teamId: row.team_id,
    code: row.code,
    done: row.done,
    total: row.total,
    notStarted: row.not_started,
    inProgress: row.in_progress,
    overdue: row.overdue,
  }));
}

export interface ListTasksOwnerFilter {
  fromDate: string;
  toDate: string;
}

/** Task cá nhân của người không thuộc đội KD nào — luôn lọc theo
 *  owner_user_id, không có category/roster như task đội KD. */
export async function listTasksForOwner(ownerUserId: number, filter: ListTasksOwnerFilter): Promise<Task[]> {
  const rows = await sql.query(
    `SELECT ${PERSONAL_TASK_SELECT}
     FROM tasks t ${TASK_JOINS}
     WHERE t.owner_user_id = $1 AND t.task_date BETWEEN $2 AND $3
     ORDER BY
       CASE WHEN t.rolled_over_at IS NOT NULL AND t.status != 'done' THEN 0 ELSE 1 END ASC,
       COALESCE(t.original_task_date, t.task_date) ASC,
       CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END ASC,
       t.id ASC`,
    [ownerUserId, filter.fromDate, filter.toDate]
  );
  return rows.map(mapTaskRow);
}

/** category_id/assignee_user_id/channel/product/option_tag/reference_link/
 *  account_name hardcode NULL ngay trong câu SQL (không đọc từ input) —
 *  task cá nhân không dùng các field đặc thù đội KD này, và hardcode ở đây
 *  đảm bảo không lọt qua dù tầng validate phía trên có sai sót. */
export async function createPersonalTask(ownerUserId: number, input: PersonalTaskInput, createdBy: number | null): Promise<Task> {
  const rows = await sql.query(
    `/* write */ WITH ins AS (
       INSERT INTO tasks (owner_user_id, task_date, due_date, title, description, priority, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *
     ), history AS (
       INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
       SELECT id, $8, 'created', jsonb_build_object('title', title, 'taskDate', task_date::text, 'dueDate', due_date::text, 'priority', priority)
       FROM ins
     )
     SELECT ${PERSONAL_TASK_SELECT} FROM ins t ${TASK_JOINS}`,
    [
      ownerUserId,
      input.taskDate,
      input.dueDate ?? null,
      input.title,
      input.description ?? null,
      input.priority ?? 'normal',
      input.status ?? 'not_started',
      createdBy,
    ]
  );
  if (!rows[0]) throw new Error('Không tạo được task.');
  return mapTaskRow(rows[0]);
}

/** Tạo cả chuỗi task lặp trong một statement. Payload đã được validate ở
 * Server Action; DAL vẫn giới hạn số dòng để một caller nội bộ không thể vô
 * tình tạo batch quá lớn. History và audit BGĐ cũng được ghi set-based trong
 * cùng transaction ngầm của statement, nên không có trạng thái tạo task mà
 * thiếu nhật ký tương ứng. */
export async function createPersonalTasks(
  ownerUserId: number,
  inputs: PersonalTaskInput[],
  createdBy: number
): Promise<Task[]> {
  if (inputs.length < 1 || inputs.length > 52) {
    throw new Error('Số task tạo cùng lúc phải từ 1 đến 52.');
  }
  const payload = inputs.map((input, index) => ({
    ordinal: index,
    task_date: input.taskDate,
    due_date: input.dueDate ?? null,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'normal',
    status: input.status ?? 'not_started',
  }));
  const rows = await sql.query(
    `/* write */ WITH payload AS (
       SELECT * FROM jsonb_to_recordset($2::jsonb) AS p(
         ordinal int, task_date date, due_date date, title text, description text, priority text, status text
       )
     ), ins AS (
       INSERT INTO tasks (owner_user_id, task_date, due_date, title, description, priority, status, created_by)
       SELECT $1, task_date, due_date, title, description, priority, status, $3
       FROM payload ORDER BY ordinal
       RETURNING *
     ), history AS (
       INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
       SELECT id, $3, 'created', jsonb_build_object(
         'title', title,
         'taskDate', task_date::text,
         'dueDate', due_date::text,
         'priority', priority
       ) FROM ins
     ), audit AS (
       INSERT INTO admin_audit_log (actor_user_id, action, target_user_id, detail)
       SELECT $3, 'personal_task.create', $1, jsonb_build_object('docId', id::text)
       FROM ins WHERE $3::int <> $1::int
     )
     SELECT ${PERSONAL_TASK_SELECT} FROM ins t ${TASK_JOINS} ORDER BY t.id`,
    [ownerUserId, JSON.stringify(payload), createdBy]
  );
  if (rows.length !== inputs.length) throw new Error('Không tạo đủ task.');
  return rows.map(mapTaskRow);
}

export async function getPersonalTaskById(taskId: number, ownerUserId: number): Promise<Task | null> {
  const rows = await sql.query(
    `SELECT ${PERSONAL_TASK_SELECT} FROM tasks t ${TASK_JOINS}
     WHERE t.id = $1 AND t.owner_user_id = $2`,
    [taskId, ownerUserId]
  );
  return rows[0] ? mapTaskRow(rows[0]) : null;
}

/** Chỉ UPDATE các cột thực sự có trong patch (SET động) — KHÔNG SELECT rồi
 *  ghi đè cả hàng như updateTask (task cá nhân có 2 người có thể ghi cùng
 *  hàng — chủ và BGĐ xem hộ — ghi đè cả hàng dễ mất thay đổi của người kia). */
export async function updatePersonalTask(
  taskId: number,
  ownerUserId: number,
  patch: PersonalTaskPatch,
  actorUserId: number
): Promise<Task> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const historyParts: string[] = [];
  const addHistoryPart = (key: string, column: string) => {
    historyParts.push(
      `CASE WHEN old_${column} IS DISTINCT FROM ${column} THEN jsonb_build_object('${key}', jsonb_build_object('from', old_${column}, 'to', ${column})) ELSE '{}'::jsonb END`
    );
  };
  if (patch.title !== undefined) {
    params.push(patch.title);
    sets.push(`title = $${params.length}`);
    addHistoryPart('title', 'title');
  }
  if (patch.taskDate !== undefined) {
    params.push(patch.taskDate);
    sets.push(`task_date = $${params.length}`);
    addHistoryPart('taskDate', 'task_date');
  }
  if (patch.dueDate !== undefined) {
    params.push(patch.dueDate);
    sets.push(`due_date = $${params.length}`);
    addHistoryPart('dueDate', 'due_date');
  }
  if (patch.description !== undefined) {
    params.push(patch.description);
    sets.push(`description = $${params.length}`);
    addHistoryPart('description', 'description');
  }
  if (patch.priority !== undefined) {
    params.push(patch.priority);
    sets.push(`priority = $${params.length}`);
    addHistoryPart('priority', 'priority');
  }
  if (patch.status !== undefined) {
    params.push(patch.status);
    sets.push(`status = $${params.length}`);
    addHistoryPart('status', 'status');
  }
  if (sets.length > 0) {
    sets.push('updated_at = now()');
    params.push(taskId, ownerUserId, actorUserId);
    const taskIdParam = params.length - 2;
    const ownerParam = params.length - 1;
    const actorParam = params.length;
    const oldColumns = ['title', 'task_date', 'due_date', 'description', 'priority', 'status']
      .map((column) => `b.${column} AS old_${column}`)
      .join(', ');
    const changes = historyParts.join(' || ');
    const rows = await sql.query(
      `/* write */ WITH before AS MATERIALIZED (
         SELECT * FROM tasks WHERE id = $${taskIdParam} AND owner_user_id = $${ownerParam} FOR UPDATE
       ), upd AS (
         UPDATE tasks t SET ${sets.join(', ')}
         FROM before b WHERE t.id = b.id
         RETURNING t.*, ${oldColumns}
       ), history AS (
         INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
         SELECT id, $${actorParam}, 'updated', ${changes} FROM upd
         WHERE (${changes}) != '{}'::jsonb
       )
       SELECT ${PERSONAL_TASK_SELECT} FROM upd t ${TASK_JOINS}`,
      params
    );
    if (!rows[0]) throw new Error('Không tìm thấy task sau khi cập nhật.');
    return mapTaskRow(rows[0]);
  }
  const updated = await getPersonalTaskById(taskId, ownerUserId);
  if (!updated) throw new Error('Không tìm thấy task sau khi cập nhật.');
  return updated;
}

export async function deletePersonalTask(taskId: number, ownerUserId: number): Promise<string | null> {
  const rows = await sql.query(
    'DELETE FROM tasks WHERE id = $1 AND owner_user_id = $2 RETURNING image_url',
    [taskId, ownerUserId]
  );
  return rows[0]?.image_url ?? null;
}

/** Nhân bản 1 task cá nhân sang 1 ngày khác — dòng thật, độc lập, status
 *  reset về "chưa bắt đầu", giống nguyên tắc nhân bản task đội KD. */
export async function duplicatePersonalTask(
  taskId: number,
  ownerUserId: number,
  toDate: string,
  createdBy: number | null
): Promise<Task> {
  const rows = await sql.query(
    `/* write */ WITH src AS (
       SELECT * FROM tasks WHERE id = $1 AND owner_user_id = $2
     ), ins AS (
       INSERT INTO tasks (owner_user_id, task_date, title, description, priority, status, duplicated_from_task_id, created_by)
       SELECT owner_user_id, $3::date, title, description, priority, 'not_started', id, $4::int
       FROM src
       RETURNING *
     ), history AS (
       INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
       SELECT id, $4::int, 'created', jsonb_build_object('duplicatedFromTaskId', $1, 'taskDate', task_date::text)
       FROM ins
     )
     SELECT ${PERSONAL_TASK_SELECT} FROM ins t ${TASK_JOINS}`,
    [taskId, ownerUserId, toDate, createdBy]
  );
  if (!rows[0]) throw new Error('Không tìm thấy task gốc.');
  return mapTaskRow(rows[0]);
}

export async function setPersonalTaskImageUrl(
  taskId: number,
  ownerUserId: number,
  imageUrl: string | null,
  actorUserId: number
): Promise<{ task: Task; previousImageUrl: string | null }> {
  const rows = await sql.query(
    `/* write */ WITH before AS MATERIALIZED (
       SELECT * FROM tasks WHERE id = $1 AND owner_user_id = $2 FOR UPDATE
     ), upd AS (
       UPDATE tasks t
       SET image_url = $3, updated_at = now()
       FROM before b WHERE t.id = b.id
       RETURNING t.*, b.image_url AS old_image_url
     ), history AS (
       INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
       SELECT id, $4, 'image_updated', jsonb_build_object(
         'imageUrl', jsonb_build_object('from', old_image_url, 'to', image_url)
       ) FROM upd WHERE old_image_url IS DISTINCT FROM image_url
     )
     SELECT ${PERSONAL_TASK_SELECT} FROM upd t ${TASK_JOINS}`,
    [taskId, ownerUserId, imageUrl, actorUserId]
  );
  if (!rows[0]) throw new Error('Không tìm thấy task.');
  return { task: mapTaskRow(rows[0]), previousImageUrl: rows[0].old_image_url ?? null };
}

export async function addPersonalTaskComment(
  taskId: number,
  ownerUserId: number,
  authorUserId: number,
  content: string
): Promise<PersonalTaskComment> {
  const rows = await sql.query(
    `/* write */ WITH ins AS (
       INSERT INTO personal_task_comments (task_id, author_user_id, content)
       SELECT t.id, $3, $4 FROM tasks t WHERE t.id = $1 AND t.owner_user_id = $2
       RETURNING *
     ), history AS (
       INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
       SELECT task_id, author_user_id, 'commented', jsonb_build_object('commentId', id) FROM ins
     )
     SELECT c.id, c.task_id, c.author_user_id, u.full_name AS author_full_name,
            u.avatar_url AS author_avatar_url, c.content, c.created_at, c.updated_at
     FROM ins c JOIN users u ON u.id = c.author_user_id`,
    [taskId, ownerUserId, authorUserId, content]
  );
  if (!rows[0]) throw new Error('Không tìm thấy task.');
  const row = rows[0];
  return {
    id: row.id,
    taskId: row.task_id,
    authorUserId: row.author_user_id,
    authorFullName: row.author_full_name,
    authorAvatarUrl: row.author_avatar_url,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPersonalTaskDetail(taskId: number, ownerUserId: number): Promise<PersonalTaskDetail | null> {
  const task = await getPersonalTaskById(taskId, ownerUserId);
  if (!task) return null;
  const [commentRows, historyRows] = await Promise.all([
    sql.query(
      `SELECT c.id, c.task_id, c.author_user_id, u.full_name AS author_full_name,
              u.avatar_url AS author_avatar_url, c.content, c.created_at, c.updated_at
       FROM personal_task_comments c JOIN users u ON u.id = c.author_user_id
       WHERE c.task_id = $1 ORDER BY c.created_at ASC, c.id ASC`,
      [taskId]
    ),
    sql.query(
      `SELECT h.id, h.task_id, h.actor_user_id, u.full_name AS actor_full_name,
              u.avatar_url AS actor_avatar_url, h.event_type, h.changes, h.created_at
       FROM personal_task_history h LEFT JOIN users u ON u.id = h.actor_user_id
       WHERE h.task_id = $1 ORDER BY h.created_at DESC, h.id DESC`,
      [taskId]
    ),
  ]);
  return {
    task,
    comments: commentRows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      authorUserId: row.author_user_id,
      authorFullName: row.author_full_name,
      authorAvatarUrl: row.author_avatar_url,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    history: historyRows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      actorUserId: row.actor_user_id,
      actorFullName: row.actor_full_name,
      actorAvatarUrl: row.actor_avatar_url,
      eventType: row.event_type,
      changes: row.changes ?? {},
      createdAt: row.created_at,
    })),
  };
}

/** Chuyển task chưa xong ở ngày cũ thẳng tới hôm nay. UPDATE predicate làm
 *  thao tác idempotent kể cả hai lượt tải chạy đồng thời; history chỉ được
 *  tạo từ đúng các hàng UPDATE thực sự trả về. */
export async function rolloverOverduePersonalTasks(ownerUserId: number, today: string): Promise<number> {
  const rows = await sql.query(
    `/* write */ WITH candidates AS MATERIALIZED (
       SELECT id, task_date, status FROM tasks
       WHERE owner_user_id = $1 AND task_date < $2::date AND status != 'done'
       FOR UPDATE
     ), upd AS (
       UPDATE tasks t
       SET original_task_date = COALESCE(t.original_task_date, c.task_date),
           task_date = $2::date,
           status = 'in_progress',
           rolled_over_at = now(),
           updated_at = now()
       FROM candidates c
       WHERE t.id = c.id AND t.task_date < $2::date AND t.status != 'done'
       RETURNING t.id, c.task_date AS old_date, c.status AS old_status
     ), history AS (
       INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
       SELECT id, NULL, 'rollover', jsonb_build_object(
         'taskDate', jsonb_build_object('from', old_date::text, 'to', $2),
         'status', jsonb_build_object('from', old_status, 'to', 'in_progress')
       ) FROM upd
     )
     SELECT count(*)::int AS count FROM upd`,
    [ownerUserId, today]
  );
  return rows[0]?.count ?? 0;
}

export async function getPersonalMonthProgress(ownerUserId: number, yearMonth: string): Promise<{ done: number; total: number }> {
  const { from, to } = monthRange(yearMonth);
  const rows = await sql.query(
    `SELECT count(*) FILTER (WHERE status = 'done')::int AS done, count(*)::int AS total
     FROM tasks WHERE owner_user_id = $1 AND task_date >= $2 AND task_date < $3`,
    [ownerUserId, from, to]
  );
  return { done: rows[0]?.done ?? 0, total: rows[0]?.total ?? 0 };
}

/** Số task theo từng ngày cho lịch mini ở board cá nhân (bộ phận ngoài 6 đội
 *  KD) — cùng shape MonthDayCategoryCount với bản đội KD (getMonthTaskCategoryCounts)
 *  để tái dùng nguyên component TaskCalendar, nhưng categoryId luôn null vì
 *  task cá nhân không có khái niệm nhóm/category. */
export async function getPersonalMonthDayCounts(ownerUserId: number, yearMonth: string): Promise<MonthDayCategoryCount[]> {
  // Lịch mini hiện liền tháng đang chọn + tháng liền trước (xem TaskCalendar)
  // — gộp khoảng ngày của cả 2 tháng trong 1 câu truy vấn thay vì gọi 2 lần.
  const { from } = monthRange(previousYearMonth(yearMonth));
  const { to } = monthRange(yearMonth);
  const rows = await sql.query(
    `SELECT task_date::text AS date, count(*)::int AS count
     FROM tasks WHERE owner_user_id = $1 AND task_date >= $2 AND task_date < $3
     GROUP BY task_date`,
    [ownerUserId, from, to]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ date: r.date, categoryId: null, count: r.count }));
}

/** Dùng để chặn thêm 1 người đang có task cá nhân vào đội KD (xem
 *  addTeamMemberAction) — tránh dữ liệu mồ côi không UI nào đọc được. */
export async function hasPersonalTasks(userId: number): Promise<boolean> {
  const rows = await sql.query('SELECT EXISTS(SELECT 1 FROM tasks WHERE owner_user_id = $1) AS exists', [userId]);
  return Boolean(rows[0]?.exists);
}
