'use client';

import { useMemo } from 'react';
import type { TeamTaskCategory } from '@/lib/teams';
import type { MonthDayCategoryCount } from '@/lib/tasks';

/** Tách khỏi task-board.tsx để dùng chung cho cả board đội KD lẫn board cá
 *  nhân (bộ phận ngoài 6 đội KD, personal-task-board.tsx) — trước đây board
 *  cá nhân không có lịch mini này. Tự chứa các hàm ngày tháng riêng (trùng
 *  với bản trong task-board.tsx/personal-task-board.tsx) thay vì export
 *  chung, theo đúng tiền lệ lặp nhỏ đã chấp nhận trong repo (STICKY_NOTE_TEXT_MAX_LEN). */
function parseISO(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, amount: number): string {
  const date = parseISO(dateStr);
  date.setUTCDate(date.getUTCDate() + amount);
  return toISO(date);
}

function startOfWeek(dateStr: string): string {
  const date = parseISO(dateStr);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return toISO(date);
}

function startOfMonth(dateStr: string): string {
  const date = parseISO(dateStr);
  date.setUTCDate(1);
  return toISO(date);
}

/** Ô lịch mini quá nhỏ để hiện trọn "Support Etsy"/"Support Tiktok" — rút
 *  gọn "Support" thành "SP" chỉ ở đây (hiển thị), không đụng tên nhóm thật
 *  trong DB, để dòng đủ ngắn không bị cắt bằng "…". */
function abbreviateCategoryName(name: string): string {
  return name.replace(/^Support\b/i, 'SP');
}

function endOfMonth(dateStr: string): string {
  const date = parseISO(dateStr);
  // Chuẩn hoá về ngày 1 trước khi cộng tháng — nếu không, dateStr có ngày
  // 29/30/31 mà tháng kế tiếp ngắn hơn sẽ khiến Date tự tràn tiếp sang tháng
  // sau nữa (vd 31/08 cộng lên tháng 9 chỉ có 30 ngày, ra nhầm 30/09).
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return toISO(date);
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const CALENDAR_LEGEND: { color: string; label: string; ring?: boolean }[] = [
  { color: '#FFB84D', label: 'Ngày đã qua' },
  { color: '#2F8FE8', label: 'Hôm nay' },
  { color: '#1A1D24', label: 'Không có task' },
  { color: '#FFFFFF', label: 'Chưa tới' },
  { color: '#FFFFFF', label: 'Ngày đang xem', ring: true },
];

/** 1 lưới ngày của đúng 1 tháng — tách riêng để TaskCalendar vẽ được 2 tháng
 *  liên tiếp (tháng đang chọn + tháng liền trước) trong cùng 1 lần điều
 *  hướng, dùng chung countsByDate/activeDates/totalByDate đã gộp dữ liệu cả
 *  2 tháng. */
function MonthGrid({
  monthAnchor,
  today,
  selectedDate,
  categories,
  countsByDate,
  activeDates,
  totalByDate,
  onSelectDay,
  hideLabel,
}: {
  monthAnchor: string;
  today: string;
  selectedDate: string;
  categories: TeamTaskCategory[];
  countsByDate: Map<string, Map<number, number>>;
  activeDates: Set<string>;
  totalByDate: Map<string, number>;
  onSelectDay: (date: string) => void;
  hideLabel?: boolean;
}) {
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const gridStart = startOfWeek(monthStart);

  const cells: string[] = [];
  let cursor = gridStart;
  for (let i = 0; i < 42; i += 1) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
  }
  // Bớt hẳn 1 hàng nếu tháng chỉ cần 5 tuần để hiển thị đủ ngày.
  while (cells.length > 35 && cells.slice(-7).every((d) => d > monthEnd)) {
    cells.splice(-7, 7);
  }

  const [y, m] = monthAnchor.split('-');
  const monthLabel = `Tháng ${Number(m)}, ${y}`;

  function cellClass(dateStr: string): string {
    const base =
      dateStr === today
        ? 'bg-[#2F8FE8] text-white'
        : !activeDates.has(dateStr)
          ? 'bg-[#1A1D24] text-white/50'
          : dateStr < today
            ? 'bg-[#FFB84D] text-[#111827]'
            : 'border border-[#e8edf5] bg-white text-navy';
    // Viền riêng cho ngày ĐANG XEM trên bảng task (anchorDate) — độc lập với
    // màu nền "Hôm nay" ở trên, vì 2 ngày này không phải lúc nào cũng trùng
    // nhau (bấm 1 ngày bất kỳ trên lịch sẽ đổi ngày đang xem, không đổi "hôm
    // nay" thật).
    return dateStr === selectedDate ? `${base} ring-2 ring-inset ring-navy` : base;
  }

  return (
    <div>
      {!hideLabel && <p className="mb-1.5 text-center font-heading text-xs font-bold text-navy">{monthLabel}</p>}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          const inMonth = dateStr >= monthStart && dateStr <= monthEnd;
          const dayCounts = countsByDate.get(dateStr);
          return (
            <button
              key={`${dateStr}-${i}`}
              type="button"
              disabled={!inMonth}
              onClick={() => onSelectDay(dateStr)}
              className={`flex min-h-[54px] w-full min-w-0 flex-col items-center gap-0.5 px-0.5 py-1 ${inMonth ? cellClass(dateStr) : 'invisible'}`}
            >
              {inMonth && (
                <>
                  <span className="text-xs font-bold">{Number(dateStr.slice(8, 10))}</span>
                  {categories.length > 0
                    ? categories.map((cat) => {
                        const count = dayCounts?.get(cat.id) ?? 0;
                        if (count === 0) return null;
                        return (
                          <span key={cat.id} className="w-full break-words text-center text-[8px] leading-tight opacity-90">
                            {abbreviateCategoryName(cat.name)}:{count}
                          </span>
                        );
                      })
                    : (totalByDate.get(dateStr) ?? 0) > 0 && (
                        <span className="w-full truncate text-center text-[9px] font-semibold leading-tight opacity-90">
                          {totalByDate.get(dateStr)} task
                        </span>
                      )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Lịch mini chọn ngày, tô màu theo trạng thái từng ngày trong tháng — bấm
 *  vào 1 ngày sẽ chuyển board sang xem đúng ngày đó. Hiện liền 2 tháng
 *  (tháng đang chọn + tháng liền trước, vd mặc định hôm nay ở tháng 9 thì
 *  hiện tháng 9 + tháng 8) để không phải bấm qua lại mới so sánh được 2
 *  tháng liền nhau — bấm "tháng sau"/"tháng trước" trượt cả cặp đi 1 tháng
 *  (vd đang 9-8 bấm sau ra 10-9). Điều hướng tháng ở đây độc lập với viewMode
 *  hiện tại (chỉ dịch anchorDate).
 *  categories=[] (board cá nhân không có category) vẫn hoạt động bình
 *  thường — chỉ là không có dòng số lượng riêng từng nhóm trên mỗi ô ngày. */
export default function TaskCalendar({
  viewAnchor,
  selectedDate,
  today,
  categories,
  dayCategoryCounts,
  onSelectDay,
  onShiftMonth,
}: {
  /** Tháng đang hiển thị trên lịch mini (2 lưới: viewAnchor + tháng liền
   *  trước) — chỉ đổi khi bấm nút ‹/›, KHÔNG đổi khi bấm chọn 1 ngày, để
   *  bấm 1 ngày ở lưới tháng dưới không làm cặp tháng đang hiện bị dịch đi. */
  viewAnchor: string;
  /** Ngày đang chọn (tô viền) — đổi mỗi khi bấm 1 ngày bất kỳ, độc lập với
   *  viewAnchor. */
  selectedDate: string;
  today: string;
  categories: TeamTaskCategory[];
  dayCategoryCounts: MonthDayCategoryCount[];
  onSelectDay: (date: string) => void;
  onShiftMonth: (direction: 1 | -1) => void;
}) {
  // dayCategoryCounts giờ gộp dữ liệu của CẢ 2 tháng đang hiển thị (xem nơi
  // gọi ở task-board.tsx/team-board-data.ts/actions.ts) — chỉ cần gộp 1 lần,
  // 2 lưới tháng bên dưới cùng đọc chung map này.
  const countsByDate = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    for (const row of dayCategoryCounts) {
      if (row.categoryId === null) continue;
      if (!map.has(row.date)) map.set(row.date, new Map());
      map.get(row.date)!.set(row.categoryId, row.count);
    }
    return map;
  }, [dayCategoryCounts]);
  const activeDates = useMemo(() => new Set(dayCategoryCounts.map((r) => r.date)), [dayCategoryCounts]);
  // Board cá nhân không có category (categories=[]) nên không có dòng nào hiện
  // ra từ countsByDate — bù lại bằng tổng số task/ngày bất kể category, để ô
  // ngày vẫn cho biết "hôm đó có mấy task" thay vì chỉ tô màu suông.
  const totalByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of dayCategoryCounts) {
      map.set(row.date, (map.get(row.date) ?? 0) + row.count);
    }
    return map;
  }, [dayCategoryCounts]);

  // Hiện tháng đang chọn TRƯỚC (trên), tháng liền trước đó SAU (dưới) — vd
  // đang ở tháng 9 (mặc định là tháng hiện tại) thì tháng 9 nằm trên, tháng 8
  // nằm dưới. Điều hướng vẫn dịch anchorDate như cũ ("tháng sau"/"tháng
  // trước" dịch cả cặp theo đúng hướng).
  const previousMonthAnchor = addDays(startOfMonth(viewAnchor), -1);
  const [y1, m1] = viewAnchor.split('-');
  const rangeLabel = `Tháng ${Number(m1)}, ${y1}`;

  return (
    <div className="rounded-[14px] border border-[#e8edf5] bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          aria-label="Tháng trước"
          className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
        >
          ‹
        </button>
        <strong className="font-heading text-sm text-navy">{rangeLabel}</strong>
        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          aria-label="Tháng sau"
          className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
        >
          ›
        </button>
      </div>
      <MonthGrid
        monthAnchor={viewAnchor}
        today={today}
        selectedDate={selectedDate}
        categories={categories}
        countsByDate={countsByDate}
        activeDates={activeDates}
        totalByDate={totalByDate}
        onSelectDay={onSelectDay}
        hideLabel
      />
      <div className="mt-4">
        <MonthGrid
          monthAnchor={previousMonthAnchor}
          today={today}
          selectedDate={selectedDate}
          categories={categories}
          countsByDate={countsByDate}
          activeDates={activeDates}
          totalByDate={totalByDate}
          onSelectDay={onSelectDay}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1">
        {CALENDAR_LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-muted">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full border ${item.ring ? 'border-2 border-navy' : 'border-[#e0e6f0]'}`}
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
