---
title: "Individual accounts + per-user rule permissions"
description: "Thay tài khoản dùng chung theo khối bằng tài khoản cá nhân (import từ Excel HR thật), thêm Vercel Postgres, và cho BGĐ quản lý ai được đọc file rule/SOP nào qua trang admin."
status: pending
priority: P1
effort: "~8-10 ngày dev (tăng từ ~4-6 sau red-team — xem Red Team Review)"
tags: [auth, database, admin-panel, security]
created: 2026-08-17
---

# Individual accounts + per-user rule permissions

## Overview

Hiện app dùng **tài khoản chung theo khối** (`lib/users.ts`, mật khẩu qua env var, không có database). User muốn:
1. Mỗi nhân viên có **tài khoản cá nhân** (import từ file Excel HR thật, 97 người).
2. **BGĐ** (tier `full`) quản lý toàn bộ tài khoản qua 1 trang admin.
3. Có ~10 "file rule" (tài liệu SOP), mỗi file BGĐ **tự chỉ định từng người cụ thể** được đọc — không còn chỉ theo khối/cấp như hiện tại.
4. Mật khẩu tự sinh, gửi thẳng về Gmail cá nhân từng người (lấy từ Excel).
5. Tài khoản BGĐ/admin cần bảo mật cao hơn tài khoản thường.

Đây là thay đổi kiến trúc lớn: thêm database thật đầu tiên cho project (Vercel Postgres/Neon), viết lại toàn bộ auth, và thêm 1 mặt trang quản trị mới. Xem `docs/content-source-noi-bo-portal.md` và `README.md` cho bối cảnh nội dung/kiến trúc hiện tại.

## ⚠️ Cần bạn xác nhận trước khi implement (Phase 1-2)

Plan này đã thiết kế sẵn phương án cho 3 điểm dưới — nhưng vì ảnh hưởng trực tiếp tới bảo mật/phân quyền của 97 người thật, cần bạn duyệt hoặc chỉnh trước khi chạy import thật:

1. **Bảng mapping Khối/Cấp** (chi tiết đầy đủ, số liệu đã sửa lại đúng sau red-team, trong [phase-02](./phase-02-excel-import-mapping-password-generation-email-delivery.md)) — suy luận từ tên phòng ban tiếng Anh trong Excel, có thể sai với vài trường hợp biên (đặc biệt: "R&D Division → Development Team" được map vào khối `it` chứ không phải `rnd`, vì tên team là "Development" — nếu sai ý bạn, sửa trước khi import).
2. **[RED-TEAM FIX] 2 nhân viên trong Excel bị TRỐNG cột "Tài khoản"** (username) — cần bạn/HR cung cấp username cho 2 người này trước khi chạy import thật (chi tiết ở phase-02, script sẽ liệt kê rõ theo Mã nhân viên ở bước dry-run).
3. **Email provider gửi mật khẩu**: đề xuất **Resend**. **[RED-TEAM FIX] Lưu ý: Resend free tier giới hạn ~100 email/ngày (không chỉ theo tháng) và bắt buộc xác thực DNS cho domain dùng để GỬI mail** (khác với domain `noibo.ethanecom.com` đang chạy site — xem Non-goals đã cập nhật bên dưới). Nếu bạn muốn dùng provider khác (Gmail SMTP, SendGrid...) thì báo trước Phase 2.
4. **Biện pháp bảo mật riêng cho BGĐ** (chi tiết trong [phase-03](./phase-03-auth-rewrite-bgd-security-hardening.md)): mật khẩu dài hơn (20 ký tự thay vì 12), session ngắn hơn (2h thay vì 12h, áp cho cả JWT lẫn cookie), **thu hồi session ngay khi bị deactivate/đổi mật khẩu** (không chỉ chờ hết TTL), audit log mọi hành động admin (đã lọc field nhạy cảm), rate-limit đăng nhập theo cặp username+ip có backoff. Không làm 2FA (ngoài scope, xem Non-goals).

Nếu không có phản hồi, Phase 1 (setup DB) vẫn làm được ngay — các điểm trên chỉ chặn Phase 2 (import thật) và một phần Phase 3.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Vercel Postgres (Neon) làm nguồn sự thật cho users + permissions | P1 |
| 2 | Import 97 nhân viên thật từ Excel thành tài khoản cá nhân, gửi mật khẩu qua Gmail cá nhân | P1 |
| 3 | Auth (`lib/auth.ts`) chuyển từ ACCOUNTS hard-code sang tra DB, mật khẩu hash (không lưu plaintext) | P1 |
| 4 | Mở rộng mô hình tài liệu rule từ 1 → nhiều tài liệu, mỗi tài liệu có quyền đọc gán theo TỪNG NGƯỜI (không chỉ theo khối) | P1 |
| 5 | Trang admin cho BGĐ: CRUD user + gán/thu quyền đọc từng rule document | P1 |
| 6 | Bảo mật nâng cao riêng cho tài khoản BGĐ/admin | P2 |
| 7 | Xoá hoàn toàn tài khoản dùng chung theo khối cũ sau cutover | P1 |

## Non-goals (ngoài scope lần này)

- Không làm 2FA / passkey.
- Không làm trang tự đổi mật khẩu (self-service) cho nhân viên thường — đổi mật khẩu là việc của BGĐ qua trang admin.
- Không đụng tới DNS của domain chính `noibo.ethanecom.com`/`ethanecom.com` (đã xong, xem `README.md`). **[RED-TEAM FIX] Làm rõ:** nếu Resend (Phase 2) yêu cầu xác thực domain gửi mail, đây LÀ một thao tác DNS riêng biệt (thêm record cho domain/subdomain dùng để gửi, khác với domain site đang chạy) — không mâu thuẫn với việc "không đụng DNS của site chính", nhưng vẫn là DNS work cần user xác nhận trước (xem mục xác nhận phía trên) hoặc dùng domain sandbox của Resend để trì hoãn bước này.
- Không viết nội dung thật cho 10 file rule — chỉ làm hạ tầng cho phép BGĐ/dev thêm tài liệu + gán quyền sau này. Nội dung tài liệu vẫn do dev viết trực tiếp trong code (như `lib/content/sop.ts` hiện tại), KHÔNG xây CMS cho BGĐ tự soạn nội dung — BGĐ chỉ quản lý **quyền đọc**, không quản lý **nội dung**. (Lý do: giữ đơn giản — xem "Quyết định kiến trúc" trong phase-04.)
- Không migrate 5 loại nội dung khác (announcements, policies, notices, culture, recognition — trong `lib/content/`) sang mô hình per-user; chỉ riêng "rule" (SOP) đổi theo yêu cầu user.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Database schema & Vercel Postgres setup](./phase-01-start.md) | Pending |
| 2 | [Phase 2: Excel import, mapping, password generation, email delivery](./phase-02-excel-import-mapping-password-generation-email-delivery.md) | Pending |
| 3 | [Phase 3: Auth rewrite + BGĐ security hardening](./phase-03-auth-rewrite-bgd-security-hardening.md) | Pending |
| 4 | [Phase 4: Multi-document rule content model + per-user permissions](./phase-04-multi-document-rule-content-model-per-user-permissions.md) | Pending |
| 5 | [Phase 5: Admin panel cho BGĐ](./phase-05-admin-panel-for-bgd.md) | Pending |
| 6 | [Phase 6: Cutover, rollout, end-to-end test](./phase-06-cutover-rollout-end-to-end-test.md) | Pending |

## Success Criteria

- [ ] 97 nhân viên có tài khoản cá nhân thật trong DB, mỗi người nhận được username + mật khẩu qua Gmail cá nhân.
- [ ] Đăng nhập bằng tài khoản cá nhân hoạt động đúng department/tier theo mapping đã duyệt.
- [ ] BGĐ đăng nhập vào `/dashboard/admin`, thấy danh sách 97 người, sửa/xoá/tạo user được.
- [ ] BGĐ gán quyền đọc 1 rule document cho 1 người cụ thể → chỉ người đó (+ BGĐ) thấy tài liệu, người khác không thấy.
- [ ] Tài khoản khối cũ (`kd-staff`, `kd-leader`, ...) không còn đăng nhập được sau cutover.
- [ ] **[RED-TEAM FIX]** Session/cookie ký từ trước thời điểm rotate `SESSION_SECRET` (Phase 6) không còn dùng được — không chỉ dựa vào TTL tự hết hạn.
- [ ] **[RED-TEAM FIX]** Deactivate hoặc đổi mật khẩu 1 user → session đang sống của người đó chết ngay (không cần đợi hết TTL).
- [ ] Không có mật khẩu plaintext nào bị lưu trong DB, log, hay git — **kể cả trong `admin_audit_log.detail`**.
- [ ] `npm run build` pass, không lỗi TypeScript.

## Red Team Review

### Session — 2026-08-17
**Findings:** 34 raw (từ 4 reviewer độc lập: Security Adversary, Failure Mode Analyst, Assumption Destroyer, Scope & Complexity Critic) → gộp trùng lặp còn 15 finding duy nhất, tất cả đều có bằng chứng file:line và đã được chính agent điều phối verify trực tiếp lại (đọc code thật + parse lại Excel thật) trước khi trình user.
**Severity breakdown:** 7 Critical, 5 High, 3 Medium
**User decision:** Áp dụng toàn bộ 15 finding (không finding nào bị reject).

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Session/account không bị thu hồi khi deactivate/đổi mật khẩu/cutover — JWT sống tới hết TTL bất kể trạng thái DB | Critical | Accept | Phase 1 (`session_version` column), Phase 3 (`getSession` check), Phase 5 (`bumpSessionVersion`), Phase 6 (rotate `SESSION_SECRET`) |
| 2 | Cột "Tài khoản" Excel: 2 dòng trống + 67 dòng chữ hoa lẫn — vỡ với login tự lowercase | Critical | Accept | Phase 1 (unique index theo lower), Phase 2 (validate + chuẩn hoá username) |
| 3 | Bảng mapping department/tier sai số (36 phải là 35, tổng 98 phải là 97, "3 dòng tier trống" thực tế là 1) | Critical | Accept | Phase 2 (sửa lại bảng, đổi sang dry-run tự sinh thay vì viết tay) |
| 4 | Rename `SOP_DOCUMENTS`/`SopDocument` ở Phase 4 bỏ sót 2 file thật dùng field bị xoá (`app/dashboard/page.tsx`, `components/dashboard/sop-document.tsx`) | Critical | Accept | Phase 4 (thêm 2 file vào Related Code Files + Architecture) |
| 5 | Quyền admin chia đôi giữa `tier==='full'` (guard) và `department==='bgd'` (`canView`), không có ràng buộc — rủi ro leo quyền | Critical | Accept | Phase 1 (CHECK constraint ép invariant), Phase 5 (validate tổ hợp ở server) |
| 6 | `@vercel/postgres` đã deprecated, giả định `POSTGRES_URL` có thể sai tên biến | Critical | Accept | Phase 1 (driver-agnostic, đọc cả `DATABASE_URL`/`POSTGRES_URL`, xác nhận lại tại thời điểm setup) |
| 7 | Gửi mật khẩu 1 lần không có đường phục hồi khi gửi dở dang — khoá vĩnh viễn người chưa nhận được mail | Critical | Accept | Phase 1 (`credentials_sent_at`), Phase 2 (tách `--import`/`--send-credentials`, resumable) |
| 8 | Phase 3 file list sai — login thật ở `app/api/login/route.ts` + `proxy.ts`, không phải server action ở `app/login/` | High | Accept | Phase 3 (sửa toàn bộ Related Code Files + Architecture) |
| 9 | Rate-limit có race condition + có thể bị lợi dụng khoá vĩnh viễn tài khoản BGĐ, không có lối mở khoá | High | Accept | Phase 3 (khoá theo username+ip, backoff, đếm nguyên tử), Phase 5 (action "Mở khoá") |
| 10 | Script import sẽ crash (`server-only` throw ngoài Next.js runtime) + `vercel env pull` ghi đè `.env.local` hiện có | High | Accept | Phase 1 (`lib/db.ts` không import `server-only`, backup `.env.local` trước khi pull) |
| 11 | Resend free tier giới hạn 100 email/ngày + cần verify domain (mâu thuẫn Non-goals cũ) + có 1 email thật gõ sai domain | High | Accept | Phase 2 (batch theo ngày, domain allow-list), plan.md Non-goals (làm rõ phạm vi DNS) |
| 12 | Thứ tự cutover vòng lặp: cấp quyền tài liệu cần trang admin, nhưng trang admin chỉ có sau deploy — 50 người mất quyền đọc SOP tạm thời | High | Accept | Chuyển backfill từ Phase 6 sang Phase 4 (chạy bằng script trước deploy, không phụ thuộc UI) |
| 13 | `admin_audit_log.detail` không giới hạn field — rủi ro vô tình log mật khẩu/PII | Medium | Accept | Phase 3 (`lib/audit.ts` type allow-list), Phase 5 (constraint khi ghi) |
| 14 | README sau cutover vẫn khẳng định sai "không lưu PII"; Preview environment dùng chung DB Production | Medium | Accept | Phase 1 (chỉ connect Production, không connect Preview), Phase 6 (sửa lại đúng mục bảo mật/PII trong README) |
| 15 | `npm run lint` không chạy được trên Next.js 16 (`next lint` đã bị loại bỏ khỏi CLI) | Medium | Accept | Phase 6 (đổi gate sang `npx tsc --noEmit`) |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md, phase-02-excel-import-mapping-password-generation-email-delivery.md, phase-03-auth-rewrite-bgd-security-hardening.md, phase-04-multi-document-rule-content-model-per-user-permissions.md, phase-05-admin-panel-for-bgd.md, phase-06-cutover-rollout-end-to-end-test.md
- Decision deltas checked: 15 (bảng trên)
- Reconciled stale references: đổi "5 bảng" → "4 bảng" nhất quán ở Phase 1 (Overview/Architecture/Risk); xoá backfill khỏi Phase 6, chuyển hẳn sang Phase 4 (không còn nhắc "làm TRƯỚC hoặc CÙNG lúc" — thay bằng thứ tự cụ thể trong Phase 4); sửa "6 loại nội dung khác" → "5 loại nội dung khác" ở Non-goals (khớp 5 module thật trong `lib/content/`); cập nhật `dependencies` không đổi (Phase 4 vẫn `[1,3]`, Phase 5 vẫn `[1,3,4]`, Phase 6 vẫn `[2,3,4,5]` — thứ tự logic không đổi, chỉ nội dung từng phase đổi); Non-goals DNS được làm rõ phạm vi (site domain vs email-sending domain) thay vì mâu thuẫn thẳng với yêu cầu Resend ở Phase 2; hiệu chỉnh effort ước tính plan.md từ "~4-6 ngày" lên "~8-10 ngày" phản ánh khối lượng fix thêm.
- Unresolved contradictions: 0

<!-- slug: individual-accounts-per-user-rule-permissions -->
