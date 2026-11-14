// عامل الخدمة لنسخة الويب: يحفظ واجهة البرنامج ليفتح بدون إنترنت.
// الكتب نفسها تُحفظ في قاعدة بيانات المتصفح عند التثبيت، فلا تحتاج تخزيناً هنا.
const VERSION = 'v67';
const SHELL = ['./', './index.html', './css/style.css', './manifest.webmanifest', './icons/icon-192.png', './icons/favicon.png',
  './fonts/AmiriQuran-Regular.ttf', './fonts/NotoNaskhArabic.ttf', './fonts/IBMPlexSansArabic-Regular.ttf', './fonts/IBMPlexSansArabic-Medium.ttf', './fonts/IBMPlexSansArabic-Bold.ttf', './js/native.js', './js/media.js', './js/arabic.js', './js/db.js', './js/sample-data.js', './js/sample-sira.js', './js/sample-more.js', './js/fiqh-masail.js', './js/importers.js', './js/mindmap.js',
  './js/app.js', './js/views.js', './js/tools.js', './js/packs.js', './js/audio.js', './js/tasmee.js', './js/exams.js', './js/tajweed.js', './js/tts.js', './js/me.js', './js/mutash.js', './js/adhkar-data.js', './js/praycalc.js', './js/notify.js', './js/adhkar.js', './js/tasbih.js', './js/salah.js', './js/hijri.js', './js/zakat.js', './js/updater.js', './js/sahaba-top.js', './js/sahaba-sum.js', './js/rijal.js', './js/sira-more.js', './js/docx.js', './js/pdfgen.js', './js/khutba.js', './js/ayah.js', './js/pages.js', './js/mymushaf.js', './js/vendor/pdfjs/pdf.min.mjs', './js/vendor/pdfjs/pdf.worker.min.mjs', './js/khatma.js', './js/guide.js', './audio/learn/index.js', './js/learn-data.js', './js/learn-paths.js', './js/learn-core.js', './js/literacy.js', './js/kids.js', './js/learn-extra.js', './js/learn-math.js', './js/learn-record.js', './js/library-data.js', './js/library.js', './js/mouth.js', './audio/adhan.mp3', './audio/adhan_fajr.mp3', './js/more.js', './js/curriculum.js', './js/talab.js', './data/manifest.js', './data/review.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open('shell-' + VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== 'shell-' + VERSION && k !== 'ayah-v1').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// الواجهة: من الشبكة أولاً (لتصل التحديثات) ثم من المخزن عند انقطاع الإنترنت
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // بيانات الآيات (التفسير والغريب والتجويد): من المخزن أولاً، وتبقى عبر التحديثات
  if (url.pathname.includes('/data/ayah/') || url.pathname.includes('/data/pages/')) {
    e.respondWith(caches.open('ayah-v1').then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (url.pathname.includes('/data/') && !/manifest\.js|review\.js/.test(url.pathname)) return; // ملفات الكتب الكبيرة لا تُخزَّن هنا
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open('shell-' + VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html'))));
});
