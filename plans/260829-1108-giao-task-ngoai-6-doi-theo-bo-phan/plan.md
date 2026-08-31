---
title: "Giao Task Ngoai 6 Doi Theo Bo Phan"
description: "Mo rong trang /dashboard/giao-task: BGD quan ly/quan sat nhung user KHONG thuoc 6 doi KD1-KD6, gom theo bo phan (department), moi nguoi tu tao/sua task ca nhan kieu Kanban. Tai dung bang tasks hien co (them owner_user_id, team_id thanh nullable)."
status: pending
priority: P1
effort: "~18h"
tags: ["giao-task", "kanban", "department", "database"]
created: 2026-08-29
---

# Giao Task Ngoai 6 Doi Theo Bo Phan

## Overview

Trang `/dashboard/giao-task` hiện chỉ phục vụ 6 đội kinh doanh (KD1-KD6, xem
`plans/260828-1012-giao-task-6-doi-kinh-doanh/`). Ai không nằm trong
`team_members` mà không phải BGĐ hiện bị `redirect('/dashboard')`
([page.tsx:19](../../app/dashboard/giao-task/page.tsx#L19)). Plan này mở
rộng: những người đó (nhân sự 5 bộ phận ngoài kinh-doanh + kinh-doanh chưa vào
đội KD nào) sẽ tự quản lý task cá nhân của mình bằng 1 bảng Kanban riêng
(không dùng chung với ai), còn BGĐ xem được toàn bộ nhóm này gom theo bộ phận
rồi drill-in xem Kanban từng người.

Đây LÀ một sự đảo ngược có chủ đích của non-goal đã chốt ở plan gốc ("Không
áp dụng model đội này cho các khối khác") — nhưng model ở đây khác hẳn: không
có team/roster/quản lý nhiều người, mỗi user chỉ quản lý đúng task của chính
mình, nên không mâu thuẫn thật với quyết định cũ (quyết định cũ nói về việc
không nhân bản *model đội KD* sang khối khác, task cá nhân không phải model
đội).

## Bối cảnh đã chốt (brainstorm, AskUserQuestion 2026-08-29)

1. **Phạm vi nhóm "ngoài 6 đội"**: MỌI user active KHÔNG có dòng trong
   `team_members` — gồm cả 5 bộ phận ngoài kinh-doanh (`sx-theu`, `sx-in`,
   `rnd`, `it`, `fulfillment`) LẪN nhân sự `kinh-doanh` chưa được xếp vào đội
   KD nào. KHÔNG gồm `department = 'bgd'` (BGĐ là người quan sát/quản lý,
   không phải người bị quản lý).
2. **Data model**: tái dùng bảng `tasks` hiện có — `team_id` chuyển thành
   nullable, thêm `owner_user_id` cho task cá nhân. KHÔNG tạo bảng riêng.
3. **Quyền xem/sửa task cá nhân**: CHỈ chính chủ (`owner_user_id = current
   user`) và BGĐ (`tier = 'full'`). Leader của bộ phận đó KHÔNG có quyền xem/
   sửa task cá nhân của nhân viên trong bộ phận — khác hẳn model quản lý đội
   KD (nơi quản lý sửa được task của cả đội).
4. **Vị trí UI**: cùng trang `/dashboard/giao-task` hiện có, không tách route
   riêng. Người tự quản lý (không phải BGĐ) khi vào trang nếu thuộc nhóm
   "ngoài 6 đội" thì thấy thẳng Kanban cá nhân của chính mình, không cần
   chọn gì. Với BGĐ: [CẬP NHẬT sau khi xem UI thật, 2026-08-29] khối "Bộ
   phận khác" LUÔN hiện sẵn ngay dưới bảng 6 đội trên màn Tổng quan — KHÔNG
   qua dropdown/lựa chọn nào (thiết kế ban đầu định thêm 1 lựa chọn trong
   dropdown, người dùng phản hồi trực tiếp muốn gộp chung 1 trang luôn, xem
   Phase 4).
5. **Kanban đã có sẵn code thật** (không phải giả định từ plan gốc đã lỗi
   thời): `TaskKanban`/`KanbanCard`/`KanbanQuickAdd` trong
   [task-board.tsx:973-1250](../../components/dashboard/task-board.tsx#L973)
   là 1 cách trình bày khác của CÙNG dữ liệu `Task[]` (2 cột Chưa làm/Hoàn
   thành, kéo-thả HTML5 DnD đổi trạng thái, "+ Thêm thẻ" nhanh). Bảng cá nhân
   dùng lại đúng pattern trực quan này (không phải viết Kanban từ đầu), nhưng
   viết thành component MỚI riêng (xem quyết định kiến trúc Phase 4) thay vì
   sửa trực tiếp `task-board.tsx` — file đó đã 2640 dòng, gắn chặt với khái
   niệm đội/roster/category, sửa trực tiếp rủi ro phá luồng 6 đội đang chạy
   tốt (non-goal #1 dưới đây).

## Quyết định kiến trúc bổ sung (suy ra từ scout code, không cần hỏi lại)

- **`assignee_user_id` vs `owner_user_id`**: với task cá nhân, để trống
  `assignee_user_id` (NULL) — không set trùng `owner_user_id`. Cột
  `assignee_user_id` chỉ có ý nghĩa "ai trong đội phụ trách task này" (task
  đội KD, người tạo có thể khác người phụ trách); task cá nhân luôn có đúng 1
  người liên quan là `owner_user_id`, không cần cột thứ 2 lặp lại. UI Kanban
  cá nhân vì vậy KHÔNG hiện avatar người phụ trách trên card (khác card đội
  KD) — không cần thiết khi chỉ có 1 người.
- **`category_id`, `channel`, `product`, `option_tag`, `reference_link`,
  `account_name`**: giữ nguyên NULL cho task cá nhân (các field superset này
  vốn đặc thù cho tác vụ Media/Support của đội kinh doanh). Kanban cá nhân
  chỉ cần `title`, `task_date`, `note`, `status` — Bảng/Thẻ chi tiết như đội
  KD KHÔNG áp dụng cho task cá nhân (chỉ có Kanban, xem Non-goals).

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `tasks.team_id` nullable + `owner_user_id` mới + CHECK constraint đúng 1 trong 2 loại (team hoặc cá nhân), migrate an toàn có backup | P1 |
| 2 | Data access layer: CRUD + nhân bản task cá nhân theo `owner_user_id`; liệt kê user ngoài 6 đội gom theo `department` kèm tiến độ tháng mỗi người | P1 |
| 3 | Server actions: chỉ chính chủ hoặc BGĐ được đọc/sửa task cá nhân của 1 người, chặn ở server (không chỉ ẩn UI) | P1 |
| 4 | UI: Kanban cá nhân (tự quản lý) + màn BGĐ gom theo bộ phận → drill-in xem Kanban từng người, gắn vào trang `/dashboard/giao-task` hiện có | P1 |
| 5 | Kiểm thử thủ công đủ 3 vai: user ngoài 6 đội, BGĐ, người không liên quan | P2 |

## Non-goals (ngoài phạm vi lần này)

- Không đổi model 6 đội KD1-KD6 đã có (schema/quyền/UI phần đó giữ nguyên
  100%; `task-board.tsx` chỉ nhận thêm 1-2 prop/callback nhỏ để BGĐ điều
  hướng sang màn bộ phận, không đổi logic team hiện có — xem Phase 4).
  Xác nhận không phá: `npm run build`/`npm run lint` sạch, trang team KD vẫn
  hoạt động như cũ ở Phase 5.
- Không cho leader bộ phận quyền quản lý task cá nhân của nhân viên trong bộ
  phận (đã chốt ở quyết định #3).
- Không mở rộng chi tiết/lịch sử/comment/rollover sang task đội KD; Phase 6
  chỉ áp dụng cho task cá nhân theo yêu cầu bổ sung ngày 2026-08-31.
- Không seed sẵn dữ liệu mẫu — người dùng tự tạo task Kanban của mình qua UI.
- Không thêm biểu đồ/chart riêng cho task cá nhân (chart theo người/ngày vốn
  chỉ có ý nghĩa khi nhiều người — 1 người 1 board không cần).

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Schema migration](./phase-01-start.md) | Pending |
| 2 | [Phase 2: Data access layer task ca nhan va bo phan](./phase-02-data-access-layer-task-ca-nhan-va-bo-phan.md) | Pending |
| 3 | [Phase 3: Server actions](./phase-03-server-actions.md) | Pending |
| 4 | [Phase 4: UI trang Giao Task cho nguoi ngoai 6 doi](./phase-04-ui-trang-giao-task-cho-nguoi-ngoai-6-doi.md) | Pending |
| 5 | [Phase 5: Kiem thu thu cong](./phase-05-kiem-thu-thu-cong.md) | Pending |
| 6 | [Phase 6: Chi tiet task, lich su, binh luan va rollover](./phase-06-chi-tiet-task-lich-su-binh-luan-va-rollover.md) | In progress |

## Success Criteria

- [ ] `npm run db:migrate` chạy sạch; `tasks.team_id` nullable, có
      `owner_user_id`, CHECK constraint đúng 1 trong 2 loại; backup trước khi
      migrate lên production.
- [ ] Đăng nhập 1 user thuộc bộ phận `sx-theu` (không nằm trong
      `team_members`) vào `/dashboard/giao-task` → thấy thẳng Kanban cá nhân,
      tạo/sửa/xoá được task của chính mình, KHÔNG thấy task của người khác.
- [ ] Đăng nhập BGĐ vào `/dashboard/giao-task` → thấy sẵn danh sách gom theo
      bộ phận ngay trên màn Tổng quan (không cần chọn gì), drill-in xem đúng
      Kanban của từng người, sửa được task người đó.
- [ ] 1 người bất kỳ không phải chủ và không phải BGĐ gọi thẳng server
      action với `ownerUserId` của người khác → bị chặn ở server (ném lỗi),
      không chỉ dựa vào ẩn UI.
- [ ] `npm run build` và `npm run lint` sạch; trang 6 đội KD vẫn hoạt động
      như cũ (không regression).
- [ ] Task cá nhân có tiêu đề, mô tả, ảnh, ngày task, mức ưu tiên; mở card ra
      drawer bên phải để sửa, xem ngày tạo/sửa, comment và lịch sử thay đổi.
- [ ] Khi tải board ngày mới, mọi task cá nhân chưa xong ở ngày cũ được chuyển
      tới hôm nay, trạng thái `in_progress`, gắn trễ hạn và xếp trên cùng;
      chạy lại không thay đổi thêm dữ liệu hoặc tạo bản sao.

## Risk Assessment tổng quan

- **Rủi ro cao nhất**: CHECK constraint XOR (`team_id`/`owner_user_id`) áp
  lên bảng `tasks` đã có dữ liệu thật của 6 đội KD — nếu viết sai điều kiện
  có thể chặn insert/update hợp lệ của luồng đội KD đang chạy production.
  **Mitigation**: backup trước migrate (bắt buộc), test constraint bằng tay
  trên staging/local trước khi áp lên production, xem chi tiết Phase 1.
- **Rủi ro**: sửa `task-board.tsx` (2640 dòng, đang chạy ổn định cho 6 đội)
  để thêm điều hướng sang màn bộ phận có thể vô tình đổi hành vi cũ.
  **Mitigation**: Phase 4 chỉ thêm prop/callback mới (additive), không sửa
  logic `activeTeamId`/`board` hiện có; test hồi quy 6 đội ở Phase 5.
- **Rủi ro**: quyền BGĐ sửa task cá nhân của người khác dễ nhầm sang cho phép
  leader bộ phận cũng sửa được (2 khái niệm "full" và "leader" gần nhau trong
  `lib/roles.ts`). **Mitigation**: mọi check quyền dùng đúng
  `session.tier === 'full'`, không dùng department/leader — viết rõ trong
  Phase 3, test riêng 1 case leader bị chặn ở Phase 5.

## Red Team Review

### Session — 2026-08-29

3 reviewer hostile chạy song song (Security Adversary/Fact Checker,
Assumption Destroyer/Scope Auditor, Failure Mode Analyst/Flow Tracer) trên
plan gốc (trước khi có mục này). Tổng 28 finding thô, dedupe còn 15 finding
độc lập — mọi finding đều có bằng chứng `file:line`, nhiều finding được CẢ 3
reviewer phát hiện độc lập (đặc biệt 3 lỗi Critical ở Phase 1). Đã tự xác
minh lại bằng grep trực tiếp 6 claim quan trọng nhất trước khi adjudicate
(xem cột Bằng chứng) — không chỉ tin lời reviewer.

**Findings:** 15 (15 accepted, 0 rejected)
**Severity breakdown:** 4 Critical, 5 High, 6 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Comment `--` trước statement mới bị `scripts/migrate.ts` filter, statement không chạy mà không báo lỗi | Critical | Accept | Phase 1 |
| 2 | `ADD CONSTRAINT` không idempotent, `migrate.ts` replay toàn file → lỗi `42710` vĩnh viễn từ lần chạy thứ 2 | Critical | Accept | Phase 1 |
| 3 | Không có DB staging, bước test-cleanup dùng `DELETE` không scope trên production | Critical | Accept | Phase 1 |
| 4 | Nav "Giao Task" gate theo `department`/`tier` khiến toàn bộ đối tượng của plan không bao giờ thấy menu | Critical | Accept | Phase 4 |
| 5 | `requirePersonalTaskContext` không kiểm tư cách "ngoài 6 đội" của `ownerUserId` → tạo dữ liệu mồ côi | High | Accept | Phase 3 |
| 6 | BGĐ sửa/xoá task cá nhân người khác không ghi audit log (khác quy ước hiện có của chính file) | High | Accept | Phase 3 |
| 7 | `Task.teamId: number` sai hợp đồng kiểu khi task cá nhân có `team_id = NULL`, `npm run build` không bắt được | High | Accept | Phase 2 |
| 8 | Phương pháp kiểm chứng "gọi server action qua console" không khả thi kỹ thuật (Next.js Server Actions không phải hàm global) | High | Accept | Phase 3, 5 |
| 9 | Không quy định thứ tự deploy migration/code; `vercel rollback` không rollback schema | High | Accept | Phase 1 |
| 10 | `TaskInput` đầy đủ cho phép mass-assignment `assigneeUserId`/`categoryId`; JOIN `users` trong `TASK_SELECT` biến action cá nhân thành nguồn dò họ tên+avatar theo user id | Medium | Accept | Phase 2, 3 |
| 11 | Kanban gốc chỉ hỗ trợ xoá + đổi trạng thái, không có đường sửa nội dung — mâu thuẫn với chính Success Criteria "sửa được" | Medium | Accept | Phase 4 |
| 12 | Thiết kế shell điều hướng riêng unmount `TaskBoard`, mất state đội KD đang xem — mâu thuẫn trực tiếp với tiêu chí Phase 5 "không mất state" | Medium | Accept | Phase 4 |
| 13 | `range`/`yearMonth` từ client không validate → lỗi 500 không kiểm soát hoặc quét không giới hạn | Medium | Accept | Phase 3 |
| 14 | Nhân bản qua `window.prompt()` không validate, lỗi Postgres thô lộ ra UI | Medium | Accept | Phase 3, 4 |
| 15 | `updatePersonalTask` ghi đè cả hàng (copy `updateTask`), không kiểm soát đồng thời khi có 2 người viết (chủ + BGĐ) | Medium | Accept | Phase 2 |

**Bằng chứng đã tự xác minh lại** (không chỉ dựa vào lời reviewer):
- `scripts/migrate.ts:9-12` — xác nhận `split(';')` + `filter(!s.startsWith('--'))`.
- `db/schema.sql` — xác nhận 0 dòng bắt đầu bằng `--`, 0 câu `ADD CONSTRAINT` (100% DDL hiện có đều idempotent).
- `package.json:10` + `.env.example:5-6` — xác nhận `db:migrate` dùng `.env.local` được pull từ `--environment=production`, không có DB thứ hai.
- `app/dashboard/layout.tsx:51-56` — xác nhận nav "Giao Task" gate theo `department === 'kinh-doanh' || tier === 'full'`, và comment tại chỗ xác nhận route/action đã tự chặn ở server (mở nav không mở thêm lỗ hổng quyền).
- `lib/teams.ts:121-129` (`listActiveUsersNotInAnyTeam`) — xác nhận không lọc theo `department`, xác nhận đường "thêm 1 người ngoài kinh-doanh vào đội KD" khả thi qua UI hiện có.
- `lib/users.ts:185` — xác nhận `findUserById` tồn tại đúng tên (dùng trong Phase 3 thay vì tên hàm `getUserById` không tồn tại đã dùng nhầm ở bản nháp đầu).

**Quyết định thiết kế phát sinh từ red-team** (không phải bug đơn thuần, ghi
lại lý do chọn phương án):
- Phase 1: constraint idempotent bằng cặp `DROP CONSTRAINT IF EXISTS` + `ADD
  CONSTRAINT` (2 câu lệnh riêng) thay vì bọc `DO $$ ... $$` — tránh phải sửa
  luôn `scripts/migrate.ts` (splitter không hiểu dollar-quoting), giữ đúng
  phạm vi "sửa 1 file schema" ban đầu.
- Phase 1: test constraint bằng `BEGIN; ...; ROLLBACK;` thay vì INSERT+DELETE
  — loại bỏ hoàn toàn nhu cầu có DB staging cho riêng bước test này (dù rủi
  ro "không có staging" nói chung vẫn còn, ghi lại như rủi ro đã biết trong
  Phase 1, không giả vờ đã hết).
- Phase 4: bỏ hẳn kiến trúc `GiaoTaskShell` (thiết kế gốc), thay bằng mở rộng
  union type của `activeTeamId` sẵn có trong `TaskBoard` — sửa tận gốc thay
  vì vá triệu chứng, và thực ra ĐƠN GIẢN HƠN thiết kế gốc.
- Phase 3: thêm guard chặn thêm-vào-đội khi còn task cá nhân (thay vì xây
  luồng chuyển/merge dữ liệu) — chọn phương án nhỏ nhất đóng được lỗ hổng,
  đúng tinh thần KISS, không mở rộng scope ngoài yêu cầu gốc.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md, phase-02-data-access-layer-task-ca-nhan-va-bo-phan.md, phase-03-server-actions.md, phase-04-ui-trang-giao-task-cho-nguoi-ngoai-6-doi.md, phase-05-kiem-thu-thu-cong.md
- Decision deltas checked: 15 (bảng trên)
- Reconciled stale references: kiến trúc `GiaoTaskShell`/`giao-task-shell.tsx` đã bị loại bỏ hoàn toàn khỏi Phase 4 và không còn xuất hiện ở bất kỳ file nào khác (đã grep xác nhận); hàm `getUserById` (không tồn tại) đã sửa thành `findUserById` đúng tên thật; effort tổng đã cập nhật từ ~14h lên ~18h khớp tổng effort 5 phase (2+4+3+6+2.5)
- Unresolved contradictions: 0

## Code Review (sau khi implement Phase 1-4)

### Session — 2026-08-29

1 `code-reviewer` subagent, review toàn bộ code Phase 1-4 (10 file, đọc trực
tiếp vì nhiều file untracked trong git nên `git diff` không hiện đủ), tự chạy
lại `npx tsc --noEmit` độc lập (sạch). Kết luận: 7 điểm trọng tâm (phân
quyền, mass-assignment/PII, regression 6 đội KD, React hooks, data integrity
update động, type nullable teamId, thứ tự guard hasPersonalTasks) đều ĐẠT —
không có lỗ hổng phân quyền hay rò rỉ dữ liệu. 1 High + 5 Medium + 8 Low, đã
fix hết phần đáng làm ngay:

| # | Finding | Severity | Disposition | Applied |
|---|---------|----------|-------------|---------|
| 1 | `createPersonalTaskAction` thiếu audit log khi BGĐ tạo hộ (lệch spec Phase 3) | High | Fixed | actions.ts |
| 2 | Validate create không bắt buộc title/taskDate thật sự có giá trị | Medium | Fixed | actions.ts (`assertValidPersonalTaskCreateInput`) |
| 3 | Validate ngày dùng `Date.parse` nhận cả ngày không tồn tại (vd 2026-02-31) | Medium | Fixed | actions.ts (`isValidDateString` round-trip) |
| 4 | Xoá task không tồn tại vẫn "thành công" và vẫn ghi audit sai sự thật | Medium | Fixed | actions.ts (`deletePersonalTaskAction` kiểm tồn tại trước) |
| 5 | `assertValidRange`/`assertValidYearMonth` chỉ áp cho action cá nhân, 3 action đội KD cũ vẫn nhận input thô | Medium | Fixed | actions.ts (áp thêm cho `getMyTeamBoardAction`/`getTeamBoardAsBgdAction`/`getAllTeamsOverviewAction`) |
| 6 | Migration ngoài transaction — nếu `ADD CONSTRAINT` fail giữa chừng, DB mất `tasks_scope_xor` không tự phục hồi | Medium | Accept, mitigation ghi vào Phase 5 (bước verify constraint sau mỗi lần migrate) — đã tự verify lại ngay: constraint còn tồn tại trên production | phase-05 |
| 7 | `didMount` ref trong `personal-task-board.tsx` là code chết (copy từ task-board.tsx nhưng không có SSR data nên vô nghĩa) | Low | Fixed | personal-task-board.tsx |
| 8 | Click sửa tiêu đề không reset `title` state → hiện giá trị cũ nếu BGĐ vừa đổi | Low | Fixed | personal-task-board.tsx |
| 9 | `db/backups/*.json` không có trong `.gitignore` | Low | Fixed | .gitignore |
| 10 | `className="... uppercase text-ink"` ở `user-table.tsx:684` | Low | Reject — xác minh KHÔNG phải do phiên này tạo ra (đã có sẵn trong working tree từ trước, nằm trong diện "M" ở git status đầu phiên, không liên quan feature này) | Không đổi |
| 11 | `addTeamMemberAsAdminAction` không có caller UI nào | Low | Reject — thuộc phạm vi plan gốc (`giao-task-6-doi-kinh-doanh`), không phải scope của plan này, không tự xoá code không do mình viết | Không đổi |
| 12 | `requirePersonalTaskContext` không kiểm `owner.isActive` | Low | Reject cho lần này — chỉ BGĐ chạm được nhánh này, rủi ro thấp, UI (`listUsersOutsideTeamsByDepartment`) đã lọc active; để dành nếu phát sinh vấn đề thật | Không đổi |
| 13 | Query bộ phận JOIN không giới hạn tháng trong `ON` | Low | Reject cho lần này — quy mô nhỏ (~97 người), index partial đã đỡ, tối ưu sớm không cần thiết (YAGNI) | Không đổi |

`tsc --noEmit` chạy lại sau khi áp fix: sạch.

<!-- slug: giao-task-ngoai-6-doi-theo-bo-phan -->
