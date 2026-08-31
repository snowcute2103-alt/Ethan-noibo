---
phase: 3
title: "Server actions"
status: pending
priority: P1
effort: "3h"
dependencies: [2]
---

# Phase 3: Server actions

## Overview

Thêm server actions vào `app/dashboard/giao-task/actions.ts` cho task cá
nhân + màn bộ phận của BGĐ, với 1 hàm quyền dùng chung
(`requirePersonalTaskContext`) chặn CHÍNH XÁC "chỉ chính chủ hoặc BGĐ, và chỉ
với người thực sự ngoài 6 đội" ở tầng server. Phase này cũng đóng 1 lỗ hổng
ranh giới thành viên: nếu chỉ kiểm danh tính (self/BGĐ) mà không kiểm
`ownerUserId` có thực sự ngoài 6 đội, BẤT KỲ user đã đăng nhập nào (kể cả
thành viên đội KD) đều tạo được task cá nhân cho chính mình — sinh dữ liệu
`team_id = NULL` không màn hình nào hiển thị (xem "Red Team Review" trong
`plan.md`).

## Requirements

- [x] `requirePersonalTaskContext(ownerUserId)`: lấy session; cho phép nếu
      (`session.userId === ownerUserId` HOẶC `session.tier === 'full'`) **VÀ**
      `await findTeamIdByUserId(ownerUserId) === null` **VÀ** người đó có
      `department !== 'bgd'` (tra `users` 1 lần); nếu không thoả, ném lỗi.
      KHÔNG dùng khái niệm leader/department của NGƯỜI GỌI để cấp quyền — chỉ
      dùng `department` của NGƯỜI SỞ HỮU (`ownerUserId`) để xác nhận họ đúng
      là đối tượng "ngoài 6 đội", đúng quyết định #3 đã chốt.
- [x] `getMyPersonalBoardAction(range)`: cho chính người dùng hiện tại xem
      Kanban cá nhân của mình (owner = `session.userId`, không cần tham số).
- [x] `getPersonalBoardAsBgdAction(ownerUserId, range)`: cho BGĐ xem Kanban
      cá nhân của 1 người khác — bắt buộc `session.tier === 'full'`.
- [x] `getDepartmentsOverviewAction(yearMonth)`: chỉ BGĐ, trả về
      `listUsersOutsideTeamsByDepartment` từ Phase 2.
- [x] **`PersonalTaskInput` — type RIÊNG, hẹp hơn `TaskInput`**:
      `{ title: string; taskDate: string; note?: string | null; status?:
      TaskStatus }`. KHÔNG tái dùng `TaskInput`/`TaskPatch` cho đường cá nhân
      — `TaskInput` có `assigneeUserId`/`categoryId`/`channel`/... mà client
      có thể set tuỳ ý; vì `TASK_SELECT` (Phase 2) JOIN `users` trả
      `assignee_full_name`/`assignee_avatar_url`, một request tự chế truyền
      `assigneeUserId` bất kỳ vào action "chỉ đọc/sửa task của chính mình" có
      thể dùng response để dò họ tên + avatar của user id bất kỳ (kể cả đã
      deactivate/BGĐ). `assertValidPersonalTaskInput` chỉ validate 4 field
      trên (title không rỗng, taskDate hợp lệ, status thuộc enum) — không
      nhận field nào khác dù client có gửi kèm.
- [x] `createPersonalTaskAction`, `updatePersonalTaskAction`,
      `deletePersonalTaskAction`, `duplicatePersonalTaskAction(ownerUserId,
      ...)`: mỗi hàm gọi `requirePersonalTaskContext(ownerUserId)` trước khi
      chạm data access layer; `duplicatePersonalTaskAction` validate `toDate`
      bằng cùng luật `taskDate` (không nhận chuỗi tự do chưa kiểm — Phase 4
      đổi UI nhập ngày nhân bản từ `prompt()` sang `<input type="date">`,
      nhưng action vẫn phải tự validate vì input HTTP luôn coi là không tin
      cậy).
- [x] `assertValidRange(range)` — validate `fromDate`/`toDate` đúng định dạng
      `YYYY-MM-DD`, `fromDate <= toDate`, khoảng tối đa 366 ngày; áp dụng cho
      `getMyPersonalBoardAction`/`getPersonalBoardAsBgdAction`. Tương tự
      `assertValidYearMonth(yearMonth)` (regex `^\d{4}-\d{2}$`) cho
      `getDepartmentsOverviewAction`. Không có validate này, 1 request tự chế
      gửi range vô lý (vd 8000 năm) gây quét toàn bảng không kiểm soát, hoặc
      giá trị sai kiểu làm `.slice()`/`to_char` ném lỗi 500 không kiểm soát.
- [x] **Chặn thêm vào đội KD khi còn task cá nhân**: sửa
      `addTeamMemberAction`/`addTeamMemberAsAdminAction` — trước khi
      `addTeamMember`, kiểm tra `await listTasksForOwner(userId, {rất rộng})`
      (hoặc 1 hàm đếm riêng, nhẹ hơn — `hasPersonalTasks(userId)`) và nếu có
      ít nhất 1 task cá nhân, ném lỗi rõ ràng ("Người này còn task cá nhân
      chưa xử lý, không thể thêm vào đội — xoá hết task cá nhân trước"). Lý
      do: nếu không chặn, thêm 1 người có sẵn task cá nhân vào đội KD làm
      board cá nhân của họ biến mất khỏi MỌI UI ngay lập tức (chính chủ thấy
      board đội thay vì board cá nhân;
      `listUsersOutsideTeamsByDepartment`/Phase 2 lọc họ ra vì giờ đã có
      `team_members`) — dữ liệu vẫn còn trong bảng `tasks` nhưng vĩnh viễn
      không ai đọc/sửa/xoá được qua UI. Chặn ở nguồn đơn giản và an toàn hơn
      xây thêm 1 luồng "chuyển/merge dữ liệu" không nằm trong yêu cầu gốc.
- [x] **Audit log cho thao tác BGĐ trên task người khác**: mọi nhánh
      `session.userId !== ownerUserId` (tức đang là BGĐ sửa hộ) trong
      `createPersonalTaskAction`/`updatePersonalTaskAction`/
      `deletePersonalTaskAction`/`duplicatePersonalTaskAction` PHẢI gọi
      `logAdminAction(session.userId, '<action>', ownerUserId, {...})` —
      đúng quy ước đang có ở MỌI action cross-user khác trong file này (8 chỗ
      hiện có: `team_member.add/remove/role_change/category_change`,
      `team_category.create/update/delete`). Task cá nhân là dữ liệu riêng tư
      (quyết định #3: leader bộ phận không được xem) — mất khả năng truy vết
      khi BGĐ ghi/xoá dữ liệu đó là một hồi quy so với quy ước audit hiện có
      của chính file này, không phải một lựa chọn có chủ đích. KHÔNG log
      nhánh chính chủ tự thao tác (tránh phình bảng audit vô ích).
      Thêm 4 action mới vào `AuditAction` (`lib/audit.ts`):
      `personal_task.create`, `personal_task.update`, `personal_task.delete`,
      `personal_task.duplicate`.

## Architecture

```ts
// app/dashboard/giao-task/actions.ts — thêm cạnh các hàm đội KD hiện có.
// PersonalTaskInput/PersonalTaskPatch ĐÃ định nghĩa ở lib/tasks.ts (Phase 2,
// cạnh TaskInput/TaskPatch) — import type từ đó, không định nghĩa lại ở đây
// (giữ đúng chiều phụ thuộc: actions.ts import type từ lib/tasks.ts).

function assertValidPersonalTaskInput(input: PersonalTaskInput | PersonalTaskPatch) {
  if ('title' in input && input.title !== undefined && !input.title.trim()) {
    throw new Error('Tiêu đề không được để trống.');
  }
  if (input.taskDate !== undefined && Number.isNaN(Date.parse(input.taskDate))) {
    throw new Error('Ngày không hợp lệ.');
  }
  if (input.status !== undefined && !['not_started', 'in_progress', 'done'].includes(input.status)) {
    throw new Error('Trạng thái không hợp lệ.');
  }
}

function assertValidDateString(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} không hợp lệ.`);
  }
}

async function requirePersonalTaskContext(ownerUserId: number): Promise<{ session: Session }> {
  const session = await requireSession();
  const isSelf = session.userId === ownerUserId;
  const isBgd = session.tier === 'full';
  if (!isSelf && !isBgd) {
    throw new Error('Bạn không có quyền xem/sửa task cá nhân của người khác.');
  }
  const [teamId, owner] = await Promise.all([findTeamIdByUserId(ownerUserId), findUserById(ownerUserId)]);
  if (teamId !== null || !owner || owner.department === 'bgd') {
    throw new Error('Người này không thuộc diện quản lý task cá nhân (đang ở 1 đội KD hoặc là BGĐ).');
  }
  return { session };
}

export async function getMyPersonalBoardAction(range: DateRange) {
  const session = await requireSession();
  assertValidRange(range);
  const [tasks, monthProgress] = await Promise.all([
    listTasksForOwner(session.userId, range),
    getPersonalMonthProgress(session.userId, range.fromDate.slice(0, 7)),
  ]);
  return { tasks, monthProgress };
}

export async function getPersonalBoardAsBgdAction(ownerUserId: number, range: DateRange) {
  await requireBgd();
  assertValidRange(range);
  const [tasks, monthProgress] = await Promise.all([
    listTasksForOwner(ownerUserId, range),
    getPersonalMonthProgress(ownerUserId, range.fromDate.slice(0, 7)),
  ]);
  return { tasks, monthProgress };
}

export async function getDepartmentsOverviewAction(yearMonth: string) {
  await requireBgd();
  assertValidYearMonth(yearMonth);
  return listUsersOutsideTeamsByDepartment(yearMonth);
}

export async function createPersonalTaskAction(ownerUserId: number, input: PersonalTaskInput): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  assertValidPersonalTaskInput(input);
  return createPersonalTask(ownerUserId, input, session.userId);
}

export async function updatePersonalTaskAction(ownerUserId: number, taskId: number, patch: PersonalTaskPatch): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  assertValidPersonalTaskInput(patch);
  const updated = await updatePersonalTask(taskId, ownerUserId, patch);
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.update', ownerUserId, { docId: String(taskId) });
  }
  return updated;
}

export async function deletePersonalTaskAction(ownerUserId: number, taskId: number): Promise<void> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  await deletePersonalTask(taskId, ownerUserId);
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.delete', ownerUserId, { docId: String(taskId) });
  }
}

export async function duplicatePersonalTaskAction(ownerUserId: number, taskId: number, toDate: string): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  assertValidDateString(toDate, 'Ngày nhân bản');
  const created = await duplicatePersonalTask(taskId, ownerUserId, toDate, session.userId);
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.duplicate', ownerUserId, { docId: String(taskId) });
  }
  return created;
}

// Sửa 2 action đã có — thêm guard đầu hàm, giữ nguyên phần còn lại:
export async function addTeamMemberAction(teamId: number, userId: number): Promise<void> {
  const actor = await requireManagerContext(teamId);
  if (await hasPersonalTasks(userId)) {
    throw new Error('Người này còn task cá nhân chưa xử lý, không thể thêm vào đội.');
  }
  await addTeamMember(actor.teamId, userId, 'member', actor.userId);
  await logAdminAction(actor.userId, 'team_member.add', userId, { docId: String(actor.teamId) });
}
// addTeamMemberAsAdminAction: thêm đúng guard tương tự ngay sau requireBgd()
```

`hasPersonalTasks(userId)` thêm vào `lib/tasks.ts` Phase 2 nếu chưa có (1 câu
`SELECT EXISTS(SELECT 1 FROM tasks WHERE owner_user_id = $1)`) — bổ sung nhỏ,
không cần phase riêng, làm cùng lúc sửa `addTeamMemberAction` ở phase này.

`getMyPersonalBoardAction` KHÔNG nhận `ownerUserId` từ client — người tự xem
board của mình dùng thẳng `session.userId`, tránh 1 lớp có thể bị client giả
mạo. `getPersonalBoardAsBgdAction`/`getDepartmentsOverviewAction` là 2 đường
RIÊNG cho BGĐ, đều bắt buộc `requireBgd()` trước.

## Related Code Files

- Modify: `app/dashboard/giao-task/actions.ts` (thêm các action trên, sửa
  `addTeamMemberAction`/`addTeamMemberAsAdminAction`, import thêm
  `findUserById` từ `lib/users.ts` (đã tồn tại,
  [lib/users.ts:185](../../lib/users.ts#L185)) và các hàm mới từ
  `lib/tasks.ts`/`lib/teams.ts`)
- Modify: `lib/audit.ts` (thêm 4 giá trị vào union `AuditAction`)
- Modify: `components/dashboard/admin/user-table.tsx` (phát hiện lúc code,
  không có trong scout ban đầu — `AUDIT_ACTION_LABELS: Record<AuditAction,
  string>` ở đây bắt buộc đủ nhãn cho MỌI giá trị `AuditAction`, `tsc` báo
  lỗi ngay nếu thiếu 4 giá trị mới — đã thêm 4 nhãn tương ứng)
- Modify: `lib/tasks.ts` (thêm `hasPersonalTasks`, nhỏ, gộp vào lúc code
  Phase 3 dù về nguyên tắc là DAL của Phase 2)

## Implementation Steps

1. Đọc lại toàn bộ `app/dashboard/giao-task/actions.ts` hiện tại (đặc biệt
   `requireSession`, `requireBgd`, `requireManagerContext`,
   `assertValidTaskInput`, và cách `addTeamMemberAction`/
   `addTeamMemberAsAdminAction` gọi `addTeamMember`) để sửa đúng chỗ, không
   viết lại.
2. Đọc `lib/audit.ts` lấy đúng union `AuditAction` hiện có, thêm 4 giá trị
   mới vào union.
3. Thêm `hasPersonalTasks` vào `lib/tasks.ts`.
4. Thêm `requirePersonalTaskContext`, `assertValidPersonalTaskInput`,
   `assertValidRange`, `assertValidYearMonth`, `assertValidDateString`, và 7
   action ở Architecture vào `actions.ts`, đặt cạnh nhóm action đội KD tương
   ứng để dễ đối chiếu khi review.
5. Sửa `addTeamMemberAction` và `addTeamMemberAsAdminAction`: thêm guard
   `hasPersonalTasks` ngay sau bước xác thực quyền, TRƯỚC khi gọi
   `addTeamMember`.
6. Đảm bảo MỌI action task cá nhân đều gọi `requirePersonalTaskContext` hoặc
   `requireBgd` trước khi chạm `lib/tasks.ts`/`lib/teams.ts` — không có
   đường tắt nào bỏ qua check quyền.
7. Chạy `npm run build`/`tsc --noEmit` xác nhận type khớp với Phase 2.

## Success Criteria

- [x] Gọi `updatePersonalTaskAction(ownerUserId = X, ...)` bằng session của
      user Y (Y ≠ X, Y không phải BGĐ) → ném lỗi, KHÔNG update được task của
      X.
- [x] Gọi `createPersonalTaskAction(ownerUserId = <thành viên đội KD>, ...)`
      bằng chính session của thành viên đó → ném lỗi (`findTeamIdByUserId`
      trả về khác null) — xác nhận lỗ hổng "ai cũng tạo được task cá nhân
      cho chính mình" đã đóng.
- [x] Gọi `addTeamMemberAction`/`addTeamMemberAsAdminAction` với 1 userId
      đang có ít nhất 1 task cá nhân → ném lỗi, KHÔNG thêm được vào đội.
- [x] Gọi cùng action ở 2 mục đầu bằng session BGĐ (`tier = 'full'`) → thành
      công, và `admin_audit_log` có đúng 1 dòng mới với action
      `personal_task.*`, `target_user_id = X`.
- [x] Gọi cùng action bằng session của chính X (chủ hợp lệ, ngoài 6 đội) →
      thành công, KHÔNG có dòng audit mới (chỉ log khi BGĐ sửa hộ).
- [x] `getDepartmentsOverviewAction` gọi bằng session không phải BGĐ → ném
      lỗi.
- [x] `getMyPersonalBoardAction({ fromDate: 'x', toDate: 'y' })` (sai định
      dạng) → ném lỗi rõ ràng, không phải `TypeError` không kiểm soát.
- [x] Phương pháp kiểm chứng thực tế (Phase 5 dùng lại): mở board hợp lệ,
      bắt request POST thật của 1 action trong tab Network của trình duyệt
      (Next.js Server Actions không phải hàm global — không gọi được qua
      console/DevTools console), "Copy as fetch", sửa `ownerUserId` trong
      body, replay bằng `fetch` với cookie session của kẻ tấn công.

## Risk Assessment

- **Rủi ro**: quên gọi `requirePersonalTaskContext`/`requireBgd` ở 1 action
  mới → lộ quyền đọc/sửa task người khác.
  **Mitigation**: review checklist thủ công — liệt kê đủ 7 action mới, xác
  nhận từng cái có đúng 1 lệnh gọi guard làm dòng đầu tiên trước khi merge.
- **Rủi ro**: guard `hasPersonalTasks` làm chậm luồng thêm thành viên đội KD
  hiện có (thêm 1 query cho mọi lần `addTeamMemberAction`, kể cả người chưa
  từng có task cá nhân).
  **Mitigation**: chấp nhận — query `EXISTS` trên index `idx_tasks_owner_date`
  (Phase 1) rất rẻ, và tần suất thêm thành viên đội thấp (không phải hot
  path), không cần tối ưu thêm (YAGNI).
