'use client';

import Image from 'next/image';
import type { AirHockeyLeaderboardEntry } from '@/lib/air-hockey';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface AirHockeyLeaderboardProps {
  entries: AirHockeyLeaderboardEntry[];
  viewerUserId: number;
}

/** Bảng xếp hạng số trận thắng CPU, hiện ngay cạnh game — mọi người xem được của
 *  nhau, tự cập nhật ngay sau khi ai đó thắng 1 ván (xem AirHockeyGame.onPlayerWin). */
export default function AirHockeyLeaderboard({ entries, viewerUserId }: AirHockeyLeaderboardProps) {
  return (
    <div className="ah-leaderboard w-full max-w-xs rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#00d4ff]">Bảng xếp hạng</p>
      <p className="mt-0.5 text-[11px] text-white/50">Số trận thắng CPU</p>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">Chưa ai thắng ván nào — thắng đầu tiên để lên bảng!</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {entries.map((entry, index) => {
            const isViewer = entry.userId === viewerUserId;
            const shortName = entry.fullName.trim().split(/\s+/).slice(-1)[0] ?? entry.fullName;
            return (
              <li
                key={entry.userId}
                title={entry.fullName}
                className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 ${
                  isViewer ? 'bg-[#00d4ff]/10 ring-1 ring-inset ring-[#00d4ff]/40' : ''
                }`}
              >
                <span className="w-5 shrink-0 text-center text-base">{RANK_MEDALS[index] ?? index + 1}</span>
                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt={entry.fullName}
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                    {shortName[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-white/90">
                  {shortName}
                  {isViewer && <span className="ml-1.5 text-[10px] font-bold uppercase text-[#00d4ff]">Bạn</span>}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-white">{entry.wins}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
