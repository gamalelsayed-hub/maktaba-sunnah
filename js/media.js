/* 🔈 صوت واحد في كل وقت: أي مشغّل يبدأ (تلاوة، أذكار، قراءة صوتية، أذان، تسجيل، إذاعة، حكايات) يوقف ما سواه
   وأزرار التحكم في الإشعار وشاشة القفل (تطبيق أندرويد) أو أزرار الوسائط في المتصفح تُوجَّه للمشغّل الحالي */
(() => {
  const R = {}, CTL = {};
  let active = null;
  const MEDIA = {
    register(name, stopFn) { R[name] = stopFn; },
    claim(name) { for (const [k, f] of Object.entries(R)) if (k !== name) { try { f(); } catch (e) { } } active = name; },
    get active() { return active; },
    /** controls(name, {toggle, next, prev, fwd, back, stop}): أزرار الإشعار لهذا المشغّل */
    controls(name, c) { CTL[name] = c; },
    handle(cmd) {
      const c = active && CTL[active]; if (!c) return;
      const f = c[cmd] || (cmd === 'fwd' ? c.next : cmd === 'back' ? c.prev : null);
      if (f) { try { f(); } catch (e) { } }
    },
  };
  // عناصر الصوت الظاهرة في الصفحة (تسجيلات التجويد ونحوها)
  MEDIA.register('dom', () => document.querySelectorAll('audio').forEach(a => { if (!a.paused) a.pause(); }));
  document.addEventListener('play', e => { if (e.target && e.target.tagName === 'AUDIO' && e.target.isConnected) MEDIA.claim('dom'); }, true);
  window.MEDIA = MEDIA;

  // أزرار الوسائط في المتصفح (سماعات البلوتوث ولوحة المفاتيح وشاشة القفل في الجوال عبر المتصفح)
  if ('mediaSession' in navigator) {
    const set = (a, cmd) => { try { navigator.mediaSession.setActionHandler(a, () => MEDIA.handle(cmd)); } catch (e) { } };
    set('play', 'toggle'); set('pause', 'toggle'); set('nexttrack', 'next'); set('previoustrack', 'prev'); set('stop', 'stop');
    set('seekforward', 'fwd'); set('seekbackward', 'back');
  }

  // إبقاء التطبيق يعمل والشاشة مقفلة (تطبيق أندرويد): خدمة تشغيل في المقدمة مع إشعار فيه أزرار التحكم
  const C = window.Capacitor, KA = C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.KeepAlive;
  let on = false, last = {};
  if (KA && KA.addListener) KA.addListener('control', d => MEDIA.handle(d && d.cmd));
  const meta = (title, text) => { if (!('mediaSession' in navigator) || !window.MediaMetadata) return; try { navigator.mediaSession.metadata = new MediaMetadata({ title: title || 'زاد الأسرة', artist: text || '', album: 'زاد الأسرة المسلمة', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }); } catch (e) { } };
  window.KEEPALIVE = {
    start(title, text, opt) {
      last = { title: title || 'زاد الأسرة', text: text || '', playing: true, controls: !(opt && opt.controls === false) };
      meta(last.title, last.text);
      if (!KA) return; on = true; KA.start(last).catch(() => { });
    },
    /** تحديث الإشعار: العنوان أو حالة التشغيل (playing) */
    update(o) {
      Object.assign(last, o || {}); meta(last.title, last.text);
      try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = last.playing ? 'playing' : 'paused'; } catch (e) { }
      if (KA && on && KA.update) KA.update(last).catch(() => { });
    },
    stop() { if (!KA || !on) return; on = false; KA.stop().catch(() => { }); },
    get native() { return !!KA; },
  };
})();
