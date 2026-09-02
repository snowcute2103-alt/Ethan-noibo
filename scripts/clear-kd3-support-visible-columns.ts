/**
 * KD3: nhóm "Support" (id=6) đang hiện 4 cột tuỳ chọn (Nhãn phụ, Tên ACC, Sản
 * phẩm, Ghi chú) dù không có dữ liệu — theo yêu cầu, tab Support của riêng
 * đội KD3 chỉ cần giữ 4 cột cố định Ngày/Thành viên/Chủ đề/Trạng thái, ẩn hết
 * cột tuỳ chọn.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

const TEAM_ID = 3; // kd3
const CATEGORY_ID = 6; // Support

async function main() {
  const before = await sql.query(
    `SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 AND id = $2`,
    [TEAM_ID, CATEGORY_ID]
  );
  if (before.length !== 1) {
    throw new Error('Không tìm thấy category KD3/Support — dừng lại.');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-clear-kd3-support-visible-columns-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ categories: before }, null, 2));
  console.log(`Đã backup vào ${backupPath}`);

  const [cat] = before;
  await sql.query(`UPDATE team_task_categories SET visible_columns = '{}' WHERE id = $1 AND team_id = $2`, [cat.id, TEAM_ID]);
  console.log(`Đã cập nhật "${cat.name}" (id=${cat.id}) -> visible_columns = []`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
