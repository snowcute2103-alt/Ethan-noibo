import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WEBSITE_REPORTS } from '@/lib/content/reports';
import { canViewWebsiteReports } from '@/lib/report-access';
import ReportDashboard from '@/components/dashboard/report-dashboard';

export default async function AdminBaoCaoPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  // AdminLayout chỉ chặn theo tier === 'full' (mọi BGĐ) — báo cáo website vẫn
  // giữ đúng phạm vi hẹp hơn (canViewWebsiteReports) như trước khi dời vào đây.
  if (!canViewWebsiteReports(session.userId)) redirect('/dashboard/admin');

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-blue/5 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-48 top-[700px] h-96 w-96 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <ReportDashboard reports={WEBSITE_REPORTS} />
      </div>
    </div>
  );
}
