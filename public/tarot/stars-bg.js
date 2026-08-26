// ══════════════════════════════════════════════════════
//  Stars
// ══════════════════════════════════════════════════════
(function () {
  const c = document.getElementById('stars');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2.5 + 0.5;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;animation-delay:${Math.random()*5}s;`;
    c.appendChild(s);
  }
})();
