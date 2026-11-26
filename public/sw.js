// Minimal service worker: makes the PWA installable. Network-only for now;
// offline support comes later, if ever (the app is useless without the cloud).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
