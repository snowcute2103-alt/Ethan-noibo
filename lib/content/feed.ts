import type { StaticImageData } from 'next/image';
import { daysSince } from '../date';
import { CATEGORY_IMAGE, CULTURE_ARTICLE_IMAGE, FALLBACK_IMAGE } from './images';
import type { Announcement } from './announcements';
import type { Notice } from './notices';
import type { Policy } from './policies';
import type { CultureArticle } from './culture';
import type { RecognitionList } from './recognition';

export interface FeedItem {
  key: string;
  category: string;
  accent: string;
  image: StaticImageData;
  title: string;
  excerpt: string;
  /** Chuỗi ngày để hiển thị (không nhất thiết là DD/MM/YYYY, vd Khen thưởng dùng "Tháng 7/2026"). null nếu nội dung không gắn ngày (Văn hoá). */
  date: string | null;
  href: string;
}

const CATEGORY_ACCENT: Record<string, string> = {
  'Thông báo': '#F5A623',
  'Chính sách': '#0052CC',
  'Khen thưởng': '#FF6F91',
  'Văn hoá': '#1A2745',
};

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

/** "Tháng 7/2026" -> "01/7/2026" — chuỗi giả để daysSince() sắp xếp được, không dùng để hiển thị. */
function recognitionSortDate(month: string): string | null {
  const match = month.match(/(\d{1,2})\/(\d{4})/);
  return match ? `01/${match[1]}/${match[2]}` : null;
}

function makeItem(
  category: keyof typeof CATEGORY_ACCENT,
  rest: Omit<FeedItem, 'accent' | 'category'>
): FeedItem {
  return { category, accent: CATEGORY_ACCENT[category], ...rest };
}

/**
 * Gộp Thông báo/Announcement/Chính sách/Khen thưởng (đều có mốc thời gian) và sắp
 * mới nhất lên đầu; Văn hoá không có ngày (nội dung "evergreen") nên xếp sau cùng,
 * giữ nguyên thứ tự khai báo thay vì gán ngày giả.
 */
export function buildFeed(input: {
  notices: Notice[];
  announcements: Announcement[];
  policies: Policy[];
  culture: CultureArticle[];
  recognition: RecognitionList[];
}): FeedItem[] {
  const dated: { item: FeedItem; sortDateStr: string | null }[] = [
    ...input.notices.map((n) => ({
      item: makeItem('Thông báo', {
        key: `notice-${n.id}`,
        image: CATEGORY_IMAGE['Thông báo'] ?? FALLBACK_IMAGE,
        title: n.title,
        excerpt: truncate(n.body, 140),
        date: n.date,
        href: '/dashboard/thongbao',
      }),
      sortDateStr: n.date,
    })),
    ...input.announcements.map((a) => ({
      item: makeItem('Thông báo', {
        key: `announcement-${a.id}`,
        image: CATEGORY_IMAGE['Thông báo'] ?? FALLBACK_IMAGE,
        title: a.title,
        excerpt: truncate(a.body, 140),
        date: a.date,
        href: '/dashboard/thongbao',
      }),
      sortDateStr: a.date,
    })),
    ...input.policies.map((p) => ({
      item: makeItem('Chính sách', {
        key: `policy-${p.id}`,
        image: CATEGORY_IMAGE['Chính sách'] ?? FALLBACK_IMAGE,
        title: p.title,
        excerpt: truncate(p.intro, 140),
        date: p.effectiveDate,
        href: '/dashboard/thongbao',
      }),
      sortDateStr: p.effectiveDate,
    })),
    ...input.recognition.map((r) => ({
      item: makeItem('Khen thưởng', {
        key: `recognition-${r.id}`,
        image: CATEGORY_IMAGE['Khen thưởng'] ?? FALLBACK_IMAGE,
        title: `Vinh danh ${r.month}`,
        excerpt: `${r.names.length} thành viên tiêu biểu: ${truncate(r.names.slice(0, 3).join(', '), 120)}`,
        date: r.month,
        href: '/dashboard/khenthuong',
      }),
      sortDateStr: recognitionSortDate(r.month),
    })),
  ];

  const sortedDated = dated
    .map(({ item, sortDateStr }) => ({
      item,
      rank: sortDateStr ? (daysSince(sortDateStr) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ item }) => item);

  const cultureItems = input.culture.map((c) =>
    makeItem('Văn hoá', {
      key: `culture-${c.id}`,
      image: CULTURE_ARTICLE_IMAGE[c.id] ?? FALLBACK_IMAGE,
      title: c.title,
      excerpt: truncate(c.intro, 140),
      date: null,
      href: `/dashboard/van-hoa#${c.id}`,
    })
  );

  return [...sortedDated, ...cultureItems];
}
