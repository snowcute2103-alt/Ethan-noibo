'use client';

import { useState } from 'react';
import type { OrgChartPerson } from '@/lib/content/org-chart-people';

/**
 * Ảnh so-do-to-chuc.svg bake avatar thành pixel lúc dựng sơ đồ nên không bao giờ tự cập nhật khi
 * user đổi ảnh đại diện. Component này vẽ đè một avatar <img> live (theo photoUrl đã merge từ DB)
 * đúng vị trí/kích thước vòng tròn baked-in — chỉ render khi có photoUrl, nếu load lỗi thì ẩn đi để
 * lộ lại hình/nền gốc trong SVG.
 */
export default function OrgChartAvatarOverlay({ person }: { person: OrgChartPerson }) {
  const [imgError, setImgError] = useState(false);

  if (!person.photoUrl || imgError) return null;

  return (
    <img
      src={person.photoUrl}
      alt=""
      aria-hidden="true"
      onError={() => setImgError(true)}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full object-cover"
      style={{
        left: `${person.xPct}%`,
        top: `${person.yPct}%`,
        width: `${person.rPct * 2}%`,
        aspectRatio: '1 / 1',
      }}
    />
  );
}
