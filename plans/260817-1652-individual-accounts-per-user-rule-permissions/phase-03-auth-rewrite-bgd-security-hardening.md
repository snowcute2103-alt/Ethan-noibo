---
phase: 3
title: "Phase 3: Auth rewrite + BGĐ security hardening"
status: todo
priority: P1
effort: "1.5-2d"
dependencies: [1]
---

# Phase 3: Auth rewrite + BGĐ security hardening

## Overview

Chuyển `lib/auth.ts` + `lib/users.ts` từ tra mảng `ACCOUNTS` hard-code (mật khẩu qua env var) sang tra DB (mật khẩu hash). Thêm rate-limit đăng nhập + audit log + chính sách bảo mật riêng cho tier `full` (BGĐ) + **thu hồi phiên đăng nhập thật sự** (không chỉ đổi TTL).

**[RED-TEAM FIX — Critical, tất cả 4 reviewer] Sửa lại nơi login thực sự nằm.** Bản trước đoán login là "server action hoặc route handler trong `app/login/...`" — sai. Đã verify trực tiếp: login là route handler `app/api/login/route.ts` (POST), gọi `findAccount` (`lib/users.ts`) + `passwordMatches` (`lib/auth.ts`), set cookie qua `SESSION_MAX_AGE`. Guard truy cập `/dashboard` nằm ở `proxy.ts` (Next 16 đổi tên từ `middleware.ts`), hiện chỉ `jwtVerify` chữ ký — không tra DB, không biết user bị deactivate hay chưa. Toàn bộ phase này sửa lại theo đúng các file thật này.

## Requirements

- Functional:
  - [x] `app/api/login/route.ts` xác thực bằng `findUserByUsername` (DB, **có lọc `is_active = true`**) + `verifyPassword` (hash), không còn đọc `passwordEnvVar`.
  - [x] Session JWT payload thêm `userId: number` VÀ `sessionVersion: number` (khớp cột `users.session_version` — Phase 1). `verifySessionToken` **bắt buộc** cả 2 field là số hợp lệ, reject (trả `null`) nếu thiếu — đảm bảo token ký từ hệ thống cũ (không có `userId`) tự động bị từ chối sau khi đổi `SESSION_SECRET` ở Phase 6, thay vì "đọc được nhưng `userId=undefined`" rồi vỡ ở query sau.
  - [x] **[RED-TEAM FIX] `getSession()` sau khi verify JWT, so `sessionVersion` trong token với `session_version` hiện tại của user trong DB** — lệch thì coi như hết hạn (return `null`, buộc đăng nhập lại). Đây là cơ chế thu hồi phiên thật: BGĐ deactivate/đổi mật khẩu/đổi tier ai đó → `session_version` của người đó +1 → phiên cũ của họ chết ngay ở request kế tiếp, không cần chờ hết TTL 12h/2h. Đánh đổi: `getSession()` giờ cần 1 query DB thay vì chỉ verify chữ ký — chấp nhận được ở quy mô 97 user, đã có sẵn connection pool từ Phase 1.
  - [x] **[RED-TEAM FIX] Rate-limit chống race + chống khoá ác ý:** khoá theo cặp `(username, ip)` chứ không chỉ `username` (giảm rủi ro 1 người ngoài biết username là khoá được tài khoản người khác). Đếm bằng 1 câu query nguyên tử ngay sau khi ghi (`INSERT ... RETURNING` rồi đếm trong cùng transaction, hoặc `SELECT ... FOR UPDATE`) thay vì "đếm trước, ghi sau" (dễ bị race khi nhiều request chạy song song trên serverless). Ngưỡng: quá 8 lần sai trong 15 phút (tăng từ 5 vì giờ khoá theo cặp username+ip, ít rủi ro ăn nhầm người dùng chung mạng công ty) → áp dụng **backoff tăng dần** (khoá 1 phút, rồi 5 phút, rồi 15 phút) thay vì khoá cứng vô thời hạn.
  - [x] **[RED-TEAM FIX] Không short-circuit khi username không tồn tại** — giữ lại cơ chế hiện có trong `app/api/login/route.ts` ("Luôn chạy so sánh dù account không tồn tại để tránh lộ thông tin qua thời gian phản hồi"): khi `findUserByUsername` trả `null`, vẫn chạy `verifyPassword` với 1 hash "dummy" cố định (hằng số, hash sẵn của 1 chuỗi ngẫu nhiên) để thời gian phản hồi không tiết lộ tài khoản có tồn tại hay không — tránh việc chuyển từ so sánh hằng thời gian (`timingSafeEqual` cũ) sang `scrypt` (Phase 2, ~100ms) làm lộ enumeration qua timing.
- Non-functional:
  - [x] Tier `full` (BGĐ): session TTL ngắn hơn tier khác (2h thay vì 12h) — áp dụng cho **cả JWT `exp` LẪN cookie `maxAge`**, dùng chung 1 hàm `sessionTtlFor(tier)` cho cả 2 nơi (xem Finding SESSION_MAX_AGE trong Architecture) — tránh tình trạng cookie sống 12h nhưng token chết sau 2h (UX confuse) hoặc ngược lại (bảo mật không đạt).
  - [x] Tier `full`: mật khẩu tối thiểu dài hơn khi tạo/reset (thực thi ở Phase 5, `lib/password.ts` đã có từ Phase 2 cung cấp tham số độ dài).
  - [x] `passwordMatches` cũ (so sánh plaintext qua `timingSafeEqual`) bị thay hoàn toàn bằng `verifyPassword` (hash) từ Phase 2.

## Architecture

`lib/auth.ts` thay đổi:
- `SessionPayload` thêm `userId: number`, `sessionVersion: number`.
- `SESSION_TTL_SECONDS` trở thành hàm `sessionTtlFor(tier: Tier): number`: `full` → `2*3600`, còn lại giữ `12*3600`.
- **[RED-TEAM FIX]** `SESSION_MAX_AGE` (hiện là hằng số export, dùng ở `app/api/login/route.ts:32` cho cookie `maxAge`) bị xoá — thay bằng gọi trực tiếp `sessionTtlFor(user.tier)` ở CẢ nơi tạo JWT (`createSessionToken`) LẪN nơi set cookie (`app/api/login/route.ts`), cùng 1 giá trị 1 lần tính, truyền xuống cả 2 chỗ trong cùng request — không để 2 nơi tính TTL độc lập rồi lệch nhau.
- `getSession()` (`lib/auth.ts`) sau khi verify JWT, query `SELECT session_version, is_active FROM users WHERE id = $1`, so khớp `sessionVersion` + check `is_active` — trả `null` nếu lệch hoặc bị deactivate.
- Xoá `passwordMatches`, thay bằng gọi `verifyPassword` từ `lib/password.ts` (Phase 2), thêm hằng số `DUMMY_HASH` để so sánh khi user không tồn tại (chống enumeration qua timing).

`lib/users.ts` thay đổi hoàn toàn: từ mảng tĩnh → các hàm query DB:
```ts
export async function findUserByUsername(username: string): Promise<UserRow | null> // WHERE lower(username) = lower($1) AND is_active = true
export async function recordLoginAttempt(username: string, ip: string, success: boolean): Promise<void>
export async function isRateLimited(username: string, ip: string): Promise<{ limited: boolean; retryAfterSeconds: number }>
export async function bumpSessionVersion(userId: number): Promise<void> // gọi khi deactivate/đổi mật khẩu/đổi tier (Phase 5)
```

`app/api/login/route.ts` thứ tự mới: `isRateLimited(username, ip)` → nếu `limited`, từ chối kèm `retryAfterSeconds` → `findUserByUsername` (đã lọc `is_active`) → `verifyPassword(password, user?.password_hash ?? DUMMY_HASH)` → `recordLoginAttempt` → nếu ok, tạo session với `sessionTtlFor(user.tier)`, set cả JWT exp và cookie maxAge từ cùng giá trị này.

Audit log: helper `lib/audit.ts` → `logAdminAction(actorId, action, targetId, detail)` insert vào `admin_audit_log`. `detail` **chỉ nhận object đã qua allow-list field** (không dump nguyên payload — xem finding chi tiết ở phase-05) — khai báo type ở đây, dùng ở Phase 5.

## Related Code Files

- Modify: `lib/auth.ts` — session payload (`userId`, `sessionVersion`), `sessionTtlFor`, xoá `SESSION_MAX_AGE`/`passwordMatches`, `getSession()` query thêm.
- Rewrite: `lib/users.ts` — bỏ `ACCOUNTS`/`findAccount`, thêm query DB (dùng `lib/db.ts`, `lib/password.ts`).
- Create: `lib/audit.ts` — `logAdminAction` + type allow-list cho `detail`.
- **[RED-TEAM FIX] Modify: `app/api/login/route.ts`** — route thật (không phải file đoán sai của bản trước), viết lại theo Architecture.
- **[RED-TEAM FIX] Modify: `app/api/logout/route.ts`** — kiểm tra còn tương thích (import `SESSION_COOKIE`, không đổi hành vi, nhưng xác nhận không tham chiếu field bị xoá).
- **[RED-TEAM FIX] Modify: `proxy.ts`** — vẫn giữ vai trò guard nhẹ (verify chữ ký + redirect nếu invalid), nhưng KHÔNG tự ý thêm DB query ở đây (proxy chạy Edge runtime, tần suất cao) — việc check `session_version`/`is_active` chỉ cần ở `getSession()` (dùng trong Server Component/Route Handler), proxy chỉ chặn token sai chữ ký/hết hạn JWT như hiện tại. Ghi rõ trong code comment để dev sau không nhầm proxy là nơi enforce mọi thứ.
- Modify: `app/login/login-form.tsx` — chỉ cần sửa nếu response error format đổi (thêm `retryAfterSeconds` khi bị rate-limit) để hiện thông báo "thử lại sau X phút".
- Modify: `.env.example` — xoá toàn bộ `AUTH_PASSWORD_*`, giữ `SESSION_SECRET`.

## Implementation Steps

1. Viết `lib/audit.ts` (type allow-list cho `detail` trước, dùng lại ở Phase 5).
2. Rewrite `lib/users.ts` theo interface trên.
3. Sửa `lib/auth.ts`: `userId`/`sessionVersion` trong payload, `sessionTtlFor`, `getSession()` query DB.
4. Sửa `app/api/login/route.ts`: rate-limit theo (username, ip) + backoff, dummy-hash cho user không tồn tại, tạo session dùng chung TTL cho JWT + cookie.
5. Kiểm `app/api/logout/route.ts`, `proxy.ts` không bị vỡ bởi thay đổi payload.
6. Xoá `AUTH_PASSWORD_*` khỏi `.env.example`.
7. Test thủ công: đăng nhập đúng; đăng nhập sai 9 lần liên tiếp cùng IP → bị khoá tăng dần; đăng nhập từ IP khác cùng username → không bị ảnh hưởng bởi lock của IP kia; BGĐ deactivate 1 user test đang có session sống → session đó chết ở request kế tiếp (không cần đợi hết TTL).

## Success Criteria

- [x] Đăng nhập bằng user thật (từ Phase 2) thành công, session chứa đúng `userId`, `sessionVersion`, `department`, `tier`.
- [x] Sai mật khẩu 9 lần trong 15 phút (cùng username+ip) → bị từ chối kèm thời gian chờ, backoff tăng dần theo lần khoá; đổi IP khác thì không bị khoá.
- [x] **[RED-TEAM FIX]** Deactivate 1 user (test tay bằng UPDATE trực tiếp `is_active=false, session_version=session_version+1` trước khi Phase 5 UI có) trong lúc user đó đang có session sống → request kế tiếp của session đó bị từ chối (không phải chờ hết TTL).
- [x] JWT `exp` và cookie `maxAge` của tài khoản tier `full` cùng bằng 2h (kiểm cả 2, không chỉ cookie) — thử decode JWT xác nhận `exp`.
- [x] Không còn tham chiếu nào tới `ACCOUNTS`, `findAccount`, `passwordEnvVar`, `passwordMatches`, `SESSION_MAX_AGE` trong codebase (grep sạch).
- [x] `npm run build` pass. **[IMPLEMENTATION NOTE]** verify qua `tsc --noEmit` (sạch) + test thật trên dev server (curl end-to-end: login, rate-limit, session revocation) — `npm run build` bị hook chặn chạy trực tiếp trong phiên agent này, cần user tự chạy để xác nhận cuối.

## Risk Assessment

- **Rủi ro:** khoá theo `(username, ip)` vẫn có thể bị lợi dụng nếu attacker và victim dùng chung NAT/IP công ty — chấp nhận được vì app nội bộ, ngưỡng đã nâng lên 8 lần + backoff thay vì khoá cứng.
- **[RED-TEAM FIX] Rủi ro còn lại sau fix:** vẫn chưa có "break-glass" account nếu TOÀN BỘ tài khoản `full` đều bị khoá backoff cùng lúc (khả năng thấp hơn nhiều so với bản gốc nhờ backoff thay vì khoá cứng, nhưng không phải 0). *Quyết định:* chấp nhận rủi ro này ở scope hiện tại — backoff dài nhất 15 phút, không phải vô thời hạn, tự hết. Nếu cần chặt hơn, cân nhắc thêm 1 route "unlock" khẩn cấp ở Phase 5 (đã thêm — xem phase-05).
- Đổi TTL session BGĐ xuống 2h là đánh đổi bảo mật đã được user yêu cầu — giữ nguyên.
