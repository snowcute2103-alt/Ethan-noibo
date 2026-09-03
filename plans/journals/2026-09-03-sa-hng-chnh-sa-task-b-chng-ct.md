---
title: Sửa hàng chỉnh sửa task bị chồng cột
date: 2026-09-03
summary: Cho control co theo cột table-fixed và tăng bề rộng cột ngày/thao tác
---

# Sửa hàng chỉnh sửa task bị chồng cột

## What happened

Khi một task chuyển sang TaskRowEditor, các input và picker bị ép min-width 100px trong bảng table-layout fixed. Phần nội dung của cột Ngày và SL VID nhỏ hơn 100px sau padding, nên control chồng sang cột Thành viên và Sản phẩm. Cột thao tác vẫn rộng 44px dù hàng edit hiển thị Xong hoặc Lưu/Huỷ.

## Decision

Cho input và picker dùng min-width 0, max-width 100%, đặt overflow-hidden trên mọi ô editor, tăng cột Ngày lên 160px để đủ ngày và icon lịch, tăng cột thao tác lên 100px. Giữ nguyên cấu trúc bảng, luồng autosave và popup portal.

## Verification

- Regression test đỏ trước sửa và xanh sau sửa.
- 6/6 Node tests đạt.
- TypeScript đạt khi chạy tuần tự sau build.
- Next production build bằng Webpack đạt.
- git diff --check đạt.
- Code review độc lập không có finding chặn.
- Kiểm tra UI có đăng nhập chưa thực hiện được vì Chrome bridge không khả dụng.

## Next steps

- Xác minh trực quan bằng tài khoản thật sau khi deploy.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
