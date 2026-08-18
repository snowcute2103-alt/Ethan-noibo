'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, type Department, type Tier } from '@/lib/roles';
import { createUserAction, updateUserAction, resetPasswordAction } from '@/app/dashboard/admin/actions';

const inputClass = 'border border-[#e0e7f3] bg-[#fafbff] px-4 py-3 text-sm outline-none focus:border-blue';
const labelClass = 'text-sm font-semibold text-ink';

export default function UserForm({ mode, user }: { mode: 'create' | 'edit'; user?: UserRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const [employeeCode, setEmployeeCode] = useState(user?.employeeCode ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [department, setDepartment] = useState<Department>(user?.department ?? 'kinh-doanh');
  const [tier, setTier] = useState<Tier>(user?.tier ?? 'staff');
  const [teamLabel, setTeamLabel] = useState(user?.teamLabel ?? '');
  const [personalEmail, setPersonalEmail] = useState(user?.personalEmail ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '');
  const [positionTitle, setPositionTitle] = useState(user?.positionTitle ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [office, setOffice] = useState(user?.office ?? '');
  const [startDate, setStartDate] = useState(user?.startDate ?? '');
  const [workSchedule, setWorkSchedule] = useState(user?.workSchedule ?? '');

  const allowedTiers = DEPARTMENTS.find((d) => d.id === department)?.tiers ?? [];

  function handleDepartmentChange(next: Department) {
    setDepartment(next);
    const nextAllowed = DEPARTMENTS.find((d) => d.id === next)?.tiers ?? [];
    if (!nextAllowed.includes(tier)) setTier(nextAllowed[0]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (mode === 'create') {
          const result = await createUserAction({
            employeeCode: employeeCode || null,
            username,
            fullName,
            department,
            tier,
            teamLabel: teamLabel || null,
            personalEmail: personalEmail || null,
            phone: phone || null,
            jobTitle: jobTitle || null,
            positionTitle: positionTitle || null,
            gender: gender || null,
            birthDate: birthDate || null,
            office: office || null,
            startDate: startDate || null,
            workSchedule: workSchedule || null,
          });
          setGeneratedPassword(result.password);
        } else if (user) {
          await updateUserAction(user.id, {
            fullName,
            department,
            tier,
            teamLabel: teamLabel || null,
            personalEmail: personalEmail || null,
            phone: phone || null,
            isActive,
            jobTitle: jobTitle || null,
            positionTitle: positionTitle || null,
            gender: gender || null,
            birthDate: birthDate || null,
            office: office || null,
            startDate: startDate || null,
            workSchedule: workSchedule || null,
          });
          router.push('/dashboard/admin');
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleResetPassword() {
    if (!user) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await resetPasswordAction(user.id);
        setGeneratedPassword(result.password);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  if (generatedPassword) {
    return (
      <div className="flex max-w-lg flex-col gap-5 border-2 border-navy bg-white p-8">
        <p className="font-heading text-lg font-medium text-navy">Mật khẩu đã được tạo</p>
        <p className="text-sm text-muted">
          Đây là lần DUY NHẤT mật khẩu hiện ra — copy ngay và gửi cho nhân viên qua kênh an toàn. Mật khẩu không được
          lưu lại ở đâu khác.
        </p>
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Username</span>
          <code className="border border-[#e0e7f3] bg-[#fafbff] px-4 py-3 text-sm">{username || user?.username}</code>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Mật khẩu</span>
          <code className="select-all border border-[#e0e7f3] bg-[#fafbff] px-4 py-3 text-sm">{generatedPassword}</code>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard/admin')}
          className="mt-2 bg-navy py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gold hover:text-navy"
        >
          Đã lưu — về danh sách
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Mã nhân viên</label>
          <input value={employeeCode ?? ''} onChange={(e) => setEmployeeCode(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={mode === 'edit'}
            className={`${inputClass} disabled:bg-surface-2 disabled:text-muted`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Họ tên</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Khối</label>
          <select
            value={department}
            onChange={(e) => handleDepartmentChange(e.target.value as Department)}
            className={inputClass}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Cấp</label>
          <select value={tier} onChange={(e) => setTier(e.target.value as Tier)} className={inputClass}>
            {allowedTiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Team (hiển thị, vd &quot;KD1&quot;) — không dùng để phân quyền</label>
        <input value={teamLabel ?? ''} onChange={(e) => setTeamLabel(e.target.value)} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Email cá nhân</label>
          <input
            type="email"
            value={personalEmail ?? ''}
            onChange={(e) => setPersonalEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Điện thoại</label>
          <input value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="mt-2 border-t border-navy/15 pt-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Thông tin nhân sự</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Chức danh</label>
            <input value={jobTitle ?? ''} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Vị trí công việc</label>
            <input
              value={positionTitle ?? ''}
              onChange={(e) => setPositionTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Giới tính</label>
            <select value={gender ?? ''} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ngày sinh</label>
            <input
              type="date"
              value={birthDate ?? ''}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Văn phòng</label>
            <input value={office ?? ''} onChange={(e) => setOffice(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ngày vào làm</label>
            <input
              type="date"
              value={startDate ?? ''}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>Lịch làm việc</label>
            <input
              value={workSchedule ?? ''}
              onChange={(e) => setWorkSchedule(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {mode === 'edit' && (
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Tài khoản đang hoạt động
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="bg-navy px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Đang lưu…' : mode === 'create' ? 'Tạo user' : 'Lưu thay đổi'}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleResetPassword}
            className="border border-navy px-6 py-3 text-sm font-semibold uppercase tracking-wide text-navy transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Đặt lại mật khẩu
          </button>
        )}
      </div>
    </form>
  );
}
