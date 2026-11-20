const root = document.documentElement;
const themeButton = document.querySelector<HTMLButtonElement>('.theme-toggle');
const themes = ['system', 'light', 'dark'] as const;
type Theme = (typeof themes)[number];

function currentTheme(): Theme {
  const theme = root.dataset['theme'];
  return theme === 'light' || theme === 'dark' ? theme : 'system';
}

function updateThemeButton(): void {
  const theme = currentTheme();
  const labels = { system: 'sistema', light: 'claro', dark: 'oscuro' };
  const next = themes[(themes.indexOf(theme) + 1) % themes.length]!;
  themeButton?.setAttribute('aria-label', `Tema: ${labels[theme]}. Cambiar a ${labels[next]}`);
  themeButton?.setAttribute('title', `Tema ${labels[theme]} · cambiar a ${labels[next]}`);
  document.querySelectorAll<HTMLElement>('[data-theme-icon]').forEach((node) => {
    node.hidden = node.dataset['themeIcon'] !== theme;
  });
}

if (themeButton) {
  themeButton.hidden = false;
  updateThemeButton();
  themeButton.addEventListener('click', () => {
    const next = themes[(themes.indexOf(currentTheme()) + 1) % themes.length]!;
    if (next === 'system') delete root.dataset['theme'];
    else root.dataset['theme'] = next;
    try {
      localStorage.setItem('portfolio-theme', next);
    } catch {
      /* La preferencia sigue funcionando sin almacenamiento. */
    }
    updateThemeButton();
  });
}

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.querySelector<HTMLElement>('#navigation');
function closeMenu(returnFocus = false): void {
  nav?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menú');
  if (returnFocus) menuButton?.focus();
}
if (menuButton && nav) {
  root.dataset['enhanced'] = '';
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  nav.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    closeMenu();
    const destination = document.getElementById(link.hash.slice(1));
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && !event.target.closest('.header-inner')) closeMenu();
  });
  if (typeof matchMedia === 'function') {
    const desktop = matchMedia('(min-width: 701px)');
    desktop.addEventListener?.('change', () => {
      closeMenu(!desktop.matches && nav.contains(document.activeElement));
    });
  }
}

const copyButton = document.querySelector<HTMLButtonElement>('.copy-email');
const copyStatus = document.querySelector<HTMLElement>('.copy-status');
if (copyButton && navigator.clipboard?.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    if (copyButton.disabled) return;
    copyButton.disabled = true;
    if (copyStatus) copyStatus.textContent = 'Copiando email…';
    try {
      await navigator.clipboard.writeText(copyButton.dataset['email'] ?? '');
      if (copyStatus) copyStatus.textContent = 'Email copiado.';
    } catch {
      if (copyStatus) copyStatus.textContent = 'Podés seleccionar el email y copiarlo manualmente.';
    } finally {
      copyButton.disabled = false;
    }
  });
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// Visor de capturas: mejora progresiva sobre enlaces a la imagen completa.
// Se monta sólo en navegadores con <dialog> modal para mantener el HTML estático 100% válido.
const lightboxLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')];
if (
  lightboxLinks.length > 0 &&
  typeof HTMLDialogElement !== 'undefined' &&
  typeof HTMLDialogElement.prototype.showModal === 'function'
) {
  let dialog: HTMLDialogElement | null = null;
  let dialogImg: HTMLImageElement | null = null;
  let dialogCaption: HTMLElement | null = null;
  let prevBtn: HTMLButtonElement | null = null;
  let nextBtn: HTMLButtonElement | null = null;
  let activeGroup: HTMLAnchorElement[] = [];
  let activeIndex = 0;
  let triggerLink: HTMLAnchorElement | null = null;

  const renderSlide = (link: HTMLAnchorElement): void => {
    if (!dialogImg || !dialogCaption) return;
    dialogImg.src = link.href;
    dialogImg.alt = link.querySelector('img')?.alt ?? '';
    const hasMultiple = activeGroup.length > 1;
    if (prevBtn) prevBtn.hidden = !hasMultiple;
    if (nextBtn) nextBtn.hidden = !hasMultiple;
    const count = hasMultiple ? ` (${activeIndex + 1}/${activeGroup.length})` : '';
    dialogCaption.textContent = `${link.dataset['caption'] ?? ''}${count}`;
  };

  const stepSlide = (delta: number): void => {
    if (activeGroup.length < 2) return;
    activeIndex = (activeIndex + delta + activeGroup.length) % activeGroup.length;
    renderSlide(activeGroup[activeIndex]!);
  };

  const ensureDialog = (): HTMLDialogElement => {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-labelledby', 'lightbox-caption');

    const bar = document.createElement('div');
    bar.className = 'lightbox-bar';

    dialogCaption = document.createElement('p');
    dialogCaption.id = 'lightbox-caption';
    dialogCaption.className = 'lightbox-caption';

    const actions = document.createElement('div');
    actions.className = 'lightbox-actions';

    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'icon-button lightbox-nav';
    prevBtn.setAttribute('aria-label', 'Captura anterior');
    prevBtn.textContent = '‹';
    prevBtn.addEventListener('click', () => stepSlide(-1));

    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'icon-button lightbox-nav';
    nextBtn.setAttribute('aria-label', 'Captura siguiente');
    nextBtn.textContent = '›';
    nextBtn.addEventListener('click', () => stepSlide(1));

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'icon-button lightbox-close';
    closeBtn.setAttribute('aria-label', 'Cerrar captura');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => dialog?.close());

    actions.append(prevBtn, nextBtn, closeBtn);
    bar.append(dialogCaption, actions);

    const stage = document.createElement('div');
    stage.className = 'lightbox-stage';
    dialogImg = document.createElement('img');
    dialogImg.decoding = 'async';
    stage.append(dialogImg);

    dialog.append(bar, stage);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog?.close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (activeGroup.length < 2) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepSlide(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepSlide(-1);
      }
    });
    dialog.addEventListener('close', () => {
      dialogImg?.removeAttribute('src');
      triggerLink?.focus();
    });
    document.body.append(dialog);
    return dialog;
  };

  lightboxLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      triggerLink = link;
      const groupRoot = link.closest('.gallery');
      activeGroup = groupRoot
        ? [...groupRoot.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')]
        : [link];
      activeIndex = Math.max(0, activeGroup.indexOf(link));
      const modal = ensureDialog();
      renderSlide(link);
      modal.showModal();
    });
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = entry.target.id;
        nav?.querySelectorAll('a').forEach((link) => {
          if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    },
    { rootMargin: '-15% 0px -65% 0px', threshold: 0 },
  );
  document.querySelectorAll('main > section[id]').forEach((section) => observer.observe(section));
}
