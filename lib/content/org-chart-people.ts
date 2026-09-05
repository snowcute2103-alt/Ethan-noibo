export interface OrgChartPerson {
  name: string;
  role: string;
  photoUrl: string | null;
  /** Vị trí tâm avatar trong ảnh so-do-to-chuc.svg, tính theo % kích thước gốc (viewBox 1747x924). */
  xPct: number;
  yPct: number;
}

/** Danh sách người trong sơ đồ tổ chức — dùng để tạo vùng bấm mở popup ảnh/tên/vị trí trên trang chủ. */
export const ORG_CHART_PEOPLE: OrgChartPerson[] =
[
  {
    "name": "Duy Nguyễn",
    "role": "Founder",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/19-1787884994986.webp",
    "xPct": 48.43,
    "yPct": 10.39
  },
  {
    "name": "Nguyệt Đoàn",
    "role": "CEO",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/17-1787130739033.webp",
    "xPct": 48.43,
    "yPct": 16.88
  },
  {
    "name": "Tuyền Hoàng",
    "role": "Manager – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/9-1787900593760.jpg",
    "xPct": 9.33,
    "yPct": 30.09
  },
  {
    "name": "Thư Trịnh",
    "role": "Manager – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/23-1787130811944.webp",
    "xPct": 29.25,
    "yPct": 30.09
  },
  {
    "name": "Duyên Trần",
    "role": "Manager – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/16-1787130978894.webp",
    "xPct": 49.17,
    "yPct": 30.09
  },
  {
    "name": "Huyền Lê",
    "role": "Team Leader – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/22-1787901565710.jpg",
    "xPct": 4.64,
    "yPct": 37.66
  },
  {
    "name": "Uyên Mai",
    "role": "Media – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/27-1787993071224.jpg",
    "xPct": 4.49,
    "yPct": 50.32
  },
  {
    "name": "Thái Phạm",
    "role": "Media – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/32-1787901665973.jpg",
    "xPct": 4.49,
    "yPct": 52.49
  },
  {
    "name": "Trịnh Trần",
    "role": "Support – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/38-1787992294196.jpg",
    "xPct": 4.64,
    "yPct": 58.66
  },
  {
    "name": "Ngân Trần",
    "role": "Media – Đội 1",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/40-1788142461869.jpg",
    "xPct": 14.02,
    "yPct": 50.65
  },
  {
    "name": "Vân Đào",
    "role": "Media – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/7-1787901141358.jpg",
    "xPct": 24.41,
    "yPct": 50.32
  },
  {
    "name": "Sơn Trần",
    "role": "Media – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/39-1788162842606.jpg",
    "xPct": 24.41,
    "yPct": 52.49
  },
  {
    "name": "Sao Phạm",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/29-1788507331374.jpg",
    "xPct": 24.41,
    "yPct": 58.33
  },
  {
    "name": "Thu Phạm",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/30-1787993293541.jpg",
    "xPct": 24.41,
    "yPct": 60.5
  },
  {
    "name": "Trâm Tô",
    "role": "Seller – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/52-1788142353459.jpg",
    "xPct": 33.94,
    "yPct": 44.16
  },
  {
    "name": "Lan Phạm",
    "role": "Media – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/37-1788142268872.jpg",
    "xPct": 33.94,
    "yPct": 50.65
  },
  {
    "name": "Phụng Đỗ",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/45-1787992588125.jpg",
    "xPct": 33.8,
    "yPct": 56.82
  },
  {
    "name": "Giang Trần",
    "role": "Support – Đội 2",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/63-1788142414029.jpg",
    "xPct": 33.8,
    "yPct": 58.98
  },
  {
    "name": "Phương Anh",
    "role": "Media – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/18-1787900950472.jpg",
    "xPct": 44.33,
    "yPct": 50.32
  },
  {
    "name": "Hiền Vũ",
    "role": "Media – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/28-1788415869752.jpg",
    "xPct": 44.33,
    "yPct": 52.49
  },
  {
    "name": "Phúc",
    "role": "Support – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/86-1788515335448.jpg",
    "xPct": 44.48,
    "yPct": 58.66
  },
  {
    "name": "Đạt Trần",
    "role": "Media – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/49-1788169955476.jpg",
    "xPct": 53.86,
    "yPct": 50.65
  },
  {
    "name": "Trinh",
    "role": "Support – Đội 3",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/66-1787992692422.jpg",
    "xPct": 53.86,
    "yPct": 57.14
  },
  {
    "name": "Thảo Vũ",
    "role": "Seller POD – Đội 4",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/24-1787900340683.jpg",
    "xPct": 64.4,
    "yPct": 45.67
  },
  {
    "name": "Quyên Phạm",
    "role": "Media – Đội 4",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/35-1787901342193.jpg",
    "xPct": 64.4,
    "yPct": 52.16
  },
  {
    "name": "Vy Đoàn",
    "role": "Support – Đội 4",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/42-1787992465566.jpg",
    "xPct": 64.4,
    "yPct": 58.66
  },
  {
    "name": "Tiến Phạm",
    "role": "Seller POD – Đội 5",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/31-1787130779938.webp",
    "xPct": 74.93,
    "yPct": 45.67
  },
  {
    "name": "Linh Nguyễn",
    "role": "Support – Đội 5",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/53-1788514486684.jpg",
    "xPct": 74.93,
    "yPct": 58.66
  },
  {
    "name": "Hân Đặng",
    "role": "Seller EMB – Đội 6",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/25-1787130861106.webp",
    "xPct": 85.46,
    "yPct": 45.67
  },
  {
    "name": "Linh Nguyễn",
    "role": "Media – Đội 6",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/51-1787993006216.jpg",
    "xPct": 85.46,
    "yPct": 52.16
  },
  {
    "name": "Vy Nguyễn",
    "role": "Support – Đội 6",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/41-1787993338545.jpg",
    "xPct": 85.46,
    "yPct": 58.66
  },
  {
    "name": "Ngọc Trần",
    "role": "Team Leader – Fulfill/Kế toán",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/13-1787900455833.jpg",
    "xPct": 4.64,
    "yPct": 73.59
  },
  {
    "name": "Ngân Nguyễn",
    "role": "Fulfill",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/33-1787901493547.jpg",
    "xPct": 4.64,
    "yPct": 80.09
  },
  {
    "name": "Thạch Phạm",
    "role": "Team Leader – Design EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/21-1787130902607.webp",
    "xPct": 14.25,
    "yPct": 73.59
  },
  {
    "name": "Uyên Vũ",
    "role": "Designer EMB",
    "photoUrl": null,
    "xPct": 14.11,
    "yPct": 79.76
  },
  {
    "name": "Thương Nguyễn",
    "role": "Designer EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/43-1788150813538.jpg",
    "xPct": 14.11,
    "yPct": 81.93
  },
  {
    "name": "Trang Tô",
    "role": "Designer EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/46-1788428694310.jpg",
    "xPct": 14.11,
    "yPct": 84.09
  },
  {
    "name": "Hân Trần",
    "role": "Designer EMB",
    "photoUrl": null,
    "xPct": 14.11,
    "yPct": 86.26
  },
  {
    "name": "Tiến Vũ",
    "role": "Designer EMB",
    "photoUrl": null,
    "xPct": 14.11,
    "yPct": 88.42
  },
  {
    "name": "Hoàng Vũ",
    "role": "Designer EMB",
    "photoUrl": null,
    "xPct": 14.11,
    "yPct": 90.58
  },
  {
    "name": "Hằng Phạm",
    "role": "Designer EMB",
    "photoUrl": null,
    "xPct": 14.11,
    "yPct": 92.75
  },
  {
    "name": "Hồng Vũ",
    "role": "Designer EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/64-1788428176187.jpg",
    "xPct": 14.11,
    "yPct": 94.91
  },
  {
    "name": "Thạch Lê",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/10-1788141764888.jpg",
    "xPct": 23.73,
    "yPct": 79.76
  },
  {
    "name": "Mai Trần",
    "role": "Designer POD",
    "photoUrl": null,
    "xPct": 23.73,
    "yPct": 81.93
  },
  {
    "name": "Hoa Vũ",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/56-1787992418526.jpg",
    "xPct": 23.73,
    "yPct": 84.09
  },
  {
    "name": "Ngọc Trần",
    "role": "Designer POD",
    "photoUrl": null,
    "xPct": 23.73,
    "yPct": 86.26
  },
  {
    "name": "Nga Nguyễn",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/12-1788141929798.jpg",
    "xPct": 23.73,
    "yPct": 88.42
  },
  {
    "name": "Nhi Đặng",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/58-1788150623496.jpg",
    "xPct": 23.73,
    "yPct": 90.58
  },
  {
    "name": "Nga Nguyễn",
    "role": "Designer POD",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/12-1788141929798.jpg",
    "xPct": 23.73,
    "yPct": 92.75
  },
  {
    "name": "Tú Đinh",
    "role": "Team Leader – IT",
    "photoUrl": null,
    "xPct": 33.49,
    "yPct": 73.59
  },
  {
    "name": "Hiệp Nguyễn",
    "role": "IT",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/36-1788516372894.jpg",
    "xPct": 33.34,
    "yPct": 79.76
  },
  {
    "name": "Long",
    "role": "IT",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/97-1787992244962.jpg",
    "xPct": 33.34,
    "yPct": 81.93
  },
  {
    "name": "Tuyết",
    "role": "IT",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/80-1787988337089.jpg",
    "xPct": 33.34,
    "yPct": 84.09
  },
  {
    "name": "Thuý Chu",
    "role": "Support – Web/Brand",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/6-1788141675514.jpg",
    "xPct": 43.1,
    "yPct": 86.58
  },
  {
    "name": "Uyên Ngô",
    "role": "Team Leader – R&D",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/11-1787900517921.jpg",
    "xPct": 52.72,
    "yPct": 73.59
  },
  {
    "name": "Sang Nguỵ",
    "role": "Designer – R&D",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/55-1787131038155.webp",
    "xPct": 52.58,
    "yPct": 79.76
  },
  {
    "name": "Nhi Trần",
    "role": "Designer – R&D",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/59-1787991956129.jpg",
    "xPct": 52.58,
    "yPct": 81.93
  },
  {
    "name": "Quốc Bảo",
    "role": "CPO – Giám đốc sản xuất",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/15-1788516430294.jpg",
    "xPct": 76.65,
    "yPct": 73.59
  },
  {
    "name": "Dũng Hoàng",
    "role": "Team Leader – SX EMB",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/8-1787900721814.jpg",
    "xPct": 62.39,
    "yPct": 82.68
  },
  {
    "name": "Thiện Vũ",
    "role": "Sản xuất – SX EMB",
    "photoUrl": null,
    "xPct": 62.25,
    "yPct": 88.85
  },
  {
    "name": "Liêm Vũ",
    "role": "Sản xuất – SX EMB",
    "photoUrl": null,
    "xPct": 62.25,
    "yPct": 91.02
  },
  {
    "name": "Tú Nguyễn",
    "role": "In ấn",
    "photoUrl": "https://aod9i4tzfdg8pgtz.public.blob.vercel-storage.com/avatars/60-1788150779476.jpg",
    "xPct": 71.89,
    "yPct": 89.18
  },
  {
    "name": "Xuân Võ",
    "role": "Cắt Laser",
    "photoUrl": null,
    "xPct": 81.4,
    "yPct": 89.18
  },
  {
    "name": "Trúc Thư",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "xPct": 90.76,
    "yPct": 88.85
  },
  {
    "name": "Vân Nguyễn",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "xPct": 90.76,
    "yPct": 91.02
  },
  {
    "name": "Minh Thư",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "xPct": 90.76,
    "yPct": 93.18
  },
  {
    "name": "Trinh Đặng",
    "role": "QC/Đóng gói",
    "photoUrl": null,
    "xPct": 90.76,
    "yPct": 95.35
  }
];
