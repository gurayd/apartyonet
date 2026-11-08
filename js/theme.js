(function themeBootstrap() {
  const THEME_KEY = "apartyonet_theme";
  const THEME_LIGHT = "light";
  const THEME_DARK = "dark";

  function getSystemTheme() {
    return THEME_DARK;
  }

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === THEME_LIGHT || saved === THEME_DARK ? saved : "";
    } catch (_) {
      return "";
    }
  }

  function getActiveTheme() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === THEME_LIGHT || attr === THEME_DARK) return attr;
    return getSavedTheme() || getSystemTheme();
  }

  function setTheme(theme, persist) {
    const safeTheme = theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
    document.documentElement.setAttribute("data-theme", safeTheme);
    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, safeTheme);
      } catch (_) {}
    }
    syncThemeUi();
    return safeTheme;
  }

  function injectSharedStyle() {
    if (document.getElementById("appThemeStyle")) return;
    const style = document.createElement("style");
    style.id = "appThemeStyle";
    style.textContent = `
      :root {
        --surface: rgba(14, 22, 37, 0.9);
        --surface-2: rgba(11, 18, 31, 0.82);
        --text-muted: #9fb0cf;
        --border: rgba(152, 175, 214, 0.24);
        --input-bg: rgba(9, 14, 24, 0.78);
        --input-text: #e8eefc;
        --table-bg: rgba(11, 18, 31, 0.78);
        --table-head: rgba(46, 160, 255, 0.15);
        --chip-bg: rgba(152, 175, 214, 0.22);
        --modal-overlay: rgba(3, 7, 15, 0.72);
        --modal-bg: linear-gradient(165deg, rgba(17, 26, 43, 0.96), rgba(10, 16, 27, 0.96));
        --danger: #ef4444;
        --success: #22c55e;
      }

      html[data-theme="light"] {
        --bg: #eef4fb;
        --surface: #ffffff;
        --surface-2: #f4f8ff;
        --text: #0f172a;
        --text-muted: #334155;
        --muted: #334155;
        --line: rgba(15, 23, 42, 0.16);
        --border: rgba(15, 23, 42, 0.16);
        --input-bg: #ffffff;
        --input-text: #0f172a;
        --table-bg: #ffffff;
        --table-head: #e7eef9;
        --chip-bg: #e7eef9;
        --modal-overlay: rgba(15, 23, 42, 0.34);
        --modal-bg: linear-gradient(165deg, #ffffff, #f2f7ff);
        --danger: #b91c1c;
        --success: #15803d;
      }

      html, body {
        transition: background-color .2s ease, color .2s ease, border-color .2s ease;
      }

      #appThemeFloating {
        position: fixed;
        top: calc(12px + env(safe-area-inset-top, 0px));
        right: calc(12px + env(safe-area-inset-right, 0px));
        z-index: 180;
      }

      #appThemeToggleMain {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 10px 28px rgba(2, 6, 23, 0.25);
      }

      @media (max-width: 640px) {
        #appThemeFloating {
          top: calc(8px + env(safe-area-inset-top, 0px));
          right: calc(8px + env(safe-area-inset-right, 0px));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureFloatingControl() {
    if (document.body && document.body.getAttribute("data-disable-floating-theme") === "true") return;
    if (document.querySelector("[data-inline-theme-toggle]")) return;
    if (document.getElementById("appThemeFloating") || !document.body) return;

    const wrap = document.createElement("div");
    wrap.id = "appThemeFloating";
    wrap.innerHTML = `
      <button id="appThemeToggleMain" type="button" aria-label="Temayı değiştir" title="Temayı değiştir">
        <span id="appThemeMainIcon" aria-hidden="true">🌙</span>
      </button>
    `;
    document.body.appendChild(wrap);

    const mainBtn = wrap.querySelector("#appThemeToggleMain");
    mainBtn.addEventListener("click", () => {
      const current = getActiveTheme();
      const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      setTheme(next, true);
    });
  }

  function syncThemeUi() {
    const active = getActiveTheme();
    const icon = document.getElementById("appThemeMainIcon");
    if (icon) {
      icon.textContent = active === THEME_DARK ? "🌙" : "☀";
    }
    document.querySelectorAll("[data-inline-theme-toggle]").forEach((btn) => {
      const iconEl = btn.querySelector("[data-theme-icon]");
      const textEl = btn.querySelector("[data-theme-text]");
      if (iconEl) iconEl.textContent = active === THEME_DARK ? "🌙" : "☀";
      if (textEl) textEl.textContent = active === THEME_DARK ? "Dark" : "Light";
    });
  }

  function initThemeFromPreference() {
    const saved = getSavedTheme();
    const resolved = saved || THEME_DARK;
    document.documentElement.setAttribute("data-theme", resolved);
  }

  function init() {
    injectSharedStyle();
    initThemeFromPreference();
    ensureFloatingControl();
    syncThemeUi();
  }

  window.AppTheme = {
    init,
    setTheme,
    getTheme: getActiveTheme,
    toggleTheme: function toggleTheme() {
      const current = getActiveTheme();
      const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      setTheme(next, true);
      return next;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
