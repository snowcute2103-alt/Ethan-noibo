---
title: Tự phục hồi Server Action lệch bản
date: 2026-09-03
summary: Sửa overlay E394 khi polling nền dùng Server Action cũ sau HMR hoặc deploy.
---

# Tự phục hồi Server Action lệch bản

## Hiện tượng
Next.js dev overlay báo `An unexpected response was received from the server.` sau khi tab dashboard cũ gặp một lần biên dịch hoặc deploy mới.

## Nguyên nhân
Các refresh nền của bảng đội, tổng quan và bảng cá nhân gọi Server Action theo chu kỳ/focus. Khi action reference của tab lệch với build hiện tại, Next.js trả lỗi giao thức E394/E715. Nhánh `silent` đã bắt lỗi nhưng gọi `console.error`, khiến dev overlay hiện màn đỏ; polling tiếp tục dùng cùng reference cũ nên không tự hồi phục.

## Thay đổi
Thêm `lib/server-action-recovery.ts` để nhận diện lỗi lệch Server Action, reload đúng một lần và dùng sessionStorage chống vòng lặp. Ba refresh nền dùng helper này; lỗi nền khác chỉ ghi warning. Marker được xóa sau khi một Server Action trả response hợp lệ.

## Kiểm chứng
Test hồi quy chuyển từ MODULE_NOT_FOUND sang 3/3 đạt. TypeScript và production build Webpack đạt. Toàn bộ test lib đạt 11/12; lỗi còn lại là test layout cũ kỳ vọng cột Ngày 160px trong khi workspace hiện dùng 90px, không thuộc phạm vi sửa. `npm run lint` vẫn không chạy vì script cũ dùng `next lint`, đã bị Next.js 16 loại bỏ.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
