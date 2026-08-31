/**
 * Import task thật của KD2 ngày 01/08/2026 từ bảng Task Tháng.
 *
 * Script idempotent: một dòng có đầy đủ nội dung giống dữ liệu nguồn sẽ được
 * bỏ qua khi chạy lại. Cột "Kênh" của bảng nguồn được lưu trong note vì bảng
 * tasks hiện chỉ có field channel dành cho cột "Up kênh".
 *
 * npx tsx --env-file=.env.local scripts/import-kd2-tasks-2026-08-01.ts
 */
import { sql } from '../lib/db';

type SourceTask = {
  category: 'Media' | 'Support';
  assignee: string;
  accountName?: string;
  sourceChannel?: string;
  title: string;
  uploader?: string;
  videoCount?: number;
  product?: string;
};

const TASK_DATE = '2026-08-01';

const TASKS: SourceTask[] = [
  { category: 'Media', assignee: 'lanpham02', accountName: 'Barbara Stout', title: 'spy mẫu làm Dean Dilaurentis calendar' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Barbara Stout', sourceChannel: 'Kênh Chính', title: 'Off Campus Graham Calendar', uploader: 'Lan', videoCount: 3, product: 'Calendar' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Barbara Stout', sourceChannel: 'MKT1', title: 'Off Campus Graham Calendar', uploader: 'Lan', videoCount: 2, product: 'Calendar' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Jason Miklian', sourceChannel: 'MKT2', title: 'Hollow Knight Playing card', uploader: 'Thu', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT4', title: 'Sleep Token Playing card', uploader: 'Thư', videoCount: 4, product: 'Playing Card' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Derek Parker', sourceChannel: 'MKT1', title: 'Dungeon Crawler PLC', uploader: 'Sao', videoCount: 4, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', title: 'phụ đóng hàng bên VP3 (nếu cần) (1)', product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', accountName: 'Jason Miklian', sourceChannel: 'MKT4', title: 'RDR2 Playing card (mẫu mới)', uploader: 'Thu', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT3', title: 'Sleep Token Playing card', uploader: 'Thư', videoCount: 5, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', sourceChannel: 'Kênh AFF - Marta Rustam', title: 'Sleep Token Playing cards', uploader: 'Vân', videoCount: 5, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', accountName: 'Derek Parker', sourceChannel: 'MKT2', title: 'Dungeon Crawler Playing Cards', uploader: 'Sao', videoCount: 5, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT2', title: 'Sleep Token Playing card (1)', uploader: 'Sơn', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Chris Rogers', sourceChannel: 'Kênh Chính', title: 'Sleep Token Playing card (1)', uploader: 'Sơn', videoCount: 5, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT1', title: 'Sleep Token Playing card (1)', uploader: 'Sơn', videoCount: 5, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Derek Parker', sourceChannel: 'MKT4', title: 'Dungeon Crawler Playing Cards (1)', uploader: 'Sao', videoCount: 4, product: 'Playing Card' },

  { category: 'Support', assignee: 'phungdo0301', accountName: 'Derek Parker', title: 'Gen mockup, sửa listing kênh DCC PLC' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'lucksigns69', title: 'Up 2 listing DCC playing card' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh MKT3 - latricialsmith', title: 'ATLA Playing card', uploader: 'Phụng', videoCount: 2, product: 'Playing Card' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh Chính - annepherson', title: 'ATLA Playing card', uploader: 'Phụng', videoCount: 2, product: 'Playing Card' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', title: 'Sửa listing kênh ATLA PLC' },
  { category: 'Support', assignee: 'anhsao1392', accountName: 'Chris Rogers', title: 'Thêm 1 design & sửa ảnh variation ->' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh Chính - annepherson', title: 'RDR2 Playing Card', uploader: 'Phụng', videoCount: 2, product: 'Playing Card' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian / Nephtali Gonzalez', title: 'Check shop health, review, refund' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'lucksigns69', title: 'Soạn đơn, add tracking, support KH' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh MKT3 - latricialsmith', title: 'RDR2 Playing Card', uploader: 'Phụng', videoCount: 2, product: 'Playing Card' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Tiktok US', title: '• Soạn đơn clone CMS • Tạo Flash sale' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Barbara Stout', title: 'gen 16 design mới + làm mockup + up listing' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Derek Parker', title: 'research + gen mẫu mặt sau Dungeon Crawler' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Tiktok US', title: 'Check acc health & product rating các shop' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Check đơn 6shop (không CMS), print đơn' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Soạn đơn (UK), add tracking, support KH' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Import đơn patch, sticker (1)' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Check review, refund 5 shop, tạo FS 5 shop' },
];

async function main() {
  const teamRows = await sql.query(`SELECT id FROM teams WHERE code = 'kd2'`);
  if (!teamRows[0]) throw new Error('Không tìm thấy đội KD2.');
  const teamId = teamRows[0].id as number;

  const categoryRows = await sql.query(
    `SELECT id, name FROM team_task_categories WHERE team_id = $1 AND name = ANY($2::text[])`,
    [teamId, ['Media', 'Support']]
  );
  const categoryIds = new Map(categoryRows.map((row) => [String(row.name), row.id as number]));
  if (!categoryIds.has('Media') || !categoryIds.has('Support')) {
    throw new Error('KD2 phải có đủ hai nhóm Media và Support trước khi import.');
  }

  const usernames = [...new Set(TASKS.map((task) => task.assignee))];
  const memberRows = await sql.query(
    `SELECT u.id, u.username
       FROM team_members tm JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1 AND u.username = ANY($2::text[])`,
    [teamId, usernames]
  );
  const memberIds = new Map(memberRows.map((row) => [String(row.username), row.id as number]));
  const missingMembers = usernames.filter((username) => !memberIds.has(username));
  if (missingMembers.length > 0) throw new Error(`Thiếu thành viên KD2: ${missingMembers.join(', ')}`);

  const managerRows = await sql.query(
    `SELECT user_id FROM team_members WHERE team_id = $1 AND role = 'manager' ORDER BY user_id LIMIT 1`,
    [teamId]
  );
  const createdBy = (managerRows[0]?.user_id as number | undefined) ?? null;

  let created = 0;
  let skipped = 0;
  for (const task of TASKS) {
    const values = [
      teamId,
      categoryIds.get(task.category),
      TASK_DATE,
      memberIds.get(task.assignee),
      task.accountName ?? null,
      task.title,
      task.uploader ?? null,
      task.videoCount ?? null,
      task.product ?? null,
      task.sourceChannel ? `Kênh: ${task.sourceChannel}` : null,
      createdBy,
    ];
    const rows = await sql.query(
      `INSERT INTO tasks
         (team_id, category_id, task_date, assignee_user_id, account_name, title,
          channel, video_count, product, note, status, created_by)
       SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'done', $11
       WHERE NOT EXISTS (
         SELECT 1 FROM tasks
          WHERE team_id = $1 AND category_id = $2 AND task_date = $3
            AND assignee_user_id = $4
            AND account_name IS NOT DISTINCT FROM $5::text
            AND title = $6
            AND channel IS NOT DISTINCT FROM $7::text
            AND video_count IS NOT DISTINCT FROM $8::integer
            AND product IS NOT DISTINCT FROM $9::text
            AND note IS NOT DISTINCT FROM $10::text
       )
       RETURNING id`,
      values
    );
    if (rows.length > 0) created += 1;
    else skipped += 1;
  }

  console.log(`KD2 ${TASK_DATE}: tạo ${created} task thật, bỏ qua ${skipped} task đã tồn tại.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
