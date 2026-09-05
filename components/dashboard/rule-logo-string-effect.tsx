'use client';

import { useEffect, useRef } from 'react';

const LOGO_SRC = '/images/brand/logo-hires.png';
const COLORS = ['#00D2FF', '#FFC94D', '#2D6FF0', '#FF6F91', '#F5A623', '#72E6C1'] as const;
const LIGHT_COLORS = ['#8DEBFF', '#FFE49A', '#90B3FF', '#FFB4C6', '#FFD080', '#B8F5DF'] as const;
const MAX_POINTS = 4200;
const CAN_LOGO_CLEARANCE = 34;

type Bounds = { x: number; y: number; width: number; height: number };

class StringPoint {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  settled = false;
  collisions = 0;

  constructor(x: number, y: number, velocityX: number, velocityY: number) {
    this.x = x;
    this.y = y;
    this.oldX = x - velocityX;
    this.oldY = y - velocityY;
  }

  update(hit: (x: number, y: number) => boolean, width: number, height: number) {
    if (this.settled) return;

    const velocityX = (this.x - this.oldX) * 0.97;
    const velocityY = (this.y - this.oldY) * 0.97;
    this.oldX = this.x;
    this.oldY = this.y;
    this.x += velocityX;
    this.y += velocityY + 0.12;

    if (hit(this.x, this.y)) {
      if (!hit(this.x, this.oldY)) {
        this.y = this.oldY;
      } else if (!hit(this.oldX, this.y)) {
        this.x = this.oldX;
      } else {
        this.x = this.oldX;
        this.y = this.oldY;
      }
      this.oldX = this.x;
      this.oldY = this.y;
      this.collisions += 4;
    }

    if (this.y >= height - 1) {
      this.y = height - 1;
      this.oldY = this.y;
      this.collisions += 4;
    }
    if (this.y < 0) {
      this.y = 0;
      this.oldY = 0;
      this.collisions += 4;
    }
    this.x = Math.min(width, Math.max(0, this.x));
    if (this.collisions > 14) this.settled = true;
  }
}

class StringLink {
  broken = false;

  constructor(
    readonly a: StringPoint,
    readonly b: StringPoint,
    readonly length = 2.5
  ) {}

  solve() {
    if (this.broken) return;
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const distance = Math.hypot(dx, dy) || 0.001;
    if (distance > 25) {
      this.broken = true;
      return;
    }
    const force = ((this.length - distance) / distance) * 0.25;
    if (!this.a.settled) {
      this.a.x -= dx * force;
      this.a.y -= dy * force;
    }
    if (!this.b.settled) {
      this.b.x += dx * force;
      this.b.y += dy * force;
    }
  }
}

class StringStrand {
  readonly points: StringPoint[] = [];
  readonly links: StringLink[] = [];

  constructor(readonly colorIndex: number) {}

  add(x: number, y: number, velocityX: number, velocityY: number) {
    const point = new StringPoint(x, y, velocityX, velocityY);
    const previous = this.points.at(-1);
    if (previous) this.links.push(new StringLink(previous, point));
    this.points.push(point);
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

export default function RuleLogoStringEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest<HTMLElement>('.rule-laptop-section');
    const trigger = section?.parentElement?.querySelector<HTMLElement>('.rule-logo-string-trigger');
    const logo = section?.querySelector<HTMLImageElement>('.rule-laptop-screen-face');
    const context = canvas?.getContext('2d');
    if (!canvas || !section || !trigger || !logo || !context) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 1025px)');
    const collisionCanvas = document.createElement('canvas');
    const collisionContext = collisionCanvas.getContext('2d', { willReadFrequently: true });
    if (!collisionContext) return;

    let width = 0;
    let height = 0;
    let collisionData: Uint8ClampedArray | null = null;
    let logoBounds: Bounds | null = null;
    let animationFrame = 0;
    let triggerVisible = false;
    let tabVisible = document.visibilityState !== 'hidden';
    let frame = 0;
    let sprayFrame = 0;
    let colorIndex = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerSpraying = false;
    let manualControl = false;
    let currentStrand: StringStrand | null = null;
    let strands: StringStrand[] = [];
    let logoImage: HTMLImageElement | null = null;

    const canAnimate = () =>
      desktopQuery.matches && !reducedMotionQuery.matches && triggerVisible && tabVisible && logoBounds !== null;

    function measureLogo(): Bounds | null {
      const canvasRect = canvas!.getBoundingClientRect();
      const logoRect = logo!.getBoundingClientRect();
      if (logoRect.width < Math.min(420, width * 0.34)) return null;
      return {
        x: logoRect.left - canvasRect.left,
        y: logoRect.top - canvasRect.top,
        width: logoRect.width,
        height: logoRect.height,
      };
    }

    function boundsChanged(next: Bounds | null) {
      if (!next || !logoBounds) return next !== logoBounds;
      return (
        Math.abs(next.x - logoBounds.x) > 2 ||
        Math.abs(next.y - logoBounds.y) > 2 ||
        Math.abs(next.width - logoBounds.width) > 2 ||
        Math.abs(next.height - logoBounds.height) > 2
      );
    }

    function rebuildCollision(nextBounds = measureLogo()) {
      if (!nextBounds || !logoImage) {
        logoBounds = null;
        collisionData = null;
        return;
      }
      logoBounds = nextBounds;
      collisionCanvas.width = Math.max(1, Math.round(width));
      collisionCanvas.height = Math.max(1, Math.round(height));
      collisionContext!.clearRect(0, 0, width, height);
      collisionContext!.drawImage(logoImage, nextBounds.x, nextBounds.y, nextBounds.width, nextBounds.height);
      collisionData = collisionContext!.getImageData(0, 0, collisionCanvas.width, collisionCanvas.height).data;
    }

    function hit(x: number, y: number) {
      if (!collisionData) return false;
      const pixelX = Math.round(x);
      const pixelY = Math.round(y);
      if (pixelX < 0 || pixelY < 0 || pixelX >= width || pixelY >= height) return false;
      return collisionData[(pixelY * collisionCanvas.width + pixelX) * 4 + 3] > 38;
    }

    function resize() {
      const nextWidth = section!.clientWidth;
      const nextHeight = section!.clientHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const sizeChanged = nextWidth !== width || nextHeight !== height;
      width = nextWidth;
      height = nextHeight;
      canvas!.width = Math.round(width * pixelRatio);
      canvas!.height = Math.round(height * pixelRatio);
      context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (sizeChanged) {
        strands = [];
        currentStrand = null;
      }
      rebuildCollision();
    }

    function logoCenter() {
      return logoBounds
        ? { x: logoBounds.x + logoBounds.width / 2, y: logoBounds.y + logoBounds.height / 2 }
        : { x: width / 2, y: height * 0.58 };
    }

    function canClearLogo(x: number, y: number) {
      const diagonal = CAN_LOGO_CLEARANCE * 0.72;
      return [
        [0, 0],
        [CAN_LOGO_CLEARANCE, 0],
        [-CAN_LOGO_CLEARANCE, 0],
        [0, CAN_LOGO_CLEARANCE],
        [0, -CAN_LOGO_CLEARANCE],
        [diagonal, diagonal],
        [diagonal, -diagonal],
        [-diagonal, diagonal],
        [-diagonal, -diagonal],
      ].every(([offsetX, offsetY]) => !hit(x + offsetX, y + offsetY));
    }

    function keepCanOutsideLogo(x: number, y: number) {
      const clampX = (value: number) => Math.min(width - CAN_LOGO_CLEARANCE, Math.max(CAN_LOGO_CLEARANCE, value));
      const clampY = (value: number) => Math.min(height - CAN_LOGO_CLEARANCE, Math.max(CAN_LOGO_CLEARANCE, value));
      let nextX = clampX(x);
      let nextY = clampY(y);
      if (!logoBounds || canClearLogo(nextX, nextY)) return { x: nextX, y: nextY };

      const center = logoCenter();
      let directionX = nextX - center.x;
      let directionY = nextY - center.y;
      const directionLength = Math.hypot(directionX, directionY);
      if (directionLength < 0.001) {
        directionX = 1;
        directionY = 0;
      } else {
        directionX /= directionLength;
        directionY /= directionLength;
      }

      const searchDistance = Math.hypot(logoBounds.width, logoBounds.height) + CAN_LOGO_CLEARANCE;
      function searchAlong(searchX: number, searchY: number) {
        let previousX = Number.NaN;
        let previousY = Number.NaN;
        for (let distance = 0; distance <= searchDistance; distance += 4) {
          const candidateX = clampX(x + searchX * distance);
          const candidateY = clampY(y + searchY * distance);
          if (candidateX === previousX && candidateY === previousY) return null;
          if (canClearLogo(candidateX, candidateY)) return { x: candidateX, y: candidateY };
          previousX = candidateX;
          previousY = candidateY;
        }
        return null;
      }

      const projected = searchAlong(directionX, directionY);
      if (projected) return projected;

      for (let index = 0; index < 8; index += 1) {
        const angle = (index * Math.PI) / 4;
        const fallback = searchAlong(Math.cos(angle), Math.sin(angle));
        if (fallback) return fallback;
      }

      return { x: clampX(x), y: clampY(y) };
    }

    function aimAngle(originX: number, originY: number) {
      const target = logoCenter();
      const rawAngle = Math.atan2(target.y - originY, target.x - originX);
      return Math.atan2(Math.sin(rawAngle) * 0.15, Math.cos(rawAngle));
    }

    function sprayTip(originX: number, originY: number, angle: number) {
      const nozzleX = 10;
      const nozzleY = -26;
      return {
        x: originX + nozzleX * Math.cos(angle) - nozzleY * Math.sin(angle),
        y: originY + nozzleX * Math.sin(angle) + nozzleY * Math.cos(angle),
      };
    }

    function startStrand() {
      currentStrand = new StringStrand(colorIndex++ % COLORS.length);
      strands.push(currentStrand);
    }

    function emit(originX: number, originY: number) {
      if (!currentStrand) startStrand();
      if (!currentStrand) return;
      sprayFrame += 1;
      const angle = aimAngle(originX, originY);
      const tip = sprayTip(originX, originY, angle);
      for (let index = 0; index < 3; index += 1) {
        const speed = 8.5 + Math.random() * 2;
        const curl = Math.sin(sprayFrame * 0.35 + index * 1.7) * 2;
        const wobble = (Math.random() - 0.5) * 0.45;
        const perpendicular = angle + Math.PI / 2;
        currentStrand.add(
          tip.x,
          tip.y,
          Math.cos(angle + wobble) * speed + Math.cos(perpendicular) * curl,
          Math.sin(angle + wobble) * speed + Math.sin(perpendicular) * curl
        );
      }

      let totalPoints = strands.reduce((total, strand) => total + strand.points.length, 0);
      while (totalPoints > MAX_POINTS && strands.length > 1) {
        const oldest = strands[0];
        if (oldest === currentStrand) break;
        if (oldest.points.length) {
          oldest.points.shift();
          oldest.links.shift();
          totalPoints -= 1;
        } else {
          strands.shift();
        }
      }
    }

    function drawStrands() {
      for (const strand of strands) {
        if (strand.points.length < 2) continue;
        context!.lineCap = 'round';
        context!.lineJoin = 'round';
        context!.beginPath();
        context!.moveTo(strand.points[0].x, strand.points[0].y);
        for (let index = 1; index < strand.points.length; index += 1) {
          const previous = strand.points[index - 1];
          const point = strand.points[index];
          if (strand.links[index - 1]?.broken || Math.hypot(point.x - previous.x, point.y - previous.y) > 24) {
            context!.moveTo(point.x, point.y);
            continue;
          }
          context!.quadraticCurveTo(previous.x, previous.y, (previous.x + point.x) / 2, (previous.y + point.y) / 2);
        }
        context!.save();
        context!.shadowColor = COLORS[strand.colorIndex];
        context!.shadowBlur = 5;
        context!.strokeStyle = COLORS[strand.colorIndex];
        context!.globalAlpha = 0.2;
        context!.lineWidth = 4;
        context!.stroke();
        context!.restore();
        context!.strokeStyle = COLORS[strand.colorIndex];
        context!.globalAlpha = 0.92;
        context!.lineWidth = 2;
        context!.stroke();
        context!.strokeStyle = LIGHT_COLORS[strand.colorIndex];
        context!.globalAlpha = 0.28;
        context!.lineWidth = 0.7;
        context!.stroke();
        context!.globalAlpha = 1;
      }
    }

    function maskLogoInterior() {
      if (!logoBounds || !logoImage) return;
      context!.save();
      context!.globalAlpha = 1;
      context!.globalCompositeOperation = 'destination-out';
      context!.drawImage(logoImage, logoBounds.x, logoBounds.y, logoBounds.width, logoBounds.height);
      context!.restore();
    }

    function drawCan(originX: number, originY: number, spraying: boolean) {
      const angle = aimAngle(originX, originY);
      const canWidth = 18;
      const canHeight = 46;
      context!.save();
      context!.translate(originX, originY);
      context!.rotate(angle);
      context!.shadowColor = 'rgba(0, 210, 255, 0.22)';
      context!.shadowBlur = 10;
      context!.shadowOffsetY = 3;
      const body = context!.createLinearGradient(-canWidth / 2, 0, canWidth / 2, 0);
      body.addColorStop(0, '#101A30');
      body.addColorStop(0.45, '#2D6FF0');
      body.addColorStop(0.72, '#0052CC');
      body.addColorStop(1, '#101A30');
      context!.fillStyle = body;
      roundedRect(context!, -canWidth / 2, -canHeight / 2, canWidth, canHeight, 4);
      context!.fill();
      context!.shadowBlur = 0;
      context!.fillStyle = '#FFC94D';
      context!.font = '700 4px sans-serif';
      context!.textAlign = 'center';
      context!.fillText('ETHAN', 0, 1.5);
      context!.fillStyle = '#d7e2f5';
      roundedRect(context!, -5, -canHeight / 2 - 4, 10, 5, 2);
      context!.fill();
      context!.beginPath();
      context!.moveTo(2, -canHeight / 2 - 3);
      context!.lineTo(9, -27);
      context!.lineTo(9, -24);
      context!.lineTo(2, -canHeight / 2 + 1);
      context!.closePath();
      context!.fill();
      context!.fillStyle = currentStrand ? COLORS[currentStrand.colorIndex] : COLORS[0];
      context!.beginPath();
      context!.ellipse(0, -canHeight / 2 - 5, 4, 2, 0, 0, Math.PI * 2);
      context!.fill();
      if (spraying && currentStrand) {
        for (let index = 0; index < 3; index += 1) {
          const distance = 1 + Math.random() * 5;
          context!.fillStyle = COLORS[currentStrand.colorIndex];
          context!.globalAlpha = 0.08 + Math.random() * 0.1;
          context!.beginPath();
          context!.arc(10 + distance, -26 + (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.4, 0, Math.PI * 2);
          context!.fill();
        }
      }
      context!.restore();
      context!.globalAlpha = 1;
    }

    function clearEffect() {
      strands = [];
      currentStrand = null;
      context!.clearRect(0, 0, width, height);
    }

    function tick() {
      animationFrame = 0;
      if (!canAnimate()) return;
      frame += 1;
      if (frame % 6 === 0) {
        const nextBounds = measureLogo();
        if (boundsChanged(nextBounds)) rebuildCollision(nextBounds);
      }

      context!.clearRect(0, 0, width, height);
      if (!logoBounds) return;

      const automaticX = width * 0.12 + ((Math.sin(frame * 0.012) + 1) / 2) * width * 0.76;
      const automaticY = Math.max(72, logoBounds.y - 72 + Math.sin(frame * 0.035) * 12);
      const requestedOriginX = manualControl ? pointerX : automaticX;
      const requestedOriginY = manualControl ? pointerY : automaticY;
      const { x: originX, y: originY } = keepCanOutsideLogo(requestedOriginX, requestedOriginY);
      const spraying = manualControl ? pointerSpraying : frame % 2 === 0;
      if (spraying) {
        if (!currentStrand || currentStrand.points.length > 150) startStrand();
        emit(originX, originY);
      }

      for (const strand of strands) {
        for (const point of strand.points) point.update(hit, width, height);
        for (let pass = 0; pass < 2; pass += 1) {
          for (const link of strand.links) link.solve();
        }
      }
      drawStrands();
      maskLogoInterior();
      drawCan(originX, originY, spraying);
      animationFrame = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!animationFrame && canAnimate()) animationFrame = requestAnimationFrame(tick);
    }

    function isPointerInsideSection(event: PointerEvent) {
      const target = event.target;
      return target instanceof Node && section!.contains(target);
    }

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0 || event.pointerType !== 'mouse' || !isPointerInsideSection(event) || !canAnimate()) {
        return;
      }
      const rect = canvas!.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      manualControl = true;
      pointerSpraying = true;
      startStrand();
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || !canAnimate()) return;
      if (!manualControl && !isPointerInsideSection(event)) return;
      const rect = canvas!.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      manualControl = true;
    }

    function stopPointer() {
      pointerSpraying = false;
      currentStrand = null;
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        triggerVisible = entries.some((entry) => entry.isIntersecting);
        const nextBounds = triggerVisible ? measureLogo() : null;
        if (!nextBounds) {
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
          logoBounds = null;
          collisionData = null;
          clearEffect();
          return;
        }
        if (boundsChanged(nextBounds)) rebuildCollision(nextBounds);
        startLoop();
      },
      { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1] }
    );
    intersectionObserver.observe(trigger);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);

    function onVisibilityChange() {
      tabVisible = document.visibilityState !== 'hidden';
      if (tabVisible) startLoop();
    }

    function onPreferenceChange() {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      clearEffect();
      if (!reducedMotionQuery.matches && desktopQuery.matches && triggerVisible) {
        rebuildCollision();
        startLoop();
      }
    }

    logoImage = new Image();
    logoImage.decoding = 'async';
    logoImage.onload = () => {
      resize();
      startLoop();
    };
    logoImage.src = LOGO_SRC;
    if (logoImage.complete) {
      resize();
      startLoop();
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopPointer);
    window.addEventListener('pointercancel', stopPointer);
    window.addEventListener('blur', stopPointer);
    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotionQuery.addEventListener('change', onPreferenceChange);
    desktopQuery.addEventListener('change', onPreferenceChange);
    resize();

    return () => {
      cancelAnimationFrame(animationFrame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopPointer);
      window.removeEventListener('pointercancel', stopPointer);
      window.removeEventListener('blur', stopPointer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotionQuery.removeEventListener('change', onPreferenceChange);
      desktopQuery.removeEventListener('change', onPreferenceChange);
      if (logoImage) logoImage.onload = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="rule-logo-string-effect" aria-hidden="true" />;
}
