'use server';

import { getSession } from '@/lib/auth';
import { recordAirHockeyWin, listAirHockeyLeaderboard, type AirHockeyLeaderboardEntry } from '@/lib/air-hockey';

/** Ghi nhận 1 trận thắng CPU cho người đang đăng nhập, trả về bảng xếp hạng mới
 *  nhất luôn để client cập nhật UI ngay không cần gọi thêm 1 request riêng. */
export async function recordAirHockeyWinAction(): Promise<AirHockeyLeaderboardEntry[]> {
  const session = await getSession();
  if (!session) throw new Error('Bạn cần đăng nhập.');

  await recordAirHockeyWin(session.userId);
  return listAirHockeyLeaderboard();
}
