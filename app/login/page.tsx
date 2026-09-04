import { Suspense } from 'react';
import Image from 'next/image';
import LoginForm from './login-form';
import MouseGlowPanel from './mouse-glow-panel';
import logo from '@/public/images/brand/logo.png';
import loginImg from '@/public/images/login/dang-nhap.jpeg';

const STARS = [
  { left: '4%', size: 2, duration: 11, delay: 0 },
  { left: '10%', size: 3, duration: 15, delay: 3 },
  { left: '17%', size: 2, duration: 9, delay: 6 },
  { left: '24%', size: 3, duration: 13, delay: 1.5 },
  { left: '31%', size: 2, duration: 10, delay: 8 },
  { left: '38%', size: 3, duration: 16, delay: 4.5 },
  { left: '45%', size: 2, duration: 12, delay: 2 },
  { left: '52%', size: 3, duration: 9, delay: 7 },
  { left: '59%', size: 2, duration: 14, delay: 0.8 },
  { left: '66%', size: 3, duration: 11, delay: 5.2 },
  { left: '73%', size: 2, duration: 13, delay: 9 },
  { left: '80%', size: 3, duration: 10, delay: 3.6 },
  { left: '87%', size: 2, duration: 15, delay: 6.4 },
  { left: '93%', size: 3, duration: 12, delay: 1.1 },
  { left: '55%', size: 2, duration: 17, delay: 10.5 },
  { left: '20%', size: 2, duration: 14, delay: 12 },
  { left: '68%', size: 2, duration: 9, delay: 11 },
  { left: '35%', size: 3, duration: 18, delay: 2.8 },
];

export default function LoginPage() {
  return (
    <main className="auth-page relative flex min-h-[100dvh] items-center [justify-content:safe_center] overflow-x-hidden overflow-y-auto bg-[#05060a] px-3 py-3 sm:px-6 sm:py-6 min-[1025px]:min-h-screen min-[1025px]:justify-center min-[1025px]:overflow-hidden min-[1025px]:px-4 min-[1025px]:py-10">
      <div className="glow-orb -left-32 top-0 h-96 w-96 bg-cyan/15" aria-hidden="true" />
      <div className="glow-orb -right-24 bottom-0 h-80 w-80 bg-gold/10" aria-hidden="true" />
      <div className="glow-orb left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 bg-blue/10" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="animate-star-rise absolute bottom-0 rounded-full bg-white"
            style={{
              left: star.left,
              width: star.size,
              height: star.size,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div
        className="auth-ambient pointer-events-none absolute bottom-0 left-1/2 h-[420px] w-[85%] max-w-[1100px] -translate-x-1/2 translate-y-1/4 rounded-full bg-blue-cta/35 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="auth-ambient pointer-events-none absolute bottom-0 left-1/2 h-64 w-2/3 -translate-x-1/2 translate-y-1/3 rounded-full bg-cyan/25 blur-[90px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[380px] bg-gradient-to-t from-[#05060a] via-[#05060a]/70 to-transparent"
        aria-hidden="true"
      />

      <div className="auth-card relative grid w-full max-w-[1220px] overflow-hidden border border-cyan/20 bg-navy-2 shadow-[0_0_140px_-20px_rgba(0,82,204,0.5),0_40px_100px_-24px_rgba(0,0,0,0.8)] md:min-h-[500px] md:grid-cols-[0.9fr_1.1fr] min-[1025px]:min-h-[480px] min-[1025px]:grid-cols-2">
        <div className="relative h-28 sm:h-36 md:h-auto">
          <Image src={loginImg} alt="" fill sizes="(max-width: 1024px) 100vw, 700px" className="object-cover" priority />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/50 to-navy-deep/10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-navy-deep/70 via-transparent to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 p-3 pr-4 sm:p-5 sm:pr-6 min-[1025px]:p-10 min-[1025px]:pr-12">
            <p className="font-heading text-xs font-semibold uppercase tracking-wide text-white sm:text-sm min-[1025px]:whitespace-nowrap min-[1025px]:text-xl">
              Cổng thông tin nội bộ
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/90 sm:text-xs min-[1025px]:whitespace-nowrap min-[1025px]:text-base">
              Tại Ethan Ecom, nơi mỗi cá nhân là một mảnh ghép quan trọng.
            </p>
          </div>
        </div>

        <MouseGlowPanel className="relative flex flex-col justify-center gap-4 overflow-hidden px-4 py-5 sm:px-8 sm:py-7 md:px-8 min-[1025px]:gap-7 min-[1025px]:px-16 min-[1025px]:py-10">
          <div className="glow-orb -right-10 -top-10 h-52 w-52 bg-cyan/10" aria-hidden="true" />

          <div className="relative flex flex-col items-center gap-2 sm:items-start sm:gap-3 min-[1025px]:gap-4">
            <div className="relative w-fit min-[1025px]:-ml-2">
              <div className="glow-orb -left-8 -top-8 h-40 w-40 bg-cyan/25" aria-hidden="true" />
              <Image
                src={logo}
                alt="Ethan Ecom"
                className="relative h-14 w-auto drop-shadow-[0_0_30px_rgba(0,210,255,0.35)] sm:h-[72px] min-[1025px]:h-28"
                priority
              />
            </div>
            <h1 className="font-heading text-xl font-medium uppercase tracking-wide text-white sm:text-2xl md:text-3xl min-[1025px]:text-5xl">Đăng nhập</h1>
          </div>
          <p className="relative -mt-1 text-xs text-white/75 sm:-mt-2 sm:text-sm min-[1025px]:-mt-4 min-[1025px]:text-lg">Sử dụng tài khoản được cấp theo khối/ vị trí của bạn</p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </MouseGlowPanel>
      </div>
    </main>
  );
}
