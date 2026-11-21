/* ⬆️ التحقق من وجود نسخة أحدث لتطبيق أندرويد (من صفحة الإصدارات على GitHub)
   يتحقق مرة يومياً عند فتح التطبيق، ويدوياً من الإعدادات. لا يعمل في المتصفح (الموقع يتحدث وحده). */
(() => {
  const C = window.Capacitor;
  const native = !!(C && C.isNativePlatform && C.isNativePlatform() && C.getPlatform && C.getPlatform() === 'android');
  const API = 'https://api.github.com/repos/gamalelsayed-hub/maktaba-sunnah/releases/tags/android-latest';
  const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };

  async function current() { try { return (await C.Plugins.App.getInfo()).version; } catch (e) { return '0.0.0'; } }
  async function latest() {
    let data;
    if (window.desktop && window.desktop.fetchText) data = JSON.parse(await window.desktop.fetchText(API));
    else { const r = await fetch(API, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); data = await r.json(); }
    const apks = (data.assets || []).map(a => ({ v: (a.name.match(/(\d+\.\d+\.\d+)\.apk$/) || [])[1], url: a.browser_download_url, mb: Math.round(a.size / 1e6) })).filter(a => a.v);
    return apks.sort((a, b) => cmp(b.v, a.v))[0] || null;
  }

  // هل ثُبّت التطبيق من جوجل بلاي؟ عندها التحديث من المتجر وحده (ملف GitHub لا يُثبَّت فوق نسخة المتجر)
  const PLAY_ID = 'org.waqf.maktabasunnah';
  async function fromPlay() {
    try { const KA = C.Plugins.KeepAlive; if (!KA || !KA.installer) return false; const r = await KA.installer(); return r && r.source === 'com.android.vending'; } catch (e) { return false; }
  }
  function openPlay() {
    const a = document.createElement('a'); a.href = 'market://details?id=' + PLAY_ID; a.target = '_blank'; document.body.appendChild(a);
    try { a.click(); } catch (e) { location.href = 'https://play.google.com/store/apps/details?id=' + PLAY_ID; }
    a.remove();
  }
  async function check(manual) {
    if (!native) { if (manual) APP.toast('نسخة الويب تتحدث تلقائياً — أعد فتح الصفحة لتحصل على آخر نسخة'); return; }
    if (await fromPlay()) {
      // جوجل بلاي يحدّث التطبيق تلقائياً؛ والتحقق اليدوي يفتح صفحة التطبيق في المتجر
      if (manual) { APP.toast('التحديثات تصلك من جوجل بلاي — نفتح لك صفحة التطبيق في المتجر', 3500); setTimeout(openPlay, 600); }
      return;
    }
    try {
      const [cur, nw] = [await current(), await latest()];
      await DB.setting('update-last-check', Date.now());
      if (!nw || cmp(nw.v, cur) <= 0) { if (manual) APP.toast(`✔ لديك آخر نسخة (${cur})`); return; }
      const skipped = await DB.setting('update-skip');
      if (!manual && skipped === nw.v) return;
      APP.modal(`<h2 style="margin-top:0">⬆️ نسخة جديدة متاحة</h2>
        <p>النسخة <b>${nw.v}</b> متاحة الآن (نسختك ${cur}). الحجم نحو ${nw.mb} ميجا.</p>
        <div class="info">بعد التنزيل افتح الملف واضغط «تثبيت» — يُثبَّت فوق النسخة الحالية وتبقى بياناتك كما هي.</div>
        <div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" id="upGo">⬇ تنزيل التحديث</button><button class="btn" id="upLater">لاحقاً</button><button class="btn" id="upSkip">تخطَّ هذه النسخة</button></div>`, box => {
        box.querySelector('#upGo').onclick = () => { APP.closeModal(); location.href = nw.url; };
        box.querySelector('#upLater').onclick = () => APP.closeModal();
        box.querySelector('#upSkip').onclick = async () => { await DB.setting('update-skip', nw.v); APP.closeModal(); };
      });
    } catch (e) { if (manual) APP.toast('تعذر التحقق من التحديثات — تأكد من الاتصال بالإنترنت'); }
  }

  // تحقق تلقائي مرة يومياً بعد فتح التطبيق بقليل
  if (native) window.addEventListener('load', () => setTimeout(async () => {
    const last = (await DB.setting('update-last-check')) || 0;
    if (Date.now() - last > 20 * 3600e3) check(false);
  }, 8000));

  window.UPDATER = { native, check, current, fromPlay, openPlay };
})();
