'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/** Bán kính đầu cào, tính theo tỉ lệ bề rộng canvas. */
const SCRATCH_RADIUS_RATIO = 0.14;
/** Tỉ lệ diện tích đã cào trước khi tự động lột nốt phần còn lại — người cào thật hiếm khi
 *  chạm hết viền ngoài hình tròn, để ngưỡng quá cao sẽ hay sót viền xám không tự lột nốt. */
const REVEAL_THRESHOLD = 0.4;
/** Chỉ kiểm tra tiến độ cào mỗi N lần vẽ — tránh gọi getImageData (tốn CPU) trên từng pixel di chuột. */
const PROGRESS_CHECK_INTERVAL = 4;

type ScratchCoinProps = {
  /** Danh sách phần quà — mỗi lần vé được mount sẽ bốc ngẫu nhiên 1 phần quà, giữ nguyên đến khi unmount. */
  prizes: string[];
  className?: string;
};

/** Nền bạc cố định — luôn hiện phía sau (trước, trong và sau khi cào), để phần quà lộ ra vẫn nằm
 *  trên 1 mặt đồng xu nhất quán thay vì lộ giấy vé bên dưới, tránh mọi lệch màu khi lớp cào biến mất. */
const PERMANENT_COIN_STYLE = {
  backgroundImage:
    'radial-gradient(circle at 35% 28%, #f1f1f1 0%, #e2e2e2 24%, #cfcfcf 50%, #bcbcbc 74%, #a8a8a8 100%)',
  boxShadow: 'inset 0 0.02em 0.03em rgba(255,255,255,0.8), inset 0 -0.03em 0.05em rgba(0,0,0,0.2)',
};

/** Đồng xu cào trúng thưởng — phủ lớp bạc xám kín, kéo/chạm để lộ dần phần quà bên dưới. */
export default function ScratchCoin({ prizes, className }: ScratchCoinProps) {
  const [prize] = useState(() => prizes[Math.floor(Math.random() * prizes.length)]);
  const [revealed, setRevealed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScratchingRef = useRef(false);
  const scratchCountRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function paintSurface() {
      const { width, height } = container!.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gradient = ctx!.createRadialGradient(
        width * 0.35,
        height * 0.28,
        0,
        width * 0.5,
        height * 0.5,
        width * 0.72
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.18, '#f1f1f1');
      gradient.addColorStop(0.42, '#d8d8d8');
      gradient.addColorStop(0.68, '#b8b8b8');
      gradient.addColorStop(1, '#949494');
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, width, height);

      ctx!.strokeStyle = '#ffffff';
      ctx!.globalAlpha = 0.15;
      for (let i = 0; i < 40; i++) {
        const y = Math.random() * height;
        ctx!.lineWidth = Math.random() * 1.4;
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(width, y + (Math.random() - 0.5) * 10);
        ctx!.stroke();
      }
      ctx!.globalAlpha = 1;
    }

    paintSurface();
    const resizeObserver = new ResizeObserver(paintSurface);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Cào đủ ngưỡng -> mờ dần bằng CSS transition (300ms) rồi gỡ hẳn canvas khỏi DOM. Dùng transition
  // thay vì vòng lặp requestAnimationFrame để không có khoảng hở thời gian mà con trỏ vẫn cào được
  // (pointer-events tắt ngay lập tức qua className cùng lúc với state revealed) — tránh mọi kịch bản
  // cào tiếp trong lúc đang mờ làm kẹt lại một canvas gần-trong-suốt sót viền xám.
  useEffect(() => {
    if (!revealed) return;
    const timeout = setTimeout(() => setHidden(true), 320);
    return () => clearTimeout(timeout);
  }, [revealed]);

  // Chớp sáng vàng nhẹ đúng lúc lộ quà — bù lại khoảnh khắc mặt xu chỉ còn nền xám bạc phẳng lì.
  useEffect(() => {
    if (!revealed) return;
    setCelebrating(true);
    const timeout = setTimeout(() => setCelebrating(false), 650);
    return () => clearTimeout(timeout);
  }, [revealed]);

  function checkRevealProgress() {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let total = 0;
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4 * 6) {
      total++;
      if (data[i] < 40) cleared++;
    }
    if (total > 0 && cleared / total > REVEAL_THRESHOLD) {
      setRevealed(true);
    }
  }

  function scratchAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const radius = rect.width * SCRATCH_RADIUS_RATIO;

    ctx.globalCompositeOperation = 'destination-out';
    // Vẽ nối từ điểm trước đó thay vì chỉ chấm 1 vòng tròn — di chuột/ngón tay nhanh giữa 2 lần
    // pointermove vẫn cào liền mạch, không để lại khoảng trống chưa cào.
    if (lastPointRef.current) {
      ctx.lineCap = 'round';
      ctx.lineWidth = radius * 2;
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPointRef.current = { x, y };

    scratchCountRef.current += 1;
    if (scratchCountRef.current % PROGRESS_CHECK_INTERVAL === 0) {
      checkRevealProgress();
    }
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    isScratchingRef.current = true;
    lastPointRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    scratchAt(e.clientX, e.clientY);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isScratchingRef.current) return;
    scratchAt(e.clientX, e.clientY);
  }

  function handlePointerUp() {
    isScratchingRef.current = false;
    lastPointRef.current = null;
    // Luôn kiểm tra lại đúng lúc nhả tay/chuột — trong lúc kéo chỉ kiểm tra mỗi 4 lần cào nên vài
    // nét cuối trước khi dừng có thể chưa được tính, dễ kẹt lại dưới ngưỡng dù nhìn đã cào gần hết.
    checkRevealProgress();
  }

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className ?? ''}`}>
      <div style={PERMANENT_COIN_STYLE} className="absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.06em] px-[12%] text-center">
        <span className="font-baskerville text-[0.36em] font-bold leading-tight text-[#2b2b2b]">{prize}</span>
        <span className="text-[0.15em] font-semibold uppercase tracking-[0.06em] text-[#3a3a3a]">Chúc mừng!</span>
      </div>
      {!hidden && (
        <canvas
          ref={canvasRef}
          aria-label="Cào để xem quà tặng"
          role="button"
          className={`absolute inset-0 h-full w-full touch-none transition-opacity duration-300 ${
            revealed ? 'pointer-events-none opacity-0' : ''
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      )}
      {celebrating && (
        <>
          <span
            aria-hidden="true"
            className="animate-coin-reveal-glow pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255,224,153,0.85) 0%, rgba(245,166,35,0.35) 55%, rgba(245,166,35,0) 78%)',
            }}
          />
          <span
            aria-hidden="true"
            className="animate-coin-reveal-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#f5d38a]"
          />
        </>
      )}
    </div>
  );
}
