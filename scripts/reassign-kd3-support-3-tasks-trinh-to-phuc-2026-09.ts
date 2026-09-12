/** KD3 Support: từ thứ 3 08/09 đến hết tháng 9/2026, đổi người phụ trách 3
 *  task lặp lại hàng ngày ("Soạn đơn + clone tiktok USUK", "Take care
 *  SPS+CSKH tiktok USUK", "Note ADS tiktok") từ Huỳnh Thị Diệp Trinh (id 66)
 *  sang Chu Hoàng Phúc (id 86) — theo yêu cầu người quản lý KD3. Các dòng
 *  trước 08/09 giữ nguyên Trinh. Sao lưu ra db/backups trước khi update, chỉ
 *  chạy 1 lần. */
import { writeFileSync } from 'node:fs';
import { sql } from '../lib/db';

const TEAM_ID = 3; // kd3
const FROM_USER_ID = 66; // Huỳnh Thị Diệp Trinh
const TO_USER_ID = 86; // Chu Hoàng Phúc
const TITLES = ['Soạn đơn + clone tiktok USUK', 'Take care SPS+CSKH tiktok USUK', 'Note ADS tiktok'];
const START_DATE = '2026-09-08';
const END_DATE = '2026-09-30';

const BACKUP_PATH = `/Users/admin/Downloads/Ethan-noibo/db/backups/pre-reassign-kd3-support-3-tasks-to-phuc-${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')}.json`;

async function main() {
  const rows = await sql.query(
    `SELECT * FROM tasks
     WHERE team_id = $1 AND assignee_user_id = $2 AND title = ANY($3)
       AND task_date >= $4 AND task_date <= $5
     ORDER BY task_date, title, id`,
    [TEAM_ID, FROM_USER_ID, TITLES, START_DATE, END_DATE]
  );
  console.log(`Tìm thấy ${rows.length} task khớp (Trinh, 3 chủ đề, ${START_DATE}..${END_DATE}).`);
  if (rows.length === 0) {
    console.log('Không có gì để đổi.');
    return;
  }

  writeFileSync(BACKUP_PATH, JSON.stringify(rows, null, 2), 'utf-8');
  console.log(`Đã sao lưu ${rows.length} dòng vào ${BACKUP_PATH}`);

  const ids = rows.map((r) => r.id);
  const updated = await sql.query(
    `UPDATE tasks SET assignee_user_id = $1, updated_at = now() WHERE id = ANY($2) RETURNING id, task_date, title`,
    [TO_USER_ID, ids]
  );
  console.log(`Đã đổi ${updated.length} task sang Phúc (user_id=${TO_USER_ID}).`);

  const remaining = await sql.query(
    `SELECT count(*)::int AS c FROM tasks
     WHERE team_id = $1 AND assignee_user_id = $2 AND title = ANY($3)
       AND task_date >= $4 AND task_date <= $5`,
    [TEAM_ID, FROM_USER_ID, TITLES, START_DATE, END_DATE]
  );
  console.log(`Còn lại của Trinh trong khoảng này (kỳ vọng 0): ${remaining[0].c}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
