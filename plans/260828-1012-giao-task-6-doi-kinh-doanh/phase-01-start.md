---
phase: 1
title: "Schema, migration, seed"
status: pending
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Schema, migration, seed

## Overview

Thêm 4 bảng mới vào `db/schema.sql` (`teams`, `team_members`,
`team_task_categories`, `tasks`), chạy migration, rồi seed 6 đội + quản lý
(KD1 có 2 quản lý) + thành viên khởi điểm bằng script one-off đọc dữ liệu
`users` thật tại thời điểm chạy.

## Requirements

- [x] 4 bảng mới không phá bảng cũ, chỉ `ALTER`/`CREATE IF NOT EXISTS` theo
      đúng phong cách các block đã có trong `db/schema.sql`.
- [x] **Không** có cột `manager_user_id` đơn trên `teams` — quản lý là N
      người, xác định qua `team_members.role = 'manager'` (quyết định #5,
      hỗ trợ nhiều quản lý mỗi đội).
- [x] `team_members.user_id` UNIQUE (một người một đội — quyết định #3).
- [x] `tasks` có đủ field superset quan sát được từ 3 tab thật của KD1
      (Toàn bộ/Media/Support tiktok/Support Etsy): ngày, thành viên, tên
      acc, chủ đề, up kênh, SL VID, sản phẩm, link mẫu, ghi chú/note, nhãn
      phụ (option), trạng thái — tất cả trừ ngày/chủ đề/trạng thái đều
      nullable vì mỗi nhóm chỉ dùng một phần.
- [x] `team_task_categories.visible_columns` lưu được danh sách khoá cột
      cần hiện cho nhóm đó (quyết định #6: mỗi đội tự đặt nhóm, và giờ biết
      thêm là mỗi nhóm tự chọn cột hiển thị riêng, theo đúng ảnh Notion
      thật vừa xem).
- [x] `tasks.duplicated_from_task_id` (self-FK, nullable) để truy vết task
      nào được nhân bản từ task nào (quyết định #7 — vẫn là dòng độc lập
      thật, cột này chỉ để truy vết, không tạo ràng buộc sửa-liên-động).
- [x] Script seed idempotent (`ON CONFLICT DO NOTHING`), tự đọc
      `team_label`/`username` từ DB thay vì hard-code id.
- [x] Backup database trước khi chạy migration/seed lên production.

## Architecture

```sql
-- db/schema.sql (thêm cuối file, theo đúng style comment tiếng Việt đã có)

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,                 -- 'kd1'..'kd6'
  name TEXT NOT NULL,                        -- 'Đội KD1'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quản lý là 1 hàng role='manager' trong bảng này, KHÔNG phải 1 cộxxt đơn
-- trên teams — KD1 có 2 quản lý (Tuyền, Huyền), 5 đội còn lại có 1.
CREATE TABLE IF NOT EXISTS team_members (
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  added_by INTEGER REFERENCES users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id),
  CHECK (role IN ('manager', 'member'))
);

-- Nhóm/tab task do quản lý từng đội tự đặt (vd Media, Support tiktok,
-- Support Etsy ở KD1) — không dùng danh sách cố định chung cho 6 đội.
-- visible_columns quyết định cột nào hiện khi lọc theo nhóm này, khớp
-- quan sát thực tế: mỗi tab Notion của KD1 hiện 1 bộ cột khác nhau.
CREATE TABLE IF NOT EXISTS team_task_categories (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  visible_columns TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, name)
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES team_task_categories(id) ON DELETE SET NULL,
  task_date DATE NOT NULL,
  assignee_user_id INTEGER REFERENCES users(id),
  account_name TEXT,
  title TEXT NOT NULL,
  channel TEXT,                              -- "Up kênh"
  video_count INTEGER,                       -- "SL VID"
  product TEXT,                              -- "Sản phẩm"
  option_tag TEXT,                           -- nhãn phụ tự do, vd "Option Tiktok"
  reference_link TEXT,                       -- "Link mẫu quảng cáo"
  note TEXT,                                 -- gộp "NOTE"/"Ghi chú"
  status TEXT NOT NULL DEFAULT 'not_started',
  duplicated_from_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('not_started', 'in_progress', 'done'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_team_date ON tasks (team_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_team_category ON tasks (team_id, category_id);
```

`team_id` trên `tasks` là biên cô lập dữ liệu chính — mọi query đọc/ghi
task đều phải lọc theo `team_id` của người gọi (trừ BGĐ). "Toàn bộ" KHÔNG
phải 1 hàng trong `team_task_categories` — là chế độ mặc định (không lọc
`category_id`, hiện bộ cột cố định đầy đủ), đúng như tab "Toàn bộ" trong
ảnh Notion không nằm cùng nhóm với Media/Support. Không cần bảng riêng cho
"tháng" hay "biểu đồ" — cả hai đều là `GROUP BY` trên `tasks` (xem Phase 2).

## Related Code Files

- Modify: `db/schema.sql` (thêm 4 bảng + 2 index ở cuối file)
- Create: `scripts/seed-giao-task-teams.ts` (one-off, chạy 1 lần, theo đúng
  pattern `scripts/backfill-rule-permissions.ts`)

## Implementation Steps

1. Đọc lại `db/schema.sql` toàn bộ để giữ đúng style comment/format trước khi thêm.
2. Thêm 4 `CREATE TABLE IF NOT EXISTS` + 2 index ở cuối file, kèm comment
   tiếng Việt giải thích lý do (đặc biệt lý do không có cột
   `manager_user_id` đơn, và lý do `team_task_categories` có
   `visible_columns`).
3. **Backup trước khi migrate**: `pg_dump` (hoặc export qua Neon dashboard)
   database hiện tại trước khi chạy migration trên môi trường có dữ liệu thật.
4. Chạy `npm run db:migrate` (local/staging trước), xác nhận 4 bảng + 2
   index tạo thành công qua log của `scripts/migrate.ts`.
5. Viết `scripts/seed-giao-task-teams.ts`:
   - Danh sách hard-code duy nhất: 6 đội với danh sách username quản lý
     (`kd1`: [`thanhtuyen`, `myhuyen97`], `kd2`: [`anhthu2001`], `kd3`:
     [`myduyen`], `kd4`: [`thaovu1221`], `kd5`: [`ductien97`], `kd6`:
     [`baohan201`]).
   - `INSERT INTO teams (code, name) VALUES (...) ON CONFLICT (code) DO
     NOTHING`, `name` dạng `Đội {CODE viết hoa}`.
   - Với mỗi đội: `SELECT id, username FROM users WHERE team_label =
     '{CODE viết hoa}' AND is_active = true` lấy toàn bộ thành viên hiện
     có; insert vào `team_members` với `role = 'manager'` cho username nằm
     trong danh sách quản lý của đội đó, `role = 'member'` cho người còn
     lại, `ON CONFLICT (user_id) DO NOTHING`.
   - Log rõ số lượng đã insert theo từng đội, và log riêng danh sách
     `role='manager'` từng đội để đối chiếu tay với bảng ánh xạ ở
     `plan.md` (KD1 phải ra đúng 2 quản lý).
   - Không seed sẵn `team_task_categories` — để trống, quản lý tự tạo nhóm
     đầu tiên qua UI ở Phase 4 (tránh áp đặt tên nhóm không đúng thực tế
     đội đó đang cần).
6. Chạy `npx tsx --env-file=.env.local scripts/seed-giao-task-teams.ts`,
   đối chiếu log với bảng ánh xạ (KD1: 7 người gồm 2 quản lý, KD2: 9, KD3:
   6, KD4: 3, KD5: 2, KD6: 4).
7. Query tay xác nhận: `SELECT t.code, u.username, tm.role FROM
   team_members tm JOIN teams t ON t.id = tm.team_id JOIN users u ON u.id =
   tm.user_id WHERE tm.role = 'manager' ORDER BY t.code` phải ra đúng 7
   dòng khớp bảng ánh xạ (KD1 ra 2 dòng, 5 đội còn lại mỗi đội 1 dòng).

## Success Criteria

- [x] `db/schema.sql` chứa 4 bảng mới, `npm run db:migrate` chạy không lỗi.
- [x] Đúng 6 dòng trong `teams`.
- [x] Query quản lý ở bước 7 ra đúng 7 dòng, KD1 có 2 (`thanhtuyen`,
      `myhuyen97`).
- [x] Tổng số dòng `team_members` bằng đúng 31 (7 quản lý + 24 thành viên
      còn lại, khớp tổng nhân sự kinh doanh đang hoạt động đã đếm ở vòng 1
      — Huyền đã nằm sẵn trong 31 người này từ trước, vòng 2 chỉ đổi role
      của Huyền từ "thành viên" thành "quản lý", không đổi tổng số người).
- [x] Chạy lại `scripts/seed-giao-task-teams.ts` lần 2 không tạo thêm dòng
      trùng (idempotent) — đã xác nhận, lần 2 báo 0 dòng mới ở mọi đội.

## Risk Assessment

- **Rủi ro**: `team_label` của một vài user đã đổi/bị xoá giữa lúc
  brainstorm (28/08/2026) và lúc chạy migration thật, khiến số thành viên
  seed lệch so với bảng ánh xạ.
  **Tín hiệu vỡ**: log seed ở bước 6 không khớp số liệu trong `plan.md`.
  **Phản ứng đã quyết trước**: dừng lại, không tự ý sửa mapping — đối chiếu
  lại thực tế `team_label` rồi báo người dùng, không suy đoán thêm.
- **Rủi ro**: chạy migration/seed thẳng lên production chưa backup.
  **Mitigation**: bước 3 bắt buộc backup, không bỏ qua kể cả khi seed
  script idempotent.
- **Rủi ro**: `visible_columns` là mảng khoá cột tự do (text[]) — nếu
  Phase 4 đổi tên khoá cột (ví dụ đổi `sl_vid` thành `video_count` cho khớp
  tên cột DB) mà không đồng bộ với dữ liệu `team_task_categories` đã tạo,
  cột sẽ không hiện đúng.
  **Mitigation**: chốt 1 danh sách khoá cột cố định ngay ở Phase 2 (dùng
  chung tên field TypeScript của `Task`, không đặt tên khoá riêng), Phase 4
  chỉ đọc theo đúng danh sách đó.
