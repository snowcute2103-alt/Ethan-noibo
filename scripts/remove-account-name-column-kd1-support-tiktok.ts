/**
 * KD1: nhóm "Support Tiktok" (id=14) không dùng cột Tên ACC — theo yêu cầu,
 * ẩn cột này khỏi riêng nhóm Support Tiktok (không đụng Support Etsy hay
 * Media, dù các nhóm đó cũng có cột accountName).
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
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-remove-accountname-kd1-support-tiktok-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ categories: before }, null, 2));
  console.log(`Đã backup vào ${backupPath}`);

  const [cat] = before;
  const newVisibleColumns = (cat.visible_columns as string[]).filter((key) => key !== 'accountName');
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
