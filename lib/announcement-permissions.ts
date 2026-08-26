import 'server-only';
import { sql } from './db';
import type { Tier } from './roles';

/** Cấp quyền đọc thêm cho 1 người cụ thể, ngoài phạm vi khối đã chọn ở Announcement.visibility.
 *  Cùng nguyên lý với rule-permissions.ts nhưng announcement_id là INTEGER thay vì doc_id TEXT. */
export async function announcementIdsVisibleTo(userId: number, tier: Tier): Promise<Set<number> | 'all'> {
  if (tier === 'full') return 'all';
  const rows = await sql.query('SELECT announcement_id FROM announcement_permissions WHERE user_id = $1', [userId]);
  return new Set(rows.map((r) => r.announcement_id as number));
}

export async function grantAnnouncementPermission(
  userId: number,
  announcementId: number,
  grantedBy: number | null
): Promise<void> {
  await sql.query(
    'INSERT INTO announcement_permissions (user_id, announcement_id, granted_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, announcement_id) DO NOTHING',
    [userId, announcementId, grantedBy]
  );
}

export async function revokeAnnouncementPermission(userId: number, announcementId: number): Promise<void> {
  await sql.query('DELETE FROM announcement_permissions WHERE user_id = $1 AND announcement_id = $2', [
    userId,
    announcementId,
  ]);
}

export async function listAnnouncementPermissions(announcementId: number): Promise<number[]> {
  const rows = await sql.query('SELECT user_id FROM announcement_permissions WHERE announcement_id = $1', [
    announcementId,
  ]);
  return rows.map((r) => r.user_id as number);
}
