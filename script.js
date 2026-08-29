const root = document.documentElement;
if (!document.querySelector('link[rel~="icon"]')) {
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = 'favicon.svg';
  document.head.append(favicon);
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');

const savedPreferences = {
  contrast: false,
  motion: false,
  textScale: 'normal'
};
try {
  savedPreferences.contrast = localStorage.getItem('portfolio-high-contrast') === 'true';
  savedPreferences.motion = localStorage.getItem('portfolio-reduce-motion') === 'true';
  const savedTextScale = localStorage.getItem('portfolio-text-scale');
  if (['normal', 'large', 'larger'].includes(savedTextScale)) savedPreferences.textScale = savedTextScale;
} catch {}
document.body.classList.toggle('user-high-contrast', savedPreferences.contrast);
document.body.classList.toggle('user-reduce-motion', savedPreferences.motion);
root.classList.toggle('user-reduce-motion', savedPreferences.motion);
root.dataset.textScale = savedPreferences.textScale;
const motionReduced = () => reducedMotion.matches || document.body.classList.contains('user-reduce-motion');
const autoplaySyncers = new Set();


const openingTitle = document.querySelector('main h1');
if (openingTitle) {
  const titleText = openingTitle.textContent.trim();
  openingTitle.setAttribute('aria-label', titleText);

  if (motionReduced()) {
    document.body.classList.add('opening-accents-ready');
  } else {
    const titleCharacters = [];
    const titleTokens = [];
    const titleWords = titleText.split(/\s+/);

    titleWords.forEach((word, wordIndex) => {
      if (wordIndex > 0) titleTokens.push(document.createTextNode(' '));

      const wordSpan = document.createElement('span');
      wordSpan.className = 'typed-title-word';

      [...word].forEach((character) => {
        const characterSpan = document.createElement('span');
        characterSpan.className = 'typed-title-character';
        characterSpan.setAttribute('aria-hidden', 'true');
        characterSpan.textContent = character;
        titleCharacters.push(characterSpan);
        wordSpan.append(characterSpan);
      });

      titleTokens.push(wordSpan);
    });
    let characterIndex = 0;
    let currentCharacter;

    openingTitle.classList.add('type-title-active');
    openingTitle.replaceChildren(...titleTokens);

    const typeNextCharacter = () => {
      currentCharacter?.classList.remove('is-current');
      currentCharacter = titleCharacters[characterIndex];
      currentCharacter.classList.add('is-visible', 'is-current');
      characterIndex += 1;
      if (characterIndex < titleCharacters.length) {
        const character = currentCharacter.textContent;
        const pause = /[.,:]/.test(character) ? 82 : 23;
        setTimeout(typeNextCharacter, pause);
      } else {
        openingTitle.classList.add('typing-complete');
        document.body.classList.add('opening-accents-ready');
      }
    };

    setTimeout(typeNextCharacter, 210);
  }
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const themeToggle = document.getElementById('themeToggle');
const themeColor = document.querySelector('meta[name="theme-color"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
if (themeToggle) themeToggle.type = 'button';

try {
  if (localStorage.getItem('portfolio-theme') === 'light') document.body.classList.add('light');
} catch {}
root.classList.remove('theme-preload-light');

const syncThemeUi = () => {
  const light = document.body.classList.contains('light');
  if (themeToggle) {
    themeToggle.textContent = light ? '\u263E' : '\u263C';
    themeToggle.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    themeToggle.title = light ? 'Switch to dark theme' : 'Switch to light theme';
  }
  themeColor.content = light ? '#e1e2e7' : '#16161e';
};

syncThemeUi();

themeToggle?.addEventListener('click', () => {
  const applyTheme = () => {
    document.body.classList.toggle('light');
    try {
      localStorage.setItem('portfolio-theme', document.body.classList.contains('light') ? 'light' : 'dark');
    } catch {}
    syncThemeUi();
  };

  if (document.startViewTransition && !motionReduced()) {
    const toggleRect = themeToggle.getBoundingClientRect();
    root.style.setProperty('--theme-x', `${toggleRect.left + toggleRect.width / 2}px`);
    root.style.setProperty('--theme-y', `${toggleRect.top + toggleRect.height / 2}px`);
    root.classList.add('theme-switching');
    document.startViewTransition(applyTheme).finished.finally(() => root.classList.remove('theme-switching'));
  } else {
    applyTheme();
  }
});

const menuButton = document.getElementById('menuButton');
const navLinks = document.getElementById('navLinks');
if (menuButton) {
  menuButton.type = 'button';
  menuButton.setAttribute('aria-controls', 'navLinks');
}

const closeMenu = () => {
  navLinks?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) {
    menuButton.textContent = '\u2630';
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.title = 'Open navigation';
  }
};

menuButton?.addEventListener('click', () => {
  const open = navLinks?.classList.toggle('open') ?? false;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? '\u00D7' : '\u2630';
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuButton.title = open ? 'Close navigation' : 'Open navigation';
});

navLinks?.querySelectorAll('a').forEach((anchor) => anchor.addEventListener('click', closeMenu));
addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navLinks?.classList.contains('open')) {
    closeMenu();
    menuButton?.focus({ preventScroll: true });
  }
});
document.addEventListener('pointerdown', (event) => {
  if (!navLinks?.classList.contains('open') || event.target.closest('.site-header')) return;
  closeMenu();
}, { passive: true });
addEventListener('resize', () => {
  if (innerWidth > 1020 && navLinks?.classList.contains('open')) closeMenu();
}, { passive: true });

const currentPage = document.body.dataset.page;
document.querySelectorAll('[data-page-link]').forEach((anchor) => {
  if (anchor.dataset.pageLink === currentPage) {
    anchor.classList.add('active');
    anchor.setAttribute('aria-current', 'page');
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }
});

const progressBar = document.createElement('div');
progressBar.className = 'site-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.append(progressBar);

const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.type = 'button';
backToTop.setAttribute('aria-label', 'Back to top');
backToTop.title = 'Back to top';
backToTop.innerHTML = '<span aria-hidden="true">\u2191</span>';
document.body.append(backToTop);
backToTop.addEventListener('click', () => scrollTo({ top: 0, behavior: motionReduced() ? 'auto' : 'smooth' }));


const header = document.querySelector('.site-header');
const timeline = document.querySelector('.timeline');
const timelineProgress = timeline?.querySelector('.timeline-progress');
let scrollFrame = 0;

const updateScrollUi = () => {
  scrollFrame = 0;
  const maxScroll = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  const ratio = Math.min(Math.max(scrollY / maxScroll, 0), 1);
  root.style.setProperty('--scroll-ratio', ratio.toFixed(4));
  header?.classList.toggle('scrolled', scrollY > 18);
  backToTop.classList.toggle('visible', scrollY > Math.min(innerHeight * 0.8, 720));

  if (timeline && timelineProgress) {
    const rect = timeline.getBoundingClientRect();
    const middle = innerHeight * 0.55;
    const travel = Math.min(Math.max(middle - rect.top, 0), rect.height);
    timelineProgress.style.height = `${travel}px`;
  }
};

const requestScrollUpdate = () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollUi);
};

updateScrollUi();
addEventListener('scroll', requestScrollUpdate, { passive: true });
addEventListener('resize', requestScrollUpdate);

document.querySelectorAll('.media img').forEach((image) => {
  image.decoding = 'async';
  const fallback = () => {
    image.style.display = 'none';
    const media = image.closest('.media');
    media?.classList.add('media-missing');
    media?.querySelector('.placeholder')?.classList.add('show');
  };
  image.addEventListener('error', fallback);
  if (image.complete && image.naturalWidth === 0) fallback();
});

document.querySelectorAll('video[data-default-volume]').forEach((video) => {
  video.volume = Number(video.dataset.defaultVolume);
  video.addEventListener('error', () => {
    video.style.display = 'none';
    video.closest('.media')?.querySelector('.placeholder')?.classList.add('show');
  });
});

const revealGroups = new Map();
const reveals = document.querySelectorAll('.reveal');
reveals.forEach((element) => {
  const parent = element.parentElement;
  const position = revealGroups.get(parent) || 0;
  element.style.setProperty('--reveal-delay', `${Math.min(position, 5) * 65}ms`);
  revealGroups.set(parent, position + 1);
});

if (motionReduced()) {
  reveals.forEach((element) => element.classList.add('visible'));
} else if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
  reveals.forEach((element) => revealObserver.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('visible'));
}

if (timeline) {
  const timelineItems = [...timeline.querySelectorAll('.timeline-item')];
  if (motionReduced()) {
    timelineItems.forEach((item) => item.classList.add('visible', 'active'));
  } else if ('IntersectionObserver' in window) {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible', 'active');
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -12% 0px' });
    timelineItems.forEach((item) => timelineObserver.observe(item));
  } else {
    timelineItems.forEach((item) => item.classList.add('visible', 'active'));
  }
}

const spotlightSelector = [
  '.page-card', '.panel', '.badge-card', '.project-card', '.cert-card',
  '.detail-panel', '.roadmap-card', '.iteration-card', '.future-artifact', '.timeline-copy',
  '.project-overview-card', '.fea-load-card', '.certificate-attachment'
].join(',');

const spotlightSurfaces = document.querySelectorAll(spotlightSelector);
spotlightSurfaces.forEach((surface) => {
  surface.classList.add('spotlight-surface', 'interactive-tilt');
  const borderBeam = document.createElement('span');
  borderBeam.className = 'card-border-beam';
  borderBeam.setAttribute('aria-hidden', 'true');
  surface.append(borderBeam);
});

document.querySelectorAll('[data-drawing-switcher]').forEach((switcher) => {
  const tabs = [...switcher.querySelectorAll('[data-drawing-tab]')];
  const panels = [...switcher.querySelectorAll('[data-drawing-panel]')];
  const autoplay = switcher.hasAttribute('data-drawing-autoplay') && tabs.length > 1;
  const progress = switcher.querySelector('[data-drawing-progress]');
  const autoplayToggle = switcher.querySelector('[data-drawing-autoplay-toggle]');
  const autoplayInterval = 5000;
  const pauseReasons = { user: false };
  let autoplayTimer = 0;
  let progressFrame = 0;
  let progressStartedAt = 0;
  let progressElapsed = 0;
  let restartAutoplay = () => {};

  const shouldPauseAutoplay = () => motionReduced() || pauseReasons.user;
  const renderProgress = () => {
    if (!progress) return;
    const amount = Math.max(0, Math.min(1, progressElapsed / autoplayInterval));
    progress.querySelector('span')?.style.setProperty('transform', `scaleX(${amount})`);
  };
  const stopProgressClock = () => {
    clearTimeout(autoplayTimer);
    autoplayTimer = 0;
    cancelAnimationFrame(progressFrame);
    progressFrame = 0;
    if (progressStartedAt) {
      progressElapsed = Math.max(0, Math.min(autoplayInterval, performance.now() - progressStartedAt));
      progressStartedAt = 0;
      renderProgress();
    }
  };
  const runProgressClock = () => {
    if (!autoplay || shouldPauseAutoplay() || progressStartedAt || progressElapsed >= autoplayInterval) return;
    progressStartedAt = performance.now() - progressElapsed;
    autoplayTimer = window.setTimeout(() => {
      autoplayTimer = 0;
      progressElapsed = autoplayInterval;
      progressStartedAt = 0;
      renderProgress();
      const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
      const activeIndex = Math.max(0, tabs.indexOf(activeTab));
      const nextTab = tabs[(activeIndex + 1) % tabs.length];
      if (nextTab) {
        activateDrawing(nextTab, false, false);
        restartAutoplay();
      }
    }, Math.max(0, autoplayInterval - progressElapsed));
    const tick = () => {
      if (!progressStartedAt) return;
      progressElapsed = Math.max(0, Math.min(autoplayInterval, performance.now() - progressStartedAt));
      renderProgress();
      if (progressElapsed < autoplayInterval) progressFrame = requestAnimationFrame(tick);
    };
    progressFrame = requestAnimationFrame(tick);
  };
	  const syncAutoplay = () => {
	    if (!autoplay) return;
	    if (shouldPauseAutoplay()) stopProgressClock();
    else runProgressClock();
  };

  const activateDrawing = (tab, moveFocus = false, resetAutoplay = true) => {
    tabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      const selected = panel.id === tab.getAttribute('aria-controls');
      panel.classList.toggle('active', selected);
      panel.setAttribute('aria-hidden', String(!selected));
    });
    if (moveFocus) tab.focus();
    if (resetAutoplay) restartAutoplay();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateDrawing(tab));
    tab.addEventListener('keydown', (event) => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      activateDrawing(tabs[nextIndex], true);
    });
  });

  const initiallySelectedTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  if (initiallySelectedTab) activateDrawing(initiallySelectedTab);

  if (autoplay && progress && autoplayToggle) {
    restartAutoplay = () => {
      clearTimeout(autoplayTimer);
      autoplayTimer = 0;
      cancelAnimationFrame(progressFrame);
      progressFrame = 0;
      progressElapsed = 0;
      progressStartedAt = 0;
      renderProgress();
      syncAutoplay();
    };
    autoplayToggle.addEventListener('click', () => {
      pauseReasons.user = !pauseReasons.user;
      const paused = pauseReasons.user;
      autoplayToggle.setAttribute('aria-pressed', String(paused));
      autoplayToggle.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} slideshow`);
      autoplayToggle.title = `${paused ? 'Resume' : 'Pause'} slideshow`;
      autoplayToggle.textContent = paused ? '▶' : '⏸';
      syncAutoplay();
	    });
	    restartAutoplay();
	    autoplaySyncers.add(syncAutoplay);
	  } else {
    progress?.setAttribute('hidden', '');
    autoplayToggle?.setAttribute('hidden', '');
  }
});

const heroMotifSurface = document.body.dataset.page === 'home'
  ? document.querySelector('.home-hero')
  : document.body.dataset.page === 'fsae'
    ? null
    : document.body.dataset.page === 'certifications'
      ? document.querySelector('.certificate-hero-visual')
      : document.querySelector('.page-hero > .container');
const heroMotifRegion = heroMotifSurface?.closest('.home-hero, .page-hero');
heroMotifSurface?.classList.add('hero-motif-tilt');

let resetInteractiveTilts = () => {};

if (finePointer.matches) {
  let pointerFrame = 0;
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 3;
  const tiltStates = new Map();
  const heroMotifState = { frame: 0, x: 0, y: 0 };

  const resetTilt = (surface, state = tiltStates.get(surface)) => {
    if (state?.frame) cancelAnimationFrame(state.frame);
    if (state) {
      state.frame = 0;
      state.rect = null;
    }
    surface.classList.remove('is-tilting');
    surface.style.setProperty('--card-tilt-x', '0deg');
    surface.style.setProperty('--card-tilt-y', '0deg');
    surface.style.setProperty('--card-shadow-x', '0px');
    surface.style.setProperty('--card-shadow-y', '32px');
  };

  const resetHeroMotifTilt = () => {
    if (!heroMotifSurface) return;
    if (heroMotifState.frame) cancelAnimationFrame(heroMotifState.frame);
    heroMotifState.frame = 0;
    heroMotifSurface.classList.remove('is-motif-tilting');
    heroMotifSurface.style.setProperty('--motif-tilt-x', '0deg');
    heroMotifSurface.style.setProperty('--motif-tilt-y', '0deg');
  };

  const resetAllTilts = () => {
    spotlightSurfaces.forEach((surface) => resetTilt(surface));
    resetHeroMotifTilt();
  };
  resetInteractiveTilts = resetAllTilts;

  addEventListener('pointermove', (event) => {
    if (motionReduced()) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) {
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        root.style.setProperty('--cursor-x', `${pointerX}px`);
        root.style.setProperty('--cursor-y', `${pointerY}px`);
      });
    }
  }, { passive: true });

  spotlightSurfaces.forEach((surface) => {
    const state = { frame: 0, rect: null, x: 0, y: 0 };
    tiltStates.set(surface, state);

    surface.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch' || motionReduced()) return;
      resetTilt(surface, state);
    }, { passive: true });

    surface.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || motionReduced()) {
        resetTilt(surface, state);
        return;
      }
      const closestSurface = event.target.closest(spotlightSelector);
      if (closestSurface !== surface) {
        resetTilt(surface, state);
        return;
      }
      state.x = event.clientX;
      state.y = event.clientY;
      if (state.frame) return;
      state.frame = requestAnimationFrame(() => {
        state.frame = 0;
        if (motionReduced()) {
          resetTilt(surface, state);
          return;
        }
        const rect = surface.getBoundingClientRect();
        state.rect = rect;
        if (rect.width < 1 || rect.height < 1) {
          resetTilt(surface, state);
          return;
        }
        const localX = Math.max(0, Math.min(rect.width, state.x - rect.left));
        const localY = Math.max(0, Math.min(rect.height, state.y - rect.top));
        const normalizedX = Math.max(-0.82, Math.min(0.82, ((localX / rect.width) - 0.5) * 2));
        const normalizedY = Math.max(-0.82, Math.min(0.82, ((localY / rect.height) - 0.5) * 2));
        const isCompactCard = surface.matches('.fea-load-card, .certificate-attachment');
        const tiltX = -normalizedY * (isCompactCard ? 5 : 9);
        const tiltY = normalizedX * (isCompactCard ? 7 : 12);
        const shadowX = -normalizedX * 20;
        const shadowY = 32 - normalizedY * 8;
        surface.classList.add('is-tilting');
        surface.style.setProperty('--spot-x', `${localX}px`);
        surface.style.setProperty('--spot-y', `${localY}px`);
        surface.style.setProperty('--card-tilt-x', `${tiltX.toFixed(2)}deg`);
        surface.style.setProperty('--card-tilt-y', `${tiltY.toFixed(2)}deg`);
        surface.style.setProperty('--card-shadow-x', `${shadowX.toFixed(1)}px`);
        surface.style.setProperty('--card-shadow-y', `${shadowY.toFixed(1)}px`);
      });
    }, { passive: true });
    surface.addEventListener('pointerleave', () => resetTilt(surface, state));
    surface.addEventListener('pointercancel', () => resetTilt(surface, state));
  });

  if (heroMotifSurface && heroMotifRegion) {
    heroMotifRegion.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || motionReduced()) {
        resetHeroMotifTilt();
        return;
      }
      heroMotifState.x = event.clientX;
      heroMotifState.y = event.clientY;
      if (heroMotifState.frame) return;
      heroMotifState.frame = requestAnimationFrame(() => {
        heroMotifState.frame = 0;
        if (motionReduced()) {
          resetHeroMotifTilt();
          return;
        }
        const rect = heroMotifRegion.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        const normalizedX = Math.max(-.86, Math.min(.86, ((heroMotifState.x - rect.left) / rect.width - .5) * 2));
        const normalizedY = Math.max(-.86, Math.min(.86, ((heroMotifState.y - rect.top) / rect.height - .5) * 2));
        heroMotifSurface.classList.add('is-motif-tilting');
        heroMotifSurface.style.setProperty('--motif-tilt-x', `${(-normalizedY * 7).toFixed(2)}deg`);
        heroMotifSurface.style.setProperty('--motif-tilt-y', `${(normalizedX * 10).toFixed(2)}deg`);
      });
    }, { passive: true });
    heroMotifRegion.addEventListener('pointerleave', resetHeroMotifTilt);
    heroMotifRegion.addEventListener('pointercancel', resetHeroMotifTilt);
  }

  addEventListener('blur', resetAllTilts);
  document.documentElement.addEventListener('pointerleave', resetAllTilts);
  document.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) resetAllTilts();
  });
}
const syncMotionSettings = () => {
  resetInteractiveTilts();
  autoplaySyncers.forEach((sync) => sync());
};
reducedMotion.addEventListener?.('change', syncMotionSettings);

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const prefetched = new Set();
const prefetchPage = (anchor) => {
  if (connection?.saveData) return;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin || url.pathname === location.pathname || prefetched.has(url.href)) return;
  if (!url.pathname.endsWith('.html') && !url.pathname.endsWith('/')) return;
  const prefetch = document.createElement('link');
  prefetch.rel = 'prefetch';
  prefetch.href = url.href;
  document.head.append(prefetch);
  prefetched.add(url.href);
};

document.querySelectorAll('a[href]').forEach((anchor) => {
  anchor.addEventListener('pointerenter', () => prefetchPage(anchor), { once: true, passive: true });
  anchor.addEventListener('focus', () => prefetchPage(anchor), { once: true });
});

const contactTrigger = document.querySelector('[data-contact-open]');
const contactSource = document.getElementById('contact');
if (contactTrigger && contactSource && typeof HTMLDialogElement !== 'undefined') {
  const contactDialog = document.createElement('dialog');
  const contactCard = contactSource.cloneNode(true);
  const contactTitle = contactCard.querySelector('h3');
  const contactDescription = contactCard.querySelector('p');
  const closeButton = document.createElement('button');
  const closeDuration = () => motionReduced() ? 0 : 280;
  let closeTimer;

  contactDialog.id = 'contactDialog';
  contactDialog.className = 'contact-dialog';
  contactDialog.setAttribute('aria-labelledby', 'contactDialogTitle');
  contactDialog.setAttribute('aria-describedby', 'contactDialogDescription');

  contactCard.removeAttribute('id');
  contactCard.classList.remove('reveal', 'visible', 'spotlight-surface', 'interactive-tilt');
  contactCard.querySelector('.card-border-beam')?.remove();
  contactCard.classList.add('contact-modal-panel');
  contactTitle.id = 'contactDialogTitle';
  contactDescription.id = 'contactDialogDescription';

  closeButton.type = 'button';
  closeButton.className = 'contact-dialog-close';
  closeButton.setAttribute('aria-label', 'Close contact information');
  closeButton.textContent = '×';
  contactCard.prepend(closeButton);
  contactDialog.append(contactCard);
  document.body.append(contactDialog);
  contactTrigger.setAttribute('aria-controls', 'contactDialog');

  const closeContact = () => {
    if (!contactDialog.open || contactDialog.classList.contains('is-closing')) return;
    contactDialog.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      contactDialog.close();
      contactDialog.classList.remove('is-closing');
      document.body.classList.remove('contact-open');
      contactTrigger.focus({ preventScroll: true });
    }, closeDuration());
  };

  contactTrigger.addEventListener('click', (event) => {
    event.preventDefault();
    clearTimeout(closeTimer);
    const triggerRect = contactTrigger.getBoundingClientRect();
    const originX = Math.min(92, Math.max(8, ((triggerRect.left + triggerRect.width / 2) / innerWidth) * 100));
    const originY = Math.min(92, Math.max(8, ((triggerRect.top + triggerRect.height / 2) / innerHeight) * 100));
    contactDialog.style.setProperty('--contact-origin-x', `${originX}%`);
    contactDialog.style.setProperty('--contact-origin-y', `${originY}%`);
    contactDialog.classList.remove('is-closing');
    if (!contactDialog.open) contactDialog.showModal();
    document.body.classList.add('contact-open');
  });

  closeButton.addEventListener('click', closeContact);
  contactDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeContact();
  });
  contactDialog.addEventListener('click', (event) => {
    if (event.target === contactDialog) closeContact();
  });
}

try {
  localStorage.removeItem('portfolio-project-order-v1');
} catch {}

const projectOverviewTrigger = document.querySelector('[data-project-overview-open]');
const projectOverviewDialog = document.getElementById('projectOverviewDialog');
if (projectOverviewTrigger && projectOverviewDialog && typeof HTMLDialogElement !== 'undefined') {
  const closeButton = projectOverviewDialog.querySelector('.project-overview-close');
  const filterButtons = [...projectOverviewDialog.querySelectorAll('[data-project-filter]')];
  const projectCards = [...projectOverviewDialog.querySelectorAll('[data-project-category]')];
  const projectCount = projectOverviewDialog.querySelector('[data-project-count]');
  const closeDuration = () => motionReduced() ? 0 : 300;
  let closeTimer;

  const closeProjectOverview = () => {
    if (!projectOverviewDialog.open || projectOverviewDialog.classList.contains('is-closing')) return;
    projectOverviewDialog.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      projectOverviewDialog.close();
      projectOverviewDialog.classList.remove('is-closing');
      document.body.classList.remove('project-overview-open');
      projectOverviewTrigger.focus({ preventScroll: true });
    }, closeDuration());
  };

  projectOverviewTrigger.addEventListener('click', (event) => {
    event.preventDefault();
    clearTimeout(closeTimer);
    projectOverviewDialog.classList.remove('is-closing');
    if (!projectOverviewDialog.open) projectOverviewDialog.showModal();
    document.body.classList.add('project-overview-open');
  });

  closeButton?.addEventListener('click', closeProjectOverview);
  projectOverviewDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeProjectOverview();
  });
  projectOverviewDialog.addEventListener('click', (event) => {
    if (event.target === projectOverviewDialog) closeProjectOverview();
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedCategory = button.dataset.projectFilter;
      filterButtons.forEach((filterButton) => {
        filterButton.setAttribute('aria-pressed', String(filterButton === button));
      });

      let visibleProjects = 0;
      projectCards.forEach((card) => {
        const matches = selectedCategory === 'all' || card.dataset.projectCategory === selectedCategory;
        card.hidden = !matches;
        if (matches) visibleProjects += 1;
      });
      if (projectCount) projectCount.textContent = String(visibleProjects);
    });
  });
}

const imageLightbox = document.getElementById('imageLightbox');
if (imageLightbox) {
  const lightboxImage = document.getElementById('imageLightboxImage');
  const lightboxTitle = document.getElementById('imageLightboxTitle');
  const lightboxLabel = imageLightbox.querySelector('.image-lightbox-header span');
  const lightboxHeader = imageLightbox.querySelector('.image-lightbox-header');
  const lightboxPanel = imageLightbox.querySelector('.image-lightbox-panel');
  const lightboxStage = imageLightbox.querySelector('.image-lightbox-stage');
  const lightboxHint = imageLightbox.querySelector('.image-lightbox-panel > p');
  const lightboxDocument = document.createElement('iframe');
  const ambientImage = document.createElement('div');
  const headerActions = document.createElement('div');
  const previousButton = document.createElement('button');
  const nextButton = document.createElement('button');
  const zoomButton = document.createElement('button');
  const closeButton = imageLightbox.querySelector('.image-lightbox-close');
	  const closeDuration = () => motionReduced() ? 0 : 360;
	  const launchDelay = () => motionReduced() ? 0 : 70;
	  let closeTimer;
	  let openTimer;
  let panelFrame;
  let panelX = innerWidth / 2;
  let panelY = innerHeight / 2;
  let previewTrigger;
  const previewTriggers = [...document.querySelectorAll('[data-preview-src]')];
  const zoomEnabled = !imageLightbox.hasAttribute('data-disable-zoom');

  ambientImage.className = 'image-lightbox-ambient';
  ambientImage.setAttribute('aria-hidden', 'true');
  lightboxPanel.prepend(ambientImage);

  lightboxDocument.className = 'image-lightbox-document';
  lightboxDocument.hidden = true;
  lightboxDocument.setAttribute('loading', 'eager');
  lightboxStage.append(lightboxDocument);

  headerActions.className = 'image-lightbox-actions';
  previousButton.type = 'button';
  previousButton.className = 'image-lightbox-nav image-lightbox-previous';
  previousButton.textContent = '\u2039';
  previousButton.title = 'Previous item';
  previousButton.setAttribute('aria-label', 'View previous item');
  previousButton.hidden = previewTriggers.length < 2;
  nextButton.type = 'button';
  nextButton.className = 'image-lightbox-nav image-lightbox-next';
  nextButton.textContent = '\u203A';
  nextButton.title = 'Next item';
  nextButton.setAttribute('aria-label', 'View next item');
  nextButton.hidden = previewTriggers.length < 2;
  zoomButton.type = 'button';
  zoomButton.className = 'image-lightbox-zoom';
  zoomButton.textContent = '\u2295';
  zoomButton.title = 'Zoom image';
  zoomButton.setAttribute('aria-label', 'Zoom image');
  zoomButton.setAttribute('aria-pressed', 'false');
  headerActions.append(previousButton, nextButton);
  if (zoomEnabled) headerActions.append(zoomButton);
  if (closeButton) {
    closeButton.autofocus = true;
    headerActions.append(closeButton);
  }
  lightboxHeader.append(headerActions);

  const setZoom = (zoomed) => {
    const nextZoomed = zoomEnabled && zoomed;
    imageLightbox.classList.toggle('is-zoomed', nextZoomed);
    if (zoomEnabled) {
      zoomButton.textContent = nextZoomed ? '\u2296' : '\u2295';
      zoomButton.title = nextZoomed ? 'Reset image zoom' : 'Zoom image';
      zoomButton.setAttribute('aria-label', nextZoomed ? 'Reset image zoom' : 'Zoom image');
      zoomButton.setAttribute('aria-pressed', String(nextZoomed));
    }
    if (!nextZoomed) lightboxStage.scrollTo({ top: 0, left: 0 });
  };

  const finishPreviewLoading = () => imageLightbox.classList.remove('preview-loading');
  lightboxImage.addEventListener('load', finishPreviewLoading);
  lightboxImage.addEventListener('error', finishPreviewLoading);
  lightboxDocument.addEventListener('load', finishPreviewLoading);

  if (finePointer.matches && !motionReduced()) {
    lightboxPanel.addEventListener('pointermove', (event) => {
      panelX = event.clientX;
      panelY = event.clientY;
      if (panelFrame) return;
      panelFrame = requestAnimationFrame(() => {
        panelFrame = 0;
        const rect = lightboxPanel.getBoundingClientRect();
        lightboxPanel.style.setProperty('--preview-pointer-x', `${panelX - rect.left}px`);
        lightboxPanel.style.setProperty('--preview-pointer-y', `${panelY - rect.top}px`);
      });
    }, { passive: true });
  }

  const closePreview = () => {
    if (!imageLightbox.open || imageLightbox.classList.contains('is-closing')) return;
    imageLightbox.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      imageLightbox.close();
      imageLightbox.classList.remove('is-closing', 'preview-loading', 'is-document');
      setZoom(false);
      document.body.classList.remove('preview-open');
      lightboxImage.removeAttribute('src');
      lightboxImage.hidden = false;
      lightboxDocument.removeAttribute('src');
      lightboxDocument.hidden = true;
      ambientImage.style.removeProperty('background-image');
      previewTrigger?.focus({ preventScroll: true });
    }, closeDuration());
  };

  previewTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-controls', 'imageLightbox');
	    trigger.addEventListener('click', (event) => {
	      event.preventDefault();
	      clearTimeout(closeTimer);
	      clearTimeout(openTimer);
	      previewTrigger = trigger;
      imageLightbox.classList.remove('is-closing');
      const triggerRect = trigger.getBoundingClientRect();
      const launchX = triggerRect.left + triggerRect.width / 2 - innerWidth / 2;
      const launchY = triggerRect.top + triggerRect.height / 2 - innerHeight / 2;
      const clickX = ((triggerRect.left + triggerRect.width / 2) / innerWidth) * 100;
      const clickY = ((triggerRect.top + triggerRect.height / 2) / innerHeight) * 100;
      imageLightbox.style.setProperty('--preview-launch-x', `${launchX.toFixed(1)}px`);
      imageLightbox.style.setProperty('--preview-launch-y', `${launchY.toFixed(1)}px`);
      imageLightbox.style.setProperty('--preview-launch-x-mid', `${(launchX * 0.18).toFixed(1)}px`);
      imageLightbox.style.setProperty('--preview-launch-y-mid', `${(launchY * 0.18).toFixed(1)}px`);
      imageLightbox.style.setProperty('--preview-click-x', `${clickX.toFixed(1)}%`);
      imageLightbox.style.setProperty('--preview-click-y', `${clickY.toFixed(1)}%`);

      const isDocument = trigger.dataset.previewType === 'pdf';
      const currentPreviewIndex = previewTriggers.indexOf(trigger);
      const previousTrigger = previewTriggers[(currentPreviewIndex - 1 + previewTriggers.length) % previewTriggers.length];
      const nextTrigger = previewTriggers[(currentPreviewIndex + 1) % previewTriggers.length];
      const ambientSource = trigger.querySelector('img')?.getAttribute('src')
        || trigger.closest('figure')?.querySelector('img')?.getAttribute('src')
        || trigger.dataset.previewSrc
        || '';
      const safeAmbientSource = ambientSource.replace(/"/g, '%22');
      imageLightbox.classList.add('preview-loading');
      imageLightbox.classList.toggle('is-document', isDocument);
      setZoom(false);
      zoomButton.hidden = !zoomEnabled || isDocument;
      ambientImage.style.backgroundImage = isDocument ? 'none' : `url("${safeAmbientSource}")`;
      lightboxTitle.textContent = trigger.dataset.previewTitle;
      previousButton.setAttribute('aria-label', `View previous: ${previousTrigger?.dataset.previewTitle || 'item'}`);
      nextButton.setAttribute('aria-label', `View next: ${nextTrigger?.dataset.previewTitle || 'item'}`);
      if (lightboxLabel && trigger.dataset.previewLabel) lightboxLabel.textContent = trigger.dataset.previewLabel;
      if (lightboxHint) {
        const browseHint = previewTriggers.length > 1 ? ' Use the arrow keys or header controls to browse.' : '';
        lightboxHint.textContent = isDocument || !zoomEnabled
          ? `Press Escape or click outside the viewer to close.${browseHint}`
          : `Double-click the image to zoom. Press Escape or click outside to close.${browseHint}`;
      }
      if (isDocument) {
        lightboxImage.hidden = true;
        lightboxImage.removeAttribute('src');
        lightboxDocument.hidden = false;
        lightboxDocument.title = trigger.dataset.previewAlt || trigger.dataset.previewTitle;
        lightboxDocument.src = trigger.dataset.previewSrc;
      } else {
        lightboxDocument.hidden = true;
        lightboxDocument.removeAttribute('src');
        lightboxImage.hidden = false;
        lightboxImage.src = trigger.dataset.previewSrc;
        lightboxImage.alt = trigger.dataset.previewAlt;
      }

	    openTimer = setTimeout(() => {
        lightboxStage.scrollTo({ top: 0, left: 0 });
        if (!imageLightbox.open) imageLightbox.showModal();
        document.body.classList.add('preview-open');
      }, launchDelay());
    });
  });

  const navigatePreview = (direction) => {
    if (!previewTrigger || previewTriggers.length < 2) return;
    const currentIndex = previewTriggers.indexOf(previewTrigger);
    const nextIndex = (currentIndex + direction + previewTriggers.length) % previewTriggers.length;
    previewTriggers[nextIndex]?.click();
  };

  previousButton.addEventListener('click', () => navigatePreview(-1));
  nextButton.addEventListener('click', () => navigatePreview(1));
  if (zoomEnabled) {
    zoomButton.addEventListener('click', () => setZoom(!imageLightbox.classList.contains('is-zoomed')));
    lightboxImage.addEventListener('dblclick', () => setZoom(!imageLightbox.classList.contains('is-zoomed')));
  }
  imageLightbox.addEventListener('keydown', (event) => {
    if (!imageLightbox.classList.contains('is-zoomed') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      navigatePreview(event.key === 'ArrowLeft' ? -1 : 1);
    }
    if (!zoomEnabled || imageLightbox.classList.contains('is-document')) return;
    if (event.key === '+' || event.key === '=') setZoom(true);
    if (event.key === '-' || event.key === '0') setZoom(false);
  });
  closeButton?.addEventListener('click', closePreview);
  imageLightbox.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePreview();
  });
  imageLightbox.addEventListener('click', (event) => {
    if (event.target === imageLightbox) closePreview();
  });
}

const siteToast = document.createElement('div');
siteToast.className = 'site-toast';
siteToast.setAttribute('role', 'status');
siteToast.setAttribute('aria-live', 'polite');
siteToast.setAttribute('aria-atomic', 'true');
document.body.append(siteToast);
let toastTimer;

const showToast = (message, host = document.body) => {
  clearTimeout(toastTimer);
  if (host && siteToast.parentElement !== host) host.append(siteToast);
  siteToast.textContent = message;
  siteToast.classList.add('visible');
  toastTimer = setTimeout(() => {
    siteToast.classList.remove('visible');
    if (siteToast.parentElement !== document.body) document.body.append(siteToast);
  }, 2600);
};

const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const fallbackInput = document.createElement('textarea');
    fallbackInput.value = text;
    fallbackInput.setAttribute('readonly', '');
    fallbackInput.style.position = 'fixed';
    fallbackInput.style.opacity = '0';
    document.body.append(fallbackInput);
    fallbackInput.select();
    const copied = document.execCommand('copy');
    fallbackInput.remove();
    return copied;
  } catch {
    return false;
  }
};

const navActions = document.querySelector('.nav-actions');
const quickAccessTrigger = document.createElement('button');
const quickAccessDialog = document.createElement('dialog');
const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform || navigator.platform || '');
const shortcutLabel = isMac ? '\u2318 K' : 'Ctrl K';
let quickAccessReturnFocus;

quickAccessTrigger.type = 'button';
quickAccessTrigger.className = 'quick-access-trigger';
quickAccessTrigger.setAttribute('aria-label', `Open quick access (${shortcutLabel})`);
quickAccessTrigger.setAttribute('aria-haspopup', 'dialog');
quickAccessTrigger.setAttribute('aria-controls', 'quickAccessDialog');
quickAccessTrigger.setAttribute('aria-expanded', 'false');
quickAccessTrigger.title = `Quick access (${shortcutLabel})`;
quickAccessTrigger.innerHTML = `<span aria-hidden="true">\u2315</span><kbd>${shortcutLabel}</kbd>`;
navActions?.prepend(quickAccessTrigger);

quickAccessDialog.id = 'quickAccessDialog';
quickAccessDialog.className = 'quick-access-dialog';
quickAccessDialog.setAttribute('aria-labelledby', 'quickAccessTitle');
quickAccessDialog.innerHTML = `
  <div class="quick-access-panel">
    <header class="quick-access-header">
      <div><span>Portfolio Navigator</span><h2 id="quickAccessTitle">Quick access</h2></div>
      <button class="quick-access-close" type="button" aria-label="Close quick access">&times;</button>
    </header>
    <label class="quick-access-search">
      <span aria-hidden="true">\u2315</span>
      <input type="search" placeholder="Search projects, skills, pages, or actions..." autocomplete="off" spellcheck="false" autofocus>
      <kbd>ESC</kbd>
    </label>
    <div class="quick-access-count" role="status" aria-live="polite"></div>
    <nav class="quick-access-results" aria-label="Quick access results"></nav>
    <footer class="quick-access-footer"><span><kbd>\u2191</kbd><kbd>\u2193</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span><span><kbd>Esc</kbd> Close</span></footer>
  </div>`;
document.body.append(quickAccessDialog);

const quickAccessInput = quickAccessDialog.querySelector('input');
const quickAccessResults = quickAccessDialog.querySelector('.quick-access-results');
const quickAccessCount = quickAccessDialog.querySelector('.quick-access-count');
const quickAccessClose = quickAccessDialog.querySelector('.quick-access-close');

const quickAccessItems = () => [
  { group: 'Pages', label: 'Home', description: 'Introduction, selected work, and contact information', href: 'index.html', keywords: 'about overview landing' },
  { group: 'Pages', label: 'Schoolwork', description: 'CAD, reverse engineering, manufacturing, and testing', href: 'school-projects.html', keywords: 'coursework table vise bridge machine shop' },
  { group: 'Pages', label: 'Formula SAE', description: 'Drivetrain and differential-mount development timeline', href: 'fsae.html', keywords: 'fsae dallas formula racing vehicle drivetrain' },
  { group: 'Pages', label: 'Personal Projects', description: 'Independent design, simulation, electronics, and prototyping', href: 'personal-projects.html', keywords: 'independent projects cad arduino cooling gearbox' },
  { group: 'Pages', label: 'Certifications', description: 'CAD, MATLAB, machining, and technical credentials', href: 'certifications.html', keywords: 'credentials training certificate' },
  { group: 'Projects', label: 'Differential Mount & Drivetrain Development', description: 'Formula SAE · CAD, packaging, statics, FEA, prototyping', href: 'fsae.html#timeline', keywords: 'vehicle systems test mule eccentric mount chain tension' },
  { group: 'Projects', label: 'Differential-Mount Tab CAD & FEA', description: 'Formula SAE · Load cases, iteration, FOS, 4130 steel', href: 'fsae.html#tab-fea', keywords: 'structural analysis left right mount tabs factor safety' },
  { group: 'Projects', label: 'Reverse-Engineered Table Vise', description: 'Schoolwork · Creo, assembly modeling, GD&T, BOM', href: 'school-projects.html#table-vise', keywords: 'reverse engineering technical drawing exploded cad' },
  { group: 'Projects', label: 'Laser-Cut Acrylic Bridge', description: 'Schoolwork · AutoCAD, statics, fabrication, load testing', href: 'school-projects.html#acrylic-bridge', keywords: 'structural test laser cutting bridge' },
  { group: 'Projects', label: 'Machine Shop Training', description: 'Schoolwork · Cutting, drilling, tapping, fasteners', href: 'school-projects.html#machine-shop', keywords: 'manufacturing aluminum machining' },
  { group: 'Projects', label: 'Electronics Cooling Test System', description: 'Personal · Duct CFD, fan operating points, fixture FEA, physical testing', href: 'cooling-test-bench.html', keywords: 'ansys fluent thermal forced convection fan duct pq curve pressure flow heatsink' },
  { group: 'Projects', label: '365 CAD Practice Problems', description: 'Personal · SOLIDWORKS, Creo, parametric modeling', href: 'personal-projects.html#cad-practice', keywords: 'sketching practice collage' },
  { group: 'Projects', label: 'Instrumented Planetary Gearbox', description: 'Personal · Gear calculations, CAD, 3D printing, instrumented testing', href: 'planetary-gearbox.html', keywords: 'mechanical systems torque test fixture' },
  { group: 'Projects', label: 'Arduino Electronics Learning Projects', description: 'Personal · Circuits, breadboarding, programming, I/O', href: 'personal-projects.html#arduino-projects', keywords: 'embedded electronics troubleshooting uno r3' },
  { group: 'Projects', label: 'Competitive Programming & Algorithms', description: 'Personal · Approximately 200 Codeforces problems, C/C++, algorithms', href: 'personal-projects.html#competitive-programming', keywords: 'codeforces usaco competitive programming data structures dynamic programming graph algorithms complexity' },
  { group: 'Quick Actions', label: 'Open contact card', description: 'Email, phone, LinkedIn, and GitHub', action: 'contact', keywords: 'reach call message social' },
  { group: 'Quick Actions', label: 'View all projects', description: 'Open the complete project and skills overview', action: 'projects', keywords: 'portfolio map overview' },
  { group: 'Quick Actions', label: document.body.classList.contains('light') ? 'Switch to dark theme' : 'Switch to light theme', description: 'Change the site color theme', action: 'theme', keywords: 'appearance color dark light' },
  { group: 'Quick Actions', label: 'Copy email address', description: 'Copy siyamzaman06@gmail.com', action: 'email', keywords: 'contact clipboard' },
  { group: 'Quick Actions', label: 'Share this page', description: 'Use the device share menu or copy the page link', action: 'share', keywords: 'send link url' },
  { group: 'Quick Actions', label: 'Copy page link', description: 'Copy the current page URL', action: 'copy-link', keywords: 'clipboard share url' },
  { group: 'Quick Actions', label: 'Back to top', description: 'Return to the beginning of this page', action: 'top', keywords: 'scroll start' },
  { group: 'Accessibility', label: document.body.classList.contains('user-high-contrast') ? 'Use standard contrast' : 'Use high contrast', description: 'Increase text and border contrast across the site', action: 'contrast', keywords: 'accessibility vision readable display' },
  { group: 'Accessibility', label: 'Cycle text size', description: `Current size: ${root.dataset.textScale || 'normal'}`, action: 'text-size', keywords: 'accessibility larger font reading zoom' },
  { group: 'Accessibility', label: document.body.classList.contains('user-reduce-motion') ? 'Restore site motion' : 'Reduce site motion', description: 'Control nonessential animation and 3D movement', action: 'motion', keywords: 'accessibility animation tilt vestibular' },
  { group: 'Accessibility', label: 'Reset display preferences', description: 'Restore standard text, contrast, and motion settings', action: 'reset', keywords: 'accessibility defaults' }
];

const runQuickAction = async (action) => {
  if (action === 'theme') themeToggle?.click();
  if (action === 'contact') {
    if (contactTrigger) contactTrigger.click();
    else location.href = 'index.html#contact';
  }
  if (action === 'projects') {
    if (projectOverviewTrigger) projectOverviewTrigger.click();
    else location.href = 'index.html#work';
  }
  if (action === 'email') showToast(await copyText('siyamzaman06@gmail.com') ? 'Email address copied.' : 'Could not copy the email address.');
  if (action === 'copy-link') showToast(await copyText(location.href) ? 'Page link copied.' : 'Could not copy the page link.');
  if (action === 'share') {
    const shareData = { title: document.title, text: 'Siyam Zaman mechanical engineering portfolio', url: location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== 'AbortError') showToast(await copyText(location.href) ? 'Page link copied instead.' : 'Sharing is unavailable.');
      }
    } else {
      showToast(await copyText(location.href) ? 'Page link copied.' : 'Sharing is unavailable.');
    }
  }
  if (action === 'contrast') {
    document.body.classList.toggle('user-high-contrast');
    const active = document.body.classList.contains('user-high-contrast');
    try { localStorage.setItem('portfolio-high-contrast', String(active)); } catch {}
    showToast(active ? 'High contrast enabled.' : 'Standard contrast restored.');
  }
  if (action === 'text-size') {
    const scales = ['normal', 'large', 'larger'];
    const currentIndex = scales.indexOf(root.dataset.textScale || 'normal');
    const nextScale = scales[(currentIndex + 1) % scales.length];
    root.dataset.textScale = nextScale;
    try { localStorage.setItem('portfolio-text-scale', nextScale); } catch {}
    showToast(`Text size: ${nextScale}.`);
	  }
	  if (action === 'motion') {
	    document.body.classList.toggle('user-reduce-motion');
	    const active = document.body.classList.contains('user-reduce-motion');
	    root.classList.toggle('user-reduce-motion', active);
	    syncMotionSettings();
    try { localStorage.setItem('portfolio-reduce-motion', String(active)); } catch {}
    showToast(active ? 'Reduced motion enabled.' : 'Site motion restored.');
	  }
	  if (action === 'reset') {
	    document.body.classList.remove('user-high-contrast', 'user-reduce-motion');
	    root.classList.remove('user-reduce-motion');
	    root.dataset.textScale = 'normal';
	    syncMotionSettings();
    try {
      localStorage.removeItem('portfolio-high-contrast');
      localStorage.removeItem('portfolio-reduce-motion');
      localStorage.removeItem('portfolio-text-scale');
    } catch {}
    showToast('Display preferences reset.');
  }
  if (action === 'top') scrollTo({ top: 0, behavior: motionReduced() ? 'auto' : 'smooth' });
};

const closeQuickAccess = () => {
  if (!quickAccessDialog.open) return;
  quickAccessDialog.close();
  document.body.classList.remove('quick-access-open');
  quickAccessTrigger.setAttribute('aria-expanded', 'false');
  if (quickAccessReturnFocus?.isConnected) quickAccessReturnFocus.focus({ preventScroll: true });
};

const renderQuickAccess = (query = '') => {
  const normalizedQuery = query.trim().toLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const matches = quickAccessItems().filter((item) => {
    const searchableText = `${item.label} ${item.description} ${item.group} ${item.keywords || ''}`.toLowerCase();
    return queryTerms.every((term) => searchableText.includes(term));
  });

  quickAccessResults.replaceChildren();
  let currentGroup = '';
  matches.forEach((item) => {
    if (item.group !== currentGroup) {
      currentGroup = item.group;
      const groupLabel = document.createElement('p');
      groupLabel.className = 'quick-access-group';
      groupLabel.textContent = currentGroup;
      quickAccessResults.append(groupLabel);
    }

    const result = document.createElement(item.href ? 'a' : 'button');
    if (item.href) result.href = item.href;
    else result.type = 'button';
    result.className = 'quick-access-result';
    const marker = document.createElement('span');
    marker.className = 'quick-access-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = item.group === 'Projects' ? 'P' : item.group === 'Accessibility' ? 'A' : item.group === 'Pages' ? '\u2197' : '\u2726';
    const copy = document.createElement('span');
    copy.className = 'quick-access-copy';
    const label = document.createElement('strong');
    label.textContent = item.label;
    const description = document.createElement('small');
    description.textContent = item.description;
    copy.append(label, description);
    const arrow = document.createElement('span');
    arrow.className = 'quick-access-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = item.href ? '\u2192' : '\u21B5';
    result.append(marker, copy, arrow);
    if (item.action) {
      result.addEventListener('click', () => {
        closeQuickAccess();
        runQuickAction(item.action);
      });
    } else {
      result.addEventListener('click', closeQuickAccess);
    }
    quickAccessResults.append(result);
  });

  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'quick-access-empty';
    empty.innerHTML = '<strong>No matches found.</strong><span>Try a project name, skill, page, or action.</span>';
    quickAccessResults.append(empty);
  }
  quickAccessCount.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'}`;
};

const openQuickAccess = (query = '') => {
  const openDialog = document.querySelector('dialog[open]');
  if (openDialog && openDialog !== quickAccessDialog) {
    showToast('Close the current viewer before opening Quick Access.', openDialog);
    return;
  }
  quickAccessReturnFocus = document.activeElement;
  quickAccessInput.value = query;
  renderQuickAccess(query);
  if (!quickAccessDialog.open) quickAccessDialog.showModal();
  document.body.classList.add('quick-access-open');
  quickAccessTrigger.setAttribute('aria-expanded', 'true');
  quickAccessInput.focus();
  quickAccessInput.select();
};

quickAccessTrigger.addEventListener('click', () => openQuickAccess());
quickAccessClose.addEventListener('click', closeQuickAccess);
quickAccessInput.addEventListener('input', () => renderQuickAccess(quickAccessInput.value));
quickAccessDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeQuickAccess();
});
quickAccessDialog.addEventListener('click', (event) => {
  if (event.target === quickAccessDialog) closeQuickAccess();
});

const quickAccessFocusableResults = () => [...quickAccessResults.querySelectorAll('.quick-access-result')];
quickAccessInput.addEventListener('keydown', (event) => {
  const results = quickAccessFocusableResults();
  if (event.key === 'ArrowDown' && results.length) {
    event.preventDefault();
    results[0].focus();
  }
  if (event.key === 'Enter' && results.length) {
    event.preventDefault();
    results[0].click();
  }
});
quickAccessResults.addEventListener('keydown', (event) => {
  const results = quickAccessFocusableResults();
  const currentIndex = results.indexOf(document.activeElement);
  if (currentIndex < 0) return;
  let nextIndex;
  if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % results.length;
  if (event.key === 'ArrowUp' && currentIndex === 0) {
    event.preventDefault();
    quickAccessInput.focus();
    return;
  }
  if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + results.length) % results.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = results.length - 1;
  if (nextIndex === undefined) return;
  event.preventDefault();
  results[nextIndex].focus();
});

addEventListener('keydown', (event) => {
  const target = event.target;
  const editing = target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable);
  const commandShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
  const slashShortcut = event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey;
  if (!commandShortcut && !slashShortcut) return;
  event.preventDefault();
  if (quickAccessDialog.open && commandShortcut) closeQuickAccess();
  else openQuickAccess();
});

if (location.hash === '#contact' && contactTrigger) {
  setTimeout(() => contactTrigger.click(), motionReduced() ? 0 : 260);
}

if (location.hash === '#work' && projectOverviewTrigger) {
  setTimeout(() => projectOverviewTrigger.click(), motionReduced() ? 0 : 260);
}
