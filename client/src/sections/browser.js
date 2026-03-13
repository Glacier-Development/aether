import { createBlockedScreen } from '../components/blocked-screen.js';

const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  ddg: 'https://duckduckgo.com/?q=',
  brave: 'https://search.brave.com/search?q=',
};

let addressInput;
let frameWrapper;
let iframeEl;

function normalizeUrl(raw, searchEngineKey = 'google') {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const hasDot = trimmed.includes('.');
  const hasSpace = trimmed.includes(' ');

  if (!hasDot || hasSpace) {
    const base = SEARCH_ENGINES[searchEngineKey] || SEARCH_ENGINES.google;
    return `${base}${encodeURIComponent(trimmed)}`;
  }

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

async function isUrlBlocked(url) {
  const res = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`);
  if (!res.ok) return { blocked: false };
  return res.json();
}

async function navigateWithCheck(rawInput) {
  const settings = JSON.parse(localStorage.getItem('aether_settings') || '{}');
  const searchEngineKey = settings.searchEngine || 'google';
  const url = normalizeUrl(rawInput, searchEngineKey);
  if (!url) return;

  const check = await isUrlBlocked(url);
  if (check.blocked) {
    frameWrapper.innerHTML = '';
    frameWrapper.appendChild(
      createBlockedScreen({
        reason: check.reason,
        category: check.category,
      })
    );
    return;
  }

  let token;
  try {
    const res = await fetch('/api/proxy/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.reason || 'Failed to create session');
    }
    const data = await res.json();
    token = data.token;
  } catch (e) {
    frameWrapper.innerHTML = '';
    const err = document.createElement('div');
    err.className = 'blocked-screen';
    err.innerHTML = `<div class="blocked-title">Failed to load</div><div class="blocked-reason">${String(e.message || 'Try again.')}</div>`;
    frameWrapper.appendChild(err);
    return;
  }

  frameWrapper.innerHTML = '';
  iframeEl = document.createElement('iframe');
  iframeEl.className = 'browser-frame-inner';
  iframeEl.src = `/api/proxy/${token}`;
  iframeEl.setAttribute('allow', 'fullscreen; autoplay; picture-in-picture; encrypted-media');
  iframeEl.onerror = () => {
    const err = document.createElement('div');
    err.className = 'blocked-screen';
    err.innerHTML =
      '<div class="blocked-title">Failed to load page</div><div class="blocked-reason">Try again or a different site.</div>';
    frameWrapper.innerHTML = '';
    frameWrapper.appendChild(err);
  };
  frameWrapper.appendChild(iframeEl);
}

function buildHome(main) {
  const shell = document.createElement('div');
  shell.style.minHeight = '260px';
  shell.style.display = 'flex';
  shell.style.flexDirection = 'column';
  shell.style.alignItems = 'center';
  shell.style.justifyContent = 'center';
  shell.style.gap = '14px';

  const title = document.createElement('div');
  title.className = 'section-heading';
  title.textContent = 'Aether New Tab';
  const subtitle = document.createElement('div');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = 'Type a URL or search to start browsing.';

  const input = document.createElement('input');
  input.className = 'input';
  input.placeholder = 'Search or enter address…';
  input.style.maxWidth = '520px';

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      navigateWithCheck(input.value);
    }
  });

  shell.appendChild(title);
  shell.appendChild(subtitle);
  shell.appendChild(input);

  frameWrapper.appendChild(shell);
}

export function focusAddressBar() {
  if (addressInput) addressInput.focus();
}

export async function render(props = {}) {
  const main = document.getElementById('main-content');

  const title = document.createElement('div');
  title.className = 'section-heading';
  title.textContent = 'Browser';
  const subtitle = document.createElement('div');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = 'A minimal in-browser tab, proxied through Aether.';

  const chrome = document.createElement('div');
  chrome.className = 'browser-chrome glass-panel';

  const toolbar = document.createElement('div');
  toolbar.className = 'browser-toolbar';

  const btnGroup = document.createElement('div');
  btnGroup.className = 'browser-buttons';

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-ghost';
  backBtn.textContent = '←';
  backBtn.addEventListener('click', () => {
    if (iframeEl && iframeEl.contentWindow) {
      iframeEl.contentWindow.history.back();
    }
  });

  const fwdBtn = document.createElement('button');
  fwdBtn.className = 'btn btn-ghost';
  fwdBtn.textContent = '→';
  fwdBtn.addEventListener('click', () => {
    if (iframeEl && iframeEl.contentWindow) {
      iframeEl.contentWindow.history.forward();
    }
  });

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'btn btn-ghost';
  refreshBtn.textContent = '↺';
  refreshBtn.addEventListener('click', () => {
    if (iframeEl) {
      iframeEl.src = iframeEl.src;
    }
  });

  btnGroup.appendChild(backBtn);
  btnGroup.appendChild(fwdBtn);
  btnGroup.appendChild(refreshBtn);

  const bar = document.createElement('div');
  bar.className = 'browser-bar';

  addressInput = document.createElement('input');
  addressInput.className = 'input';
  addressInput.placeholder = 'Search or enter address…';

  const goBtn = document.createElement('button');
  goBtn.className = 'btn btn-secondary';
  goBtn.textContent = 'Go';

  goBtn.addEventListener('click', () => {
    navigateWithCheck(addressInput.value);
  });
  addressInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      navigateWithCheck(addressInput.value);
    }
  });

  bar.appendChild(addressInput);
  bar.appendChild(goBtn);

  toolbar.appendChild(btnGroup);
  toolbar.appendChild(bar);

  chrome.appendChild(toolbar);

  const frameContainer = document.createElement('div');
  frameContainer.className = 'browser-frame-container';
  frameWrapper = document.createElement('div');
  frameWrapper.className = 'browser-frame';
  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.className = 'btn btn-ghost browser-fullscreen-btn';
  fullscreenBtn.title = 'Fullscreen';
  fullscreenBtn.textContent = '⛶';
  fullscreenBtn.type = 'button';
  fullscreenBtn.addEventListener('click', () => {
    const el = frameWrapper.requestFullscreen ? frameWrapper : document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  });
  frameContainer.appendChild(frameWrapper);
  frameContainer.appendChild(fullscreenBtn);
  chrome.appendChild(frameContainer);

  main.appendChild(title);
  main.appendChild(subtitle);
  main.appendChild(chrome);

  if (props.url) {
    addressInput.value = props.url;
    navigateWithCheck(props.url);
  } else {
    buildHome(main);
  }
}

