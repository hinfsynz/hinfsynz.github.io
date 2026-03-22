// ── Grid Comparison Slider ──
(function () {
  const slider   = document.getElementById('gcSlider');
  const range    = document.getElementById('gcRange');
  const newImg   = document.getElementById('gcNewImg');
  const dragLine = document.getElementById('gcDragLine');
  if (!slider) return;

  let pos = 50;          // current % position
  let target = 50;       // animation target %
  let animId = null;
  let isDragging = false;
  let autoPhase = 'toRight'; // phases: toRight | pauseRight | toLeft | pauseLeft
  let phaseTimer = null;

  // Easing: ease-in-out cubic
  function ease(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

  function setPos(p) {
    pos = Math.max(0, Math.min(100, p));
    newImg.style.clipPath   = `inset(0 0 0 ${pos}%)`;
    dragLine.style.left     = `${pos}%`;
    range.value             = pos;
  }

  // Smooth animate pos → target over ~duration ms
  function animateTo(dest, duration, onDone) {
    cancelAnimationFrame(animId);
    const start = pos;
    const diff  = dest - start;
    const t0    = performance.now();
    function step(now) {
      const raw = Math.min((now - t0) / duration, 1);
      setPos(start + diff * ease(raw));
      if (raw < 1) { animId = requestAnimationFrame(step); }
      else { setPos(dest); if (onDone) onDone(); }
    }
    animId = requestAnimationFrame(step);
  }

  function runAutoPhase() {
    if (isDragging) return;
    clearTimeout(phaseTimer);
    if (autoPhase === 'toRight') {
      animateTo(92, 3200, () => {
        autoPhase = 'pauseRight';
        phaseTimer = setTimeout(runAutoPhase, 2200); // pause 2.2s at right
      });
    } else if (autoPhase === 'pauseRight') {
      autoPhase = 'toLeft';
      runAutoPhase();
    } else if (autoPhase === 'toLeft') {
      animateTo(8, 3600, () => {
        autoPhase = 'pauseLeft';
        phaseTimer = setTimeout(runAutoPhase, 1000); // brief pause at left
      });
    } else if (autoPhase === 'pauseLeft') {
      autoPhase = 'toRight';
      runAutoPhase();
    }
  }

  // Manual drag via range input
  range.addEventListener('input', () => {
    isDragging = true;
    cancelAnimationFrame(animId);
    clearTimeout(phaseTimer);
    setPos(Number(range.value));
  });

  // Resume auto after user releases
  range.addEventListener('change', () => {
    isDragging = false;
    // pick nearest phase direction
    autoPhase = pos < 50 ? 'toRight' : 'toLeft';
    phaseTimer = setTimeout(runAutoPhase, 1800);
  });

  // Kick off
  setPos(50);
  phaseTimer = setTimeout(runAutoPhase, 800);
})();
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.12 }
);

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Nav background on scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.background = window.scrollY > 10
    ? 'rgba(255,255,255,0.92)'
    : 'rgba(255,255,255,0.72)';
});

// Mobile menu toggle
const menuBtn = document.getElementById('navMenuBtn');
const navLinks = document.querySelector('.nav-links');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}
