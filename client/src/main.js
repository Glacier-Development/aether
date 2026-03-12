import { registerServiceWorkers } from './sw-register.js';
import { showToast } from './components/toast.js';
import { focusAddressBar } from './sections/browser.js';

const routes = {
  '#/games': () => import('./sections/games.js').then((m) => m.render()),
  '#/browser': (props) => import('./sections/browser.js').then((m) => m.render(props)),
  '#/apps': () => import('./sections/apps.js').then((m) => m.render()),
  '#/addons': () => import('./sections/addons.js').then((m) => m.render()),
  '#/settings': () => import('./sections/settings.js').then((m) => m.render()),
};

const shortcuts = new Map();
let lastEscapeTime = 0;

export const router = {
  navigate(section, props) {
    const hash = `/${section}`;
    window.location.hash = hash;
    router._pendingProps = props || null;
  },
  async init() {
    window.addEventListener('hashchange', handleRoute);
    await handleRoute();
  },
  _pendingProps: null,
};

async function handleRoute() {
  const hash = window.location.hash || '#/games';
  const mainEl = document.getElementById('main-content');
  if (!mainEl) return;

  mainEl.classList.add('fade-out');
  await new Promise((res) => setTimeout(res, 150));

  mainEl.innerHTML = '';
  const handler = routes[hash] || routes['#/games'];
  await handler(router._pendingProps || {});
  router._pendingProps = null;

  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === hash);
  });

  mainEl.classList.remove('fade-out');
  mainEl.classList.add('fade-in');
  await new Promise((res) => setTimeout(res, 250));
  mainEl.classList.remove('fade-in');
}

export function registerShortcut(combo, fn) {
  shortcuts.set(combo, fn);
}

document.addEventListener('keydown', (e) => {
  const key = [
    e.ctrlKey ? 'ctrl' : '',
    e.shiftKey ? 'shift' : '',
    e.altKey ? 'alt' : '',
    e.key.toLowerCase(),
  ]
    .filter(Boolean)
    .join('+');

  if (shortcuts.has(key)) {
    e.preventDefault();
    shortcuts.get(key)();
    return;
  }

  if (e.key === 'Escape') {
    const now = Date.now();
    if (now - lastEscapeTime < 500) {
      const settings = JSON.parse(localStorage.getItem('aether_settings') || '{}');
      const url = settings.panic?.url || 'https://google.com';
      window.location.href = url;
    }
    lastEscapeTime = now;
  }
});

async function initMotd() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return;
    const cfg = await res.json();
    const motd = cfg.motd;
    const el = document.getElementById('motd-ticker');
    const textEl = document.getElementById('motd-text');
    if (!motd || !motd.enabled) {
      if (el) el.style.display = 'none';
      return;
    }
    if (textEl) textEl.textContent = motd.text || '';
  } catch {
    // ignore
  }
}

function initSidebarNav() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      window.location.hash = route;
    });
  });
}

function initShortcuts() {
  registerShortcut('ctrl+k', () => {
    import('./admin/panel.js').then((m) => m.openAdminPrompt());
  });
  registerShortcut('ctrl+g', () => {
    router.navigate('games');
  });
  registerShortcut('ctrl+shift+b', () => {
    router.navigate('browser');
  });
  registerShortcut('ctrl+shift+a', () => {
    router.navigate('apps');
  });
  registerShortcut('ctrl+b', () => {
    focusAddressBar();
  });
}

async function bootstrap() {
  initSidebarNav();
  initShortcuts();
  await initMotd();
  await registerServiceWorkers();
  await router.init();
  showToast('Aether ready. Press Ctrl+K for admin.', 'info');
}

bootstrap();

