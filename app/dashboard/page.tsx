import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { ANNOUNCEMENTS } from '@/lib/content';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const visible = ANNOUNCEMENTS.filter((a) => canView(session, a.visibility));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-navy">Thông báo</h2>
        <p className="mt-1 text-sm text-muted">
          Nội dung dưới đây được lọc theo khối và cấp tài khoản của bạn.
        </p>
      </div>

      {visible.length === 0 && (
        <p className="border border-dashed border-[#d5dfef] bg-white p-8 text-center text-sm text-muted">
          Chưa có thông báo nào cho khối của bạn.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {visible.map((a) => (
          <li key={a.id} className="border border-[#e0e7f3] bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold text-navy">{a.title}</h3>
              <span className="text-xs text-muted">{a.date}</span>
            </div>
            <p className="text-sm leading-relaxed text-ink">{a.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
