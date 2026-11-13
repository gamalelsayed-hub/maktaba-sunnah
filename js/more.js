/* «اسأل عن مسألة»، الكتب الإضافية، فهرس الكتب وتحميلها */
(function () {
  const { esc, $ } = APP;
  const V = APP.views;
  const N = AR.normalize;
  const STOP = ['في', 'من', 'عن', 'علي', 'الي', 'ما', 'ماذا', 'هل', 'كل', 'التي', 'الذي', 'او', 'ثم', 'حكم', 'يجوز', 'يحل', 'يحرم', 'حرام', 'حلال', 'جائز', 'الشرع', 'الاسلام', 'رأي', 'راي', 'العلماء', 'قول', 'اقوال', 'مع', 'او', 'ان', 'لا', 'هو', 'هي'];
  const HUKM = { 'تحريم': ['حرام', 'يحرم', 'تحريم', 'محرم'], 'وجوب': ['واجب', 'يجب', 'فرض', 'وجوب'], 'إباحة': ['حلال', 'يجوز', 'جائز', 'مباح', 'يحل'], 'كراهة': ['مكروه', 'يكره'], 'ندب': ['مستحب', 'يستحب', 'سنه'] };

  // ================= اسأل عن مسألة =================
  V.ask = async (el, _, p) => {
    const q = (p.q || '').trim();
    el.innerHTML = `<h1>❓ اسأل عن مسألة</h1>
      <div class="sub">اكتب المسألة بكلماتك (مثل: «قراءة الفاتحة خلف الإمام»، «زكاة الحلي»، «بيع التقسيط»، «المسح على الجوربين»). يجمع لك البرنامج كل ما في المكتبة عنها: المسائل المحررة، والآيات، والأحاديث بأحكامها، وأقوال الفقهاء في كتب المذاهب والخلاف، وأحكام القرآن، وشروح الحديث.</div>
      <form id="askF" class="filters"><input type="text" name="q" value="${esc(q)}" placeholder="اكتب المسألة…" style="flex:1;min-width:260px;font-size:16px"><button class="btn primary">ابحث</button></form>
      <div class="warn" style="font-size:13px">البرنامج يجمع النصوص من مصادرها ويحيل إليها، ولا يُفتي من عنده. وللنوازل والحالات الخاصة يُرجع إلى أهل العلم.</div>
      <div id="askR"></div>`;
    $('#askF').onsubmit = e => { e.preventDefault(); const v = new FormData(e.target).get('q').trim(); if (v) location.hash = '#/ask?q=' + encodeURIComponent(v); };
    if (!q) {
      const missing = (window.PACK_MANIFEST || []).filter(m => m.optional && !(APP.state.books[m.id] || {}).count && !(APP.state.books[m.id] || {}).sample);
      if (missing.length) $('#askR').innerHTML = `<div class="info">للحصول على أوسع إجابة، ثبّت كتب الفقه والتفسير والشروح من <a href="#/library">المكتبة ← الكتب الإضافية</a> (${missing.length} كتاباً غير مثبت).</div>`;
      return;
    }
    let words = N(q).split(' ').filter(w => w.length >= 2 && !STOP.includes(w));
    let hukm = '';
    for (const [h, ws] of Object.entries(HUKM)) if (N(q).split(' ').some(w => ws.includes(w))) hukm = hukm || h;
    if (!words.length) words = N(q).split(' ').filter(w => w.length >= 2);
    const box = $('#askR');
    const books = Object.values(APP.state.books).filter(b => b.count);
    const panels = [
      { key: 'fiqh', title: '⚖️ المسائل المحررة (أقوال المذاهب وأدلتها)', quick: x => x.type === 'fiqh', limit: 5 },
      { key: 'ayah', title: '📖 من القرآن الكريم', quick: x => x.type === 'ayah', limit: 8 },
      { key: 'hadith', title: '📜 من الأحاديث (الأقوى إسناداً أولاً)', quick: x => x.type === 'hadith', limit: 10 },
      { key: 'qaida', title: '🧩 القواعد الفقهية', quick: x => x.type === 'qaida', limit: 4 },
      { key: 'fiqhbook', title: '🏛 أقوال الفقهاء في كتب المذاهب والخلاف', deep: books.filter(b => b.type === 'fiqhbook').map(b => b.id), limit: 4, perBook: true },
      { key: 'tafsir', title: '📗 في التفاسير وأحكام القرآن', deep: books.filter(b => b.type === 'tafsir' || b.type === 'tafsirbook').map(b => b.id), limit: 3, perBook: true },
      { key: 'sharh', title: '📘 في شروح الحديث', deep: books.filter(b => b.type === 'sharh' || b.type === 'hadithbook').map(b => b.id), limit: 3, perBook: true }
    ];
    box.innerHTML = panels.map(pn => `<div id="pn-${pn.key}"><h2>${pn.title}</h2><div class="muted">جارٍ البحث…</div></div>`).join('');
    const idx = await DB.searchIndex();
    const gradeRank = g => /^sahih/.test(g) ? 3 : /^hasan/.test(g) ? 2 : /^daif/.test(g) ? 0 : 1;
    for (const pn of panels) {
      const slot = $('#pn-' + pn.key);
      let hits = [];
      if (pn.quick) {
        for (const x of idx) {
          if (!pn.quick(x) || !APP.visible(x.id)) continue;
          const sc = APP.scoreText(x.n, x.t, words, null);
          if (sc) hits.push({ id: x.id, score: sc + (hukm && x.hukm.includes(hukm) ? 8 : 0) + (x.type === 'hadith' ? gradeRank(x.grade) * 3 : 0), bookId: x.bookId });
        }
      } else if (pn.deep.length) {
        hits = await APP.deepFind(words, null, pn.deep, {}, bid => { slot.querySelector('.muted').textContent = 'يبحث في: ' + APP.bookTitle(bid) + '…'; });
      }
      hits.sort((a, b) => b.score - a.score);
      let chosen;
      if (pn.perBook) { const per = {}; chosen = hits.filter(h => (per[h.bookId] = (per[h.bookId] || 0) + 1) <= pn.limit); }
      else chosen = hits.slice(0, pn.limit);
      const items = (await Promise.all(chosen.map(h => DB.get('items', h.id)))).filter(Boolean);
      let html = `<h2>${pn.title} <small class="muted">(${hits.length})</small></h2>`;
      if (!pn.quick && !pn.deep.length) html += `<div class="muted">لا توجد كتب مثبتة من هذا النوع — <a href="#/library">ثبّتها من المكتبة</a>.</div>`;
      else if (!items.length) html += '<div class="muted">لا شيء مطابق.</div>';
      else if (pn.perBook) {
        const byBook = {}; items.forEach(it => (byBook[it.bookId] = byBook[it.bookId] || []).push(it));
        html += Object.entries(byBook).map(([bid, arr]) => `<h3>${esc(APP.bookTitle(bid))} <a class="btn sm" href="#/search?q=${encodeURIComponent(q)}&book=${bid}&deep=1&nodirect=1">كل النتائج في الكتاب</a></h3>` + arr.map(it => APP.mini(it, words.join(' '))).join('')).join('');
      } else html += items.map(it => APP.mini(it, words.join(' '))).join('') + (hits.length > items.length ? `<a class="btn sm" href="#/search?q=${encodeURIComponent(words.join(' '))}&type=${pn.key}&nodirect=1">عرض الكل (${hits.length})</a>` : '');
      slot.innerHTML = html;
    }
  };

  // ================= المكتبة: الكتب الإضافية وفهرس الكتب =================
  const origLib = V.library;
  V.library = async (el, parts, p) => {
    await origLib(el, parts, p);
    const opt = (window.PACK_MANIFEST || []).filter(m => m.optional);
    const st = m => { const b = APP.state.books[m.id]; return b && b.count && !b.sample && b.packVersion === m.version ? 'ok' : (b && b.count && !b.sample ? 'old' : 'no'); };
    const TYPE = { hadith: 'حديث', sharh: 'شرح حديث', tafsir: 'تفسير', fiqhbook: 'فقه', sirabook: 'سيرة وتاريخ وتراجم', rijal: 'رجال' };
    // الأقسام القديمة (المصادر والاستيراد اليدوي) تُطوى تحت «خيارات متقدمة» لتبسيط الشاشة
    const adv = document.createElement('details');
    adv.innerHTML = '<summary>⚙️ خيارات متقدمة: الاستيراد اليدوي، والمصادر، والكتب المثبتة</summary>';
    [...el.children].slice(1).forEach(c => adv.appendChild(c));
    el.appendChild(adv);
    const sec = document.createElement('div');
    sec.innerHTML = `<h2>📦 حزم جاهزة — حمّل كتب الفن كله بضغطة</h2>
      <div class="sub">مجموعات مختارة من الكتب المعتمدة في كل فن. بعد تحميلها تدخل في البحث العميق و«اسأل عن مسألة» وصفحة كل مسألة فقهية.</div>
      <div class="grid" id="packsBox"><div class="muted">جارٍ التحميل…</div></div>
      <h2>🔎 ابحث عن أي كتاب وحمّله بضغطة</h2>
      <div class="sub">أكثر من 12 ألف كتاب من كتب التراث (نصوص المكتبة الشاملة). اكتب اسم الكتاب أو المؤلف أو اختر فناً، ثم اضغط «تحميل» — يُحفظ في مكتبتك ويعمل بعدها بدون إنترنت.</div>
      <form id="catF" class="filters"><input type="text" name="cq" placeholder="مثال: الموطأ، ابن تيمية، رياض الصالحين، أصول الفقه" style="flex:1;min-width:240px;font-size:16px" value="${esc(p.cq || '')}"><button class="btn primary">بحث</button></form>
      <div id="catCats" class="row" style="margin-bottom:10px"></div>
      <div id="catR"></div>
      <h2>📚 الكتب المدمجة في البرنامج — ${opt.filter(m => st(m) === 'ok').length} من ${opt.length} مثبت</h2>
      <div class="sub">الشروح مربوطة بأحاديثها، والتفاسير بآياتها، وكتب الفقه مقسمة على أبوابها. ثبّت ما تحتاجه — كل كتاب يُثبَّت مرة واحدة.</div>
      <div class="row" style="margin-bottom:8px"><button class="btn primary" id="optAll">تثبيت الكل (${Math.round(opt.reduce((s, m) => s + m.size, 0) / 1e6)} ميجا)</button><span id="optMsg" class="muted"></span></div>
      <table class="t"><tr><th>الكتاب</th><th>النوع</th><th>الحجم</th><th></th></tr>${opt.map(m => `<tr><td>${esc(m.title)}<br><small class="muted">${esc(m.author || '')}</small></td><td>${TYPE[(window.PACK_MANIFEST.find(x => x.id === m.id) || {}).type] || ''}</td><td>${(m.size / 1e6).toFixed(1)} ميجا</td>
        <td>${st(m) === 'ok' ? '<span class="tag st-ok">✔ مثبت</span> <a class="btn sm" href="#/book/' + m.id + '">تصفح</a>' : `<button class="btn sm primary" data-opt="${m.id}">${st(m) === 'old' ? 'تحديث' : 'تثبيت'}</button>`}</td></tr>`).join('')}</table>`;
    el.insertBefore(sec, el.children[1] || null);
    const installIds = async ids => {
      const msg = $('#optMsg');
      try { await IMPORT.installPacks((i, n, title, m) => { msg.textContent = '(' + i + '/' + n + ') ' + title + ' — ' + m; }, ids); }
      catch (e) { msg.textContent = 'تعذر: ' + e.message; return; }
      await APP.loadMeta(); DB.invalidate(); APP.toast('تم التثبيت'); APP.rerender();
    };
    sec.querySelectorAll('[data-opt]').forEach(b => b.onclick = async () => { await DB.setting('removedBooks', ((await DB.setting('removedBooks')) || []).filter(x => x !== b.dataset.opt)); installIds([b.dataset.opt]); });
    $('#optAll').onclick = () => installIds(opt.filter(m => st(m) !== 'ok').map(m => m.id));
    $('#catF').onsubmit = e => { e.preventDefault(); APP.catalogSearch(new FormData(e.target).get('cq'), $('#catR')); };
    if (p.cq) APP.catalogSearch(p.cq, $('#catR'));
    // الحزم الجاهزة
    APP.loadCatalog().then(cat => {
      const box = $('#packsBox'); if (!box) return;
      const byV = new Map(cat.map(c => [c.v, c])), have = v => (APP.state.books[IMPORT.slug(v)] || {}).count;
      const draw = () => {
        box.innerHTML = (window.BOOK_PACKS || []).map(pk => {
          const bs = pk.books.map(v => byV.get(v)).filter(Boolean), done = bs.filter(c => have(c.v)).length;
          const mb = Math.max(1, Math.round(bs.filter(c => !have(c.v)).reduce((s, c) => s + c.c, 0) * 2 / 1e6));
          return `<div class="tile"><b>${esc(pk.title)}</b>
            <small style="display:block;margin:6px 0;line-height:1.8">${bs.map(c => (have(c.v) ? '✔ ' : '• ') + esc(c.t.split(/[=(]/)[0].trim()) + ' <span class="muted">— ' + esc((c.a || '').split(/[،(]/)[0].slice(0, 30)) + '</span>').join('<br>')}</small>
            ${done === bs.length ? '<span class="tag st-ok">✔ الحزمة مثبتة</span>' : `<button class="btn sm primary" data-pack="${pk.id}">⬇ تحميل ${bs.length - done} كتب (نحو ${mb} ميجا)</button>`}
            <div class="muted" data-plog="${pk.id}" style="font-size:12px;margin-top:4px">${done && done < bs.length ? 'مثبت ' + done + ' من ' + bs.length : ''}</div></div>`;
        }).join('');
        box.querySelectorAll('[data-pack]').forEach(b => b.onclick = async () => {
          const pk = window.BOOK_PACKS.find(x => x.id === b.dataset.pack), log = box.querySelector(`[data-plog="${pk.id}"]`);
          const todo = pk.books.map(v => byV.get(v)).filter(c => c && !have(c.v));
          box.querySelectorAll('[data-pack]').forEach(x => { x.disabled = true; });
          let ok = 0; const bad = [];
          for (let i = 0; i < todo.length; i++) {
            const c = todo[i];
            try { await IMPORT.downloadOpenITI(c, t => { log.textContent = `(${i + 1} من ${todo.length}) ${c.t.slice(0, 40)} — ${t}`; }); ok++; await APP.loadMeta(); }
            catch (e) { bad.push(c.t); }
          }
          APP.toast(`✔ تم تحميل ${ok} من ${todo.length}` + (bad.length ? ` — تعذر ${bad.length}` : ''), 5000);
          draw();
          if (bad.length) box.querySelector(`[data-plog="${pk.id}"]`).textContent = 'تعذر: ' + bad.join('، ') + ' — أعد المحاولة';
        });
      };
      draw();
    }).catch(() => { const b = $('#packsBox'); if (b) b.innerHTML = '<div class="muted">تعذر تحميل الفهرس</div>'; });
    // تصفح بالفنون بدل الكتابة
    APP.loadCatalog().then(cat => {
      const cnt = {}; cat.forEach(c => { if (c.g && c.s === 'p') cnt[c.g] = (cnt[c.g] || 0) + 1; });
      const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 24);
      const box = $('#catCats'); if (!box) return;
      box.innerHTML = '<span class="muted">تصفح حسب الفن:</span> ' + top.map(([g, n]) => `<button class="tag" data-cat="${esc(g)}" style="cursor:pointer">${esc(g)} (${n})</button>`).join('');
      box.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => APP.catalogSearch('', $('#catR'), b.dataset.cat));
    }).catch(() => {});
  };

  // فهرس OpenITI يُحمَّل عند أول استخدام (4 ميجا)
  APP.loadCatalog = async () => {
    if (window.CATALOG) return window.CATALOG;
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/catalog.js'; s.onload = res; s.onerror = () => rej(new Error('ملف الفهرس غير موجود')); document.body.appendChild(s); });
    window.CATALOG.forEach(c => { c._n = N(c.t + ' ' + c.a + ' ' + c.g); });
    return window.CATALOG;
  };
  APP.catalogSearch = async (q, box, catName) => {
    box.innerHTML = '<div class="muted">جارٍ البحث في الفهرس…</div>';
    const cat = await APP.loadCatalog();
    const ws = N(q || '').split(' ').filter(w => w.length >= 2);
    if (!ws.length && !catName) { box.innerHTML = ''; return; }
    const hits = (catName ? cat.filter(c => c.g === catName && c.s === 'p') : cat.filter(c => ws.every(w => c._n.includes(w))))
      .sort((a, b) => (a.s !== 'p') - (b.s !== 'p') || (ws[0] ? N(b.t).startsWith(ws[0]) - N(a.t).startsWith(ws[0]) : 0) || a.d - b.d).slice(0, catName ? 300 : 80);
    const have = id => (APP.state.books[id] || {}).count;
    const bar = hits.length ? `<div class="row" id="multiBar" style="position:sticky;top:var(--tbH,58px);z-index:5;background:var(--bg);padding:8px 0;gap:8px;border-bottom:1px solid var(--line,#ddd)">
      <label><input type="checkbox" id="selAll"> تحديد الكل</label>
      <button class="btn primary" id="dlSel" disabled>⬇ تحميل المحدد (0)</button><span id="dlLog" class="muted"></span></div>` : '';
    box.innerHTML = `<div class="muted">${catName ? '«' + esc(catName) + '»: ' : ''}${hits.length >= 80 ? 'أول ' + hits.length + ' نتيجة' : hits.length + ' نتيجة'}</div>` + bar + (hits.length ? `<table class="t"><tr><th></th><th>الكتاب</th><th>المؤلف</th><th>الفن</th><th>الحجم</th><th></th></tr>${hits.map(c => {
      const id = IMPORT.slug(c.v);
      return `<tr><td>${have(id) ? '' : `<input type="checkbox" class="selBk" value="${esc(c.v)}">`}</td><td>${esc(c.t)}${c.s === 's' ? ' <small class="muted">(نسخة أخرى)</small>' : ''}</td><td>${esc(c.a)}${c.d ? ' <small class="muted">ت ' + c.d + 'هـ</small>' : ''}</td><td><small>${esc(c.g)}</small></td><td><small>${c.c > 1e6 ? (c.c / 1e6).toFixed(1) + ' م حرف' : Math.round(c.c / 1e3) + ' ألف حرف'}</small></td>
        <td>${have(id) ? `<a class="btn sm" href="#/book/${id}">فتح</a>` : `<button class="btn sm primary" data-dl="${esc(c.v)}">تحميل</button>`}</td></tr>`; }).join('')}</table>` : '<div class="muted">لا توجد نتائج. جرّب كلمة واحدة من العنوان أو اسم المؤلف.</div>');
    box.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => APP.downloadBook(cat.find(c => c.v === b.dataset.dl), b));
    // تحديد مجموعة كتب وتحميلها مرة واحدة
    const sel = () => [...box.querySelectorAll('.selBk:checked')];
    const upd = () => { const n = sel().length, sz = sel().reduce((s, x) => s + ((cat.find(c => c.v === x.value) || {}).c || 0), 0); const b = box.querySelector('#dlSel'); if (b) { b.disabled = !n; b.textContent = `⬇ تحميل المحدد (${n})` + (n ? ` — نحو ${Math.max(1, Math.round(sz * 2 / 1e6))} ميجا` : ''); } };
    box.querySelectorAll('.selBk').forEach(x => x.onchange = upd);
    const sa = box.querySelector('#selAll'); if (sa) sa.onchange = () => { box.querySelectorAll('.selBk').forEach(x => { x.checked = sa.checked; }); upd(); };
    const dl = box.querySelector('#dlSel');
    if (dl) dl.onclick = async () => {
      const list = sel(); if (!list.length) return;
      dl.disabled = true; let ok = 0; const bad = [];
      for (let i = 0; i < list.length; i++) {
        const c = cat.find(e => e.v === list[i].value), btn = box.querySelector(`[data-dl="${CSS.escape(c.v)}"]`);
        box.querySelector('#dlLog').textContent = `(${i + 1} من ${list.length}) ${c.t}`;
        try { await IMPORT.downloadOpenITI(c, t => { if (btn) btn.textContent = t; }); ok++; list[i].checked = false; list[i].disabled = true; if (btn) { btn.textContent = '✔ تم'; btn.disabled = true; } }
        catch (e) { bad.push(c.t); if (btn) btn.textContent = 'تعذر'; }
      }
      await APP.loadMeta();
      box.querySelector('#dlLog').textContent = `✔ تم تحميل ${ok} من ${list.length}` + (bad.length ? ` — تعذر: ${bad.join('، ')}` : '');
      APP.toast(`تم تحميل ${ok} كتاباً`); upd();
    };
  };
  APP.downloadBook = async (entry, btn) => {
    const label = t => { if (btn) btn.textContent = t; else APP.toast(t, 1500); };
    if (btn) btn.disabled = true;
    try {
      const r = await IMPORT.downloadOpenITI(entry, label);
      await APP.loadMeta();
      label('✔ تم');
      APP.toast('تم تحميل «' + r.book.title + '» — ' + r.count + ' قسماً');
      return r;
    } catch (e) {
      label('تحميل'); if (btn) btn.disabled = false;
      APP.modal(`<h2 style="margin-top:0">تعذر التحميل</h2><p>${esc(e.message)}</p><p>بديل: افتح الرابط المباشر وانسخ الصفحة كاملة في ملف نصي، ثم استورده من «استيراد ملف» — البرنامج يتعرف على صيغة OpenITI تلقائياً:</p><p><a href="${esc(IMPORT.OPENITI_RAW + entry.u)}" target="_blank" rel="noopener" style="word-break:break-all">${esc(IMPORT.OPENITI_RAW + entry.u)}</a></p><button class="btn" onclick="APP.closeModal()">إغلاق</button>`);
      return null;
    }
  };

  // ================= تحسينات العرض =================
  const origRijal = V.rijal;
  V.rijal = async (el, parts, p) => {
    await origRijal(el, parts, p);
    const t = APP.state.books.taqrib;
    el.querySelector('.sub').insertAdjacentHTML('afterend', t && t.count ? `<div class="info">📚 ${t.count.toLocaleString('ar')} ترجمة من تقريب التهذيب — <a href="#/book/taqrib">تصفح</a> أو ابحث باسم الراوي من البحث المتقدم (نوع: الرواة).</div>` : `<div class="info">ثبّت «تقريب التهذيب» من <a href="#/library">المكتبة ← الكتب الإضافية</a> لتحصل على أكثر من 8800 ترجمة.</div>`);
  };
  const origSahaba = V.sahaba;
  V.sahaba = async (el, parts, p) => {
    await origSahaba(el, parts, p);
    const b = APP.state.books.isaba;
    el.querySelector('.sub').insertAdjacentHTML('afterend', b && b.count ? `<form class="filters" onsubmit="event.preventDefault();location.hash='#/search?type=sahabi&nodirect=1&q='+encodeURIComponent(this.q.value)"><input name="q" type="text" placeholder="اكتب اسم الصحابي أو كنيته (أبو بكر، عائشة، تميم الداري…) لتظهر سيرته مختصرة" style="flex:1"><button class="btn primary">بحث</button><a class="btn" href="#/book/isaba">تصفح الإصابة بالحروف</a></form><h2>تراجم مفصلة</h2>` : `<div class="info">ثبّت «الإصابة في تمييز الصحابة» من <a href="#/library">المكتبة</a> لتراجم آلاف الصحابة.</div>`);
  };
})();
