'use server';

import { put, del } from '@vercel/blob';
import { getSession } from '@/lib/auth';
import { findUserById, updateUser } from '@/lib/users';
import { logAdminAction } from '@/lib/audit';
import { createQuote, type Quote, type QuoteInput } from '@/lib/quotes';
import {
  listStickyNotes,
  createStickyNote,
  moveStickyNote,
  updateStickyNoteText,
  deleteStickyNote,
  toggleStickyNotePin,
  type StickyNote,
  type StickyNoteInput,
} from '@/lib/sticky-notes';

const STICKY_NOTE_TEXT_MAX_LEN = 100;

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

/** Bất kỳ nhân viên nào đã đăng nhập đều có thể góp câu nói cho widget ở trang chủ — không cần quyền admin. */
export async function createQuoteAction(input: QuoteInput): Promise<Quote> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');

  const content = input.content.trim();
  if (content.length < 3) throw new Error('Câu quá ngắn.');

  return createQuote({ content, author: input.author.trim() || 'Khuyết danh', imgUrl: null }, session.userId);
}

/** Đọc toàn bộ note của bảng ghi chú dùng chung — client poll định kỳ hàm này để đồng bộ
 *  gần-real-time (site không có hạ tầng WebSocket/pub-sub, xem sticky-board.tsx). */
export async function listStickyNotesAction(): Promise<StickyNote[]> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');
  return listStickyNotes(session.userId);
}

/** Note đầu tiên "kéo ra" khỏi chồng note trắng — author luôn là người đang đăng nhập
 *  (lấy từ session, không nhận từ client) nên không thể mạo danh người khác. */
export async function createStickyNoteAction(input: StickyNoteInput): Promise<StickyNote> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');

  return createStickyNote(
    { x: input.x, y: input.y, color: input.color, text: input.text.slice(0, STICKY_NOTE_TEXT_MAX_LEN) },
    session.userId
  );
}

/** Vị trí "giống bảng vật lý thật" — ai cũng kéo/di chuyển note của bất kỳ ai. */
export async function moveStickyNoteAction(id: number, x: number, y: number): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');
  await moveStickyNote(id, x, y);
}

/** Chỉ tác giả mới sửa được nội dung note của mình — trả ok:false nếu không phải tác giả
 *  (client vốn đã ẩn/khoá ô nhập cho note của người khác, đây là lớp chặn ở server). */
export async function updateStickyNoteTextAction(id: number, text: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');
  const ok = await updateStickyNoteText(id, text.slice(0, STICKY_NOTE_TEXT_MAX_LEN), session.userId);
  return { ok };
}

/** Tác giả xoá note của chính mình, hoặc BGĐ (tier full) xoá bất kỳ note nào để kiểm duyệt. */
export async function deleteStickyNoteAction(id: number): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');
  const ok = await deleteStickyNote(id, session.userId, session.tier === 'full');
  return { ok };
}

/** Mỗi tài khoản ghim một note tối đa một lần; bấm lần nữa để bỏ ghim. */
export async function toggleStickyNotePinAction(
  id: number
): Promise<{ ok: boolean; pinned: boolean; pinCount: number }> {
  const session = await getSession();
  if (!session) throw new Error('Chưa đăng nhập.');
  const result = await toggleStickyNotePin(id, session.userId);
  return result ? { ok: true, ...result } : { ok: false, pinned: false, pinCount: 0 };
}
