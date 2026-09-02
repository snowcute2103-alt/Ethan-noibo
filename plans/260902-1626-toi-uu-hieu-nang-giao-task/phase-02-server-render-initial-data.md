# Phase 2: Server-render dữ liệu đầu tiên

## Goal

Loại bỏ màn rỗng và các Server Action lặp ngay sau hydration; mọi dữ liệu first
screen được tải song song trong server loader.

## Files

- `app/dashboard/giao-task/page.tsx`
- `app/dashboard/giao-task/[code]/page.tsx`
- `app/dashboard/giao-task/[code]/personal-board-route.tsx`
- `app/dashboard/giao-task/team-board-data.ts`
- `app/dashboard/giao-task/actions.ts`
- `components/dashboard/task-board.tsx`
- `components/dashboard/personal-task-board.tsx`
- `components/dashboard/department-overview.tsx`
- Có thể thêm `components/dashboard/task-overview.tsx` nếu tách overview giúp
  không ship toàn bộ board editor mà không đổi UI.

## Steps

1. Thêm loader personal core: rollover một lần khi mở route, sau đó tải tasks,
   month progress và month-day counts song song.
2. Truyền initial personal data vào `PersonalTaskBoard`; dùng ref/key để effect
   không fetch lại đúng owner/range/month vừa hydrate.
3. Thêm month category counts vào team loader và initial `TaskBoard` state.
4. Thêm department groups vào overview loader cùng teams/month progress; đổi
   `DepartmentOverview` thành component nhận data, không tự gọi action lúc mount.
5. Khi đổi tháng overview, một action trả cả teams progress và department groups.
6. Bỏ `loadTeamsOverview` khỏi BGĐ team-detail route và chặn mọi refresh/poll
   overview khi `activeTeamId != null`.
7. Với BGĐ, không gọi `findTeamIdByUserId` ở dynamic route nếu kết quả không dùng.
8. Nếu an toàn, tách overview khỏi client monolith `TaskBoard` để giảm initial JS.

## Validation

- View-source/RSC payload có task/lịch initial; Network không có core action lặp
  ngay sau hydration.
- Đếm query đạt mục tiêu trong plan index trên dữ liệu hiện tại.
- Chính chủ, thành viên đội, quản lý và BGĐ đi đúng branch; URL bookmark/back giữ.
- Thay tháng nhanh không cho response cũ ghi đè response mới.

## Risks and rollback

- Server loader làm TTFB tăng: các read phải chạy song song sau guard bắt buộc;
  rollback riêng calendar/department về lazy nếu đo thực tế xấu hơn click-to-content.
- Rollover là write: chỉ chạy sau authorization và đúng một lần lúc mở route;
  poll không lặp write vô ích.
