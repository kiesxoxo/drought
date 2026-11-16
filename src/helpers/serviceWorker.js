import { alerts } from '~helpers/stores';

// A tab that stays open gets checked for a new version this often, when shown
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

// The service worker serves the app from its cache, and a new one waits until
// every tab is closed. Offer a reload instead, so a pinned tab picks up a
// deploy without hunting down and closing every Drought tab.
export const registerServiceWorker = async () => {
  const registration = await navigator.serviceWorker.register('./sw.js', {
    scope: window.location.pathname,
  });

  let offered = false;
  const offerUpdate = (worker) => {
    // Without a controller this is the first install: nothing to replace
    if (offered || !navigator.serviceWorker.controller) return;
    offered = true;
    alerts.add('A new version of Drought is available', 'positive', {
      persistent: true,
      action: {
        label: 'Reload',
        // The generated worker activates on this message (workbox skipWaiting)
        onclick: () => worker.postMessage({ type: 'SKIP_WAITING' }),
      },
    });
  };

  if (registration.waiting) offerUpdate(registration.waiting);
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed') offerUpdate(worker);
    });
  });

  // The new worker took over (here or from another tab), and it no longer
  // caches this version's lazily loaded chunks, so load the new version
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  let lastCheck = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || Date.now() - lastCheck < UPDATE_CHECK_INTERVAL) {
      return;
    }
    lastCheck = Date.now();
    registration.update().catch(() => {});
  });
};
