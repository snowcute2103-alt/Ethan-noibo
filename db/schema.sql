CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  employee_code TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  tier TEXT NOT NULL,
  team_label TEXT,
  personal_email TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  session_version INTEGER NOT NULL DEFAULT 1,
  credentials_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (department IN ('bgd','kinh-doanh','sx-theu','sx-in','rnd','it','fulfillment')),
  CHECK (tier IN ('staff','leader','full')),
  CHECK ((department = 'bgd') = (tier = 'full'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username));

ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS office TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_schedule TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary_policy TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS confirmation_date DATE;

CREATE TABLE IF NOT EXISTS rule_permissions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_id TEXT NOT NULL,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, doc_id)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  target_user_id INTEGER REFERENCES users(id),
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  ip TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username_ip_time ON login_attempts (username, ip, created_at);

/** Yêu cầu "Quên mật khẩu" do nhân viên tự gửi từ trang login — BGĐ duyệt thủ công
 *  qua trang admin (không có luồng gửi email/reset link tự động, khớp quyết định
 *  bảo mật đã chốt ở phase-02: không gửi mật khẩu qua kênh tự động nào). */
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  CHECK (status IN ('pending', 'approved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status_time
  ON password_reset_requests (status, created_at);

/** Rule do BGĐ tự thêm qua trang admin (nhập tay hoặc trích xuất từ file upload).
 *  Cùng cấu trúc với RuleDocument hard-code trong lib/content/sop.ts, đọc gộp
 *  chung tại nơi hiển thị. Quyền đọc dùng chung bảng rule_permissions (doc_id = id ở đây). */
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '1.0',
  effective_date TEXT NOT NULL DEFAULT '',
  updated_at_label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  golden_rule JSONB,
  sections JSONB NOT NULL DEFAULT '[]',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/** Thông báo do BGĐ tự thêm qua trang admin — thay nguồn ANNOUNCEMENTS hard-code (đang rỗng). */
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date_label TEXT NOT NULL DEFAULT '',
  visibility_departments TEXT[],
  visibility_min_tier TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/** Cấp quyền đọc 1 thông báo cho 1 người cụ thể, ngoài phạm vi khối đã chọn ở visibility_departments. */
CREATE TABLE IF NOT EXISTS announcement_permissions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

/** Câu nói do nhân viên tự thêm qua widget "Câu nói ngẫu nhiên" ở trang chủ — hiển thị gộp
 *  cùng kho câu mặc định (lib/content/quotes-seed.ts), chỉ phần do người dùng thêm mới lưu ở đây. */
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Khuyết danh',
  img_url TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/** Bảng ghi chú kéo-thả dùng chung ở cuối trang chủ — ai cũng thấy note của mọi người,
 *  ai cũng kéo/di chuyển được (giống bảng ghim vật lý thật), nhưng chỉ tác giả (hoặc BGĐ)
 *  mới sửa nội dung/xoá — xem lib/sticky-notes.ts. Tên + chức danh hiển thị join trực tiếp
 *  từ users tại thời điểm đọc (không snapshot) nên luôn khớp hồ sơ hiện tại của tác giả. */
CREATE TABLE IF NOT EXISTS sticky_notes (
  id SERIAL PRIMARY KEY,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  color TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  author_user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/** Mỗi người chỉ ghim một note tối đa một lần. Tách thành bảng quan hệ để vừa đếm được
 *  tổng lượt ghim, vừa biết người đang xem đã ghim note đó hay chưa. */
CREATE TABLE IF NOT EXISTS sticky_note_pins (
  note_id INTEGER NOT NULL REFERENCES sticky_notes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, user_id)
);

/** 6 đội kinh doanh độc lập (KD1..KD6) cho tính năng Giao Task. Không có cột
 *  manager_user_id ở đây — quản lý là 1 hoặc nhiều dòng role='manager' trong
 *  team_members bên dưới (KD1 có 2 quản lý ngang quyền, các đội khác có 1). */
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

/** user_id UNIQUE vì 1 người chỉ thuộc đúng 1 đội tại một thời điểm. role
 *  quyết định ai là quản lý (thêm/gỡ thành viên, quản lý nhóm task, nhân bản
 *  hàng loạt) — nhiều dòng role='manager' cùng 1 team_id nghĩa là đội đó có
 *  nhiều đồng quản lý ngang quyền. */
CREATE TABLE IF NOT EXISTS team_members (
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  added_by INTEGER REFERENCES users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id),
  CHECK (role IN ('manager', 'member'))
);

/** Nhóm/tab task do quản lý từng đội tự đặt tên (vd Media, Support tiktok,
 *  Support Etsy ở KD1) — không dùng danh sách cố định chung cho 6 đội, vì
 *  bảng Notion thật của KD1 và KD3 đã cho thấy mỗi đội tự tổ chức khác nhau.
 *  visible_columns liệt kê tên field của tasks cần hiện khi lọc theo nhóm
 *  này (khớp TASK_COLUMN_KEYS ở lib/task-columns.ts) — mỗi nhóm Notion thật hiện
 *  một bộ cột khác nhau (Media có NOTE, Support tiktok có Option Tiktok). */
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

/** Mỗi thành viên thuộc về 1 nhóm task (Media/Support...) tại một thời điểm —
 *  dùng để lọc sidebar "Thành viên đội" theo đúng tab đang xem, thay vì luôn
 *  hiện cả đội. NULL nghĩa là chưa được xếp vào nhóm nào. */
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES team_task_categories(id) ON DELETE SET NULL;

/** Bảng task chính của tính năng Giao Task — đủ trường để phục vụ mọi nhóm
 *  đã quan sát được trên Notion thật (Toàn bộ/Media/Support tiktok/Support
 *  Etsy), mỗi nhóm chỉ dùng một phần, để trống phần còn lại. category_id
 *  NULL nghĩa là task không thuộc nhóm nào (vẫn hiện ở tab "Toàn bộ", tab đó
 *  không phải 1 dòng trong team_task_categories). duplicated_from_task_id
 *  chỉ để truy vết task được nhân bản từ đâu, không tạo ràng buộc sửa-liên-
 *  động — nhân bản luôn tạo dòng độc lập thật (không phải recurring event). */
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES team_task_categories(id) ON DELETE SET NULL,
  task_date DATE NOT NULL,
  assignee_user_id INTEGER REFERENCES users(id),
  account_name TEXT,
  title TEXT NOT NULL,
  channel TEXT,
  video_count INTEGER,
  product TEXT,
  option_tag TEXT,
  reference_link TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  duplicated_from_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('not_started', 'in_progress', 'done'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_team_date ON tasks (team_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_team_category ON tasks (team_id, category_id);

/** team_id nullable để tasks chứa được cả task cá nhân của người không thuộc
 *  đội KD nào — task đội KD vẫn luôn có team_id, chỉ task cá nhân mới NULL. */
ALTER TABLE tasks ALTER COLUMN team_id DROP NOT NULL;

/** Task cá nhân của người KHÔNG thuộc 6 đội KD — mỗi người chỉ quản lý đúng
 *  task của chính mình, không có roster/category như đội KD. */
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

/** Đúng 1 trong 2 loại task: đội KD (team_id có, owner_user_id không) hoặc
 *  cá nhân (owner_user_id có, team_id không). Postgres không có
 *  "ADD CONSTRAINT IF NOT EXISTS" — DROP IF EXISTS rồi ADD lại (2 câu lệnh
 *  riêng, cả 2 đều idempotent độc lập) để script migrate (replay toàn bộ
 *  file mỗi lần chạy) không bao giờ ném lỗi "constraint already exists" ở
 *  lần chạy thứ 2 trở đi. */
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_scope_xor;
ALTER TABLE tasks ADD CONSTRAINT tasks_scope_xor CHECK (
  (team_id IS NOT NULL AND owner_user_id IS NULL) OR
  (team_id IS NULL AND owner_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_date ON tasks (owner_user_id, task_date)
  WHERE owner_user_id IS NOT NULL;
