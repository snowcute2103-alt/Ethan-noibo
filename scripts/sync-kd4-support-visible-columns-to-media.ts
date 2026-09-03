/**
 * KD4: nhóm "Support" (id=8) đang hiện cột khác nhóm "Media" (id=7) dù cùng
 * nghiệp vụ bán hàng của đội — theo yêu cầu user, đổi Support dùng đúng bộ
 * cột của Media (Tên Acc, SL Listing/channel, SL VID, Sản phẩm).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

const TEAM_ID = 4; // kd4
const MEDIA_CATEGORY_ID = 7;
const SUPPORT_CATEGORY_ID = 8;

async function main() {
  const before = await sql.query(
    `SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 AND id = ANY($2)`,
    [TEAM_ID, [MEDIA_CATEGORY_ID, SUPPORT_CATEGORY_ID]]
  );
  if (before.length !== 2) {
    throw new Error(`Không tìm thấy đủ 2 category (Media/Support) của KD4 — dừng lại.`);
  }

  const media = before.find((c: any) => c.id === MEDIA_CATEGORY_ID);
  if (!media) throw new Error('Không tìm thấy category Media của KD4.');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-sync-kd4-support-visible-columns-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ categories: before }, null, 2));
  console.log(`Đã backup vào ${backupPath}`);

  await sql.query(`UPDATE team_task_categories SET visible_columns = $1 WHERE id = $2 AND team_id = $3`, [
    media.visible_columns,
    SUPPORT_CATEGORY_ID,
    TEAM_ID,
  ]);
  console.log(`Đã cập nhật "Support" (id=${SUPPORT_CATEGORY_ID}) -> visible_columns = ${JSON.stringify(media.visible_columns)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
