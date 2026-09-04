import { useId, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import logo from '@/public/images/brand/logo.png';
import ScratchCoin from '@/components/ui/scratch-coin';

type AdmitOneTicketProps = {
  /** Tên người nhận — không hiển thị trực tiếp, dùng làm nhãn truy cập (aria-label). */
  name?: string;
  /** Dòng chữ nhỏ in hoa dưới tiêu đề script, kiểu "presented by". */
  presenter: string;
  /** Tiêu đề script vàng lớn, mỗi dòng ngăn cách bằng "\n" — tất cả các dòng dùng chung 1 kiểu chữ và cỡ chữ. */
  event: string;
  /** Nhãn nhỏ in hoa phía trên cuống vé. */
  venue: string;
  /** Chữ đậm bên trong huy hiệu tròn (mệnh giá quà) — bỏ qua nếu có `scratchPrizes`. */
  dates: string;
  /** Danh sách phần quà để cào ngẫu nhiên — có prop này thì huy hiệu chuyển sang thẻ cào tương tác (phủ kín bạc, kéo/chạm để lộ quà), bỏ qua `dates`. */
  scratchPrizes?: string[];
  /** Dòng chú thích nhỏ ở đáy cuống vé. */
  stubText: string;
  /** Bề rộng vé tính bằng px — toàn bộ chữ/khoảng cách co giãn theo giá trị này. */
  width?: number;
  /** Co vé theo bề rộng vùng chứa, nhưng không vượt quá `width`. */
  responsive?: boolean;
  /** Màu nền xung quanh vé — dùng để "khoét" hai vết bấm lỗ ở đường xé cho khớp nền. */
  frameColor?: string;
  className?: string;
};

/** Vé "Admit One" phong cách vé giấy dập nổi mạ vàng, kèm cuống bên phải có huy hiệu cào quà. */
export default function AdmitOneTicket({
  name,
  presenter,
  event,
  venue,
  dates,
  scratchPrizes,
  stubText,
  width = 640,
  responsive = false,
  frameColor = '#281d14',
  className,
}: AdmitOneTicketProps) {
  const eventLines = event.split('\n');
  const baseFontSize = (width / 300) * 16;
  // useId() chèn dấu ":" trong chuỗi id — không hợp lệ khi tham chiếu qua url(#id) trong CSS/SVG, nên phải lọc bỏ.
  const idPrefix = useId().replace(/:/g, '');
  const grainId = `${idPrefix}-grain`;
  const scratchId = `${idPrefix}-scratch`;

  return (
    <div
      role="img"
      aria-label={name ? `${name} — ${event.replace('\n', ' ')}` : event.replace('\n', ' ')}
      style={
        responsive
          ? ({ '--ticket-width': `${width}px`, '--ticket-font-size': `${baseFontSize}px` } as CSSProperties)
          : { width, fontSize: baseFontSize }
      }
      className={`relative mx-auto aspect-[2.35/1] select-none ${responsive ? 'admit-one-ticket-responsive' : ''} ${className ?? ''}`}
    >
      <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
        <defs>
          <filter id={grainId} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0.5 0" />
          </filter>
          <filter id={scratchId} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.03" numOctaves="3" seed="4" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 border border-[#c3985a] bg-[#fefcf7] shadow-[0_1.1em_2.8em_-0.9em_rgba(0,0,0,0.65)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 2350 1000"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-[3px] h-[calc(100%-6px)] w-[calc(100%-6px)]"
        >
          <path d={CONCAVE_CORNER_BORDER_PATH} fill="none" stroke="#c3985a" strokeOpacity={0.6} strokeWidth={4} />
        </svg>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply"
        >
          <rect width="100%" height="100%" filter={`url(#${grainId})`} />
        </svg>

        <div className="relative flex h-full">
          {/* Cuống trái */}
          <div className="relative flex min-w-0 flex-1 items-center overflow-hidden pl-[1.1em] pr-[0.6em]">
            <Watermark />
            <Barcode className="absolute left-[1.1em] top-1/2 z-10 h-[62%] w-[0.85em] shrink-0 -translate-y-1/2" />
            <div className="relative z-10 ml-[1.3em] flex w-[calc(100%-1.3em)] flex-col items-center text-center">
              {eventLines.map((line, i) => (
                <span
                  key={i}
                  style={GOLD_FOIL_STYLE}
                  className="font-script bg-clip-text text-[1.7em] leading-[0.9] text-transparent"
                >
                  {line}
                </span>
              ))}
              <div className="mt-[0.35em] flex items-center gap-[0.5em]">
                <span className="h-px w-[1.2em] bg-[#a8813f]/70" />
                <span className="whitespace-nowrap text-[0.42em] font-semibold uppercase tracking-[0.15em] text-[#a8813f]">
                  {presenter}
                </span>
                <span className="h-px w-[1.2em] bg-[#a8813f]/70" />
              </div>
            </div>
          </div>

          {/* Đường xé */}
          <div className="relative flex w-0 flex-col items-center">
            <span
              style={{ backgroundColor: frameColor }}
              className="absolute -top-[3px] left-1/2 h-[1.1em] w-[1.1em] -translate-x-1/2 -translate-y-1/2 rounded-full"
            />
            <div className="h-full border-l border-dashed border-[#c3985a]" />
            <span
              style={{ backgroundColor: frameColor }}
              className="absolute -bottom-[3px] left-1/2 h-[1.1em] w-[1.1em] -translate-x-1/2 translate-y-1/2 rounded-full"
            />
          </div>

          {/* Cuống phải */}
          <div className="flex w-[28%] min-w-0 flex-col items-center justify-center gap-[0.3em] px-[0.4em] text-center">
            <span className="whitespace-nowrap text-[0.32em] font-semibold uppercase leading-tight tracking-[0.08em] text-[#a8813f]">
              ★ {venue} ★
            </span>
            <div className="relative flex aspect-square w-[2.6em] shrink-0 items-center justify-center overflow-hidden rounded-full">
              {scratchPrizes && scratchPrizes.length > 0 ? (
                <ScratchCoin prizes={scratchPrizes} />
              ) : (
                <>
                  <div style={SILVER_COIN_STYLE} className="absolute inset-0" />
                  <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-[0.55] mix-blend-overlay">
                    <rect width="100%" height="100%" filter={`url(#${scratchId})`} />
                  </svg>
                  <div className="relative flex flex-col items-center gap-[0.05em]">
                    <span className="font-baskerville text-[0.48em] font-bold leading-none text-[#2b2b2b]">
                      {dates}
                    </span>
                    <span className="text-[0.16em] font-semibold uppercase tracking-[0.06em] text-[#3a3a3a]">
                      Enjoy your gift!
                    </span>
                  </div>
                </>
              )}
            </div>
            <span className="text-[0.3em] font-semibold uppercase leading-tight tracking-[0.06em] text-[#a8813f]">
              {stubText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Viền vàng bên trong — 4 góc khoét cong lõm (tâm cung tròn nằm đúng tại đỉnh góc chữ nhật, cung quét
// vào phía trong) thay vì bo tròn lồi ra ngoài hay vát chéo thẳng, đúng kiểu viền vé xé cổ điển. Cạnh
// ngoài của vé (nền giấy + viền sát mép) giữ nguyên góc nhọn 90°, không áp dụng hiệu ứng này.
function buildConcaveRectPath(width: number, height: number, radius: number) {
  return [
    `M ${radius} 0`,
    `L ${width - radius} 0`,
    `A ${radius} ${radius} 0 0 0 ${width} ${radius}`,
    `L ${width} ${height - radius}`,
    `A ${radius} ${radius} 0 0 0 ${width - radius} ${height}`,
    `L ${radius} ${height}`,
    `A ${radius} ${radius} 0 0 0 0 ${height - radius}`,
    `L 0 ${radius}`,
    `A ${radius} ${radius} 0 0 0 ${radius} 0`,
    'Z',
  ].join(' ');
}

const CONCAVE_CORNER_BORDER_PATH = buildConcaveRectPath(2350, 1000, 70);

const GOLD_FOIL_STYLE = {
  backgroundImage:
    'linear-gradient(180deg, #e3b657 0%, #c99a3d 22%, #8f6a22 50%, #d1a24a 72%, #6b4d18 100%)',
  WebkitTextStroke: '0.012em rgba(69, 48, 15, 0.55)',
  filter: 'drop-shadow(0 0.03em 0.02em rgba(74, 51, 15, 0.4))',
};

const SILVER_COIN_STYLE = {
  backgroundImage:
    'radial-gradient(circle at 35% 28%, #ffffff 0%, #f1f1f1 18%, #d8d8d8 42%, #b8b8b8 68%, #949494 100%)',
  boxShadow:
    '0 0.05em 0.1em rgba(0,0,0,0.35), 0 0.02em 0.03em rgba(0,0,0,0.25), inset 0 0.02em 0.03em rgba(255,255,255,0.9), inset 0 -0.03em 0.05em rgba(0,0,0,0.25)',
};

function Barcode({ className }: { className?: string }) {
  const widths = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1];
  return (
    <svg viewBox="0 0 40 200" preserveAspectRatio="none" aria-hidden="true" className={className}>
      {widths.reduce<{ x: number; nodes: ReactNode[] }>(
        (acc, w, i) => {
          const barWidth = w * 1.4;
          if (i % 2 === 0) {
            acc.nodes.push(<rect key={i} x={acc.x} y={0} width={barWidth} height={200} fill="#1a1a1a" />);
          }
          acc.x += barWidth;
          return acc;
        },
        { x: 0, nodes: [] }
      ).nodes}
    </svg>
  );
}

function Watermark() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="absolute inset-0 m-auto h-[62%] w-[62%] opacity-[0.16]">
        <Image src={logo} alt="" fill sizes="400px" className="object-contain" />
      </div>
    </div>
  );
}
