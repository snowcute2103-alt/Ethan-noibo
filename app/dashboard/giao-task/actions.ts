'use server';

import { randomUUID } from 'node:crypto';
import { uploadStorageFile, deleteStorageFile } from '@/lib/storage';
import { getSession } from '@/lib/auth';
import { findUserById, listTeammatesByLabel, type Teammate } from '@/lib/users';
import { logAdminAction } from '@/lib/audit';
import { todayIso } from '@/lib/date';
import {
  findTeamIdByUserId,
  isTeamManager,
  getTeamWithRoster,
  listAllTeamsSummary,
  listActiveUsersNotInAnyTeam,
  listUsersOutsideTeamsByDepartment,
  addTeamMember,
  removeTeamMember,
  setMemberRole,
  setMemberCategory,
  listTeamCategories,
  createTeamCategory,
  updateTeamCategory,
  deleteTeamCategory,
  findOutsideTeamUsersByDepartment,
  type TeamMemberRole,
  type TeamWithRoster,
  type TeamSummary,
  type TeamTaskCategory,
  type DepartmentGroup,
} from '@/lib/teams';
import type { Department } from '@/lib/roles';
import {
  listTasksForTeam,
  createTask,
  updateTask,
  reorderTasks,
  deleteTask,
  duplicateTasksToDates,
  bulkDuplicateTasks,
  BulkDuplicateValidationError,
  getMonthProgress,
  getMonthTaskCategoryCounts,
  getDailyAssigneeBreakdown,
  getAccountNicheBreakdown,
  getDistinctProductsForTeam,
  getAllTeamsMonthProgress,
  listTasksForOwner,
  listTasksForOwners,
  createPersonalTask,
  createPersonalTasks,
  getPersonalTaskById,
  updatePersonalTask,
  deletePersonalTask,
  duplicatePersonalTask,
  getPersonalMonthProgress,
  getPersonalMonthDayCounts,
  getGroupDailyMemberCounts,
  getPersonalTaskDetail,
  addPersonalTaskComment,
  addPersonalTaskImageUrls,
  removePersonalTaskImageUrl,
  hasPersonalTasks,
  countAllPersonalTasks,
  type Task,
  type TaskInput,
  type TaskPatch,
  type PersonalTaskInput,
  type PersonalTaskPatch,
  type PersonalTaskDetail,
  type PersonalTaskComment,
  type BulkDuplicatePattern,
  type DailyAssigneeCount,
  type AccountNicheMonthCount,
  type MonthDayCategoryCount,
  type TeamMonthProgress,
} from '@/lib/tasks';

interface DateRange {
  fromDate: string;
  toDate: string;
}

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');
  return session;
}

async function requireBgd() {
  const session = await requireSession();
  if (session.tier !== 'full') throw new Error('Chỉ BGĐ mới xem được tổng hợp cả 6 đội.');
  return session;
}

/** BGĐ không thuộc đội nào nên dùng đúng teamId của bảng đang xem (client
 *  truyền vào); thành viên/quản lý luôn bị khoá vào đội của chính mình theo
 *  session — bỏ qua teamId client gửi để 1 quản lý không thể sửa đội khác. */
async function requireTeamContext(explicitTeamId: number): Promise<{ userId: number; teamId: number; isBgd: boolean }> {
  const session = await requireSession();
  const isBgd = session.tier === 'full';
  if (isBgd) return { userId: session.userId, teamId: explicitTeamId, isBgd: true };

  const teamId = await findTeamIdByUserId(session.userId);
  if (!teamId) throw new Error('Bạn chưa thuộc đội nào.');
  return { userId: session.userId, teamId, isBgd: false };
}

async function requireManagerContext(explicitTeamId: number): Promise<{ userId: number; teamId: number }> {
  const { userId, teamId, isBgd } = await requireTeamContext(explicitTeamId);
  if (!isBgd && !(await isTeamManager(teamId, userId))) {
    throw new Error('Chỉ quản lý đội mới thực hiện được thao tác này.');
  }
  return { userId, teamId };
}

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/** Đồng đội cùng `team_label` + department (vd 3 người IT "Development
 *  Team") — cả nhóm ngang quyền với nhau, không chỉ 1 trưởng nhóm, theo yêu
 *  cầu "ai trong nhóm cũng giao task được cho nhau". */
async function isSameTeammateGroup(viewerId: number, ownerId: number): Promise<boolean> {
  const [viewer, owner] = await Promise.all([findUserById(viewerId), findUserById(ownerId)]);
  if (!viewer || !owner) return false;
  return viewer.teamLabel !== null && viewer.teamLabel === owner.teamLabel && viewer.department === owner.department;
}

/** Task cá nhân: chính chủ, BGĐ, hoặc 1 đồng đội cùng `team_label` (xem
 *  isSameTeammateGroup) — và chỉ khi ownerUserId thực sự là người ngoài 6
 *  đội KD (không thuộc team_members, không phải BGĐ). Thiếu vế sau thì bất
 *  kỳ user đã đăng nhập nào (kể cả thành viên đội KD) đều tạo được task cá
 *  nhân cho chính mình, sinh dữ liệu team_id=NULL không màn hình nào hiển
 *  thị. */
async function requirePersonalTaskContext(ownerUserId: number): Promise<{ session: Session }> {
  const session = await requireSession();
  const isSelf = session.userId === ownerUserId;
  const isBgd = session.tier === 'full';
  if (!isSelf && !isBgd && !(await isSameTeammateGroup(session.userId, ownerUserId))) {
    throw new Error('Bạn không có quyền xem/sửa task cá nhân của người khác.');
  }
  const [ownerTeamId, owner] = await Promise.all([findTeamIdByUserId(ownerUserId), findUserById(ownerUserId)]);
  if (ownerTeamId !== null || !owner || owner.department === 'bgd') {
    throw new Error('Người này không thuộc diện quản lý task cá nhân (đang ở 1 đội KD hoặc là BGĐ).');
  }
  return { session };
}

export interface NeedsBgdOverview {
  needsBgdOverview: true;
}

/** Phần dữ liệu đổi theo range/category — không có team/categories vì roster
 * và danh sách nhóm gần như không đổi giữa 2 lần đồng bộ (poll 150s, đổi
 * range/ngày). Dùng cho refresh định kỳ, xem getTeamRosterAction cho phần
 * roster/category riêng. */
export interface TeamBoardTasks {
  tasks: Task[];
  monthProgress: { done: number; total: number };
  chart: DailyAssigneeCount[];
  accountNicheChart: AccountNicheMonthCount[];
  products: string[];
  dayCategoryCounts: MonthDayCategoryCount[];
  needsBgdOverview?: false;
}

/** `calendarYearMonth` tách khỏi `range` — lịch mini/biểu đồ/tiến độ tháng
 *  giờ hiển thị đúng tháng đang XEM trên lịch (chỉ đổi khi bấm ‹/›), có thể
 *  khác tháng của `range` (ngày đang chọn để xem task, đổi khi bấm 1 ngày
 *  bất kỳ) — xem TaskCalendar/task-board.tsx. */
async function loadTeamBoardTasks(
  teamId: number,
  range: DateRange,
  calendarYearMonth: string,
  categoryId?: number | null
): Promise<TeamBoardTasks> {
  const yearMonth = calendarYearMonth;
  const [tasks, monthProgress, chart, accountNicheChart, products, dayCategoryCounts] = await Promise.all([
    listTasksForTeam(teamId, { fromDate: range.fromDate, toDate: range.toDate, categoryId: categoryId ?? undefined }),
    getMonthProgress(teamId, yearMonth),
    // Biểu đồ luôn theo cả tháng chứa range đang xem — không theo đúng range
    // (ngày lẻ) — vì "1 ngày" trên bảng vẫn cần "1 tháng" trên biểu đồ cuối
    // bảng (xem AssigneeBarChart ở task-board.tsx).
    getDailyAssigneeBreakdown(teamId, yearMonth),
    getAccountNicheBreakdown(teamId, yearMonth),
    getDistinctProductsForTeam(teamId),
    getMonthTaskCategoryCounts(teamId, yearMonth),
  ]);
  return { tasks, monthProgress, chart, accountNicheChart, products, dayCategoryCounts };
}

/** Thành viên/quản lý đồng bộ lại đúng đội của mình; BGĐ chưa gắn đội nào thì
 *  báo cho UI tự chuyển sang view gộp thay vì throw. */
export async function getMyTeamBoardTasksAction(
  range: DateRange,
  calendarYearMonth: string,
  categoryId?: number | null
): Promise<TeamBoardTasks | NeedsBgdOverview> {
  const session = await requireSession();
  assertValidRange(range);
  assertValidYearMonth(calendarYearMonth);
  const teamId = await findTeamIdByUserId(session.userId);

  if (!teamId) {
    if (session.tier === 'full') return { needsBgdOverview: true };
    throw new Error('Bạn chưa thuộc đội nào.');
  }
  return loadTeamBoardTasks(teamId, range, calendarYearMonth, categoryId);
}

export interface TeamRosterAndCategories {
  team: TeamWithRoster;
  categories: TeamTaskCategory[];
  isManager: boolean;
}

/** Roster + danh sách nhóm của 1 đội — chỉ cần đồng bộ lại sau thao tác
 *  thêm/xoá thành viên, đổi vai trò/nhóm hoặc CRUD category, không phải mỗi
 *  lần poll board. */
export async function getTeamRosterAction(explicitTeamId: number): Promise<TeamRosterAndCategories> {
  const { userId, teamId, isBgd } = await requireTeamContext(explicitTeamId);
  const [team, categories] = await Promise.all([getTeamWithRoster(teamId), listTeamCategories(teamId)]);
  if (!team) throw new Error('Không tìm thấy đội.');
  const isManager = isBgd || team.members.some((member) => member.userId === userId && member.role === 'manager');
  return { team, categories, isManager };
}

export interface AllTeamsOverview {
  teams: TeamSummary[];
  monthProgress: TeamMonthProgress[];
  departments: DepartmentGroup[];
}

export async function getAllTeamsOverviewAction(yearMonth: string, today: string): Promise<AllTeamsOverview> {
  await requireBgd();
  assertValidYearMonth(yearMonth);
  const [teams, monthProgress, departments] = await Promise.all([
    listAllTeamsSummary(),
    getAllTeamsMonthProgress(yearMonth, today),
    listUsersOutsideTeamsByDepartment(yearMonth),
  ]);
  return { teams, monthProgress, departments };
}

/** Xem bảng 1 đội cụ thể với tư cách BGĐ (không đổi đội của chính BGĐ). */
export async function getTeamBoardTasksAsBgdAction(
  teamId: number,
  range: DateRange,
  calendarYearMonth: string,
  categoryId?: number | null
): Promise<TeamBoardTasks> {
  await requireBgd();
  assertValidRange(range);
  assertValidYearMonth(calendarYearMonth);
  return loadTeamBoardTasks(teamId, range, calendarYearMonth, categoryId);
}

function assertValidRange(range: DateRange) {
  if (!isValidDateString(range.fromDate) || !isValidDateString(range.toDate)) {
    throw new Error('Khoảng ngày không hợp lệ.');
  }
  if (range.fromDate > range.toDate) {
    throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
  }
  const days = (Date.parse(range.toDate) - Date.parse(range.fromDate)) / 86_400_000;
  if (days > 366) {
    throw new Error('Khoảng ngày tối đa 366 ngày.');
  }
}

function assertValidYearMonth(yearMonth: string) {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error('Tháng không hợp lệ.');
  }
}

/** So khớp round-trip (không chỉ regex + Date.parse) — Date.parse('2026-02-31')
 *  tự nhảy sang 03/03 thay vì báo lỗi, nên phải parse rồi format lại và so
 *  sánh đúng chuỗi gốc mới bắt được ngày không tồn tại. */
function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function assertValidDateString(value: string, label: string) {
  if (!isValidDateString(value)) {
    throw new Error(`${label} không hợp lệ.`);
  }
}

export interface PersonalBoard {
  tasks: Task[];
  monthProgress: { done: number; total: number };
  monthDayCounts: MonthDayCategoryCount[];
}

/** Người tự quản lý task cá nhân của chính mình — owner luôn là
 *  session.userId, KHÔNG nhận từ client (khác board đội KD, tránh 1 lớp có
 *  thể bị giả mạo). */
export async function getMyPersonalBoardAction(range: DateRange, calendarYearMonth: string): Promise<PersonalBoard> {
  const session = await requireSession();
  assertValidRange(range);
  assertValidYearMonth(calendarYearMonth);
  const today = todayIso();
  const [tasks, monthProgress, monthDayCounts] = await Promise.all([
    listTasksForOwner(session.userId, range, today),
    getPersonalMonthProgress(session.userId, calendarYearMonth),
    getPersonalMonthDayCounts(session.userId, calendarYearMonth),
  ]);
  return { tasks, monthProgress, monthDayCounts };
}

export interface TeammateWithTaskCount extends Teammate {
  /** Tổng số task cá nhân của người này (mọi ngày, mọi trạng thái). */
  taskCount: number;
}

/** Đồng đội cùng `team_label` với chính mình (vd 3 người IT "Development
 *  Team") kèm tổng số task — dùng cho mục "Đồng đội" dưới board Task của tôi. */
export async function listMyTeammatesAction(): Promise<TeammateWithTaskCount[]> {
  const session = await requireSession();
  const mates = await listTeammatesByLabel(session.userId);
  const counts = await Promise.all(mates.map((mate) => countAllPersonalTasks(mate.userId)));
  return mates.map((mate, i) => ({ ...mate, taskCount: counts[i] }));
}

/** Board Kanban gộp của chính mình + toàn bộ đồng đội cùng `team_label` (vd 3
 *  người IT "Development Team") vào 1 danh sách task duy nhất — mỗi task vẫn
 *  giữ nguyên owner_user_id thật của nó (task.ownerUserId) để UI hiện đúng
 *  icon người phụ trách. Chặn quyền như requirePersonalTaskContext: chỉ người
 *  ngoài 6 đội KD, không phải BGĐ. */
export async function getMergedTeamBoardAction(
  range: DateRange,
  calendarYearMonth: string
): Promise<{ tasks: Task[]; dayCounts: DailyAssigneeCount[] }> {
  const session = await requireSession();
  assertValidRange(range);
  assertValidYearMonth(calendarYearMonth);
  const [ownTeamId, self, mates] = await Promise.all([
    findTeamIdByUserId(session.userId),
    findUserById(session.userId),
    listTeammatesByLabel(session.userId),
  ]);
  if (ownTeamId !== null || !self || self.department === 'bgd') {
    throw new Error('Bạn không thuộc diện quản lý task cá nhân theo nhóm.');
  }
  const ownerUserIds = [session.userId, ...mates.map((mate) => mate.userId)];
  const today = todayIso();
  const [tasks, dayCounts] = await Promise.all([
    listTasksForOwners(ownerUserIds, range, today),
    getGroupDailyMemberCounts(ownerUserIds, calendarYearMonth),
  ]);
  return { tasks, dayCounts };
}

export interface DepartmentBoardMember {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
}

/** BGĐ mở board Kanban gộp của cả 1 phòng ban ngoài 6 đội KD (vd "IT /
 *  Development") từ thẻ ở khối "Bộ phận khác" — cùng dữ liệu task với
 *  getMergedTeamBoardAction nhưng phạm vi người do BGĐ chỉ định (department),
 *  không suy ra từ session.userId. */
export async function getMergedDepartmentBoardAsBgdAction(
  department: Department,
  range: DateRange,
  calendarYearMonth: string
): Promise<{ tasks: Task[]; members: DepartmentBoardMember[]; dayCounts: DailyAssigneeCount[] }> {
  await requireBgd();
  assertValidRange(range);
  assertValidYearMonth(calendarYearMonth);
  const members = await findOutsideTeamUsersByDepartment(department);
  const ownerUserIds = members.map((member) => member.userId);
  const today = todayIso();
  const [tasks, dayCounts] = await Promise.all([
    listTasksForOwners(ownerUserIds, range, today),
    getGroupDailyMemberCounts(ownerUserIds, calendarYearMonth),
  ]);
  return { tasks, members, dayCounts };
}

/** BGĐ hoặc 1 đồng đội cùng `team_label` xem/sửa board cá nhân của người
 *  khác (xem hộ hoặc giao task hộ) — quyền chặn ở requirePersonalTaskContext. */
export async function getPersonalBoardAsBgdAction(
  ownerUserId: number,
  range: DateRange,
  calendarYearMonth: string
): Promise<PersonalBoard> {
  await requirePersonalTaskContext(ownerUserId);
  assertValidRange(range);
  assertValidYearMonth(calendarYearMonth);
  const today = todayIso();
  const [tasks, monthProgress, monthDayCounts] = await Promise.all([
    listTasksForOwner(ownerUserId, range, today),
    getPersonalMonthProgress(ownerUserId, calendarYearMonth),
    getPersonalMonthDayCounts(ownerUserId, calendarYearMonth),
  ]);
  return { tasks, monthProgress, monthDayCounts };
}

/** Patch: chỉ validate field thực sự có mặt (title/taskDate/status đều optional
 *  khi sửa 1 phần). */
function assertValidPersonalTaskInput(input: PersonalTaskInput | PersonalTaskPatch) {
  if ('title' in input && input.title !== undefined && !input.title.trim()) {
    throw new Error('Tiêu đề không được để trống.');
  }
  if (input.taskDate !== undefined && !isValidDateString(input.taskDate)) {
    throw new Error('Ngày không hợp lệ.');
  }
  if (input.dueDate !== undefined && input.dueDate !== null && !isValidDateString(input.dueDate)) {
    throw new Error('Ngày kết thúc không hợp lệ.');
  }
  if (input.status !== undefined && !['not_started', 'in_progress', 'done'].includes(input.status)) {
    throw new Error('Trạng thái không hợp lệ.');
  }
  if (input.priority !== undefined && !['low', 'normal', 'high'].includes(input.priority)) {
    throw new Error('Mức độ ưu tiên không hợp lệ.');
  }
  if (input.description !== undefined && input.description !== null && input.description.length > 10_000) {
    throw new Error('Mô tả tối đa 10.000 ký tự.');
  }
}

/** Tạo mới: title/taskDate bắt buộc phải thật sự có giá trị hợp lệ — type
 *  PersonalTaskInput chỉ ép ở compile time, request thô gửi {} vẫn qua được
 *  assertValidPersonalTaskInput (mọi field ở đó đều "chỉ kiểm khi có mặt"). */
function assertValidPersonalTaskCreateInput(input: PersonalTaskInput) {
  if (!input.title || !input.title.trim()) {
    throw new Error('Tiêu đề không được để trống.');
  }
  if (!isValidDateString(input.taskDate)) {
    throw new Error('Ngày không hợp lệ.');
  }
  if (input.status !== undefined && !['not_started', 'in_progress', 'done'].includes(input.status)) {
    throw new Error('Trạng thái không hợp lệ.');
  }
  if (input.dueDate && input.dueDate < input.taskDate) {
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
  }
  assertValidPersonalTaskInput(input);
}

export async function createPersonalTaskAction(ownerUserId: number, input: PersonalTaskInput): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  assertValidPersonalTaskCreateInput(input);
  const created = await createPersonalTask(ownerUserId, input, session.userId);
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.create', ownerUserId, { docId: String(created.id) });
  }
  return created;
}

/** Tạo task thường hoặc cả chuỗi lặp qua đúng một Server Action và một câu
 * SQL set-based. `createPersonalTasks` tự ghi history + audit BGĐ cùng câu. */
export async function createPersonalTasksAction(ownerUserId: number, inputs: PersonalTaskInput[]): Promise<Task[]> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  if (inputs.length < 1 || inputs.length > 52) {
    throw new Error('Số task tạo cùng lúc phải từ 1 đến 52.');
  }
  inputs.forEach(assertValidPersonalTaskCreateInput);
  return createPersonalTasks(ownerUserId, inputs, session.userId);
}

export async function updatePersonalTaskAction(ownerUserId: number, taskId: number, patch: PersonalTaskPatch): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  assertValidPersonalTaskInput(patch);
  // Chỉ cần đọc hàng hiện tại khi patch đổi đúng một trong hai đầu mút ngày.
  // Đổi title/status/priority phổ biến đi thẳng vào UPDATE CTE, bớt 1 round-trip.
  const changesTaskDate = patch.taskDate !== undefined;
  const changesDueDate = patch.dueDate !== undefined;
  if (changesTaskDate || changesDueDate) {
    let effectiveTaskDate = patch.taskDate;
    let effectiveDueDate = patch.dueDate;
    if (changesTaskDate !== changesDueDate) {
      const before = await getPersonalTaskById(taskId, ownerUserId);
      if (!before) throw new Error('Không tìm thấy task.');
      effectiveTaskDate ??= before.taskDate;
      if (!changesDueDate) effectiveDueDate = before.dueDate;
    }
    if (effectiveDueDate && effectiveTaskDate && effectiveDueDate < effectiveTaskDate) {
      throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
    }
  }
  const updated = await updatePersonalTask(taskId, ownerUserId, patch, session.userId, todayIso());
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.update', ownerUserId, { docId: String(taskId) });
  }
  return updated;
}

export async function deletePersonalTaskAction(ownerUserId: number, taskId: number): Promise<void> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  const existing = await getPersonalTaskById(taskId, ownerUserId);
  if (!existing) throw new Error('Không tìm thấy task.');
  // Sửa/cập nhật thì cả nhóm (self/BGĐ/đồng đội, xem requirePersonalTaskContext)
  // đều làm được, nhưng XOÁ chỉ đúng người đã tạo/giao task đó mới được — kể
  // cả chính chủ task cũng không xoá được task do người khác giao cho mình.
  // createdBy luôn được set = actor lúc tạo (xem createPersonalTask), fallback
  // về owner chỉ để phòng dữ liệu cũ thiếu created_by.
  const creatorId = existing.createdBy ?? ownerUserId;
  if (session.userId !== creatorId) {
    throw new Error('Chỉ người đã tạo/giao task này mới được xoá.');
  }
  await deletePersonalTask(taskId, ownerUserId);
  await Promise.all(existing.imageUrls.map((url) => deleteStorageFile(url)));
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.delete', ownerUserId, { docId: String(taskId) });
  }
}

export async function duplicatePersonalTaskAction(ownerUserId: number, taskId: number, toDate: string): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  assertValidDateString(toDate, 'Ngày nhân bản');
  const created = await duplicatePersonalTask(taskId, ownerUserId, toDate, session.userId);
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.duplicate', ownerUserId, { docId: String(taskId) });
  }
  return created;
}

const PERSONAL_TASK_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PERSONAL_TASK_IMAGES_MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const PERSONAL_TASK_IMAGES_MAX_COUNT = 10;

/** Đọc magic bytes thay vì tin `file.type` (client tự khai, giả mạo được) —
 *  đây là nguồn sự thật duy nhất cho loại ảnh thật sự nằm trong file. */
function sniffPersonalTaskImageType(buffer: Buffer): { ext: 'jpg' | 'png' | 'webp'; mime: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export async function getPersonalTaskDetailAction(ownerUserId: number, taskId: number): Promise<PersonalTaskDetail> {
  await requirePersonalTaskContext(ownerUserId);
  const detail = await getPersonalTaskDetail(taskId, ownerUserId);
  if (!detail) throw new Error('Không tìm thấy task.');
  return detail;
}

export async function addPersonalTaskCommentAction(
  ownerUserId: number,
  taskId: number,
  content: string
): Promise<PersonalTaskComment> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  const normalized = content.trim();
  if (!normalized) throw new Error('Bình luận không được để trống.');
  if (normalized.length > 2_000) throw new Error('Bình luận tối đa 2.000 ký tự.');
  const comment = await addPersonalTaskComment(taskId, ownerUserId, session.userId, normalized);
  return comment;
}

export async function uploadPersonalTaskImageAction(
  ownerUserId: number,
  taskId: number,
  formData: FormData
): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  const existing = await getPersonalTaskById(taskId, ownerUserId);
  if (!existing) throw new Error('Không tìm thấy task.');
  const files = formData.getAll('files').filter((value): value is File => value instanceof File);
  const legacyFile = formData.get('file');
  if (files.length === 0 && legacyFile instanceof File) files.push(legacyFile);
  if (files.length === 0) throw new Error('Thiếu file ảnh.');
  if (existing.imageUrls.length + files.length > PERSONAL_TASK_IMAGES_MAX_COUNT) {
    throw new Error(`Mỗi task được thêm tối đa ${PERSONAL_TASK_IMAGES_MAX_COUNT} ảnh.`);
  }
  if (files.some((file) => file.size > PERSONAL_TASK_IMAGE_MAX_BYTES)) {
    throw new Error('Mỗi ảnh không được vượt quá 5MB.');
  }
  if (files.reduce((total, file) => total + file.size, 0) > PERSONAL_TASK_IMAGES_MAX_TOTAL_BYTES) {
    throw new Error('Tổng dung lượng ảnh mỗi lần tải không được vượt quá 20MB.');
  }

  const prepared = await Promise.all(files.map(async (file) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffPersonalTaskImageType(buffer);
    if (!sniffed) throw new Error('Chỉ nhận ảnh JPEG, PNG hoặc WebP.');
    return { buffer, ...sniffed };
  }));
  const uploadedUrls: string[] = [];
  try {
    for (const [index, image] of prepared.entries()) {
      const { url } = await uploadStorageFile(
        `personal-tasks/${ownerUserId}/${taskId}-${Date.now()}-${index}-${randomUUID()}.${image.ext}`,
        new Blob([image.buffer], { type: image.mime }),
        image.mime
      );
      uploadedUrls.push(url);
    }
    return await addPersonalTaskImageUrls(taskId, ownerUserId, uploadedUrls, session.userId);
  } catch (error) {
    await Promise.all(uploadedUrls.map((url) => deleteStorageFile(url)));
    throw error;
  }
}

export async function removePersonalTaskImageAction(ownerUserId: number, taskId: number, imageUrl: string): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  const existing = await getPersonalTaskById(taskId, ownerUserId);
  if (!existing) throw new Error('Không tìm thấy task.');
  if (!existing.imageUrls.includes(imageUrl)) throw new Error('Không tìm thấy ảnh trong task.');
  const updated = await removePersonalTaskImageUrl(taskId, ownerUserId, imageUrl, session.userId);
  await deleteStorageFile(imageUrl);
  return updated;
}

export async function addTeamMemberAction(teamId: number, userId: number): Promise<void> {
  const actor = await requireManagerContext(teamId);
  if (await hasPersonalTasks(userId)) {
    throw new Error('Người này còn task cá nhân chưa xử lý, không thể thêm vào đội.');
  }
  await addTeamMember(actor.teamId, userId, 'member', actor.userId);
  await logAdminAction(actor.userId, 'team_member.add', userId, { docId: String(actor.teamId) });
}

export async function addTeamMemberAsAdminAction(teamId: number, userId: number, role: TeamMemberRole): Promise<void> {
  const admin = await requireBgd();
  if (await hasPersonalTasks(userId)) {
    throw new Error('Người này còn task cá nhân chưa xử lý, không thể thêm vào đội.');
  }
  await addTeamMember(teamId, userId, role, admin.userId);
  await logAdminAction(admin.userId, 'team_member.add', userId, { docId: String(teamId), note: role });
}

export async function removeTeamMemberAction(teamId: number, userId: number): Promise<void> {
  const actor = await requireManagerContext(teamId);
  await removeTeamMember(actor.teamId, userId);
  await logAdminAction(actor.userId, 'team_member.remove', userId, { docId: String(actor.teamId) });
}

export async function setMemberRoleAction(teamId: number, userId: number, role: TeamMemberRole): Promise<void> {
  const actor = await requireManagerContext(teamId);
  await setMemberRole(actor.teamId, userId, role);
  await logAdminAction(actor.userId, 'team_member.role_change', userId, { docId: String(actor.teamId), note: role });
}

export async function setMemberCategoryAction(teamId: number, userId: number, categoryId: number | null): Promise<void> {
  const actor = await requireManagerContext(teamId);
  await setMemberCategory(actor.teamId, userId, categoryId);
  await logAdminAction(actor.userId, 'team_member.category_change', userId, {
    docId: String(actor.teamId),
    note: categoryId === null ? undefined : String(categoryId),
  });
}

export async function listAddableUsersAction(teamId: number): Promise<{ id: number; fullName: string; username: string }[]> {
  await requireManagerContext(teamId);
  return listActiveUsersNotInAnyTeam();
}

export async function createTeamCategoryAction(teamId: number, name: string, visibleColumns: string[]): Promise<TeamTaskCategory> {
  const actor = await requireManagerContext(teamId);
  const category = await createTeamCategory(actor.teamId, name, visibleColumns, actor.userId);
  await logAdminAction(actor.userId, 'team_category.create', null, { docId: String(category.id), note: name });
  return category;
}

export async function updateTeamCategoryAction(
  teamId: number,
  categoryId: number,
  patch: { name?: string; visibleColumns?: string[]; sortOrder?: number }
): Promise<TeamTaskCategory> {
  const actor = await requireManagerContext(teamId);
  const category = await updateTeamCategory(categoryId, actor.teamId, patch);
  await logAdminAction(actor.userId, 'team_category.update', null, { docId: String(categoryId) });
  return category;
}

export async function deleteTeamCategoryAction(teamId: number, categoryId: number): Promise<void> {
  const actor = await requireManagerContext(teamId);
  await deleteTeamCategory(categoryId, actor.teamId);
  await logAdminAction(actor.userId, 'team_category.delete', null, { docId: String(categoryId) });
}

function assertValidTaskInput(input: TaskInput | TaskPatch) {
  if ('title' in input && input.title !== undefined && !input.title.trim()) {
    throw new Error('Chủ đề, đầu việc không được để trống.');
  }
  if (input.taskDate !== undefined && Number.isNaN(Date.parse(input.taskDate))) {
    throw new Error('Ngày không hợp lệ.');
  }
  if (input.status !== undefined && !['not_started', 'in_progress', 'done'].includes(input.status)) {
    throw new Error('Trạng thái không hợp lệ.');
  }
}

export async function createTaskAction(teamId: number, input: TaskInput): Promise<Task> {
  const actor = await requireTeamContext(teamId);
  assertValidTaskInput(input);
  return createTask(actor.teamId, input, actor.userId);
}

export async function updateTaskAction(teamId: number, taskId: number, patch: TaskPatch): Promise<Task> {
  const actor = await requireTeamContext(teamId);
  assertValidTaskInput(patch);
  return updateTask(taskId, actor.teamId, patch);
}

export async function deleteTaskAction(teamId: number, taskId: number): Promise<void> {
  const actor = await requireTeamContext(teamId);
  await deleteTask(taskId, actor.teamId);
}

/** Kéo-thả đổi thứ tự task trong bảng Giao Task — `orderedTaskIds` là ID theo
 *  đúng thứ tự hiển thị mới của 1 nhóm (xem reorderTasks ở lib/tasks.ts). */
export async function reorderTasksAction(teamId: number, orderedTaskIds: number[]): Promise<void> {
  const actor = await requireTeamContext(teamId);
  await reorderTasks(actor.teamId, orderedTaskIds);
}

// Next.js xoá message gốc của lỗi throw ra khỏi Server Action ở production
// (chỉ giữ lại digest, tránh lộ chi tiết server) — kể cả lỗi validate cố ý
// viết cho người dùng đọc (vd "vượt quá 60 bản"). Bắt riêng
// BulkDuplicateValidationError và trả qua giá trị return (không throw qua
// ranh giới server->client) thì message mới tới được người dùng nguyên vẹn;
// lỗi thật ngoài dự kiến vẫn throw như cũ để không lộ chi tiết nhạy cảm.
export async function duplicateTasksToDatesAction(
  teamId: number,
  taskIds: number[],
  dates: string[],
  assigneeUserIds: number[]
): Promise<{ tasks: Task[] } | { error: string }> {
  const actor = await requireTeamContext(teamId);
  try {
    const tasks = await duplicateTasksToDates(taskIds, actor.teamId, dates, assigneeUserIds, actor.userId);
    return { tasks };
  } catch (err) {
    if (err instanceof BulkDuplicateValidationError) return { error: err.message };
    throw err;
  }
}

export async function bulkDuplicateTasksAction(
  teamId: number,
  taskIds: number[],
  pattern: BulkDuplicatePattern,
  assigneeUserIds: number[]
): Promise<{ tasks: Task[] } | { error: string }> {
  const actor = await requireManagerContext(teamId);
  try {
    const tasks = await bulkDuplicateTasks(taskIds, actor.teamId, pattern, assigneeUserIds, actor.userId);
    return { tasks };
  } catch (err) {
    if (err instanceof BulkDuplicateValidationError) return { error: err.message };
    throw err;
  }
}
