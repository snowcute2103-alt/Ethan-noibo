'use server';

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
import { hashPassword, generatePassword } from '@/lib/password';
import { grantPermission, revokePermission } from '@/lib/rule-permissions';
import { logAdminAction } from '@/lib/audit';
import { DEPARTMENTS } from '@/lib/roles';
import type { Department, Tier } from '@/lib/roles';

async function requireAdmin() {
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

/** Độ dài mật khẩu tối thiểu — dài hơn hẳn cho tier full (BGĐ), khớp Phase 3. */
function passwordLengthFor(tier: Tier): number {
  return tier === 'full' ? 20 : 12;
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

export async function unlockUserAction(username: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await unlockUser(username);
  await logAdminAction(admin.userId, 'user.unlock', null, { note: username });
  return { ok: true };
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
