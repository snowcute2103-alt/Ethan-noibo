import { listUsers } from '@/lib/users';
import { listAnnouncements } from '@/lib/announcements';
import { listAnnouncementPermissions } from '@/lib/announcement-permissions';
import { NOTICES, POLICIES } from '@/lib/content';
import AnnouncementManager, { type StaticAnnouncementRef } from '@/components/dashboard/admin/announcement-manager';

export default async function AdminAnnouncementsPage() {
  const [users, announcements] = await Promise.all([listUsers(), listAnnouncements()]);
  const grantsByAnnouncement: Record<string, number[]> = {};
  for (const a of announcements) {
    grantsByAnnouncement[a.id] = await listAnnouncementPermissions(Number(a.id));
  }

  const staticItems: StaticAnnouncementRef[] = [
    ...NOTICES.map((n) => ({ id: `notice-${n.id}`, kind: 'Thông báo khẩn', title: n.title, date: n.date, preview: n.body })),
    ...POLICIES.map((p) => ({ id: `policy-${p.id}`, kind: 'Chính sách', title: p.title, date: p.effectiveDate, preview: p.intro })),
  ];

  return (
    <AnnouncementManager
      announcements={announcements}
      users={users.filter((u) => u.isActive)}
      grantsByAnnouncement={grantsByAnnouncement}
      staticItems={staticItems}
    />
  );
}
