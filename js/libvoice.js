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
  const extOf = t => /ogg/.test(t) ? 'ogg' : /mp4|aac|m4a/.test(t) ? 'm4a' : /mpeg|mp3/.test(t) ? 'mp3' : /wav/.test(t) ? 'wav' : 'webm';

  // ---------- التسجيل ----------
  let rec = null;
  // إعداد الميكروفون: اختيار ميكروفون خارجي (مثل LARK) وإيقاف معالجة الجوال للصوت
  const micCfg = async () => (await DB.setting('libvoiceMic')) || { id: '', raw: false };
  async function startRec() {
    const m = await micCfg(), proc = !m.raw;
    const audio = { echoCancellation: proc, noiseSuppression: proc, autoGainControl: proc };
    if (m.id) audio.deviceId = { ideal: m.id };
    const stream = await navigator.mediaDevices.getUserMedia({ audio });
    const mt = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
    const r = rec = new MediaRecorder(stream, mt ? { mimeType: mt, audioBitsPerSecond: m.raw ? 64000 : 32000 } : undefined); const chunks = [], t0 = Date.now();
    r.ondataavailable = e => e.data.size && chunks.push(e.data);
    r.start(1000);
    return new Promise(res => { r.onstop = () => { stream.getTracks().forEach(t => t.stop()); rec = null; res({ blob: new Blob(chunks, { type: r.mimeType || 'audio/webm' }), sec: Math.round((Date.now() - t0) / 1000) }); }; });
  }

  // ---------- إرفاق تسجيل من تطبيق آخر (Dolby On، ASR…) ----------
  const durOf = blob => new Promise(res => { const a = new Audio(); const u = URL.createObjectURL(blob); a.preload = 'metadata'; a.onloadedmetadata = () => { const d = isFinite(a.duration) ? a.duration : 0; URL.revokeObjectURL(u); res(Math.round(d)); }; a.onerror = () => { URL.revokeObjectURL(u); res(0); }; a.src = u; });
  const typeOfFile = f => f.type || (/\.m4a$|\.aac$/i.test(f.name) ? 'audio/mp4' : /\.mp3$/i.test(f.name) ? 'audio/mpeg' : /\.wav$/i.test(f.name) ? 'audio/wav' : /\.ogg|\.opus$/i.test(f.name) ? 'audio/ogg' : 'audio/webm');
  function pickAudio(multi) {
    return new Promise(res => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'audio/*,.m4a,.mp3,.wav,.ogg,.opus,.aac'; inp.multiple = !!multi; inp.onchange = () => res([...inp.files]); inp.click(); });
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
      box.innerHTML = '<audio controls preload="auto" data-media="libvoice" style="width:100%"></audio>';
      cur = box.firstChild; cur.src = src;
      // تسجيلات webm من المتصفح بلا مدة مكتوبة: نحسبها حتى يظهر شريط التقدم
      cur.addEventListener('loadedmetadata', function fix() { if (this.duration === Infinity || isNaN(this.duration)) { this.currentTime = 1e101; this.addEventListener('timeupdate', function back() { this.removeEventListener('timeupdate', back); this.currentTime = 0; this.play().catch(() => { }); }); } else this.play().catch(() => { }); }, { once: true });
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
  const typeOfExt = f => /\.ogg$/.test(f) ? 'audio/ogg' : /\.m4a$/.test(f) ? 'audio/mp4' : /\.mp3$/.test(f) ? 'audio/mpeg' : /\.wav$/.test(f) ? 'audio/wav' : 'audio/webm';
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
    if (!APP.state.reviewerUnlocked) { el.innerHTML = '<div class="warn">هذه الصفحة لصاحب التطبيق فقط.</div>'; return; }
    if (!APP.state.reviewerUnlocked) { el.innerHTML = '<div class="card">هذه الشاشة للمراجع العلمي فقط.</div>'; return; }
    const cat = bookId && bookId.startsWith('c:') ? bookId.slice(2) : null;
    if (bookId && !cat) return focus(el, bookId, startId ? decodeURIComponent(startId) : null);
    const s = await stats();
    const books = Object.values(APP.state.books).filter(b => b.type !== 'quran');
    const qb = Object.values(APP.state.books).find(b => b.type === 'quran');
    books.sort((a, b) => { const ia = PLAN.indexOf(a.id), ib = PLAN.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.title.localeCompare(b.title, 'ar'); });
    const rows = await Promise.all(books.map(async b => ({ b, total: await DB.count('items', 'bookId', b.id), done: await VS.count(b.id).catch(() => 0) })));
    if (qb) rows.unshift({ b: { id: qb.id, title: '📖 المصحف بصوتي — آيةً آية (رواية حفص)' }, total: await DB.count('items', 'bookId', qb.id), done: await VS.count(qb.id).catch(() => 0) });
    for (const src of SOURCES) { const its = await src.items().catch(() => []); if (its.length) rows.push({ b: { id: src.id, title: src.title }, total: its.length, done: await VS.count(src.id).catch(() => 0) }); }
    // تصنيف الكتب في أقسام: القرآن، الأطفال، الحديث، التفسير... حتى يسهل الوصول
    const MF = {}; (window.PACK_MANIFEST || []).forEach(m => MF[m.id] = m);
    const catOf = id => {
      const m = MF[id] || {}, t = m.type || (APP.state.books[id] || {}).type || '', f = m.file || '';
      if (id === (qb && qb.id)) return 'quran';
      if (/^(hk-|nawawi-kids)/.test(id)) return 'kids';
      if (/^(asma-husna|duas-sunnah|ruqyah-duas)$/.test(id)) return 'adhkar';
      if (/^hadith-/.test(f) || t === 'hadith' || t === 'sharh') return 'hadith';
      if (/tafsir|qiraatbook|mutash/.test(t) || /^tafsir/.test(id)) return 'tafsir';
      if (/fiqhbook|matn|usulbook/.test(t)) return 'fiqh';
      if (/sirabook|tarikhbook|rijal/.test(t)) return 'tarikh';
      if (/lughabook|adabbook|diwan/.test(t)) return 'lugha';
      if (t === 'dawahbook') return 'dawah';
      return 'other';
    };
    const CATS = [['quran', '📖', 'القرآن الكريم', 'آيةً آية، أو حدّد نطاقاً تسجّله'], ['kids', '🧒', 'الأطفال والتعلّم', 'الحروف والحركات والكلمات والقصص والأربعون للأطفال'], ['adhkar', '🤲', 'الأذكار والأدعية', 'أسماء الله الحسنى، وأدعية السنة، والرقية'],
      ['hadith', '📜', 'الحديث وشروحه', 'الأربعون، ورياض الصالحين، والكتب الستة'], ['tafsir', '📗', 'التفسير وعلوم القرآن', 'التفاسير والقراءات والمتشابه'], ['fiqh', '⚖️', 'الفقه والعقيدة والأصول', 'المتون وكتب الفقه وأصوله'],
      ['tarikh', '🏛️', 'السيرة والتاريخ', 'السيرة والتراجم والتاريخ'], ['lugha', '✍️', 'العربية والأدب', 'النحو والبلاغة والأدب والدواوين'], ['dawah', '📣', 'الدعوة', 'كتب الحوار والدعوة'], ['other', '📚', 'كتب أخرى', '']];
    rows.forEach(r => r.cat = catOf(r.b.id));
    let kidsClips = null;
    if (window.LEARN && LEARN.clips) { const all = LEARN.clips(), have = new Set(await LEARN.VS.keys().catch(() => [])); kidsClips = { total: all.length, done: all.filter(c => have.has(c.key)).length }; }
    const shown = cat ? rows.filter(r => r.cat === cat) : [];
    const catInfo = cat && CATS.find(c => c[0] === cat);
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
      ${cat ? `<div class="row" style="justify-content:space-between;margin:6px 0"><h2 style="margin:0">${catInfo ? catInfo[1] + ' ' + catInfo[2] : ''}</h2><a class="btn sm" href="#/voicerec">↩ كل الأقسام</a></div>` : `<div class="lv-cats">${CATS.map(([k, ic, t, d]) => {
        const rs = rows.filter(r => r.cat === k); let tot = rs.reduce((a, r) => a + r.total, 0), dn = rs.reduce((a, r) => a + r.done, 0);
        if (k === 'kids' && kidsClips) { tot += kidsClips.total; dn += kidsClips.done; }
        if (!tot) return '';
        return `<a class="card lv-cat" href="#/voicerec/c:${k}"><span class="ic">${ic}</span><b>${t}</b><small class="muted">${d}</small><div class="lr-progress"><i style="width:${tot ? Math.max(dn ? 2 : 0, Math.round(dn / tot * 100)) : 0}%"></i></div><small class="muted">سُجّل ${AD(dn)} من ${AD(tot)}${rs.length > 1 ? ' · ' + AD(rs.length) + ' كتاباً' : ''}</small></a>`; }).join('')}</div>`}
      ${cat === 'kids' && kidsClips ? `<div class="card lv-book"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>🔤 أصوات البراعم والأميين: الحروف، والحركات، والمدود، والكلمات، والجمل، والقصص</b><span class="muted">${AD(kidsClips.done)} / ${AD(kidsClips.total)}</span></div>
        <div class="lr-progress"><i style="width:${Math.round(kidsClips.done / kidsClips.total * 100)}%"></i></div>
        <div class="muted" style="font-size:13px;margin-top:6px">كل مقطع تسجّله يسمعه الطفل في الدروس والألعاب بدل صوت الجهاز.</div>
        <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><a class="btn sm primary" href="#/learnrec/go">🎙️ ${kidsClips.done ? 'أكمل' : 'ابدأ'} (المقطع التالي)</a><a class="btn sm" href="#/learnrec">📋 المقاطع مقسّمة حسب الدرس</a></div></div>` : ''}
      <div class="lv-books">${shown.map(({ b, total, done }) => `<div class="card lv-book ${done && done >= total ? 'ok' : ''}">
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
    let items = src ? (await src.items()).map((x, k) => Object.assign({ seq: k }, x)) : (await DB.byIndex('items', 'bookId', bookId)).sort((a, b) => ord(a) - ord(b) || String(a.id).localeCompare(String(b.id)));
    // القرآن: تسجيل نطاق محدد (من سورة/آية إلى سورة/آية)
    const isQB = items.length && items[0].type === 'ayah';
    const QR = isQB ? await DB.setting('libvoiceQRange') : null, qk = x => x.surah * 1000 + x.ayah;
    if (QR) items = items.filter(x => qk(x) >= QR.s1 * 1000 + QR.a1 && qk(x) <= QR.s2 * 1000 + QR.a2);
    const qrLabel = QR ? `سورة ${AR.SURAHS[QR.s1 - 1]} ${AD(QR.a1)} ← سورة ${AR.SURAHS[QR.s2 - 1]} ${AD(QR.a2)}` : 'المصحف كاملاً';
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
        ${isQB ? `<div class="card lv-range"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><span>🎯 النطاق: <b>${esc(qrLabel)}</b></span><button class="btn sm" data-range>تغيير النطاق</button></div>
          <div class="lr-progress"><i style="width:${Math.round(items.filter(x => have.has(x.id)).length / Math.max(1, items.length) * 100)}%"></i></div><small class="muted">سُجّل ${AD(items.filter(x => have.has(x.id)).length)} من ${AD(items.length)} آية في هذا النطاق</small></div>` : ''}
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
        </div>
        <div class="row lv-ext" style="gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px">
          <button class="btn sm" data-att>📎 إرفاق ملف لهذا النص</button>
          <button class="btn sm" data-attm>📎📎 ملفات متتابعة من هنا</button>
          <button class="btn sm" data-mic>🎤 الميكروفون</button>
        </div><div id="lvInline" class="lv-inline"></div>`;
      el.querySelector('[data-expnew]').onclick = async e => { e.currentTarget.disabled = true; try { await exportNew(); } finally { e.currentTarget && (e.currentTarget.disabled = false); } };
      const rg = el.querySelector('[data-range]'); if (rg) rg.onclick = () => {
        const opts = sel => AR.SURAHS.map((n, k) => `<option value="${k + 1}" ${k + 1 === sel ? 'selected' : ''}>${AD(k + 1)}. ${esc(n)}</option>`).join('');
        const r = QR || { s1: it.surah, a1: 1, s2: it.surah, a2: 999 };
        APP.modal(`<h2 style="margin-top:0">🎯 نطاق التسجيل</h2><p class="muted" style="margin-top:0">اختر من أين تبدأ وإلى أين تنتهي، والتطبيق يعرض لك آيات هذا النطاق فقط بالترتيب ويحسب تقدمك فيه.</p>
          <label>من سورة <select id="qs1" style="width:100%">${opts(r.s1)}</select></label><label>الآية <input id="qa1" type="number" min="1" value="${r.a1}" style="width:100%"></label>
          <label style="margin-top:8px;display:block">إلى سورة <select id="qs2" style="width:100%">${opts(r.s2)}</select></label><label>الآية <input id="qa2" type="number" min="1" value="${r.a2 === 999 ? '' : r.a2}" placeholder="آخر السورة" style="width:100%"></label>
          <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" id="qOk">حفظ النطاق</button><button class="btn" id="qAll">المصحف كاملاً</button><button class="btn" id="qNo">إلغاء</button></div>`, box => {
          const $ = q => box.querySelector(q);
          $('#qNo').onclick = () => APP.closeModal();
          $('#qAll').onclick = async () => { await DB.setting('libvoiceQRange', null); APP.closeModal(); stopPlay(); focus(el, bookId); };
          $('#qOk').onclick = async () => {
            let v = { s1: +$('#qs1').value, a1: Math.max(1, +$('#qa1').value || 1), s2: +$('#qs2').value, a2: +$('#qa2').value || 999 };
            if (v.s2 * 1000 + v.a2 < v.s1 * 1000 + v.a1) v = { s1: v.s2, a1: v.a2 === 999 ? 1 : v.a2, s2: v.s1, a2: v.a1 };
            await DB.setting('libvoiceQRange', v); APP.closeModal(); stopPlay(); focus(el, bookId);
          };
        });
      };
      const sj = el.querySelector('[data-surah]'); if (sj) sj.onchange = () => { const k = items.findIndex(x => x.surah === +sj.value && !have.has(x.id)); const j = k >= 0 ? k : items.findIndex(x => x.surah === +sj.value); if (j < 0) { APP.toast('هذه السورة خارج النطاق المحدد — غيّر النطاق أولاً'); sj.value = it.surah; return; } i = j; stopPlay(); show(); };
      el.querySelector('[data-prev]').onclick = () => { if (i > 0) { i--; stopPlay(); show(); } };
      el.querySelector('[data-next]').onclick = () => { i++; stopPlay(); show(); window.scrollTo(0, 0); };
      const pb = el.querySelector('[data-play]'); if (pb) pb.onclick = () => play(it, title, { noBar: true });
      // إرفاق ملف صوتي سُجّل بتطبيق آخر: يُحسب في المتابعة والهدف اليومي كأنه سُجّل هنا
      const attach = async (files, start) => {
        let n = 0, big = 0;
        for (let k = 0; k < files.length && items[start + k]; k++) {
          const f = files[k], target = items[start + k], blob = new Blob([await f.arrayBuffer()], { type: typeOfFile(f) });
          if (blob.size > 8 * 1048576) big++;
          const sec = await durOf(blob), isNew = !have.has(target.id);
          await VS.put({ id: target.id, bookId, blob, type: blob.type, sec, at: Date.now(), src: f.name });
          have.add(target.id); await addSeconds(sec); n++;
          if (isNew) await DB.setting('libvoiceSince', ((await DB.setting('libvoiceSince')) || 0) + 1);
        }
        APP.toast('✔ أُرفق ' + AD(n) + ' تسجيلاً' + (big ? ' — تنبيه: بعض الملفات كبيرة (WAV)؛ صيغة M4A أصغر بكثير' : ''), 6000);
        return n;
      };
      el.querySelector('[data-att]').onclick = async () => { const fs = await pickAudio(false); if (!fs.length) return; stopPlay(); await attach(fs, i); await show(); play(it, title, { noBar: true }); };
      el.querySelector('[data-attm]').onclick = async () => {
        const fs = (await pickAudio(true)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        if (!fs.length) return;
        const last = items[Math.min(items.length - 1, i + fs.length - 1)];
        if (!confirm('سيُرفق ' + AD(fs.length) + ' ملفاً بالترتيب حسب أسمائها:\nمن: ' + (fs[0].name) + ' ← النص الحالي\nإلى: ' + fs[fs.length - 1].name + ' ← ' + (APP.titleOf ? APP.titleOf(last) : last.id) + '\nمتابعة؟')) return;
        stopPlay(); const n = await attach(fs, i); i += n; show(); window.scrollTo(0, 0);
      };
      el.querySelector('[data-mic]').onclick = async () => {
        let devs = []; try { const st = await navigator.mediaDevices.getUserMedia({ audio: true }); st.getTracks().forEach(t => t.stop()); devs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput'); } catch (e) { }
        const m = await micCfg();
        APP.modal(`<h2 style="margin-top:0">🎤 الميكروفون</h2>
          <label class="muted">الميكروفون المستعمل</label><select id="micD" style="width:100%"><option value="">تلقائي (الافتراضي)</option>${devs.map((d, k) => `<option value="${esc(d.deviceId)}" ${d.deviceId === m.id ? 'selected' : ''}>${esc(d.label || 'ميكروفون ' + (k + 1))}</option>`).join('')}</select>
          <label class="row" style="gap:8px;margin-top:10px"><input type="checkbox" id="micR" ${m.raw ? 'checked' : ''}> ميكروفون خارجي احترافي: أوقف معالجة الجوال للصوت (إلغاء الصدى والضوضاء ورفع الصوت التلقائي) وسجّل بجودة أعلى</label>
          <div class="muted" style="font-size:12.5px;margin-top:8px">مع ميكروفون مثل Hollyland LARK: وصّله قبل فتح هذه النافذة، واختره من القائمة، وفعّل الخيار السابق؛ فمعالجة الجوال قد تشوّه صوت الميكروفون الجيد.</div>
          <div class="row" style="margin-top:10px"><button class="btn primary" id="micOk">حفظ</button><button class="btn" id="micNo">إلغاء</button></div>`, box => {
          box.querySelector('#micNo').onclick = () => APP.closeModal();
          box.querySelector('#micOk').onclick = async () => { await DB.setting('libvoiceMic', { id: box.querySelector('#micD').value, raw: box.querySelector('#micR').checked }); APP.closeModal(); APP.toast('تم الحفظ ✔'); };
        });
      };
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
  window.LIBVOICE = { record: startRec, isRecording: () => !!rec, stopRecording: () => rec && rec.stop(), play, stop: stopPlay, blob, addSource, SOURCES, has: id => VS.get(id).then(Boolean).catch(() => false), exportBook, exportNew, exportAll, importFiles, pickAndImport, PLAN, GOAL_MIN };
})();
