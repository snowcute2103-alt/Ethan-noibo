/**
 * Khôi phục task_date bị code rollover CŨ (trước fix) ghi đè thành hôm nay
 * mỗi ngày task chưa xong. Lấy ngày gốc thật từ bản ghi personal_task_history
 * event_type='created' SỚM NHẤT của task (đáng tin cậy tuyệt đối, ghi 1 lần
 * duy nhất lúc tạo) — KHÔNG dùng cột original_task_date vì cột này chỉ bắt
 * đầu được ghi từ lần rollover thứ 2 trở đi (lần rollover đầu tiên của
 * nhiều task xảy ra từ TRƯỚC KHI cột original_task_date tồn tại, nên giá
 * trị nó lưu là task_date SAU lần rollover đầu, không phải ngày gốc thật).
 *
 * Xoá 2 cờ rollover (rolled_over_at, original_task_date) vì từ nay hệ thống
 * không còn ghi đè task_date nữa — "trễ" được tính thẳng từ so sánh ngày.
 *
 *   npx tsx --env-file=.env.local scripts/fix-rollover-task-date-2026-09.ts --dry-run   (mặc định)
 *   npx tsx --env-file=.env.local scripts/fix-rollover-task-date-2026-09.ts --apply
 */
import { sql } from '../lib/db';

interface Row {
  id: number;
  title: string;
  current_task_date: string;
  true_task_date: string;
}

const SELECT_AFFECTED = `
  SELECT t.id, t.title, t.task_date::text AS current_task_date, h.changes->>'taskDate' AS true_task_date
  FROM tasks t
  JOIN LATERAL (
    SELECT changes FROM personal_task_history
    WHERE task_id = t.id AND event_type = 'created'
    ORDER BY created_at ASC LIMIT 1
  ) h ON true
  WHERE t.rolled_over_at IS NOT NULL AND h.changes->>'taskDate' IS NOT NULL
  ORDER BY t.id
`;

async function main() {
  const isApply = process.argv.includes('--apply');

  const rows = (await sql.query(SELECT_AFFECTED)) as unknown as Row[];

  if (rows.length === 0) {
    console.log('Không có task nào cần khôi phục.');
    return;
  }

  console.log(`Tìm thấy ${rows.length} task bị rollover cũ ghi đè task_date:`);
  for (const row of rows) {
    console.log(`  #${row.id} "${row.title}" — ${row.current_task_date} sẽ trả về ${row.true_task_date}`);
  }

  if (!isApply) {
    console.log('\n(dry-run — chạy lại với --apply để ghi thật)');
    return;
  }

  await sql.query(`
    WITH true_dates AS (${SELECT_AFFECTED})
    UPDATE tasks t
    SET task_date = d.true_task_date::date, rolled_over_at = NULL, original_task_date = NULL, updated_at = now()
    FROM true_dates d
    WHERE d.id = t.id
  `);
  console.log(`\nĐã khôi phục xong ${rows.length} task.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
