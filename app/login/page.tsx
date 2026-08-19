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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060a] px-4 py-10">
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
        className="pointer-events-none absolute bottom-0 left-1/2 h-[420px] w-[85%] max-w-[1100px] -translate-x-1/2 translate-y-1/4 rounded-full bg-blue-cta/60 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-2/3 -translate-x-1/2 translate-y-1/3 rounded-full bg-cyan/50 blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative grid w-full max-w-[1400px] overflow-hidden border border-cyan/20 bg-navy-2 shadow-[0_0_140px_-20px_rgba(0,82,204,0.5),0_40px_100px_-24px_rgba(0,0,0,0.8)] lg:min-h-[680px] lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <Image src={loginImg} alt="" fill sizes="700px" className="object-cover" priority />
          <div
            className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/50 to-navy-deep/10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-navy-deep/70 via-transparent to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 p-14">
            <p className="font-heading whitespace-nowrap text-xl font-semibold uppercase tracking-wide text-white sm:text-2xl">
              Cổng thông tin nội bộ ETHAN ECOM
            </p>
            <p className="mt-1 whitespace-nowrap text-base leading-relaxed text-white/90 lg:text-lg">
              Nơi đồng lòng, tử tế, trách nhiệm được nuôi dưỡng mỗi ngày.
            </p>
          </div>
        </div>

        <MouseGlowPanel className="relative flex flex-col justify-center gap-9 overflow-hidden px-8 py-14 sm:px-14 sm:py-16 lg:px-16">
          <div className="glow-orb -right-10 -top-10 h-52 w-52 bg-cyan/10" aria-hidden="true" />

          <div className="relative flex flex-col gap-5">
            <div className="relative -ml-2 w-fit">
              <div className="glow-orb -left-8 -top-8 h-40 w-40 bg-cyan/25" aria-hidden="true" />
              <Image src={logo} alt="Ethan Ecom" className="relative h-24 w-auto drop-shadow-[0_0_30px_rgba(0,210,255,0.35)] sm:h-28" priority />
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-heading text-sm font-medium uppercase tracking-[0.35em] text-cyan">Ethan Ecom</p>
              <h1 className="font-heading text-4xl font-medium uppercase tracking-wide text-white sm:text-5xl">Đăng nhập</h1>
            </div>
          </div>
          <p className="relative text-base text-white/75">Đăng nhập bằng tài khoản khối/vị trí của bạn</p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </MouseGlowPanel>
      </div>
    </main>
  );
}
