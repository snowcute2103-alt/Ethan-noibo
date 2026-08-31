---
phase: 2
title: "Data access layer teams va tasks"
status: pending
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 2: Data access layer teams va tasks

## Overview

Viết `lib/teams.ts` và `lib/tasks.ts` theo đúng khuôn của `lib/users.ts` /
`lib/announcement-permissions.ts` hiện có. `lib/teams.ts` gồm cả roster và
nhóm task tự đặt tên (`team_task_categories` là con của 1 đội, không đủ lớn
để tách file riêng). `lib/tasks.ts` gồm CRUD task, nhân bản 1/hàng loạt, và
2 nhóm query tổng hợp (tiến độ tháng, biểu đồ theo ngày/người).

## Requirements

- [x] `isTeamManager(teamId, userId)` trả đúng cho **bất kỳ** hàng nào có
      `role = 'manager'` — không giả định chỉ 1 quản lý mỗi đội.
- [x] `lib/tasks.ts` hỗ trợ lọc theo khoảng ngày bất kỳ (1 ngày / 1 tuần / 1
      tháng đều là cùng 1 hàm với `fromDate`/`toDate` khác nhau, không viết
      3 hàm riêng cho ngày/tuần/tháng).
- [x] Nhân bản (`duplicateTask`, `bulkDuplicateTasks`) tạo **dòng task thật,
      độc lập** — copy toàn bộ field trừ `id`, `task_date` (đổi theo ngày
      đích), `status` (reset về `not_started`), `duplicated_from_task_id`
      (trỏ về task gốc để truy vết).
- [x] Không có hàm nào tự ý bỏ qua `team_id` khi đọc/sửa task/nhóm — luôn
      nhận `teamId` làm tham số bắt buộc.

## Architecture

`lib/teams.ts`:
- `findTeamIdByUserId(userId): Promise<number | null>`.
- `isTeamManager(teamId, userId): Promise<boolean>` — `EXISTS (SELECT 1
  FROM team_members WHERE team_id=$1 AND user_id=$2 AND role='manager')`.
- `getTeamWithRoster(teamId): Promise<TeamWithRoster>` — team info + mảng
  member (join `users` lấy `full_name`, `avatar_url`, `role`).
- `listAllTeamsSummary(): Promise<TeamSummary[]>` — cho view gộp BGĐ, 1
  query JOIN, không N+1.
- `addTeamMember(teamId, userId, role, addedBy): Promise<void>` — `role`
  mặc định `'member'`, cho phép thêm thẳng `'manager'` (BGĐ gắn đồng quản
  lý mới). Bắt `unique_violation` (Postgres code `23505`) khi user đã
  thuộc đội khác, ném `Error('Người này đã thuộc một đội khác.')`.
- `removeTeamMember(teamId, userId): Promise<void>`.
- `setMemberRole(teamId, userId, role): Promise<void>` — đổi 1 thành viên
  thành/thôi quản lý (thay cho khái niệm "đổi quản lý duy nhất" cũ — giờ là
  thêm/bớt người trong tập quản lý, khớp mô hình N quản lý).
- `listActiveUsersNotInAnyTeam(): Promise<UserRow[]>`.
- `listTeamCategories(teamId): Promise<TeamTaskCategory[]>` — sắp theo
  `sort_order`.
- `createTeamCategory(teamId, name, visibleColumns, createdBy):
  Promise<TeamTaskCategory>`.
- `updateTeamCategory(categoryId, teamId, patch: { name?, visibleColumns?,
  sortOrder? }): Promise<TeamTaskCategory>` — `WHERE id=$1 AND team_id=$2`.
- `deleteTeamCategory(categoryId, teamId): Promise<void>` — task đang gắn
  category này tự về `category_id = NULL` nhờ `ON DELETE SET NULL` đã khai
  báo ở Phase 1, không cần xử lý thêm ở đây.

`lib/tasks.ts`:
- `TASK_COLUMN_KEYS` — hằng số liệt kê đúng tên field TypeScript của
  `Task` có thể bật/tắt hiển thị (`accountName`, `channel`, `videoCount`,
  `product`, `optionTag`, `referenceLink`, `note`) — dùng chung cho
  `visible_columns` ở Phase 1 và UI Phase 4, chỉ định nghĩa **một lần** ở
  đây để 2 nơi kia import lại, không tự chép tay danh sách khoá cột.
- `listTasksForTeam(teamId, filter?: { categoryId?: number | null;
  fromDate: string; toDate: string }): Promise<Task[]>` — dùng chung cho cả
  3 chế độ xem ngày/tuần/tháng, khác nhau ở `fromDate`/`toDate` truyền vào.
- `createTask(teamId, input, createdBy): Promise<Task>`.
- `updateTask(taskId, teamId, patch): Promise<Task>` — `WHERE id=$1 AND
  team_id=$2`.
- `deleteTask(taskId, teamId): Promise<void>` — cùng lý do trên.
- `duplicateTask(taskId, teamId, toDate): Promise<Task>` — đọc task gốc
  (chặn theo `teamId`), insert bản sao với `task_date = toDate`,
  `status = 'not_started'`, `duplicated_from_task_id = taskId`.
- `bulkDuplicateTasks(taskId, teamId, pattern: { frequency: 'daily' |
  'weekly' | 'monthly'; occurrences: number }): Promise<Task[]>` — tính
  sẵn danh sách ngày đích từ `task_date` gốc + `frequency` +
  `occurrences` (ví dụ `weekly` × 4 = 4 ngày cách nhau 7 ngày), gọi
  `duplicateTask` cho từng ngày, trả về mảng đã tạo. Không tạo bảng
  recurrence rule — đây vẫn là vòng lặp insert dòng thật (quyết định #7).
- `getMonthProgress(teamId, yearMonth): Promise<{ done: number; total:
  number }>`.
- `getDailyAssigneeBreakdown(teamId, fromDate, toDate): Promise<{ date:
  string; assigneeUserId: number | null; fullName: string | null; count:
  number }[]>` — cho biểu đồ Phase 4.
- `getAllTeamsMonthProgress(yearMonth): Promise<{ teamId: number; code:
  string; done: number; total: number }[]>` — cho view gộp BGĐ.

## Related Code Files

- Create: `lib/teams.ts`
- Create: `lib/tasks.ts`
- Reference (đọc lại, không sửa): `lib/users.ts`, `lib/db.ts`,
  `lib/announcement-permissions.ts`, `lib/roles.ts`

## Implementation Steps

1. Đọc lại `lib/users.ts` và `lib/announcement-permissions.ts` một lượt
   ngay trước khi viết để bám đúng style `mapRow`, đặt tên cột SQL.
2. Viết `lib/teams.ts` với các hàm ở phần Architecture.
3. Viết `TASK_COLUMN_KEYS` và các type `Task`/`TaskInput`/`TeamTaskCategory`
   ở đầu `lib/tasks.ts` trước, rồi mới viết hàm — để `visible_columns`
   luôn tham chiếu đúng tên field.
4. Viết CRUD task + `duplicateTask`/`bulkDuplicateTasks`, chú ý
   `updateTask`/`deleteTask`/`duplicateTask` luôn có điều kiện `team_id`
   trong `WHERE`.
5. Viết 2 hàm tổng hợp (`getMonthProgress`, `getDailyAssigneeBreakdown`) +
   `getAllTeamsMonthProgress` bằng 1 JOIN/GROUP BY, không loop 6 lần.
6. Với lỗi `unique_violation` khi `addTeamMember`: bắt theo
   `error.code === '23505'`, ném lỗi tiếng Việt rõ ràng.
7. `npx tsc --noEmit` sạch trước khi sang Phase 3.

## Success Criteria

- [x] `npx tsc --noEmit` sạch với 2 file mới.
- [x] Gọi thử `getTeamWithRoster(kd1.id)` (qua 1 script tsx tạm, xoá sau
      khi test) trả đúng 7 người, 2 người có `role = 'manager'`.
- [x] Gọi `bulkDuplicateTasks(taskId, teamId, { frequency: 'daily',
      occurrences: 5 })` trên 1 task test tạo đúng 5 task mới, ngày tăng
      dần 1 ngày mỗi task, `status` đều `not_started`, `duplicated_from_task_id`
      đều trỏ về task gốc. Xoá dữ liệu test sau khi xác nhận.
- [x] Gọi `getAllTeamsMonthProgress` trả đúng 6 dòng, không lỗi dù tháng
      hiện tại chưa có task nào.

## Risk Assessment

- **Rủi ro**: N+1 query nếu viết hàm tổng hợp bằng loop 6 lần thay vì 1
  JOIN. Review lại trước khi merge, đối chiếu với chuẩn đã có ở
  `lib/users.ts` (`countActiveUsersByDepartment` là 1 query GROUP BY).
- **Rủi ro**: quên điều kiện `team_id` trong `updateTask`/`deleteTask`/
  `duplicateTask` — lớp chặn cuối nếu Phase 3 có bug quyền. Bắt buộc test
  tay ở Phase 6 (sửa/nhân bản task team A bằng session team B phải thất bại).
- **Rủi ro**: `bulkDuplicateTasks` với `occurrences` lớn (vd người dùng
  nhập 365) tạo quá nhiều dòng cùng lúc, chậm hoặc tốn quota Neon.
  **Mitigation**: chặn cứng `occurrences` tối đa hợp lý (ví dụ 60) ngay ở
  hàm này, không chỉ chặn ở UI Phase 4 — validate ở tầng data access để
  action nào gọi tới cũng được bảo vệ.
