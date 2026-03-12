export function openModal({ title, contentNode }) {
  const root = document.getElementById('modal-root');
  if (!root) return null;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.tabIndex = -1;

  const modal = document.createElement('div');
  modal.className = 'modal';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '✕';
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body';
  if (contentNode) {
    body.appendChild(contentNode);
  }

  modal.appendChild(header);
  modal.appendChild(body);
  backdrop.appendChild(modal);
  root.appendChild(backdrop);

  function cleanup() {
    backdrop.remove();
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }
  }

  closeBtn.addEventListener('click', cleanup);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) cleanup();
  });
  document.addEventListener('keydown', onKeyDown);

  return { backdrop, modal, close: cleanup };
}

