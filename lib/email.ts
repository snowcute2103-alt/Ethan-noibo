import 'server-only';
import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY chưa được set trong biến môi trường.');
    client = new Resend(apiKey);
  }
  return client;
}

interface ResetRequestEmailInput {
  to: string[];
  username: string;
  fullName: string;
  password: string;
}

/**
 * Gửi mật khẩu mới cho BGĐ khi có yêu cầu "Quên mật khẩu" từ trang login.
 * CHỈ gọi hàm này SAU KHI đã có mật khẩu mới trong bộ nhớ, và chỉ lưu
 * password_hash vào DB SAU KHI hàm này resolve thành công — tránh trường hợp
 * đổi mật khẩu xong nhưng gửi email lỗi, khiến plaintext bị mất vĩnh viễn
 * (xem app/api/forgot-password/route.ts).
 */
export async function sendResetRequestEmail({ to, username, fullName, password }: ResetRequestEmailInput): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('RESEND_FROM_EMAIL chưa được set trong biến môi trường.');

  const resend = getClient();
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `[Cổng nội bộ] Yêu cầu đặt lại mật khẩu — ${fullName}`,
    text: [
      `Nhân viên ${fullName} (username: ${username}) vừa gửi yêu cầu đặt lại mật khẩu từ trang đăng nhập.`,
      '',
      'Hệ thống đã tự sinh mật khẩu mới:',
      '',
      `Tài khoản: ${username}`,
      `Mật khẩu mới: ${password}`,
      '',
      'Vui lòng chuyển lại thông tin này cho nhân viên qua kênh nội bộ an toàn (Zalo/trực tiếp) — không forward nguyên email này.',
    ].join('\n'),
  });
  if (error) throw new Error(error.message);
}
