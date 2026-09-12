'use client';

import Image from 'next/image';
import type { RotatePuzzleLeaderboardEntry } from '@/lib/rotate-puzzle';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

/** Danh xưng vui theo hạng — hạng 1 luôn là câu người dùng chọn, các hạng sau giảm dần độ "hoành tráng". */
const RANK_TITLES = ['Xuất sắc, não to đó', 'Giỏi ghê, não cũng to', 'Top 3, có não đó'];
const DEFAULT_RANK_TITLE = 'Đang luyện não';

interface RotatePuzzleLeaderboardProps {
  entries: RotatePuzzleLeaderboardEntry[];
  viewerUserId: number;
}

/** Bảng xếp hạng điểm game "Rotate" (tổng sao độ khó các màn đã qua), hiện cạnh game — mọi người xem
 *  được của nhau, tự cập nhật ngay sau khi ai đó hoàn thành 1 màn (xem RotatePuzzleGame.onLevelComplete). */
export default function RotatePuzzleLeaderboard({ entries, viewerUserId }: RotatePuzzleLeaderboardProps) {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#38bdf8]">Bảng xếp hạng</p>
      <p className="mt-0.5 text-[11px] text-white/50">Tổng điểm các màn đã qua</p>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">Chưa ai qua màn nào — qua màn đầu tiên để lên bảng!</p>
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
                  isViewer ? 'bg-[#38bdf8]/10 ring-1 ring-inset ring-[#38bdf8]/40' : ''
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
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm text-white/90">
                    {shortName}
                    {isViewer && <span className="text-[10px] font-bold uppercase text-[#38bdf8]">Bạn</span>}
                  </span>
                  <span className="block truncate text-[11px] text-white/40">
                    {RANK_TITLES[index] ?? DEFAULT_RANK_TITLE}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-white">{entry.score}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
