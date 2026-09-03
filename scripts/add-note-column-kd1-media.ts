/**
 * KD1: nhóm "Media" thiếu cột "Ghi chú" (note) trong visible_columns — bật
 * thêm cột này theo yêu cầu user, giữ nguyên các cột hiện có.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

const TEAM_ID = 1; // kd1
const MEDIA_CATEGORY_NAME = 'Media';

async function main() {
  const before = await sql.query(
    `SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 AND name = $2`,
    [TEAM_ID, MEDIA_CATEGORY_NAME]
  );
  if (before.length !== 1) {
    throw new Error(`Không tìm thấy đúng 1 category "${MEDIA_CATEGORY_NAME}" của KD1 — dừng lại.`);
  }
  const media = before[0];
  if (media.visible_columns.includes('note')) {
    console.log('Media KD1 đã có cột note sẵn, không cần đổi.');
    return;
  }
  const nextColumns = [...media.visible_columns, 'note'];

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-add-note-kd1-media-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ categories: before }, null, 2));
  console.log(`Đã backup vào ${backupPath}`);

  await sql.query(`UPDATE team_task_categories SET visible_columns = $1 WHERE id = $2 AND team_id = $3`, [
    nextColumns,
    media.id,
    TEAM_ID,
  ]);
  console.log(`Đã cập nhật "Media" (id=${media.id}) -> visible_columns = ${JSON.stringify(nextColumns)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
