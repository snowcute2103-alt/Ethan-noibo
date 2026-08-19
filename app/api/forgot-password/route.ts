import { NextRequest, NextResponse } from 'next/server';
import { findUserByUsernameOrEmail, listActiveFullTierEmails, updatePasswordHash, bumpSessionVersion } from '@/lib/users';
import { isResetRequestRateLimited, createResetRequest, createAutoResolvedResetRequest } from '@/lib/reset-requests';
import { generatePassword, hashPassword, passwordLengthFor } from '@/lib/password';
import { sendResetRequestEmail } from '@/lib/email';
import { logAdminAction } from '@/lib/audit';
import { clientIp } from '@/lib/request';

/** Luôn trả về message chung, kể cả khi tài khoản/email không tồn tại — tránh lộ
 *  thông tin "tài khoản có tồn tại hay không", cùng nguyên tắc với /api/login. */
const GENERIC_MESSAGE = 'Nếu tài khoản tồn tại, yêu cầu đặt lại mật khẩu đã được gửi tới Ban Giám Đốc. Vui lòng chờ được liên hệ lại.';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const identifier = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
  const ip = clientIp(req);

  if (!identifier) {
    return NextResponse.json({ error: 'Vui lòng nhập tài khoản hoặc email.' }, { status: 400 });
  }

  if (await isResetRequestRateLimited(ip)) {
    return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 });
  }

  const user = await findUserByUsernameOrEmail(identifier);
  if (user) {
    const bgdEmails = await listActiveFullTierEmails();
    let emailed = false;

    if (bgdEmails.length > 0) {
      // Sinh mật khẩu mới TRƯỚC, gửi email TRƯỚC — chỉ ghi password_hash vào DB
      // nếu gửi thành công, tránh mất mật khẩu mới khi Resend lỗi/rớt mạng.
      const password = generatePassword(passwordLengthFor(user.tier));
      try {
        await sendResetRequestEmail({ to: bgdEmails, username: user.username, fullName: user.fullName, password });
        const passwordHash = await hashPassword(password);
        await updatePasswordHash(user.id, passwordHash);
        await bumpSessionVersion(user.id);
        await createAutoResolvedResetRequest(user.id, ip);
        await logAdminAction(null, 'user.reset_password', user.id, { note: 'auto:forgot-password-email' });
        emailed = true;
      } catch {
        // Gửi email lỗi — không đổi mật khẩu, rơi về hàng chờ để BGĐ tự duyệt tay
        // trong trang admin (fallback khi Resend/domain có sự cố).
      }
    }

    if (!emailed) {
      await createResetRequest(user.id, ip);
    }
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}
