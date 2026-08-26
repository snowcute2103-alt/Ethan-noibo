'use client';

import { useEffect, useRef, useState } from 'react';

const MIN_TAROT_HEIGHT = 1040;

export default function TarotSection() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_TAROT_HEIGHT);

  useEffect(() => {
    function receiveHeight(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type !== 'ethan-tarot-height' || typeof event.data.height !== 'number') return;

      setHeight(Math.max(MIN_TAROT_HEIGHT, Math.ceil(event.data.height)));
    }

    window.addEventListener('message', receiveHeight);
    return () => window.removeEventListener('message', receiveHeight);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-black" aria-label="Bói bài Tarot">
      <iframe
        ref={frameRef}
        src="/tarot/index.html"
        title="Bói bài Tarot — Lắng nghe thông điệp từ vũ trụ"
        className="block w-full border-0 bg-black"
        style={{ height }}
        loading="lazy"
      />
    </section>
  );
}
