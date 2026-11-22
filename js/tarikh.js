/* 🏛️ التاريخ: العصور من آدم عليه السلام إلى العصر الحديث، والبلدان، والخلفاء، والبحث في كتب التاريخ بالمكتبة.
   الملخصات مكتوبة للتعريف، وكل عصر يحيل إلى مواضعه في كتب التاريخ المعروفة، ويُذكر الخلاف بين المؤرخين. */
(() => {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(String(n));
  let T = null, IDX = null;
  const loadJS = (src, key) => window[key] ? Promise.resolve(window[key]) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = src + '?v=' + (window.DATA_V || ''); s.onload = () => ok(window[key]); s.onerror = no; document.head.appendChild(s); });
  const load = async () => T || (T = await loadJS('data/tarikh.js', 'TARIKH'));
  const loadIdx = async () => IDX || (IDX = await loadJS('data/tarikh-index.js', 'TARIKH_IDX'));
  const N = s => AR.normalize ? AR.normalize(s || '') : (s || '');
  const NS = s => N(s).replace(/[\s،,.:\-—]/g, '').replace(/ه\b/g, 'ه').replace(/مئ/g, 'مائ').replace(/ثماني/g, 'ثمان');
  const BOOKT = id => (T.books.find(b => b[0] === id) || [id, id])[1];

  // السنة الهجرية بالكلمات كما يكتبها المؤرخون: «ست وخمسين وستمائة»
  function yearWords(n) {
    const U = ['', 'إحدى', 'اثنتين', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثمان', 'تسع'], UT = ['', 'إحدى', 'اثنتي', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثماني', 'تسع'];
    const TE = ['', 'عشر', 'عشرين', 'ثلاثين', 'أربعين', 'خمسين', 'ستين', 'سبعين', 'ثمانين', 'تسعين'];
    const H = ['', 'مائة', 'مائتين', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    const th = Math.floor(n / 1000), h = Math.floor(n % 1000 / 100), r = n % 100, t = Math.floor(r / 10), u = r % 10, parts = [];
    if (r) { if (r < 10) parts.push(r === 1 ? 'إحدى' : r === 2 ? 'اثنتين' : U[u]); else if (r === 10) parts.push('عشر'); else if (r < 20) parts.push(UT[u] + ' عشرة'); else parts.push((u ? U[u] + ' و' : '') + TE[t]); }
    if (h) parts.push(H[h]); if (th) parts.push('ألف');
    return parts.join(' و');
  }

  const hero = sub => `<div class="rf-hero th-hero"><h1>🏛️ التاريخ</h1><div>${sub || 'من آدم عليه السلام إلى العصر الحديث، من كتب التاريخ المعروفة: الطبري، وابن الأثير، وابن كثير، وأبي الفداء، وابن خلدون، والسيوطي، والجبرتي، ومحمد فريد.'}</div></div>`;
  const searchBox = (q = '') => `<form class="th-search" id="thS"><input name="q" value="${esc(q)}" placeholder="ابحث: دولة، بلد، حقبة، شخصية، أو سنة هجرية مثل 656"><button class="btn primary">بحث</button></form>`;
  const bindSearch = el => { const f = el.querySelector('#thS'); if (f) f.onsubmit = e => { e.preventDefault(); const q = f.q.value.trim(); if (q) location.hash = '#/tarikh/q/' + encodeURIComponent(q); }; };
  const refRow = r => `<a class="th-ref" href="#/item/${encodeURIComponent(r[0])}"><b>📕 ${esc(r[2])}</b><small>${esc(r[1])}</small></a>`;
  const tabs = cur => `<div class="tabs th-tabs">${[['', '🕰️ العصور'], ['buldan', '🗺️ البلدان'], ['khulafa', '👑 الخلفاء'], ['kutub', '📚 الكتب']].map(([k, l]) => `<a class="${cur === k ? 'on' : ''}" href="#/tarikh${k ? '/' + k : ''}">${l}</a>`).join('')}</div>`;

  V.tarikh = async (el, [sec, id]) => {
    el.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
    try { await load(); } catch (e) { el.innerHTML = '<div class="card">تعذر تحميل بيانات التاريخ. تأكد من الاتصال ثم أعد المحاولة.</div>'; return; }
    if (sec === 'era') return era(el, T.eras.find(e => e.id === id));
    if (sec === 'country') return country(el, T.countries[+id]);
    if (sec === 'q') return search(el, id || '');
    if (sec === 'khulafa') return khulafa(el);
    if (sec === 'kutub') {
      el.innerHTML = hero() + tabs('kutub') + `<div class="bt-list">${T.books.map(([bid, t, a]) => `<a class="bt-row" href="#/book/${bid}" style="text-decoration:none;color:inherit"><b>${esc(t)}</b><small class="muted">${esc(a)}</small><span class="spacer"></span>↗</a>`).join('')}</div>
        <div class="muted" style="font-size:12.5px;margin-top:8px">إن لم يكن الكتاب مثبتاً فثبّته من صفحته. وكتب السيرة (ابن هشام) في قسم السيرة.</div>`;
      return;
    }
    if (sec === 'buldan') {
      el.innerHTML = hero() + searchBox() + tabs('buldan') + `<div class="th-grid">${T.countries.map((c, i) => `<a class="card th-card" href="#/tarikh/country/${i}"><span class="th-ic">${c.ic}</span><b>${esc(c.n)}</b><small>${esc(c.s.slice(0, 90))}…</small></a>`).join('')}</div>`;
      return bindSearch(el);
    }
    el.innerHTML = hero() + searchBox() + tabs('') + `<div class="th-line">${T.eras.map((e, i) => `<a class="th-era" href="#/tarikh/era/${e.id}"><span class="th-dot">${e.ic}</span><div><small class="th-y">${esc(e.y)}</small><b>${esc(e.t)}</b><small>${esc(e.s.slice(0, 110))}…</small></div></a>`).join('')}</div>
      <div class="muted th-note">الملخصات للتعريف العام، وكل عصر فيه إحالات إلى مواضعه في الكتب، وتنبيه على ما اختلف فيه المؤرخون.</div>`;
    bindSearch(el);
  };

  function era(el, e) {
    if (!e) { location.hash = '#/tarikh'; return; }
    const i = T.eras.indexOf(e), prev = T.eras[i - 1], next = T.eras[i + 1];
    el.innerHTML = `<a class="btn sm" href="#/tarikh">← العصور</a>
      <div class="rf-hero th-hero"><h1>${e.ic} ${esc(e.t)}</h1><div class="th-y">${esc(e.y)}</div></div>
      <div class="card th-sum">${esc(e.s)}</div>
      ${e.e && e.e.length ? `<h3>📅 أبرز الأحداث</h3><div class="th-ev">${e.e.map(([y, t]) => `<div><span>${esc(y)}</span><b>${esc(t)}</b></div>`).join('')}</div>` : ''}
      ${e.k && e.k.length ? `<h3>⚖️ ما اختلف فيه المؤرخون وتنبيهات</h3><div class="th-khilaf">${e.k.map(k => `<p>${esc(k)}</p>`).join('')}</div>` : ''}
      ${e.refs.length ? `<h3>📕 اقرأ في كتب التاريخ</h3><div class="th-refs">${e.refs.map(refRow).join('')}</div>` : ''}
      ${e.link ? `<a class="btn" href="${e.link}">🌙 قسم السيرة النبوية المفصل</a>` : ''}
      <h3>🔎 ابحث في الكتب عن</h3><div class="chips">${e.q.map(q => `<a class="chip" href="#/tarikh/q/${encodeURIComponent(q)}">${esc(q)}</a>`).join('')}</div>
      <div class="row th-nav">${prev ? `<a class="btn" href="#/tarikh/era/${prev.id}">→ ${esc(prev.t)}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/tarikh/era/${next.id}">${esc(next.t)} ←</a>` : ''}</div>`;
  }

  function country(el, c) {
    if (!c) { location.hash = '#/tarikh/buldan'; return; }
    el.innerHTML = `<a class="btn sm" href="#/tarikh/buldan">← البلدان</a>
      <div class="rf-hero th-hero"><h1>${c.ic} ${esc(c.n)}</h1></div>
      <div class="card th-sum">${esc(c.s)}</div>
      <h3>🕰️ العصور المتصلة</h3><div class="th-refs">${c.eras.map(id => T.eras.find(e => e.id === id)).filter(Boolean).map(e => `<a class="th-ref" href="#/tarikh/era/${e.id}"><b>${e.ic} ${esc(e.t)}</b><small>${esc(e.y)}</small></a>`).join('')}</div>
      <h3>🔎 ابحث في الكتب عن</h3><div class="chips">${c.q.map(q => `<a class="chip" href="#/tarikh/q/${encodeURIComponent(q)}">${esc(q)}</a>`).join('')}</div>`;
  }

  async function khulafa(el) {
    el.innerHTML = hero() + tabs('khulafa') + '<div class="muted">جارٍ التحميل…</div>';
    const items = (await DB.byIndex('items', 'bookId', 'tarikh-khulafa')).sort((a, b) => a.seq - b.seq);
    const box = document.createElement('div');
    if (!items.length) box.innerHTML = `<div class="card">قائمة الخلفاء من كتاب «تاريخ الخلفاء» للسيوطي. الكتاب غير مثبت بعد: <a class="btn sm" href="#/book/tarikh-khulafa">ثبّته من هنا</a></div>`;
    else {
      const seen = new Set();
      const rows = items.filter(i => { const t = i.title.replace(/\s*\(\d+\)$/, ''); if (seen.has(t) || /^(فصل|فائدة|مقدمة|قصيدة|شرح|خطبة)/.test(t)) return false; seen.add(t); return true; });
      box.innerHTML = `<div class="muted" style="margin:6px 0">من «تاريخ الخلفاء» للسيوطي: الراشدون، ثم بنو أمية، ثم بنو العباس في بغداد ثم في القاهرة.</div><div class="th-refs">${rows.map(i => `<a class="th-ref" href="#/item/${encodeURIComponent(i.id)}"><b>${esc(i.title)}</b></a>`).join('')}</div>`;
    }
    el.querySelector('.muted:last-child')?.remove(); el.appendChild(box);
  }

  async function search(el, q) {
    el.innerHTML = `<a class="btn sm" href="#/tarikh">← التاريخ</a>` + searchBox(q) + '<div id="thR" class="muted">جارٍ البحث…</div>';
    bindSearch(el);
    const R = el.querySelector('#thR'), nq = N(q);
    const eras = T.eras.filter(e => N(e.t + ' ' + e.s + ' ' + e.q.join(' ') + ' ' + e.e.map(x => x[1]).join(' ')).includes(nq));
    const cs = T.countries.map((c, i) => [c, i]).filter(([c]) => N(c.n + ' ' + c.s + ' ' + c.q.join(' ')).includes(nq));
    let hits = [], dq = q;
    try {
      await loadIdx();
      const num = +String(q).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '');
      if (num > 0 && num < 1500 && /^\s*(سنة\s*)?[\d٠-٩]+\s*(هـ)?\s*$/.test(q)) {
        dq = 'سنة ' + yearWords(num); const w = NS(dq), pre = num + '-';
        hits = IDX.filter(([id, t]) => t.startsWith(pre) || NS(t).includes(w));
      } else hits = IDX.filter(([, t]) => N(t).includes(nq));
    } catch (e) { }
    const byBook = {}; hits.slice(0, 300).forEach(([id, t]) => { const b = id.split(':')[0]; (byBook[b] = byBook[b] || []).push([id, t]); });
    const deep = T.books.map(([b, t]) => `<a class="chip" href="#/search?q=${encodeURIComponent(dq)}&book=${b}&deep=1&nodirect=1">${esc(t.split('(')[0].trim())}</a>`).join('');
    R.className = '';
    R.innerHTML = `${eras.length || cs.length ? `<h3>🕰️ في العصور والبلدان</h3><div class="th-refs">${eras.map(e => `<a class="th-ref" href="#/tarikh/era/${e.id}"><b>${e.ic} ${esc(e.t)}</b><small>${esc(e.y)}</small></a>`).join('')}${cs.map(([c, i]) => `<a class="th-ref" href="#/tarikh/country/${i}"><b>${c.ic} ${esc(c.n)}</b></a>`).join('')}</div>` : ''}
      <h3>📕 في عناوين أبواب كتب التاريخ (${D(hits.length)})</h3>
      ${Object.keys(byBook).length ? Object.entries(byBook).map(([b, rs]) => `<details class="th-bk" open><summary>${esc(BOOKT(b))} (${D(rs.length)})</summary>${rs.slice(0, 40).map(([id, t]) => `<a class="th-hit" href="#/item/${encodeURIComponent(id)}">${esc(t)}</a>`).join('')}</details>`).join('') : '<div class="muted">لا توجد أبواب بهذا العنوان. جرّب البحث داخل نصوص الكتب ↓</div>'}
      <h3>🔎 ابحث داخل نصوص كتاب${dq !== q ? ' عن «' + esc(dq) + '»' : ''}</h3><div class="chips">${deep}</div>
      <div class="muted th-note">البحث داخل النصوص يحتاج أن يكون الكتاب مثبتاً في مكتبتك.</div>`;
  }
})();
