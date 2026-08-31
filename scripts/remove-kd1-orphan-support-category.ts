/**
 * KD1 có category "Support" (id=2) không còn thành viên nào được xếp vào
 * (team_members.category_id) — 2 người Support thật của KD1 đã được tách
 * riêng vào "Support Etsy"/"Support Tiktok" từ trước, nên tab "Support" cũ
 * luôn hiện rỗng trên UI. Xoá category rỗng này theo yêu cầu người dùng.
 * 176 task còn set category_id=2 (dữ liệu cũ trước khi tách nhóm) sẽ tự về
 * NULL nhờ FK ON DELETE SET NULL — không ảnh hưởng lọc tab trên UI vì lọc
 * theo category_id của NGƯỜI PHỤ TRÁCH (team_members.category_id), không
 * theo category_id của từng task.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

async function main() {
  const teamId = 1; // kd1

  const categoryRows = await sql.query(
    `SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 AND name = 'Support'`,
    [teamId]
  );
  if (!categoryRows[0]) {
    console.log('Không tìm thấy category "Support" cho KD1 — có thể đã xoá trước đó.');
    return;
  }
  const category = categoryRows[0];

  const memberRows = await sql.query(`SELECT user_id FROM team_members WHERE team_id = $1 AND category_id = $2`, [
    teamId,
    category.id,
  ]);
  if (memberRows.length > 0) {
    throw new Error(`Còn ${memberRows.length} thành viên đang ở category này — dừng lại, không xoá.`);
  }

  const taskRows = await sql.query(`SELECT id FROM tasks WHERE team_id = $1 AND category_id = $2`, [teamId, category.id]);
  const taskIds = taskRows.map((r: any) => r.id as number);

  const backup = { category, affectedTaskIds: taskIds };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-remove-kd1-support-category-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Đã backup vào ${backupPath} (category id=${category.id}, ${taskIds.length} task sẽ về category_id=NULL).`);

  await sql.query(`DELETE FROM team_task_categories WHERE id = $1 AND team_id = $2`, [category.id, teamId]);
  console.log('Đã xoá category "Support" (id=%d) khỏi KD1.', category.id);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
