import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Không import 'server-only' — file này cần dùng được từ script chạy bằng tsx
// ngoài Next.js runtime (xem lib/db.ts).

const scrypt = promisify(scryptCallback) as (password: string, salt: string, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  const expected = Buffer.from(hashHex, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/**
 * Hash giả cố định — dùng khi username không tồn tại, để verifyPassword vẫn
 * chạy đúng 1 lượt scrypt thật, tránh lộ "tài khoản có tồn tại hay không"
 * qua thời gian phản hồi (scrypt chậm hơn nhiều so với so sánh chuỗi thường).
 */
export const DUMMY_HASH = `${'a'.repeat(32)}:${'b'.repeat(128)}`;

export function generatePassword(length = 12): string {
  return randomBytes(Math.ceil((length * 3) / 4))
    .toString('base64url')
    .slice(0, length);
}
