import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { WEBSITE_REPORTS } from '@/lib/content/reports';
import ReportDashboard from '@/components/dashboard/report-dashboard';

export default async function BaoCaoPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="relative overflow-hidden bg-surface-2">
      <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-blue/5 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-48 top-[700px] h-96 w-96 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <ReportDashboard reports={WEBSITE_REPORTS} />
      </div>
    </div>
  );
}
