# Phase 3: Set-based mutation và bỏ refresh thừa

## Goal

Đưa recurrence/duplicate về một logical request + một SQL statement và dùng
response mutation để cập nhật UI thay vì tải lại mọi dữ liệu.

## Files

- `lib/tasks.ts`
- `app/dashboard/giao-task/actions.ts`
- `components/dashboard/task-board.tsx`
- `components/dashboard/personal-task-board.tsx`
- `components/dashboard/personal-task-detail-drawer.tsx`

## Steps

1. Thêm set-based team duplicate nhận danh sách task/date/assignee đã validate;
   `INSERT ... SELECT` tạo toàn bộ dòng, giữ override-assignee semantics,
   `duplicated_from_task_id`, status và thứ tự trả về ổn định.
2. Thêm bulk personal create cho recurrence: authorize một lần, validate tối đa
   52 ngày, insert + history trong cùng câu SQL, trả danh sách task đã tạo.
3. Giữ upload ảnh từng task độc lập để cơ chế delete Blob không phá reference.
4. Create/update/status dùng task response authoritative thay state optimistic;
   delete dùng task cũ ở client để cập nhật delta sau khi server xác nhận.
5. Cập nhật month progress, calendar counts, chart và products bằng delta/derive
   khi đủ dữ kiện. Chỉ giữ targeted refresh cho thay đổi roster/category hoặc
   aggregate không thể suy ra an toàn.
6. Status-only personal update bỏ pre-read ngày không liên quan; date/due-date
   update vẫn kiểm invariant đầy đủ.
7. Drawer append/update detail từ response khi đủ; không reload toàn board.

## Validation

- Matrix recurrence daily/weekly/monthly, tháng ngắn, leap day, duplicate date,
  nhiều task, nhiều assignee và giới hạn tối đa.
- So sánh row/history/default/creator/owner/team trước–sau; lỗi phải atomic, không
  tạo một phần.
- Một bulk operation = một Server Action + một SQL write statement.
- Mutation thường không có full-board action tiếp theo; lỗi rollback đúng card.
- Người ngoài scope không thể tạo/sửa/duplicate task qua input giả mạo.

## Risks and rollback

- Cross join sai có thể nhân số dòng: validate tích cardinality trước SQL và test
  exact row count. Rollback về implementation cũ nếu parity không đạt.
- Local delta lệch khi nhiều người cùng sửa: polling/focus vẫn reconcile; mutation
  nào response không authoritative thì giữ targeted refresh cho riêng mutation đó.
