'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import type { Task, TaskStatus, DailyAssigneeCount } from '@/lib/tasks';
import type { Department } from '@/lib/roles';
import {
  getMergedTeamBoardAction,
  getMergedDepartmentBoardAsBgdAction,
  updatePersonalTaskAction,
} from '@/app/dashboard/giao-task/actions';
import {
  PersonalKanban,
  PersonalTaskCreateDrawer,
  rangeFor,
  shiftAnchor,
  formatVi,
  type ViewMode,
  type TeamBoardMember,
} from '@/components/dashboard/personal-task-board';
import TaskCalendar from '@/components/dashboard/task-calendar';
import { clearServerActionRecoveryMarker, recoverFromStaleServerActionResponse } from '@/lib/server-action-recovery';

const PersonalTaskDetailDrawer = dynamic(() => import('@/components/dashboard/personal-task-detail-drawer'));

// Cùng khoảng polling đã có tiền lệ ở personal-task-board.tsx.
const POLL_INTERVAL_MS = 150_000;

interface TeamMergedTaskBoardProps {
  today: string;
  /** Cả nhóm được gộp vào board này — chính mình + đồng đội (view tự quản
   *  lý), hoặc mọi người trong 1 phòng ban (view BGĐ, xem
   *  getMergedDepartmentBoardAsBgdAction). */
  members: TeamBoardMember[];
  /** Người được chọn sẵn ở picker "Giao cho" khi tạo task mới — chính mình ở
   *  view tự quản lý, hoặc người đầu danh sách ở view BGĐ (BGĐ không thuộc
   *  nhóm nên không có "chính mình" để mặc định). */
  defaultAssigneeUserId: number;
  initialTasks: Task[];
  /** Số task/ngày chia theo từng người, phủ tháng hiện tại (theo `today`) +
   *  tháng liền trước — hiện ở lịch mini bên phải board (xem getGroupDailyMemberCounts). */
  initialDayCounts: DailyAssigneeCount[];
  /** Có giá trị khi BGĐ mở board này từ thẻ phòng ban ở "Bộ phận khác" — khi
   *  đó refresh gọi getMergedDepartmentBoardAsBgdAction (phạm vi theo
   *  department do BGĐ chỉ định) thay vì getMergedTeamBoardAction (phạm vi
   *  suy từ session, chỉ dùng được cho chính nhóm của người đang đăng nhập). */
  department?: Department;
  /** Có giá trị khi đang lọc board chỉ còn task của đúng 1 người (bấm thẻ ở
   *  TeamGroupDashboard) — null nghĩa là xem tất cả. Chỉ lọc phần hiển thị,
   *  không đụng `tasks`/`dayCounts` thật (lịch mini vẫn tính đủ cả nhóm). */
  filterUserId?: number | null;
}

/** Kanban gộp task của cả nhóm đồng đội ngang quyền vào 1 board duy nhất —
 *  mỗi thẻ vẫn giữ owner_user_id thật của nó nên PersonalKanban hiện đúng
 *  icon chủ task, và mọi hành động (đổi trạng thái, sửa, xoá, giao task cho
 *  ai) gọi thẳng các Server Action cá nhân đã có sẵn (đã cho phép cả nhóm
 *  thao tác qua requirePersonalTaskContext, hoặc BGĐ xem hộ), không cần
 *  action riêng nào cho việc sửa/xoá. */
export default function TeamMergedTaskBoard({
  today,
  members,
  defaultAssigneeUserId,
  initialTasks,
  initialDayCounts,
  department,
  filterUserId = null,
}: TeamMergedTaskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [anchorDate, setAnchorDate] = useState(today);
  // Tháng đang XEM trên lịch mini — tách khỏi anchorDate, cùng cách xử lý
  // với PersonalTaskBoard (chỉ nút ‹/› trên lịch mini mới dịch state này).
  const [calendarMonthAnchor, setCalendarMonthAnchor] = useState(today);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dayCounts, setDayCounts] = useState<DailyAssigneeCount[]>(initialDayCounts);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [createRequest, setCreateRequest] = useState<TaskStatus | null>(null);
  const [, startTransition] = useTransition();
  const didMount = useRef(false);
  const refreshRequestRef = useRef(0);

  const range = useMemo(() => rangeFor(viewMode, anchorDate), [viewMode, anchorDate]);
  const calendarYearMonth = calendarMonthAnchor.slice(0, 7);
  const previousMonthYearMonth = useMemo(
    () => shiftAnchor('month', calendarMonthAnchor, -1).slice(0, 7),
    [calendarMonthAnchor]
  );

  async function refresh(opts?: { silent?: boolean }) {
    const requestId = ++refreshRequestRef.current;
    try {
      const result = department
        ? await getMergedDepartmentBoardAsBgdAction(department, range, calendarYearMonth)
        : await getMergedTeamBoardAction(range, calendarYearMonth);
      if (requestId !== refreshRequestRef.current) return;
      clearServerActionRecoveryMarker();
      setTasks(result.tasks);
      setDayCounts(result.dayCounts);
      setError(null);
    } catch (err) {
      if (requestId !== refreshRequestRef.current) return;
      if (opts?.silent) {
        if (!recoverFromStaleServerActionResponse(err)) {
          console.warn('refresh board nhóm (nền) lỗi:', err);
        }
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
  }, [range.fromDate, range.toDate, calendarYearMonth]);

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
    document.addEventListener('visibilitychange', syncWhenVisible);
    window.addEventListener('focus', syncWhenVisible);
    return () => {
      window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', syncWhenVisible);
      window.removeEventListener('focus', syncWhenVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.fromDate, range.toDate, calendarYearMonth]);

  function reconcileTasks(changes: Array<{ previous: Task | null; next: Task | null }>) {
    const inRange = (task: Task) => task.taskDate >= range.fromDate && task.taskDate <= range.toDate;
    const inTrackedMonths = (task: Task) => task.taskDate.startsWith(calendarYearMonth) || task.taskDate.startsWith(previousMonthYearMonth);

    setTasks((current) => {
      const nextById = new Map(current.map((task) => [task.id, task]));
      for (const change of changes) {
        if (change.previous && change.next && change.previous.id === change.next.id) {
          if (inRange(change.next)) nextById.set(change.next.id, change.next);
          else nextById.delete(change.next.id);
          continue;
        }
        if (change.previous) nextById.delete(change.previous.id);
        if (change.next && inRange(change.next)) nextById.set(change.next.id, change.next);
      }
      return [...nextById.values()];
    });

    setDayCounts((current) => {
      const counts = new Map(current.map((item) => [`${item.date}:${item.assigneeUserId}`, { ...item }]));
      const adjust = (task: Task, delta: number) => {
        if (task.ownerUserId === null || !inTrackedMonths(task)) return;
        const key = `${task.taskDate}:${task.ownerUserId}`;
        const existing = counts.get(key) ?? {
          date: task.taskDate,
          assigneeUserId: task.ownerUserId,
          fullName: task.ownerFullName ?? '',
          count: 0,
          done: 0,
        };
        const count = existing.count + delta;
        const done = existing.done + (task.status === 'done' ? delta : 0);
        if (count > 0) counts.set(key, { ...existing, count, done: Math.max(0, done) });
        else counts.delete(key);
      };
      for (const { previous, next } of changes) {
        if (previous) adjust(previous, -1);
        if (next) adjust(next, 1);
      }
      return [...counts.values()];
    });
  }

  // Đổi trạng thái ngay tại chỗ trước khi gọi server, giống PersonalTaskBoard —
  // owner của mỗi task lấy từ task.ownerUserId (không phải 1 người cố định),
  // vì board này gộp nhiều đồng đội.
  function changeStatus(task: Task, status: TaskStatus) {
    if (task.ownerUserId === null) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    startTransition(() => {
      updatePersonalTaskAction(task.ownerUserId!, task.id, { status })
        .then((updated) => reconcileTasks([{ previous: task, next: updated }]))
        .catch((err) => {
          setTasks((current) => current.map((item) => (item.id === task.id && item.status === status ? task : item)));
          setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
        });
    });
  }

  function changeTitle(task: Task, title: string) {
    if (task.ownerUserId === null) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title } : t)));
    startTransition(() => {
      updatePersonalTaskAction(task.ownerUserId!, task.id, { title })
        .then((updated) => reconcileTasks([{ previous: task, next: updated }]))
        .catch((err) => {
          setTasks((current) => current.map((item) => (item.id === task.id ? task : item)));
          setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
        });
    });
  }

  const visibleTasks = filterUserId === null ? tasks : tasks.filter((task) => task.ownerUserId === filterUserId);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const rangeLabel =
    viewMode === 'day'
      ? anchorDate === today
        ? `Hôm nay · ${formatVi(anchorDate)}`
        : formatVi(anchorDate)
      : `${formatVi(range.fromDate)} — ${formatVi(range.toDate)}`;

  return (
    <div className="px-4 pb-6 sm:px-6 sm:pb-8 min-[1025px]:px-10 min-[1025px]:pb-10">
      {error && <p className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}
      <div className="grid gap-5 min-[1025px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PersonalKanban
            tasks={visibleTasks}
            today={today}
            ownerUserId={filterUserId ?? defaultAssigneeUserId}
            showOwnerAvatar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            rangeLabel={rangeLabel}
            onShiftDate={(direction) => setAnchorDate((current) => shiftAnchor(viewMode, current, direction))}
            showTodayButton={anchorDate !== today}
            onGoToday={() => setAnchorDate(today)}
            onRequestCreate={setCreateRequest}
            onStatusChange={changeStatus}
            onTitleChange={changeTitle}
            onOpenDetail={(task) => setSelectedTaskId(task.id)}
          />
        </div>
        <TaskCalendar
          viewAnchor={calendarMonthAnchor}
          selectedDate={anchorDate}
          today={today}
          categories={[]}
          dayCategoryCounts={[]}
          memberDayCounts={dayCounts}
          onSelectDay={(date) => {
            setAnchorDate(date);
            setViewMode('day');
          }}
          onShiftMonth={(direction) => setCalendarMonthAnchor((current) => shiftAnchor('month', current, direction))}
        />
      </div>
      {selectedTask && selectedTask.ownerUserId !== null && (
        <PersonalTaskDetailDrawer
          task={selectedTask}
          ownerUserId={selectedTask.ownerUserId}
          today={today}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => reconcileTasks([{ previous: selectedTask, next: updated }])}
          onDeleted={() => {
            reconcileTasks([{ previous: selectedTask, next: null }]);
            setSelectedTaskId(null);
          }}
        />
      )}
      {createRequest !== null && (
        <PersonalTaskCreateDrawer
          ownerUserId={filterUserId ?? defaultAssigneeUserId}
          today={today}
          status={createRequest}
          defaultDate={anchorDate}
          members={members}
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
