'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

interface GlowFieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  rightSlot?: ReactNode;
}

function GlowField({ id, label, type, autoComplete, value, onChange, rightSlot }: GlowFieldProps) {
  const [glow, setGlow] = useState<{ x: number; y: number } | null>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-semibold text-white/95">
        {label}
      </label>
      <div
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setGlow(null)}
      >
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-white/30 focus:border-cyan/60 focus:bg-white/[0.08] sm:px-5 sm:py-3 sm:text-base [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#1c2740_inset] [&:-webkit-autofill]:[transition:background-color_600000s_0s,color_600000s_0s]"
        />
        {glow && (
          <div
            className="pointer-events-none absolute -inset-px rounded-xl"
            style={{
              padding: '1.5px',
              background: `radial-gradient(90px circle at ${glow.x}px ${glow.y}px, rgba(0,210,255,0.95), rgba(245,166,35,0.55) 55%, transparent 75%)`,
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            aria-hidden="true"
          />
        )}
        {rightSlot && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </div>
  );
}

const SOCIAL_BADGES: { name: string; href?: string; icon: ReactNode }[] = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/ethanecom3979',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 lg:h-[22px] lg:w-[22px]" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.5h2.5l.4-3H13.5V8.4c0-.87.24-1.46 1.49-1.46H16.5V4.34C16.2 4.3 15.19 4.2 14 4.2c-2.4 0-4 1.46-4 4.16v2.14H7.5v3H10V21h3.5z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@ethanecommerch',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 lg:h-[22px] lg:w-[22px]" fill="currentColor" aria-hidden="true">
        <path d="M16.5 3c.3 2.1 1.7 3.6 3.9 3.8v2.7c-1.4 0-2.7-.4-3.9-1.2v6.7c0 3.3-2.4 5.8-5.9 5.8-3.4 0-5.9-2.5-5.9-5.8s2.5-5.8 5.9-5.8c.4 0 .8 0 1.2.1v2.8a3 3 0 1 0 2 2.8V3h2.7z" />
      </svg>
    ),
  },
  {
    name: 'Email hỗ trợ',
    href: 'mailto:support@ethanecom.com',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 lg:h-[22px] lg:w-[22px]" fill="currentColor" aria-hidden="true">
        <path d="M12 3.5c-4.7 0-8.5 3.36-8.5 7.5 0 2.36 1.24 4.47 3.19 5.86-.1.75-.44 1.94-1.29 3.14a.4.4 0 0 0 .43.62c1.5-.4 2.9-1.18 3.68-1.69.78.17 1.6.27 2.49.27 4.7 0 8.5-3.36 8.5-7.5S16.7 3.5 12 3.5z" />
      </svg>
    ),
  },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Đăng nhập thất bại.');
        return;
      }
      const from = searchParams.get('from');
      router.replace(from && from.startsWith('/dashboard') ? from : '/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
      <GlowField
        id="username"
        label="Tài khoản"
        type="text"
        autoComplete="username"
        value={username}
        onChange={setUsername}
      />
      <GlowField
        id="password"
        label="Mật khẩu"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="cursor-pointer text-white/60 transition-colors hover:text-cyan"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        }
      />

      <Link href="/quen-mat-khau" className="link-glow -mt-2 w-fit text-sm font-semibold text-white/70 hover:text-cyan">
        Quên mật khẩu?
      </Link>

      {error && <p className="text-base text-[#FF8A8A]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="group/button relative mt-1 inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-cta to-cyan px-4 py-3 text-base font-semibold uppercase tracking-wide text-white transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 lg:text-lg"
      >
        <span className="relative z-10">{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
        <span className="absolute inset-0 flex h-full w-full justify-center transition-transform duration-[2000ms] ease-in-out [transform:skew(-13deg)_translateX(-150%)] group-hover/button:[transform:skew(-13deg)_translateX(150%)]">
          <span className="relative h-full w-8 bg-white/25" />
        </span>
      </button>

      <div className="gradient-divider mt-1" aria-hidden="true" />

      <div>
        <div className="flex items-center justify-center gap-4 [perspective:800px]">
          {SOCIAL_BADGES.map((badge) => {
            const badgeClassName =
              'group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 transition-[border-color,box-shadow] duration-500 hover:border-cyan/50 hover:shadow-[0_0_24px_-4px_rgba(0,210,255,0.6)] lg:h-14 lg:w-14';
            const badgeContent = (
              <>
                <span
                  className="absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-br from-cyan to-blue-cta transition-transform duration-500 ease-in-out group-hover:scale-y-100"
                  aria-hidden="true"
                />
                <span className="relative z-10 text-white/85 transition-all duration-500 ease-in-out [transform-style:preserve-3d] group-hover:text-navy group-hover:[transform:rotateY(360deg)]">
                  {badge.icon}
                </span>
              </>
            );
            const isExternal = badge.href?.startsWith('http');
            return badge.href ? (
              <a
                key={badge.name}
                href={badge.href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                title={badge.name}
                aria-label={badge.name}
                className={`${badgeClassName} cursor-pointer`}
              >
                {badgeContent}
              </a>
            ) : (
              <span key={badge.name} title={badge.name} className={`${badgeClassName} cursor-default`}>
                {badgeContent}
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-center text-sm text-white/75">Ethan Ecom trên mạng xã hội</p>
      </div>
    </form>
  );
}
