'use server';

import { getSession } from '@/lib/auth';
import { recordAirHockeyWin, listAirHockeyLeaderboard, type AirHockeyLeaderboardEntry } from '@/lib/air-hockey';
import {
  recordRotatePuzzleCompletion,
  listRotatePuzzleLeaderboard,
  type RotatePuzzleLeaderboardEntry,
} from '@/lib/rotate-puzzle';
import { recordGnatSwatScore, listGnatSwatLeaderboard, type GnatSwatLeaderboardEntry } from '@/lib/gnat-swat';

/** Ghi nhận 1 trận thắng CPU cho người đang đăng nhập, trả về bảng xếp hạng mới
 *  nhất luôn để client cập nhật UI ngay không cần gọi thêm 1 request riêng. */
export async function recordAirHockeyWinAction(): Promise<AirHockeyLeaderboardEntry[]> {
  const session = await getSession();
  if (!session) throw new Error('Bạn cần đăng nhập.');

  await recordAirHockeyWin(session.userId);
  return listAirHockeyLeaderboard();
}

/** Ghi nhận 1 màn "Rotate" vừa hoàn thành cho người đang đăng nhập, trả về bảng
 *  xếp hạng mới nhất luôn để client cập nhật UI ngay không cần gọi thêm request riêng. */
export async function recordRotatePuzzleCompletionAction(levelId: string): Promise<RotatePuzzleLeaderboardEntry[]> {
  const session = await getSession();
  if (!session) throw new Error('Bạn cần đăng nhập.');

  await recordRotatePuzzleCompletion(session.userId, levelId);
  return listRotatePuzzleLeaderboard();
}

/** Ghi nhận điểm ván "đập muỗi" vừa chơi cho người đang đăng nhập (chỉ lưu nếu cao hơn điểm cao nhất cũ),
 *  trả về bảng xếp hạng mới nhất luôn để client cập nhật UI ngay không cần gọi thêm request riêng. */
export async function recordGnatSwatScoreAction(score: number): Promise<GnatSwatLeaderboardEntry[]> {
  const session = await getSession();
  if (!session) throw new Error('Bạn cần đăng nhập.');

  await recordGnatSwatScore(session.userId, score);
  return listGnatSwatLeaderboard();
}
