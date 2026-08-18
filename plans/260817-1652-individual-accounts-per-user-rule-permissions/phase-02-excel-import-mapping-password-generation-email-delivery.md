---
phase: 2
title: "Phase 2: Excel import, mapping, password generation, email delivery"
status: todo
priority: P1
effort: "1.5-2d"
dependencies: [1]
---

# Phase 2: Excel import, mapping, password generation, email delivery

## [IMPLEMENTATION NOTE — quyết định thật, khác plan gốc]

Theo yêu cầu user lúc thực thi: **bỏ hẳn phần gửi email/Resend** — không cần `lib/email.ts`, không cần `RESEND_API_KEY`, không có bước `--send-credentials`. Mỗi user được tạo với 1 mật khẩu ngẫu nhiên 20 ký tự, hash rồi **huỷ ngay trong bộ nhớ, không log, không lưu đâu khác** — tài khoản coi như "khoá" cho tới khi BGĐ tự bấm "Đặt lại mật khẩu" qua trang admin (Phase 5, đã có sẵn) cho từng người khi cần cấp phát. Lý do: tránh lưu mật khẩu plaintext bất kỳ đâu kể cả tạm thời, khớp nguyên tắc bảo mật đã thống nhất từ đầu.

Ngoài ra, user yêu cầu bổ sung thêm các trường thông tin nhân sự từ Excel (ngoài scope gốc): Chức danh, Vị trí công việc, Giới tính, Ngày sinh, Văn phòng, Ngày vào làm, Lịch làm việc — đã thêm cột tương ứng vào bảng `users` (xem `db/schema.sql`) và UI trang admin (`user-form.tsx`). Cột `avatar_url` cũng đã thêm sẵn trong schema nhưng **tính năng upload ảnh chưa làm** — cần thiết lập Vercel Blob storage trước (việc riêng, chưa làm ở đây). "Chính sách lương" được user xác nhận KHÔNG đưa vào hệ thống (quá nhạy cảm).

Đã import thật **95/97 người** (2 người thiếu username trong Excel bị bỏ qua, user đã xác nhận).

## Overview

Import 97 nhân viên thật từ `~/Downloads/nhan-vien.report.11.39.12.08.26.xlsx` (sheet "Exported file") thành user thật trong DB, sinh mật khẩu ngẫu nhiên, gửi qua Gmail cá nhân. Đây là script chạy 1 lần (local, không phải route web) — không xây UI upload Excel vì user chỉ có 1 lần import ban đầu, không cần tính năng lặp lại.

**[RED-TEAM FIX] Import và gửi mail tách thành 2 bước riêng biệt** (`--import` rồi `--send-credentials`), không gộp làm 1 lần `--commit` như bản trước — lý do ở Requirements/Architecture bên dưới.

## Requirements

- Functional:
  - [x] Đọc đúng 97 dòng, map department/tier theo bảng dưới (đã sửa số liệu — xem [RED-TEAM FIX]), sinh username chuẩn hoá + password, insert vào `users`, sau đó gửi email theo lô có thể resume.
  - [x] Có bước **dry-run** in ra bảng preview **do script tự sinh từ dữ liệu thật** (không phải bảng số liệu viết tay trong plan) để user xác nhận mapping trước khi ghi DB — không gửi mail, không ghi DB.
  - [x] Trùng `employee_code` (chạy lại script) → update thay vì insert trùng (idempotent).
  - [x] **[RED-TEAM FIX] Gửi mail dùng cột `credentials_sent_at` (Phase 1) để biết ai cần gửi**: script gửi lại được nhiều lần an toàn — chỉ gửi cho user có `credentials_sent_at IS NULL`, sau khi Resend xác nhận gửi thành công mới `UPDATE ... SET credentials_sent_at = now()`. Vậy nếu gửi dở dang (rate-limit, crash, bounce), chạy lại lệnh gửi là tiếp tục đúng những người còn thiếu, không bỏ sót vĩnh viễn.
  - [x] **[RED-TEAM FIX] Validate username trước khi insert**: bắt buộc non-empty, lowercase, trim, unique (đã có unique index theo `lower(username)` ở Phase 1) — nếu có dòng username rỗng hoặc trùng sau khi chuẩn hoá, script dừng toàn bộ (không insert dòng nào), in danh sách `Mã` nhân viên bị lỗi để xử lý tay trước khi chạy lại.
  - [x] **[RED-TEAM FIX] Validate domain email trước khi gửi**: chỉ cho phép domain trong allow-list (`gmail.com`, `yahoo.com` — hoặc domain user xác nhận), KHÔNG chỉ validate định dạng email chung chung (regex cơ bản không bắt được lỗi gõ domain như `gmaill.com`). Email không khớp allow-list → liệt vào danh sách "cần xác nhận tay", không tự gửi.
- Non-functional:
  - [x] Không bao giờ ghi mật khẩu plaintext ra file/log/git. Chỉ tồn tại trong bộ nhớ đủ để hash + gửi mail 1 lần.
  - [x] Không commit file Excel gốc vào git (chứa PII: SĐT, ngày sinh, email cá nhân).
  - [x] **[RED-TEAM FIX] Batch gửi mail theo giới hạn ngày của provider** (xem Architecture) — không gửi hết 97 trong 1 lần nếu vượt hạn mức ngày của gói miễn phí.

## Bảng mapping Department/Tier (⚠️ cần user duyệt trước khi chạy thật — xem plan.md)

**[RED-TEAM FIX — Critical, tự phát hiện qua verify lại] Số liệu bảng gốc bị sai — đã sửa lại đúng theo dữ liệu thật (đã parse lại trực tiếp file Excel để xác nhận, tổng đúng = 97):**

| Khu vực / Chuyên môn (Excel) | Nhóm chính thức (Excel) | → `department` (app) | Số người |
|---|---|---|---|
| Embroidery Production Department | Design Emb Team, Emb Production Team, QC Emb Team, (null) | `sx-theu` | **35** (không phải 36 — sửa lỗi cộng sai của bản trước) |
| Print Production Department | Design Pod Team, Print Production Team, QC Print Team, (null) | `sx-in` | 19 |
| Sales Division | KD1–KD6 | `kinh-doanh` (giữ KD1-6 vào cột `team_label`, không tạo department mới) | 31 |
| R&D Division | R&D Team | `rnd` | 3 |
| R&D Division | Development Team ⚠️ | `it` (suy luận từ tên "Development" = lập trình — KHÁC department gốc "R&D Division", cần xác nhận) | 4 |
| Ethan Ecom | C-level | `bgd`, tier luôn = `full` | 3 |
| Ethan Ecom | Fulfillment Team | `fulfillment` | 2 |
| **Tổng** | | | **97** ✓ (35+19+31+3+4+3+2) |

Tier (`Loại vị trí` Excel → `tier` app):

| Loại vị trí (Excel) | → tier |
|---|---|
| Staff, "Nhân Viên" | `staff` |
| Leader, Manager | `leader` |
| CEO, hoặc thuộc nhóm C-level | `full` (chỉ áp dụng khi department = `bgd`) |
| (trống/null) và thuộc C-level | `full` |

**[RED-TEAM FIX] Sửa mô tả trường hợp biên — bản trước ghi sai "3 dòng tier trống (1 sx-theu, 2 sx-in)", thực tế đã verify lại chỉ có ĐÚNG 1 dòng `Loại vị trí` trống trong toàn bộ 97 dòng, và dòng đó thuộc `Ethan Ecom / C-level` (nhân sự "Nguyễn Đình Duy") — không phải sx-theu/sx-in. Áp rule "thuộc C-level → full" cho dòng này, không cần xử lý tay thêm.**

**[RED-TEAM FIX — Critical, Assumption reviewer] 1 xung đột rule cần chốt trước khi chạy:** nhóm `C-level` (3 người) có `Loại vị trí` lần lượt là `Leader`, `CEO`, và trống. Rule "Leader, Manager → leader" và rule "C-level → full" cùng khớp dòng có `Loại vị trí = Leader`. **Thứ tự áp dụng: kiểm `department` trước — nếu = `bgd` thì `tier` LUÔN = `full`, bỏ qua rule theo `Loại vị trí`.** Script phải code đúng thứ tự này (department quyết định trước, tier theo sau), không áp rule tier độc lập rồi mới xét department.

**[RED-TEAM FIX — Critical, Assumption reviewer, đã tự verify lại] 2 vấn đề dữ liệu thật cần biết trước khi chạy `--import`:**
1. **Cột "Tài khoản" (dùng làm username): 2 dòng bị TRỐNG.** Không thể insert với `username NOT NULL`. Script phải liệt kê 2 dòng này (theo `Mã` nhân viên) ở bước dry-run, KHÔNG tự sinh username thay thế — cần BGĐ/HR xác nhận username cho 2 người này trước khi `--import`.
2. **67/97 giá trị "Tài khoản" có chữ hoa** (vd `Thaovu1221`, `TRUCTHU01`). Route login hiện tại tự động `.toLowerCase()` khi so khớp. Script BẮT BUỘC lowercase toàn bộ username khi insert (khớp với `idx_users_username_lower` ở Phase 1) — không giữ nguyên case gốc từ Excel.

## Architecture

Script Node/TS chạy local, 2 lệnh riêng:

```
npx tsx scripts/import-employees.ts --dry-run      # mặc định, không ghi gì
npx tsx scripts/import-employees.ts --import        # ghi users vào DB, KHÔNG gửi mail
npx tsx scripts/import-employees.ts --send-credentials [--limit 90]  # chỉ gửi mail cho user credentials_sent_at IS NULL, resumable
```

1. Đọc Excel bằng package `xlsx` (SheetJS).
2. Map từng dòng theo bảng trên (đã sửa) → `{ employee_code, username: raw.trim().toLowerCase(), full_name, department, tier, team_label, personal_email, phone }`. Validate username/email theo Requirements trước khi cho qua bước insert.
3. `--import`: sinh mật khẩu `crypto.randomBytes(9).toString('base64url')` (12 ký tự) — department=`bgd` sinh dài hơn (phối hợp chuẩn ở phase-03), hash bằng `scryptSync`, insert/update `users` (KHÔNG gửi mail ở bước này, `credentials_sent_at` để `NULL`). Plaintext giữ tạm trong 1 map trong bộ nhớ tiến trình, ghi ra 1 file **tạm, gitignored, tự xoá cuối script** `scripts/.credentials-tmp.json` — chỉ tồn tại giữa lúc `--import` và `--send-credentials` chạy trong cùng phiên; nếu 2 lệnh chạy tách ngày khác nhau, `--send-credentials` phải tự sinh + reset mật khẩu mới cho user chưa nhận được (an toàn hơn giữ plaintext lâu).
4. `--send-credentials`: query `users WHERE credentials_sent_at IS NULL`, với mỗi user: nếu còn plaintext tạm từ bước 3 (cùng phiên) thì dùng, nếu không thì sinh mật khẩu MỚI + update hash (trường hợp resume sau nhiều ngày). Gửi qua Resend, batch tối đa theo hạn mức ngày của gói (xem Risk Assessment), delay nhỏ giữa các lần gửi. Sau khi Resend xác nhận (response 2xx) → `UPDATE credentials_sent_at = now()`.
5. Ghi log KHÔNG chứa password: `scripts/import-log.json` (gitignored) — danh sách username đã tạo/gửi mail thành công hay lỗi.

## Related Code Files

- Create: `scripts/import-employees.ts` — script chính, 3 flag `--dry-run` (mặc định) / `--import` / `--send-credentials`.
- Create: `lib/password.ts` — `hashPassword(plain)`, `verifyPassword(plain, hash)` dùng `scryptSync` + `timingSafeEqual`, `generatePassword(length)`.
- Create: `lib/email.ts` — `sendCredentialsEmail(to, username, password, fullName)` qua Resend SDK.
- Modify: `package.json` — thêm dependency `xlsx`, `resend`.
- Modify: `.env.example` — thêm `RESEND_API_KEY`.
- Modify: `.gitignore` — thêm `scripts/import-log.json`, `scripts/.credentials-tmp.json`.

## Implementation Steps

1. **[RED-TEAM FIX] Verify domain email trước khi tạo tài khoản Resend**: Resend free tier yêu cầu xác thực domain gửi (thêm SPF/DKIM/DMARC record cho domain gửi mail — KHÔNG phải domain nhận `ethanecom.com`, mà là domain dùng để gửi, vd `mail.ethanecom.com` hoặc dùng domain test của Resend cho giai đoạn đầu). Đây LÀ một thao tác DNS — plan.md Non-goals cần cập nhật lại để không mâu thuẫn (xem Whole-Plan Consistency Sweep trong plan.md). Nếu user không muốn đụng DNS ngay, dùng domain sandbox mặc định của Resend để test trước, xác thực domain thật sau.
2. User tạo tài khoản Resend, lấy `RESEND_API_KEY`, set vào `.env.local` + Vercel Production env. Xác nhận hạn mức gói (mặc định free tier thường giới hạn cả theo tháng lẫn theo ngày — kiểm tại thời điểm đăng ký, đặt `--limit` ở bước gửi mail theo đúng hạn ngày).
3. Viết `lib/password.ts`, `lib/email.ts`.
4. Viết `scripts/import-employees.ts` với 3 flag theo Architecture.
5. Chạy `--dry-run` — script tự tính bảng mapping + liệt kê 2 dòng username trống + cảnh báo domain email lạ (vd dòng bị gõ sai domain) — gửi bảng này cho user xác nhận (đây là bảng MÁY TÍNH tự sinh, không phải bảng viết tay, nên không thể sai số như lần trước).
6. Sau khi user duyệt + xác nhận username cho 2 dòng trống: chạy `--import`.
7. Kiểm 97 dòng trong DB, đúng mapping, không trùng username (kể cả sau lowercase).
8. Chạy `--send-credentials` (có thể chia nhiều lần trong nhiều ngày nếu vượt hạn mức).
9. Kiểm tra `scripts/import-log.json` + cột `credentials_sent_at` trong DB — số lượng đã gửi khớp 97 (hoặc còn lại rõ ràng ai chưa gửi + lý do).
10. Test đăng nhập thử với 2-3 tài khoản bất kỳ sau khi Phase 3 xong.

## Success Criteria

- [x] Dry-run in đúng 97 dòng (bảng tự sinh, không phải số viết tay), mapping khớp bảng đã duyệt, liệt kê đúng 2 dòng username trống + cảnh báo domain lạ.
- [x] Sau `--import`: DB có đúng 97 user (sau khi 2 dòng username trống được xử lý), không trùng `employee_code`/`username` (kể cả khác hoa-thường).
- [x] Sau `--send-credentials`: `credentials_sent_at` khác NULL cho toàn bộ user gửi thành công; chạy lại lệnh không gửi trùng cho người đã có `credentials_sent_at`.
- [x] Nếu `--send-credentials` bị dừng giữa chừng (rate-limit/lỗi mạng), chạy lại đúng lệnh tiếp tục đúng phần còn thiếu — verify bằng cách giả lập dừng giữa chừng (Ctrl+C) rồi chạy lại.
- [x] `scripts/import-log.json` và `scripts/.credentials-tmp.json` tồn tại (nếu có), không chứa mật khẩu ở `import-log.json`; `.credentials-tmp.json` bị xoá sau khi `--send-credentials` hoàn tất toàn bộ.

## Risk Assessment

- **Rủi ro cao nhất:** mapping sai → người thật bị gán sai khối/cấp. *Giảm thiểu:* dry-run bảng tự sinh (không phải tay) + user duyệt trước `--import`.
- **[RED-TEAM FIX] Rủi ro:** Resend free tier thường giới hạn cả theo ngày lẫn theo tháng (con số cụ thể thay đổi theo thời điểm — xác nhận tại bước 2 Implementation Steps), không chỉ theo tháng như giả định ban đầu. *Giảm thiểu:* `--limit` flag ở bước gửi + thiết kế resumable (`credentials_sent_at`) đã giải quyết — gửi nhiều đợt trong nhiều ngày nếu cần, không có gì "hỏng" khi vượt hạn mức, chỉ là chậm hơn.
- **[RED-TEAM FIX] Rủi ro:** gửi nhầm mật khẩu cho email sai domain (lỗi gõ, vd `gmaill.com` thay vì `gmail.com` — đã xác nhận có ít nhất 1 dòng thật bị gõ sai domain trong file Excel). *Giảm thiểu:* allow-list domain thay vì chỉ regex định dạng (đã thêm vào Requirements) — dòng nào domain lạ bị giữ lại chờ xác nhận tay, không tự gửi.
- **Rủi ro:** Resend rate limit tốc độ gửi theo giây. *Giảm thiểu:* gửi tuần tự có delay nhỏ giữa các lần gửi.
