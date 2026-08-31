'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Làm mới Server Components khi người dùng quay về trang chủ từ một route khác
 * trong dashboard. Lần tải đầu không refresh thêm và pathname không đổi nên
 * router.refresh() không tạo vòng lặp.
 */
export default function RefreshDashboardOnReturn() {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const cameFromAnotherRoute = previousPathname.current !== '/dashboard' && pathname === '/dashboard';
    previousPathname.current = pathname;

    if (cameFromAnotherRoute) router.refresh();
  }, [pathname, router]);

  return null;
}
