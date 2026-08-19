import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { findUserById } from '@/lib/users';
import { NAV_ITEMS } from '@/lib/nav';
import NavLink from '@/components/dashboard/nav-link';
import UserMenu from '@/components/dashboard/user-menu';
import logo from '@/public/images/brand/logo.png';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  // getSession() đã đối chiếu user active trong DB — user luôn tồn tại ở đây.
  const user = await findUserById(session.userId);
  if (!user) redirect('/login');

  // Link "Quản trị" chỉ hiện với BGĐ (tier full) — không đưa vào NAV_ITEMS tĩnh
  // vì lib/nav.ts không có session, thêm điều kiện ngay ở đây (layout đã có session sẵn).
  const navItems =
    session.tier === 'full' ? [...NAV_ITEMS, { href: '/dashboard/admin', label: 'Quản trị' }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-surface-2">
      <header className="relative overflow-hidden bg-navy-deep text-white">
        <div
          className="glow-orb -left-24 -top-32 h-72 w-72 bg-cyan/20"
          aria-hidden="true"
        />
        <div
          className="glow-orb -right-16 -top-24 h-64 w-64 bg-gold/15"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-5 sm:gap-4 sm:px-8 sm:py-7">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Image src={logo} alt="Ethan Ecom" className="h-14 w-auto shrink-0 sm:h-16 lg:h-[4.5rem]" priority />
            <div className="min-w-0">
              <p className="hidden font-heading text-sm font-medium uppercase tracking-[0.3em] text-cyan sm:block">
                Ethan Ecom
              </p>
              <h1 className="font-heading whitespace-nowrap text-lg font-medium tracking-wide sm:text-2xl">
                Nội Bộ
              </h1>
            </div>
          </div>
          <nav
            aria-label="Điều hướng chính"
            className="order-3 w-full lg:order-none lg:w-auto lg:flex-1"
          >
            <div className="flex items-center gap-5 overflow-x-auto border-x border-white/30 px-4 py-2.5 sm:gap-8 sm:px-6 lg:justify-center">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </nav>
          <div className="flex items-center gap-4 text-base sm:gap-6">
            <UserMenu
              user={{
                fullName: user.fullName,
                username: user.username,
                department: user.department,
                tier: user.tier,
                employeeCode: user.employeeCode,
                jobTitle: user.jobTitle,
                positionTitle: user.positionTitle,
                teamLabel: user.teamLabel,
                personalEmail: user.personalEmail,
                phone: user.phone,
                office: user.office,
                avatarUrl: user.avatarUrl,
              }}
            />
          </div>
        </div>
        <div className="gradient-divider" aria-hidden="true" />
      </header>
      <main>{children}</main>
    </div>
  );
}
