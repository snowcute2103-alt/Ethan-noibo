import 'server-only';
import { listTasksForOwner, type TaskStatus } from '@/lib/tasks';

export interface TimelineWeek {
  /** Ngày đầu tuần, dạng ISO YYYY-MM-DD. */
  start: string;
  /** Nhãn "dd/mm - dd/mm" của tuần, dùng cho tooltip khi hover vào cột. */
  rangeLabel: string;
}

export interface TimelineMonthSpan {
  label: string;
  weekCount: number;
}

export interface TimelineWeekTask {
  id: number;
  title: string;
  status: TaskStatus;
  isFromBoss: boolean;
}

export interface TimelineWeekCount {
  bossCount: number;
  notStartedCount: number;
  inProgressCount: number;
  doneCount: number;
  total: number;
  tasks: TimelineWeekTask[];
}

export interface TimelineMemberRow {
  userId: number;
  fullName: string;
  isSelf: boolean;
  weeks: TimelineWeekCount[];
}

export interface TeamTimelineData {
  weeks: TimelineWeek[];
  monthSpans: TimelineMonthSpan[];
  rows: TimelineMemberRow[];
  /** Vị trí % của vạch "Hôm nay" trên trục ngang (0-100), tính trên toàn bộ khoảng ngày hiển thị. */
  todayOffsetPercent: number;
  /** Ngày hôm nay dạng "dd/mm", hiện kèm nhãn "Hôm nay" trên vạch mốc. */
  todayLabel: string;
}

function toUtc(y: number, m: number, d: number): number {
  return Date.UTC(y, m, d);
}

function parseIsoToUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return toUtc(y, m - 1, d);
}

function isoOf(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_MS = 86_400_000;

/** Timeline dạng Gantt theo tuần cho cả nhóm — khoảng hiển thị mặc định là
 *  tháng trước + tháng hiện tại + 2 tháng tới (đủ nhìn lại gần và nhìn tới
 *  trước, khớp lựa chọn "theo tuần, nhiều tháng"). Mỗi ô tuần/thành viên gộp
 *  task theo `taskDate` rồi phân loại 4 nhóm giống board cá nhân (Sếp đưa/
 *  Chưa làm/Đang làm/Hoàn thành), không tách theo `dueDate` để giữ đơn giản
 *  vì phần lớn task cá nhân chỉ trong 1 ngày. Tuần bắt đầu đúng ngày 1 của
 *  tháng trước (không ép về thứ Hai) để tháng đầu tiên không bị 1 tuần lạc
 *  sang tháng trước đó nữa — đổi lại tuần cuối mỗi tháng có thể lấn nhẹ sang
 *  tháng kế, chấp nhận được vì vẫn gộp đúng vào 1 trong 2 tháng liền kề. */
export async function buildTeamTimeline(
  members: { userId: number; fullName: string; isSelf: boolean }[],
  today: string
): Promise<TeamTimelineData> {
  const [ty, tm, td] = today.split('-').map(Number);
  const todayTs = toUtc(ty, tm - 1, td);

  const rangeStartTs = toUtc(ty, tm - 1 - 1, 1); // đầu tháng trước
  const rangeEndTs = toUtc(ty, tm - 1 + 3, 0); // cuối tháng (hiện tại + 2)

  const gridStartTs = rangeStartTs;
  const weekStarts: number[] = [];
  for (let cursor = gridStartTs; cursor <= rangeEndTs; cursor += 7 * DAY_MS) {
    weekStarts.push(cursor);
  }
  const gridEndTs = weekStarts[weekStarts.length - 1] + 7 * DAY_MS;

  const formatDdMm = (ts: number) => {
    const date = new Date(ts);
    return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  };
  const weeks: TimelineWeek[] = weekStarts.map((ts) => ({
    start: isoOf(ts),
    rangeLabel: `${formatDdMm(ts)} - ${formatDdMm(ts + 6 * DAY_MS)}`,
  }));

  const monthSpans: TimelineMonthSpan[] = [];
  for (const ts of weekStarts) {
    const date = new Date(ts);
    const label = `Tháng ${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
    const last = monthSpans[monthSpans.length - 1];
    if (last && last.label === label) last.weekCount++;
    else monthSpans.push({ label, weekCount: 1 });
  }

  const fromDate = isoOf(gridStartTs);
  const toDate = isoOf(gridEndTs - DAY_MS);

  const rows = await Promise.all(
    members.map(async (member): Promise<TimelineMemberRow> => {
      const tasks = await listTasksForOwner(member.userId, { fromDate, toDate });
      const weekCounts: TimelineWeekCount[] = weekStarts.map(() => ({
        bossCount: 0,
        notStartedCount: 0,
        inProgressCount: 0,
        doneCount: 0,
        total: 0,
        tasks: [],
      }));

      for (const task of tasks) {
        const taskTs = parseIsoToUtc(task.taskDate);
        const weekIndex = Math.floor((taskTs - gridStartTs) / (7 * DAY_MS));
        const bucket = weekCounts[weekIndex];
        if (!bucket) continue;
        const isFromBoss = task.status === 'not_started' && task.createdBy !== null && task.createdBy !== member.userId;
        if (task.status === 'done') bucket.doneCount++;
        else if (task.status === 'in_progress') bucket.inProgressCount++;
        else if (isFromBoss) bucket.bossCount++;
        else bucket.notStartedCount++;
        bucket.total++;
        bucket.tasks.push({ id: task.id, title: task.title, status: task.status, isFromBoss });
      }

      return { userId: member.userId, fullName: member.fullName, isSelf: member.isSelf, weeks: weekCounts };
    })
  );

  const totalRangeMs = gridEndTs - gridStartTs;
  const todayOffsetPercent = Math.min(100, Math.max(0, ((todayTs - gridStartTs) / totalRangeMs) * 100));

  return { weeks, monthSpans, rows, todayOffsetPercent, todayLabel: formatDdMm(todayTs) };
}
