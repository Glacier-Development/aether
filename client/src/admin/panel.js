import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let attempts = 0;

export function openAdminPrompt() {
  if (sessionStorage.getItem('adminLocked') === '1') {
    showToast('Admin access locked for this session.', 'error');
    return;
  }

  const content = document.createElement('div');
  content.style.padding = '14px';

  const title = document.createElement('div');
  title.className = 'password-modal-title';
  const icon = document.createElement('div');
  icon.className = 'password-modal-title-icon';
  icon.textContent = '🔒';
  const text = document.createElement('div');
  text.textContent = 'Admin Access';
  title.appendChild(icon);
  title.appendChild(text);

  const input = document.createElement('input');
  input.type = 'password';
  input.className = 'input';
  input.placeholder = 'Password';
  input.style.marginTop = '10px';

  const error = document.createElement('div');
  error.style.marginTop = '6px';
  error.style.fontSize = '12px';
  error.style.color = 'var(--accent-danger)';

  const btnRow = document.createElement('div');
  btnRow.style.marginTop = '12px';
  btnRow.style.display = 'flex';
  btnRow.style.justifyContent = 'flex-end';
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = 'Unlock';
  btnRow.appendChild(btn);

  content.appendChild(title);
  content.appendChild(input);
  content.appendChild(error);
  content.appendChild(btnRow);

  const modal = openModal({ title: '', contentNode: content });

  function tryAuth() {
    if (attempts >= 3) {
      error.textContent = 'Too many attempts. Try again later.';
      input.disabled = true;
      btn.disabled = true;
      sessionStorage.setItem('adminLocked', '1');
      return;
    }
    const value = input.value;
    const expected = 'cherri3';
    if (value === expected) {
      modal.close();
      sessionStorage.setItem('adminAuthed', '1');
      showAdminPanel();
    } else {
      attempts += 1;
      error.textContent = `Incorrect password. Attempts left: ${3 - attempts}`;
      if (attempts >= 3) {
        sessionStorage.setItem('adminLocked', '1');
        input.disabled = true;
        btn.disabled = true;
      }
    }
  }

  btn.addEventListener('click', tryAuth);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryAuth();
  });
  setTimeout(() => input.focus(), 50);
}

function showAdminPanel() {
  const existing = document.querySelector('.admin-panel');
  if (existing) existing.remove();

  const panel = document.createElement('section');
  panel.className = 'admin-panel';

  const header = document.createElement('header');
  header.className = 'admin-header';
  const title = document.createElement('div');
  title.className = 'admin-title';
  title.textContent = 'Admin Panel';
  const close = document.createElement('button');
  close.className = 'btn btn-ghost';
  close.textContent = '✕';
  close.addEventListener('click', () => panel.remove());
  header.appendChild(title);
  header.appendChild(close);

  const body = document.createElement('div');
  body.className = 'admin-body';

  const nav = document.createElement('div');
  nav.className = 'admin-nav';

  const sections = ['Maintenance', 'MOTD', 'Blocklist', 'Stats'];
  const sectionKeys = ['maintenance', 'motd', 'blocklist', 'stats'];
  let active = 'maintenance';

  sectionKeys.forEach((key, idx) => {
    const tab = document.createElement('button');
    tab.className = 'admin-tab' + (idx === 0 ? ' active' : '');
    tab.textContent = sections[idx];
    tab.addEventListener('click', () => {
      active = key;
      Array.from(nav.children).forEach((el) => el.classList.remove('active'));
      tab.classList.add('active');
      renderSection();
    });
    nav.appendChild(tab);
  });

  const content = document.createElement('div');
  content.style.marginTop = '8px';

  body.appendChild(nav);
  body.appendChild(content);

  panel.appendChild(header);
  panel.appendChild(body);
  document.body.appendChild(panel);

  function adminFetch(path, options = {}) {
    const headers = options.headers || {};
    return fetch(path, {
      ...options,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'X-Admin-Key': 'cherri3',
      },
    });
  }

  async function renderMaintenance() {
    content.innerHTML = '';
    const cfgRes = await fetch('/api/config');
    const cfg = await cfgRes.json().catch(() => ({}));
    const current = cfg.maintenance || { enabled: false, message: '' };

    const row = document.createElement('div');
    row.className = 'settings-row';

    const main = document.createElement('div');
    main.className = 'settings-row-main';
    const label = document.createElement('div');
    label.className = 'settings-label';
    label.textContent = 'Site maintenance';
    const desc = document.createElement('div');
    desc.className = 'settings-description';
    desc.textContent = 'Hide the site behind a maintenance screen for regular users.';
    main.appendChild(label);
    main.appendChild(desc);

    const toggle = document.createElement('button');
    toggle.className = 'toggle';
    toggle.dataset.on = current.enabled ? 'true' : 'false';
    const thumb = document.createElement('div');
    thumb.className = 'toggle-thumb';
    toggle.appendChild(thumb);

    toggle.addEventListener('click', () => {
      toggle.dataset.on = toggle.dataset.on !== 'true' ? 'true' : 'false';
    });

    row.appendChild(main);
    row.appendChild(toggle);

    const msg = document.createElement('textarea');
    msg.className = 'input';
    msg.style.marginTop = '10px';
    msg.style.width = '100%';
    msg.rows = 3;
    msg.maxLength = 200;
    msg.value = current.message || '';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Apply';
    saveBtn.style.marginTop = '10px';
    saveBtn.addEventListener('click', async () => {
      const res = await adminFetch('/api/admin/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          enabled: toggle.dataset.on === 'true',
          message: msg.value.trim(),
        }),
      });
      if (res.ok) showToast('Maintenance settings applied.', 'success');
      else showToast('Failed to save.', 'error');
    });

    content.appendChild(row);
    content.appendChild(msg);
    content.appendChild(saveBtn);
  }

  async function renderMotd() {
    content.innerHTML = '';
    const cfgRes = await fetch('/api/config');
    const cfg = await cfgRes.json().catch(() => ({}));
    const current = cfg.motd || { enabled: true, text: '' };

    const row = document.createElement('div');
    row.className = 'settings-row';

    const main = document.createElement('div');
    main.className = 'settings-row-main';
    const label = document.createElement('div');
    label.className = 'settings-label';
    label.textContent = 'MOTD ticker';
    const desc = document.createElement('div');
    desc.className = 'settings-description';
    desc.textContent = 'Customize the scrolling message in the top bar.';
    main.appendChild(label);
    main.appendChild(desc);

    const toggle = document.createElement('button');
    toggle.className = 'toggle';
    toggle.dataset.on = current.enabled ? 'true' : 'false';
    const thumb = document.createElement('div');
    thumb.className = 'toggle-thumb';
    toggle.appendChild(thumb);

    toggle.addEventListener('click', () => {
      toggle.dataset.on = toggle.dataset.on !== 'true' ? 'true' : 'false';
    });

    row.appendChild(main);
    row.appendChild(toggle);

    const text = document.createElement('input');
    text.className = 'input';
    text.maxLength = 100;
    text.value = current.text || '';
    text.style.marginTop = '10px';
    text.style.width = '100%';
    text.placeholder = 'Message of the day';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Apply';
    saveBtn.style.marginTop = '10px';
    saveBtn.addEventListener('click', async () => {
      const res = await adminFetch('/api/admin/motd', {
        method: 'POST',
        body: JSON.stringify({
          enabled: toggle.dataset.on === 'true',
          text: text.value.trim(),
        }),
      });
      if (res.ok) showToast('MOTD applied.', 'success');
      else showToast('Failed to save.', 'error');
    });

    content.appendChild(row);
    content.appendChild(text);
    content.appendChild(saveBtn);
  }

  async function renderBlocklist() {
    content.innerHTML = '';
    const table = document.createElement('div');
    table.style.display = 'flex';
    table.style.flexDirection = 'column';
    table.style.gap = '6px';
    table.style.marginTop = '8px';

    async function loadRows() {
      table.innerHTML = '';
      const raw = await adminFetch('/api/admin/blocklist').then((r) => r.json()).catch(() => []);
      const rows = Array.isArray(raw) ? raw : [];
      rows.forEach((entry) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.fontSize = '12px';
        row.style.padding = '4px 6px';
        row.style.borderRadius = '8px';
        row.style.background = 'rgba(15,23,42,0.95)';
        const main = document.createElement('div');
        main.innerHTML = `<strong>${entry.pattern}</strong><br/><span style="color:var(--text-secondary)">${entry.reason}</span>`;
        const actions = document.createElement('button');
        actions.className = 'btn btn-ghost';
        actions.textContent = '🗑';
        actions.addEventListener('click', async () => {
          await adminFetch(`/api/admin/blocklist/${entry.id}`, { method: 'DELETE' });
          showToast('Block entry removed.', 'info');
          await loadRows();
        });
        row.appendChild(main);
        row.appendChild(actions);
        table.appendChild(row);
      });
      if (rows.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'No custom block entries yet.';
        empty.style.color = 'var(--text-secondary)';
        empty.style.fontSize = '12px';
        table.appendChild(empty);
      }
    }

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-secondary';
    addBtn.textContent = 'Add Block';
    addBtn.addEventListener('click', () => {
      const wrapper = document.createElement('div');
      wrapper.style.padding = '12px';
      const pattern = document.createElement('input');
      pattern.className = 'input';
      pattern.placeholder = 'Pattern (e.g. *.example.com, *porn*)';
      const reason = document.createElement('input');
      reason.className = 'input';
      reason.placeholder = 'Reason';
      reason.style.marginTop = '6px';
      const save = document.createElement('button');
      save.className = 'btn btn-primary';
      save.textContent = 'Save';
      save.style.marginTop = '10px';
      wrapper.appendChild(pattern);
      wrapper.appendChild(reason);
      wrapper.appendChild(save);
      const modal = openModal({ title: 'Add Block', contentNode: wrapper });
      save.addEventListener('click', async () => {
        await adminFetch('/api/admin/blocklist', {
          method: 'POST',
          body: JSON.stringify({
            pattern: pattern.value,
            reason: reason.value,
            category: 'Custom',
          }),
        });
        modal.close();
        await loadRows();
      });
    });

    content.appendChild(addBtn);
    content.appendChild(table);
    await loadRows();
  }

  async function renderStats() {
    content.innerHTML = '';
    const res = await fetch('/api/admin/stats', {
      headers: { 'X-Admin-Key': 'cherri3' },
    });
    if (!res.ok) {
      content.textContent = 'Failed to load stats.';
      return;
    }
    const stats = await res.json();
    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gridTemplateColumns = '1fr 1fr';
    list.style.gap = '8px';
    const entries = [
      ['Games', stats.gamesCount],
      ['Apps', stats.appsCount],
      ['Block entries', stats.blocklistCount],
      ['Proxy engine', stats.proxyEngine],
      ['Node version', stats.nodeVersion],
      ['Uptime (s)', Math.round(stats.uptime)],
    ];
    entries.forEach(([label, value]) => {
      const item = document.createElement('div');
      item.style.fontSize = '13px';
      item.innerHTML = `<strong>${label}</strong><br/><span style="color:var(--text-secondary)">${value}</span>`;
      list.appendChild(item);
    });
    content.appendChild(list);
  }

  function renderSection() {
    if (active === 'maintenance') renderMaintenance();
    if (active === 'motd') renderMotd();
    if (active === 'blocklist') renderBlocklist();
    if (active === 'stats') renderStats();
  }

  renderSection();
}

