import type { Visibility } from './types';

/** Vinh danh nhân sự tích cực theo tháng — hiển thị dạng "wall of fame", tách tông màu khỏi phần quy định/phạt. */
export interface RecognitionList {
  id: string;
  month: string;
  names: string[];
  visibility: Visibility;
}

export const RECOGNITION_LISTS: RecognitionList[] = [
  {
    id: 'thang-7-2026',
    month: 'Tháng 7/2026',
    names: [
      'Hoàng Thanh Dũng',
      'Đoàn Thị Thiên Lý',
      'Đỗ Cường Quý',
      'Tô Thị Kiều Trâm',
      'Nguyễn Thị Thuỳ Vy',
      'Nguyễn Kim Điền',
      'Trần Thị Bích Ngọc',
      'Đào Thị Thuý Vân',
      'Đặng Thanh Uyên Nhi',
      'Ngụy Bùi Phước Sang',
      'Vũ Đức Huy',
      'Vũ Thị Xuân Hồng',
      'Trần Hồ Hồng Hân',
      'Trần Trọng Sơn',
      'Nguyễn Hữu Anh Tú',
      'Đinh Thùy Diễm Hằng',
      'Nguyễn Thị Hằng Nga',
    ],
    visibility: { departments: 'all' },
  },
  {
    id: 'thang-5-2026',
    month: 'Tháng 5/2026',
    names: [
      'Đinh Thùy Diễm Hằng',
      'Nguyễn Ngọc Ánh',
      'Trần Thị Bích Ngọc',
      'Nguyễn Thị Thuỳ Vy',
      'Nguyễn Kiều Trinh',
      'Tạ Minh Vũ',
      'Đào Thị Thuý Vân',
      'Mai Quỳnh Thu',
      'Vũ Minh Hoàng',
      'Trần Vũ Quỳnh Mai',
      'Trần Trọng Sơn',
      'Trần Thị Minh Thư',
      'Mai Thuỵ Tú Uyên',
      'Phạm Ngọc Lan',
      'Vũ Đức Huy',
      'Lê Thị Mỹ Huyền',
      'Trần Nguyễn Hoàng Quân',
      'Hoàng Thanh Dũng',
      'Nguyễn Tú Linh',
    ],
    visibility: { departments: 'all' },
  },
];
