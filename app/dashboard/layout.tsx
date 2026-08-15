import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { departmentLabel, tierLabel } from '@/lib/roles';
import LogoutButton from '@/components/logout-button';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-surface-2">
      <header className="flex items-center justify-between bg-navy px-6 py-4 text-white">
        <div>
          <p className="font-heading text-xs uppercase tracking-[0.3em] text-blue-cta">Ethan Ecom</p>
          <h1 className="font-heading text-lg font-semibold">Nội Bộ</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="font-semibold">{departmentLabel(session.department)}</p>
            <p className="text-white/60">{tierLabel(session.tier)} · {session.username}</p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
