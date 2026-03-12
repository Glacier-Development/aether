export function createBlockedScreen({ reason, category }) {
  const container = document.createElement('div');
  container.className = 'blocked-screen';

  const icon = document.createElement('div');
  icon.className = 'blocked-icon';
  icon.textContent = '🛡️';

  const title = document.createElement('div');
  title.className = 'blocked-title';
  title.textContent = 'This page is blocked';

  const reasonEl = document.createElement('div');
  reasonEl.className = 'blocked-reason';
  reasonEl.textContent = reason || 'Blocked by administrator policy.';

  const meta = document.createElement('div');
  meta.style.fontSize = '11px';
  meta.style.color = 'var(--text-muted)';
  if (category) {
    meta.textContent = `Category: ${category}`;
  }

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary';
  backBtn.textContent = 'Go Back';
  backBtn.addEventListener('click', () => {
    window.history.back();
  });

  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(reasonEl);
  if (category) container.appendChild(meta);
  container.appendChild(backBtn);

  return container;
}

