/** Import idempotent task thật KD2 ngày 31/08/2026 từ ảnh Notion. */
import { sql } from '../lib/db';

type Category = 'Media' | 'Support';
type Task = {
  category: Category;
  assignee: string;
  title: string;
  account?: string;
  sourceChannel?: string;
  uploader?: string;
  videos?: number;
  product?: string;
};

const usernames: Record<string, string> = {
  Lan: 'lanpham02',
  Sơn: 'trongson250921',
  Vân: 'thuyvan',
  Phụng: 'phungdo0301',
  Thu: 'hongthu89',
  Sao: 'anhsao1392',
};

const media = (
  assignee: string,
  title: string,
  account: string,
  sourceChannel: string,
  uploader: string,
  videos: number,
  product = 'Playing Card',
): Task => ({ category: 'Media', assignee: usernames[assignee], title, account, sourceChannel, uploader, videos, product });

const support = (
  assignee: string,
  title: string,
  account?: string,
  sourceChannel?: string,
  uploader?: string,
  videos?: number,
  product?: string,
): Task => ({ category: 'Support', assignee: usernames[assignee], title, account, sourceChannel, uploader, videos, product });

const tasks: Task[] = [
  media('Sơn', 'Dolly Parton Card Skin (1)', 'Karen Grimsley', 'Kênh MKT1', 'Lan', 3, 'Card Skin'),
  media('Vân', 'Sophie Cunningham wrapping paper', 'Barbara Stout', 'Kênh MKT1', 'Sơn', 3, 'Wrapping Paper'),
  media('Vân', 'Sleep Token Playing card', 'Chris Rogers', 'Kênh MKT2', 'Sơn', 3),
  media('Vân', 'LOTR Playing Card', 'Nephtali Gonzalez', 'Kênh MKT1', 'Vân', 3),
  media('Vân', 'Country music legend PLC (mẫu mới)', 'Shemika Jones', 'Kênh MKT1', 'Phụng', 2),
  media('Vân', 'Country music legend PLC (combo 2 design)', 'Shemika Jones', 'Kênh MKT1', 'Phụng', 2),
  media('Vân', 'Country music legend PLC (combo 2 design)', 'Shemika Jones', 'Kênh MKT2', 'Phụng', 2),
  media('Vân', 'Country music legend PLC (mẫu cũ)', 'Shemika Jones', 'Kênh MKT2', 'Phụng', 2),
  media('Sơn', 'Dolly Parton Card Skin', 'Karen Grimsley', 'Kênh MKT2', 'Lan', 3, 'Card Skin'),
  media('Sơn', 'Dolly Parton Calendar', 'Anne Levendoski', 'Kênh chính', 'Thu', 2, 'Calendar'),
  media('Sơn', 'Dolly Parton Card Skin', 'Karen Grimsley', 'Kênh Chính', 'Lan', 3, 'Card Skin'),
  media('Sơn', 'Dolly Parton Calendar', 'Anne Levendoski', 'Kênh MKT1', 'Thu', 2, 'Calendar'),
  media('Sơn', 'Country music legend PLC', 'Shemika Jones', 'Kênh chính', 'Phụng', 2),
  media('Sơn', 'LOTR Playing Card', 'Nephtali Gonzalez', 'Kênh MKT2', 'Vân', 2),
  media('Sơn', 'Dungeon Crawler Wrapping paper', 'Derek Parker', 'Kênh MKT4', 'Sao', 2, 'Wrapping Paper'),
  media('Sơn', 'Country music legend PLC (combo 2 design)', 'Shemika Jones', 'Kênh chính', 'Phụng', 2),
  media('Lan', 'Dungeon Crawler Card skin (vid AI design)', 'Derek Parker', 'Kênh MKT2', 'Sao', 2, 'Card Skin'),
  media('Lan', 'Creepy Doll Wrapping paper', 'Aaron Macinnis', 'Kênh Chính', 'Sao', 2, 'Wrapping Paper'),
  media('Lan', 'Creepy paper Wrapping paper (christmas)', 'Ragan Stukenborg', 'Kênh MKT3', 'Thư', 2, 'Wrapping Paper'),
  media('Lan', 'Creepy paper Wrapping paper (christmas)', 'Ragan Stukenborg', 'Kênh chính', 'Thư', 2, 'Wrapping Paper'),
  media('Lan', 'Creepy paper Wrapping paper (christmas)', 'Ragan Stukenborg', 'Kênh MKT1', 'Thư', 2, 'Wrapping Paper'),
  media('Lan', 'Country music legend PLC', 'Shemika Jones', 'MKT3', 'Phụng', 2),
  media('Lan', 'LOTR Playing Card', 'Nephtali Gonzalez', 'Kênh MKT3', 'Vân', 2),

  support('Phụng', 'Tìm 54 design LOTR plc'),
  support('Thu', '2 vids Dolly Parton PJM', 'Taneka Joseph', 'Kênh MKT3', 'Giang', 2),
  support('Thu', '1 vid 3D HLW Doormat (1)', 'David Baker', undefined, undefined, 1),
  support('Thu', '• Soạn đơn clone CMS + đổi sku • Tạo Flash sale', 'Tiktok US'),
  support('Thu', '1 vid Funny Wrpp (1)', 'David Baker', undefined, 'Thu', 1),
  support('Thu', '2 vids Dolly Parton PJM (1)', 'Taneka Joseph', 'Kênh MKT4', 'Giang', 2),
  support('Thu', 'thêm 5 designs vào listings Dark Gothic', 'Timia Sims'),
  support('Thu', 'thêm 5 designs mới vào listing kênh', 'Cindy Buban'),
  support('Thu', '1 vid 3D HLW Doormat', 'David Baker', 'Kênh MKT1', 'Thu', 1),
  support('Sao', 'Up spam 50 lst suncatcher (HLW) (1)', 'Derek Parker', undefined, undefined, undefined, 'Sun Catcher'),
  support('Sao', 'Up spam 50 lst suncatcher (HLW) (1)', 'Christopher Dye', undefined, undefined, undefined, 'Sun Catcher'),
  support('Sao', 'Soạn đơn (UK), add tracking, tạo FS 5 shop'),
  support('Phụng', 'Gen 2 design +12 month grid Country Music'),
  support('Phụng', 'Soạn đơn, add tracking, support KH, đổi SKU', 'lucksigns69'),
  support('Phụng', 'Add 1 design vào listing kênh', 'Shemika Jones'),
  support('Phụng', 'Check shop health, trả lời review, refund', 'Jason Miklian / James Lawrence'),
  support('Phụng', 'Note ads US'),
];

async function main() {
  const [team] = await sql.query(`SELECT id FROM teams WHERE code = 'kd2'`);
  if (!team) throw new Error('Không tìm thấy KD2.');
  const teamId = team.id as number;

  const categories = await sql.query(
    `SELECT id, name FROM team_task_categories WHERE team_id = $1 AND name = ANY($2::text[])`,
    [teamId, ['Media', 'Support']],
  );
  const categoryIds = new Map(categories.map((row) => [String(row.name), row.id as number]));
  if (!categoryIds.has('Media') || !categoryIds.has('Support')) throw new Error('KD2 thiếu category Media hoặc Support.');

  const requestedUsers = [...new Set(tasks.map((task) => task.assignee))];
  const members = await sql.query(
    `SELECT u.id, u.username FROM team_members tm JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1 AND u.username = ANY($2::text[])`,
    [teamId, requestedUsers],
  );
  const memberIds = new Map(members.map((row) => [String(row.username), row.id as number]));
  const missing = requestedUsers.filter((username) => !memberIds.has(username));
  if (missing.length) throw new Error(`Thiếu thành viên KD2: ${missing.join(', ')}`);

  const [manager] = await sql.query(
    `SELECT user_id FROM team_members WHERE team_id = $1 AND role = 'manager' ORDER BY user_id LIMIT 1`,
    [teamId],
  );

  let created = 0;
  let skipped = 0;
  for (const task of tasks) {
    const values = [
      teamId,
      categoryIds.get(task.category),
      '2026-08-31',
      memberIds.get(task.assignee),
      task.account ?? null,
      task.title,
      task.uploader ?? null,
      task.videos ?? null,
      task.product ?? null,
      task.sourceChannel ? `Kênh: ${task.sourceChannel}` : null,
      (manager?.user_id as number | undefined) ?? null,
    ];
    const rows = await sql.query(
      `INSERT INTO tasks
         (team_id, category_id, task_date, assignee_user_id, account_name, title,
          channel, video_count, product, note, status, created_by)
       SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'done',$11
       WHERE NOT EXISTS (
         SELECT 1 FROM tasks
         WHERE team_id=$1 AND category_id=$2 AND task_date=$3 AND assignee_user_id=$4
           AND account_name IS NOT DISTINCT FROM $5::text AND title=$6
           AND channel IS NOT DISTINCT FROM $7::text
           AND video_count IS NOT DISTINCT FROM $8::integer
           AND product IS NOT DISTINCT FROM $9::text
           AND note IS NOT DISTINCT FROM $10::text
       ) RETURNING id`,
      values,
    );
    rows.length ? created++ : skipped++;
  }

  console.log(`KD2 31/08/2026: tạo ${created}, bỏ qua ${skipped}; tổng nguồn ${tasks.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
