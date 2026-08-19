import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.tier !== 'full') redirect('/dashboard');

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-16 sm:py-20">
      <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">Ban Giám Đốc</p>
      <h1 className="font-heading mt-2 text-4xl font-medium tracking-wide text-navy sm:text-5xl">Quản trị</h1>
      <div className="gradient-divider mt-6 w-24" aria-hidden="true" />
      <nav className="mt-6 flex flex-wrap gap-6 border-b border-navy/15 pb-4 text-sm font-semibold uppercase tracking-wide">
        <a href="/dashboard/admin" className="link-glow w-fit text-navy hover:text-blue">
          Tài khoản
        </a>
        <a href="/dashboard/admin/permissions" className="link-glow w-fit text-navy hover:text-blue">
          Quyền tài liệu
        </a>
      </nav>
      <div className="mt-10">{children}</div>
    </div>
  );
}
