/**
 * KD1: nhóm "Support Tiktok" (id=14) cần hiện lại cột Tên Acc — theo yêu
 * cầu, bật lại cột này cho riêng nhóm Support Tiktok (đã bị ẩn trước đó bởi
 * remove-account-name-column-kd1-support-tiktok.ts, không đụng nhóm khác).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

const TEAM_ID = 1; // kd1
const CATEGORY_ID = 14; // Support Tiktok

async function main() {
  const before = await sql.query(
    `SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 AND id = $2`,
    [TEAM_ID, CATEGORY_ID]
  );
  if (before.length !== 1) {
    throw new Error('Không tìm thấy category KD1/Support Tiktok — dừng lại.');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-add-accountname-kd1-support-tiktok-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ categories: before }, null, 2));
  console.log(`Đã backup vào ${backupPath}`);

  const [cat] = before;
  const current = cat.visible_columns as string[];
  if (current.includes('accountName')) {
    console.log(`"${cat.name}" (id=${cat.id}) đã có cột accountName sẵn, không cần đổi.`);
    return;
  }
  const newVisibleColumns = ['accountName', ...current];
  await sql.query(`UPDATE team_task_categories SET visible_columns = $1 WHERE id = $2 AND team_id = $3`, [
    newVisibleColumns,
    cat.id,
    TEAM_ID,
  ]);
  console.log(`Đã cập nhật "${cat.name}" (id=${cat.id}) -> visible_columns = ${JSON.stringify(newVisibleColumns)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
