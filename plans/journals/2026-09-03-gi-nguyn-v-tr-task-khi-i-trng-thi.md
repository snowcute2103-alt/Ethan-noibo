---
title: Giữ nguyên vị trí task khi đổi trạng thái
date: 2026-09-03
summary: Sửa reconcile Map làm task nhảy vị trí sau khi tick Done.
---

# Giữ nguyên vị trí task khi đổi trạng thái

## What happened
Tick hoặc bỏ tick trạng thái trong Giao Task cập nhật lạc quan đúng chỗ, nhưng response server đi qua reconcileBoardTasks đã xóa rồi chèn lại cùng ID trong Map. Thao tác đó đổi insertion order và làm hàng nhảy xuống; lần polling sau lại đưa hàng về thứ tự task_date, id từ database.

## Decision
Khi task trả về có cùng ID, còn trong range và đã tồn tại trong Map, thay value trực tiếp tại key hiện hữu. Chỉ xóa/chèn khi task bị xóa, rời range hoặc đổi từ ID tạm sang ID thật.

## Verification
- Test hồi quy chuyển từ fail sang pass và kiểm tra thêm nhánh xóa, rời range, thay ID tạm.
- TypeScript pass.
- Next.js production build bằng Webpack pass; Turbopack bị môi trường chặn bind cổng.
- Một test layout cũ vẫn lệch kỳ vọng 160px so với code hiện tại 90px; npm run lint dùng next lint đã bị Next.js 16 loại bỏ.

## Next steps
Không có bước sản phẩm còn lại cho lỗi này. Hai gate cũ nên được xử lý ở task bảo trì riêng.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
