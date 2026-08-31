/** Import idempotent task thật KD2 từ 04/08 đến 07/08/2026. */
import { sql } from '../lib/db';

type Category = 'Media' | 'Support';
type Task = { date: string; category: Category; assignee: string; title: string; account?: string; sourceChannel?: string; uploader?: string; videos?: number; product?: string };
const users: Record<string, string> = { Lan: 'lanpham02', Sơn: 'trongson250921', Vân: 'thuyvan', Phụng: 'phungdo0301', Thu: 'hongthu89', Sao: 'anhsao1392' };
const d = (day: string) => `2026-08-${day}`;
const m = (day: string, assignee: string, title: string, account?: string, sourceChannel?: string, uploader?: string, videos?: number, product: string | null = 'Playing Card'): Task => ({ date: d(day), category: 'Media', assignee: users[assignee], title, account, sourceChannel, uploader, videos, ...(product ? { product } : {}) });
const s = (day: string, assignee: string, title: string, account?: string, sourceChannel?: string, uploader?: string, videos?: number, product?: string): Task => ({ date: d(day), category: 'Support', assignee: users[assignee], title, account, sourceChannel, uploader, videos, product });

const tasks: Task[] = [
  m('04','Lan','soạn đơn, add tracking, add FD shop UK',undefined,undefined,undefined,undefined,null),
  m('04','Lan','Resident Evil Playing card','James Lawrence','Kênh MKT2','Vân',3),
  m('04','Sơn','Resident Evil Playing card','James Lawrence','Kênh Chính','Vân',4),
  m('04','Vân','Dungeon Crawler Playing card','Derek Parker','Kênh MKT2','Sao',3),
  m('04','Vân','Dungeon Crawler Playing card','Derek Parker','Kênh MKT4','Sao',3),
  m('04','Vân','Sleep Token Playing card','Chris Rogers','Kênh MKT2','Sơn',3),
  m('04','Vân','Sleep Token Playing card','Chris Rogers','Kênh Chính','Sơn',3),
  m('04','Vân','Dungeon Crawler Playing card','Derek Parker','Kênh MKT1','Sao',3),
  m('04','Vân','Resident Evil Playing card','James Lawrence','Kênh MKT1','Vân',2),
  m('04','Sơn','ATLA Playing car','Jason Miklian','MKT4','Thu',2),
  m('04','Sơn','RDR2 Playing card','Jason Miklian','MKT4','Thu',1),
  m('04','Sơn','Sleep Token Playing cards (design 3)','Chris Rogers','Kênh MKT3','Thư',3),
  m('04','Sơn','Sleep Token Playing Cards','Barbara Stout','MKT2','Lan',3),
  m('04','Sơn','RDR2 Playing Card','Jason Miklian','Kênh Chính - annepherson','Phụng',2),
  m('04','Sơn','ATLA Playing card','Jason Miklian','Kênh Chính - annepherson','Phụng',2),
  m('04','Lan','ATLA Playing card','Jason Miklian','Kênh MKT3 - latricialsmith','Phụng',2),
  m('04','Lan','Sleep Token PLC (mẫu chị Thảo) (1)','Barbara Stout','MKT1','Lan',3),
  m('04','Lan','Sleep Token PLC (mẫu chị Thảo) (1)','Barbara Stout','Kênh Chính','Lan',3),
  m('04','Lan','Sleep Token Playing card (1)','Chris Rogers','Kênh MKT4','Thư',3),
  m('04','Lan','ATLA Playing card (1)','Jason Miklian','MKT2','Thu',1),
  m('04','Lan','Hollow Knight playing card','Jason Miklian','MKT2','Thu',2),
  s('04','Thu','gen 8 lá bài COD Ghost PLC','James Lawrence'),
  s('04','Phụng','Research idea mới, gen mẫu'),
  s('04','Phụng','Chụp mockup ATLA Playing card, sửa','Jason Miklian'),
  s('04','Thu','• Soạn đơn clone CMS + in label shop','Tiktok US'),
  s('04','Thu','Check acc health, reply Rating review','Chancy Crenshaw'),
  s('04','Thu','thêm 2 design vào listing kênh Off Campus','Barbara Stout'),
  s('04','Thu','up 1 listing spam The Phantom & The','Barbara Stout'),
  s('04','Thu','up 7 listings spam Movie 2027 Calendar','Jacueline Johnson'),
  s('04','Phụng','Check shop health, review, refund','Jason Miklian / Nephtali Gonzalez'),
  s('04','Phụng','Add tracking, support KH, import đơn','lucksigns69'),
  s('04','Phụng','RDR2 Playing Card','Jason Miklian','Kênh MKT3 - latricialsmith','Phụng',1,'Playing Card'),

  m('05','Lan','add FD shop UK',undefined,undefined,undefined,undefined,null),
  m('05','Vân','Resident Evil Playing card','James Lawrence','Kênh MKT1','Vân',2),
  m('05','Vân','Sleep Token Playing card','Chris Rogers','Kênh MKT2','Sơn',3),
  m('05','Vân','Dungeon Crawler Playing card','Derek Parker','Kênh MKT1','Sao',3),
  m('05','Vân','Sleep Token Playing card','Chris Rogers','Kênh Chính','Sơn',3),
  m('05','Vân','Dungeon Crawler Playing card','Derek Parker','Kênh MKT2','Sao',3),
  m('05','Sơn','Dungeon Crawler Playing card','Derek Parker','Kênh MKT4','Sao',3),
  m('05','Sơn','Sleep Token Playing Cards','Barbara Stout','MKT2','Lan',3),
  m('05','Sơn','Resident Evil Playing card','James Lawrence','Kênh Chính','Vân',4),
  m('05','Sơn','Sleep Token Playing cards (design 3)','Chris Rogers','Kênh MKT3','Thư',3),
  m('05','Sơn','ATLA Playing card','Jason Miklian','Kênh Chính - annepherson','Phụng',2),
  m('05','Sơn','RDR2 Playing Card','Jason Miklian','Kênh Chính - annepherson','Phụng',2),
  m('05','Vân','ATLA Playing cards','Jason Miklian','MKT4','Thu',3),
  m('05','Lan','Resident Evil Playing card','James Lawrence','Kênh MKT2','Vân',3),
  m('05','Lan','Hollow Knight playing card','Jason Miklian','MKT2','Thu',2),
  m('05','Lan','ATLA Playing card','Jason Miklian','MKT2','Thu',1),
  m('05','Lan','Sleep Token Playing card','Chris Rogers','Kênh MKT4','Thư',3),
  m('05','Lan','Sleep Token PLC (mẫu chị Thảo)','Barbara Stout','Kênh Chính','Lan',3),
  m('05','Lan','Sleep Token PLC (mẫu chị Thảo)','Barbara Stout','MKT1','Lan',3),
  s('05','Sao','Gen (tiếp) design Halloween Movie plc',undefined,undefined,undefined,undefined,'Playing Card'),
  s('05','Sao','Check review, rf, tạo FS 5 shop'),
  s('05','Sao','Check đơn 6shop (không CMS), soạn'),
  s('05','Sao','Soạn đơn (UK), add tracking, đổi SKU'),
  s('05','Thu','Research + Gen 12 mẫu Scarface PLC','Tiktok US'),
  s('05','Thu','Xuất settlement tháng 7 cho 15 shop','Tiktok US'),
  s('05','Thu','up spam Pedro Pascal 2027 Calendar','Barbara Stout'),
  s('05','Thu','• Soạn đơn clone CMS • Tạo Flash sale','Tiktok US'),
  s('05','Thu','Check acc health & product rating các','Tiktok US'),
  s('05','Phụng','Research idea mới, gen mẫu'),
  s('05','Phụng','Chụp mockup, sửa listing kênh RE Playing','James Lawrence'),
  s('05','Phụng','RDR2 Playing Card','Jason Miklian','Kênh MKT3 - latricialsmith','Phụng',2,'Playing Card'),
  s('05','Phụng','Soạn đơn, add tracking, support KH, import','lucksigns69'),
  s('05','Phụng','Check shop health, review, refund','Jason Miklian / Nephtali Gonzalez'),
  s('05','Phụng','ATLA Playing card','Jason Miklian','Kênh MKT3 - latricialsmith','Phụng',1,'Playing Card'),

  m('06','Lan','Studio Ghibli PLC','Barbara Stout','Kênh MKT4','Lan',3),
  m('06','Vân','Ghibli Playing card','Barbara Stout','Kênh MKT3','Lan',2),
  m('06','Vân','Dexter Playing card','Jacueline Johnson','Kênh MKT3','Vân',3),
  m('06','Sơn','Dexter Playing card','Jacueline Johnson','Kênh MKT2','Vân',2),
  m('06','Vân','Sleep Token Playing card','Chris Rogers','Kênh MKT2','Sơn',3),
  m('06','Vân','Sleep Token Playing card','Chris Rogers','Kênh Chính','Sơn',3),
  m('06','Vân','Dungeon Crawler Playing card','Derek Parker','Kênh MKT2','Sao',3),
  m('06','Sơn','Dungeon Crawler Playing card','Derek Parker','Kênh MKT1','Sao',3),
  m('06','Vân','ATLA Playing cards','Jason Miklian','MKT4','Thu',3),
  m('06','Sơn','Dungeon Crawler Playing card','Derek Parker','Kênh MKT4','Sao',3),
  m('06','Sơn','Dexter Playing card','Jacueline Johnson','Kênh Chính','Vân',3),
  m('06','Sơn','Sleep Token Playing Cards','Barbara Stout','MKT2','Lan',3),
  m('06','Sơn','Sleep Token Playing cards (design 3)','Chris Rogers','Kênh MKT3','Thư',3),
  m('06','Lan','Sleep Token PLC (mẫu chị Thảo)','Barbara Stout','MKT1','Lan',3),
  m('06','Lan','Sleep Token PLC (mẫu mới)','Barbara Stout','Kênh Chính','Lan',3),
  m('06','Lan','ATLA Playing card','Jason Miklian','MKT2','Thu',3),
  m('06','Lan','Sleep Token Playing card','Chris Rogers','Kênh MKT4','Thư',3),
  m('06','Lan','Hollow Knight playing card','Jason Miklian','MKT2','Thu',2),
  s('06','Sao','Check review, rf, tạo FS 5 shop (1)'),
  s('06','Sao','Check đơn 6shop (không CMS)'),
  s('06','Sao','Soạn đơn (UK), add tracking, đổi SKU'),
  s('06','Sao','Gen (tiếp) design Halloween Movie plc',undefined,undefined,undefined,undefined,'Playing Card'),
  s('06','Thu','Check acc health & product rating các','Tiktok US'),
  s('06','Thu','• Soạn đơn clone CMS • Tạo Flash sale','Tiktok US'),
  s('06','Thu','up spam Pedro Pascal 2027 Calendar','Barbara Stout'),
  s('06','Thu','Xuất settlement tháng 7 cho 15 shop','Tiktok US'),
  s('06','Thu','Research + Gen 12 mẫu Scarface PLC','Tiktok US'),
  s('06','Phụng','RE Playing card','Jason Miklian','Kênh Chính - annepherson','Phụng',2,'Playing Card'),
  s('06','Phụng','RDR2 Playing Card','Jason Miklian','Kênh Chính - annepherson','Phụng',2,'Playing Card'),
  s('06','Phụng','Check shop health, review, refund, tạo','Jason Miklian / Nephtali Gonzalez'),
  s('06','Phụng','RE Playing cards','Jason Miklian','Kênh MKT3 - latricialsmith','Phụng',2,'Playing Card'),
  s('06','Phụng','Soạn đơn, add tracking, support KH, import','lucksigns69'),
  s('06','Phụng','Up RE playing cards','Jason Miklian / lucksigns69'),
  s('06','Sao','add FD shop UK'),

  m('07','Vân','Red Dead Redemption Playing card','Jason Miklian','MKT4','Thu',1),
  m('07','Vân','Dungeon Crawler Playing card','Derek Parker','Kênh MKT2','Sao',3),
  m('07','Vân','Resident Evil Playing cards','Jason Miklian','MKT4','Thu',3),
  m('07','Vân','Sleep Token Playing card','Chris Rogers','Kênh MKT2','Sơn',3),
  m('07','Vân','Sleep Token Playing card','Chris Rogers','Kênh Chính','Sơn',3),
  m('07','Vân','Dexter Playing card','Jacueline Johnson','Kênh MKT3','Vân',2),
  m('07','Vân','Ghibli Playing card','Barbara Stout','Kênh MKT3','Lan',3),
  m('07','Sơn','Sleep Token Playing cards (design 3)','Chris Rogers','Kênh MKT3','Thư',3),
  m('07','Sơn','Sleep Token Playing Cards','Barbara Stout','MKT2','Lan',3),
  m('07','Sơn','Dexter Playing card','Jacueline Johnson','Kênh MKT2','Vân',2),
  m('07','Sơn','Dexter Playing card','Jacueline Johnson','Kênh Chính','Vân',3),
  m('07','Sơn','Dungeon Crawler Playing card','Derek Parker','Kênh MKT4','Sao',3),
  m('07','Sơn','Dungeon Crawler Playing card','Derek Parker','Kênh MKT1','Sao',3),
  m('07','Lan','Hollow Knight playing card','Jason Miklian','MKT2','Thu',2),
  m('07','Lan','Resident Evil Playing card','Jason Miklian','MKT2','Thu',3),
  m('07','Lan','Sleep Token Playing card','Chris Rogers','Kênh MKT4','Thư',3),
  m('07','Lan','Studio Ghibli PLC','Barbara Stout','Kênh MKT4','Lan',3),
  m('07','Lan','Sleep Token PLC (mẫu mới)','Barbara Stout','Kênh Chính','Lan',3),
  m('07','Lan','Sleep Token PLC (mẫu chị Thảo)','Barbara Stout','MKT1','Lan',3),
  s('07','Phụng','Gen mẫu Horror movie PLC'),
  s('07','Phụng','Add design vào listing kênh','Jason Miklian'),
  s('07','Phụng','RDR2 Playing card','Jason Miklian','Kênh MKT3 - latricialsmith','Phụng',2),
  s('07','Thu','Xuất settlement tháng 7 cho 15 shop','Tiktok US'),
  s('07','Thu','Research + Gen 12 mẫu Scarface PLC','Tiktok US'),
  s('07','Thu','• Soạn đơn clone CMS • Tạo Flash sale','Tiktok US'),
  s('07','Thu','Check acc health & product rating các','Tiktok US'),
  s('07','Thu','up spam Pedro Pascal 2027 Calendar','Barbara Stout'),
  s('07','Sao','Gen design Scream plc',undefined,undefined,undefined,undefined,'Playing Card'),
  s('07','Sao','Soạn đơn (UK), add tracking, đổi SKU'),
  s('07','Sao','Check đơn 6shop (không CMS), print'),
  s('07','Sao','Check review, rf, tạo FS 5 shop'),
  s('07','Phụng','Soạn đơn, add tracking, support KH, import','lucksigns69'),
  s('07','Phụng','Check shop health, review, refund','Jason Miklian / Nephtali Gonzalez'),
  s('07','Phụng','RE Playing cards','Jason Miklian','Kênh MKT3 - latricialsmith','Phụng',2,'Playing Card'),
  s('07','Phụng','RDR2 Playing Card','Jason Miklian','Kênh Chính - annepherson','Phụng',1,'Playing Card'),
  s('07','Phụng','RE Playing card','Jason Miklian','Kênh Chính - annepherson','Phụng',2,'Playing Card'),
];

async function main() {
  const team = await sql.query(`SELECT id FROM teams WHERE code='kd2'`);
  if (!team[0]) throw new Error('Không tìm thấy KD2.');
  const teamId = team[0].id as number;
  const cats = await sql.query(`SELECT id,name FROM team_task_categories WHERE team_id=$1 AND name=ANY($2::text[])`, [teamId,['Media','Support']]);
  const categoryIds = new Map(cats.map(r => [String(r.name), r.id as number]));
  if (!categoryIds.has('Media') || !categoryIds.has('Support')) throw new Error('KD2 thiếu nhóm Media hoặc Support.');
  const usernames = [...new Set(tasks.map(t => t.assignee))];
  const members = await sql.query(`SELECT u.id,u.username FROM team_members tm JOIN users u ON u.id=tm.user_id WHERE tm.team_id=$1 AND u.username=ANY($2::text[])`, [teamId,usernames]);
  const memberIds = new Map(members.map(r => [String(r.username), r.id as number]));
  const missing = usernames.filter(u => !memberIds.has(u));
  if (missing.length) throw new Error(`Thiếu thành viên: ${missing.join(', ')}`);
  const manager = await sql.query(`SELECT user_id FROM team_members WHERE team_id=$1 AND role='manager' ORDER BY user_id LIMIT 1`,[teamId]);
  const createdBy = (manager[0]?.user_id as number | undefined) ?? null;
  let created=0, skipped=0;
  for (const t of tasks) {
    const values=[teamId,categoryIds.get(t.category),t.date,memberIds.get(t.assignee),t.account??null,t.title,t.uploader??null,t.videos??null,t.product??null,t.sourceChannel?`Kênh: ${t.sourceChannel}`:null,createdBy];
    const rows=await sql.query(`INSERT INTO tasks (team_id,category_id,task_date,assignee_user_id,account_name,title,channel,video_count,product,note,status,created_by)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'done',$11 WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE team_id=$1 AND category_id=$2 AND task_date=$3 AND assignee_user_id=$4 AND account_name IS NOT DISTINCT FROM $5::text AND title=$6 AND channel IS NOT DISTINCT FROM $7::text AND video_count IS NOT DISTINCT FROM $8::integer AND product IS NOT DISTINCT FROM $9::text AND note IS NOT DISTINCT FROM $10::text) RETURNING id`,values);
    if(rows.length) created++; else skipped++;
  }
  console.log(`KD2 04-07/08/2026: tạo ${created}, bỏ qua ${skipped} task đã tồn tại.`);
}
main().catch(e=>{console.error(e);process.exit(1)});
