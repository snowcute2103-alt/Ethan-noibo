'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from 'react';
import Image from 'next/image';
import { ArrowLeft, Check, MoreVertical, Plus, StickyNote, X } from 'lucide-react';
import type { Task, TaskStatus, MonthDayCategoryCount } from '@/lib/tasks';
import TaskCalendar from '@/components/dashboard/task-calendar';
import { useCheckboxConfetti } from '@/components/dashboard/checkbox-confetti';
import {
  getMyPersonalBoardAction,
  getPersonalBoardAsBgdAction,
  getMyPersonalMonthDayCountsAction,
  createPersonalTaskAction,
  updatePersonalTaskAction,
  deletePersonalTaskAction,
  duplicatePersonalTaskAction,
} from '@/app/dashboard/giao-task/actions';

// Cùng khoảng polling đã có tiền lệ ở task-board.tsx / sticky-board.tsx.
const POLL_INTERVAL_MS = 150_000;

type ViewMode = 'day' | 'week' | 'month';

interface DateRange {
  fromDate: string;
  toDate: string;
}

interface PersonalTaskBoardProps {
  today: string;
  ownerUserId: number;
  viewerIsBgd: boolean;
  ownerName?: string;
  onBack?: () => void;
}

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
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return toISO(date);
}
function rangeFor(mode: ViewMode, anchor: string): DateRange {
  if (mode === 'day') return { fromDate: anchor, toDate: anchor };
  if (mode === 'week') {
    const start = startOfWeek(anchor);
    return { fromDate: start, toDate: addDays(start, 6) };
  }
  return { fromDate: startOfMonth(anchor), toDate: endOfMonth(anchor) };
}
function shiftAnchor(mode: ViewMode, anchor: string, direction: 1 | -1): string {
  if (mode === 'day') return addDays(anchor, direction);
  if (mode === 'week') return addDays(anchor, direction * 7);
  const date = parseISO(anchor);
  date.setUTCMonth(date.getUTCMonth() + direction);
  return toISO(date);
}
function formatVi(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase();
}

const KANBAN_BOARD_COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: 'not_started', label: 'Chưa làm', dot: 'bg-[#B7C2D6]' },
  { status: 'in_progress', label: 'Đang làm', dot: 'bg-blue' },
  { status: 'done', label: 'Hoàn thành', dot: 'bg-emerald-500' },
];

export default function PersonalTaskBoard({ today, ownerUserId, viewerIsBgd, ownerName, onBack }: PersonalTaskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [anchorDate, setAnchorDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [monthProgress, setMonthProgress] = useState({ done: 0, total: 0 });
  const [monthDayCounts, setMonthDayCounts] = useState<MonthDayCategoryCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const range = useMemo(() => rangeFor(viewMode, anchorDate), [viewMode, anchorDate]);
  const calendarYearMonth = anchorDate.slice(0, 7);

  async function refresh(opts?: { silent?: boolean }) {
    try {
      const result = viewerIsBgd
        ? await getPersonalBoardAsBgdAction(ownerUserId, range)
        : await getMyPersonalBoardAction(range);
      setTasks(result.tasks);
      setMonthProgress(result.monthProgress);
      setError(null);
    } catch (err) {
      if (opts?.silent) {
        console.error('refresh board cá nhân (nền) lỗi:', err);
        return;
      }
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu.');
    }
  }

  useEffect(() => {
    startTransition(() => {
      void refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUserId, range.fromDate, range.toDate]);

  useEffect(() => {
    const pollId = window.setInterval(() => void refresh({ silent: true }), POLL_INTERVAL_MS);
    return () => window.clearInterval(pollId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUserId, range.fromDate, range.toDate]);

  // Lịch mini tô màu theo tháng — độc lập với viewMode/range đang chọn, cùng
  // cách KD board tải dayCategoryCounts cho TaskCalendar (task-board.tsx).
  useEffect(() => {
    getMyPersonalMonthDayCountsAction(ownerUserId, calendarYearMonth)
      .then(setMonthDayCounts)
      .catch(() => setMonthDayCounts([]));
  }, [ownerUserId, calendarYearMonth]);

  function runAction<T>(fn: () => Promise<T>, after?: () => void) {
    startTransition(() => {
      fn()
        .then(() => {
          after?.();
          void refresh({ silent: true });
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.'));
    });
  }

  const rangeLabel =
    viewMode === 'day'
      ? anchorDate === today
        ? `Hôm nay · ${formatVi(anchorDate)}`
        : formatVi(anchorDate)
      : `${formatVi(range.fromDate)} — ${formatVi(range.toDate)}`;

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-6">
        {viewerIsBgd && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue hover:text-blue-cta"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Bộ phận khác
          </button>
        )}
        <h1 className="mt-1 font-heading text-2xl font-semibold text-navy sm:text-3xl">
          {viewerIsBgd ? (ownerName ?? 'Task cá nhân') : 'Task của tôi'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PersonalKanban
            tasks={tasks}
            today={today}
            defaultDate={anchorDate}
            ownerUserId={ownerUserId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            rangeLabel={rangeLabel}
            onShiftDate={(direction) => setAnchorDate(shiftAnchor(viewMode, anchorDate, direction))}
            showTodayButton={anchorDate !== today}
            onGoToday={() => setAnchorDate(today)}
            onCreate={(input) => runAction(() => createPersonalTaskAction(ownerUserId, input))}
            onStatusChange={(task, status) => runAction(() => updatePersonalTaskAction(ownerUserId, task.id, { status }))}
            onTitleChange={(task, title) => runAction(() => updatePersonalTaskAction(ownerUserId, task.id, { title }))}
            onDelete={(task) => runAction(() => deletePersonalTaskAction(ownerUserId, task.id))}
            onDuplicate={(task, toDate) => runAction(() => duplicatePersonalTaskAction(ownerUserId, task.id, toDate))}
          />
        </div>

        <div className="flex flex-col gap-4">
          <TaskCalendar
            anchorDate={anchorDate}
            today={today}
            categories={[]}
            dayCategoryCounts={monthDayCounts}
            onSelectDay={(date) => {
              setAnchorDate(date);
              setViewMode('day');
            }}
            onShiftMonth={(direction) => setAnchorDate(shiftAnchor('month', anchorDate, direction))}
          />
          <div className="rounded-[14px] border border-[#e8edf5] bg-white px-4 py-3">
            <p className="text-xs font-semibold text-muted">Tiến độ tháng {anchorDate.slice(5, 7)}</p>
            <p className="mt-1 font-heading text-lg font-bold text-navy">
              {monthProgress.done}/{monthProgress.total} <span className="text-xs font-normal text-muted">hoàn thành</span>
            </p>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="fixed bottom-4 right-4 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Đang xử lý…
        </div>
      )}
    </div>
  );
}

function PersonalKanban({
  tasks,
  today,
  defaultDate,
  ownerUserId,
  viewMode,
  onViewModeChange,
  rangeLabel,
  onShiftDate,
  showTodayButton,
  onGoToday,
  onCreate,
  onStatusChange,
  onTitleChange,
  onDelete,
  onDuplicate,
}: {
  tasks: Task[];
  today: string;
  defaultDate: string;
  ownerUserId: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  rangeLabel: string;
  onShiftDate: (direction: 1 | -1) => void;
  showTodayButton: boolean;
  onGoToday: () => void;
  onCreate: (input: { taskDate: string; title: string; status: TaskStatus }) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onTitleChange: (task: Task, title: string) => void;
  onDelete: (task: Task) => void;
  onDuplicate: (task: Task, toDate: string) => void;
}) {
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  function handleDrop(status: TaskStatus, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    const task = tasksById.get(taskId);
    if (task && task.status !== status) onStatusChange(task, status);
  }

  // Task do người khác (BGĐ xem hộ) tạo hộ — hiện riêng ở cột "Task Sếp đưa"
  // thay vì lẫn vào "Chưa làm", cho tới khi được kéo sang Đang làm/Hoàn
  // thành (từ đó dùng chung 2 cột đó với task tự tạo, vẫn giữ nhãn người giao).
  const bossTasks = tasks.filter((t) => t.status === 'not_started' && t.createdBy !== null && t.createdBy !== ownerUserId);
  const bossTaskIds = new Set(bossTasks.map((t) => t.id));

  return (
    <div
      className="flex flex-col gap-4 rounded-[16px] p-4 shadow-[0_16px_40px_-24px_rgba(16,26,48,0.45)]"
      style={{ background: 'linear-gradient(135deg, #1A2745 0%, #0052CC 55%, #00D2FF 130%)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-[10px] bg-white/10 p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold ${
                viewMode === mode ? 'bg-white text-blue shadow-sm' : 'text-white/70'
              }`}
            >
              {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-[10px] bg-white/10 px-2 py-1.5 text-xs">
          <button type="button" onClick={() => onShiftDate(-1)} className="rounded px-1.5 py-0.5 text-white/80 hover:bg-white/20">
            ‹
          </button>
          <span className="font-semibold text-white">{rangeLabel}</span>
          <button type="button" onClick={() => onShiftDate(1)} className="rounded px-1.5 py-0.5 text-white/80 hover:bg-white/20">
            ›
          </button>
          {showTodayButton && (
            <button type="button" onClick={onGoToday} className="ml-1 font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white">
              Về hôm nay
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto">
      <div className="flex w-72 shrink-0 flex-col rounded-[14px] bg-navy-deep p-2.5 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.7)]">
        <div className="mb-2 flex items-center gap-2 px-1">
          <span className="h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
          <strong className="font-heading text-sm text-white">Task Sếp đưa</strong>
          <span className="ml-auto text-xs font-bold text-white/60">{bossTasks.length}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {bossTasks.map((task) => (
            <PersonalKanbanCard
              key={task.id}
              task={task}
              today={today}
              ownerUserId={ownerUserId}
              onStatusChange={(status) => onStatusChange(task, status)}
              onTitleChange={(title) => onTitleChange(task, title)}
              onDelete={() => onDelete(task)}
              onDuplicate={(toDate) => onDuplicate(task, toDate)}
            />
          ))}
          {bossTasks.length === 0 && <p className="px-1 py-2 text-xs text-white/50">Không có task.</p>}
        </div>
        <div className="mt-2">
          <PersonalKanbanQuickAdd status="not_started" defaultDate={defaultDate} onCreate={onCreate} />
        </div>
      </div>
      {KANBAN_BOARD_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status && !(col.status === 'not_started' && bossTaskIds.has(t.id)));
        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(col.status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
            onDrop={(e) => handleDrop(col.status, e)}
            className={`flex w-72 shrink-0 flex-col rounded-[14px] p-2.5 shadow-[0_10px_24px_-16px_rgba(0,0,0,0.7)] transition-colors ${
              dragOverStatus === col.status ? 'bg-navy-2' : 'bg-navy-deep'
            }`}
          >
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} aria-hidden="true" />
              <strong className="font-heading text-sm text-white">{col.label}</strong>
              <span className="ml-auto text-xs font-bold text-white/60">{colTasks.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {colTasks.map((task) => (
                <PersonalKanbanCard
                  key={task.id}
                  task={task}
                  today={today}
                  ownerUserId={ownerUserId}
                  onStatusChange={(status) => onStatusChange(task, status)}
                  onTitleChange={(title) => onTitleChange(task, title)}
                  onDelete={() => onDelete(task)}
                  onDuplicate={(toDate) => onDuplicate(task, toDate)}
                />
              ))}
              {colTasks.length === 0 && <p className="px-1 py-2 text-xs text-white/50">Không có task.</p>}
            </div>
            <div className="mt-2">
              <PersonalKanbanQuickAdd
                status={col.status}
                defaultDate={defaultDate}
                onCreate={onCreate}
              />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

/** Card task cá nhân — kéo được (native HTML5 DnD), sửa tiêu đề inline (click
 *  vào tiêu đề), menu "⋮" xoá + nhân bản sang ngày khác. Không hiện avatar
 *  người phụ trách (task cá nhân chỉ có đúng 1 người: chủ task) — avatar duy
 *  nhất có thể hiện là của NGƯỜI GIAO (createdBy khác ownerUserId, tức BGĐ tạo
 *  hộ), để phân biệt task "sếp đưa" với task tự thêm. */
function PersonalKanbanCard({
  task,
  today,
  ownerUserId,
  onStatusChange,
  onTitleChange,
  onDelete,
  onDuplicate,
}: {
  task: Task;
  today: string;
  ownerUserId: number;
  onStatusChange: (status: TaskStatus) => void;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onDuplicate: (toDate: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [duplicating, setDuplicating] = useState(false);
  const [dupDate, setDupDate] = useState(task.taskDate);
  const [detailOpen, setDetailOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { fire: fireConfetti, node: confettiNode } = useCheckboxConfetti();
  const isFromBoss = task.createdBy !== null && task.createdBy !== ownerUserId;

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (!cardRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  function commitTitle() {
    setEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) onTitleChange(trimmed);
    else setTitle(task.title);
  }

  const dateTone =
    task.status === 'done'
      ? 'bg-emerald-50 text-emerald-600'
      : task.taskDate < today
        ? 'bg-red-50 text-red-600'
        : task.taskDate === today
          ? 'bg-[#E7F0FF] text-blue'
          : 'bg-surface-2 text-muted';

  return (
    <div
      ref={cardRef}
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => {
        if (!editing) setDetailOpen(true);
      }}
      title="Bấm để xem chi tiết task"
      className="group flex cursor-grab gap-2.5 rounded-[10px] bg-white/[0.07] p-3 transition-colors hover:bg-white/[0.12] active:cursor-grabbing"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.status === 'done'}
        onClick={(e) => {
          e.stopPropagation();
          const next: TaskStatus = task.status === 'done' ? 'not_started' : 'done';
          if (next === 'done') {
            const rect = e.currentTarget.getBoundingClientRect();
            fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
          onStatusChange(next);
        }}
        aria-label={task.status === 'done' ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
          task.status === 'done'
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-white/40 text-transparent hover:border-white/70'
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      </button>
      {confettiNode}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <input
              autoFocus
              value={title}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitle(task.title);
                  setEditing(false);
                }
              }}
              className="w-full rounded border border-blue bg-white px-1.5 py-0.5 text-sm font-semibold text-navy outline-none"
            />
          ) : (
            <p
              className={`cursor-text text-sm font-semibold ${task.status === 'done' ? 'text-white/50 line-through' : 'text-white'}`}
              onClick={(e) => {
                e.stopPropagation();
                setTitle(task.title);
                setEditing(true);
              }}
              title="Bấm để sửa tiêu đề"
            >
              {task.title}
            </p>
          )}
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Tuỳ chọn task"
              className="grid h-6 w-6 place-items-center rounded text-white/50 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
            >
              <MoreVertical size={14} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-7 z-20 w-40 border border-[#e8edf5] bg-white py-1 text-xs shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDuplicating(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left font-semibold text-navy hover:bg-[#f2f5fa]"
                >
                  Nhân bản…
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left font-semibold text-red-500 hover:bg-[#f2f5fa]"
                >
                  Xoá
                </button>
              </div>
            )}
          </div>
        </div>
        {task.note && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/50">
            <StickyNote className="h-3 w-3 shrink-0" aria-hidden="true" />
            {task.note}
          </p>
        )}
        {isFromBoss && task.createdByFullName && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gold-2">
            {task.createdByAvatarUrl ? (
              <Image
                src={task.createdByAvatarUrl}
                alt={task.createdByFullName}
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gold text-[8px] font-bold text-navy">
                {initialsOf(task.createdByFullName)}
              </span>
            )}
            <span className="truncate font-semibold">{task.createdByFullName} giao</span>
          </div>
        )}
        <div className="mt-2.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${dateTone}`}>
            {formatVi(task.taskDate).slice(0, 5)}
          </span>
        </div>
        {duplicating && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex flex-col gap-1.5 rounded-[8px] border border-[#dbe4f2] bg-white p-1.5"
        >
          <input
            type="date"
            value={dupDate}
            onChange={(e) => setDupDate(e.target.value)}
            className="w-full rounded border border-[#dbe4f2] px-1.5 py-1 text-xs outline-none focus:border-blue"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (dupDate) {
                  onDuplicate(dupDate);
                  setDuplicating(false);
                }
              }}
              className="flex-1 rounded bg-blue px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-cta"
            >
              Nhân bản
            </button>
            <button
              type="button"
              onClick={() => setDuplicating(false)}
              aria-label="Huỷ"
              className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted hover:bg-[#f2f5fa]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        )}
      </div>
      {detailOpen && (
        <TaskDetailModal task={task} isFromBoss={isFromBoss} onClose={() => setDetailOpen(false)} />
      )}
    </div>
  );
}

/** Popup xem đầy đủ nội dung 1 task cá nhân — tiêu đề/note trên thẻ Kanban bị
 *  cắt ngắn (truncate) để thẻ không giãn cao, bấm vào thẻ mở popup này để đọc
 *  trọn vẹn. Chỉ xem, sửa vẫn làm trực tiếp trên thẻ (bấm tiêu đề) như cũ. */
function TaskDetailModal({
  task,
  isFromBoss,
  onClose,
}: {
  task: Task;
  isFromBoss: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const statusLabel = KANBAN_BOARD_COLUMNS.find((c) => c.status === task.status)?.label ?? task.status;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết task"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[16px] bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-navy">Chi tiết task</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="shrink-0 text-muted hover:text-navy">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className={`text-base font-semibold text-navy ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
          {task.title}
        </p>

        {task.note && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{task.note}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
            {formatVi(task.taskDate)}
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
            {statusLabel}
          </span>
        </div>

        {isFromBoss && task.createdByFullName && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            {task.createdByAvatarUrl ? (
              <Image
                src={task.createdByAvatarUrl}
                alt={task.createdByFullName}
                width={18}
                height={18}
                className="h-[18px] w-[18px] shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#4FA3F7] text-[9px] font-bold text-white">
                {initialsOf(task.createdByFullName)}
              </span>
            )}
            <span className="font-semibold">{task.createdByFullName} giao</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonalKanbanQuickAdd({
  status,
  defaultDate,
  onCreate,
}: {
  status: TaskStatus;
  defaultDate: string;
  onCreate: (input: { taskDate: string; title: string; status: TaskStatus }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [taskDate, setTaskDate] = useState(defaultDate);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setOpen(false);
      return;
    }
    onCreate({ taskDate, title: trimmed, status });
    setTitle('');
    inputRef.current?.focus();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setTaskDate(defaultDate);
          setOpen(true);
        }}
        className="flex w-full items-center gap-1.5 rounded-[8px] px-2 py-2 text-left text-sm font-semibold text-white/60 hover:bg-white hover:text-navy"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Thêm thẻ
      </button>
    );
  }

  return (
    <div className="rounded-[10px] border border-[#dbe4f2] bg-white p-2">
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') {
            setOpen(false);
            setTitle('');
          }
        }}
        placeholder="Nhập tiêu đề task…"
        rows={2}
        className="w-full resize-none rounded-[6px] border border-[#dbe4f2] px-2 py-1.5 text-sm outline-none focus:border-blue"
      />
      <input
        type="date"
        value={taskDate}
        onChange={(e) => setTaskDate(e.target.value)}
        className="mt-1.5 w-full rounded-[6px] border border-[#dbe4f2] px-2 py-1.5 text-xs outline-none focus:border-blue"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          className="rounded-[6px] bg-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-cta"
        >
          Lưu
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
          aria-label="Huỷ"
          className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
