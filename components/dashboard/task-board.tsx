'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MoreVertical,
  TriangleAlert,
  ListChecks,
  CircleDot,
  CheckCircle2,
  Check,
  ArrowLeft,
  X,
  StickyNote,
  Video,
  Rows3,
  Grid2x2,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from 'lucide-react';
import { useCheckboxConfetti } from '@/components/dashboard/checkbox-confetti';
import DepartmentOverview from '@/components/dashboard/department-overview';
import TaskCalendar from '@/components/dashboard/task-calendar';
import type { DepartmentGroup, TeamWithRoster, TeamSummary, TeamTaskCategory, TeamMemberRole, TeamMember } from '@/lib/teams';
import type { Task, TaskInput, TaskStatus, DailyAssigneeCount, TeamMonthProgress, BulkDuplicatePattern, MonthDayCategoryCount } from '@/lib/tasks';
import { TASK_COLUMN_KEYS, type TaskColumnKey } from '@/lib/task-columns';
import { getAnchoredPopoverPosition, type AnchoredPopoverPosition } from '@/lib/anchored-popover';
import {
  clearServerActionRecoveryMarker,
  recoverFromStaleServerActionResponse,
} from '@/lib/server-action-recovery';
import { shopsForTeamCode, type ShopEntry } from '@/lib/shops';
import {
  getMyTeamBoardTasksAction,
  getTeamBoardTasksAsBgdAction,
  getTeamRosterAction,
  getAllTeamsOverviewAction,
  createTaskAction,
  updateTaskAction,
  reorderTasksAction,
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
} from '@/app/dashboard/giao-task/actions';

// Site không có hạ tầng WebSocket/pub-sub — khớp khoảng polling đã có tiền lệ
// ở sticky-board.tsx (2.5 phút) thay vì bịa một con số mới không nhất quán.
const POLL_INTERVAL_MS = 150_000;

// Cùng công thức spring với PersonalKanbanCard (personal-task-board.tsx) —
// dùng lại 1 "cảm giác" chuyển động nhất quán cho mọi thao tác kéo-thả trong
// dashboard thay vì mỗi nơi 1 kiểu.
const DRAG_SPRING_TRANSITION = { type: 'spring', stiffness: 500, damping: 34, mass: 0.7 } as const;

// Ảnh 1x1 trong suốt — gán làm dragImage để ẩn ảnh bóng mờ mặc định của trình
// duyệt khi kéo, nhường chỗ cho thẻ nổi tự vẽ (bám theo con trỏ) mượt hơn.
const TRANSPARENT_DRAG_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7';

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
  dayCategoryCounts: MonthDayCategoryCount[];
  range: DateRange;
}

interface OverviewData {
  teams: TeamSummary[];
  monthProgress: TeamMonthProgress[];
  departments: DepartmentGroup[];
}

interface TaskBoardProps {
  isBgd: boolean;
  today: string;
  overview: OverviewData | null;
  board: BoardData | null;
}

const COLUMN_LABELS: Record<TaskColumnKey, string> = {
  accountName: 'Tên Acc',
  channelName: 'Kênh',
  channel: 'Up kênh',
  videoCount: 'SL VID',
  product: 'Sản phẩm',
  optionTag: 'Nhãn phụ',
  referenceLink: 'Link mẫu',
  note: 'Ghi chú',
};

// KD4 bán trên sàn (listing), không "up kênh" như các đội media — đổi tên cột
// hiển thị cho đúng nghiệp vụ, dữ liệu/khoá cột (`channel`) giữ nguyên.
const COLUMN_LABEL_OVERRIDES: Partial<Record<string, Partial<Record<TaskColumnKey, string>>>> = {
  kd4: { channel: 'SL Listing' },
};

function columnLabel(key: TaskColumnKey, teamCode: string): string {
  return COLUMN_LABEL_OVERRIDES[teamCode]?.[key] ?? COLUMN_LABELS[key];
}

/** Độ rộng cố định (px) cho từng cột tuỳ chọn — dùng với table-layout: fixed
 *  để bảng không bị lệch cột (cột chứa URL/text dài nuốt hết chỗ, cột trống
 *  teo lại) như khi để trình duyệt tự co giãn theo nội dung. Cột "Chủ đề"
 *  là cột duy nhất không khai độ rộng nên nó nhận hết phần còn lại. */
const COLUMN_WIDTH_PX: Record<TaskColumnKey, number> = {
  accountName: 130,
  channelName: 110,
  channel: 110,
  videoCount: 80,
  product: 130,
  optionTag: 140,
  referenceLink: 180,
  note: 180,
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
  // Chuẩn hoá về ngày 1 trước khi cộng tháng — nếu không, dateStr có ngày
  // 29/30/31 mà tháng kế tiếp ngắn hơn (vd 31/08 cộng lên tháng 9 chỉ có 30
  // ngày) sẽ khiến Date tự tràn tiếp sang tháng sau nữa (ra 30/09 thay vì
  // đúng 31/08 của tháng gốc).
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return toISO(date);
}

function shiftMonth(anchor: string, direction: 1 | -1): string {
  const date = parseISO(anchor);
  // Luôn về ngày 1 của tháng đích — nếu giữ nguyên ngày gốc (vd 31) mà tháng
  // kế tiếp ngắn hơn (tháng 9 chỉ có 30 ngày), Date sẽ tự tràn thêm 1 tháng
  // nữa (bấm "tháng sau" từ 31/08 nhảy thẳng sang 01/10, bỏ qua cả tháng 9).
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

/** Bảng task chỉ cần gọi tên (từ cuối họ tên đầy đủ), vd "Phạm Thị Hồng Thu"
 *  → "Thu" — đỡ rối mắt hơn hiện cả họ tên, và nhất quán bất kể tên gốc viết
 *  hoa toàn bộ hay không. */
function givenNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return last.charAt(0).toLocaleUpperCase('vi') + last.slice(1).toLocaleLowerCase('vi');
}

function buildChartFromTasks(tasks: Task[]): DailyAssigneeCount[] {
  const counts = new Map<string, DailyAssigneeCount>();
  for (const task of tasks) {
    const key = `${task.taskDate}:${task.assigneeUserId ?? 'none'}`;
    const existing = counts.get(key) ?? {
      date: task.taskDate,
      assigneeUserId: task.assigneeUserId,
      fullName: task.assigneeFullName,
      count: 0,
      done: 0,
    };
    existing.count += 1;
    if (task.status === 'done') existing.done += 1;
    counts.set(key, existing);
  }
  return [...counts.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.assigneeUserId ?? 0) - (b.assigneeUserId ?? 0)
  );
}

export default function TaskBoard({ isBgd, today, overview: initialOverview, board: initialBoard }: TaskBoardProps) {
  // Thẻ chỉ là 1 cách trình bày khác của cùng dữ liệu task (bấm để đổi trạng
  // thái) — song song với bảng cũ, không thay thế, giữ nguyên mọi thao tác
  // nhân bản/sửa nhanh vốn chỉ có ở bảng.
  const [boardView, setBoardView] = useState<'table' | 'card'>('table');
  const [anchorDate, setAnchorDate] = useState(today);
  // Tháng đang XEM trên lịch mini (2 lưới: calendarMonthAnchor + tháng liền
  // trước) — tách khỏi anchorDate (ngày đang chọn để xem task) để bấm chọn 1
  // ngày ở lưới tháng dưới không làm cặp tháng đang hiện bị dịch theo; chỉ
  // nút ‹/› trên lịch mini mới dịch state này (cùng lúc với anchorDate, xem
  // TaskCalendar onShiftMonth bên dưới).
  const [calendarMonthAnchor, setCalendarMonthAnchor] = useState(today);
  // Chuyển đội giờ đi qua điều hướng URL thật (/dashboard/giao-task/[code],
  // xem OverviewPanel bên dưới) thay vì đổi state — mỗi đội/màn tổng quan là
  // 1 lượt mount TaskBoard mới (page.tsx truyền `key` khác nhau), nên giá trị
  // này chỉ cần đọc 1 lần lúc mount, không cần setter.
  const activeTeamId = initialBoard?.team.id ?? null;
  // Mặc định vào nhóm đầu tiên (Media/Support...), khớp với dữ liệu page.tsx
  // đã lọc sẵn phía server; 'all' là tab "Tất cả" xem gộp mọi nhóm.
  const [categoryId, setCategoryId] = useState<number | 'all' | undefined>(initialBoard?.categories[0]?.id);
  const [assigneeFilter, setAssigneeFilter] = useState<number | 'all'>('all');
  const [board, setBoard] = useState<BoardData | null>(initialBoard);
  const [overview, setOverview] = useState<OverviewData | null>(initialOverview);
  const [error, setError] = useState<string | null>(null);
  const [statusPendingTaskIds, setStatusPendingTaskIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [dayCategoryCounts, setDayCategoryCounts] = useState<MonthDayCategoryCount[]>(initialBoard?.dayCategoryCounts ?? []);

  const didMount = useRef(false);
  // Giữ trạng thái vừa bấm xuyên qua mọi lần đồng bộ nền. Đồng thời đánh số
  // request để một response cũ không thể ghi đè dữ liệu mới hơn.
  const optimisticStatusesRef = useRef<Map<number, TaskStatus>>(new Map());
  const optimisticTasksRef = useRef<Map<number, Task>>(new Map());
  const optimisticCreatedTasksRef = useRef<Map<number, Task>>(new Map());
  const refreshBoardRequestRef = useRef(0);
  const refreshOverviewRequestRef = useRef(0);
  const refreshRosterRequestRef = useRef(0);
  // Giao task 6 đội chỉ còn xem theo từng ngày — không có bảng chuyển
  // Ngày/Tuần/Tháng nữa (biểu đồ tháng ở cuối bảng đã thay thế chế độ Tháng cũ).
  const range = useMemo<DateRange>(() => ({ fromDate: anchorDate, toDate: anchorDate }), [anchorDate]);

  // Tab Media/Support lọc task theo nhóm của NGƯỜI PHỤ TRÁCH (member.categoryId
  // xếp ở sidebar), không theo category_id riêng của task — khớp với việc
  // "gom nhóm thành viên" quyết định task hiện ở tab nào.
  const categoryTasks = useMemo(() => {
    if (!board) return [];
    if (categoryId === 'all') return board.tasks;
    const memberCategoryById = new Map(board.team.members.map((m) => [m.userId, m.categoryId]));
    return board.tasks.filter((t) => t.assigneeUserId != null && memberCategoryById.get(t.assigneeUserId) === categoryId);
  }, [board, categoryId]);

  const visibleTasks = useMemo(
    () => (assigneeFilter === 'all' ? categoryTasks : categoryTasks.filter((task) => task.assigneeUserId === assigneeFilter)),
    [categoryTasks, assigneeFilter]
  );

  // Thêm task ngay trên tab nào thì chỉ gán được cho người đang ở đúng nhóm
  // đó — tránh tình huống vừa lưu xong task đã biến mất khỏi tab đang xem.
  // Tab "Tất cả" cho gán bất kỳ ai trong đội.
  const assignableMembers = useMemo(() => {
    if (!board) return [];
    if (categoryId === 'all') return board.team.members;
    return board.team.members.filter((m) => m.categoryId === categoryId);
  }, [board, categoryId]);

  const calendarYearMonth = calendarMonthAnchor.slice(0, 7);
  // Cột thứ 2 của lịch mini + biểu đồ cuối trang (xem TaskCalendar/
  // MonthlyDailyChart) — chart/dayCategoryCounts từ server đã phủ đủ cả 2
  // tháng này, nên các bản vá lạc quan bên dưới cũng phải cộng/trừ đúng
  // trong cả 2 tháng, không chỉ riêng calendarYearMonth.
  const previousMonthAnchor = useMemo(() => addDays(startOfMonth(calendarMonthAnchor), -1), [calendarMonthAnchor]);
  const previousMonthYearMonth = previousMonthAnchor.slice(0, 7);

  // board.tasks luôn là task của đúng 1 ngày đang chọn (range = anchorDate)
  // — gộp lại theo người phụ trách để làm thẻ "Task theo người" của riêng
  // ngày đó, tách khỏi bản tổng cả tháng nằm trên biểu đồ cuối trang.
  // board.range phản ánh đúng range của board.tasks HIỆN CÓ trong state — đổi
  // ngày/tháng cập nhật anchorDate ngay lập tức (đồng bộ) nhưng board.tasks
  // chỉ cập nhật sau khi refreshBoard() tải xong (bất đồng bộ). Không kiểm
  // tra range khớp thì trong lúc chờ, thẻ sẽ hiện nhãn ngày MỚI (từ
  // anchorDate) đi kèm dữ liệu người của ngày CŨ (từ board.tasks còn chưa kịp
  // đổi) — sai lệch gây hiểu nhầm ai đó có task hôm nay trong khi đó là task
  // của ngày trước đó.
  const dayChart = useMemo(
    () => (board && board.range.fromDate === anchorDate && board.range.toDate === anchorDate ? buildChartFromTasks(board.tasks) : []),
    [board, anchorDate]
  );
  const anchorMonthChart = useMemo(
    () => (board ? board.chart.filter((c) => c.date.startsWith(calendarYearMonth)) : []),
    [board, calendarYearMonth]
  );
  const previousMonthChart = useMemo(
    () => (board ? board.chart.filter((c) => c.date.startsWith(previousMonthYearMonth)) : []),
    [board, previousMonthYearMonth]
  );

  function reconcileBoardTasks(
    changes: Array<{
      previous: Task | null;
      next: Task | null;
      removeId?: number;
      previousWasCounted?: boolean;
    }>
  ) {
    const monthPrefix = calendarYearMonth;
    const inMonth = (task: Task) => task.taskDate.startsWith(monthPrefix);
    // Tiến độ tháng (monthProgress) vẫn chỉ tính riêng calendarYearMonth (thẻ
    // "Tiến độ tháng" không mở rộng theo cặp 2 tháng) — nhưng chart/
    // dayCategoryCounts thì có, nên cần kiểm cả 2 tháng khi vá lạc quan.
    const inTrackedMonths = (task: Task) => inMonth(task) || task.taskDate.startsWith(previousMonthYearMonth);
    const inRange = (task: Task) => task.taskDate >= range.fromDate && task.taskDate <= range.toDate;

    setBoard((current) => {
      if (!current) return current;
      const nextById = new Map(current.tasks.map((task) => [task.id, task]));
      let done = current.monthProgress.done;
      let total = current.monthProgress.total;
      const products = new Set(current.products);
      const chartCounts = new Map(current.chart.map((item) => [`${item.date}:${item.assigneeUserId ?? 'none'}`, { ...item }]));
      const adjustChart = (task: Task, delta: number) => {
        if (!inTrackedMonths(task)) return;
        const key = `${task.taskDate}:${task.assigneeUserId ?? 'none'}`;
        const existing = chartCounts.get(key) ?? {
          date: task.taskDate,
          assigneeUserId: task.assigneeUserId,
          fullName: task.assigneeFullName,
          count: 0,
          done: 0,
        };
        const count = existing.count + delta;
        const doneCount = existing.done + (task.status === 'done' ? delta : 0);
        if (count > 0) chartCounts.set(key, { ...existing, count, done: Math.max(0, doneCount) });
        else chartCounts.delete(key);
      };
      for (const change of changes) {
        const removeId = change.removeId ?? change.previous?.id;
        // Map giữ thứ tự theo lần chèn. Xoá rồi set lại cùng ID sẽ đẩy task
        // vừa được server xác nhận xuống cuối nhóm, sau đó polling lại kéo nó
        // về thứ tự từ DB. Thay value trực tiếp để hàng đứng yên; chỉ xoá khi
        // task rời range hoặc khi đổi từ ID tạm sang ID thật.
        const replacingTaskInPlace =
          removeId !== undefined &&
          change.next !== null &&
          change.next.id === removeId &&
          inRange(change.next) &&
          nextById.has(removeId);
        if (!replacingTaskInPlace && removeId !== undefined) nextById.delete(removeId);
        if (change.next && inRange(change.next)) nextById.set(change.next.id, change.next);
        if (change.previous && change.previousWasCounted !== false && inMonth(change.previous)) {
          total -= 1;
          if (change.previous.status === 'done') done -= 1;
        }
        if (change.next && inMonth(change.next)) {
          total += 1;
          if (change.next.status === 'done') done += 1;
        }
        if (change.previous && change.previousWasCounted !== false) adjustChart(change.previous, -1);
        if (change.next) adjustChart(change.next, 1);
        if (change.next?.product) products.add(change.next.product);
      }
      const tasks = [...nextById.values()];
      return {
        ...current,
        tasks,
        monthProgress: { done: Math.max(0, done), total: Math.max(0, total) },
        chart: [...chartCounts.values()],
        products: [...products].sort((a, b) => a.localeCompare(b, 'vi')),
      };
    });

    setDayCategoryCounts((current) => {
      const members = board?.team.members ?? [];
      const categoryByUserId = new Map(members.map((member) => [member.userId, member.categoryId]));
      const counts = new Map(current.map((item) => [`${item.date}:${item.categoryId ?? 'none'}`, { ...item }]));
      const adjust = (task: Task, delta: number) => {
        if (!inTrackedMonths(task) || task.assigneeUserId == null || !categoryByUserId.has(task.assigneeUserId)) return;
        const categoryId = categoryByUserId.get(task.assigneeUserId) ?? null;
        const key = `${task.taskDate}:${categoryId ?? 'none'}`;
        const existing = counts.get(key) ?? { date: task.taskDate, categoryId, count: 0 };
        const count = existing.count + delta;
        if (count > 0) counts.set(key, { ...existing, count });
        else counts.delete(key);
      };
      for (const change of changes) {
        if (change.previous && change.previousWasCounted !== false) adjust(change.previous, -1);
        if (change.next) adjust(change.next, 1);
      }
      return [...counts.values()];
    });
  }

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
      const result = isBgd
        ? await getTeamBoardTasksAsBgdAction(activeTeamId, range, calendarYearMonth)
        : await getMyTeamBoardTasksAction(range, calendarYearMonth);
      if (requestId !== refreshBoardRequestRef.current) return;
      if ('needsBgdOverview' in result) return;
      clearServerActionRecoveryMarker();
      const tasks = result.tasks.map((task) => {
        const optimisticTask = optimisticTasksRef.current.get(task.id);
        const optimisticStatus = optimisticStatusesRef.current.get(task.id);
        const mergedTask = optimisticTask ?? task;
        return optimisticStatus == null ? mergedTask : { ...mergedTask, status: optimisticStatus };
      });
      // Không spread `result` đè cả object — team/categories/isManager không
      // nằm trong response nhẹ này nữa (xem refreshRoster), chỉ cập nhật đúng
      // phần đổi theo range/category.
      setBoard((current) =>
        current
          ? {
              ...current,
              tasks: [...tasks, ...optimisticCreatedTasksRef.current.values()],
              monthProgress: result.monthProgress,
              chart: result.chart,
              products: result.products,
              range,
            }
          : current
      );
      setDayCategoryCounts(result.dayCategoryCounts);
      setError(null);
    } catch (err) {
      if (requestId !== refreshBoardRequestRef.current) return;
      if (opts?.silent) {
        if (!recoverFromStaleServerActionResponse(err)) {
          console.warn('refreshBoard (nền) lỗi:', err);
        }
        return;
      }
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu.');
    }
  }

  // Roster/category gần như không đổi theo poll — chỉ đồng bộ lại sau thao
  // tác thêm/xoá thành viên, đổi vai trò/nhóm hoặc CRUD category (runAction
  // mặc định gọi hàm này), không nằm trong chu kỳ poll 150s.
  async function refreshRoster() {
    if (!board) return;
    const requestId = ++refreshRosterRequestRef.current;
    try {
      const result = await getTeamRosterAction(board.team.id);
      if (requestId !== refreshRosterRequestRef.current) return;
      setBoard((current) => (current ? { ...current, ...result } : current));
      setError(null);
    } catch (err) {
      if (requestId !== refreshRosterRequestRef.current) return;
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu.');
    }
  }

  async function refreshOverview(opts?: { silent?: boolean }) {
    if (!isBgd || activeTeamId !== null) return;
    const requestId = ++refreshOverviewRequestRef.current;
    try {
      const data = await getAllTeamsOverviewAction(anchorDate.slice(0, 7), today);
      if (requestId !== refreshOverviewRequestRef.current) return;
      clearServerActionRecoveryMarker();
      setOverview(data);
      setError(null);
    } catch (err) {
      if (requestId !== refreshOverviewRequestRef.current) return;
      if (opts?.silent) {
        if (!recoverFromStaleServerActionResponse(err)) {
          console.warn('refreshOverview (nền) lỗi:', err);
        }
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
      // Trang tổng quan (không có team) không có board để tải — nhưng đổi
      // tháng ở đây vẫn cần tải lại overview theo tháng mới.
      if (activeTeamId == null) void refreshOverview();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate, calendarMonthAnchor, activeTeamId]);

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
    let refreshInFlight = false;
    let lastSyncAt = 0;
    const syncWhenVisible = () => {
      const now = Date.now();
      if (document.visibilityState !== 'visible' || refreshInFlight || now - lastSyncAt < 1_000) return;
      lastSyncAt = now;
      refreshInFlight = true;
      const request = activeTeamId == null
        ? refreshOverview({ silent: true })
        : refreshBoard({ silent: true });
      void request.finally(() => {
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
  }, [activeTeamId, range.fromDate, range.toDate]);

  // Mọi call site còn dùng refreshAfter mặc định (true) đều là thao tác
  // roster/category (thêm/xoá thành viên, đổi vai trò/nhóm, CRUD category) —
  // mutation task đã tự reconcile từ response nên luôn truyền refreshAfter=false.
  function runAction<T>(fn: () => Promise<T>, after?: (result: T) => void, refreshAfter = true) {
    startTransition(() => {
      fn()
        .then((result) => {
          after?.(result);
          // Đồng bộ lại roster/category sau khi thao tác đã thành công — nếu
          // bước đồng bộ này thoáng lỗi thì không có nghĩa thao tác của người
          // dùng thất bại, nên không đẩy banner đỏ gây hiểu lầm.
          if (refreshAfter) void refreshRoster();
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
        .then((savedTask) => {
          reconcileBoardTasks([{ previous: task, next: savedTask }]);
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
                  tasks: current.tasks.map((item) => (item.id === task.id && item.status === status ? { ...item, status: previousStatus } : item)),
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

  /** Kéo-thả đổi thứ tự task trong bảng (xem TaskTable) — chỉ đổi `sortOrder`,
   *  không đụng tới đếm/biểu đồ nên không cần đi qua reconcileBoardTasks như
   *  các thao tác đổi trạng thái/tạo/sửa task. `orderedTaskIds` đã là ID theo
   *  đúng thứ tự hiển thị mới của 1 nhóm (cùng người phụ trách). */
  function reorderTasksOptimistically(orderedTaskIds: number[]) {
    if (!board) return;
    const teamId = board.team.id;
    const orderMap = new Map(orderedTaskIds.map((id, index) => [id, index]));
    const previousOrders = new Map(board.tasks.filter((task) => orderMap.has(task.id)).map((task) => [task.id, task.sortOrder]));

    setError(null);
    setBoard((current) =>
      current
        ? { ...current, tasks: current.tasks.map((task) => (orderMap.has(task.id) ? { ...task, sortOrder: orderMap.get(task.id)! } : task)) }
        : current
    );

    startTransition(() => {
      reorderTasksAction(teamId, orderedTaskIds).catch((err) => {
        setBoard((current) =>
          current
            ? { ...current, tasks: current.tasks.map((task) => (previousOrders.has(task.id) ? { ...task, sortOrder: previousOrders.get(task.id)! } : task)) }
            : current
        );
        setError(err instanceof Error ? err.message : 'Không thể lưu thứ tự task.');
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
      channelName: input.channelName ?? null,
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
      sortOrder: 0,
      duplicatedFromTaskId: null,
      createdBy: null,
      createdByFullName: null,
      createdByAvatarUrl: null,
      commentCount: 0,
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
          reconcileBoardTasks([
            { previous: null, next: savedTask, removeId: tempId, previousWasCounted: false },
          ]);
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
          reconcileBoardTasks([{ previous: previousTask, next: savedTask }]);
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

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          {isBgd && board ? (
            <Link
              href="/dashboard/giao-task"
              className="flex items-center gap-1 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue hover:text-blue-cta"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Tổng quan 6 đội
            </Link>
          ) : (
            <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue">Giao Task</p>
          )}
          <h1
            className={
              board
                ? 'mt-3 mb-2 font-heading text-3xl font-light uppercase tracking-wide text-navy sm:text-4xl'
                : 'mt-4 font-heading text-5xl font-light uppercase tracking-wide text-navy'
            }
          >
            {board ? board.team.name : 'Tổng quan 6 đội'}
          </h1>
        </div>
        {!board && overview && (
          <div className="flex items-center gap-1 rounded-[10px] border border-[var(--theme-border)] p-1">
            <button
              type="button"
              onClick={() => setAnchorDate(shiftMonth(anchorDate, -1))}
              className="rounded-[8px] p-1.5 text-navy hover:bg-surface-2"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[92px] px-1 text-center text-sm font-semibold text-navy">
              Tháng {anchorDate.slice(5, 7)}/{anchorDate.slice(0, 4)}
            </span>
            <button
              type="button"
              onClick={() => setAnchorDate(shiftMonth(anchorDate, 1))}
              className="rounded-[8px] p-1.5 text-navy hover:bg-surface-2"
              aria-label="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {anchorDate.slice(0, 7) !== today.slice(0, 7) && (
              <button
                type="button"
                onClick={() => setAnchorDate(today)}
                className="ml-1 shrink-0 rounded-[8px] px-2 py-1 text-xs font-semibold text-blue hover:bg-surface-2"
              >
                Về tháng này
              </button>
            )}
          </div>
        )}
      </div>

      {error && <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {!board && overview && (
        <>
          <OverviewPanel
            overview={overview}
            monthLabel={anchorDate.slice(0, 7)}
          />
          <DepartmentOverview groups={overview.departments} />
        </>
      )}

      {board && (
        <>
          <div className="mb-5">
            <AssigneeSummaryCard
              chart={dayChart}
              members={board.team.members}
              periodLabel={anchorDate === today ? `Hôm nay ${formatVi(anchorDate)}` : formatVi(anchorDate)}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-[10px] border border-[var(--theme-border)] p-1">
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
                className={`rounded-[8px] px-3 py-1.5 text-sm font-normal uppercase transition-colors ${categoryId === 'all' ? 'bg-[#EAB308] text-[#111827]' : 'text-ink hover:bg-surface'}`}
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
                    className={`rounded-[8px] px-3 py-1.5 text-sm font-normal uppercase transition-colors ${isSelected ? 'bg-[#EAB308] text-[#111827]' : 'text-ink hover:bg-surface'}`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            <label className="flex h-[42px] min-w-[180px] max-w-full items-center gap-2 rounded-[10px] border border-[var(--theme-border)] bg-white px-3 text-ink">
              <UserRound className="h-4 w-4 shrink-0 text-blue" aria-hidden="true" />
              <span className="sr-only">Lọc theo thành viên</span>
              <select
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))}
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-medium outline-none"
              >
                <option value="all">Lọc thành viên</option>
                {board.team.members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName.toLocaleUpperCase('vi')}
                  </option>
                ))}
              </select>
            </label>
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
                  visibleColumns={
                    // Tab "Tất cả" gộp đúng các cột mà nhóm task (Media/Support/...) của
                    // riêng đội này đang dùng, thay vì liệt kê hết mọi cột từng có trong
                    // hệ thống (fallback cũ khi categoryId không khớp nhóm nào).
                    categoryId === 'all'
                      ? (board.categories.length > 0
                          ? Array.from(new Set(board.categories.flatMap((c) => c.visibleColumns)))
                          : [...TASK_COLUMN_KEYS])
                      : (board.categories.find((c) => c.id === categoryId)?.visibleColumns ?? [...TASK_COLUMN_KEYS])
                  }
                  teamCode={board.team.code}
                  allMembers={board.team.members}
                  products={board.products}
                  onUpdate={updateTaskOptimistically}
                  onReorder={reorderTasksOptimistically}
                  onBulkDelete={(taskIds) => {
                    const removedTasks = board.tasks.filter((task) => taskIds.includes(task.id));
                    runAction(
                      () => Promise.all(taskIds.map((taskId) => deleteTaskAction(board.team.id, taskId))),
                      () => reconcileBoardTasks(removedTasks.map((task) => ({ previous: task, next: null }))),
                      false
                    );
                  }}
                  allowBulkPattern={board.isManager}
                  onBulkDuplicateDates={async (taskIds, dates, assigneeUserIds) => {
                    const result = await duplicateTasksToDatesAction(board.team.id, taskIds, dates, assigneeUserIds);
                    if ('error' in result) throw new Error(result.error);
                    reconcileBoardTasks(result.tasks.map((task) => ({ previous: null, next: task })));
                  }}
                  onBulkDuplicatePattern={async (taskIds, pattern, assigneeUserIds) => {
                    const result = await bulkDuplicateTasksAction(board.team.id, taskIds, pattern, assigneeUserIds);
                    if ('error' in result) throw new Error(result.error);
                    reconcileBoardTasks(result.tasks.map((task) => ({ previous: null, next: task })));
                  }}
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
                  onDelete={(task) =>
                    runAction(
                      () => deleteTaskAction(board.team.id, task.id),
                      () => reconcileBoardTasks([{ previous: task, next: null }]),
                      false
                    )
                  }
                />
              )}
            </div>

            <div className="flex flex-col gap-4">
              <TaskCalendar
                viewAnchor={calendarMonthAnchor}
                selectedDate={anchorDate}
                today={today}
                categories={board.categories}
                dayCategoryCounts={dayCategoryCounts}
                onSelectDay={(date) => setAnchorDate(date)}
                onShiftMonth={(direction) => {
                  setAnchorDate(shiftMonth(anchorDate, direction));
                  setCalendarMonthAnchor(shiftMonth(calendarMonthAnchor, direction));
                }}
              />
              <MonthProgressCard done={board.monthProgress.done} total={board.monthProgress.total} monthLabel={calendarYearMonth} />
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

          <div className="mt-10 flex flex-col gap-5 border-t-2 border-[#dbe4f2] pt-10">
            <h2 className="font-heading text-3xl font-light uppercase tracking-wide text-navy sm:text-4xl">Biểu đồ tổng</h2>
            <MonthlyDailyChart chart={anchorMonthChart} members={board.team.members} monthAnchor={calendarMonthAnchor} />
            <MonthlyDailyChart chart={previousMonthChart} members={board.team.members} monthAnchor={previousMonthAnchor} />
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
  const toneClass = tone === 'blue' ? 'bg-blue/10 text-blue' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-2 text-navy';
  return <span className={`inline-flex min-w-[36px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${toneClass}`}>{count}</span>;
}

const OVERVIEW_STATUS_COLUMNS: {
  key: 'notStarted' | 'done' | 'overdue';
  label: string;
  dot: string;
  tone: 'neutral' | 'blue' | 'emerald' | 'red';
}[] = [
  {
    key: 'notStarted',
    label: 'Chưa làm',
    dot: 'bg-[#B7C2D6]',
    tone: 'neutral',
  },
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
  const cards: {
    label: string;
    value: number;
    caption: string;
    icon: typeof ListChecks;
    toneBg: string;
    toneText: string;
  }[] = [
    {
      label: 'Tổng công việc',
      value: totals.total,
      caption: `Tháng ${monthLabel.split('-')[1]}`,
      icon: ListChecks,
      toneBg: 'bg-surface-2',
      toneText: 'text-navy',
    },
    {
      label: 'Đang làm',
      value: totals.inProgress,
      caption: `${pct(totals.inProgress)}% công việc`,
      icon: CircleDot,
      toneBg: 'bg-blue/10',
      toneText: 'text-blue',
    },
    {
      label: 'Hoàn thành',
      value: totals.done,
      caption: `${pct(totals.done)}% công việc`,
      icon: CheckCircle2,
      toneBg: 'bg-emerald-50',
      toneText: 'text-emerald-600',
    },
    {
      label: 'Quá hạn',
      value: totals.overdue,
      caption: `${pct(totals.overdue)}% công việc`,
      icon: TriangleAlert,
      toneBg: 'bg-red-50',
      toneText: 'text-red-600',
    },
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
  const segments: {
    key: 'notStarted' | 'done' | 'overdue';
    label: string;
    bar: string;
    dot: string;
  }[] = [
    {
      key: 'notStarted',
      label: 'Chưa làm',
      bar: 'bg-[#B7C2D6]',
      dot: 'bg-[#B7C2D6]',
    },
    {
      key: 'done',
      label: 'Hoàn thành',
      bar: 'bg-emerald-500',
      dot: 'bg-emerald-500',
    },
    { key: 'overdue', label: 'Quá hạn', bar: 'bg-red-500', dot: 'bg-red-500' },
  ];

  return (
    <div className="flex h-full min-w-[280px] flex-col rounded-[16px] border border-[#e8edf5] bg-white px-4 pb-4">
      <div className="flex h-[33px] items-center">
        <p className="font-heading text-sm font-bold text-navy">Khối lượng công việc theo đội</p>
      </div>
      <div className="flex flex-col">
        {teams.map((team) => {
          const progress = progressByTeam.get(team.id);
          const total = progress?.total ?? 0;
          return (
            <div key={team.id} className="flex h-[57px] items-center gap-3">
              <span className="w-9 shrink-0 text-xs font-semibold uppercase text-muted">{team.code}</span>
              <div className="flex h-3 flex-1 items-center gap-0.5">
                {segments.map((seg) => {
                  const count = progress ? progress[seg.key] : 0;
                  if (count <= 0) return null;
                  const widthPct = (count / maxTotal) * 100;
                  return <span key={seg.key} title={`${seg.label}: ${count}`} className={`h-full rounded-full ${seg.bar}`} style={{ width: `${widthPct}%` }} />;
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

function OverviewPanel({ overview, monthLabel }: { overview: OverviewData; monthLabel: string }) {
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
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,auto)_minmax(420px,1fr)]">
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
                    <tr key={team.id} className="divide-x divide-[#edf1f7] hover:bg-surface-2">
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
                        <Link href={`/dashboard/giao-task/${team.code}`} className="whitespace-nowrap text-sm font-semibold text-blue">
                          Xem chi tiết
                        </Link>
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

/** Thanh cuộn ngang riêng, luôn hiện (không phải thanh cuộn OS mặc định chỉ
 *  hiện khi hover/đang cuộn trên macOS) — báo rõ bảng còn cột bên phải mà
 *  không cần người dùng vô tình rê chuột mới thấy. Vẫn kéo được như thanh
 *  cuộn thật (pointer capture), ẩn hẳn nếu nội dung không tràn. */
function HorizontalScrollBar({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ widthPct: number; leftPct: number } | null>(null);
  const dragRef = useRef<{ startClientX: number; startScrollLeft: number; trackWidth: number; thumbWidthPx: number } | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    function update() {
      const { scrollWidth, clientWidth, scrollLeft } = el as HTMLDivElement;
      if (scrollWidth <= clientWidth + 1) {
        setThumb(null);
        return;
      }
      const widthPct = Math.max((clientWidth / scrollWidth) * 100, 6);
      const maxScrollLeft = scrollWidth - clientWidth;
      const leftPct = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * (100 - widthPct) : 0;
      setThumb({ widthPct, leftPct });
    }

    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [targetRef]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = targetRef.current;
    const track = trackRef.current;
    if (!el || !track || !thumb) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startClientX: e.clientX,
      startScrollLeft: el.scrollLeft,
      trackWidth: track.clientWidth,
      thumbWidthPx: (thumb.widthPct / 100) * track.clientWidth,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = targetRef.current;
    const drag = dragRef.current;
    if (!el || !drag) return;
    const trackRange = drag.trackWidth - drag.thumbWidthPx;
    if (trackRange <= 0) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const deltaX = e.clientX - drag.startClientX;
    el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, drag.startScrollLeft + (deltaX / trackRange) * maxScrollLeft));
  }

  if (!thumb) return null;

  return (
    <div ref={trackRef} className="mx-3 mb-3 mt-2 h-1.5 rounded-full bg-surface-2">
      <div
        role="scrollbar"
        aria-orientation="horizontal"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => (dragRef.current = null)}
        className="h-full cursor-grab touch-none rounded-full bg-blue active:cursor-grabbing"
        style={{ width: `${thumb.widthPct}%`, marginLeft: `${thumb.leftPct}%` }}
      />
    </div>
  );
}

/** Nắm kéo 6 chấm kiểu Notion — tự vẽ SVG thay vì thêm icon thư viện mới. */
function DragHandleIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="2" r="1.4" />
      <circle cx="7.5" cy="2" r="1.4" />
      <circle cx="2.5" cy="8" r="1.4" />
      <circle cx="7.5" cy="8" r="1.4" />
      <circle cx="2.5" cy="14" r="1.4" />
      <circle cx="7.5" cy="14" r="1.4" />
    </svg>
  );
}

function TaskTable({
  tasks,
  visibleColumns,
  teamCode,
  allMembers,
  products,
  onUpdate,
  onReorder,
  onBulkDelete,
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
  onReorder: (orderedTaskIds: number[]) => void;
  onBulkDelete: (taskIds: number[]) => void;
  allowBulkPattern: boolean;
  onBulkDuplicateDates: (taskIds: number[], dates: string[], assigneeUserIds: number[]) => Promise<void>;
  onBulkDuplicatePattern: (taskIds: number[], pattern: BulkDuplicatePattern, assigneeUserIds: number[]) => Promise<void>;
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
  // Khớp thứ tự cột bảng Notion gốc: Tên Acc rồi Kênh (channelName — kênh
  // đăng thật, khác "channel"/Up kênh vốn lưu tên người) đứng trước Chủ đề,
  // các cột còn lại (Up kênh/SL VID/Sản phẩm...) đứng sau Chủ đề.
  const leadingColumns = columns.filter((key) => key === 'accountName' || key === 'channelName');
  const trailingColumns = columns.filter((key) => key !== 'accountName' && key !== 'channelName');
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [bulkDuplicating, setBulkDuplicating] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { fire: fireConfetti, node: confettiNode } = useCheckboxConfetti();

  // Cùng bảng màu/thứ tự tên với thẻ tổng hợp "Task theo người" phía trên —
  // gom nhóm task theo người phụ trách để dễ quét theo từng người, mỗi người
  // 1 màu nhất quán ở mọi nơi trên trang.
  const colorMap = useMemo(() => assigneeColorMap(allMembers), [allMembers]);
  const nameOrder = useMemo(() => Array.from(colorMap.keys()), [colorMap]);
  // Dùng chung cho cả sắp thứ tự hiển thị lẫn giới hạn phạm vi kéo-thả (chỉ
  // cho kéo trong đúng 1 nhóm người phụ trách — xem handleRowDrop bên dưới).
  const orderOf = (name: string | null) => {
    if (!name) return nameOrder.length;
    const idx = nameOrder.indexOf(name);
    return idx === -1 ? nameOrder.length : idx;
  };
  const sortedTasks = useMemo(() => {
    // So le theo `sortOrder` rồi `id` khi cùng người phụ trách — chặn đứng
    // việc dòng vừa lưu nhảy vị trí: `tasks` đến từ 1 Map trong
    // reconcileBoardTasks, thứ tự lặp của Map đổi theo lần chèn/xoá key gần
    // nhất, nên nếu chỉ so `orderOf` (2 dòng cùng người ra 0 - 0, coi như bằng
    // nhau) thì Array.sort dù stable vẫn giữ nguyên thứ tự "tình cờ" đó của
    // mảng đầu vào, dòng vừa sửa xong dễ bị đẩy lên đầu/xuống cuối nhóm.
    // `sortOrder` (đổi khi kéo-thả) đứng trước, `id` chỉ là tie-break cuối
    // cùng cho các task chưa từng bị kéo (sortOrder mặc định bằng nhau = 0).
    return [...tasks].sort(
      (a, b) => orderOf(a.assigneeFullName) - orderOf(b.assigneeFullName) || a.sortOrder - b.sortOrder || a.id - b.id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, nameOrder]);

  // Kéo-thả đổi thứ tự (Giống Notion): nắm ⠿ chỉ hiện khi hover hàng, kéo
  // được giới hạn trong đúng 1 nhóm người phụ trách (khối màu liền nhau) để
  // không phá vỡ cách nhóm đang có. Chỉ vẽ 1 gạch chỉ-thị inset (không đổi
  // chiều cao dòng) tại hàng đang hover tới — không hàng nào thật sự đổi vị
  // trí cho tới khi thả tay, nên không có cảnh dòng "nhảy" qua lại lúc kéo.
  // `dragPoint` + thẻ nổi bám con trỏ (render ở cuối component) và
  // `justMovedTaskId` (chớp nhẹ hàng vừa thả) giúp thao tác rõ ràng, mượt hơn
  // ảnh bóng mờ mặc định của trình duyệt.
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ taskId: number; edge: 'top' | 'bottom' } | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(null);
  const [justMovedTaskId, setJustMovedTaskId] = useState<number | null>(null);
  const justMovedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (justMovedTimeoutRef.current != null) window.clearTimeout(justMovedTimeoutRef.current);
    };
  }, []);

  function handleHandleDragStart(e: React.DragEvent<HTMLButtonElement>, task: Task) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(task.id));
    // Ẩn ảnh bóng mờ mặc định của trình duyệt — thẻ nổi tự vẽ bên dưới (bám
    // theo con trỏ) đảm nhiệm phần phản hồi khi kéo, mượt hơn nhiều.
    const dragImg = new window.Image();
    dragImg.src = TRANSPARENT_DRAG_IMAGE;
    e.dataTransfer.setDragImage(dragImg, 0, 0);
    setDraggingTaskId(task.id);
    setDragPoint({ x: e.clientX, y: e.clientY });
  }

  function handleHandleDrag(e: React.DragEvent<HTMLButtonElement>) {
    // Sự kiện `drag` cuối cùng (lúc thả) trình duyệt trả toạ độ (0,0) — bỏ
    // qua để thẻ nổi không giật về góc màn hình ngay trước khi biến mất.
    if (e.clientX === 0 && e.clientY === 0) return;
    setDragPoint({ x: e.clientX, y: e.clientY });
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setDropTarget(null);
    setDragPoint(null);
  }

  function handleRowDragOver(e: React.DragEvent<HTMLTableRowElement>, task: Task) {
    if (draggingTaskId == null || draggingTaskId === task.id) return;
    const draggingTask = sortedTasks.find((t) => t.id === draggingTaskId);
    if (!draggingTask || orderOf(draggingTask.assigneeFullName) !== orderOf(task.assigneeFullName)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const edge: 'top' | 'bottom' = e.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom';
    setDropTarget((current) => (current?.taskId === task.id && current.edge === edge ? current : { taskId: task.id, edge }));
  }

  function handleRowDrop(e: React.DragEvent<HTMLTableRowElement>, task: Task) {
    e.preventDefault();
    const dragged = sortedTasks.find((t) => t.id === draggingTaskId);
    const target = dropTarget;
    setDraggingTaskId(null);
    setDropTarget(null);
    setDragPoint(null);
    if (!dragged || !target || target.taskId !== task.id) return;
    const groupKey = orderOf(dragged.assigneeFullName);
    if (orderOf(task.assigneeFullName) !== groupKey) return;
    const groupIds = sortedTasks.filter((t) => orderOf(t.assigneeFullName) === groupKey).map((t) => t.id);
    const withoutDragged = groupIds.filter((id) => id !== dragged.id);
    const targetIndex = withoutDragged.indexOf(task.id);
    const insertIndex = target.edge === 'top' ? targetIndex : targetIndex + 1;
    const nextOrder = [...withoutDragged];
    nextOrder.splice(insertIndex, 0, dragged.id);
    if (nextOrder.every((id, i) => id === groupIds[i])) return;
    onReorder(nextOrder);
    // Chớp nhẹ hàng vừa thả ~900ms để người dùng thấy rõ đúng task nào vừa
    // đổi chỗ, đặc biệt hữu ích khi thả xong hàng nhảy khá xa vị trí cũ.
    if (justMovedTimeoutRef.current != null) window.clearTimeout(justMovedTimeoutRef.current);
    setJustMovedTaskId(dragged.id);
    justMovedTimeoutRef.current = window.setTimeout(() => setJustMovedTaskId(null), 900);
  }

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
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(true)}
              className="rounded-[8px] bg-red-500 px-3 py-1.5 font-semibold text-white hover:bg-red-600"
            >
              Xoá đã chọn
            </button>
          </div>
        </div>
      )}
      {confirmBulkDelete && (
        <ConfirmDeleteDialog
          message={`Bạn có muốn xoá ${selectedTaskIds.size} task đã chọn không?`}
          onCancel={() => setConfirmBulkDelete(false)}
          onConfirm={() => {
            onBulkDelete([...selectedTaskIds]);
            setSelectedTaskIds(new Set());
            setConfirmBulkDelete(false);
          }}
        />
      )}
      <div ref={scrollRef} className="scrollbar-hide overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col style={{ width: 64 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 130 }} />
            {leadingColumns.map((key) => (
              <col key={key} style={{ width: COLUMN_WIDTH_PX[key] }} />
            ))}
            {/* Chủ đề không khai width cố định để nhận phần còn lại của bảng — nhưng
                table-fixed co cột không-khai-width về gần 0 khi tổng các cột còn lại
                (đặc biệt tab "Tất cả" gộp nhiều cột tuỳ chọn) đã vượt quá bề rộng
                bảng, khiến chữ đè lên cột kế bên. minWidth giữ 1 sàn hợp lý, phần dư
                (nếu có) bảng vẫn tự cuộn ngang như các cột khác. */}
            <col style={{ minWidth: 220 }} />
            {trailingColumns.map((key) => (
              <col key={key} style={{ width: COLUMN_WIDTH_PX[key] }} />
            ))}
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
          </colgroup>
          <thead className="border-b-2 border-cyan/30 bg-gradient-to-r from-gold/10 via-white to-cyan/10 text-xs font-bold uppercase tracking-wider text-ink">
            <tr className="divide-x divide-[#e8edf5]">
              <th className="py-3 pl-6 pr-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả task để nhân bản hàng loạt"
                  className="h-4 w-4 cursor-pointer accent-blue"
                />
              </th>
              <th className="truncate px-3 py-3">Ngày</th>
              <th className="truncate px-3 py-3">Thành viên</th>
              {leadingColumns.map((key) => (
                <th key={key} className="truncate px-3 py-3">
                  {columnLabel(key, teamCode)}
                </th>
              ))}
              <th className="truncate px-3 py-3">Chủ đề</th>
              {trailingColumns.map((key) => (
                <th key={key} className="truncate px-3 py-3">
                  {columnLabel(key, teamCode)}
                </th>
              ))}
              <th className="truncate px-3 py-3">Trạng thái</th>
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
                  onSubmit={(input) => onUpdate(task.id, input)}
                />
              ) : (
                <motion.tr
                  key={task.id}
                  layout
                  transition={DRAG_SPRING_TRANSITION}
                  onDragOver={(e) => handleRowDragOver(e, task)}
                  onDrop={(e) => handleRowDrop(e, task)}
                  className={`group/row task-row-tint divide-x divide-[#edf1f7] transition-[filter,box-shadow] duration-300 hover:brightness-95 ${
                    draggingTaskId === task.id ? 'opacity-40' : ''
                  } ${dropTarget?.taskId === task.id && dropTarget.edge === 'top' ? 'shadow-[inset_0_2px_0_0_var(--blue)]' : ''} ${
                    dropTarget?.taskId === task.id && dropTarget.edge === 'bottom' ? 'shadow-[inset_0_-2px_0_0_var(--blue)]' : ''
                  } ${justMovedTaskId === task.id ? 'shadow-[inset_0_0_0_2px_var(--blue)]' : ''}`}
                  style={{ '--tint-color': rowColor } as React.CSSProperties}
                >
                  <td className="relative py-2.5 pl-6 pr-3" style={{ borderLeft: `3px solid ${rowColor}` }}>
                    {/* Nắm kéo nổi trong chính ô này (không chiếm riêng 1 cột) — icon canh
                        SÁT TRÁI trong nút (justify-start), đứng NGAY SAU vạch màu (left-0,
                        không lệch âm) chứ không đè lên vạch: đè lên vạch làm 3 chấm cột trái
                        chìm vào màu vạch, khó thấy. Cột checkbox nới rộng (64px, colgroup) +
                        pl-6 đẩy checkbox vào trong, chừa khoảng trống rõ ràng cho icon. */}
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => handleHandleDragStart(e, task)}
                      onDrag={handleHandleDrag}
                      onDragEnd={handleDragEnd}
                      aria-label="Kéo để đổi vị trí task"
                      title="Kéo để đổi vị trí"
                      className="task-drag-handle pointer-events-none absolute left-0 top-1/2 z-10 flex h-6 w-4 -translate-y-1/2 cursor-grab items-center justify-start rounded text-muted opacity-0 transition-opacity duration-150 group-hover/row:pointer-events-auto group-hover/row:opacity-100 hover:bg-surface-2 hover:text-navy active:cursor-grabbing"
                    >
                      <DragHandleIcon />
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => toggleSelect(task.id)}
                      aria-label="Chọn task để nhân bản hàng loạt"
                      className="h-4 w-4 cursor-pointer accent-blue"
                    />
                  </td>
                  <td onClick={() => setEditingTaskId(task.id)} className="cursor-pointer whitespace-nowrap px-3 py-2.5 font-variant-numeric-tabular text-ink">
                    {formatVi(task.taskDate).slice(0, 5)}
                  </td>
                  <td onClick={() => setEditingTaskId(task.id)} className="cursor-pointer px-3 py-2.5 text-ink">
                    {task.assigneeFullName ? (
                      <div className="flex items-center gap-1.5">
                        {task.assigneeAvatarUrl ? (
                          <Image src={task.assigneeAvatarUrl} alt={task.assigneeFullName} width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover" />
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
                      <td key={key} onClick={() => setEditingTaskId(task.id)} className="cursor-pointer px-3 py-2.5">
                        {value ? <span className="text-sm font-medium text-ink">{value}</span> : <span className="text-muted">—</span>}
                      </td>
                    );
                  })}
                  <td onClick={() => setEditingTaskId(task.id)} className="cursor-pointer px-3 py-2.5 font-medium text-navy">
                    {task.title}
                  </td>
                  {trailingColumns.map((key) => {
                    const rawValue = String((task as unknown as Record<string, unknown>)[key] ?? '');
                    return (
                      <td
                        key={key}
                        onClick={() => setEditingTaskId(task.id)}
                        className={`cursor-pointer px-3 py-2.5 text-ink ${key === 'note' || key === 'referenceLink' ? 'break-words' : ''}`}
                      >
                        {key === 'videoCount' ? (
                          (task.videoCount ?? '')
                        ) : key === 'product' && task.product ? (
                          <span
                            className="inline-block truncate rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                            style={{
                              background: productColorMap.get(task.product) ?? UNASSIGNED_COLOR,
                            }}
                          >
                            {task.product}
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
                      className={`group grid h-11 w-11 place-items-center rounded-[8px] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 ${statusPendingTaskIds.has(task.id) ? 'cursor-wait opacity-80' : 'cursor-pointer active:scale-[0.96]'}`}
                    >
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-[5px] border transition-[background-color,border-color,transform] duration-150 ${task.status === 'done' ? 'border-[#20C978] bg-[#20C978] text-white shadow-[0_5px_12px_-7px_rgba(32,201,120,0.9)]' : 'border-navy/30 bg-white text-transparent group-hover:scale-105 group-hover:border-[#20C978]'}`}
                      >
                        <Check size={16} strokeWidth={3} aria-hidden="true" />
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2.5" />
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <HorizontalScrollBar targetRef={scrollRef} />
      {bulkDuplicating && (
        <BulkSelectedDuplicateModal
          count={selectedTaskIds.size}
          initialMonth={defaultDate}
          allMembers={allMembers}
          allowBulkPattern={allowBulkPattern}
          onClose={() => setBulkDuplicating(false)}
          onSubmitDates={(dates, assigneeUserIds) =>
            onBulkDuplicateDates([...selectedTaskIds], dates, assigneeUserIds).then(() => {
              setBulkDuplicating(false);
              setSelectedTaskIds(new Set());
            })
          }
          onSubmitPattern={(pattern, assigneeUserIds) =>
            onBulkDuplicatePattern([...selectedTaskIds], pattern, assigneeUserIds).then(() => {
              setBulkDuplicating(false);
              setSelectedTaskIds(new Set());
            })
          }
        />
      )}
      {confettiNode}
      {/* Thẻ nổi bám theo con trỏ trong lúc kéo — che ảnh bóng mờ mặc định của
          trình duyệt (đã vô hiệu bằng TRANSPARENT_DRAG_IMAGE ở handleHandleDragStart),
          cùng kiểu với thẻ nổi khi kéo task Kanban ở personal-task-board.tsx. */}
      <AnimatePresence>
        {draggingTaskId != null && dragPoint && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-[999] max-w-xs truncate rounded-[10px] border border-[#e8edf5] bg-white px-3 py-2 text-sm font-semibold text-navy shadow-[0_24px_48px_-12px_rgba(16,26,48,0.35)]"
            style={{ left: dragPoint.x, top: dragPoint.y }}
            initial={{ opacity: 0, scale: 1, x: '-50%', y: '-50%' }}
            animate={{ opacity: 0.96, scale: 1.05, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={DRAG_SPRING_TRANSITION}
          >
            {sortedTasks.find((t) => t.id === draggingTaskId)?.title ?? ''}
          </motion.div>
        )}
      </AnimatePresence>
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
    return <div className="rounded-[16px] border-2 border-navy/15 bg-white p-10 text-center text-sm text-muted shadow-[0_16px_40px_-24px_rgba(16,26,48,0.35)]">{emptyMessage}</div>;
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
  const [confirmDelete, setConfirmDelete] = useState(false);
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
          ? 'bg-blue/10 text-blue'
          : 'bg-surface-2 text-muted';

  return (
    <>
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
              className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink"
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
                    setConfirmDelete(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left font-semibold text-red-500 hover:bg-surface-2"
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
      {confirmDelete && (
        <ConfirmDeleteDialog
          message={`Bạn có muốn xoá task "${task.title}" không?`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            onDelete(task);
            setConfirmDelete(false);
          }}
        />
      )}
    </>
  );
}

function anchoredPopoverStyle(position: AnchoredPopoverPosition): React.CSSProperties {
  return {
    left: position.left,
    width: position.width,
    maxHeight: position.maxHeight,
    ...(position.placement === 'above' ? { bottom: position.edge } : { top: position.edge }),
  };
}

/** Portal các popup trong ô ra body và neo bằng toạ độ viewport để vùng cuộn
 * ngang/dọc của bảng không thể cắt mất nội dung. */
function useTableCellPopover(
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  preferredWidth: number
) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<AnchoredPopoverPosition | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      setOpen(false);
      return;
    }
    setPosition(getAnchoredPopoverPosition(rect, { width: window.innerWidth, height: window.innerHeight }, preferredWidth));

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    function handleScroll(event: Event) {
      const target = event.target;
      if (target instanceof Node && popoverRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleResize() {
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, preferredWidth, setOpen]);

  return { triggerRef, popoverRef, position };
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
function MemberPickerCell({ members, value, onChange }: { members: TeamMember[]; value: number | null; onChange: (userId: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const { triggerRef, popoverRef, position } = useTableCellPopover(open, setOpen, 208);
  const selected = members.find((m) => m.userId === value) ?? null;
  const others = members.filter((m) => m.userId !== value);

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full min-w-0 max-w-full items-center gap-1.5 rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-left text-sm outline-none focus:border-blue"
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
      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            style={anchoredPopoverStyle(position)}
            className="fixed z-50 overflow-y-auto border border-[#e8edf5] bg-white py-2 text-sm shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
          >
            {selected && (
              <>
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Đã chọn</p>
                <div className="flex w-full items-center gap-2 bg-surface-2 px-3 py-1.5 font-medium text-navy">
                  {memberAvatar(selected, 18)}
                  {givenNameOf(selected.fullName)}
                </div>
                <div className="my-1.5 border-t border-[#edf1f7]" />
              </>
            )}
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{selected ? 'Đổi người khác' : 'Chọn người'}</p>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-muted hover:bg-surface-2"
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
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-2"
              >
                {memberAvatar(m, 18)}
                {givenNameOf(m.fullName)}
              </button>
            ))}
          </div>,
          document.body
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
  const { triggerRef, popoverRef, position } = useTableCellPopover(open, setOpen, 256);
  const selected = shops.find((s) => s.name === value) ?? (value ? { name: value, active: false } : null);

  useEffect(() => {
    if (!open) setQuery('');
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
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full min-w-0 max-w-full items-center rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-left text-sm outline-none focus:border-blue"
      >
        <span className="truncate">{selected ? selected.name : <span className="whitespace-nowrap text-muted">Chưa chọn</span>}</span>
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            style={anchoredPopoverStyle(position)}
            className="fixed z-50 flex flex-col overflow-hidden border border-[#e8edf5] bg-white text-sm shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
          >
            {selected && (
              <>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Đã chọn</p>
                <div className="flex items-center justify-between gap-2 bg-surface-2 px-3 py-1.5 font-medium text-navy">
                  <span className="truncate">{selected.name}</span>
                  {!selected.active && <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">Inactive</span>}
                </div>
                <div className="my-1.5 border-t border-[#edf1f7]" />
              </>
            )}
            <div className="px-3 pb-1.5">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên acc…"
                className="w-full rounded-[6px] border border-[#dbe4f2] px-2 py-1.5 text-sm outline-none focus:border-blue"
              />
            </div>
            <div className="min-h-0 max-h-56 overflow-y-auto pb-1.5">
              <button type="button" onClick={() => select('')} className="flex w-full items-center px-3 py-1.5 text-left text-muted hover:bg-surface-2">
                Chưa chọn
              </button>
              {results.length === 0 && <p className="px-3 py-2 text-xs text-muted">Không tìm thấy acc nào.</p>}
              {results.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => select(s.name)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-surface-2"
                >
                  <span className="truncate">{s.name}</span>
                  {!s.active && <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">Inactive</span>}
                </button>
              ))}
            </div>
          </div>,
          document.body
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
  const { triggerRef, popoverRef, position } = useTableCellPopover(open, setOpen, 256);
  const allProducts = useMemo(() => Array.from(new Set([...products, ...(value ? [value] : [])])).sort((a, b) => a.localeCompare(b, 'vi')), [products, value]);
  const colorMap = useMemo(() => distinctColorMap(allProducts), [allProducts]);
  const colorOf = (name: string) => colorMap.get(name) ?? UNASSIGNED_COLOR;

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const trimmedQuery = query.trim();
  const results = allProducts.filter((p) => !trimmedQuery || p.toLowerCase().includes(trimmedQuery.toLowerCase()));
  const exactMatch = allProducts.some((p) => p.toLowerCase() === trimmedQuery.toLowerCase());

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full min-w-0 max-w-full items-center rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-left text-sm outline-none focus:border-blue"
      >
        {value ? (
          <span className="min-w-0 max-w-full truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: colorOf(value) }}>
            {value}
          </span>
        ) : (
          <span className="whitespace-nowrap text-muted">Chưa chọn</span>
        )}
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            style={anchoredPopoverStyle(position)}
            className="fixed z-50 flex flex-col overflow-hidden border border-[#e8edf5] bg-white text-sm shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
          >
            <div className="px-3 pt-2 pb-1.5">
              <input
                autoFocus
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
            <div className="min-h-0 max-h-56 overflow-y-auto pb-1.5">
              <button type="button" onClick={() => select('')} className="flex w-full items-center px-3 py-1.5 text-left text-muted hover:bg-surface-2">
                Chưa chọn
              </button>
              {trimmedQuery && !exactMatch && (
                <button
                  type="button"
                  onClick={() => select(trimmedQuery)}
                  className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left font-semibold text-blue hover:bg-surface-2"
                >
                  + Dùng "{trimmedQuery}"
                </button>
              )}
              {results.length === 0 && !trimmedQuery && <p className="px-3 py-2 text-xs text-muted">Chưa có sản phẩm nào.</p>}
              {results.map((name) => (
                <button key={name} type="button" onClick={() => select(name)} className="flex w-full items-center px-3 py-1.5 text-left hover:bg-surface-2">
                  <span className="truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: colorOf(name) }}>
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>,
          document.body
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
  const [channelName, setChannelName] = useState(task?.channelName ?? '');
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

  const cellInputClass = 'block box-border w-full min-w-0 max-w-full rounded-[6px] border border-[#dbe4f2] bg-white px-2 py-1.5 text-sm outline-none focus:border-blue';
  const editorCellClass = 'min-w-0 overflow-hidden px-3 py-2.5';
  const shops = shopsForTeamCode(teamCode);
  // Sửa task có sẵn thì lưu ngay khi đổi 1 ô (không cần nút Lưu riêng) — thêm
  // task mới vẫn giữ nút Lưu/Huỷ tường minh vì chưa có gì để lưu tự động tới
  // khi bấm nút.
  const isEditingExisting = Boolean(task);

  // Nhận override cho field vừa đổi vì setState không đồng bộ — nếu chỉ gọi
  // handleSave() ngay sau setX(...) trong cùng handler thì closure vẫn thấy
  // giá trị field đó CŨ (chưa re-render), nên phải truyền giá trị mới thẳng
  // vào đây thay vì đọc lại state.
  function commit(
    overrides: Partial<{
      taskDate: string;
      assigneeUserId: number | null;
      accountName: string;
      channelName: string;
      channel: string;
      videoCount: string;
      product: string;
      optionTag: string;
      referenceLink: string;
      note: string;
      status: TaskStatus;
    }> = {}
  ) {
    const merged = {
      taskDate,
      assigneeUserId,
      accountName,
      channelName,
      channel,
      videoCount,
      product,
      optionTag,
      referenceLink,
      note,
      status,
      ...overrides,
    };
    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }
    if (!isEditingExisting) {
      // Khoá double-submit chỉ áp cho TẠO MỚI (né IME bắn 2 lần Enter ra 2
      // task trùng nhau) — sửa task có sẵn thì submit trùng vô hại (cùng
      // patch, idempotent), khoá ở đây sẽ làm rớt mất lượt autosave kế tiếp
      // nếu người dùng đổi 2 ô liên tiếp trong vòng 400ms.
      const now = Date.now();
      if (now - lastSaveAtRef.current < 400) return;
      lastSaveAtRef.current = now;
    }
    onSubmit({
      taskDate: merged.taskDate,
      assigneeUserId: merged.assigneeUserId,
      title: title.trim(),
      categoryId: task?.categoryId ?? null,
      accountName: merged.accountName || null,
      channelName: merged.channelName || null,
      channel: merged.channel || null,
      videoCount: merged.videoCount ? Number(merged.videoCount) : null,
      product: merged.product || null,
      optionTag: merged.optionTag || null,
      referenceLink: merged.referenceLink || null,
      note: merged.note || null,
      status: merged.status,
    });
  }

  function handleSave() {
    commit();
  }

  // Sửa task có sẵn: Enter vừa lưu vừa đóng luôn ô sửa (như bấm "Xong") — mỗi
  // field đã tự lưu ngay khi đổi nên chỉ còn thiếu bước đóng lại, không cần
  // người dùng bấm thêm lần nữa. Thêm task mới thì giữ nguyên hành vi cũ (Enter
  // chỉ lưu, không đóng) để gõ liên tiếp nhiều task không bị bật ra ngoài.
  function handleEnterSave(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSave();
      if (isEditingExisting) onCancel();
    }
  }

  function renderColumnInput(key: TaskColumnKey) {
    switch (key) {
      case 'accountName':
        return (
          <AccountNameCell
            value={accountName}
            onChange={(name) => {
              setAccountName(name);
              if (isEditingExisting) commit({ accountName: name });
            }}
            shops={shops}
          />
        );
      case 'channelName':
        return <input value={channelName} onChange={(e) => setChannelName(e.target.value)} onKeyDown={handleEnterSave} className={cellInputClass} />;
      case 'channel':
        return <input value={channel} onChange={(e) => setChannel(e.target.value)} onKeyDown={handleEnterSave} className={cellInputClass} />;
      case 'videoCount':
        return <input type="number" min={0} value={videoCount} onChange={(e) => setVideoCount(e.target.value)} onKeyDown={handleEnterSave} className={cellInputClass} />;
      case 'product':
        return (
          <ProductCell
            value={product}
            onChange={(name) => {
              setProduct(name);
              if (isEditingExisting) commit({ product: name });
            }}
            products={products}
          />
        );
      case 'optionTag':
        return <input value={optionTag} onChange={(e) => setOptionTag(e.target.value)} onKeyDown={handleEnterSave} className={cellInputClass} />;
      case 'note':
        return <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={handleEnterSave} className={cellInputClass} />;
      case 'referenceLink':
        return <input value={referenceLink} onChange={(e) => setReferenceLink(e.target.value)} onKeyDown={handleEnterSave} className={cellInputClass} />;
      default:
        return null;
    }
  }

  return (
    <tr className="divide-x divide-[#edf1f7] bg-surface-2">
      <td className="px-3 py-2.5" />
      <td className={editorCellClass}>
        <input
          type="date"
          value={taskDate}
          onChange={(e) => {
            const value = e.target.value;
            setTaskDate(value);
            if (isEditingExisting) commit({ taskDate: value });
          }}
          onKeyDown={handleEnterSave}
          className={cellInputClass}
        />
      </td>
      <td className={editorCellClass}>
        <MemberPickerCell
          members={members}
          value={assigneeUserId}
          onChange={(userId) => {
            setAssigneeUserId(userId);
            if (isEditingExisting) commit({ assigneeUserId: userId });
          }}
        />
      </td>
      {leadingColumns.map((key) => (
        <td key={key} className={editorCellClass}>
          {renderColumnInput(key)}
        </td>
      ))}
      <td className={editorCellClass}>
        <input ref={titleInputRef} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={handleEnterSave} placeholder="Chủ đề, đầu việc" className={cellInputClass} />
      </td>
      {trailingColumns.map((key) => (
        <td key={key} className={editorCellClass}>
          {renderColumnInput(key)}
        </td>
      ))}
      <td className={editorCellClass}>
        <input
          type="checkbox"
          checked={status === 'done'}
          onChange={(e) => {
            const next = e.target.checked ? 'done' : 'not_started';
            setStatus(next);
            if (isEditingExisting) commit({ status: next });
          }}
          onClick={(e) => {
            if (!e.currentTarget.checked) return;
            fireConfetti();
          }}
          aria-label={status === 'done' ? 'Hoàn thành' : 'Chưa hoàn thành'}
          className="h-4 w-4 cursor-pointer accent-[#2ECC85]"
        />
        {confettiNode}
      </td>
      <td className="min-w-0 whitespace-nowrap px-3 py-2 text-right text-xs">
        {isEditingExisting ? (
          <button
            type="button"
            onClick={() => {
              // Ô nhập chữ (Chủ đề, Up kênh, SL Vid…) chỉ lưu khi bấm Enter,
              // chưa tự lưu theo từng ký tự gõ — bấm Xong phải lưu nốt phần
              // đang gõ dở trước khi đóng, không thì mất trắng nội dung.
              handleSave();
              onCancel();
            }}
            className="font-semibold text-muted hover:text-navy"
          >
            Xong
          </button>
        ) : (
          <>
            <button type="button" onClick={handleSave} className="mr-2 font-semibold text-blue">
              Lưu
            </button>
            <button type="button" onClick={onCancel} className="font-semibold text-muted">
              Huỷ
            </button>
          </>
        )}
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
              className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink"
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
                  className="block w-full px-3 py-1.5 text-left font-semibold text-blue hover:bg-surface-2"
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
                      className="block w-full px-3 py-1.5 text-left font-semibold hover:bg-surface-2"
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
                    className="block w-full px-3 py-1.5 text-left font-semibold text-muted hover:bg-surface-2"
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
                  className="block w-full px-3 py-1.5 text-left font-semibold text-red-500 hover:bg-surface-2"
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

/** Gộp task theo người phụ trách từ 1 tập DailyAssigneeCount[] bất kỳ — dùng
 *  chung cho thẻ tổng theo ngày (AssigneeSummaryCard) lẫn phần tổng theo
 *  tháng nằm trên biểu đồ (MonthlyDailyChart), chỉ khác nhau ở `chart` truyền
 *  vào đã lọc theo ngày hay theo cả tháng. */
function computeAssigneeTotals(chart: DailyAssigneeCount[], members: TeamMember[], opts?: { includeAllMembers?: boolean }) {
  const names = new Set(chart.map((c) => c.fullName ?? 'Chưa gán'));
  // AssigneeSummaryCard (theo ngày) và MonthlyDailyChart (theo tháng) đều cần
  // hiện đủ mọi thành viên đội kể cả ai chưa có task trong kỳ đang xem (0|0),
  // để bảng không "biến mất" hoặc thiếu người khi tháng/ngày đó chưa có dữ liệu.
  if (opts?.includeAllMembers) {
    for (const member of members) names.add(member.fullName);
  }
  const assignees = Array.from(names).sort();
  const memberByName = new Map(members.map((m) => [m.fullName, m]));
  const colorMap = assigneeColorMap(members);
  const colorOf = (name: string) => colorMap.get(name) ?? UNASSIGNED_COLOR;

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

  return { totalsByAssignee, grandTotal, colorOf, memberByName };
}

function AssigneeTotalsGrid({ totalsByAssignee }: { totalsByAssignee: ReturnType<typeof computeAssigneeTotals>['totalsByAssignee'] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {totalsByAssignee.map(({ name, color, member, total, done }) => (
        <div
          key={name}
          className="assignee-tint-card flex items-center justify-between gap-2 rounded-[10px] border border-[#e8edf5] p-2"
          style={{ borderLeftWidth: 3, borderLeftColor: color, '--tint-color': color } as React.CSSProperties}
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
  );
}

/** Thẻ tổng hợp "Task theo người" theo đúng NGÀY đang chọn — đặt ở đầu trang
 *  như bố cục cũ. `chart` truyền vào phải là dữ liệu đã lọc theo đúng 1 ngày
 *  (xem dayChart ở TaskBoard), khác với bản tổng cả tháng nằm trên biểu đồ
 *  (MonthlyDailyChart). */
function AssigneeSummaryCard({ chart, members, periodLabel }: { chart: DailyAssigneeCount[]; members: TeamMember[]; periodLabel: string }) {
  const { totalsByAssignee, grandTotal } = computeAssigneeTotals(chart, members, { includeAllMembers: true });

  return (
    <div className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-sm font-bold text-navy">
          Task theo người <span className="font-normal text-muted">· {periodLabel}</span>
        </p>
        <p className="text-xs font-semibold text-muted">Tổng {grandTotal} task</p>
      </div>
      <AssigneeTotalsGrid totalsByAssignee={totalsByAssignee} />
    </div>
  );
}

/** Biểu đồ "Theo ngày" trải rộng hết chiều ngang trang (đặt ngoài lưới
 *  bảng+sidebar, không bị bó hẹp trong cột 1fr) — mỗi cột chia đều theo
 *  flex-1 nên luôn đủ số ngày thật của tháng đang xem (31 ngày tháng 8, 30
 *  ngày tháng 9...) kể cả ngày chưa có task, không cần cuộn ngang. */
function MonthlyDailyChart({ chart, members, monthAnchor }: { chart: DailyAssigneeCount[]; members: TeamMember[]; monthAnchor: string }) {
  // Popup ngày portal ra document.body thay vì absolute trong cột — nếu khu
  // biểu đồ từng cuộn ngang thì trục dọc cũng bị cắt theo (CSS: overflow-x
  // khác visible thì overflow-y "visible" tự thành "auto"); nay không còn
  // cuộn ngang nhưng vẫn portal cho an toàn.
  const [hovered, setHovered] = useState<{ date: string; left: number; top: number } | null>(null);

  useEffect(() => {
    if (!hovered) return;
    function handleScroll() {
      setHovered(null);
    }
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [hovered]);

  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const dates: string[] = [];
  for (let d = monthStart; d <= monthEnd; d = addDays(d, 1)) {
    dates.push(d);
  }
  const max = Math.max(...dates.map((d) => chart.filter((c) => c.date === d).reduce((sum, c) => sum + c.count, 0)), 1);
  // Tháng chưa có task nào (vd tháng hiện tại vừa sang) vẫn phải hiện đủ
  // khung bảng + đủ thành viên 0|0 — không ẩn cả khối như trước, khớp cách
  // xử lý ở AssigneeSummaryCard (thẻ theo ngày).
  const { totalsByAssignee, grandTotal, colorOf, memberByName } = computeAssigneeTotals(chart, members, {
    includeAllMembers: true,
  });
  const hoveredDayItems = hovered ? chart.filter((c) => c.date === hovered.date) : [];
  const hoveredDayTotal = hoveredDayItems.reduce((sum, c) => sum + c.count, 0);
  const monthLabel = `Tháng ${Number(monthAnchor.slice(5, 7))}/${monthAnchor.slice(0, 4)}`;

  return (
    <div className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-sm font-bold text-navy">{monthLabel}</p>
        <p className="text-xs font-semibold text-muted">Tổng {grandTotal} task</p>
      </div>
      <div className="mb-4">
        <AssigneeTotalsGrid totalsByAssignee={totalsByAssignee} />
      </div>
      <p className="mb-2 font-heading text-xs font-bold uppercase tracking-wide text-muted">Theo ngày</p>
      <div className="flex items-end gap-1 pb-2" style={{ minHeight: 140 }}>
        {dates.map((date) => {
          const dayItems = chart.filter((c) => c.date === date);
          const dayTotal = dayItems.reduce((sum, c) => sum + c.count, 0);
          return (
            <div
              key={date}
              className="flex min-w-0 flex-1 cursor-default flex-col items-center gap-1"
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
          onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
          aria-label="Tháng trước"
          className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink"
        >
          ‹
        </button>
        <strong className="font-heading text-xs text-navy">{monthLabel}</strong>
        <button
          type="button"
          onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
          aria-label="Tháng sau"
          className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink"
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
                !inMonth ? 'invisible' : isSelected ? 'bg-blue text-white' : 'border border-[#e8edf5] text-navy hover:bg-surface-2'
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
        className="mt-2 w-full rounded-[8px] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-blue hover:bg-blue/10"
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
  onSubmitDates: (dates: string[], assigneeUserIds: number[]) => Promise<void>;
  onSubmitPattern: (pattern: BulkDuplicatePattern, assigneeUserIds: number[]) => Promise<void>;
}) {
  const [mode, setMode] = useState<'once' | 'repeat'>('once');
  const [selectedDates, setSelectedDates] = useState<string[]>([addDays(initialMonth, 1)]);
  const [frequency, setFrequency] = useState<BulkDuplicatePattern['frequency']>('daily');
  const [occurrences, setOccurrences] = useState(7);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => (prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr].sort()));
  }

  function toggleMonth(monthDays: string[], allSelected: boolean) {
    setSelectedDates((prev) => (allSelected ? prev.filter((d) => !monthDays.includes(d)) : [...new Set([...prev, ...monthDays])].sort()));
  }

  function toggleMember(userId: number) {
    setSelectedMembers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  return (
    <ModalShell title={`Nhân bản ${count} task đã chọn`} onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitError(null);
          setSubmitting(true);
          try {
            if (mode === 'once') await onSubmitDates(selectedDates, selectedMembers);
            else await onSubmitPattern({ frequency, occurrences }, selectedMembers);
            // Không setSubmitting(false) ở đây — thành công thì modal bị unmount
            // ngay khi component cha đóng nó, set state sau unmount sẽ warning.
          } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
            setSubmitting(false);
          }
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
                    checked ? 'bg-blue/10 text-blue' : 'text-navy hover:bg-surface-2'
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
        {submitError && <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{submitError}</div>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-[10px] px-4 py-2 text-sm font-semibold text-muted">
            Huỷ
          </button>
          <button
            type="submit"
            disabled={submitting || (mode === 'once' && selectedDates.length === 0)}
            className="rounded-[10px] bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {submitting ? 'Đang nhân bản...' : 'Nhân bản'}
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
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<TeamTaskCategory | null>(null);

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
              <button type="button" onClick={() => setConfirmDeleteCat(cat)} className="text-xs font-semibold text-red-500">
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
      {confirmDeleteCat && (
        <ConfirmDeleteDialog
          message={`Bạn có muốn xoá nhóm "${confirmDeleteCat.name}" không?`}
          onCancel={() => setConfirmDeleteCat(null)}
          onConfirm={() => {
            onDelete(confirmDeleteCat.id);
            setConfirmDeleteCat(null);
          }}
        />
      )}
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
            className="flex items-center justify-between rounded-[10px] border border-[#e8edf5] px-3 py-2 text-left text-sm hover:bg-surface-2"
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

/** Hộp thoại xác nhận dùng chung cho mọi thao tác xoá trong Giao Task —
 * chặn xoá nhầm bằng một bước hỏi lại trước khi gọi hành động thật. */
function ConfirmDeleteDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalShell title="Xác nhận xoá" onClose={onCancel}>
      <p className="text-sm text-ink">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[8px] border border-[#dbe4f2] px-3 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-[8px] bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600"
        >
          Xoá
        </button>
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
