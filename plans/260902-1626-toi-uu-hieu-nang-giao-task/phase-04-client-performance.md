# Phase 4: Polling, navigation và lazy loading

## Goal

Giảm request nền và initial JavaScript, đồng thời cho phản hồi điều hướng tức thì
mà không thay đổi giao diện hoặc URL.

## Files

- `app/dashboard/giao-task/loading.tsx`
- `components/dashboard/task-board.tsx`
- `components/dashboard/personal-task-board.tsx`
- `components/dashboard/personal-task-detail-drawer.tsx`
- `components/dashboard/department-overview.tsx`
- Component mới nhỏ cho intent-prefetch hoặc drawer/modal chỉ khi tạo boundary thật.

## Steps

1. Poll chỉ chạy khi `document.visibilityState === 'visible'`; lắng nghe
   `visibilitychange`/focus và coalesce thành đúng một refresh khi quay lại.
2. Giữ interval 150 giây ở tab visible; thêm request generation guard cho
   personal/overview/calendar để response cũ không ghi đè.
3. Dùng `Link` cho destination thật. Với danh sách nhân sự dài, prefetch khi
   hover/focus/touch intent thay vì tải mọi route khi vào viewport.
4. Thêm `loading.tsx` nhỏ, cùng visual language hiện tại, để navigation động có
   phản hồi ngay và shared dashboard layout vẫn tương tác được.
5. Dynamic import personal detail drawer và các modal/drawer chỉ mở theo intent.
   Tách component nội bộ khỏi file monolith chỉ khi giảm chunk thật và không tạo
   vòng import; không dùng `ssr: false` nếu component không browser-only.
6. So sánh build output/chunk trước–sau; giữ split chỉ khi initial route giảm.

## Validation

- Fake timers/Playwright: tab ẩn 0 poll; quay lại đúng 1 refresh; tab visible giữ cadence.
- Keyboard/mouse/touch navigation đều hoạt động; URL/back/forward không đổi.
- Prefetch chỉ phát sinh theo intent và direct navigation vẫn thành công.
- Loading fallback không layout shift lớn; drawer/modal đầu tiên mở đúng.
- Initial JS giảm hoặc không tăng; không có hydration warning.

## Risks and rollback

- Listener trùng gây double refresh: dùng một effect cleanup rõ ràng và guard.
- Dynamic import có thể làm lần mở đầu chậm: preload module trên hover/focus nút mở;
  rollback riêng component không đem lại bundle benefit.
