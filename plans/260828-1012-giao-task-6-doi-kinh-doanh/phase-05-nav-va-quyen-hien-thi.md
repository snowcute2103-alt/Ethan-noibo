---
phase: 5
title: "Nav va quyen hien thi"
status: pending
priority: P1
effort: "1h"
dependencies: [4]
---

# Phase 5: Nav va quyen hien thi

## Overview

Thêm mục nav "Giao Task", chỉ hiện với người thuộc khối kinh doanh hoặc BGĐ
— tránh hiện mục nav trỏ tới trang trống/không liên quan cho các khối khác
(sx-theu, sx-in, rnd, it, fulfillment).

## Requirements

- [x] Mục nav mới không nằm tĩnh trong `NAV_ITEMS` (vì cần điều kiện theo
      session, và `lib/nav.ts` vốn không có session — đúng lý do
      `app/dashboard/layout.tsx` đang xử lý mục "Quản trị" riêng, làm tương
      tự cho mục này).
- [x] Điều kiện hiện: `session.department === 'kinh-doanh' || session.tier
      === 'full'`.

## Architecture

Sửa `app/dashboard/layout.tsx`, thêm 1 điều kiện cạnh điều kiện "Quản trị"
đã có sẵn (dòng tính `navItems`), không tạo cơ chế mới:

```ts
const navItems = [
  ...NAV_ITEMS,
  ...(session.department === 'kinh-doanh' || session.tier === 'full'
    ? [{ href: '/dashboard/giao-task', label: 'Giao Task' }]
    : []),
  ...(session.tier === 'full' ? [{ href: '/dashboard/admin', label: 'Quản trị' }] : []),
];
```

## Related Code Files

- Modify: `app/dashboard/layout.tsx`

## Implementation Steps

1. Đọc lại đoạn tính `navItems` hiện tại trong `app/dashboard/layout.tsx`
   (dòng ~48) để chèn đúng chỗ, giữ nguyên comment giải thích đã có cho mục
   "Quản trị".
2. Thêm điều kiện mục "Giao Task" như trên, giữ thứ tự nav hợp lý (đặt
   trước "Quản trị" để giống thứ tự độ ưu tiên công việc hàng ngày trước
   mục quản trị).
3. Xác nhận route `/dashboard/giao-task` (Phase 4) tự redirect/chặn đúng
   nếu người dùng gõ thẳng URL mà không đủ điều kiện xem (double-check ở
   tầng route, không chỉ ẩn nav — ẩn nav không phải kiểm soát truy cập).

## Success Criteria

- [x] Tài khoản `department = 'kinh-doanh'` thấy mục "Giao Task" trên nav.
- [x] Tài khoản BGĐ (`tier = 'full'`) thấy mục "Giao Task" dù không thuộc
      khối kinh doanh.
- [x] Tài khoản khối khác (ví dụ `sx-in`, `tier` khác `full`) không thấy
      mục này; gõ thẳng URL `/dashboard/giao-task` bị `page.tsx` tự
      `redirect('/dashboard')` ngay ở server (không thuộc đội nào và không
      phải BGĐ), không phải trang trắng hay lỗi 500. Thông báo "Bạn chưa
      thuộc đội nào." từ `getMyTeamBoardAction` (Phase 3) chỉ lộ ra nếu
      client tự gọi thẳng action đó (ví dụ qua DevTools), route chính vẫn
      chặn sớm hơn bằng redirect.

## Risk Assessment

- **Rủi ro**: chỉ ẩn nav mà quên chặn ở route/action khiến người ngoài khối
  kinh doanh vẫn xem được nếu biết URL.
  **Mitigation**: bước 3 bắt buộc kiểm tra riêng — đây là lớp phòng thủ
  thật (server action đã tự throw ở Phase 3 khi không thuộc đội nào và
  không phải BGĐ), ẩn nav chỉ là UX, không phải kiểm soát truy cập.
