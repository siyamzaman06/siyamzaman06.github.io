const root = document.documentElement;
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

const openingTitle = document.querySelector('main h1');
if (openingTitle) {
  const titleText = openingTitle.textContent.trim();
  openingTitle.setAttribute('aria-label', titleText);

  if (motionReduced()) {
    document.body.classList.add('opening-accents-ready');
  } else {
    const titleHeight = openingTitle.getBoundingClientRect().height;
    const typedText = document.createElement('span');
    const cursor = document.createElement('span');
    let characterIndex = 0;

    openingTitle.style.minHeight = `${titleHeight}px`;
    openingTitle.classList.add('type-title-active');
    typedText.setAttribute('aria-hidden', 'true');
    typedText.className = 'typed-title-text';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.className = 'type-title-cursor';
    openingTitle.replaceChildren(typedText, cursor);

    const typeNextCharacter = () => {
      characterIndex += 1;
      typedText.textContent = titleText.slice(0, characterIndex);
      if (characterIndex < titleText.length) {
        const character = titleText[characterIndex - 1];
        const pause = /[.,:]/.test(character) ? 105 : 31;
        setTimeout(typeNextCharacter, pause);
      } else {
        const finalWordStart = titleText.lastIndexOf(' ') + 1;
        const titleEnding = document.createElement('span');
        typedText.textContent = titleText.slice(0, finalWordStart);
        titleEnding.className = 'type-title-ending';
        titleEnding.setAttribute('aria-hidden', 'true');
        titleEnding.textContent = titleText.slice(finalWordStart);
        titleEnding.append(cursor);
        openingTitle.append(titleEnding);
        openingTitle.classList.add('typing-complete');
        document.body.classList.add('opening-accents-ready');
        openingTitle.style.minHeight = '';
      }
    };

    setTimeout(typeNextCharacter, 330);
  }
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const themeToggle = document.getElementById('themeToggle');
const themeColor = document.querySelector('meta[name="theme-color"]') || document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));

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
  themeColor.content = light ? '#eef3f8' : '#07111f';
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

const closeMenu = () => {
  navLinks?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) menuButton.textContent = '\u2630';
};

menuButton?.addEventListener('click', () => {
  const open = navLinks?.classList.toggle('open') ?? false;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? '\u00D7' : '\u2630';
});

navLinks?.querySelectorAll('a').forEach((anchor) => anchor.addEventListener('click', closeMenu));
addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navLinks?.classList.contains('open')) closeMenu();
});

const currentPage = document.body.dataset.page;
document.querySelectorAll('[data-page-link]').forEach((anchor) => {
  if (anchor.dataset.pageLink === currentPage) {
    anchor.classList.add('active');
    anchor.setAttribute('aria-current', 'page');
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

  const activateDrawing = (tab, moveFocus = false) => {
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
});

if (finePointer.matches && !motionReduced()) {
  let pointerFrame = 0;
  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 3;
  const tiltStates = new Map();

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

  const resetAllTilts = () => {
    spotlightSurfaces.forEach((surface) => resetTilt(surface));
  };

  addEventListener('pointermove', (event) => {
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
      if (event.pointerType === 'touch') return;
      resetTilt(surface, state);
      state.rect = surface.getBoundingClientRect();
    }, { passive: true });

    surface.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
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
        const rect = state.rect || surface.getBoundingClientRect();
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

  addEventListener('blur', resetAllTilts);
  document.documentElement.addEventListener('pointerleave', resetAllTilts);
  document.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) resetAllTilts();
  });
}

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
  const closeDuration = motionReduced() ? 0 : 280;
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

  const closeContact = () => {
    if (!contactDialog.open || contactDialog.classList.contains('is-closing')) return;
    contactDialog.classList.add('is-closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      contactDialog.close();
      contactDialog.classList.remove('is-closing');
      document.body.classList.remove('contact-open');
      contactTrigger.focus({ preventScroll: true });
    }, closeDuration);
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

const projectOverviewTrigger = document.querySelector('[data-project-overview-open]');
const projectOverviewDialog = document.getElementById('projectOverviewDialog');
if (projectOverviewTrigger && projectOverviewDialog && typeof HTMLDialogElement !== 'undefined') {
  const closeButton = projectOverviewDialog.querySelector('.project-overview-close');
  const filterButtons = [...projectOverviewDialog.querySelectorAll('[data-project-filter]')];
  const projectCards = [...projectOverviewDialog.querySelectorAll('[data-project-category]')];
  const projectCount = projectOverviewDialog.querySelector('[data-project-count]');
  const closeDuration = motionReduced() ? 0 : 300;
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
    }, closeDuration);
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
  const closeDuration = motionReduced() ? 0 : 360;
  const launchDelay = motionReduced() ? 0 : 70;
  let closeTimer;
  let openTimer;
  let launchTimer;
  let panelFrame;
  let panelX = innerWidth / 2;
  let panelY = innerHeight / 2;
  let previewTrigger;
  const previewTriggers = [...document.querySelectorAll('[data-preview-src]')];

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
  headerActions.append(previousButton, nextButton, zoomButton);
  if (closeButton) {
    closeButton.autofocus = true;
    headerActions.append(closeButton);
  }
  lightboxHeader.append(headerActions);

  const setZoom = (zoomed) => {
    imageLightbox.classList.toggle('is-zoomed', zoomed);
    zoomButton.textContent = zoomed ? '\u2296' : '\u2295';
    zoomButton.title = zoomed ? 'Reset image zoom' : 'Zoom image';
    zoomButton.setAttribute('aria-label', zoomed ? 'Reset image zoom' : 'Zoom image');
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    if (!zoomed) lightboxStage.scrollTo({ top: 0, left: 0 });
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
    }, closeDuration);
  };

  previewTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-controls', 'imageLightbox');
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      clearTimeout(launchTimer);
      previewTrigger?.classList.remove('is-launching');
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
        || trigger.dataset.previewSrc;
      const safeAmbientSource = ambientSource.replace(/"/g, '%22');
      imageLightbox.classList.add('preview-loading');
      imageLightbox.classList.toggle('is-document', isDocument);
      setZoom(false);
      zoomButton.hidden = isDocument;
      ambientImage.style.backgroundImage = isDocument ? 'none' : `url("${safeAmbientSource}")`;
      lightboxTitle.textContent = trigger.dataset.previewTitle;
      previousButton.setAttribute('aria-label', `View previous: ${previousTrigger?.dataset.previewTitle || 'item'}`);
      nextButton.setAttribute('aria-label', `View next: ${nextTrigger?.dataset.previewTitle || 'item'}`);
      if (lightboxLabel && trigger.dataset.previewLabel) lightboxLabel.textContent = trigger.dataset.previewLabel;
      if (lightboxHint) {
        const browseHint = previewTriggers.length > 1 ? ' Use the arrow keys or header controls to browse.' : '';
        lightboxHint.textContent = isDocument
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

      trigger.classList.add('is-launching');
      launchTimer = setTimeout(() => trigger.classList.remove('is-launching'), 560);
      openTimer = setTimeout(() => {
        lightboxStage.scrollTo({ top: 0, left: 0 });
        if (!imageLightbox.open) imageLightbox.showModal();
        document.body.classList.add('preview-open');
      }, launchDelay);
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
  zoomButton.addEventListener('click', () => setZoom(!imageLightbox.classList.contains('is-zoomed')));
  lightboxImage.addEventListener('dblclick', () => setZoom(!imageLightbox.classList.contains('is-zoomed')));
  imageLightbox.addEventListener('keydown', (event) => {
    if (!imageLightbox.classList.contains('is-zoomed') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      navigatePreview(event.key === 'ArrowLeft' ? -1 : 1);
    }
    if (imageLightbox.classList.contains('is-document')) return;
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

const showToast = (message) => {
  clearTimeout(toastTimer);
  siteToast.textContent = message;
  siteToast.classList.add('visible');
  toastTimer = setTimeout(() => siteToast.classList.remove('visible'), 2600);
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
  { group: 'Projects', label: 'Electronics Cooling Test System', description: 'Personal · Heat transfer, CFD, instrumentation, Arduino', href: 'personal-projects.html#cooling-test-bench', keywords: 'ansys fluent thermal forced convection fan' },
  { group: 'Projects', label: '365 CAD Practice Problems', description: 'Personal · SOLIDWORKS, Creo, parametric modeling', href: 'personal-projects.html#cad-practice', keywords: 'sketching practice collage' },
  { group: 'Projects', label: 'Instrumented Planetary Gearbox', description: 'Personal · Gearing, ANSYS, 3D printing, validation', href: 'planetary-gearbox.html', keywords: 'mechanical systems torque test fixture' },
  { group: 'Projects', label: 'Arduino Electronics Learning Projects', description: 'Personal · Circuits, breadboarding, programming, I/O', href: 'personal-projects.html#arduino-projects', keywords: 'embedded electronics troubleshooting uno r3' },
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
    try { localStorage.setItem('portfolio-reduce-motion', String(active)); } catch {}
    showToast(active ? 'Reduced motion enabled.' : 'Site motion restored.');
  }
  if (action === 'reset') {
    document.body.classList.remove('user-high-contrast', 'user-reduce-motion');
    root.classList.remove('user-reduce-motion');
    root.dataset.textScale = 'normal';
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
    showToast('Close the current viewer before opening Quick Access.');
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

const kineticFidget = document.getElementById('kineticFidget');
const fidgetScene = kineticFidget?.querySelector('.fidget-scene');
if (kineticFidget && fidgetScene) {
  let rotationX = -12;
  let rotationY = 22;
  let rotationZ = -8;
  let velocityX = 0;
  let velocityY = 0;
  let velocityZ = 0;
  let momentumFrame = 0;
  let dragging = false;
  let moved = false;
  let suppressClick = false;
  let lastX = 0;
  let lastY = 0;

  const clampVelocity = (value) => Math.max(-7, Math.min(7, value));
  const renderFidget = () => {
    fidgetScene.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg)`;
  };

  const runMomentum = () => {
    cancelAnimationFrame(momentumFrame);
    if (motionReduced()) {
      kineticFidget.classList.remove('is-spinning');
      renderFidget();
      return;
    }
    kineticFidget.classList.add('is-spinning');
    const tick = () => {
      if (dragging || motionReduced()) {
        momentumFrame = 0;
        kineticFidget.classList.remove('is-spinning');
        return;
      }
      rotationX += velocityX;
      rotationY += velocityY;
      rotationZ += velocityZ;
      velocityX *= .965;
      velocityY *= .965;
      velocityZ *= .965;
      renderFidget();
      if (Math.max(Math.abs(velocityX), Math.abs(velocityY), Math.abs(velocityZ)) > .025) {
        momentumFrame = requestAnimationFrame(tick);
      } else {
        momentumFrame = 0;
        kineticFidget.classList.remove('is-spinning');
      }
    };
    momentumFrame = requestAnimationFrame(tick);
  };

  const boostFidget = () => {
    if (motionReduced()) {
      rotationX -= 8;
      rotationY += 16;
      rotationZ += 6;
      renderFidget();
      return;
    }
    velocityX = clampVelocity(velocityX + 2.2);
    velocityY = clampVelocity(velocityY + 5.2);
    velocityZ = clampVelocity(velocityZ + 2.7);
    runMomentum();
  };

  kineticFidget.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    cancelAnimationFrame(momentumFrame);
    momentumFrame = 0;
    kineticFidget.classList.remove('is-spinning');
    kineticFidget.classList.add('is-dragging');
    kineticFidget.setPointerCapture(event.pointerId);
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
  });

  kineticFidget.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) moved = true;
    rotationX -= deltaY * .55;
    rotationY += deltaX * .55;
    rotationZ += deltaX * .09;
    velocityX = clampVelocity(-deltaY * .34);
    velocityY = clampVelocity(deltaX * .34);
    velocityZ = clampVelocity(deltaX * .075);
    lastX = event.clientX;
    lastY = event.clientY;
    renderFidget();
  });

  const releaseFidget = (event) => {
    if (!dragging) return;
    dragging = false;
    suppressClick = moved;
    kineticFidget.classList.remove('is-dragging');
    if (kineticFidget.hasPointerCapture(event.pointerId)) kineticFidget.releasePointerCapture(event.pointerId);
    if (moved) runMomentum();
  };

  kineticFidget.addEventListener('pointerup', releaseFidget);
  kineticFidget.addEventListener('pointercancel', releaseFidget);
  kineticFidget.addEventListener('click', () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    boostFidget();
  });
  kineticFidget.addEventListener('keydown', (event) => {
    const keyRotation = {
      ArrowUp: [-9, 0],
      ArrowDown: [9, 0],
      ArrowLeft: [0, -9],
      ArrowRight: [0, 9]
    }[event.key];
    if (!keyRotation) return;
    event.preventDefault();
    rotationX += keyRotation[0];
    rotationY += keyRotation[1];
    renderFidget();
  });

  renderFidget();
}

const kineticFidgetCanvas = document.getElementById('kineticFidgetCanvas');
if (kineticFidget && kineticFidgetCanvas) {
  const initWebglFidget = () => {
    const gl = kineticFidgetCanvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL is unavailable');

    const vertexSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uProjection;
      uniform mat4 uView;
      uniform mat4 uModel;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = uModel * vec4(aPosition, 1.0);
        vWorldPosition = worldPosition.xyz;
        vNormal = normalize(mat3(uModel) * aNormal);
        gl_Position = uProjection * uView * worldPosition;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform vec3 uColor;
      uniform vec3 uCamera;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDirection = normalize(vec3(-0.45, 0.8, 1.0));
        vec3 viewDirection = normalize(uCamera - vWorldPosition);
        float diffuse = max(dot(normal, lightDirection), 0.0);
        float backLight = max(dot(normal, -lightDirection), 0.0) * 0.16;
        vec3 reflected = reflect(-lightDirection, normal);
        float specular = pow(max(dot(viewDirection, reflected), 0.0), 54.0);
        float fresnel = pow(1.0 - max(dot(viewDirection, normal), 0.0), 2.35);
        vec3 color = uColor * (0.28 + diffuse * 0.78 + backLight);
        color += vec3(0.75, 0.93, 1.0) * specular * 1.15;
        color += mix(vec3(0.08, 0.32, 0.65), vec3(0.52, 0.34, 1.0), fresnel) * fresnel * 0.9;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);

    const locations = {
      position: gl.getAttribLocation(program, 'aPosition'),
      normal: gl.getAttribLocation(program, 'aNormal'),
      projection: gl.getUniformLocation(program, 'uProjection'),
      view: gl.getUniformLocation(program, 'uView'),
      model: gl.getUniformLocation(program, 'uModel'),
      color: gl.getUniformLocation(program, 'uColor'),
      camera: gl.getUniformLocation(program, 'uCamera')
    };

    const identity = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    const multiply = (a, b) => {
      const result = new Float32Array(16);
      for (let column = 0; column < 4; column += 1) {
        for (let row = 0; row < 4; row += 1) {
          result[column * 4 + row] =
            a[row] * b[column * 4] +
            a[4 + row] * b[column * 4 + 1] +
            a[8 + row] * b[column * 4 + 2] +
            a[12 + row] * b[column * 4 + 3];
        }
      }
      return result;
    };
    const translation = (x, y, z) => {
      const matrix = identity();
      matrix[12] = x;
      matrix[13] = y;
      matrix[14] = z;
      return matrix;
    };
    const scaling = (x, y = x, z = x) => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
    const rotateX = (angle) => {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      return new Float32Array([1, 0, 0, 0, 0, cosine, sine, 0, 0, -sine, cosine, 0, 0, 0, 0, 1]);
    };
    const rotateY = (angle) => {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      return new Float32Array([cosine, 0, -sine, 0, 0, 1, 0, 0, sine, 0, cosine, 0, 0, 0, 0, 1]);
    };
    const rotateZ = (angle) => {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      return new Float32Array([cosine, sine, 0, 0, -sine, cosine, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    };
    const perspective = (fieldOfView, aspect, near, far) => {
      const scale = 1 / Math.tan(fieldOfView / 2);
      const range = 1 / (near - far);
      return new Float32Array([scale / aspect, 0, 0, 0, 0, scale, 0, 0, 0, 0, (far + near) * range, -1, 0, 0, 2 * far * near * range, 0]);
    };
    const compose = (...matrices) => matrices.reduce((result, matrix) => multiply(result, matrix), identity());

    const buildTorus = (majorRadius, tubeRadius, majorSegments = 72, tubeSegments = 20) => {
      const positions = [];
      const normals = [];
      const indices = [];
      for (let major = 0; major <= majorSegments; major += 1) {
        const u = major / majorSegments * Math.PI * 2;
        const cosineU = Math.cos(u);
        const sineU = Math.sin(u);
        for (let tube = 0; tube <= tubeSegments; tube += 1) {
          const v = tube / tubeSegments * Math.PI * 2;
          const cosineV = Math.cos(v);
          const sineV = Math.sin(v);
          positions.push((majorRadius + tubeRadius * cosineV) * cosineU, (majorRadius + tubeRadius * cosineV) * sineU, tubeRadius * sineV);
          normals.push(cosineU * cosineV, sineU * cosineV, sineV);
        }
      }
      for (let major = 0; major < majorSegments; major += 1) {
        for (let tube = 0; tube < tubeSegments; tube += 1) {
          const first = major * (tubeSegments + 1) + tube;
          const second = first + tubeSegments + 1;
          indices.push(first, second, first + 1, second, second + 1, first + 1);
        }
      }
      return { positions, normals, indices };
    };

    const buildSphere = (radius, latitudeSegments = 26, longitudeSegments = 34) => {
      const positions = [];
      const normals = [];
      const indices = [];
      for (let latitude = 0; latitude <= latitudeSegments; latitude += 1) {
        const theta = latitude / latitudeSegments * Math.PI;
        const sineTheta = Math.sin(theta);
        const cosineTheta = Math.cos(theta);
        for (let longitude = 0; longitude <= longitudeSegments; longitude += 1) {
          const phi = longitude / longitudeSegments * Math.PI * 2;
          const x = Math.cos(phi) * sineTheta;
          const y = cosineTheta;
          const z = Math.sin(phi) * sineTheta;
          positions.push(radius * x, radius * y, radius * z);
          normals.push(x, y, z);
        }
      }
      for (let latitude = 0; latitude < latitudeSegments; latitude += 1) {
        for (let longitude = 0; longitude < longitudeSegments; longitude += 1) {
          const first = latitude * (longitudeSegments + 1) + longitude;
          const second = first + longitudeSegments + 1;
          indices.push(first, second, first + 1, second, second + 1, first + 1);
        }
      }
      return { positions, normals, indices };
    };

    const buildGear = (teeth, rootRadius, tipRadius, thickness) => {
      const positions = [];
      const normals = [];
      const indices = [];
      const profile = [];
      const steps = teeth * 4;
      for (let step = 0; step < steps; step += 1) {
        const angle = step / steps * Math.PI * 2;
        const radius = step % 4 === 1 || step % 4 === 2 ? tipRadius : rootRadius;
        profile.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
      const addTriangle = (points, normal) => {
        const start = positions.length / 3;
        points.forEach((point) => positions.push(...point));
        points.forEach(() => normals.push(...normal));
        indices.push(start, start + 1, start + 2);
      };
      const addQuad = (points, normal) => {
        const start = positions.length / 3;
        points.forEach((point) => positions.push(...point));
        points.forEach(() => normals.push(...normal));
        indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
      };
      for (let step = 0; step < steps; step += 1) {
        const next = (step + 1) % steps;
        const point = profile[step];
        const nextPoint = profile[next];
        addTriangle([[0, 0, thickness / 2], [point[0], point[1], thickness / 2], [nextPoint[0], nextPoint[1], thickness / 2]], [0, 0, 1]);
        addTriangle([[0, 0, -thickness / 2], [nextPoint[0], nextPoint[1], -thickness / 2], [point[0], point[1], -thickness / 2]], [0, 0, -1]);
        const midpointAngle = Math.atan2(point[1] + nextPoint[1], point[0] + nextPoint[0]);
        addQuad([
          [point[0], point[1], thickness / 2],
          [point[0], point[1], -thickness / 2],
          [nextPoint[0], nextPoint[1], -thickness / 2],
          [nextPoint[0], nextPoint[1], thickness / 2]
        ], [Math.cos(midpointAngle), Math.sin(midpointAngle), 0]);
      }
      return { positions, normals, indices };
    };

    const buildRingGear = (teeth, innerRootRadius, innerTipRadius, outerRadius, thickness) => {
      const positions = [];
      const normals = [];
      const indices = [];
      const steps = teeth * 4;
      const addQuad = (points, normal) => {
        const start = positions.length / 3;
        points.forEach((point) => positions.push(...point));
        points.forEach(() => normals.push(...normal));
        indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
      };
      for (let step = 0; step < steps; step += 1) {
        const next = (step + 1) % steps;
        const angle = step / steps * Math.PI * 2;
        const nextAngle = (step + 1) / steps * Math.PI * 2;
        const innerRadius = step % 4 === 1 || step % 4 === 2 ? innerTipRadius : innerRootRadius;
        const nextInnerRadius = next % 4 === 1 || next % 4 === 2 ? innerTipRadius : innerRootRadius;
        const outerPoint = [Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius];
        const nextOuterPoint = [Math.cos(nextAngle) * outerRadius, Math.sin(nextAngle) * outerRadius];
        const innerPoint = [Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius];
        const nextInnerPoint = [Math.cos(nextAngle) * nextInnerRadius, Math.sin(nextAngle) * nextInnerRadius];
        addQuad([
          [outerPoint[0], outerPoint[1], thickness / 2], [nextOuterPoint[0], nextOuterPoint[1], thickness / 2],
          [nextInnerPoint[0], nextInnerPoint[1], thickness / 2], [innerPoint[0], innerPoint[1], thickness / 2]
        ], [0, 0, 1]);
        addQuad([
          [outerPoint[0], outerPoint[1], -thickness / 2], [innerPoint[0], innerPoint[1], -thickness / 2],
          [nextInnerPoint[0], nextInnerPoint[1], -thickness / 2], [nextOuterPoint[0], nextOuterPoint[1], -thickness / 2]
        ], [0, 0, -1]);
        const midpointAngle = (angle + nextAngle) / 2;
        addQuad([
          [outerPoint[0], outerPoint[1], thickness / 2], [outerPoint[0], outerPoint[1], -thickness / 2],
          [nextOuterPoint[0], nextOuterPoint[1], -thickness / 2], [nextOuterPoint[0], nextOuterPoint[1], thickness / 2]
        ], [Math.cos(midpointAngle), Math.sin(midpointAngle), 0]);
        addQuad([
          [innerPoint[0], innerPoint[1], thickness / 2], [nextInnerPoint[0], nextInnerPoint[1], thickness / 2],
          [nextInnerPoint[0], nextInnerPoint[1], -thickness / 2], [innerPoint[0], innerPoint[1], -thickness / 2]
        ], [-Math.cos(midpointAngle), -Math.sin(midpointAngle), 0]);
      }
      return { positions, normals, indices };
    };

    const createMesh = ({ positions, normals, indices }) => {
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      const normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      return { positionBuffer, normalBuffer, indexBuffer, count: indices.length };
    };

    const ringGear = createMesh(buildRingGear(36, 2.18, 1.96, 2.48, .42));
    const sunGear = createMesh(buildGear(16, .7, .92, .36));
    const planetGear = createMesh(buildGear(10, .43, .6, .32));
    const carrierRing = createMesh(buildTorus(1.33, .055, 64, 12));
    const axle = createMesh(buildSphere(.17, 16, 20));
    const drawMesh = (mesh, model, color) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
      gl.enableVertexAttribArray(locations.normal);
      gl.vertexAttribPointer(locations.normal, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
      gl.uniformMatrix4fv(locations.model, false, model);
      gl.uniform3fv(locations.color, color);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    };

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform3f(locations.camera, 0, 0, 8);

    let rotationX = -.55;
    let rotationY = .2;
    let rotationZ = -.08;
    let velocityX = 0;
    let velocityY = .32;
    let velocityZ = 0;
    let orbitAngle = 0;
    let driveVelocity = 0;
    let dragging = false;
    let moved = false;
    let suppressClick = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastFrameTime = performance.now();
    let animationFrame = 0;
    let visible = true;

    const resizeCanvas = () => {
      const rectangle = kineticFidgetCanvas.getBoundingClientRect();
      const pixelRatio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rectangle.width * pixelRatio));
      const height = Math.max(1, Math.round(rectangle.height * pixelRatio));
      if (kineticFidgetCanvas.width !== width || kineticFidgetCanvas.height !== height) {
        kineticFidgetCanvas.width = width;
        kineticFidgetCanvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      return width / height;
    };

    const renderWebglFidget = () => {
      const aspect = resizeCanvas();
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(locations.projection, false, perspective(38 * Math.PI / 180, aspect, .1, 40));
      gl.uniformMatrix4fv(locations.view, false, translation(0, 0, -8));
      const globalRotation = compose(rotateY(rotationY), rotateX(rotationX), rotateZ(rotationZ));
      const carrierAngle = orbitAngle * (16 / 52);
      const planetSpin = carrierAngle - (16 / 10) * (orbitAngle - carrierAngle);
      drawMesh(ringGear, globalRotation, new Float32Array([.28, .23, .72]));
      drawMesh(carrierRing, compose(globalRotation, translation(0, 0, -.28)), new Float32Array([.2, .72, 1]));
      drawMesh(sunGear, compose(globalRotation, rotateZ(orbitAngle)), new Float32Array([.08, .55, 1]));
      drawMesh(axle, compose(globalRotation, translation(0, 0, .3), scaling(1.15, 1.15, .7)), new Float32Array([.66, .9, 1]));
      for (let index = 0; index < 3; index += 1) {
        const carrierPosition = carrierAngle + index / 3 * Math.PI * 2;
        const x = Math.cos(carrierPosition) * 1.33;
        const y = Math.sin(carrierPosition) * 1.33;
        drawMesh(planetGear, compose(globalRotation, translation(x, y, 0), rotateZ(planetSpin)), new Float32Array([.54, .76, 1]));
        drawMesh(axle, compose(globalRotation, translation(x, y, .28), scaling(.88, .88, .58)), new Float32Array([.77, .91, 1]));
      }
    };

    const startRendering = () => {
      if (animationFrame || !visible || document.hidden) return;
      lastFrameTime = performance.now();
      const loop = (now) => {
        const deltaTime = Math.min((now - lastFrameTime) / 1000, .04);
        lastFrameTime = now;
        if (!dragging && !motionReduced()) {
          rotationX += velocityX * deltaTime;
          rotationY += (velocityY + .16) * deltaTime;
          rotationZ += velocityZ * deltaTime;
          orbitAngle += (.72 + driveVelocity) * deltaTime;
          velocityX *= Math.pow(.055, deltaTime);
          velocityY *= Math.pow(.12, deltaTime);
          velocityZ *= Math.pow(.08, deltaTime);
          driveVelocity *= Math.pow(.09, deltaTime);
        }
        renderWebglFidget();
        if (visible && !document.hidden && !motionReduced()) animationFrame = requestAnimationFrame(loop);
        else animationFrame = 0;
      };
      animationFrame = requestAnimationFrame(loop);
    };

    const requestFidgetFrame = () => {
      if (motionReduced()) renderWebglFidget();
      else startRendering();
    };

    kineticFidget.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      kineticFidget.setPointerCapture(event.pointerId);
      kineticFidget.classList.add('is-dragging');
      dragging = true;
      moved = false;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
    });
    kineticFidget.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const deltaX = event.clientX - lastPointerX;
      const deltaY = event.clientY - lastPointerY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) moved = true;
      rotationY += deltaX * .012;
      rotationX += deltaY * .012;
      velocityY = Math.max(-5, Math.min(5, deltaX * .12));
      velocityX = Math.max(-5, Math.min(5, deltaY * .12));
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      requestFidgetFrame();
    });
    const releaseWebglFidget = (event) => {
      if (!dragging) return;
      dragging = false;
      suppressClick = moved;
      kineticFidget.classList.remove('is-dragging');
      if (kineticFidget.hasPointerCapture(event.pointerId)) kineticFidget.releasePointerCapture(event.pointerId);
      requestFidgetFrame();
    };
    kineticFidget.addEventListener('pointerup', releaseWebglFidget);
    kineticFidget.addEventListener('pointercancel', releaseWebglFidget);
    kineticFidget.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (motionReduced()) {
        rotationY += .35;
        rotationX += .14;
        orbitAngle += .38;
      } else {
        velocityY += 3.8;
        velocityX += 1.2;
        velocityZ += 1.35;
        driveVelocity += 4.8;
      }
      requestFidgetFrame();
    });
    kineticFidget.addEventListener('keydown', (event) => {
      const keyRotation = { ArrowUp: [-.16, 0], ArrowDown: [.16, 0], ArrowLeft: [0, -.16], ArrowRight: [0, .16] }[event.key];
      if (!keyRotation) return;
      event.preventDefault();
      rotationX += keyRotation[0];
      rotationY += keyRotation[1];
      requestFidgetFrame();
    });

    new ResizeObserver(requestFidgetFrame).observe(kineticFidgetCanvas);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestFidgetFrame();
      else if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }, { threshold: .05 }).observe(kineticFidgetCanvas);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) requestFidgetFrame();
    });
    kineticFidgetCanvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      kineticFidget.classList.add('webgl-failed');
    });
    renderWebglFidget();
    startRendering();
  };

  try {
    initWebglFidget();
  } catch {
    kineticFidget.classList.add('webgl-failed');
  }
}
