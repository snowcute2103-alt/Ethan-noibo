import { NextRequest, NextResponse } from 'next/server';
import { findAccount } from '@/lib/users';
import { passwordMatches, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const account = findAccount(username);
  const expected = account ? process.env[account.passwordEnvVar] : undefined;

  // Luôn chạy so sánh (dù account không tồn tại) để tránh lộ thông tin qua thời gian phản hồi.
  const ok = !!account && !!expected && passwordMatches(password, expected);

  if (!ok) {
    return NextResponse.json({ error: 'Tài khoản hoặc mật khẩu không đúng.' }, { status: 401 });
  }

  const token = await createSessionToken({
    username: account!.username,
    department: account!.department,
    tier: account!.tier,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
