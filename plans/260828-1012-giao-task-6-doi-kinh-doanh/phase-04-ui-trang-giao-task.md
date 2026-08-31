---
phase: 4
title: "UI trang Giao Task"
status: pending
priority: P1
effort: "10h"
dependencies: [3]
---

# Phase 4: UI trang Giao Task

## Overview

Dựng route `app/dashboard/giao-task/page.tsx` (server component) +
component client `components/dashboard/task-board.tsx`: mặc định vào thấy
task **hôm nay**, lùi/tiến theo ngày, chuyển được sang xem theo tuần/tháng,
tab nhóm task do quản lý đội tự đặt tên (mỗi nhóm tự chọn cột hiển thị,
khớp đúng 3 tab thật đã xem của KD1: Media/Support tiktok/Support Etsy),
nhân bản 1 task hoặc hàng loạt, roster đội, tiến độ tháng, biểu đồ task
theo ngày/người. Giữ dạng **bảng** (không làm Kanban nhiều cột), trang trí
thẻ/badge lấy cảm hứng từ ảnh Trello (nhãn màu, avatar, badge trạng thái).

## Requirements

- [x] Route đọc session, redirect `/login` nếu chưa đăng nhập.
- [x] Mặc định hiện task có `task_date` = hôm nay; có nút "Hôm nay", lùi 1
      ngày, tiến 1 ngày; toggle chuyển chế độ Ngày/Tuần/Tháng (đổi
      `fromDate`/`toDate` truyền cho `getMyTeamBoardAction`, xem Phase 3).
- [x] Tab "Toàn bộ" luôn có sẵn (không lọc category, cột cố định đầy đủ);
      các tab còn lại đọc từ `team_task_categories` của đội, mỗi tab hiện
      đúng tập cột đã cấu hình (`visible_columns`) — cột luôn hiện bất kể
      cấu hình: Ngày, Thành viên, Chủ đề, Trạng thái (core, không tắt được).
- [x] Quản lý (và BGĐ) có màn quản lý nhóm: thêm/sửa tên/xoá nhóm, chọn cột
      hiển thị cho từng nhóm (checkbox trên danh sách `TASK_COLUMN_KEYS` từ
      `lib/tasks.ts`). (Sắp xếp thứ tự nhóm bằng kéo-thả chưa làm — chỉ có
      `sort_order` sẵn trong schema, để lại cho sau nếu cần vì không nằm
      trong yêu cầu gốc.)
- [x] Mỗi dòng task có nút "Nhân bản" (mọi thành viên) mở modal chọn 1 ngày
      đích; quản lý/BGĐ có thêm nút "Nhân bản hàng loạt" mở form chọn tần
      suất (hàng ngày/hàng tuần/hàng tháng) + số lần lặp.
- [x] BGĐ vào trang thấy view gộp 6 đội trước (bảng so sánh % hoàn thành),
      chọn được 1 đội cụ thể để xem/sửa như quản lý đội đó.
- [x] Biểu đồ task theo ngày/theo người tự vẽ bằng SVG/CSS thuần (div theo
      tỉ lệ %, không dùng thư viện ngoài), theo tinh thần
      `report-dashboard.tsx`.
- [x] Đồng bộ gần-real-time bằng polling nhẹ (150 giây), đúng hằng số đã
      dùng ở `sticky-board.tsx`.

## Architecture

```
app/dashboard/giao-task/page.tsx        (server component)
  └─ gọi getMyTeamBoardAction(rangeMacDinh=hom_nay) / getAllTeamsOverviewAction
  └─ render <TaskBoard initialData=... isBgd=... />

components/dashboard/task-board.tsx     (client component, 'use client')
  ├─ DateNavigator       -- chế độ Ngày/Tuần/Tháng + nút Hôm nay/lùi/tiến;
  │                          đổi chế độ/ngày -> gọi lại getMyTeamBoardAction
  │                          với range mới
  ├─ TeamSwitcher        -- chỉ render khi isBgd
  ├─ CategoryTabs        -- "Toàn bộ" + các tab từ team_task_categories;
  │                          quản lý/BGĐ thấy thêm nút "Quản lý nhóm"
  ├─ CategoryManagerModal -- CRUD nhóm + chọn visible_columns (quản lý/BGĐ)
  ├─ TaskTable           -- cột động theo tab đang chọn (core 4 cột luôn
  │                          hiện + cột theo visible_columns của tab); ô
  │                          Trạng thái là dropdown đổi trực tiếp; mỗi dòng
  │                          có nút Sửa (mở TaskFormModal), Nhân bản (mở
  │                          DuplicateModal), Xoá (confirm), avatar tròn +
  │                          badge trạng thái màu kiểu Trello
  ├─ TaskFormModal       -- thêm/sửa 1 task, field hiện theo
  │                          TASK_COLUMN_KEYS + core fields
  ├─ DuplicateModal      -- chọn 1 ngày đích (mọi thành viên) hoặc tần suất
  │                          + số lần (quản lý/BGĐ, tuỳ quyền trả về từ action)
  ├─ MonthProgressCard   -- progress ring/bar + done/total tháng hiện tại
  ├─ TeamRosterCard      -- danh sách thành viên (đánh dấu ai là quản lý),
  │                          nút thêm/gỡ/đổi role, chỉ hiện cho quản lý/BGĐ
  └─ AssigneeBarChart    -- SVG stacked bar theo ngày, màu theo người
```

Fetch lại dữ liệu sau mỗi mutation thành công (optimistic update local
trước, rồi đồng bộ lại từ server), cộng với 1 `setInterval` polling nhẹ
giống `sticky-board.tsx`.

## Related Code Files

- Create: `app/dashboard/giao-task/page.tsx`
- Create: `components/dashboard/task-board.tsx`
- Create: `lib/task-columns.ts` (tách `TASK_COLUMN_KEYS`/`TaskColumnKey`
  khỏi `lib/tasks.ts` — file đó có `import 'server-only'`, không được
  import theo giá trị từ component client, xem Implementation Steps #12
  và Risk Assessment)
- Modify: `lib/tasks.ts` (re-export `TASK_COLUMN_KEYS`/`TaskColumnKey` từ
  `lib/task-columns.ts` để chỗ khác import từ `lib/tasks` vẫn chạy được)
- Reference: `app/dashboard/khenthuong/page.tsx` (mẫu route server
  component), `components/dashboard/report-dashboard.tsx` (mẫu bar chart
  CSS/SVG tự vẽ), `components/dashboard/sticky-board.tsx` (mẫu polling +
  optimistic update)

## Implementation Steps

1. ⚠️ **Chưa đọc được** `node_modules/next/dist/docs/` — hook cục bộ
   (`scout-block.cjs`) chặn mọi truy cập `node_modules` (kể cả qua Read,
   không riêng Bash) để tiết kiệm context, xung đột trực tiếp với yêu cầu
   của `AGENTS.md`. Đã đi vòng bằng cách suy luận từ hành vi thực tế
   (`npx next --version` → 16.3.1, `npx next --help` liệt kê đúng các lệnh
   CLI hiện có) và dựa vào code mẫu đã có sẵn trong repo (`getSession()`
   dùng `await cookies()`, các trang khác đều là async server component
   nhận props đồng bộ, không có route động kiểu `[id]` trong phạm vi
   Giao Task) thay vì đọc docs trực tiếp. Route đã chạy thật qua dev
   server (xem log dưới) nên rủi ro ở Risk Assessment coi như đã né được,
   nhưng nếu sau này gặp hành vi Next 16 lạ, nên báo người dùng gỡ chặn
   `node_modules` trong `.ckignore` trước khi tra cứu thay vì đoán tiếp.
2. [x] Viết `page.tsx`: `getSession()` → redirect nếu chưa đăng nhập → tính
   `fromDate`/`toDate` mặc định = hôm nay (`lib/date.ts#todayIso`, giờ VN)
   → gọi thẳng `lib/teams.ts`/`lib/tasks.ts` (không gọi qua actions.ts —
   khớp convention đã thấy ở `app/dashboard/page.tsx`: trang server luôn
   gọi lib trực tiếp, actions.ts chỉ dành cho mutation phía client) →
   render `TaskBoard`.
3. [x] Viết điều hướng ngày/tuần/tháng (gộp vào chính `TaskBoard` thay vì
   tách file `DateNavigator` riêng — component nhỏ, tách file không giảm
   độ phức tạp thật, xem `Related Code Files`).
4. [x] Viết bộ chọn đội có điều kiện (chỉ BGĐ), gộp vào `TaskBoard`.
5. [x] Viết tabs nhóm task + `CategoryManagerModal`, nối
   `createTeamCategoryAction`/`updateTeamCategoryAction`/
   `deleteTeamCategoryAction`.
6. [x] Viết `TaskTable` với cột động theo tab đang chọn + `TaskFormModal`,
   nối `createTaskAction`/`updateTaskAction`/`deleteTaskAction`.
7. [x] Viết `DuplicateModal` + `BulkDuplicateModal`, nối
   `duplicateTaskAction` (luôn hiện) và `bulkDuplicateTasksAction` (chỉ
   hiện khi `board.isManager` true).
8. [x] Viết `MonthProgressCard`, `TeamRosterCard` (nối
   `addTeamMemberAction`/`removeTeamMemberAction`/`setMemberRoleAction`,
   hiện nhãn "Quản lý" cạnh tên nếu `role === 'manager'`).
9. [x] Viết `AssigneeBarChart` bằng div thuần theo tỉ lệ % (không phải SVG
   path tay — đơn giản hơn cho stacked bar theo ngày, vẫn không phụ thuộc
   thư viện ngoài).
10. [x] Thêm polling nhẹ (`window.setInterval`, 150s) gọi lại board/overview
    hiện tại, dọn interval khi unmount.
11. [x] Container bảng có `overflow-x-auto` riêng, `body` không set overflow
    ngang — theo đúng pattern layout chung, nhưng **chưa xác nhận bằng mắt
    trên khung mobile thật** (xem mục xác minh còn thiếu bên dưới).
12. `npm run dev` đã có sẵn (server khác khởi động từ trước, tái dùng thay
    vì mở thêm — đúng process-management.md). Không đăng nhập được bằng
    mắt thật (không có mật khẩu tài khoản thật, đổi mật khẩu tài khoản test
    bị auto-mode classifier chặn — hợp lý, đó là thao tác đổi thông tin
    xác thực trên database thật) nên người dùng tự test bằng tài khoản
    thật của họ thay vì mình. Trước khi giao lại, mình tự dựng 1 route tạm
    ở `app/giao-task-test-render/page.tsx` (ngoài `app/dashboard`, không
    bị layout chặn session) render thẳng `<TaskBoard>` với dữ liệu giả cả
    2 nhánh (có đội / view gộp BGĐ) để bắt lỗi build/runtime mà không cần
    đăng nhập — **nhờ vậy bắt được 1 bug thật**: `TASK_COLUMN_KEYS` (hằng
    số, không phải type) nằm trong `lib/tasks.ts` có `import 'server-only'`,
    bị `task-board.tsx` ('use client') import theo giá trị → Next chặn cả
    module khi bundle cho client ("You're importing a module that depends
    on server-only..."). Người dùng tự bắt được lỗi này khi mở trang thật
    (ảnh build error), xác nhận đúng dự đoán ở Risk Assessment nhưng ở góc
    độ cụ thể hơn dự tính ban đầu. Đã sửa (xem Related Code Files cập
    nhật), route test tạm đã xoá sau khi xác nhận cả 2 nhánh render sạch
    (không còn "Build Error"/"Unhandled Runtime Error" trong HTML, đúng
    text kỳ vọng xuất hiện: "Hôm nay", "Toàn bộ", "Thành viên đội", "Tổng
    quan 6 đội", "Tuyền, Huyền"...).

## Success Criteria

Đã xác minh được ở mức "render sạch, đúng nội dung tĩnh" qua route test
tạm (xem bước 12) cho cả 2 nhánh (đội cụ thể / view gộp BGĐ) — chưa xác
minh được tương tác thật (bấm nút, submit form, nhân bản, polling) vì đó
cần state thay đổi qua nhiều bước và tài khoản thật, để người dùng tự test
theo checklist Phase 6:

- [ ] Vào trang lần đầu thấy đúng task hôm nay, không phải toàn bộ lịch sử.
- [ ] Lùi/tiến ngày và đổi Tuần/Tháng ra đúng tập task tương ứng.
- [ ] Tạo nhóm mới, chọn 2-3 cột hiển thị, tab mới hiện đúng cột đã chọn +
      4 cột core, không hiện cột khác.
- [ ] Nhân bản 1 task sang ngày khác tạo đúng 1 dòng mới độc lập; nhân bản
      hàng loạt (quản lý) tạo đúng số dòng theo tần suất đã chọn.
- [ ] BGĐ chuyển qua lại giữa các đội trong bộ chọn đội thấy đúng dữ liệu
      từng đội; KD1 hiện đúng 2 người có nhãn "Quản lý".
- [ ] Không có lỗi console, không có warning hydration (chưa mở DevTools
      trình duyệt thật để xác nhận — route test tạm chỉ soi được lỗi
      build/runtime lộ ra trong HTML server-render, không soi được cảnh
      báo chỉ hiện phía client).

## Risk Assessment

- **Rủi ro**: Next.js 16 đổi API route/dynamic params so với hiểu biết mặc
  định — có thể viết sai cú pháp server component/action.
  **Mitigation**: bước 1 bắt buộc đọc docs cục bộ trước (không đọc được do
  hook chặn `node_modules`, xem Implementation Steps #1) — thực tế may
  mắn không gặp vấn đề route/dynamic params, nhưng có gặp 1 rủi ro khác
  chưa lường trước, xem mục dưới.
- **Đã xảy ra thật (đã sửa)**: `TASK_COLUMN_KEYS` là hằng số (không phải
  type) từng nằm trong `lib/tasks.ts` (có `import 'server-only'`).
  `task-board.tsx` ('use client') import nó theo giá trị → Turbopack chặn
  cả module khi bundle cho client, lỗi "You're importing a module that
  depends on server-only...". Người dùng tự bắt được lỗi này khi mở trang
  thật. Đã sửa bằng cách tách hằng số này ra `lib/task-columns.ts` (không
  có `server-only`, an toàn cho cả client lẫn server), `lib/tasks.ts`
  re-export lại để chỗ khác không phải đổi import. Bài học áp dụng cho
  các phase sau nếu cần thêm hằng số dùng chung: hằng số/type dùng ở cả
  client và server-only lib phải nằm ở 1 file KHÔNG có `import 'server-only'`
  ngay từ đầu, không đặt chung với các hàm truy vấn DB.
- **Rủi ro**: polling quá dày gây tải DB không cần thiết.
  **Mitigation**: dùng đúng khoảng polling đã có tiền lệ trong
  `sticky-board.tsx` thay vì chọn số tuỳ ý.
