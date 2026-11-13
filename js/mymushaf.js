/* 📕 مصحفي الخاص: صور صفحات المصحف الذي يحفظ عليه المستخدم (من PDF أو صور يلتقطها)،
   محفوظة على جهازه فقط، مع تقليب الصفحات وربط كل صفحة بآياتها تقديراً
   (من فهرس السور في مصحفه + كثافة الأسطر في مصحف المدينة) ويُضبط التقدير بتحديد أول آية في أي صفحة. */
(function () {
  const { esc } = APP;
  const V = APP.views;
  const D = AR.toArabicDigits;
  const SKEY = 'mymushaf';
  // فهرس مصحف المستخدم (306 صفحة) كما في صفحة الفهرس المصوّرة
  const PRESET306 = [1, 2, 26, 39, 54, 65, 77, 90, 95, 105, 112, 119, 126, 129, 132, 135, 142, 148, 154, 157, 162, 167, 172, 176, 181, 184, 189, 194, 199, 203, 207, 208, 210, 215, 218, 221, 224, 227, 230, 235, 240, 243, 246, 249, 251, 252, 254, 257, 259, 260, 261, 263, 264, 265, 267, 268, 270, 272, 274, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 294, 295, 296, 296, 297, 297, 298, 298, 299, 299, 300, 300, 301, 301, 301, 302, 302, 302, 302, 303, 303, 303, 304, 304, 304, 304, 305, 305, 305, 305, 305, 306, 306, 306, 306, 306];

  // ===== تخزين الصور (قاعدة مستقلة) =====
  let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('maktaba-mymushaf', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('pages', { keyPath: 'n' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('pages', mode); const st = t.objectStore('pages'); const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
  const putPage = (n, blob) => tx('readwrite', st => st.put({ n, blob }));
  const getPage = n => tx('readonly', st => st.get(n)).then(r => r && r.blob);
  const pageNums = () => tx('readonly', st => st.getAllKeys());
  const clearPages = () => tx('readwrite', st => st.clear());

  const loadMeta = async () => (await DB.setting(SKEY)) || null;
  const saveMeta = m => DB.setting(SKEY, m);

  // ===== تقدير آيات كل صفحة =====
  let C = null;
  const coords = () => window.MUSHAF_COORDS ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/pages/coords.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  function buildModel(meta) {
    const A = MUSHAF_COORDS.a, H = MUSHAF_COORDS.h, TOT = MUSHAF_COORDS.total, P = meta.surahStart, N = meta.total;
    const idx = {}; A.forEach((x, i) => { idx[x[0] + ':' + x[1]] = i; });
    const coordOf = (s, a) => { const i = idx[s + ':' + a]; return i === undefined ? 0 : A[i][2]; };
    let knots = [];
    if (P && P.length === 114) {
      const R = (TOT - 30) / Math.max(1, N - 2);
      const u = [];
      for (let s = 1; s <= 114; s++) {
        if (s === 1) { u[s] = P[0]; continue; }
        let x = u[s - 1] + (H[s - 1] - H[s - 2]) / R;
        u[s] = Math.max(P[s - 1], Math.min(P[s - 1] + 0.95, x));
      }
      for (let s = 1; s <= 114; s++) knots.push({ u: u[s], m: H[s - 1], k: 0 });
    } else knots.push({ u: 1, m: 0, k: 0 });
    Object.entries(meta.anchors || {}).forEach(([p, [s, a]]) => knots.push({ u: +p, m: coordOf(s, a), k: 1 }));
    knots.push({ u: N + 1, m: TOT, k: 0 });
    knots.sort((x, y) => x.u - y.u || y.k - x.k);
    // إزالة ما يخالف الترتيب (المضبوط يدوياً مقدَّم)
    const anchorsK = knots.filter(k => k.k);
    knots = knots.filter(k => k.k || !anchorsK.some(a => (a.u <= k.u && a.m > k.m) || (a.u >= k.u && a.m < k.m)));
    const mAt = pg => { for (let i = 0; i < knots.length - 1; i++) { const a = knots[i], b = knots[i + 1]; if (pg >= a.u && pg <= b.u) return a.m + (b.m - a.m) * (pg - a.u) / ((b.u - a.u) || 1); } return TOT; };
    const firstIdx = []; for (let s = 1; s <= 114; s++) firstIdx[s] = idx[s + ':1'];
    const ayahAt = c => {
      // موضع داخل عنوان سورة أو بسملتها ← أول آية في السورة
      for (let s = 2; s <= 114; s++) if (c >= H[s - 1] - 0.5 && c < A[firstIdx[s]][2]) return firstIdx[s];
      let lo = 0, hi = A.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (A[m][2] <= c + 0.5) lo = m; else hi = m - 1; } return lo;
    };
    const startIdx = p => meta.anchors && meta.anchors[p] ? idx[meta.anchors[p].join(':')] : ayahAt(mAt(p));
    return {
      range(p) {
        const a = startIdx(p), b = p < N ? Math.max(a, startIdx(p + 1) - 1) : A.length - 1;
        const exact = !!(meta.anchors && meta.anchors[p] && meta.anchors[p + 1]);
        return { from: A[a], to: A[b], list: A.slice(a, b + 1).map(x => [x[0], x[1]]), exact, anchored: !!(meta.anchors && meta.anchors[p]) };
      },
      pageOf(s, a) {
        if (a === 1 && P && P.length === 114) return P[s - 1];
        const i = idx[s + ':' + a]; let lo = 1, hi = N;
        while (lo < hi) { const m = (lo + hi + 1) >> 1; if (startIdx(m) <= i) lo = m; else hi = m - 1; }
        return lo;
      }
    };
  }

  // ===== الاستيراد =====
  async function toJpeg(src, maxW) {
    // src: Blob/File صورة، أو canvas جاهز
    let cv = src;
    if (!(src instanceof HTMLCanvasElement)) {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('صورة غير صالحة')); i.src = URL.createObjectURL(src); });
      const sc = Math.min(1, maxW / img.naturalWidth);
      cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(img.src);
    }
    return new Promise(res => cv.toBlob(res, 'image/jpeg', 0.82));
  }
  async function importPdf(file, firstQuranPdfPage, startAt, onProg) {
    let lib;
    try { lib = await import('./vendor/pdfjs/pdf.min.mjs'); } catch (e) { throw new Error('فتح ملفات PDF غير متاح في هذه النسخة — استعمل الصور بدلاً منه'); }
    lib.GlobalWorkerOptions.workerSrc = new URL('js/vendor/pdfjs/pdf.worker.min.mjs', location.href.split('#')[0].replace(/[^/]*$/, '')).href;
    const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    let n = startAt, done = 0;
    for (let i = firstQuranPdfPage; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i), vp0 = pg.getViewport({ scale: 1 });
      const vp = pg.getViewport({ scale: Math.min(3, 1200 / vp0.width) });
      const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
      await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      await putPage(n++, await toJpeg(cv)); done++; onProg && onProg(done, pdf.numPages - firstQuranPdfPage + 1);
      pg.cleanup && pg.cleanup();
    }
    return done;
  }
  async function importImages(files, startAt, onProg) {
    const arr = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) || a.lastModified - b.lastModified);
    let n = startAt;
    for (let i = 0; i < arr.length; i++) { await putPage(n++, await toJpeg(arr[i], 1400)); onProg && onProg(i + 1, arr.length); }
    return arr.length;
  }

  // ===== الشاشات =====
  const urls = [];
  const freeUrls = () => { while (urls.length) URL.revokeObjectURL(urls.pop()); };

  V.mymushaf = async (el, parts, p) => {
    freeUrls();
    let meta = await loadMeta();
    if (!meta || parts[0] === 'setup') return setup(el, meta);
    if (parts[0] === 'import') return importView(el, meta);
    await coords(); const M = buildModel(meta);
    let page = +parts[0] || 0;
    if (!page) { if (p.s) page = M.pageOf(+p.s, +(p.a || 1)); else page = meta.last || 1; location.replace('#/mymushaf/' + page); return; }
    page = Math.min(meta.total, Math.max(1, page));
    if (meta.last !== page) { meta.last = page; saveMeta(meta); }
    const have = await pageNums(), blob = await getPage(page);
    const r = M.range(page);
    const nm = (s, a) => 'سورة ' + AR.SURAHS[s - 1] + ' ' + D(a);
    const hifzN = Object.keys(meta.hifz || {}).length;
    let body;
    if (blob) { const u = URL.createObjectURL(blob); urls.push(u); body = `<img class="mm-img" src="${u}" alt="صفحة ${page}">`; }
    else {
      const its = await Promise.all(r.list.map(([s, a]) => DB.get('items', 'quran:' + s + ':' + a)));
      body = `<div class="mm-empty"><div class="muted" style="margin-bottom:6px">لم تُضف صورة هذه الصفحة بعد — <a href="#/mymushaf/import">أضف صفحات مصحفك</a>. وهذه آياتها بالتقريب:</div><div class="quran-text" style="font-size:20px">${its.filter(Boolean).map(x => esc(x.text) + ` <span class="ayah-num">${D(x.ayah)}</span>`).join(' ')}</div></div>`;
    }
    el.innerHTML = `<div class="mp-bar row">
        <a class="btn sm" href="#/mymushaf/${Math.max(1, page - 1)}">→</a>
        <select id="mmS" class="mp-sel">${AR.SURAHS.map((n, i) => `<option value="${i + 1}">${D(i + 1)}. ${esc(n)}</option>`).join('')}</select>
        <input id="mmGo" type="number" min="1" max="${meta.total}" value="${page}" class="mp-in">
        <span class="muted" style="font-size:12px">/ ${D(meta.total)}</span>
        <a class="btn sm" href="#/mymushaf/${Math.min(meta.total, page + 1)}">←</a>
      </div>
      <div class="mm-info"><b>${esc(nm(r.from[0], r.from[1]))}</b> ← <b>${esc(nm(r.to[0], r.to[1]))}</b> <small class="muted">${r.exact ? '✔ مضبوط' : '(تقريبي)'}</small>${meta.hifz && meta.hifz[page] ? ' <span class="tag g-sahih">✔ محفوظة</span>' : ''}</div>
      <div class="mm-wrap" id="mmWrap">${body}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px">
        <button class="btn sm primary" id="mmTf">📖 تفسير آيات الصفحة</button>
        <button class="btn sm" id="mmPlay">▶ استمع</button>
        <button class="btn sm" id="mmHifz">${meta.hifz && meta.hifz[page] ? '↩ إلغاء «محفوظة»' : '✔ حفظت هذه الصفحة'}</button>
        <button class="btn sm" id="mmAnchor">📌 ضبط أول آية</button>
        <button class="btn sm" id="mmZoom">🔍 تكبير</button>
        <a class="btn sm" href="#/mymushaf/import">➕ إضافة صفحات</a>
        <a class="btn sm" href="#/mymushaf/setup">⚙️</a>
      </div>
      <div class="muted" style="text-align:center;font-size:12px;margin-top:6px">${esc(meta.name)} — الصور المضافة ${D(have.length)} من ${D(meta.total)} — حفظت ${D(hifzN)} صفحة (${D(Math.round(hifzN / meta.total * 100))}٪). اسحب يميناً ويساراً للتقليب.</div>`;
    const $ = s => el.querySelector(s);
    $('#mmS').value = r.from[0];
    $('#mmS').onchange = e => { location.hash = '#/mymushaf/' + M.pageOf(+e.target.value, 1); };
    $('#mmGo').onchange = e => { location.hash = '#/mymushaf/' + Math.min(meta.total, Math.max(1, +e.target.value || 1)); };
    $('#mmPlay').onclick = () => window.QA && QA.play(r.list);
    $('#mmHifz').onclick = async () => { meta.hifz = meta.hifz || {}; if (meta.hifz[page]) delete meta.hifz[page]; else meta.hifz[page] = new Date().toISOString().slice(0, 10); await saveMeta(meta); APP.rerender(); };
    $('#mmZoom').onclick = () => $('#mmWrap').classList.toggle('zoom');
    $('#mmTf').onclick = async () => {
      const its = (await Promise.all(r.list.map(([s, a]) => DB.get('items', 'quran:' + s + ':' + a)))).filter(Boolean);
      APP.modal(`<div class="row"><b>آيات الصفحة ${D(page)}</b><span class="spacer"></span><button class="icon-btn" onclick="APP.closeModal()" style="color:var(--muted)">✕</button></div>
        <div class="muted" style="font-size:12.5px">اختر الآية:</div><div class="mm-ay">${its.map(x => `<button class="btn sm" data-a="${x.id}">${esc(AR.SURAHS[x.surah - 1])} ${D(x.ayah)}</button>`).join('')}</div><div id="mmT"></div><div id="mmAp"></div>`, box => {
        const show = id => { const x = its.find(i => i.id === id); box.querySelectorAll('[data-a]').forEach(b => b.classList.toggle('primary', b.dataset.a === id)); box.querySelector('#mmT').innerHTML = `<div class="quran-text" style="margin:8px 0">${esc(x.text)}</div>`; AYAH.panel(box.querySelector('#mmAp'), x); };
        box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => show(b.dataset.a));
        if (its[0]) show(its[0].id);
      });
    };
    $('#mmAnchor').onclick = () => {
      APP.modal(`<h2 style="margin-top:0">📌 أول آية في الصفحة ${D(page)}</h2><div class="muted" style="font-size:13px">انظر في مصحفك: بأي آية تبدأ هذه الصفحة؟ (إن بدأت الصفحة بوسط آية فاختر تلك الآية). يضبط هذا تقدير ما حولها من الصفحات.</div>
        <div class="row" style="gap:6px;margin:10px 0;flex-wrap:wrap"><select id="anS">${AR.SURAHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === r.from[0] ? 'selected' : ''}>${D(i + 1)}. ${esc(n)}</option>`).join('')}</select><input id="anA" type="number" min="1" value="${r.from[1]}" style="width:80px"></div>
        <div class="row" style="gap:6px"><button class="btn primary" id="anOk">حفظ</button>${meta.anchors && meta.anchors[page] ? '<button class="btn" id="anDel">إزالة الضبط</button>' : ''}<button class="btn" id="anX">إلغاء</button></div>`, box => {
        box.querySelector('#anOk').onclick = async () => { meta.anchors = meta.anchors || {}; meta.anchors[page] = [+box.querySelector('#anS').value, Math.max(1, +box.querySelector('#anA').value || 1)]; await saveMeta(meta); APP.closeModal(); APP.rerender(); };
        if (box.querySelector('#anDel')) box.querySelector('#anDel').onclick = async () => { delete meta.anchors[page]; await saveMeta(meta); APP.closeModal(); APP.rerender(); };
        box.querySelector('#anX').onclick = () => APP.closeModal();
      });
    };
    // السحب لتقليب الصفحات
    const wrap = $('#mmWrap'); let x0 = null, y0 = null;
    wrap.addEventListener('touchstart', e => { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } else x0 = null; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      if (x0 === null || wrap.classList.contains('zoom')) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) location.hash = '#/mymushaf/' + Math.min(meta.total, Math.max(1, page + (dx > 0 ? 1 : -1)));
    }, { passive: true });
    wrap.ondblclick = () => wrap.classList.toggle('zoom');
  };

  function setup(el, meta) {
    el.innerHTML = `<h1>📕 مصحفي الخاص</h1>
      <div class="sub">أضف صفحات المصحف الذي تحفظ عليه — من ملف PDF أو بصور تلتقطها — لتقرأ وتراجع على نفس صفحاته. الصور تُحفظ على جهازك فقط ولا تُرفع لأي مكان.</div>
      <div class="card"><h3 style="margin-top:0">إعداد المصحف</h3>
        <label class="fld">اسم المصحف <input id="stN" value="${esc((meta && meta.name) || 'مصحفي')}"></label>
        <label class="fld">عدد صفحاته <input id="stT" type="number" min="20" max="1200" value="${(meta && meta.total) || 306}" style="width:100px"></label>
        <label class="fld"><input type="checkbox" id="stP" ${!meta || (meta.surahStart && meta.surahStart.join() === PRESET306.join()) ? 'checked' : ''}> استعمل فهرس السور لمصحف الـ306 صفحة (الذي صوّرته)</label>
        <details><summary>فهرس سور مصحف آخر (اختياري)</summary><div class="muted" style="font-size:12.5px">اكتب رقم الصفحة التي تبدأ بها كل سورة، مفصولة بفواصل بترتيب السور (114 رقماً). يجعل التقدير أدق كثيراً.</div><textarea id="stI" rows="4" style="width:100%" placeholder="1, 2, 50, 77 …">${meta && meta.surahStart && meta.surahStart.join() !== PRESET306.join() ? meta.surahStart.join(', ') : ''}</textarea></details>
        <div class="row" style="gap:6px;margin-top:10px"><button class="btn primary" id="stOk">حفظ ومتابعة</button>${meta ? '<button class="btn" id="stDel">حذف كل الصور</button>' : ''}</div>
      </div>`;
    const $ = s => el.querySelector(s);
    $('#stOk').onclick = async () => {
      const m = meta || { anchors: { 44: [4, 38], 45: [4, 52] }, hifz: {} };
      m.name = $('#stN').value.trim() || 'مصحفي'; m.total = Math.max(20, +$('#stT').value || 306);
      const custom = $('#stI').value.split(/[^0-9٠-٩]+/).filter(Boolean).map(x => +x.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
      m.surahStart = $('#stP').checked ? PRESET306 : custom.length === 114 ? custom : null;
      if (!$('#stP').checked && custom.length && custom.length !== 114) { APP.toast('الفهرس يجب أن يكون 114 رقماً — كتبت ' + custom.length); return; }
      if (!$('#stP').checked && !(meta && meta.surahStart && meta.surahStart.join() !== PRESET306.join())) m.anchors = {};
      await saveMeta(m); location.hash = (await pageNums()).length ? '#/mymushaf/' + (m.last || 1) : '#/mymushaf/import';
    };
    if ($('#stDel')) $('#stDel').onclick = async () => { if (!(await APP.ask('حذف كل صور الصفحات من الجهاز؟'))) return; await clearPages(); APP.toast('حُذفت الصور'); };
  }

  async function importView(el, meta) {
    const have = await pageNums(); const next = have.length ? Math.max(...have) + 1 : 1;
    el.innerHTML = `<div class="row"><h1>➕ إضافة صفحات «${esc(meta.name)}»</h1><span class="spacer"></span><a class="btn sm" href="#/mymushaf">← المصحف</a></div>
      <div class="sub">موجود الآن ${D(have.length)} صفحة من ${D(meta.total)}.</div>
      <div class="card"><h3 style="margin-top:0">📄 من ملف PDF (الأسهل)</h3>
        <label class="fld">أول صفحة قرآن (الفاتحة) في الملف هي صفحة رقم <input id="pdF" type="number" min="1" value="1" style="width:80px"> <small class="muted">— لتخطي الغلاف والمقدمة</small></label>
        <label class="fld">وتُحفظ ابتداءً من صفحة المصحف رقم <input id="pdS" type="number" min="1" value="1" style="width:80px"></label>
        <input type="file" id="pdFile" accept="application/pdf"></div>
      <div class="card"><h3 style="margin-top:0">📷 من الصور</h3>
        <div class="muted" style="font-size:13px">صوّر الصفحات بـ«المسح الضوئي» في تطبيق Google Drive أو أي ماسح مستندات (يقص الصفحة ويعدّلها)، ثم اختر الصور كلها مرة واحدة. تُرتَّب بأسمائها.</div>
        <label class="fld">تبدأ من صفحة المصحف رقم <input id="imS" type="number" min="1" value="${Math.min(next, meta.total)}" style="width:80px"></label>
        <input type="file" id="imFile" accept="image/*" multiple>
        <div class="row" style="gap:6px;margin-top:6px"><label class="btn sm">📷 تصوير صفحة واحدة<input type="file" id="imCam" accept="image/*" capture="environment" hidden></label></div></div>
      <div id="imProg" class="info hidden"></div>`;
    const $ = s => el.querySelector(s);
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
    const prog = (d, t) => { const b = $('#imProg'); b.classList.remove('hidden'); b.textContent = `جارٍ الحفظ… ${D(d)} من ${D(t)}`; };
    const finish = n => { APP.toast(`✔ أُضيفت ${n} صفحة`, 5000); location.hash = '#/mymushaf/' + (+$('#imS').value || 1); };
    $('#pdFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const n = await importPdf(f, Math.max(1, +$('#pdF').value || 1), Math.max(1, +$('#pdS').value || 1), prog); APP.toast(`✔ أُضيفت ${n} صفحة`, 5000); location.hash = '#/mymushaf/' + (+$('#pdS').value || 1); } catch (er) { APP.toast(er.message || 'تعذّر فتح الملف', 7000); } };
    $('#imFile').onchange = async e => { if (!e.target.files.length) return; try { finish(await importImages(e.target.files, Math.max(1, +$('#imS').value || 1), prog)); } catch (er) { APP.toast(er.message, 7000); } };
    $('#imCam').onchange = async e => { if (!e.target.files.length) return; const n = Math.max(1, +$('#imS').value || 1); await importImages(e.target.files, n, prog); APP.toast('✔ حُفظت صفحة ' + D(n)); $('#imS').value = n + 1; $('#imProg').classList.add('hidden'); };
  }

  window.MYMUSHAF = { buildModel, PRESET306 };
})();
