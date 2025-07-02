/// <reference types="@sveltejs/kit" />
import { build, files, prerendered, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const url = new URL(event.request.url);

    if (ASSETS.includes(url.pathname)) {
      const res = await cache.match(url.pathname);
      if (res) return res;
    }

    try {
      const fresh = await fetch(event.request);
      if (fresh.status === 200) cache.put(event.request, fresh.clone());
      return fresh;
    } catch {
      const fallback = await cache.match(event.request);
      if (fallback) return fallback;
      throw Error('No response');
    }
  })());
});
