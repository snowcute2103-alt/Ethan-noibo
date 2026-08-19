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
  | 'permission.backfill';

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
