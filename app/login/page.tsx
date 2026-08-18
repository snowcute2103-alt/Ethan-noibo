import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
      <div className="w-full max-w-sm bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="font-heading text-xs font-medium uppercase tracking-[0.3em] text-blue">Ethan Ecom</p>
          <h1 className="font-heading mt-2 text-2xl font-medium tracking-wide text-navy">Nội Bộ</h1>
          <p className="mt-1 text-sm text-muted">Đăng nhập bằng tài khoản khối/vị trí của bạn</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
