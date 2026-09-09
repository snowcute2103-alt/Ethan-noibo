'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { TeamTimelineData, TimelineWeekCount } from '@/app/dashboard/giao-task/nhom/timeline-data';

interface TeamTimelineChartProps {
  data: TeamTimelineData;
  avatarByUserId: Record<number, string | null>;
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase();
}

function shortDateOf(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Bảng màu phân theo người — chọn tông rực rỡ kiểu ruy băng mốc thời gian
 *  (vàng/đỏ/xanh lá cạnh nhau vẫn tách bạch), khác nhóm màu trạng thái đã
 *  dùng cho các thẻ phía trên (vàng/xám/xanh dương/xanh lá) để không lẫn 2
 *  tầng ý nghĩa màu. "Bạn" luôn cố định xanh dương (khớp thẻ "Bạn" bên
 *  trên); đồng đội khác lấy lần lượt từ bảng còn lại theo thứ tự dòng. */
const SELF_COLOR = { solid: 'bg-blue', text: 'text-blue', track: 'bg-blue/35' };
const PALETTE = [
  { solid: 'bg-amber-500', text: 'text-amber-500', track: 'bg-amber-500/35' },
  { solid: 'bg-rose-500', text: 'text-rose-500', track: 'bg-rose-500/35' },
  { solid: 'bg-emerald-500', text: 'text-emerald-500', track: 'bg-emerald-500/35' },
  { solid: 'bg-violet-500', text: 'text-violet-500', track: 'bg-violet-500/35' },
  { solid: 'bg-cyan-500', text: 'text-cyan-500', track: 'bg-cyan-500/35' },
];

function colorFor(rowIndex: number, isSelf: boolean) {
  if (isSelf) return SELF_COLOR;
  return PALETTE[rowIndex % PALETTE.length];
}

const STATUS_LABEL: Record<'boss' | 'not_started' | 'in_progress' | 'done', string> = {
  boss: 'Sếp đưa',
  not_started: 'Chưa làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
};

function statusOf(task: { status: string; isFromBoss: boolean }): keyof typeof STATUS_LABEL {
  if (task.status === 'done') return 'done';
  if (task.status === 'in_progress') return 'in_progress';
  if (task.isFromBoss) return 'boss';
  return 'not_started';
}

interface OpenPopup {
  key: string;
  /** Tiêu đề popup: "Tuần dd/mm - dd/mm" cho nút tròn 1 tuần, hoặc khoảng
   *  ngày thật "dd/mm → dd/mm" cho thanh nối nhiều tuần của task có dueDate. */
  headerLabel: string;
  count: TimelineWeekCount;
  color: { solid: string; text: string };
  /** Toạ độ viewport của tâm nút + mép trên/dưới, dùng để đặt popup ngay
   *  dưới nút và tự lật lên trên nếu không đủ chỗ, không phụ thuộc chiều
   *  cao thật của popup (tránh kiểu translateY(-100%) từng bị chìm/vỡ vị trí). */
  anchor: { x: number; top: number; bottom: number };
}

/** Timeline dạng "ruy băng" theo tuần cho cả nhóm (xem timeline-data.ts) —
 *  mỗi dòng 1 thành viên, 1 màu riêng: nền là 1 dải ruy băng liên tục (mờ),
 *  mỗi tuần có task nổi lên thành 1 nút tròn đậm màu kèm ngày bắt đầu tuần
 *  ngay bên dưới — lấy cảm hứng từ timeline mốc sự kiện kiểu slide thuyết
 *  trình (nút tròn nổi bật trên dải màu) thay vì các ô số khô khan.
 *
 *  Mốc tháng + vạch "Hôm nay" là overlay tuyệt đối theo %, tính trên CÙNG 1
 *  trục 0-100% với các cột tuần thật (các tuần dài bằng nhau nên trùng hệt
 *  trục theo ngày) — không dùng 2 kiểu chia flex khác nhau cho hàng tháng và
 *  hàng tuần vì số lượng item + khoảng `gap` khác nhau sẽ lệch cột dần về
 *  bên phải (đã từng làm vỡ layout thực tế). Overlay theo % + có khoảng đệm
 *  riêng phía trên hàng đầu tiên để nhãn "Hôm nay" không đè lên chữ tháng. */
export default function TeamTimelineChart({ data, avatarByUserId }: TeamTimelineChartProps) {
  const { weeks, monthSpans, rows, todayOffsetPercent, todayLabel } = data;
  const [hoverPopup, setHoverPopup] = useState<OpenPopup | null>(null);
  const [pinnedPopup, setPinnedPopup] = useState<OpenPopup | null>(null);
  const popup = pinnedPopup ?? hoverPopup;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinnedPopup) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setPinnedPopup(null);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setPinnedPopup(null);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, [pinnedPopup]);

  function anchorOf(node: HTMLElement): { x: number; top: number; bottom: number } {
    const rect = node.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom };
  }

  const monthMarkers: { label: string; percent: number }[] = [];
  let weeksBefore = 0;
  for (const span of monthSpans) {
    monthMarkers.push({ label: span.label, percent: (weeksBefore / weeks.length) * 100 });
    weeksBefore += span.weekCount;
  }

  return (
    <div
      ref={containerRef}
      className="theme-light-surface mt-6 rounded-[16px] border border-[#e8edf5] bg-gradient-to-br from-[#DCE9FF] via-[#EDE6FF] to-[#FFE1F0] p-4 shadow-[0_1px_0_rgba(16,26,48,0.03)] min-[1025px]:p-6"
    >
      <p className="font-heading text-base font-semibold uppercase tracking-wide text-navy">Timeline nhóm</p>

      <div className="mt-6 overflow-x-auto pt-6">
        <div className="flex min-w-[960px] gap-4">
          {/* Cột label: avatar + tên, 1 ô trống bù cho hàng tháng phía trên. */}
          <div className="flex w-56 shrink-0 flex-col gap-5">
            <div className="h-5" />
            {rows.map((row, i) => {
              const color = colorFor(i, row.isSelf);
              return (
                <div key={row.userId} className="flex h-16 items-center gap-2">
                  {avatarByUserId[row.userId] ? (
                    <Image
                      src={avatarByUserId[row.userId]!}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${color.solid}`}
                      aria-hidden="true"
                    >
                      {initialsOf(row.fullName)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-xs font-semibold uppercase leading-tight text-navy">{row.fullName}</span>
                </div>
              );
            })}
          </div>

          {/* Vùng tuần: mốc tháng + vạch "Hôm nay" là overlay theo %, mỗi
              dòng thành viên là 1 dải ruy băng liên tục với nút tròn nổi bật
              tại các tuần có task, kèm ngày ngay bên dưới nút. */}
          <div className="relative min-w-0 flex-1">
            <div className="relative h-5">
              {monthMarkers.map((marker, i) => (
                <div
                  key={i}
                  className="absolute top-0 border-l border-[#e8edf5] pl-2 text-xs font-semibold uppercase tracking-wide text-navy"
                  style={{ left: `${marker.percent}%` }}
                >
                  {marker.label}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-5">
              {rows.map((row, rowIndex) => {
                const color = colorFor(rowIndex, row.isSelf);
                return (
                  <div key={row.userId} className="relative flex h-16 items-start">
                    {/* Dải ruy băng nền liên tục, canh giữa đúng tâm nút tròn (đỉnh nút cách top 0, nút cao 34px → tâm ở 17px). */}
                    <div className={`absolute inset-x-0 top-[17px] h-[6px] -translate-y-1/2 rounded-full ${color.track}`} />

                    {row.ranges.map((range) => {
                      const key = `${row.userId}-range-${range.task.id}`;
                      const leftPercent = (range.startWeekIndex / weeks.length) * 100;
                      const widthPercent = ((range.endWeekIndex - range.startWeekIndex + 1) / weeks.length) * 100;
                      const rangeCount: TimelineWeekCount = {
                        bossCount: range.task.isFromBoss ? 1 : 0,
                        notStartedCount: !range.task.isFromBoss && range.task.status === 'not_started' ? 1 : 0,
                        inProgressCount: range.task.status === 'in_progress' ? 1 : 0,
                        doneCount: range.task.status === 'done' ? 1 : 0,
                        total: 1,
                        tasks: [range.task],
                      };
                      const headerLabel = `${shortDateOf(range.startDate)} → ${shortDateOf(range.dueDate)}`;
                      return (
                        <div
                          key={key}
                          role="button"
                          tabIndex={0}
                          onMouseEnter={(e) => setHoverPopup({ key, headerLabel, count: rangeCount, color, anchor: anchorOf(e.currentTarget) })}
                          onMouseLeave={() => setHoverPopup((p) => (p?.key === key ? null : p))}
                          onClick={(e) => {
                            const anchor = anchorOf(e.currentTarget);
                            setPinnedPopup((p) => (p?.key === key ? null : { key, headerLabel, count: rangeCount, color, anchor }));
                          }}
                          className={`absolute top-[17px] z-[5] h-[10px] -translate-y-1/2 cursor-pointer rounded-full opacity-80 ring-2 ring-white transition-opacity hover:opacity-100 ${color.solid}`}
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        />
                      );
                    })}

                    {row.weeks.map((count, weekIndex) => {
                      const key = `${row.userId}-${weekIndex}`;
                      if (count.total === 0) return <div key={key} className="h-full flex-1" />;
                      return (
                        <div key={key} className="flex h-full flex-1 flex-col items-center px-[2px]">
                          <button
                            type="button"
                            onMouseEnter={(e) =>
                              setHoverPopup({ key, headerLabel: `Tuần ${weeks[weekIndex].rangeLabel}`, count, color, anchor: anchorOf(e.currentTarget) })
                            }
                            onMouseLeave={() => setHoverPopup((p) => (p?.key === key ? null : p))}
                            onClick={(e) => {
                              // Đọc toạ độ ngay trong handler (đồng bộ) rồi mới đưa vào updater —
                              // `e.currentTarget` bị React reset về null ngay sau khi handler thoát,
                              // nên gọi anchorOf(e.currentTarget) bên trong callback của setState
                              // (chạy trễ hơn) sẽ ném lỗi "Cannot read properties of null".
                              const anchor = anchorOf(e.currentTarget);
                              const headerLabel = `Tuần ${weeks[weekIndex].rangeLabel}`;
                              setPinnedPopup((p) => (p?.key === key ? null : { key, headerLabel, count, color, anchor }));
                            }}
                            className={`relative z-10 grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-xs font-bold text-white shadow-[0_4px_10px_-2px_rgba(16,26,48,0.4)] ring-2 ring-white transition-transform hover:scale-110 active:scale-95 ${color.solid}`}
                          >
                            {count.total}
                          </button>
                          <span className="relative z-10 mt-1.5 whitespace-nowrap rounded bg-white/80 px-1 text-[10px] font-semibold text-muted">
                            {shortDateOf(weeks[weekIndex].start)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Xịch nhẹ sang phải khỏi tâm nút (thay vì canh giữa xuyên qua
                nút) để không lẫn vào chính giữa vòng tròn. */}
            <div className="pointer-events-none absolute bottom-0 top-[52px] z-0 translate-x-[22px]" style={{ left: `${todayOffsetPercent}%` }} aria-hidden="true">
              <div className="h-full w-[2px] bg-slate-700" />
              <span className="absolute -top-6 left-0 whitespace-nowrap rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white">
                Hôm nay {todayLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {popup &&
        createPortal(
          <TimelineWeekPopup
            headerLabel={popup.headerLabel}
            count={popup.count}
            color={popup.color}
            anchor={popup.anchor}
            onClose={() => setPinnedPopup(null)}
          />,
          document.body
        )}
    </div>
  );
}

function TimelineWeekPopup({
  headerLabel,
  count,
  color,
  anchor,
  onClose,
}: {
  headerLabel: string;
  count: TimelineWeekCount;
  color: { solid: string; text: string };
  anchor: { x: number; top: number; bottom: number };
  onClose: () => void;
}) {
  const width = 240;
  const gap = 10;
  const left = Math.min(Math.max(anchor.x - width / 2, 12), window.innerWidth - width - 12);
  // Ưu tiên mở BÊN DƯỚI nút; chỉ lật lên trên nếu không đủ chỗ — dùng `top`
  // hoặc `bottom` tuyệt đối theo cạnh đã biết của nút (không suy ra từ chiều
  // cao thật của popup), tránh phụ thuộc kiểu translateY(-100%) từng khiến
  // popup định vị sai/chìm khi nội dung dài ngắn khác nhau.
  const spaceBelow = window.innerHeight - anchor.bottom;
  const openBelow = spaceBelow > 220 || spaceBelow > anchor.top;
  const verticalStyle = openBelow ? { top: anchor.bottom + gap } : { bottom: window.innerHeight - anchor.top + gap };

  return (
    <div
      className="theme-light-surface fixed z-50 rounded-[12px] border border-[#e8edf5] bg-white p-3 text-left shadow-[0_16px_32px_-12px_rgba(16,26,48,0.35)]"
      style={{ width, left, ...verticalStyle }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-bold uppercase tracking-wide ${color.text}`}>{headerLabel}</p>
        <button type="button" onClick={onClose} className="text-muted hover:text-navy" aria-label="Đóng">
          ✕
        </button>
      </div>
      <p className="mt-0.5 text-[11px] text-muted">{count.total} task</p>
      <ul className="mt-2 flex max-h-48 flex-col gap-1.5 overflow-y-auto">
        {count.tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-1.5 text-xs text-navy">
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                statusOf(task) === 'done'
                  ? 'bg-emerald-500'
                  : statusOf(task) === 'in_progress'
                    ? 'bg-blue'
                    : statusOf(task) === 'boss'
                      ? 'bg-gold'
                      : 'bg-[#8B95A8]'
              }`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate" title={task.title}>
                {task.title}
              </span>
              <span className="text-[10px] text-muted">{STATUS_LABEL[statusOf(task)]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
