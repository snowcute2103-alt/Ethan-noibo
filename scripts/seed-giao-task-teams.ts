/**
 * One-off: khoi tao 6 doi kinh doanh (KD1..KD6) cho tinh nang Giao Task va
 * seed thanh vien khoi diem tu team_label da co san trong bang users.
 *
 * Idempotent: chay lai khong tao du lieu trung (ON CONFLICT DO NOTHING).
 *
 * npx tsx --env-file=.env.local scripts/seed-giao-task-teams.ts
 */
import { sql } from '../lib/db';

const TEAM_MANAGERS: Record<string, string[]> = {
  KD1: ['thanhtuyen', 'myhuyen97'],
  KD2: ['anhthu2001'],
  KD3: ['myduyen'],
  KD4: ['thaovu1221'],
  KD5: ['ductien97'],
  KD6: ['baohan201'],
};

async function main() {
  for (const code of Object.keys(TEAM_MANAGERS)) {
    await sql.query(`INSERT INTO teams (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`, [
      code.toLowerCase(),
      `Đội ${code}`,
    ]);
  }

  const teamRows = await sql.query(`SELECT id, code FROM teams`);
  const teamIdByCode = new Map<string, number>(teamRows.map((r) => [String(r.code).toUpperCase(), r.id as number]));

  for (const [code, managerUsernames] of Object.entries(TEAM_MANAGERS)) {
    const teamId = teamIdByCode.get(code);
    if (!teamId) {
      console.error(`Khong tim thay team ${code} sau khi insert, dung lai.`);
      process.exit(1);
    }

    const members = await sql.query(
      `SELECT id, username FROM users WHERE team_label = $1 AND is_active = true`,
      [code]
    );

    let managerCount = 0;
    let memberCount = 0;
    for (const member of members) {
      const role = managerUsernames.includes(String(member.username)) ? 'manager' : 'member';
      const result = await sql.query(
        `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO NOTHING RETURNING user_id`,
        [teamId, member.id, role]
      );
      if (result.length > 0) {
        if (role === 'manager') managerCount += 1;
        else memberCount += 1;
      }
    }

    console.log(`${code}: ${members.length} nguoi tim thay (${managerCount} quan ly moi, ${memberCount} thanh vien moi da them)`);

    const managersInTeam = await sql.query(
      `SELECT u.username FROM team_members tm JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1 AND tm.role = 'manager' ORDER BY u.username`,
      [teamId]
    );
    console.log(`  Quan ly hien tai cua ${code}: ${managersInTeam.map((r) => r.username).join(', ') || '(chua co)'}`);
  }

  console.log('Seed hoan tat.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
