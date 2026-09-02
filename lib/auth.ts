import 'server-only';
import { cache } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Department, Tier } from './roles';
import { getSessionCheck } from './users';

export const SESSION_COOKIE = 'noibo_session';

export interface SessionPayload {
  userId: number;
  username: string;
  department: Department;
  tier: Tier;
  sessionVersion: number;
}

/** BGĐ (tier full) có phiên ngắn hơn hẳn — bảo mật cao hơn cho tài khoản quản trị. */
export function sessionTtlFor(tier: Tier): number {
  return tier === 'full' ? 2 * 60 * 60 : 12 * 60 * 60;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET chưa được set (hoặc quá ngắn) trong biến môi trường.');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload, ttlSeconds: number): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.userId === 'number' &&
      typeof payload.username === 'string' &&
      typeof payload.department === 'string' &&
      typeof payload.tier === 'string' &&
      typeof payload.sessionVersion === 'number'
    ) {
      return {
        userId: payload.userId,
        username: payload.username,
        department: payload.department as Department,
        tier: payload.tier as Tier,
        sessionVersion: payload.sessionVersion,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Đọc session hiện tại từ cookie — dùng trong Server Components / route handlers.
 * Ngoài verify chữ ký JWT, còn đối chiếu session_version/is_active hiện tại
 * trong DB — cho phép thu hồi phiên ngay khi bị deactivate/đổi mật khẩu/đổi
 * quyền, thay vì phải chờ hết hạn JWT (proxy.ts vẫn chỉ verify chữ ký, nhẹ,
 * không tra DB — xem lib/README hoặc phase-03 trong plan).
 */
async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const check = await getSessionCheck(payload.userId);
  if (!check || !check.isActive || check.sessionVersion !== payload.sessionVersion) {
    return null;
  }
  return payload;
}

/** React cache chỉ memoize trong một lượt Server Component render/request.
 * Layout và page thường cùng gọi getSession(); dedupe ở đây giữ nguyên bước
 * kiểm tra session_version cho request mới nhưng không query users hai lần
 * trong cùng một render. */
export const getSession = cache(readSession);
