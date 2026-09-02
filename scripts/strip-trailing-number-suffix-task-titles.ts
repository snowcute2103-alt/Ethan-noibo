/**
 * Nhiều task của cả 6 đội KD bị lặp thao tác duplicate/import để lại đuôi
 * số cuối chủ đề kiểu "Note ADS (1)" hoặc thiếu dấu đóng ngoặc "Soạn đơn +
 * CSKH (1" — không mang nghĩa gì, chỉ do công cụ tạo bản sao tự thêm vào.
 * Xoá đuôi này (và khoảng trắng liền trước) khỏi title, chỉ áp dụng cho
 * task thuộc 1 trong 6 đội KD (team_id IS NOT NULL), không đụng task cá
 * nhân (owner_user_id).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

const TRAILING_NUMBER_PATTERN = /\s*\([0-9]+\)?$/;

async function main() {
  const before = await sql.query(
    `SELECT id, team_id, title FROM tasks WHERE team_id IS NOT NULL AND title ~ '\\s*\\([0-9]+\\)?$' ORDER BY id`,
    []
  );
  if (before.length === 0) {
    console.log('Không có task nào khớp — không cần cập nhật.');
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(__dirname, '..', 'db', 'backups', `pre-strip-trailing-number-task-titles-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({ tasks: before }, null, 2));
  console.log(`Đã backup ${before.length} task vào ${backupPath}`);

  let updated = 0;
  for (const task of before) {
    const newTitle = task.title.replace(TRAILING_NUMBER_PATTERN, '');
    if (newTitle === task.title || !newTitle.trim()) continue;
    await sql.query(`UPDATE tasks SET title = $1 WHERE id = $2`, [newTitle, task.id]);
    updated += 1;
  }
  console.log(`Đã cập nhật ${updated}/${before.length} task.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
