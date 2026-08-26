// ══════════════════════════════════════════════════════
//  Daily Card
// ══════════════════════════════════════════════════════

const DAILY_ROLES = [
  {key:'CEO',           label:'CEO'},
  {key:'MANAGER',        label:'MANAGER'},
  {key:'SELLER',         label:'SELLER'},
  {key:'SUPPORT',        label:'SUPPORT'},
  {key:'MEDIA',          label:'MEDIA'},
  {key:'DESIGNER_POD',   label:'DESIGNER POD'},
  {key:'DESIGNER_EMB',   label:'DESIGNER EMB'},
  {key:'QC',             label:'QC'},
  {key:'SAN_XUAT',       label:'SẢN XUẤT'},
  {key:'HR',             label:'HR'},
  {key:'KE_TOAN',        label:'KẾ TOÁN'},
  {key:'IT',             label:'IT'},
];

const DAILY_AFFIRMATIONS = [
  "Hôm nay tôi không cần phải hoàn hảo — tôi chỉ cần thành thật.",
  "Tôi cho phép mình cảm thấy những gì mình đang thực sự cảm thấy.",
  "Tôi đủ mạnh để nhìn thẳng vào những điều khó chịu thay vì tránh né.",
  "Tôi không phải kiếm quyền được nghỉ ngơi — tôi cần nghỉ ngơi vì tôi là con người.",
  "Tôi có thể vừa chưa chắc chắn vừa vẫn tiếp tục bước.",
  "Tôi không cần sự chấp thuận của người khác để biết mình đang đi đúng hướng.",
  "Những gì tôi cảm thấy hôm nay là thật — kể cả khi nó mâu thuẫn.",
  "Tôi học cách phân biệt giọng nói của nỗi sợ và giọng nói của trực giác.",
  "Tôi không cần giải thích lý do mình cần ranh giới — ranh giới là hợp lệ.",
  "Thay đổi chậm vẫn là thay đổi — tôi không cần phải biến đổi qua đêm.",
  "Tôi cho phép bản thân không biết câu trả lời hôm nay.",
  "Tôi không cần phải xử lý mọi thứ một mình.",
  "Những lần tôi thất bại không định nghĩa tôi là ai.",
  "Tôi đang học — và học không bao giờ trông gọn gàng.",
  "Tôi có thể yêu thương ai đó và vẫn đặt ra giới hạn với họ.",
  "Cơ thể tôi đang làm hết sức nó có thể — tôi tôn trọng điều đó.",
  "Tôi không phải chứng minh giá trị của mình qua năng suất.",
  "Tôi được phép thay đổi suy nghĩ khi có thêm thông tin mới.",
  "Tôi tin vào khả năng xử lý của mình — kể cả khi chưa biết cách.",
  "Hôm nay tôi chú ý đến một điều nhỏ làm mình dễ chịu hơn.",
  "Tôi không cần kiểm soát kết quả — tôi chỉ cần kiểm soát hành động của mình.",
  "Những gì đang khó hôm nay không có nghĩa là sẽ khó mãi.",
];

function getDailyCard() {
  const now = new Date();
  const key = `daily_${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}`;
  const stored = JSON.parse(localStorage.getItem('tarot_daily') || 'null');
  let cardIndex, reversed, affIdx;
  if (stored && stored.date === key) {
    cardIndex = stored.cardIndex; reversed = stored.reversed;
    affIdx    = stored.affirmationIndex;
  } else {
    cardIndex = Math.floor(Math.random() * CARDS.length);
    reversed  = Math.random() < 0.3;
    affIdx    = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
    localStorage.setItem('tarot_daily', JSON.stringify({ date: key, cardIndex, reversed, affirmationIndex: affIdx }));
  }
  return {
    card: CARDS[cardIndex], cardIndex, reversed,
    affirmation: DAILY_AFFIRMATIONS[affIdx],
    dateStr: now.toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  };
}

let dailyShuffleRAF = null;
let currentDailyRole = null;

function renderDailyCard() {
  const { dateStr } = getDailyCard();
  const sec = document.getElementById('dailyCardSection');
  if (!sec) return;

  const titleEl = document.getElementById('dailyBarTitle');
  if (titleEl) titleEl.innerHTML = `✦ LÁ BÀI TRONG NGÀY <span class="daily-title-date">— ${dateStr}</span>`;

  // Phase 0: lá bài + grid nút vị trí
  sec.innerHTML = `
    <div class="daily-phase" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding-bottom:8px">
      <div class="daily-card-wrap" id="dailyWrap">
        <div class="daily-card" id="dailyCardEl">
          <div class="daily-card-back"><img src="cards/mat-sau.jpg" alt="mặt sau"></div>
          <div class="daily-card-front"></div>
        </div>
      </div>
      <div style="font-family:var(--font-display);font-size:1rem;font-weight:300;color:var(--gold);letter-spacing:0.16em;text-align:center;opacity:0.9;">✦ CHỌN VỊ TRÍ CỦA BẠN ✦</div>
      <div class="daily-role-grid" id="dailyRoleGrid">
        ${DAILY_ROLES.map(r => `<button class="daily-role-btn" data-role="${r.key}">${r.label}</button>`).join('')}
      </div>
    </div>`;

  document.getElementById('dailyRoleGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.daily-role-btn');
    if (!btn) return;
    document.querySelectorAll('.daily-role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDailyRole = btn.dataset.role;
    setTimeout(() => {
      if (dailyShuffleRAF) { cancelAnimationFrame(dailyShuffleRAF); dailyShuffleRAF = null; }
      showDailyShuffle(sec);
    }, 200);
  });
}

function showDailyShuffle(sec) {
  sec.classList.add('has-bg');
  sec.innerHTML = `
    <div class="daily-phase daily-shuffle-inline">
      <div class="daily-shuffle-title">✦ XÁO BÀI ✦</div>
      <canvas id="dailyShuffleCanvas" width="340" height="200"></canvas>
      <div class="daily-shuffle-label" id="dailyShuffleLabel">Di chuyển tay qua bộ bài để xáo</div>
      <div class="daily-shuffle-bar-wrap"><div id="dailyShuffleBar"></div></div>
      <div class="daily-shuffle-hint">← di chuyển qua lại →</div>
    </div>`;

  initDailyShuffleCanvas(() => {
    if (dailyShuffleRAF) { cancelAnimationFrame(dailyShuffleRAF); dailyShuffleRAF = null; }
    showDailyFan(sec);
  });
}

function showDailyFan(sec) {
  sec.innerHTML = `
    <div class="daily-phase daily-fan-wrap">
      <div class="daily-fan-hint">✦ Tập trung · Chọn lá bài bạn cảm nhận được ✦</div>
      <div id="dailyDeckRows"></div>
    </div>`;

  const { reversed: reversedToday } = getDailyCard();
  const container = document.getElementById('dailyDeckRows');
  const deck = [...CARDS].sort(() => Math.random() - 0.5);
  const N = deck.length;

  const CARD_W = 62, CARD_H = 100;
  const ROWS = 3;
  const perRow = Math.ceil(N / ROWS); // 26 lá/hàng cho 78 lá
  const containerW = sec.offsetWidth - 32 || 640;
  // Tính overlap để vừa container
  const OVERLAP = Math.max(30, CARD_W - Math.floor((containerW - CARD_W) / (perRow - 1)));
  const rowWidth = CARD_W + (perRow - 1) * (CARD_W - OVERLAP);

  // Chia thành các hàng
  const rows = [];
  for (let i = 0; i < N; i += perRow) rows.push(deck.slice(i, i + perRow));

  // Một container phẳng duy nhất — tất cả lá dùng position:absolute
  // nên z-index xuyên suốt, không bị chặn bởi stacking context của từng hàng
  const totalH = ROWS * CARD_H + (ROWS - 1) * 8;
  const maxRowW = CARD_W + (perRow - 1) * (CARD_W - OVERLAP);
  container.style.cssText = `position:relative;height:${totalH}px;width:${maxRowW}px;margin:0 auto;`;

  let globalIdx = 0;
  rows.forEach((rowCards, rowIdx) => {
    const thisRowW = CARD_W + (rowCards.length - 1) * (CARD_W - OVERLAP);
    const offsetX = Math.round((maxRowW - thisRowW) / 2); // căn giữa hàng ngắn
    const topY = rowIdx * (CARD_H + 8);

    rowCards.forEach((card, j) => {
      const imgSrc = CARD_IMAGES[card.id] || 'cards/mat-sau.jpg';
      const baseZ = globalIdx;
      const slot = document.createElement('div');
      slot.className = 'deck-card daily-fan-card';
      slot.style.cssText = `
        position:absolute;
        left:${offsetX + j*(CARD_W-OVERLAP)}px;
        top:${topY}px;
        width:${CARD_W}px; height:${CARD_H}px;
        z-index:${baseZ}; cursor:pointer;
        animation:cardDeal 0.3s ease both; animation-delay:${globalIdx*8}ms;
      `;
      slot.innerHTML = `
        <div class="deck-card-inner">
          <div class="deck-card-back"><img src="cards/mat-sau.jpg" alt="mặt sau"></div>
          <div class="deck-card-front"><img src="${imgSrc}" alt="${card.nameVi}" style="${reversedToday?'transform:rotate(180deg);':''}"></div>
        </div>`;
      slot.addEventListener('mouseenter', () => {
        if (!slot.classList.contains('selected-card')) {
          slot.style.zIndex = 9000;
          slot.style.transform = 'translateY(-14px)';
          slot.style.filter = 'brightness(1.4) drop-shadow(0 0 9px rgba(212,169,67,0.9))';
        }
      });
      slot.addEventListener('mouseleave', () => {
        if (!slot.classList.contains('selected-card')) {
          slot.style.zIndex = baseZ;
          slot.style.transform = '';
          slot.style.filter = '';
        }
      });
      slot.addEventListener('click', () => {
        slot.style.zIndex = 10000;
        slot.style.transform = 'translateY(-20px)';
        slot.style.filter = 'drop-shadow(0 0 18px rgba(212,169,67,1))';
        slot.style.transition = 'transform 0.3s ease, filter 0.3s ease';
        setTimeout(() => onDailyCardPick(sec, slot, card, reversedToday, imgSrc), 320);
      });
      container.appendChild(slot);
      globalIdx++;
    });
  });
}

function onDailyCardPick(sec, slot, card, reversed, imgSrc) {
  slot.classList.add('selected-card');

  // Dim tất cả lá khác ngay lập tức
  document.querySelectorAll('.daily-fan-card:not(.selected-card)').forEach(s => {
    s.style.transition = 'opacity 0.4s ease';
    s.style.opacity = '0.15';
    s.style.pointerEvents = 'none';
  });

  // Lật chậm sau 100ms (lá đã nổi lên)
  setTimeout(() => {
    // Override transition của deck-card-inner để lật chậm hơn
    const inner = slot.querySelector('.deck-card-inner');
    if (inner) inner.style.transition = 'transform 1.1s cubic-bezier(0.4,0,0.2,1)';
    slot.classList.add('flipped');
    spawnParticles(slot);
  }, 100);

  // Chuyển sang kết quả sau khi lật xong
  setTimeout(() => showDailyResult(sec, card, reversed, imgSrc), 1600);
}

function showDailyResult(sec, card, reversed, imgSrc) {
  const roleData = currentDailyRole && ROLE_READINGS[currentDailyRole];
  const roleEntry = roleData ? roleData[card.id] : null;
  const meaning = roleEntry
    ? (reversed ? roleEntry.r : roleEntry.u)
    : (reversed ? card.reversed : card.upright);

  sec.innerHTML = `
    <div class="daily-result-content" id="dailyResultContent" style="display:flex;flex-direction:column;align-items:center">
    <canvas id="dailySmokeCanvas"></canvas>
      <div class="daily-phase daily-layout-mini" style="margin-bottom:0;padding-bottom:0;width:100%">
        <div class="daily-card-wrap" id="dailyWrap">
          <div class="daily-card flipped" id="dailyCardEl">
            <div class="daily-card-back"><img src="cards/mat-sau.jpg" alt="mặt sau"></div>
            <div class="daily-card-front">
              <div class="card-img-wrap">
                <img src="${imgSrc}" alt="${card.nameVi}" class="${reversed?'reversed-img':''}"
                  onerror="this.src='cards/mat-sau.jpg'">
              </div>
              <div class="daily-card-name">${card.nameVi}${reversed?' ↓':''}</div>
            </div>
          </div>
        </div>
        <div class="daily-info" id="dailyInfo" style="animation:fadeInUp 0.6s ease">
          ${currentDailyRole ? `<div style="font-family:var(--font-display);font-size:0.875rem;font-weight:300;letter-spacing:0.12em;color:var(--gold);opacity:0.9;margin-bottom:16px;">✦ ${(DAILY_ROLES.find(r => r.key === currentDailyRole) || {}).label || currentDailyRole} ✦</div>` : ''}
          <div class="daily-card-title">
            <span class="daily-numeral">${card.numeral}</span>
            <span class="daily-name">${card.name} · ${card.nameVi}</span>
            ${reversed ? '<span class="reversed-badge">↓ Ngược</span>' : ''}
          </div>
          <div class="daily-affirmation">
            <p class="affirmation-text"><strong>Tổng quan:</strong> ${meaning}</p>
          </div>
        </div>
      </div>
      <div class="daily-candle-wrap" id="dailyCandleWrap">
        <div class="daily-candle-stage">
          <svg id="dailyCandleSVG" width="140" height="180" viewBox="0 0 280 360" style="display:block;width:140px;height:180px;">
            <defs>
              <radialGradient id="dcHalo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffcf85" stop-opacity="0.5"/>
                <stop offset="40%" stop-color="#ff9b3a" stop-opacity="0.22"/>
                <stop offset="100%" stop-color="#ff7a00" stop-opacity="0"/>
              </radialGradient>
              <linearGradient id="dcBodyG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#cdbd9a"/>
                <stop offset="14%" stop-color="#f3ead2"/>
                <stop offset="42%" stop-color="#fdf8ec"/>
                <stop offset="70%" stop-color="#f0e6cd"/>
                <stop offset="100%" stop-color="#c4b491"/>
              </linearGradient>
              <linearGradient id="dcBodyShade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
                <stop offset="78%" stop-color="#ffffff" stop-opacity="0"/>
                <stop offset="100%" stop-color="#8f8164" stop-opacity="0.5"/>
              </linearGradient>
              <radialGradient id="dcTopG" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stop-color="#d8c9a6"/>
                <stop offset="60%" stop-color="#efe6cd"/>
                <stop offset="100%" stop-color="#f7f0dd"/>
              </radialGradient>
              <radialGradient id="dcWellG" cx="50%" cy="40%" r="65%">
                <stop offset="0%" stop-color="#bba978"/>
                <stop offset="55%" stop-color="#d3c5a0"/>
                <stop offset="100%" stop-color="#e4d7b3"/>
              </radialGradient>
              <linearGradient id="dcFlameOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffe9a8"/>
                <stop offset="45%" stop-color="#ffae2e"/>
                <stop offset="100%" stop-color="#e8740c"/>
              </linearGradient>
              <linearGradient id="dcFlameIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fff6d8"/>
                <stop offset="100%" stop-color="#ffc24a"/>
              </linearGradient>
            </defs>
            <ellipse id="dcHaloEl" cx="140" cy="200" rx="120" ry="110" fill="url(#dcHalo)"/>
            <g id="dcSmoke" opacity="0">
              <path d="M140 0 C133 -22 148 -34 140 -55 C132 -74 148 -86 140 -107" fill="none" stroke="#d2d2d2" stroke-width="5" stroke-linecap="round"/>
              <path d="M140 0 C148 -20 132 -33 142 -53 C150 -72 134 -84 144 -105" fill="none" stroke="#aaaaaa" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>
            </g>
            <ellipse cx="140" cy="332" rx="78" ry="13" fill="#000" opacity="0.4"/>
            <rect x="62" y="214" width="156" height="118" fill="url(#dcBodyG)"/>
            <rect x="62" y="214" width="156" height="118" fill="url(#dcBodyShade)"/>
            <ellipse cx="140" cy="332" rx="78" ry="15" fill="#e9ddbf"/>
            <ellipse cx="140" cy="332" rx="78" ry="15" fill="#000" opacity="0.06"/>
            <rect x="78" y="220" width="20" height="106" rx="10" fill="#ffffff" opacity="0.4"/>
            <ellipse cx="140" cy="214" rx="78" ry="20" fill="url(#dcTopG)"/>
            <ellipse cx="140" cy="216" rx="50" ry="12" fill="#bdac87"/>
            <ellipse cx="140" cy="215" rx="50" ry="12" fill="url(#dcWellG)"/>
            <ellipse cx="140" cy="214" rx="34" ry="8" fill="#cbb98c"/>
            <ellipse cx="140" cy="213.5" rx="34" ry="7.5" fill="#b9a876"/>
            <path id="dcWick" d="M140 212 C139 205 141 200 140 194" fill="none" stroke="#241c14" stroke-width="3.4" stroke-linecap="round"/>
            <g id="dcFlame">
              <ellipse cx="140" cy="180" rx="30" ry="46" fill="url(#dcHalo)" opacity="0.85"/>
              <path id="dcFout" d="M140 132 C162 156 160 188 140 198 C120 188 118 156 140 132 Z" fill="url(#dcFlameOut)"/>
              <path id="dcFin" d="M140 152 C152 166 151 186 140 196 C129 186 128 166 140 152 Z" fill="url(#dcFlameIn)"/>
              <path id="dcFblue" d="M140 178 C148 184 148 196 140 202 C132 196 132 184 140 178 Z" fill="#5e8bff" opacity="0.85"/>
              <ellipse id="dcFcore" cx="140" cy="172" rx="3" ry="8" fill="#fffdf3"/>
            </g>
          </svg>
        </div>
        <div class="daily-candle-progress">
          <div class="daily-candle-track"><div class="daily-candle-bar" id="dailyCandleBar"></div></div>
          <span class="daily-candle-timer" id="dailyCandleTimer">1:00</span>
        </div>
      </div>
    </div>
    <div class="daily-work-now" id="dailyWorkNow">
      <div class="daily-work-now-text">Làm việc ngay !</div>
      <img src="leader.png" alt="Leader" style="width:100%;max-width:480px;display:block;margin:12px auto 0;border-radius:12px;">
    </div>`;

  spawnParticles(document.getElementById('dailyWrap'));
  triggerAffirmationBurst();
  startDailyCandle();
}

function startDailyCandle() {
  const DURATION   = 60000;
  const FLAME_OUT  = 800;   // ms để lửa tắt
  const SMOKE_FILL = 3500;  // ms khói bao trùm toàn khung

  const flame   = document.getElementById('dcFlame');
  const fout    = document.getElementById('dcFout');
  const fin     = document.getElementById('dcFin');
  const fblue   = document.getElementById('dcFblue');
  const fcore   = document.getElementById('dcFcore');
  const halo    = document.getElementById('dcHaloEl');
  const wick    = document.getElementById('dcWick');
  const bar     = document.getElementById('dailyCandleBar');
  const timer   = document.getElementById('dailyCandleTimer');
  const content = document.getElementById('dailyResultContent');
  const workNow = document.getElementById('dailyWorkNow');
  const smokeCanvas = document.getElementById('dailySmokeCanvas');

  if (!flame || !smokeCanvas) return;

  // Khớp kích thước canvas với container
  function resizeCanvas() {
    smokeCanvas.width  = content.offsetWidth  || 600;
    smokeCanvas.height = content.offsetHeight || 300;
  }
  resizeCanvas();
  const ctx = smokeCanvas.getContext('2d');

  function flamePath(topY, w, lean) {
    const cx = 140, l = cx + lean, base = topY + 66;
    return 'M' + l + ' ' + topY +
      ' C' + (cx+w) + ' ' + (topY+26) + ' ' + (cx+w*0.82) + ' ' + (base-8) + ' ' + cx + ' ' + base +
      ' C' + (cx-w*0.82) + ' ' + (base-8) + ' ' + (cx-w) + ' ' + (topY+26) + ' ' + l + ' ' + topY + ' Z';
  }
  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    return m + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60);
  }

  // ── Smoke particle system ──
  const particles = [];
  function spawnSmokePuff(progress) {
    const W = smokeCanvas.width, H = smokeCanvas.height;
    // Xuất phát từ vị trí nến (bottom-center của canvas)
    const originX = W / 2;
    const originY = H;           // bắt từ đáy canvas (ngay chỗ nến)
    const spread  = progress;    // 0→1: lan rộng dần theo progress

    // Số puff mỗi frame tăng dần
    const count = Math.floor(2 + progress * 8);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (0.6 + spread * 1.2);
      const speed = 0.4 + Math.random() * 1.2 + spread * 2;
      const size  = 30 + Math.random() * 80 + progress * 160;
      particles.push({
        x: originX + (Math.random() - 0.5) * 40,
        y: originY - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size,
        maxSize: size * (1.8 + Math.random()),
        life: 0,
        maxLife: 80 + Math.random() * 60,
        alpha: 0.18 + Math.random() * 0.22,
      });
    }
  }

  function updateSmoke() {
    ctx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.012; // lơ lửng lên nhẹ
      p.vx += (Math.random() - 0.5) * 0.08;
      p.size = Math.min(p.maxSize, p.size + 1.2);
      p.life++;
      if (p.life > p.maxLife) { particles.splice(i, 1); continue; }

      const t = p.life / p.maxLife;
      // fade in rồi fade out
      const alpha = p.alpha * (t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0,   `rgba(30,30,30,${(alpha * 0.95).toFixed(3)})`);
      grad.addColorStop(0.4, `rgba(15,15,15,${(alpha * 0.65).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(5,5,5,0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // ── Main loop ──
  let start    = null;
  let phase    = 'burn';   // 'burn' | 'flameout' | 'smokefill'
  let phaseStart = 0;
  let smokeDone  = false;

  function loop(now) {
    if (start === null) start = now;
    const t = now - start;
    const remaining = DURATION - t;

    if (phase === 'burn') {
      const prog  = Math.min(1, t / DURATION);
      const lean  = Math.sin(t / 150) * 5 + Math.sin(t / 61) * 2.2;
      const topY  = 132 + Math.sin(t / 90) * 5;
      const w     = 22 + Math.sin(t / 110) * 2;
      const flick = 0.9 + Math.sin(t / 38) * 0.07 + Math.sin(t / 19) * 0.03;

      fout.setAttribute('d', flamePath(topY, w, lean));
      fin.setAttribute('d',  flamePath(topY + 20, w * 0.55, lean * 0.8));
      fblue.setAttribute('transform', 'translate(' + (lean * 0.6).toFixed(2) + ',0)');
      fcore.setAttribute('cx', 140 + lean * 0.7);
      fcore.setAttribute('cy', topY + 40);
      flame.style.opacity = flick.toFixed(3);
      halo.setAttribute('opacity', (0.7 + Math.sin(t / 120) * 0.18).toFixed(2));

      bar.style.width    = (100 * (1 - prog)).toFixed(1) + '%';
      timer.textContent  = fmt(remaining);

      if (t >= DURATION) {
        phase = 'flameout';
        phaseStart = t;
        bar.style.width   = '0%';
        timer.textContent = '0:00';
        wick.setAttribute('stroke', '#d97a2a');
      }

    } else if (phase === 'flameout') {
      const e  = (t - phaseStart) / FLAME_OUT;
      const sh = Math.max(0, 1 - e);
      const jit = Math.sin(t / 26) * 6 * sh;

      flame.setAttribute('transform',
        'translate(' + jit.toFixed(1) + ',' + (e * 12).toFixed(1) + ')' +
        ' scale(' + (1 - e * 0.3).toFixed(3) + ',' + Math.max(0.02, sh).toFixed(3) + ')');
      flame.style.opacity = Math.max(0, sh - 0.05).toFixed(2);
      halo.setAttribute('opacity', (0.6 * sh).toFixed(2));

      if (e >= 1) {
        flame.style.opacity = '0';
        halo.setAttribute('opacity', '0');
        // resize canvas sau khi layout ổn định
        resizeCanvas();
        phase = 'smokefill';
        phaseStart = t;
      }

    } else if (phase === 'smokefill') {
      const elapsed  = t - phaseStart;
      const progress = Math.min(1, elapsed / SMOKE_FILL);

      // Sinh puff liên tục, nhiều hơn ở cuối
      if (Math.random() < 0.6 + progress * 0.4) spawnSmokePuff(progress);

      updateSmoke();

      // Khi khói bao trùm ~70%: fade content xuống
      if (progress > 0.55 && !smokeDone) {
        smokeDone = true;
        content.style.transition = 'opacity 1.4s ease';
        content.style.opacity    = '0';
      }

      if (progress >= 1) {
        // Xóa canvas khói, hiện "Làm việc ngay"
        setTimeout(() => {
          ctx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
          const wrap = document.getElementById('dailyCandleWrap');
          if (wrap) wrap.style.display = 'none';
          content.style.display = 'none';
          workNow.classList.add('show');
        }, 400);
        return; // dừng RAF
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

function initDailyShuffleCanvas(onDone) {
  const canvas = document.getElementById('dailyShuffleCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2 + 8;
  const CW = 52, CH = 84;
  const TOTAL = 14;
  const SWIPE_NEEDED = 4;

  const LABELS = [
    'Di chuyển tay qua bộ bài để xáo',
    'Tốt lắm! Tiếp tục...',
    'Năng lượng đang hoà quyện...',
    'Gần xong rồi...',
    '✦ Bộ bài đã sẵn sàng ✦',
  ];

  const backImg = new Image();
  backImg.src = 'cards/mat-sau.jpg';

  function makeStack() {
    return Array.from({length: TOTAL}, (_, i) => ({
      x: cx + (Math.random() - 0.5) * 2,
      y: cy + (TOTAL - 1 - i) * 0.8,
      angle: (Math.random() - 0.5) * 0.06,
      tx: cx, ty: cy, ta: 0,
      vx: 0, vy: 0, va: 0,
      z: i,
    }));
  }

  let cards = makeStack();
  let swipeCount = 0, lastX = 0, dirChanges = 0, prevDir = 0, trail = [];

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onMove(e) {
    if (swipeCount >= SWIPE_NEEDED) return;
    e.preventDefault();
    const p = getPos(e);
    const dx = p.x - lastX;
    lastX = p.x;
    if (Math.abs(dx) < 1) return;

    trail.push({ x: p.x, y: p.y, age: 0 });

    cards.forEach((c, i) => {
      const depth = i / TOTAL;
      c.va += dx * 0.018 * (0.3 + depth * 0.7) + (Math.random() - 0.5) * 0.01;
      c.vx += dx * 0.06 * depth;
      c.vy += (Math.random() - 0.5) * 1.2 * depth;
    });

    const dir = dx > 2 ? 1 : dx < -2 ? -1 : 0;
    if (dir !== 0 && dir !== prevDir) {
      dirChanges++;
      prevDir = dir;
      if (dirChanges % 2 === 0 && swipeCount < SWIPE_NEEDED) {
        swipeCount++;
        document.getElementById('dailyShuffleBar').style.width = (swipeCount / SWIPE_NEEDED * 100) + '%';
        document.getElementById('dailyShuffleLabel').textContent = LABELS[Math.min(swipeCount, LABELS.length - 1)];
        cards.forEach((c, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          c.vx += side * (4 + Math.random() * 8);
          c.vy -= (2 + Math.random() * 6);
          c.va += side * (0.05 + Math.random() * 0.15);
        });
        if (swipeCount >= SWIPE_NEEDED) {
          canvas.removeEventListener('mousemove', onMove);
          canvas.removeEventListener('touchmove', onMove);
          setTimeout(onDone, 700);
        }
      }
    }
  }

  canvas.addEventListener('mousemove', onMove, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });

  function drawCard(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.shadowColor = 'rgba(212,169,67,0.35)';
    ctx.shadowBlur = 10;
    if (backImg.complete && backImg.naturalWidth) {
      const r = 5;
      ctx.beginPath();
      ctx.moveTo(-CW/2+r, -CH/2);
      ctx.lineTo(CW/2-r, -CH/2); ctx.arcTo(CW/2, -CH/2, CW/2, -CH/2+r, r);
      ctx.lineTo(CW/2, CH/2-r);  ctx.arcTo(CW/2, CH/2, CW/2-r, CH/2, r);
      ctx.lineTo(-CW/2+r, CH/2); ctx.arcTo(-CW/2, CH/2, -CW/2, CH/2-r, r);
      ctx.lineTo(-CW/2, -CH/2+r);ctx.arcTo(-CW/2, -CH/2, -CW/2+r, -CH/2, r);
      ctx.closePath(); ctx.clip();
      ctx.drawImage(backImg, -CW/2, -CH/2, CW, CH);
    } else {
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(-CW/2, -CH/2, CW, CH);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(212,169,67,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-CW/2, -CH/2, CW, CH);
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    trail = trail.filter(t => { t.age++; return t.age < 18; });
    trail.forEach(t => {
      const a = Math.max(0, 1 - t.age / 18);
      ctx.beginPath();
      ctx.arc(t.x, t.y, 5 * a, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,169,67,${a * 0.5})`;
      ctx.fill();
    });
    cards.forEach(c => {
      c.va += (c.ta - c.angle) * 0.04;
      c.vx += (c.tx - c.x) * 0.03;
      c.vy += (c.ty - c.y) * 0.03;
      c.va *= 0.84; c.vx *= 0.80; c.vy *= 0.80;
      c.x += c.vx; c.y += c.vy; c.angle += c.va;
    });
    [...cards].sort((a, b) => a.z - b.z).forEach(drawCard);
    const grd = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80);
    grd.addColorStop(0, 'rgba(212,169,67,0.07)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    dailyShuffleRAF = requestAnimationFrame(tick);
  }

  tick();
}

function triggerAffirmationBurst() {
  const el = document.querySelector('.affirmation-text');
  if (!el) return;
  el.classList.remove('burst');
  void el.offsetWidth; // reflow để reset animation
  el.classList.add('burst');
  spawnAffirmationSmoke(el);
}

function spawnAffirmationSmoke(el) {
  // Dùng khung .daily-affirmation làm container để khói bao phủ toàn bộ khung
  const box = el.closest('.daily-affirmation') || el.parentElement;
  box.style.position = 'relative';
  box.style.overflow = 'visible';
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  const count = 28;
  for (let i = 0; i < count; i++) {
    const puff = document.createElement('div');
    puff.className = 'smoke-puff';
    const size = 40 + Math.random() * 70;
    // Xuất phát rải khắp khung, không chỉ tâm chữ
    const ox = Math.random() * w;
    const oy = Math.random() * h;
    const sx = (Math.random() - 0.5) * 120;
    const delay = Math.random() * 0.5;
    const dur = 1.2 + Math.random() * 0.9;
    puff.style.cssText = `
      width:${size}px; height:${size}px;
      left:${ox - size/2}px;
      top:${oy - size/2}px;
      --sx:${sx}px; --sd:${dur}s;
      animation-delay:${delay}s;
    `;
    box.appendChild(puff);
    setTimeout(() => puff.remove(), (dur + delay + 0.15) * 1000);
  }
}
