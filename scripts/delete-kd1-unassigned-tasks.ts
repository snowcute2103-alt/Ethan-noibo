/** Xoá toàn bộ task chưa gán người phụ trách (assignee_user_id NULL) của đội
 *  KD1 — theo yêu cầu người dùng dọn thẻ "Chưa gán" trong "Task theo người".
 *  Sao lưu ra JSON trước khi xoá, chỉ chạy 1 lần. */
import { writeFileSync } from 'node:fs';
import { sql } from '../lib/db';

const BACKUP_PATH =
  '/private/tmp/claude-501/-Users-admin-Downloads-Ethan-noibo/759a002b-b4d3-4e73-9cf5-f62c973d44c3/scratchpad/backup-kd1-unassigned-tasks-2026-09-02.json';

async function main() {
  const team = await sql.query(`SELECT id, name FROM teams WHERE code = 'kd1'`);
  if (team.length === 0) throw new Error('Không tìm thấy đội KD1');
  const teamId = team[0].id;

  const rows = await sql.query(`SELECT * FROM tasks WHERE team_id = $1 AND assignee_user_id IS NULL ORDER BY id`, [
    teamId,
  ]);
  console.log(`Tìm thấy ${rows.length} task chưa gán ở KD1 (team_id=${teamId}).`);
  if (rows.length === 0) {
    console.log('Không có gì để xoá.');
    return;
  }

  writeFileSync(BACKUP_PATH, JSON.stringify(rows, null, 2), 'utf-8');
  console.log(`Đã sao lưu ${rows.length} dòng vào ${BACKUP_PATH}`);

  const ids = rows.map((r) => r.id);
  const deleted = await sql.query(`DELETE FROM tasks WHERE id = ANY($1) RETURNING id`, [ids]);
  console.log(`Đã xoá ${deleted.length} task:`, deleted.map((r) => r.id));

  const remaining = await sql.query(
    `SELECT count(*)::int AS count FROM tasks WHERE team_id = $1 AND assignee_user_id IS NULL`,
    [teamId]
  );
  console.log(`Còn lại ${remaining[0].count} task chưa gán ở KD1 (kỳ vọng 0).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
