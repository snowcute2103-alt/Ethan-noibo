---
phase: 5
title: "Kiem thu thu cong"
status: pending
priority: P2
effort: "2.5h"
dependencies: [4]
---

# Phase 5: Kiểm thử thủ công

## Overview

Kiểm thử bằng tay trên production (không có DB staging riêng, xem Phase 1)
với tài khoản thật. Không viết test tự động — repo hiện không có test suite
cho `giao-task`. Có thể **Blocked** nếu thiếu tài khoản test phù hợp — nếu
vậy, dừng lại và báo người dùng, không tự suy đoán kết quả.

## Requirements

- [ ] `migrate.ts` chạy từng statement ngoài transaction (xem code review sau
      Phase 1-4) — nếu deploy code sau này kéo theo 1 lần `db:migrate` khác,
      xác nhận lại `tasks_scope_xor` còn tồn tại: `SELECT conname FROM
      pg_constraint WHERE conrelid = 'tasks'::regclass AND conname =
      'tasks_scope_xor';` phải ra đúng 1 dòng — nếu mất, constraint không tự
      phục hồi (phải thêm lại tay).
- [ ] Test đủ 3 vai: (1) user ngoài 6 đội tự quản lý, (2) BGĐ xem/sửa hộ,
      (3) người không liên quan bị chặn (kể cả thành viên đội KD cố tạo task
      cá nhân cho chính mình).
- [ ] Test đúng phương pháp cho kiểm chứng bảo mật — Next.js Server Actions
      KHÔNG gọi được qua browser console (không phải hàm global), nên "chặn
      ở server" phải kiểm bằng Network tab, không phải console.
- [ ] Test không phá luồng 6 đội KD hiện có (hồi quy), kể cả trường hợp BGĐ
      đang là thành viên 1 đội.
- [ ] `npm run build` và `npm run lint` sạch.

## Implementation Steps

1. Chuẩn bị tài khoản test: 1 user có `department` khác `kinh-doanh` và
   `bgd`, KHÔNG có dòng trong `team_members` (vd `sx-theu`); 1 tài khoản BGĐ
   có sẵn (`minhnguyet` hoặc `duynguyen`); 1 user là thành viên 1 đội KD bất
   kỳ (dùng để test cả vai "người không liên quan" lẫn vai "chặn tự tạo task
   cá nhân khi đang có đội").
2. Đăng nhập tài khoản `sx-theu`:
   - Thấy mục nav "Giao Task" (trước thay đổi này thì không thấy — xác nhận
     Phase 4 mở nav đúng).
   - Vào `/dashboard/giao-task` → thấy thẳng Kanban cá nhân.
   - Thêm 1 task qua "+ Thêm thẻ" → xuất hiện đúng cột.
   - Click vào tiêu đề 1 task, sửa, Enter → tiêu đề đổi, refresh trang vẫn
     giữ đúng nội dung mới (xác nhận affordance sửa nội dung hoạt động).
   - Kéo-thả sang cột "Hoàn thành" → trạng thái đổi, refresh vẫn giữ.
   - Nhân bản task qua `<input type="date">` (không phải prompt) sang 1 ngày
     khác → xuất hiện task mới đúng ngày, task gốc không đổi. Thử bấm "Nhân
     bản" mà không chọn ngày → báo lỗi rõ ràng, không phải lỗi Postgres thô.
   - Xoá 1 task → biến mất đúng.
   - Chuyển ngày/tuần/tháng → chỉ thấy task trong khoảng đang xem.
3. Đăng nhập BGĐ:
   - Vào `/dashboard/giao-task` → mặc định "Tổng quan cả 6 đội", VÀ khối "Bộ
     phận khác" hiện SẴN ngay dưới bảng 6 đội trên cùng màn hình (không cần
     chọn dropdown nào — theo phản hồi trực tiếp của người dùng, xem Phase
     4). Khối này liệt kê sx-theu, sx-in, rnd, it, fulfillment (và
     kinh-doanh nếu có ai chưa vào đội KD).
   - Mở bộ phận `sx-theu` trong khối đó → thấy đúng user vừa test ở bước 2,
     đúng tiến độ tháng (khớp số task vừa tạo/hoàn thành ở bước 2).
   - Bấm vào user đó → nội dung trang chuyển hẳn sang Kanban của họ (khớp dữ
     liệu bước 2), sửa tiêu đề 1 task → thành công.
   - Bấm nút quay lại → về đúng màn Tổng quan (cả bảng 6 đội lẫn khối bộ
     phận đều hiện lại).
   - **Kiểm tra state không mất**: bấm "Xem chi tiết" 1 đội KD bất kỳ trong
     bảng, đổi sang xem Tuần, bấm quay lại "Tổng quan 6 đội" (nút mũi tên),
     bấm 1 người ở khối "Bộ phận khác", xem xong bấm quay lại, rồi bấm "Xem
     chi tiết" LẠI đúng đội KD đó → phải vẫn đúng board/viewMode (Tuần) đã
     chọn ban đầu, không bị reset.
   - Xác nhận KHÔNG còn dropdown chọn đội ở đầu trang (đã xoá theo phản hồi
     "Không cần Dropdown nữa") — chỉ còn "Xem chi tiết" trong bảng.
   - Kiểm tra `admin_audit_log` (qua trang admin hoặc query tay) có đúng 1
     dòng `personal_task.update` mới, `target_user_id` = user `sx-theu`.
4. Đăng nhập thành viên đội KD (không phải chủ, không phải BGĐ):
   - Không có đường UI nào dẫn tới Kanban cá nhân của người khác.
   - **Test bằng Network tab** (KHÔNG dùng console — Server Actions không
     gọi được qua console, xem Phase 3): mở tab Network, thực hiện 1 thao
     tác hợp lệ bất kỳ trên chính board của mình (vd đổi trạng thái 1 task
     đội), tìm request POST tới `/dashboard/giao-task` có header
     `Next-Action`, "Copy as fetch". Sửa payload: đổi tham số tương ứng
     `ownerUserId` (định dạng theo Server Actions — payload có thể mã hoá,
     nếu không đọc/sửa được trực tiếp thì thử nghiệm thay bằng gọi 1 action
     task cá nhân qua chính request đã copy, đổi id mục tiêu sang id của
     user `sx-theu` ở bước 2) → replay bằng `fetch(...)` trong console. Kỳ
     vọng: response lỗi (`requirePersonalTaskContext` chặn), và
     `SELECT` lại task của `sx-theu` trong DB xác nhận KHÔNG đổi.
   - Thử gọi `createPersonalTaskAction` cho CHÍNH `ownerUserId` của mình
     (thành viên đội KD tự tạo task cá nhân cho bản thân) qua cùng kỹ thuật
     replay → kỳ vọng lỗi (vì `findTeamIdByUserId` trả về khác null) — xác
     nhận lỗ hổng "ai cũng tạo task cá nhân cho mình" đã đóng.
5. Test guard thêm-vào-đội: dùng tài khoản quản lý 1 đội KD, thử thêm user
   `sx-theu` (đang có ít nhất 1 task cá nhân từ bước 2) vào đội → phải bị
   chặn với thông báo rõ ràng, KHÔNG thêm được.
6. Hồi quy 6 đội KD: đăng nhập 1 thành viên/quản lý đội KD bất kỳ, xác nhận
   bảng/kanban/thẻ/roster/nhân bản hàng loạt hoạt động y hệt trước
   khi có thay đổi.
7. `npm run build` và `npm run lint` — xác nhận sạch.

## Success Criteria

- [ ] Cả 7 bước trên PASS, không có bước nào phải suy đoán/bỏ qua.
- [ ] Nếu có bước BLOCKED: dừng lại, ghi rõ lý do, báo người dùng — không tự
      đoán kết quả.

## Risk Assessment

- **Rủi ro**: không có sẵn tài khoản test thuộc bộ phận ngoài kinh-doanh
  chưa vào team_members để test thật.
  **Phản ứng đã quyết trước**: báo người dùng xin 1 username thật thuộc diện
  này (hoặc xin phép tạo 1 tài khoản test tạm rồi xoá sau khi test xong) —
  không tự bịa dữ liệu người dùng thật.
- **Rủi ro**: bước 4 (Network tab replay) khó thực hiện chính xác nếu Next.js
  mã hoá payload Server Action theo cách không dễ chỉnh tay.
  **Phản ứng đã quyết trước**: nếu replay trực tiếp không khả thi, thay bằng
  kiểm tra ở mức code review có chủ đích — đọc lại từng action Phase 3 xác
  nhận `requirePersonalTaskContext`/`requireBgd` là dòng đầu tiên, và coi đây
  là bằng chứng thay thế nếu ghi rõ lý do không replay được trực tiếp; không
  đánh dấu PASS nếu không có 1 trong 2 hình thức bằng chứng này.
