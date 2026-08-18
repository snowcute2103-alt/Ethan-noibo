'use client';

import { useId } from 'react';

/** Tờ tiền xanh cách điệu — viền đôi, huy hiệu tròn giữa, số góc — thay cho icon outline đơn giản. */
export function MoneyBillIcon({ width = 40 }: { width?: number }) {
  const height = width * 0.52;
  return (
    <svg width={width} height={height} viewBox="0 0 56 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="54" height="28" rx="4" fill="#2E9E63" stroke="#186B41" strokeWidth="2" />
      <rect x="4.5" y="4.5" width="47" height="21" rx="2" fill="none" stroke="#8FE3B4" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="28" cy="15" r="8.5" fill="#3DB975" stroke="#186B41" strokeWidth="1.2" />
      <text x="28" y="19" textAnchor="middle" fontSize="10" fontWeight="800" fill="#EAFBF1" fontFamily="Arial, sans-serif">
        $
      </text>
      <text x="7.5" y="10.5" fontSize="5.5" fontWeight="800" fill="#CFF3DD" fontFamily="Arial, sans-serif">
        100
      </text>
      <text x="39.5" y="25" fontSize="5.5" fontWeight="800" fill="#CFF3DD" fontFamily="Arial, sans-serif">
        100
      </text>
    </svg>
  );
}

/** Đồng xu vàng — gradient tròn, viền vành, rãnh khắc — thay cho icon outline đơn giản. */
export function GoldCoinIcon({ size = 28 }: { size?: number }) {
  const gradId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="45%" stopColor="#FFD54D" />
          <stop offset="100%" stopColor="#D89A1E" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill={`url(#${gradId})`} stroke="#B87F12" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#B87F12" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.6" />
      <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="#8A5A0A" fontFamily="Arial, sans-serif">
        $
      </text>
    </svg>
  );
}
