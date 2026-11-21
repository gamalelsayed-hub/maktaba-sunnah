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
    every: () => req('readonly', s => s.getAll()),
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
    const box = opt && opt.noBar ? document.getElementById('lvInline') : null;
    if (box) { // شاشة التسجيل: مشغّل داخل الصفحة بشريط سحب كامل
      if (window.MEDIA) MEDIA.claim('libvoice');
      box.innerHTML = '<audio controls autoplay style="width:100%"></audio>';
      cur = box.firstChild; cur.src = src; cur.play().catch(() => { });
      return true;
    }
    // الاستماع العادي: المشغّل الكامل (سحب، تقديم وتأخير، مؤقت، وتحكم من الإشعار)
    const u = src; curUrl = null;
    LP.play([{ title: title || (APP.titleOf ? APP.titleOf(it) : ''), sub: 'بصوت بشري', url: u }], { name: 'libvoice-lp', icon: '🎙️', onEnd: () => { if (u.startsWith('blob:')) URL.revokeObjectURL(u); } });
    return true;
  }
  if (window.MEDIA) MEDIA.register('libvoice', () => { stopPlay(); const b = document.getElementById('lvInline'); if (b) b.innerHTML = ''; });

  // ---------- التصدير والاستيراد ----------
  // ملف واحد فيه التسجيلات + index.json يصف كل تسجيل (الكتاب والمدة) + إحصاء الأيام
  async function buildZip(recs) {
    const enc = new TextEncoder(), files = [], items = {};
    for (const r of recs) { const f = fileOf(r.id) + '.' + extOf(r.type || ''); items[r.id] = { f, b: r.bookId, s: r.sec || 0, at: r.at || 0, t: r.type || '' }; files.push({ name: f, data: new Uint8Array(await r.blob.arrayBuffer()) }); }
    files.push({ name: 'index.json', data: enc.encode(JSON.stringify({ app: 'maktaba-libvoice', v: 2, at: new Date().toISOString(), items, stats: await stats() })) });
    return DOCX.zip(files);
  }
  async function exportRecs(recs, label) {
    if (!recs.length) { APP.toast('لا توجد تسجيلات جديدة لم تُصدَّر ✔'); return false; }
    APP.toast('جارٍ تجهيز الملف…', 2500);
    const z = await buildZip(recs);
    const nm = 'voice-' + label + '-' + today() + '-' + new Date().toTimeString().slice(0, 5).replace(':', '') + '.zip';
    await APP.download(nm, new Blob([z], { type: 'application/zip' }), 'application/zip');
    const at = Date.now(); for (const r of recs) if (!r.exp) { r.exp = at; await VS.put(r); }
    await DB.setting('libvoiceSince', 0); await DB.setting('libvoiceLastExport', at);
    if (!window.NATIVE_FILE) APP.toast('صُدّر ' + AD(recs.length) + ' تسجيلاً — احفظ الملف في Google Drive', 6000);
    return true;
  }
  const exportNew = async () => exportRecs((await VS.every()).filter(r => !r.exp), 'new');
  const exportAll = async () => exportRecs(await VS.every(), 'full');
  const exportBook = async (bookId, onlyNew) => exportRecs((await VS.all(bookId)).filter(r => !onlyNew || !r.exp), String(bookId));

  // قراءة ملف zip (مخزّن أو مضغوط)
  async function unzip(file) {
    const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer), dec = new TextDecoder();
    let e = buf.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('الملف ليس ملف تسجيلات (zip)');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = {};
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      const name = dec.decode(buf.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      const st = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      out[name.replace(/^.*\//, '')] = { method, raw: buf.subarray(st, st + csz) };
    }
    return out;
  }
  async function inflate(x) {
    if (x.method === 0) return x.raw;
    if (x.method === 8 && window.DecompressionStream) return new Uint8Array(await new Response(new Blob([x.raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    throw new Error('صيغة ضغط غير مدعومة');
  }
  const typeOfExt = f => /\.ogg$/.test(f) ? 'audio/ogg' : /\.m4a$/.test(f) ? 'audio/mp4' : 'audio/webm';
  async function importFiles(files) {
    let added = 0, kept = 0;
    for (const file of files) {
      const z = await unzip(file);
      if (!z['index.json']) throw new Error('الملف «' + file.name + '» ليس من تصدير التسجيلات');
      const idx = JSON.parse(new TextDecoder().decode(await inflate(z['index.json'])));
      // يقبل الصيغة القديمة (تصدير كتاب واحد: files) والجديدة (items)
      const items = idx.items || Object.fromEntries(Object.entries(idx.files || {}).map(([id, f]) => [id, { f, b: idx.book, s: 0, at: 0 }]));
      for (const [id, m] of Object.entries(items)) {
        const ent = z[m.f]; if (!ent) continue;
        const old = await VS.get(id).catch(() => null);
        if (old && (old.at || 0) >= (m.at || 0)) { kept++; continue; }   // الأحدث يبقى
        const data = await inflate(ent);
        const type = m.t || typeOfExt(m.f);
        await VS.put({ id, bookId: m.b || String(id).split(':')[0], blob: new Blob([data], { type }), type, sec: m.s || 0, at: m.at || Date.now(), exp: Date.now() });
        added++;
      }
      if (idx.stats) { const s = await stats(); for (const [d, v] of Object.entries(idx.stats)) s[d] = Math.max(s[d] || 0, v || 0); await DB.setting('libvoiceDaily', s); }
    }
    return { added, kept };
  }
  function pickAndImport(after) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.zip,application/zip'; inp.multiple = true;
    inp.onchange = async () => {
      if (!inp.files.length) return;
      APP.toast('جارٍ الاستيراد…', 3000);
      try { const r = await importFiles([...inp.files]); APP.toast('✔ استُورد ' + AD(r.added) + ' تسجيلاً' + (r.kept ? ' (و' + AD(r.kept) + ' موجود أصلاً)' : ''), 6000); if (after) after(); }
      catch (e) { APP.toast('تعذّر الاستيراد: ' + (e.message || e), 7000); }
    };
    inp.click();
  }

  // ---------- مصادر إضافية للتسجيل (الحكايات والقصص) ----------
  // كل مصدر: { id, title, items: async () => [{ id, title, text, chapter }] }
  const SOURCES = [];
  const addSource = src => { if (!SOURCES.find(x => x.id === src.id)) SOURCES.push(src); };
  const srcOf = id => SOURCES.find(x => x.id === id);

  // ---------- الشاشة: قائمة الكتب ----------
  const V = APP.views;
  V.voicerec = async (el, [bookId, startId]) => {
    if (!APP.state.reviewerUnlocked) { el.innerHTML = '<div class="card">هذه الشاشة للمراجع العلمي فقط.</div>'; return; }
    if (bookId) return focus(el, bookId, startId ? decodeURIComponent(startId) : null);
    const s = await stats();
    const books = Object.values(APP.state.books).filter(b => b.type !== 'quran');
    const qb = Object.values(APP.state.books).find(b => b.type === 'quran');
    books.sort((a, b) => { const ia = PLAN.indexOf(a.id), ib = PLAN.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.title.localeCompare(b.title, 'ar'); });
    const rows = await Promise.all(books.map(async b => ({ b, total: await DB.count('items', 'bookId', b.id), done: await VS.count(b.id).catch(() => 0) })));
    if (qb) rows.unshift({ b: { id: qb.id, title: '📖 المصحف بصوتي — آيةً آية (رواية حفص)' }, total: await DB.count('items', 'bookId', qb.id), done: await VS.count(qb.id).catch(() => 0) });
    for (const src of SOURCES) { const its = await src.items().catch(() => []); if (its.length) rows.push({ b: { id: src.id, title: src.title }, total: its.length, done: await VS.count(src.id).catch(() => 0) }); }
    const allRecs = await VS.every().catch(() => []), unexp = allRecs.filter(r => !r.exp).length;
    const lastExp = await DB.setting('libvoiceLastExport');
    el.innerHTML = `<h1>🎙️ تسجيل المكتبة بصوتي</h1>
      <div class="sub">تقرأ النص وتسجّله، و«اقرأ لي» يشغّل صوتك بدل صوت الجهاز. التسجيلات محفوظة على هذا الجهاز فقط حتى تصدّرها، فصدّرها أولاً بأول.</div>
      ${goalCard(s)}
      <div class="card lv-backup ${unexp ? 'due' : ''}">
        <b>${unexp ? '⚠️ عندك ' + AD(unexp) + ' تسجيلاً لم تُصدَّر' : '✔ كل تسجيلاتك مصدَّرة'}</b>
        <div class="muted" style="font-size:13px;margin:4px 0 10px">${lastExp ? 'آخر تصدير: ' + new Date(lastExp).toLocaleString('ar-SA-u-nu-arab', { dateStyle: 'medium', timeStyle: 'short' }) + ' · ' : ''}التسجيلات محفوظة على هذا الجهاز فقط. صدّر بعد كل جلسة، واحفظ الملف في Google Drive.</div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn ${unexp ? 'primary' : ''}" data-expnew>📦 صدّر الجديد${unexp ? ' (' + AD(unexp) + ')' : ''}</button>
          <button class="btn" data-imp>📥 استيراد تسجيلات</button>
          ${allRecs.length ? `<button class="btn" data-expall>🗂️ نسخة كاملة (${AD(allRecs.length)})</button>` : ''}
        </div></div>
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
          ${done ? `<button class="btn sm" data-exp="${esc(b.id)}">📦 صدّر هذا الكتاب</button>` : ''}
        </div></div>`).join('')}</div>`;
    const run = fn => async e => { const b = e.currentTarget; b.disabled = true; try { if (await fn(b)) APP.rerender(); } catch (x) { APP.toast('تعذّر التصدير: ' + (x.message || x), 6000); } finally { b.disabled = false; } };
    el.querySelectorAll('[data-exp]').forEach(btn => btn.onclick = run(b => exportBook(b.dataset.exp, !!b.dataset.new)));
    el.querySelector('[data-expnew]').onclick = run(() => exportNew());
    const ea = el.querySelector('[data-expall]'); if (ea) ea.onclick = run(() => exportAll());
    el.querySelector('[data-imp]').onclick = () => pickAndImport(() => APP.rerender());
  };

  // ---------- الشاشة: التسجيل المتتابع ----------
  async function focus(el, bookId, startId) {
    el.innerHTML = '<div class="card">جارٍ تحميل الكتاب…</div>';
    const src = srcOf(bookId);
    const items = src ? (await src.items()).map((x, k) => Object.assign({ seq: k }, x)) : (await DB.byIndex('items', 'bookId', bookId)).sort((a, b) => ord(a) - ord(b) || String(a.id).localeCompare(String(b.id)));
    const have = new Set(await VS.keys(bookId).catch(() => []));
    let i = startId ? Math.max(0, items.findIndex(x => x.id === startId)) : items.findIndex(x => !have.has(x.id));
    if (i < 0) i = 0;
    const title = src ? src.title : APP.bookTitle(bookId);
    const show = async () => {
      const it = items[i]; const s = await stats();
      if (!it) { el.innerHTML = `<div class="card" style="text-align:center"><h2>🎉 أتممت تسجيل «${esc(title)}»</h2><p>جزاك الله خيراً. صدّر التسجيلات الآن.</p><a class="btn primary" href="#/voicerec">رجوع</a></div>`; return; }
      const done = have.has(it.id);
      const isQ = it.type === 'ayah' || /^quran:/.test(String(it.id));
      const head = isQ ? 'سورة ' + AR.SURAHS[it.surah - 1] + ' — الآية ' + AD(it.ayah) : (it.kitab || it.chapter || '');
      el.innerHTML = `<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="row" style="gap:8px"><a href="#/voicerec">↩ الكتب</a><button class="btn sm" data-expnew>📦 صدّر الجديد</button></span><span class="muted">${esc(title)} — ${AD(i + 1)} / ${AD(items.length)} · سُجّل ${AD(have.size)}</span></div>
        ${goalCard(s)}
        <div class="card lv-text">
          <div class="muted">${esc(head)}${it.num != null ? ' — حديث ' + AD(it.num) : ''}${it.page ? ' — ' + esc(it.page) : ''} ${done ? '<span class="tag st-ok">✔ مسجّل</span>' : ''}</div>
          ${isQ ? `<div class="lv-read quran-text lv-q">${esc(it.text || '')} <span class="muted">﴿${AD(it.ayah)}﴾</span></div>
          <label class="muted" style="font-size:13px">انتقل إلى سورة <select data-surah>${AR.SURAHS.map((n, k) => `<option value="${k + 1}" ${k + 1 === it.surah ? 'selected' : ''}>${AD(k + 1)}. ${esc(n)}</option>`).join('')}</select></label>`
          : `<div class="lv-read">${esc(textOf(it)).replace(/\n/g, '<br>')}</div>`}
        </div>
        <div class="lv-ctl">
          <button class="btn" data-prev ${i ? '' : 'disabled'}>⏮ السابق</button>
          <button class="btn primary lv-rec" data-rec>🎙️ ${done ? 'أعد التسجيل' : 'سجّل'}</button>
          ${done ? '<button class="btn" data-play>▶ استمع</button>' : ''}
          <button class="btn" data-next>${done ? '✔ التالي' : '⏭ تخطَّ'}</button>
        </div><div id="lvInline" class="lv-inline"></div>`;
      el.querySelector('[data-expnew]').onclick = async e => { e.currentTarget.disabled = true; try { await exportNew(); } finally { e.currentTarget && (e.currentTarget.disabled = false); } };
      const sj = el.querySelector('[data-surah]'); if (sj) sj.onchange = () => { const k = items.findIndex(x => x.surah === +sj.value && !have.has(x.id)); i = k >= 0 ? k : items.findIndex(x => x.surah === +sj.value); stopPlay(); show(); };
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
          if (isNew) { const n = ((await DB.setting('libvoiceSince')) || 0) + 1; await DB.setting('libvoiceSince', n); if (n % REMIND_EVERY === 0) APP.toast('سجّلت ' + AD(n) + ' نصاً لم تُصدَّر — ارجع للقائمة واضغط «صدّر الجديد»', 6000); }
          await show(); play(it, title, { noBar: true });
        } catch (x) {
          rb.textContent = '🎙️ سجّل'; rb.classList.remove('rec-on');
          APP.toast('تعذر الوصول إلى الميكروفون — اسمح للتطبيق باستعماله', 4000);
        }
      };
    };
    show();
  }

  const blob = async id => { const r = await VS.get(id).catch(() => null); return r && r.blob ? r.blob : null; };
  window.LIBVOICE = { play, stop: stopPlay, blob, addSource, SOURCES, has: id => VS.get(id).then(Boolean).catch(() => false), exportBook, exportNew, exportAll, importFiles, pickAndImport, PLAN, GOAL_MIN };
})();
