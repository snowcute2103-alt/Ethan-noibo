'use server';

import { put, del } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import {
  createUser,
  updateUser,
  updatePasswordHash,
  unlockUser,
  bumpSessionVersion,
  countActiveFullTier,
  findUserById,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/users';
import { hashPassword, generatePassword, passwordLengthFor } from '@/lib/password';
import { grantPermission, revokePermission } from '@/lib/rule-permissions';
import { logAdminAction, listAuditLogForUser, type AuditLogEntry } from '@/lib/audit';
import { findResetRequestById, resolveResetRequest } from '@/lib/reset-requests';
import { DEPARTMENTS } from '@/lib/roles';
import type { Department, Tier } from '@/lib/roles';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.tier !== 'full') {
    throw new Error('Không có quyền thực hiện thao tác này.');
  }
  return session;
}

function assertValidTierForDepartment(department: Department, tier: Tier) {
  const info = DEPARTMENTS.find((d) => d.id === department);
  if (!info || !info.tiers.includes(tier)) {
    throw new Error(`Cấp "${tier}" không hợp lệ cho khối "${department}".`);
  }
}

export async function createUserAction(
  input: Omit<CreateUserInput, 'passwordHash'>
): Promise<{ username: string; password: string }> {
  const admin = await requireAdmin();
  assertValidTierForDepartment(input.department, input.tier);

  const password = generatePassword(passwordLengthFor(input.tier));
  const passwordHash = await hashPassword(password);

  const createInput: CreateUserInput = {
    ...input,
    username: input.username.trim().toLowerCase(),
    passwordHash,
  };
  const user = await createUser(createInput);

  await logAdminAction(admin.userId, 'user.create', user.id, {
    to: { username: user.username, department: user.department, tier: user.tier },
  });

  return { username: user.username, password };
}

export async function updateUserAction(
  id: number,
  input: UpdateUserInput
): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  const before = await findUserById(id);
  if (!before) throw new Error('Không tìm thấy user.');

  const nextDepartment = input.department ?? before.department;
  const nextTier = input.tier ?? before.tier;
  assertValidTierForDepartment(nextDepartment, nextTier);

  const demotingOrDeactivatingLastAdmin =
    before.tier === 'full' &&
    before.isActive &&
    ((input.tier !== undefined && input.tier !== 'full') || input.isActive === false);
  if (demotingOrDeactivatingLastAdmin) {
    const others = await countActiveFullTier(id);
    if (others === 0) {
      throw new Error('Không thể hạ quyền/vô hiệu hoá tài khoản BGĐ cuối cùng đang hoạt động.');
    }
  }

  const changedFields = Object.keys(input);
  const accessAffecting =
    input.tier !== undefined || input.department !== undefined || input.isActive !== undefined;

  await updateUser(id, input);
  if (accessAffecting) await bumpSessionVersion(id);

  await logAdminAction(admin.userId, 'user.update', id, {
    changedFields,
    from: { department: before.department, tier: before.tier, isActive: before.isActive },
    to: {
      department: nextDepartment,
      tier: nextTier,
      isActive: input.isActive ?? before.isActive,
    },
  });

  return { ok: true };
}

export async function uploadAvatarAction(id: number, formData: FormData): Promise<{ avatarUrl: string }> {
  const admin = await requireAdmin();
  const before = await findUserById(id);
  if (!before) throw new Error('Không tìm thấy user.');

  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Thiếu file ảnh.');
  const ext = AVATAR_TYPES[file.type];
  if (!ext) throw new Error('Chỉ nhận ảnh JPEG, PNG hoặc WebP.');
  if (file.size > AVATAR_MAX_BYTES) throw new Error('Ảnh vượt quá 5MB.');

  const blob = await put(`avatars/${id}-${Date.now()}.${ext}`, file, { access: 'public' });

  if (before.avatarUrl?.includes('.public.blob.vercel-storage.com')) {
    await del(before.avatarUrl).catch(() => {});
  }

  await updateUser(id, { avatarUrl: blob.url });
  await logAdminAction(admin.userId, 'user.update', id, { changedFields: ['avatarUrl'] });

  return { avatarUrl: blob.url };
}

export async function resetPasswordAction(id: number): Promise<{ password: string }> {
  const admin = await requireAdmin();
  const user = await findUserById(id);
  if (!user) throw new Error('Không tìm thấy user.');

  const password = generatePassword(passwordLengthFor(user.tier));
  const passwordHash = await hashPassword(password);
  await updatePasswordHash(id, passwordHash);
  await bumpSessionVersion(id);

  await logAdminAction(admin.userId, 'user.reset_password', id, {});

  return { password };
}

/** Duyệt 1 yêu cầu "Quên mật khẩu" từ trang login: sinh mật khẩu mới y hệt
 *  resetPasswordAction, chỉ khác là đánh dấu luôn yêu cầu đã xử lý. */
export async function approveResetRequestAction(requestId: number): Promise<{ username: string; password: string }> {
  const admin = await requireAdmin();
  const request = await findResetRequestById(requestId);
  if (!request || request.status !== 'pending') throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý.');

  const user = await findUserById(request.userId);
  if (!user) throw new Error('Không tìm thấy user.');

  const password = generatePassword(passwordLengthFor(user.tier));
  const passwordHash = await hashPassword(password);
  await updatePasswordHash(user.id, passwordHash);
  await bumpSessionVersion(user.id);
  await resolveResetRequest(requestId, 'approved', admin.userId);

  await logAdminAction(admin.userId, 'user.reset_password', user.id, { note: `request:${requestId}` });

  return { username: user.username, password };
}

export async function dismissResetRequestAction(requestId: number): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  const request = await findResetRequestById(requestId);
  if (!request || request.status !== 'pending') throw new Error('Yêu cầu không tồn tại hoặc đã được xử lý.');

  await resolveResetRequest(requestId, 'dismissed', admin.userId);
  await logAdminAction(admin.userId, 'password_reset.dismiss', request.userId, {});

  return { ok: true };
}

export async function unlockUserAction(username: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await unlockUser(username);
  await logAdminAction(admin.userId, 'user.unlock', null, { note: username });
  return { ok: true };
}

/** Áp 1 thay đổi (vd. isActive) cho nhiều user cùng lúc — dùng bởi thanh hành động
 *  hàng loạt trên bảng quản trị. Xử lý tuần tự để chặn "hạ quyền/vô hiệu hoá BGĐ
 *  cuối cùng" trong updateUserAction luôn thấy đúng số lượng còn active. */
export async function bulkUpdateUsersAction(
  ids: number[],
  input: UpdateUserInput
): Promise<{ ok: true; failed: { id: number; message: string }[] }> {
  const failed: { id: number; message: string }[] = [];
  for (const id of ids) {
    try {
      await updateUserAction(id, input);
    } catch (e) {
      failed.push({ id, message: e instanceof Error ? e.message : 'Có lỗi xảy ra.' });
    }
  }
  return { ok: true, failed };
}

/** Mở khoá đăng nhập cho nhiều user cùng lúc. */
export async function bulkUnlockUsersAction(usernames: string[]): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  for (const username of usernames) {
    await unlockUser(username);
    await logAdminAction(admin.userId, 'user.unlock', null, { note: username });
  }
  return { ok: true };
}

export async function getUserAuditLogAction(userId: number): Promise<AuditLogEntry[]> {
  await requireAdmin();
  return listAuditLogForUser(userId);
}

export async function grantPermissionAction(userId: number, docId: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await grantPermission(userId, docId, admin.userId);
  await logAdminAction(admin.userId, 'permission.grant', userId, { docId });
  return { ok: true };
}

export async function revokePermissionAction(userId: number, docId: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await revokePermission(userId, docId);
  await logAdminAction(admin.userId, 'permission.revoke', userId, { docId });
  return { ok: true };
}

/** Cấp quyền đọc 1 tài liệu cho nhiều user cùng lúc — dùng bởi thanh chọn hàng loạt. */
export async function bulkGrantPermissionAction(userIds: number[], docId: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  for (const userId of userIds) {
    await grantPermission(userId, docId, admin.userId);
    await logAdminAction(admin.userId, 'permission.grant', userId, { docId });
  }
  return { ok: true };
}

/** Thu hồi quyền đọc 1 tài liệu của nhiều user cùng lúc — dùng bởi thanh chọn hàng loạt. */
export async function bulkRevokePermissionAction(userIds: number[], docId: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  for (const userId of userIds) {
    await revokePermission(userId, docId);
    await logAdminAction(admin.userId, 'permission.revoke', userId, { docId });
  }
  return { ok: true };
}
