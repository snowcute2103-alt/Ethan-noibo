import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { departmentLabel, tierLabel } from '@/lib/roles';
import { NAV_ITEMS } from '@/lib/nav';
import LogoutButton from '@/components/logout-button';
import NavLink from '@/components/dashboard/nav-link';
import logo from '@/public/images/brand/logo.png';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  // Link "Quản trị" chỉ hiện với BGĐ (tier full) — không đưa vào NAV_ITEMS tĩnh
  // vì lib/nav.ts không có session, thêm điều kiện ngay ở đây (layout đã có session sẵn).
  const navItems =
    session.tier === 'full' ? [...NAV_ITEMS, { href: '/dashboard/admin', label: 'Quản trị' }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-surface-2">
      <header className="relative overflow-hidden bg-navy text-white">
        <div
          className="glow-orb -left-24 -top-32 h-72 w-72 bg-cyan/20"
          aria-hidden="true"
        />
        <div
          className="glow-orb -right-16 -top-24 h-64 w-64 bg-gold/15"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:gap-6 sm:px-8 sm:py-7 lg:py-9">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Image src={logo} alt="Ethan Ecom" className="h-10 w-auto shrink-0 sm:h-14 lg:h-16" priority />
            <div className="min-w-0">
              <p className="hidden font-heading text-sm font-medium uppercase tracking-[0.3em] text-cyan sm:block">
                Ethan Ecom
              </p>
              <h1 className="font-heading whitespace-nowrap text-lg font-medium tracking-wide sm:text-2xl">
                Nội Bộ
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden text-right text-base sm:block">
              <p className="font-semibold">{departmentLabel(session.department)}</p>
              <p className="text-white/60">
                {tierLabel(session.tier)} · {session.username}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
        <nav aria-label="Điều hướng chính" className="relative border-t border-white/10 px-5 sm:px-8">
          <div className="mx-auto flex max-w-[1440px] gap-7 overflow-x-auto py-4 sm:gap-10 sm:py-5">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </nav>
        <div className="gradient-divider" aria-hidden="true" />
      </header>
      <main>{children}</main>
    </div>
  );
}
