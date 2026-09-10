export interface OrgChartPerson {
  name: string;
  role: string;
  photoUrl: string | null;
  /** users.id — dùng để lấy avatar mới nhất từ DB, ghi đè photoUrl (ảnh chụp lúc dựng sơ đồ) khi render. null nếu chưa gán được user (chưa có avatar lúc dựng sơ đồ). */
  userId: number | null;
  /** Vị trí tâm avatar trong ảnh so-do-to-chuc.svg, tính theo % kích thước gốc (viewBox 1747x1230). */
  xPct: number;
  yPct: number;
  /** Bán kính avatar trong ảnh so-do-to-chuc.svg, tính theo % chiều rộng viewBox (1747). Dùng để render overlay avatar live đúng kích thước baked-in. */
  rPct: number;
}

/** Danh sách người trong sơ đồ tổ chức — dùng để tạo vùng bấm mở popup ảnh/tên/vị trí trên trang chủ.
 *  photoUrl là ảnh chụp lúc dựng sơ đồ (fallback); avatar hiển thị thực tế được ghi đè live theo userId
 *  qua lib/users.ts findAvatarUrlsByIds() ở app/dashboard/page.tsx, nên khi user đổi avatar mới, sơ đồ
 *  tự cập nhật mà không cần sửa file này. */
export const ORG_CHART_PEOPLE: OrgChartPerson[] =
[
  {
    "name": "Duy Nguyễn",
    "role": "Founder",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/19-1787884994986.webp",
    "userId": 19,
    "xPct": 48.43,
    "yPct": 9.11,
    "rPct": 0.76
  },
  {
    "name": "Nguyệt Đoàn",
    "role": "CEO",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/17-1787130739033.webp",
    "userId": 17,
    "xPct": 48.43,
    "yPct": 15.7,
    "rPct": 0.76
  },
  {
    "name": "Tuyền Hoàng",
    "role": "Manager – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/9-1787900593760.jpg",
    "userId": 9,
    "xPct": 9.33,
    "yPct": 29.09,
    "rPct": 0.76
  },
  {
    "name": "Thư Trịnh",
    "role": "Manager – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/23-1787130811944.webp",
    "userId": 23,
    "xPct": 29.25,
    "yPct": 29.09,
    "rPct": 0.76
  },
  {
    "name": "Duyên Trần",
    "role": "Manager – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/16-1787130978894.webp",
    "userId": 16,
    "xPct": 49.17,
    "yPct": 29.09,
    "rPct": 0.76
  },
  {
    "name": "Huyền Lê",
    "role": "Team Leader – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/22-1787901565710.jpg",
    "userId": 22,
    "xPct": 4.64,
    "yPct": 36.77,
    "rPct": 0.76
  },
  {
    "name": "Uyên Mai",
    "role": "Media – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/27-1787993071224.jpg",
    "userId": 27,
    "xPct": 4.49,
    "yPct": 49.61,
    "rPct": 0.58
  },
  {
    "name": "Thái Phạm",
    "role": "Media – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/32-1787901665973.jpg",
    "userId": 32,
    "xPct": 4.49,
    "yPct": 51.81,
    "rPct": 0.58
  },
  {
    "name": "Trịnh Trần",
    "role": "Support – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/38-1787992294196.jpg",
    "userId": 38,
    "xPct": 4.64,
    "yPct": 58.07,
    "rPct": 0.76
  },
  {
    "name": "Ngân Trần",
    "role": "Media – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/40-1788142461869.jpg",
    "userId": 40,
    "xPct": 14.02,
    "yPct": 49.94,
    "rPct": 0.76
  },
  {
    "name": "Vân Đào",
    "role": "Media – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/7-1787901141358.jpg",
    "userId": 7,
    "xPct": 24.41,
    "yPct": 49.61,
    "rPct": 0.58
  },
  {
    "name": "Sơn Trần",
    "role": "Media – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/39-1788162842606.jpg",
    "userId": 39,
    "xPct": 24.41,
    "yPct": 51.81,
    "rPct": 0.58
  },
  {
    "name": "Sao Phạm",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/29-1788507331374.jpg",
    "userId": 29,
    "xPct": 24.41,
    "yPct": 57.73,
    "rPct": 0.58
  },
  {
    "name": "Thu Phạm",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/30-1787993293541.jpg",
    "userId": 30,
    "xPct": 24.41,
    "yPct": 59.93,
    "rPct": 0.58
  },
  {
    "name": "Trâm Tô",
    "role": "Seller – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/52-1788142353459.jpg",
    "userId": 52,
    "xPct": 33.94,
    "yPct": 43.36,
    "rPct": 0.76
  },
  {
    "name": "Lan Phạm",
    "role": "Media – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/37-1788142268872.jpg",
    "userId": 37,
    "xPct": 33.94,
    "yPct": 49.94,
    "rPct": 0.76
  },
  {
    "name": "Phụng Đỗ",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/45-1787992588125.jpg",
    "userId": 45,
    "xPct": 33.8,
    "yPct": 56.2,
    "rPct": 0.58
  },
  {
    "name": "Giang Trần",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/63-1788142414029.jpg",
    "userId": 63,
    "xPct": 33.8,
    "yPct": 58.39,
    "rPct": 0.58
  },
  {
    "name": "Phương Anh",
    "role": "Media – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/18-1787900950472.jpg",
    "userId": 18,
    "xPct": 44.33,
    "yPct": 49.61,
    "rPct": 0.58
  },
  {
    "name": "Hiền Vũ",
    "role": "Media – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/28-1788415869752.jpg",
    "userId": 28,
    "xPct": 44.33,
    "yPct": 51.81,
    "rPct": 0.58
  },
  {
    "name": "Phúc",
    "role": "Support – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/86-1788515335448.jpg",
    "userId": 86,
    "xPct": 44.48,
    "yPct": 58.07,
    "rPct": 0.76
  },
  {
    "name": "Đạt Trần",
    "role": "Media – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/49-1788169955476.jpg",
    "userId": 49,
    "xPct": 53.86,
    "yPct": 49.94,
    "rPct": 0.76
  },
  {
    "name": "Trinh",
    "role": "Support – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/66-1787992692422.jpg",
    "userId": 66,
    "xPct": 53.86,
    "yPct": 56.53,
    "rPct": 0.76
  },
  {
    "name": "Thảo Vũ",
    "role": "Seller POD – Đội 4",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/24-1787900340683.jpg",
    "userId": 24,
    "xPct": 64.4,
    "yPct": 44.89,
    "rPct": 0.76
  },
  {
    "name": "Quyên Phạm",
    "role": "Media – Đội 4",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/35-1787901342193.jpg",
    "userId": 35,
    "xPct": 64.4,
    "yPct": 51.48,
    "rPct": 0.76
  },
  {
    "name": "Vy Đoàn",
    "role": "Support – Đội 4",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/42-1787992465566.jpg",
    "userId": 42,
    "xPct": 64.4,
    "yPct": 58.07,
    "rPct": 0.76
  },
  {
    "name": "Tiến Phạm",
    "role": "Seller POD – Đội 5",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/31-1787130779938.webp",
    "userId": 31,
    "xPct": 74.93,
    "yPct": 44.89,
    "rPct": 0.76
  },
  {
    "name": "Linh Nguyễn",
    "role": "Support – Đội 5",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/53-1788514486684.jpg",
    "userId": 53,
    "xPct": 74.93,
    "yPct": 58.07,
    "rPct": 0.76
  },
  {
    "name": "Hân Đặng",
    "role": "Seller EMB – Đội 6",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/25-1787130861106.webp",
    "userId": 25,
    "xPct": 85.46,
    "yPct": 44.89,
    "rPct": 0.76
  },
  {
    "name": "Linh Nguyễn",
    "role": "Media – Đội 6",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/51-1787993006216.jpg",
    "userId": 51,
    "xPct": 85.46,
    "yPct": 51.48,
    "rPct": 0.76
  },
  {
    "name": "Vy Nguyễn",
    "role": "Support – Đội 6",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/41-1787993338545.jpg",
    "userId": 41,
    "xPct": 85.46,
    "yPct": 58.07,
    "rPct": 0.76
  },
  {
    "name": "Ngọc Trần",
    "role": "Team Leader – Fulfill/Kế toán",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/13-1787900455833.jpg",
    "userId": 13,
    "xPct": 4.64,
    "yPct": 73.21,
    "rPct": 0.76
  },
  {
    "name": "Ngân Nguyễn",
    "role": "Fulfill",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/33-1787901493547.jpg",
    "userId": 33,
    "xPct": 4.64,
    "yPct": 79.8,
    "rPct": 0.76
  },
  {
    "name": "Thạch Phạm",
    "role": "Team Leader – Design EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/21-1787130902607.webp",
    "userId": 21,
    "xPct": 14.25,
    "yPct": 73.21,
    "rPct": 0.76
  },
  {
    "name": "Uyên Vũ",
    "role": "Designer EMB",
    "photoUrl": null,
    "userId": 47,
    "xPct": 14.11,
    "yPct": 79.47,
    "rPct": 0.58
  },
  {
    "name": "Thương Nguyễn",
    "role": "Designer EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/43-1788150813538.jpg",
    "userId": 43,
    "xPct": 14.11,
    "yPct": 81.67,
    "rPct": 0.58
  },
  {
    "name": "Trang Tô",
    "role": "Designer EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/46-1788428694310.jpg",
    "userId": 46,
    "xPct": 14.11,
    "yPct": 83.86,
    "rPct": 0.58
  },
  {
    "name": "Hân Trần",
    "role": "Designer EMB",
    "photoUrl": null,
    "userId": null,
    "xPct": 14.11,
    "yPct": 86.06,
    "rPct": 0.58
  },
  {
    "name": "Tiến Vũ",
    "role": "Designer EMB",
    "photoUrl": null,
    "userId": 34,
    "xPct": 14.11,
    "yPct": 88.25,
    "rPct": 0.58
  },
  {
    "name": "Hoàng Vũ",
    "role": "Designer EMB",
    "photoUrl": null,
    "userId": 54,
    "xPct": 14.11,
    "yPct": 90.44,
    "rPct": 0.58
  },
  {
    "name": "Hằng Phạm",
    "role": "Designer EMB",
    "photoUrl": null,
    "userId": 62,
    "xPct": 14.11,
    "yPct": 92.64,
    "rPct": 0.58
  },
  {
    "name": "Hồng Vũ",
    "role": "Designer EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/64-1788428176187.jpg",
    "userId": 64,
    "xPct": 14.11,
    "yPct": 94.83,
    "rPct": 0.58
  },
  {
    "name": "Thạch Lê",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/10-1788141764888.jpg",
    "userId": 10,
    "xPct": 23.73,
    "yPct": 79.47,
    "rPct": 0.58
  },
  {
    "name": "Mai Trần",
    "role": "Designer POD",
    "photoUrl": null,
    "userId": 20,
    "xPct": 23.73,
    "yPct": 81.67,
    "rPct": 0.58
  },
  {
    "name": "Hoa Vũ",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/56-1787992418526.jpg",
    "userId": 56,
    "xPct": 23.73,
    "yPct": 83.86,
    "rPct": 0.58
  },
  {
    "name": "Ngọc Trần",
    "role": "Designer POD",
    "photoUrl": null,
    "userId": 57,
    "xPct": 23.73,
    "yPct": 86.06,
    "rPct": 0.58
  },
  {
    "name": "Nga Nguyễn",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/12-1788141929798.jpg",
    "userId": 12,
    "xPct": 23.73,
    "yPct": 88.25,
    "rPct": 0.58
  },
  {
    "name": "Nhi Đặng",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/58-1788150623496.jpg",
    "userId": 58,
    "xPct": 23.73,
    "yPct": 90.44,
    "rPct": 0.58
  },
  {
    "name": "Nga Nguyễn",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/12-1788141929798.jpg",
    "userId": 12,
    "xPct": 23.73,
    "yPct": 92.64,
    "rPct": 0.58
  },
  {
    "name": "Tú Đinh",
    "role": "Team Leader – IT",
    "photoUrl": null,
    "userId": null,
    "xPct": 33.49,
    "yPct": 73.21,
    "rPct": 0.76
  },
  {
    "name": "Hiệp Nguyễn",
    "role": "IT",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/36-1788516372894.jpg",
    "userId": 36,
    "xPct": 33.34,
    "yPct": 79.47,
    "rPct": 0.58
  },
  {
    "name": "Long",
    "role": "IT",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/97-1787992244962.jpg",
    "userId": 97,
    "xPct": 33.34,
    "yPct": 81.67,
    "rPct": 0.58
  },
  {
    "name": "Tuyết",
    "role": "IT",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/80-1787988337089.jpg",
    "userId": 80,
    "xPct": 33.34,
    "yPct": 83.86,
    "rPct": 0.58
  },
  {
    "name": "Thuý Chu",
    "role": "Support – Web/Brand",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/6-1788141675514.jpg",
    "userId": 6,
    "xPct": 43.1,
    "yPct": 86.38,
    "rPct": 0.76
  },
  {
    "name": "Uyên Ngô",
    "role": "Team Leader – R&D",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/11-1787900517921.jpg",
    "userId": 11,
    "xPct": 52.72,
    "yPct": 73.21,
    "rPct": 0.76
  },
  {
    "name": "Sang Nguỵ",
    "role": "Designer – R&D",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/55-1787131038155.webp",
    "userId": 55,
    "xPct": 52.58,
    "yPct": 79.47,
    "rPct": 0.58
  },
  {
    "name": "Nhi Trần",
    "role": "Designer – R&D",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/59-1787991956129.jpg",
    "userId": 59,
    "xPct": 52.58,
    "yPct": 81.67,
    "rPct": 0.58
  },
  {
    "name": "Quốc Bảo",
    "role": "CPO – Giám đốc sản xuất",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/15-1788516430294.jpg",
    "userId": 15,
    "xPct": 76.65,
    "yPct": 73.21,
    "rPct": 0.76
  },
  {
    "name": "Dũng Hoàng",
    "role": "Team Leader – SX EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/8-1787900721814.jpg",
    "userId": 8,
    "xPct": 62.39,
    "yPct": 82.43,
    "rPct": 0.76
  },
  {
    "name": "Thiện Vũ",
    "role": "Sản xuất – SX EMB",
    "photoUrl": null,
    "userId": 48,
    "xPct": 62.25,
    "yPct": 88.68,
    "rPct": 0.58
  },
  {
    "name": "Liêm Vũ",
    "role": "Sản xuất – SX EMB",
    "photoUrl": null,
    "userId": 50,
    "xPct": 62.25,
    "yPct": 90.88,
    "rPct": 0.58
  },
  {
    "name": "Tú Nguyễn",
    "role": "In ấn",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/60-1788150779476.jpg",
    "userId": 60,
    "xPct": 71.89,
    "yPct": 89.02,
    "rPct": 0.76
  },
  {
    "name": "Xuân Võ",
    "role": "Cắt Laser",
    "photoUrl": null,
    "userId": null,
    "xPct": 81.4,
    "yPct": 89.02,
    "rPct": 0.76
  },
  {
    "name": "Trúc Thư",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "userId": 26,
    "xPct": 90.76,
    "yPct": 88.68,
    "rPct": 0.58
  },
  {
    "name": "Vân Nguyễn",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "userId": null,
    "xPct": 90.76,
    "yPct": 90.88,
    "rPct": 0.58
  },
  {
    "name": "Minh Thư",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "userId": 85,
    "xPct": 90.76,
    "yPct": 93.08,
    "rPct": 0.58
  },
  {
    "name": "Trinh Đặng",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "userId": null,
    "xPct": 90.76,
    "yPct": 95.28,
    "rPct": 0.58
  }
];
