/**
 * KD1: "Support Etsy" (id=13) và "Support Tiktok" (id=14) được tạo với
 * visible_columns rỗng — task ở 2 nhóm này có dữ liệu thật ở Tên Acc/Sản
 * phẩm/Nhãn phụ/Link mẫu/Ghi chú nhưng bị ẩn hết khi xem đúng tab (chỉ tab
 * "Tất cả" mới thấy vì fallback hiện mọi cột). Bật lại đúng 5 cột có dữ liệu
 * cho cả 2 nhóm — không đụng channel/videoCount vì 2 cột đó 0% có dữ liệu ở
 * cả 2 nhóm (đặc thù Media, không phải Support).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

const TEAM_ID = 1; // kd1
const CATEGORY_IDS = [13, 14];
const NEW_VISIBLE_COLUMNS = ['accountName', 'product', 'optionTag', 'referenceLink', 'note'];

async function main() {
  const before = await sql.query(
    `SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 AND id = ANY($2)`,
    [TEAM_ID, CATEGORY_IDS]
  );
  if (before.length !== CATEGORY_IDS.length) {
    throw new Error(`Không tìm thấy đủ ${CATEGORY_IDS.length} category — dừng lại.`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-fix-kd1-support-visible-columns-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ categories: before }, null, 2));
  console.log(`Đã backup vào ${backupPath}`);

  for (const cat of before) {
    await sql.query(`UPDATE team_task_categories SET visible_columns = $1 WHERE id = $2 AND team_id = $3`, [
      NEW_VISIBLE_COLUMNS,
      cat.id,
      TEAM_ID,
    ]);
    console.log(`Đã cập nhật "${cat.name}" (id=${cat.id}) -> visible_columns = ${JSON.stringify(NEW_VISIBLE_COLUMNS)}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
