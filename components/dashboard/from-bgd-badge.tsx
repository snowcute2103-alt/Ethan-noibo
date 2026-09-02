import { Crown } from 'lucide-react';

/** Nhãn "Từ BGĐ" — mọi Rule/Thông báo trong hệ thống đều do Ban Giám Đốc đăng (chỉ tier `full` mới vào được trang admin tạo nội dung). */
export default function FromBgdBadge() {
  return (
    <span className="theme-light-surface inline-flex items-center gap-1.5 border border-gold-2/50 bg-[#FFF4D6] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
      <Crown size={12} strokeWidth={2.5} aria-hidden="true" />
      Từ BGĐ
    </span>
  );
}
