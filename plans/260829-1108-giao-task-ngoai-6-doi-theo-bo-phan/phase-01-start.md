---
phase: 1
title: "Schema migration"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Schema migration

## Overview

Mở rộng bảng `tasks` hiện có (không tạo bảng mới) để chứa thêm task cá nhân
của người ngoài 6 đội KD: `team_id` chuyển thành nullable, thêm
`owner_user_id`, thêm CHECK constraint đảm bảo mỗi task đúng 1 trong 2 loại
(đội KD hoặc cá nhân), thêm index cho truy vấn theo chủ task + ngày. Migration
chạy qua `scripts/migrate.ts` — script này replay TOÀN BỘ `db/schema.sql` mỗi
lần chạy (không có bảng version), nên mọi câu lệnh mới BẮT BUỘC phải
idempotent, và KHÔNG được dùng comment `--` (xem Requirements, đây là 2 điểm
red-team đã phát hiện có thể làm migration âm thầm hỏng — xem "Red Team
Review" trong `plan.md`).

## Requirements

- [x] `tasks.team_id` cho phép NULL (đang `NOT NULL REFERENCES teams`).
- [x] Thêm cột `tasks.owner_user_id INTEGER REFERENCES users(id) ON DELETE
      CASCADE` (nullable), dùng `ADD COLUMN IF NOT EXISTS` (đã idempotent).
- [x] CHECK constraint `tasks_scope_xor`: đúng 1 trong 2 — `team_id IS NOT
      NULL AND owner_user_id IS NULL` (task đội KD) HOẶC `team_id IS NULL AND
      owner_user_id IS NOT NULL` (task cá nhân). Không cho phép cả 2 cùng
      NULL hoặc cùng NOT NULL. **Phải idempotent** (xem Architecture — dùng
      `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT` làm 2 câu lệnh riêng,
      KHÔNG dùng cú pháp không tồn tại `ADD CONSTRAINT IF NOT EXISTS`).
- [x] Index `idx_tasks_owner_date` trên `(owner_user_id, task_date)` để
      truy vấn Kanban cá nhân theo khoảng ngày không full scan.
- [x] **Mọi comment giải thích PHẢI dùng block comment `/** ... */`**, giống
      100% phần còn lại của `db/schema.sql` — TUYỆT ĐỐI không dùng `--`.
      `scripts/migrate.ts:9-12` split file theo `;` rồi
      `filter(s => !s.startsWith('--'))`; 1 chunk (comment + statement dính
      liền sau khi trim) bắt đầu bằng `--` sẽ bị loại bỏ HOÀN TOÀN khỏi danh
      sách chạy, không in lỗi, không log — trông như migration chạy thành
      công trong khi 1-2 câu lệnh chưa bao giờ chạy. Đã xác nhận
      `db/schema.sql` hiện có 0 dòng bắt đầu bằng `--`.
- [x] Migration không phá dữ liệu `tasks` hiện có của 6 đội KD (mọi dòng cũ
      đã có `team_id NOT NULL`, `owner_user_id` mặc định NULL → tự động thoả
      nhánh đầu của CHECK, không cần backfill).
- [x] **Migration phải chạy và xác nhận xong TRÊN PRODUCTION trước khi
      deploy code Phase 2-4** — `npm run db:migrate` chạy thủ công từ máy
      local (`package.json:10`), hoàn toàn tách rời lệnh deploy
      (`npx vercel --prod`, xem `docs/deployment.md`). Nếu deploy code trước:
      `lib/tasks.ts`/Phase 2 tham chiếu `owner_user_id` chưa tồn tại →
      `42703` → trang `/dashboard/giao-task` lỗi 500 cho MỌI user ngoài 6 đội
      (nặng hơn hành vi redirect êm hiện tại). Lưu ý thêm: `vercel rollback`
      chỉ rollback CODE, không rollback schema — nếu constraint sai phải tự
      chạy `ALTER TABLE tasks DROP CONSTRAINT tasks_scope_xor;` tay, rollback
      code không cứu được.
- [x] Backup database trước khi chạy migration trên môi trường có dữ liệu
      thật — dùng cơ chế đang có (`db/backups/*.json`, export tay qua Neon
      dashboard), KHÔNG giả định `pg_dump` hoạt động được (driver là
      `@neondatabase/serverless` qua HTTP, `pg_dump` cần connection string
      trực tiếp chưa được xác nhận có sẵn trong môi trường này).

## Architecture

```sql
-- db/schema.sql — sửa trong/ngay sau block `CREATE TABLE tasks` đã có,
-- BẮT BUỘC dùng comment khối /** */ (không dùng --, xem Requirements)

ALTER TABLE tasks ALTER COLUMN team_id DROP NOT NULL;

/**
 * Task cá nhân của người KHÔNG thuộc 6 đội KD (xem
 * plans/260829-1108-giao-task-ngoai-6-doi-theo-bo-phan/plan.md) — mỗi người
 * chỉ quản lý đúng task của chính mình, không có roster/category như đội KD.
 */
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

/**
 * Đúng 1 trong 2 loại task: đội KD (team_id có, owner_user_id không) hoặc cá
 * nhân (owner_user_id có, team_id không). Postgres không có
 * "ADD CONSTRAINT IF NOT EXISTS" — DROP IF EXISTS rồi ADD lại (2 câu lệnh
 * riêng, cả 2 đều idempotent độc lập) là cách an toàn để migrate.ts (replay
 * toàn bộ file mỗi lần chạy, không transaction, throw+dừng ở lỗi đầu tiên)
 * không bao giờ ném lỗi "constraint already exists" ở lần chạy thứ 2 trở đi.
 */
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_scope_xor;
ALTER TABLE tasks ADD CONSTRAINT tasks_scope_xor CHECK (
  (team_id IS NOT NULL AND owner_user_id IS NULL) OR
  (team_id IS NULL AND owner_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_date ON tasks (owner_user_id, task_date)
  WHERE owner_user_id IS NOT NULL;
```

Không cần cột/bảng nào khác — `category_id`, `assignee_user_id`, `channel`,
`product`, `option_tag`, `reference_link`, `account_name` giữ nguyên NULL cho
task cá nhân (xem "Quyết định kiến trúc bổ sung" trong `plan.md`; Phase 3
enforce việc này ở tầng SQL, không dựa vào input client — xem Finding 10 ở
Red Team Review).

## Related Code Files

- Modify: `db/schema.sql` (4 statement ở Architecture, ngay sau block
  `CREATE TABLE tasks` gốc từ
  `plans/260828-1012-giao-task-6-doi-kinh-doanh/phase-01-start.md`)

## Implementation Steps

1. Đọc lại toàn bộ block `tasks` hiện tại trong `db/schema.sql` để giữ đúng
   style comment khối `/** */`/format trước khi sửa.
2. Thêm đúng 5 câu lệnh ở mục Architecture (ALTER DROP NOT NULL, ALTER ADD
   COLUMN, DROP CONSTRAINT IF EXISTS, ADD CONSTRAINT, CREATE INDEX) ngay sau
   block `CREATE TABLE tasks` gốc, dùng comment khối `/** */` — KHÔNG dùng
   `--` ở bất kỳ đâu trong đoạn thêm mới.
3. Backup database trước khi chạy migration (bắt buộc, xem Requirements).
4. Chạy `npm run db:migrate` trên production (không có môi trường
   local/staging riêng cho DB này — `.env.local` đang trỏ thẳng
   `DATABASE_URL` production, xem `.env.example:5-6`). Xác nhận qua log của
   `scripts/migrate.ts` rằng CẢ 5 câu đều in `OK`, không có câu nào bị bỏ qua
   thầm lặng (đếm số dòng `OK:` khớp đúng số câu lệnh mới thêm).
5. Xác nhận bằng truy vấn `information_schema` (không tin log không thôi, vì
   log chỉ in statement ĐÃ chạy — statement bị filter bỏ sẽ không xuất hiện
   ở log dưới dạng lỗi, chỉ đơn giản là không có dòng log tương ứng):
   ```sql
   SELECT column_name, is_nullable FROM information_schema.columns
   WHERE table_name = 'tasks' AND column_name IN ('team_id', 'owner_user_id');
   -- team_id phải is_nullable = 'YES', owner_user_id phải tồn tại
   SELECT conname FROM pg_constraint WHERE conname = 'tasks_scope_xor';
   -- phải trả về đúng 1 dòng
   ```
6. Test constraint bằng transaction KHÔNG COMMIT (an toàn tuyệt đối trên
   production, không cần cleanup, không cần DB thứ hai) — chạy qua Neon SQL
   editor hoặc `psql`, dán nguyên khối sau:
   ```sql
   BEGIN;
   INSERT INTO tasks (team_id, task_date, title) VALUES (
     (SELECT id FROM teams LIMIT 1), current_date, 'rt-test-team'
   ); -- phải PASS (nhánh 1 của XOR)
   INSERT INTO tasks (owner_user_id, task_date, title) VALUES (
     (SELECT id FROM users WHERE is_active = true LIMIT 1), current_date, 'rt-test-owner'
   ); -- phải PASS (nhánh 2)
   INSERT INTO tasks (task_date, title) VALUES (current_date, 'rt-test-none');
   -- phải FAIL: vi phạm tasks_scope_xor (cả 2 cột NULL)
   INSERT INTO tasks (team_id, owner_user_id, task_date, title) VALUES (
     (SELECT id FROM teams LIMIT 1), (SELECT id FROM users WHERE is_active = true LIMIT 1),
     current_date, 'rt-test-both'
   ); -- phải FAIL: vi phạm tasks_scope_xor (cả 2 cột NOT NULL)
   ROLLBACK; -- KHÔNG COMMIT — huỷ toàn bộ 4 dòng test, không chạm dữ liệu thật,
             -- không cần câu DELETE nào (tránh hẳn rủi ro DELETE sai phạm vi
             -- trên dữ liệu thật của 6 đội KD)
   ```
   Trong `psql`/Neon SQL editor, 2 câu `INSERT` giữa sẽ báo lỗi ngay khi gõ —
   đó là kết quả ĐÚNG (đang trong transaction, lỗi không rollback tự động cả
   khối tới khi bạn gõ `ROLLBACK`).
7. Query tay xác nhận dữ liệu `tasks` cũ của 6 đội KD không bị ảnh hưởng:
   `SELECT count(*) FROM tasks WHERE team_id IS NOT NULL AND owner_user_id IS
   NULL` phải bằng đúng tổng số task hiện có trước migration.
8. Chỉ sau khi bước 4-7 PASS mới bắt đầu deploy code Phase 2-4 (xem
   Requirements — thứ tự bắt buộc).

## Success Criteria

- [x] `npm run db:migrate` chạy không lỗi, log in đủ 5 dòng `OK:` cho 5 câu
      lệnh mới (không chỉ "exit code 0" — phải đếm đúng số dòng log).
- [x] Truy vấn `information_schema`/`pg_constraint` ở bước 5 xác nhận đúng
      `team_id` nullable, `owner_user_id` tồn tại, `tasks_scope_xor` tồn tại.
- [x] Khối `BEGIN`/`ROLLBACK` ở bước 6 ra đúng kết quả (2 PASS, 2 FAIL đúng
      constraint `tasks_scope_xor`), không dòng nào trong 4 dòng test còn
      tồn tại sau `ROLLBACK` (`SELECT count(*) FROM tasks WHERE title LIKE
      'rt-test-%'` phải bằng 0).
- [x] Tổng số dòng `tasks` có `team_id NOT NULL` sau migration bằng đúng
      trước migration (không mất/hỏng dữ liệu 6 đội KD).
- [x] Chạy lại `npm run db:migrate` LẦN 2 (mô phỏng deploy sau này) không ném
      lỗi `42710 duplicate_object` hay bất kỳ lỗi nào — xác nhận tính
      idempotent của cặp DROP/ADD CONSTRAINT.

## Risk Assessment

- **Rủi ro** (đã sửa trực tiếp trong phase này, không còn là rủi ro mở):
  comment `--` khiến statement bị filter âm thầm; `ADD CONSTRAINT` không
  idempotent làm hỏng vĩnh viễn migrate lần sau; DELETE cleanup không scope
  đe doạ dữ liệu thật. Cả 3 đã được thiết kế lại ở Architecture/Implementation
  Steps (block comment, DROP-IF-EXISTS-rồi-ADD, transaction ROLLBACK thay
  DELETE) — xem "Red Team Review" trong `plan.md` để biết nguồn gốc phát hiện.
- **Rủi ro còn lại**: không có môi trường staging DB riêng — mọi thao tác ở
  phase này chạy thẳng trên production. Đã giảm thiểu tối đa bằng: DDL
  idempotent (chạy lại vô hại), test bằng transaction ROLLBACK (không commit,
  không chạm dữ liệu thật), backup bắt buộc trước khi bắt đầu.
  **Tín hiệu vỡ**: bước 4 log ra lỗi, hoặc bước 5/7 ra số liệu không khớp.
  **Phản ứng đã quyết trước**: dừng ngay, không tự sửa data khi đang có
  traffic thật — đối chiếu lại bằng `information_schema`, nếu cần rollback
  chạy tay `ALTER TABLE tasks DROP CONSTRAINT tasks_scope_xor;` +
  `ALTER TABLE tasks ALTER COLUMN team_id SET NOT NULL;` (chỉ nếu
  `owner_user_id` chưa có dữ liệu nào), báo người dùng trước khi thực hiện.
