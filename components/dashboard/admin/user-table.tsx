'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  History,
  KeyRound,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Search,
  SearchX,
  SlidersHorizontal,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, departmentLabel, tierLabel, type Department, type Tier } from '@/lib/roles';
import type { AuditAction, AuditLogEntry } from '@/lib/audit';
import {
  updateUserAction,
  unlockUserAction,
  bulkUpdateUsersAction,
  bulkUnlockUsersAction,
  getUserAuditLogAction,
} from '@/app/dashboard/admin/actions';
import avatarPlaceholder from '@/public/images/avatar-placeholder.jpg';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TIERS: Tier[] = ['staff', 'leader', 'full'];
const PAGE_SIZES = [25, 50, 100] as const;
const COLUMN_VISIBILITY_STORAGE_KEY = 'admin-user-table-hidden-columns';

const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'user.create': 'Tạo tài khoản',
  'user.update': 'Cập nhật thông tin',
  'user.deactivate': 'Vô hiệu hoá',
  'user.reset_password': 'Đặt lại mật khẩu',
  'user.unlock': 'Mở khoá đăng nhập',
  'password_reset.dismiss': 'Từ chối yêu cầu đặt lại mật khẩu',
  'permission.grant': 'Cấp quyền tài liệu',
  'permission.revoke': 'Thu hồi quyền tài liệu',
  'permission.backfill': 'Đồng bộ quyền tài liệu',
  'rule.create': 'Tạo rule',
  'rule.update': 'Cập nhật rule',
  'rule.delete': 'Xoá rule',
  'announcement.create': 'Tạo thông báo',
  'announcement.update': 'Cập nhật thông báo',
  'announcement.delete': 'Xoá thông báo',
  'announcement_permission.grant': 'Cấp quyền xem thông báo',
  'announcement_permission.revoke': 'Thu hồi quyền xem thông báo',
  'team_member.add': 'Thêm thành viên đội',
  'team_member.remove': 'Gỡ thành viên đội',
  'team_member.role_change': 'Đổi vai trò trong đội',
  'team_member.category_change': 'Đổi nhóm task trong đội',
  'team_category.create': 'Tạo nhóm task',
  'team_category.update': 'Cập nhật nhóm task',
  'team_category.delete': 'Xoá nhóm task',
  'personal_task.create': 'Tạo task cá nhân',
  'personal_task.update': 'Cập nhật task cá nhân',
  'personal_task.delete': 'Xoá task cá nhân',
  'personal_task.duplicate': 'Nhân bản task cá nhân',
};

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Họ tên',
  department: 'Khối',
  tier: 'Cấp',
  teamLabel: 'Team',
  personalEmail: 'Email cá nhân',
  phone: 'Điện thoại',
  isActive: 'Trạng thái tài khoản',
  jobTitle: 'Chức danh',
  gender: 'Giới tính',
  birthDate: 'Ngày sinh',
  office: 'Văn phòng',
  startDate: 'Ngày vào làm',
  workSchedule: 'Lịch làm việc',
  positionTitle: 'Vị trí công việc',
  avatarUrl: 'Ảnh đại diện',
  employmentStatus: 'Trạng thái nhân sự',
  employmentType: 'Phân loại nhân sự',
  salaryPolicy: 'Chính sách lương',
  confirmationDate: 'Ngày chính thức',
};

function formatAuditValue(key: string, value: string | number | boolean | null): string {
  if (value === null) return '—';
  if (key === 'department') return departmentLabel(value as Department);
  if (key === 'tier') return tierLabel(value as Tier);
  if (key === 'isActive') return value ? 'Hoạt động' : 'Đã vô hiệu hoá';
  return String(value);
}

function formatAuditDetail(entry: AuditLogEntry): string {
  const { detail } = entry;
  const parts: string[] = [];
  if (detail.changedFields?.length) {
    parts.push(`Trường thay đổi: ${detail.changedFields.map((f) => FIELD_LABELS[f] ?? f).join(', ')}`);
  }
  if (detail.from && detail.to) {
    const changes = Object.keys(detail.to)
      .filter((key) => JSON.stringify(detail.from?.[key]) !== JSON.stringify(detail.to?.[key]))
      .map((key) => `${FIELD_LABELS[key] ?? key}: ${formatAuditValue(key, detail.from![key])} → ${formatAuditValue(key, detail.to![key])}`);
    parts.push(...changes);
  }
  if (detail.docId) parts.push(`Tài liệu: ${detail.docId}`);
  if (detail.note) parts.push(detail.note);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Số năm làm việc trọn vẹn tính từ ngày vào làm tới hôm nay. */
function yearsOfService(startDate: string | null): number | null {
  if (!startDate) return null;
  const [y, m, d] = startDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  let years = now.getFullYear() - y;
  const hadAnniversary = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
  if (!hadAnniversary) years -= 1;
  return years >= 0 ? years : null;
}

type SortDir = 'asc' | 'desc';

interface ColumnDef {
  key: string;
  label: string;
  sticky?: boolean;
  render: (u: UserRow) => React.ReactNode;
  sortValue: (u: UserRow) => string | number;
}

const COLUMNS: ColumnDef[] = [
  { key: 'username', label: 'Username', render: (u) => u.username, sortValue: (u) => u.username },
  {
    key: 'employeeCode',
    label: 'Mã nhân viên',
    render: (u) => u.employeeCode ?? '—',
    sortValue: (u) => u.employeeCode ?? '',
  },
  { key: 'jobTitle', label: 'Chức danh', render: (u) => u.jobTitle ?? '—', sortValue: (u) => u.jobTitle ?? '' },
  {
    key: 'positionTitle',
    label: 'Vị trí công việc',
    render: (u) => u.positionTitle ?? '—',
    sortValue: (u) => u.positionTitle ?? '',
  },
  { key: 'teamLabel', label: 'Team', render: (u) => u.teamLabel ?? '—', sortValue: (u) => u.teamLabel ?? '' },
  {
    key: 'department',
    label: 'Khối',
    render: (u) => departmentLabel(u.department),
    sortValue: (u) => departmentLabel(u.department),
  },
  { key: 'tier', label: 'Cấp', render: (u) => tierLabel(u.tier), sortValue: (u) => tierLabel(u.tier) },
  { key: 'gender', label: 'Giới tính', render: (u) => u.gender ?? '—', sortValue: (u) => u.gender ?? '' },
  {
    key: 'birthDate',
    label: 'Ngày sinh',
    render: (u) => formatDate(u.birthDate),
    sortValue: (u) => u.birthDate ?? '',
  },
  {
    key: 'startDate',
    label: 'Ngày vào làm',
    render: (u) => formatDate(u.startDate),
    sortValue: (u) => u.startDate ?? '',
  },
  {
    key: 'yearsOfService',
    label: 'Số năm làm việc',
    render: (u) => {
      const years = yearsOfService(u.startDate);
      return years === null ? '—' : `${years} năm`;
    },
    sortValue: (u) => yearsOfService(u.startDate) ?? -1,
  },
  {
    key: 'confirmationDate',
    label: 'Ngày chính thức',
    render: (u) => formatDate(u.confirmationDate),
    sortValue: (u) => u.confirmationDate ?? '',
  },
  { key: 'office', label: 'Văn phòng', render: (u) => u.office ?? '—', sortValue: (u) => u.office ?? '' },
  {
    key: 'workSchedule',
    label: 'Lịch làm việc',
    render: (u) => u.workSchedule ?? '—',
    sortValue: (u) => u.workSchedule ?? '',
  },
  {
    key: 'employmentStatus',
    label: 'Trạng thái nhân sự',
    render: (u) => u.employmentStatus ?? '—',
    sortValue: (u) => u.employmentStatus ?? '',
  },
  {
    key: 'employmentType',
    label: 'Phân loại nhân sự',
    render: (u) => u.employmentType ?? '—',
    sortValue: (u) => u.employmentType ?? '',
  },
  {
    key: 'salaryPolicy',
    label: 'Chính sách lương',
    render: (u) => u.salaryPolicy ?? '—',
    sortValue: (u) => u.salaryPolicy ?? '',
  },
  {
    key: 'personalEmail',
    label: 'Email cá nhân',
    render: (u) => u.personalEmail ?? '—',
    sortValue: (u) => u.personalEmail ?? '',
  },
  { key: 'phone', label: 'Điện thoại', render: (u) => u.phone ?? '—', sortValue: (u) => u.phone ?? '' },
  {
    key: 'isActive',
    label: 'Trạng thái tài khoản',
    render: (u) => (
      <Badge variant={u.isActive ? 'success' : 'secondary'}>
        {u.isActive ? <UserRoundCheck aria-hidden="true" /> : <UserRoundX aria-hidden="true" />}
        {u.isActive ? 'Hoạt động' : 'Đã vô hiệu hoá'}
      </Badge>
    ),
    sortValue: (u) => (u.isActive ? 1 : 0),
  },
];

export default function UserTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [bulkDepartment, setBulkDepartment] = useState<Department | ''>('');
  const [bulkTier, setBulkTier] = useState<Tier | ''>('');
  const [auditUser, setAuditUser] = useState<UserRow | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Nhớ cấu hình ẩn/hiện cột giữa các lần vào lại trang.
  useEffect(() => {
    const raw = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
    if (raw) {
      try {
        setHiddenCols(new Set(JSON.parse(raw)));
      } catch {
        // bỏ qua cấu hình hỏng
      }
    }
  }, []);

  function toggleColumn(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const visibleColumns = useMemo(() => COLUMNS.filter((c) => !hiddenCols.has(c.key)), [hiddenCols]);
  const bulkAllowedTiers = bulkDepartment ? DEPARTMENTS.find((d) => d.id === bulkDepartment)?.tiers ?? [] : TIERS;

  function toggleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = users.filter((u) => {
      const matchesSearch = !term || u.fullName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
      const matchesDept = !departmentFilter || u.department === departmentFilter;
      const matchesTier = !tierFilter || u.tier === tierFilter;
      const matchesStatus = !statusFilter || (statusFilter === 'active' ? u.isActive : !u.isActive);
      return matchesSearch && matchesDept && matchesTier && matchesStatus;
    });

    const getValue = sortKey === 'fullName' ? (u: UserRow) => u.fullName : COLUMNS.find((c) => c.key === sortKey)?.sortValue;
    if (!getValue) return list;

    const sorted = [...list].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb), 'vi');
    });
    if (sortDir === 'desc') sorted.reverse();
    return sorted;
  }, [users, search, departmentFilter, tierFilter, statusFilter, sortKey, sortDir]);

  // Về trang 1 mỗi khi bộ lọc/sắp xếp/kích thước trang đổi, tránh kẹt ở trang trống.
  useEffect(() => {
    setPage(1);
  }, [search, departmentFilter, tierFilter, statusFilter, sortKey, sortDir, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  const pageIds = useMemo(() => paged.map((u) => u.id), [paged]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const selectedUsers = useMemo(() => users.filter((u) => selectedIds.has(u.id)), [users, selectedIds]);

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleToggleActive(user: UserRow) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserAction(user.id, { isActive: !user.isActive });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleUnlock(username: string) {
    setError(null);
    startTransition(async () => {
      try {
        await unlockUserAction(username);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleBulkSetActive(isActive: boolean) {
    setError(null);
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        const result = await bulkUpdateUsersAction(ids, { isActive });
        if (result.failed.length > 0) {
          setError(`Không thể cập nhật ${result.failed.length}/${ids.length} user: ${result.failed[0].message}`);
        }
        clearSelection();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleBulkUnlock() {
    setError(null);
    const usernames = selectedUsers.map((u) => u.username);
    startTransition(async () => {
      try {
        await bulkUnlockUsersAction(usernames);
        clearSelection();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleBulkDepartmentChange(next: Department | '') {
    setBulkDepartment(next);
    const nextAllowed = next ? DEPARTMENTS.find((d) => d.id === next)?.tiers ?? [] : TIERS;
    if (bulkTier && !nextAllowed.includes(bulkTier)) setBulkTier('');
  }

  function handleBulkApplyDeptTier() {
    if (!bulkDepartment && !bulkTier) return;
    setError(null);
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        const input = {
          ...(bulkDepartment ? { department: bulkDepartment } : {}),
          ...(bulkTier ? { tier: bulkTier } : {}),
        };
        const result = await bulkUpdateUsersAction(ids, input);
        if (result.failed.length > 0) {
          setError(`Không thể cập nhật ${result.failed.length}/${ids.length} user: ${result.failed[0].message}`);
        }
        clearSelection();
        setBulkDepartment('');
        setBulkTier('');
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function openAuditLog(user: UserRow) {
    setAuditUser(user);
    setAuditError(null);
    setAuditEntries([]);
    setAuditLoading(true);
    getUserAuditLogAction(user.id)
      .then(setAuditEntries)
      .catch((e) => setAuditError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'))
      .finally(() => setAuditLoading(false));
  }

  function closeAuditLog() {
    setAuditUser(null);
    setAuditEntries([]);
    setAuditError(null);
  }

  function SortableHeader({ colKey, label, sticky }: { colKey: string; label: string; sticky?: boolean }) {
    const active = sortKey === colKey;
    return (
      <TableHead
        className={`whitespace-nowrap border-r border-cyan/20 px-4 py-3 font-semibold uppercase tracking-wide ${
          sticky
            ? 'sticky left-12 top-0 z-20 bg-navy shadow-[6px_0_8px_-6px_rgba(15,23,42,0.45)]'
            : 'sticky top-0 z-10 bg-navy'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleSort(colKey)}
          className="flex min-h-11 items-center gap-1.5 text-cyan outline-none transition-[transform,color] duration-150 ease-[var(--theme-ease)] hover:-translate-y-0.5 hover:text-gold-2 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy active:translate-y-px motion-reduce:transform-none motion-reduce:transition-none"
          aria-label={`Sắp xếp theo ${label}${active ? (sortDir === 'asc' ? ', đang tăng dần' : ', đang giảm dần') : ''}`}
        >
          {label}
          {active ? (
            sortDir === 'asc' ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="size-4" aria-hidden="true" />
          )}
        </button>
      </TableHead>
    );
  }

  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex min-w-0 flex-col gap-4 min-[1025px]:gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 min-[1025px]:grid-cols-4">
          <div className="relative sm:col-span-2 min-[1025px]:col-span-1">
            <Search
              size={16}
              strokeWidth={2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc username…"
              aria-label="Tìm tài khoản"
              className="pl-10"
            />
          </div>
          <NativeSelect
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Lọc theo khối"
            containerClassName="w-full"
          >
            <option value="">Tất cả khối</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            aria-label="Lọc theo cấp"
            containerClassName="w-full"
          >
            <option value="">Tất cả cấp</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {tierLabel(t)}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Lọc theo trạng thái"
            containerClassName="w-full"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã vô hiệu hoá</option>
          </NativeSelect>
          <Popover open={colPickerOpen} onOpenChange={setColPickerOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="justify-start sm:col-span-2 min-[1025px]:col-span-1">
                <SlidersHorizontal aria-hidden="true" />
                Cột hiển thị
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="max-h-80 overflow-y-auto p-2">
              <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Hiện trong bảng
              </p>
              <div className="grid gap-1">
                {COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex min-h-10 cursor-pointer items-center gap-3 rounded-[var(--ui-radius-control)] px-2 py-2 text-sm text-ink hover:bg-surface-2"
                  >
                    <Checkbox
                      checked={!hiddenCols.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                      aria-label={`Hiện cột ${col.label}`}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button asChild className="w-full xl:w-auto">
          <Link href="/dashboard/admin/users/new">
            <UserPlus aria-hidden="true" />
            Tạo tài khoản
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedIds.size > 0 && (
        <Alert variant="warning">
          <ListChecks aria-hidden="true" />
          <AlertDescription className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">{selectedIds.size} đã chọn</Badge>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => handleBulkSetActive(true)}
              >
                Kích hoạt
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleBulkSetActive(false)}
              >
                Vô hiệu hoá
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={handleBulkUnlock}
              >
                Mở khoá
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
                Bỏ chọn
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:border-l xl:border-gold/40 xl:pl-4">
              <NativeSelect
                value={bulkDepartment}
                onChange={(e) => handleBulkDepartmentChange(e.target.value as Department | '')}
                aria-label="Đổi khối cho tài khoản đã chọn"
                containerClassName="w-full sm:w-auto"
                className="h-9"
              >
                <option value="">Giữ nguyên khối</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                value={bulkTier}
                onChange={(e) => setBulkTier(e.target.value as Tier | '')}
                aria-label="Đổi cấp cho tài khoản đã chọn"
                containerClassName="w-full sm:w-auto"
                className="h-9"
              >
                <option value="">Giữ nguyên cấp</option>
                {bulkAllowedTiers.map((t) => (
                  <option key={t} value={t}>
                    {tierLabel(t)}
                  </option>
                ))}
              </NativeSelect>
              <Button
                type="button"
                size="sm"
                disabled={isPending || (!bulkDepartment && !bulkTier)}
                onClick={handleBulkApplyDeptTier}
              >
                Áp dụng
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Gim hàng tiêu đề (sticky top) + gim cột Họ tên (sticky left) — cuộn ngang lẫn dọc trong khung cố định. */}
      <div className="max-h-[70vh] overflow-auto border border-navy/15">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="border-0 bg-navy text-cyan hover:bg-navy">
              <TableHead className="sticky left-0 top-0 z-20 w-12 border-r border-cyan/20 bg-navy px-4 py-3">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleSelectPage}
                  aria-label="Chọn tất cả user trên trang này"
                  className="border-cyan/50 bg-navy data-[state=checked]:border-gold data-[state=checked]:bg-gold data-[state=checked]:text-navy"
                />
              </TableHead>
              <SortableHeader colKey="fullName" label="Họ tên" sticky />
              {visibleColumns.map((col) => (
                <SortableHeader key={col.key} colKey={col.key} label={col.label} />
              ))}
              <TableHead className="sticky top-0 z-10 whitespace-nowrap bg-navy px-4 py-3 text-right font-semibold uppercase tracking-wide text-cyan">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((u, i) => {
              const rowBg = i % 2 === 1 ? 'bg-surface-2' : 'bg-white';
              return (
                <TableRow
                  key={u.id}
                  data-state={selectedIds.has(u.id) ? 'selected' : undefined}
                  className={`${rowBg} hover:bg-info-soft`}
                >
                  <TableCell className={`sticky left-0 z-10 w-12 border-b border-r border-navy/10 px-4 py-3 ${rowBg}`}>
                    <Checkbox
                      checked={selectedIds.has(u.id)}
                      onCheckedChange={() => toggleSelectOne(u.id)}
                      aria-label={`Chọn ${u.fullName}`}
                    />
                  </TableCell>
                  <TableCell
                    className={`sticky left-12 z-10 border-b border-r border-navy/10 px-4 py-3 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.2)] ${rowBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={u.avatarUrl || avatarPlaceholder.src} alt={u.fullName} />
                        <AvatarFallback>{initials(u.fullName)}</AvatarFallback>
                      </Avatar>
                      <span className="whitespace-nowrap font-semibold text-ink">{u.fullName}</span>
                    </div>
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.key} className="whitespace-nowrap border-b border-r border-navy/10 px-4 py-3 text-ink">
                      {col.render(u)}
                    </TableCell>
                  ))}
                  <TableCell className="whitespace-nowrap border-b border-navy/10 px-4 py-3 text-right">
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label={`Hành động cho ${u.fullName}`}>
                              <MoreHorizontal aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Chỉnh sửa và xem nhật ký</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="normal-case tracking-normal text-ink">{u.fullName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/users/${u.id}`}>
                            <Pencil aria-hidden="true" />
                            Sửa hồ sơ
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isPending}
                          variant={u.isActive ? 'destructive' : 'default'}
                          onSelect={() => handleToggleActive(u)}
                        >
                          {u.isActive ? <UserRoundX aria-hidden="true" /> : <UserRoundCheck aria-hidden="true" />}
                          {u.isActive ? 'Vô hiệu hoá' : 'Kích hoạt lại'}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={isPending} onSelect={() => handleUnlock(u.username)}>
                          <KeyRound aria-hidden="true" />
                          Mở khoá đăng nhập
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => openAuditLog(u)}>
                          <History aria-hidden="true" />
                          Xem nhật ký
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumns.length + 3} className="p-0">
                  <Empty>
                    <EmptyMedia><SearchX aria-hidden="true" /></EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>Không có tài khoản phù hợp</EmptyTitle>
                      <EmptyDescription>Thử đổi từ khoá hoặc bỏ bớt bộ lọc đang chọn.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            {filtered.length === 0
              ? '0 kết quả'
              : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} / ${filtered.length} kết quả`}
          </span>
          <NativeSelect
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Số tài khoản mỗi trang"
            className="h-9"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft aria-hidden="true" />
            Trước
          </Button>
          <span className="min-w-20 text-center font-semibold text-navy tabular-nums">
            Trang {safePage}/{pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Sau
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      <Dialog open={auditUser !== null} onOpenChange={(open) => !open && closeAuditLog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nhật ký thao tác</DialogTitle>
            <DialogDescription>
              {auditUser ? `${auditUser.fullName}, @${auditUser.username}` : 'Lịch sử thay đổi tài khoản'}
            </DialogDescription>
          </DialogHeader>

          {auditLoading && (
            <div className="grid gap-3" aria-label="Đang tải nhật ký">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-20" />)}
            </div>
          )}
          {auditError && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{auditError}</AlertDescription>
            </Alert>
          )}
          {!auditLoading && !auditError && auditEntries.length === 0 && (
            <Empty className="min-h-36">
              <EmptyMedia><History aria-hidden="true" /></EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Chưa có thao tác</EmptyTitle>
                <EmptyDescription>Tài khoản này chưa có thay đổi nào được ghi nhận.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <ul className="flex max-h-[50dvh] flex-col gap-3 overflow-y-auto pr-1">
            {auditEntries.map((entry) => (
              <li key={entry.id} className="rounded-[var(--ui-radius-control)] bg-surface-2 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
                  <span className="text-xs text-muted tabular-nums">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Thực hiện bởi: {entry.actorFullName ? `${entry.actorFullName} (@${entry.actorUsername})` : 'Hệ thống'}
                </p>
                <p className="mt-1 leading-relaxed text-ink text-pretty">{formatAuditDetail(entry)}</p>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
