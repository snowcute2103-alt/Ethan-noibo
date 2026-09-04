# Shadcn UI foundation

## Outcome

Đưa một lớp component shadcn/ui dùng chung vào cổng nội bộ và áp dụng trực tiếp vào các màn quản trị có mật độ tương tác cao, trong khi giữ nguyên nhận diện Ethan Ecom và toàn bộ logic nghiệp vụ hiện có.

## Constraints

- Next.js 16 App Router, React 18 và Tailwind CSS 3.4 hiện tại.
- Giữ theme `data-theme`, palette navy/blue/gold, font Fahkwang/Mulish và quy tắc bề mặt sharp/soft đã có.
- Bảo toàn các thay đổi chưa commit trong worktree.
- Không đổi schema, server action, phân quyền hoặc hợp đồng dữ liệu.

## Non-goals

- Không cài toàn bộ catalog shadcn chỉ để tăng số lượng component.
- Không thay thiết kế các trang văn hoá, khen thưởng hoặc các trải nghiệm motion đặc thù.
- Không chuyển Tailwind 3 sang Tailwind 4 trong lần này.

## Delivery

- [x] Cấu hình shadcn và semantic theme tokens tương thích light/dark.
- [x] Thêm primitives thật sự được dùng: button, badge, card, form controls, checkbox, table, alert, skeleton, empty state, avatar, popover, dropdown menu, dialog và tooltip.
- [x] Áp dụng vào quản trị tài khoản, quyền tài liệu, menu người dùng và loading state Giao Task.
- [x] Giữ focus ring, keyboard navigation, trạng thái disabled/loading và touch target tối thiểu 44px.
- [x] Rà soát responsive ở 375px, 768px, 1024px và desktop; cuộn ngang chỉ nằm trong vùng bảng dữ liệu chủ ý.

## Validation

- TypeScript typecheck.
- Test hiện có liên quan dashboard và server action.
- Next.js production build.
- Rà soát code light/dark, keyboard focus, dialog/menu focus trap và responsive; các luồng quản trị cần phiên đăng nhập nên kiểm tra trực quan cuối cùng thực hiện trong môi trường có dữ liệu thật.

## Rollback

Các component mới độc lập trong `components/ui/`; có thể hoàn nguyên từng màn về HTML/Tailwind cũ mà không ảnh hưởng dữ liệu hoặc server actions.
