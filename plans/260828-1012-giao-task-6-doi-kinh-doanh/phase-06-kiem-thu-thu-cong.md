---
phase: 6
title: "Kiem thu thu cong"
status: pending
priority: P2
effort: "3h"
dependencies: [5]
---

# Phase 6: Kiem thu thu cong

## Overview

Không có test suite tự động trong repo hiện tại — kiểm thử bằng tài khoản
thật theo kịch bản cụ thể, đối chiếu Success Criteria ở `plan.md` và từng
phase trước, bao gồm cả các điểm mới của vòng brainstorm 2 (nhiều quản lý,
nhóm tự đặt tên theo đội, nhân bản, điều hướng ngày/tuần/tháng).

## Requirements

- [ ] Kiểm đủ vai trò: thành viên thường, quản lý (thử cả 2 quản lý của
      KD1), BGĐ, người ngoài khối kinh doanh.
- [ ] Kiểm đường vòng qua DevTools (đổi `teamId` trong request).
- [ ] `npm run lint` và `npm run build` sạch sau khi mọi phase xong.

## Architecture

Không có kiến trúc mới ở phase này — checklist thực thi tay.

## Related Code Files

- Không sửa code (trừ khi phát hiện bug cần vá — quay lại đúng phase liên
  quan để sửa, không vá tạm ở đây).

## Implementation Steps

1. Đăng nhập `thanhtuyen` (KD1): xác nhận thấy huy hiệu "Quản lý", thêm 1
   nhóm mới (ví dụ "Test Category") với 2 cột hiển thị, thêm 1 task vào
   nhóm đó, xác nhận tab mới chỉ hiện đúng 2 cột đã chọn + 4 cột core.
2. Đăng nhập `myhuyen97` (KD1, quản lý thứ 2): xác nhận cũng thấy huy hiệu
   "Quản lý", cũng sửa/xoá được nhóm "Test Category" của Tuyền vừa tạo,
   cũng thêm/gỡ được thành viên — xác nhận quyền quản lý là ngang nhau
   giữa 2 người.
3. Đăng nhập 1 thành viên thường của KD1 (không phải quản lý): xác nhận
   thêm/sửa/xoá task của người khác vẫn được (mở hoàn toàn), nhân bản 1
   task sang ngày khác được, nhưng KHÔNG thấy nút "Nhân bản hàng loạt" và
   không thấy nút quản lý nhóm/thành viên.
4. Từ 1 trong 2 quản lý KD1: nhân bản hàng loạt 1 task theo "hàng tuần x 4
   lần", xác nhận tạo đúng 4 task mới cách nhau 7 ngày, `status` đều "Chưa
   bắt đầu", sửa 1 trong 4 task đó không ảnh hưởng 3 task còn lại.
5. Test điều hướng ngày: mở trang xác nhận mặc định thấy đúng task có
   ngày = hôm nay; bấm lùi 1 ngày, tiến 1 ngày, chuyển sang Tuần rồi Tháng,
   xác nhận mỗi lần đều ra đúng tập task tương ứng.
6. Đăng nhập tài khoản BGĐ (`tier = 'full'`): xem được view gộp 6 đội,
   chọn qua từng đội xem đúng dữ liệu, xác nhận KD1 hiện đúng 2 quản lý
   trong roster.
7. Đăng nhập 1 tài khoản khối khác (ví dụ `sx-in`, không phải
   `tier=full`): xác nhận không thấy nav "Giao Task"; gõ thẳng URL, nhận
   thông báo lỗi rõ ràng, không phải trang trắng/500.
8. Mở DevTools, thử gọi `updateTaskAction`/`deleteTaskAction`/
   `bulkDuplicateTasksAction` với `taskId` thuộc đội khác trong khi đăng
   nhập session KD1 — xác nhận bị từ chối.
9. Mở 2 trình duyệt (hoặc 1 cửa sổ ẩn danh) đăng nhập 2 tài khoản cùng
   đội, thêm task ở trình duyệt A, xác nhận trình duyệt B thấy task mới
   sau tối đa 1 chu kỳ polling mà không cần tải lại trang.
10. Kiểm tra responsive: khung hẹp (mobile width), bảng cuộn ngang trong
    container riêng, `body` không cuộn ngang.
11. Chạy `npm run lint` và `npm run build`, sửa mọi lỗi/warning phát sinh
    từ code mới trước khi coi phase hoàn tất.

## Success Criteria

- [ ] Toàn bộ 10 bước kiểm thử tay ở trên pass, không bước nào bị bỏ qua.
- [ ] `npm run lint` sạch.
- [ ] `npm run build` sạch.
- [ ] Đối chiếu lại toàn bộ Success Criteria ở `plan.md` — tất cả đã tích.

## Risk Assessment

- **Rủi ro**: không có tài khoản test sẵn có ở tier member thường trong
  KD1 với mật khẩu đã biết — cần tạo 1 tài khoản test tạm qua trang admin
  rồi xoá/deactivate ngay sau khi test xong, không để lại tài khoản rác.
  **Mitigation**: coi việc dọn dẹp tài khoản test là điều kiện hoàn tất,
  không phải việc tuỳ chọn.
- **Rủi ro**: dữ liệu test (nhóm "Test Category", task test, task nhân
  bản hàng loạt) còn sót lại trong bảng thật sau khi kiểm thử.
  **Mitigation**: xoá toàn bộ dữ liệu test tạo ra ở bước 1-4 ngay sau khi
  xác nhận pass, trước khi coi phase 6 hoàn tất.
