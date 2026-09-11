import 'server-only';
import { sql } from './db';

export interface AirHockeyLeaderboardEntry {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  wins: number;
}

/** +1 trận thắng cho user — gọi đúng 1 lần mỗi khi người chơi thắng CPU. */
export async function recordAirHockeyWin(userId: number): Promise<void> {
  await sql.query(
    `INSERT INTO air_hockey_wins (user_id, wins) VALUES ($1, 1)
     ON CONFLICT (user_id) DO UPDATE SET wins = air_hockey_wins.wins + 1, updated_at = now()`,
    [userId]
  );
}

/** Top người thắng nhiều nhất, mới thắng gần đây xếp trước khi bằng điểm nhau. */
export async function listAirHockeyLeaderboard(limit = 10): Promise<AirHockeyLeaderboardEntry[]> {
  const rows = await sql.query(
    `SELECT u.id AS user_id, u.full_name, u.avatar_url, w.wins
     FROM air_hockey_wins w
     JOIN users u ON u.id = w.user_id
     WHERE u.is_active = true
     ORDER BY w.wins DESC, w.updated_at ASC
     LIMIT $1`,
    [limit]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    wins: row.wins,
  }));
}
