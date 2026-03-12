import { showToast } from '../components/toast.js';

const ADDONS_KEY = 'aether_addons';

const DEFAULT_ADDONS = {
  adBlocker: false,
  darkModeInjector: false,
  noRedirect: false,
  privacyShield: false,
  customUserAgent: false,
  jsBlocker: false,
  httpsEnforcer: false,
  cleanUrls: false,
  customUserAgentPreset: 'chrome-win',
  customUserAgentString: '',
};

function loadAddons() {
  try {
    const raw = localStorage.getItem(ADDONS_KEY);
    return raw ? { ...DEFAULT_ADDONS, ...JSON.parse(raw) } : { ...DEFAULT_ADDONS };
  } catch {
    return { ...DEFAULT_ADDONS };
  }
}

function saveAddons(addons) {
  localStorage.setItem(ADDONS_KEY, JSON.stringify(addons));
}

export function getAddonState() {
  return loadAddons();
}

export async function render() {
  const main = document.getElementById('main-content');

  const title = document.createElement('div');
  title.className = 'section-heading';
  title.textContent = 'Addons';
  const subtitle = document.createElement('div');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = 'Toggle enhancements that modify how Aether handles requests.';

  const grid = document.createElement('div');
  grid.className = 'addons-grid';

  main.appendChild(title);
  main.appendChild(subtitle);
  main.appendChild(grid);

  const state = loadAddons();

  const addons = [
    {
      key: 'adBlocker',
      name: 'Ad Blocker',
      description: 'Filter many common ad and tracker domains during proxying.',
    },
    {
      key: 'darkModeInjector',
      name: 'Dark Mode Injector',
      description: 'Attempt to force dark themes on supported sites.',
    },
    {
      key: 'noRedirect',
      name: 'No Redirect',
      description: 'Reduce chances of pages escaping Aether to a new tab.',
    },
    {
      key: 'privacyShield',
      name: 'Privacy Shield',
      description: 'Strip tracking parameters like utm_* and fbclid from URLs.',
    },
    {
      key: 'customUserAgent',
      name: 'Custom User Agent',
      description: 'Send a spoofed user agent string with proxied requests.',
    },
    {
      key: 'jsBlocker',
      name: 'JavaScript Blocker',
      description: 'Try to disable JavaScript in proxied pages where possible.',
    },
    {
      key: 'httpsEnforcer',
      name: 'HTTPS Enforcer',
      description: 'Automatically upgrade http:// URLs to https:// when possible.',
    },
    {
      key: 'cleanUrls',
      name: 'Clean URLs',
      description: 'Strip common tracking query parameters everywhere.',
    },
  ];

  addons.forEach((addon) => {
    const card = document.createElement('div');
    card.className = 'addon-card';

    const header = document.createElement('div');
    header.className = 'addon-header';

    const left = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'addon-name';
    name.textContent = addon.name;
    const desc = document.createElement('div');
    desc.className = 'addon-description';
    desc.textContent = addon.description;
    left.appendChild(name);
    left.appendChild(desc);

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.flexDirection = 'column';
    right.style.alignItems = 'flex-end';
    right.style.gap = '4px';

    const toggle = document.createElement('button');
    toggle.className = 'toggle';
    toggle.setAttribute('role', 'switch');
    toggle.dataset.on = state[addon.key] ? 'true' : 'false';

    const thumb = document.createElement('div');
    thumb.className = 'toggle-thumb';
    toggle.appendChild(thumb);

    const badge = document.createElement('div');
    badge.className =
      'badge-status ' + (state[addon.key] ? 'badge-status-active' : 'badge-status-inactive');
    badge.textContent = state[addon.key] ? 'Active' : 'Inactive';

    toggle.addEventListener('click', () => {
      const current = loadAddons();
      const next = !current[addon.key];
      current[addon.key] = next;
      saveAddons(current);
      toggle.dataset.on = next ? 'true' : 'false';
      badge.className =
        'badge-status ' + (next ? 'badge-status-active' : 'badge-status-inactive');
      badge.textContent = next ? 'Active' : 'Inactive';
      showToast(`${addon.name} ${next ? 'enabled' : 'disabled'}`, 'info');
    });

    right.appendChild(toggle);
    right.appendChild(badge);

    header.appendChild(left);
    header.appendChild(right);
    card.appendChild(header);

    if (addon.key === 'customUserAgent') {
      const panel = document.createElement('div');
      panel.style.marginTop = '8px';
      panel.style.paddingTop = '6px';
      panel.style.borderTop = '1px dashed var(--border-subtle)';
      panel.style.display = state.customUserAgent ? 'block' : 'none';

      toggle.addEventListener('click', () => {
        const current = loadAddons();
        panel.style.display = current.customUserAgent ? 'block' : 'none';
      });

      const select = document.createElement('select');
      select.className = 'input';
      select.style.marginBottom = '6px';
      select.value = state.customUserAgentPreset;

      const presets = [
        ['chrome-mac', 'Chrome on macOS'],
        ['chrome-win', 'Chrome on Windows'],
        ['firefox', 'Firefox'],
        ['safari', 'Safari'],
        ['mobile-chrome', 'Mobile Chrome'],
        ['googlebot', 'Googlebot'],
      ];
      presets.forEach(([value, label]) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        select.appendChild(opt);
      });

      const customInput = document.createElement('input');
      customInput.className = 'input';
      customInput.placeholder = 'Custom user agent string…';
      customInput.value = state.customUserAgentString || '';
      customInput.style.marginTop = '4px';

      const testBtn = document.createElement('button');
      testBtn.className = 'btn btn-secondary';
      testBtn.textContent = 'Test UA';
      testBtn.style.marginTop = '6px';

      testBtn.addEventListener('click', () => {
        const addons = loadAddons();
        showToast(
          `Current UA: ${
            addons.customUserAgentString || navigator.userAgent || 'Unknown'
          }`,
          'info'
        );
      });

      select.addEventListener('change', () => {
        const addons = loadAddons();
        addons.customUserAgentPreset = select.value;
        saveAddons(addons);
      });

      customInput.addEventListener('change', () => {
        const addons = loadAddons();
        addons.customUserAgentString = customInput.value;
        saveAddons(addons);
      });

      panel.appendChild(select);
      panel.appendChild(customInput);
      panel.appendChild(testBtn);
      card.appendChild(panel);
    }

    grid.appendChild(card);
  });
}

