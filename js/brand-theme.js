(() => {
  const key = 'apartyonet_theme';
  const root = document.documentElement;
  const fallback = root.dataset.themeDefault === 'dark' ? 'dark' : 'light';
  try {
    const saved = localStorage.getItem(key);
    root.dataset.theme = saved === 'dark' || saved === 'light' ? saved : fallback;
  } catch (_) {
    root.dataset.theme = fallback;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-brand-theme]');
    function update() {
      const dark = root.dataset.theme === 'dark';
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(dark));
        button.firstElementChild.textContent = dark ? '☀' : '☾';
        button.hidden = false;
      }
    }
    for (const button of buttons) button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, root.dataset.theme); } catch (_) {}
      update();
    });
    update();
  }, { once: true });
})();
