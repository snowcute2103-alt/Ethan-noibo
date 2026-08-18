import 'server-only';
import { sql } from './db';
import type { Department, Tier } from './roles';

export interface UserRow {
  id: number;
  employeeCode: string | null;
  username: string;
  fullName: string;
  department: Department;
  tier: Tier;
  teamLabel: string | null;
  personalEmail: string | null;
  phone: string | null;
  passwordHash: string;
  isActive: boolean;
  sessionVersion: number;
  jobTitle: string | null;
  gender: string | null;
  birthDate: string | null;
  office: string | null;
  startDate: string | null;
  workSchedule: string | null;
  positionTitle: string | null;
  avatarUrl: string | null;
}

/**
 * Danh sách cột dùng cho mọi SELECT/RETURNING trên `users` — birth_date/start_date
 * ép về text (thay vì để driver trả JS Date) để tránh lệch ngày do quy đổi timezone
 * khi build/máy chạy ở TZ khác giờ Việt Nam lúc ghi dữ liệu.
 */
const USER_COLUMNS = `
  id, employee_code, username, full_name, department, tier, team_label,
  personal_email, phone, password_hash, is_active, session_version,
  job_title, gender, birth_date::text AS birth_date, office,
  start_date::text AS start_date, work_schedule, position_title, avatar_url
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): UserRow {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    username: row.username,
    fullName: row.full_name,
    department: row.department,
    tier: row.tier,
    teamLabel: row.team_label,
    personalEmail: row.personal_email,
    phone: row.phone,
    passwordHash: row.password_hash,
    isActive: row.is_active,
    sessionVersion: row.session_version,
    jobTitle: row.job_title,
    gender: row.gender,
    birthDate: row.birth_date,
    office: row.office,
    startDate: row.start_date,
    workSchedule: row.work_schedule,
    positionTitle: row.position_title,
    avatarUrl: row.avatar_url,
  };
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  const rows = await sql.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE lower(username) = lower($1) AND is_active = true`,
    [username]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const rows = await sql.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ? mapRow(rows[0]) : null;
}

/** Dùng bởi getSession() (lib/auth.ts) để đối chiếu session còn hiệu lực hay đã bị thu hồi. */
export async function getSessionCheck(id: number): Promise<{ sessionVersion: number; isActive: boolean } | null> {
  const rows = await sql.query('SELECT session_version, is_active FROM users WHERE id = $1', [id]);
  if (!rows[0]) return null;
  return { sessionVersion: rows[0].session_version, isActive: rows[0].is_active };
}

export async function recordLoginAttempt(username: string, ip: string, success: boolean): Promise<void> {
  await sql.query('INSERT INTO login_attempts (username, ip, success) VALUES ($1, $2, $3)', [username, ip, success]);
}

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_THRESHOLD = 8;
const BACKOFF_STEPS_MINUTES = [1, 5, 15];

/**
 * Kiểm tra rate-limit theo cặp (username, ip). Đơn giản hoá có chủ đích so với
 * plan gốc: đọc-rồi-quyết-định (không dùng transaction/FOR UPDATE) — driver
 * HTTP của Neon không hỗ trợ tốt khoá dòng tương tác, và ở quy mô 97 người
 * dùng nội bộ, cửa sổ race (vài request chạm ngưỡng cùng lúc) là rủi ro chấp
 * nhận được so với chi phí thêm transaction thật. Điểm chính đã xử lý: khoá
 * theo cặp username+ip (không khoá 1 mình username), và backoff tăng dần
 * thay vì khoá cứng vô thời hạn.
 */
export async function isRateLimited(
  username: string,
  ip: string
): Promise<{ limited: boolean; retryAfterSeconds: number }> {
  const rows = await sql.query(
    `SELECT count(*)::int AS fail_count, max(created_at) AS last_attempt
     FROM login_attempts
     WHERE username = $1 AND ip = $2 AND success = false
       AND created_at > now() - interval '${RATE_LIMIT_WINDOW_MINUTES} minutes'`,
    [username, ip]
  );
  const failCount: number = rows[0]?.fail_count ?? 0;
  if (failCount < RATE_LIMIT_THRESHOLD) return { limited: false, retryAfterSeconds: 0 };

  const overBy = failCount - RATE_LIMIT_THRESHOLD;
  const backoffMinutes = BACKOFF_STEPS_MINUTES[Math.min(overBy, BACKOFF_STEPS_MINUTES.length - 1)];
  const lastAttempt = new Date(rows[0].last_attempt as string);
  const unlockAt = new Date(lastAttempt.getTime() + backoffMinutes * 60_000);
  const retryAfterSeconds = Math.max(0, Math.ceil((unlockAt.getTime() - Date.now()) / 1000));
  return { limited: retryAfterSeconds > 0, retryAfterSeconds };
}

/** Xoá lịch sử đăng nhập sai gần đây của 1 username — dùng bởi action "Mở khoá" (Phase 5). */
export async function unlockUser(username: string): Promise<void> {
  await sql.query(
    `DELETE FROM login_attempts WHERE lower(username) = lower($1) AND success = false
       AND created_at > now() - interval '${RATE_LIMIT_WINDOW_MINUTES} minutes'`,
    [username]
  );
}

/** Tăng session_version — thu hồi ngay mọi session cũ của user này. */
export async function bumpSessionVersion(userId: number): Promise<void> {
  await sql.query('UPDATE users SET session_version = session_version + 1, updated_at = now() WHERE id = $1', [
    userId,
  ]);
}

export async function listUsers(): Promise<UserRow[]> {
  const rows = await sql.query(`SELECT ${USER_COLUMNS} FROM users ORDER BY full_name ASC`);
  return rows.map(mapRow);
}

/** Đếm số tài khoản tier=full đang active — dùng để chặn tự khoá/hạ quyền admin cuối cùng. */
export async function countActiveFullTier(excludingId?: number): Promise<number> {
  const rows = await sql.query(
    "SELECT count(*)::int AS n FROM users WHERE tier = 'full' AND is_active = true AND id != $1",
    [excludingId ?? -1]
  );
  return rows[0]?.n ?? 0;
}

export interface CreateUserInput {
  employeeCode: string | null;
  username: string;
  fullName: string;
  department: Department;
  tier: Tier;
  teamLabel: string | null;
  personalEmail: string | null;
  phone: string | null;
  passwordHash: string;
  jobTitle: string | null;
  gender: string | null;
  birthDate: string | null;
  office: string | null;
  startDate: string | null;
  workSchedule: string | null;
  positionTitle: string | null;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const rows = await sql.query(
    `INSERT INTO users
       (employee_code, username, full_name, department, tier, team_label, personal_email, phone, password_hash,
        job_title, gender, birth_date, office, start_date, work_schedule, position_title)
     VALUES ($1, lower(trim($2)), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING ${USER_COLUMNS}`,
    [
      input.employeeCode,
      input.username,
      input.fullName,
      input.department,
      input.tier,
      input.teamLabel,
      input.personalEmail,
      input.phone,
      input.passwordHash,
      input.jobTitle,
      input.gender,
      input.birthDate,
      input.office,
      input.startDate,
      input.workSchedule,
      input.positionTitle,
    ]
  );
  return mapRow(rows[0]);
}

export interface UpdateUserInput {
  fullName?: string;
  department?: Department;
  tier?: Tier;
  teamLabel?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  isActive?: boolean;
  jobTitle?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  office?: string | null;
  startDate?: string | null;
  workSchedule?: string | null;
  positionTitle?: string | null;
  avatarUrl?: string | null;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UserRow> {
  const current = await findUserById(id);
  if (!current) throw new Error('Không tìm thấy user.');

  const next = { ...current, ...input };
  const rows = await sql.query(
    `UPDATE users SET
       full_name = $1, department = $2, tier = $3, team_label = $4,
       personal_email = $5, phone = $6, is_active = $7,
       job_title = $8, gender = $9, birth_date = $10, office = $11,
       start_date = $12, work_schedule = $13, position_title = $14, avatar_url = $15,
       updated_at = now()
     WHERE id = $16
     RETURNING ${USER_COLUMNS}`,
    [
      next.fullName,
      next.department,
      next.tier,
      next.teamLabel,
      next.personalEmail,
      next.phone,
      next.isActive,
      next.jobTitle,
      next.gender,
      next.birthDate,
      next.office,
      next.startDate,
      next.workSchedule,
      next.positionTitle,
      next.avatarUrl,
      id,
    ]
  );
  return mapRow(rows[0]);
}

export async function updatePasswordHash(id: number, passwordHash: string): Promise<void> {
  await sql.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, id]);
}
