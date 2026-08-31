import type { Visibility } from './types';

/** Thông báo chung, không cần cấu trúc phức tạp như Policy/SOP. */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  author?: string;
  image?: string;
  visibility: Visibility;
}

/** Thông báo chung ngoài Policy/Notice. */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'national-day-holiday-2026',
    title: 'THÔNG BÁO LỊCH NGHỈ LỄ QUỐC KHÁNH 2/9',
    body: `Công ty thông báo lịch nghỉ lễ Quốc Khánh như sau:

• Thời gian nghỉ: Ngày 01–02/09/2026
• Làm việc trở lại: Ngày 03/09/2026

⚠️ Lưu ý đối với anh em tăng ca trong ngày lễ:

• Không cần chấm công như ngày làm việc bình thường, chỉ cần tạo đề xuất làm thêm giờ.
• Khi tạo đề xuất, chọn đúng nhóm “Tăng ca ngày lễ” để hệ thống tính lương x3.
• Đề xuất chỉ được duyệt trong ngày, mọi người chủ động tạo sớm.
• Chỉ đề xuất đúng số giờ thực tế làm việc:
  – Ca sáng: 7h30 – 11h30
  – Ca chiều: 13h00 – 17h00
• Nhớ thêm người liên quan và cấp trên trực tiếp vào mục Người theo dõi để tiện duyệt và đối chiếu.

Cảm ơn cả nhà và chúc mọi người nghỉ lễ vui vẻ!`,
    date: '28/08/2026',
    author: 'Anh Duy',
    image: '/images/thongbao/nghilex2-9.jpg',
    visibility: { departments: 'all' },
  },
];
