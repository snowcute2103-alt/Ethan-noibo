'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/dashboard/admin', label: 'Tài khoản', isActive: (p: string) => p === '/dashboard/admin' || p.startsWith('/dashboard/admin/users') },
  { href: '/dashboard/admin/permissions', label: 'Quyền tài liệu', isActive: (p: string) => p.startsWith('/dashboard/admin/permissions') },
  { href: '/dashboard/admin/rules', label: 'Rule', isActive: (p: string) => p.startsWith('/dashboard/admin/rules') },
  {
    href: '/dashboard/admin/announcements',
    label: 'Thông báo',
    isActive: (p: string) => p.startsWith('/dashboard/admin/announcements'),
  },
];

export default function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex flex-wrap gap-6 border-b border-navy/15 pb-4 text-sm font-semibold uppercase tracking-wide">
      {TABS.map((tab) => {
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-active={active}
            className={`link-glow w-fit hover:text-blue ${active ? 'text-blue' : 'text-navy'}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
