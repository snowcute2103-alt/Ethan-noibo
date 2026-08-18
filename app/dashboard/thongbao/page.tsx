import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { ANNOUNCEMENTS, NOTICES, POLICIES } from '@/lib/content';
import NoticeBanner from '@/components/dashboard/notice-banner';
import PolicyCard from '@/components/dashboard/policy-card';
import AnnouncementList from '@/components/dashboard/announcement-list';
import officePhoto from '@/public/images/thongbao/office.jpg';

export default async function ThongBaoPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const notices = NOTICES.filter((n) => canView(session, n.visibility));
  const policies = POLICIES.filter((p) => canView(session, p.visibility));
  const announcements = ANNOUNCEMENTS.filter((a) => canView(session, a.visibility));
  const isEmpty = notices.length === 0 && policies.length === 0 && announcements.length === 0;

  return (
    <div className="bg-[#FFFCF5]">
      <div className="mx-auto max-w-[1200px] px-8 py-28 sm:py-36">
        <div className="grid grid-cols-1 items-center gap-12 sm:grid-cols-[1fr_220px]">
          <div>
            <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-gold">Từ Ban lãnh đạo</p>
            <h2 className="mt-5 font-heading text-[clamp(2.75rem,7vw,5.5rem)] font-medium tracking-wide leading-[1.05] text-navy">
              Thông báo
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Quy định điều hành và thông báo khẩn — cập nhật mới nhất luôn nằm trên cùng.
            </p>
          </div>
          <div className="relative hidden aspect-square overflow-hidden rounded-[32px] shadow-[0_16px_40px_-16px_rgba(26,39,69,0.35)] sm:block">
            <Image src={officePhoto} alt="Văn phòng Ethan Ecom" fill sizes="220px" className="object-cover" />
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-24 sm:mt-28 sm:gap-28">
          {isEmpty && (
            <p className="rounded-[24px] border border-dashed border-[#e8dcc0] bg-white p-10 text-center text-base text-muted">
              Chưa có thông báo nào cho khối của bạn.
            </p>
          )}

          {notices.length > 0 && <NoticeBanner notices={notices} />}

          {policies.length > 0 && (
            <div className="flex flex-col gap-14">
              {policies.map((p) => (
                <PolicyCard key={p.id} policy={p} />
              ))}
            </div>
          )}

          {announcements.length > 0 && <AnnouncementList announcements={announcements} />}
        </div>
      </div>
    </div>
  );
}
