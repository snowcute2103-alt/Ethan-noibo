/** Import idempotent task thật của KD2 ngày 03/08/2026 từ bảng Task Tháng. */
import { sql } from '../lib/db';

type SourceTask = {
  category: 'Media' | 'Support'; assignee: string; accountName?: string;
  sourceChannel?: string; title: string; uploader?: string;
  videoCount?: number; product?: string;
};

const TASK_DATE = '2026-08-03';
const TASKS: SourceTask[] = [
  { category: 'Media', assignee: 'trongson250921', title: 'Gen AI mẫu mới', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Jason Miklian', sourceChannel: 'MKT2', title: 'AVATAR Playing card', uploader: 'Thu', videoCount: 1 },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Jason Miklian', sourceChannel: 'MKT2', title: 'Hollow Knight playing card', uploader: 'Thu', videoCount: 2 },
  { category: 'Media', assignee: 'trongson250921', accountName: 'Jason Miklian', sourceChannel: 'MKT4', title: 'AVATAR Playing card', uploader: 'Thu', videoCount: 2, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Derek Parker', sourceChannel: 'Kênh Chính', title: 'Dungeon Crawler Playing card', uploader: 'Sao', videoCount: 4, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT1', title: 'Sleep Token Playing card', uploader: 'Sơn', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Derek Parker', sourceChannel: 'Kênh MKT1', title: 'Dungeon Crawler Card skin', uploader: 'Sao', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Chris Rogers', sourceChannel: 'Kênh Chính', title: 'Sleep Token Playing card', uploader: 'Sơn', videoCount: 4, product: 'Playing Card' },
  { category: 'Media', assignee: 'thuyvan', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT2', title: 'Sleep Token Playing card', uploader: 'Sơn', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', accountName: 'Barbara Stout', sourceChannel: 'MKT2', title: 'Sleep Token Playing Cards', uploader: 'Lan', videoCount: 4, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', sourceChannel: 'Kênh AFF - Marta Rustam', title: 'Sleep Token Playing cards (3 design)', uploader: 'Vân', videoCount: 4, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT3', title: 'Sleep Token Playing cards (design 2)', uploader: 'Thư', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'trongson250921', accountName: 'Jason Miklian', sourceChannel: 'MKT4', title: 'RDR2 Playing card', uploader: 'Thu', videoCount: 1, product: 'Playing Card' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Derek Parker', sourceChannel: 'MKT2', title: 'Dungeon Crawler Playing card', uploader: 'Sao', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Chris Rogers', sourceChannel: 'Kênh MKT4', title: 'Sleep Token Playing card', uploader: 'Thư', videoCount: 3, product: 'Playing Card' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Barbara Stout', sourceChannel: 'MKT1', title: 'Sleep Token PLC (mẫu chị Thảo)', uploader: 'Lan', videoCount: 3, product: 'Calendar' },
  { category: 'Media', assignee: 'lanpham02', accountName: 'Barbara Stout', sourceChannel: 'Kênh Chính', title: 'Sleep Token PLC (mẫu chị Thảo)', uploader: 'Lan', videoCount: 3, product: 'Calendar' },

  { category: 'Support', assignee: 'hongthu89', accountName: 'Chancy Crenshaw', sourceChannel: 'Kênh MKT', title: '1 vid COD Ghosts Card skin', uploader: 'Thu', videoCount: 1, product: 'Playing Card' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Tiktok US', title: 'Check acc health & product rating các' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'James Lawrence', title: 'Gen mockup, up listing RE Playing car' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Tiktok US', title: 'Soạn đơn clone CMS + gửi clone 3 mã' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Tiktok US', title: 'Support tin nhắn KH: - Napoleon Hine' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'Barbara Stout', title: 'làm mockup ảnh main + thêm 3 mẫu c' },
  { category: 'Support', assignee: 'hongthu89', accountName: 'James Lawrence', title: 'research design + gen 8 mẫu + up list' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Import đơn patch, sticker' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Check review, refund 5 shop, tạo FS 5' },
  { category: 'Support', assignee: 'anhsao1392', accountName: 'Chris Rogers', title: 'Thêm 1 design & sửa ảnh variation ->' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Soạn đơn (UK), add tracking, support' },
  { category: 'Support', assignee: 'anhsao1392', title: 'Check đơn 6shop (không CMS), print' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh MKT3 - latricialsmith', title: 'RDR2 Playing Card', uploader: 'Phụng', videoCount: 1, product: 'Playing Card' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh MKT3 - latricialsmith', title: 'ATLA Playing card', uploader: 'Phụng', videoCount: 2, product: 'Playing Card' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'lucksigns69', title: 'Soạn đơn, add tracking, support KH' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian / Nephtali Gonzalez', title: 'Check shop health, review, refund' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh Chính - annepherson', title: 'ATLA Playing card', uploader: 'Phụng', videoCount: 2, product: 'Playing Card' },
  { category: 'Support', assignee: 'phungdo0301', accountName: 'Jason Miklian', sourceChannel: 'Kênh Chính - annepherson', title: 'RDR2 Playing Card', uploader: 'Phụng', videoCount: 2, product: 'Playing Card' },
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
  if (!categoryIds.has('Media') || !categoryIds.has('Support')) throw new Error('KD2 thiếu nhóm Media hoặc Support.');

  const usernames = [...new Set(TASKS.map((task) => task.assignee))];
  const memberRows = await sql.query(
    `SELECT u.id, u.username FROM team_members tm JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1 AND u.username = ANY($2::text[])`, [teamId, usernames]
  );
  const memberIds = new Map(memberRows.map((row) => [String(row.username), row.id as number]));
  const missing = usernames.filter((username) => !memberIds.has(username));
  if (missing.length) throw new Error(`Thiếu thành viên KD2: ${missing.join(', ')}`);
  const managers = await sql.query(
    `SELECT user_id FROM team_members WHERE team_id = $1 AND role = 'manager' ORDER BY user_id LIMIT 1`, [teamId]
  );
  const createdBy = (managers[0]?.user_id as number | undefined) ?? null;

  let created = 0;
  let skipped = 0;
  for (const task of TASKS) {
    const values = [teamId, categoryIds.get(task.category), TASK_DATE, memberIds.get(task.assignee),
      task.accountName ?? null, task.title, task.uploader ?? null, task.videoCount ?? null,
      task.product ?? null, task.sourceChannel ? `Kênh: ${task.sourceChannel}` : null, createdBy];
    const rows = await sql.query(
      `INSERT INTO tasks (team_id, category_id, task_date, assignee_user_id, account_name, title,
          channel, video_count, product, note, status, created_by)
       SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'done',$11
       WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE team_id=$1 AND category_id=$2 AND task_date=$3
         AND assignee_user_id=$4 AND account_name IS NOT DISTINCT FROM $5::text AND title=$6
         AND channel IS NOT DISTINCT FROM $7::text AND video_count IS NOT DISTINCT FROM $8::integer
         AND product IS NOT DISTINCT FROM $9::text AND note IS NOT DISTINCT FROM $10::text)
       RETURNING id`, values
    );
    if (rows.length) created += 1; else skipped += 1;
  }
  console.log(`KD2 ${TASK_DATE}: tạo ${created} task thật, bỏ qua ${skipped} task đã tồn tại.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
