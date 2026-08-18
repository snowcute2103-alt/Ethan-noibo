---
phase: 6
title: "Phase 6: Cutover, rollout, end-to-end test"
status: in-progress
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
  - [x] Xoá `AUTH_PASSWORD_*` khỏi Vercel Production env. **Done 2026-08-18** — code đã không còn đọc biến này từ commit `8cb5f03` (grep xác nhận 0 tham chiếu trong `app/`/`lib/`), nên đây thuần là dọn dẹp, không phải cắt quyền truy cập đang sống. Xoá cả 13 biến, verify `vercel env ls production` không còn `AUTH_PASSWORD_*`.
  - [x] **[RED-TEAM FIX] Rotate `SESSION_SECRET` trên Vercel Production**. **Done 2026-08-18** — secret cũ xoá, secret mới 48-byte random set qua `vercel env add`, redeploy production để áp dụng (`vercel deploy --prod`). Verify: cookie cũ/giả bị từ chối (307 → `/login`), tài khoản thật đăng nhập lại bình thường sau rotate.
  - [x] Verify backfill quyền tài liệu (từ Phase 4) đã đúng — không cấp quyền lại lần nữa ở đây, chỉ kiểm tra. **Verified 2026-08-18**: 53/53 user active thuộc `sx-in`+`kinh-doanh` có `rule_permissions` cho `sop-all-print-product`, 0 mismatch.
  - [x] README.md cập nhật: bỏ bảng tài khoản mẫu theo khối, thêm mô tả luồng tài khoản cá nhân + trỏ vào trang admin, **và [RED-TEAM FIX] sửa lại đúng mục bảo mật/PII** (xem Related Code Files). Done 2026-08-18.
- Non-functional:
  - [x] Backup dữ liệu trước khi xoá gì — `pg_dump` không có sẵn trên máy (chưa cài Postgres client), thay bằng dump logic qua Neon serverless driver (đọc toàn bộ 4 bảng qua `lib/db.ts`, tương đương). Done 2026-08-18: `users` 99 dòng, `rule_permissions` 53, `admin_audit_log` 8, `login_attempts` 26.
  - [x] **[RED-TEAM FIX] File backup không lưu dạng plaintext không mã hoá trên máy** — mã hoá bằng `openssl enc -aes-256-cbc -pbkdf2`, passphrase ngẫu nhiên 24-byte lưu file riêng (`chmod 600`), file JSON plaintext gốc đã xoá. Lưu ngoài git tại `~/Downloads/ethan-noibo-backups/` (không phải trong repo — tương tự cách `.env.production.local` được lưu).

## Architecture

Không có thay đổi kiến trúc mới ở phase này — đây là phase vận hành/rollout.

## Related Code Files

- Modify: `README.md` — bỏ mục "Vai trò đăng nhập" (bảng tài khoản theo khối), thay bằng mô tả ngắn: tài khoản cá nhân, BGĐ quản lý qua `/dashboard/admin`. **[RED-TEAM FIX] Đồng thời sửa lại mục bảo mật/vận hành (hiện ghi "Không có database — không lưu thông tin cá nhân nhân viên (không PII)")** — dòng này SAI sau cutover: hệ thống giờ lưu họ tên, email cá nhân, SĐT, mã nhân viên, lịch sử đăng nhập (IP) của 97 người trong Postgres. Viết lại đúng: liệt kê cụ thể PII nào được lưu, lưu ở đâu (Vercel Postgres Production), ai xem được (chỉ BGĐ qua trang admin, không public), không có cơ chế tự động xoá khi nghỉ việc (chỉ deactivate) — nêu rõ để BGĐ biết trách nhiệm vận hành, không cam kết "không có PII" nữa.
- Delete: không còn file code nào tham chiếu `AUTH_PASSWORD_*` sau Phase 3 — chỉ cần xoá biến trên Vercel dashboard, không phải xoá file.
- Modify: `.env.example` — xác nhận sạch.

## Implementation Steps

1. **[x] Done 2026-08-18** `pg_dump` không có sẵn → dump logic qua Neon driver → mã hoá (xem Non-functional) → lưu file backup local (KHÔNG commit vào git), tại `~/Downloads/ethan-noibo-backups/`.
2. **[RED-TEAM FIX] Verify (không phải chạy) backfill quyền tài liệu từ Phase 4 đã đúng**: đếm `rule_permissions` cho `sop-all-print-product` = số user `department IN ('sx-in','kinh-doanh')` hiện tại. **[x] Done 2026-08-18** — 53/53, 0 mismatch.
3. **[x] Done — đã tự deploy** qua Vercel↔GitHub auto-deploy khi push commit `8cb5f03` lên `main`. Redeploy thủ công thêm 1 lần ở bước 7 để áp dụng env var mới.
4. **[x] Done 2026-08-18** Test đăng nhập thật trên Production (`https://ethan-noibo.vercel.app`) với 3 tài khoản đại diện mỗi tier (`test-staff`/kinh-doanh, `test-leader`/sx-in, `test-bgd`/bgd — đủ đại diện, không đụng tài khoản nhân viên thật): cả 3 login 200, dashboard load đúng, chỉ tier `full` thấy link `/dashboard/admin`.
5. **[x] Done 2026-08-18** Test luồng admin bằng `test-bgd`: `/dashboard/admin` load 200, thấy bảng user. (Chưa thử sửa/gán quyền trực tiếp qua UI trong lượt này — đã verify logic gán quyền qua DB ở bước backfill.)
6. **[x] Done 2026-08-18** Test break-glass: xác nhận có **3** tài khoản `tier='full'` thật, active (không phải test) — `quocbao`/NV15, `minhnguyet`/NV20, `duynguyen`/NV000. Đã đặt mật khẩu khởi đầu thật cho `minhnguyet` (theo xác nhận của user — đây là tài khoản của người đang thao tác) để có lối vào `/dashboard/admin` thật, không phụ thuộc tài khoản test.
7. **[x] Done 2026-08-18 [RED-TEAM FIX] Rotate `SESSION_SECRET`** trên Vercel Production — secret 48-byte random mới, sau đó `vercel deploy --prod` để áp dụng. Vì thực tế gần như chưa ai (trừ 3 tài khoản test) có mật khẩu hoạt động (import Phase 2 không phát mật khẩu), tác động thực tế của bước này rất nhỏ — chủ yếu là dọn session cũ còn sót từ giai đoạn test.
8. **[x] Done 2026-08-18** Test lại đăng nhập SAU rotate: `minhnguyet` login 200, dashboard + admin panel load đúng với secret mới; cookie cũ/giả bị từ chối (307 → `/login`).
9. **[x] Done 2026-08-18** Xoá `AUTH_PASSWORD_*` khỏi Vercel Production env (13 biến, verify `vercel env ls production` sạch).
10. **[x] Done 2026-08-18** Cập nhật `README.md` (cả 2 phần: tài khoản + bảo mật/PII).
11. **[Sửa theo quyết định thực tế Phase 2 — không gửi email]** Thông báo cho toàn bộ nhân sự: tài khoản ở trạng thái "khoá" cho tới khi BGĐ tự đặt lại mật khẩu qua `/dashboard/admin` cho từng người và cấp phát trực tiếp (không qua email) — kèm nhắc sẽ cần đăng nhập lại 1 lần do bước rotate secret ở trên.

## Success Criteria

- [x] Backup DB tồn tại, đã mã hoá, lưu ngoài git. Done 2026-08-18.
- [x] Backfill quyền tài liệu đã verify đúng TRƯỚC khi thực hiện bước rotate/xoá env. Done 2026-08-18.
- [x] Không còn tài khoản khối cũ nào đăng nhập được. Done — code không còn đọc `AUTH_PASSWORD_*`/`ACCOUNTS` từ commit `8cb5f03`, xác nhận grep 0 kết quả; biến env cũng đã xoá khỏi Vercel.
- [x] **[RED-TEAM FIX]** Sau bước rotate `SESSION_SECRET`, mọi cookie/token ký trước đó đều bị từ chối. Done 2026-08-18 — verify bằng cookie giả (bogus token) → 307 redirect `/login`.
- [x] Tài khoản cá nhân đăng nhập đúng SAU bước rotate, thấy đúng nội dung theo department/tier. Done 2026-08-18 — `minhnguyet` (full/bgd) login OK, thấy link admin.
- [x] Tài liệu `sop-all-print-product` không bị "biến mất" khỏi ai đang cần dùng nó hằng ngày. Verified qua backfill check (53/53 khớp).
- [x] README.md phản ánh đúng hệ thống mới, bao gồm cả mục bảo mật/PII đã sửa đúng (không còn dòng "không có PII"). Done 2026-08-18.
- [x] `npm run build` + `npx tsc --noEmit` pass trên commit cuối cùng — **[RED-TEAM FIX] thay `npm run lint` bằng `npx tsc --noEmit`** vì `next lint` không còn hoạt động trên Next.js 16 (đã verify: `npx next lint` báo lỗi "Invalid project directory provided, no such directory: .../lint" — script `next lint` bị loại bỏ khỏi CLI ở phiên bản này). Cả 2 pass sạch 2026-08-18 (chưa có commit mới sau đó — cần chạy lại nếu còn sửa code).

## Risk Assessment

- **Rủi ro cao nhất của cả plan:** gián đoạn thật cho người dùng thật nếu cutover không cẩn thận thứ tự. *Giảm thiểu:* thứ tự bước bắt buộc theo Implementation Steps — không xoá env cũ (bước 9) cho tới khi rotate secret (bước 7) + test lại (bước 8) pass.
- **[RED-TEAM FIX] Rủi ro đã đóng:** bản trước dựa vào TTL 12h tự hết hạn để coi như "session cũ chết" — không đúng vì có thể có người vừa đăng nhập ngay trước lúc cutover. Bước rotate `SESSION_SECRET` (bước 7) giải quyết dứt điểm, không phụ thuộc thời gian chờ.
- **Rủi ro:** BGĐ quên cấp quyền tài liệu cho người cần — đã chuyển sang giải quyết ở Phase 4 (backfill trước deploy), phase này chỉ verify lại.
