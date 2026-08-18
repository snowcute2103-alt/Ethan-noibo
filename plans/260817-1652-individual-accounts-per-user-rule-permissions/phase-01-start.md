---
phase: 1
title: "Phase 1: Database schema & Vercel Postgres setup"
status: todo
priority: P1
effort: "1-1.5d"
dependencies: []
---

# Phase 1: Database schema & Vercel Postgres setup

## Overview

App hiện chưa có database (README: "Không có database"). Đây là nền móng cho mọi phase sau: tạo database Postgres (qua tích hợp Storage/Marketplace hiện hành của Vercel — có thể là "Neon" hoặc tên khác tuỳ thời điểm), thiết kế schema cho `users`, `rule_permissions`, `admin_audit_log`, `login_attempts`, và client DB dùng chung trong code.

## Requirements

- Functional:
  - [x] Database Postgres tạo và gắn vào project `ethan-noibo` (Production; xem lưu ý Preview ở [RED-TEAM FIX] bên dưới).
  - [x] Schema đủ cho: tài khoản cá nhân (thay ACCOUNTS hard-code), quyền đọc rule document theo từng người, audit log hành động admin, đếm số lần login sai (rate-limit), **thu hồi phiên đăng nhập** (session revocation).
  - [x] Migration chạy được lặp lại an toàn (idempotent — `CREATE TABLE IF NOT EXISTS`), từng statement chạy tách biệt (xem [RED-TEAM FIX] Implementation Steps).
- Non-functional:
  - [x] Không lưu password plaintext ở bất kỳ cột nào.
  - [x] `employee_code` và `username` là UNIQUE (username lưu dạng đã lowercase — xem phase-02 finding username).
  - [x] Connection dùng pooled connection string nhà cung cấp DB cấp qua tích hợp Vercel, không tự bịa connection string. **[RED-TEAM FIX] Không hard-code tên biến `POSTGRES_URL`** — driver hiện tại của Vercel/Neon có thể expose `DATABASE_URL` thay vì `POSTGRES_URL` tuỳ thời điểm tích hợp; `lib/db.ts` phải đọc theo thứ tự ưu tiên `process.env.DATABASE_URL ?? process.env.POSTGRES_URL` và throw lỗi rõ ràng ngay lúc import nếu không có biến nào, thay vì để lỗi xuất hiện lần đầu có request chạm DB (tức là fail ở cold start, không fail âm thầm ở login route production).

## Architecture

**[RED-TEAM FIX — Critical, Security/Assumption reviewer]** `@vercel/postgres` đã bị Vercel deprecate sau khi chuyển hạ tầng Postgres sang tích hợp Neon qua Marketplace — package/luồng UI mô tả trong bản plan gốc có thể không còn đúng tại thời điểm implement. **Trước khi cài package**, kiểm tra lại luồng hiện hành trên Vercel dashboard (Storage/Marketplace tab) và dùng driver được tài liệu chính thức khuyến nghị tại thời điểm đó (ứng viên hợp lý: `@neondatabase/serverless`, hoặc `postgres`/`pg` nếu không dùng Neon). Bọc driver trong `lib/db.ts` (đã có kế hoạch từ đầu) để nếu driver đổi thì chỉ sửa 1 file. Không dùng ORM (Prisma/Drizzle) — schema nhỏ, SQL thuần là đủ (KISS).

Schema (`db/schema.sql`, chạy qua script migrate — **4 bảng**, không có bảng `rule_documents` riêng, xem lý do cuối phần này):

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  employee_code TEXT UNIQUE,              -- "NV01" từ Excel, NULL cho account tạo tay sau này
  username TEXT UNIQUE NOT NULL,          -- LUÔN lưu dạng lowercase, trimmed (xem phase-02)
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,               -- khớp Department enum trong lib/roles.ts
  tier TEXT NOT NULL,                     -- khớp Tier enum: staff | leader | full
  team_label TEXT,                        -- metadata hiển thị, vd "KD1", "Emb Production Team" — KHÔNG dùng để phân quyền
  personal_email TEXT,                    -- Gmail cá nhân, dùng để gửi mật khẩu ban đầu
  phone TEXT,
  password_hash TEXT NOT NULL,            -- scrypt salt:hash, KHÔNG BAO GIỜ lưu plaintext
  is_active BOOLEAN NOT NULL DEFAULT true,
  session_version INTEGER NOT NULL DEFAULT 1, -- [RED-TEAM FIX] tăng lên mỗi khi deactivate/đổi mật khẩu/đổi tier — JWT mang theo giá trị này, verifySessionToken so sánh, giá trị lệch = phiên bị thu hồi ngay lập tức thay vì chờ hết TTL
  credentials_sent_at TIMESTAMPTZ,        -- [RED-TEAM FIX] NULL = chưa gửi mail thành công; import script dùng cột này để biết ai cần gửi/gửi lại (xem phase-02)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (department IN ('bgd','kinh-doanh','sx-theu','sx-in','rnd','it','fulfillment')),
  CHECK (tier IN ('staff','leader','full')),
  CHECK ((department = 'bgd') = (tier = 'full')) -- [RED-TEAM FIX] ép invariant bgd<=>full ngay ở DB, không phụ thuộc code kiểm tra đúng
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username)); -- [RED-TEAM FIX] chặn trùng username khác hoa/thường

CREATE TABLE IF NOT EXISTS rule_permissions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_id TEXT NOT NULL,                   -- khớp id trong registry tài liệu rule (xem phase-04)
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, doc_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,                   -- vd "user.create", "user.update", "permission.grant", "permission.revoke"
  target_user_id INTEGER REFERENCES users(id),
  detail JSONB,                           -- [RED-TEAM FIX] xem phase-05: chỉ ghi field trong allow-list, CẤM ghi password/phone/personal_email
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  ip TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username_ip_time ON login_attempts (username, ip, created_at); -- [RED-TEAM FIX] thêm ip vào index vì rate-limit giờ khoá theo cặp (username, ip), xem phase-03
```

`rule_documents` KHÔNG cần bảng riêng — nội dung + danh sách tài liệu vẫn khai báo trong code (xem Non-goals trong plan.md + quyết định kiến trúc ở phase-04), `rule_permissions.doc_id` chỉ tham chiếu tới `id` khai báo tĩnh đó bằng string, không có FK ràng buộc.

**[RED-TEAM FIX] Retention `login_attempts`:** bảng này tăng vô hạn, không có cơ chế dọn. `scripts/migrate.ts` KHÔNG cần tự dọn, nhưng thêm 1 dòng ghi chú trong README vận hành: định kỳ (vd hàng tháng) chạy `DELETE FROM login_attempts WHERE created_at < now() - interval '30 days'` — chấp nhận làm tay ở quy mô 97 user, không cần cron tự động (YAGNI ở quy mô này).

## Related Code Files

- Create: `db/schema.sql` — DDL trên.
- Create: `scripts/migrate.ts` — đọc và chạy `db/schema.sql`, log kết quả. Chạy bằng `npx tsx scripts/migrate.ts`.
- Create: `lib/db.ts` — export `sql`/client từ driver đã chọn (đọc `DATABASE_URL ?? POSTGRES_URL`, throw rõ ràng nếu thiếu). **[RED-TEAM FIX] KHÔNG thêm `import 'server-only'` vào file này** — khác với `lib/auth.ts`/`lib/users.ts`, `lib/db.ts` phải import được từ `scripts/*.ts` chạy bằng `tsx` ngoài Next.js runtime; `server-only` throw ngay khi import ở môi trường Node thường (đã verify: `node -e "require('server-only')"` → lỗi `This module cannot be imported from a Client Component module`). Các file khác (`lib/users.ts`, `lib/auth.ts`) vẫn giữ `server-only` như hiện tại vì chỉ chạy trong Next.js server runtime.
- Modify: `package.json` — thêm dependency driver DB đã chọn, thêm devDependency `tsx`, thêm script `"db:migrate": "tsx scripts/migrate.ts"`.
- Modify: `.env.example` — thêm ghi chú biến connection string (tên chính xác xác nhận ở bước 1 Implementation Steps).
- Modify: `README.md` — thêm mục "Database" mô tả cách setup/migrate.

## Implementation Steps

1. Trên Vercel dashboard: project `ethan-noibo` → tab Storage/Marketplace → tạo Postgres database (Neon hoặc nhà cung cấp Vercel đang offer tại thời điểm này) → connect vào project. **[RED-TEAM FIX] Chỉ connect Production.** Không connect Preview vào cùng database chứa dữ liệu nhân sự thật — Preview deploy chạy code chưa review, có thể chứa bug ghi/xoá dữ liệu (vd Server Action đang viết dở). Nếu cần DB cho Preview, tạo branch/database riêng của Neon (free) hoặc để Preview không có DB (chấp nhận Preview build lỗi ở phần cần DB, review qua Production sau khi merge).
2. **[RED-TEAM FIX] Backup trước khi pull:** copy `.env.local` hiện tại sang `.env.local.bak-before-db` (file này đang chứa `SESSION_SECRET` + 13 `AUTH_PASSWORD_*` dùng để chạy hệ thống cũ song song trong lúc migrate — `vercel env pull` sẽ ghi đè toàn bộ file, có thể xoá mất các giá trị này nếu Production chưa từng set đủ 14 biến ở môi trường Development). Sau đó chạy `npx vercel env pull .env.local`, rồi diff với bản backup, merge tay các biến bị mất.
3. Cài dependency driver DB đã chốt ở bước 1 + `npm install -D tsx`.
4. Viết `db/schema.sql`, `lib/db.ts`, `scripts/migrate.ts`. **[RED-TEAM FIX] `scripts/migrate.ts` phải chạy từng CREATE TABLE/INDEX như 1 statement riêng** (không gửi cả file `.sql` nhiều câu lệnh trong 1 request) — driver fetch-based (Neon HTTP driver và tương tự) thường không hỗ trợ multi-statement trong 1 lần gọi. Bọc cả script trong try/catch, nếu statement giữa chừng lỗi thì dừng ngay và in rõ statement nào fail (không tiếp tục chạy statement sau để tránh schema half-applied).
5. Chạy `npm run db:migrate` — verify đủ 4 bảng VÀ đúng cột (không chỉ tên bảng) bằng query `information_schema.columns`, đối chiếu với DDL.
6. Cập nhật `README.md` mục Database.

## Success Criteria

- [x] `npm run db:migrate` chạy xong không lỗi, tạo đủ 4 bảng (`users`, `rule_permissions`, `admin_audit_log`, `login_attempts`) với đúng cột theo DDL (kiểm bằng `information_schema.columns`, không chỉ tên bảng).
- [x] Chạy lại `npm run db:migrate` lần 2 không lỗi (idempotent).
- [x] Connection string không bị commit vào git (đã có trong `.gitignore` qua `.env*.local`).
- [x] Vercel Production đã set biến DB tự động qua tích hợp Storage (kiểm bằng `vercel env ls production`).
- [x] `.env.local` sau bước pull vẫn còn đủ `SESSION_SECRET` (verify bằng cách chạy hệ thống cũ ở local, đăng nhập thử 1 tài khoản khối cũ vẫn được — hệ thống cũ còn sống song song tới hết Phase 6).
- [x] CHECK constraint `(department = 'bgd') = (tier = 'full')` từ chối được 1 insert thử nghiệm sai (vd `department='kinh-doanh', tier='full'`).

## Risk Assessment

- **Rủi ro:** Database free tier có giới hạn storage/compute — 97 user + vài bảng nhỏ chắc chắn nằm trong free tier, nhưng cần xác nhận sau khi tạo project trên dashboard (giá cụ thể có thể đổi theo thời điểm). *Tín hiệu vỡ giả định:* dashboard báo cần nâng cấp trả phí ngay từ bước tạo database. *Phản ứng:* dừng, báo user, không tự ý bấm nâng cấp trả phí.
- **Rủi ro:** Nếu sau này cần chạy nhiều migration hơn (thêm cột, đổi kiểu dữ liệu), script `scripts/migrate.ts` dạng chạy-lại-toàn-bộ sẽ không đủ (không có version tracking). *Chấp nhận được* ở quy mô 4 bảng tĩnh hiện tại — nếu schema phức tạp lên đáng kể sau này, cân nhắc thêm bảng `schema_migrations` để track, nhưng KHÔNG làm ngay (YAGNI ở quy mô này).
- **[RED-TEAM FIX] Rủi ro:** `vercel env pull` ghi đè `.env.local` có thể xoá `SESSION_SECRET`/mật khẩu dev hiện tại, làm hệ thống cũ ở local ngừng chạy được giữa chừng migrate (mất khả năng test song song 2 hệ thống). *Giảm thiểu:* bước 2 ở Implementation Steps bắt buộc backup trước, verify lại sau — đã thêm vào Success Criteria.
