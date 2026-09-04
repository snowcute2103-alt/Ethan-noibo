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
      data-active={active}
      className={`link-glow relative min-h-[44px] whitespace-nowrap px-1 pb-1.5 pt-2 text-[11px] font-normal uppercase tracking-[0.06em] transition-colors sm:text-xs min-[1025px]:min-h-0 min-[1025px]:pb-2 min-[1025px]:pt-0 min-[1025px]:text-base min-[1025px]:tracking-wide ${
        active ? 'text-white' : 'text-white/55 hover:text-white'
      }`}
    >
      {item.label}
    </Link>
  );
}
