---
phase: 3
title: "Server actions"
status: pending
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: Server actions

## Overview

Viết tầng "use server" cho tính năng Giao Task, theo đúng khuôn
`app/dashboard/actions.ts`: mỗi hàm tự lấy `session` qua `getSession()`, tự
suy `teamId` của người gọi (không nhận `teamId` thẳng từ client cho thao
tác member/manager thường), rồi mới gọi xuống `lib/teams.ts`/`lib/tasks.ts`.

## Requirements

- [x] Action file mới `app/dashboard/giao-task/actions.ts`.
- [x] Mọi action chặn quyền đúng theo mô hình N quản lý mỗi đội (dùng
      `isTeamManager`, không giả định 1 quản lý).
- [x] Thêm giá trị mới vào `AuditAction` union trong `lib/audit.ts`
      (`team_member.add`, `team_member.remove`, `team_member.role_change`,
      `team_category.create`, `team_category.update`,
      `team_category.delete`) và log qua `logAdminAction` — **không** log
      CRUD/nhân bản task vào `admin_audit_log` (tần suất cao, không phù hợp
      bảng audit tầm quản trị, xem Non-goals ở `plan.md`).
- [x] Action nhân bản hàng loạt validate `occurrences` hợp lý trước khi gọi
      xuống `lib/tasks.ts` (lớp validate thứ 2, lớp đầu đã có ở Phase 2).

## Architecture

```
app/dashboard/giao-task/actions.ts
├─ getMyTeamBoardAction(range: { fromDate, toDate })
│    -- teamId suy từ session; trả { team, roster, categories, tasks,
│       isManager, monthProgress, chart }; nếu session không thuộc đội nào
│       và không phải BGĐ -> throw 'Bạn chưa thuộc đội nào.'; nếu là BGĐ và
│       không thuộc đội nào -> trả cờ để UI tự chuyển sang view gộp
├─ getAllTeamsOverviewAction(yearMonth)   -- CHỈ BGĐ
├─ addTeamMemberAction(userId)            -- teamId suy từ session người gọi
│                                            (quản lý/BGĐ mới gọi được),
│                                            role mặc định 'member'
├─ addTeamMemberAsAdminAction(teamId, userId, role)  -- CHỈ BGĐ, role tuỳ chọn
├─ removeTeamMemberAction(userId)         -- teamId suy từ session người gọi
├─ setMemberRoleAction(userId, role)      -- quản lý/BGĐ đổi 1 thành viên
│                                            trong đội mình thành/thôi quản lý
├─ createTeamCategoryAction(name, visibleColumns)   -- quản lý/BGĐ, teamId suy từ session
├─ updateTeamCategoryAction(categoryId, patch)
├─ deleteTeamCategoryAction(categoryId)
├─ createTaskAction(input)                -- teamId suy từ session, mọi thành viên gọi được
├─ updateTaskAction(taskId, patch)
├─ deleteTaskAction(taskId)
├─ duplicateTaskAction(taskId, toDate)    -- mọi thành viên gọi được
└─ bulkDuplicateTasksAction(taskId, pattern)  -- CHỈ quản lý/BGĐ (quyết định #7:
                                               "quản lý nhân bản hàng loạt")
```

Nguyên tắc xuyên suốt: client không tự chọn `teamId` của mình (trừ bản
`*AsAdmin`/BGĐ) — server luôn tự tra `findTeamIdByUserId(session.userId)`
trước khi thao tác.

## Related Code Files

- Create: `app/dashboard/giao-task/actions.ts`
- Modify: `lib/audit.ts` (mở rộng `AuditAction` union)
- Reference: `app/dashboard/actions.ts`, `app/dashboard/admin/actions.ts`

## Implementation Steps

1. Đọc lại `app/dashboard/actions.ts` và `app/dashboard/admin/actions.ts`
   để bám đúng style throw `Error('...')` tiếng Việt.
2. Thêm 6 giá trị mới vào `AuditAction` union trong `lib/audit.ts`.
3. Viết `getMyTeamBoardAction`: lấy session, `findTeamIdByUserId`, xử lý 2
   nhánh (không thuộc đội + không phải BGĐ → throw; không thuộc đội + BGĐ →
   trả cờ view gộp), gọi `listTasksForTeam` với `range` nhận từ client (UI
   Phase 4 tự tính `fromDate`/`toDate` theo chế độ ngày/tuần/tháng đang chọn).
4. Viết các action thêm/gỡ/đổi role thành viên, nhóm task, CRUD task,
   nhân bản 1/hàng loạt — mỗi action đúng 1 việc, action mỏng, gọi thẳng
   `lib/teams.ts`/`lib/tasks.ts`.
5. Viết 2 action riêng cho BGĐ (`getAllTeamsOverviewAction`,
   `addTeamMemberAsAdminAction`) — check `session.tier === 'full'` đầu
   hàm, throw ngay nếu không phải.
6. `bulkDuplicateTasksAction`: check `isTeamManager(teamId, session.userId)
   || session.tier === 'full'` trước khi gọi `bulkDuplicateTasks`; validate
   `pattern.occurrences` trong khoảng hợp lý (khớp giới hạn đã đặt ở
   Phase 2) trước khi gọi xuống, trả lỗi tiếng Việt rõ ràng nếu vượt.
7. Với `createTaskAction`/`updateTaskAction`: validate tối thiểu — `title`
   không rỗng, `task_date` hợp lệ, `status` nằm trong 3 giá trị cho phép.
8. `npx tsc --noEmit` sạch trước khi sang Phase 4.

## Success Criteria

- [x] Gọi `createTaskAction`/`duplicateTaskAction` bằng session member
      thường (không phải quản lý) thành công — đúng quyết định "mở hoàn
      toàn".
- [x] Gọi `bulkDuplicateTasksAction` bằng session member thường (không
      phải quản lý, không phải BGĐ) bị từ chối.
- [x] Gọi `addTeamMemberAction`/`setMemberRoleAction`/
      `createTeamCategoryAction` bằng session member thường bị từ chối.
- [x] `admin_audit_log` có dòng mới sau khi gọi các action quản trị đội ở
      trên, không có dòng nào sinh ra từ `createTaskAction`/
      `duplicateTaskAction`/`bulkDuplicateTasksAction`.

## Risk Assessment

- **Rủi ro**: nhận `teamId` trực tiếp từ client cho action của
  member/quản lý thường — mở lỗ hổng sửa task đội khác qua DevTools.
  **Tín hiệu vỡ**: test tay ở Phase 6 (đổi `teamId` trong network request)
  vẫn thao tác được đội khác.
  **Phản ứng đã quyết trước**: coi là bug chặn release, luôn suy `teamId`
  từ session ở server cho các action không phải bản `*AsAdmin`.
- **Rủi ro**: quên check quyền quản lý cho `bulkDuplicateTasksAction`,
  member thường tự tạo hàng loạt task gây rác dữ liệu. Bắt buộc test tay
  ở Phase 6.
