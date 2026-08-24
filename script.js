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
const navLinksEl = document.querySelector('.nav-links');
if (menuBtn && navLinksEl) {
  menuBtn.addEventListener('click', () => {
    navLinksEl.classList.toggle('open');
  });
  // Close menu on link click
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinksEl.classList.remove('open'));
  });
}

// ── Animated tab switcher ──────────────────────────────────────────
(function () {
  const tabs    = document.querySelectorAll('.nav-tab');
  const pill    = document.getElementById('navTabPill');
  const tabWrap = document.querySelector('.nav-tabs');
  if (!tabs.length || !pill || !tabWrap) return;

  // Move the pill to sit behind the given tab button
  function movePill(tab) {
    const wrapRect = tabWrap.getBoundingClientRect();
    const tabRect  = tab.getBoundingClientRect();
    pill.style.width     = tabRect.width  + 'px';
    pill.style.transform = `translateX(${tabRect.left - wrapRect.left - 3}px)`;
  }

  // Mark active state + move pill, without navigating
  function activate(tab) {
    tabs.forEach(t => {
      t.classList.remove('nav-tab-active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('nav-tab-active');
    tab.setAttribute('aria-selected', 'true');
    movePill(tab);
  }

  // Determine which tab matches the current page
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  let initialTab = tabs[0];
  tabs.forEach(tab => {
    const href = tab.dataset.href || '';
    if (href.includes('ai-leadership-compass') && currentFile === 'index.html' &&
        window.location.pathname.includes('ai-leadership-compass')) {
      initialTab = tab;
    }
    if (!href.includes('ai-leadership-compass') && !window.location.pathname.includes('ai-leadership-compass')) {
      initialTab = tab;
    }
  });

  // Set initial pill position after fonts/layout settle
  requestAnimationFrame(() => {
    // Disable transition for the initial snap
    pill.style.transition = 'none';
    activate(initialTab);
    // Re-enable transition on next frame
    requestAnimationFrame(() => {
      pill.style.transition = '';
    });
  });

  // Click: animate pill then navigate
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activate(tab);
      const href = tab.dataset.href;
      if (href) {
        // Small delay so the pill animation is visible before navigation
        setTimeout(() => { window.location.href = href; }, 220);
      }
    });
  });

  // Keep pill sized correctly on resize
  window.addEventListener('resize', () => {
    const active = document.querySelector('.nav-tab-active');
    if (active) movePill(active);
  });
})();

// ── Nav links animated pill ────────────────────────────────────────
(function () {
  const pill     = document.getElementById('navLinksPill');
  const linkList = document.getElementById('navLinks');
  if (!pill || !linkList) return;

  const links = Array.from(linkList.querySelectorAll('a'));

  // Move pill behind a given anchor element
  function movePillTo(anchor) {
    const listRect   = linkList.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    pill.style.width     = anchorRect.width  + 'px';
    pill.style.transform = `translateY(-50%) translateX(${anchorRect.left - listRect.left}px)`;
  }

  // Activate a link: show pill, move it, swap active class
  function activateLink(anchor) {
    links.forEach(a => a.classList.remove('nav-link-active'));
    anchor.classList.add('nav-link-active');
    pill.classList.add('visible');
    movePillTo(anchor);
  }

  // Click handler — activates immediately on user click
  links.forEach(a => {
    a.addEventListener('click', () => activateLink(a));
  });

  // Any anchor anywhere on the page that points to a nav section
  // (e.g. "Explore ↓", hero-nav-labels, footer links) also triggers the pill.
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor || linkList.contains(anchor)) return; // skip nav links (already handled above)
    const target = anchor.getAttribute('href');
    const match  = links.find(a => a.getAttribute('href') === target);
    if (match) activateLink(match);
  });

  // Scroll-spy: track which section is in view and update pill accordingly.
  // Only kicks in after the user has clicked at least once (pill is visible).
  const sectionIds = links
    .map(a => a.getAttribute('href').replace('#', ''))
    .filter(id => id && document.getElementById(id));

  const sectionEls = sectionIds.map(id => document.getElementById(id));

  const spy = new IntersectionObserver(
    (entries) => {
      if (!pill.classList.contains('visible')) return; // wait for first click
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const anchor = links.find(a => a.getAttribute('href') === '#' + id);
          if (anchor) activateLink(anchor);
        }
      });
    },
    { threshold: 0.35 }
  );

  sectionEls.forEach(el => spy.observe(el));

  // Keep pill geometry correct on resize
  window.addEventListener('resize', () => {
    const active = linkList.querySelector('.nav-link-active');
    if (active) movePillTo(active);
  });
})();

// ── Hero nav labels: energized by the power grid animation ────────
(function () {
  // Helper to get the current label elements — they are recreated on resize
  function getLabels() {
    return Array.from(document.querySelectorAll('#hero-nav-overlay .hero-nav-label'));
  }

  let allEnergized = false;

  // Energize all labels once (gray → blue), with a staggered strike wave.
  // After this runs, all further grid events are ignored.
  function energizeAll() {
    if (allEnergized) return;
    allEnergized = true;
    getLabels().forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('label-energized', 'label-struck');
        setTimeout(() => el.classList.remove('label-struck'), 400);
      }, i * 70);
    });
  }

  // Only the first burst matters — after that labels stay lit and static
  document.addEventListener('grid:burst',      () => energizeAll());
  document.addEventListener('grid:nodeStruck', () => energizeAll());
})();
