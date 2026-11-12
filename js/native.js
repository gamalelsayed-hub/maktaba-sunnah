/* 📱 جسر تطبيق الجوال (أندرويد عبر Capacitor): يُحمَّل قبل بقية الوحدات.
   يوفّر للتطبيق ما لا تدعمه نافذة الويب داخل أندرويد: التعرف على الكلام، والقراءة الصوتية،
   وتنزيل الصوت والكتب دون قيود المتصفح، وزر الرجوع. لا يفعل شيئاً في المتصفح أو سطح المكتب. */
(() => {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const P = C.Plugins || {};
  document.documentElement.classList.add('native');

  // ===== تنزيل النصوص والملفات عبر الطبقة الأصلية (بلا قيود CORS) =====
  const b64ToU8 = b64 => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const http = P.CapacitorHttp;
  window.desktop = Object.assign(window.desktop || {}, { isMobile: true });
  if (http) {
    window.desktop.fetchText = async url => {
      const r = await http.get({ url, responseType: 'text' });
      if (r.status >= 400) throw new Error('المصدر رد بخطأ ' + r.status);
      return typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
    };
    window.desktop.fetchBin = async url => {
      const r = await http.get({ url, responseType: 'blob' });
      if (r.status >= 400) throw new Error('المصدر رد بخطأ ' + r.status);
      return typeof r.data === 'string' ? b64ToU8(r.data) : new Uint8Array(r.data);
    };
  }

  // ===== التعرف على الكلام: محوّل بنفس واجهة SpeechRecognition في المتصفح =====
  const SRP = P.SpeechRecognition;
  if (SRP) {
    class NativeSR {
      constructor() { this.lang = 'ar-SA'; this.continuous = true; this.interimResults = true; this.onresult = null; this.onerror = null; this.onend = null; this._last = ''; this._subs = []; this._on = false; }
      _emit(text, isFinal) { if (!this.onresult) return; const r = [{ transcript: text }]; r.isFinal = isFinal; this.onresult({ resultIndex: 0, results: [r] }); }
      async start() {
        try {
          const av = await SRP.available(); if (!av.available) throw { error: 'not-available' };
          const perm = await SRP.requestPermissions(); if (perm && perm.speechRecognition && perm.speechRecognition !== 'granted') throw { error: 'not-allowed' };
          this._on = true; this._last = '';
          this._subs.push(await SRP.addListener('partialResults', d => { const t = (d.matches && d.matches[0]) || ''; if (t) { this._last = t; this._emit(t, false); } }));
          this._subs.push(await SRP.addListener('listeningState', d => { if (d.status === 'stopped') this._finish(); }));
          await SRP.start({ language: this.lang, maxResults: 1, partialResults: true, popup: false });
        } catch (e) { this._on = false; this.onerror && this.onerror({ error: e.error || 'network' }); this.onend && this.onend(); }
      }
      _finish() {
        if (!this._on) return; this._on = false;
        if (this._last) this._emit(this._last, true);
        this._subs.forEach(s => s.remove && s.remove()); this._subs = [];
        this.onend && this.onend();
      }
      async stop() { try { await SRP.stop(); } catch (e) { } this._finish(); }
    }
    window.SpeechRecognition = NativeSR;
  }

  // ===== القراءة الصوتية (محرك الجهاز) =====
  const TTSP = P.TextToSpeech;
  if (TTSP) window.NATIVE_TTS = {
    speak: (text, rate) => TTSP.speak({ text, lang: 'ar-SA', rate: rate || 1, pitch: 1, volume: 1, category: 'playback' }),
    stop: () => TTSP.stop().catch(() => { }),
    hasArabic: async () => { try { const r = await TTSP.getSupportedLanguages(); return (r.languages || []).some(l => /^ar/i.test(l)); } catch (e) { return true; } },
    openInstall: () => TTSP.openInstall && TTSP.openInstall().catch(() => { })
  };

  // ===== زر الرجوع في أندرويد: يرجع داخل التطبيق، ويغلق النوافذ أولاً =====
  const App = P.App;
  if (App) App.addListener('backButton', () => {
    const modal = document.getElementById('modal'), side = document.getElementById('sidebar');
    if (modal && !modal.classList.contains('hidden')) { modal.classList.add('hidden'); return; }
    if (side && side.classList.contains('open')) { window.APP && APP.closeMenu && APP.closeMenu(); return; }
    if (location.hash && location.hash !== '#/' && history.length > 1) history.back();
    else App.exitApp();
  });
})();
