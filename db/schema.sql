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
