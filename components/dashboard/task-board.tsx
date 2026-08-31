'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MoreVertical, TriangleAlert, ListChecks, CircleDot, CheckCircle2, ArrowLeft, Plus, X, StickyNote, Video, LayoutGrid, Rows3, Grid2x2 } from 'lucide-react';
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

const CHART_PALETTE = ['#4FA3F7', '#FFB84D', '#2DD4BF', '#9B7EF0', '#FF7A5C', '#FF6FA0', '#7FA8D9'];

/** Mỗi nhóm task (Media/Support...) có 1 màu riêng lấy từ CHART_PALETTE theo
 *  vị trí trong danh sách nhóm — ổn định, không đổi màu khi lọc/sắp xếp lại. */
function categoryColor(categories: { id: number }[], categoryId: number): string {
  const index = categories.findIndex((c) => c.id === categoryId);
  return CHART_PALETTE[Math.max(index, 0) % CHART_PALETTE.length];
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
  // Kanban/Thẻ chỉ là 2 cách trình bày khác của cùng dữ liệu task (kéo-thả
  // hoặc bấm để đổi trạng thái) — song song với bảng cũ, không thay thế, giữ
  // nguyên mọi thao tác nhân bản/sửa nhanh vốn chỉ có ở bảng.
  const [boardView, setBoardView] = useState<'table' | 'kanban' | 'card'>('table');
  const [anchorDate, setAnchorDate] = useState(today);
  // Chuyển đội giờ đi qua điều hướng URL thật (/dashboard/giao-task/[code],
  // xem OverviewPanel bên dưới) thay vì đổi state — mỗi đội/màn tổng quan là
  // 1 lượt mount TaskBoard mới (page.tsx truyền `key` khác nhau), nên giá trị
  // này chỉ cần đọc 1 lần lúc mount, không cần setter.
  const activeTeamId = initialBoard?.team.id ?? null;
  // Không còn tab "Toàn bộ" — luôn cố định vào 1 nhóm task (Media/Support...);
  // mặc định là nhóm đầu tiên, khớp với dữ liệu page.tsx đã lọc sẵn phía server.
  const [categoryId, setCategoryId] = useState<number | undefined>(initialBoard?.categories[0]?.id);
  const [board, setBoard] = useState<BoardData | null>(initialBoard);
  const [overview, setOverview] = useState<OverviewData | null>(initialOverview);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [managingCategories, setManagingCategories] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [dayCategoryCounts, setDayCategoryCounts] = useState<MonthDayCategoryCount[]>([]);

  const didMount = useRef(false);
  const range = useMemo(() => rangeFor(viewMode, anchorDate), [viewMode, anchorDate]);

  // Tab Media/Support lọc task theo nhóm của NGƯỜI PHỤ TRÁCH (member.categoryId
  // xếp ở sidebar), không theo category_id riêng của task — khớp với việc
  // "gom nhóm thành viên" quyết định task hiện ở tab nào.
  const visibleTasks = useMemo(() => {
    if (!board) return [];
    const memberCategoryById = new Map(board.team.members.map((m) => [m.userId, m.categoryId]));
    return board.tasks.filter((t) => t.assigneeUserId != null && memberCategoryById.get(t.assigneeUserId) === categoryId);
  }, [board, categoryId]);

  // Thêm task ngay trên tab nào thì chỉ gán được cho người đang ở đúng nhóm
  // đó — tránh tình huống vừa lưu xong task đã biến mất khỏi tab đang xem.
  const assignableMembers = useMemo(() => {
    if (!board) return [];
    return board.team.members.filter((m) => m.categoryId === categoryId);
  }, [board, categoryId]);

  const calendarYearMonth = anchorDate.slice(0, 7);

  // Lịch mini tô màu theo tháng — độc lập với viewMode/range đang chọn. Lấy
  // số task theo TỪNG nhóm (không lọc theo tab đang xem) để mỗi ô ngày vừa
  // tô màu "có hoạt động" vừa hiện số lượng riêng từng nhóm (Media/Support...).
  useEffect(() => {
    if (!board) return;
    getMonthTaskCategoryCountsAction(board.team.id, calendarYearMonth)
      .then(setDayCategoryCounts)
      .catch(() => setDayCategoryCounts([]));
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
    if (activeTeamId == null) {
      // Trang tổng quan (không có team ban đầu) — không có đội nào để tải,
      // giữ board rỗng để OverviewPanel hiện ra (điều kiện render là !board).
      setBoard(null);
      return;
    }
    try {
      const result = isBgd ? await getTeamBoardAsBgdAction(activeTeamId, range) : await getMyTeamBoardAction(range);
      if ('needsBgdOverview' in result) return;
      setBoard({ ...result, range });
      setError(null);
    } catch (err) {
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

  // Không còn tab "Toàn bộ": nếu nhóm đang chọn không còn tồn tại (đổi đội,
  // nhóm bị xoá, hoặc nhóm đầu tiên vừa được tạo) thì tự chuyển sang nhóm đầu.
  useEffect(() => {
    if (!board) return;
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
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {boardView === 'table' && (
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                className="rounded-[10px] bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-cta"
              >
                + Thêm task
              </button>
            )}
            {board.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`rounded-[10px] px-3 py-1.5 text-sm font-semibold ${
                  categoryId === cat.id ? 'bg-[#E7F0FF] text-blue' : 'bg-surface-2 text-muted'
                }`}
              >
                {cat.name}
              </button>
            ))}
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
                onClick={() => setBoardView('kanban')}
                className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-semibold ${
                  boardView === 'kanban' ? 'bg-white text-blue shadow-sm' : 'text-muted'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                Kanban
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

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              {boardView === 'table' ? (
                <TaskTable
                  tasks={visibleTasks}
                  visibleColumns={board.categories.find((c) => c.id === categoryId)?.visibleColumns ?? [...TASK_COLUMN_KEYS]}
                  teamCode={board.team.code}
                  allMembers={board.team.members}
                  onUpdate={(taskId, input) => runAction(() => updateTaskAction(board.team.id, taskId, input))}
                  onDelete={(task) => runAction(() => deleteTaskAction(board.team.id, task.id))}
                  allowBulkPattern={board.isManager}
                  onBulkDuplicateDates={(taskIds, dates, assigneeUserIds) =>
                    runAction(() => duplicateTasksToDatesAction(board.team.id, taskIds, dates, assigneeUserIds))
                  }
                  onBulkDuplicatePattern={(taskIds, pattern, assigneeUserIds) =>
                    runAction(() => bulkDuplicateTasksAction(board.team.id, taskIds, pattern, assigneeUserIds))
                  }
                  onStatusChange={(task, status) => runAction(() => updateTaskAction(board.team.id, task.id, { status }))}
                  isAdding={isAddingTask}
                  assignableMembers={assignableMembers}
                  defaultDate={anchorDate}
                  onCancelAdd={() => setIsAddingTask(false)}
                  onCreate={(input) => runAction(() => createTaskAction(board.team.id, input), () => setIsAddingTask(false))}
                />
              ) : boardView === 'kanban' ? (
                <TaskKanban
                  tasks={visibleTasks}
                  assignableMembers={assignableMembers}
                  defaultDate={anchorDate}
                  today={today}
                  onStatusChange={(task, status) => runAction(() => updateTaskAction(board.team.id, task.id, { status }))}
                  onCreate={(input) => runAction(() => createTaskAction(board.team.id, input))}
                  onDelete={(task) => runAction(() => deleteTaskAction(board.team.id, task.id))}
                />
              ) : (
                <TaskCardGrid
                  tasks={visibleTasks}
                  today={today}
                  members={board.team.members}
                  onStatusChange={(task, status) => runAction(() => updateTaskAction(board.team.id, task.id, { status }))}
                  onDelete={(task) => runAction(() => deleteTaskAction(board.team.id, task.id))}
                />
              )}
              <AssigneeBarChart chart={board.chart} members={board.team.members} />
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
                activeCategoryId={categoryId}
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
  onUpdate,
  onDelete,
  allowBulkPattern,
  onBulkDuplicateDates,
  onBulkDuplicatePattern,
  onStatusChange,
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
  onUpdate: (taskId: number, input: TaskInput) => void;
  onDelete: (task: Task) => void;
  allowBulkPattern: boolean;
  onBulkDuplicateDates: (taskIds: number[], dates: string[], assigneeUserIds: number[]) => void;
  onBulkDuplicatePattern: (taskIds: number[], pattern: BulkDuplicatePattern, assigneeUserIds: number[]) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
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

  function toggleSelect(taskId: number) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
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
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #F5A623 0%, #FFFFFF 50%, #00D2FF 100%)' }} aria-hidden="true" />
      {selectedTaskIds.size > 0 && (
        <div className="flex items-center justify-between gap-2 border-b border-l-4 border-[#e8edf5] border-l-gold bg-[#F2F6FF] px-4 py-2 text-xs">
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
          <thead className="border-b-2 border-cyan/30 bg-gradient-to-r from-gold/10 via-white to-cyan/10 text-xs font-bold uppercase tracking-wider text-muted">
            <tr className="divide-x divide-[#e8edf5]">
              <th className="px-3 py-3" />
              <th className="px-3 py-3">Ngày</th>
              <th className="px-3 py-3">Thành viên</th>
              {leadingColumns.map((key) => (
                <th key={key} className="px-3 py-3">
                  {COLUMN_LABELS[key]}
                </th>
              ))}
              <th className="px-3 py-3">Chủ đề</th>
              {trailingColumns.map((key) => (
                <th key={key} className="px-3 py-3">
                  {COLUMN_LABELS[key]}
                </th>
              ))}
              <th className="px-3 py-3">Trạng thái</th>
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
                defaultDate={defaultDate}
                onCancel={onCancelAdd}
                onSubmit={onCreate}
              />
            )}
            {tasks.length === 0 && !isAdding && (
              <tr>
                <td colSpan={columns.length + 6} className="px-4 py-6 text-center text-muted">
                  Chưa có task nào trong khoảng thời gian này.
                </td>
              </tr>
            )}
            {tasks.map((task, index) =>
              editingTaskId === task.id ? (
                <TaskRowEditor
                  key={task.id}
                  task={task}
                  leadingColumns={leadingColumns}
                  trailingColumns={trailingColumns}
                  teamCode={teamCode}
                  members={allMembers}
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
                className={`divide-x divide-[#edf1f7] hover:bg-[#f6f9ff] ${index % 2 === 1 ? 'bg-cyan/5' : 'bg-white'}`}
              >
                <td className="px-3 py-2.5">
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
                        <span className="inline-block rounded-full bg-cyan/10 px-2.5 py-1 text-xs font-semibold text-blue">{value}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 font-medium text-navy">{task.title}</td>
                {trailingColumns.map((key) => (
                  <td key={key} className="px-3 py-2.5 text-ink">
                    {key === 'videoCount' ? task.videoCount ?? '' : String((task as unknown as Record<string, unknown>)[key] ?? '')}
                  </td>
                ))}
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={(e) => onStatusChange(task, e.target.checked ? 'done' : 'not_started')}
                    onClick={(e) => {
                      if (!e.currentTarget.checked) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      fireConfetti(e.clientX || rect.left + rect.width / 2, e.clientY || rect.top + rect.height / 2);
                    }}
                    aria-label={task.status === 'done' ? 'Hoàn thành' : 'Chưa hoàn thành'}
                    className="h-4 w-4 cursor-pointer accent-[#2ECC85]"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs">
                  <TaskRowMenu onEdit={() => setEditingTaskId(task.id)} onDelete={() => onDelete(task)} />
                </td>
              </tr>
              )
            )}
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

/** Bảng Kanban chỉ hiện 2 cột Chưa làm/Hoàn thành theo yêu cầu — bớt cột
 *  Đang làm khỏi *view* này thôi, KANBAN_COLUMNS gốc vẫn giữ đủ 3 trạng thái
 *  vì còn được TaskCard (xem Thẻ) dùng để tra nhãn/màu cho task đang làm. */
const KANBAN_BOARD_COLUMNS = KANBAN_COLUMNS.filter((c) => c.status !== 'in_progress');

/** Xem Kanban song song với bảng — cùng dữ liệu `tasks` (đã lọc theo tab
 *  Media/Support ở component cha), chỉ khác cách trình bày: 3 cột theo đúng
 *  3 trạng thái sẵn có trong DB, kéo-thả card sang cột khác để đổi trạng
 *  thái. Sửa chi tiết từng trường (link mẫu, ghi chú...) vẫn làm ở Bảng —
 *  Kanban chỉ cần xem nhanh + đổi trạng thái + thêm thẻ nhanh, đúng phạm vi
 *  yêu cầu "trình bày giống Trello", không nhân đôi toàn bộ form sửa task. */
function TaskKanban({
  tasks,
  assignableMembers,
  defaultDate,
  today,
  onStatusChange,
  onCreate,
  onDelete,
}: {
  tasks: Task[];
  assignableMembers: TeamMember[];
  defaultDate: string;
  today: string;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onCreate: (input: TaskInput) => void;
  onDelete: (task: Task) => void;
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

  return (
    <div className="flex gap-3 overflow-x-auto rounded-[16px] border-2 border-navy/15 bg-white p-3 shadow-[0_16px_40px_-24px_rgba(16,26,48,0.35)]">
      {KANBAN_BOARD_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(col.status);
            }}
            onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
            onDrop={(e) => handleDrop(col.status, e)}
            className={`flex w-72 shrink-0 flex-col rounded-[14px] p-2.5 transition-colors ${
              dragOverStatus === col.status ? 'bg-[#E7F0FF]' : 'bg-surface-2'
            }`}
          >
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} aria-hidden="true" />
              <strong className="font-heading text-sm text-navy">{col.label}</strong>
              <span className="ml-auto text-xs font-bold text-muted">{colTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {colTasks.map((task) => (
                <KanbanCard key={task.id} task={task} today={today} onDelete={onDelete} />
              ))}
              {colTasks.length === 0 && <p className="px-1 py-2 text-xs text-muted">Không có task.</p>}
            </div>
            <div className="mt-2">
              <KanbanQuickAdd
                status={col.status}
                defaultDate={defaultDate}
                assignableMembers={assignableMembers}
                onCreate={onCreate}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Thẻ Kanban — kéo được (native HTML5 DnD, không cần thư viện ngoài) và có
 *  menu "⋮" chỉ để xoá; sửa chi tiết chuyển qua Bảng (xem ghi chú ở
 *  TaskKanban). Đóng menu khi bấm ra ngoài, cùng khuôn mẫu với các menu
 *  dropdown khác trong file (TeamRosterCard, MemberPickerCell). */
function KanbanCard({ task, today, onDelete }: { task: Task; today: string; onDelete: (task: Task) => void }) {
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
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="group cursor-grab rounded-[10px] border border-[#e8edf5] bg-white p-3 shadow-[0_6px_16px_-12px_rgba(16,26,48,0.35)] active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-navy">{task.title}</p>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Tuỳ chọn task"
            className="grid h-6 w-6 place-items-center rounded text-muted opacity-0 hover:bg-[#f2f5fa] hover:text-ink group-hover:opacity-100"
          >
            <MoreVertical size={14} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-7 z-20 w-32 border border-[#e8edf5] bg-white py-1 text-xs shadow-[0_12px_24px_-12px_rgba(16,26,48,0.25)]"
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
      {(task.accountName || task.product) && (
        <p className="mt-1 truncate text-xs text-muted">{[task.accountName, task.product].filter(Boolean).join(' · ')}</p>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${dateTone}`}>
            {formatVi(task.taskDate).slice(0, 5)}
          </span>
          {task.note && <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Có ghi chú" />}
          {task.videoCount != null && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-muted">
              <Video className="h-3 w-3" aria-hidden="true" />
              {task.videoCount}
            </span>
          )}
        </div>
        {task.assigneeFullName &&
          (task.assigneeAvatarUrl ? (
            <Image
              src={task.assigneeAvatarUrl}
              alt={task.assigneeFullName}
              width={22}
              height={22}
              className="h-[22px] w-[22px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#4FA3F7] text-[9px] font-bold text-white">
              {initialsOf(task.assigneeFullName)}
            </span>
          ))}
      </div>
    </div>
  );
}

/** "+ Add a card" kiểu Trello ở cuối mỗi cột — gõ tiêu đề, Enter hoặc bấm
 *  "Thêm thẻ" để tạo ngay, ô nhập giữ mở để gõ liên tiếp nhiều thẻ. Người
 *  phụ trách mặc định lấy người đầu tiên đang hiển thị ở tab hiện tại, khớp
 *  hành vi mặc định của hàng thêm task trong Bảng (TaskRowEditor). */
function KanbanQuickAdd({
  status,
  defaultDate,
  assignableMembers,
  onCreate,
}: {
  status: TaskStatus;
  defaultDate: string;
  assignableMembers: TeamMember[];
  onCreate: (input: TaskInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
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
    onCreate({
      taskDate: defaultDate,
      assigneeUserId: assignableMembers[0]?.userId ?? null,
      title: trimmed,
      categoryId: null,
      status,
    });
    setTitle('');
    inputRef.current?.focus();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-[8px] px-2 py-2 text-left text-sm font-semibold text-muted hover:bg-white hover:text-navy"
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
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          className="rounded-[6px] bg-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-cta"
        >
          Thêm thẻ
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

/** Xem Thẻ: lưới thẻ rộng (không phải cột hẹp kiểu Kanban) để dễ quét nhanh
 *  nhiều task cùng lúc — cùng dữ liệu `tasks` và cùng phạm vi thao tác với
 *  Kanban (đổi trạng thái + xoá; sửa chi tiết vẫn làm ở Bảng, theo đúng quy
 *  ước đã có ở TaskKanban). */
/** Cột song song theo từng người phụ trách (giống bố cục Kanban nhưng nhóm
 *  theo người thay vì trạng thái) — thẻ trong mỗi cột xếp dọc, hiện đủ toàn
 *  bộ task của người đó, không cắt/giới hạn số lượng. */
function TaskCardGrid({
  tasks,
  today,
  members,
  onStatusChange,
  onDelete,
}: {
  tasks: Task[];
  today: string;
  members: TeamMember[];
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-[16px] border-2 border-navy/15 bg-white p-10 text-center text-sm text-muted shadow-[0_16px_40px_-24px_rgba(16,26,48,0.35)]">
        Chưa có task nào trong khoảng thời gian này.
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
                <TaskCard key={task.id} task={task} today={today} onStatusChange={onStatusChange} onDelete={onDelete} />
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
  onStatusChange,
  onDelete,
}: {
  task: Task;
  today: string;
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
          onClick={cycleStatus}
          title="Bấm để đổi trạng thái"
          className={`flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusTextTone}`}
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
  defaultDate,
  onCancel,
  onSubmit,
}: {
  task?: Task;
  leadingColumns: readonly TaskColumnKey[];
  trailingColumns: readonly TaskColumnKey[];
  teamCode: string;
  members: TeamMember[];
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
        return <input value={product} onChange={(e) => setProduct(e.target.value)} className={cellInputClass} />;
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
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
            const rect = e.currentTarget.getBoundingClientRect();
            fireConfetti(e.clientX || rect.left + rect.width / 2, e.clientY || rect.top + rect.height / 2);
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
  activeCategoryId,
  isManager,
  onAddMember,
  onRemoveMember,
  onSetRole,
  onSetMemberCategory,
  onManageCategories,
}: {
  team: TeamWithRoster;
  categories: TeamTaskCategory[];
  activeCategoryId: number | undefined;
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

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const shownMembers = team.members.filter((m) => m.categoryId === activeCategoryId);
  const unassignedMembers = team.members.filter((m) => m.categoryId === null);

  function renderMember(member: TeamMember) {
    return (
      <div key={member.userId} className="relative flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#4FA3F7] text-[11px] font-bold text-white">
            {initialsOf(member.fullName)}
          </span>
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
      <p className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-muted">
        Thành viên {activeCategory ? `· ${activeCategory.name}` : 'đội'}
      </p>
      <div className="flex flex-col gap-2">
        {shownMembers.length === 0 && <p className="text-sm text-muted">Chưa có ai trong nhóm này.</p>}
        {shownMembers.map(renderMember)}
      </div>

      {unassignedMembers.length > 0 && (
        <>
          <p className="mb-2 mt-4 font-heading text-xs font-bold uppercase tracking-wider text-muted">Chưa phân nhóm</p>
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

function AssigneeBarChart({ chart, members }: { chart: DailyAssigneeCount[]; members: TeamMember[] }) {
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
  const hoveredDayItems = hovered ? chart.filter((c) => c.date === hovered.date) : [];
  const hoveredDayTotal = hoveredDayItems.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="mt-5 rounded-[16px] border border-[#e8edf5] bg-white p-4">
      <p className="mb-3 font-heading text-sm font-bold text-navy">Task theo ngày, theo người</p>
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
                      background: CHART_PALETTE[assignees.indexOf(item.fullName ?? 'Chưa gán') % CHART_PALETTE.length],
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
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px]">
        {assignees.map((name) => {
          const member = memberByName.get(name);
          return (
            <span key={name} className="flex items-center gap-1.5">
              {member && memberAvatar(member, 16)}
              <span className="font-bold" style={{ color: CHART_PALETTE[assignees.indexOf(name) % CHART_PALETTE.length] }}>
                {member ? givenNameOf(name) : name}
              </span>
            </span>
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
                    <span className="font-semibold" style={{ color: CHART_PALETTE[assignees.indexOf(label) % CHART_PALETTE.length] }}>
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
