(function () {
  const canvas = document.getElementById('smokeCanvas');
  const ctx = canvas.getContext('2d');

  let W, H, mouse = { x: -999, y: -999 };
  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  class Puff {
    constructor(x, y) {
      this.x  = x;
      this.y  = y;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(0.3 + Math.random() * 0.5);
      this.r  = 40 + Math.random() * 60;
      this.alpha = 0;
      this.alphaTarget = 0.055 + Math.random() * 0.045;
      this.grow = 0.12 + Math.random() * 0.10;
      this.life = 0;
      this.maxLife = 220 + Math.random() * 160;
    }

    update() {
      this.life++;
      // fade in / fade out
      if (this.life < 40) {
        this.alpha += (this.alphaTarget - this.alpha) * 0.08;
      } else if (this.life > this.maxLife * 0.65) {
        this.alpha *= 0.977;
      }

      // mouse repel
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160) {
        const force = (160 - dist) / 160 * 0.6;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }

      // dampen
      this.vx *= 0.97;
      this.vy *= 0.97;

      this.x += this.vx;
      this.y += this.vy;
      this.r  += this.grow;
    }

    draw() {
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      grad.addColorStop(0,   `rgba(180, 160, 220, ${this.alpha})`);
      grad.addColorStop(0.5, `rgba(130, 100, 180, ${this.alpha * 0.45})`);
      grad.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    dead() { return this.life > this.maxLife || this.alpha < 0.003 || this.y > H * 0.82; }
  }

  // Spawn zones: left and right columns, top 75% only (avoid candle video area)
  function spawnZone() {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    if (side === 'left') {
      return { x: Math.random() * 200, y: Math.random() * H * 0.75 };
    } else {
      return { x: W - Math.random() * 200, y: Math.random() * H * 0.75 };
    }
  }

  let frame = 0;
  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);

    // spawn ~2 puffs every 3 frames
    frame++;
    if (frame % 3 === 0 && particles.length < 80) {
      const { x, y } = spawnZone();
      particles.push(new Puff(x, y));
      if (Math.random() < 0.4) particles.push(new Puff(x + (Math.random()-0.5)*40, y + (Math.random()-0.5)*30));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].dead()) particles.splice(i, 1);
    }
  }

  loop();
})();
