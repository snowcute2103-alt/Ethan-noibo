'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Flag, ImagePlus, MessageCircle, MoreVertical, Plus, StickyNote, Trash2, X } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, MonthDayCategoryCount } from '@/lib/tasks';
import TaskCalendar from '@/components/dashboard/task-calendar';
// Chỉ mở theo intent (bấm 1 task) — tách khỏi chunk ban đầu của board thay
// vì import thẳng, giảm initial JS mà không đổi hành vi (đã 'use client').
const PersonalTaskDetailDrawer = dynamic(() => import('@/components/dashboard/personal-task-detail-drawer'));
import TaskDateRangePicker, { type TaskRecurrence } from '@/components/dashboard/task-date-range-picker';
import { useCheckboxConfetti } from '@/components/dashboard/checkbox-confetti';
import {
  getMyPersonalBoardAction,
  getPersonalBoardAsBgdAction,
  createPersonalTasksAction,
  updatePersonalTaskAction,
  deletePersonalTaskAction,
  duplicatePersonalTaskAction,
  uploadPersonalTaskImageAction,
} from '@/app/dashboard/giao-task/actions';
import type { PersonalBoardCore } from '@/app/dashboard/giao-task/team-board-data';

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
  ownerAvatarUrl?: string | null;
  onBack?: () => void;
  initialBoard: PersonalBoardCore;
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
function addMonths(dateStr: string, amount: number): string {
  const date = parseISO(dateStr);
  date.setUTCMonth(date.getUTCMonth() + amount);
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
  // Về ngày 1 trước khi đổi tháng — nếu không, anchor có ngày 29/30/31 mà
  // tháng kế tiếp ngắn hơn sẽ khiến Date tự tràn thêm 1 tháng nữa (vd bấm
  // "tháng sau" từ 31/08 nhảy thẳng sang 01/10, bỏ qua cả tháng 9).
  date.setUTCDate(1);
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

const KANBAN_BOARD_COLUMNS: { status: TaskStatus; label: string; headerBg: string; bodyBg: string; ring: string }[] = [
  { status: 'not_started', label: 'Chưa làm', headerBg: 'bg-[#8B95A8]', bodyBg: 'bg-[#F1F3F7]', ring: 'ring-[#8B95A8]/50' },
  { status: 'in_progress', label: 'Đang làm', headerBg: 'bg-blue', bodyBg: 'bg-[#EBF2FE]', ring: 'ring-blue/50' },
  { status: 'done', label: 'Hoàn thành', headerBg: 'bg-emerald-500', bodyBg: 'bg-[#EAFAF3]', ring: 'ring-emerald-500/50' },
];

const QUICK_ADD_PRIORITIES: Array<{ value: TaskPriority; label: string; tone: string }> = [
  { value: 'low', label: 'Thấp', tone: 'text-slate-500' },
  { value: 'normal', label: 'Bình thường', tone: 'text-blue' },
  { value: 'high', label: 'Cao', tone: 'text-amber-600' },
];

// GIF 1x1 trong suốt — thay cho ảnh "bóng mờ" mặc định của trình duyệt khi kéo
// thả kiểu HTML5 DnD, để nhường chỗ cho thẻ nổi (floating preview) tự vẽ bên
// dưới bám theo con trỏ, giống hiệu ứng "nhấc thẻ lên" của Trello.
const TRANSPARENT_DRAG_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';

const SPRING_TRANSITION = { type: 'spring', stiffness: 500, damping: 34, mass: 0.7 } as const;

export default function PersonalTaskBoard({
  today,
  ownerUserId,
  viewerIsBgd,
  ownerName,
  ownerAvatarUrl,
  onBack,
  initialBoard,
}: PersonalTaskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [anchorDate, setAnchorDate] = useState(today);
  // Tháng đang XEM trên lịch mini — tách khỏi anchorDate (ngày đang chọn để
  // xem task) để bấm chọn 1 ngày ở lưới tháng dưới không làm cặp tháng đang
  // hiện bị dịch theo; chỉ nút ‹/› trên lịch mini mới dịch state này (xem
  // task-board.tsx, cùng cách xử lý cho board đội KD).
  const [calendarMonthAnchor, setCalendarMonthAnchor] = useState(today);
  const [tasks, setTasks] = useState<Task[]>(initialBoard.tasks);
  const [monthProgress, setMonthProgress] = useState(initialBoard.monthProgress);
  const [monthDayCounts, setMonthDayCounts] = useState<MonthDayCategoryCount[]>(initialBoard.monthDayCounts);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [createRequest, setCreateRequest] = useState<TaskStatus | null>(null);
  const [isPending, startTransition] = useTransition();
  const didMount = useRef(false);
  const refreshRequestRef = useRef(0);

  const range = useMemo(() => rangeFor(viewMode, anchorDate), [viewMode, anchorDate]);
  const calendarYearMonth = calendarMonthAnchor.slice(0, 7);
  const previousMonthYearMonth = useMemo(
    () => addMonths(startOfMonth(calendarMonthAnchor), -1).slice(0, 7),
    [calendarMonthAnchor]
  );
  async function refresh(opts?: { silent?: boolean }) {
    const requestId = ++refreshRequestRef.current;
    try {
      const result = viewerIsBgd
        ? await getPersonalBoardAsBgdAction(ownerUserId, range, calendarYearMonth)
        : await getMyPersonalBoardAction(range, calendarYearMonth);
      if (requestId !== refreshRequestRef.current) return;
      setTasks(result.tasks);
      setMonthProgress(result.monthProgress);
      setMonthDayCounts(result.monthDayCounts);
      setError(null);
    } catch (err) {
      if (requestId !== refreshRequestRef.current) return;
      if (opts?.silent) {
        console.error('refresh board cá nhân (nền) lỗi:', err);
        return;
      }
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu.');
    }
  }

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    startTransition(() => {
      void refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUserId, range.fromDate, range.toDate, calendarYearMonth]);

  useEffect(() => {
    let refreshInFlight = false;
    let lastSyncAt = 0;
    const syncWhenVisible = () => {
      const now = Date.now();
      if (document.visibilityState !== 'visible' || refreshInFlight || now - lastSyncAt < 1_000) return;
      lastSyncAt = now;
      refreshInFlight = true;
      void refresh({ silent: true }).finally(() => {
        refreshInFlight = false;
      });
    };
    const pollId = window.setInterval(syncWhenVisible, POLL_INTERVAL_MS);
    const onVisibilityChange = () => syncWhenVisible();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', syncWhenVisible);
    return () => {
      window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', syncWhenVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUserId, range.fromDate, range.toDate, calendarYearMonth]);

  function reconcileTasks(changes: Array<{ previous: Task | null; next: Task | null }>) {
    const inRange = (task: Task) => task.taskDate >= range.fromDate && task.taskDate <= range.toDate;
    const inMonth = (task: Task) => task.taskDate.startsWith(calendarYearMonth);
    // monthDayCounts (lịch mini) phủ cả calendarYearMonth lẫn tháng liền
    // trước (xem getPersonalMonthDayCounts) — khác monthProgress (thẻ "Tiến
    // độ tháng") chỉ tính riêng calendarYearMonth.
    const inTrackedMonths = (task: Task) => inMonth(task) || task.taskDate.startsWith(previousMonthYearMonth);

    setTasks((current) => {
      const nextById = new Map(current.map((task) => [task.id, task]));
      for (const change of changes) {
        if (change.previous) nextById.delete(change.previous.id);
        if (change.next && inRange(change.next)) nextById.set(change.next.id, change.next);
      }
      return [...nextById.values()];
    });
    setMonthProgress((current) => {
      let done = current.done;
      let total = current.total;
      for (const { previous, next } of changes) {
        if (previous && inMonth(previous)) {
          total -= 1;
          if (previous.status === 'done') done -= 1;
        }
        if (next && inMonth(next)) {
          total += 1;
          if (next.status === 'done') done += 1;
        }
      }
      return { done: Math.max(0, done), total: Math.max(0, total) };
    });
    setMonthDayCounts((current) => {
      const counts = new Map(current.map((item) => [`${item.date}:${item.categoryId ?? 'none'}`, { ...item }]));
      const adjust = (task: Task, delta: number) => {
        if (!inTrackedMonths(task)) return;
        const key = `${task.taskDate}:none`;
        const existing = counts.get(key) ?? { date: task.taskDate, categoryId: null, count: 0 };
        const count = existing.count + delta;
        if (count > 0) counts.set(key, { ...existing, count });
        else counts.delete(key);
      };
      for (const { previous, next } of changes) {
        if (previous) adjust(previous, -1);
        if (next) adjust(next, 1);
      }
      return [...counts.values()];
    });
  }

  function runAction<T>(fn: () => Promise<T>, after?: (result: T) => void) {
    startTransition(() => {
      fn()
        .then((result) => after?.(result))
        .catch((err) => setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.'));
    });
  }

  // Đổi trạng thái (kéo-thả sang cột khác, hoặc bấm checkbox) cập nhật `tasks`
  // ngay tại chỗ trước khi gọi server — nếu đợi round-trip rồi mới refresh thì
  // thẻ chỉ "nhảy" cột sau một nhịp trễ mạng, hiệu ứng kéo-thả mượt (Trello)
  // sẽ mất tác dụng. Lỗi thì hoàn tác lại state cũ.
  function changeStatus(task: Task, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    startTransition(() => {
      updatePersonalTaskAction(ownerUserId, task.id, { status })
        .then((updated) => reconcileTasks([{ previous: task, next: updated }]))
        .catch((err) => {
          setTasks((current) =>
            current.map((item) => (item.id === task.id && item.status === status ? task : item))
          );
          setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
        });
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
        <div className="mt-1 flex items-center gap-3">
          {ownerName &&
            (ownerAvatarUrl ? (
              <Image
                src={ownerAvatarUrl}
                alt={ownerName}
                width={52}
                height={52}
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm sm:h-[52px] sm:w-[52px]"
                priority
              />
            ) : (
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#4FA3F7] font-heading text-base font-bold text-white ring-2 ring-white shadow-sm sm:h-[52px] sm:w-[52px] sm:text-lg"
                aria-hidden="true"
              >
                {initialsOf(ownerName)}
              </span>
            ))}
          <h1 className="font-heading text-2xl font-semibold text-navy sm:text-3xl">
            {viewerIsBgd ? (ownerName ?? 'Task cá nhân') : 'Task của tôi'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PersonalKanban
            tasks={tasks}
            today={today}
            ownerUserId={ownerUserId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            rangeLabel={rangeLabel}
            onShiftDate={(direction) => setAnchorDate(shiftAnchor(viewMode, anchorDate, direction))}
            showTodayButton={anchorDate !== today}
            onGoToday={() => setAnchorDate(today)}
            onRequestCreate={(status) => setCreateRequest(status)}
            onStatusChange={changeStatus}
            onTitleChange={(task, title) =>
              runAction(
                () => updatePersonalTaskAction(ownerUserId, task.id, { title }),
                (updated) => reconcileTasks([{ previous: task, next: updated }])
              )
            }
            onDelete={(task) =>
              runAction(() => deletePersonalTaskAction(ownerUserId, task.id), () =>
                reconcileTasks([{ previous: task, next: null }])
              )
            }
            onDuplicate={(task, toDate) =>
              runAction(
                () => duplicatePersonalTaskAction(ownerUserId, task.id, toDate),
                (created) => reconcileTasks([{ previous: null, next: created }])
              )
            }
            onOpenDetail={(task) => setSelectedTaskId(task.id)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <TaskCalendar
            viewAnchor={calendarMonthAnchor}
            selectedDate={anchorDate}
            today={today}
            categories={[]}
            dayCategoryCounts={monthDayCounts}
            onSelectDay={(date) => {
              setAnchorDate(date);
              setViewMode('day');
            }}
            onShiftMonth={(direction) => {
              setAnchorDate(shiftAnchor('month', anchorDate, direction));
              setCalendarMonthAnchor(shiftAnchor('month', calendarMonthAnchor, direction));
            }}
          />
          <div className="rounded-[14px] border border-[#e8edf5] bg-white px-4 py-3">
            <p className="text-xs font-semibold text-muted">Tiến độ tháng {calendarYearMonth.slice(5, 7)}</p>
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
      {selectedTaskId !== null && tasks.find((task) => task.id === selectedTaskId) && (
        <PersonalTaskDetailDrawer
          task={tasks.find((task) => task.id === selectedTaskId)!}
          ownerUserId={ownerUserId}
          today={today}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => {
            const previous = tasks.find((item) => item.id === updated.id) ?? null;
            reconcileTasks([{ previous, next: updated }]);
          }}
        />
      )}
      {createRequest !== null && (
        <PersonalTaskCreateDrawer
          ownerUserId={ownerUserId}
          today={today}
          status={createRequest}
          defaultDate={anchorDate}
          onClose={() => setCreateRequest(null)}
          onCreated={(created) => {
            reconcileTasks(created.map((task) => ({ previous: null, next: task })));
            setCreateRequest(null);
          }}
        />
      )}
    </div>
  );
}

function PersonalKanban({
  tasks,
  today,
  ownerUserId,
  viewMode,
  onViewModeChange,
  rangeLabel,
  onShiftDate,
  showTodayButton,
  onGoToday,
  onRequestCreate,
  onStatusChange,
  onTitleChange,
  onDelete,
  onDuplicate,
  onOpenDetail,
}: {
  tasks: Task[];
  today: string;
  ownerUserId: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  rangeLabel: string;
  onShiftDate: (direction: 1 | -1) => void;
  showTodayButton: boolean;
  onGoToday: () => void;
  onRequestCreate: (status: TaskStatus) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onTitleChange: (task: Task, title: string) => void;
  onDelete: (task: Task) => void;
  onDuplicate: (task: Task, toDate: string) => void;
  onOpenDetail: (task: Task) => void;
}) {
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  // Thẻ đang được kéo + toạ độ con trỏ — dùng để vẽ 1 thẻ nổi bám theo chuột
  // (render ở cuối JSX bên dưới), thay cho ảnh bóng mờ mặc định của trình
  // duyệt, giống hiệu ứng "nhấc thẻ lên" mượt mà của Trello.
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  function handleDrop(status: TaskStatus, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    // Dọn thẻ nổi ngay tại đây (không đợi sự kiện `dragend` của thẻ nguồn) —
    // sau khi đổi trạng thái, thẻ nguồn có thể bị unmount khỏi cột cũ trước
    // khi trình duyệt kịp bắn `dragend`, khiến thẻ nổi bị kẹt lại trên màn hình.
    setDragOverStatus(null);
    setDraggingTask(null);
    setDragPoint(null);
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    const task = tasksById.get(taskId);
    if (task && task.status !== status) onStatusChange(task, status);
  }

  function endDrag() {
    setDraggingTask(null);
    setDragPoint(null);
    setDragOverStatus(null);
  }

  // Task do người khác (BGĐ xem hộ) tạo hộ — hiện riêng ở cột "Task Sếp đưa"
  // thay vì lẫn vào "Chưa làm", cho tới khi được kéo sang Đang làm/Hoàn
  // thành (từ đó dùng chung 2 cột đó với task tự tạo, vẫn giữ nhãn người giao).
  const bossTasks = tasks.filter((t) => t.status === 'not_started' && t.createdBy !== null && t.createdBy !== ownerUserId);
  const bossTaskIds = new Set(bossTasks.map((t) => t.id));

  return (
    <div className="flex flex-col gap-4 rounded-[16px] bg-navy-deep p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRequestCreate('not_started')}
            className="flex h-11 items-center gap-1.5 rounded-[10px] bg-blue px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-cta"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Thêm task
          </button>
          <div className="flex h-11 gap-1 rounded-[10px] border border-[#dbe4f2] bg-white p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`h-full rounded-[8px] px-3 text-xs font-semibold ${
                  viewMode === mode ? 'bg-blue text-white shadow-sm' : 'text-muted hover:text-navy'
                }`}
              >
                {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-[10px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-xs">
          <button type="button" onClick={() => onShiftDate(-1)} className="rounded px-1.5 py-0.5 text-muted hover:bg-surface-2 hover:text-navy">
            ‹
          </button>
          <span className="font-semibold text-navy">{rangeLabel}</span>
          <button type="button" onClick={() => onShiftDate(1)} className="rounded px-1.5 py-0.5 text-muted hover:bg-surface-2 hover:text-navy">
            ›
          </button>
          {showTodayButton && (
            <button type="button" onClick={onGoToday} className="ml-1 font-semibold text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue">
              Về hôm nay
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverStatus('not_started');
        }}
        onDragLeave={() => setDragOverStatus((s) => (s === 'not_started' ? null : s))}
        onDrop={(e) => handleDrop('not_started', e)}
        className={`flex min-w-[210px] flex-1 flex-col overflow-hidden shadow-[0_10px_24px_-18px_rgba(16,26,48,0.35)] transition-all duration-200 ${
          dragOverStatus === 'not_started' ? 'scale-[1.015] ring-2 ring-inset ring-gold/50' : 'scale-100 ring-2 ring-inset ring-transparent'
        }`}
      >
        <div className="flex items-center gap-2 bg-gold px-3 py-2.5">
          <strong className="font-heading text-sm font-normal uppercase tracking-[0.1em] text-navy">Task Sếp đưa</strong>
          <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-white/40 px-1 text-xs font-bold text-navy">{bossTasks.length}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 bg-[#FDF6E7] p-2.5">
          <AnimatePresence initial={false}>
            {bossTasks.map((task) => (
              <PersonalKanbanCard
                key={task.id}
                task={task}
                today={today}
                ownerUserId={ownerUserId}
                isDragging={draggingTask?.id === task.id}
                onDragLift={(x, y) => {
                  setDraggingTask(task);
                  setDragPoint({ x, y });
                }}
                onDragMove={(x, y) => setDragPoint({ x, y })}
                onDragRelease={endDrag}
                onStatusChange={(status) => onStatusChange(task, status)}
                onTitleChange={(title) => onTitleChange(task, title)}
                onDelete={() => onDelete(task)}
                onDuplicate={(toDate) => onDuplicate(task, toDate)}
                onOpenDetail={() => onOpenDetail(task)}
              />
            ))}
          </AnimatePresence>
          {bossTasks.length === 0 && <p className="px-1 py-2 text-xs text-muted">Không có task.</p>}
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
            className={`flex min-w-[210px] flex-1 flex-col overflow-hidden shadow-[0_10px_24px_-18px_rgba(16,26,48,0.35)] transition-all duration-200 ${
              dragOverStatus === col.status ? `scale-[1.015] ring-2 ring-inset ${col.ring}` : 'scale-100 ring-2 ring-inset ring-transparent'
            }`}
          >
            <div className={`flex items-center gap-2 px-3 py-2.5 ${col.headerBg}`}>
              <strong className="font-heading text-sm font-normal uppercase tracking-[0.1em] text-white">{col.label}</strong>
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-white/25 px-1 text-xs font-bold text-white">{colTasks.length}</span>
            </div>
            <div className={`flex flex-1 flex-col gap-2 p-2.5 ${col.bodyBg}`}>
              <AnimatePresence initial={false}>
                {colTasks.map((task) => (
                  <PersonalKanbanCard
                    key={task.id}
                    task={task}
                    today={today}
                    ownerUserId={ownerUserId}
                    isDragging={draggingTask?.id === task.id}
                    onDragLift={(x, y) => {
                      setDraggingTask(task);
                      setDragPoint({ x, y });
                    }}
                    onDragMove={(x, y) => setDragPoint({ x, y })}
                    onDragRelease={endDrag}
                    onStatusChange={(status) => onStatusChange(task, status)}
                    onTitleChange={(title) => onTitleChange(task, title)}
                    onDelete={() => onDelete(task)}
                    onDuplicate={(toDate) => onDuplicate(task, toDate)}
                    onOpenDetail={() => onOpenDetail(task)}
                  />
                ))}
              </AnimatePresence>
              {colTasks.length === 0 && <p className="px-1 py-2 text-xs text-muted">Không có task.</p>}
            </div>
          </div>
        );
      })}
      </div>

      {/* Thẻ nổi bám theo con trỏ trong lúc kéo — che ảnh bóng mờ mặc định của
          trình duyệt (đã vô hiệu bằng TRANSPARENT_DRAG_IMAGE ở PersonalKanbanCard),
          tạo cảm giác "nhấc thẻ lên" mượt như Trello. */}
      <AnimatePresence>
        {draggingTask && dragPoint && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-[999] w-64 rounded-[10px] border border-[#e8edf5] bg-white p-3 shadow-[0_24px_48px_-12px_rgba(16,26,48,0.35)]"
            style={{ left: dragPoint.x, top: dragPoint.y }}
            initial={{ opacity: 0, scale: 1, rotate: 0, x: '-50%', y: '-50%' }}
            animate={{ opacity: 0.96, scale: 1.05, rotate: -3, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, rotate: 0 }}
            transition={SPRING_TRANSITION}
          >
            <p className="truncate text-sm font-semibold text-navy">{draggingTask.title}</p>
            {(draggingTask.description ?? draggingTask.note) && (
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                <StickyNote className="h-3 w-3 shrink-0" aria-hidden="true" />
                {draggingTask.description ?? draggingTask.note}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
  isDragging,
  onDragLift,
  onDragMove,
  onDragRelease,
  onStatusChange,
  onTitleChange,
  onDelete,
  onDuplicate,
  onOpenDetail,
}: {
  task: Task;
  today: string;
  ownerUserId: number;
  isDragging: boolean;
  onDragLift: (x: number, y: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragRelease: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onTitleChange: (title: string) => void;
  onDelete: () => void;
  onDuplicate: (toDate: string) => void;
  onOpenDetail: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [duplicating, setDuplicating] = useState(false);
  const [dupDate, setDupDate] = useState(task.taskDate);
  const cardRef = useRef<HTMLDivElement>(null);
  const suppressDetailRef = useRef(false);
  const { fire: fireConfetti, node: confettiNode } = useCheckboxConfetti();
  const isFromBoss = task.createdBy !== null && task.createdBy !== ownerUserId;
  const isOverdue = task.rolledOverAt !== null && task.status !== 'done';

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
    <motion.div
      layout
      layoutId={`ptask-${task.id}`}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.12 } }}
      transition={SPRING_TRANSITION}
    >
    <div
      ref={cardRef}
      draggable={!editing}
      onDragStart={(e) => {
        suppressDetailRef.current = true;
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
        // Ẩn ảnh bóng mờ mặc định của trình duyệt — thẻ nổi tự vẽ ở PersonalKanban
        // sẽ đảm nhiệm phần bám theo con trỏ, mượt hơn nhiều.
        const dragImg = new window.Image();
        dragImg.src = TRANSPARENT_DRAG_IMAGE;
        e.dataTransfer.setDragImage(dragImg, 0, 0);
        onDragLift(e.clientX, e.clientY);
      }}
      onDrag={(e) => {
        // Sự kiện `drag` cuối cùng (khi thả) trình duyệt trả toạ độ (0,0) — bỏ
        // qua để thẻ nổi không giật về góc màn hình ngay trước khi biến mất.
        if (e.clientX === 0 && e.clientY === 0) return;
        onDragMove(e.clientX, e.clientY);
      }}
      onDragEnd={() => {
        onDragRelease();
        window.setTimeout(() => {
          suppressDetailRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (!editing && !suppressDetailRef.current) onOpenDetail();
      }}
      title="Bấm để xem chi tiết task"
      className={`group relative flex cursor-grab gap-2.5 rounded-[10px] border border-[#e8edf5] bg-white p-3 shadow-[0_2px_6px_-2px_rgba(16,26,48,0.12)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(16,26,48,0.25)] active:cursor-grabbing ${
        isDragging ? 'opacity-30 ring-2 ring-inset ring-blue/40' : ''
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.status === 'done'}
        onClick={(e) => {
          e.stopPropagation();
          const next: TaskStatus = task.status === 'done' ? 'not_started' : 'done';
          if (next === 'done') fireConfetti();
          onStatusChange(next);
        }}
        aria-label={task.status === 'done' ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
          task.status === 'done'
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-[#c7d2e4] text-transparent hover:border-blue'
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
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitTitle();
                if (e.key === 'Escape') {
                  setTitle(task.title);
                  setEditing(false);
                }
              }}
              className="w-full rounded border border-blue bg-white px-1.5 py-0.5 text-sm font-semibold text-navy outline-none"
            />
          ) : (
            <p
              className={`cursor-text text-sm font-semibold ${task.status === 'done' ? 'text-muted line-through' : 'text-navy'}`}
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
              className="grid h-6 w-6 place-items-center rounded text-muted opacity-0 hover:bg-surface-2 hover:text-navy group-hover:opacity-100"
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
        {(task.description ?? task.note) && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
            <StickyNote className="h-3 w-3 shrink-0" aria-hidden="true" />
            {task.description ?? task.note}
          </p>
        )}
        {task.imageUrl && (
          <div className="relative mt-2 h-24 w-full overflow-hidden rounded-[8px] bg-surface-2">
            <Image src={task.imageUrl} alt="" fill sizes="272px" className="object-cover" />
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isOverdue ? 'bg-red-50 text-red-600' : dateTone}`}>
            {isOverdue
              ? `Trễ · ${formatVi(task.originalTaskDate ?? task.taskDate).slice(0, 5)}`
              : task.dueDate && task.dueDate !== task.taskDate
                ? `${formatVi(task.taskDate).slice(0, 5)} → ${formatVi(task.dueDate).slice(0, 5)}`
                : formatVi(task.taskDate).slice(0, 5)}
          </span>
          <Flag
            role="img"
            aria-label={task.priority === 'high' ? 'Ưu tiên cao' : task.priority === 'low' ? 'Ưu tiên thấp' : 'Ưu tiên bình thường'}
            className={`h-3.5 w-3.5 shrink-0 ${task.priority === 'high' ? 'fill-amber-500 text-amber-500' : task.priority === 'low' ? 'fill-slate-400 text-slate-400' : 'fill-blue text-blue'}`}
          />
          {task.commentCount > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-muted" aria-label={`${task.commentCount} bình luận`}>
              <MessageCircle className="h-3 w-3" aria-hidden="true" />
              ({task.commentCount})
            </span>
          )}
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
      {isFromBoss && task.createdByFullName && (
        <div
          className="pointer-events-none absolute -right-1.5 -top-1.5"
          title={`${task.createdByFullName} giao`}
        >
          {task.createdByAvatarUrl ? (
            <Image
              src={task.createdByAvatarUrl}
              alt={task.createdByFullName}
              width={22}
              height={22}
              className="h-[22px] w-[22px] rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-gold text-[9px] font-bold text-navy ring-2 ring-white">
              {initialsOf(task.createdByFullName)}
            </span>
          )}
        </div>
      )}
    </div>
    </motion.div>
  );
}

/** Popup tạo task mới — dùng cùng khung giao diện (drawer trượt từ phải,
 *  focus trap, ESC để đóng) như PersonalTaskDetailDrawer khi sửa task, để
 *  trải nghiệm thêm/sửa nhất quán thay vì 1 form nhỏ nhúng trong cột. Không
 *  có mục Ảnh/Bình luận/Lịch sử vì task chưa tồn tại — mở lại task vừa tạo
 *  (PersonalTaskDetailDrawer) để dùng các mục đó. */
function PersonalTaskCreateDrawer({
  ownerUserId,
  today,
  status,
  defaultDate,
  onClose,
  onCreated,
}: {
  ownerUserId: number;
  today: string;
  status: TaskStatus;
  defaultDate: string;
  onClose: () => void;
  onCreated: (created: Task[]) => void;
}) {
  const [title, setTitle] = useState('');
  const [taskDate, setTaskDate] = useState(defaultDate);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(status);
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>({ unit: 'none', count: 4 });
  const [stagedImage, setStagedImage] = useState<File | null>(null);
  const [stagedImagePreview, setStagedImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const stagedImageUrlRef = useRef<string | null>(null);

  function pickImage(file: File) {
    if (stagedImageUrlRef.current) URL.revokeObjectURL(stagedImageUrlRef.current);
    const url = URL.createObjectURL(file);
    stagedImageUrlRef.current = url;
    setStagedImage(file);
    setStagedImagePreview(url);
  }

  function clearImage() {
    if (stagedImageUrlRef.current) {
      URL.revokeObjectURL(stagedImageUrlRef.current);
      stagedImageUrlRef.current = null;
    }
    setStagedImage(null);
    setStagedImagePreview(null);
  }

  useEffect(() => {
    return () => {
      if (stagedImageUrlRef.current) URL.revokeObjectURL(stagedImageUrlRef.current);
    };
  }, []);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    titleRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocusedRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    // "Đặt lặp lại" tạo nhiều dòng task thật độc lập ngay lúc lưu (không phải
    // 1 sự kiện lặp định kỳ đứng sau) — cùng nguyên tắc với nhân bản task,
    // xem comment ở bảng `tasks` trong db/schema.sql.
    const occurrences = recurrence.unit === 'none' ? 1 : recurrence.count;
    const stepper = recurrence.unit === 'weekly' ? (d: string, i: number) => addDays(d, i * 7)
      : recurrence.unit === 'monthly' ? (d: string, i: number) => addMonths(d, i)
      : (d: string, i: number) => addDays(d, i);
    const inputs = Array.from({ length: occurrences }, (_, i) => ({
      taskDate: stepper(taskDate, i),
      dueDate: dueDate ? stepper(dueDate, i) : null,
      title: trimmed,
      status: taskStatus,
      priority,
      description: description.trim() || null,
    }));
    startTransition(() => {
      createPersonalTasksAction(ownerUserId, inputs)
        .then((created) => {
          if (!stagedImage) return created;
          // Ảnh chỉ upload được sau khi task đã có id thật — giữ tạm ở client
          // (staged) rồi đẩy lên ngay sau bước tạo, áp cho mọi task vừa tạo
          // (kể cả khi "đặt lặp lại" sinh nhiều dòng cùng lúc).
          return Promise.all(
            created.map((t) => {
              const formData = new FormData();
              formData.set('file', stagedImage);
              return uploadPersonalTaskImageAction(ownerUserId, t.id, formData);
            })
          );
        })
        .then((finalTasks) => onCreated(finalTasks))
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tạo được task.'));
    });
  }

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 h-full w-full" />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-task-create-title"
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l-2 border-black bg-[#f8fafc] shadow-[-24px_0_60px_-32px_rgba(16,26,48,0.55)] sm:w-[min(70vw,440px)] lg:w-[clamp(360px,33vw,520px)]"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8f0] bg-white/95 px-3.5 py-2.5 backdrop-blur sm:px-4">
          <div>
            <h2 id="personal-task-create-title" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue">Tạo task mới</h2>
            <p className="mt-0.5 text-xs text-muted" aria-live="polite">{isPending ? 'Đang tạo…' : 'Điền thông tin rồi lưu'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-4">
          {error && <p className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Tiêu đề</span>
              <textarea
                ref={titleRef}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                rows={2}
                required
                placeholder="Nhập tiêu đề task…"
                className="mt-1 w-full resize-none rounded-[10px] border border-[#dbe4f2] bg-white px-3 py-2 font-heading text-lg font-semibold text-navy outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Mô tả</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={10_000}
                placeholder="Thêm mô tả…"
                className="mt-1 w-full resize-y rounded-[10px] border border-[#dbe4f2] bg-white px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>

            <div className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Ảnh</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) pickImage(file);
                  event.currentTarget.value = '';
                }}
              />
              {stagedImagePreview ? (
                <div className="relative mt-1 overflow-hidden rounded-[10px] border border-[#dbe4f2] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview ảnh cục bộ qua blob: URL, next/image không xử lý được nguồn này */}
                  <img src={stagedImagePreview} alt="" className="h-32 w-full object-contain" />
                  <button
                    type="button"
                    onClick={clearImage}
                    aria-label="Bỏ ảnh"
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#cbd7e8] bg-white text-xs font-semibold text-muted hover:border-blue hover:text-blue"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" /> Thêm ảnh
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Ngày</span>
                <div className="mt-1">
                  <TaskDateRangePicker
                    startDate={taskDate}
                    dueDate={dueDate}
                    today={today}
                    onChange={(next) => {
                      setTaskDate(next.startDate);
                      setDueDate(next.dueDate);
                    }}
                    recurrence={recurrence}
                    onRecurrenceChange={setRecurrence}
                  />
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Trạng thái</span>
                <select
                  value={taskStatus}
                  onChange={(event) => setTaskStatus(event.target.value as TaskStatus)}
                  className="mt-1 h-10 w-full rounded-[10px] border border-[#dbe4f2] bg-white px-2.5 text-sm text-navy outline-none focus:border-blue"
                >
                  <option value="not_started">Chưa làm</option>
                  <option value="in_progress">Đang làm</option>
                  <option value="done">Hoàn thành</option>
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted">Mức độ ưu tiên</legend>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {QUICK_ADD_PRIORITIES.map((item) => (
                  <label
                    key={item.value}
                    className={`flex min-h-9 cursor-pointer items-center justify-center gap-1 rounded-[10px] border bg-white px-1.5 text-xs font-semibold ${priority === item.value ? 'border-blue ring-2 ring-blue/10' : 'border-[#dbe4f2]'} ${item.tone}`}
                  >
                    <input type="radio" name="create-priority" value={item.value} checked={priority === item.value} onChange={() => setPriority(item.value)} className="sr-only" />
                    <span aria-hidden="true">⚑</span>{item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" disabled={isPending || !title.trim()} className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-blue px-4 text-sm font-semibold text-white hover:bg-blue-cta disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-4 w-4" aria-hidden="true" /> Tạo task
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
