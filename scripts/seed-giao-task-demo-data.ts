/**
 * One-off: tạo dữ liệu task giả cho cả 6 đội kinh doanh (KD1..KD6) để test
 * giao diện Giao Task, mô phỏng theo mẫu Notion "Task Tháng" thật (nhóm
 * Media / Support, tên acc, sản phẩm, SL VID, status...).
 *
 * Chỉ tự dò team + thành viên đang có sẵn trong DB (không hardcode id) —
 * đội nào chưa có thành viên sẽ bị bỏ qua và log cảnh báo. Đội nào đã có sẵn
 * task thì bỏ qua (tránh seed trùng khi chạy lại nhiều lần).
 *
 * npx tsx --env-file=.env.local scripts/seed-giao-task-demo-data.ts
 */
import { sql } from '../lib/db';

const TEAM_CODES = ['kd1', 'kd2', 'kd3', 'kd4', 'kd5', 'kd6'];

const MEDIA_CATEGORY = {
  name: 'Media',
  visibleColumns: ['accountName', 'channel', 'videoCount', 'product'],
};
const SUPPORT_CATEGORY = {
  name: 'Support',
  visibleColumns: ['optionTag', 'accountName', 'product', 'note'],
};

const PRODUCTS = ['Playing Cards', 'Card Skin', 'Poster', 'Wrapping Paper'];

const NICHE_TOPICS = [
  'Zelda',
  'Fallout',
  'Ghibli',
  'Jojo Anime',
  'Hunter x Hunter',
  'Dolly Parton',
  'LOTR',
  'Sleep Token',
  'Scream',
  'Country Music Legend',
  'Halloween Creepy Doll',
  'Dungeon Crawler',
  'COD Ghosts',
  'Tombstone',
];

const ACCOUNT_NAMES = [
  'Shan Li',
  'Jay Walker',
  'Tanya Seales',
  'Christina Hayes',
  'Crystal Arellano',
  'Sates Buddhu',
  'Karen Grimsley',
  'Nephtali Gonzalez',
  'Chris Rogers',
  'Barbara Stout',
  'Derek Parker',
  'Anne Levendoski',
  'Aaron Macinnis',
  'Ragan Stukenborg',
  'Shemika Jones',
];

const OPS_TITLES = [
  'Soạn đơn + CSKH (1)',
  'Chăm sóc sức khoẻ shop (1)',
  'Note ADS (1)',
  'Take care SPS+CSKH (1)',
  'Soạn đơn + clone Tiktok (1)',
  'Check shop health, trả lời review, refund',
];

const SUPPORT_OPTIONS = [
  'Soạn file clone/ Chăm sóc acc',
  'Soạn đơn UK',
  'Tạo promo fsale',
  'Up Listing Kênh',
  'Up Listing Phụ',
];

const STATUS_POOL = ['not_started', 'not_started', 'not_started', 'in_progress', 'done', 'done'] as const;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateInLast(days: number): string {
  const offset = Math.floor(Math.random() * days);
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

interface Member {
  id: number;
  fullName: string;
}

async function ensureCategory(teamId: number, def: { name: string; visibleColumns: string[] }, createdBy: number | null) {
  const existing = await sql.query('SELECT id FROM team_task_categories WHERE team_id = $1 AND name = $2', [teamId, def.name]);
  if (existing[0]) return existing[0].id as number;
  const rows = await sql.query(
    `INSERT INTO team_task_categories (team_id, name, visible_columns, sort_order, created_by)
     VALUES ($1, $2, $3, (SELECT coalesce(max(sort_order), -1) + 1 FROM team_task_categories WHERE team_id = $1), $4)
     RETURNING id`,
    [teamId, def.name, def.visibleColumns, createdBy]
  );
  return rows[0].id as number;
}

async function seedTeam(code: string) {
  const teamRows = await sql.query('SELECT id, name FROM teams WHERE code = $1', [code]);
  if (!teamRows[0]) {
    console.warn(`Bỏ qua ${code}: chưa có trong bảng teams.`);
    return;
  }
  const teamId = teamRows[0].id as number;

  const existingTasks = await sql.query('SELECT count(*)::int AS n FROM tasks WHERE team_id = $1', [teamId]);
  if (existingTasks[0].n > 0) {
    console.log(`Bỏ qua ${code}: đã có ${existingTasks[0].n} task, không seed thêm để tránh trùng.`);
    return;
  }

  const memberRows = await sql.query(
    `SELECT u.id, u.full_name, tm.role FROM team_members tm JOIN users u ON u.id = tm.user_id WHERE tm.team_id = $1 ORDER BY tm.role ASC`,
    [teamId]
  );
  if (memberRows.length === 0) {
    console.warn(`Bỏ qua ${code}: chưa có thành viên nào.`);
    return;
  }
  const members: Member[] = memberRows.map((r) => ({ id: r.id as number, fullName: r.full_name as string }));
  const managerId = (memberRows.find((r) => r.role === 'manager')?.id as number | undefined) ?? members[0].id;

  const mediaCategoryId = await ensureCategory(teamId, MEDIA_CATEGORY, managerId);
  const supportCategoryId = await ensureCategory(teamId, SUPPORT_CATEGORY, managerId);

  let created = 0;
  const TASKS_PER_TEAM = 18;
  for (let i = 0; i < TASKS_PER_TEAM; i += 1) {
    const assignee = pick(members);
    const bucket = i % 4 === 0 ? 'support' : i % 3 === 0 ? 'ops' : 'media';

    let categoryId: number | null = null;
    let title: string;
    let accountName: string | null = null;
    let channel: string | null = null;
    let videoCount: number | null = null;
    let product: string | null = null;
    let optionTag: string | null = null;
    let note: string | null = null;

    if (bucket === 'media') {
      categoryId = mediaCategoryId;
      const topic = pick(NICHE_TOPICS);
      title = `${topic} (Mỗi kênh 1 vid)`;
      accountName = pick(ACCOUNT_NAMES);
      const channelMember = pick(members.filter((m) => m.id !== assignee.id));
      channel = (channelMember ?? assignee).fullName;
      videoCount = pick([1, 2, 3, 5]);
      product = pick(PRODUCTS);
    } else if (bucket === 'support') {
      categoryId = supportCategoryId;
      optionTag = pick(SUPPORT_OPTIONS);
      accountName = Math.random() > 0.4 ? pick(ACCOUNT_NAMES) : null;
      title = optionTag;
      product = Math.random() > 0.5 ? pick(PRODUCTS) : null;
      note = Math.random() > 0.7 ? 'BMSM all shop: Buy 2 Get $3' : null;
    } else {
      title = pick(OPS_TITLES);
    }

    await sql.query(
      `INSERT INTO tasks
         (team_id, category_id, task_date, assignee_user_id, account_name, title, channel,
          video_count, product, option_tag, reference_link, note, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, $13)`,
      [
        teamId,
        categoryId,
        randomDateInLast(10),
        assignee.id,
        accountName,
        title,
        channel,
        videoCount,
        product,
        optionTag,
        note,
        pick(STATUS_POOL as unknown as string[]),
        managerId,
      ]
    );
    created += 1;
  }

  console.log(`${code}: tạo ${created} task giả (2 nhóm Media/Support + việc chung) cho ${members.length} thành viên.`);
}

async function main() {
  for (const code of TEAM_CODES) {
    await seedTeam(code);
  }
  console.log('Seed dữ liệu giả hoàn tất.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
