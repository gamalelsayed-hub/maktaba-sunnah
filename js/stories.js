/* 🌙 حكايات مسموعة: القصص والحكايات وكتب السيرة تُسمع كاملةً متتابعة — للنوم ووقت الفراغ والسفر.
   الصوت: تسجيل بشري إن وُجد (المسجَّل على الجهاز، أو المنزَّل، أو المرفق مع التطبيق)، وإلا صوت الجهاز.
   ومؤقت النوم يوقف الحكايات بعد مدة، أو بعد انتهاء الحكاية الحالية. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const spoken = t => String(t).replace(/ﷺ/g, 'صلى الله عليه وسلم').replace(/^[–-]\s*/, '').trim();

  // ===== المجموعات =====
  const COLS = [
    { id: 'hk-kids', ic: '🧒', t: 'حكايات الأطفال', d: 'قصص قصيرة هادفة للصغار — مناسبة قبل النوم', items: () => ((window.LEARN && LEARN.STORIES) || []).map(st => ({ id: 'hk:st:' + st.id, title: st.t, ic: st.ic, text: st.pages.map(p => spoken(p.t)).join('. ') + '.' })) },
    { id: 'hk-adults', ic: '👨', t: 'قصص من الحياة', d: 'مواقف وقصص للكبار، وقصص الأنبياء', items: () => ((window.LEARN && LEARN.STORIES_A) || []).map(st => ({ id: 'hk:st:' + st.id, title: st.t, ic: st.ic, text: st.pages.map(p => spoken(p.t)).join('. ') + '.' })) },
    ...((window.LIB_BOOKS || []).map(bk => ({ id: 'hk-bk-' + bk.id, ic: bk.ic, t: bk.t, d: 'كامل كيلاني — فصلاً بعد فصل', book: true, items: () => bk.s.map(([t, lines], n) => ({ id: `hk:bk:${bk.id}:${n}`, title: t, chapter: bk.t, ic: bk.ic, text: lines.map(spoken).join(' ') })) }))),
  ];
  const colOf = id => COLS.find(c => c.id === id);
  // مصادر للتسجيل بصوت القارئ (شاشة «تسجيل المكتبة بصوتي»)
  if (window.LIBVOICE && LIBVOICE.addSource) COLS.forEach(c => LIBVOICE.addSource({ id: c.id, title: '🌙 ' + c.t, items: async () => c.items().map(x => ({ id: x.id, title: x.title, text: x.text, chapter: x.chapter || c.t })) }));

  // ===== التسجيلات المرفوعة للتنزيل (STORY_AUDIO: معرّف الحكاية ← مسار الملف على الموقع) =====
  const SITE = 'https://gamalelsayed-hub.github.io/maktaba-sunnah/';
  const shipped = id => (window.STORY_AUDIO || {})[id];
  const remoteUrl = id => { const f = shipped(id); if (!f) return null; const native = window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform(); return (native || location.protocol === 'file:' ? SITE : '') + 'audio/stories/' + f; };
  let dbp;
  const sdb = () => dbp || (dbp = new Promise((res, rej) => { const q = indexedDB.open('maktaba-stories', 1); q.onupgradeneeded = () => q.result.createObjectStore('files'); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  const tx = async (mode, fn) => { const d = await sdb(); return new Promise((res, rej) => { const t = d.transaction('files', mode), st = t.objectStore('files'); const r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
  const getDl = id => tx('readonly', st => st.get(id)).catch(() => null);
  const putDl = (id, b) => tx('readwrite', st => st.put(b, id));
  const dlKeys = () => tx('readonly', st => st.getAllKeys()).catch(() => []);
  const delAll = () => tx('readwrite', st => st.clear());
  async function fetchBlob(url) {
    if (window.desktop && window.desktop.fetchBin) { const u8 = await window.desktop.fetchBin(url); return new Blob([u8], { type: /\.m4a$/.test(url) ? 'audio/mp4' : 'audio/mpeg' }); }
    const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob();
  }
  // مصدر صوت الحكاية: تسجيل على الجهاز ← منزَّل ← على الموقع ← لا شيء (فيُقرأ بصوت الجهاز)
  async function voiceOf(id) {
    const own = window.LIBVOICE && LIBVOICE.blob ? await LIBVOICE.blob(id) : null; if (own) return { blob: own, kind: 'own' };
    const dl = await getDl(id); if (dl) return { blob: dl, kind: 'dl' };
    const u = remoteUrl(id); if (u && navigator.onLine !== false) return { url: u, kind: 'web' };
    return null;
  }

  // ===== التشغيل المتتابع =====
  const S = { q: [], i: 0, on: false, col: null, sleepAt: 0, sleepEnd: false, t: null };
  const sayKind = k => k === 'own' || k === 'dl' || k === 'web' ? '🎙️ بصوت القارئ' : '🗣️ صوت الجهاز';
  function stopAll() { S.on = false; clearTimer(); if (LP.P.name === 'stories') LP.stop(); if (window.TTS) TTS.stop(); }
  function clearTimer() { if (S.t) clearInterval(S.t); S.t = null; S.sleepAt = 0; S.sleepEnd = false; paintTimer(); }
  function setTimer(v) {
    clearTimer();
    if (v === 'end') { S.sleepEnd = true; APP.toast('🌙 تتوقف الحكايات بعد انتهاء الحكاية الحالية'); }
    else if (+v) {
      S.sleepAt = Date.now() + v * 60e3; APP.toast('🌙 تتوقف الحكايات بعد ' + D(v) + ' دقيقة');
      S.t = setInterval(() => { if (Date.now() >= S.sleepAt) { stopAll(); APP.toast('🌙 تصبح على خير'); } paintTimer(); }, 1000);
    }
    paintTimer();
  }
  function paintTimer() {
    const el = document.getElementById('hkTimer'); if (!el) return;
    const left = S.sleepAt ? Math.max(0, Math.round((S.sleepAt - Date.now()) / 1000)) : 0;
    el.textContent = S.sleepEnd ? '🌙 بعد الحكاية الحالية' : left ? '🌙 متبقٍ ' + D(Math.floor(left / 60)) + ':' + D(String(left % 60).padStart(2, '0')) : '';
  }
  async function playIdx(i) {
    if (!S.on) return;
    if (i >= S.q.length) { S.on = false; clearTimer(); APP.toast('✔ انتهت الحكايات'); mark(); return; }
    if (S.sleepEnd && i !== S.i) { stopAll(); APP.toast('🌙 تصبح على خير'); return; }
    S.i = i; mark();
    const it = S.q[i], v = await voiceOf(it.id);
    if (!S.on) return;
    const sub = (S.col ? S.col.t + ' · ' : '') + D(i + 1) + '/' + D(S.q.length);
    const next = () => playIdx(i + 1);
    if (v) {
      const url = v.blob ? URL.createObjectURL(v.blob) : v.url;
      LP.play([{ title: it.title, sub, url }], {
        name: 'stories', icon: it.ic || '🌙', onEnd: () => { if (v.blob) URL.revokeObjectURL(url); next(); },
        onError: () => { if (v.blob) URL.revokeObjectURL(url); LP.stop(); readTts(it, next); return true; },
        extra: () => `${i > 0 ? '<button class="btn sm" data-a="hkp" title="الحكاية السابقة">⏮ السابقة</button>' : ''}${i + 1 < S.q.length ? '<button class="btn sm" data-a="hkn" title="الحكاية التالية">التالية ⏭</button>' : ''}`,
        bind: b => { const p = b.querySelector('[data-a=hkp]'), n = b.querySelector('[data-a=hkn]'); if (p) p.onclick = () => { LP.stop(); S.on = true; playIdx(i - 1); }; if (n) n.onclick = () => { LP.stop(); S.on = true; playIdx(i + 1); }; },
      });
      if (window.MEDIA) MEDIA.controls('stories', { toggle: LP.toggle, next: () => { LP.stop(); S.on = true; playIdx(i + 1); }, prev: () => { LP.stop(); S.on = true; playIdx(Math.max(0, i - 1)); }, stop: stopAll, fwd: () => LP.seek(15), back: () => LP.seek(-15) });
    } else readTts(it, next);
  }
  function readTts(it, next) {
    if (!window.TTS) { next(); return; }
    TTS.read(it.title + '. ' + it.text, it.title, { onEnd: () => { if (S.on) setTimeout(next, 700); } });
  }
  function start(col, from) { stopAll(); S.col = col; S.q = col.items(); S.on = true; playIdx(from || 0); }
  function mark() { document.querySelectorAll('.hk-row').forEach(r => r.classList.toggle('on', S.on && S.col && r.dataset.col === S.col.id && +r.dataset.i === S.i)); }

  // ===== الشاشة =====
  V.hekayat = async (el, [tab]) => {
    tab = tab || 'hk-kids';
    const tabs = COLS.filter(c => !c.book).map(c => [c.id, c.ic + ' ' + c.t]).concat([['books', '📚 كتب السيرة'], ['dl', '⬇ التنزيل']]);
    const head = `<div class="row"><h1>🌙 حكايات مسموعة</h1><span class="spacer"></span>${APP.state.reviewerUnlocked ? '<a class="btn sm" href="#/voicerec">🎙️ سجّلها بصوتك</a>' : ''}</div>
      <div class="sub">قصص وحكايات تُسمع كاملةً متتابعة: قبل النوم، في السيارة، أو وقت الفراغ. اضبط مؤقت النوم فتتوقف وحدها. ما سُجّل بصوت القارئ يُسمع بصوته 🎙️، والباقي بصوت الجهاز 🗣️.</div>
      <div class="tabs">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
    const timerCtl = `<div class="row hk-ctl" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-all>▶ شغّل الكل متتابعة</button>
      <label class="muted">🌙 مؤقت النوم <select id="hkSleep"><option value="0">بلا مؤقت</option><option value="15">١٥ دقيقة</option><option value="30">٣٠ دقيقة</option><option value="45">٤٥ دقيقة</option><option value="60">ساعة</option><option value="end">بعد الحكاية الحالية</option></select></label>
      <button class="btn" data-stop>⏹ إيقاف</button><span id="hkTimer" class="muted"></span></div>`;
    let body = '';
    if (tab === 'books') {
      body = `<div class="grid">${COLS.filter(c => c.book).map(c => `<a class="card hk-book" href="#/hekayat/${c.id}"><span class="lr-emo">${c.ic}</span><b>${esc(c.t)}</b><small class="muted">${D(c.items().length)} فصلاً · ${esc(c.d)}</small></a>`).join('')}</div>`;
    } else if (tab === 'dl') {
      const keys = new Set(await dlKeys()), all = Object.keys(window.STORY_AUDIO || {}), have = all.filter(k => keys.has(k)).length;
      body = `<div class="card"><h2 style="margin-top:0">⬇ الحكايات المسموعة بصوت القارئ</h2>
        ${all.length ? `<p>المتاح للتنزيل: <b>${D(all.length)}</b> حكاية — منزَّل على جهازك: <b>${D(have)}</b>. بعد التنزيل تُسمع بدون إنترنت.</p>
          <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" id="hkDl" ${have >= all.length ? 'disabled' : ''}>${have >= all.length ? '✔ كلها منزّلة' : have ? '⬇ أكمل التنزيل' : '⬇ نزّل الكل'}</button>${have ? '<button class="btn" id="hkDel">🗑️ حذف المنزَّل</button>' : ''}<span id="hkDlInfo" class="muted"></span></div>`
          : '<p class="muted">لم تُرفع تسجيلات بشرية بعد. حين تُسجَّل الحكايات بصوت القارئ تظهر هنا لتنزيلها والاستماع إليها بدون إنترنت إن شاء الله. وحتى ذلك الحين تُسمع كل الحكايات بصوت الجهاز.</p>'}
        </div>`;
    } else {
      const col = colOf(tab); if (!col) { location.replace('#/hekayat'); return; }
      const its = col.items();
      const marks = await Promise.all(its.map(async x => !!(await voiceOf(x.id))));
      body = `${col.book ? `<div class="row" style="margin-bottom:8px"><a class="btn sm" href="#/hekayat/books">← كتب السيرة</a><h2 style="margin:0">${col.ic} ${esc(col.t)}</h2></div>` : `<div class="muted" style="margin-bottom:8px">${esc(col.d)}</div>`}
        <div class="card">${timerCtl}</div>
        <div class="hk-list">${its.map((x, i) => `<div class="hk-row" data-col="${col.id}" data-i="${i}"><span class="hk-ic">${x.ic || '📖'}</span><span class="hk-t"><b>${esc(x.title)}</b><small class="muted">${marks[i] ? '🎙️ بصوت القارئ' : '🗣️ صوت الجهاز'} · ${D(Math.max(1, Math.round(x.text.split(/\s+/).length / 110)))} د تقريباً</small></span><button class="btn sm" data-one="${i}">▶</button></div>`).join('')}</div>`;
    }
    el.innerHTML = head + body;
    const $ = s => el.querySelector(s);
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { location.hash = '#/hekayat/' + b.dataset.tab; });
    const col = colOf(tab);
    if (col) {
      el.querySelector('[data-all]').onclick = () => start(col, 0);
      el.querySelectorAll('[data-one]').forEach(b => b.onclick = () => start(col, +b.dataset.one));
      el.querySelector('[data-stop]').onclick = stopAll;
      $('#hkSleep').onchange = e => setTimer(e.target.value);
      paintTimer(); mark();
    }
    if ($('#hkDl')) $('#hkDl').onclick = async e => {
      const btn = e.currentTarget; btn.disabled = true;
      const keys = new Set(await dlKeys()), todo = Object.keys(window.STORY_AUDIO || {}).filter(k => !keys.has(k));
      let done = 0, fail = 0;
      if (window.KEEPALIVE) KEEPALIVE.start('⬇ تنزيل الحكايات', '', { controls: false });
      for (const id of todo) { try { await putDl(id, await fetchBlob(remoteUrl(id))); } catch (x) { fail++; } done++; const inf = $('#hkDlInfo'); if (inf) inf.textContent = `${D(done)} من ${D(todo.length)}` + (fail ? ` (تعذّر ${D(fail)})` : ''); }
      if (window.KEEPALIVE) KEEPALIVE.stop();
      APP.toast(fail ? `تم مع تعذّر ${D(fail)} — أعد المحاولة` : '✔ نُزّلت الحكايات، تُسمع الآن بدون إنترنت', 5000); APP.rerender();
    };
    if ($('#hkDel')) $('#hkDel').onclick = async () => { if (!(await APP.ask('حذف الحكايات المنزّلة من الجهاز؟'))) return; await delAll(); APP.rerender(); };
  };

  window.HEKAYAT = { start, stop: stopAll, COLS };
})();
