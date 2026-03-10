const opening = document.querySelector('.opening');
const openingFrame = document.querySelector('.opening__frame');
const openingBgFade = document.querySelector('.opening__bgfade');
let openingBgFadeMid = null;
let openingUiController = null;
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
let openingBgFadeTimerIds = [];
let currentOpeningBg = 'img/fv01.png';
let openingSequenceController = null;

const OPENING_BG_FADE_STAGES = {
  'line1-show': 'img/50build.jpg?v=20260310-3',
  'line2-pause': 'img/tateyama.jpg'
};
const STAGE_BG_BLUR = {
  'osa-fade-out': 10,
  'ippo-pop': 10
};

const clearOpeningBgFadeTimers = () => {
  if (!openingBgFadeTimerIds.length) return;
  openingBgFadeTimerIds.forEach((id) => window.clearTimeout(id));
  openingBgFadeTimerIds = [];
};

const ensureOpeningBgFadeMid = () => {
  if (openingBgFadeMid) return openingBgFadeMid;
  if (!openingFrame) return null;
  const layer = document.createElement('span');
  layer.className = 'opening__bgfade opening__bgfade--mid';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.zIndex = '1';
  openingFrame.insertBefore(layer, openingBgFade ? openingBgFade.nextSibling : openingFrame.firstChild);
  openingBgFadeMid = layer;
  return openingBgFadeMid;
};

const setOpeningMainBackground = (url) => {
  if (!opening || !url) return;
  const isRawImageValue = /^url\(|^linear-gradient\(/.test(url);
  opening.style.setProperty('--opening-main-bg', isRawImageValue ? url : `url("${url}")`);
  currentOpeningBg = url;
};

const normalizeCssBgUrl = (value) => {
  if (!value || value === 'none') return '';
  const match = value.match(/url\((["']?)(.*?)\1\)/i);
  return match ? match[2] : '';
};

const getVisibleOpeningBackground = () => {
  if (!openingBgFade) return currentOpeningBg;
  const isFadeActive = openingBgFade.classList.contains('is-active');
  if (isFadeActive) {
    const fadeUrl = normalizeCssBgUrl(openingBgFade.style.backgroundImage);
    if (fadeUrl) return fadeUrl;
  }
  return currentOpeningBg;
};

const resolveOpeningBackgroundForStage = (stage) => {
  if (
    stage === 'line1-show' ||
    stage === 'line1-grow' ||
    stage === 'line1-reveal'
  ) {
    return 'img/50build.jpg?v=20260310-3';
  }
  if (
    stage === 'line2-grow' ||
    stage === 'line2-reveal' ||
    stage === 'line2-pause' ||
    stage === 'line2-hold' ||
    stage === 'logo-fade' ||
    stage === 'logo-hold' ||
    stage === 'outro'
  ) {
    return 'img/tateyama.jpg';
  }
  return 'img/fv01.png';
};

const runOpeningBackgroundFadeSwitch = (url) => {
  if (!url) return;

  if (!openingBgFade) {
    setOpeningMainBackground(url);
    return;
  }
  if (currentOpeningBg === url) return;

  clearOpeningBgFadeTimers();

  const prevBg = currentOpeningBg;
  openingBgFade.classList.remove('is-diagonal-wipe');
  openingBgFade.classList.remove('is-blurout');
  const prevBgCss = /^url\(|^linear-gradient\(/.test(prevBg) ? prevBg : `url("${prevBg}")`;
  openingBgFade.style.backgroundImage = prevBgCss;
  const isFvTo50build =
    typeof prevBg === 'string' &&
    typeof url === 'string' &&
    prevBg.includes('fv01.png') &&
    url.includes('50build.jpg');
  if (isFvTo50build) {
    const wipeMs = 700;
    openingBgFade.style.transition = 'none';
    setOpeningMainBackground(url);
    openingBgFade.classList.add('is-active');
    openingBgFade.classList.add('is-diagonal-wipe');
    openingBgFade.style.animationDuration = `${wipeMs}ms`;
    void openingBgFade.offsetWidth;

    const endWipeId = window.setTimeout(() => {
      openingBgFade.classList.remove('is-active');
      openingBgFade.classList.remove('is-diagonal-wipe');
      openingBgFade.style.animationDuration = '';
    }, wipeMs + 40);
    openingBgFadeTimerIds.push(endWipeId);

    const cleanupId = window.setTimeout(() => {
      openingBgFade.style.transition = '';
      openingBgFade.classList.remove('is-blurout');
    }, wipeMs + 80);
    openingBgFadeTimerIds.push(cleanupId);
    return;
  }

  const is50ToTateyama =
    typeof prevBg === 'string' &&
    typeof url === 'string' &&
    prevBg.includes('50build.jpg') &&
    url.includes('tateyama.jpg');
  const crossFadeFullMs = is50ToTateyama ? 2200 : 1400;

  openingBgFade.style.transition = 'none';
  openingBgFade.classList.add('is-active');
  void openingBgFade.offsetWidth;
  setOpeningMainBackground(url);
  openingBgFade.style.transition = `opacity ${crossFadeFullMs}ms ease, filter ${crossFadeFullMs}ms ease`;

  const fadeOutTimerId = window.setTimeout(() => {
    openingBgFade.classList.remove('is-active');
  }, 16);
  openingBgFadeTimerIds.push(fadeOutTimerId);

  const cleanupTimerId = window.setTimeout(() => {
    openingBgFade.classList.remove('is-blurout');
    openingBgFade.style.transition = '';
  }, crossFadeFullMs + 80);
  openingBgFadeTimerIds.push(cleanupTimerId);
};

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
  opening.style.setProperty('--opening-main-blur', '0px');
  clearOpeningBgFadeTimers();
  if (openingBgFade) {
    openingBgFade.classList.remove('is-active');
    openingBgFade.classList.remove('is-blurout');
    openingBgFade.classList.remove('is-diagonal-wipe');
    openingBgFade.style.animationDuration = '';
  }
  if (openingBgFadeMid) {
    openingBgFadeMid.classList.remove('is-active');
    openingBgFadeMid.classList.remove('is-blurout');
    openingBgFadeMid.style.transition = '';
  }
  if (openingSequenceController) {
    openingSequenceController.stop();
  }
  body.classList.remove('is-loading');
  body.classList.add('show-design');
  opening.classList.add('is-transition-out');
  window.setTimeout(() => {
    opening.classList.add('is-finished');
    opening.classList.remove('is-transition-out');
  }, 500);
  setupPostHeaderScroll();
  setupContentsReveal();
  setupTopicsReveal();
};

const reopenOpening = () => {
  if (!opening) return;
  opening.classList.remove('is-finished');
  opening.classList.remove('is-transition-out');
  body.classList.add('is-loading');
  body.classList.remove('show-design');
};

const createOpeningSequenceController = (onStateChange) => {
  if (!opening) {
    body.classList.remove('is-loading');
    return null;
  }

  const sequence = [
    { stage: 'grow-x', duration: 304 },
    { stage: 'image', duration: 500 },
    { stage: 'full', duration: 520 },
    { stage: 'overlay-fade', duration: 180 },
    { stage: 'overlay-image', duration: 360 },
    { stage: 'osa-fade-out', duration: 1000 },
    { stage: 'ippo-pop', duration: 1200 },
    { stage: 'line1-show', duration: 133 },
    { stage: 'line1-grow', duration: 213 },
    { stage: 'line1-reveal', duration: 380 },
    { stage: 'line2-grow', duration: 320 },
    { stage: 'line2-reveal', duration: 680 },
    { stage: 'line2-pause', duration: 1200 },
    { stage: 'line2-hold', duration: 1300 },
    { stage: 'logo-fade', duration: 2280 },
    { stage: 'logo-hold', duration: 1400 },
    { stage: 'outro', duration: 280 }
  ];

  let index = 0;
  let timerId = 0;
  let paused = true;
  let finished = false;
  let currentStageIndex = -1;
  let stageStartedAt = 0;
  let remainingMs = 0;

  const clearTimer = () => {
    if (!timerId) return;
    window.clearTimeout(timerId);
    timerId = 0;
  };

  const applyCurrentStage = (withTransition = true) => {
    const current = sequence[index];
    currentStageIndex = index;
    opening.dataset.stage = current.stage;
    const blurPx = STAGE_BG_BLUR[current.stage] ?? 0;
    opening.style.setProperty('--opening-main-blur', `${blurPx}px`);
    if (current.stage === 'line2-pause') {
      clearOpeningBgFadeTimers();
      if (openingBgFade) {
        openingBgFade.classList.remove('is-active');
        openingBgFade.classList.remove('is-blurout');
        openingBgFade.classList.remove('is-diagonal-wipe');
        openingBgFade.style.animationDuration = '';
      }
    }
    if (withTransition && OPENING_BG_FADE_STAGES[current.stage]) {
      runOpeningBackgroundFadeSwitch(OPENING_BG_FADE_STAGES[current.stage]);
    }
    return current;
  };

  const emitState = () => {
    if (!onStateChange) return;
    onStateChange(getState());
  };

  const setStageByIndex = (nextIndex, preferredBg = '') => {
    clearTimer();
    paused = true;
    finished = false;
    index = Math.max(0, Math.min(sequence.length - 1, nextIndex));
    const stage = sequence[index].stage;
    clearOpeningBgFadeTimers();
    if (openingBgFade) {
      openingBgFade.classList.remove('is-active');
      openingBgFade.classList.remove('is-blurout');
      openingBgFade.classList.remove('is-diagonal-wipe');
      openingBgFade.style.animationDuration = '';
    }
    if (openingBgFadeMid) {
      openingBgFadeMid.classList.remove('is-active');
      openingBgFadeMid.classList.remove('is-blurout');
      openingBgFadeMid.style.transition = '';
    }
    setOpeningMainBackground(preferredBg || resolveOpeningBackgroundForStage(stage));
    applyCurrentStage(false);
    remainingMs = sequence[index].duration;
    emitState();
  };

  const onStageDone = () => {
    timerId = 0;
    remainingMs = 0;
    if (paused || finished) return;
    if (
      sequence[index] &&
      sequence[index].stage === 'logo-hold' &&
      openingUiController &&
      typeof openingUiController.shouldStopAfterOpening === 'function' &&
      openingUiController.shouldStopAfterOpening()
    ) {
      paused = true;
      emitState();
      return;
    }
    index += 1;
    if (index >= sequence.length) return;
    runCurrent(false);
    emitState();
  };

  const schedule = (ms) => {
    clearTimer();
    remainingMs = ms;
    stageStartedAt = performance.now();
    timerId = window.setTimeout(onStageDone, ms);
  };

  const runCurrent = (singleStep) => {
    if (finished || index >= sequence.length) return;
    const current = applyCurrentStage();

    if (current.stage === 'outro') {
      if (singleStep) return;
      finished = true;
      clearTimer();
      remainingMs = current.duration;
      stageStartedAt = performance.now();
      timerId = window.setTimeout(finishOpening, current.duration + 1000);
      return;
    }

    if (singleStep) {
      index += 1;
      emitState();
      return;
    }

    schedule(current.duration);
    emitState();
  };

  const play = () => {
    if (finished) return;
    if (timerId) return;
    paused = false;

    if (index === 0 && remainingMs === 0) {
      runCurrent(false);
      return;
    }

    if (remainingMs > 0) {
      schedule(remainingMs);
      return;
    }

    if (!timerId) {
      runCurrent(false);
    }
  };

  const pause = () => {
    if (finished) return;
    paused = true;
    if (!timerId) return;
    const elapsed = performance.now() - stageStartedAt;
    remainingMs = Math.max(0, remainingMs - elapsed);
    clearTimer();
  };

  const step = () => {
    if (finished) return;
    pause();
    if (currentStageIndex < sequence.length - 1) {
      setStageByIndex(currentStageIndex + 1);
    }
  };

  const back = () => {
    if (finished) {
      finished = false;
      reopenOpening();
    }
    pause();
    setStageByIndex(Math.max(0, currentStageIndex - 1));
  };

  const stop = () => {
    paused = true;
    clearTimer();
    emitState();
  };

  const getState = () => {
    const stage = opening?.dataset.stage || '';
    return {
      paused,
      finished,
      stage,
      bg: resolveOpeningBackgroundForStage(stage),
      stageIndex: Math.max(0, currentStageIndex),
      stageCount: sequence.length
    };
  };

  const setStageByName = (stageName, preferredBg = '') => {
    const idx = sequence.findIndex((step) => step.stage === stageName);
    if (idx < 0) return false;
    setStageByIndex(idx, preferredBg);
    return true;
  };

  return {
    play,
    pause,
    back,
    step,
    stop,
    getState,
    setStageByRatio: (ratio) => {
      const clamped = Math.max(0, Math.min(1, ratio));
      const idx = Math.round((sequence.length - 1) * clamped);
      setStageByIndex(idx);
    },
    setStageByName
  };
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) {
  finishOpening();
} else {
  openingSequenceController = createOpeningSequenceController((state) => {
    if (openingUiController) openingUiController.update(state);
  });

  if (typeof window.createOpeningController === 'function' && openingSequenceController) {
    openingUiController = window.createOpeningController({
      play: () => openingSequenceController.play(),
      pause: () => openingSequenceController.pause(),
      back: () => openingSequenceController.back(),
      step: () => openingSequenceController.step(),
      reload: () => window.location.reload(),
      onScrub: (ratio) => {
        openingSequenceController.pause();
        openingSequenceController.setStageByRatio(ratio);
      },
      getState: () => openingSequenceController.getState(),
      playFromStage: (stageName) => {
        const state = openingSequenceController.getState();
        if (state?.finished) {
          reopenOpening();
        }
        openingSequenceController.pause();
        const moved = openingSequenceController.setStageByName(stageName);
        if (moved) openingSequenceController.play();
      },
      stopAtStage: (stageName) => {
        const state = openingSequenceController.getState();
        if (state?.finished) {
          reopenOpening();
        }
        openingSequenceController.pause();
        openingSequenceController.setStageByName(stageName);
      }
    });
  }

  if (openingSequenceController) {
    openingSequenceController.play();
  }
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
