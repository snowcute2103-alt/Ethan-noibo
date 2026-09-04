'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

const MESSAGES = [
  (name: string) => `Hey ${name}! Một ngày mới tuyệt vời nhé.`,
  (name: string) => `${name} ơi, hôm nay bạn đang làm tốt hơn bạn nghĩ đấy.`,
  (name: string) => `Chúc ${name} giữ được thật nhiều năng lượng tích cực hôm nay!`,
  (name: string) => `${name} nè, một bước nhỏ hôm nay cũng là tiến bộ rồi.`,
  (name: string) => `Nhắc nhẹ ${name}: hít một hơi sâu và thả lỏng vai nhé.`,
  (name: string) => `Mong hôm nay mang đến cho ${name} một điều thật đáng nhớ.`,
  (name: string) => `${name} ơi, ý tưởng hay thường bắt đầu từ một chút tò mò đó!`,
  (name: string) => `Cảm ơn ${name} vì đã góp một phần năng lượng cho Ethan mỗi ngày.`,
  (name: string) => `Nếu thấy mệt, ${name} nhớ nghỉ mắt 20 giây rồi tiếp tục nhé.`,
  (name: string) => `Chúc ${name} gặp đúng người, đúng việc và đúng cảm hứng hôm nay.`,
  (name: string) => `${name} ơi, cứ bình tĩnh — việc khó rồi cũng sẽ có cách.`,
  (name: string) => `Một nụ cười dành cho ${name}. Chúc bạn hôm nay thật thuận lợi!`,
] as const;

// Giao Task, Quản trị (admin) và Báo cáo là các trang thao tác nghiệp vụ —
// không hiện nút lời nhắn nổi ở đây để tránh che nút bấm/nội dung bảng.
const HIDDEN_ROUTE_PREFIXES = ['/dashboard/giao-task', '/dashboard/admin', '/dashboard/bao-cao'] as const;

const PAGE_POSITIONS = [
  { route: '/dashboard/khenthuong', top: 620, side: 'right', offset: '4%' },
  { route: '/dashboard/van-hoa', top: 760, side: 'left', offset: '4%' },
  { route: '/dashboard/rule', top: 520, side: 'right', offset: '4%' },
  { route: '/dashboard', top: 680, side: 'left', offset: '4%' },
] as const;

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function givenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.at(-1) ?? fullName;
}

export default function FloatingGreeting({ fullName }: { fullName: string }) {
  const pathname = usePathname();
  const name = givenName(fullName);
  const seed = hashText(`${pathname}:${fullName}`);
  const tooltipId = useMemo(() => `floating-greeting-${seed}`, [seed]);

  if (HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const position = PAGE_POSITIONS.find(({ route }) =>
    route === '/dashboard' ? pathname === route : pathname.startsWith(route)
  ) ?? PAGE_POSITIONS[PAGE_POSITIONS.length - 1];
  const message = MESSAGES[(seed >>> 3) % MESSAGES.length](name);
  const alignLeft = position.side === 'left';

  return (
    <div
      className="floating-greeting-widget pointer-events-none absolute z-40"
      style={{
        top: position.top,
        ...(alignLeft ? { left: position.offset } : { right: position.offset }),
      }}
    >
      <button
        type="button"
        aria-label={`Lời nhắn dành cho ${name}`}
        aria-describedby={tooltipId}
        className="group pointer-events-auto relative grid h-8 w-8 place-items-center rounded-full border border-white/60 bg-cyan font-heading text-lg font-bold text-navy shadow-[0_6px_20px_rgba(0,210,255,0.35)] transition duration-200 hover:scale-110 hover:bg-gold-2 focus-visible:scale-110 focus-visible:bg-gold-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan/30"
      >
        <span aria-hidden="true">?</span>
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute bottom-11 w-60 translate-y-2 rounded-md bg-black/90 px-4 py-3 text-left font-body text-sm font-medium leading-relaxed text-white opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-y-0 group-focus-visible:opacity-100 ${
            alignLeft ? 'left-0' : 'right-0'
          }`}
        >
          {message}
          <span
            aria-hidden="true"
            className={`absolute -bottom-[7px] h-0 w-0 border-x-[7px] border-t-[7px] border-x-transparent border-t-black/90 ${
              alignLeft ? 'left-3' : 'right-3'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
