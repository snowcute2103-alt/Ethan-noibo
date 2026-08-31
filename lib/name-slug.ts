/** Chuẩn hoá họ tên thành slug cho URL: bỏ dấu, viết thường, nối liền không
 *  khoảng trắng/gạch nối — vd "Phạm Thanh Ánh Tuyết" -> "phamthanhanhtuyet".
 *  Khác `slugify` nội bộ của lib/rules.ts (dùng gạch nối, chỉ cho rule
 *  title). Không đánh dấu 'server-only' vì cần dùng cả ở client (bấm chọn 1
 *  người ở "Bộ phận khác" để điều hướng) lẫn server (tra ngược slug -> user). */
export function nameSlug(fullName: string): string {
  return fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
