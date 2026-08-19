'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? 'Có lỗi xảy ra.');
        return;
      }
      setMessage(data?.message ?? 'Yêu cầu đã được gửi.');
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-white/85">{message}</p>
        <Link href="/login" className="link-glow w-fit text-sm font-semibold text-cyan">
          ← Về trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-base font-semibold text-white/95">
          Tài khoản hoặc email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-white/30 focus:border-cyan/60 focus:bg-white/[0.08] sm:px-5 sm:py-3 sm:text-base"
        />
        {focused && (
          <p className="whitespace-nowrap text-[9px] text-white/60 sm:text-[11px] lg:text-sm">
            Nhớ sếp, nhớ đồng nghiệp mà quên mật khẩu thì điền thông tin vào đây.
          </p>
        )}
      </div>

      {error && <p className="text-base text-[#FF8A8A]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="group/button relative mt-1 inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-cta to-cyan px-4 py-3 text-base font-semibold uppercase tracking-wide text-white transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 lg:text-lg"
      >
        <span className="relative z-10">{loading ? 'Đang gửi…' : 'Gửi yêu cầu'}</span>
        <span className="absolute inset-0 flex h-full w-full justify-center transition-transform duration-[2000ms] ease-in-out [transform:skew(-13deg)_translateX(-150%)] group-hover/button:[transform:skew(-13deg)_translateX(150%)]">
          <span className="relative h-full w-8 bg-white/25" />
        </span>
      </button>

      <Link href="/login" className="link-glow w-fit text-sm font-semibold text-white/70 hover:text-cyan">
        ← Về trang đăng nhập
      </Link>
    </form>
  );
}
