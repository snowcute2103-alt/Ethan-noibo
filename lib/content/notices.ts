import type { Visibility } from './types';

/** Thông báo khẩn, ngắn hạn — hiển thị dạng banner cảnh báo ở đầu trang, không phải feed dài hạn. */
export interface Notice {
  id: string;
  title: string;
  date: string;
  body: string;
  details: string[];
  callout?: string;
  visibility: Visibility;
}

export const NOTICES: Notice[] = [
  {
    id: 'cup-dien-vo-dong-2',
    title: 'Điều chỉnh ca làm việc — khu vực Võ Dõng 2 cúp điện',
    date: '24/06/2026',
    body: 'Khu vực văn phòng Võ Dõng 2 có lịch cúp điện từ 7h45 đến 13h15.',
    details: [
      'Bộ phận sản xuất (vận hành máy móc): dời ca sang ca chiều, bắt đầu từ 13h00.',
      'Các bộ phận khác (Design, Support, QC, xử lý Emb…) vẫn làm việc theo khung giờ bình thường — có thể làm tại Văn phòng 1 hoặc Văn phòng 4 (Thanh Sơn), hiện còn nhiều chỗ ngồi.',
      'Văn phòng 1 ngày hôm đó dùng pin dự trữ, không đủ tải cho máy lạnh — vui lòng không sử dụng máy lạnh, có thể dùng quạt.',
    ],
    callout: 'Mọi người chủ động sắp xếp công việc để không ảnh hưởng đến tiến độ.',
    visibility: { departments: 'all' },
  },
  {
    id: 'quy-dinh-len-do-thu-2-thu-6',
    title: '📢 Thông báo quy định "lên đồ" mới',
    date: '07/08/2026',
    body: 'Cả nhà ơi, lịch mặc áo đồng phục của công ty mình chính thức có chút thay đổi "nhỏ nhưng có võ" nhé!',
    details: [
      '📌 Lịch mặc áo team cố định: Thứ 2 & Thứ 6 hằng tuần.',
      'Thành viên chưa có áo có thể mặc đồ tự do cho tới khi được phát áo.',
      'Anh chị em nhớ note lại vào lịch để không bị "lạc quẻ" giữa hàng ngũ đồng đội nha.',
    ],
    callout: 'Cảm ơn sự hợp tác siêu tốc của cả nhà ạ! 🎉🖤',
    visibility: { departments: 'all' },
  },
  {
    id: 'sinh-hoat-team-ethan',
    title: '📢 Thông báo sinh hoạt team Ethan',
    date: '01/08/2026',
    body: 'Chào mọi người, Team Ethan xin thông báo lịch họp sinh hoạt định kỳ dành cho toàn thể các thành viên trong team:',
    details: [
      '⏰ Thời gian: 16:30 (Hôm nay).',
      '📍 Địa điểm: Lầu 4 - Văn phòng 1.',
      '👥 Thành phần tham dự: Tất cả các thành viên Team Ethan.',
    ],
    callout: 'Rất mong mọi người sắp xếp công việc và có mặt đúng giờ để buổi họp diễn ra thuận lợi. Cảm ơn mọi người!',
    visibility: { departments: 'all' },
  },
];
