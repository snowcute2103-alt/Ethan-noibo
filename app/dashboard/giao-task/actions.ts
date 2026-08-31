'use server';

import { getSession } from '@/lib/auth';
import { findUserById } from '@/lib/users';
import { logAdminAction } from '@/lib/audit';
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
  type TeamMemberRole,
  type TeamWithRoster,
  type TeamSummary,
  type TeamTaskCategory,
  type DepartmentGroup,
} from '@/lib/teams';
import {
  listTasksForTeam,
  createTask,
  updateTask,
  deleteTask,
  duplicateTasksToDates,
  bulkDuplicateTasks,
  getMonthProgress,
  getMonthTaskCategoryCounts,
  getDailyAssigneeBreakdown,
  getAllTeamsMonthProgress,
  listTasksForOwner,
  createPersonalTask,
  getPersonalTaskById,
  updatePersonalTask,
  deletePersonalTask,
  duplicatePersonalTask,
  getPersonalMonthProgress,
  getPersonalMonthDayCounts,
  hasPersonalTasks,
  type Task,
  type TaskInput,
  type TaskPatch,
  type PersonalTaskInput,
  type PersonalTaskPatch,
  type BulkDuplicatePattern,
  type DailyAssigneeCount,
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

/** Task cá nhân: chỉ chính chủ hoặc BGĐ, và chỉ khi ownerUserId thực sự là
 *  người ngoài 6 đội KD (không thuộc team_members, không phải BGĐ) — thiếu
 *  vế sau thì bất kỳ user đã đăng nhập nào (kể cả thành viên đội KD) đều tạo
 *  được task cá nhân cho chính mình, sinh dữ liệu team_id=NULL không màn
 *  hình nào hiển thị. */
async function requirePersonalTaskContext(ownerUserId: number): Promise<{ session: Session }> {
  const session = await requireSession();
  const isSelf = session.userId === ownerUserId;
  const isBgd = session.tier === 'full';
  if (!isSelf && !isBgd) {
    throw new Error('Bạn không có quyền xem/sửa task cá nhân của người khác.');
  }
  const [ownerTeamId, owner] = await Promise.all([findTeamIdByUserId(ownerUserId), findUserById(ownerUserId)]);
  if (ownerTeamId !== null || !owner || owner.department === 'bgd') {
    throw new Error('Người này không thuộc diện quản lý task cá nhân (đang ở 1 đội KD hoặc là BGĐ).');
  }
  return { session };
}

export interface MyTeamBoard {
  team: TeamWithRoster;
  categories: TeamTaskCategory[];
  tasks: Task[];
  isManager: boolean;
  monthProgress: { done: number; total: number };
  chart: DailyAssigneeCount[];
  needsBgdOverview?: false;
}

export interface NeedsBgdOverview {
  needsBgdOverview: true;
}

/** Thành viên/quản lý xem đúng đội của mình; BGĐ chưa gắn đội nào thì báo
 *  cho UI tự chuyển sang view gộp thay vì throw. */
export async function getMyTeamBoardAction(
  range: DateRange,
  categoryId?: number | null
): Promise<MyTeamBoard | NeedsBgdOverview> {
  const session = await requireSession();
  assertValidRange(range);
  const teamId = await findTeamIdByUserId(session.userId);

  if (!teamId) {
    if (session.tier === 'full') return { needsBgdOverview: true };
    throw new Error('Bạn chưa thuộc đội nào.');
  }

  // team không phụ thuộc các query còn lại (chỉ cần teamId) — gộp chung 1
  // Promise.all thay vì await riêng trước rồi mới chạy song song phần sau,
  // tránh round-trip của team chặn cả chuỗi tải trang.
  const [team, categories, tasks, isManager, monthProgress, chart] = await Promise.all([
    getTeamWithRoster(teamId),
    listTeamCategories(teamId),
    listTasksForTeam(teamId, { fromDate: range.fromDate, toDate: range.toDate, categoryId: categoryId ?? undefined }),
    isTeamManager(teamId, session.userId),
    getMonthProgress(teamId, range.fromDate.slice(0, 7)),
    getDailyAssigneeBreakdown(teamId, range.fromDate, range.toDate),
  ]);
  if (!team) throw new Error('Không tìm thấy đội.');

  return { team, categories, tasks, isManager, monthProgress, chart };
}

export interface AllTeamsOverview {
  teams: TeamSummary[];
  monthProgress: TeamMonthProgress[];
}

export async function getAllTeamsOverviewAction(yearMonth: string, today: string): Promise<AllTeamsOverview> {
  await requireBgd();
  assertValidYearMonth(yearMonth);
  const [teams, monthProgress] = await Promise.all([listAllTeamsSummary(), getAllTeamsMonthProgress(yearMonth, today)]);
  return { teams, monthProgress };
}

/** Xem bảng 1 đội cụ thể với tư cách BGĐ (không đổi đội của chính BGĐ). */
export async function getTeamBoardAsBgdAction(teamId: number, range: DateRange, categoryId?: number | null): Promise<MyTeamBoard> {
  await requireBgd();
  assertValidRange(range);
  const [team, categories, tasks, monthProgress, chart] = await Promise.all([
    getTeamWithRoster(teamId),
    listTeamCategories(teamId),
    listTasksForTeam(teamId, { fromDate: range.fromDate, toDate: range.toDate, categoryId: categoryId ?? undefined }),
    getMonthProgress(teamId, range.fromDate.slice(0, 7)),
    getDailyAssigneeBreakdown(teamId, range.fromDate, range.toDate),
  ]);
  if (!team) throw new Error('Không tìm thấy đội.');

  return { team, categories, tasks, isManager: true, monthProgress, chart };
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
}

/** Người tự quản lý task cá nhân của chính mình — owner luôn là
 *  session.userId, KHÔNG nhận từ client (khác board đội KD, tránh 1 lớp có
 *  thể bị giả mạo). */
export async function getMyPersonalBoardAction(range: DateRange): Promise<PersonalBoard> {
  const session = await requireSession();
  assertValidRange(range);
  const [tasks, monthProgress] = await Promise.all([
    listTasksForOwner(session.userId, range),
    getPersonalMonthProgress(session.userId, range.fromDate.slice(0, 7)),
  ]);
  return { tasks, monthProgress };
}

/** BGĐ xem board cá nhân của 1 người khác (xem hộ). */
export async function getPersonalBoardAsBgdAction(ownerUserId: number, range: DateRange): Promise<PersonalBoard> {
  await requireBgd();
  assertValidRange(range);
  const [tasks, monthProgress] = await Promise.all([
    listTasksForOwner(ownerUserId, range),
    getPersonalMonthProgress(ownerUserId, range.fromDate.slice(0, 7)),
  ]);
  return { tasks, monthProgress };
}

/** Số task theo ngày trong tháng cho lịch mini ở board cá nhân — cùng vai trò
 *  với getMonthTaskCategoryCountsAction bên đội KD, dùng chung component
 *  TaskCalendar. Owner luôn qua requirePersonalTaskContext (chính chủ hoặc
 *  BGĐ xem hộ), không nhận trực tiếp từ client. */
export async function getMyPersonalMonthDayCountsAction(ownerUserId: number, yearMonth: string): Promise<MonthDayCategoryCount[]> {
  await requirePersonalTaskContext(ownerUserId);
  assertValidYearMonth(yearMonth);
  return getPersonalMonthDayCounts(ownerUserId, yearMonth);
}

/** Danh sách người ngoài 6 đội gom theo bộ phận, chỉ BGĐ xem được. */
export async function getDepartmentsOverviewAction(yearMonth: string): Promise<DepartmentGroup[]> {
  await requireBgd();
  assertValidYearMonth(yearMonth);
  return listUsersOutsideTeamsByDepartment(yearMonth);
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
  if (input.status !== undefined && !['not_started', 'in_progress', 'done'].includes(input.status)) {
    throw new Error('Trạng thái không hợp lệ.');
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

export async function updatePersonalTaskAction(ownerUserId: number, taskId: number, patch: PersonalTaskPatch): Promise<Task> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  assertValidPersonalTaskInput(patch);
  const updated = await updatePersonalTask(taskId, ownerUserId, patch);
  if (session.userId !== ownerUserId) {
    await logAdminAction(session.userId, 'personal_task.update', ownerUserId, { docId: String(taskId) });
  }
  return updated;
}

export async function deletePersonalTaskAction(ownerUserId: number, taskId: number): Promise<void> {
  const { session } = await requirePersonalTaskContext(ownerUserId);
  const existing = await getPersonalTaskById(taskId, ownerUserId);
  if (!existing) throw new Error('Không tìm thấy task.');
  await deletePersonalTask(taskId, ownerUserId);
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

/** Số task theo ngày, chia theo từng nhóm — cho lịch mini ở sidebar vừa tô
 *  màu vừa hiện số lượng riêng từng nhóm (Media/Support...) trên mỗi ô ngày. */
export async function getMonthTaskCategoryCountsAction(teamId: number, yearMonth: string): Promise<MonthDayCategoryCount[]> {
  const actor = await requireTeamContext(teamId);
  return getMonthTaskCategoryCounts(actor.teamId, yearMonth);
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

export async function duplicateTasksToDatesAction(
  teamId: number,
  taskIds: number[],
  dates: string[],
  assigneeUserIds: number[]
): Promise<Task[]> {
  const actor = await requireTeamContext(teamId);
  return duplicateTasksToDates(taskIds, actor.teamId, dates, assigneeUserIds, actor.userId);
}

export async function bulkDuplicateTasksAction(
  teamId: number,
  taskIds: number[],
  pattern: BulkDuplicatePattern,
  assigneeUserIds: number[]
): Promise<Task[]> {
  const actor = await requireManagerContext(teamId);
  return bulkDuplicateTasks(taskIds, actor.teamId, pattern, assigneeUserIds, actor.userId);
}
