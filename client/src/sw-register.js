export async function registerServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser. Some proxy features may not work.');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    console.log('Aether SW registered:', reg.scope);
  } catch (err) {
    console.error('Service worker registration failed', err);
  }
}

