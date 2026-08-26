'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { NavItem } from '@/lib/nav';
import NavLink from '@/components/dashboard/nav-link';
import UserMenu, { type UserMenuInfo } from '@/components/dashboard/user-menu';
import { cn } from '@/lib/utils';
import logo from '@/public/images/brand/logo.png';
import { useReducedEffects } from '@/lib/use-reduced-effects';

/** Ngưỡng cuộn (px) trước khi bắt đầu ẩn/hiện — tránh gim/ẩn liên tục khi mới cuộn nhẹ ở đầu trang. */
const SCROLL_THRESHOLD = 80;

export default function DashboardHeader({ navItems, user }: { navItems: NavItem[]; user: UserMenuInfo }) {
  const headerRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [height, setHeight] = useState(0);
  const reduceEffects = useReducedEffects();

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceEffects) {
      setHidden(false);
      return;
    }
    let lastY = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      if (y < SCROLL_THRESHOLD) setHidden(false);
      else setHidden(y > lastY);
      lastY = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduceEffects]);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'fixed inset-x-0 top-0 z-50 overflow-hidden bg-navy-deep text-white transition-transform duration-300 ease-out',
          hidden ? '-translate-y-full' : 'translate-y-0'
        )}
      >
        <div className="glow-orb -left-24 -top-32 h-72 w-72 bg-cyan/20" aria-hidden="true" />
        <div className="glow-orb -right-16 -top-24 h-64 w-64 bg-gold/15" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/dashboard" aria-label="Về trang chủ" className="shrink-0">
              <Image src={logo} alt="Ethan Ecom" className="h-14 w-auto shrink-0 sm:h-16 lg:h-24" priority />
            </Link>
          </div>
          <nav aria-label="Điều hướng chính" className="order-3 w-full lg:order-none lg:w-auto lg:flex-1">
            <div className="flex items-center gap-5 overflow-x-auto border-x border-white/30 px-4 py-2.5 sm:gap-8 sm:px-6 lg:justify-center">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </nav>
          <div className="flex items-center gap-4 text-base sm:gap-6">
            <UserMenu user={user} />
          </div>
        </div>
        <div className="gradient-divider" aria-hidden="true" />
      </header>
      <div style={{ height }} aria-hidden="true" />
    </>
  );
}
