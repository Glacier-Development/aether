import { router } from '../main.js';

let appsCache = null;

async function fetchApps() {
  if (appsCache) return appsCache;
  const cached = sessionStorage.getItem('aether_apps');
  if (cached) {
    appsCache = JSON.parse(cached);
    return appsCache;
  }
  const res = await fetch('/api/apps');
  const data = await res.json();
  appsCache = data;
  sessionStorage.setItem('aether_apps', JSON.stringify(data));
  return data;
}

function launchApp(app) {
  router.navigate('browser', { url: app.url });
}

export async function render() {
  const main = document.getElementById('main-content');

  const title = document.createElement('div');
  title.className = 'section-heading';
  title.textContent = 'Apps';
  const subtitle = document.createElement('div');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = 'Quick-launch your favorite web apps through Aether.';

  const grid = document.createElement('div');
  grid.className = 'apps-grid';

  main.appendChild(title);
  main.appendChild(subtitle);
  main.appendChild(grid);

  const data = await fetchApps();
  const apps = data.apps || [];

  if (apps.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No apps configured yet.';
    empty.style.color = 'var(--text-secondary)';
    empty.style.fontSize = '13px';
    grid.appendChild(empty);
    return;
  }

  apps.forEach((app) => {
    const card = document.createElement('button');
    card.className = 'app-card focus-ring';
    if (app.color) {
      card.style.background = `linear-gradient(145deg, ${app.color}22, #020617)`;
    }

    const iconWrap = document.createElement('div');
    iconWrap.className = 'app-icon-wrap';
    if (app.color) {
      iconWrap.style.background = `${app.color}22`;
    }
    const img = document.createElement('img');
    img.src = app.icon;
    img.alt = app.name;
    img.loading = 'lazy';
    iconWrap.appendChild(img);

    const name = document.createElement('div');
    name.style.fontSize = '13px';
    name.style.fontWeight = '500';
    name.textContent = app.name;

    card.appendChild(iconWrap);
    card.appendChild(name);
    card.addEventListener('click', () => launchApp(app));

    grid.appendChild(card);
  });
}

