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
