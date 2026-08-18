import 'server-only';
import { sql } from './db';
import type { Tier } from './roles';

/**
 * Trả về danh sách doc_id user được đọc, hoặc 'all' nếu user là BGĐ (tier full).
 * LƯU Ý: 'all' ở đây dựa vào CHECK constraint (department='bgd') = (tier='full')
 * ở Phase 1 — hễ constraint đó còn tồn tại thì tier='full' luôn đồng nghĩa BGĐ,
 * khớp với quy tắc canView() hiện tại (bypass theo department==='bgd'). Nếu sau
 * này nới lỏng constraint đó, phải rà lại chỗ này.
 */
export async function docIdsVisibleTo(userId: number, tier: Tier): Promise<Set<string> | 'all'> {
  if (tier === 'full') return 'all';
  const rows = await sql.query('SELECT doc_id FROM rule_permissions WHERE user_id = $1', [userId]);
  return new Set(rows.map((r) => r.doc_id as string));
}

export async function grantPermission(userId: number, docId: string, grantedBy: number | null): Promise<void> {
  await sql.query(
    'INSERT INTO rule_permissions (user_id, doc_id, granted_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, doc_id) DO NOTHING',
    [userId, docId, grantedBy]
  );
}

export async function revokePermission(userId: number, docId: string): Promise<void> {
  await sql.query('DELETE FROM rule_permissions WHERE user_id = $1 AND doc_id = $2', [userId, docId]);
}

export async function listPermissionsForDoc(docId: string): Promise<number[]> {
  const rows = await sql.query('SELECT user_id FROM rule_permissions WHERE doc_id = $1', [docId]);
  return rows.map((r) => r.user_id as number);
}
