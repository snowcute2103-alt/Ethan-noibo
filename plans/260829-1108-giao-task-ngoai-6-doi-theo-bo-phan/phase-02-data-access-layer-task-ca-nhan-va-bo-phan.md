---
phase: 2
title: "Data access layer task ca nhan va bo phan"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Data access layer task cá nhân và bộ phận

## Overview

Thêm hàm data access cho task cá nhân (CRUD + nhân bản + tiến độ tháng) vào
`lib/tasks.ts`, và hàm liệt kê user ngoài 6 đội gom theo `department` vào
`lib/teams.ts` — theo đúng pattern song song với các hàm `*ForTeam`/`*Team*`
đã có. Phase này CŨNG sửa `Task`/`TASK_SELECT`/`mapTaskRow` — bắt buộc, không
phải optional cleanup — vì Phase 1 làm `team_id` nullable nhưng `Task.teamId`
hiện khai `number` (không nullable); không sửa thì mọi task cá nhân trả về có
`teamId: null` trong khi type nói `number`, và vì `mapTaskRow(row: any)` xoá
type nên `npm run build` sẽ KHÔNG bắt được sai lệch này (xem "Red Team
Review" trong `plan.md`, Finding về type contract).

## Requirements

- [x] **Sửa `Task` interface**: `teamId: number` → `teamId: number | null`;
      thêm `ownerUserId: number | null`. Sửa `TASK_SELECT` thêm
      `t.owner_user_id`; sửa `mapTaskRow` map thêm `ownerUserId: row.owner_user_id`.
      Chạy `tsc --noEmit` sau khi đổi để liệt kê MỌI call site đang giả định
      `teamId` không null (đặc biệt trong `task-board.tsx`) — sửa từng chỗ
      `tsc` báo lỗi, không bỏ qua bằng ép kiểu `as number`.
- [x] `listTasksForOwner(ownerUserId, filter)` — tương đương
      `listTasksForTeam` nhưng lọc `WHERE t.owner_user_id = $1`, không JOIN
      `category_id`/roster (task cá nhân không có nhóm).
- [x] `createPersonalTask(ownerUserId, input, createdBy)` — INSERT hardcode
      `category_id = NULL`, `assignee_user_id = NULL`, `channel = NULL`,
      `product = NULL`, `option_tag = NULL`, `reference_link = NULL`,
      `account_name = NULL` NGAY TRONG CÂU SQL (không đọc các field này từ
      `input`, kể cả khi `TaskInput`/`PersonalTaskInput` không có field đó).
      Đây là enforcement bắt buộc ở DAL — Phase 3 dùng `PersonalTaskInput`
      hẹp hơn `TaskInput` nên input thô cũng không có các field này, nhưng
      DAL vẫn tự hardcode NULL để không phụ thuộc 100% vào tầng validate
      phía trên (defense-in-depth, xem Finding 10 ở Red Team Review — lý do:
      `TASK_SELECT` JOIN `users` trả `assignee_full_name`/`assignee_avatar_url`,
      nếu `assignee_user_id` lọt qua thì response của 1 action "chỉ đọc task
      của chính mình" vô tình lộ họ tên + avatar của user id bất kỳ được
      truyền vào).
- [x] `getPersonalTaskById(taskId, ownerUserId)`,
      `updatePersonalTask(taskId, ownerUserId, patch)` (cùng hardcode NULL
      cho các cột trên như `createPersonalTask`, PATCH CHỈ ghi các cột có mặt
      trong `patch` — dùng SET động như các hàm `listTasksForTeam` đã dựng
      WHERE động, KHÔNG copy nguyên `updateTask` hiện tại — hàm đó SELECT rồi
      ghi đè cả 12 cột từ `{ ...current, ...patch }`, tạo read-modify-write
      không kiểm soát đồng thời; task cá nhân có 2 người viết được cùng hàng
      — chính chủ và BGĐ — nên rủi ro mất ghi tăng so với đội KD),
      `deletePersonalTask(taskId, ownerUserId)` — mọi query đều có điều kiện
      `owner_user_id = $N` để không sửa/xoá nhầm task người khác dù bị gọi
      sai tham số.
- [x] `duplicatePersonalTask(taskId, ownerUserId, toDate, createdBy)` — nhân
      bản 1 task cá nhân sang ngày khác, dòng thật độc lập (giữ đúng
      `duplicated_from_task_id`). KHÔNG cần biến thể "chọn nhiều người phụ
      trách" — task cá nhân luôn 1 chủ.
- [x] `getPersonalMonthProgress(ownerUserId, yearMonth)` — tương đương
      `getMonthProgress` nhưng lọc theo `owner_user_id`.
- [x] `listUsersOutsideTeamsByDepartment()` (đặt trong `lib/teams.ts`, cạnh
      `listActiveUsersNotInAnyTeam` đã có) — trả về user active KHÔNG có
      dòng trong `team_members` và `department != 'bgd'`, kèm tiến độ task
      tháng hiện tại của từng người, gom theo `department`. DÙNG LẠI đúng
      predicate `NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id =
      u.id)` mà `listActiveUsersNotInAnyTeam` đã dùng
      ([lib/teams.ts:121-129](../../lib/teams.ts#L121)) — không viết 1 cách
      viết anti-join khác (LEFT JOIN...IS NULL) cho cùng ý nghĩa, tránh 2 định
      nghĩa "ngoài 6 đội" lệch nhau theo thời gian (Red Team Review đã chỉ ra
      rủi ro này).

## Architecture

`lib/tasks.ts` — sửa `Task`/`TASK_SELECT`/`mapTaskRow`, thêm các hàm mới:

```ts
export interface Task {
  id: number;
  teamId: number | null;       // ĐỔI: null cho task cá nhân
  ownerUserId: number | null;  // MỚI
  categoryId: number | null;
  // ... các field còn lại giữ nguyên
}

const TASK_SELECT = `
  t.id, t.team_id, t.owner_user_id, t.category_id, t.task_date::text AS task_date, t.assignee_user_id,
  u.full_name AS assignee_full_name, u.avatar_url AS assignee_avatar_url, t.account_name, t.title, t.channel, t.video_count,
  t.product, t.option_tag, t.reference_link, t.note, t.status, t.duplicated_from_task_id,
  t.created_by, t.created_at, t.updated_at
`;
// mapTaskRow thêm: ownerUserId: row.owner_user_id,

export interface ListTasksOwnerFilter {
  fromDate: string;
  toDate: string;
}

export async function listTasksForOwner(ownerUserId: number, filter: ListTasksOwnerFilter): Promise<Task[]> {
  const rows = await sql.query(
    `SELECT ${TASK_SELECT}
     FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
     WHERE t.owner_user_id = $1 AND t.task_date BETWEEN $2 AND $3
     ORDER BY t.task_date ASC, t.id ASC`,
    [ownerUserId, filter.fromDate, filter.toDate]
  );
  return rows.map(mapTaskRow);
}

// PersonalTaskInput định nghĩa NGAY TRONG lib/tasks.ts (cạnh TaskInput/TaskPatch) —
// giữ đúng chiều phụ thuộc hiện có (actions.ts import type từ lib/tasks.ts, không
// ngược lại) — chỉ { title, taskDate, note?, status? }
export async function createPersonalTask(ownerUserId: number, input: PersonalTaskInput, createdBy: number | null): Promise<Task> {
  const rows = await sql.query(
    `INSERT INTO tasks (owner_user_id, task_date, title, note, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [ownerUserId, input.taskDate, input.title, input.note ?? null, input.status ?? 'not_started', createdBy]
  );
  const created = await getPersonalTaskById(rows[0].id, ownerUserId);
  if (!created) throw new Error('Không tạo được task.');
  return created;
}

export async function getPersonalTaskById(taskId: number, ownerUserId: number): Promise<Task | null> {
  const rows = await sql.query(
    `SELECT ${TASK_SELECT} FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
     WHERE t.id = $1 AND t.owner_user_id = $2`,
    [taskId, ownerUserId]
  );
  return rows[0] ? mapTaskRow(rows[0]) : null;
}

// updatePersonalTask: SET động chỉ cho field có trong patch (title/taskDate/note/status),
// WHERE id = $N AND owner_user_id = $N — KHÔNG SELECT-rồi-ghi-đè-cả-hàng như updateTask.

export async function deletePersonalTask(taskId: number, ownerUserId: number): Promise<void> {
  await sql.query('DELETE FROM tasks WHERE id = $1 AND owner_user_id = $2', [taskId, ownerUserId]);
}

export async function duplicatePersonalTask(taskId: number, ownerUserId: number, toDate: string, createdBy: number | null): Promise<Task> {
  const source = await getPersonalTaskById(taskId, ownerUserId);
  if (!source) throw new Error('Không tìm thấy task gốc.');
  const rows = await sql.query(
    `INSERT INTO tasks (owner_user_id, task_date, title, note, status, duplicated_from_task_id, created_by)
     VALUES ($1, $2, $3, $4, 'not_started', $5, $6) RETURNING id`,
    [ownerUserId, toDate, source.title, source.note, taskId, createdBy]
  );
  const created = await getPersonalTaskById(rows[0].id, ownerUserId);
  if (!created) throw new Error('Không nhân bản được task.');
  return created;
}

export async function getPersonalMonthProgress(ownerUserId: number, yearMonth: string): Promise<{ done: number; total: number }> {
  const rows = await sql.query(
    `SELECT count(*) FILTER (WHERE status = 'done')::int AS done, count(*)::int AS total
     FROM tasks WHERE owner_user_id = $1 AND to_char(task_date, 'YYYY-MM') = $2`,
    [ownerUserId, yearMonth]
  );
  return { done: rows[0]?.done ?? 0, total: rows[0]?.total ?? 0 };
}
```

`lib/teams.ts` — thêm cạnh `listActiveUsersNotInAnyTeam`:

```ts
export interface DepartmentGroup {
  department: Department; // import type từ lib/roles.ts
  departmentLabel: string; // từ DEPARTMENTS trong lib/roles.ts
  members: {
    userId: number;
    fullName: string;
    avatarUrl: string | null;
    monthProgress: { done: number; total: number };
  }[];
}

/** User active KHÔNG thuộc đội KD nào (cùng predicate NOT EXISTS với
 *  listActiveUsersNotInAnyTeam ở trên — không viết lại bằng cách khác) và
 *  không phải BGĐ — nhóm theo department cho màn drill-down của BGĐ (Phase
 *  4). 1 JOIN duy nhất, tránh N+1 khi liệt kê tiến độ từng người. */
export async function listUsersOutsideTeamsByDepartment(yearMonth: string): Promise<DepartmentGroup[]> {
  const rows = await sql.query(
    `SELECT u.id AS user_id, u.full_name, u.avatar_url, u.department,
            count(t.*) FILTER (WHERE t.status = 'done' AND to_char(t.task_date,'YYYY-MM') = $1)::int AS done,
            count(t.*) FILTER (WHERE to_char(t.task_date,'YYYY-MM') = $1)::int AS total
     FROM users u
     LEFT JOIN tasks t ON t.owner_user_id = u.id
     WHERE u.is_active = true AND u.department != 'bgd'
       AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = u.id)
     GROUP BY u.id, u.department
     ORDER BY u.department ASC, u.full_name ASC`,
    [yearMonth]
  );
  // group rows theo department trong JS, map sang DEPARTMENTS label (lib/roles.ts)
}
```

Lý do đặt `listUsersOutsideTeamsByDepartment` ở `lib/teams.ts` (không phải
`lib/tasks.ts` hay 1 file `lib/departments.ts` mới): hàm này về bản chất là
"ai KHÔNG có trong `team_members`" — cùng họ với `listActiveUsersNotInAnyTeam`
đã có sẵn đúng ở đây.

## Related Code Files

- Modify: `lib/tasks.ts` (sửa `Task`/`TASK_SELECT`/`mapTaskRow`, thêm hàm
  task cá nhân; KHÔNG sửa hàm CRUD/query đội KD hiện có ngoài việc chúng tự
  động nhận thêm field `ownerUserId: null` qua `mapTaskRow` chung)
- Modify: `lib/teams.ts` (thêm `DepartmentGroup`,
  `listUsersOutsideTeamsByDepartment`; import `Department`/`DEPARTMENTS` từ
  `lib/roles.ts`)
- Modify: mọi call site `tsc --noEmit` báo lỗi sau khi đổi `Task.teamId`
  thành nullable (chủ yếu trong `components/dashboard/task-board.tsx`) — liệt
  kê cụ thể trong lúc code, không đoán trước danh sách.

## Implementation Steps

1. Đọc lại toàn bộ `lib/tasks.ts` và phần liên quan của `lib/teams.ts`
   (`listActiveUsersNotInAnyTeam`) để bám đúng style/pattern hiện có.
2. Sửa `Task`/`TASK_SELECT`/`mapTaskRow` theo Architecture. Chạy `tsc
   --noEmit` (hoặc `npm run build`), liệt kê và sửa từng call site báo lỗi do
   `teamId` giờ có thể `null` — không ép kiểu để lờ đi.
3. Thêm 6 hàm task cá nhân vào `lib/tasks.ts` theo đúng khung ở Architecture
   — chú ý `createPersonalTask`/`updatePersonalTask` hardcode NULL các cột
   không áp dụng NGAY TRONG SQL, không đọc từ input.
4. Đọc `lib/roles.ts` lấy đúng `Department`, `DEPARTMENTS` để map label.
5. Thêm `DepartmentGroup` + `listUsersOutsideTeamsByDepartment` vào
   `lib/teams.ts`, tái dùng đúng predicate `NOT EXISTS` như
   `listActiveUsersNotInAnyTeam`, group rows theo `department` trong JS
   (dùng thứ tự `DEPARTMENTS` để giữ đúng thứ tự hiển thị).
6. Chạy `npm run lint` + `npm run build` xác nhận sạch.

## Success Criteria

- [x] `tsc --noEmit` sạch SAU khi `Task.teamId` đổi thành `number | null` —
      nghĩa là mọi nơi dùng `task.teamId` đã được xử lý null-safe, không còn
      chỗ nào giả định ngầm nó luôn là số (đây là bằng chứng thật, khác với
      Success Criteria cũ "build sạch" vốn không phát hiện được vấn đề này).
- [x] Test tay: `createPersonalTask` tạo được task với `team_id = NULL`,
      `owner_user_id` đúng, `assignee_user_id`/`category_id`/... đều NULL dù
      có cố truyền các field đó vào (vì DAL hardcode, không đọc từ input).
- [x] `listTasksForOwner` chỉ trả về đúng task của người đó.
- [x] `listUsersOutsideTeamsByDepartment` trả về đúng số user — đối chiếu
      tay bằng `SELECT count(*) FROM users u WHERE u.is_active AND
      u.department != 'bgd' AND NOT EXISTS (SELECT 1 FROM team_members tm
      WHERE tm.user_id = u.id)`.
- [x] `npm run build` sạch.

## Risk Assessment

- **Rủi ro**: nhầm điều kiện `WHERE` khi copy pattern từ hàm đội KD (vd quên
  đổi `team_id` thành `owner_user_id` ở 1 chỗ) → 1 user đọc/sửa được task của
  người khác qua data access layer.
  **Tín hiệu vỡ**: `listTasksForOwner(A)` trả về task có `owner_user_id != A`.
  **Mitigation**: review kỹ từng câu SQL ở bước 3, test tay ở Success
  Criteria trước khi sang Phase 3.
- **Rủi ro**: bỏ sót 1 call site khi đổi `Task.teamId` thành nullable (vì
  `mapTaskRow(row: any)` xoá type ở input, `tsc` chỉ bắt được lỗi ở phía
  DÙNG `Task` sau khi map, không bắt được lỗi trong chính `mapTaskRow`).
  **Mitigation**: bước 2 bắt buộc chạy `tsc --noEmit` và sửa hết lỗi trước
  khi viết hàm mới, không chỉ chạy 1 lần cuối Phase.
