export interface NavItem {
  href: string;
  label: string;
}

/** Menu điều hướng dashboard — mỗi mục là 1 trang thiết kế riêng biệt. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Trang chủ' },
  { href: '/dashboard/rule', label: 'SOP & Quy trình' },
  { href: '/dashboard/khenthuong', label: 'Khen thưởng' },
  { href: '/dashboard/van-hoa', label: 'Văn hoá' },
  { href: '/dashboard/bao-cao', label: 'Báo cáo' },
];
