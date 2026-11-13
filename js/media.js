/* 🔈 صوت واحد في كل وقت: أي مشغّل يبدأ (تلاوة، أذكار، قراءة صوتية، أذان، تسجيل) يوقف ما سواه */
(() => {
  const R = {};
  let active = null;
  const MEDIA = {
    register(name, stopFn) { R[name] = stopFn; },
    claim(name) { for (const [k, f] of Object.entries(R)) if (k !== name) { try { f(); } catch (e) { } } active = name; },
    get active() { return active; },
  };
  // عناصر الصوت الظاهرة في الصفحة (تسجيلات التجويد ونحوها)
  MEDIA.register('dom', () => document.querySelectorAll('audio').forEach(a => { if (!a.paused) a.pause(); }));
  document.addEventListener('play', e => { if (e.target && e.target.tagName === 'AUDIO' && e.target.isConnected) MEDIA.claim('dom'); }, true);
  window.MEDIA = MEDIA;

  // إبقاء التطبيق يعمل والشاشة مقفلة (تطبيق أندرويد): خدمة تشغيل في المقدمة مع إشعار
  const C = window.Capacitor, KA = C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.KeepAlive;
  let on = false;
  window.KEEPALIVE = KA ? {
    start(title, text) { on = true; KA.start({ title: title || 'مكتبة القرآن والسنة', text: text || '' }).catch(() => { }); },
    stop() { if (!on) return; on = false; KA.stop().catch(() => { }); },
  } : null;
})();
