---
title: Sửa popup bị cắt trong bảng Giao Task
date: 2026-09-03
summary: Đưa các combobox trong bảng ra portal cố định theo viewport để không bị vùng overflow che
---

# Sửa popup bị cắt trong bảng Giao Task

## What happened

Các combobox Thành viên, Tên Acc và Sản phẩm được render bằng position absolute bên trong bảng có overflow-x-auto/overflow-hidden. Ở các dòng gần đáy, popup bị biên bảng cắt nên người dùng không thể thấy hoặc chọn đầy đủ danh sách.

## Decision

Dùng một helper tính vị trí theo viewport và render popup qua createPortal vào document.body. Popup dùng position fixed, tự mở lên trên khi thiếu chỗ phía dưới, giới hạn chiều cao theo viewport và đóng khi bấm ngoài, nhấn Escape, resize hoặc cuộn ngoài popup. Giữ nguyên vùng cuộn ngang và luồng cập nhật dữ liệu của bảng.

## Verification

- 5/5 bài kiểm tra Node đạt.
- TypeScript tsc --noEmit đạt.
- git diff --check đạt.
- next build --webpack đạt.
- Code review không phát hiện lỗi chặn; kiểm tra trực tiếp màn hình có đăng nhập chưa thực hiện được trong phiên này.

## Next steps

- Xác minh trực quan trên tài khoản thật sau khi deploy.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
