'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Camera, CheckCircle2, KeyRound } from 'lucide-react';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, tierLabel, type Department, type Tier } from '@/lib/roles';
import { createUserAction, updateUserAction, resetPasswordAction, uploadAvatarAction } from '@/app/dashboard/admin/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

const fieldGridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2';

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
  const [employmentStatus, setEmploymentStatus] = useState(user?.employmentStatus ?? '');
  const [employmentType, setEmploymentType] = useState(user?.employmentType ?? '');
  const [salaryPolicy, setSalaryPolicy] = useState(user?.salaryPolicy ?? '');
  const [confirmationDate, setConfirmationDate] = useState(user?.confirmationDate ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTiers = DEPARTMENTS.find((d) => d.id === department)?.tiers ?? [];

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarError(null);
    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    uploadAvatarAction(user.id, formData)
      .then((result) => setAvatarUrl(result.avatarUrl))
      .catch((err) => setAvatarError(err instanceof Error ? err.message : 'Có lỗi xảy ra.'))
      .finally(() => {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  }

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
            employmentStatus: employmentStatus || null,
            employmentType: employmentType || null,
            salaryPolicy: salaryPolicy || null,
            confirmationDate: confirmationDate || null,
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
            employmentStatus: employmentStatus || null,
            employmentType: employmentType || null,
            salaryPolicy: salaryPolicy || null,
            confirmationDate: confirmationDate || null,
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
      <Card className="max-w-lg border-2 border-navy">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" aria-hidden="true" />
            <span className="text-sm font-semibold">Tạo thành công</span>
          </div>
          <CardTitle>Mật khẩu đã được tạo</CardTitle>
          <CardDescription>
            Mật khẩu chỉ xuất hiện một lần. Hãy sao chép và gửi cho nhân viên qua kênh an toàn.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field>
            <span className="text-sm font-semibold text-ink">Username</span>
            <code className="border border-[var(--theme-border)] bg-surface-2 px-4 py-3 text-sm text-ink">
              {username || user?.username}
            </code>
          </Field>
          <Field>
            <span className="text-sm font-semibold text-ink">Mật khẩu</span>
            <code className="select-all border border-[var(--theme-border)] bg-surface-2 px-4 py-3 text-sm text-ink">
              {generatedPassword}
            </code>
          </Field>
          <Button type="button" onClick={() => router.push('/dashboard/admin')}>
            Về danh sách
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-4xl flex-col gap-6 min-[1025px]:gap-8">
      <FieldSet>
        <FieldLegend>Tài khoản</FieldLegend>
        <FieldDescription>Thông tin định danh dùng để đăng nhập và hiển thị trong hệ thống.</FieldDescription>
        <FieldGroup className={fieldGridClass}>
          <Field>
            <FieldLabel htmlFor="employee-code">Mã nhân viên</FieldLabel>
            <Input id="employee-code" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={mode === 'edit'}
              autoComplete="username"
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="full-name">Họ tên</FieldLabel>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          {mode === 'edit' && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 sm:col-span-2">
              <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
              <span className="text-sm font-semibold text-ink">Tài khoản đang hoạt động</span>
            </label>
          )}
        </FieldGroup>
      </FieldSet>

      <FieldSet className="border-t border-[var(--theme-border)] pt-6">
        <FieldLegend>Phân quyền</FieldLegend>
        <FieldDescription>Khối và cấp quyết định phạm vi nội dung mà nhân sự có thể truy cập.</FieldDescription>
        <FieldGroup className={fieldGridClass}>
          <Field>
            <FieldLabel htmlFor="department">Khối</FieldLabel>
            <NativeSelect
              id="department"
              value={department}
              onChange={(e) => handleDepartmentChange(e.target.value as Department)}
              containerClassName="w-full"
            >
              {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="tier">Cấp</FieldLabel>
            <NativeSelect
              id="tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              containerClassName="w-full"
            >
              {allowedTiers.map((item) => <option key={item} value={item}>{tierLabel(item)}</option>)}
            </NativeSelect>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="team-label">Team hiển thị</FieldLabel>
            <Input id="team-label" value={teamLabel} onChange={(e) => setTeamLabel(e.target.value)} placeholder="Ví dụ: KD1" />
            <FieldDescription>Trường này chỉ dùng để hiển thị, không dùng để phân quyền.</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className="border-t border-[var(--theme-border)] pt-6">
        <FieldLegend>Liên hệ</FieldLegend>
        <FieldGroup className={fieldGridClass}>
          <Field>
            <FieldLabel htmlFor="personal-email">Email cá nhân</FieldLabel>
            <Input id="personal-email" type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Điện thoại</FieldLabel>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </Field>
        </FieldGroup>
      </FieldSet>

      {mode === 'edit' && (
        <FieldSet className="border-t border-[var(--theme-border)] pt-6">
          <FieldLegend>Ảnh đại diện</FieldLegend>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-14 border border-[var(--theme-border)] min-[1025px]:size-[72px]">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={fullName} width={72} height={72} className="size-full object-cover" />
              ) : (
                <AvatarFallback>Chưa có</AvatarFallback>
              )}
            </Avatar>
            <div className="grid gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploadingAvatar}
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="w-fit"
              >
                <Camera aria-hidden="true" />
                {isUploadingAvatar ? 'Đang tải ảnh' : 'Chọn ảnh mới'}
              </Button>
              <FieldDescription>JPEG, PNG hoặc WebP, tối đa 5MB.</FieldDescription>
            </div>
          </div>
          {avatarError && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{avatarError}</AlertDescription>
            </Alert>
          )}
        </FieldSet>
      )}

      <FieldSet className="border-t border-[var(--theme-border)] pt-6">
        <FieldLegend>Công việc</FieldLegend>
        <FieldGroup className={fieldGridClass}>
          <Field>
            <FieldLabel htmlFor="job-title">Chức danh</FieldLabel>
            <Input id="job-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="position-title">Vị trí công việc</FieldLabel>
            <Input id="position-title" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="office">Văn phòng</FieldLabel>
            <Input id="office" value={office} onChange={(e) => setOffice(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="work-schedule">Lịch làm việc</FieldLabel>
            <Input id="work-schedule" value={workSchedule} onChange={(e) => setWorkSchedule(e.target.value)} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className="border-t border-[var(--theme-border)] pt-6">
        <FieldLegend>Hồ sơ nhân sự</FieldLegend>
        <FieldGroup className={fieldGridClass}>
          <Field>
            <FieldLabel htmlFor="gender">Giới tính</FieldLabel>
            <NativeSelect id="gender" value={gender} onChange={(e) => setGender(e.target.value)} containerClassName="w-full">
              <option value="">Chưa cập nhật</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="birth-date">Ngày sinh</FieldLabel>
            <Input id="birth-date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="start-date">Ngày vào làm</FieldLabel>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmation-date">Ngày chính thức</FieldLabel>
            <Input id="confirmation-date" type="date" value={confirmationDate} onChange={(e) => setConfirmationDate(e.target.value)} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet className="border-t border-[var(--theme-border)] pt-6">
        <FieldLegend>Chính sách nhân sự</FieldLegend>
        <FieldGroup className={fieldGridClass}>
          <Field>
            <FieldLabel htmlFor="employment-status">Trạng thái nhân sự</FieldLabel>
            <Input id="employment-status" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="employment-type">Phân loại nhân sự</FieldLabel>
            <Input id="employment-type" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="salary-policy">Chính sách lương</FieldLabel>
            <Input id="salary-policy" value={salaryPolicy} onChange={(e) => setSalaryPolicy(e.target.value)} />
          </Field>
        </FieldGroup>
      </FieldSet>

      {error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--theme-border)] pt-6 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Đang lưu' : mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
        </Button>
        {mode === 'edit' && (
          <Button type="button" variant="outline" disabled={isPending} onClick={handleResetPassword}>
            <KeyRound aria-hidden="true" />
            Đặt lại mật khẩu
          </Button>
        )}
      </div>
    </form>
  );
}
