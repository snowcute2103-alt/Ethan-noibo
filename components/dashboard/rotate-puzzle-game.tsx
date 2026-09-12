'use client';

import { useEffect, useRef } from 'react';
import { ROTATE_PUZZLE_LEVELS } from '@/components/dashboard/rotate-puzzle-levels';

/** CSS gốc của game "Rotate" (David DeSandro) được scope dưới `.rpg-rotate-puzzle` — bản gốc set thẳng lên
 *  `body`/`canvas`/`.level-list` toàn trang (game gốc chiếm nguyên viewport), nhúng nguyên văn sẽ phá layout
 *  trang Văn hoá. Vị trí các lớp phủ (level list, nút Next level) được quy về khung `.rpg-stage` thay vì
 *  toàn trang; màu sắc/hiệu ứng giữ nguyên bản gốc. */
const RP_CSS = `
.rpg-rotate-puzzle, .rpg-rotate-puzzle * {
  box-sizing: border-box;
}
.rpg-rotate-puzzle {
  position: relative;
  width: 100%;
  max-width: 1160px;
  margin: 0;
  font-family: inherit;
  user-select: none;
}
.rpg-rotate-puzzle::before {
  content: '';
  position: absolute;
  inset: -60px;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 26% 20%, rgba(56, 189, 248, 0.22), transparent 60%),
    radial-gradient(circle at 82% 82%, rgba(236, 72, 153, 0.16), transparent 60%);
  filter: blur(40px);
}
.rpg-content {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: 100%;
}
.rpg-main-col {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.rpg-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(160deg, #ffffff, #eef1f6);
  border-radius: 24px;
  overflow: hidden;
  touch-action: none;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.7) inset,
    0 30px 70px rgba(0, 0, 0, 0.45),
    0 0 50px rgba(56, 189, 248, 0.2);
}
@keyframes rpg-stage-glow {
  0%, 100% { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7) inset, 0 30px 70px rgba(0, 0, 0, 0.45), 0 0 40px rgba(56, 189, 248, 0.16); }
  50% { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7) inset, 0 30px 70px rgba(0, 0, 0, 0.45), 0 0 70px rgba(56, 189, 248, 0.32); }
}
@media (prefers-reduced-motion: no-preference) {
  .rpg-stage {
    animation: rpg-stage-glow 4.5s ease-in-out infinite;
  }
}
@media (max-width: 640px) {
  .rpg-content {
    flex-direction: column;
  }
}
.rpg-stage canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  cursor: move;
}
.rpg-rotate-puzzle.is-cub-hovered .rpg-stage canvas {
  cursor: -webkit-grab;
  cursor: grab;
}
.rpg-rotate-puzzle.is-cub-dragging .rpg-stage canvas {
  cursor: -webkit-grabbing;
  cursor: grabbing;
}
.rpg-instruction {
  margin: 0;
  padding: 14px 10px 0;
  min-height: 1.4em;
  text-align: center;
  letter-spacing: 0.01em;
  color: rgba(255, 255, 255, 0.8);
  opacity: 1;
  transition: opacity 0.18s ease;
}
@media (prefers-reduced-motion: reduce) {
  .rpg-instruction {
    transition: none;
  }
}
.rpg-next-level-button {
  font-family: inherit;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.02em;
  border: none;
  cursor: pointer;
  position: absolute;
  left: 50%;
  bottom: 14px;
  width: 180px;
  max-width: 70%;
  height: 56px;
  background: linear-gradient(135deg, #22d3ee, #2563eb);
  color: #fff;
  border-radius: 999px;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.45);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 0) scale(0.5);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, box-shadow 0.2s ease;
  z-index: 2;
}
.rpg-next-level-button:hover {
  background: linear-gradient(135deg, #38bdf8, #3b82f6);
  box-shadow: 0 16px 36px rgba(37, 99, 235, 0.55);
}
.rpg-next-level-button.is-open {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0) scale(1);
}
.rpg-level-list {
  flex: 0 0 540px;
  max-width: 540px;
  background: linear-gradient(160deg, #f8fafc, #e7eaf1);
  margin: 0;
  list-style: none;
  padding: 10px;
  border-radius: 24px;
  overflow-y: auto;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7) inset, 0 20px 50px rgba(0, 0, 0, 0.35);
}
@media (max-width: 640px) {
  .rpg-level-list {
    flex-basis: auto;
    max-width: none;
    max-height: 240px;
  }
}
.rpg-level-list__item {
  display: inline-block;
  background: #fff;
  margin: 4px;
  padding: 6px;
  width: 64px;
  height: 64px;
  text-align: center;
  border-radius: 14px;
  position: relative;
  color: #555;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out, background 0.15s ease-out, color 0.15s ease-out;
}
.rpg-level-list__item:hover {
  color: #0ea5e9;
  cursor: pointer;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.14);
}
.rpg-level-list__item.is-playing {
  background: linear-gradient(135deg, #22d3ee, #2563eb);
  color: #fff;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.5);
}
.rpg-level-list__item__number {
  display: block;
  font-size: 20px;
  line-height: 22px;
}
.rpg-level-list__item__blurb {
  display: block;
  font-size: 11px;
}
.rpg-level-list__item__stars {
  color: #eab308;
}
.rpg-level-list__item.is-playing .rpg-level-list__item__stars {
  color: #fff;
}
.rpg-level-list__item__check {
  position: absolute;
  right: -6px;
  top: -6px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 10px;
  color: #fff;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.5);
}
.rpg-level-list__item.did-complete .rpg-level-list__item__check {
  display: flex;
}
@keyframes rpg-check-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: no-preference) {
  .rpg-level-list__item.did-complete .rpg-level-list__item__check {
    animation: rpg-check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}
`;

const TAU = Math.PI * 2;

interface Point {
  x: number;
  y: number;
}
type Orientation = 'noon' | 'three' | 'six' | 'nine';
interface OrientedLine {
  a: Point;
  b: Point;
}
interface MazeSegment {
  a: Point;
  b: Point;
  noon: OrientedLine;
  three: OrientedLine;
  six: OrientedLine;
  nine: OrientedLine;
  render(ctx: CanvasRenderingContext2D, center: Point, gridSize: number, mazeAngle: number): void;
}
interface PointerLike {
  clientX: number;
  clientY: number;
  identifier?: number;
}

function normalizeAngle(angle: number) {
  return ((angle % TAU) + TAU) % TAU;
}

// ── Segments ──

class FreeSegment implements MazeSegment {
  a: Point;
  b: Point;
  noon: OrientedLine;
  three: OrientedLine;
  six: OrientedLine;
  nine: OrientedLine;
  constructor(a: Point, b: Point) {
    this.a = a;
    this.b = b;
    this.noon = { a, b };
    this.three = { a: { x: -a.y, y: a.x }, b: { x: -b.y, y: b.x } };
    this.six = { a: { x: -a.x, y: -a.y }, b: { x: -b.x, y: -b.y } };
    this.nine = { a: { x: a.y, y: -a.x }, b: { x: b.y, y: -b.x } };
  }
  render(ctx: CanvasRenderingContext2D, _center: Point, gridSize: number) {
    ctx.strokeStyle = 'hsla(200, 80%, 50%, 0.7)';
    ctx.lineWidth = gridSize * 0.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.a.x * gridSize, this.a.y * gridSize);
    ctx.lineTo(this.b.x * gridSize, this.b.y * gridSize);
    ctx.stroke();
    ctx.closePath();
  }
}

class FixedSegment implements MazeSegment {
  a: Point;
  b: Point;
  noon: OrientedLine;
  three: OrientedLine;
  six: OrientedLine;
  nine: OrientedLine;
  constructor(a: Point, b: Point) {
    this.a = a;
    this.b = b;
    this.noon = { a, b };
    this.three = { a, b };
    this.six = { a, b };
    this.nine = { a, b };
  }
  render(ctx: CanvasRenderingContext2D, _center: Point, gridSize: number) {
    ctx.strokeStyle = 'hsla(30, 100%, 40%, 0.6)';
    ctx.lineWidth = gridSize * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.a.x * gridSize, this.a.y * gridSize);
    ctx.lineTo(this.b.x * gridSize, this.b.y * gridSize);
    ctx.stroke();
    ctx.closePath();
  }
}

class PivotSegment implements MazeSegment {
  a: Point;
  b: Point;
  delta: Point;
  noon: OrientedLine;
  three: OrientedLine;
  six: OrientedLine;
  nine: OrientedLine;
  constructor(a: Point, b: Point) {
    this.a = a;
    this.b = b;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    this.delta = { x: dx, y: dy };
    this.noon = { a, b };
    this.three = { a: { x: -a.y, y: a.x }, b: { x: -a.y + dx, y: a.x + dy } };
    this.six = { a: { x: -a.x, y: -a.y }, b: { x: -a.x + dx, y: -a.y + dy } };
    this.nine = { a: { x: a.y, y: -a.x }, b: { x: a.y + dx, y: -a.x + dy } };
  }
  render(ctx: CanvasRenderingContext2D, _center: Point, gridSize: number, mazeAngle: number) {
    ctx.save();
    ctx.translate(this.a.x * gridSize, this.a.y * gridSize);
    ctx.rotate(-mazeAngle);
    const color = 'hsla(150, 100%, 35%, 0.7)';
    ctx.strokeStyle = color;
    ctx.lineWidth = gridSize * 0.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.delta.x * gridSize, this.delta.y * gridSize);
    ctx.stroke();
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, gridSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }
}

class RotateSegment implements MazeSegment {
  a: Point;
  b: Point;
  delta: Point;
  theta: number;
  noon: OrientedLine;
  three: OrientedLine;
  six: OrientedLine;
  nine: OrientedLine;
  constructor(a: Point, b: Point) {
    this.a = a;
    this.b = b;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    this.delta = { x: dx, y: dy };
    this.theta = Math.atan2(dy, dx);
    this.noon = { a, b };
    this.three = { a, b: this.getB(TAU / 4) };
    this.six = { a, b: this.getB(TAU / 2) };
    this.nine = { a, b: this.getB((TAU * 3) / 4) };
  }
  getB(angle: number): Point {
    return {
      x: Math.round(this.a.x + Math.cos(this.theta + angle) * 2),
      y: Math.round(this.a.y + Math.sin(this.theta + angle) * 2),
    };
  }
  render(ctx: CanvasRenderingContext2D, _center: Point, gridSize: number, mazeAngle: number) {
    ctx.save();
    ctx.translate(this.a.x * gridSize, this.a.y * gridSize);
    ctx.rotate(mazeAngle);
    const color = 'hsla(0, 100%, 50%, 0.6)';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = gridSize * 0.8;
    ctx.lineJoin = 'round';
    ctx.rotate(TAU / 8);
    ctx.strokeRect(-gridSize * 0.2, -gridSize * 0.2, gridSize * 0.4, gridSize * 0.4);
    ctx.rotate(-TAU / 8);
    ctx.lineWidth = gridSize * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.delta.x * gridSize, this.delta.y * gridSize);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}

// ── Rotational physics (fly wheel) ──

class FlyWheel {
  angle = 0;
  velocity = 0;
  friction: number;
  constructor(props: { friction: number }) {
    this.friction = props.friction;
  }
  integrate() {
    this.velocity *= this.friction;
    this.angle += this.velocity;
    this.normalizeAngle();
  }
  applyForce(force: number) {
    this.velocity += force;
  }
  normalizeAngle() {
    this.angle = normalizeAngle(this.angle);
  }
  setAngle(theta: number) {
    let velo = theta - this.angle;
    if (velo > TAU / 2) velo -= TAU;
    else if (velo < -TAU / 2) velo += TAU;
    this.applyForce(velo - this.velocity);
  }
}

// ── Cub (nhân vật điều khiển) ──

interface Cub {
  offset: Point;
  peg: Point;
  noon: Point;
  three: Point;
  six: Point;
  nine: Point;
  /** Avatar user đang đăng nhập — null cho tới khi ảnh tải xong (hoặc user chưa có avatar), lúc đó
   *  render() vẫn dùng hình gấu hồng mặc định thay vì chờ/báo lỗi. */
  avatarImage: HTMLImageElement | null;
  setPeg(peg: Point, orientation: Orientation): void;
  setOffset(offset: Point, orientation: Orientation): void;
  render(ctx: CanvasRenderingContext2D, mazeCenter: Point, gridSize: number, angle: number, isHovered: boolean): void;
}

function createCub(): Cub {
  const pegOrienter: Record<Orientation, (peg: Point) => Point> = {
    noon: (peg) => peg,
    three: (peg) => ({ x: peg.y, y: -peg.x }),
    six: (peg) => ({ x: -peg.x, y: -peg.y }),
    nine: (peg) => ({ x: -peg.y, y: peg.x }),
  };
  const offsetOrienter: Record<Orientation, (offset: Point) => Point> = {
    noon: (offset) => offset,
    three: (offset) => ({ x: offset.y, y: -offset.x }),
    six: (offset) => ({ x: -offset.x, y: -offset.y }),
    nine: (offset) => ({ x: -offset.y, y: offset.x }),
  };

  const cub: Cub = {
    offset: { x: 0, y: 0 },
    peg: { x: 0, y: 0 },
    noon: { x: 0, y: 0 },
    three: { x: 0, y: 0 },
    six: { x: 0, y: 0 },
    nine: { x: 0, y: 0 },
    avatarImage: null,
    setPeg(peg, orientation) {
      const p = pegOrienter[orientation](peg);
      cub.peg = p;
      cub.noon = { x: p.x, y: p.y };
      cub.three = { x: -p.y, y: p.x };
      cub.six = { x: -p.x, y: -p.y };
      cub.nine = { x: p.y, y: -p.x };
    },
    setOffset(offset, orientation) {
      cub.offset = offsetOrienter[orientation](offset);
    },
    render(ctx, mazeCenter, gridSize, angle, isHovered) {
      function circle(x: number, y: number, radius: number) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      }
      const x = cub.peg.x * gridSize + cub.offset.x;
      const y = cub.peg.y * gridSize + cub.offset.y;
      ctx.save();
      ctx.translate(mazeCenter.x, mazeCenter.y);
      ctx.rotate(angle);
      ctx.translate(x, y);
      ctx.rotate(-angle);
      ctx.fillStyle = 'hsla(330, 100%, 40%, 1)';
      const scale = isHovered ? 1.15 : 1;
      ctx.scale(scale, scale);
      // Tai vẽ trước, khi có avatar ảnh chỉ clip trong vòng tròn thân nên 2 tai vẫn ló ra 2 bên.
      circle(gridSize * -0.45, gridSize * -0.35, gridSize * 0.3);
      circle(gridSize * 0.45, gridSize * -0.35, gridSize * 0.3);
      if (cub.avatarImage) {
        const radius = gridSize * 0.6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(cub.avatarImage, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();
        ctx.strokeStyle = 'hsla(330, 100%, 40%, 1)';
        ctx.lineWidth = gridSize * 0.08;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        circle(0, 0, gridSize * 0.6);
      }
      ctx.restore();
    },
  };
  return cub;
}

// ── Maze ──

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}
function strokeCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.closePath();
}
function renderGoal(ctx: CanvasRenderingContext2D, x: number, y: number, mazeAngle: number, radiusA: number, radiusB: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-mazeAngle);
  ctx.beginPath();
  for (let i = 0; i < 11; i++) {
    const theta = (Math.PI * 2 * i) / 10 + Math.PI / 2;
    const radius = i % 2 ? radiusA : radiusB;
    const dx = Math.cos(theta) * radius;
    const dy = Math.sin(theta) * radius;
    if (i) ctx.lineTo(dx, dy);
    else ctx.moveTo(dx, dy);
  }
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

class Maze {
  id = '';
  freeSegments: MazeSegment[] = [];
  fixedSegments: MazeSegment[] = [];
  pivotSegments: MazeSegment[] = [];
  rotateSegments: MazeSegment[] = [];
  flyWheel = new FlyWheel({ friction: 0.8 });
  connections: Record<string, MazeSegment[]> = {};
  gridCount = 0;
  gridMax = 0;
  startPosition: Point = { x: 0, y: 0 };
  goalPosition: Point = { x: 0, y: 0 };
  orientation: Orientation = 'noon';
  private cub: Cub;
  private parsers: Record<string, (pegX: number, pegY: number) => void>;

  constructor(cub: Cub) {
    this.cub = cub;
    this.parsers = {
      '-': (x, y) => this.addFreeHorizSegment(x, y),
      '|': (x, y) => this.addFreeVertSegment(x, y),
      '=': (x, y) => this.addFixedHorizSegment(x, y),
      '!': (x, y) => this.addFixedVertSegment(x, y),
      '^': (x, y) => this.addPivotUpSegment(x, y),
      v: (x, y) => this.addPivotDownSegment(x, y),
      '<': (x, y) => this.addPivotLeftSegment(x, y),
      '>': (x, y) => this.addPivotRightSegment(x, y),
      '8': (x, y) => this.addRotateSegment({ x, y: y + 1 }, { x, y: y - 1 }),
      '5': (x, y) => this.addRotateSegment({ x, y: y - 1 }, { x, y: y + 1 }),
      '4': (x, y) => this.addRotateSegment({ x: x + 1, y }, { x: x - 1, y }),
      '6': (x, y) => this.addRotateSegment({ x: x - 1, y }, { x: x + 1, y }),
      '#': (x, y) => {
        this.addFreeHorizSegment(x, y);
        this.addFixedHorizSegment(x, y);
      },
      $: (x, y) => {
        this.addFreeVertSegment(x, y);
        this.addFixedVertSegment(x, y);
      },
      I: (x, y) => {
        this.addPivotUpSegment(x, y);
        this.addFixedVertSegment(x, y);
      },
      J: (x, y) => {
        this.addPivotLeftSegment(x, y);
        this.addFixedHorizSegment(x, y);
      },
      K: (x, y) => {
        this.addPivotDownSegment(x, y);
        this.addFixedVertSegment(x, y);
      },
      L: (x, y) => {
        this.addPivotRightSegment(x, y);
        this.addFixedHorizSegment(x, y);
      },
      W: (x, y) => {
        this.addPivotUpSegment(x, y);
        this.addFreeVertSegment(x, y);
      },
      A: (x, y) => {
        this.addPivotLeftSegment(x, y);
        this.addFreeHorizSegment(x, y);
      },
      S: (x, y) => {
        this.addPivotDownSegment(x, y);
        this.addFreeVertSegment(x, y);
      },
      D: (x, y) => {
        this.addPivotRightSegment(x, y);
        this.addFreeHorizSegment(x, y);
      },
      '@': (x, y) => {
        this.startPosition = { x, y };
        this.cub.setPeg(this.startPosition, 'noon');
      },
      '*': (x, y) => {
        this.goalPosition = { x, y };
      },
    };
  }

  loadText(mazeSrc: string) {
    const lines = mazeSrc.split('\n');
    const gridCount = (this.gridCount = lines[0].length);
    const gridMax = (this.gridMax = (gridCount - 1) / 2);

    for (let i = 0; i < lines.length; i++) {
      const chars = lines[i].split('');
      for (let j = 0; j < chars.length; j++) {
        const pegX = j - gridMax;
        const pegY = i - gridMax;
        this.parsers[chars[j]]?.(pegX, pegY);
      }
    }
  }

  addFreeHorizSegment(pegX: number, pegY: number) {
    const segment = new FreeSegment({ x: pegX + 1, y: pegY }, { x: pegX - 1, y: pegY });
    this.connectSegment(segment);
    this.freeSegments.push(segment);
  }
  addFreeVertSegment(pegX: number, pegY: number) {
    const segment = new FreeSegment({ x: pegX, y: pegY + 1 }, { x: pegX, y: pegY - 1 });
    this.connectSegment(segment);
    this.freeSegments.push(segment);
  }
  addFixedHorizSegment(pegX: number, pegY: number) {
    const segment = new FixedSegment({ x: pegX + 1, y: pegY }, { x: pegX - 1, y: pegY });
    this.connectSegment(segment);
    this.fixedSegments.push(segment);
  }
  addFixedVertSegment(pegX: number, pegY: number) {
    const segment = new FixedSegment({ x: pegX, y: pegY + 1 }, { x: pegX, y: pegY - 1 });
    this.connectSegment(segment);
    this.fixedSegments.push(segment);
  }
  addPivotUpSegment(pegX: number, pegY: number) {
    const segment = new PivotSegment({ x: pegX, y: pegY + 1 }, { x: pegX, y: pegY - 1 });
    this.connectSegment(segment);
    this.pivotSegments.push(segment);
  }
  addPivotDownSegment(pegX: number, pegY: number) {
    const segment = new PivotSegment({ x: pegX, y: pegY - 1 }, { x: pegX, y: pegY + 1 });
    this.connectSegment(segment);
    this.pivotSegments.push(segment);
  }
  addPivotLeftSegment(pegX: number, pegY: number) {
    const segment = new PivotSegment({ x: pegX + 1, y: pegY }, { x: pegX - 1, y: pegY });
    this.connectSegment(segment);
    this.pivotSegments.push(segment);
  }
  addPivotRightSegment(pegX: number, pegY: number) {
    const segment = new PivotSegment({ x: pegX - 1, y: pegY }, { x: pegX + 1, y: pegY });
    this.connectSegment(segment);
    this.pivotSegments.push(segment);
  }
  addRotateSegment(a: Point, b: Point) {
    const segment = new RotateSegment(a, b);
    this.connectSegment(segment);
    this.rotateSegments.push(segment);
  }

  connectSegment(segment: MazeSegment) {
    (['noon', 'three', 'six', 'nine'] as Orientation[]).forEach((orientation) => {
      const line = segment[orientation];
      if (this.getIsPegOut(line.a) || this.getIsPegOut(line.b)) return;
      this.connectPeg(segment, orientation, line.a);
      this.connectPeg(segment, orientation, line.b);
    });
  }
  getIsPegOut(peg: Point) {
    return Math.abs(peg.x) > this.gridMax || Math.abs(peg.y) > this.gridMax;
  }
  connectPeg(segment: MazeSegment, orientation: Orientation, peg: Point) {
    const key = `${orientation}:${peg.x},${peg.y}`;
    let connection = this.connections[key];
    if (!connection) connection = this.connections[key] = [];
    if (connection.indexOf(segment) === -1) connection.push(segment);
  }

  update() {
    this.flyWheel.integrate();
    const angle = this.flyWheel.angle;
    if (angle < TAU / 8) this.orientation = 'noon';
    else if (angle < (TAU * 3) / 8) this.orientation = 'three';
    else if (angle < (TAU * 5) / 8) this.orientation = 'six';
    else if (angle < (TAU * 7) / 8) this.orientation = 'nine';
    else this.orientation = 'noon';
  }

  attractAlignFlyWheel() {
    const angle = this.flyWheel.angle;
    let target: number;
    if (angle < TAU / 8) target = 0;
    else if (angle < (TAU * 3) / 8) target = TAU / 4;
    else if (angle < (TAU * 5) / 8) target = TAU / 2;
    else if (angle < (TAU * 7) / 8) target = (TAU * 3) / 4;
    else target = TAU;
    this.flyWheel.applyForce((target - angle) * 0.03);
  }

  render(ctx: CanvasRenderingContext2D, center: Point, gridSize: number, angle: number) {
    const gridMax = this.gridMax;
    ctx.save();
    ctx.translate(center.x, center.y);
    this.fixedSegments.forEach((segment) => segment.render(ctx, center, gridSize, angle));
    this.rotateSegments.forEach((segment) => segment.render(ctx, center, gridSize, angle));
    ctx.rotate(angle);

    ctx.lineWidth = gridSize * 0.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'hsla(0, 0%, 50%, 0.2)';
    ctx.save();
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-gridSize / 5, -gridSize / 5, (gridSize * 2) / 5, (gridSize * 2) / 5);
    ctx.restore();

    ctx.strokeStyle = 'hsla(330, 100%, 50%, 0.3)';
    ctx.lineWidth = gridSize * 0.15;
    strokeCircle(ctx, this.startPosition.x * gridSize, this.startPosition.y * gridSize, gridSize * 0.5);

    for (let pegY = -gridMax; pegY <= gridMax; pegY += 2) {
      for (let pegX = -gridMax; pegX <= gridMax; pegX += 2) {
        ctx.fillStyle = 'hsla(0, 0%, 50%, 0.6)';
        fillCircle(ctx, pegX * gridSize, pegY * gridSize, gridSize * 0.15);
      }
    }

    this.freeSegments.forEach((segment) => segment.render(ctx, center, gridSize, angle));
    this.pivotSegments.forEach((segment) => segment.render(ctx, center, gridSize, angle));

    ctx.lineWidth = gridSize * 0.3;
    ctx.fillStyle = 'hsla(50, 100%, 50%, 1)';
    ctx.strokeStyle = 'hsla(50, 100%, 50%, 1)';
    renderGoal(ctx, this.goalPosition.x * gridSize, this.goalPosition.y * gridSize, angle, gridSize * 0.6, gridSize * 0.3);

    ctx.restore();
  }
}

// ── Win animation (pháo hoa ngôi sao khi chạm đích) ──

function renderStar(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = 'hsla(50, 100%, 50%, 1)';
  ctx.strokeStyle = 'hsla(50, 100%, 50%, 1)';
  ctx.beginPath();
  for (let i = 0; i < 11; i++) {
    const theta = (Math.PI * 2 * i) / 10 + Math.PI / 2;
    const radius = i % 2 ? 20 : 10;
    const dx = Math.cos(theta) * radius;
    const dy = Math.sin(theta) * radius;
    if (i) ctx.lineTo(dx, dy);
    else ctx.moveTo(dx, dy);
  }
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
}

class WinAnimation {
  x: number;
  y: number;
  startTime: number;
  isPlaying: boolean;
  t = 0;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.startTime = Date.now();
    this.isPlaying = true;
  }
  update() {
    if (!this.isPlaying) return;
    this.t = (Date.now() - this.startTime) / 1000;
    this.isPlaying = this.t <= 1;
  }
  render(ctx: CanvasRenderingContext2D) {
    if (!this.isPlaying) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    this.renderBurst(ctx);
    ctx.save();
    ctx.scale(0.5, -0.5);
    this.renderBurst(ctx);
    ctx.restore();
    ctx.restore();
  }
  renderBurst(ctx: CanvasRenderingContext2D) {
    const t = this.t;
    const dt = 1 - t;
    const easeT = 1 - dt ** 8;
    const dy = easeT * -100;
    const scale = (1 - t ** 3) * 1.5;
    const spin = Math.PI * t ** 3;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate(((Math.PI * 2) / 5) * i);
      ctx.translate(0, dy);
      ctx.scale(scale, scale);
      ctx.rotate(spin);
      renderStar(ctx);
      ctx.restore();
    }
  }
}

// ── Unipointer (mouse/touch base, bỏ nhánh MSPointer/PointerEvent IE cũ không còn cần) ──

class Unipointer {
  isPointerDown = false;
  pointerIdentifier: number | undefined;
  pointerDown(_event: Event, _pointer: PointerLike) {}
  pointerMove(_event: Event, _pointer: PointerLike) {}
  pointerUp(_event: Event, _pointer: PointerLike) {}
  pointerCancel(_event: Event, _pointer: PointerLike) {}
  pointerDone() {}
  private boundPostStartEvents: string[] | undefined;

  bindStartEvent(elem: HTMLElement) {
    elem.addEventListener('mousedown', this);
    elem.addEventListener('touchstart', this, { passive: false });
  }
  unbindStartEvent(elem: HTMLElement) {
    elem.removeEventListener('mousedown', this);
    elem.removeEventListener('touchstart', this);
  }
  handleEvent(event: Event) {
    const method = `on${event.type}`;
    const handler = (this as unknown as Record<string, (e: Event) => void>)[method];
    if (typeof handler === 'function') handler.call(this, event);
  }
  getTouch(touches: TouchList) {
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].identifier === this.pointerIdentifier) return touches[i];
    }
    return undefined;
  }

  onmousedown(event: MouseEvent) {
    if (event.button && event.button !== 0 && event.button !== 1) return;
    this.pointerDownInternal(event, event);
  }
  ontouchstart(event: TouchEvent) {
    this.pointerDownInternal(event, event.changedTouches[0]);
  }
  private pointerDownInternal(event: Event, pointer: PointerLike) {
    if (this.isPointerDown) return;
    this.isPointerDown = true;
    this.pointerIdentifier = pointer.identifier;
    this.pointerDown(event, pointer);
  }

  onmousemove(event: MouseEvent) {
    this.pointerMove(event, event);
  }
  ontouchmove(event: TouchEvent) {
    const touch = this.getTouch(event.changedTouches);
    if (touch) this.pointerMove(event, touch);
  }

  onmouseup(event: MouseEvent) {
    this.pointerUpInternal(event, event);
  }
  ontouchend(event: TouchEvent) {
    const touch = this.getTouch(event.changedTouches);
    if (touch) this.pointerUpInternal(event, touch);
  }
  private pointerUpInternal(event: Event, pointer: PointerLike) {
    this.pointerDoneInternal();
    this.pointerUp(event, pointer);
  }

  ontouchcancel(event: TouchEvent) {
    const touch = this.getTouch(event.changedTouches);
    if (touch) {
      this.pointerDoneInternal();
      this.pointerCancel(event, touch);
    }
  }

  private pointerDoneInternal() {
    this.isPointerDown = false;
    this.pointerIdentifier = undefined;
    this.unbindPostStartEvents();
    this.pointerDone();
  }

  bindPostStartEvents(event: Event) {
    const map: Record<string, string[]> = {
      mousedown: ['mousemove', 'mouseup'],
      touchstart: ['touchmove', 'touchend', 'touchcancel'],
    };
    const events = map[event.type];
    if (!events) return;
    events.forEach((eventName) => {
      window.addEventListener(eventName, this, eventName === 'touchmove' ? { passive: false } : undefined);
    });
    this.boundPostStartEvents = events;
  }
  unbindPostStartEvents() {
    if (!this.boundPostStartEvents) return;
    this.boundPostStartEvents.forEach((eventName) => window.removeEventListener(eventName, this));
    this.boundPostStartEvents = undefined;
  }
}

const RP_STORAGE_LEVEL_KEY = 'ethan-culture-rotate-puzzle:currentLevel';
const RP_STORAGE_COMPLETED_KEY = 'ethan-culture-rotate-puzzle:completedLevels';

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore (private mode / storage disabled)
  }
}

/** Game xoay lưới "Rotate" (David DeSandro, MIT) — nhúng làm chương 06 (cuối) trang Văn hoá. Vật lý xoay
 *  (FlyWheel), cấu trúc lưới (Maze/Segment) và 61 màn chơi giữ nguyên bản gốc; phần chuyển thể lo vòng đời
 *  React (dọn listener/rAF lúc unmount, tạm dừng khi cuộn ra ngoài khung nhìn) và thay khung toạ độ dựa trên
 *  toàn viewport (bản gốc chiếm nguyên trang) bằng khung toạ độ dựa trên khối `.rpg-stage` co giãn theo
 *  container, để game không tràn ra ngoài chương này của trang. */
interface RotatePuzzleGameProps {
  /** Gọi mỗi khi người chơi vừa hoàn thành 1 màn (kể cả chơi lại màn cũ) — dùng để ghi nhận điểm lên
   *  bảng xếp hạng (xem RotatePuzzleLeaderboard). Giữ trong ref vì effect dựng game chỉ chạy 1 lần lúc
   *  mount ([] deps), không muốn re-run cả game khi prop đổi. */
  onLevelComplete?: (levelId: string) => void;
  /** Avatar của user đang đăng nhập — hiện thay cho hình gấu hồng mặc định khi tải được ảnh. */
  avatarUrl?: string | null;
}

export default function RotatePuzzleGame({ onLevelComplete, avatarUrl }: RotatePuzzleGameProps) {
  const onLevelCompleteRef = useRef(onLevelComplete);
  useEffect(() => {
    onLevelCompleteRef.current = onLevelComplete;
  }, [onLevelComplete]);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instructionRef = useRef<HTMLParagraphElement>(null);
  const levelListRef = useRef<HTMLOListElement>(null);
  const nextLevelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (
      !rootRef.current || !stageRef.current || !canvasRef.current || !instructionRef.current ||
      !levelListRef.current || !nextLevelBtnRef.current
    ) {
      return;
    }
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const instructionEl = instructionRef.current;
    const levelListEl = levelListRef.current;
    const nextLevelBtn = nextLevelBtnRef.current;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cub = createCub();
    if (avatarUrl) {
      // Không set crossOrigin: canvas chỉ vẽ hiển thị, không đọc lại pixel (getImageData/toDataURL) nên
      // không cần ảnh "untainted" — set crossOrigin vào đây chỉ thêm rủi ro ảnh lỗi nếu host avatar
      // không trả CORS header, mà chẳng được lợi gì.
      const avatarImg = new Image();
      avatarImg.onload = () => {
        cub.avatarImage = avatarImg;
      };
      avatarImg.src = avatarUrl;
    }
    let maze!: Maze;
    let winAnim: WinAnimation | null = null;

    // ── sizing (co giãn theo `.rpg-stage` thay vì window.innerWidth/innerHeight của bản gốc) ──
    let stageW = 0;
    let stageH = 0;
    let gridSize = 20;
    let mazeCenter: Point = { x: 0, y: 0 };

    function resize() {
      const rect = stage.getBoundingClientRect();
      stageW = rect.width;
      stageH = rect.height;
      canvas.width = stageW * 2;
      canvas.height = stageH * 2;
      gridSize = Math.min(40, Math.min(stageW, stageH) / 12);
      mazeCenter = { x: stageW / 2, y: Math.min(gridSize * 8, stageH / 2) };
    }
    resize();

    // ── level list ──
    // Xoá trước khi thêm để idempotent qua các lần effect chạy lại (React Strict Mode
    // mount → cleanup → mount lại ở dev; thiếu dòng này sẽ nhân đôi danh sách màn chơi).
    levelListEl.replaceChildren();
    ROTATE_PUZZLE_LEVELS.forEach((level, i) => {
      const item = document.createElement('li');
      item.className = 'rpg-level-list__item';
      item.setAttribute('data-id', level.id);
      const blurbHtml = level.listBlurb.includes('★')
        ? `<span class="rpg-level-list__item__stars">${level.listBlurb}</span>`
        : level.listBlurb;
      item.innerHTML =
        `<span class="rpg-level-list__item__number">${i + 1}</span> ` +
        `<span class="rpg-level-list__item__blurb">${blurbHtml}</span>` +
        `<span class="rpg-level-list__item__check">✔</span>`;
      levelListEl.appendChild(item);
    });

    const completedLevels = (readStorage(RP_STORAGE_COMPLETED_KEY) || '').split(',').filter(Boolean);
    completedLevels.forEach((id) => {
      levelListEl.querySelector(`[data-id="${id}"]`)?.classList.add('did-complete');
    });

    function getNextLevel() {
      const index = ROTATE_PUZZLE_LEVELS.findIndex((l) => l.id === maze.id);
      return ROTATE_PUZZLE_LEVELS[index + 1]?.id;
    }

    function loadLevel(id: string) {
      const levelData = ROTATE_PUZZLE_LEVELS.find((l) => l.id === id);
      if (!levelData) return;
      maze = new Maze(cub);
      maze.id = id;
      maze.loadText(levelData.maze);
      instructionEl.style.opacity = '0';
      setTimeout(() => {
        instructionEl.textContent = levelData.instruction || '';
        instructionEl.style.opacity = '1';
      }, 120);
      nextLevelBtn.classList.remove('is-open');
      levelListEl.querySelector('.is-playing')?.classList.remove('is-playing');
      levelListEl.querySelector(`[data-id="${id}"]`)?.classList.add('is-playing');
      writeStorage(RP_STORAGE_LEVEL_KEY, id);
    }

    function completeLevel() {
      const cubPosition = getCubPosition();
      winAnim = new WinAnimation(cubPosition.x, cubPosition.y);
      levelListEl.querySelector(`[data-id="${maze.id}"]`)?.classList.add('did-complete');
      if (completedLevels.indexOf(maze.id) === -1) {
        completedLevels.push(maze.id);
        writeStorage(RP_STORAGE_COMPLETED_KEY, completedLevels.join(','));
      }
      onLevelCompleteRef.current?.(maze.id);
      if (getNextLevel()) {
        setTimeout(() => nextLevelBtn.classList.add('is-open'), 1000);
      }
    }

    const initialLevel = readStorage(RP_STORAGE_LEVEL_KEY) || ROTATE_PUZZLE_LEVELS[0].id;
    loadLevel(initialLevel);

    // ── level select UI ──
    const onLevelListClick = (event: Event) => {
      const target = event.target as Element | null;
      const item = target?.closest('.rpg-level-list__item');
      const id = item?.getAttribute('data-id');
      if (id) loadLevel(id);
    };
    levelListEl.addEventListener('click', onLevelListClick);

    const onNextLevelClick = () => {
      const nextLevel = getNextLevel();
      if (nextLevel) loadLevel(nextLevel);
    };
    nextLevelBtn.addEventListener('click', onNextLevelClick);

    // ── pointer coordinates ──
    function getCanvasMazePosition(pointer: PointerLike) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width ? stageW / rect.width : 1;
      const scaleY = rect.height ? stageH / rect.height : 1;
      const localX = (pointer.clientX - rect.left) * scaleX;
      const localY = (pointer.clientY - rect.top) * scaleY;
      return { x: localX - mazeCenter.x, y: localY - mazeCenter.y };
    }
    function getIsInsideCub(pointer: PointerLike) {
      const position = getCanvasMazePosition(pointer);
      const cubPeg = cub[maze.orientation];
      const dx = Math.abs(position.x - cubPeg.x * gridSize);
      const dy = Math.abs(position.y - cubPeg.y * gridSize);
      const bound = gridSize * 1.5;
      return dx <= bound && dy <= bound;
    }
    function getCubPosition(): Point {
      const cubPeg = cub[maze.orientation];
      return { x: cubPeg.x * gridSize + mazeCenter.x, y: cubPeg.y * gridSize + mazeCenter.y };
    }
    function getCubConnections(): MazeSegment[] | undefined {
      const cubPeg = cub[maze.orientation];
      return maze.connections[`${maze.orientation}:${cubPeg.x},${cubPeg.y}`];
    }
    function getDistance(a: Point, b: Point) {
      return Math.hypot(b.x - a.x, b.y - a.y);
    }
    function distanceSorter(a: { distance: number }, b: { distance: number }) {
      return a.distance - b.distance;
    }

    function getSegmentDragCoord(line: OrientedLine, axis: 'x' | 'y', dragPosition: Point) {
      const a = line.a[axis];
      const b = line.b[axis];
      const min = (a < b ? a : b) * gridSize + mazeCenter[axis];
      const max = (a > b ? a : b) * gridSize + mazeCenter[axis];
      return Math.max(min, Math.min(max, dragPosition[axis]));
    }
    function getSegmentDragPosition(segment: MazeSegment, dragPosition: Point): Point {
      const line = segment[maze.orientation];
      const isHorizontal = line.a.y === line.b.y;
      if (isHorizontal) {
        return { x: getSegmentDragCoord(line, 'x', dragPosition), y: line.a.y * gridSize + mazeCenter.y };
      }
      return { x: line.a.x * gridSize + mazeCenter.x, y: getSegmentDragCoord(line, 'y', dragPosition) };
    }
    function getDragPosition(segments: MazeSegment[], dragPosition: Point): Point {
      if (segments.length === 1) return getSegmentDragPosition(segments[0], dragPosition);
      const candidates = segments.map((segment) => {
        const position = getSegmentDragPosition(segment, dragPosition);
        return { position, distance: getDistance(dragPosition, position) };
      });
      candidates.sort(distanceSorter);
      return candidates[0].position;
    }
    function addPegPoint(point: Point, pegs: string[]) {
      const key = `${point.x},${point.y}`;
      if (pegs.indexOf(key) === -1) pegs.push(key);
    }
    function getDragPeg(segments: MazeSegment[], dragPosition: Point): Point {
      const pegs: string[] = [];
      segments.forEach((segment) => {
        const line = segment[maze.orientation];
        addPegPoint(line.a, pegs);
        addPegPoint(line.b, pegs);
      });
      const candidates = pegs.map((pegKey) => {
        const [px, py] = pegKey.split(',').map((n) => parseInt(n, 10));
        const peg = { x: px, y: py };
        const pegPosition = { x: peg.x * gridSize + mazeCenter.x, y: peg.y * gridSize + mazeCenter.y };
        return { peg, distance: getDistance(dragPosition, pegPosition) };
      });
      candidates.sort(distanceSorter);
      return candidates[0].peg;
    }

    // ── drag state ──
    const unipointer = new Unipointer();
    let dragAngle: number | null = null;
    let cubDragMove: Point | null = null;
    let isCubHovered = false;
    let isCubDragging = false;
    let rotatePointer: PointerLike | null = null;
    let dragStartAngle = 0;
    let dragStartMazeAngle = 0;
    let moveAngle = 0;
    let dragStartPosition: Point = { x: 0, y: 0 };
    let dragStartPegPosition: Point = { x: 0, y: 0 };
    let pointerBehavior: { pointerDown: (e: Event, p: PointerLike) => void; pointerMove: (e: Event, p: PointerLike) => void; pointerUp: (e: Event, p: PointerLike) => void } | null = null;

    function getDragAngle(pointer: PointerLike) {
      const position = getCanvasMazePosition(pointer);
      return normalizeAngle(Math.atan2(position.y, position.x));
    }

    const cubDrag = {
      pointerDown(_event: Event, pointer: PointerLike) {
        const segments = getCubConnections();
        if (!segments || !segments.length) return;
        isCubDragging = true;
        dragStartPosition = { x: pointer.clientX, y: pointer.clientY };
        const cubPeg = cub[maze.orientation];
        dragStartPegPosition = { x: cubPeg.x * gridSize + mazeCenter.x, y: cubPeg.y * gridSize + mazeCenter.y };
        root.classList.add('is-cub-dragging');
      },
      pointerMove(_event: Event, pointer: PointerLike) {
        if (!isCubDragging) return;
        cubDragMove = { x: pointer.clientX - dragStartPosition.x, y: pointer.clientY - dragStartPosition.y };
      },
      pointerUp() {
        cubDragMove = null;
        root.classList.remove('is-cub-dragging');
        isCubDragging = false;
        cub.setOffset({ x: 0, y: 0 }, maze.orientation);
        if (cub.peg.x === maze.goalPosition.x && cub.peg.y === maze.goalPosition.y) {
          completeLevel();
        }
      },
    };

    const mazeRotate = {
      pointerDown(_event: Event, pointer: PointerLike) {
        dragStartAngle = moveAngle = getDragAngle(pointer);
        dragStartMazeAngle = maze.flyWheel.angle;
        dragAngle = dragStartMazeAngle;
        rotatePointer = pointer;
      },
      pointerMove(_event: Event, pointer: PointerLike) {
        rotatePointer = pointer;
        moveAngle = getDragAngle(pointer);
        const deltaAngle = moveAngle - dragStartAngle;
        dragAngle = normalizeAngle(dragStartMazeAngle + deltaAngle);
      },
      pointerUp() {
        dragAngle = null;
        rotatePointer = null;
      },
    };

    unipointer.pointerDown = (event, pointer) => {
      event.preventDefault();
      pointerBehavior = getIsInsideCub(pointer) ? cubDrag : mazeRotate;
      pointerBehavior.pointerDown(event, pointer);
      unipointer.bindPostStartEvents(event);
    };
    unipointer.pointerMove = (event, pointer) => {
      pointerBehavior?.pointerMove(event, pointer);
    };
    unipointer.pointerUp = (event, pointer) => {
      pointerBehavior?.pointerUp(event, pointer);
      unipointer.unbindPostStartEvents();
    };
    unipointer.bindStartEvent(canvas);

    const onHoverMousemove = (event: MouseEvent) => {
      const inside = getIsInsideCub(event);
      if (inside === isCubHovered) return;
      isCubHovered = inside;
      root.classList[inside ? 'add' : 'remove']('is-cub-hovered');
    };
    window.addEventListener('mousemove', onHoverMousemove);

    // ── update / render ──
    function dragCub() {
      if (!cubDragMove) return;
      const segments = getCubConnections();
      if (!segments) return;
      const dragPosition = { x: dragStartPegPosition.x + cubDragMove.x, y: dragStartPegPosition.y + cubDragMove.y };
      const dragPeg = getDragPeg(segments, dragPosition);
      cub.setPeg(dragPeg, maze.orientation);
      const cubDragPosition = getDragPosition(segments, dragPosition);
      const cubPosition = getCubPosition();
      cub.setOffset({ x: cubDragPosition.x - cubPosition.x, y: cubDragPosition.y - cubPosition.y }, maze.orientation);
    }

    function update() {
      dragCub();
      if (dragAngle !== null) maze.flyWheel.setAngle(dragAngle);
      else maze.attractAlignFlyWheel();
      maze.update();
      if (winAnim) winAnim.update();
    }

    function renderRotateHandle() {
      if (!rotatePointer) return;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      ctx!.lineWidth = gridSize * 0.5;
      ctx!.strokeStyle = '#EEE';
      ctx!.fillStyle = '#EEE';
      ctx!.beginPath();
      const pieRadius = maze.gridMax * gridSize;
      ctx!.moveTo(mazeCenter.x, mazeCenter.y);
      const pieDirection = normalizeAngle(normalizeAngle(moveAngle) - normalizeAngle(dragStartAngle)) > TAU / 2;
      ctx!.arc(mazeCenter.x, mazeCenter.y, pieRadius, dragStartAngle, moveAngle, pieDirection);
      ctx!.lineTo(mazeCenter.x, mazeCenter.y);
      ctx!.stroke();
      ctx!.fill();
      ctx!.closePath();
    }

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(2, 2);
      renderRotateHandle();
      maze.render(ctx, mazeCenter, gridSize, maze.flyWheel.angle);
      if (winAnim) winAnim.render(ctx);
      cub.render(ctx, mazeCenter, gridSize, maze.flyWheel.angle, isCubHovered || isCubDragging);
      ctx.restore();
    }

    let visible = true;
    let rafId = 0;
    function loop() {
      update();
      render();
      if (visible) rafId = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const nowVisible = entries.some((e) => e.isIntersecting);
        if (nowVisible && !visible) rafId = requestAnimationFrame(loop);
        visible = nowVisible;
      },
      { threshold: 0.01 },
    );
    io.observe(root);

    const ro = new ResizeObserver(() => resize());
    ro.observe(stage);

    loop();

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onHoverMousemove);
      unipointer.unbindStartEvent(canvas);
      unipointer.unbindPostStartEvents();
      levelListEl.removeEventListener('click', onLevelListClick);
      nextLevelBtn.removeEventListener('click', onNextLevelClick);
    };
  }, []);

  return (
    <div ref={rootRef} className="rpg-rotate-puzzle">
      <style dangerouslySetInnerHTML={{ __html: RP_CSS }} />
      <div className="rpg-content">
        <ol ref={levelListRef} className="rpg-level-list" />
        <div className="rpg-main-col">
          <div ref={stageRef} className="rpg-stage">
            <canvas ref={canvasRef} />
            <button ref={nextLevelBtnRef} type="button" className="rpg-next-level-button">
              Màn tiếp theo
            </button>
          </div>
          <p ref={instructionRef} className="rpg-instruction" />
        </div>
      </div>
    </div>
  );
}
