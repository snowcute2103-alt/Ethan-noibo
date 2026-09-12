import 'server-only';
import { sql } from './db';

export interface GnatSwatLeaderboardEntry {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  bestScore: number;
}

/** Ghi nhận điểm 1 ván "đập muỗi" — chỉ cập nhật nếu cao hơn điểm cao nhất hiện có của user
 *  (bảng cao điểm, không cộng dồn/lưu lịch sử từng ván). */
export async function recordGnatSwatScore(userId: number, score: number): Promise<void> {
  if (score <= 0) return;
  await sql.query(
    `INSERT INTO gnat_swat_scores (user_id, best_score) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET best_score = $2, updated_at = now()
     WHERE gnat_swat_scores.best_score < $2`,
    [userId, score]
  );
}

/** Top điểm cao nhất; ai đạt điểm đó trước xếp trước khi bằng điểm nhau. */
export async function listGnatSwatLeaderboard(limit = 10): Promise<GnatSwatLeaderboardEntry[]> {
  const rows = await sql.query(
    `SELECT u.id AS user_id, u.full_name, u.avatar_url, s.best_score
     FROM gnat_swat_scores s
     JOIN users u ON u.id = s.user_id
     WHERE u.is_active = true AND s.best_score > 0
     ORDER BY s.best_score DESC, s.updated_at ASC
     LIMIT $1`,
    [limit]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    bestScore: row.best_score,
  }));
}
