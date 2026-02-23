const opening = document.querySelector('.opening');
const body = document.body;
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
const designScreen = document.querySelector('.design-screen');
const postHeader = document.querySelector('.post-layout__header');
const contentsCards = document.querySelectorAll('.contents-card');
const topicsBlock = document.querySelector('.topics-block');
const topicsItems = document.querySelectorAll('.topics-block__grid img');

let headerScrollBound = false;
let contentsRevealBound = false;
let topicsRevealBound = false;
let bgParallaxBound = false;

const setupPostHeaderScroll = () => {
  if (!designScreen || !postHeader || headerScrollBound) return;
  headerScrollBound = true;

  let lastTop = 0;
  const threshold = 4;

  designScreen.addEventListener(
    'scroll',
    () => {
      const currentTop = designScreen.scrollTop;

      if (currentTop <= 0) {
        postHeader.classList.remove('is-hidden');
        lastTop = 0;
        return;
      }

      if (currentTop > lastTop + threshold) {
        postHeader.classList.add('is-hidden');
      } else if (currentTop < lastTop - threshold) {
        postHeader.classList.remove('is-hidden');
      }

      lastTop = currentTop;
    },
    { passive: true }
  );
};

const setupContentsReveal = () => {
  if (!designScreen || !contentsCards.length || contentsRevealBound) return;
  contentsRevealBound = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targetsSelector =
    '.contents-card__back, .contents-card__title, .contents-card__image, .contents-card__text';

  if (reduced) {
    contentsCards.forEach((card) => {
      card.querySelectorAll(targetsSelector).forEach((el) => el.classList.add('is-in'));
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const steps = entry.target.querySelectorAll(targetsSelector);
        steps.forEach((el, i) => {
          window.setTimeout(() => {
            el.classList.add('is-in');
          }, i * 120);
        });

        observer.unobserve(entry.target);
      });
    },
    { root: designScreen, threshold: 0.2 }
  );

  contentsCards.forEach((card) => observer.observe(card));
};

const setupTopicsReveal = () => {
  if (!designScreen || !topicsBlock || !topicsItems.length || topicsRevealBound) return;
  topicsRevealBound = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    topicsItems.forEach((item) => item.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        topicsItems.forEach((item, i) => {
          window.setTimeout(() => {
            item.classList.add('is-in');
          }, i * 140);
        });

        observer.unobserve(entry.target);
      });
    },
    { root: designScreen, threshold: 0.2 }
  );

  observer.observe(topicsBlock);
};

const setupBackgroundParallax = () => {
  if (!designScreen || bgParallaxBound) return;
  bgParallaxBound = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  let targetX = 50;
  let targetY = 45;
  let currentX = 50;
  let currentY = 45;
  let targetAlpha = 0.18;
  let currentAlpha = 0.18;
  let targetVignette = 0.12;
  let currentVignette = 0.12;
  let rafId = 0;
  const startTime = performance.now();

  const animate = () => {
    const elapsed = (performance.now() - startTime) / 1000;
    const pulse = Math.sin(elapsed * 1.25);

    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    currentAlpha += (targetAlpha - currentAlpha) * 0.08;
    currentVignette += (targetVignette - currentVignette) * 0.08;

    const pulsedAlpha = currentAlpha + pulse * 0.018;
    const pulsedVignette = currentVignette + pulse * 0.012;

    designScreen.style.setProperty('--shade-pos-x', `${currentX.toFixed(2)}%`);
    designScreen.style.setProperty('--shade-pos-y', `${currentY.toFixed(2)}%`);
    designScreen.style.setProperty('--shade-alpha', `${pulsedAlpha.toFixed(3)}`);
    designScreen.style.setProperty('--shade-vignette', `${pulsedVignette.toFixed(3)}`);

    rafId = window.requestAnimationFrame(animate);
  };

  const onMove = (event) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = (event.clientX / w - 0.5) * 2;
    const ny = (event.clientY / h - 0.5) * 2;
    targetX = 50 + nx * 12;
    targetY = 45 + ny * 8;
    targetAlpha = 0.19 + (Math.abs(nx) + Math.abs(ny)) * 0.02;
    targetVignette = 0.13 + (Math.abs(nx) + Math.abs(ny)) * 0.015;
  };

  const onLeave = () => {
    targetX = 50;
    targetY = 45;
    targetAlpha = 0.18;
    targetVignette = 0.12;
  };

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseleave', onLeave, { passive: true });
  rafId = window.requestAnimationFrame(animate);

  window.addEventListener('beforeunload', () => {
    if (rafId) window.cancelAnimationFrame(rafId);
  });
};

const finishOpening = () => {
  if (!opening) return;
  opening.classList.add('is-finished');
  body.classList.remove('is-loading');
  body.classList.add('show-design');
  setupPostHeaderScroll();
  setupContentsReveal();
  setupTopicsReveal();
};

const runOpeningSequence = () => {
  if (!opening) {
    body.classList.remove('is-loading');
    return;
  }

  const sequence = [
    { stage: 'blank', duration: 500 },
    { stage: 'grow-x', duration: 1000 },
    { stage: 'image', duration: 1000 },
    { stage: 'full', duration: 1000 },
    { stage: 'overlay-fade', duration: 700 },
    { stage: 'overlay-image', duration: 800 },
    { stage: 'osa-fade-out', duration: 1000 },
    { stage: 'ippo-pop', duration: 1100 },
    { stage: 'ippo-hold', duration: 1000 },
    { stage: 'panel-rise', duration: 1000 },
    { stage: 'line1-show', duration: 260 },
    { stage: 'line1-grow', duration: 420 },
    { stage: 'line1-reveal', duration: 500 },
    { stage: 'line2-grow', duration: 420 },
    { stage: 'line2-reveal', duration: 560 },
    { stage: 'line2-hold', duration: 300 },
    { stage: 'logo-fade', duration: 620 },
    { stage: 'logo-hold', duration: 500 },
    { stage: 'outro', duration: 380 }
  ];

  let index = 0;

  const advance = () => {
    const current = sequence[index];
    opening.dataset.stage = current.stage;

    if (current.stage === 'outro') {
      window.setTimeout(finishOpening, current.duration);
      return;
    }

    index += 1;
    window.setTimeout(advance, current.duration);
  };

  advance();
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  finishOpening();
} else {
  runOpeningSequence();
}

if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, i * 80);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
