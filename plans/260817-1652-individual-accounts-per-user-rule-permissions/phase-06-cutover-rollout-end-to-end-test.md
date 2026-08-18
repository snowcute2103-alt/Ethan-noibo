---
phase: 6
title: "Phase 6: Cutover, rollout, end-to-end test"
status: todo
priority: P1
effort: "1-1.5d"
dependencies: [2, 3, 4, 5]
---

# Phase 6: Cutover, rollout, end-to-end test

## Overview

Chuyển hẳn từ hệ thống cũ (tài khoản chung theo khối) sang hệ thống mới. Xoá code/env vars cũ, **thu hồi mọi session cũ**, test toàn luồng, cập nhật docs.

**[RED-TEAM FIX] Backfill quyền tài liệu rule đã chuyển sang Phase 4** (chạy trước deploy, không còn phụ thuộc vòng lặp "cần trang admin nhưng trang admin chỉ có sau deploy") — phase này không còn bước đó, chỉ verify lại kết quả.

## Requirements

- Functional:
  - [ ] Xoá `AUTH_PASSWORD_*` khỏi Vercel Production env — chỉ sau khi xác nhận toàn bộ 97 tài khoản cá nhân hoạt động (xem thứ tự bắt buộc ở Implementation Steps).
  - [ ] **[RED-TEAM FIX] Rotate `SESSION_SECRET` trên Vercel Production** — đây là bước duy nhất thu hồi được TOÀN BỘ session JWT đang tồn tại (kể cả session của tài khoản khối cũ đang mở, và session cũ không có `userId`/`sessionVersion` từ trước khi deploy Phase 3). Không có bước này, người đang đăng nhập bằng tài khoản khối cũ lúc cutover vẫn giữ quyền truy cập tới hết TTL cũ (12h) dù `AUTH_PASSWORD_*` đã bị xoá.
  - [ ] Verify backfill quyền tài liệu (từ Phase 4) đã đúng — không cấp quyền lại lần nữa ở đây, chỉ kiểm tra.
  - [ ] README.md cập nhật: bỏ bảng tài khoản mẫu theo khối, thêm mô tả luồng tài khoản cá nhân + trỏ vào trang admin, **và [RED-TEAM FIX] sửa lại đúng mục bảo mật/PII** (xem Related Code Files).
- Non-functional:
  - [ ] Backup dữ liệu trước khi xoá gì — `pg_dump` DB Production trước khi thực hiện bất kỳ thao tác xoá nào.
  - [ ] **[RED-TEAM FIX] File backup không lưu dạng plaintext không mã hoá trên máy** — nén + đặt password (vd `zip --encrypt` hoặc `gpg -c`) trước khi lưu ra ngoài git, vì file chứa toàn bộ `password_hash`, PII (tên, SĐT, email cá nhân) và lịch sử `admin_audit_log` của 97 người thật.

## Architecture

Không có thay đổi kiến trúc mới ở phase này — đây là phase vận hành/rollout.

## Related Code Files

- Modify: `README.md` — bỏ mục "Vai trò đăng nhập" (bảng tài khoản theo khối), thay bằng mô tả ngắn: tài khoản cá nhân, BGĐ quản lý qua `/dashboard/admin`. **[RED-TEAM FIX] Đồng thời sửa lại mục bảo mật/vận hành (hiện ghi "Không có database — không lưu thông tin cá nhân nhân viên (không PII)")** — dòng này SAI sau cutover: hệ thống giờ lưu họ tên, email cá nhân, SĐT, mã nhân viên, lịch sử đăng nhập (IP) của 97 người trong Postgres. Viết lại đúng: liệt kê cụ thể PII nào được lưu, lưu ở đâu (Vercel Postgres Production), ai xem được (chỉ BGĐ qua trang admin, không public), không có cơ chế tự động xoá khi nghỉ việc (chỉ deactivate) — nêu rõ để BGĐ biết trách nhiệm vận hành, không cam kết "không có PII" nữa.
- Delete: không còn file code nào tham chiếu `AUTH_PASSWORD_*` sau Phase 3 — chỉ cần xoá biến trên Vercel dashboard, không phải xoá file.
- Modify: `.env.example` — xác nhận sạch.

## Implementation Steps

1. `pg_dump` DB Production → nén + mã hoá (xem Non-functional) → lưu file backup local (KHÔNG commit vào git).
2. **[RED-TEAM FIX] Verify (không phải chạy) backfill quyền tài liệu từ Phase 4 đã đúng**: đếm `rule_permissions` cho `sop-all-print-product` = số user `department IN ('sx-in','kinh-doanh')` hiện tại.
3. Deploy toàn bộ Phase 1-5 lên Production.
4. Test đăng nhập thật với vài tài khoản thật đại diện mỗi tier: 1 staff, 1 leader, 1 `full` (BGĐ) — **[RED-TEAM FIX] chọn đại diện tier `full` KHÔNG PHẢI là CEO** (dùng CPO hoặc Founder) để tránh trường hợp mapping tier bị nhầm (Phase 2 đã ghi rõ rủi ro `Leader`-title trong nhóm C-level) làm sai lệch kết quả test.
5. Test luồng admin: BGĐ vào `/dashboard/admin`, xem đủ 97 người, thử sửa 1 người, thử gán quyền 1 tài liệu, thử "Mở khoá đăng nhập" (Phase 5).
6. **[RED-TEAM FIX] Test break-glass**: trước khi xoá bất kỳ thứ gì, xác nhận có ít nhất 2 tài khoản `tier='full'` hoạt động bình thường (không phải chỉ 1 — phòng trường hợp tài khoản đó gặp sự cố ngay sau cutover).
7. **[RED-TEAM FIX] Rotate `SESSION_SECRET`** trên Vercel Production (`vercel env rm SESSION_SECRET production` rồi set giá trị mới) — thao tác này tự động logout toàn bộ session đang sống (kể cả khối cũ lẫn mới, mọi người phải đăng nhập lại 1 lần duy nhất). Thông báo trước cho 97 người biết sẽ phải đăng nhập lại đúng 1 lần vào thời điểm này.
8. Test lại đăng nhập bằng tài khoản cá nhân SAU bước rotate — xác nhận vẫn vào được bình thường (JWT ký bằng secret mới).
9. Xoá `AUTH_PASSWORD_*` khỏi Vercel Production env.
10. Cập nhật `README.md` (cả 2 phần: tài khoản + bảo mật/PII).
11. Thông báo cho toàn bộ 97 người: tài khoản/mật khẩu đã có trong email (Phase 2) — nhắc kiểm tra hộp thư/spam, và sẽ cần đăng nhập lại 1 lần do bước rotate secret ở trên.

## Success Criteria

- [ ] Backup DB tồn tại, đã mã hoá, lưu ngoài git.
- [ ] Backfill quyền tài liệu đã verify đúng TRƯỚC khi thực hiện bước rotate/xoá env.
- [ ] Không còn tài khoản khối cũ nào đăng nhập được.
- [ ] **[RED-TEAM FIX]** Sau bước rotate `SESSION_SECRET`, mọi cookie/token ký trước đó (cả khối cũ lẫn cá nhân mới test ở bước 4) đều bị từ chối — verify bằng cách thử dùng lại cookie cũ đã lưu trước bước 7.
- [ ] Tài khoản cá nhân đăng nhập đúng SAU bước rotate, thấy đúng nội dung theo department/tier.
- [ ] Tài liệu `sop-all-print-product` không bị "biến mất" khỏi ai đang cần dùng nó hằng ngày.
- [ ] README.md phản ánh đúng hệ thống mới, bao gồm cả mục bảo mật/PII đã sửa đúng (không còn dòng "không có PII").
- [ ] `npm run build` + `npx tsc --noEmit` pass trên commit cuối cùng — **[RED-TEAM FIX] thay `npm run lint` bằng `npx tsc --noEmit`** vì `next lint` không còn hoạt động trên Next.js 16 (đã verify: `npx next lint` báo lỗi "Invalid project directory provided, no such directory: .../lint" — script `next lint` bị loại bỏ khỏi CLI ở phiên bản này).

## Risk Assessment

- **Rủi ro cao nhất của cả plan:** gián đoạn thật cho người dùng thật nếu cutover không cẩn thận thứ tự. *Giảm thiểu:* thứ tự bước bắt buộc theo Implementation Steps — không xoá env cũ (bước 9) cho tới khi rotate secret (bước 7) + test lại (bước 8) pass.
- **[RED-TEAM FIX] Rủi ro đã đóng:** bản trước dựa vào TTL 12h tự hết hạn để coi như "session cũ chết" — không đúng vì có thể có người vừa đăng nhập ngay trước lúc cutover. Bước rotate `SESSION_SECRET` (bước 7) giải quyết dứt điểm, không phụ thuộc thời gian chờ.
- **Rủi ro:** BGĐ quên cấp quyền tài liệu cho người cần — đã chuyển sang giải quyết ở Phase 4 (backfill trước deploy), phase này chỉ verify lại.
