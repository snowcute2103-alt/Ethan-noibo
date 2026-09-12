'use client';

import Image from 'next/image';
import type { GnatSwatLeaderboardEntry } from '@/lib/gnat-swat';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

interface GnatSwatLeaderboardProps {
  entries: GnatSwatLeaderboardEntry[];
  viewerUserId: number;
}

/** Bảng xếp hạng điểm cao nhất game "Đập muỗi", hiện cạnh game — mọi người xem được của nhau, tự cập
 *  nhật ngay sau mỗi cú đập trúng (xem GnatSwatGame.onScoreChange). */
export default function GnatSwatLeaderboard({ entries, viewerUserId }: GnatSwatLeaderboardProps) {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5a623]">Bảng xếp hạng</p>
      <p className="mt-0.5 text-[11px] text-white/50">Điểm cao nhất 1 ván</p>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">Chưa ai đập muỗi nào — đập vài con để lên bảng!</p>
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
                  isViewer ? 'bg-[#f5a623]/10 ring-1 ring-inset ring-[#f5a623]/40' : ''
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
                  {isViewer && <span className="ml-1.5 text-[10px] font-bold uppercase text-[#f5a623]">Bạn</span>}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-white">{entry.bestScore}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
