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
];
