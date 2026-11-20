// Compartido por inicio y 404; corre antes de pintar.
(() => {
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  try {
    const theme = localStorage.getItem('portfolio-theme');
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  } catch {
    // CSS aplica la preferencia del sistema cuando no hay almacenamiento.
  }

  function syncBrowserColor() {
    // La fuente del color es CSS: no duplicar la paleta en JavaScript.
    const color = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (color) themeColor?.setAttribute('content', color);
  }
  syncBrowserColor();
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(syncBrowserColor).observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }
  if (typeof matchMedia === 'function') {
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncBrowserColor);
  }
})();
