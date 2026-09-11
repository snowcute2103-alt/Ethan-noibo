import { daysSince } from '../date';
import type { Announcement } from './announcements';
import type { Notice } from './notices';
import type { Policy } from './policies';
import type { RuleDocument } from './sop';

export interface WhatsNewItem {
  key: string;
  category: string;
  title: string;
  date: string;
  href: string;
  /** Chỉ Notice/Announcement có tác giả cụ thể — Policy/Rule không có, hiện
   *  fallback "BGĐ" chung ở WhatsNewModal. */
  author?: string;
  authorAvatarUrl?: string | null;
}

const MAX_ITEMS = 3;

/**
 * Gộp Thông báo khẩn + Chính sách + Announcement + Rule (SOP) mới cập nhật,
 * xếp mới nhất lên đầu — dùng cho popup "Có gì mới" hiện khi trang chủ load.
 * Cùng quy ước rank = daysSince() như buildFeed()/ThongBaoSection.
 */
export function buildWhatsNew(input: {
  notices: Notice[];
  policies: Policy[];
  announcements: Announcement[];
  rules: RuleDocument[];
  /** Tên tác giả -> avatar hiện tại, xem lib/content/authors.ts. */
  authorAvatars?: Record<string, string | null>;
}): WhatsNewItem[] {
  const dated: { item: WhatsNewItem; rank: number }[] = [
    ...input.notices.map((n) => ({
      item: {
        key: `notice-${n.id}`,
        category: 'Thông báo khẩn',
        title: n.title,
        date: n.date,
        href: '/dashboard#thong-bao',
        author: n.author,
        authorAvatarUrl: n.author ? (input.authorAvatars?.[n.author] ?? null) : null,
      },
      rank: daysSince(n.date) ?? Number.POSITIVE_INFINITY,
    })),
    ...input.policies.map((p) => ({
      item: {
        key: `policy-${p.id}`,
        category: 'Chính sách',
        title: p.title,
        date: p.effectiveDate,
        href: '/dashboard#thong-bao',
      },
      rank: daysSince(p.effectiveDate) ?? Number.POSITIVE_INFINITY,
    })),
    ...input.announcements.map((a) => ({
      item: {
        key: `announcement-${a.id}`,
        category: 'Thông báo',
        title: a.title,
        date: a.date,
        href: '/dashboard#thong-bao',
        author: a.author,
        authorAvatarUrl: a.author ? (input.authorAvatars?.[a.author] ?? null) : null,
      },
      rank: daysSince(a.date) ?? Number.POSITIVE_INFINITY,
    })),
    ...input.rules.map((r) => ({
      item: {
        key: `rule-${r.id}`,
        category: 'Rule mới',
        title: r.title,
        date: r.updatedAt,
        href: `/dashboard/rule#${r.id}`,
      },
      rank: daysSince(r.updatedAt) ?? Number.POSITIVE_INFINITY,
    })),
  ];

  return dated
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_ITEMS)
    .map(({ item }) => item);
}
