/**
 * Sửa dữ liệu cho các task bị code rollover CŨ (trước fix) ép cứng status
 * thành "in_progress" dù task gốc đang "not_started" — chỉ những task chưa
 * bị người dùng đụng vào sau lần rollover đó (updated_at = rolled_over_at)
 * mới được khôi phục lại status gốc, dựa trên changes.status.from trong
 * bản ghi personal_task_history event_type='rollover' gần nhất của task.
 *
 *   npx tsx --env-file=.env.local scripts/fix-rollover-forced-in-progress-2026-09.ts --dry-run   (mặc định)
 *   npx tsx --env-file=.env.local scripts/fix-rollover-forced-in-progress-2026-09.ts --apply
 */
import { sql } from '../lib/db';

interface Row {
  id: number;
  title: string;
  old_status: string;
}

async function main() {
  const isApply = process.argv.includes('--apply');

  const rows = (await sql.query(`
    SELECT t.id, t.title, h.changes->'status'->>'from' AS old_status
    FROM tasks t
    JOIN LATERAL (
      SELECT changes, created_at FROM personal_task_history
      WHERE task_id = t.id AND event_type = 'rollover'
      ORDER BY created_at DESC LIMIT 1
    ) h ON true
    WHERE t.status = 'in_progress'
      AND t.rolled_over_at IS NOT NULL
      AND t.updated_at = t.rolled_over_at
      AND h.changes->'status'->>'from' IS NOT NULL
      AND h.changes->'status'->>'from' != 'in_progress'
    ORDER BY t.id
  `)) as unknown as Row[];

  if (rows.length === 0) {
    console.log('Không có task nào cần sửa.');
    return;
  }

  console.log(`Tìm thấy ${rows.length} task bị ép sai status lúc rollover:`);
  for (const row of rows) {
    console.log(`  #${row.id} "${row.title}" — sẽ trả về "${row.old_status}"`);
  }

  if (!isApply) {
    console.log('\n(dry-run — chạy lại với --apply để ghi thật)');
    return;
  }

  for (const row of rows) {
    await sql.query(
      `WITH upd AS (
         UPDATE tasks SET status = $2, updated_at = now() WHERE id = $1
         RETURNING id
       )
       INSERT INTO personal_task_history (task_id, actor_user_id, event_type, changes)
       SELECT id, NULL, 'updated', jsonb_build_object(
         'status', jsonb_build_object('from', 'in_progress', 'to', $2::text)
       ) FROM upd`,
      [row.id, row.old_status]
    );
  }
  console.log(`\nĐã sửa xong ${rows.length} task.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
