import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpenCheck, Megaphone, Trophy, Sparkles, type LucideIcon } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { canView, departmentLabel } from '@/lib/roles';
import { daysSince } from '@/lib/date';
import { NOTICES, POLICIES, RULE_DOCUMENTS, CULTURE_ARTICLES, RECOGNITION_LISTS, ANNOUNCEMENTS } from '@/lib/content';
import { docIdsVisibleTo } from '@/lib/rule-permissions';
import NoticeBanner from '@/components/dashboard/notice-banner';
import HubCard from '@/components/dashboard/hub-card';
import Reveal from '@/components/reveal';
import heroBg from '@/public/images/hub/hero-bg.jpg';

function greetingForHour(hour: number) {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function currentHanoiHour() {
  const hourText = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());
  return Number(hourText);
}

export default async function DashboardHome() {
  const session = await getSession();
  if (!session) redirect('/login');

  const allNotices = NOTICES.filter((n) => canView(session, n.visibility));
  // Trang chủ chỉ nêu thông báo còn "nóng" (trong 1 tuần) — thông báo cũ hơn vẫn xem đầy đủ ở trang Thông báo.
  const homeNotices = allNotices.filter((n) => {
    const days = daysSince(n.date);
    return days === null || days <= 7;
  });
  const visibleRuleDocIds = await docIdsVisibleTo(session.userId, session.tier);
  const sopCount = visibleRuleDocIds === 'all' ? RULE_DOCUMENTS.length : visibleRuleDocIds.size;
  const thongbaoCount =
    ANNOUNCEMENTS.filter((a) => canView(session, a.visibility)).length +
    POLICIES.filter((p) => canView(session, p.visibility)).length +
    allNotices.length;
  const khenthuongCount = RECOGNITION_LISTS.filter((r) => canView(session, r.visibility)).length;
  const vanhoaCount = CULTURE_ARTICLES.filter((c) => canView(session, c.visibility)).length;

  const greeting = greetingForHour(currentHanoiHour());

  const hubItems: {
    href: string;
    eyebrow: string;
    title: string;
    description: string;
    icon: LucideIcon;
    accent: string;
    count: number;
  }[] = [
    {
      href: '/dashboard/thongbao',
      eyebrow: 'Điều hành',
      title: 'Thông báo',
      description: 'Quy định chấm công, đề xuất, bảng lương và các thông báo khẩn từ Ban lãnh đạo.',
      icon: Megaphone,
      accent: '#F5A623',
      count: thongbaoCount,
    },
    {
      href: '/dashboard/rule',
      eyebrow: 'Vận hành',
      title: 'SOP & Quy trình',
      description: 'Quy tắc SKU, tên file, lưu trữ NAS, chốt chặn chuyển đơn — tài liệu tác nghiệp theo khối.',
      icon: BookOpenCheck,
      accent: '#0052CC',
      count: sopCount,
    },
    {
      href: '/dashboard/khenthuong',
      eyebrow: 'Ghi nhận',
      title: 'Khen thưởng',
      description: 'Vinh danh những thành viên tích cực nhất mỗi tháng.',
      icon: Trophy,
      accent: '#FF6F91',
      count: khenthuongCount,
    },
    {
      href: '/dashboard/van-hoa',
      eyebrow: 'Câu chuyện Ethan',
      title: 'Văn hoá',
      description: 'Tầm nhìn, sứ mệnh, câu chuyện founder, cơ cấu tổ chức và đời sống nội bộ.',
      icon: Sparkles,
      accent: '#1A2745',
      count: vanhoaCount,
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="relative flex min-h-[520px] items-end overflow-hidden sm:min-h-[640px]">
        <Image src={heroBg} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/40" aria-hidden="true" />
        <div className="glow-orb -right-20 top-10 h-96 w-96 bg-cyan/20" aria-hidden="true" />
        <div className="glow-orb bottom-0 left-1/3 h-64 w-64 bg-gold/15" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[1440px] px-8 py-16 sm:py-24">
          <p className="animate-fade-up font-heading text-sm font-medium uppercase tracking-[0.35em] text-cyan">
            Cổng thông tin nội bộ
          </p>
          <h2
            className="title-glow animate-fade-up font-heading mt-6 max-w-3xl text-[clamp(2.5rem,6vw,5rem)] font-medium tracking-wide leading-[1.05] text-white"
            style={{ animationDelay: '90ms' }}
          >
            {greeting}, {departmentLabel(session.department)}
          </h2>
          <p
            className="animate-fade-up mt-7 max-w-2xl text-lg leading-relaxed text-white/75"
            style={{ animationDelay: '160ms' }}
          >
            &ldquo;Đồng lòng đồng sức, bứt phá gặt thành công&rdquo; — chọn một mục bên dưới để xem chi tiết. Mỗi
            mục được lọc riêng theo khối và cấp tài khoản của bạn.
          </p>

          <div className="animate-fade-up mt-9 flex flex-wrap gap-3" style={{ animationDelay: '220ms' }}>
            {hubItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/30 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <item.icon size={16} strokeWidth={2.25} aria-hidden="true" />
                {item.title}
                <span className="text-white/60">{item.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-14 px-8 py-16 sm:gap-20 sm:py-24">
        {homeNotices.length > 0 && (
          <Reveal>
            <NoticeBanner notices={homeNotices} />
          </Reveal>
        )}

        <Reveal className="flex flex-col gap-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">Điều hướng</p>
              <h2 className="font-heading mt-2 text-3xl font-medium tracking-wide text-navy sm:text-4xl">
                Truy cập nhanh
              </h2>
            </div>
            <p className="max-w-md text-base text-muted">
              Bốn khu vực chính của cổng thông tin — nội dung tự động lọc theo khối và cấp tài khoản của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {hubItems.map((item, i) => (
              <HubCard key={item.href} {...item} featured={i === 0} index={i} />
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
