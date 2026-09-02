/**
 * KD1: nhóm "Support Etsy" (id=13) không có dữ liệu ở cột Sản phẩm — theo
 * yêu cầu, ẩn cột này khỏi riêng nhóm Support Etsy (không đụng Support
 * Tiktok hay Media, dù 2 nhóm đó cũng có cột product).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

const TEAM_ID = 1; // kd1
const CATEGORY_ID = 13; // Support Etsy

async function main() {
  const before = await sql.query(
    `SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 AND id = $2`,
    [TEAM_ID, CATEGORY_ID]
  );
  if (before.length !== 1) {
    throw new Error('Không tìm thấy category KD1/Support Etsy — dừng lại.');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-remove-product-kd1-support-etsy-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ categories: before }, null, 2));
  console.log(`Đã backup vào ${backupPath}`);

  const [cat] = before;
  const newVisibleColumns = (cat.visible_columns as string[]).filter((key) => key !== 'product');
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
