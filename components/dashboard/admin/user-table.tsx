'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, departmentLabel, tierLabel } from '@/lib/roles';
import { updateUserAction, unlockUserAction } from '@/app/dashboard/admin/actions';
import avatarPlaceholder from '@/public/images/avatar-placeholder.jpg';

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
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState('fullName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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
      return matchesSearch && matchesDept;
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
  }, [users, search, departmentFilter, sortKey, sortDir]);

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

  function SortableHeader({ colKey, label, sticky }: { colKey: string; label: string; sticky?: boolean }) {
    const active = sortKey === colKey;
    return (
      <th
        className={`whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide ${
          sticky
            ? 'sticky left-0 top-0 z-20 bg-navy shadow-[6px_0_8px_-6px_rgba(15,23,42,0.45)]'
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
        </div>
        <Link
          href="/dashboard/admin/users/new"
          className="bg-navy px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-all duration-300 hover:bg-gold hover:text-navy hover:shadow-[0_0_24px_-4px_rgba(245,166,35,0.6)]"
        >
          + Tạo user
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Gim hàng tiêu đề (sticky top) + gim cột Họ tên (sticky left) — cuộn ngang lẫn dọc trong khung cố định. */}
      <div className="max-h-[70vh] overflow-auto border border-navy/15">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-navy text-cyan">
              <SortableHeader colKey="fullName" label="Họ tên" sticky />
              {COLUMNS.map((col) => (
                <SortableHeader key={col.key} colKey={col.key} label={col.label} />
              ))}
              <th className="sticky top-0 z-10 whitespace-nowrap bg-navy px-4 py-3 font-semibold uppercase tracking-wide">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const rowBg = i % 2 === 1 ? 'bg-surface-2' : 'bg-white';
              return (
                <tr key={u.id} className={rowBg}>
                  <td
                    className={`sticky left-0 z-10 border-b border-navy/10 px-4 py-3 shadow-[6px_0_8px_-6px_rgba(15,23,42,0.2)] ${rowBg}`}
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
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="whitespace-nowrap border-b border-navy/10 px-4 py-3 text-ink">
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
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="px-4 py-8 text-center text-muted">
                  Không tìm thấy user nào khớp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
