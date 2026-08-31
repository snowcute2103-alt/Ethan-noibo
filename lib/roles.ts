export type Department =
  | 'bgd'
  | 'kinh-doanh'
  | 'sx-theu'
  | 'sx-in'
  | 'rnd'
  | 'it'
  | 'fulfillment';

export type Tier = 'staff' | 'leader' | 'full';

export interface DepartmentInfo {
  id: Department;
  label: string;
  tiers: Tier[];
}

export const DEPARTMENTS: DepartmentInfo[] = [
  { id: 'bgd', label: 'Ban Giám Đốc', tiers: ['full'] },
  { id: 'kinh-doanh', label: 'Khối Kinh Doanh', tiers: ['staff', 'leader'] },
  { id: 'rnd', label: 'R&D', tiers: ['staff', 'leader'] },
  { id: 'it', label: 'IT / Development', tiers: ['staff', 'leader'] },
  { id: 'fulfillment', label: 'Fulfillment', tiers: ['staff', 'leader'] },
  { id: 'sx-theu', label: 'Sản Xuất — Thêu (SX1)', tiers: ['staff', 'leader'] },
  { id: 'sx-in', label: 'Sản Xuất — In/POD (SX2)', tiers: ['staff', 'leader'] },
];

const TIER_RANK: Record<Tier, number> = { staff: 0, leader: 1, full: 2 };

export function departmentLabel(id: Department): string {
  return DEPARTMENTS.find((d) => d.id === id)?.label ?? id;
}

export function tierLabel(tier: Tier): string {
  if (tier === 'full') return 'Toàn quyền';
  if (tier === 'leader') return 'Quản lý';
  return 'Nhân viên';
}

/** BGĐ (full) luôn xem được mọi nội dung, bất kể khối/cấp gắn trên nội dung đó. */
export function canView(
  user: { department: Department; tier: Tier },
  visibility: { departments: Department[] | 'all'; minTier?: Tier }
): boolean {
  if (user.department === 'bgd') return true;
  if (visibility.departments === 'all') {
    return TIER_RANK[user.tier] >= TIER_RANK[visibility.minTier ?? 'staff'];
  }
  if (!visibility.departments.includes(user.department)) return false;
  return TIER_RANK[user.tier] >= TIER_RANK[visibility.minTier ?? 'staff'];
}
