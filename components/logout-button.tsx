'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white hover:text-white"
    >
      Đăng xuất
    </button>
  );
}
