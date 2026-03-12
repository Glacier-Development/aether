const TOAST_DURATION = 4000;

export function showToast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const text = document.createElement('div');
  text.textContent = message;
  toast.appendChild(text);

  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  const inner = document.createElement('div');
  inner.className = 'toast-progress-inner';
  progress.appendChild(inner);
  toast.appendChild(progress);

  root.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(12px)';
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, TOAST_DURATION);
}

