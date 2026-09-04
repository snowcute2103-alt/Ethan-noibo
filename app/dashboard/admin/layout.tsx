import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminNavTabs from '@/components/dashboard/admin/admin-nav-tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.tier !== 'full') redirect('/dashboard');

  return (
    <div className="admin-shell mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 min-[1025px]:px-8 min-[1025px]:py-16">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex flex-wrap items-center gap-2 min-[1025px]:mb-3 min-[1025px]:gap-3">
            <Badge variant="warning">Chỉ dành cho BGĐ</Badge>
            <span className="text-sm text-muted">Khu vực quản lý nội bộ</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold leading-tight text-navy text-balance sm:text-3xl min-[1025px]:text-5xl">Quản trị</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted text-pretty sm:text-base">
            Quản lý tài khoản, quyền truy cập, rule và thông báo từ một nơi.
          </p>
        </div>
      </header>
      <Separator className="mt-6" />
      <AdminNavTabs />
      <div className="mt-5 min-w-0 min-[1025px]:mt-8">{children}</div>
    </div>
  );
}
