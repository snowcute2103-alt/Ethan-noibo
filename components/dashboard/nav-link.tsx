'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/nav';

export default function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`relative whitespace-nowrap px-1 py-1 text-base font-semibold transition-colors ${
        active ? 'text-white' : 'text-white/55 hover:text-white'
      }`}
    >
      {item.label}
      {active && <span className="absolute -bottom-[15px] left-0 right-0 h-[3px] bg-gold" aria-hidden="true" />}
    </Link>
  );
}
