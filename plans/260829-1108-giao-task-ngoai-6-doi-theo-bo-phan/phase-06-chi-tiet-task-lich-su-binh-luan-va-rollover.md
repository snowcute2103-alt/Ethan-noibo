---
phase: 6
title: "Chi tiet task, lich su, binh luan va rollover"
status: in-progress
priority: P1
effort: "8h"
dependencies: [4]
---

# Phase 6: Chi tiet task lich su binh luan va rollover

## Overview

Mở rộng task cá nhân thành một thẻ công việc đầy đủ: dữ liệu chi tiết, ảnh,
ưu tiên, comment, lịch sử bất biến và drawer chỉnh sửa bên phải. Task chưa
hoàn thành quá hạn được reschedule idempotent tới ngày hiện tại, chuyển sang
`in_progress`, đánh dấu trễ và xếp đầu cột.

## Requirements

- Functional: title, description, một ảnh JPEG/PNG/WebP tối đa 5 MB, task date,
  priority `low|normal|high`, created/updated timestamps và comment.
- Functional: lịch sử ghi actor, thời điểm, loại sự kiện và snapshot thay đổi
  cho create/update/comment/image/rollover; không cho client tự ghi lịch sử.
- Functional: drawer desktop rộng 1/3 viewport bên phải; mobile dùng full width;
  đóng bằng nút, overlay hoặc Escape.
- Functional: rollover chạy khi tải board, giữ nguyên ID, không duplicate,
  chuyển mọi task cũ chưa xong thẳng tới hôm nay và `in_progress`.
- Security: chỉ chủ task hoặc BGĐ dùng toàn bộ action; file upload kiểm MIME và
  dung lượng server-side.
- Compatibility: không đổi hành vi task đội KD và drag/drop Kanban hiện có.

## Architecture

- Mở rộng `tasks` bằng `description`, `image_url`, `priority`, `original_task_date`,
  `rolled_over_at`; giữ `task_date` là ngày đang được lên lịch.
- Tạo `personal_task_comments` và `personal_task_history`, FK cascade theo task.
- DAL chịu trách nhiệm transaction logic ở mức câu SQL/CTE; actions xác thực
  quyền/input/upload; client chỉ gọi action và refresh state.
- Drawer được mount một lần ở cấp `PersonalTaskBoard`, chọn task bằng ID để
  tránh mỗi card sở hữu modal riêng và tránh lỗi nesting/click propagation.

## Related Code Files

- Modify: `db/schema.sql`
- Modify: `lib/tasks.ts`
- Modify: `app/dashboard/giao-task/actions.ts`
- Modify: `components/dashboard/personal-task-board.tsx`
- Create: `components/dashboard/personal-task-detail-drawer.tsx`

## Implementation Steps

1. Thêm schema idempotent, indexes và types/mappers/DAL.
2. Thêm validation, upload ảnh, detail/comment actions và rollover trước read.
3. Sắp xếp task overdue trước, thêm badge priority/overdue và mở drawer.
4. Xây drawer editable, ảnh preview/upload, comment và timeline lịch sử.
5. Kiểm tra type/build, review quyền và hồi quy board đội KD.

## Todo

- [ ] Schema và data access
- [ ] Server actions và upload
- [ ] Drawer chi tiết
- [ ] Rollover và thứ tự Kanban
- [ ] Typecheck/build/review

## Success Criteria

- [ ] Tạo/sửa task đầy đủ và reload vẫn giữ dữ liệu.
- [ ] Comment hiện đúng tác giả/thời gian; lịch sử mô tả đúng field cũ/mới.
- [ ] Upload sai loại hoặc >5 MB bị từ chối; ảnh hợp lệ hiển thị trong drawer.
- [ ] 10 task cũ chưa xong đều chuyển tới hôm nay, vào `in_progress`, nằm đầu
      cột và có nhãn trễ; lần load thứ hai không ghi rollover lần nữa.
- [ ] User ngoài quyền không đọc/ghi detail, comment hoặc upload ảnh.
- [ ] `npx tsc --noEmit` và `npm run build` sạch.

## Risk Assessment

- Rollover làm thay đổi ngày task thật: giữ `original_task_date` và history để
  không mất dấu; predicate `task_date < today AND status != done` bảo đảm
  idempotent. Nếu lịch sử bị trùng khi tải đồng thời, unique partial index theo
  task + ngày rollover sẽ là chốt chống trùng.
- Upload Blob thành công nhưng DB update lỗi có thể để blob mồ côi; action sẽ
  cố xóa blob mới khi update thất bại và chỉ xóa blob cũ sau khi DB thành công.
- File client hiện lớn: drawer tách component riêng, board chỉ quản lý selected
  task và refresh callback để giảm blast radius.
