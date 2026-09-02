# Phase 1: Query, projection và session dedupe

## Goal

Giảm query/payload thừa ở DAL mà không đổi dữ liệu quan sát được hoặc biên bảo
mật. Đây là nền cho loader và mutation ở các phase sau.

## Files

- `lib/auth.ts`
- `lib/tasks.ts`
- `lib/teams.ts`
- `app/dashboard/giao-task/team-board-data.ts`
- `app/dashboard/giao-task/actions.ts`
- `db/schema.sql` chỉ khi invariant bắt buộc; không dự kiến migration/index

## Steps

1. Bọc `getSession` bằng React `cache()` theo render/request; xác minh layout và
   page dedupe nhưng hai request/người dùng khác nhau không chia sẻ kết quả.
2. Tách projection/mapping dùng cho team board, personal card và personal
   detail. Giữ alias/default/nullability; không serialize field không có caller.
3. Team query trả `commentCount: 0` mà không truy vấn
   `personal_task_comments`; personal card dùng count thật theo một aggregate
   phù hợp index, detail dùng danh sách comment đã đọc.
4. Đưa `t.task_date >= $from AND t.task_date < $to` vào `LEFT JOIN tasks` của
   tổng quan bộ phận; aggregate không còn quét lịch sử ngoài tháng.
5. Derive `isManager` từ roster đã tải. Derive chart range từ `Task[]` khi kết
   quả hoàn toàn tương đương; nếu thiếu dữ liệu thì giữ query chart.
6. Đo lại EXPLAIN, buffers, số row và payload. Không thêm index trong phase này.

## Validation

- So sánh JSON trước/sau cho team có/không task, personal có/không comment,
  user 0 task và ranh giới cuối tháng.
- Quyền session bị revoke vẫn bị chặn ở request mới.
- Team query plan không có subplan comment theo từng task.
- Department query chỉ đọc task trong khoảng tháng nhưng vẫn trả user 0 task.
- Typecheck sạch, không ép kiểu để che thiếu field.

## Risks and rollback

- Projection thiếu field ngầm dùng trong component: kiểm bằng `rg`, typecheck và
  UI test; rollback bằng thêm lại field tại đúng DTO.
- Cache sai scope có thể trộn session: nếu không chứng minh được per-render thì
  bỏ riêng thay đổi `cache()` và giữ các tối ưu DAL còn lại.
