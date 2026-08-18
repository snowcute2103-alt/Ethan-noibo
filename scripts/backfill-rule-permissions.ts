/**
 * One-off: cấp quyền đọc `sop-all-print-product` cho đúng nhóm người từng thấy
 * tài liệu này theo quy tắc cũ (visibility: departments ['sx-in', 'kinh-doanh']),
 * để tránh khoảng trống mất quyền khi chuyển sang mô hình quyền theo từng người.
 *
 * Chạy 1 lần, SAU khi Phase 2 (import nhân viên thật) đã xong, TRƯỚC khi bật
 * code Phase 4 lên Production — xem thứ tự bắt buộc trong phase-04 của plan.
 *
 * npx tsx --env-file=.env.local scripts/backfill-rule-permissions.ts
 */
import { sql } from '../lib/db';

const DOC_ID = 'sop-all-print-product';
const LEGACY_DEPARTMENTS = ['sx-in', 'kinh-doanh'];

async function main() {
  const users = await sql.query(
    `SELECT id, username FROM users WHERE department = ANY($1) AND is_active = true`,
    [LEGACY_DEPARTMENTS]
  );

  console.log(`Tìm thấy ${users.length} user thuộc ${LEGACY_DEPARTMENTS.join(', ')}.`);

  let granted = 0;
  for (const user of users) {
    const result = await sql.query(
      `INSERT INTO rule_permissions (user_id, doc_id, granted_by)
       VALUES ($1, $2, NULL)
       ON CONFLICT (user_id, doc_id) DO NOTHING
       RETURNING user_id`,
      [user.id, DOC_ID]
    );
    if (result.length > 0) granted += 1;
  }

  await sql.query(
    `INSERT INTO admin_audit_log (actor_user_id, action, target_user_id, detail)
     VALUES (NULL, 'permission.backfill', NULL, $1)`,
    [JSON.stringify({ docId: DOC_ID, note: `Backfill ${granted}/${users.length} user theo quy tắc cũ` })]
  );

  console.log(`Đã cấp quyền mới cho ${granted}/${users.length} user (số còn lại đã có sẵn từ trước).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
