import type { Visibility } from './types';

/** Thông báo chung, không cần cấu trúc phức tạp như Policy/SOP. */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  visibility: Visibility;
}

/** Thông báo chung ngoài Policy/Notice — hiện chưa có nội dung thật, trang Thông báo tự ẩn mục này khi rỗng. */
export const ANNOUNCEMENTS: Announcement[] = [];
