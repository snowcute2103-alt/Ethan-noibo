'use client';

import { useEffect, useState } from 'react';

const REDUCED_EFFECTS_QUERY = '(max-width: 1024px), (prefers-reduced-motion: reduce)';

/**
 * Tablet, mobile và người dùng yêu cầu giảm chuyển động nhận phiên bản giao diện
 * tĩnh hơn. Desktop lớn vẫn giữ nguyên toàn bộ hiệu ứng hiện tại.
 */
export function useReducedEffects() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_EFFECTS_QUERY);
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}
