'use client';

import { PartyPopper } from '@/components/ui/party-popper';

interface CelebrateButtonProps {
  /** Nổ confetti ra từ tâm phần tử này (vd. cả khung thẻ) thay vì từ vị trí nút bấm. */
  originRef?: React.RefObject<HTMLElement | null>;
}

/** Nút bắn confetti ăn mừng — cấu hình khoá cứng theo thiết kế đã chọn, không có tuỳ chỉnh. */
export default function CelebrateButton({ originRef }: CelebrateButtonProps) {
  return (
    <PartyPopper
      particleCount={50}
      streamerCount={20}
      particleSizeMin={4}
      particleSizeMax={11}
      streamerWidthMax={40}
      streamerHeightMax={0}
      originRef={originRef}
      className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-cta to-cyan px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition-transform duration-200 hover:scale-[1.02]"
    >
      Bấm vô đây
    </PartyPopper>
  );
}
