import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { findUserById } from '@/lib/users';

/** URL cũ — dashboard nhóm giờ dùng chung URL phòng ban với BGĐ (vd
 *  /dashboard/giao-task/it, xem nhánh non-BGĐ ở [code]/page.tsx) thay vì
 *  đường riêng /nhom. Giữ lại route này làm redirect mỏng để link cũ đã
 *  bookmark (vd mục "Đồng đội" ở personal-task-board.tsx) không vỡ. */
export default async function GiaoTaskNhomPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const self = await findUserById(session.userId);
  redirect(self ? `/dashboard/giao-task/${self.department}` : '/dashboard/giao-task');
}
