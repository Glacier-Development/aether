const SETTINGS_KEY = 'aether_settings';

const DEFAULTS = {
  accentColor: 'sky',
  proxyEngine: 'custom',
  searchEngine: 'google',
  cloak: {
    type: 'none',
    customTitle: '',
  },
  panic: {
    key: 'escape-double',
    url: 'https://google.com',
  },
  animation: 'normal',
  fontSize: 'medium',
  sidebar: 'expanded',
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyAccent(accentKey) {
  const root = document.documentElement;
  const colors = {
    sky: '#63b3ed',
    purple: '#9f7aea',
    green: '#48bb78',
    orange: '#f6ad55',
    pink: '#f687b3',
  };
  const val = colors[accentKey] || colors.sky;
  root.style.setProperty('--accent-primary', val);
}

function applyFontSize(sizeKey) {
  const sizes = {
    small: '13px',
    medium: '14px',
    large: '16px',
  };
  document.documentElement.style.fontSize = sizes[sizeKey] || sizes.medium;
}

function applyCloak(cloak) {
  let title = 'Aether – Web Proxy';
  if (cloak.type === 'google-docs') title = 'Untitled document - Google Docs';
  if (cloak.type === 'clever') title = 'Clever | Portal';
  if (cloak.type === 'canvas') title = 'Dashboard';
  if (cloak.type === 'khan') title = 'Khan Academy';
  if (cloak.type === 'custom' && cloak.customTitle) title = cloak.customTitle;
  document.title = title;
}

export function getSettings() {
  return loadSettings();
}

export async function render() {
  const main = document.getElementById('main-content');
  const settings = loadSettings();

  applyAccent(settings.accentColor);
  applyFontSize(settings.fontSize);
  applyCloak(settings.cloak);

  const title = document.createElement('div');
  title.className = 'section-heading';
  title.textContent = 'Settings';
  const subtitle = document.createElement('div');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = 'Tune Aether to match your preferences.';

  main.appendChild(title);
  main.appendChild(subtitle);

  const appearanceGroup = document.createElement('section');
  appearanceGroup.className = 'settings-group';
  const apTitle = document.createElement('div');
  apTitle.className = 'settings-group-title';
  apTitle.textContent = 'Appearance';
  appearanceGroup.appendChild(apTitle);

  const accentRow = document.createElement('div');
  accentRow.className = 'settings-row';
  const accentMain = document.createElement('div');
  accentMain.className = 'settings-row-main';
  const accentLabel = document.createElement('div');
  accentLabel.className = 'settings-label';
  accentLabel.textContent = 'Accent color';
  const accentDesc = document.createElement('div');
  accentDesc.className = 'settings-description';
  accentDesc.textContent = 'Choose the primary glow and highlight color.';
  accentMain.appendChild(accentLabel);
  accentMain.appendChild(accentDesc);
  const accentControls = document.createElement('div');
  ['sky', 'purple', 'green', 'orange', 'pink'].forEach((key) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.textContent = key;
    if (settings.accentColor === key) {
      btn.style.color = 'var(--accent-primary)';
    }
    btn.addEventListener('click', () => {
      const next = loadSettings();
      next.accentColor = key;
      saveSettings(next);
      applyAccent(key);
      Array.from(accentControls.children).forEach((c) => (c.style.color = 'var(--text-secondary)'));
      btn.style.color = 'var(--accent-primary)';
    });
    accentControls.appendChild(btn);
  });
  accentRow.appendChild(accentMain);
  accentRow.appendChild(accentControls);
  appearanceGroup.appendChild(accentRow);

  const fontRow = document.createElement('div');
  fontRow.className = 'settings-row';
  const fontMain = document.createElement('div');
  fontMain.className = 'settings-row-main';
  const fontLabel = document.createElement('div');
  fontLabel.className = 'settings-label';
  fontLabel.textContent = 'Font size';
  const fontDesc = document.createElement('div');
  fontDesc.className = 'settings-description';
  fontDesc.textContent = 'Adjust interface text size.';
  fontMain.appendChild(fontLabel);
  fontMain.appendChild(fontDesc);
  const fontControls = document.createElement('div');
  ['small', 'medium', 'large'].forEach((size) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.textContent = size;
    if (settings.fontSize === size) btn.style.color = 'var(--accent-primary)';
    btn.addEventListener('click', () => {
      const next = loadSettings();
      next.fontSize = size;
      saveSettings(next);
      applyFontSize(size);
      Array.from(fontControls.children).forEach((c) => (c.style.color = 'var(--text-secondary)'));
      btn.style.color = 'var(--accent-primary)';
    });
    fontControls.appendChild(btn);
  });
  fontRow.appendChild(fontMain);
  fontRow.appendChild(fontControls);
  appearanceGroup.appendChild(fontRow);

  const behaviorGroup = document.createElement('section');
  behaviorGroup.className = 'settings-group';
  const bTitle = document.createElement('div');
  bTitle.className = 'settings-group-title';
  bTitle.textContent = 'Behavior';
  behaviorGroup.appendChild(bTitle);

  const searchRow = document.createElement('div');
  searchRow.className = 'settings-row';
  const searchMain = document.createElement('div');
  searchMain.className = 'settings-row-main';
  const searchLabel = document.createElement('div');
  searchLabel.className = 'settings-label';
  searchLabel.textContent = 'Search engine';
  const searchDesc = document.createElement('div');
  searchDesc.className = 'settings-description';
  searchDesc.textContent = 'Used when entering non-URL queries.';
  searchMain.appendChild(searchLabel);
  searchMain.appendChild(searchDesc);
  const searchSelect = document.createElement('select');
  searchSelect.className = 'input';
  [['google', 'Google'], ['bing', 'Bing'], ['ddg', 'DuckDuckGo'], ['brave', 'Brave']].forEach(
    ([val, label]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      searchSelect.appendChild(opt);
    }
  );
  searchSelect.value = settings.searchEngine;
  searchSelect.addEventListener('change', () => {
    const next = loadSettings();
    next.searchEngine = searchSelect.value;
    saveSettings(next);
  });
  searchRow.appendChild(searchMain);
  searchRow.appendChild(searchSelect);
  behaviorGroup.appendChild(searchRow);

  const panicRow = document.createElement('div');
  panicRow.className = 'settings-row';
  const panicMain = document.createElement('div');
  panicMain.className = 'settings-row-main';
  const panicLabel = document.createElement('div');
  panicLabel.className = 'settings-label';
  panicLabel.textContent = 'Panic redirect';
  const panicDesc = document.createElement('div');
  panicDesc.className = 'settings-description';
  panicDesc.textContent = 'Double-press Escape to jump to a safe URL.';
  panicMain.appendChild(panicLabel);
  panicMain.appendChild(panicDesc);
  const panicInput = document.createElement('input');
  panicInput.className = 'input';
  panicInput.value = settings.panic.url;
  panicInput.addEventListener('change', () => {
    const next = loadSettings();
    next.panic.url = panicInput.value;
    saveSettings(next);
  });
  panicRow.appendChild(panicMain);
  panicRow.appendChild(panicInput);
  behaviorGroup.appendChild(panicRow);

  const cloakGroup = document.createElement('section');
  cloakGroup.className = 'settings-group';
  const cTitle = document.createElement('div');
  cTitle.className = 'settings-group-title';
  cTitle.textContent = 'Cloak';
  cloakGroup.appendChild(cTitle);

  const cloakRow = document.createElement('div');
  cloakRow.className = 'settings-row';
  const cloakMain = document.createElement('div');
  cloakMain.className = 'settings-row-main';
  const cloakLabel = document.createElement('div');
  cloakLabel.className = 'settings-label';
  cloakLabel.textContent = 'Tab disguise';
  const cloakDesc = document.createElement('div');
  cloakDesc.className = 'settings-description';
  cloakDesc.textContent = 'Change the tab title to blend in.';
  cloakMain.appendChild(cloakLabel);
  cloakMain.appendChild(cloakDesc);
  const cloakSelect = document.createElement('select');
  cloakSelect.className = 'input';
  [
    ['none', 'None'],
    ['google-docs', 'Google Docs'],
    ['clever', 'Clever'],
    ['canvas', 'Canvas'],
    ['khan', 'Khan Academy'],
    ['custom', 'Custom'],
  ].forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    cloakSelect.appendChild(opt);
  });
  cloakSelect.value = settings.cloak.type;
  const cloakCustomInput = document.createElement('input');
  cloakCustomInput.className = 'input';
  cloakCustomInput.placeholder = 'Custom tab title…';
  cloakCustomInput.value = settings.cloak.customTitle || '';
  cloakCustomInput.style.marginTop = '6px';
  cloakCustomInput.style.display = settings.cloak.type === 'custom' ? 'block' : 'none';
  cloakSelect.addEventListener('change', () => {
    const next = loadSettings();
    next.cloak.type = cloakSelect.value;
    saveSettings(next);
    applyCloak(next.cloak);
    cloakCustomInput.style.display = cloakSelect.value === 'custom' ? 'block' : 'none';
  });
  cloakCustomInput.addEventListener('change', () => {
    const next = loadSettings();
    next.cloak.customTitle = cloakCustomInput.value;
    saveSettings(next);
    applyCloak(next.cloak);
  });
  const cloakRight = document.createElement('div');
  cloakRight.style.display = 'flex';
  cloakRight.style.flexDirection = 'column';
  cloakRight.appendChild(cloakSelect);
  cloakRight.appendChild(cloakCustomInput);
  cloakRow.appendChild(cloakMain);
  cloakRow.appendChild(cloakRight);
  cloakGroup.appendChild(cloakRow);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary';
  resetBtn.textContent = 'Reset to defaults';
  resetBtn.style.marginTop = '10px';
  resetBtn.addEventListener('click', () => {
    saveSettings(DEFAULTS);
    window.location.reload();
  });

  main.appendChild(appearanceGroup);
  main.appendChild(behaviorGroup);
  main.appendChild(cloakGroup);
  main.appendChild(resetBtn);
}

