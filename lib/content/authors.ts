import { findAvatarUrlsByIds } from '@/lib/users';

/** Id thật của 2 người thường đứng tên Notice.author/Announcement.author
 *  ("Chị Nguyệt", "Anh Duy") — tra theo id thay vì username vì username giờ
 *  là email, đổi được (đã từng gây mất avatar khi khớp cứng theo username cũ).
 *  Cùng 2 id với REPORT_VIEWER_USER_IDS ở lib/report-access.ts. */
const AUTHOR_USER_IDS: Record<string, number> = {
  'Chị Nguyệt': 17,
  'Anh Duy': 19,
};

/** Map tên tác giả -> avatar hiện tại, dùng cho cả feed trang chủ
 *  (ThongBaoSection) lẫn popup "Có gì mới" (WhatsNewModal) để 2 nơi luôn hiện
 *  đúng cùng 1 avatar cho cùng 1 tác giả. */
export async function findAuthorAvatarUrls(): Promise<Record<string, string | null>> {
  const idByName = Object.entries(AUTHOR_USER_IDS);
  const avatarById = await findAvatarUrlsByIds(idByName.map(([, id]) => id));
  return Object.fromEntries(idByName.map(([name, id]) => [name, avatarById.get(id) ?? null]));
}
