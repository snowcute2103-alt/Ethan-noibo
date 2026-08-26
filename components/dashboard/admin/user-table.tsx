'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, SlidersHorizontal } from 'lucide-react';
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
      <span className={u.isActive ? 'text-blue' : 'text-muted'}>{u.isActive ? 'Hoạt động' : 'Đã vô hiệu hoá'}</span>
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
      <th
        className={`whitespace-nowrap border-r border-cyan/20 px-4 py-3 font-semibold uppercase tracking-wide ${
          sticky
            ? 'sticky left-12 top-0 z-20 bg-navy shadow-[6px_0_8px_-6px_rgba(15,23,42,0.45)]'
            : 'sticky top-0 z-10 bg-navy'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleSort(colKey)}
          className="flex items-center gap-1.5 transition hover:text-gold-2"
        >
          {label}
          <span className="text-[10px] leading-none">{active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
        </button>
      </th>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc username…"
              className="border border-[#e0e7f3] bg-[#fafbff] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="">Tất cả khối</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="">Tất cả cấp</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {tierLabel(t)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã vô hiệu hoá</option>
          </select>
          <div className="relative">
            <button
              type="button"
              onClick={() => setColPickerOpen((v) => !v)}
              className="flex items-center gap-2 border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm text-ink outline-none hover:border-blue"
            >
              <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
              Cột hiển thị
            </button>
            {colPickerOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setColPickerOpen(false)} />
                <div className="absolute left-0 top-full z-40 mt-1 max-h-80 w-64 overflow-y-auto border border-navy/15 bg-white p-3 shadow-lg">
                  {COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 px-1 py-1.5 text-sm text-ink hover:bg-surface-2">
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="h-4 w-4 accent-gold"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/admin/users/new"
          className="bg-navy px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:bg-gold hover:text-navy hover:shadow-[0_0_24px_-4px_rgba(245,166,35,0.6)]"
        >
          + Tạo user
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-4 border-2 border-gold/60 bg-[#fffaf0] px-5 py-3">
          <span className="text-sm font-semibold text-navy">Đã chọn {selectedIds.size} user</span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkSetActive(true)}
              className="text-blue hover:underline disabled:opacity-50"
            >
              Kích hoạt
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBulkSetActive(false)}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              Vô hiệu hoá
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleBulkUnlock}
              className="text-muted hover:underline disabled:opacity-50"
            >
              Mở khoá
            </button>
            <button type="button" onClick={clearSelection} className="text-ink hover:underline">
              Bỏ chọn
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-l border-gold/40 pl-4 normal-case">
            <select
              value={bulkDepartment}
              onChange={(e) => handleBulkDepartmentChange(e.target.value as Department | '')}
              className="border border-[#e0e7f3] bg-white px-3 py-1.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Giữ nguyên khối</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              value={bulkTier}
              onChange={(e) => setBulkTier(e.target.value as Tier | '')}
              className="border border-[#e0e7f3] bg-white px-3 py-1.5 text-sm outline-none focus:border-blue"
            >
              <option value="">Giữ nguyên cấp</option>
              {bulkAllowedTiers.map((t) => (
                <option key={t} value={t}>
                  {tierLabel(t)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPending || (!bulkDepartment && !bulkTier)}
              onClick={handleBulkApplyDeptTier}
              className="bg-navy px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Gim hàng tiêu đề (sticky top) + gim cột Họ tên (sticky left) — cuộn ngang lẫn dọc trong khung cố định. */}
      <div className="max-h-[70vh] overflow-auto border border-navy/15">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="bg-navy text-cyan">
              <th className="sticky left-0 top-0 z-20 w-12 border-r border-cyan/20 bg-navy px-4 py-3">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allPageSelected && somePageSelected;
                  }}
                  onChange={toggleSelectPage}
                  aria-label="Chọn tất cả user trên trang này"
                  className="h-4 w-4 accent-gold"
                />
              </th>
              <SortableHeader colKey="fullName" label="Họ tên" sticky />
              {visibleColumns.map((col) => (
                <SortableHeader key={col.key} colKey={col.key} label={col.label} />
              ))}
              <th className="sticky top-0 z-10 whitespace-nowrap bg-navy px-4 py-3 font-semibold uppercase tracking-wide">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((u, i) => {
              const rowBg = i % 2 === 1 ? 'bg-surface-2' : 'bg-white';
              return (
                <tr key={u.id} className={rowBg}>
                  <td className={`sticky left-0 z-10 w-12 border-b border-r border-navy/10 px-4 py-3 ${rowBg}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelectOne(u.id)}
                      aria-label={`Chọn ${u.fullName}`}
                      className="h-4 w-4 accent-gold"
                    />
                  </td>
                  <td
                    className={`sticky left-12 z-10 border-b border-r border-navy/10 px-4 py-3 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.2)] ${rowBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        // TODO: ảnh tạm — thay bằng avatar thật khi import ảnh nhân sự.
                        src={u.avatarUrl || avatarPlaceholder}
                        alt={u.fullName}
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 rounded-full bg-surface-2 object-cover"
                      />
                      <span className="whitespace-nowrap text-ink">{u.fullName}</span>
                    </div>
                  </td>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap border-b border-r border-navy/10 px-4 py-3 text-ink">
                      {col.render(u)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap border-b border-navy/10 px-4 py-3">
                    <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
                      <Link href={`/dashboard/admin/users/${u.id}`} className="text-blue hover:underline">
                        Sửa
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(u)}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {u.isActive ? 'Vô hiệu hoá' : 'Kích hoạt lại'}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUnlock(u.username)}
                        className="text-muted hover:underline disabled:opacity-50"
                      >
                        Mở khoá
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuditLog(u)}
                        className="text-navy hover:underline"
                      >
                        Nhật ký
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + 3} className="px-4 py-8 text-center text-muted">
                  Không tìm thấy user nào khớp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <div className="flex items-center gap-3">
          <span>
            {filtered.length === 0
              ? '0 kết quả'
              : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} / ${filtered.length} kết quả`}
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-[#e0e7f3] bg-[#fafbff] px-3 py-1.5 text-sm outline-none focus:border-blue"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="border border-navy/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy hover:bg-surface-2 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-navy">
            Trang {safePage}/{pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="border border-navy/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy hover:bg-surface-2 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>

      {auditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-4 border-2 border-navy bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-heading text-lg font-medium text-navy">Nhật ký thao tác</p>
                <p className="text-sm text-muted">
                  {auditUser.fullName} · @{auditUser.username}
                </p>
              </div>
              <button type="button" onClick={closeAuditLog} className="text-sm font-semibold text-muted hover:text-ink">
                Đóng
              </button>
            </div>

            {auditLoading && <p className="text-sm text-muted">Đang tải…</p>}
            {auditError && <p className="text-sm text-red-600">{auditError}</p>}
            {!auditLoading && !auditError && auditEntries.length === 0 && (
              <p className="text-sm text-muted">Chưa có thao tác nào được ghi nhận.</p>
            )}

            <ul className="flex flex-col gap-3 overflow-y-auto">
              {auditEntries.map((entry) => (
                <li key={entry.id} className="border border-navy/10 bg-surface-2/60 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
                    <span className="text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Thực hiện bởi: {entry.actorFullName ? `${entry.actorFullName} (@${entry.actorUsername})` : 'Hệ thống'}
                  </p>
                  <p className="mt-1 text-ink">{formatAuditDetail(entry)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
