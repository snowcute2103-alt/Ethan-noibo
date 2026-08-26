// Particle burst shared by the daily card and card gallery.
function spawnParticles(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#d4a943', '#f0d080', '#ffffff', '#a86ccc', '#7ec8ff'];

  for (let i = 0; i < 18; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = 3 + Math.random() * 5;
    particle.style.cssText = `width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random() * colors.length)]};left:${cx}px;top:${cy}px;`;
    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 100;
    particle.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px),calc(-50% + ${Math.sin(angle) * distance}px)) scale(0)`, opacity: 0 },
    ], {
      duration: 700 + Math.random() * 400,
      easing: 'ease-out',
    }).onfinish = () => particle.remove();
  }
}
