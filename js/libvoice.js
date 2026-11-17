/* 🎙️ قراءة المكتبة بصوت بشري: المراجع يسجّل نصوص الكتب بصوته (وضع المراجع فقط)،
   و«اقرأ لي» يشغّل التسجيل إن وُجد بدل صوت الجهاز. التسجيلات تُحفظ على الجهاز حتى تُصدَّر. */
(() => {
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const AD = n => AR.toArabicDigits(n);
  const GOAL_MIN = 60;          // الهدف اليومي بالدقائق
  const REMIND_EVERY = 50;      // تذكير بالتصدير كل 50 تسجيلاً جديداً
  // ترتيب الكتب المقترح للتسجيل: الصغير أولاً ثم الأهم
  const PLAN = ['nawawi40', 'qudsi40', 'dehlawi40', 'shamail', 'riyad', 'bukhari', 'muslim', 'tafsir-ibnkathir', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah'];

  // ---------- التخزين ----------
  let dbp = null;
  const vdb = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('maktaba-libvoice', 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore('voice', { keyPath: 'id' }); s.createIndex('bookId', 'bookId'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const req = (mode, fn) => vdb().then(d => new Promise((res, rej) => {
    const t = d.transaction('voice', mode); const q = fn(t.objectStore('voice'));
    t.oncomplete = () => res(q ? q.result : undefined); t.onerror = () => rej(t.error);
  }));
  const VS = {
    get: id => req('readonly', s => s.get(id)),
    put: r => req('readwrite', s => s.put(r)),
    del: id => req('readwrite', s => s.delete(id)),
    keys: b => req('readonly', s => s.index('bookId').getAllKeys(b)),
    all: b => req('readonly', s => s.index('bookId').getAll(b)),
    count: b => req('readonly', s => s.index('bookId').count(b)),
  };

  // ---------- إحصاء الوقت اليومي ----------
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  async function stats() { return (await DB.setting('libvoiceDaily')) || {}; }
  async function addSeconds(sec) { const s = await stats(); s[today()] = (s[today()] || 0) + sec; await DB.setting('libvoiceDaily', s); return s; }
  function streak(s) { let n = 0; const d = new Date(); if (!((s[today()] || 0) >= GOAL_MIN * 60)) d.setDate(d.getDate() - 1); for (; ;) { const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); if ((s[k] || 0) >= GOAL_MIN * 60) { n++; d.setDate(d.getDate() - 1); } else return n; } }
  const fmtMin = sec => AD(Math.floor(sec / 60));
  function goalCard(s) {
    const t = s[today()] || 0, pct = Math.min(100, Math.round(t / (GOAL_MIN * 60) * 100));
    const total = Object.values(s).reduce((a, b) => a + b, 0), st = streak(s);
    return `<div class="card lv-goal"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">
      <b>اليوم: ${fmtMin(t)} من ${AD(GOAL_MIN)} دقيقة ${pct >= 100 ? '✅' : ''}</b>
      <span class="muted">المجموع: ${AD((total / 3600).toFixed(1))} ساعة${st ? ' · متتابع ' + AD(st) + ' يوم 🔥' : ''}</span></div>
      <div class="lr-progress"><i style="width:${pct}%"></i></div></div>`;
  }

  // ---------- النص المقروء ----------
  const textOf = it => [...new Set([it.type !== 'hadith' ? it.title : '', it.isnad, it.matn || it.text, it.sharh, it.body].filter(x => typeof x === 'string' && x.trim()))].join('\n\n');
  const ord = it => (it.num != null ? +it.num : it.seq != null ? +it.seq : (it.surah || 0) * 1000 + (it.ayah || 0));
  const fileOf = id => String(id).replace(/[^\w.-]+/g, '_');
  const extOf = t => /ogg/.test(t) ? 'ogg' : /mp4|aac|m4a/.test(t) ? 'm4a' : 'webm';

  // ---------- التسجيل ----------
  let rec = null;
  async function startRec() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mt = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
    const r = rec = new MediaRecorder(stream, mt ? { mimeType: mt, audioBitsPerSecond: 32000 } : undefined); const chunks = [], t0 = Date.now();
    r.ondataavailable = e => e.data.size && chunks.push(e.data);
    r.start(1000);
    return new Promise(res => { r.onstop = () => { stream.getTracks().forEach(t => t.stop()); rec = null; res({ blob: new Blob(chunks, { type: r.mimeType || 'audio/webm' }), sec: Math.round((Date.now() - t0) / 1000) }); }; });
  }

  // ---------- التشغيل («اقرأ لي») ----------
  let cur = null, curUrl = null;
  function stopPlay() { if (cur) { try { cur.pause(); } catch (e) { } cur = null; } if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null; } const b = document.getElementById('lvBar'); if (b) b.remove(); }
  function bar(title) {
    let b = document.getElementById('lvBar');
    if (!b) { b = document.createElement('div'); b.id = 'lvBar'; b.className = 'qa-bar'; document.body.appendChild(b); }
    b.innerHTML = `<button class="btn sm primary" data-a="t">⏸</button><span class="qa-now">🎙️ ${esc(String(title || '').slice(0, 40))} — بصوت بشري</span><button class="btn sm" data-a="x">✕</button>`;
    b.querySelector('[data-a=t]').onclick = e => { if (!cur) return; if (cur.paused) { cur.play(); e.target.textContent = '⏸'; } else { cur.pause(); e.target.textContent = '▶'; } };
    b.querySelector('[data-a=x]').onclick = stopPlay;
  }
  // يرجّع true إن وُجد تسجيل بشري لهذا النص وبدأ تشغيله
  async function play(it, title, opt) {
    const r = await VS.get(it.id).catch(() => null);
    const shipped = window.LIB_AUDIO && LIB_AUDIO[it.id];
    if (!(r && r.blob) && !shipped) return false;
    stopPlay();
    const src = r && r.blob ? (curUrl = URL.createObjectURL(r.blob)) : 'audio/library/' + shipped;
    if (window.TTS) TTS.stop();
    if (window.MEDIA) MEDIA.claim('libvoice');
    cur = new Audio(src); cur.onended = stopPlay;
    try { await cur.play(); } catch (e) { stopPlay(); return false; }
    if (!(opt && opt.noBar)) bar(title || (APP.titleOf ? APP.titleOf(it) : ''));
    return true;
  }
  if (window.MEDIA) MEDIA.register('libvoice', stopPlay);

  // ---------- التصدير ----------
  async function exportBook(bookId, onlyNew) {
    const all = (await VS.all(bookId)).filter(r => !onlyNew || !r.exp);
    if (!all.length) { APP.toast(onlyNew ? 'لا توجد تسجيلات جديدة لم تُصدَّر' : 'لا توجد تسجيلات'); return; }
    const enc = new TextEncoder(), files = [], idx = {};
    for (const r of all) { const name = fileOf(r.id) + '.' + extOf(r.type || ''); idx[r.id] = name; files.push({ name, data: new Uint8Array(await r.blob.arrayBuffer()) }); }
    files.push({ name: 'index.json', data: enc.encode(JSON.stringify({ book: bookId, title: APP.bookTitle(bookId), at: new Date().toISOString(), files: idx }, null, 1)) });
    const z = DOCX.zip(files);
    const nm = 'voice-' + bookId + '-' + today() + (onlyNew ? '-new' : '') + '.zip';
    await APP.download(nm, new Blob([z], { type: 'application/zip' }), 'application/zip');
    const at = Date.now(); for (const r of all) if (!r.exp) { r.exp = at; await VS.put(r); }
    await DB.setting('libvoiceSince', 0);
    APP.toast('صُدّر ' + AD(all.length) + ' تسجيلاً في ملف ' + nm, 5000);
  }

  // ---------- الشاشة: قائمة الكتب ----------
  const V = APP.views;
  V.voicerec = async (el, [bookId, startId]) => {
    if (!APP.state.reviewerUnlocked) { el.innerHTML = '<div class="card">هذه الشاشة للمراجع العلمي فقط.</div>'; return; }
    if (bookId) return focus(el, bookId, startId ? decodeURIComponent(startId) : null);
    const s = await stats();
    const books = Object.values(APP.state.books).filter(b => b.type !== 'quran');
    books.sort((a, b) => { const ia = PLAN.indexOf(a.id), ib = PLAN.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.title.localeCompare(b.title, 'ar'); });
    const rows = await Promise.all(books.map(async b => ({ b, total: await DB.count('items', 'bookId', b.id), done: await VS.count(b.id).catch(() => 0) })));
    const since = (await DB.setting('libvoiceSince')) || 0;
    el.innerHTML = `<h1>🎙️ تسجيل المكتبة بصوتي</h1>
      <div class="sub">تقرأ النص وتسجّله، و«اقرأ لي» يشغّل صوتك بدل صوت الجهاز. التسجيلات محفوظة على هذا الجهاز فقط حتى تصدّرها، فصدّرها أولاً بأول.</div>
      ${goalCard(s)}
      ${since >= REMIND_EVERY ? `<div class="warn">عندك ${AD(since)} تسجيلاً جديداً لم تُصدَّر. صدّرها الآن حتى لا تضيع لو مُسحت بيانات التطبيق.</div>` : ''}
      <details class="card"><summary><b>نصائح للتسجيل</b></summary><ul style="margin:6px 0;line-height:1.9">
        <li>غرفة هادئة، والجوال على بُعد شبر من فمك، وبنفس الوضع كل مرة.</li>
        <li>اقرأ النص لنفسك مرة قبل التسجيل، خاصة الأسانيد والأعلام.</li>
        <li>الآيات داخل النص اقرأها بالتجويد. وقل «صلى الله عليه وسلم» كاملة حيث كُتبت ﷺ.</li>
        <li>لو أخطأت: «أعد التسجيل» يستبدل القديم. ولا تسجّل وأنت متعب؛ نصف ساعة متقنة خير من ساعتين متعجلة.</li>
      </ul></details>
      <div class="lv-books">${rows.map(({ b, total, done }) => `<div class="card lv-book ${done && done >= total ? 'ok' : ''}">
        <div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(b.title)}</b><span class="muted">${AD(done)} / ${AD(total)}</span></div>
        <div class="lr-progress"><i style="width:${total ? Math.round(done / total * 100) : 0}%"></i></div>
        <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">
          <a class="btn sm primary" href="#/voicerec/${encodeURIComponent(b.id)}">🎙️ ${done ? 'أكمل' : 'ابدأ'}</a>
          ${done ? `<button class="btn sm" data-exp="${esc(b.id)}" data-new="1">📦 صدّر الجديد</button><button class="btn sm" data-exp="${esc(b.id)}">صدّر الكل</button>` : ''}
        </div></div>`).join('')}</div>`;
    el.querySelectorAll('[data-exp]').forEach(btn => btn.onclick = async () => { btn.disabled = true; try { await exportBook(btn.dataset.exp, !!btn.dataset.new); } finally { btn.disabled = false; } });
  };

  // ---------- الشاشة: التسجيل المتتابع ----------
  async function focus(el, bookId, startId) {
    el.innerHTML = '<div class="card">جارٍ تحميل الكتاب…</div>';
    const items = (await DB.byIndex('items', 'bookId', bookId)).sort((a, b) => ord(a) - ord(b) || String(a.id).localeCompare(String(b.id)));
    const have = new Set(await VS.keys(bookId).catch(() => []));
    let i = startId ? Math.max(0, items.findIndex(x => x.id === startId)) : items.findIndex(x => !have.has(x.id));
    if (i < 0) i = 0;
    const title = APP.bookTitle(bookId);
    const show = async () => {
      const it = items[i]; const s = await stats();
      if (!it) { el.innerHTML = `<div class="card" style="text-align:center"><h2>🎉 أتممت تسجيل «${esc(title)}»</h2><p>جزاك الله خيراً. صدّر التسجيلات الآن.</p><a class="btn primary" href="#/voicerec">رجوع</a></div>`; return; }
      const done = have.has(it.id);
      const head = it.kitab || it.chapter || '';
      el.innerHTML = `<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><a href="#/voicerec">↩ الكتب</a><span class="muted">${esc(title)} — ${AD(i + 1)} / ${AD(items.length)} · سُجّل ${AD(have.size)}</span></div>
        ${goalCard(s)}
        <div class="card lv-text">
          <div class="muted">${esc(head)}${it.num != null ? ' — حديث ' + AD(it.num) : ''}${it.page ? ' — ' + esc(it.page) : ''} ${done ? '<span class="tag st-ok">✔ مسجّل</span>' : ''}</div>
          <div class="lv-read">${esc(textOf(it)).replace(/\n/g, '<br>')}</div>
        </div>
        <div class="lv-ctl">
          <button class="btn" data-prev ${i ? '' : 'disabled'}>⏮ السابق</button>
          <button class="btn primary lv-rec" data-rec>🎙️ ${done ? 'أعد التسجيل' : 'سجّل'}</button>
          ${done ? '<button class="btn" data-play>▶ استمع</button>' : ''}
          <button class="btn" data-next>${done ? '✔ التالي' : '⏭ تخطَّ'}</button>
        </div>`;
      el.querySelector('[data-prev]').onclick = () => { if (i > 0) { i--; stopPlay(); show(); } };
      el.querySelector('[data-next]').onclick = () => { i++; stopPlay(); show(); window.scrollTo(0, 0); };
      const pb = el.querySelector('[data-play]'); if (pb) pb.onclick = () => play(it, title, { noBar: true });
      const rb = el.querySelector('[data-rec]');
      rb.onclick = async () => {
        if (rec) { rec.stop(); return; }
        stopPlay(); if (window.TTS) TTS.stop();
        try {
          const p = startRec(); rb.textContent = '⏹ إيقاف'; rb.classList.add('rec-on');
          const { blob, sec } = await p;
          if (sec < 1 || !blob.size) { APP.toast('التسجيل قصير جداً'); show(); return; }
          const isNew = !have.has(it.id);
          await VS.put({ id: it.id, bookId, blob, type: blob.type, sec, at: Date.now() });
          have.add(it.id); await addSeconds(sec);
          if (isNew) { const n = ((await DB.setting('libvoiceSince')) || 0) + 1; await DB.setting('libvoiceSince', n); if (n % REMIND_EVERY === 0) APP.toast('سجّلت ' + AD(n) + ' نصاً جديداً — صدّرها من قائمة الكتب حتى لا تضيع', 6000); }
          await show(); play(it, title, { noBar: true });
        } catch (x) {
          rb.textContent = '🎙️ سجّل'; rb.classList.remove('rec-on');
          APP.toast('تعذر الوصول إلى الميكروفون — اسمح للتطبيق باستعماله', 4000);
        }
      };
    };
    show();
  }

  window.LIBVOICE = { play, stop: stopPlay, has: id => VS.get(id).then(Boolean).catch(() => false), exportBook, PLAN, GOAL_MIN };
})();
