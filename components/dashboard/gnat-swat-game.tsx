'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

/** CSS gốc của game (CodePen "Gnat Attack" — Rachel Nabors) được scope toàn bộ dưới `.gs-swat-arena` để không
 *  rò ra ngoài trang (bản gốc set `cursor:none`/`overflow:hidden` thẳng lên `body`, nhúng nguyên văn sẽ ẩn
 *  con trỏ chuột và khoá cuộn cả trang admin). Bản gốc dùng `<audio autoplay loop>` trỏ tới file nhạc trên
 *  Dropbox cá nhân (link đã chết từ lâu) — bỏ hẳn nhạc nền, chỉ giữ hiệu ứng đập/vung vợt bằng Web Audio tự
 *  tổng hợp (giống cách AirHockeyGame làm), không phụ thuộc URL ngoài. */
const GS_CSS = `
.gs-swat-arena, .gs-swat-arena * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.gs-swat-arena {
  --gs-gold: #f5a623;
  --gs-cyan: #00d2ff;
  position: relative;
  width: 100%;
  max-width: 860px;
  aspect-ratio: 8 / 5;
  border-radius: 18px;
  overflow: hidden;
  touch-action: none;
  cursor: none;
  user-select: none;
  -webkit-user-select: none;
  box-shadow:
    0 0 0 2px rgba(245, 166, 35, 0.2),
    0 0 50px rgba(245, 166, 35, 0.08),
    0 20px 70px rgba(0, 0, 0, 0.8);
}
.gs-swat-arena .gs-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
.gs-swat-arena .gs-gnat {
  cursor: default;
  pointer-events: none;
}
.gs-swat-arena .gs-swatter-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  opacity: 0;
  z-index: 5;
}
.gs-swat-arena .gs-swatter {
  overflow: visible;
  width: 60px;
  height: 130px;
  margin-left: -30px;
  margin-top: -32px;
}
.gs-swat-arena .gs-score-panel {
  position: absolute;
  top: 14px;
  left: 16px;
  z-index: 4;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gs-swat-arena .gs-score-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}
.gs-swat-arena .gs-score-value {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  color: var(--gs-gold);
  text-shadow: 0 0 18px rgba(245, 166, 35, 0.55);
}
.gs-swat-arena .gs-hint {
  position: absolute;
  bottom: 12px;
  left: 16px;
  right: 16px;
  z-index: 4;
  pointer-events: none;
  font-size: 11px;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.4);
}
.gs-swat-arena .gs-mute-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 6;
  padding: 7px 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
}
.gs-swat-arena .gs-mute-btn:hover {
  color: #fff;
  border-color: var(--gs-cyan);
}
`;

interface GnatEntry {
  el: SVGGElement;
  x: number;
  y: number;
  alive: boolean;
}

interface PathPoint {
  x: number;
  y: number;
}

const SWAT_THRESHOLD = 34;
const FLIGHT_DURATION = 6.5;
const PATH_POINTS = 7;

/** Game "đập muỗi" (SVG + GSAP, chuyển thể từ CodePen "Gnat Attack" của Rachel Nabors) — nhúng làm chương cuối
 *  trang Văn hoá. Muỗi bay theo đường cong ngẫu nhiên trong khung qua GSAP MotionPathPlugin (kiểu "thru" —
 *  bản gốc dùng special property `bezier` của GSAP 2, đã bị gộp vào MotionPathPlugin từ GSAP 3); vợt theo
 *  con trỏ, bấm/chạm để đập, hit test bằng khoảng cách toạ độ (giống bản gốc), không dùng pointer-events
 *  trên từng con muỗi. Toạ độ gnat/vợt dùng thẳng đơn vị pixel của khung (SVG không set viewBox) nên không
 *  cần quy đổi tỉ lệ khi so khớp vị trí — chỉ đọc lại `getBoundingClientRect()` của khung mỗi khi kích
 *  thước đổi. */
interface GnatSwatGameProps {
  /** Gọi mỗi khi điểm tăng (1 con muỗi vừa bị đập trúng), kèm điểm hiện tại của ván — dùng để ghi nhận
   *  bảng xếp hạng (xem GnatSwatLeaderboard). Giữ trong ref vì effect dựng game logic chỉ chạy 1 lần lúc
   *  mount ([] deps), không muốn re-run cả game khi prop đổi. */
  onScoreChange?: (score: number) => void;
}

export default function GnatSwatGame({ onScoreChange }: GnatSwatGameProps) {
  const onScoreChangeRef = useRef(onScoreChange);
  useEffect(() => {
    onScoreChangeRef.current = onScoreChange;
  }, [onScoreChange]);

  const rootRef = useRef<HTMLDivElement>(null);
  const enemiesRef = useRef<SVGGElement>(null);
  const gnatTemplateRef = useRef<SVGGElement>(null);
  const swatterWrapRef = useRef<HTMLDivElement>(null);
  const swatterRef = useRef<SVGSVGElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const muteBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (
      !rootRef.current || !enemiesRef.current || !gnatTemplateRef.current ||
      !swatterWrapRef.current || !swatterRef.current || !scoreRef.current || !muteBtnRef.current
    ) {
      return;
    }
    const root = rootRef.current;
    const enemies = enemiesRef.current;
    const gnatTemplate = gnatTemplateRef.current;
    const swatterWrap = swatterWrapRef.current;
    const swatter = swatterRef.current;
    const scoreEl = scoreRef.current;
    const muteBtn = muteBtnRef.current;

    gsap.set(swatter, { transformPerspective: 500 });

    // ── Audio (tổng hợp bằng Web Audio, không phụ thuộc file mp3 ngoài) ──
    let audioCtx: AudioContext | null = null;
    let muted = true;
    function getAudio() {
      if (!audioCtx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctor();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }
    function mkNoise(ctx: AudioContext, dur: number) {
      const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource();
      s.buffer = b;
      return s;
    }
    function playSwing() {
      if (muted) return;
      const ctx = getAudio();
      const t = ctx.currentTime;
      const n = mkNoise(ctx, 0.14);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 3;
      bp.frequency.setValueAtTime(2200, t);
      bp.frequency.exponentialRampToValueAtTime(500, t + 0.13);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      n.connect(bp);
      bp.connect(g);
      g.connect(ctx.destination);
      n.start(t);
      n.stop(t + 0.14);
    }
    function playSplat() {
      if (muted) return;
      const ctx = getAudio();
      const t = ctx.currentTime;
      const n = mkNoise(ctx, 0.1);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      n.connect(lp);
      lp.connect(g);
      g.connect(ctx.destination);
      n.start(t);
      n.stop(t + 0.1);

      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.08);
      og.gain.setValueAtTime(0.3, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      o.connect(og);
      og.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.09);
    }
    function updateMuteLabel() {
      muteBtn.textContent = muted ? 'Bật âm thanh' : 'Tắt âm thanh';
    }
    updateMuteLabel();
    function toggleMute() {
      muted = !muted;
      if (!muted) getAudio().resume();
      updateMuteLabel();
    }
    muteBtn.addEventListener('click', toggleMute);

    // ── Swarm ──
    let score = 0;
    const gnats: GnatEntry[] = [];

    function getPath(): PathPoint[] {
      const b = root.getBoundingClientRect();
      const w = b.width, h = b.height;
      const initX = Math.random() < 0.5 ? -20 : w + 20;
      const initY = Math.random() < 0.5 ? -20 : h + 20;
      const points: PathPoint[] = [{ x: initX, y: initY }];
      for (let i = 0; i < PATH_POINTS; i++) {
        const angle = Math.random() * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * w * 0.3 + w * 0.5,
          y: Math.sin(angle) * h * 0.3 + h * 0.5,
        });
      }
      points.push({
        x: Math.random() < 0.5 ? -20 : w + 20,
        y: Math.random() < 0.5 ? -20 : h + 20,
      });
      return points;
    }

    function buzz(g: GnatEntry) {
      if (!g.alive) return;
      const flap = Math.random();
      const wing1 = g.el.querySelector<SVGGElement>('.gs-wing1');
      const wing2 = g.el.querySelector<SVGGElement>('.gs-wing2');
      if (wing1) gsap.set(wing1, { autoAlpha: flap > 0.5 ? 0 : 1 });
      if (wing2) gsap.set(wing2, { autoAlpha: flap > 0.5 ? 1 : 0 });
      gsap.set(g.el, { x: g.x, y: g.y });
    }

    function removeGnat(g: GnatEntry) {
      gsap.killTweensOf(g);
      gsap.killTweensOf(g.el);
      g.el.remove();
      const idx = gnats.indexOf(g);
      if (idx >= 0) gnats.splice(idx, 1);
    }

    function spawnWave(count: number) {
      const path = getPath();
      for (let i = 0; i < count; i++) {
        const el = gnatTemplate.cloneNode(true) as SVGGElement;
        el.removeAttribute('visibility');
        enemies.appendChild(el);
        const g: GnatEntry = { el, x: path[0].x, y: path[0].y, alive: true };
        gnats.push(g);
        gsap.set(el, { x: g.x, y: g.y, transformOrigin: '50% 50%' });
        gsap.to(g, {
          duration: FLIGHT_DURATION,
          delay: i * 0.2,
          motionPath: { path, curviness: 1.5, type: 'thru', autoRotate: false },
          ease: 'none',
          onUpdate: () => buzz(g),
          onComplete: () => removeGnat(g),
        });
      }
    }

    let emitTimer: ReturnType<typeof setTimeout> | null = null;
    let spawning = false;
    function scheduleEmit() {
      spawnWave(Math.floor(Math.random() * 2) + 3);
      emitTimer = setTimeout(scheduleEmit, (Math.random() + 1.6) * 1000);
    }
    function startSpawning() {
      if (spawning) return;
      spawning = true;
      scheduleEmit();
    }
    function stopSpawning() {
      spawning = false;
      if (emitTimer) clearTimeout(emitTimer);
      emitTimer = null;
      gnats.slice().forEach(removeGnat);
    }

    function checkHit(x: number, y: number) {
      gnats.slice().forEach((g) => {
        if (!g.alive) return;
        if (Math.abs(g.x - x) >= SWAT_THRESHOLD || Math.abs(g.y - y) >= SWAT_THRESHOLD) return;
        g.alive = false;
        score++;
        scoreEl.textContent = String(score);
        onScoreChangeRef.current?.(score);
        gsap.killTweensOf(g);
        gsap.to(g.el, {
          duration: 0.9,
          y: '+=600',
          rotation: Math.random() < 0.5 ? -720 : 720,
          transformOrigin: '50% 50%',
          autoAlpha: 0,
          ease: 'power1.in',
          onComplete: () => removeGnat(g),
        });
        playSplat();
      });
    }

    // Theo dõi con trỏ ở cấp `window` thay vì chỉ trong phạm vi khung: chương này nằm trong 1 FlowSection
    // được ScrollTrigger "ghim" khi cuộn tới (xem story-scroll.tsx) — khung xuất hiện dưới con trỏ do
    // trang cuộn/pin, không phải do chuột di chuyển, nên `pointerenter`/`pointermove` gắn trên khung có
    // thể không bắn ra cho tới lần rê chuột đầu tiên sau đó. Theo dõi ở window + tự so toạ độ với
    // `getBoundingClientRect()` mới nhất mỗi lần (không cache) để luôn đúng dù khung đang bị pin/xoay.
    let swatterVisible = false;
    let lastClientX = -1;
    let lastClientY = -1;
    function updatePointer(clientX: number, clientY: number) {
      lastClientX = clientX;
      lastClientY = clientY;
      const b = root.getBoundingClientRect();
      const x = clientX - b.left;
      const y = clientY - b.top;
      const inside = x >= 0 && x <= b.width && y >= 0 && y <= b.height;
      if (inside) {
        gsap.set(swatterWrap, { x, y });
        if (!swatterVisible) {
          swatterVisible = true;
          gsap.to(swatterWrap, { duration: 0.1, autoAlpha: 1 });
        }
      } else if (swatterVisible) {
        swatterVisible = false;
        gsap.to(swatterWrap, { duration: 0.1, autoAlpha: 0 });
      }
      return { x, y, inside };
    }

    function swing(x: number, y: number) {
      gsap.to(swatter, {
        duration: 0.05,
        rotationX: -55,
        transformOrigin: '0% 110%',
        yoyo: true,
        repeat: 1,
        ease: 'expo.out',
      });
      checkHit(x, y);
      playSwing();
    }

    const onWindowPointerMove = (e: PointerEvent) => updatePointer(e.clientX, e.clientY);
    const onWindowPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.gs-mute-btn')) return;
      const { x, y, inside } = updatePointer(e.clientX, e.clientY);
      if (!inside) return;
      swing(x, y);
    };
    const onWindowPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        setTimeout(() => {
          swatterVisible = false;
          gsap.to(swatterWrap, { duration: 0.15, autoAlpha: 0 });
        }, 250);
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerdown', onWindowPointerDown);
    window.addEventListener('pointerup', onWindowPointerUp);

    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (isVisible) {
          startSpawning();
          // Cuộn/pin có thể đưa khung ra dưới con trỏ mà không có sự kiện pointermove nào kèm theo —
          // so lại ngay với vị trí con trỏ đã biết gần nhất thay vì chờ lần rê chuột tiếp theo.
          if (lastClientX >= 0) updatePointer(lastClientX, lastClientY);
        } else {
          stopSpawning();
        }
      },
      { threshold: 0.05 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      stopSpawning();
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerdown', onWindowPointerDown);
      window.removeEventListener('pointerup', onWindowPointerUp);
      muteBtn.removeEventListener('click', toggleMute);
      if (audioCtx) audioCtx.close().catch(() => undefined);
    };
  }, []);

  return (
    <div ref={rootRef} className="gs-swat-arena">
      <style dangerouslySetInnerHTML={{ __html: GS_CSS }} />
      <svg className="gs-bg" aria-hidden="true" focusable="false">
        <defs>
          <g ref={gnatTemplateRef} className="gs-gnat">
            <g className="gs-wing1" strokeWidth={2}>
              <path fill="#D5D8D0" stroke="#9F9F86" d="M-6-3c-7 13-14 16-20 10M6-3c7 13 14 16 20 10" />
              <path fill="none" stroke="#5D5D45" d="M6 15V4M-6 15V4" />
            </g>
            <g className="gs-wing2" strokeWidth={2} visibility="hidden" opacity={0}>
              <path fill="none" stroke="#5D5D45" d="M11 13L2 4M-11 13l9-9" />
              <path fill="#D5D8D0" stroke="#9F9F86" d="M-4-2c-15 1-21-4-19-12M3-2c15 1 21-4 19-12" />
            </g>
            <path fill="#ACADA6" d="M0 9c-3.9 0-7-3.1-7-7v-4c0-3.9 3.1-7 7-7s7 3.1 7 7v4c0 3.9-3.1 7-7 7z" />
            <circle fill="#F70000" cx={-4} cy={-7} r={2} />
            <circle fill="#F70000" cx={4} cy={-7} r={2} />
            <path fill="none" stroke="#2B2920" strokeWidth={2} d="M7 2c0 3.9-3.1 7-7 7s-7-3.1-7-7" />
            <path fill="none" stroke="#9F9F86" strokeWidth={2} d="M-5-13l5 5 5-5" />
            <path fill="none" stroke="#5D5D45" strokeWidth={2} d="M-13 8l7-7M13 8L6 1" />
          </g>
          <radialGradient cx="60%" cy="80%" r="120%" fx="30%" fy="0%" id="gs-bg-shadow" gradientUnits="userSpaceOnUse">
            <stop offset="30%" stopOpacity={0} />
            <stop offset="100%" stopOpacity={0.5} />
          </radialGradient>
          <pattern id="gs-bg-tile" x="50%" y="50%" width={60} height={60} patternUnits="userSpaceOnUse" strokeWidth={4} fill="none">
            <path fill="#efefef" d="M0 0h60v60H0z" />
            <path stroke="#d9d9d9" d="M0 60h60V0" />
            <path stroke="#fff" d="M0 60V0h60" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gs-bg-tile)" />
        <rect width="100%" height="100%" fill="url(#gs-bg-shadow)" />
        <g ref={enemiesRef} />
      </svg>

      <div ref={swatterWrapRef} className="gs-swatter-wrap">
        <svg ref={swatterRef} className="gs-swatter" viewBox="-32 -32 64 148" overflow="visible">
          <path fill="none" stroke="#645CA8" strokeWidth={4} d="M0 32v45" />
          <path
            fill="none"
            stroke="#4D99D3"
            strokeWidth={2}
            d="M-20-30v60m10-60v60M0-30v60m0-60v60m10-60v60m10-60v60m-50-50h60m-60 10h60M-30 0h60m-60 0h60m-60 10h60m-60 10h60"
          />
          <path
            fill="none"
            stroke="#645CA8"
            strokeWidth={4}
            d="M30 20v-50h-60v50c0 5.5 4.5 10 10 10h40c5.5 0 10-4.5 10-10z"
          />
          <path fill="#4699D4" stroke="#645CA8" strokeWidth={2} d="M0 36c-2.8 0-5-2.2-5-5H5c0 2.8-2.2 5-5 5z" />
          <path
            fill="#FFF"
            d="M22.6 101.6c2.4-12-2.5-22.3-5-25.8-2.6-3.5-5.8-6.1-10.3-5.8 0-10-14-10-14 0 0 1 .1 1.8.2 2.6-4.8 2.3-7.5 7.5-7.5 14.2 0 4 4.3 6 7 4.2-1.1 2.5-2.1 5.4-1.5 10.1 1.3 9.2 8.5 13.8 8.5 13.8-6.1 4.6 1.5 14.8 7.6 10.3 3.1-2.3 3.1-4 7.7-7.4s6.2-2.9 9.3-5.2c4.3-3.3 1.9-9.2-2-11z"
          />
          <path
            fill="#BFBFBF"
            d="M26.7 106.4c.6 2.1.1 4.4-2 6-3.1 2.3-4.7 1.8-9.3 5.2s-4.6 5.1-7.7 7.4c-6.1 4.6-13.8-5.7-7.6-10.3.8 5.4 2.1 5.6 5.2 6 3.1.4 6.9-6.9 12.9-8.8 6-1.7 8.5-5.5 8.5-5.5zm-22.6 6C-5.9 101 2.9 91.5-.7 80.7c-1.8-5.2-3.4-14.1.8-18.2C-3.4 62.5-7 65-7 70s2 6.2 2 13-5 8.8-3.8 18 8.5 13.8 8.5 13.8c1.7-1.3 2.9-1.7 4.4-2.4zM-7 90.9c.4-.9.8-1.7 1.1-2.6-4.6-.4-5.3-5.6-3.8-13.7-2.9 2.7-4.4 7-4.4 12 .1 4.1 4.4 6.1 7.1 4.3z"
          />
          <path
            fill="none"
            stroke="#818181"
            strokeWidth={2}
            strokeLinecap="round"
            d="M.1 114.8s-7.2-4.5-8.5-13.8 3.8-11.2 3.8-18-2-8-2-13c0-10 14-10 14 0 0 4.1-1 8.2-1 13s4.2 8 4.2 8m-6.2 21.4c-1.5.7-2.7 1.1-4.3 2.3-6.1 4.6 1.5 14.8 7.6 10.3 3.1-2.3 3.1-4 7.7-7.4 4.6-3.4 6.2-2.9 9.3-5.2 6.1-4.6-1.5-14.8-7.6-10.3-1.6 1.2-2.4 2.3-3.5 3.5m9-4c2.4-12-2.5-22.3-5-25.8-2.6-3.5-5.8-6.1-10.3-5.8m-13.8 2.5C-11.3 74.8-14 80-14 86.7c0 4 4.3 6 7 4.2"
          />
        </svg>
      </div>

      <div className="gs-score-panel">
        <span className="gs-score-label">Muỗi đã đập</span>
        <span ref={scoreRef} className="gs-score-value">0</span>
      </div>
      <p className="gs-hint">Rê chuột hoặc chạm vào khung để đập muỗi bay ngang qua</p>
      <button ref={muteBtnRef} type="button" className="gs-mute-btn">Bật âm thanh</button>
    </div>
  );
}
