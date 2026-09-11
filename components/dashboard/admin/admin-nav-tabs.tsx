'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BellRing, BookOpenCheck, FileKey2, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/dashboard/admin', label: 'Tài khoản', icon: Users, isActive: (p: string) => p === '/dashboard/admin' || p.startsWith('/dashboard/admin/users') },
  { href: '/dashboard/admin/permissions', label: 'Quyền tài liệu', icon: FileKey2, isActive: (p: string) => p.startsWith('/dashboard/admin/permissions') },
  { href: '/dashboard/admin/rules', label: 'Rule', icon: BookOpenCheck, isActive: (p: string) => p.startsWith('/dashboard/admin/rules') },
  {
    href: '/dashboard/admin/announcements',
    label: 'Thông báo',
    icon: BellRing,
    isActive: (p: string) => p.startsWith('/dashboard/admin/announcements'),
  },
];

const REPORTS_TAB = {
  href: '/dashboard/admin/bao-cao',
  label: 'Báo cáo',
  icon: BarChart3,
  isActive: (p: string) => p.startsWith('/dashboard/admin/bao-cao'),
};

interface AdminNavTabsProps {
  /** Báo cáo website chỉ dành riêng cho vài người (canViewWebsiteReports), hẹp
   *  hơn phạm vi "mọi BGĐ" của cả khu Quản trị — nên tab này ẩn/hiện theo
   *  quyền riêng thay vì luôn hiện như 4 tab còn lại. */
  showReportsTab?: boolean;
}

export default function AdminNavTabs({ showReportsTab }: AdminNavTabsProps) {
  const pathname = usePathname();
  const tabs = showReportsTab ? [...TABS, REPORTS_TAB] : TABS;

  return (
    <nav aria-label="Điều hướng quản trị" className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-2">
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-active={active}
            aria-current={active ? 'page' : undefined}
            className={cn(
              buttonVariants({ variant: active ? 'default' : 'ghost' }),
              'min-w-max justify-start px-4 normal-case tracking-normal'
            )}
          >
            <Icon aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
