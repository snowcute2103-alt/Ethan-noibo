import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminNavTabs from '@/components/dashboard/admin/admin-nav-tabs';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.tier !== 'full') redirect('/dashboard');

  return (
    <div className="mx-auto max-w-[1500px] px-8 py-16 sm:py-20">
      <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">Ban Giám Đốc</p>
      <h1 className="font-heading mt-2 text-4xl font-light uppercase tracking-wide text-navy sm:text-5xl">Quản trị</h1>
      <div className="gradient-divider mt-6 w-24" aria-hidden="true" />
      <AdminNavTabs />
      <div className="mt-10">{children}</div>
    </div>
  );
}
