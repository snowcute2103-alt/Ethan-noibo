---
title: "Toi uu hieu nang Giao Task"
description: "Giam round-trip Neon, bo hydration waterfall, toi uu query va client bundle cho luong mo board doi/ca nhan ma khong doi nghiep vu hoac phan quyen."
status: in_progress # Phase 1-4 done; Phase 5 (đo đạc EXPLAIN + test theo vai) chưa chạy trên DB thật
priority: P1
effort: "~16h"
tags: ["giao-task", "performance", "postgresql", "nextjs"]
created: 2026-09-02
---

# Tối ưu hiệu năng Giao Task

## Outcome đã chốt

Khi người dùng bấm vào đội hoặc nhân sự, dữ liệu task chính phải xuất hiện
nhanh nhất có thể. Tối ưu tập trung vào số lần gọi Neon/Server Action, query
thừa, payload RSC/client và hydration waterfall; giữ nguyên toàn bộ nghiệp vụ,
phân quyền, URL, lịch sử, audit và semantics mỗi task lặp là một dòng độc lập.

## Bằng chứng mở đầu

- Dữ liệu hiện tại: 1.522 task, 98 user, 30 thành viên đội.
- `EXPLAIN (ANALYZE, BUFFERS)`: query task đại diện khoảng 0,365 ms; aggregate
  lịch tháng khoảng 0,536 ms.
- 6 query Neon chạy song song: khoảng 251–253 ms; cùng 6 query qua một batch
  transaction: khoảng 257–263 ms. Vì vậy không đổi sang batch transaction.
- Query count hiện tại, không tính layout dùng chung: team root ~12, team route
  động ~13, BGĐ overview ~6, board cá nhân chính chủ ~10, BGĐ xem board cá
  nhân ~14. Tạo 52 task lặp có thể phát sinh tới 208 câu SQL trước refresh.

## Constraints

- Bảo toàn kiểm tra session/revocation và quyền đội/BGĐ/chính chủ ở server.
- Bảo toàn URL `/dashboard/giao-task` và `/dashboard/giao-task/[code]`.
- Bảo toàn dữ liệu đang sửa chưa commit; không ghi đè thay đổi của người dùng.
- Dùng API/convention Next.js 16 theo `node_modules/next/dist/docs/`.
- Query ngày tiếp tục dùng khoảng nửa mở cho tháng và index hiện có.
- Không thêm index chỉ dựa trên phỏng đoán; mọi index mới cần EXPLAIN mới và
  một lần phê duyệt migration riêng.

## Non-goals

- Không thêm Redis/Memcached, WebSocket, SWR hoặc queue service.
- Không gộp/minify JS/CSS thủ công, không CSS Sprite; Next.js tiếp tục quản lý
  bundle, compression và code splitting.
- Không cache công khai dữ liệu board hoặc session check qua nhiều request.
- Không dùng chung một Blob ảnh cho nhiều task lặp vì cơ chế xoá hiện tại có
  thể làm hỏng ảnh của task khác; upload ảnh độc lập được giữ nguyên.
- Không đổi thiết kế giao diện hoặc luồng nghiệp vụ ngoài phản hồi loading.

## Phases

| # | Phase | Status | Dependency |
|---|-------|--------|------------|
| 1 | [Query, projection và session dedupe](./phase-01-query-va-session.md) | Done | — |
| 2 | [Server-render dữ liệu đầu tiên](./phase-02-server-render-initial-data.md) | Done | Phase 1 |
| 3 | [Set-based mutation và bỏ refresh thừa](./phase-03-set-based-mutations.md) | Done | Phase 1–2 |
| 4 | [Polling, navigation và lazy loading](./phase-04-client-performance.md) | Done | Phase 2–3 |
| 5 | [Kiểm chứng, review và rollback](./phase-05-verification.md) | In progress | Phase 1–4 |

## Tiến độ (2026-09-02, tiếp tục từ Codex)

- Phase 1–3: đã có sẵn trong working tree (Codex), đã soát lại toàn bộ diff so
  với từng step trong phase file — khớp thiết kế, `npx tsc --noEmit` sạch.
- Phase 4: hoàn thiện phần còn thiếu — prefetch theo intent (hover/focus/touch)
  cho danh sách "Bộ phận khác" thay vì prefetch theo viewport
  (`components/dashboard/department-overview.tsx`), thêm
  `app/dashboard/giao-task/loading.tsx`, dynamic-import
  `PersonalTaskDetailDrawer`. Đồng thời tách roster/category (`team`,
  `categories`, `isManager`) ra khỏi payload poll — `getMyTeamBoardTasksAction`/
  `getTeamBoardTasksAsBgdAction` giờ chỉ trả phần đổi theo range (tasks/month
  progress/chart/products/dayCategoryCounts); roster/category có action riêng
  `getTeamRosterAction`, chỉ gọi sau thao tác thêm/xoá thành viên, đổi vai
  trò/nhóm hoặc CRUD category. Không tách các modal quản lý thành
  viên/category ra khỏi `task-board.tsx` (vẫn là monolith) vì đây là
  component nội bộ, không phải file riêng — tách sẽ tạo rủi ro vòng import
  không tương xứng với phần chunk tiết kiệm được; để lại cho lần sau nếu đo
  thực tế thấy cần.
- Đã xoá 3 Server Action không còn caller sau khi client chuyển sang nhận dữ
  liệu qua initial props + response mutation:
  `getMonthTaskCategoryCountsAction`, `getMyPersonalMonthDayCountsAction`,
  `getDepartmentsOverviewAction`.
- Đếm lại query theo route bằng cách đọc code (không chạy EXPLAIN trên DB
  thật trong lượt này): team root 7, BGĐ team detail 7, chính chủ cá nhân 5,
  BGĐ xem cá nhân 6, overview 4 — đều đạt mục tiêu. Poll team còn 4–5 query
  dữ liệu (không tính round-trip `getSession()` bắt buộc mỗi Server Action,
  cùng quy ước loại "layout dùng chung" đã dùng cho các mốc route ở trên).
- `npx tsc --noEmit` và `npm run build` sạch sau mọi thay đổi. Dự án không có
  eslint/test framework nào được cấu hình (`npm run lint` không chạy được ở
  Next 16 vì thiếu eslint) nên không có gate lint/test tự động để chạy.
- Chưa làm trong lượt này (Phase 5 còn lại): EXPLAIN read-only trên DB thật,
  đo TTFB/click-to-content thực tế, test đủ vai (member/manager/BGĐ/outside-
  team/unauthorized) qua UI thật — cần tài khoản thật để đăng nhập, so sánh
  chunk JS trước/sau bằng bundle analyzer.

## Acceptance criteria

- Board cá nhân và lịch xuất hiện từ server render; hydration không gọi lại
  dữ liệu khởi tạo giống hệt.
- Query mở board mục tiêu: team root <= 9; BGĐ team detail <= 8; chính chủ cá
  nhân <= 5; BGĐ xem cá nhân <= 7; overview <= 5 (không tính layout dùng chung).
- Team detail không tải hoặc polling BGĐ overview không được render.
- Poll mục tiêu: team <= 5 query; cá nhân chính chủ <= 4; BGĐ xem cá nhân <= 6.
- Team task không chạy correlated comment count; personal card vẫn hiện đúng
  `commentCount` và drawer vẫn có đủ comment/lịch sử.
- Department progress chỉ join task trong tháng được chọn và vẫn giữ user có 0
  task nhờ đúng semantics `LEFT JOIN`.
- Một thao tác recurrence/bulk duplicate dùng một Server Action và một câu SQL
  set-based; số dòng, ngày, assignee, status, `duplicated_from_task_id` và
  history giống hành vi cũ.
- Mutation có response authoritative không refresh lại toàn board; optimistic
  rollback vẫn hoạt động khi lỗi.
- Tab ẩn không polling; khi quay lại chỉ refresh một lần.
- Link vẫn giữ URL cũ, có feedback loading tức thì, prefetch theo intent và
  drawer/modal conditional không nằm trong initial chunk khi có thể tách an toàn.
- `npx tsc --noEmit`, lint phù hợp với Next 16, build và test trọng tâm đều sạch.

## Public contract decisions

- Giữ `Task.commentCount` đã có trong working tree. Team task map giá trị 0 mà
  không đếm bảng comment; personal summary lấy count thật.
- Có thể thêm prop initial-data vào `TaskBoard`/`PersonalTaskBoard` và thay
  `DepartmentOverview` thành presentational component; đây là contract nội bộ,
  không đổi API/URL công khai.
- Có thể thêm response DTO/action cho refresh gọn và bulk personal create;
  action cũ chỉ bị thay caller sau khi parity đã được kiểm chứng.
- Không thay schema trong phạm vi đã duyệt. `db/schema.sql` chỉ đổi nếu một
  constraint cần thiết để giữ invariant được chứng minh; index là scope riêng.

## Rollback

Mỗi phase là một diff độc lập. Không có migration dự kiến nên rollback bằng
revert code/props/action tương ứng. Nếu projection mới thiếu field, khôi phục
field tại boundary thay vì bỏ toàn bộ tối ưu. Nếu local reconciliation không
đủ authoritative, giữ mutation mới nhưng bật lại targeted refresh. Nếu React
`cache()` không chứng minh được request scope, giữ `getSession()` như cũ.

<!-- slug: toi-uu-hieu-nang-giao-task -->
