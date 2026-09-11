import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { findUserById, findFullTierAvatarUrl } from '@/lib/users';
import { canView } from '@/lib/roles';
import { ANNOUNCEMENTS, NOTICES, POLICIES, RULE_DOCUMENTS } from '@/lib/content';
import { buildWhatsNew } from '@/lib/content/whats-new';
import { findAuthorAvatarUrls } from '@/lib/content/authors';
import { docIdsVisibleTo } from '@/lib/rule-permissions';
import { listRules } from '@/lib/rules';
import { listAnnouncements } from '@/lib/announcements';
import { announcementIdsVisibleTo } from '@/lib/announcement-permissions';
import { NAV_ITEMS } from '@/lib/nav';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import WhatsNewModal from '@/components/dashboard/whats-new-modal';
import FloatingGreeting from '@/components/dashboard/floating-greeting';
import RefreshDashboardOnReturn from '@/components/dashboard/refresh-dashboard-on-return';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  // getSession() đã đối chiếu user active trong DB — user luôn tồn tại ở đây.
  const user = await findUserById(session.userId);
  if (!user) redirect('/login');

  // Tính "Có gì mới" ở layout chung (không phải riêng trang chủ) để nút chuông gim
  // xuất hiện xuyên suốt mọi trang trong /dashboard, không mất khi chuyển trang.
  const allRules = [...RULE_DOCUMENTS, ...(await listRules())];
  const visibleRuleIds = await docIdsVisibleTo(session.userId, session.tier);
  const visibleRules = visibleRuleIds === 'all' ? allRules : allRules.filter((d) => visibleRuleIds.has(d.id));

  const allAnnouncements = [...ANNOUNCEMENTS, ...(await listAnnouncements())];
  const visibleAnnouncementIds = await announcementIdsVisibleTo(session.userId, session.tier);
  const visibleAnnouncements = allAnnouncements.filter(
    (a) => canView(session, a.visibility) || visibleAnnouncementIds === 'all' || visibleAnnouncementIds.has(Number(a.id))
  );

  // Cùng nguồn avatar với ThongBaoSection: authorAvatars khớp đúng tác giả
  // từng Notice/Announcement; bgdAvatarUrl là fallback chung cho Policy/Rule
  // (không có tác giả riêng).
  const [authorAvatars, bgdAvatarUrl] = await Promise.all([findAuthorAvatarUrls(), findFullTierAvatarUrl()]);
  const whatsNew = buildWhatsNew({
    notices: NOTICES.filter((n) => canView(session, n.visibility)),
    policies: POLICIES.filter((p) => canView(session, p.visibility)),
    announcements: visibleAnnouncements,
    rules: visibleRules,
    authorAvatars,
  });

  // "Giao Task" hiện với mọi người đã đăng nhập; "Quản trị" chỉ hiện với BGĐ
  // (Báo cáo website đã dời vào trong Quản trị — xem AdminNavTabs). Các mục
  // này không nằm trong NAV_ITEMS tĩnh vì cần session để quyết định. Route/
  // action vẫn tự chặn ở tầng server nếu ai đó gõ thẳng URL — ẩn nav chỉ là
  // UX, không phải kiểm soát truy cập.
  const navItems = [
    ...NAV_ITEMS,
    { href: '/dashboard/giao-task', label: 'Giao Task' },
    ...(session.tier === 'full' ? [{ href: '/dashboard/admin', label: 'Quản trị' }] : []),
  ];

  return (
    <div className="dashboard-shell min-h-screen overflow-x-clip bg-surface-2">
      <RefreshDashboardOnReturn />
      <WhatsNewModal items={whatsNew} avatarUrl={bgdAvatarUrl} />
      <DashboardHeader
        navItems={navItems}
        user={{
          fullName: user.fullName,
          username: user.username,
          department: user.department,
          tier: user.tier,
          employeeCode: user.employeeCode,
          jobTitle: user.jobTitle,
          positionTitle: user.positionTitle,
          teamLabel: user.teamLabel,
          personalEmail: user.personalEmail,
          phone: user.phone,
          office: user.office,
          avatarUrl: user.avatarUrl,
        }}
      />
      <main className="relative">
        <FloatingGreeting fullName={user.fullName} />
        {children}
      </main>
    </div>
  );
}
