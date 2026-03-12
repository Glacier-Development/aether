import { openModal } from '../components/modal.js';

let gamesCache = null;
let searchTimeout = null;

async function fetchGames() {
  if (gamesCache) return gamesCache;
  const cached = sessionStorage.getItem('aether_games');
  if (cached) {
    gamesCache = JSON.parse(cached);
    return gamesCache;
  }
  const res = await fetch('/api/games');
  const data = await res.json();
  gamesCache = data;
  sessionStorage.setItem('aether_games', JSON.stringify(data));
  return data;
}

function renderGrid(container, games) {
  container.innerHTML = '';
  if (!games || games.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No games available.';
    empty.style.color = 'var(--text-secondary)';
    empty.style.fontSize = '13px';
    container.appendChild(empty);
    return;
  }
  games.forEach((game) => {
    const card = document.createElement('button');
    card.className = 'card focus-ring';

    const thumb = document.createElement('div');
    thumb.className = 'card-thumb skeleton';
    if (game.thumbnail) {
      const img = document.createElement('img');
      img.src = game.thumbnail;
      img.alt = game.name;
      img.loading = 'lazy';
      img.onload = () => thumb.classList.remove('skeleton');
      thumb.appendChild(img);
    } else {
      thumb.textContent = game.name[0] || '?';
    }

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = game.name;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const cat = document.createElement('span');
    cat.className = 'badge badge-accent';
    cat.textContent = game.category;
    const plays = document.createElement('span');
    plays.textContent = `${game.plays.toLocaleString()} plays`;
    meta.appendChild(cat);
    meta.appendChild(plays);

    card.appendChild(thumb);
    card.appendChild(title);
    card.appendChild(meta);

    card.addEventListener('click', () => launchGame(game));

    container.appendChild(card);
  });
}

function launchGame(game) {
  const url = `/api/proxy?url=${encodeURIComponent(game.url)}`;
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.className = 'browser-frame-inner';
  frame.allowFullscreen = true;

  const wrapper = document.createElement('div');
  wrapper.style.height = '70vh';
  wrapper.className = 'browser-frame';
  wrapper.appendChild(frame);

  openModal({
    title: game.name,
    contentNode: wrapper,
  });
}

export async function render() {
  const main = document.getElementById('main-content');

  const title = document.createElement('div');
  title.className = 'section-heading';
  title.textContent = 'Games';
  const subtitle = document.createElement('div');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = 'Play a curated collection of unblocked browser games.';

  const toolbar = document.createElement('div');
  toolbar.className = 'games-toolbar';

  const search = document.createElement('input');
  search.className = 'input games-search';
  search.placeholder = 'Search games…';

  const chips = document.createElement('div');
  chips.className = 'chip-row';

  toolbar.appendChild(search);
  toolbar.appendChild(chips);

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  main.appendChild(title);
  main.appendChild(subtitle);
  main.appendChild(toolbar);
  main.appendChild(grid);

  const data = await fetchGames();
  const categories = ['All', ...(data.categories || [])];

  let activeCategory = 'All';
  let searchTerm = '';

  categories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === 'All' ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      activeCategory = cat;
      Array.from(chips.children).forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      applyFilter();
    });
    chips.appendChild(chip);
  });

  function applyFilter() {
    const allGames = data.games || [];
    const filtered = allGames.filter((g) => {
      const matchesCategory = activeCategory === 'All' || g.category === activeCategory;
      const matchesSearch =
        !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    renderGrid(grid, filtered);
  }

  search.addEventListener('input', () => {
    const value = search.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTerm = value.trim();
      applyFilter();
    }, 150);
  });

  applyFilter();
}

