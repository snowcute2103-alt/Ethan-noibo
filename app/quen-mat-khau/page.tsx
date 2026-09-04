import Image from 'next/image';
import ForgotPasswordForm from './forgot-password-form';
import MouseGlowPanel from '@/app/login/mouse-glow-panel';
import logo from '@/public/images/brand/logo.png';

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page relative flex min-h-[100dvh] items-center [justify-content:safe_center] overflow-x-hidden overflow-y-auto bg-[#05060a] px-3 py-3 sm:px-6 sm:py-6 min-[1025px]:min-h-screen min-[1025px]:justify-center min-[1025px]:overflow-hidden min-[1025px]:px-4 min-[1025px]:py-10">
      <div className="glow-orb -left-32 top-0 h-96 w-96 bg-cyan/15" aria-hidden="true" />
      <div className="glow-orb -right-24 bottom-0 h-80 w-80 bg-gold/10" aria-hidden="true" />

      <MouseGlowPanel className="auth-card relative flex w-full max-w-[480px] flex-col gap-4 overflow-hidden border border-cyan/20 bg-navy-2 px-4 py-6 shadow-[0_0_140px_-20px_rgba(0,82,204,0.5),0_40px_100px_-24px_rgba(0,0,0,0.8)] sm:max-w-[560px] sm:px-8 sm:py-8 min-[1025px]:gap-6 min-[1025px]:px-10 min-[1025px]:py-10">
        <div className="glow-orb -right-10 -top-10 h-52 w-52 bg-cyan/10" aria-hidden="true" />

        <div className="relative flex flex-col items-center gap-3">
          <Image src={logo} alt="Ethan Ecom" className="h-16 w-auto drop-shadow-[0_0_30px_rgba(0,210,255,0.35)] sm:h-20 min-[1025px]:h-24" priority />
          <h1 className="font-heading text-xl font-medium uppercase tracking-wide text-white sm:text-2xl min-[1025px]:text-3xl">
            Quên mật khẩu
          </h1>
          <p className="text-center text-xs text-white/75 sm:text-sm min-[1025px]:whitespace-nowrap">
            Nhập tài khoản để gửi yêu cầu đặt lại mật khẩu tới Ban Giám Đốc.
          </p>
        </div>

        <ForgotPasswordForm />
      </MouseGlowPanel>
    </main>
  );
}
