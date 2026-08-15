import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { Department, Tier } from './roles';

export const SESSION_COOKIE = 'noibo_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 giờ

export interface SessionPayload {
  username: string;
  department: Department;
  tier: Tier;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET chưa được set (hoặc quá ngắn) trong biến môi trường.');
  }
  return new TextEncoder().encode(secret);
}

/** So sánh mật khẩu theo thời gian cố định, tránh timing attack. */
export function passwordMatches(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.username === 'string' &&
      typeof payload.department === 'string' &&
      typeof payload.tier === 'string'
    ) {
      return {
        username: payload.username,
        department: payload.department as Department,
        tier: payload.tier as Tier,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Đọc session hiện tại từ cookie — dùng trong Server Components / route handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
