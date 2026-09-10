/**
 * Điền completed_at cho các task ĐÃ xong từ trước khi cột này tồn tại —
 * lấy từ bản ghi personal_task_history gần nhất có status đổi thành 'done'
 * (event_type='updated', changes.status.to='done'), quy đổi created_at sang
 * ngày giờ VN. Task đã xong nhưng KHÔNG có bản ghi lịch sử như vậy (vd tạo
 * thẳng ở trạng thái done, hoặc mất lịch sử) được bỏ qua — lúc đọc board đã
 * tự fallback về task_date (xem BUCKET_DATE_EXPR ở lib/tasks.ts), không mất
 * hiển thị, chỉ có điều xếp theo ngày dự kiến thay vì ngày xong thật.
 *
 *   npx tsx --env-file=.env.local scripts/backfill-completed-at-2026-09.ts --dry-run   (mặc định)
 *   npx tsx --env-file=.env.local scripts/backfill-completed-at-2026-09.ts --apply
 */
import { sql } from '../lib/db';

interface Row {
  id: number;
  title: string;
  task_date: string;
  derived_completed_at: string;
}

async function main() {
  const isApply = process.argv.includes('--apply');

  const rows = (await sql.query(`
    WITH last_done_event AS (
      SELECT DISTINCT ON (task_id) task_id, (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS done_date
      FROM personal_task_history
      WHERE event_type = 'updated' AND changes->'status'->>'to' = 'done'
      ORDER BY task_id, created_at DESC
    )
    SELECT t.id, t.title, t.task_date::text, e.done_date::text AS derived_completed_at
    FROM tasks t
    JOIN last_done_event e ON e.task_id = t.id
    WHERE t.status = 'done' AND t.completed_at IS NULL
    ORDER BY t.id
  `)) as unknown as Row[];

  if (rows.length === 0) {
    console.log('Không có task nào cần điền completed_at.');
    return;
  }

  console.log(`Tìm thấy ${rows.length} task đã xong chưa có completed_at:`);
  for (const row of rows) {
    console.log(`  #${row.id} "${row.title}" — task_date ${row.task_date}, xong thật ${row.derived_completed_at}`);
  }

  if (!isApply) {
    console.log('\n(dry-run — chạy lại với --apply để ghi thật)');
    return;
  }

  await sql.query(`
    WITH last_done_event AS (
      SELECT DISTINCT ON (task_id) task_id, (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS done_date
      FROM personal_task_history
      WHERE event_type = 'updated' AND changes->'status'->>'to' = 'done'
      ORDER BY task_id, created_at DESC
    )
    UPDATE tasks t
    SET completed_at = e.done_date
    FROM last_done_event e
    WHERE e.task_id = t.id AND t.status = 'done' AND t.completed_at IS NULL
  `);
  console.log(`\nĐã điền xong ${rows.length} task.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
