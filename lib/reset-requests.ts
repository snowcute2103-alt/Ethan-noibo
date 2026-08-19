import 'server-only';
import { sql } from './db';
import type { Department } from './roles';

const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_IP_THRESHOLD = 5;

/** Chặn spam theo IP — không phân biệt username có tồn tại hay không, tránh dùng
 *  giới hạn này để dò tài khoản thật. */
export async function isResetRequestRateLimited(ip: string): Promise<boolean> {
  const rows = await sql.query(
    `SELECT count(*)::int AS n FROM password_reset_requests
     WHERE requested_ip = $1 AND created_at > now() - interval '${RATE_LIMIT_WINDOW_MINUTES} minutes'`,
    [ip]
  );
  return (rows[0]?.n ?? 0) >= RATE_LIMIT_IP_THRESHOLD;
}

/** Idempotent — nếu user đã có 1 yêu cầu đang chờ duyệt thì bỏ qua, không tạo thêm. */
export async function createResetRequest(userId: number, ip: string): Promise<void> {
  const existing = await sql.query(
    `SELECT id FROM password_reset_requests WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );
  if (existing[0]) return;

  await sql.query('INSERT INTO password_reset_requests (user_id, requested_ip) VALUES ($1, $2)', [userId, ip]);
}

/** Ghi lại lịch sử 1 yêu cầu đã được hệ thống tự xử lý xong (sinh mật khẩu mới +
 *  gửi email BGĐ thành công) — resolved_by để NULL vì không phải BGĐ bấm tay. */
export async function createAutoResolvedResetRequest(userId: number, ip: string): Promise<void> {
  await sql.query(
    `INSERT INTO password_reset_requests (user_id, requested_ip, status, resolved_at)
     VALUES ($1, $2, 'approved', now())`,
    [userId, ip]
  );
}

export interface PendingResetRequest {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  department: Department;
  createdAt: string;
}

export async function listPendingResetRequests(): Promise<PendingResetRequest[]> {
  const rows = await sql.query(
    `SELECT r.id, r.user_id, u.username, u.full_name, u.department, r.created_at::text AS created_at
     FROM password_reset_requests r
     JOIN users u ON u.id = r.user_id
     WHERE r.status = 'pending'
     ORDER BY r.created_at ASC`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    username: row.username,
    fullName: row.full_name,
    department: row.department,
    createdAt: row.created_at,
  }));
}

export interface ResetRequestRow {
  id: number;
  userId: number;
  status: 'pending' | 'approved' | 'dismissed';
}

export async function findResetRequestById(id: number): Promise<ResetRequestRow | null> {
  const rows = await sql.query('SELECT id, user_id, status FROM password_reset_requests WHERE id = $1', [id]);
  if (!rows[0]) return null;
  return { id: rows[0].id, userId: rows[0].user_id, status: rows[0].status };
}

export async function resolveResetRequest(
  id: number,
  status: 'approved' | 'dismissed',
  resolvedBy: number
): Promise<void> {
  await sql.query('UPDATE password_reset_requests SET status = $1, resolved_by = $2, resolved_at = now() WHERE id = $3', [
    status,
    resolvedBy,
    id,
  ]);
}
