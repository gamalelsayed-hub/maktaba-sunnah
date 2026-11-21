/* ▶️ المشغّل الطويل: تلاوات السورة الكاملة، والإذاعات، والحكايات المسموعة، والأذكار المتتابعة.
   شريط تحكم كامل يظهر في كل الشاشات: السابق، رجوع ١٠ ثوانٍ، تشغيل/إيقاف، تقديم ١٠ ثوانٍ، التالي،
   شريط سحب لموضع التشغيل، مؤقت النوم، وإغلاق — والتحكم نفسه من الإشعار وشاشة القفل. */
(() => {
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const fmt = t => { if (!isFinite(t) || t < 0) t = 0; t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60; return D((h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0')); };
  const a = new Audio(); a.preload = 'auto';
  const P = { q: [], i: 0, name: 'long', opts: {}, url: null, sleepAt: 0, sleepEnd: false, gen: 0 };
  let sleepT = null, dragging = false;

  async function load(i) {
    const my = ++P.gen;
    if (P.url) { URL.revokeObjectURL(P.url); P.url = null; }
    const it = P.q[i]; if (!it) return false;
    let url = it.url;
    if (!url && it.src) { try { url = await it.src(); } catch (e) { url = null; } }
    if (my !== P.gen) return false;
    if (!url) { onErr(); return false; }
    if (url.startsWith('blob:')) P.url = url;
    a.src = url; P.i = i; bar(); notify(true);
    if (it.pos) { const p = it.pos; a.addEventListener('loadedmetadata', () => { try { a.currentTime = p; } catch (e) { } }, { once: true }); }
    return true;
  }
  async function playAt(i) {
    if (i < 0) i = 0;
    if (i >= P.q.length) { end(); return; }
    if (P.sleepEnd && i !== P.i) { stop(); APP.toast('🌙 انتهى مؤقت النوم — تصبح على خير'); return; }
    if (await load(i)) a.play().catch(() => { });
  }
  function onErr() {
    const it = P.q[P.i];
    if (P.opts.onError && P.opts.onError(it, P.i) === true) return;
    if (it && it.live) { // البث المباشر: نعيد الاتصال تلقائياً عند الانقطاع
      P.retry = (P.retry || 0) + 1;
      if (P.retry <= 6) { APP.toast('انقطع البث — نعيد الاتصال…', 2500); const g = P.gen; setTimeout(() => { if (g === P.gen && P.q.length) { a.src = it.url + (it.url.includes('?') ? '&' : '?') + 'r=' + Date.now(); a.play().catch(() => { }); } }, 1500 * P.retry); return; }
      APP.toast('تعذّر الاتصال بالإذاعة — تحقق من الإنترنت أو جرّب لاحقاً', 5000); stop(); return; }
    if (P.i + 1 < P.q.length) { APP.toast('تعذّر تشغيل «' + (it ? it.title : '') + '» — ننتقل للتالي', 3000); playAt(P.i + 1); }
    else { APP.toast('تعذّر التشغيل — تحقق من الإنترنت أو نزّله للاستماع بدون إنترنت', 5000); stop(); }
  }
  function end() { const f = P.opts.onEnd; stop(); if (f) f(); }
  const silent = () => (a.getAttribute('src') || '').startsWith('data:');
  a.onerror = () => { if (P.q.length && a.getAttribute('src') && !silent()) onErr(); };
  a.onended = () => { if (silent()) return; const it = P.q[P.i]; if (it && it.done) it.done(); if (P.opts.repeat && P.q.length === 1) { a.currentTime = 0; a.play().catch(() => { }); return; } playAt(P.i + 1); };
  a.onplay = a.onpause = () => { bar(); notify(); };
  a.onplaying = () => { P.retry = 0; clearTimeout(P.stallT); };
  // إذا توقف البث المباشر ينتظر البيانات أكثر من ١٢ ثانية نعيد الاتصال
  a.onwaiting = a.onstalled = () => { const it = P.q[P.i]; if (!it || !it.live || a.paused) return; clearTimeout(P.stallT); P.stallT = setTimeout(() => { if (P.q[P.i] === it && !a.paused && a.readyState < 3) onErr(); }, 12000); };
  a.ontimeupdate = () => tick();
  a.onloadedmetadata = () => tick();

  function notify(force) {
    const it = P.q[P.i]; if (!it || !window.KEEPALIVE) return;
    if (force) KEEPALIVE.start((P.opts.icon || '🎧') + ' ' + it.title, it.sub || '');
    KEEPALIVE.update({ title: (P.opts.icon || '🎧') + ' ' + it.title, text: it.sub || '', playing: !a.paused });
  }

  /** play(items, opts): items = [{title, sub, url | src(): Promise<url>, live, pos}]
      opts = {name, icon, onEnd, onError, start, repeat} */
  function play(items, opts = {}) {
    if (window.MEDIA) MEDIA.claim(opts.name || 'long');
    P.name = opts.name || 'long'; P.opts = opts; P.q = items.slice(); P.sleepEnd = false;
    clearSleep();
    try { a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; a.play().catch(() => { }); } catch (e) { } // يسبق أي انتظار ليسمح المتصفح بالتشغيل
    if (window.MEDIA) MEDIA.controls(P.name, CTL);
    return playAt(opts.start || 0);
  }
  function stop() {
    P.gen++; const had = P.q.length; P.q = []; clearSleep();
    try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) { }
    if (P.url) { URL.revokeObjectURL(P.url); P.url = null; }
    if (had && window.KEEPALIVE) KEEPALIVE.stop();
    bar();
  }
  const toggle = () => { if (!P.q.length) return; if (a.paused) a.play().catch(() => { }); else a.pause(); };
  const seek = d => { if (!P.q.length || (P.q[P.i] && P.q[P.i].live)) return; try { a.currentTime = Math.max(0, Math.min((a.duration || 1e9) - 0.5, a.currentTime + d)); } catch (e) { } tick(); };
  // «السابق»: إن مضى أكثر من ٥ ثوانٍ يرجع لأول المقطع، وإلا للمقطع السابق
  const prev = () => { if (!P.q.length) return; if (a.currentTime > 5 && !(P.q[P.i] || {}).live) { a.currentTime = 0; return; } if (P.i > 0) playAt(P.i - 1); else a.currentTime = 0; };
  const next = () => { if (P.i + 1 < P.q.length) playAt(P.i + 1); };
  const CTL = { toggle, next, prev, stop, fwd: () => seek(15), back: () => seek(-15) };

  // ===== مؤقت النوم =====
  function clearSleep() { if (sleepT) clearInterval(sleepT); sleepT = null; P.sleepAt = 0; P.sleepEnd = false; }
  function setSleep(v) {
    clearSleep();
    if (v === 'end') { P.sleepEnd = true; APP.toast('🌙 سيتوقف بعد انتهاء المقطع الحالي'); }
    else if (+v) {
      P.sleepAt = Date.now() + v * 60e3; APP.toast('🌙 سيتوقف بعد ' + D(v) + ' دقيقة');
      sleepT = setInterval(() => {
        const left = P.sleepAt - Date.now();
        if (left <= 0) { clearSleep(); // خفض الصوت تدريجياً ثم الإيقاف
          let v2 = 1; const f = setInterval(() => { v2 -= 0.1; if (v2 <= 0) { clearInterval(f); a.volume = 1; stop(); } else a.volume = v2; }, 300);
        }
        const o = document.querySelector('#lpBar [data-a=sleep] option[value=""]'); if (o) o.textContent = left > 0 ? '🌙 ' + fmt(left / 1000) : '🌙';
      }, 1000);
    }
    bar();
  }

  function tick() {
    const b = document.getElementById('lpBar'); if (!b || dragging) return;
    const r = b.querySelector('[data-a=pos]'), t = b.querySelector('.lp-time');
    if (r && isFinite(a.duration) && a.duration > 0) { r.max = Math.floor(a.duration); r.value = Math.floor(a.currentTime); r.style.setProperty('--p', (100 * a.currentTime / a.duration).toFixed(1) + '%'); }
    if (t) t.textContent = fmt(a.currentTime) + (isFinite(a.duration) && a.duration > 0 ? ' / ' + fmt(a.duration) : '');
  }
  function bar() {
    let b = document.getElementById('lpBar');
    if (!P.q.length) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'lpBar'; b.className = 'qa-bar lp-bar'; document.body.appendChild(b); }
    const it = P.q[P.i] || {}, live = !!it.live, many = P.q.length > 1;
    b.innerHTML = `<div class="lp-row">
        ${many ? '<button class="btn sm" data-a="prev" title="السابق">⏮</button>' : ''}
        ${live ? '' : '<button class="btn sm" data-a="back" title="رجوع ١٠ ثوانٍ">↺١٠</button>'}
        <button class="btn sm primary" data-a="tog">${a.paused ? '▶' : '⏸'}</button>
        ${live ? '' : '<button class="btn sm" data-a="fwd" title="تقديم ١٠ ثوانٍ">١٠↻</button>'}
        ${many ? '<button class="btn sm" data-a="next" title="التالي">⏭</button>' : ''}
        <span class="qa-now">${P.opts.icon || '🎧'} ${esc(it.title || '')}${it.sub ? ' <small class="muted">— ' + esc(it.sub) + '</small>' : ''}${many ? ` <small class="muted">(${D(P.i + 1)}/${D(P.q.length)})</small>` : ''}</span>
        ${P.opts.extra ? P.opts.extra() : ''}
        <select data-a="sleep" title="مؤقت النوم"><option value="">${P.sleepAt ? '🌙 ' + fmt((P.sleepAt - Date.now()) / 1000) : P.sleepEnd ? '🌙 نهاية المقطع' : '🌙'}</option>${[[0, 'إيقاف المؤقت'], [15, 'بعد ١٥ دقيقة'], [30, 'بعد ٣٠ دقيقة'], [45, 'بعد ٤٥ دقيقة'], [60, 'بعد ساعة'], ['end', 'بعد هذا المقطع']].map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
        <button class="btn sm" data-a="x" title="إغلاق">✕</button></div>
      ${live ? '<div class="lp-row lp-live">🔴 بث مباشر</div>' : '<div class="lp-row"><input type="range" class="lp-pos" data-a="pos" min="0" max="100" value="0" step="1"><span class="lp-time muted">٠:٠٠</span></div>'}`;
    const $ = s => b.querySelector(`[data-a=${s}]`), on = (s, f) => { const x = $(s); if (x) x.onclick = f; };
    on('prev', prev); on('next', next); on('back', () => seek(-10)); on('fwd', () => seek(10)); on('tog', toggle); on('x', stop);
    $('sleep').onchange = e => { const v = e.target.value; e.target.value = ''; setSleep(v); };
    const r = $('pos');
    if (r) {
      r.oninput = () => { dragging = true; const t = b.querySelector('.lp-time'); if (t) t.textContent = fmt(+r.value) + ' / ' + fmt(a.duration); };
      r.onchange = () => { dragging = false; try { a.currentTime = +r.value; } catch (e) { } tick(); };
    }
    if (P.opts.bind) P.opts.bind(b);
    tick();
  }
  if (window.MEDIA) MEDIA.register('long', () => { if (P.q.length && P.name === 'long') stop(); });
  // أسماء المشغّلات الأخرى التي تستعمل هذا المشغّل تُسجَّل عند أول استعمال
  const reg = new Set(['long']);
  const _play = play;
  window.LP = {
    play(items, opts = {}) { const n = opts.name || 'long'; if (!reg.has(n) && window.MEDIA) { reg.add(n); MEDIA.register(n, () => { if (P.q.length && P.name === n) stop(); }); } return _play(items, opts); },
    stop, toggle, seek, next, prev, setSleep, P, audio: a,
    get playing() { return !!P.q.length && !a.paused; },
    rebar: bar,
  };
})();
