import 'server-only';
import { sql } from './db';
import { ROTATE_PUZZLE_LEVELS } from '@/components/dashboard/rotate-puzzle-levels';

export interface RotatePuzzleLeaderboardEntry {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  score: number;
}

/** Số sao độ khó của 1 màn (đếm ký tự ★ trong listBlurb); màn Tutorial không có sao vẫn tính 1 điểm
 *  hoàn thành. Tra từ dữ liệu màn có sẵn thay vì tin số client gửi lên, tránh client tự khai điểm ảo. */
function starsForLevel(levelId: string): number {
  const level = ROTATE_PUZZLE_LEVELS.find((l) => l.id === levelId);
  if (!level) return 0;
  const starCount = (level.listBlurb.match(/★/g) || []).length;
  return starCount || 1;
}

/** Ghi nhận 1 màn đã hoàn thành cho user — mỗi user/màn chỉ tính điểm đúng 1 lần, chơi lại màn cũ
 *  không cộng thêm (ON CONFLICT DO NOTHING trên khoá user_id+level_id). */
export async function recordRotatePuzzleCompletion(userId: number, levelId: string): Promise<void> {
  const stars = starsForLevel(levelId);
  if (stars <= 0) return;
  await sql.query(
    `INSERT INTO rotate_puzzle_completions (user_id, level_id, stars) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, level_id) DO NOTHING`,
    [userId, levelId, stars]
  );
}

/** Top điểm cao nhất (tổng sao các màn đã qua); ai đạt điểm đó trước xếp trước khi bằng điểm nhau. */
export async function listRotatePuzzleLeaderboard(limit = 10): Promise<RotatePuzzleLeaderboardEntry[]> {
  const rows = await sql.query(
    `SELECT u.id AS user_id, u.full_name, u.avatar_url,
            COALESCE(SUM(c.stars), 0) AS score,
            MAX(c.completed_at) AS last_completed_at
     FROM rotate_puzzle_completions c
     JOIN users u ON u.id = c.user_id
     WHERE u.is_active = true
     GROUP BY u.id, u.full_name, u.avatar_url
     HAVING COALESCE(SUM(c.stars), 0) > 0
     ORDER BY score DESC, last_completed_at ASC
     LIMIT $1`,
    [limit]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    score: Number(row.score),
  }));
}
