'use client';

import { useRef } from 'react';
import { PartyPopper } from 'lucide-react';
import type { RecognitionList } from '@/lib/content';
import AwardCard from './award-card';
import CelebrateButton from './celebrate-button';

const CARD_ACCENTS = ['#FF6F91', '#00D2FF', '#F5A623', '#7C6CF0'];

export default function RecognitionMonthCard({ list, listIndex }: { list: RecognitionList; listIndex: number }) {
  const cardRef = useRef<HTMLElement>(null);

  return (
    <article
      ref={cardRef}
      className="relative overflow-hidden rounded-[18px] bg-gradient-to-b from-[#0b1220] via-[#0e1730] to-[#101a30] px-4 py-6 sm:px-6 sm:py-8 min-[1025px]:rounded-[40px] min-[1025px]:px-16 min-[1025px]:py-20"
    >
      <svg
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 opacity-20 blur-2xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="100" fill="#FF6F91" />
      </svg>
      <svg
        className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 opacity-20 blur-2xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="100" fill="#00D2FF" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 opacity-20 blur-2xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="100" fill="#F5A623" />
      </svg>

      <div className="relative flex flex-wrap items-center gap-3 min-[1025px]:gap-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 min-[1025px]:h-16 min-[1025px]:w-16">
          <PartyPopper size={28} strokeWidth={2.25} className="text-[#FF9EB4]" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-[10px] font-medium uppercase tracking-[0.16em] text-white/50 min-[1025px]:text-sm min-[1025px]:tracking-[0.25em]">
            Thành viên tích cực
          </p>
          <h3 className="font-heading text-2xl font-medium tracking-wide text-white sm:text-3xl min-[1025px]:text-5xl">{list.month}</h3>
        </div>
        <div className="ml-auto">
          <CelebrateButton originRef={cardRef} />
        </div>
      </div>

      <ul className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 min-[1025px]:mt-12 min-[1025px]:grid-cols-3 min-[1025px]:gap-6">
        {list.names.map((name, i) => (
          <li key={name}>
            <AwardCard
              name={name}
              month={list.month}
              accent={CARD_ACCENTS[(listIndex + i) % CARD_ACCENTS.length]}
              index={i}
            />
          </li>
        ))}
      </ul>
    </article>
  );
}
