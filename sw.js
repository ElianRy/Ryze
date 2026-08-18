// Ryze — service worker minimal : notifications de fin de repos en best-effort quand l'onglet
// est en arrière-plan. Nécessite un contexte sécurisé (https), ce qui n'était pas le cas quand
// l'app tournait en file:// (le navigateur refuse d'enregistrer un service worker hors HTTPS).
// Reste "best-effort" : rien côté web ne peut garantir un déclenchement si l'OS suspend
// complètement l'onglet/le processus (téléphone verrouillé longtemps, app tuée) — seul un vrai
// minuteur système (Horloge) le peut, mais ça sort du cadre d'une appli 100% cliente sans backend.

let notifTimeout = null;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SCHEDULE_REST_NOTIF') {
    if (notifTimeout) clearTimeout(notifTimeout);
    const delay = Math.max(0, (data.endsAt || 0) - Date.now());
    notifTimeout = setTimeout(() => {
      self.registration.showNotification('Ryze · Repos terminé', {
        body: `Go ! Prochaine série de ${data.name || ''}`,
        icon: data.icon,
        badge: data.icon,
        tag: 'ryze-rest',
        requireInteraction: false,
        silent: false
      });
    }, delay);
  } else if (data.type === 'CANCEL_REST_NOTIF') {
    if (notifTimeout) { clearTimeout(notifTimeout); notifTimeout = null; }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      for (const c of clientsArr) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
