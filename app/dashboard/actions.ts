'use server';

import { put, del } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import { findUserById, updateUser } from '@/lib/users';
import { logAdminAction } from '@/lib/audit';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Cho phép user tự đổi avatar của chính mình — id luôn lấy từ session (không
 * nhận id từ client) nên không thể đổi avatar của người khác.
 */
export async function updateOwnAvatarAction(formData: FormData): Promise<{ avatarUrl: string }> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');

  const before = await findUserById(session.userId);
  if (!before) throw new Error('Không tìm thấy user.');

  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Thiếu file ảnh.');
  const ext = AVATAR_TYPES[file.type];
  if (!ext) throw new Error('Chỉ nhận ảnh JPEG, PNG hoặc WebP.');
  if (file.size > AVATAR_MAX_BYTES) throw new Error('Ảnh vượt quá 5MB.');

  const blob = await put(`avatars/${session.userId}-${Date.now()}.${ext}`, file, { access: 'public' });

  if (before.avatarUrl?.includes('.public.blob.vercel-storage.com')) {
    await del(before.avatarUrl).catch(() => {});
  }

  await updateUser(session.userId, { avatarUrl: blob.url });
  await logAdminAction(session.userId, 'user.update', session.userId, { changedFields: ['avatarUrl'] });

  return { avatarUrl: blob.url };
}
