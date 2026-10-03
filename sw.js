/* Family Expenses service worker.
   Change VERSION whenever you upload new app files so phones pick up the update. */
const VERSION='fe-5.2.1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const CHART='https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL).then(()=>c.add(CHART).catch(()=>{}))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;                       // API calls (POST) always go to the network
  const url=new URL(req.url);
  if(/google(usercontent)?\.com$/.test(url.hostname))return;

  // Pages: try the network first so updates arrive, fall back to the saved copy offline.
  if(req.mode==='navigate'){
    e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(VERSION).then(c=>c.put('./index.html',copy));return r})
      .catch(()=>caches.match('./index.html')));
    return;
  }
  // App files and Chart.js: serve from cache, refresh in the background.
  if(url.origin===location.origin||req.url===CHART){
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(req,copy))}return r}).catch(()=>hit);
      return hit||net;
    }));
  }
});
