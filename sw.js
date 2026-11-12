// عامل الخدمة لنسخة الويب: يحفظ واجهة البرنامج ليفتح بدون إنترنت.
// الكتب نفسها تُحفظ في قاعدة بيانات المتصفح عند التثبيت، فلا تحتاج تخزيناً هنا.
const VERSION = 'v10';
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon-192.png', './icons/favicon.png',
  './js/arabic.js', './js/db.js', './js/sample-data.js', './js/sample-sira.js', './js/sample-more.js', './js/fiqh-masail.js', './js/importers.js', './js/mindmap.js',
  './js/app.js', './js/views.js', './js/tools.js', './js/packs.js', './js/more.js', './js/curriculum.js', './js/talab.js', './data/manifest.js', './data/review.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open('shell-' + VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== 'shell-' + VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// الواجهة: من الشبكة أولاً (لتصل التحديثات) ثم من المخزن عند انقطاع الإنترنت
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/data/') && !/manifest\.js|review\.js/.test(url.pathname)) return; // ملفات الكتب الكبيرة لا تُخزَّن هنا
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open('shell-' + VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
});
