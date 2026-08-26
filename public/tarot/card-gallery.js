function openAllCards() {
  const modal = document.getElementById('allCardsModal');
  const grid  = document.getElementById('allCardsGrid');
  if (!grid.hasChildNodes()) {
    CARDS.forEach(card => {
      const imgSrc = CARD_IMAGES[card.id] || 'cards/mat-sau.jpg';
      const thumb = document.createElement('div');
      thumb.className = 'card-thumb';
      thumb.tabIndex = 0;
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', `Xem chi tiết ${card.nameVi}`);
      thumb.style.cursor = 'pointer';
      thumb.innerHTML = `
        <img src="${imgSrc}" alt="${card.nameVi}" loading="lazy">
        <span class="card-thumb-name">${card.numeral} · ${card.nameVi}</span>
        <span class="card-thumb-nameEn">${card.name}</span>
      `;
      thumb.addEventListener('click', () => openCardDetail(card));
      thumb.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCardDetail(card);
        }
      });
      grid.appendChild(thumb);
    });
  }
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAllCards() {
  document.getElementById('allCardsModal').classList.remove('open');
  document.body.style.overflow = '';
}

function openCardDetail(card) {
  const imgSrc = CARD_IMAGES[card.id] || 'cards/mat-sau.jpg';
  const backSrc = 'cards/mat-sau.jpg';
  const d = card.details || {};
  const rows = [
    { icon: '💛', label: 'Tình yêu',   text: d.love },
    { icon: '💼', label: 'Sự nghiệp',  text: d.career },
    { icon: '🌿', label: 'Sức khỏe',   text: d.health },
    { icon: '✨', label: 'Tâm linh',   text: d.spirit },
  ].filter(r => r.text);

  document.getElementById('cardDetailBody').innerHTML = `
    <div class="cd-header">
      <div class="cd-flip-wrap">
        <div class="cd-flipper" id="cdFlipper">
          <div class="cd-flip-back"><img src="${backSrc}" alt="back"></div>
          <div class="cd-flip-front"><img src="${imgSrc}" alt="${card.nameVi}"></div>
        </div>
      </div>
      <div class="cd-meta cd-meta-hidden" id="cdMeta">
        <div class="cd-numeral">${card.numeral}</div>
        <div class="cd-name">${card.nameVi}</div>
        <div class="cd-name-en">${card.name}</div>
        <p class="cd-meaning">${card.upright}</p>
      </div>
    </div>
    <div class="cd-content-hidden" id="cdContent">
      ${rows.length ? `
        <hr class="cd-divider">
        <div class="cd-section-title">✦ Chi tiết theo chủ đề</div>
        <div class="cd-details-grid">
          ${rows.map(r => `
            <div class="cd-detail-row">
              <span class="cd-detail-icon">${r.icon}</span>
              <span class="cd-detail-label">${r.label}</span>
              <span class="cd-detail-text">${r.text}</span>
            </div>`).join('')}
        </div>` : ''}
      ${d.advice ? `<div class="cd-advice">"${d.advice}"</div>` : ''}
      <hr class="cd-divider">
      <div class="cd-reversed-block">
        <div class="cd-reversed-label">↓ KHI LÁ NGƯỢC</div>
        <div class="cd-reversed-text">${card.reversed}</div>
      </div>
    </div>
  `;

  document.getElementById('cardDetailModal').classList.add('open');

  // Lật sau 0.55s (đủ để modal hiện + mắt kịp nhìn vào lưng bài)
  setTimeout(() => {
    const flipper = document.getElementById('cdFlipper');
    flipper.classList.add('flipped');
    spawnParticles(flipper);

    // Tên + thông điệp hiện ra sau khi lật xong (~0.85s)
    setTimeout(() => {
      document.getElementById('cdMeta').classList.add('visible');
      setTimeout(() => {
        document.getElementById('cdContent').classList.add('visible');
      }, 200);
    }, 700);
  }, 550);
}

function closeCardDetail() {
  document.getElementById('cardDetailModal').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', renderDailyCard);
