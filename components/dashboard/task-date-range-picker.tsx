'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';

// Hàm ngày tháng riêng cho component này (trùng bản ở personal-task-board.tsx/
// task-calendar.tsx) — theo đúng tiền lệ lặp nhỏ đã chấp nhận trong repo thay
// vì tách file util dùng chung.
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
function nextSaturday(dateStr: string): string {
  const date = parseISO(dateStr);
  const diff = (6 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + diff);
  return toISO(date);
}
function formatVi(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export interface TaskRecurrence {
  unit: 'none' | 'daily' | 'weekly' | 'monthly';
  count: number;
}

const RECURRENCE_OPTIONS: Array<{ value: TaskRecurrence['unit']; label: string }> = [
  { value: 'none', label: 'Không lặp lại' },
  { value: 'daily', label: 'Hằng ngày' },
  { value: 'weekly', label: 'Hằng tuần' },
  { value: 'monthly', label: 'Hằng tháng' },
];

interface TaskDateRangePickerProps {
  startDate: string;
  dueDate: string | null;
  today: string;
  onChange: (next: { startDate: string; dueDate: string | null }) => void;
  recurrence?: TaskRecurrence;
  onRecurrenceChange?: (next: TaskRecurrence) => void;
}

/** Chọn ngày bắt đầu/kết thúc cho task cá nhân (kéo dài nhiều ngày thay vì
 *  luôn đúng 1 ngày). Cố tình làm dạng panel mở rộng ngay tại chỗ (giống các
 *  panel khác trong personal-task-board.tsx) thay vì popover nổi tuyệt đối —
 *  cả form thêm thẻ lẫn drawer chi tiết đều nằm trong khối cuộn
 *  (overflow-x-auto / overflow-y-auto), popover tuyệt đối sẽ bị cắt mất. */
export default function TaskDateRangePicker({
  startDate,
  dueDate,
  today,
  onChange,
  recurrence,
  onRecurrenceChange,
}: TaskDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState<'start' | 'due'>('start');
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(startDate));
  const [recurringOpen, setRecurringOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setMonthAnchor(startOfMonth(activeField === 'due' && dueDate ? dueDate : startDate));
      setActiveField('start');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function applyPick(dateStr: string) {
    if (activeField === 'due') {
      if (dateStr <= startDate) {
        onChange({ startDate: dateStr, dueDate: null });
      } else {
        onChange({ startDate, dueDate: dateStr });
      }
    } else {
      onChange({ startDate: dateStr, dueDate: dueDate && dueDate > dateStr ? dueDate : null });
      setActiveField('due');
    }
  }

  const presets: Array<{ key: string; label: string; date: string }> = [
    { key: 'today', label: 'Hôm nay', date: today },
    { key: 'tomorrow', label: 'Ngày mai', date: addDays(today, 1) },
    { key: 'this_weekend', label: 'Cuối tuần này', date: nextSaturday(today) },
    { key: 'next_week', label: 'Tuần sau', date: addDays(today, 7) },
    { key: 'next_weekend', label: 'Cuối tuần sau', date: addDays(nextSaturday(today), 7) },
    { key: '2w', label: '2 tuần', date: addDays(today, 14) },
  ];

  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const gridStart = startOfWeek(monthStart);
  const cells: string[] = [];
  let cursor = gridStart;
  for (let i = 0; i < 42; i += 1) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
  }
  while (cells.length > 35 && cells.slice(-7).every((d) => d > monthEnd)) {
    cells.splice(-7, 7);
  }
  const [my, mm] = monthAnchor.split('-');
  const monthLabel = `Tháng ${Number(mm)}, ${my}`;

  function cellClass(dateStr: string): string {
    const isStart = dateStr === startDate;
    const isDue = dueDate !== null && dateStr === dueDate;
    const inRange = dueDate !== null && dateStr > startDate && dateStr < dueDate;
    if (isStart && (isDue || !dueDate)) return 'rounded-full bg-blue text-white font-bold';
    if (isStart) return 'rounded-l-full bg-blue text-white font-bold';
    if (isDue) return 'rounded-r-full bg-blue text-white font-bold';
    if (inRange) return 'bg-blue/25 text-white';
    if (dateStr === today) return 'text-white font-bold ring-1 ring-inset ring-blue';
    return 'text-white/80 hover:bg-white/10';
  }

  const rangeLabel = dueDate && dueDate !== startDate ? `${formatVi(startDate)} → ${formatVi(dueDate)}` : formatVi(startDate);

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex h-9 w-full items-center gap-1.5 rounded-[6px] border border-transparent bg-navy-deep px-2.5 text-xs font-semibold text-white outline-none hover:border-blue"
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" />
        {rangeLabel}
        {recurrence && recurrence.unit !== 'none' && (
          <span className="ml-auto flex items-center gap-0.5 text-[10px] font-bold text-blue">
            <Repeat className="h-3 w-3" aria-hidden="true" />
            {RECURRENCE_OPTIONS.find((o) => o.value === recurrence.unit)?.label}
          </span>
        )}
      </button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="rounded-[10px] border border-black/20 bg-navy-deep p-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveField('start')}
          className={`flex h-8 flex-1 items-center justify-center rounded-[6px] border px-2 text-xs font-semibold transition-colors ${
            activeField === 'start' ? 'border-blue bg-blue text-white' : 'border-white/15 text-white/80 hover:border-blue/50'
          }`}
        >
          {formatVi(startDate)}
        </button>
        <span className="text-xs text-white/40">→</span>
        <button
          type="button"
          onClick={() => setActiveField('due')}
          className={`flex h-8 flex-1 items-center justify-center rounded-[6px] border px-2 text-xs font-semibold transition-colors ${
            activeField === 'due'
              ? 'border-blue bg-blue text-white'
              : dueDate
                ? 'border-white/15 text-white/80 hover:border-blue/50'
                : 'border-dashed border-white/20 text-white/40 hover:border-blue/50'
          }`}
        >
          {dueDate ? formatVi(dueDate) : 'Kết thúc'}
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPick(p.date)}
            className="flex items-center justify-between gap-1 rounded-[6px] px-2 py-1.5 text-left text-[11px] font-semibold text-white/85 hover:bg-white/10"
          >
            <span>{p.label}</span>
            <span className="text-white/40">{formatVi(p.date)}</span>
          </button>
        ))}
      </div>

      <div className="mt-2 border-t border-white/10 pt-2">
        <div className="mb-1.5 flex items-center justify-between">
          <button type="button" onClick={() => setMonthAnchor((m) => addDays(startOfMonth(m), -1))} aria-label="Tháng trước" className="grid h-6 w-6 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <strong className="font-heading text-xs text-white">{monthLabel}</strong>
          <button type="button" onClick={() => setMonthAnchor((m) => addDays(endOfMonth(m), 1))} aria-label="Tháng sau" className="grid h-6 w-6 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-0.5 text-center text-[9px] font-bold text-white/40">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((dateStr, i) => {
            const inMonth = dateStr >= monthStart && dateStr <= monthEnd;
            return (
              <button
                key={`${dateStr}-${i}`}
                type="button"
                disabled={!inMonth}
                onClick={() => applyPick(dateStr)}
                className={`h-7 w-full text-[11px] ${inMonth ? cellClass(dateStr) : 'invisible'}`}
              >
                {Number(dateStr.slice(8, 10))}
              </button>
            );
          })}
        </div>
      </div>

      {recurrence && onRecurrenceChange && (
        <div className="mt-2 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={() => setRecurringOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 rounded-[6px] px-1 py-1 text-left text-xs font-semibold text-white/85 hover:bg-white/10"
          >
            <Repeat className="h-3.5 w-3.5 text-white/50" aria-hidden="true" />
            Đặt lặp lại
            <span className="ml-auto text-[11px] font-normal text-white/40">
              {RECURRENCE_OPTIONS.find((o) => o.value === recurrence.unit)?.label}
            </span>
          </button>
          {recurringOpen && (
            <div className="mt-1.5 flex flex-col gap-1 pl-1">
              {RECURRENCE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs text-white/85">
                  <input
                    type="radio"
                    name="task-recurrence"
                    checked={recurrence.unit === opt.value}
                    onChange={() => onRecurrenceChange({ unit: opt.value, count: recurrence.count })}
                  />
                  {opt.label}
                </label>
              ))}
              {recurrence.unit !== 'none' && (
                <label className="mt-1 flex items-center gap-2 text-xs text-white/85">
                  Số lần lặp
                  <input
                    type="number"
                    min={2}
                    max={52}
                    value={recurrence.count}
                    onChange={(e) => onRecurrenceChange({ unit: recurrence.unit, count: Math.min(52, Math.max(2, Number(e.target.value) || 2)) })}
                    className="h-7 w-16 rounded border border-white/20 bg-white/5 px-1.5 text-xs text-white outline-none focus:border-blue"
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex justify-end border-t border-white/10 pt-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-[6px] bg-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-cta">
          Xong
        </button>
      </div>
    </div>
  );
}
