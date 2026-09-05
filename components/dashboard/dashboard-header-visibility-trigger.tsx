'use client';

import { useEffect, useRef } from 'react';

export const DASHBOARD_HEADER_VISIBILITY_EVENT = 'ethan:dashboard-header-visibility';

export type DashboardHeaderVisibilityDetail = {
  hidden: boolean;
};

export default function DashboardHeaderVisibilityTrigger() {
  const markerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const section = markerRef.current?.parentElement;
    if (!section) return;

    let hidden = false;
    function setHeaderHidden(nextHidden: boolean) {
      if (nextHidden === hidden) return;
      hidden = nextHidden;
      window.dispatchEvent(
        new CustomEvent<DashboardHeaderVisibilityDetail>(DASHBOARD_HEADER_VISIBILITY_EVENT, {
          detail: { hidden: nextHidden },
        })
      );
    }

    const observer = new IntersectionObserver(
      (entries) => setHeaderHidden(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.05 }
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
      setHeaderHidden(false);
    };
  }, []);

  return <span ref={markerRef} className="sr-only" aria-hidden="true" />;
}
