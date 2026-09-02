# Phase 5: Kiểm chứng, review và rollback

## Goal

Chứng minh cải thiện bằng cùng dataset và chứng minh không regression quyền,
nghiệp vụ, public contract hoặc build.

## Steps

1. Chạy test hẹp DAL/action/component cho từng phase; sau đó `npx tsc --noEmit`,
   lint command hợp lệ của Next.js 16, `npm run build` và test điều hướng/mutation.
2. Chạy EXPLAIN read-only cho task list, calendar, department, rollover predicate
   và set-based SQL bằng transaction rollback/test fixture an toàn.
3. Đo cùng dataset 1.522 task/98 user: query count theo route/poll/mutation,
   duplicate SQL fingerprint, loader duration, TTFB, click-to-loading/content,
   initial JS/lazy chunk và hidden-tab polling.
4. Test đủ vai: member, manager, BGĐ, outside-team owner và unauthorized user.
5. Review blast radius: mọi caller của DTO/action, dirty diff ban đầu, URL, audit,
   history, Blob deletion và concurrent optimistic update.
6. Chỉ cập nhật evergreen docs nếu command/config/public workflow thay đổi.

## Required gates

- 100% test đã chọn pass; không giấu lỗi lint/type/build.
- Acceptance criteria ở `plan.md` có bằng chứng trước/sau.
- Code review không còn finding blocker/high về auth, data loss hoặc regression.
- Git diff không chứa secret, file probe tạm hoặc thay đổi ngoài scope.

## Rollback readiness

- Không có schema migration dự kiến.
- Nếu fresh EXPLAIN đề xuất index, dừng và tách thành migration được phê duyệt
  riêng, kèm `DROP INDEX` rollback và đo write overhead.
- Nếu phase nào fail parity/performance, revert riêng phase đó; các phase còn lại
  chỉ được giữ khi contract/test vẫn độc lập và sạch.
