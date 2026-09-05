'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';
import { Dithering } from '@paper-design/shaders-react';
import AdmitOneTicket from '@/components/ui/admit-one-ticket';

/** Bắt lỗi runtime của canvas WebGL (vd. trình duyệt không hỗ trợ WebGL2) để không sập cả popup — rơi về nền màu phẳng. */
class ShaderErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// "100 $" lặp lại nhiều lần để tăng tỉ lệ trúng (~33%) so với các phần quà còn lại (~11% mỗi phần) — bốc ngẫu nhiên đều theo số phần tử trong mảng.
const BIRTHDAY_PRIZES = [
  '1 TR',
  '500 K',
  '2 TR',
  '100 K',
  '200 K',
  '2 Tô Mỳ Gấu',
  '100 $',
  '100 $',
  '100 $',
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const handleChange = () => setReduced(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}

/** Khung vé sinh nhật — nền dithering vàng-nâu chuyển động nhẹ phía sau vé "Admit One". */
export default function BirthdayTicket() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative mt-1 flex shrink-0 flex-col items-center justify-center gap-3 overflow-x-auto overflow-y-hidden rounded-[14px] bg-[#281d14] p-4 sm:gap-4 sm:p-6">
      <ShaderErrorBoundary>
        <Dithering
          style={{ position: 'absolute', inset: 0 }}
          colorBack="#281d14"
          colorFront="#6b4d21"
          shape="ripple"
          type="8x8"
          size={6}
          speed={reducedMotion ? 0 : 0.3}
        />
      </ShaderErrorBoundary>
      <p
        style={{
          textShadow:
            '0 1px 2px rgba(0,0,0,0.9), 0 0 10px rgba(255,225,170,0.7), 0 0 22px rgba(255,205,130,0.5)',
        }}
        className="relative z-10 rounded-full border border-white/15 bg-black/35 px-5 py-1.5 text-center text-sm font-bold uppercase tracking-[0.35em] text-white backdrop-blur-sm sm:text-base"
      >
        Thử vận may của bạn…
      </p>
      <AdmitOneTicket
        presenter="With love from Ethan"
        event={'Happy Birthday\nto you'}
        venue="Birthday surprise"
        dates="1 TR"
        scratchPrizes={BIRTHDAY_PRIZES}
        stubText="Scratch to reveal your gift"
        width={980}
        responsive
        className="relative z-10"
      />
    </div>
  );
}
