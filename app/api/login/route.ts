import { NextRequest, NextResponse } from 'next/server';
import { findUserByUsername, isRateLimited, recordLoginAttempt } from '@/lib/users';
import { verifyPassword, DUMMY_HASH } from '@/lib/password';
import { createSessionToken, sessionTtlFor, SESSION_COOKIE } from '@/lib/auth';
import { clientIp } from '@/lib/request';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const ip = clientIp(req);

  const rateLimit = await isRateLimited(username, ip);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: `Đăng nhập sai quá nhiều lần. Thử lại sau ${Math.ceil(rateLimit.retryAfterSeconds / 60)} phút.` },
      { status: 429 }
    );
  }

  const user = await findUserByUsername(username);

  // Luôn chạy verifyPassword (kể cả khi user không tồn tại, dùng DUMMY_HASH) để
  // tránh lộ thông tin "tài khoản có tồn tại hay không" qua thời gian phản hồi.
  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : await verifyPassword(password, DUMMY_HASH);
  const ok = !!user && passwordOk;

  await recordLoginAttempt(username, ip, ok);

  if (!ok || !user) {
    return NextResponse.json({ error: 'Tài khoản hoặc mật khẩu không đúng.' }, { status: 401 });
  }

  const ttl = sessionTtlFor(user.tier);
  const token = await createSessionToken(
    {
      userId: user.id,
      username: user.username,
      department: user.department,
      tier: user.tier,
      sessionVersion: user.sessionVersion,
    },
    ttl
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttl,
  });
  return res;
}
