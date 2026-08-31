'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MoreVertical, TriangleAlert, ListChecks, CircleDot, CheckCircle2, Check, ArrowLeft, X, StickyNote, Video, Rows3, Grid2x2 } from 'lucide-react';
import { useCheckboxConfetti } from '@/components/dashboard/checkbox-confetti';
import DepartmentOverview from '@/components/dashboard/department-overview';
import TaskCalendar from '@/components/dashboard/task-calendar';
import { nameSlug } from '@/lib/name-slug';
import type { TeamWithRoster, TeamSummary, TeamTaskCategory, TeamMemberRole, TeamMember } from '@/lib/teams';
import type { Task, TaskInput, TaskStatus, DailyAssigneeCount, TeamMonthProgress, BulkDuplicatePattern, MonthDayCategoryCount } from '@/lib/tasks';
import { TASK_COLUMN_KEYS, type TaskColumnKey } from '@/lib/task-columns';
import { shopsForTeamCode, type ShopEntry } from '@/lib/shops';
import {
  getMyTeamBoardAction,
  getTeamBoardAsBgdAction,
  getAllTeamsOverviewAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  duplicateTasksToDatesAction,
  bulkDuplicateTasksAction,
  createTeamCategoryAction,
  updateTeamCategoryAction,
  deleteTeamCategoryAction,
  addTeamMemberAction,
  removeTeamMemberAction,
  setMemberRoleAction,
  setMemberCategoryAction,
  listAddableUsersAction,
  getMonthTaskCategoryCountsAction,
} from '@/app/dashboard/giao-task/actions';

// Site không có hạ tầng WebSocket/pub-sub — khớp khoảng polling đã có tiền lệ
// ở sticky-board.tsx (2.5 phút) thay vì bịa một con số mới không nhất quán.
const POLL_INTERVAL_MS = 150_000;

type ViewMode = 'day' | 'week' | 'month';

interface DateRange {
  fromDate: string;
  toDate: string;
}

interface BoardData {
  team: TeamWithRoster;
  categories: TeamTaskCategory[];
  tasks: Task[];
  isManager: boolean;
  monthProgress: { done: number; total: number };
  chart: DailyAssigneeCount[];
  products: string[];
  range: DateRange;
}

interface OverviewData {
  teams: TeamSummary[];
  monthProgress: TeamMonthProgress[];
}

interface TaskBoardProps {
  isBgd: boolean;
  today: string;
  overview: OverviewData | null;
  board: BoardData | null;
}

const COLUMN_LABELS: Record<TaskColumnKey, string> = {
  accountName: 'Tên Acc',
  channel: 'Up kênh',
  videoCount: 'SL VID',
  product: 'Sản phẩm',
  optionTag: 'Nhãn phụ',
  referenceLink: 'Link mẫu',
  note: 'Ghi chú',
};

// Né hẳn dải màu xanh dương (trùng với --blue thương hiệu dùng cho nút/link
// khắp trang) — chỉ chọn tông tím/cam/hồng/vàng/xanh lá cho bảng màu người/nhóm.
const CHART_PALETTE = ['#9B7EF0', '#FFB84D', '#22C55E', '#FF7A5C', '#FF6FA0', '#FACC15', '#C084FC'];

/** Mỗi nhóm task (Media/Support...) có 1 màu riêng lấy từ CHART_PALETTE theo
 *  vị trí trong danh sách nhóm — ổn định, không đổi màu khi lọc/sắp xếp lại. */
function categoryColor(categories: { id: number }[], categoryId: number): string {
  const index = categories.findIndex((c) => c.id === categoryId);
  return CHART_PALETTE[Math.max(index, 0) % CHART_PALETTE.length];
}

const UNASSIGNED_COLOR = '#B7C2D6';

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const GOLDEN_RATIO_CONJUGATE = 0.6180339887498949;
// Cắt hẳn dải hue xanh lá/xanh dương/cyan (130°-260°: 130-175 trùng xanh lá
// "Hoàn thành" #20C978 ở cột Trạng thái, 175-260 trùng --blue thương hiệu)
// khỏi vòng màu, rồi rải hue theo góc vàng chỉ trong phần còn lại (230°) —
// vì chuỗi (index * GOLDEN_RATIO_CONJUGATE) % 1 không bao giờ lặp giá trị
// giữa các index khác nhau, hue sinh ra cũng không bao giờ trùng nhau, khác
// với cách cũ dùng bảng màu 7 phần tử cố định (người thứ 8 sẽ trùng màu
// người đầu tiên do chia dư).
const HUE_BAND_START = 260;
const HUE_USABLE_SPAN = 230;

/** Sinh 1 màu ổn định cho từng chuỗi trong danh sách (theo thứ tự chữ cái) —
 *  dùng chung cho màu người phụ trách và màu sản phẩm để 1 tên/sản phẩm luôn
 *  cùng 1 màu ở mọi nơi trên trang, không bao giờ trùng màu dù danh sách dài. */
function distinctColorMap(values: string[]): Map<string, string> {
  const names = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'vi'));
  return new Map(
    names.map((name, index) => {
      const t = (index * GOLDEN_RATIO_CONJUGATE) % 1;
      const hue = (HUE_BAND_START + t * HUE_USABLE_SPAN) % 360;
      return [name, hslToHex(hue, 70, 62)];
    })
  );
}

/** Mỗi thành viên 1 màu riêng theo vị trí tên (sắp xếp chữ cái) trong danh
 *  sách đội — dùng chung giữa thẻ tổng hợp "Task theo người" và bảng task để
 *  1 người luôn cùng 1 màu ở mọi nơi trên trang. */
function assigneeColorMap(members: TeamMember[]): Map<string, string> {
  return distinctColorMap(members.map((m) => m.fullName));
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

/** Bảng task chỉ cần gọi tên (từ cuối họ tên đầy đủ), vd "Phạm Thị Hồng Thu"
 *  → "Thu" — đỡ rối mắt hơn hiện cả họ tên, và nhất quán bất kể tên gốc viết
 *  hoa toàn bộ hay không. */
function givenNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return last.charAt(0).toLocaleUpperCase('vi') + last.slice(1).toLocaleLowerCase('vi');
}

export default function TaskBoard({ isBgd, today, overview: initialOverview, board: initialBoard }: TaskBoardProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  // Thẻ chỉ là 1 cách trình bày khác của cùng dữ liệu task (bấm để đổi trạng
  // thái) — song song với bảng cũ, không thay thế, giữ nguyên mọi thao tác
  // nhân bản/sửa nhanh vốn chỉ có ở bảng.
  const [boardView, setBoardView] = useState<'table' | 'card'>('table');
  const [anchorDate, setAnchorDate] = useState(today);
  // Chuyển đội giờ đi qua điều hướng URL thật (/dashboard/giao-task/[code],
  // xem OverviewPanel bên dưới) thay vì đổi state — mỗi đội/màn tổng quan là
  // 1 lượt mount TaskBoard mới (page.tsx truyền `key` khác nhau), nên giá trị
  // này chỉ cần đọc 1 lần lúc mount, không cần setter.
  const activeTeamId = initialBoard?.team.id ?? null;
  // Mặc định vào nhóm đầu tiên (Media/Support...), khớp với dữ liệu page.tsx
  // đã lọc sẵn phía server; 'all' là tab "Tất cả" xem gộp mọi nhóm.
  const [categoryId, setCategoryId] = useState<number | 'all' | undefined>(initialBoard?.categories[0]?.id);
  const [board, setBoard] = useState<BoardData | null>(initialBoard);
  const [overview, setOverview] = useState<OverviewData | null>(initialOverview);
  const [error, setError] = useState<string | null>(null);
  const [statusPendingTaskIds, setStatusPendingTaskIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [dayCategoryCounts, setDayCategoryCounts] = useState<MonthDayCategoryCount[]>([]);

  const didMount = useRef(false);
  // Giữ trạng thái vừa bấm xuyên qua mọi lần đồng bộ nền. Đồng thời đánh số
  // request để một response cũ không thể ghi đè dữ liệu mới hơn.
  const optimisticStatusesRef = useRef<Map<number, TaskStatus>>(new Map());
  const optimisticTasksRef = useRef<Map<number, Task>>(new Map());
  const optimisticCreatedTasksRef = useRef<Map<number, Task>>(new Map());
  const refreshBoardRequestRef = useRef(0);
  const range = useMemo(() => rangeFor(viewMode, anchorDate), [viewMode, anchorDate]);

  // Tab Media/Support lọc task theo nhóm của NGƯỜI PHỤ TRÁCH (member.categoryId
  // xếp ở sidebar), không theo category_id riêng của task — khớp với việc
  // "gom nhóm thành viên" quyết định task hiện ở tab nào.
  const categoryTasks = useMemo(() => {
    if (!board) return [];
    if (categoryId === 'all') return board.tasks;
    const memberCategoryById = new Map(board.team.members.map((m) => [m.userId, m.categoryId]));
    return board.tasks.filter((t) => t.assigneeUserId != null && memberCategoryById.get(t.assigneeUserId) === categoryId);
  }, [board, categoryId]);

  const visibleTasks = categoryTasks;

  // Thêm task ngay trên tab nào thì chỉ gán được cho người đang ở đúng nhóm
  // đó — tránh tình huống vừa lưu xong task đã biến mất khỏi tab đang xem.
  // Tab "Tất cả" cho gán bất kỳ ai trong đội.
  const assignableMembers = useMemo(() => {
    if (!board) return [];
    if (categoryId === 'all') return board.team.members;
    return board.team.members.filter((m) => m.categoryId === categoryId);
  }, [board, categoryId]);

  const calendarYearMonth = anchorDate.slice(0, 7);

  function refreshDayCategoryCounts() {
    if (!board) return;
    getMonthTaskCategoryCountsAction(board.team.id, calendarYearMonth)
      .then(setDayCategoryCounts)
      .catch(() => setDayCategoryCounts([]));
  }

  // Lịch mini tô màu theo tháng — độc lập với viewMode/range đang chọn. Lấy
  // số task theo TỪNG nhóm (không lọc theo tab đang xem) để mỗi ô ngày vừa
  // tô màu "có hoạt động" vừa hiện số lượng riêng từng nhóm (Media/Support...).
  useEffect(() => {
    if (!board) return;
    refreshDayCategoryCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.team.id, calendarYearMonth]);

  // Tab Media/Support lọc theo nhóm của người phụ trách (client-side, xem
  // visibleTasks bên dưới) — không phải theo category riêng của từng task,
  // nên board luôn tải đủ task trong khoảng ngày, đổi tab không cần gọi lại.
  // silent = true cho các lần đồng bộ nền (polling, sau khi 1 hành động khác
  // đã thành công) — lỗi thoáng qua (thường do Server Action lệch bản ngay
  // sau khi vừa deploy, hoặc Neon cold start) chỉ log ra console, không đẩy
  // banner đỏ ra cho người dùng vì lần polling kế tiếp (150s sau) sẽ tự khỏi.
  // Chỉ hành động do người dùng chủ động bấm mới cần báo lỗi rõ ràng.
  async function refreshBoard(opts?: { silent?: boolean }) {
    const requestId = ++refreshBoardRequestRef.current;
    if (activeTeamId == null) {
      // Trang tổng quan (không có team ban đầu) — không có đội nào để tải,
      // giữ board rỗng để OverviewPanel hiện ra (điều kiện render là !board).
      setBoard(null);
      return;
    }
    try {
      const result = isBgd ? await getTeamBoardAsBgdAction(activeTeamId, range) : await getMyTeamBoardAction(range);
      if (requestId !== refreshBoardRequestRef.current) return;
      if ('needsBgdOverview' in result) return;
      const tasks = result.tasks.map((task) => {
        const optimisticTask = optimisticTasksRef.current.get(task.id);
        const optimisticStatus = optimisticStatusesRef.current.get(task.id);
        const mergedTask = optimisticTask ?? task;
        return optimisticStatus == null ? mergedTask : { ...mergedTask, status: optimisticStatus };
      });
      setBoard({ ...result, tasks: [...tasks, ...optimisticCreatedTasksRef.current.values()], range });
      setError(null);
    } catch (err) {
      if (requestId !== refreshBoardRequestRef.current) return;
      if (opts?.silent) {
        console.error('refreshBoard (nền) lỗi:', err);
        return;
      }
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu.');
    }
  }

  async function refreshOverview(opts?: { silent?: boolean }) {
    if (!isBgd) return;
    try {
      const data = await getAllTeamsOverviewAction(anchorDate.slice(0, 7), today);
      setOverview(data);
      setError(null);
    } catch (err) {
      if (opts?.silent) {
        console.error('refreshOverview (nền) lỗi:', err);
        return;
      }
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải tổng quan.');
    }
  }

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    startTransition(() => {
      void refreshBoard();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, anchorDate, activeTeamId]);

  // Nếu nhóm đang chọn không còn tồn tại (đổi đội, nhóm bị xoá, hoặc nhóm đầu
  // tiên vừa được tạo) thì tự chuyển sang nhóm đầu — trừ khi đang ở tab "Tất cả".
  useEffect(() => {
    if (!board) return;
    if (categoryId === 'all') return;
    if (board.categories.length === 0) return;
    if (board.categories.some((c) => c.id === categoryId)) return;
    setCategoryId(board.categories[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.categories]);

  useEffect(() => {
    const pollId = window.setInterval(() => {
      void refreshBoard({ silent: true });
      void refreshOverview({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(pollId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId, range.fromDate, range.toDate]);

  function runAction<T>(fn: () => Promise<T>, after?: () => void) {
    startTransition(() => {
      fn()
        .then(() => {
          after?.();
          // Đồng bộ lại dữ liệu sau khi thao tác đã thành công — nếu bước
          // đồng bộ này thoáng lỗi thì không có nghĩa thao tác của người
          // dùng thất bại, nên không đẩy banner đỏ gây hiểu lầm.
          void refreshBoard({ silent: true });
          void refreshOverview({ silent: true });
          refreshDayCategoryCounts();
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.'));
    });
  }

  function updateTaskStatusOptimistically(task: Task, status: TaskStatus) {
    if (!board || statusPendingTaskIds.has(task.id) || task.status === status) return;

    const previousStatus = task.status;
    setError(null);
    optimisticStatusesRef.current.set(task.id, status);
    setBoard((current) =>
      current
        ? { ...current, tasks: current.tasks.map((item) => (item.id === task.id ? { ...item, status } : item)) }
        : current
    );
    setStatusPendingTaskIds((current) => new Set(current).add(task.id));

    startTransition(() => {
      updateTaskAction(board.team.id, task.id, { status })
        .then(async () => {
          // Lần tải sau khi server xác nhận sẽ hủy hiệu lực mọi response cũ.
          // Vẫn ghép trạng thái lạc quan trong lúc tải để dấu tick không nháy.
          await Promise.all([refreshBoard({ silent: true }), refreshOverview({ silent: true })]);
          refreshDayCategoryCounts();
          optimisticStatusesRef.current.delete(task.id);
        })
        .catch((err) => {
          optimisticStatusesRef.current.delete(task.id);
          // Không cho response đang bay về áp lại trạng thái lạc quan đã lỗi.
          refreshBoardRequestRef.current += 1;
          setBoard((current) =>
            current
              ? {
                  ...current,
                  tasks: current.tasks.map((item) =>
                    item.id === task.id && item.status === status ? { ...item, status: previousStatus } : item
                  ),
                }
              : current
          );
          setError(err instanceof Error ? err.message : 'Không thể lưu trạng thái task.');
        })
        .finally(() => {
          setStatusPendingTaskIds((current) => {
            const next = new Set(current);
            next.delete(task.id);
            return next;
          });
        });
    });
  }

  function createTaskOptimistically(input: TaskInput) {
    if (!board) return;
    const teamId = board.team.id;
    const tempId = -Date.now();
    const member = board.team.members.find((item) => item.userId === input.assigneeUserId);
    const now = new Date().toISOString();
    const optimisticTask: Task = {
      id: tempId,
      teamId,
      ownerUserId: null,
      categoryId: input.categoryId ?? null,
      taskDate: input.taskDate,
      dueDate: null,
      assigneeUserId: input.assigneeUserId ?? null,
      assigneeFullName: member?.fullName ?? null,
      assigneeAvatarUrl: member?.avatarUrl ?? null,
      accountName: input.accountName ?? null,
      title: input.title,
      channel: input.channel ?? null,
      videoCount: input.videoCount ?? null,
      product: input.product ?? null,
      optionTag: input.optionTag ?? null,
      referenceLink: input.referenceLink ?? null,
      note: input.note ?? null,
      description: null,
      imageUrl: null,
      priority: 'normal',
      originalTaskDate: null,
      rolledOverAt: null,
      status: input.status ?? 'not_started',
      duplicatedFromTaskId: null,
      createdBy: null,
      createdByFullName: null,
      createdByAvatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    setError(null);
    setIsAddingTask(false);
    optimisticCreatedTasksRef.current.set(tempId, optimisticTask);
    setBoard((current) => (current ? { ...current, tasks: [...current.tasks, optimisticTask] } : current));
    startTransition(() => {
      createTaskAction(teamId, input)
        .then((savedTask) => {
          optimisticCreatedTasksRef.current.delete(tempId);
          setBoard((current) =>
            current
              ? { ...current, tasks: current.tasks.map((task) => (task.id === tempId ? savedTask : task)) }
              : current
          );
          void refreshBoard({ silent: true });
          void refreshOverview({ silent: true });
          refreshDayCategoryCounts();
        })
        .catch((err) => {
          optimisticCreatedTasksRef.current.delete(tempId);
          refreshBoardRequestRef.current += 1;
          setBoard((current) =>
            current ? { ...current, tasks: current.tasks.filter((task) => task.id !== tempId) } : current
          );
          setError(err instanceof Error ? err.message : 'Không thể tạo task.');
        });
    });
  }

  function updateTaskOptimistically(taskId: number, input: TaskInput) {
    if (!board) return;
    const teamId = board.team.id;
    const previousTask = board.tasks.find((task) => task.id === taskId);
    if (!previousTask) return;
    const member = board.team.members.find((item) => item.userId === input.assigneeUserId);
    const optimisticTask: Task = {
      ...previousTask,
      ...input,
      assigneeUserId: input.assigneeUserId ?? null,
      assigneeFullName: member?.fullName ?? null,
      assigneeAvatarUrl: member?.avatarUrl ?? null,
      updatedAt: new Date().toISOString(),
    };

    setError(null);
    optimisticTasksRef.current.set(taskId, optimisticTask);
    setBoard((current) =>
      current
        ? { ...current, tasks: current.tasks.map((task) => (task.id === taskId ? optimisticTask : task)) }
        : current
    );
    startTransition(() => {
      updateTaskAction(teamId, taskId, input)
        .then((savedTask) => {
          optimisticTasksRef.current.delete(taskId);
          setBoard((current) =>
            current
              ? { ...current, tasks: current.tasks.map((task) => (task.id === taskId ? savedTask : task)) }
              : current
          );
          void refreshBoard({ silent: true });
          void refreshOverview({ silent: true });
          refreshDayCategoryCounts();
        })
        .catch((err) => {
          optimisticTasksRef.current.delete(taskId);
          refreshBoardRequestRef.current += 1;
          setBoard((current) =>
            current
              ? { ...current, tasks: current.tasks.map((task) => (task.id === taskId ? previousTask : task)) }
              : current
          );
          setError(err instanceof Error ? err.message : 'Không thể lưu thay đổi task.');
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          {isBgd && board ? (
            <button
              type="button"
              onClick={() => router.push('/dashboard/giao-task')}
              className="flex items-center gap-1 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue hover:text-blue-cta"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Tổng quan 6 đội
            </button>
          ) : (
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue">Giao Task</p>
          )}
          <h1
            className={
              board
                ? 'mt-1 font-heading text-2xl font-semibold text-navy sm:text-3xl'
                : 'mt-4 font-heading text-5xl font-light uppercase tracking-wide text-navy'
            }
          >
            {board ? board.team.name : 'Tổng quan 6 đội'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {!board && overview && (
        <>
          <OverviewPanel
            overview={overview}
            onSelectTeam={(code) => router.push(`/dashboard/giao-task/${code}`)}
            monthLabel={anchorDate.slice(0, 7)}
          />
          <DepartmentOverview
            today={today}
            onSelectMember={(_userId, fullName) => router.push(`/dashboard/giao-task/${nameSlug(fullName)}`)}
          />
        </>
      )}

      {board && (
        <>
          <div className="mb-5">
            <AssigneeBarChart chart={board.chart} members={board.team.members} showDailyChart={viewMode !== 'day'} />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-[10px] border border-black p-1">
              {boardView === 'table' && (
                <button
                  type="button"
                  onClick={() => setIsAddingTask(true)}
                  className="rounded-[8px] bg-blue px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-cta"
                >
                  + Thêm task
                </button>
              )}
              <button
                type="button"
                onClick={() => setCategoryId('all')}
                className={`rounded-[8px] px-3 py-1.5 text-sm font-normal uppercase text-[#000000] ${categoryId === 'all' ? 'bg-[#EAB308]' : ''}`}
              >
                Tất cả
              </button>
              {board.categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`rounded-[8px] px-3 py-1.5 text-sm font-normal uppercase text-[#000000] ${isSelected ? 'bg-[#EAB308]' : ''}`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex gap-1 rounded-[10px] bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setBoardView('table')}
                className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold ${
                  boardView === 'table' ? 'bg-white text-blue shadow-sm' : 'text-muted'
                }`}
              >
                <Rows3 className="h-3.5 w-3.5" aria-hidden="true" />
                Bảng
              </button>
              <button
                type="button"
                onClick={() => setBoardView('card')}
                className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold ${
                  boardView === 'card' ? 'bg-white text-blue shadow-sm' : 'text-muted'
                }`}
              >
                <Grid2x2 className="h-3.5 w-3.5" aria-hidden="true" />
                Thẻ
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px]">
            <div className="min-w-0">
              {boardView === 'table' ? (
                <TaskTable
                  tasks={visibleTasks}
                  visibleColumns={board.categories.find((c) => c.id === categoryId)?.visibleColumns ?? [...TASK_COLUMN_KEYS]}
                  teamCode={board.team.code}
                  allMembers={board.team.members}
                  products={board.products}
                  onUpdate={updateTaskOptimistically}
                  onDelete={(task) => runAction(() => deleteTaskAction(board.team.id, task.id))}
                  allowBulkPattern={board.isManager}
                  onBulkDuplicateDates={(taskIds, dates, assigneeUserIds) =>
                    runAction(() => duplicateTasksToDatesAction(board.team.id, taskIds, dates, assigneeUserIds))
                  }
                  onBulkDuplicatePattern={(taskIds, pattern, assigneeUserIds) =>
                    runAction(() => bulkDuplicateTasksAction(board.team.id, taskIds, pattern, assigneeUserIds))
                  }
                  onStatusChange={updateTaskStatusOptimistically}
                  statusPendingTaskIds={statusPendingTaskIds}
                  emptyMessage="Chưa có task nào trong khoảng thời gian này."
                  isAdding={isAddingTask}
                  assignableMembers={assignableMembers}
                  defaultDate={anchorDate}
                  onCancelAdd={() => setIsAddingTask(false)}
                  onCreate={createTaskOptimistically}
                />
              ) : (
                <TaskCardGrid
                  tasks={visibleTasks}
                  today={today}
                  members={board.team.members}
                  onStatusChange={updateTaskStatusOptimistically}
                  statusPendingTaskIds={statusPendingTaskIds}
                  emptyMessage="Chưa có task nào trong khoảng thời gian này."
                  onDelete={(task) => runAction(() => deleteTaskAction(board.team.id, task.id))}
                />
              )}
            </div>

            <div className="flex flex-col gap-4">
              <TaskCalendar
                anchorDate={anchorDate}
                today={today}
                categories={board.categories}
                dayCategoryCounts={dayCategoryCounts}
                onSelectDay={(date) => {
                  setAnchorDate(date);
                  setViewMode('day');
                }}
                onShiftMonth={(direction) => setAnchorDate(shiftAnchor('month', anchorDate, direction))}
              />
              <div className="rounded-[14px] border border-[#e8edf5] bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <strong className="font-heading text-navy">{rangeLabel}</strong>
                  {anchorDate !== today && (
                    <button type="button" onClick={() => setAnchorDate(today)} className="shrink-0 text-xs font-semibold text-blue">
                      Về hôm nay
                    </button>
                  )}
                </div>
                <div className="mt-3 flex gap-1 rounded-[10px] bg-surface-2 p-1">
                  {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`flex-1 rounded-[8px] px-3 py-1.5 text-xs font-semibold ${
                        viewMode === mode ? 'bg-white text-blue shadow-sm' : 'text-muted'
                      }`}
                    >
                      {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
                    </button>
                  ))}
                </div>
              </div>
              <MonthProgressCard done={board.monthProgress.done} total={board.monthProgress.total} monthLabel={anchorDate.slice(0, 7)} />
              <TeamRosterCard
                team={board.team}
                categories={board.categories}
                isManager={board.isManager}
                onAddMember={() => setAddingMember(true)}
                onRemoveMember={(userId) => runAction(() => removeTeamMemberAction(board.team.id, userId))}
                onSetRole={(userId, role) => runAction(() => setMemberRoleAction(board.team.id, userId, role))}
                onSetMemberCategory={(userId, catId) => runAction(() => setMemberCategoryAction(board.team.id, userId, catId))}
                onManageCategories={() => setManagingCategories(true)}
              />
            </div>
          </div>
        </>
      )}


      {managingCategories && board && (
        <CategoryManagerModal
          categories={board.categories}
          onClose={() => setManagingCategories(false)}
          onCreate={(name, cols) => runAction(() => createTeamCategoryAction(board.team.id, name, cols))}
          onUpdate={(id, patch) => runAction(() => updateTeamCategoryAction(board.team.id, id, patch))}
          onDelete={(id) => runAction(() => deleteTeamCategoryAction(board.team.id, id))}
        />
      )}

      {addingMember && board && (
        <AddMemberModal
          teamId={board.team.id}
          onClose={() => setAddingMember(false)}
          onAdd={(userId) => runAction(() => addTeamMemberAction(board.team.id, userId), () => setAddingMember(false))}
        />
      )}

      {isPending && <div className="fixed bottom-4 right-4 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-lg">Đang xử lý…</div>}
    </div>
  );
}

/** Badge số liệu theo trạng thái — luôn đi kèm icon + nền màu (khi có giá trị
 *  đáng chú ý) thay vì chỉ dựa vào màu, theo đúng quy ước severity của
 *  policy-card.tsx (không bao giờ color-only). */
function StatusCountBadge({ count, tone }: { count: number; tone: 'neutral' | 'blue' | 'emerald' | 'red' }) {
  if (tone === 'red' && count > 0) {
    return (
      <span className="inline-flex min-w-[36px] items-center justify-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
        <TriangleAlert className="h-3 w-3" aria-hidden="true" />
        {count}
      </span>
    );
  }
  if (count === 0) {
    return <span className="text-xs font-semibold text-muted">0</span>;
  }
  const toneClass = tone === 'blue' ? 'bg-[#E7F0FF] text-blue' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-2 text-navy';
  return <span className={`inline-flex min-w-[36px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${toneClass}`}>{count}</span>;
}

const OVERVIEW_STATUS_COLUMNS: { key: 'notStarted' | 'done' | 'overdue'; label: string; dot: string; tone: 'neutral' | 'blue' | 'emerald' | 'red' }[] = [
  { key: 'notStarted', label: 'Chưa làm', dot: 'bg-[#B7C2D6]', tone: 'neutral' },
  { key: 'done', label: 'Hoàn thành', dot: 'bg-emerald-500', tone: 'emerald' },
  { key: 'overdue', label: 'Quá hạn', dot: 'bg-red-500', tone: 'red' },
];

interface OverviewTotals {
  total: number;
  notStarted: number;
  inProgress: number;
  done: number;
  overdue: number;
}

/** Donut trạng thái công việc gộp cả 6 đội — cùng kỹ thuật conic-gradient
 *  thuần CSS đã dùng ở MonthProgressCard, chỉ thêm lát cho đủ 3 trạng thái. */
function OverviewStatusDonut({ monthLabel, totals }: { monthLabel: string; totals: OverviewTotals }) {
  const { notStarted, inProgress, done, total } = totals;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const p1 = pct(notStarted);
  const p2 = p1 + pct(inProgress);
  const gradient = total > 0 ? `conic-gradient(#B7C2D6 0% ${p1}%, #0052CC ${p1}% ${p2}%, #10B981 ${p2}% 100%)` : '#EAF0F7';

  const legend = [
    { label: 'Chưa làm', value: notStarted, dot: 'bg-[#B7C2D6]' },
    { label: 'Đang làm', value: inProgress, dot: 'bg-blue' },
    { label: 'Hoàn thành', value: done, dot: 'bg-emerald-500' },
  ];

  return (
    <div className="rounded-[16px] border border-[#e8edf5] bg-white p-5">
      <p className="font-heading text-sm font-bold text-navy">Trạng thái công việc</p>
      <p className="text-xs text-muted">
        Tháng {monthLabel.split('-')[1]}/{monthLabel.split('-')[0]} · cả 6 đội
      </p>
      <div className="mt-4 flex items-center gap-5">
        <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: gradient }}>
          <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-white text-center">
            <span className="font-heading text-xl font-bold text-navy">{total}</span>
            <span className="text-[10px] text-muted">công việc</span>
          </div>
        </div>
        <ul className="flex-1 space-y-2">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} aria-hidden="true" />
                {item.label}
              </span>
              <span className="whitespace-nowrap font-semibold text-navy">
                {item.value} <span className="text-xs font-normal text-muted">({Math.round(pct(item.value))}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Hàng thẻ thống kê nhanh — chỉ dựng những chỉ số suy ra được thật từ dữ
 *  liệu task (không bịa Tạm dừng/Quan trọng vì schema chưa có 2 trạng thái
 *  này, đã thống nhất với người dùng khi làm bảng bên dưới). */
function OverviewSummaryCards({ monthLabel, totals }: { monthLabel: string; totals: OverviewTotals }) {
  const pct = (n: number) => (totals.total > 0 ? Math.round((n / totals.total) * 100) : 0);
  const cards: { label: string; value: number; caption: string; icon: typeof ListChecks; toneBg: string; toneText: string }[] = [
    { label: 'Tổng công việc', value: totals.total, caption: `Tháng ${monthLabel.split('-')[1]}`, icon: ListChecks, toneBg: 'bg-surface-2', toneText: 'text-navy' },
    { label: 'Đang làm', value: totals.inProgress, caption: `${pct(totals.inProgress)}% công việc`, icon: CircleDot, toneBg: 'bg-[#E7F0FF]', toneText: 'text-blue' },
    { label: 'Hoàn thành', value: totals.done, caption: `${pct(totals.done)}% công việc`, icon: CheckCircle2, toneBg: 'bg-emerald-50', toneText: 'text-emerald-600' },
    { label: 'Quá hạn', value: totals.overdue, caption: `${pct(totals.overdue)}% công việc`, icon: TriangleAlert, toneBg: 'bg-red-50', toneText: 'text-red-600' },
  ];

  return (
    <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
            <span className={`inline-flex rounded-full p-2 ${card.toneBg} ${card.toneText}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="mt-3 font-heading text-2xl font-bold text-navy">{card.value}</p>
            <p className="text-xs font-semibold text-muted">{card.label}</p>
            <p className={`mt-1 text-[11px] font-semibold ${card.toneText}`}>{card.caption}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Biểu đồ cột ngang so sánh khối lượng công việc 6 đội — lấp khoảng trống bên
 *  phải bảng tổng quan. Mỗi thanh chia 3 đoạn theo đúng 3 trạng thái đã hiện ở
 *  bảng (Chưa làm/Hoàn thành/Quá hạn), scale theo đội có tổng task lớn nhất
 *  để nhìn được cả tương quan số lượng lẫn tỉ lệ trạng thái giữa các đội. */
function OverviewTeamBarChart({ teams, progressByTeam }: { teams: TeamSummary[]; progressByTeam: Map<number, TeamMonthProgress> }) {
  const maxTotal = Math.max(1, ...teams.map((team) => progressByTeam.get(team.id)?.total ?? 0));
  const segments: { key: 'notStarted' | 'done' | 'overdue'; label: string; bar: string; dot: string }[] = [
    { key: 'notStarted', label: 'Chưa làm', bar: 'bg-[#B7C2D6]', dot: 'bg-[#B7C2D6]' },
    { key: 'done', label: 'Hoàn thành', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
    { key: 'overdue', label: 'Quá hạn', bar: 'bg-red-500', dot: 'bg-red-500' },
  ];

  return (
    <div className="h-full min-w-[280px] flex-1 rounded-[16px] border border-[#e8edf5] bg-white p-4">
      <p className="font-heading text-sm font-bold text-navy">Khối lượng công việc theo đội</p>
      <p className="mt-0.5 text-xs text-muted">So sánh 6 đội, theo trạng thái task</p>
      <div className="mt-5 flex flex-col gap-3">
        {teams.map((team) => {
          const progress = progressByTeam.get(team.id);
          const total = progress?.total ?? 0;
          return (
            <div key={team.id} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-xs font-semibold uppercase text-muted">{team.code}</span>
              <div className="flex h-3 flex-1 items-center gap-0.5">
                {segments.map((seg) => {
                  const count = progress ? progress[seg.key] : 0;
                  if (count <= 0) return null;
                  const widthPct = (count / maxTotal) * 100;
                  return (
                    <span
                      key={seg.key}
                      title={`${seg.label}: ${count}`}
                      className={`h-full rounded-full ${seg.bar}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  );
                })}
              </div>
              <span className="w-7 shrink-0 text-right text-xs font-bold text-navy">{total}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((seg) => (
          <span key={seg.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className={`h-2 w-2 rounded-full ${seg.dot}`} aria-hidden="true" />
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function OverviewPanel({
  overview,
  onSelectTeam,
  monthLabel,
}: {
  overview: OverviewData;
  onSelectTeam: (code: string) => void;
  monthLabel: string;
}) {
  const progressByTeam = new Map(overview.monthProgress.map((p) => [p.teamId, p]));
  const totals = overview.monthProgress.reduce<OverviewTotals>(
    (acc, p) => ({
      total: acc.total + p.total,
      notStarted: acc.notStarted + p.notStarted,
      inProgress: acc.inProgress + p.inProgress,
      done: acc.done + p.done,
      overdue: acc.overdue + p.overdue,
    }),
    { total: 0, notStarted: 0, inProgress: 0, done: 0, overdue: 0 }
  );

  return (
    <div>
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
        <OverviewStatusDonut monthLabel={monthLabel} totals={totals} />
        <OverviewSummaryCards monthLabel={monthLabel} totals={totals} />
      </div>
      <div className="flex flex-wrap items-stretch gap-4">
        <div className="w-fit max-w-full overflow-hidden rounded-[16px] border border-[#e8edf5] bg-white">
          <div className="overflow-x-auto">
            <table className="border-collapse text-left text-sm">
              <thead className="bg-surface-2 text-xs font-bold uppercase tracking-wider text-muted">
                <tr className="divide-x divide-[#e0e6f0]">
                  <th className="px-3 py-2">Đội</th>
                  <th className="px-3 py-2">Quản lý</th>
                  <th className="px-3 py-2 text-right">Thành viên</th>
                  {OVERVIEW_STATUS_COLUMNS.map((col) => (
                    <th key={col.key} className="px-2 py-2 text-center">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span className={`h-2 w-2 rounded-full ${col.dot}`} aria-hidden="true" />
                        {col.label}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2">Tiến độ tháng</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f7]">
                {overview.teams.map((team) => {
                  const progress = progressByTeam.get(team.id);
                  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
                  // KD1 vẫn có 2 quản lý ngang quyền trong DB (Huyền giữ nguyên quyền quản lý) —
                  // chỉ ẩn tên Huyền khỏi cột hiển thị này theo yêu cầu, không đổi phân quyền.
                  const displayManagerNames =
                    team.code === 'kd1' ? team.managerNames.filter((name) => name !== 'LÊ THỊ MỸ HUYỀN') : team.managerNames;
                  return (
                    <tr key={team.id} className="divide-x divide-[#edf1f7] hover:bg-[#f6f9ff]">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-navy">{team.name}</p>
                        <p className="text-[11px] uppercase tracking-wide text-muted">{team.code}</p>
                      </td>
                      <td className="px-3 py-2 text-muted">{displayManagerNames.join(', ') || '(chưa có)'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-navy">{team.memberCount}</td>
                      {OVERVIEW_STATUS_COLUMNS.map((col) => (
                        <td key={col.key} className="px-2 py-2 text-center">
                          <StatusCountBadge count={progress ? progress[col.key] : 0} tone={col.tone} />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-blue" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-navy">{pct}%</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted">{progress ? `${progress.done}/${progress.total} task` : '—'}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => onSelectTeam(team.code)} className="text-sm font-semibold text-blue whitespace-nowrap">
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <OverviewTeamBarChart teams={overview.teams} progressByTeam={progressByTeam} />
      </div>
    </div>
  );
}

function TaskTable({
  tasks,
  visibleColumns,
  teamCode,
  allMembers,
  products,
  onUpdate,
  onDelete,
  allowBulkPattern,
  onBulkDuplicateDates,
  onBulkDuplicatePattern,
  onStatusChange,
  statusPendingTaskIds,
  emptyMessage,
  isAdding,
  assignableMembers,
  defaultDate,
  onCancelAdd,
  onCreate,
}: {
  tasks: Task[];
  visibleColumns: string[];
  teamCode: string;
  allMembers: TeamMember[];
  products: string[];
  onUpdate: (taskId: number, input: TaskInput) => void;
  onDelete: (task: Task) => void;
  allowBulkPattern: boolean;
  onBulkDuplicateDates: (taskIds: number[], dates: string[], assigneeUserIds: number[]) => void;
  onBulkDuplicatePattern: (taskIds: number[], pattern: BulkDuplicatePattern, assigneeUserIds: number[]) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  statusPendingTaskIds: Set<number>;
  emptyMessage: string;
  isAdding: boolean;
  assignableMembers: TeamMember[];
  defaultDate: string;
  onCancelAdd: () => void;
  onCreate: (input: TaskInput) => void;
}) {
  const columns = TASK_COLUMN_KEYS.filter((key) => visibleColumns.includes(key));
  // Khớp thứ tự cột bảng Notion gốc: Tên Acc đứng trước Chủ đề, các cột còn
  // lại (Up kênh/SL VID/Sản phẩm...) đứng sau Chủ đề.
  const leadingColumns = columns.filter((key) => key === 'accountName');
  const trailingColumns = columns.filter((key) => key !== 'accountName');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [bulkDuplicating, setBulkDuplicating] = useState(false);
  const { fire: fireConfetti, node: confettiNode } = useCheckboxConfetti();

  // Cùng bảng màu/thứ tự tên với thẻ tổng hợp "Task theo người" phía trên —
  // gom nhóm task theo người phụ trách để dễ quét theo từng người, mỗi người
  // 1 màu nhất quán ở mọi nơi trên trang.
  const colorMap = useMemo(() => assigneeColorMap(allMembers), [allMembers]);
  const nameOrder = useMemo(() => Array.from(colorMap.keys()), [colorMap]);
  const sortedTasks = useMemo(() => {
    const orderOf = (name: string | null) => {
      if (!name) return nameOrder.length;
      const idx = nameOrder.indexOf(name);
      return idx === -1 ? nameOrder.length : idx;
    };
    return [...tasks].sort((a, b) => orderOf(a.assigneeFullName) - orderOf(b.assigneeFullName));
  }, [tasks, nameOrder]);

  // Mỗi sản phẩm 1 màu ổn định, dùng chung giữa ô hiển thị và ô chọn khi sửa.
  const productColorMap = useMemo(() => distinctColorMap(products), [products]);

  function toggleSelect(taskId: number) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  const allSelected = tasks.length > 0 && selectedTaskIds.size === tasks.length;
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selectedTaskIds.size > 0 && !allSelected;
  }, [selectedTaskIds.size, allSelected]);

  function toggleSelectAll() {
    setSelectedTaskIds((prev) => (prev.size === tasks.length ? new Set() : new Set(tasks.map((t) => t.id))));
  }

  // Đổi tab nhóm/task bị xoá/board tự làm mới đều đổi `tasks` — bỏ khỏi lựa
  // chọn những ID không còn hiển thị để thanh "Đã chọn N task" không lệch.
  useEffect(() => {
    setSelectedTaskIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(tasks.map((t) => t.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [tasks]);

  return (
    <div className="overflow-hidden rounded-[16px] border-2 border-navy/15 bg-white shadow-[0_16px_40px_-24px_rgba(16,26,48,0.35)]">
      <div className="h-1 w-full rounded-t-[14px] bg-navy" aria-hidden="true" />
      {selectedTaskIds.size > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-l-4 border-[#e8edf5] border-l-blue bg-[#F2F6FF] px-4 py-2 text-xs">
          <span className="font-semibold text-navy">Đã chọn {selectedTaskIds.size} task</span>
          <div className="flex gap-3">
            <button type="button" onClick={() => setSelectedTaskIds(new Set())} className="font-semibold text-muted hover:text-navy">
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={() => setBulkDuplicating(true)}
              className="rounded-[8px] bg-blue px-3 py-1.5 font-semibold text-white hover:bg-blue-cta"
            >
              Nhân bản đã chọn
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="border-b-2 border-cyan/30 bg-gradient-to-r from-gold/10 via-white to-cyan/10 text-xs font-bold uppercase tracking-wider text-[#000000]">
            <tr className="divide-x divide-[#e8edf5]">
              <th className="px-3 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả task để nhân bản hàng loạt"
                  className="h-4 w-4 cursor-pointer accent-blue"
                />
              </th>
              <th className="whitespace-nowrap px-3 py-3">Ngày</th>
              <th className="whitespace-nowrap px-3 py-3">Thành viên</th>
              {leadingColumns.map((key) => (
                <th key={key} className="whitespace-nowrap px-3 py-3">
                  {COLUMN_LABELS[key]}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-3">Chủ đề</th>
              {trailingColumns.map((key) => (
                <th key={key} className="whitespace-nowrap px-3 py-3">
                  {COLUMN_LABELS[key]}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-3">Trạng thái</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1f7]">
            {isAdding && (
              <TaskRowEditor
                leadingColumns={leadingColumns}
                trailingColumns={trailingColumns}
                teamCode={teamCode}
                members={assignableMembers}
                products={products}
                defaultDate={defaultDate}
                onCancel={onCancelAdd}
                onSubmit={onCreate}
              />
            )}
            {tasks.length === 0 && !isAdding && (
              <tr>
                <td colSpan={columns.length + 6} className="px-4 py-6 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {sortedTasks.map((task) => {
              const rowColor = colorMap.get(task.assigneeFullName ?? '') ?? UNASSIGNED_COLOR;
              return editingTaskId === task.id ? (
                <TaskRowEditor
                  key={task.id}
                  task={task}
                  leadingColumns={leadingColumns}
                  trailingColumns={trailingColumns}
                  teamCode={teamCode}
                  members={allMembers}
                  products={products}
                  defaultDate={task.taskDate}
                  onCancel={() => setEditingTaskId(null)}
                  onSubmit={(input) => {
                    onUpdate(task.id, input);
                    setEditingTaskId(null);
                  }}
                />
              ) : (
              <tr
                key={task.id}
                className="divide-x divide-[#edf1f7] transition-[filter] hover:brightness-95"
                style={{ backgroundColor: `${rowColor}26` }}
              >
                <td className="px-3 py-2.5" style={{ borderLeft: `3px solid ${rowColor}` }}>
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.has(task.id)}
                    onChange={() => toggleSelect(task.id)}
                    aria-label="Chọn task để nhân bản hàng loạt"
                    className="h-4 w-4 cursor-pointer accent-blue"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-variant-numeric-tabular text-ink">{formatVi(task.taskDate).slice(0, 5)}</td>
                <td className="px-3 py-2.5 text-ink">
                  {task.assigneeFullName ? (
                    <div className="flex items-center gap-1.5">
                      {task.assigneeAvatarUrl ? (
                        <Image
                          src={task.assigneeAvatarUrl}
                          alt={task.assigneeFullName}
                          width={24}
                          height={24}
                          className="h-6 w-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#4FA3F7] text-[10px] font-bold text-white">
                          {initialsOf(task.assigneeFullName)}
                        </span>
                      )}
                      {givenNameOf(task.assigneeFullName)}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                {leadingColumns.map((key) => {
                  const value = String((task as unknown as Record<string, unknown>)[key] ?? '');
                  return (
                    <td key={key} className="px-3 py-2.5">
                      {value ? (
                        <span className="text-sm font-medium text-[#000000]">{value}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 font-medium text-navy">{task.title}</td>
                {trailingColumns.map((key) => {
                  const rawValue = String((task as unknown as Record<string, unknown>)[key] ?? '');
                  return (
                    <td key={key} className="px-3 py-2.5 text-ink">
                      {key === 'videoCount' ? (
                        task.videoCount ?? ''
                      ) : key === 'product' && task.product ? (
                        <span
                          className="inline-block truncate rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                          style={{ background: productColorMap.get(task.product) ?? UNASSIGNED_COLOR }}
                        >
                          {task.product}
                        </span>
                      ) : key === 'note' || key === 'referenceLink' ? (
                        <span className="block max-w-[220px] truncate" title={rawValue || undefined}>
                          {rawValue}
                        </span>
                      ) : (
                        rawValue
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    disabled={statusPendingTaskIds.has(task.id)}
                    aria-pressed={task.status === 'done'}
                    aria-busy={statusPendingTaskIds.has(task.id)}
                    aria-label={task.status === 'done' ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                    onClick={() => {
                      const nextStatus = task.status === 'done' ? 'not_started' : 'done';
                      onStatusChange(task, nextStatus);
                      if (nextStatus !== 'done') return;
                      fireConfetti();
                    }}
                    className={`group grid h-11 w-11 place-items-center rounded-[8px] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 ${
                      statusPendingTaskIds.has(task.id) ? 'cursor-wait opacity-80' : 'cursor-pointer active:scale-[0.96]'
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-[5px] border transition-[background-color,border-color,transform] duration-150 ${
                        task.status === 'done'
                          ? 'border-[#20C978] bg-[#20C978] text-white shadow-[0_5px_12px_-7px_rgba(32,201,120,0.9)]'
                          : 'border-navy/30 bg-white text-transparent group-hover:scale-105 group-hover:border-[#20C978]'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} aria-hidden="true" />
                    </span>
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs">
                  <TaskRowMenu onEdit={() => setEditingTaskId(task.id)} onDelete={() => onDelete(task)} />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {bulkDuplicating && (
        <BulkSelectedDuplicateModal
          count={selectedTaskIds.size}
          initialMonth={defaultDate}
          allMembers={allMembers}
          allowBulkPattern={allowBulkPattern}
          onClose={() => setBulkDuplicating(false)}
          onSubmitDates={(dates, assigneeUserIds) => {
            onBulkDuplicateDates([...selectedTaskIds], dates, assigneeUserIds);
            setBulkDuplicating(false);
            setSelectedTaskIds(new Set());
          }}
          onSubmitPattern={(pattern, assigneeUserIds) => {
            onBulkDuplicatePattern([...selectedTaskIds], pattern, assigneeUserIds);
            setBulkDuplicating(false);
            setSelectedTaskIds(new Set());
          }}
        />
      )}
      {confettiNode}
    </div>
  );
}

const KANBAN_COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: 'not_started', label: 'Chưa làm', dot: 'bg-[#B7C2D6]' },
  { status: 'in_progress', label: 'Đang làm', dot: 'bg-blue' },
  { status: 'done', label: 'Hoàn thành', dot: 'bg-emerald-500' },
];

/** Xem Thẻ: lưới thẻ rộng để dễ quét nhanh nhiều task cùng lúc — cùng dữ
 *  liệu `tasks` với Bảng, chỉ khác cách trình bày (đổi trạng thái + xoá;
 *  sửa chi tiết từng trường vẫn làm ở Bảng). Cột song song theo từng người
 *  phụ trách, thẻ trong mỗi cột xếp dọc, hiện đủ toàn bộ task của người đó,
 *  không cắt/giới hạn số lượng. */
function TaskCardGrid({
  tasks,
  today,
  members,
  onStatusChange,
  statusPendingTaskIds,
  emptyMessage,
  onDelete,
}: {
  tasks: Task[];
  today: string;
  members: TeamMember[];
  onStatusChange: (task: Task, status: TaskStatus) => void;
  statusPendingTaskIds: Set<number>;
  emptyMessage: string;
  onDelete: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-[16px] border-2 border-navy/15 bg-white p-10 text-center text-sm text-muted shadow-[0_16px_40px_-24px_rgba(16,26,48,0.35)]">
        {emptyMessage}
      </div>
    );
  }

  const rosterOrder = new Map(members.map((m, i) => [m.fullName, i]));
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.assigneeFullName ?? 'Chưa gán';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(task);
  }
  const names = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'Chưa gán') return 1;
    if (b === 'Chưa gán') return -1;
    const ra = rosterOrder.get(a) ?? Infinity;
    const rb = rosterOrder.get(b) ?? Infinity;
    return ra !== rb ? ra - rb : a.localeCompare(b, 'vi');
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {names.map((name) => {
        const groupTasks = groups.get(name)!;
        const member = members.find((m) => m.fullName === name);
        return (
          <div
            key={name}
            className="flex w-80 shrink-0 flex-col gap-3 rounded-[16px] border-2 border-navy/15 bg-white p-3 shadow-[0_16px_40px_-24px_rgba(16,26,48,0.35)]"
          >
            <div className="flex items-center gap-2 px-1">
              {member?.avatarUrl ? (
                <Image src={member.avatarUrl} alt={name} width={28} height={28} className="h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#4FA3F7] text-[11px] font-bold text-white">
                  {initialsOf(name)}
                </span>
              )}
              <strong className="font-heading text-sm text-navy">{name === 'Chưa gán' ? name : givenNameOf(name)}</strong>
              <span className="ml-auto text-xs font-bold text-muted">{groupTasks.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {groupTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  today={today}
                  pending={statusPendingTaskIds.has(task.id)}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_ORDER: TaskStatus[] = ['not_started', 'in_progress', 'done'];

/** Thẻ task rộng kiểu "Projects" (badge trạng thái + menu ở trên, tiêu đề ở
 *  giữa, avatar/ngày ở dưới) — bấm vào badge trạng thái để chuyển sang trạng
 *  thái kế tiếp, không cần mở form. */
function TaskCard({
  task,
  today,
  pending,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  today: string;
  pending: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const statusMeta = KANBAN_COLUMNS.find((c) => c.status === task.status) ?? KANBAN_COLUMNS[0];
  const statusTextTone = task.status === 'done' ? 'text-emerald-600' : task.status === 'in_progress' ? 'text-blue' : 'text-muted';

  function cycleStatus() {
    if (pending) return;
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
    onStatusChange(task, next);
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
      className="flex flex-col gap-3 rounded-[14px] border border-[#e8edf5] bg-white p-4 shadow-[0_10px_24px_-18px_rgba(16,26,48,0.35)] transition hover:shadow-[0_16px_32px_-16px_rgba(16,26,48,0.35)]"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          disabled={pending}
          aria-busy={pending}
          onClick={cycleStatus}
          title="Bấm để đổi trạng thái"
          className={`flex min-h-11 items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-[transform,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 ${
            pending ? 'cursor-wait opacity-70' : 'hover:-translate-y-0.5 active:translate-y-0'
          } ${statusTextTone}`}
        >
          <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} aria-hidden="true" />
          {statusMeta.label}
        </button>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Tuỳ chọn task"
            className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
          >
            <MoreVertical size={16} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-8 z-20 w-32 border border-[#e8edf5] bg-white py-1 text-xs shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDelete(task);
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

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">#{task.id}</p>
        <p className="mt-0.5 line-clamp-2 font-heading text-base font-semibold text-navy">{task.title}</p>
        {(task.accountName || task.product) && (
          <p className="mt-1 truncate text-sm text-muted">{[task.accountName, task.product].filter(Boolean).join(' · ')}</p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          {task.assigneeFullName ? (
            <>
              {task.assigneeAvatarUrl ? (
                <Image
                  src={task.assigneeAvatarUrl}
                  alt={task.assigneeFullName}
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#4FA3F7] text-[11px] font-bold text-white">
                  {initialsOf(task.assigneeFullName)}
                </span>
              )}
              <span className="truncate text-sm font-medium text-ink">{givenNameOf(task.assigneeFullName)}</span>
            </>
          ) : (
            <span className="text-sm text-muted">Chưa gán</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {task.note && <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Có ghi chú" />}
          {task.videoCount != null && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-muted">
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              {task.videoCount}
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${dateTone}`}>
            {formatVi(task.taskDate).slice(0, 5)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Menu "⋮" của mỗi dòng task — portal ra document.body thay vì absolute
 *  trong ô, vì bảng cuộn ngang (overflow-x-auto) khiến trục dọc cũng bị cắt
 *  theo (quy tắc CSS: overflow-x khác visible thì overflow-y "visible" tự
 *  thành "auto"), nên dòng cuối bảng menu xổ xuống sẽ bị khuất mất. */
function TaskRowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function handleScroll() {
      setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Tuỳ chọn task"
        className="ml-auto grid h-7 w-7 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: coords.top, right: coords.right }}
            className="fixed z-50 w-36 border border-[#e8edf5] bg-white py-1 text-left text-xs shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left font-semibold text-blue hover:bg-[#f2f5fa]"
            >
              Sửa
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left font-semibold text-red-500 hover:bg-[#f2f5fa]"
            >
              Xoá
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

function memberAvatar(m: TeamMember, size: number) {
  return m.avatarUrl ? (
    <Image
      src={m.avatarUrl}
      alt={m.fullName}
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ height: size, width: size }}
    />
  ) : (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[#4FA3F7] font-bold text-white"
      style={{ height: size, width: size, fontSize: size * 0.42 }}
    >
      {initialsOf(m.fullName)}
    </span>
  );
}

/** Picker chọn người phụ trách kiểu "Đã chọn / Đổi người khác" với avatar,
 *  thay cho <select> thuần — dùng ở hàng thêm task ngay trong bảng. */
function MemberPickerCell({
  members,
  value,
  onChange,
}: {
  members: TeamMember[];
  value: number | null;
  onChange: (userId: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = members.find((m) => m.userId === value) ?? null;
  const others = members.filter((m) => m.userId !== value);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full min-w-[100px] items-center gap-1.5 rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-left text-sm outline-none focus:border-blue"
      >
        {selected ? (
          <>
            {memberAvatar(selected, 18)}
            <span className="truncate">{givenNameOf(selected.fullName)}</span>
          </>
        ) : (
          <span className="text-muted">— Chưa gán —</span>
        )}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 w-52 border border-[#e8edf5] bg-white py-2 text-sm shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
        >
          {selected && (
            <>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Đã chọn</p>
              <div className="flex w-full items-center gap-2 bg-[#f2f5fa] px-3 py-1.5 font-medium text-navy">
                {memberAvatar(selected, 18)}
                {givenNameOf(selected.fullName)}
              </div>
              <div className="my-1.5 border-t border-[#edf1f7]" />
            </>
          )}
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            {selected ? 'Đổi người khác' : 'Chọn người'}
          </p>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="flex w-full items-center px-3 py-1.5 text-left text-muted hover:bg-[#f2f5fa]"
          >
            — Chưa gán —
          </button>
          {others.map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => {
                onChange(m.userId);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-[#f2f5fa]"
            >
              {memberAvatar(m, 18)}
              {givenNameOf(m.fullName)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ô chọn "Tên Acc" trong TaskRowEditor — combobox tìm kiếm thay vì <select>
 *  liệt kê hết vì mỗi đội có tới ~150-180 acc trong danh bạ (lib/shops.ts).
 *  Mặc định (chưa gõ tìm) chỉ hiện acc đang hoạt động (active/chạy ADS) cho
 *  nhẹ danh sách; gõ tìm thì tìm trên toàn bộ danh bạ của đội, kể cả acc đã
 *  inactive, vì quản lý đôi khi vẫn cần gán lại một acc cũ. */
function AccountNameCell({ value, onChange, shops }: { value: string; onChange: (name: string) => void; shops: ShopEntry[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selected = shops.find((s) => s.name === value) ?? (value ? { name: value, active: false } : null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
    else setQuery('');
  }, [open]);

  const trimmedQuery = query.trim().toLowerCase();
  const results = (trimmedQuery ? shops : shops.filter((s) => s.active)).filter(
    (s) => !trimmedQuery || s.name.toLowerCase().includes(trimmedQuery)
  );

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full min-w-[100px] items-center rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-left text-sm outline-none focus:border-blue"
      >
        <span className="truncate">{selected ? selected.name : <span className="text-muted">— Chưa chọn —</span>}</span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 w-64 border border-[#e8edf5] bg-white text-sm shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
        >
          {selected && (
            <>
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Đã chọn</p>
              <div className="flex items-center justify-between gap-2 bg-[#f2f5fa] px-3 py-1.5 font-medium text-navy">
                <span className="truncate">{selected.name}</span>
                {!selected.active && <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">Inactive</span>}
              </div>
              <div className="my-1.5 border-t border-[#edf1f7]" />
            </>
          )}
          <div className="px-3 pb-1.5">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên acc…"
              className="w-full rounded-[6px] border border-[#dbe4f2] px-2 py-1.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div className="max-h-56 overflow-y-auto pb-1.5">
            <button
              type="button"
              onClick={() => select('')}
              className="flex w-full items-center px-3 py-1.5 text-left text-muted hover:bg-[#f2f5fa]"
            >
              — Chưa chọn —
            </button>
            {results.length === 0 && <p className="px-3 py-2 text-xs text-muted">Không tìm thấy acc nào.</p>}
            {results.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => select(s.name)}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-[#f2f5fa]"
              >
                <span className="truncate">{s.name}</span>
                {!s.active && <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">Inactive</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Ô chọn "Sản phẩm" trong TaskRowEditor — combobox tìm-chọn như Tên Acc,
 *  nhưng danh sách không cố định: `products` suy ra từ các task đã lưu của
 *  đội (getDistinctProductsForTeam), nên gõ tên sản phẩm mới rồi bấm "Dùng…"
 *  là đủ để nó tự có trong danh sách gợi ý ở lần thêm/sửa task kế tiếp —
 *  không cần màn hình quản lý sản phẩm riêng. Mỗi sản phẩm 1 màu ổn định
 *  (distinctColorMap) hiển thị dạng thẻ màu, khớp màu ở cột hiển thị. */
function ProductCell({ value, onChange, products }: { value: string; onChange: (name: string) => void; products: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const allProducts = useMemo(
    () => Array.from(new Set([...products, ...(value ? [value] : [])])).sort((a, b) => a.localeCompare(b, 'vi')),
    [products, value]
  );
  const colorMap = useMemo(() => distinctColorMap(allProducts), [allProducts]);
  const colorOf = (name: string) => colorMap.get(name) ?? UNASSIGNED_COLOR;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
    else setQuery('');
  }, [open]);

  const trimmedQuery = query.trim();
  const results = allProducts.filter((p) => !trimmedQuery || p.toLowerCase().includes(trimmedQuery.toLowerCase()));
  const exactMatch = allProducts.some((p) => p.toLowerCase() === trimmedQuery.toLowerCase());

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full min-w-[100px] items-center rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-left text-sm outline-none focus:border-blue"
      >
        {value ? (
          <span className="truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: colorOf(value) }}>
            {value}
          </span>
        ) : (
          <span className="text-muted">— Chưa chọn —</span>
        )}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 w-64 border border-[#e8edf5] bg-white text-sm shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
        >
          <div className="px-3 pt-2 pb-1.5">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && trimmedQuery && !exactMatch) {
                  e.preventDefault();
                  select(trimmedQuery);
                }
              }}
              placeholder="Tìm hoặc thêm sản phẩm mới…"
              className="w-full rounded-[6px] border border-[#dbe4f2] px-2 py-1.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div className="max-h-56 overflow-y-auto pb-1.5">
            <button
              type="button"
              onClick={() => select('')}
              className="flex w-full items-center px-3 py-1.5 text-left text-muted hover:bg-[#f2f5fa]"
            >
              — Chưa chọn —
            </button>
            {trimmedQuery && !exactMatch && (
              <button
                type="button"
                onClick={() => select(trimmedQuery)}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left font-semibold text-blue hover:bg-[#f2f5fa]"
              >
                + Dùng "{trimmedQuery}"
              </button>
            )}
            {results.length === 0 && !trimmedQuery && <p className="px-3 py-2 text-xs text-muted">Chưa có sản phẩm nào.</p>}
            {results.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => select(name)}
                className="flex w-full items-center px-3 py-1.5 text-left hover:bg-[#f2f5fa]"
              >
                <span className="truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: colorOf(name) }}>
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Hàng nhập liệu ngay trong bảng thay vì popup — dùng chung cho "Thêm task"
 *  (task=null, lưu xong biến mất) và "Sửa task" (task=dòng hiện có, lưu xong
 *  trở về hiển thị thường). Khi thêm mới, members chỉ gợi ý người đúng
 *  nhóm/tab đang xem để task không tự "biến mất" khỏi tab vừa thêm; khi sửa,
 *  members là cả đội vì task cũ có thể đang gán cho người ở nhóm khác. */
function TaskRowEditor({
  task,
  leadingColumns,
  trailingColumns,
  teamCode,
  members,
  products,
  defaultDate,
  onCancel,
  onSubmit,
}: {
  task?: Task;
  leadingColumns: readonly TaskColumnKey[];
  trailingColumns: readonly TaskColumnKey[];
  teamCode: string;
  members: TeamMember[];
  products: string[];
  defaultDate: string;
  onCancel: () => void;
  onSubmit: (input: TaskInput) => void;
}) {
  const [taskDate, setTaskDate] = useState(task?.taskDate ?? defaultDate);
  const [assigneeUserId, setAssigneeUserId] = useState<number | null>(task?.assigneeUserId ?? members[0]?.userId ?? null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [accountName, setAccountName] = useState(task?.accountName ?? '');
  const [channel, setChannel] = useState(task?.channel ?? '');
  const [videoCount, setVideoCount] = useState(task?.videoCount?.toString() ?? '');
  const [product, setProduct] = useState(task?.product ?? '');
  const [optionTag, setOptionTag] = useState(task?.optionTag ?? '');
  const [referenceLink, setReferenceLink] = useState(task?.referenceLink ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'not_started');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { fire: fireConfetti, node: confettiNode } = useCheckboxConfetti();
  // Bàn phím ảo/IME trên điện thoại có thể bắn 2 sự kiện Enter liên tiếp cho
  // 1 lượt gõ — khoá gửi trong 400ms sau lần gửi trước để chặn tạo trùng task.
  const lastSaveAtRef = useRef(0);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const cellInputClass = 'w-full min-w-[100px] rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-sm outline-none focus:border-blue';
  const shops = shopsForTeamCode(teamCode);

  function handleSave() {
    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }
    const now = Date.now();
    if (now - lastSaveAtRef.current < 400) return;
    lastSaveAtRef.current = now;
    onSubmit({
      taskDate,
      assigneeUserId,
      title: title.trim(),
      categoryId: task?.categoryId ?? null,
      accountName: accountName || null,
      channel: channel || null,
      videoCount: videoCount ? Number(videoCount) : null,
      product: product || null,
      optionTag: optionTag || null,
      referenceLink: referenceLink || null,
      note: note || null,
      status,
    });
  }

  function renderColumnInput(key: TaskColumnKey) {
    switch (key) {
      case 'accountName':
        return <AccountNameCell value={accountName} onChange={setAccountName} shops={shops} />;
      case 'channel':
        return <input value={channel} onChange={(e) => setChannel(e.target.value)} className={cellInputClass} />;
      case 'videoCount':
        return <input type="number" min={0} value={videoCount} onChange={(e) => setVideoCount(e.target.value)} className={cellInputClass} />;
      case 'product':
        return <ProductCell value={product} onChange={setProduct} products={products} />;
      case 'optionTag':
        return <input value={optionTag} onChange={(e) => setOptionTag(e.target.value)} className={cellInputClass} />;
      case 'note':
        return <input value={note} onChange={(e) => setNote(e.target.value)} className={cellInputClass} />;
      case 'referenceLink':
        return <input value={referenceLink} onChange={(e) => setReferenceLink(e.target.value)} className={cellInputClass} />;
      default:
        return null;
    }
  }

  return (
    <tr className="divide-x divide-[#edf1f7] bg-[#f6f9ff]">
      <td className="px-3 py-2.5" />
      <td className="px-3 py-2.5">
        <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className={cellInputClass} />
      </td>
      <td className="px-3 py-2.5">
        <MemberPickerCell members={members} value={assigneeUserId} onChange={setAssigneeUserId} />
      </td>
      {leadingColumns.map((key) => (
        <td key={key} className="px-3 py-2.5">
          {renderColumnInput(key)}
        </td>
      ))}
      <td className="px-3 py-2.5">
        <input
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSave()}
          placeholder="Chủ đề, đầu việc"
          className={cellInputClass}
        />
      </td>
      {trailingColumns.map((key) => (
        <td key={key} className="px-3 py-2.5">
          {renderColumnInput(key)}
        </td>
      ))}
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={status === 'done'}
          onChange={(e) => setStatus(e.target.checked ? 'done' : 'not_started')}
          onClick={(e) => {
            if (!e.currentTarget.checked) return;
            fireConfetti();
          }}
          aria-label={status === 'done' ? 'Hoàn thành' : 'Chưa hoàn thành'}
          className="h-4 w-4 cursor-pointer accent-[#2ECC85]"
        />
        {confettiNode}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
        <button type="button" onClick={handleSave} className="mr-2 font-semibold text-blue">
          Lưu
        </button>
        <button type="button" onClick={onCancel} className="font-semibold text-muted">
          Huỷ
        </button>
      </td>
    </tr>
  );
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function MonthProgressCard({ done, total, monthLabel }: { done: number; total: number; monthLabel: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#0052CC 0 ${pct}%, #EAF0F7 ${pct}% 100%)` }}
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[10px] font-bold text-navy">{pct}%</div>
        </div>
        <div>
          <p className="font-heading text-sm font-bold text-navy">Tháng {monthLabel.split('-')[1]}</p>
          <p className="text-xs text-muted">
            {done} / {total} task
          </p>
        </div>
      </div>
    </div>
  );
}

function TeamRosterCard({
  team,
  categories,
  isManager,
  onAddMember,
  onRemoveMember,
  onSetRole,
  onSetMemberCategory,
  onManageCategories,
}: {
  team: TeamWithRoster;
  categories: TeamTaskCategory[];
  isManager: boolean;
  onAddMember: () => void;
  onRemoveMember: (userId: number) => void;
  onSetRole: (userId: number, role: TeamMemberRole) => void;
  onSetMemberCategory: (userId: number, categoryId: number | null) => void;
  onManageCategories: () => void;
}) {
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openMenuUserId === null) return;
    function handlePointerDown(e: MouseEvent) {
      if (!cardRef.current?.contains(e.target as Node)) setOpenMenuUserId(null);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenuUserId(null);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuUserId]);

  const unassignedMembers = team.members.filter((m) => m.categoryId === null);

  function renderMember(member: TeamMember) {
    return (
      <div key={member.userId} className="relative flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          {memberAvatar(member, 28)}
          <span className="truncate uppercase text-ink">
            {member.fullName}
            {member.role === 'manager' && <span className="ml-1.5 text-xs font-semibold text-blue">· Quản lý</span>}
            {member.categoryId !== null && (
              <span className="ml-1.5 text-xs font-semibold" style={{ color: categoryColor(categories, member.categoryId) }}>
                · {categories.find((c) => c.id === member.categoryId)?.name.toUpperCase()}
              </span>
            )}
          </span>
        </div>
        {isManager && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenuUserId(openMenuUserId === member.userId ? null : member.userId)}
              aria-haspopup="menu"
              aria-expanded={openMenuUserId === member.userId}
              aria-label="Tuỳ chọn thành viên"
              className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
            >
              <MoreVertical size={16} aria-hidden="true" />
            </button>
            {openMenuUserId === member.userId && (
              <div
                role="menu"
                className="absolute right-0 top-7 z-10 w-44 border border-[#e8edf5] bg-white py-1 text-xs shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSetRole(member.userId, member.role === 'manager' ? 'member' : 'manager');
                    setOpenMenuUserId(null);
                  }}
                  className="block w-full px-3 py-1.5 text-left font-semibold text-blue hover:bg-[#f2f5fa]"
                >
                  {member.role === 'manager' ? 'Bỏ quản lý' : 'Đặt quản lý'}
                </button>
                {categories.length > 0 && <div className="my-1 border-t border-[#edf1f7]" />}
                {categories
                  .filter((cat) => cat.id !== member.categoryId)
                  .map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSetMemberCategory(member.userId, cat.id);
                        setOpenMenuUserId(null);
                      }}
                      style={{ color: categoryColor(categories, cat.id) }}
                      className="block w-full px-3 py-1.5 text-left font-semibold hover:bg-[#f2f5fa]"
                    >
                      {cat.name.toUpperCase()}
                    </button>
                  ))}
                {member.categoryId !== null && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onSetMemberCategory(member.userId, null);
                      setOpenMenuUserId(null);
                    }}
                    className="block w-full px-3 py-1.5 text-left font-semibold text-muted hover:bg-[#f2f5fa]"
                  >
                    Bỏ khỏi nhóm
                  </button>
                )}
                <div className="my-1 border-t border-[#edf1f7]" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onRemoveMember(member.userId);
                    setOpenMenuUserId(null);
                  }}
                  className="block w-full px-3 py-1.5 text-left font-semibold text-red-500 hover:bg-[#f2f5fa]"
                >
                  Gỡ khỏi đội
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={cardRef} className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
      <p className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-muted">Thành viên đội</p>

      {categories.map((cat) => {
        const catMembers = team.members.filter((m) => m.categoryId === cat.id);
        return (
          <div key={cat.id} className="mb-4">
            <p className="mb-2 font-heading text-xs font-bold uppercase tracking-wider" style={{ color: categoryColor(categories, cat.id) }}>
              {cat.name}
            </p>
            <div className="flex flex-col gap-2">
              {catMembers.length === 0 && <p className="text-sm text-muted">Chưa có ai trong nhóm này.</p>}
              {catMembers.map(renderMember)}
            </div>
          </div>
        );
      })}

      {unassignedMembers.length > 0 && (
        <>
          <p className="mb-2 font-heading text-xs font-bold uppercase tracking-wider text-muted">Chưa phân nhóm</p>
          <div className="flex flex-col gap-2">{unassignedMembers.map(renderMember)}</div>
        </>
      )}

      {isManager && (
        <div className="mt-3 flex items-center gap-4">
          <button type="button" onClick={onAddMember} className="text-sm font-semibold text-blue">
            + Thêm thành viên
          </button>
          <button type="button" onClick={onManageCategories} className="text-sm font-semibold text-blue">
            + Nhóm
          </button>
        </div>
      )}
    </div>
  );
}

function AssigneeBarChart({
  chart,
  members,
  showDailyChart,
}: {
  chart: DailyAssigneeCount[];
  members: TeamMember[];
  showDailyChart: boolean;
}) {
  // Popup ngày portal ra document.body thay vì absolute trong cột — khu biểu
  // đồ cuộn ngang (overflow-x-auto) khiến trục dọc cũng bị cắt theo (xem lý
  // do tương tự ở TaskRowMenu), nên popup xổ lên trên sẽ bị khuất mất.
  const [hovered, setHovered] = useState<{ date: string; left: number; top: number } | null>(null);

  useEffect(() => {
    if (!hovered) return;
    function handleScroll() {
      setHovered(null);
    }
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [hovered]);

  if (chart.length === 0) return null;

  const dates = Array.from(new Set(chart.map((c) => c.date))).sort();
  const assignees = Array.from(new Set(chart.map((c) => c.fullName ?? 'Chưa gán'))).sort();
  const max = Math.max(...dates.map((d) => chart.filter((c) => c.date === d).reduce((sum, c) => sum + c.count, 0)), 1);
  const memberByName = new Map(members.map((m) => [m.fullName, m]));
  const colorMap = assigneeColorMap(members);
  const colorOf = (name: string) => colorMap.get(name) ?? UNASSIGNED_COLOR;
  const hoveredDayItems = hovered ? chart.filter((c) => c.date === hovered.date) : [];
  const hoveredDayTotal = hoveredDayItems.reduce((sum, c) => sum + c.count, 0);

  const totalsByAssignee = assignees
    .map((name) => {
      const items = chart.filter((c) => (c.fullName ?? 'Chưa gán') === name);
      return {
        name,
        color: colorOf(name),
        member: memberByName.get(name),
        total: items.reduce((sum, c) => sum + c.count, 0),
        done: items.reduce((sum, c) => sum + c.done, 0),
      };
    })
    .sort((a, b) => b.total - a.total);
  const grandTotal = totalsByAssignee.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-sm font-bold text-navy">Task theo người</p>
        <p className="text-xs font-semibold text-muted">Tổng {grandTotal} task</p>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {totalsByAssignee.map(({ name, color, member, total, done }) => (
          <div
            key={name}
            className="flex items-center justify-between gap-2 rounded-[10px] border border-[#e8edf5] p-2"
            style={{ borderLeftWidth: 3, borderLeftColor: color, backgroundColor: `${color}33` }}
          >
            <div className="flex min-w-0 items-center gap-2">
              {member ? (
                memberAvatar(member, 26)
              ) : (
                <span
                  className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: color }}
                >
                  {name.charAt(0)}
                </span>
              )}
              <p className="truncate text-xs font-bold text-ink">{member ? givenNameOf(name) : name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted">Task</span>
              <div className="flex">
                <span
                  className="grid h-7 w-7 place-items-center border border-navy bg-navy text-xs font-extrabold text-white"
                  title="Đã hoàn thành"
                >
                  {done}
                </span>
                <span
                  className="grid h-7 w-7 place-items-center border border-l-0 border-navy bg-white text-xs font-extrabold text-ink"
                  title="Tổng số task"
                >
                  {total}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showDailyChart && (
        <>
          <p className="mb-2 font-heading text-xs font-bold uppercase tracking-wide text-muted">Theo ngày</p>
          <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: 140 }}>
            {dates.map((date) => {
              const dayItems = chart.filter((c) => c.date === date);
              const dayTotal = dayItems.reduce((sum, c) => sum + c.count, 0);
              return (
                <div
                  key={date}
                  className="flex shrink-0 cursor-default flex-col items-center gap-1"
                  style={{ width: 36 }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHovered({ date, left: rect.left + rect.width / 2, top: rect.top });
                  }}
                  onMouseLeave={() => setHovered((h) => (h?.date === date ? null : h))}
                >
                  <div className="flex w-full flex-col-reverse overflow-hidden rounded-t-[4px]" style={{ height: 100 }}>
                    {dayItems.map((item, idx) => (
                      <div
                        key={`${item.assigneeUserId}-${idx}`}
                        style={{
                          height: `${(item.count / max) * 100}%`,
                          background: colorOf(item.fullName ?? 'Chưa gán'),
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-muted">{dayTotal}</span>
                  <span className="text-[9px] text-muted">{formatVi(date).slice(0, 5)}</span>
                </div>
              );
            })}
          </div>
          {hovered &&
            createPortal(
              <div
                style={{ left: hovered.left, top: hovered.top - 8 }}
                className="pointer-events-none fixed z-50 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-[10px] border border-[#e8edf5] bg-white p-2.5 shadow-[0_16px_32px_-16px_rgba(16,26,48,0.35)]"
              >
                <p className="mb-1 font-heading text-[11px] font-bold text-navy">{formatVi(hovered.date)}</p>
                <ul className="space-y-0.5">
                  {hoveredDayItems.map((item, idx) => {
                    const label = item.fullName ?? 'Chưa gán';
                    const member = memberByName.get(label);
                    return (
                      <li key={`${item.assigneeUserId}-${idx}`} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold" style={{ color: colorOf(label) }}>
                          {member ? givenNameOf(label) : label}
                        </span>
                        <span className="font-bold text-navy">{item.count}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-1.5 border-t border-[#edf1f7] pt-1 text-[10px] font-semibold text-muted">Tổng: {hoveredDayTotal}</p>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
}


/** Lưới lịch chọn nhiều ngày tự do cho tab "Chọn ngày" — thay cho <input
 *  type=date> đơn lẻ vì cần nhân bản rời rạc nhiều ngày, hoặc cả tháng, cùng
 *  lúc trong 1 lần gửi. */
function DuplicateDatePicker({
  initialMonth,
  selected,
  onToggle,
  onToggleMonth,
}: {
  initialMonth: string;
  selected: string[];
  onToggle: (date: string) => void;
  onToggleMonth: (monthDays: string[], allSelected: boolean) => void;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(initialMonth));
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
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

  const [y, m] = viewMonth.split('-');
  const monthLabel = `Tháng ${Number(m)}, ${y}`;
  const monthDays = cells.filter((d) => d >= monthStart && d <= monthEnd);
  const allMonthSelected = monthDays.length > 0 && monthDays.every((d) => selected.includes(d));

  return (
    <div className="rounded-[10px] border border-[#dbe4f2] bg-white p-2">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(shiftAnchor('month', viewMonth, -1))}
          aria-label="Tháng trước"
          className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
        >
          ‹
        </button>
        <strong className="font-heading text-xs text-navy">{monthLabel}</strong>
        <button
          type="button"
          onClick={() => setViewMonth(shiftAnchor('month', viewMonth, 1))}
          aria-label="Tháng sau"
          className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-[#f2f5fa] hover:text-ink"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          const inMonth = dateStr >= monthStart && dateStr <= monthEnd;
          const isSelected = selected.includes(dateStr);
          return (
            <button
              key={`${dateStr}-${i}`}
              type="button"
              disabled={!inMonth}
              onClick={() => onToggle(dateStr)}
              className={`h-8 rounded-[6px] text-xs font-semibold ${
                !inMonth ? 'invisible' : isSelected ? 'bg-blue text-white' : 'border border-[#e8edf5] text-navy hover:bg-[#f2f5fa]'
              }`}
            >
              {inMonth ? Number(dateStr.slice(8, 10)) : ''}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onToggleMonth(monthDays, allMonthSelected)}
        className="mt-2 w-full rounded-[8px] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-blue hover:bg-[#e7f0ff]"
      >
        {allMonthSelected ? 'Bỏ chọn cả tháng' : 'Chọn cả tháng'}
      </button>
    </div>
  );
}

/** Modal nhân bản các task đã tick chọn (checkbox đầu dòng trong bảng) — tab
 *  "Chọn ngày" (nhiều ngày tự do, hoặc cả tháng) hoặc "Lặp lại" (chu kỳ, mỗi
 *  task tự lấy ngày của chính nó làm mốc), kèm chọn thêm người phụ trách. Bỏ
 *  trống người phụ trách thì mỗi task giữ nguyên người của chính nó. */
function BulkSelectedDuplicateModal({
  count,
  initialMonth,
  allMembers,
  allowBulkPattern,
  onClose,
  onSubmitDates,
  onSubmitPattern,
}: {
  count: number;
  initialMonth: string;
  allMembers: TeamMember[];
  allowBulkPattern: boolean;
  onClose: () => void;
  onSubmitDates: (dates: string[], assigneeUserIds: number[]) => void;
  onSubmitPattern: (pattern: BulkDuplicatePattern, assigneeUserIds: number[]) => void;
}) {
  const [mode, setMode] = useState<'once' | 'repeat'>('once');
  const [selectedDates, setSelectedDates] = useState<string[]>([addDays(initialMonth, 1)]);
  const [frequency, setFrequency] = useState<BulkDuplicatePattern['frequency']>('daily');
  const [occurrences, setOccurrences] = useState(7);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => (prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()));
  }

  function toggleMonth(monthDays: string[], allSelected: boolean) {
    setSelectedDates((prev) =>
      allSelected ? prev.filter((d) => !monthDays.includes(d)) : [...new Set([...prev, ...monthDays])].sort()
    );
  }

  function toggleMember(userId: number) {
    setSelectedMembers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  return (
    <ModalShell title={`Nhân bản ${count} task đã chọn`} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === 'once') onSubmitDates(selectedDates, selectedMembers);
          else onSubmitPattern({ frequency, occurrences }, selectedMembers);
        }}
      >
        {allowBulkPattern && (
          <div className="flex gap-1 rounded-[10px] bg-surface-2 p-1">
            {(['once', 'repeat'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-[8px] px-3 py-1.5 text-xs font-semibold ${
                  mode === m ? 'bg-white text-blue shadow-sm' : 'text-muted'
                }`}
              >
                {m === 'once' ? 'Chọn ngày' : 'Lặp lại'}
              </button>
            ))}
          </div>
        )}
        {mode === 'once' ? (
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Ngày đích (đã chọn {selectedDates.length} ngày)</p>
            <DuplicateDatePicker
              initialMonth={addDays(initialMonth, 1)}
              selected={selectedDates}
              onToggle={toggleDate}
              onToggleMonth={toggleMonth}
            />
          </div>
        ) : (
          <>
            <label className="text-xs font-semibold text-muted">
              Tần suất
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BulkDuplicatePattern['frequency'])}
                className="mt-1 w-full rounded-[10px] border border-[#dbe4f2] bg-white px-3 py-2 text-sm outline-none focus:border-blue"
              >
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-muted">
              Số lần lặp
              <input
                type="number"
                min={1}
                max={60}
                value={occurrences}
                onChange={(e) => setOccurrences(Number(e.target.value))}
                className="mt-1 w-full rounded-[10px] border border-[#dbe4f2] bg-white px-3 py-2 text-sm outline-none focus:border-blue"
              />
            </label>
          </>
        )}
        <div>
          <p className="mb-1 text-xs font-semibold text-muted">
            Người phụ trách {selectedMembers.length > 0 ? `(đã chọn ${selectedMembers.length})` : '(giữ nguyên người của từng task)'}
          </p>
          <div className="grid max-h-40 gap-1 overflow-y-auto rounded-[10px] border border-[#dbe4f2] p-2">
            {allMembers.map((member) => {
              const checked = selectedMembers.includes(member.userId);
              return (
                <label
                  key={member.userId}
                  className={`flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-xs font-semibold ${
                    checked ? 'bg-[#E7F0FF] text-blue' : 'text-navy hover:bg-[#f2f5fa]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(member.userId)}
                    className="h-3.5 w-3.5 accent-blue"
                  />
                  {memberAvatar(member, 20)}
                  {member.fullName}
                </label>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[10px] px-4 py-2 text-sm font-semibold text-muted">
            Huỷ
          </button>
          <button
            type="submit"
            disabled={mode === 'once' && selectedDates.length === 0}
            className="rounded-[10px] bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Nhân bản
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function CategoryManagerModal({
  categories,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  categories: TeamTaskCategory[];
  onClose: () => void;
  onCreate: (name: string, visibleColumns: string[]) => void;
  onUpdate: (id: number, patch: { name?: string; visibleColumns?: string[] }) => void;
  onDelete: (id: number) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newColumns, setNewColumns] = useState<string[]>([]);

  function toggleColumn(list: string[], key: string): string[] {
    return list.includes(key) ? list.filter((c) => c !== key) : [...list, key];
  }

  return (
    <ModalShell title="Quản lý nhóm task" onClose={onClose}>
      <div className="grid gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-[10px] border border-[#e8edf5] p-3">
            <div className="mb-2 flex items-center justify-between">
              <input
                defaultValue={cat.name}
                onBlur={(e) => e.target.value !== cat.name && onUpdate(cat.id, { name: e.target.value })}
                className="rounded-[8px] border border-transparent bg-transparent px-1 text-sm font-semibold text-navy hover:border-[#dbe4f2] focus:border-blue focus:outline-none"
              />
              <button type="button" onClick={() => onDelete(cat.id)} className="text-xs font-semibold text-red-500">
                Xoá nhóm
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TASK_COLUMN_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={cat.visibleColumns.includes(key)}
                    onChange={() => onUpdate(cat.id, { visibleColumns: toggleColumn(cat.visibleColumns, key) })}
                  />
                  {COLUMN_LABELS[key]}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-[10px] border border-dashed border-[#dbe4f2] p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên nhóm mới, ví dụ Media"
            className="mb-2 w-full rounded-[8px] border border-[#dbe4f2] px-2 py-1.5 text-sm outline-none focus:border-blue"
          />
          <div className="mb-2 flex flex-wrap gap-2">
            {TASK_COLUMN_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-1 text-xs text-muted">
                <input type="checkbox" checked={newColumns.includes(key)} onChange={() => setNewColumns(toggleColumn(newColumns, key))} />
                {COLUMN_LABELS[key]}
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!newName.trim()}
            onClick={() => {
              onCreate(newName.trim(), newColumns);
              setNewName('');
              setNewColumns([]);
            }}
            className="rounded-[10px] bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            + Tạo nhóm
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function AddMemberModal({
  teamId,
  onClose,
  onAdd,
}: {
  teamId: number;
  onClose: () => void;
  onAdd: (userId: number) => void;
}) {
  const [users, setUsers] = useState<{ id: number; fullName: string; username: string }[] | null>(null);

  useEffect(() => {
    listAddableUsersAction(teamId)
      .then(setUsers)
      .catch(() => setUsers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModalShell title="Thêm thành viên" onClose={onClose}>
      {!users && <p className="text-sm text-muted">Đang tải danh sách…</p>}
      {users && users.length === 0 && <p className="text-sm text-muted">Không còn nhân sự nào chưa thuộc đội.</p>}
      <div className="grid max-h-[360px] gap-2 overflow-y-auto">
        {users?.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onAdd(u.id)}
            className="flex items-center justify-between rounded-[10px] border border-[#e8edf5] px-3 py-2 text-left text-sm hover:bg-[#f6f9ff]"
          >
            <span>
              {u.fullName} <span className="text-muted">· {u.username}</span>
            </span>
            <span className="font-semibold text-blue">+ Thêm</span>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[16px] bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-navy">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-navy">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
