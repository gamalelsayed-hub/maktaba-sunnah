/* البحث، المحفوظات، الحفظ، المراجعة العلمية، المكتبة والاستيراد، الإعدادات */
(function () {
  const { esc, $ } = APP;
  const V = APP.views;
  const N = AR.normalize;

  // ================= البحث =================
  const HUKM_WORDS = {
    'تحريم': ['حرام', 'يحرم', 'تحريم', 'محرم', 'التحريم', 'الحرام', 'تحرم', 'حرمه'],
    'وجوب': ['واجب', 'يجب', 'وجوب', 'الوجوب', 'فرض', 'تجب'],
    'إباحة': ['مباح', 'يباح', 'اباحه', 'الاباحه', 'حلال', 'يحل', 'تحل', 'تحليل', 'جواز', 'يجوز'],
    'ندب': ['مستحب', 'يستحب', 'ندب', 'مندوب', 'استحباب'],
    'كراهة': ['مكروه', 'يكره', 'كراهه', 'الكراهه']
  };
  const HADITH_BOOKS = [['بخاري', 'bukhari'], ['مسلم', 'muslim'], ['داود', 'abudawud'], ['ترمذي', 'tirmidhi'], ['نسايي', 'nasai'], ['ماجه', 'ibnmajah']];
  const TYPE_LABEL = { ayah: 'آيات', hadith: 'أحاديث', tafsir: 'تفسير', sharh: 'شروح', fiqh: 'مسائل فقهية', qaida: 'قواعد', event: 'أحداث السيرة', sahabi: 'الصحابة', rawi: 'الرواة', section: 'الكتب والمطولات', gharib: 'غريب' };

  // تحويل الاستعلام إلى انتقال مباشر إن كان مرجعاً
  function directTarget(q) {
    const n = N(q);
    let m;
    if ((m = n.match(/^(\d{1,3})\s*[:\s]\s*(\d{1,3})$/))) return { item: 'quran:' + +m[1] + ':' + +m[2] };
    if ((m = n.match(/^(?:احداث\s*)?(?:سنه|عام)\s*(\d+)\s*(?:ه|هـ)?\s*(قبل الهجره)?$/)) || (m = n.match(/^(?:احداث\s*)?(\d+)\s*ه\s*(قبل الهجره)?$/))) return { hash: '#/sira?year=' + (m[2] ? -m[1] : +m[1]) };
    if (/^(ال)?غزوات$/.test(n) || /^(ال)?غزوات النبي/.test(n)) return { hash: '#/sira?cat=' + encodeURIComponent('غزوة') };
    if ((m = n.match(/^(?:سوره\s*)?(.+?)\s+(\d{1,5})$/))) {
      const s = AR.surahByName(m[1]);
      if (s) return { item: 'quran:' + s + ':' + +m[2] };
      const hb = HADITH_BOOKS.find(([k]) => m[1].includes(k));
      if (hb) return { item: hb[1] + ':' + +m[2], book: hb[1], num: +m[2] };
    }
    if ((m = n.match(/^(?:سوره\s*)(.+)$/)) && AR.surahByName(m[1])) return { hash: '#/quran/' + AR.surahByName(m[1]) };
    return null;
  }

  // درجة تطابق نص طويل: كل الكلمات لازمة، ومكافأة للعنوان ولتقارب الكلمات في موضع واحد
  // الوضع الافتراضي: الكلمة نفسها بسوابقها ولواحقها فقط. ومع loose: أي نص يحتوي الحروف (أوسع وأقل دقة)
  const reCache = new Map();
  const wre = w => { if (!reCache.has(w)) reCache.set(w, AR.wordRe(w)); return reCache.get(w); };
  function scoreText(n, t, words, rootRe, loose) {
    if (rootRe) return rootRe.test(n) ? 1 : 0;
    let sc = 0; const pos = [];
    for (const w of words) {
      let i;
      if (loose) {
        i = n.indexOf(w);
        if (i < 0) { const st = AR.stem(w); if (st.length < 3 || (i = n.indexOf(st)) < 0) return 0; sc += 1; } else sc += 2;
      } else {
        const m = wre(w).exec(n); if (!m) return 0; i = m.index; sc += 2;
      }
      pos.push(i);
      if (loose ? t.includes(w) : wre(w).test(t)) sc += 6;
    }
    if (pos.length > 1 && Math.max(...pos) - Math.min(...pos) < 400) sc += 5;
    return sc;
  }
  const DEEP_TYPES = ['sharh', 'tafsir', 'fiqhbook', 'sirabook', 'tafsirbook', 'hadithbook', 'other', 'rijal'];
  async function deepFind(words, rootRe, bookIds, f, onBook) {
    const seen = f.seen || new Set();
    return DB.deepScan(bookIds, it => {
      if (!DB.HEAVY.includes(it.type) || seen.has(it.id) || (f.type && it.type !== f.type) || !APP.visible(it.id)) return 0;
      return scoreText(it.n || '', N((it.title || '') + ' ' + (it.bab || '') + ' ' + (it.chapter || '')), words, rootRe, f.loose);
    }, onBook);
  }
  APP.deepFind = deepFind; APP.scoreText = scoreText;

  async function runSearch(q, f) {
    const idx = await DB.searchIndex();
    const n = N(q);
    let rootRe = null, words = [], hukm = f.hukm || '';
    const rm = q.match(/^\s*جذر\s*[:：]?\s*(.+)$/);
    if (rm) rootRe = AR.rootRegex(rm[1]);
    else {
      words = n.split(' ').filter(w => w.length >= 2 && !['في', 'من', 'عن', 'علي', 'الي', 'ما', 'كل', 'التي', 'الذي', 'او', 'ثم'].includes(w));
      for (const [h, ws] of Object.entries(HUKM_WORDS)) {
        const hit = words.filter(w => ws.includes(w));
        if (hit.length) { hukm = hukm || h; words = words.filter(w => !ws.includes(w)); }
      }
    }
    const res = [];
    for (const x of idx) {
      if (f.type && x.type !== f.type) continue;
      if (f.book && x.bookId !== f.book) continue;
      if (f.grade === 'sahih' && x.type === 'hadith' && !/^(sahih|hasan)/.test(x.grade)) continue;
      if (f.grade === 'daif' && x.type === 'hadith' && !/^daif/.test(x.grade)) continue;
      if (f.grade === 'mixed' && x.type === 'hadith' && !/mixed/.test(x.grade)) continue;
      if (f.school && !x.schools.includes(f.school)) continue;
      if (hukm && !x.hukm.includes(hukm)) continue;
      if (!APP.visible(x.id)) continue;
      if (f.deep && x.heavy) continue;
      let score = 0;
      if (rootRe) { if (!rootRe.test(x.n)) continue; score = 1; }
      else if (words.length) {
        let ok = true;
        for (const w of words) {
          let inT, inN;
          if (f.loose) { const st = AR.stem(w); inT = x.t.includes(w) || x.t.includes(st); inN = x.n.includes(w) || (st.length >= 3 && x.n.includes(st)); }
          else { inT = wre(w).test(x.t); inN = wre(w).test(x.n); }
          if (!inT && !inN) { ok = false; break; }
          score += (inT ? 6 : 0) + (inN ? 2 : 0);
        }
        if (!ok) continue;
        if (x.topics.some(t => N(t) === n)) score += 15;
      } else if (!hukm) continue;
      res.push({ id: x.id, type: x.type, score });
    }
    if (f.deep && (words.length || rootRe) && !hukm) {
      const ids = Object.values(APP.state.books).filter(b => b.count && DEEP_TYPES.includes(b.type) && (!f.book || b.id === f.book)).map(b => b.id);
      res.push(...await deepFind(words, rootRe, ids, f, f.onBook));
    }
    res.sort((a, b) => b.score - a.score);
    return { res, hukm, words, root: !!rootRe };
  }

  V.search = async (el, _, p) => {
    const q = p.q || '';
    if (q && !p.nodirect) {
      const d = directTarget(q);
      if (d) {
        if (d.hash) { location.replace(d.hash); return; }
        if (d.book) { const pm = (await DB.searchIndex()).find(x => x.bookId === d.book && x.pn === d.num); if (pm) { location.replace('#/item/' + encodeURIComponent(pm.id)); return; } }
        if (await DB.get('items', d.item)) { location.replace('#/item/' + encodeURIComponent(d.item)); return; }
      }
    }
    $('#q').value = q;
    const bookOpts = Object.values(APP.state.books).filter(b => b.count).map(b => `<option value="${b.id}" ${p.book === b.id ? 'selected' : ''}>${esc(b.title)}</option>`).join('');
    const sel = (name, opts, label) => `<select name="${name}"><option value="">${label}</option>${opts.map(([v, l]) => `<option value="${v}" ${p[name] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    el.innerHTML = `<h1>البحث المتقدم</h1>
      <div class="sub">ابحث بكلمة أو موضوع، أو بمرجع مباشر: «البقرة 255» أو «2:255» أو «البخاري 1» أو «أحداث سنة 2 هـ» أو «الغزوات»، أو بالجذر: «جذر: ق ت ل». واكتب «تحريم الربا» أو «ما يحرم في البيع» لتصفية النصوص الدالة على الحكم.</div>
      <form class="filters" id="sf">
        <input type="text" name="q" value="${esc(q)}" placeholder="كلمة البحث" style="flex:1;min-width:220px">
        ${sel('type', Object.entries(TYPE_LABEL), 'كل الأنواع')}
        ${sel('grade', [['sahih', 'الصحيح والحسن فقط'], ['daif', 'الضعيف فقط'], ['mixed', 'المختلف في الحكم عليه']], 'كل درجات الحديث')}
        ${sel('hukm', Object.keys(HUKM_WORDS).map(h => [h, 'ما يدل على ' + h]), 'كل الأحكام')}
        ${sel('school', ['الحنفية', 'المالكية', 'الشافعية', 'الحنابلة', 'الظاهرية', 'أقوال الصحابة', 'أقوال التابعين'].map(s => [s, s]), 'كل المذاهب')}
        <select name="book"><option value="">كل الكتب</option>${bookOpts}</select>
        <label class="row" style="gap:4px"><input type="checkbox" name="deep" value="1" ${p.deep ? 'checked' : ''}> بحث عميق داخل الشروح والتفاسير والمطولات</label>
        <label class="row" style="gap:4px" title="الافتراضي: الكلمة نفسها فقط (الربا، بالربا، والربا). هذا الخيار يوسّع البحث لكل كلمة تحتوي الحروف"><input type="checkbox" name="loose" value="1" ${p.loose ? 'checked' : ''}> بحث موسّع (أجزاء الكلمات)</label>
        <button class="btn primary">بحث</button>
      </form><div id="sr"></div>`;
    $('#sf').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); const sp = new URLSearchParams([...f].filter(([, v]) => v)); sp.set('nodirect', '1'); location.hash = '#/search?' + sp.toString(); };
    if (!q && !p.hukm) return;
    const box = $('#sr'); box.innerHTML = '<div class="muted">جارٍ البحث… (أول بحث يجهّز الفهرس ويأخذ ثوانٍ)</div>';
    const t0 = performance.now();
    const { res, hukm, root } = await runSearch(p.nohukm ? q.split(' ').filter(w => !Object.values(HUKM_WORDS).flat().includes(N(w))).join(' ') : q,
      Object.assign({}, p, { onBook: bid => { box.innerHTML = '<div class="muted">بحث عميق في: ' + esc(APP.bookTitle(bid)) + '…</div>'; } }));
    const counts = {}; res.forEach(r => counts[r.type] = (counts[r.type] || 0) + 1);
    const types = Object.keys(counts).sort((a, b) => Object.keys(TYPE_LABEL).indexOf(a) - Object.keys(TYPE_LABEL).indexOf(b));
    const tab = p.tab && counts[p.tab] ? p.tab : types[0];
    const show = res.filter(r => r.type === tab).slice(0, +(p.more || 30));
    const items = await Promise.all(show.map(r => DB.get('items', r.id)));
    const mk = (k, v) => { const sp = new URLSearchParams(p); sp.set(k, v); sp.set('nodirect', '1'); return '#/search?' + sp.toString(); };
    box.innerHTML = `<div class="info">${res.length.toLocaleString('ar')} نتيجة في ${Math.round(performance.now() - t0)} ملّي ثانية${hukm ? ' — مُصفّاة بالنصوص المصنّفة بأنها تدل على <b>' + esc(hukm) + '</b> (التصنيف يكتمل مع المراجعة). <a href="' + mk('nohukm', '1') + '">اعرض كل النصوص التي فيها الكلمة</a>' : ''}${root ? ' — بحث بالجذر (تقريبي)' : ''}.${p.deep ? '' : ' <a href="' + mk('deep', '1') + '">ابحث أيضاً داخل نصوص الشروح والتفاسير والمطولات</a>'}</div>
      ${res.length ? `<div class="tabs">${types.map(t => `<button class="${t === tab ? 'on' : ''}" onclick="location.hash='${mk('tab', t)}'">${TYPE_LABEL[t] || t} (${counts[t]})</button>`).join('')}</div>` : '<div class="muted">لا توجد نتائج. جرّب كلمة أقصر، أو أزل بعض الفلاتر، أو ابحث بالجذر.</div>'}
      ${items.map(it => APP.mini(it, q)).join('')}
      ${counts[tab] > show.length ? `<a class="btn" href="${mk('more', +(p.more || 30) + 30)}">عرض المزيد</a>` : ''}`;
  };

  // ================= المحفوظات والهوامش والملاحظات =================
  V.saved = async (el, _, p) => {
    const tab = p.tab || 'bm';
    const tabs = [['bm', '⭐ المحفوظات'], ['hl', '🖍 التعليمات'], ['cm', '✍️ الهوامش'], ['nt', '📝 الملاحظات']];
    let body = '';
    if (tab === 'bm' || tab === 'hl') {
      const list = APP.state.bookmarks.filter(b => tab === 'hl' ? b.color : b.folder !== 'تعليمات' || !b.color);
      const folders = {}; list.forEach(b => (folders[b.folder || 'عام'] = folders[b.folder || 'عام'] || []).push(b));
      for (const [f, arr] of Object.entries(folders)) {
        const its = (await Promise.all(arr.map(b => DB.get('items', b.itemId)))).filter(Boolean);
        body += `<h2>📁 ${esc(f)} <small class="muted">(${its.length})</small> <button class="btn sm" data-word="${esc(f)}">تصدير إلى Word</button></h2>` + its.map(it => APP.mini(it)).join('');
      }
      body = body || '<div class="muted">لا يوجد شيء بعد. استخدم زر «☆ حفظ» أو «🖍 تعليم» على أي نص.</div>';
    } else if (tab === 'cm') {
      const cs = APP.state.comments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      body = (await Promise.all(cs.map(async c => `<div class="card"><div class="row">${await APP.linkFor(c.itemId)}<span class="spacer"></span><small class="muted">${new Date(c.createdAt).toLocaleString('ar')}</small></div>${c.quote ? '<q class="muted">' + esc(c.quote) + '</q>' : ''}<div class="text">${esc(c.text)}</div><button class="btn sm" data-delcomment="${c.id}">حذف</button></div>`))).join('') || '<div class="muted">لا توجد هوامش. حدّد أي جزء من نص بالفأرة ثم اضغط «إضافة هامش»، أو استخدم زر «✍️ هامش».</div>';
    } else {
      const ns = (await DB.all('notes')).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      body = ns.map(n => `<div class="card"><div class="row"><a href="#${esc(n.scope)}">${esc(n.title || n.scope)}</a><span class="spacer"></span><small class="muted">${new Date(n.updatedAt).toLocaleString('ar')}</small></div><div class="text" style="white-space:pre-wrap">${esc(n.text)}</div></div>`).join('') || '<div class="muted">لا توجد ملاحظات. اضغط زر 📝 في أسفل أي شاشة لتكتب ملاحظاتك عليها.</div>';
    }
    el.innerHTML = `<h1>محفوظاتي وهوامشي</h1><div class="tabs">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" onclick="location.hash='#/saved?tab=${k}'">${l}</button>`).join('')}</div>${body}`;
    el.querySelectorAll('[data-word]').forEach(b => b.onclick = () => exportWord(b.dataset.word));
  };

  async function exportWord(folder) {
    const bms = APP.state.bookmarks.filter(b => (b.folder || 'عام') === folder);
    let html = `<html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:'Traditional Arabic','Simplified Arabic',serif;font-size:16pt;direction:rtl}h1{color:#14532d}.c{color:#555;font-size:13pt;border-right:3px solid #a16207;padding-right:8px}p{margin:6pt 0}</style></head><body><h1>${esc(folder)}</h1>`;
    for (const b of bms) {
      const it = await DB.get('items', b.itemId); if (!it) continue;
      html += `<h3>${esc(APP.titleOf(it))}</h3><p>${esc(APP.cite(it))}</p>`;
      for (const c of APP.state.comments.filter(c => c.itemId === it.id)) html += `<p class="c">${c.quote ? '«' + esc(c.quote) + '»: ' : ''}${esc(c.text)}</p>`;
    }
    html += `<hr><p style="font-size:11pt;color:#777">صُدّر من مكتبة القرآن والسنة — ${new Date().toLocaleDateString('ar')}</p></body></html>`;
    APP.download(folder + '.doc', '﻿' + html, 'application/msword');
  }

  // ================= مراجعة الحفظ (تكرار متباعد) =================
  function sm2(card, q) {
    if (q < 3) { card.reps = 0; card.interval = 1; }
    else { card.reps++; card.interval = card.reps === 1 ? 1 : card.reps === 2 ? 3 : Math.round(card.interval * card.ef); }
    card.ef = Math.max(1.3, card.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    card.due = new Date(Date.now() + card.interval * 86400000).toISOString();
    card.last = new Date().toISOString();
    return card;
  }

  V.hifz = async (el, _, p) => {
    const cards = await DB.all('srs');
    const due = cards.filter(c => new Date(c.due) <= new Date()).sort((a, b) => a.due.localeCompare(b.due));
    if (p.list) {
      const its = await Promise.all(cards.map(c => DB.get('items', c.id)));
      el.innerHTML = `<h1>قائمة محفوظاتي للمراجعة</h1><a class="btn" href="#/hifz">← المراجعة</a><table class="t" style="margin-top:10px"><tr><th>النص</th><th>المراجعة القادمة</th><th>مرات التكرار</th><th></th></tr>${cards.map((c, i) => `<tr><td>${its[i] ? APP.link(c.id, APP.titleOf(its[i])) : esc(c.id)}</td><td>${new Date(c.due).toLocaleDateString('ar')}</td><td>${c.reps}</td><td><button class="btn sm" data-rm="${esc(c.id)}">إزالة</button></td></tr>`).join('')}</table>`;
      el.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { await DB.del('srs', b.dataset.rm); await APP.refreshUser(); APP.rerender(); });
      return;
    }
    const head = `<h1>🧠 مراجعة الحفظ</h1><div class="sub">نظام التكرار المتباعد: كل ما أتقنت النص زادت المدة قبل مراجعته القادمة، وما نسيته يرجع لك قريباً. ${cards.length} بطاقة — <a href="#/hifz?list=1">إدارة القائمة</a></div>`;
    if (!due.length) { el.innerHTML = head + `<div class="flash"><div class="stat">✓</div>لا توجد مراجعات مستحقة الآن. ${cards.length ? 'أقرب مراجعة: ' + new Date(cards.sort((a, b) => a.due.localeCompare(b.due))[0].due).toLocaleString('ar') : 'أضف آيات أو أحاديث بزر «🧠 أضف لحفظي».'}</div>`; return; }
    const c = due[0]; const it = await DB.get('items', c.id);
    if (!it) { await DB.del('srs', c.id); APP.rerender(); return; }
    const full = it.type === 'ayah' ? it.text : it.matn;
    const words = full.split(' ');
    const hint = words.slice(0, Math.min(3, Math.ceil(words.length / 4))).join(' ');
    el.innerHTML = head + `<div class="progress"><div style="width:${100 - (due.length / Math.max(cards.length, 1)) * 100}%"></div></div><div class="muted" style="margin:6px 0">${due.length} بطاقة متبقية اليوم</div>
      <div class="flash"><div class="ref">${esc(APP.titleOf(it))}</div><div class="${it.type === 'ayah' ? 'quran-text' : 'matn'}" style="margin:14px 0">${esc(hint)} …</div>
      <div id="ans" class="hidden"><div class="${it.type === 'ayah' ? 'quran-text' : 'matn'}" style="color:var(--brand)">${esc(full)}</div></div>
      <button class="btn primary" id="reveal">أظهر النص كاملاً</button>
      <div id="rate" class="row hidden" style="justify-content:center;margin-top:12px"><button class="btn" data-q="1">😟 نسيت</button><button class="btn" data-q="3">🤔 صعب</button><button class="btn" data-q="4">🙂 جيد</button><button class="btn" data-q="5">😄 سهل</button></div></div>`;
    $('#reveal').onclick = () => { $('#ans').classList.remove('hidden'); $('#rate').classList.remove('hidden'); $('#reveal').classList.add('hidden'); };
    el.querySelectorAll('[data-q]').forEach(b => b.onclick = async () => { await DB.put('srs', sm2(c, +b.dataset.q)); await APP.refreshUser(); APP.rerender(); });
  };

  // ================= المراجعة العلمية =================
  V.review = async (el, parts) => {
    if (!APP.state.reviewerUnlocked) { el.innerHTML = '<div class="warn">هذه الشاشة للمراجع العلمي. ادخل من <a href="#/settings">الإعدادات ← دخول المراجع</a>.</div>'; return; }
    if (parts[0] === 'next') {
      const bookId = parts[1];
      const items = (await DB.byIndex('items', 'bookId', bookId)).sort((a, b) => (a.num || a.seq || (a.surah || 0) * 1000 + (a.ayah || 0) || 0) - (b.num || b.seq || (b.surah || 0) * 1000 + (b.ayah || 0) || 0));
      const next = items.find(x => APP.reviewStatus(x.id) === 'pending');
      if (!APP.state.reviewer) APP.setReviewer(true);
      if (next) location.replace('#/item/' + encodeURIComponent(next.id)); else { el.innerHTML = '<div class="info">🎉 تمت مراجعة كل نصوص هذا الكتاب.</div><a class="btn" href="#/review">لوحة المراجعة</a>'; }
      return;
    }
    const books = Object.values(APP.state.books).filter(b => b.count);
    const rv = await DB.all('review');
    const stats = books.map(b => { const r = rv.filter(x => x.bookId === b.id); const c = s => r.filter(x => x.status === s).length; return { b, ok: c('ok'), fix: c('fix'), reject: c('reject'), pending: b.count - r.length }; });
    const issues = rv.filter(r => r.status !== 'ok');
    const issueLinks = await Promise.all(issues.map(r => APP.linkFor(r.id)));
    el.innerHTML = `<h1>✔️ المراجعة العلمية</h1>
      <div class="info"><b>آلية المراجعة:</b><br>
      ١. ادخل من «الإعدادات ← دخول المراجع» بكلمة السر، ثم اضغط «ابدأ المراجعة» أمام أي كتاب فيفتح لك أول نص غير مراجع.<br>
      ٢. قابل النص بالمصدر المطبوع أو الشاملة: الحروف، الترقيم، الحكم ومَن قاله، العلة، نسبة الأقوال للمذاهب.<br>
      ٣. اضغط <b>✔ اعتماد</b> إن كان سليماً، أو <b>✎ تصحيح</b> واكتب المطلوب، أو <b>تعديل النص</b> لتصحّحه بنفسك (الأصل يُحفظ)، أو <b>✗ رفض</b>.<br>
      ٤. بعد كل نص يظهر زر «التالي غير المراجع» فتكمل بالتسلسل وتأخذ وقتك — كل شيء يُحفظ تلقائياً.<br>
      ٥. المستخدم العادي لا يرى أدوات المراجعة: يرى علامة «✔ رُوجع» على ما اعتمدته، ولا يظهر له ما رفضته.<br>
      ٦. صدّر «ملف المراجعة للنشر» و«ملف التصحيحات» وأرسلهما لي، فأدمجهما في النسخة التي توزّعها؛ فتظهر علامة «✔ رُوجع» عند كل المستخدمين. و«تقرير المراجعة» يفتح في Excel لمتابعتك.</div>
      <div class="row"><button class="btn primary" id="rvCsv">تصدير تقرير المراجعة (CSV/Excel)</button><button class="btn" id="rvFix">تصدير ملف التصحيحات</button><button class="btn" id="rvPub">تصدير ملف المراجعة للنشر</button></div>
      <h2>حالة الكتب</h2>
      <table class="t"><tr><th>الكتاب</th><th>النصوص</th><th>معتمد</th><th>يحتاج تصحيح</th><th>مرفوض</th><th>غير مراجع</th><th>التقدم</th><th></th></tr>
      ${stats.map(s => `<tr><td>${esc(s.b.title)}</td><td>${s.b.count}</td><td>${s.ok}</td><td>${s.fix}</td><td>${s.reject}</td><td>${s.pending}</td><td style="min-width:110px"><div class="progress"><div style="width:${Math.round(s.ok / s.b.count * 100)}%"></div></div><small>${Math.round(s.ok / s.b.count * 100)}%</small></td><td><a class="btn sm primary" href="#/review/next/${s.b.id}">ابدأ المراجعة</a></td></tr>`).join('')}</table>
      <h2>نصوص تحتاج متابعة (${issues.length})</h2>
      ${issues.length ? `<table class="t"><tr><th>النص</th><th>الحالة</th><th>الملاحظة</th><th>التاريخ</th></tr>${issues.map((r, i) => `<tr><td>${issueLinks[i]}</td><td>${APP.statusTag(r.id)}</td><td>${esc(r.note || '')}</td><td>${new Date(r.updatedAt).toLocaleDateString('ar')}</td></tr>`).join('')}</table>` : '<div class="muted">لا يوجد.</div>'}`;
    $('#rvCsv').onclick = async () => {
      const rows = [['المعرف', 'الكتاب', 'النص', 'الحالة', 'الملاحظة', 'عُدّل؟', 'التاريخ']];
      const L = { ok: 'معتمد', fix: 'يحتاج تصحيح', reject: 'مرفوض' };
      for (const r of rv) { const it = await DB.get('items', r.id); rows.push([r.id, APP.bookTitle(r.bookId), it ? APP.titleOf(it) : '', L[r.status], r.note || '', r.edited ? 'نعم' : '', r.updatedAt.slice(0, 10)]); }
      APP.download('تقرير-المراجعة.csv', '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv');
    };
    $('#rvPub').onclick = () => APP.download('review.js', 'window.PACK_REVIEW_DATE=' + JSON.stringify(new Date().toISOString()) + ';window.PACK_REVIEW=' + JSON.stringify(rv.map(r => ({ id: r.id, bookId: r.bookId, status: r.status, updatedAt: r.updatedAt }))) + ';', 'text/javascript');
    $('#rvFix').onclick = async () => {
      const edited = []; for (const r of rv.filter(r => r.edited)) { const it = await DB.get('items', r.id); if (it) { const c = Object.assign({}, it); delete c.n; edited.push(c); } }
      const byBook = {}; edited.forEach(i => (byBook[i.bookId] = byBook[i.bookId] || []).push(i));
      APP.download('تصحيحات-المراجع.json', JSON.stringify({ app: 'maktaba-sunnah', format: 1, books: Object.keys(byBook).map(id => APP.state.books[id]), items: edited, review: rv }, null, 1));
    };
  };

  // زر "التالي غير المراجع" في صفحة النص عند تشغيل وضع المراجع
  const origItem = V.item;
  V.item = async (el, parts) => {
    await origItem(el, parts);
    if (!APP.state.reviewer) return;
    const it = await DB.get('items', parts[0]); if (!it) return;
    const bar = document.createElement('div');
    bar.className = 'row'; bar.style.marginTop = '10px';
    bar.innerHTML = `<a class="btn primary" href="#/review/next/${it.bookId}">التالي غير المراجع في «${esc(APP.state.books[it.bookId] ? APP.state.books[it.bookId].title : '')}» ←</a>`;
    el.prepend(bar);
  };

  // ================= المكتبة والاستيراد =================
  const TYPE_AR = { quran: 'قرآن', tafsir: 'تفسير', hadith: 'حديث', sharh: 'شرح', fiqh: 'مسائل فقهية', fiqhbook: 'كتاب فقه', qawaid: 'قواعد', rijal: 'رجال', gharib: 'غريب', sira: 'أحداث السيرة', sirabook: 'كتاب سيرة/تاريخ', sahaba: 'صحابة', mutash: 'متشابه القرآن', other: 'أخرى' };
  V.library = async el => {
    const all = Object.values(APP.state.books);
    const inst = all.filter(b => b.count), shelf = all.filter(b => !b.count);
    el.innerHTML = `<h1>📚 المكتبة وتحميل الكتب</h1>
      <h2>١. المصادر الأساسية — مستوردة تلقائياً</h2>
      <div class="info">✔ القرآن (تنزيل)، والكتب التسعة بأحكام المحدثين (hadith-api وhadith-json)، والشروح والتفاسير وكتب الفقه والسيرة — كلها مدمجة في البرنامج وتُثبَّت وحدها، لا تحتاج تنزيل شيء يدوياً.
        <div style="margin-top:8px"><button class="btn primary" id="reinstAll">تثبيت/تحديث كل الكتب المدمجة الآن</button> <span id="reinstLog" class="muted"></span></div></div>
      <details><summary class="muted">المصادر وتراخيصها</summary>${IMPORT.SOURCES.map(s => `<div class="card"><b>${esc(s.title)}</b><div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></div><small class="muted">الترخيص: ${esc(s.license)}</small></div>`).join('')}</details>
      <h2>٢. استيراد ملف</h2>
      <div class="card">
        <div class="row"><input type="file" id="imFile" multiple accept=".json,.txt,.csv,.tsv"></div>
        <div class="muted" style="margin:8px 0">البرنامج يتعرف تلقائياً على: نص القرآن من «تنزيل» (txt)، ملفات hadith-api وhadith-json (JSON)، ملفات البرنامج والنسخ الاحتياطية (JSON). ملفات CSV تحتاج تحديد نوعها والكتاب:</div>
        <div class="row"><select id="imKind">${Object.keys(IMPORT.CSV_TEMPLATES).map(k => `<option value="${k}">${({ hadith: 'أحاديث', grades: 'أحكام محدثين (تُدمج على أحاديث موجودة)', tafsir: 'تفسير آيات', sharh: 'شرح أحاديث', section: 'كتاب عام (فقه/سيرة/تاريخ)', event: 'أحداث السيرة', sahabi: 'تراجم صحابة', rawi: 'تراجم رواة' })[k]}</option>`).join('')}</select>
        <select id="imBook"><option value="">— اختر الكتاب/الرف —</option>${all.map(b => `<option value="${b.id}">${esc(b.title)}${b.author ? ' — ' + esc(b.author) : ''}</option>`).join('')}<option value="__new">+ كتاب جديد</option></select>
        <button class="btn sm" id="imTpl">تنزيل قالب CSV</button></div>
        <div id="imNew" class="row hidden" style="margin-top:8px"><input type="text" id="nbId" placeholder="معرّف لاتيني (مثل: riyad)"><input type="text" id="nbTitle" placeholder="عنوان الكتاب"><input type="text" id="nbAuthor" placeholder="المؤلف"><select id="nbType">${Object.entries(TYPE_AR).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><input type="text" id="nbLinked" placeholder="يشرح كتاب (معرّف، اختياري)"></div>
        <div style="margin-top:10px"><button class="btn primary" id="imGo">استيراد</button></div>
        <div id="imLog" class="muted" style="margin-top:8px;white-space:pre-wrap"></div>
      </div>
      <h2>٣. الكتب المستوردة (${inst.length})</h2>
      <table class="t"><tr><th>الكتاب</th><th>النوع</th><th>عدد النصوص</th><th></th></tr>${inst.map(b => `<tr><td>${esc(b.title)} ${b.sample ? '<span class="tag st-fix">عينة</span>' : ''}<br><small class="muted">${esc(b.author || '')}</small></td><td>${TYPE_AR[b.type] || b.type}</td><td>${b.count}</td><td><a class="btn sm" href="#/book/${b.id}">تصفح</a> <button class="btn sm" data-exp="${b.id}">تصدير</button> <button class="btn sm" data-del="${b.id}">حذف</button></td></tr>`).join('')}</table>
      <div class="row" style="margin-top:8px"><button class="btn" id="delSample">حذف العينة التجريبية كلها</button><button class="btn" id="reSample">إعادة تحميل العينة</button></div>
      ${shelf.length ? `<h2>٤. كتب لم تُحمَّل بعد (${shelf.length})</h2>
      <div class="row" style="margin-bottom:8px"><button class="btn primary" id="shelfAll">⬇ حمّل المتاح منها كلها تلقائياً</button> <span id="shelfLog" class="muted"></span></div>
      <div class="grid">${shelf.map(b => `<div class="tile"><b>${esc(b.title)}</b><small>${esc(b.author || '')} — ${TYPE_AR[b.type] || ''}</small>${b.rights ? '<br><small style="color:var(--red)">' + esc(b.rights) + '</small>' : ''}<div style="margin-top:6px"><button class="btn sm" data-shelf="${b.id}">⬇ تحميل</button></div></div>`).join('')}</div>` : ''}`;

    $('#reinstAll').onclick = async e => {
      e.target.disabled = true;
      try { await IMPORT.installPacks((i, n, title, msg) => { $('#reinstLog').textContent = '(' + i + ' من ' + n + ') ' + (title || '') + ' — ' + (msg || ''); }); await APP.loadMeta(); APP.toast('✔ تم تثبيت/تحديث كل الكتب المدمجة'); APP.rerender(); }
      catch (er) { $('#reinstLog').textContent = 'تعذر: ' + er.message; e.target.disabled = false; }
    };
    // تحميل كتاب رف فارغ من فهرس التراث: أقرب نسخة أساسية بالعنوان والمؤلف
    const shelfMatch = async b => {
      const cat = await APP.loadCatalog(), N = AR.normalize, tw = N(b.title).split(' ').filter(w => w.length > 2), aw = N(b.author || '').split(' ').filter(w => w.length > 2);
      const sc = c => { const t = N(c.t), a = N(c.a); return tw.filter(w => t.includes(w)).length * 2 + aw.filter(w => a.includes(w)).length + (c.s === 'p' ? 1 : 0); };
      const best = cat.map(c => [sc(c), c]).sort((x, y) => y[0] - x[0])[0];
      return best && best[0] >= tw.length * 2 ? best[1] : null;
    };
    const shelfDl = async (b, btn, log) => {
      const c = await shelfMatch(b);
      if (!c) { log('«' + b.title + '» غير موجود في الفهرس المفتوح (قد يكون محفوظ الحقوق)'); if (btn) { btn.textContent = 'غير متاح'; btn.disabled = true; } return false; }
      const r = await APP.downloadBook({ ...c, id: b.id, t: b.title, a: b.author || c.a }, btn);
      return !!r;
    };
    el.querySelectorAll('[data-shelf]').forEach(btn => btn.onclick = () => shelfDl(shelf.find(b => b.id === btn.dataset.shelf), btn, t => APP.toast(t, 4000)));
    if ($('#shelfAll')) $('#shelfAll').onclick = async e => {
      e.target.disabled = true; let ok = 0; const miss = [];
      for (const b of shelf) { $('#shelfLog').textContent = 'جارٍ: ' + b.title; if (await shelfDl(b, el.querySelector(`[data-shelf="${b.id}"]`), () => miss.push(b.title))) ok++; }
      $('#shelfLog').textContent = `تم تحميل ${ok}` + (miss.length ? ` — غير متاح: ${miss.join('، ')}` : '');
      await APP.loadMeta();
    };
    $('#imBook').onchange = e => $('#imNew').classList.toggle('hidden', e.target.value !== '__new');
    $('#imTpl').onclick = () => { const k = $('#imKind').value; APP.download('قالب-' + k + '.csv', '﻿' + IMPORT.CSV_TEMPLATES[k].join(',') + '\r\n', 'text/csv'); };
    el.querySelectorAll('[data-exp]').forEach(b => b.onclick = async () => APP.download(b.dataset.exp + '.json', JSON.stringify(await IMPORT.exportBook(b.dataset.exp))));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!confirm('حذف هذا الكتاب من المكتبة؟')) return;
      await DB.deleteBook(b.dataset.del);
      if ((window.PACK_MANIFEST || []).some(m => m.id === b.dataset.del)) await DB.setting('removedBooks', [...new Set(((await DB.setting('removedBooks')) || []).concat(b.dataset.del))]);
      await APP.loadMeta(); APP.rerender();
    });
    $('#delSample').onclick = async () => { if (!confirm('حذف كل العينة التجريبية؟')) return; for (const b of inst.filter(b => b.sample)) { const items = await DB.byIndex('items', 'bookId', b.id); for (const i of items.filter(i => i.sample)) await DB.del('items', i.id); const left = await DB.count('items', 'bookId', b.id); if (left) { b.count = left; delete b.sample; await DB.put('books', b); } else { b.count = 0; await DB.put('books', b); } } DB.invalidate(); await APP.loadMeta(); APP.rerender(); APP.toast('حُذفت العينة'); };
    $('#reSample').onclick = async () => { await IMPORT.loadSample(); await APP.loadMeta(); APP.rerender(); APP.toast('أعيد تحميل العينة'); };
    $('#imGo').onclick = async () => {
      const files = [...$('#imFile').files]; const log = $('#imLog');
      if (!files.length) return APP.toast('اختر ملفاً أولاً');
      const prog = (d, t) => { log.textContent = 'جارٍ الحفظ… ' + d + ' / ' + t; };
      for (const f of files) {
        try {
          const text = await f.text();
          let msg;
          if (/\.json$/i.test(f.name)) msg = (await IMPORT.importJSON(JSON.parse(text), prog, f.name)).msg;
          else if (text.startsWith('######OpenITI#') || text.includes('#META#Header#End#')) {
            const r = await IMPORT.importOpenITI(text, {}, prog);
            msg = 'تم استيراد «' + r.book.title + '»: ' + r.count + ' قسماً.';
          }
          else if (/^\d+\|\d+\|/m.test(text.slice(0, 2000))) {
            const items = IMPORT.parseTanzil(text);
            await IMPORT.saveBook({ id: 'quran', title: 'القرآن الكريم', type: 'quran' }, items, prog);
            msg = 'تم استيراد القرآن: ' + items.length + ' آية.';
          } else {
            const kind = $('#imKind').value; const rows = IMPORT.parseCSV(text);
            if (kind === 'grades') msg = 'دُمجت الأحكام على ' + (await IMPORT.mergeGrades(rows)) + ' حديث.';
            else {
              let bid = $('#imBook').value, book;
              if (!bid) throw new Error('اختر الكتاب الذي يُستورد إليه الملف');
              if (bid === '__new') {
                bid = $('#nbId').value.trim().replace(/[^a-z0-9-]/gi, '');
                if (!bid || !$('#nbTitle').value.trim()) throw new Error('اكتب معرّفاً لاتينياً وعنواناً للكتاب الجديد');
                book = { id: bid, title: $('#nbTitle').value.trim(), author: $('#nbAuthor').value.trim(), type: $('#nbType').value, linkedTo: $('#nbLinked').value.trim() || undefined };
              } else book = Object.assign({}, APP.state.books[bid]);
              const items = IMPORT.rowsToItems(kind, book, rows);
              await IMPORT.saveBook(book, items, prog);
              msg = 'تم استيراد ' + items.length + ' نص إلى «' + book.title + '».';
            }
          }
          log.textContent += '\n✓ ' + f.name + ': ' + msg;
        } catch (e) { log.textContent += '\n✗ ' + f.name + ': ' + e.message; }
      }
      await APP.loadMeta(); await APP.refreshUser();
      APP.toast('انتهى الاستيراد');
    };
  };

  // ================= الإعدادات =================
  V.settings = async el => {
    const fs = (await DB.setting('fontSize')) || 17, dark = !!(await DB.setting('dark'));
    el.innerHTML = `<h1>⚙️ الإعدادات</h1>
      <div class="card"><h3>نوع العرض</h3><div class="row"><button class="btn ${APP.state.profile === 'aam' ? 'on' : ''}" data-p="aam">🙂 مسلم (مبسط)</button><button class="btn ${APP.state.profile === 'talib' ? 'on' : ''}" data-p="talib">🎓 طالب علم / باحث</button></div></div>
      <div class="card"><h3>القراءة</h3><div class="row">حجم الخط: <input type="range" id="fs" min="14" max="28" value="${fs}"> <span id="fsv">${fs}</span></div><label><input type="checkbox" id="dark" ${dark ? 'checked' : ''}> الوضع الليلي</label></div>
      ${window.TTS ? TTS.settingsHtml() : ''}
      <div class="card"><h3>المراجع العلمي</h3>${APP.state.reviewerUnlocked
        ? `<div class="row"><span class="tag st-ok">وضع المراجع مفتوح على هذا الجهاز</span><button class="btn" id="rvLock">قفل وضع المراجع</button><button class="btn" id="rvPass">تغيير كلمة السر</button></div>
           <label style="display:block;margin-top:8px"><input type="checkbox" id="hideUn" ${APP.state.hideUnreviewed ? 'checked' : ''}> إظهار النصوص المعتمدة فقط للمستخدم (عند إغلاق وضع المراجع)</label>`
        : '<button class="btn" id="rvUnlock">دخول المراجع</button> <small class="muted">للمراجع العلمي فقط</small>'}</div>
      <div class="card"><h3>النسخ الاحتياطي لبياناتي</h3><div class="sub">المحفوظات، التعليمات، الهوامش، الملاحظات، الحفظ، والمراجعة.</div><div class="row"><button class="btn primary" id="bkExp">تصدير نسخة احتياطية</button><label class="btn">استعادة نسخة <input type="file" id="bkImp" accept=".json" hidden></label></div></div>
      <div class="card"><h3>المصادر والتراخيص</h3>${Object.values(APP.state.books).filter(b => b.count && (b.source || b.license)).map(b => `<div style="margin-bottom:8px"><b>${esc(b.title)}</b>: ${esc(b.source || '')}${b.id === 'quran' ? ' — <a href="https://tanzil.net" target="_blank" rel="noopener">tanzil.net</a>' : ''}${b.license ? `<details><summary>نص الترخيص</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(b.license)}</pre></details>` : ''}</div>`).join('') || '<div class="muted">—</div>'}</div>
      <div class="card"><h3>إعادة الضبط</h3><button class="btn" id="reset" style="color:var(--red)">حذف كل البيانات والبدء من جديد</button></div>`;
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { APP.setProfile(b.dataset.p); APP.rerender(); });
    $('#fs').oninput = e => { $('#fsv').textContent = e.target.value; DB.setting('fontSize', +e.target.value); APP.applyLook({ fontSize: +e.target.value, dark: $('#dark').checked }); };
    $('#dark').onchange = e => { DB.setting('dark', e.target.checked); APP.applyLook({ fontSize: +$('#fs').value, dark: e.target.checked }); };
    if ($('#rvUnlock')) $('#rvUnlock').onclick = () => APP.unlockReviewer();
    if ($('#rvLock')) $('#rvLock').onclick = () => APP.lockReviewer();
    if ($('#rvPass')) $('#rvPass').onclick = async () => { const r = await APP.ask('كلمة سر جديدة', [{ key: 'p', label: 'كلمة السر الجديدة' }]); if (r && r.p) { await DB.setting('reviewerPass', await APP.hash(r.p)); APP.toast('تم تغيير كلمة السر'); } };
    if ($('#hideUn')) $('#hideUn').onchange = e => { APP.state.hideUnreviewed = e.target.checked; DB.setting('hideUnreviewed', e.target.checked); };
    if (window.TTS) TTS.bindSettings(el);
    $('#bkExp').onclick = async () => APP.download('نسخة-احتياطية-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(await DB.exportUserData()));
    $('#bkImp').onchange = async e => { const f = e.target.files[0]; if (!f) return; await DB.importUserData(JSON.parse(await f.text())); await APP.refreshUser(); APP.toast('تمت الاستعادة'); };
    $('#reset').onclick = () => { if (!confirm('سيُحذف كل شيء: الكتب المستوردة وبياناتك. متأكد؟')) return; indexedDB.deleteDatabase('maktaba-sunnah'); setTimeout(() => location.reload(), 400); };
  };
})();
