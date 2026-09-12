import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getSession } from '@/lib/auth';
import { findUserById } from '@/lib/users';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

const CIRCLE_MASK = Buffer.from(
  `<svg width="${size.width}" height="${size.height}"><circle cx="${size.width / 2}" cy="${size.height / 2}" r="${size.width / 2}" fill="#fff"/></svg>`
);

/** Bo tròn bằng sharp thay vì next/og (satori) — satori không giải mã được WEBP,
 * mà avatar upload trong app đang lưu dạng WEBP nên favicon avatar bị render trống. */
async function toCircularPng(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(size.width, size.height, { fit: 'cover' })
    .composite([{ input: CIRCLE_MASK, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function defaultIcon(): Promise<Buffer> {
  const bytes = await readFile(path.join(process.cwd(), 'app/icon.png'));
  return toCircularPng(bytes);
}

/** Favicon riêng cho nhánh /dashboard — bo tròn avatar người đang đăng nhập. Rơi
 * về logo mặc định khi chưa đăng nhập, chưa có avatar, tải avatar lỗi, hoặc
 * sharp không dựng được ảnh đó. */
export default async function Icon(): Promise<Response> {
  const session = await getSession();
  const user = session ? await findUserById(session.userId) : null;

  if (user?.avatarUrl) {
    try {
      const res = await fetch(user.avatarUrl);
      if (res.ok) {
        const bytes = Buffer.from(await res.arrayBuffer());
        const png = await toCircularPng(bytes);
        return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
      }
    } catch {
      // rơi xuống logo mặc định bên dưới
    }
  }

  const png = await defaultIcon();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
