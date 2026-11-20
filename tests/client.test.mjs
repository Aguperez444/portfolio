import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const client = (await readFile('.build/client.js', 'utf8')).replace(/export\s*\{\s*\};?\s*$/, '');
const theme = await readFile('public/theme.js', 'utf8');

// Dobles de las APIs DOM utilizadas por los manejadores. No es un navegador:
// estas pruebas verifican estados/eventos; no layout, Tab real ni touch.
function environment({ saved = null, storageError = false, clipboard, systemDark = false } = {}) {
  const observers = [];
  let document;
  class Element {
    constructor() {
      this.attributes = new Map();
      this.listeners = new Map();
      this.dataset = {};
      this.hidden = true;
      this.disabled = false;
      this.textContent = '';
      this.children = [];
      const classes = new Set();
      this.classList = {
        contains: (name) => classes.has(name),
        remove: (name) => classes.delete(name),
        toggle: (name) => {
          if (classes.has(name)) {
            classes.delete(name);
            return false;
          }
          classes.add(name);
          return true;
        },
      };
    }
    addEventListener(name, listener) {
      this.listeners.set(name, listener);
    }
    emit(name, event = {}) {
      return this.listeners.get(name)?.({ target: this, ...event });
    }
    setAttribute(name, value) {
      this.attributes.set(name, value);
    }
    getAttribute(name) {
      return this.attributes.get(name);
    }
    removeAttribute(name) {
      this.attributes.delete(name);
      if (name === 'src') delete this.src;
    }
    append(...nodes) {
      this.children.push(...nodes);
    }
    querySelector(selector) {
      if (selector === 'img') return this.children.find((node) => node.tagName === 'img') ?? null;
      return null;
    }
    querySelectorAll() {
      return this.children;
    }
    contains(node) {
      return node === this || this.children.includes(node);
    }
    closest(selector) {
      if (selector === 'a[href^="#"]') return this.hash ? this : null;
      if (selector === '.header-inner') return this.insideHeader ? this : null;
      if (selector === '.gallery') return this.gallery ?? null;
      return null;
    }
    focus(options) {
      document.activeElement = this;
      this.focusOptions = options;
    }
  }
  class HTMLDialogElement extends Element {
    constructor() {
      super();
      this.open = false;
    }
    showModal() {
      this.open = true;
    }
    close() {
      if (!this.open) return;
      this.open = false;
      this.emit('close');
    }
  }
  const root = new Element();
  root.dataset = new Proxy(
    {},
    {
      set(target, key, value) {
        target[key] = value;
        observers.forEach((callback) => callback());
        return true;
      },
      deleteProperty(target, key) {
        delete target[key];
        observers.forEach((callback) => callback());
        return true;
      },
    },
  );
  const themeButton = new Element(),
    menuButton = new Element(),
    nav = new Element();
  const copyButton = new Element(),
    copyStatus = new Element(),
    meta = new Element();
  const destination = new Element(),
    link = new Element();
  link.hash = '#proyectos';
  link.insideHeader = true;
  nav.children.push(link);
  copyButton.dataset.email = 'persona@example.com';
  const icons = ['system', 'light', 'dark'].map((value) => {
    const node = new Element();
    node.dataset.themeIcon = value;
    return node;
  });
  const gallery = new Element();
  const slides = [
    { href: '/images/ganker-landing-1600.webp', caption: 'Ganker · Inicio', alt: 'Inicio' },
    { href: '/images/ganker-dashboard-1600.webp', caption: 'Ganker · Panel', alt: 'Panel' },
  ].map((item) => {
    const anchor = new Element();
    anchor.href = item.href;
    anchor.dataset.caption = item.caption;
    anchor.gallery = gallery;
    const thumb = new Element();
    thumb.tagName = 'img';
    thumb.alt = item.alt;
    anchor.append(thumb);
    gallery.append(anchor);
    return anchor;
  });
  const nodes = {
    '.theme-toggle': themeButton,
    '.menu-toggle': menuButton,
    '#navigation': nav,
    '.copy-email': copyButton,
    '.copy-status': copyStatus,
    'meta[name="theme-color"]': meta,
  };
  document = new Element();
  document.documentElement = root;
  document.body = new Element();
  document.createElement = (tag) => {
    const el = tag === 'dialog' ? new HTMLDialogElement() : new Element();
    el.tagName = tag;
    return el;
  };
  document.querySelector = (selector) => nodes[selector] ?? null;
  document.querySelectorAll = (selector) => {
    if (selector === '[data-theme-icon]') return icons;
    if (selector === 'a[data-lightbox]') return slides;
    return [];
  };
  document.getElementById = (id) => (id === 'proyectos' ? destination : null);
  const desktop = new Element();
  desktop.matches = false;
  const system = new Element();
  system.matches = systemDark;
  const context = {
    document,
    Element,
    HTMLDialogElement,
    navigator: { clipboard },
    localStorage: {
      getItem() {
        if (storageError) throw new Error('Storage disabled');
        return saved;
      },
      setItem(_key, value) {
        if (storageError) throw new Error('Storage disabled');
        saved = value;
      },
    },
    matchMedia: (query) => (query.includes('prefers-color-scheme') ? system : desktop),
    getComputedStyle: () => ({
      getPropertyValue: () =>
        root.dataset.theme === 'dark' || (!root.dataset.theme && system.matches)
          ? '#0b1219'
          : '#f7f9fa',
    }),
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        observers.push(this.callback);
      }
    },
  };
  context.window = context;
  runInNewContext(theme, context);
  runInNewContext(client, context);
  return {
    root,
    themeButton,
    menuButton,
    nav,
    link,
    destination,
    desktop,
    system,
    copyButton,
    copyStatus,
    slides,
    meta,
    document,
    Element,
  };
}

test('preferencia persistida, cambio manual y cambio del sistema sincronizan el color del navegador', () => {
  const e = environment({ saved: 'dark' });
  assert.equal(e.root.dataset.theme, 'dark');
  assert.equal(e.meta.getAttribute('content'), '#0b1219');
  e.themeButton.emit('click'); // oscuro → sistema claro
  assert.equal(e.root.dataset.theme, undefined);
  assert.equal(e.meta.getAttribute('content'), '#f7f9fa');
  e.system.matches = true;
  e.system.emit('change');
  assert.equal(e.meta.getAttribute('content'), '#0b1219');
  e.themeButton.emit('click'); // sistema → claro, aunque el sistema esté oscuro
  assert.equal(e.root.dataset.theme, 'light');
  assert.equal(e.meta.getAttribute('content'), '#f7f9fa');
  assert.match(e.themeButton.getAttribute('aria-label'), /Tema: claro/);
});

test('storage deshabilitado o una preferencia inválida no bloquean la interfaz', () => {
  const e = environment({ storageError: true });
  e.themeButton.emit('click');
  assert.equal(e.root.dataset.theme, 'light');
  assert.equal(e.menuButton.hidden, false);
  assert.equal(environment({ saved: '<invalid>' }).root.dataset.theme, undefined);
});

test('menú: Escape, destino, click exterior y cambio de breakpoint dejan estados y foco coherentes', () => {
  const e = environment();
  e.menuButton.emit('click');
  assert.equal(e.menuButton.getAttribute('aria-expanded'), 'true');
  e.document.emit('keydown', { key: 'Escape' });
  assert.equal(e.document.activeElement, e.menuButton);
  assert.equal(e.nav.classList.contains('is-open'), false);
  e.menuButton.emit('click');
  e.nav.emit('click', { target: e.link });
  assert.equal(e.document.activeElement, e.destination);
  assert.equal(e.destination.getAttribute('tabindex'), '-1');
  assert.equal(e.destination.focusOptions.preventScroll, true);
  assert.equal(e.menuButton.getAttribute('aria-expanded'), 'false');
  e.menuButton.emit('click');
  e.document.emit('click', { target: new e.Element() });
  assert.equal(e.nav.classList.contains('is-open'), false);
  e.document.activeElement = e.link;
  e.desktop.emit('change');
  assert.equal(e.document.activeElement, e.menuButton);
});

test('clipboard: evita operaciones concurrentes y permite recuperarse del rechazo de permiso', async () => {
  let release,
    writes = 0;
  const e = environment({
    clipboard: {
      writeText: () => {
        writes++;
        return new Promise((resolve) => {
          release = resolve;
        });
      },
    },
  });
  const pending = e.copyButton.emit('click');
  assert.equal(e.copyButton.disabled, true);
  await e.copyButton.emit('click');
  assert.equal(writes, 1);
  release();
  await pending;
  assert.equal(e.copyButton.disabled, false);
  assert.equal(e.copyStatus.textContent, 'Email copiado.');
  const rejected = environment({
    clipboard: {
      writeText: async () => {
        throw new Error('Permission denied');
      },
    },
  });
  await rejected.copyButton.emit('click');
  assert.equal(rejected.copyButton.disabled, false);
  assert.match(rejected.copyStatus.textContent, /copiarlo manualmente/);
  assert.equal(environment().copyButton.hidden, true);
});

test('visor de capturas: abre modal bajo demanda, navega el grupo y restaura el foco al cerrar', () => {
  const e = environment();
  assert.equal(e.document.body.children.length, 0);

  let prevented = false;
  e.slides[0].emit('click', {
    button: 0,
    ctrlKey: true,
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, false);
  assert.equal(e.document.body.children.length, 0);

  e.slides[0].emit('click', {
    button: 0,
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.equal(e.document.body.children.length, 1);

  const modal = e.document.body.children[0];
  const [bar, stage] = modal.children;
  const [caption, actions] = bar.children;
  const [prevBtn, nextBtn] = actions.children;
  const [img] = stage.children;

  assert.equal(modal.open, true);
  assert.equal(prevBtn.hidden, false);
  assert.equal(nextBtn.hidden, false);
  assert.equal(img.src, '/images/ganker-landing-1600.webp');
  assert.equal(caption.textContent, 'Ganker · Inicio (1/2)');

  modal.emit('keydown', { key: 'ArrowRight', preventDefault() {} });
  assert.equal(img.src, '/images/ganker-dashboard-1600.webp');
  assert.equal(caption.textContent, 'Ganker · Panel (2/2)');

  prevBtn.emit('click');
  assert.equal(caption.textContent, 'Ganker · Inicio (1/2)');

  modal.emit('click', { target: modal });
  assert.equal(modal.open, false);
  assert.equal(img.src, undefined);
  assert.equal(e.document.activeElement, e.slides[0]);
});
