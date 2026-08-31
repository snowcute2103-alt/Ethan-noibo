import { sql } from './db';

export type AuditAction =
  | 'user.create'
  | 'user.update'
  | 'user.deactivate'
  | 'user.reset_password'
  | 'user.unlock'
  | 'password_reset.dismiss'
  | 'permission.grant'
  | 'permission.revoke'
  | 'permission.backfill'
  | 'rule.create'
  | 'rule.update'
  | 'rule.delete'
  | 'announcement.create'
  | 'announcement.update'
  | 'announcement.delete'
  | 'announcement_permission.grant'
  | 'announcement_permission.revoke'
  | 'team_member.add'
  | 'team_member.remove'
  | 'team_member.role_change'
  | 'team_member.category_change'
  | 'team_category.create'
  | 'team_category.update'
  | 'team_category.delete'
  | 'personal_task.create'
  | 'personal_task.update'
  | 'personal_task.delete'
  | 'personal_task.duplicate';

/**
 * Allow-list nội dung ghi audit log — KHÔNG BAO GIỜ đưa mật khẩu/hash/SĐT/email
 * cá nhân vào đây, kể cả trong from/to. Field nhạy cảm bị lọc bỏ tự động.
 */
export interface AuditDetail {
  changedFields?: string[];
  from?: Record<string, string | number | boolean | null>;
  to?: Record<string, string | number | boolean | null>;
  docId?: string;
  note?: string;
}

const FORBIDDEN_KEYS = ['password', 'passwordHash', 'password_hash', 'phone', 'personalEmail', 'personal_email'];

function stripForbidden(
  obj: Record<string, string | number | boolean | null> | undefined
): Record<string, string | number | boolean | null> | undefined {
  if (!obj) return obj;
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!FORBIDDEN_KEYS.includes(key)) clean[key] = value;
  }
  return clean;
}

function sanitize(detail: AuditDetail): AuditDetail {
  return {
    ...detail,
    from: stripForbidden(detail.from),
    to: stripForbidden(detail.to),
  };
}

export async function logAdminAction(
  actorUserId: number | null,
  action: AuditAction,
  targetUserId: number | null,
  detail: AuditDetail = {}
): Promise<void> {
  const safeDetail = sanitize(detail);
  await sql.query('INSERT INTO admin_audit_log (actor_user_id, action, target_user_id, detail) VALUES ($1, $2, $3, $4)', [
    actorUserId,
    action,
    targetUserId,
    JSON.stringify(safeDetail),
  ]);
}

export interface AuditLogEntry {
  id: number;
  action: AuditAction;
  detail: AuditDetail;
  createdAt: string;
  actorFullName: string | null;
  actorUsername: string | null;
}

/** Nhật ký thao tác của BGĐ nhắm vào 1 user cụ thể (làm mục tiêu), mới nhất trước. */
export async function listAuditLogForUser(targetUserId: number, limit = 50): Promise<AuditLogEntry[]> {
  const rows = await sql.query(
    `SELECT l.id, l.action, l.detail, l.created_at,
            a.full_name AS actor_full_name, a.username AS actor_username
     FROM admin_audit_log l
     LEFT JOIN users a ON a.id = l.actor_user_id
     WHERE l.target_user_id = $1
     ORDER BY l.created_at DESC
     LIMIT $2`,
    [targetUserId, limit]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    id: row.id,
    action: row.action,
    detail: row.detail ?? {},
    createdAt: row.created_at,
    actorFullName: row.actor_full_name,
    actorUsername: row.actor_username,
  }));
}
