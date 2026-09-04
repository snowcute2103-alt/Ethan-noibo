---
title: "Thiet ke lai tablet va mobile"
description: "Tai cau truc responsive cho toan bo portal noi bo, giu nguyen giao dien desktop tren 1024px."
status: complete
priority: P1
effort: "~12h"
tags: ["responsive", "tablet", "mobile", "frontend"]
created: 2026-09-04
---

# Thiết kế lại tablet và mobile

## Outcome đã chốt

Toàn bộ luồng từ đăng nhập đến dashboard, nội dung, báo cáo, giao task và quản
trị phải dùng tốt ở 375px, 768px và 1024px. Chữ, bảng, nút và hình ảnh được
thu gọn có hệ thống; nội dung tái cấu trúc theo chiều dọc hoặc cuộn trong đúng
vùng dữ liệu, không làm trang tràn ngang. Giao diện desktop trên 1024px
giữ nguyên.

## Constraints

- Chỉ thay đổi presentation và interaction responsive; không đổi nghiệp vụ,
  phân quyền, dữ liệu, URL hoặc Server Action.
- Không thay đổi kết quả render ở viewport trên 1024px.
- Giữ nguyên và tích hợp các thay đổi chưa commit của người dùng trong
  `app/globals.css`, `department-overview.tsx` và `task-board.tsx`.
- Input trên mobile giữ cỡ chữ tối thiểu 16px để tránh trình duyệt tự zoom;
  control chính giữ vùng chạm tối thiểu 44px dù phần nhìn được thu gọn.
- Bảng rộng chỉ được cuộn bên trong vùng bảng; header, dialog, drawer và nội
  dung trang không được rộng hơn viewport.

## Non-goals

- Không đổi nhận diện, bảng màu, font, nội dung hoặc bố cục desktop.
- Không thêm route, tính năng nghiệp vụ, dependency hay dữ liệu mẫu.
- Không thay thế các hiệu ứng desktop; chỉ giảm hoặc tắt chúng trên thiết bị
  nhỏ khi cần cho khả năng đọc và hiệu năng.

## Phases

| # | Phase | Status | Dependency |
|---|-------|--------|------------|
| 1 | Shell, header, đăng nhập và token responsive | Complete | - |
| 2 | Dashboard và các trang nội dung | Complete | Phase 1 |
| 3 | Giao task, báo cáo và quản trị | Complete | Phase 1 |
| 4 | Kiểm thử 375/768/1024/1440, typecheck, build và review | Complete | Phase 1-3 |

## Acceptance criteria

- Không có horizontal scroll ở cấp trang tại 375px, 768px và 1024px.
- Header có đủ điều hướng, hồ sơ, đổi theme và đăng xuất trên mobile.
- Login/quên mật khẩu vừa chiều cao động, không che form khi bàn phím mở.
- Heading, card, media và khoảng cách nhỏ hơn rõ rệt ở tablet/mobile nhưng
  không ảnh hưởng CSS desktop.
- Bảng, chart và Kanban dùng chiến lược responsive có chủ đích; không ép cả
  trang rộng theo `min-width` của dữ liệu.
- Dialog, popover và drawer luôn nằm trong viewport và có control dễ chạm.
- `npx tsc --noEmit`, kiểm tra responsive trọng tâm và production build sạch.
- So sánh ảnh ở 1440px xác nhận desktop không đổi ngoài những thay đổi sẵn có
  của người dùng trước lượt này.

## Rollback

Các thay đổi responsive được giới hạn trong media query dưới 1024px và class
responsive ở component. Có thể hoàn tác theo từng lớp shell, nội dung hoặc dữ
liệu mà không ảnh hưởng nghiệp vụ hay schema.

## Validation

- `npx tsc --noEmit`: đạt.
- `npx next build --webpack`: đạt, biên dịch và prerender đủ 25 route.
- Đo trực tiếp `documentElement.scrollWidth` tại 375, 768, 1024 và 1440px:
  không tràn ngang trên login, quên mật khẩu và 5 trang preview công khai.
- Kiểm tra trực quan gallery văn hóa và vé sinh nhật ở 375px: nội dung co đúng
  viewport, hình ảnh không bị cắt hoặc kéo trang rộng hơn màn hình.
- Viewport thấp 375x480: form đăng nhập bắt đầu từ đầu trang và cuộn dọc được,
  mô phỏng không gian bị thu hẹp khi bàn phím ảo mở.
- Resize trực tiếp 1440px xuống 768px: transform/pin của Story Scroll được dọn
  sạch, bốn chương Văn hóa trở về layout tĩnh đúng tablet.
- Vùng chạm đăng nhập đo được 44x44px; vé sinh nhật co đến 1024px và trở lại
  đúng 980px tại 1025/1440px.
- TV trong hero Dashboard nằm trọn vùng media tại 375px, 768px và 1024px;
  breakpoint desktop 1440px vẫn dùng bố cục gốc.
- Gallery Văn hóa hiển thị 6 ảnh trong lưới 3 cột (2 hàng) ở 375px/768px;
  bản motion desktop vẫn giữ nguyên và trang không tràn ngang.
- Biểu đồ Giao task ở 375px chỉ hiện mốc ngày 1/5/10/15/20/25/cuối tháng và
  ẩn nhãn tổng bằng 0; desktop 1440px vẫn hiện đủ toàn bộ nhãn ngày.
- `next build` mặc định bằng Turbopack không thể chạy trong host hiện tại vì
  bị chặn quyền tạo process/bind port; cùng source đã build thành công bằng
  Webpack.

## Review pipeline

- Edge-case scout: complete; đã sửa race khởi tạo hiệu ứng xoay ở tablet,
  badge Văn hóa lệch khỏi viewport và auth bị khóa cuộn dọc khi viewport thấp.
- Code-quality review: complete; sáu finding ban đầu và một finding re-review
  đều đã được xử lý.
- Fix accepted findings: complete; desktop badge/login/ticket được khôi phục,
  carousel không còn đổi kích thước sau hydration, control chính đạt 44px.
- Fresh verification: complete; `git diff --check`, TypeScript, production
  build và 28 phép đo viewport đều đạt.
