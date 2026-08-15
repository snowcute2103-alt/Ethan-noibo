import type { Department, Tier } from './roles';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string; // dd/mm/yyyy
  visibility: { departments: Department[] | 'all'; minTier?: Tier };
}

/**
 * DỮ LIỆU MẪU — thay bằng nội dung thật khi vận hành.
 * Mỗi announcement gắn visibility riêng để test phân quyền theo khối/cấp.
 */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'welcome',
    title: 'Chào mừng đến trang Nội bộ Ethan Ecom',
    body: 'Đây là nội dung placeholder — mọi khối đều thấy. Thay bằng thông báo thật khi có nội dung.',
    date: '15/08/2026',
    visibility: { departments: 'all' },
  },
  {
    id: 'kd-kpi',
    title: '[Kinh Doanh] Cập nhật KPI quý (mẫu)',
    body: 'Nội dung placeholder chỉ Khối Kinh Doanh thấy được.',
    date: '15/08/2026',
    visibility: { departments: ['kinh-doanh'] },
  },
  {
    id: 'kd-leader-report',
    title: '[Kinh Doanh · Quản lý] Báo cáo doanh số nội bộ (mẫu)',
    body: 'Nội dung placeholder — chỉ cấp Quản lý trở lên trong Khối Kinh Doanh thấy được.',
    date: '15/08/2026',
    visibility: { departments: ['kinh-doanh'], minTier: 'leader' },
  },
  {
    id: 'sx-theu-lich',
    title: '[SX Thêu] Lịch sản xuất tuần (mẫu)',
    body: 'Nội dung placeholder chỉ Khối Sản Xuất — Thêu thấy được.',
    date: '15/08/2026',
    visibility: { departments: ['sx-theu'] },
  },
  {
    id: 'sx-in-lich',
    title: '[SX In/POD] Lịch sản xuất tuần (mẫu)',
    body: 'Nội dung placeholder chỉ Khối Sản Xuất — In/POD thấy được.',
    date: '15/08/2026',
    visibility: { departments: ['sx-in'] },
  },
  {
    id: 'bgd-only',
    title: '[BGĐ] Ghi chú nội bộ (mẫu)',
    body: 'Nội dung placeholder chỉ Ban Giám Đốc thấy được (minTier full).',
    date: '15/08/2026',
    visibility: { departments: [], minTier: 'full' },
  },
];
