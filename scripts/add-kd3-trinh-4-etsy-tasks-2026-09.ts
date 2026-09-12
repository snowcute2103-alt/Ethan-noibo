/** KD3 Support: từ 12/09 đến hết tháng 9/2026 (trừ Chủ nhật), thêm 4 task
 *  mới mỗi ngày cho Huỳnh Thị Diệp Trinh (id 66) — "Soạn đơn Etsy",
 *  "CSKH + Take care Etsy", "Note ads Etsy", "Tạo FL Etsy" — theo yêu cầu
 *  người quản lý KD3. Đây là 4 task hoàn toàn mới (chưa từng tồn tại), không
 *  phải nhân bản từ task cũ nên field phụ (account_name/channel/...) để
 *  trống như các task đơn giản khác của Trinh (vd "Note ADS tiktok"). Ghi
 *  log id các dòng vừa tạo để có thể rollback (xoá theo id) nếu cần, chỉ
 *  chạy 1 lần. */
import { writeFileSync } from 'node:fs';
import { sql } from '../lib/db';

const TEAM_ID = 3; // kd3
const ASSIGNEE_USER_ID = 66; // Huỳnh Thị Diệp Trinh
const CREATED_BY = 16; // TRẦN NGỌC MỸ DUYÊN — quản lý KD3
const TITLES = ['Soạn đơn Etsy', 'CSKH + Take care Etsy', 'Note ads Etsy', 'Tạo FL Etsy'];

// 12/09 -> 30/09/2026, trừ các Chủ nhật (13, 20, 27)
const DATES = [12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 28, 29, 30].map(
  (d) => `2026-09-${String(d).padStart(2, '0')}`
);

const LOG_PATH = `/Users/admin/Downloads/Ethan-noibo/db/backups/post-add-kd3-trinh-4-etsy-tasks-${new Date()
  .toISOString()
  .replace(/[:.]/g, '-')}.json`;

async function main() {
  const existing = await sql.query(
    `SELECT id, task_date, title FROM tasks
     WHERE team_id = $1 AND assignee_user_id = $2 AND title = ANY($3) AND task_date = ANY($4::date[])`,
    [TEAM_ID, ASSIGNEE_USER_ID, TITLES, DATES]
  );
  if (existing.length > 0) {
    console.log(`Đã có ${existing.length} task trùng, dừng lại để tránh tạo trùng:`, existing);
    return;
  }

  const rows = await sql.query(
    `INSERT INTO tasks (team_id, task_date, assignee_user_id, title, status, created_by)
     SELECT $1, d, $2, t, 'not_started', $3
     FROM unnest($4::date[]) AS d
     CROSS JOIN unnest($5::text[]) AS t
     RETURNING id, task_date, title`,
    [TEAM_ID, ASSIGNEE_USER_ID, CREATED_BY, DATES, TITLES]
  );
  console.log(`Đã tạo ${rows.length} task (kỳ vọng ${DATES.length * TITLES.length}).`);

  writeFileSync(LOG_PATH, JSON.stringify(rows, null, 2), 'utf-8');
  console.log(`Đã ghi log id vào ${LOG_PATH}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
