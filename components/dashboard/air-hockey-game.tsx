'use client';

import { useEffect, useRef } from 'react';
import { Orbitron, Rajdhani } from 'next/font/google';

const orbitron = Orbitron({ subsets: ['latin'], weight: 'variable' });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['300', '500'] });

/** Family thật do next/font sinh ra — dùng trực tiếp trong CSS scoped bên dưới và trong `ctx.font` (Canvas
 *  không hiểu CSS custom property, cần chuỗi tên font đã resolve). */
const AH_ORBITRON = orbitron.style.fontFamily;
const AH_RAJDHANI = rajdhani.style.fontFamily;

/** CSS gốc của game (CodePen "Air Hockey" — Matt Cannon) được scope toàn bộ dưới `.ah-air-hockey` để không
 *  rò ra ngoài trang (bản gốc set thẳng lên `body`/`:root`/`*`, nhúng nguyên văn sẽ phá layout + ẩn con trỏ
 *  chuột cả trang admin). Đã gộp các block trùng selector (`#outer`, `.go-face`, `.screen`, `button`) về một
 *  block duy nhất và bỏ phần CSS chết (`.ready-*`, `.go-emoji`, keyframes không ai dùng) — không đổi hiệu ứng
 *  hiển thị cuối cùng, chỉ dọn cascade cho gọn. */
const AH_CSS = `
.ah-air-hockey, .ah-air-hockey * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.ah-air-hockey {
  --ah-blue: #00d4ff;
  --ah-red: #ff2d55;
  --ah-gold: #ffc940;
  --ah-panel: #080d14;
  width: 100%;
  font-family: ${AH_ORBITRON}, monospace;
  user-select: none;
}
.ah-air-hockey #ah-game-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}
.ah-air-hockey #ah-outer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 1360px;
  max-width: 100%;
  transform-origin: top center;
}
@media (max-width: 1360px) {
  .ah-air-hockey #ah-outer {
    transform: scale(calc(100vw / 1360));
  }
}
.ah-air-hockey #ah-arena {
  position: relative;
  width: 100%;
  max-width: 960px;
  aspect-ratio: 760 / 520;
  margin: 0 auto;
  touch-action: none;
  cursor: none;
}
.ah-air-hockey canvas {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 18px;
  box-shadow:
    0 0 0 2px rgba(0, 212, 255, 0.2),
    0 0 50px rgba(0, 212, 255, 0.1),
    0 20px 70px rgba(0, 0, 0, 0.8);
}
.ah-air-hockey .ah-stat-panel {
  width: 165px;
  flex-shrink: 0;
  padding: 16px 10px 12px;
  background: var(--ah-panel);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.ah-air-hockey #ah-stat-left { border-radius: 16px 0 0 16px; border-right: none; }
.ah-air-hockey #ah-stat-right { border-radius: 0 16px 16px 0; border-left: none; }
.ah-air-hockey .ah-stat-name {
  font-family: ${AH_ORBITRON}, monospace;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 4px;
  margin-bottom: 6px;
  text-align: center;
  width: 100%;
}
.ah-air-hockey .ah-stat-score {
  font-family: ${AH_ORBITRON}, monospace;
  font-weight: 900;
  font-size: 64px;
  line-height: 1;
  margin-bottom: 6px;
  text-align: center;
  width: 100%;
  letter-spacing: -2px;
}
.ah-air-hockey .ah-stat-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 6px 0 8px;
}
.ah-air-hockey .ah-stat-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 9px;
}
.ah-air-hockey .ah-stat-label {
  font-family: ${AH_RAJDHANI}, sans-serif;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
}
.ah-air-hockey .ah-stat-val {
  font-family: ${AH_ORBITRON}, monospace;
  font-weight: 700;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.75);
}
.ah-air-hockey .ah-stat-footer {
  font-family: ${AH_RAJDHANI}, sans-serif;
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.2);
  text-align: center;
  text-transform: uppercase;
  margin-top: 2px;
}
.ah-air-hockey #ah-ui {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 18px;
  overflow: hidden;
}
.ah-air-hockey #ah-mute-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  font-family: ${AH_RAJDHANI}, sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  z-index: 5;
}
.ah-air-hockey .ah-screen {
  cursor: default;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
  background: rgba(4, 6, 10, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 18px;
}
.ah-air-hockey .ah-screen.ah-on {
  opacity: 1;
  pointer-events: all;
}
.ah-air-hockey .ah-go-inner { text-align: center; }
.ah-air-hockey .ah-go-face {
  font-size: 60px;
  line-height: 1;
  margin-bottom: 8px;
  display: block;
  animation: ah-facePop 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes ah-facePop {
  0% { transform: scale(0); opacity: 0; }
  65% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.ah-air-hockey .ah-go-who {
  font-size: clamp(36px, 7vw, 64px);
  font-weight: 900;
  line-height: 1;
}
.ah-air-hockey .ah-go-wins {
  font-family: ${AH_RAJDHANI}, sans-serif;
  font-weight: 300;
  font-size: 18px;
  letter-spacing: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
}
.ah-air-hockey .ah-go-final {
  font-size: 28px;
  font-weight: 700;
  color: var(--ah-gold);
  text-shadow: 0 0 20px var(--ah-gold);
  margin: 12px 0 24px;
}
.ah-air-hockey #ah-gameover-screen.ah-lose-state {
  background: rgba(20, 4, 8, 0.9);
}
.ah-air-hockey button {
  cursor: pointer;
  padding: 13px 44px;
  background: transparent;
  border: 2px solid var(--ah-blue);
  color: var(--ah-blue);
  font-family: ${AH_ORBITRON}, monospace;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 4px;
  clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
  transition: background 0.2s, box-shadow 0.2s, color 0.2s;
}
.ah-air-hockey button:hover {
  background: var(--ah-blue);
  color: #000;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
}
`;

interface TrailPoint { x: number; y: number; spd: number }
interface ConfettiPiece {
  x: number; y: number; vx: number; vy: number; rot: number; rotV: number;
  w: number; h: number; col: string; life: number;
}
interface GameParticle {
  x: number; y: number; vx: number; vy: number; life: number;
  col: string; size: number; glow: boolean; gravity: number;
}
interface SideStats { goals: number; streak: number; bestStreak: number; topSpeed: number; powerHits: number }

/** Game Air Hockey (Canvas 2D, chuyển thể từ CodePen gốc của Matt Cannon) — nhúng làm chương 05 (cuối) của
 *  trang Văn hoá. Vật lý/AI/âm thanh giữ nguyên bản gốc; phần chuyển thể chỉ lo vòng đời React: đọc DOM qua
 *  ref thay vì `getElementById` toàn cục, dọn sạch requestAnimationFrame/listener/AudioContext lúc unmount
 *  (tránh vòng lặp game chạy ngầm vô hạn khi rời trang), và tạm dừng vòng lặp vẽ khi chương cuộn ra ngoài
 *  khung nhìn (game nằm cuối trang, không nên tốn CPU/pin khi người dùng chưa cuộn tới). */
export default function AirHockeyGame() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameoverRef = useRef<HTMLDivElement>(null);
  const goFaceRef = useRef<HTMLDivElement>(null);
  const goWhoRef = useRef<HTMLDivElement>(null);
  const goWinsRef = useRef<HTMLDivElement>(null);
  const goFinalRef = useRef<HTMLDivElement>(null);
  const btnAgainRef = useRef<HTMLButtonElement>(null);
  const muteBtnRef = useRef<HTMLDivElement>(null);
  const scorePRef = useRef<HTMLDivElement>(null);
  const scoreCpuRef = useRef<HTMLDivElement>(null);
  const pStreakRef = useRef<HTMLSpanElement>(null);
  const pSpeedRef = useRef<HTMLSpanElement>(null);
  const pPowerRef = useRef<HTMLSpanElement>(null);
  const cpuStreakRef = useRef<HTMLSpanElement>(null);
  const cpuSpeedRef = useRef<HTMLSpanElement>(null);
  const cpuPowerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (
      !rootRef.current || !canvasRef.current || !gameoverRef.current || !goFaceRef.current ||
      !goWhoRef.current || !goWinsRef.current || !goFinalRef.current || !btnAgainRef.current ||
      !muteBtnRef.current || !scorePRef.current || !scoreCpuRef.current || !pStreakRef.current ||
      !pSpeedRef.current || !pPowerRef.current || !cpuStreakRef.current || !cpuSpeedRef.current ||
      !cpuPowerRef.current
    ) {
      return;
    }
    // Non-null asserted (thay vì narrow từ guard trên) — hàm khai báo bằng `function` bị hoist nên TS
    // không giữ narrowing của guard bên trong closure của chúng, dù về runtime luôn đã qua guard.
    const root = rootRef.current!;
    const CV = canvasRef.current!;
    const gameoverEl = gameoverRef.current!;
    const goFace = goFaceRef.current!;
    const goWho = goWhoRef.current!;
    const goWinsEl = goWinsRef.current!;
    const goFinal = goFinalRef.current!;
    const btnAgain = btnAgainRef.current!;
    const muteBtn = muteBtnRef.current!;
    const scoreP = scorePRef.current!;
    const scoreCpu = scoreCpuRef.current!;
    const pStreak = pStreakRef.current!;
    const pSpeed = pSpeedRef.current!;
    const pPower = pPowerRef.current!;
    const cpuStreak = cpuStreakRef.current!;
    const cpuSpeed = cpuSpeedRef.current!;
    const cpuPower = cpuPowerRef.current!;

    const ctx2d = CV.getContext('2d');
    if (!ctx2d) return;
    const G = ctx2d as CanvasRenderingContext2D & { letterSpacing?: string };
    CV.width = 760;
    CV.height = 520;
    const W = 760, H = 520;

    const DOM = { scoreP, scoreCpu, pStreak, pSpeed, pPower, cpuStreak, cpuSpeed, cpuPower };

    // ── Audio Engine ──
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
    function playSound(type: string, speed = 1) {
      if (muted) return;
      const ctx = getAudio();
      const t = ctx.currentTime;
      const out = ctx.destination;
      if (type === 'hit') {
        const n = mkNoise(ctx, 0.07);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 900 + speed * 180 + Math.random() * 400;
        bp.Q.value = 2 + Math.random() * 3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.5 + Math.min(speed / 18, 0.35), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        n.connect(bp);
        bp.connect(g);
        g.connect(out);
        n.start(t);
        n.stop(t + 0.07);
      }
      if (type === 'wall') {
        const n = mkNoise(ctx, 0.04);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1400 + Math.random() * 600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        n.connect(hp);
        hp.connect(g);
        g.connect(out);
        n.start(t);
        n.stop(t + 0.04);
      }
      if (type === 'goal') {
        const sub = ctx.createOscillator(), sg = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(60, t);
        sub.frequency.exponentialRampToValueAtTime(28, t + 0.25);
        sg.gain.setValueAtTime(0.6, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        sub.connect(sg);
        sg.connect(out);
        sub.start(t);
        sub.stop(t + 0.3);
        ([[0, 'sawtooth', 233], [0.01, 'sawtooth', 220], [0.02, 'sawtooth', 246]] as const).forEach(([dt, wv, f]) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = wv;
          o.frequency.value = f;
          g.gain.setValueAtTime(0.15, t + dt);
          g.gain.setValueAtTime(0.15, t + 0.5);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
          o.connect(g);
          g.connect(out);
          o.start(t + dt);
          o.stop(t + 0.71);
        });
      }
      if (type === 'victory') {
        ([[0, 392, 0.12], [0.13, 392, 0.12], [0.26, 392, 0.12], [0.39, 523, 0.45], [0.58, 494, 0.18], [0.77, 440, 0.18], [0.96, 523, 0.6]] as const).forEach(([dt, f, dur]) => {
          [-4, 0, 4].forEach((cents) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = f * Math.pow(2, cents / 1200);
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 1800;
            g.gain.setValueAtTime(0, t + dt);
            g.gain.linearRampToValueAtTime(0.08, t + dt + 0.02);
            g.gain.setValueAtTime(0.08, t + dt + dur - 0.03);
            g.gain.exponentialRampToValueAtTime(0.001, t + dt + dur);
            o.connect(lp);
            lp.connect(g);
            g.connect(out);
            o.start(t + dt);
            o.stop(t + dt + dur + 0.01);
          });
        });
      }
      if (type === 'speedup') {
        const n = mkNoise(ctx, 0.4);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 5;
        bp.frequency.setValueAtTime(300, t);
        bp.frequency.exponentialRampToValueAtTime(3000, t + 0.38);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        n.connect(bp);
        bp.connect(g);
        g.connect(out);
        n.start(t);
        n.stop(t + 0.4);
      }
      if (type === 'slomo_in') {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(100, t);
        o.frequency.exponentialRampToValueAtTime(36, t + 0.65);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        o.connect(g);
        g.connect(out);
        o.start(t);
        o.stop(t + 0.7);
      }
    }

    function updateMuteLabel() {
      muteBtn.innerHTML = muted ? 'PRESS S FOR SOUND' : 'PRESS S TO MUTE';
    }
    updateMuteLabel();
    function toggleMute() {
      muted = !muted;
      if (!muted) getAudio().resume();
      updateMuteLabel();
    }

    // ── Confetti ──
    const confetti: ConfettiPiece[] = [];
    const CONF_COLORS = ['#00d4ff', '#ff2d55', '#ffc940', '#ffffff', '#a855f7', '#22c55e', '#fb923c'];
    function spawnConfetti() {
      for (let i = 0; i < 160; i++) {
        confetti.push({
          x: Math.random() * W,
          y: -10 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 5,
          vy: 2 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.22,
          w: 6 + Math.random() * 8,
          h: 3 + Math.random() * 4,
          col: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
          life: 1,
        });
      }
    }
    function updateConfetti() {
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.08;
        c.vx *= 0.99;
        c.rot += c.rotV;
        if (c.y > H + 20) c.life -= 0.05;
        if (c.life <= 0) confetti.splice(i, 1);
      }
    }
    function drawConfetti() {
      confetti.forEach((c) => {
        G.save();
        G.globalAlpha = c.life;
        G.translate(c.x, c.y);
        G.rotate(c.rot);
        G.fillStyle = c.col;
        G.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        G.restore();
      });
    }

    // ── Slo-mo state ──
    let sloMo = false;
    let sloMoAlpha = 0;
    let sloMoIntro = 0;
    let confettiInterval: ReturnType<typeof setInterval> | null = null;
    let showSadFace = false;
    let sloMoLabelTimer = 0;
    const TABLE_X = 30, TABLE_Y = 30, TABLE_W = W - 60, TABLE_H = H - 60;
    const CX = W / 2, CY = H / 2;
    const GOAL_W = 160, GOAL_DEPTH = 20;
    const GOAL_Y1 = CY - GOAL_W / 2, GOAL_Y2 = CY + GOAL_W / 2;
    const PUCK_R = 14;
    const MALLET_R = 24;
    const MAX_SCORE = 3;
    const FRICTION = 0.995;
    const WALL_BOUNCE = 0.82;

    const CPU_SPEED = 4.6;
    const CPU_REACT = 0.62;
    const CPU_ERROR_Y = 26;
    const CPU_MISTAKE_CHANCE = 0.018;
    const CPU_MISTAKE_DUR = 42;

    // ── State ──
    let state: 'title' | 'play' | 'goal' | 'over' = 'title';
    let tick = 0;
    let shakeX = 0, shakeY = 0, shakeAmt = 0;
    let goalFlash = 0, goalWho: 'p' | 'cpu' = 'p';
    let goalMsgScale = 0;
    let puckSpeedMult = 1.0;
    let lastSpeedUpAt = 0;
    let speedUpMsg = '';
    let speedUpTimer = 0;

    const stats: { p: SideStats; cpu: SideStats; rallyHits: number; totalHits: number } = {
      p: { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 },
      cpu: { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 },
      rallyHits: 0,
      totalHits: 0,
    };
    function resetStats() {
      stats.p = { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 };
      stats.cpu = { goals: 0, streak: 0, bestStreak: 0, topSpeed: 0, powerHits: 0 };
      stats.rallyHits = 0;
      stats.totalHits = 0;
    }

    const score = { p: 0, cpu: 0 };

    const puck = { x: CX, y: CY, vx: 0, vy: 0, r: PUCK_R };
    const trail: TrailPoint[] = [];

    const player = { x: TABLE_X + 130, y: CY, tx: TABLE_X + 130, ty: CY, r: MALLET_R, pvx: 0, pvy: 0 };
    const cpu = { x: W - TABLE_X - 130, y: CY, r: MALLET_R, vx: 0, vy: 0, mistakeTimer: 0, errorY: 0, hitCool: 0 };

    // ── Particles ──
    const particles: GameParticle[] = [];
    function burst(x: number, y: number, col1: string, col2: string, n = 22) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 7;
        particles.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          col: Math.random() > 0.5 ? col1 : col2,
          size: 2 + Math.random() * 4,
          glow: Math.random() > 0.4,
          gravity: 0.08 + Math.random() * 0.12,
        });
      }
    }
    function sparkLine(x1: number, y1: number, x2: number, y2: number, col: string, n = 8) {
      for (let i = 0; i < n; i++) {
        const tt = Math.random();
        const x = x1 + (x2 - x1) * tt + (Math.random() - 0.5) * 10;
        const y = y1 + (y2 - y1) * tt + (Math.random() - 0.5) * 10;
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
        particles.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          col,
          size: 1.5 + Math.random() * 2,
          glow: true,
          gravity: 0.1,
        });
      }
    }

    // ── Input ──
    let rawMouseX = TABLE_X + 120, rawMouseY = H / 2;
    let prevRawX = TABLE_X + 120, prevRawY = H / 2;
    let mouseVX = 0, mouseVY = 0;

    function clamp(v: number, a: number, b: number) {
      return Math.max(a, Math.min(b, v));
    }

    function pointerToCanvas(clientX: number, clientY: number) {
      const r = CV!.getBoundingClientRect();
      const scaleX = W / r.width, scaleY = H / r.height;
      const nx = (clientX - r.left) * scaleX;
      const ny = (clientY - r.top) * scaleY;
      rawMouseX = clamp(nx, TABLE_X + MALLET_R + 2, CX - 10);
      rawMouseY = clamp(ny, TABLE_Y + MALLET_R + 2, TABLE_Y + TABLE_H - MALLET_R - 2);
    }

    const onCanvasMouseMove = (e: MouseEvent) => pointerToCanvas(e.clientX, e.clientY);
    const onDocMouseMove = (e: MouseEvent) => pointerToCanvas(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      pointerToCanvas(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      pointerToCanvas(e.touches[0].clientX, e.touches[0].clientY);
    };
    CV.addEventListener('mousemove', onCanvasMouseMove);
    document.addEventListener('mousemove', onDocMouseMove);
    CV.addEventListener('touchmove', onTouchMove, { passive: false });
    CV.addEventListener('touchstart', onTouchStart, { passive: false });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyS') toggleMute();
      if (e.code === 'Space' && state === 'over') startGame();
    };
    document.addEventListener('keydown', onKeyDown);

    // ── Game flow ──
    function startGame() {
      score.p = 0;
      score.cpu = 0;
      resetStats();
      puckSpeedMult = 1.0;
      lastSpeedUpAt = 0;
      speedUpMsg = '';
      speedUpTimer = 0;
      sloMo = false;
      sloMoAlpha = 0;
      sloMoIntro = 0;
      sloMoLabelTimer = 0;
      confetti.length = 0;
      if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
      }
      showSadFace = false;
      resetRound('p');
      state = 'play';
      gameoverEl.classList.remove('ah-on', 'ah-lose-state');
      particles.length = 0;
      updateStatDOM();
    }

    function resetRound(server: 'p' | 'cpu') {
      trail.length = 0;
      puck.x = CX;
      puck.y = CY;
      puck.vx = 0;
      puck.vy = 0;
      player.x = TABLE_X + 120;
      player.y = CY;
      player.pvx = 0;
      player.pvy = 0;
      cpu.x = W - TABLE_X - 120;
      cpu.y = CY;
      cpu.vx = 0;
      cpu.vy = 0;
      cpu.mistakeTimer = 0;
      stats.rallyHits = 0;
      if (server === 'p') {
        puck.vx = -(3.5 + Math.random() * 1.5) * puckSpeedMult;
        puck.vy = (Math.random() - 0.5) * 3.5 * puckSpeedMult;
      } else {
        puck.vx = (3.5 + Math.random() * 1.5) * puckSpeedMult;
        puck.vy = (Math.random() - 0.5) * 3.5 * puckSpeedMult;
      }
    }

    function goalScored(who: 'p' | 'cpu') {
      if (state !== 'play') return;
      state = 'goal';
      goalWho = who;
      goalFlash = 160;
      goalMsgScale = 0;

      const ws = stats[who], ls = stats[who === 'p' ? 'cpu' : 'p'];
      ws.goals++;
      ws.streak++;
      ws.bestStreak = Math.max(ws.bestStreak, ws.streak);
      ls.streak = 0;

      score[who]++;
      const totalGoals = score.p + score.cpu;
      if (totalGoals % 2 === 0 && totalGoals > lastSpeedUpAt) {
        lastSpeedUpAt = totalGoals;
        puckSpeedMult = Math.min(puckSpeedMult + 0.14, 2.0);
        const msgs = ['SPEEDING UP!', 'FASTER!!', 'KICK IT UP!', 'NO MERCY!', 'LIGHT SPEED!', 'HOLD ON!!'];
        speedUpMsg = msgs[Math.min(Math.floor(totalGoals / 2 - 1), msgs.length - 1)];
        speedUpTimer = 130;
      }
      if (who === 'p') burst(TABLE_X, CY, '#00d4ff', '#ffffff', 40);
      else burst(W - TABLE_X, CY, '#ff2d55', '#ffffff', 40);
      burst(puck.x, puck.y, '#ffc940', '#ffffff', 30);
      shake(8);

      updateStatDOM();

      const newP = score.p, newCPU = score.cpu;
      if ((newP === MAX_SCORE - 1 || newCPU === MAX_SCORE - 1) && !sloMo) {
        sloMo = true;
        sloMoIntro = 80;
        sloMoLabelTimer = 80 + 90;
      }

      setTimeout(() => {
        if (score.p >= MAX_SCORE || score.cpu >= MAX_SCORE) {
          state = 'over';
          const playerWon = score.p >= MAX_SCORE;
          goWho.textContent = playerWon ? 'YOU WIN' : 'CPU WINS';
          goWho.style.color = playerWon ? '#00d4ff' : '#ff2d55';
          goWho.style.textShadow = playerWon
            ? '0 0 30px #00d4ff, 0 0 60px rgba(0,212,255,0.4)'
            : '0 0 30px #ff2d55, 0 0 60px rgba(255,45,85,0.4)';
          goWinsEl.textContent = playerWon ? 'GAME · SET · MATCH' : 'BETTER LUCK NEXT TIME';
          goFace.textContent = playerWon ? '😄' : '😢';
          goFinal.textContent = `${score.p} – ${score.cpu}`;
          gameoverEl.classList.remove('ah-lose-state');
          if (!playerWon) gameoverEl.classList.add('ah-lose-state');
          burst(CX, CY, '#ffc940', '#ffffff', 80);
          if (playerWon) {
            playSound('victory');
            spawnConfetti();
            setTimeout(spawnConfetti, 400);
            setTimeout(spawnConfetti, 800);
            setTimeout(spawnConfetti, 1400);
            confettiInterval = setInterval(spawnConfetti, 1400);
          }
          gameoverEl.classList.add('ah-on');
        } else {
          resetRound(who === 'p' ? 'cpu' : 'p');
          state = 'play';
        }
      }, 1500);
    }

    function shake(amt: number) {
      shakeAmt = Math.max(shakeAmt, amt);
    }

    function updateStatDOM() {
      DOM.scoreP.textContent = String(score.p);
      DOM.scoreCpu.textContent = String(score.cpu);
      DOM.pStreak.textContent = String(stats.p.bestStreak);
      DOM.pSpeed.textContent = String(stats.p.topSpeed);
      DOM.pPower.textContent = String(stats.p.powerHits);
      DOM.cpuStreak.textContent = String(stats.cpu.bestStreak);
      DOM.cpuSpeed.textContent = String(stats.cpu.topSpeed);
      DOM.cpuPower.textContent = String(stats.cpu.powerHits);
    }

    // ── CPU AI ──
    function updateCPU(ts = 1) {
      const halfW = W / 2;
      const homeX = W - TABLE_X - 110;
      const minX = halfW + 10, maxX = W - TABLE_X - cpu.r - 2;
      const minY = TABLE_Y + cpu.r + 2, maxY = TABLE_Y + TABLE_H - cpu.r - 2;

      if (Math.random() < CPU_MISTAKE_CHANCE && cpu.mistakeTimer === 0 && puck.vx > 0) {
        cpu.mistakeTimer = CPU_MISTAKE_DUR;
        cpu.errorY = (Math.random() - 0.5) * CPU_ERROR_Y * 2;
      }
      if (cpu.mistakeTimer > 0) cpu.mistakeTimer--;
      if (cpu.hitCool > 0) cpu.hitCool--;

      const err = cpu.mistakeTimer > 0 ? cpu.errorY : 0;
      const puckOnMySide = puck.x > halfW;
      const puckHeadingToMe = puck.vx > 0;

      const nearTopWall = cpu.y < minY + 20;
      const nearBottomWall = cpu.y > maxY - 20;
      const nearSideWall = cpu.x > maxX - 20;
      const cornered = (nearTopWall || nearBottomWall) && nearSideWall;
      const farFromHome = Math.hypot(cpu.x - homeX, cpu.y - CY) > 150;

      let tx, ty;

      if (cornered || (farFromHome && !puckHeadingToMe)) {
        tx = homeX;
        ty = CY;
      } else if (puckOnMySide && puckHeadingToMe) {
        const frames = Math.max(1, Math.min((cpu.x - puck.x) / Math.max(0.5, puck.vx), 60));
        tx = clamp(puck.x + puck.vx * frames * CPU_REACT, minX, maxX);
        ty = clamp(puck.y + puck.vy * frames * CPU_REACT + err, minY, maxY);
      } else if (puckOnMySide) {
        tx = clamp(puck.x - 8, minX, maxX - 30);
        ty = clamp(puck.y + err, minY, maxY);
      } else {
        tx = homeX;
        ty = clamp(puck.y * 0.5 + CY * 0.5 + err * 0.3, minY, maxY);
      }

      const prevX = cpu.x, prevY = cpu.y;
      const dx = tx - cpu.x, dy = ty - cpu.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.1) {
        const step = Math.min(dist, CPU_SPEED * ts);
        cpu.x += (dx / dist) * step;
        cpu.y += (dy / dist) * step;
      }
      cpu.x = clamp(cpu.x, minX, maxX);
      cpu.y = clamp(cpu.y, minY, maxY);
      cpu.vx = cpu.x - prevX;
      cpu.vy = cpu.y - prevY;
    }

    // ── Physics ──
    function updatePuck() {
      if (state !== 'play') return;

      const spd = Math.hypot(puck.vx, puck.vy);
      trail.push({ x: puck.x, y: puck.y, spd });
      if (trail.length > 18) trail.shift();

      if (spd < 0.8) {
        puck.vx += (Math.random() - 0.5) * 0.18;
        puck.vy += (Math.random() - 0.5) * 0.18;
      } else if (spd < 2.5) {
        puck.vx += (Math.random() - 0.5) * 0.06;
        puck.vy += (Math.random() - 0.5) * 0.06;
      }

      puck.x += puck.vx;
      puck.y += puck.vy;
      puck.vx *= FRICTION;
      puck.vy *= FRICTION;

      const tx = TABLE_X, ty = TABLE_Y, tw = TABLE_W, th = TABLE_H;

      if (puck.y - puck.r < ty) {
        puck.y = ty + puck.r;
        puck.vy = Math.abs(puck.vy) * WALL_BOUNCE;
        sparkLine(puck.x - 20, ty, puck.x + 20, ty, '#00d4ff');
      }
      if (puck.y + puck.r > ty + th) {
        puck.y = ty + th - puck.r;
        puck.vy = -Math.abs(puck.vy) * WALL_BOUNCE;
        sparkLine(puck.x - 20, ty + th, puck.x + 20, ty + th, '#00d4ff');
      }
      if (puck.x - puck.r < tx) {
        if (puck.y > GOAL_Y1 && puck.y < GOAL_Y2) {
          goalScored('cpu');
          return;
        }
        puck.x = tx + puck.r;
        puck.vx = Math.abs(puck.vx) * WALL_BOUNCE;
        sparkLine(tx, puck.y - 20, tx, puck.y + 20, '#ff2d55');
      }
      if (puck.x + puck.r > tx + tw) {
        if (puck.y > GOAL_Y1 && puck.y < GOAL_Y2) {
          goalScored('p');
          return;
        }
        puck.x = tx + tw - puck.r;
        puck.vx = -Math.abs(puck.vx) * WALL_BOUNCE;
        sparkLine(tx + tw, puck.y - 20, tx + tw, puck.y + 20, '#ff2d55');
      }

      circleMalletCollide(puck, player, true);
      circleMalletCollide(puck, cpu, false);
    }

    function circleMalletCollide(pk: typeof puck, mallet: typeof player | typeof cpu, isPlayer: boolean) {
      const dx = pk.x - mallet.x, dy = pk.y - mallet.y;
      const dist = Math.hypot(dx, dy);
      const minDist = pk.r + mallet.r;
      if (dist >= minDist || dist < 0.01) return;

      if (!isPlayer && cpu.hitCool > 0) {
        const nx2 = dx / dist, ny2 = dy / dist;
        pk.x += nx2 * (minDist - dist);
        pk.y += ny2 * (minDist - dist);
        return;
      }

      const nx = dx / dist, ny = dy / dist;
      pk.x += nx * (minDist - dist);
      pk.y += ny * (minDist - dist);

      const mvx = isPlayer ? player.pvx * 1.8 : (mallet as typeof cpu).vx;
      const mvy = isPlayer ? player.pvy * 1.8 : (mallet as typeof cpu).vy;

      const relVX = pk.vx - mvx;
      const relVY = pk.vy - mvy;
      const dot = relVX * nx + relVY * ny;
      if (dot >= 0) return;

      const restitution = isPlayer ? 1.3 : 1.1;
      const impulse = -(1 + restitution) * dot;
      pk.vx += impulse * nx;
      pk.vy += impulse * ny;

      const spd = Math.hypot(pk.vx, pk.vy);
      const cap = (isPlayer ? 20 : 16) * puckSpeedMult;
      if (spd > cap) {
        pk.vx = (pk.vx / spd) * cap;
        pk.vy = (pk.vy / spd) * cap;
      }

      if (!isPlayer) cpu.hitCool = 20;

      const who: 'p' | 'cpu' = isPlayer ? 'p' : 'cpu';
      stats.rallyHits++;
      const mphSpd = Math.round(spd * 4);
      if (mphSpd > stats[who].topSpeed) stats[who].topSpeed = mphSpd;
      if (spd > 14) stats[who].powerHits++;
      updateStatDOM();

      if (spd > 3) {
        const col = isPlayer ? '#00d4ff' : '#ff2d55';
        burst(pk.x, pk.y, col, '#ffffff', Math.floor(spd * 1.5));
        if (spd > 19) shake(Math.min((spd - 19) * 0.4, 3));
      }
    }

    function updatePlayer(ts = 1) {
      const dx = rawMouseX - prevRawX;
      const dy = rawMouseY - prevRawY;
      mouseVX = mouseVX * 0.4 + dx * 0.6;
      mouseVY = mouseVY * 0.4 + dy * 0.6;
      prevRawX = rawMouseX;
      prevRawY = rawMouseY;

      if (ts === 1) {
        player.x = rawMouseX;
        player.y = rawMouseY;
      } else {
        player.x += (rawMouseX - player.x) * ts * 3;
        player.y += (rawMouseY - player.y) * ts * 3;
        player.x = clamp(player.x, TABLE_X + MALLET_R + 2, CX - 10);
        player.y = clamp(player.y, TABLE_Y + MALLET_R + 2, TABLE_Y + TABLE_H - MALLET_R - 2);
      }

      player.pvx = mouseVX * ts;
      player.pvy = mouseVY * ts;
    }

    // ══ RENDERING ══
    function grd(x: number, y: number, r0: number, r1: number, c0: string, c1: string) {
      const g = G.createRadialGradient(x, y, r0, x, y, r1);
      g.addColorStop(0, c0);
      g.addColorStop(1, c1);
      return g;
    }
    function lgrad(x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
      const g = G.createLinearGradient(x0, y0, x1, y1);
      stops.forEach(([tt, c]) => g.addColorStop(tt, c));
      return g;
    }

    function drawTable() {
      const tx = TABLE_X, ty = TABLE_Y, tw = TABLE_W, th = TABLE_H;

      G.save();
      G.shadowColor = 'rgba(0,180,255,0.2)';
      G.shadowBlur = 28;
      G.strokeStyle = 'rgba(0,180,255,0.25)';
      G.lineWidth = 3;
      G.beginPath();
      G.roundRect(tx - 4, ty - 4, tw + 8, th + 8, 14);
      G.stroke();
      G.restore();

      G.fillStyle = lgrad(tx, ty, tx, ty + th, [[0, '#0a1a2e'], [0.5, '#071422'], [1, '#0a1a2e']]);
      G.beginPath();
      G.roundRect(tx, ty, tw, th, 10);
      G.fill();

      G.save();
      G.globalAlpha = 0.055;
      G.fillStyle = '#4af';
      for (let gx = tx + 18; gx < tx + tw - 10; gx += 18) {
        for (let gy = ty + 18; gy < ty + th - 10; gy += 18) {
          G.beginPath();
          G.arc(gx, gy, 1.8, 0, Math.PI * 2);
          G.fill();
        }
      }
      G.restore();

      G.save();
      G.strokeStyle = 'rgba(0,212,255,0.16)';
      G.lineWidth = 2;
      G.setLineDash([6, 6]);
      G.beginPath();
      G.arc(CX, CY, 60, 0, Math.PI * 2);
      G.stroke();
      G.setLineDash([]);
      G.restore();

      G.save();
      G.strokeStyle = 'rgba(0,212,255,0.12)';
      G.lineWidth = 2;
      G.setLineDash([8, 8]);
      G.beginPath();
      G.moveTo(CX, ty + 2);
      G.lineTo(CX, ty + th - 2);
      G.stroke();
      G.setLineDash([]);
      G.restore();

      G.save();
      G.shadowColor = 'rgba(0,212,255,0.5)';
      G.shadowBlur = 8;
      G.fillStyle = 'rgba(0,212,255,0.4)';
      G.beginPath();
      G.arc(CX, CY, 5, 0, Math.PI * 2);
      G.fill();
      G.restore();

      const rt = lgrad(0, ty, 0, ty + 12, [[0, '#1a4a6e'], [0.6, '#0e2a40'], [1, '#0a1a2e']]);
      G.fillStyle = rt;
      G.fillRect(tx, ty, tw, 8);
      const rb = lgrad(0, ty + th - 8, 0, ty + th, [[0, '#0a1a2e'], [0.4, '#0e2a40'], [1, '#1a4a6e']]);
      G.fillStyle = rb;
      G.fillRect(tx, ty + th - 8, tw, 8);

      G.save();
      G.shadowColor = '#00d4ff';
      G.shadowBlur = 10;
      G.strokeStyle = 'rgba(0,212,255,0.7)';
      G.lineWidth = 2;
      G.beginPath();
      G.moveTo(tx + 2, ty + 2);
      G.lineTo(tx + tw - 2, ty + 2);
      G.stroke();
      G.beginPath();
      G.moveTo(tx + 2, ty + th - 2);
      G.lineTo(tx + tw - 2, ty + th - 2);
      G.stroke();
      G.restore();

      G.save();
      G.shadowColor = '#00d4ff';
      G.shadowBlur = 14;
      G.strokeStyle = 'rgba(0,212,255,0.7)';
      G.lineWidth = 2.5;
      G.beginPath();
      G.moveTo(tx, GOAL_Y1);
      G.lineTo(tx - GOAL_DEPTH, GOAL_Y1);
      G.stroke();
      G.beginPath();
      G.moveTo(tx, GOAL_Y2);
      G.lineTo(tx - GOAL_DEPTH, GOAL_Y2);
      G.stroke();
      G.strokeStyle = 'rgba(0,212,255,0.3)';
      G.lineWidth = 1.5;
      G.beginPath();
      G.moveTo(tx - GOAL_DEPTH, GOAL_Y1);
      G.lineTo(tx - GOAL_DEPTH, GOAL_Y2);
      G.stroke();
      G.restore();

      G.save();
      G.shadowColor = '#ff2d55';
      G.shadowBlur = 14;
      G.strokeStyle = 'rgba(255,45,85,0.7)';
      G.lineWidth = 2.5;
      G.beginPath();
      G.moveTo(tx + tw, GOAL_Y1);
      G.lineTo(tx + tw + GOAL_DEPTH, GOAL_Y1);
      G.stroke();
      G.beginPath();
      G.moveTo(tx + tw, GOAL_Y2);
      G.lineTo(tx + tw + GOAL_DEPTH, GOAL_Y2);
      G.stroke();
      G.strokeStyle = 'rgba(255,45,85,0.3)';
      G.lineWidth = 1.5;
      G.beginPath();
      G.moveTo(tx + tw + GOAL_DEPTH, GOAL_Y1);
      G.lineTo(tx + tw + GOAL_DEPTH, GOAL_Y2);
      G.stroke();
      G.restore();

      [GOAL_Y1, GOAL_Y2].forEach((gy) => {
        G.save();
        G.shadowColor = '#00d4ff';
        G.shadowBlur = 12;
        G.fillStyle = '#00d4ff';
        G.beginPath();
        G.arc(tx, gy, 5, 0, Math.PI * 2);
        G.fill();
        G.restore();
        G.save();
        G.shadowColor = '#ff2d55';
        G.shadowBlur = 12;
        G.fillStyle = '#ff2d55';
        G.beginPath();
        G.arc(tx + tw, gy, 5, 0, Math.PI * 2);
        G.fill();
        G.restore();
      });
    }

    function drawPuck() {
      trail.forEach((tp, i) => {
        const prog = i / trail.length;
        const r = prog * 9 * Math.min(tp.spd / 6, 1);
        if (r < 0.5) return;
        G.save();
        G.globalAlpha = prog * 0.55 * Math.min(tp.spd / 5, 1);
        G.fillStyle = grd(tp.x, tp.y, 0, r * 2, 'rgba(0,212,255,0.9)', 'transparent');
        G.beginPath();
        G.arc(tp.x, tp.y, r * 2.2, 0, Math.PI * 2);
        G.fill();
        G.restore();
      });

      const bx = puck.x, by = puck.y, br = puck.r;
      const spd = Math.hypot(puck.vx, puck.vy);

      G.save();
      G.shadowColor = '#00d4ff';
      G.shadowBlur = 24 + spd * 1.5;
      G.fillStyle = grd(bx, by, 0, br + 8, 'rgba(0,212,255,0.18)', 'transparent');
      G.beginPath();
      G.arc(bx, by, br + 14, 0, Math.PI * 2);
      G.fill();
      G.restore();

      G.fillStyle = grd(bx - br * 0.3, by - br * 0.3, br * 0.1, br, '#ffffff', '#cccccc');
      G.beginPath();
      G.arc(bx, by, br, 0, Math.PI * 2);
      G.fill();

      G.save();
      G.shadowColor = '#00d4ff';
      G.shadowBlur = 8;
      G.strokeStyle = '#00d4ff';
      G.lineWidth = 2.5;
      G.beginPath();
      G.arc(bx, by, br - 1, 0, Math.PI * 2);
      G.stroke();
      G.restore();

      G.strokeStyle = 'rgba(0,212,255,0.32)';
      G.lineWidth = 1;
      G.beginPath();
      G.arc(bx, by, br * 0.55, 0, Math.PI * 2);
      G.stroke();

      G.fillStyle = 'rgba(255,255,255,0.17)';
      G.beginPath();
      G.ellipse(bx - br * 0.28, by - br * 0.3, br * 0.38, br * 0.22, -0.4, 0, Math.PI * 2);
      G.fill();
    }

    function lighten(hex: string, amt: number) {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgb(${clamp((r + amt * 255) | 0, 0, 255)},${clamp((g + amt * 255) | 0, 0, 255)},${clamp((b + amt * 255) | 0, 0, 255)})`;
    }
    function darken(hex: string, amt: number) {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgb(${Math.max(0, (r - amt * 255) | 0)},${Math.max(0, (g - amt * 255) | 0)},${Math.max(0, (b - amt * 255) | 0)})`;
    }

    function drawMallet(m: { x: number; y: number; r: number }, col: string, glowCol: string) {
      const mx = m.x, my = m.y, mr = m.r;

      G.save();
      G.shadowColor = glowCol;
      G.shadowBlur = 32;
      const halo = G.createRadialGradient(mx, my, mr * 0.6, mx, my, mr + 18);
      halo.addColorStop(0, 'transparent');
      halo.addColorStop(0.6, `${glowCol}22`);
      halo.addColorStop(1, 'transparent');
      G.fillStyle = halo;
      G.beginPath();
      G.arc(mx, my, mr + 18, 0, Math.PI * 2);
      G.fill();
      G.restore();

      G.save();
      G.globalAlpha = 0.45;
      G.fillStyle = 'rgba(0,0,0,0.7)';
      G.beginPath();
      G.ellipse(mx + 3, my + 4, mr, mr * 0.85, 0, 0, Math.PI * 2);
      G.fill();
      G.restore();

      const skirtG = G.createRadialGradient(mx - mr * 0.2, my - mr * 0.2, mr * 0.1, mx, my, mr);
      skirtG.addColorStop(0, lighten(col, 0.12));
      skirtG.addColorStop(0.65, col);
      skirtG.addColorStop(1, darken(col, 0.45));
      G.fillStyle = skirtG;
      G.beginPath();
      G.arc(mx, my, mr, 0, Math.PI * 2);
      G.fill();

      G.save();
      G.shadowColor = glowCol;
      G.shadowBlur = 12;
      G.strokeStyle = glowCol;
      G.lineWidth = 2.5;
      G.beginPath();
      G.arc(mx, my, mr - 1.5, 0, Math.PI * 2);
      G.stroke();
      G.restore();

      const grooveR = mr * 0.72;
      G.strokeStyle = 'rgba(0,0,0,0.55)';
      G.lineWidth = 3;
      G.beginPath();
      G.arc(mx, my, grooveR, 0, Math.PI * 2);
      G.stroke();
      G.strokeStyle = 'rgba(255,255,255,0.08)';
      G.lineWidth = 1;
      G.beginPath();
      G.arc(mx, my, grooveR + 1.5, 0, Math.PI * 2);
      G.stroke();

      const domeR = mr * 0.62;
      const domeG = G.createRadialGradient(mx - domeR * 0.3, my - domeR * 0.35, 0, mx, my, domeR);
      domeG.addColorStop(0, lighten(col, 0.35));
      domeG.addColorStop(0.5, lighten(col, 0.1));
      domeG.addColorStop(1, darken(col, 0.2));
      G.fillStyle = domeG;
      G.beginPath();
      G.arc(mx, my, domeR, 0, Math.PI * 2);
      G.fill();

      G.save();
      G.shadowColor = glowCol;
      G.shadowBlur = 14;
      G.fillStyle = glowCol;
      G.beginPath();
      G.arc(mx, my, 4.5, 0, Math.PI * 2);
      G.fill();
      G.restore();

      G.fillStyle = 'rgba(255,255,255,0.28)';
      G.beginPath();
      G.ellipse(mx - domeR * 0.3, my - domeR * 0.32, domeR * 0.32, domeR * 0.18, -0.5, 0, Math.PI * 2);
      G.fill();

      G.fillStyle = 'rgba(255,255,255,0.12)';
      G.beginPath();
      G.ellipse(mx - domeR * 0.15, my - domeR * 0.5, domeR * 0.14, domeR * 0.08, -0.3, 0, Math.PI * 2);
      G.fill();
    }

    function drawParticles() {
      particles.forEach((p) => {
        G.save();
        G.globalAlpha = Math.pow(p.life, 1.4) * 0.9;
        if (p.glow) {
          G.shadowColor = p.col;
          G.shadowBlur = 10;
        }
        G.fillStyle = p.col;
        G.beginPath();
        G.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        G.fill();
        G.restore();
      });
    }
    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.96;
        p.life -= 0.028;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    function drawGoalFlash() {
      if (goalFlash <= 0 || state !== 'goal') return;
      const prog = goalFlash / 160, isP = goalWho === 'p';
      G.save();
      G.globalAlpha = Math.min(prog * 3, 0.16);
      G.fillStyle = isP ? '#00d4ff' : '#ff2d55';
      G.fillRect(0, 0, W, H);
      G.restore();

      goalMsgScale = Math.min(goalMsgScale + 0.12, 1);
      const ease = 1 - Math.pow(1 - goalMsgScale, 3);
      G.save();
      G.globalAlpha = Math.min(1, prog * 3) * Math.min(1, goalFlash / 40);
      G.translate(W / 2, H / 2);
      G.scale(ease, ease);
      G.textAlign = 'center';
      G.font = `900 64px ${AH_ORBITRON}`;
      G.fillStyle = isP ? '#00d4ff' : '#ff2d55';
      G.shadowColor = isP ? '#00d4ff' : '#ff2d55';
      G.shadowBlur = 40;
      G.fillText('GOAL!', 0, -10);
      G.shadowBlur = 0;
      G.font = `500 13px ${AH_RAJDHANI}`;
      G.letterSpacing = '6px';
      G.fillStyle = isP ? 'rgba(0,212,255,0.75)' : 'rgba(255,45,85,0.75)';
      G.fillText(isP ? 'YOU SCORE' : 'CPU SCORES', 0, 22);
      G.restore();
      goalFlash--;
    }

    function updatePuckScaled(ts: number) {
      if (ts !== 1) {
        puck.vx *= ts;
        puck.vy *= ts;
      }
      updatePuck();
      if (ts !== 1 && state === 'play') {
        puck.vx /= ts;
        puck.vy /= ts;
      }
    }

    function drawSadFace() {
      const cx = W / 2, cy = H / 2 - 30;
      const r = 52;
      const pulse = 0.85 + Math.sin(tick * 0.05) * 0.15;
      G.save();
      G.globalAlpha = 0.82 * pulse;

      G.fillStyle = '#1a0a0a';
      G.beginPath();
      G.arc(cx, cy, r, 0, Math.PI * 2);
      G.fill();
      G.strokeStyle = '#ff2d55';
      G.lineWidth = 3;
      G.shadowColor = '#ff2d55';
      G.shadowBlur = 18;
      G.beginPath();
      G.arc(cx, cy, r, 0, Math.PI * 2);
      G.stroke();
      G.shadowBlur = 0;

      G.strokeStyle = '#ff2d55';
      G.lineWidth = 3.5;
      G.lineCap = 'round';
      ([[-18, -12], [18, -12]] as const).forEach(([ex, ey]) => {
        G.beginPath();
        G.moveTo(cx + ex - 7, cy + ey - 7);
        G.lineTo(cx + ex + 7, cy + ey + 7);
        G.stroke();
        G.beginPath();
        G.moveTo(cx + ex + 7, cy + ey - 7);
        G.lineTo(cx + ex - 7, cy + ey + 7);
        G.stroke();
      });

      G.strokeStyle = '#ff2d55';
      G.lineWidth = 3.5;
      G.beginPath();
      G.arc(cx, cy + 28, 20, Math.PI * 0.15, Math.PI * 0.85, false);
      G.stroke();

      G.restore();
    }

    function drawSpeedUpMsg() {
      if (speedUpTimer <= 0) return;
      const tt = speedUpTimer / 130;
      const scale = tt > 0.85 ? 0.5 + (1 - (tt - 0.85) / 0.15) * 0.5 : 1;
      const alpha = tt < 0.2 ? tt / 0.2 : 1;
      G.save();
      G.globalAlpha = alpha;
      G.translate(W / 2, H / 2 - 60);
      G.scale(scale, scale);
      G.textAlign = 'center';
      G.font = `900 34px ${AH_ORBITRON}`;
      G.fillStyle = '#000';
      G.fillText(speedUpMsg, 2, 2);
      const g2 = G.createLinearGradient(-100, -30, 100, 10);
      g2.addColorStop(0, '#ffc940');
      g2.addColorStop(1, '#ff6820');
      G.fillStyle = g2;
      G.shadowColor = '#ffc940';
      G.shadowBlur = 24;
      G.fillText(speedUpMsg, 0, 0);
      G.restore();
      speedUpTimer--;
    }

    // ── Main Loop ──
    let visible = true;
    let rafId = 0;

    function loop() {
      tick++;
      G.clearRect(0, 0, W, H);
      G.fillStyle = '#04060a';
      G.fillRect(0, 0, W, H);

      if (sloMo) sloMoAlpha = Math.min(sloMoAlpha + 0.055, 1);
      else sloMoAlpha = Math.max(sloMoAlpha - 0.07, 0);
      if (sloMoIntro > 0) sloMoIntro--;
      if (sloMoLabelTimer > 0) sloMoLabelTimer--;

      const timeScale = sloMo ? 0.55 : 1;

      if (shakeAmt > 0.3) {
        shakeX = (Math.random() - 0.5) * shakeAmt * 2;
        shakeY = (Math.random() - 0.5) * shakeAmt * 2;
        shakeAmt *= 0.72;
      } else {
        shakeX = 0;
        shakeY = 0;
        shakeAmt = 0;
      }

      G.save();
      G.translate(shakeX, shakeY);

      drawTable();

      if (state === 'play' || state === 'goal') {
        updatePlayer(timeScale);
        updateCPU(timeScale);
        updatePuckScaled(timeScale);
        updateParticles();
      }
      updateConfetti();

      drawParticles();
      drawPuck();
      drawMallet(cpu, '#2a0a0a', '#ff2d55');
      drawMallet(player, '#0a1a2a', '#00d4ff');
      drawGoalFlash();
      drawSpeedUpMsg();
      drawConfetti();
      if (showSadFace) drawSadFace();

      if (sloMoAlpha > 0) {
        const vig = G.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.75);
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, `rgba(0,0,0,${0.65 * sloMoAlpha})`);
        G.fillStyle = vig;
        G.fillRect(0, 0, W, H);

        const barH = 32 * sloMoAlpha;
        G.fillStyle = `rgba(0,0,0,${0.88 * sloMoAlpha})`;
        G.fillRect(0, 0, W, barH);
        G.fillRect(0, H - barH, W, barH);

        G.save();
        G.globalAlpha = 0.15 * sloMoAlpha;
        G.fillStyle = '#ff0040';
        G.fillRect(0, 0, 5, H);
        G.fillRect(W - 5, 0, 5, H);
        G.fillStyle = '#0080ff';
        G.fillRect(5, 0, 5, H);
        G.fillRect(W - 10, 0, 5, H);
        G.restore();

        if (sloMoLabelTimer > 0) {
          const fadeIn = Math.min(sloMoLabelTimer / 20, 1);
          const fadeOut = sloMoLabelTimer < 30 ? sloMoLabelTimer / 30 : 1;
          const alpha = fadeIn * fadeOut * sloMoAlpha;
          const pulse = 0.88 + Math.sin(tick * 0.12) * 0.12;

          G.save();
          G.globalAlpha = alpha * pulse;
          G.textAlign = 'center';
          G.font = `900 16px ${AH_ORBITRON}`;
          G.fillStyle = 'rgba(0,0,0,0.5)';
          G.fillText('⚡  GAME POINT  ⚡', W / 2 + 1, barH * 0.72 + 1);
          G.fillStyle = '#ffc940';
          G.shadowColor = '#ffc940';
          G.shadowBlur = 14;
          G.fillText('⚡  GAME POINT  ⚡', W / 2, barH * 0.72);
          G.shadowBlur = 0;
          G.restore();
        }
      }

      G.restore();
      if (visible) rafId = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (isVisible && !visible) rafId = requestAnimationFrame(loop);
        visible = isVisible;
      },
      { threshold: 0.01 },
    );
    io.observe(root);

    btnAgain.onclick = startGame;

    loop();
    startGame();

    return () => {
      io.disconnect();
      cancelAnimationFrame(rafId);
      if (confettiInterval) clearInterval(confettiInterval);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousemove', onDocMouseMove);
      CV.removeEventListener('mousemove', onCanvasMouseMove);
      CV.removeEventListener('touchmove', onTouchMove);
      CV.removeEventListener('touchstart', onTouchStart);
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, []);

  return (
    <div ref={rootRef} className="ah-air-hockey">
      <style dangerouslySetInnerHTML={{ __html: AH_CSS }} />
      <div id="ah-game-wrap">
        <div id="ah-outer">
          <div id="ah-stat-left" className="ah-stat-panel">
            <div className="ah-stat-name" style={{ color: '#00d4ff' }}>YOU</div>
            <div ref={scorePRef} className="ah-stat-score" style={{ color: '#00d4ff', textShadow: '0 0 20px #00d4ff' }}>0</div>
            <div className="ah-stat-divider" />
            <div className="ah-stat-row"><span className="ah-stat-label">STREAK</span><span ref={pStreakRef} className="ah-stat-val">0</span></div>
            <div className="ah-stat-row"><span className="ah-stat-label">TOP SPEED</span><span ref={pSpeedRef} className="ah-stat-val">0</span></div>
            <div className="ah-stat-row"><span className="ah-stat-label">POWER HITS</span><span ref={pPowerRef} className="ah-stat-val">0</span></div>
            <div className="ah-stat-divider" />
            <div className="ah-stat-footer">FIRST TO 3 WINS</div>
          </div>

          <div id="ah-arena">
            <canvas ref={canvasRef} />
            <div ref={muteBtnRef} id="ah-mute-btn" />
            <div id="ah-ui" />
            <div ref={gameoverRef} id="ah-gameover-screen" className="ah-screen">
              <div className="ah-go-inner">
                <div ref={goFaceRef} className="ah-go-face">😄</div>
                <div ref={goWhoRef} className="ah-go-who">YOU WIN</div>
                <div ref={goWinsRef} className="ah-go-wins">GAME · SET · MATCH</div>
                <div ref={goFinalRef} className="ah-go-final">3 – 1</div>
                <button ref={btnAgainRef} type="button">PLAY AGAIN</button>
              </div>
            </div>
          </div>

          <div id="ah-stat-right" className="ah-stat-panel">
            <div className="ah-stat-name" style={{ color: '#ff2d55' }}>CPU</div>
            <div ref={scoreCpuRef} className="ah-stat-score" style={{ color: '#ff2d55', textShadow: '0 0 20px #ff2d55' }}>0</div>
            <div className="ah-stat-divider" />
            <div className="ah-stat-row"><span className="ah-stat-label">STREAK</span><span ref={cpuStreakRef} className="ah-stat-val">0</span></div>
            <div className="ah-stat-row"><span className="ah-stat-label">TOP SPEED</span><span ref={cpuSpeedRef} className="ah-stat-val">0</span></div>
            <div className="ah-stat-row"><span className="ah-stat-label">POWER HITS</span><span ref={cpuPowerRef} className="ah-stat-val">0</span></div>
            <div className="ah-stat-divider" />
            <div className="ah-stat-footer">FIRST TO 3 WINS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
