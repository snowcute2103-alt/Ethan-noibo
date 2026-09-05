'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { NavItem } from '@/lib/nav';
import NavLink from '@/components/dashboard/nav-link';
import UserMenu, { type UserMenuInfo } from '@/components/dashboard/user-menu';
import {
  DASHBOARD_HEADER_VISIBILITY_EVENT,
  type DashboardHeaderVisibilityDetail,
} from '@/components/dashboard/dashboard-header-visibility-trigger';
import logo from '@/public/images/brand/logo.png';

export default function DashboardHeader({ navItems, user }: { navItems: NavItem[]; user: UserMenuInfo }) {
  const headerRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(0);
  const [hiddenBySection, setHiddenBySection] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleVisibility(event: Event) {
      setHiddenBySection((event as CustomEvent<DashboardHeaderVisibilityDetail>).detail.hidden);
    }
    window.addEventListener(DASHBOARD_HEADER_VISIBILITY_EVENT, handleVisibility);
    return () => window.removeEventListener(DASHBOARD_HEADER_VISIBILITY_EVENT, handleVisibility);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        aria-hidden={hiddenBySection || undefined}
        inert={hiddenBySection || undefined}
        className={`fixed inset-x-0 top-0 z-50 overflow-hidden bg-navy-deep text-white transition-[transform,opacity] duration-300 ease-[var(--theme-ease)] motion-reduce:transition-none ${
          hiddenBySection ? 'pointer-events-none -translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="glow-orb -left-24 -top-32 h-72 w-72 bg-cyan/20" aria-hidden="true" />
        <div className="glow-orb -right-16 -top-24 h-64 w-64 bg-gold/15" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:gap-3 sm:px-6 sm:py-3 min-[1025px]:gap-4 min-[1025px]:px-8 min-[1025px]:py-7">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 min-[1025px]:gap-4">
            <Link href="/dashboard" aria-label="Về trang chủ" className="shrink-0">
              <Image src={logo} alt="Ethan Ecom" className="h-11 w-auto shrink-0 sm:h-[52px] min-[1025px]:h-24" priority />
            </Link>
          </div>
          <nav aria-label="Điều hướng chính" className="order-3 w-full min-w-0 min-[1025px]:order-none min-[1025px]:w-auto min-[1025px]:flex-1">
            <div className="scrollbar-hide flex max-w-full items-center gap-3 overflow-x-auto overscroll-x-contain border-x border-white/30 px-3 py-1.5 sm:gap-5 sm:px-4 sm:py-2 min-[1025px]:justify-center min-[1025px]:gap-8 min-[1025px]:px-6 min-[1025px]:py-2.5">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </nav>
          <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3 min-[1025px]:gap-6 min-[1025px]:text-base">
            <UserMenu user={user} />
          </div>
        </div>
        <div className="gradient-divider" aria-hidden="true" />
      </header>
      <div style={{ height }} aria-hidden="true" />
    </>
  );
}
