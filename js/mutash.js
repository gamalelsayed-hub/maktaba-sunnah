/* 🔁 المتشابه اللفظي: اكتشاف الآيات المتشابهة آلياً من نص المصحف، وإبراز مواضع الاختلاف،
   وخريطة بالسورة ورقم الآية، وتوجيه العلماء لحكمة التكرار والاختلاف من كتب المتشابه المدمجة. */
(() => {
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const skel = w => AR.uthmaniAlt(w).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[اإأآٱءؤئ]/g, '').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^ء-ي]/g, '');
  const BOOKS = ['mutash-kirmani', 'mutash-iskafi', 'mutash-gharnati', 'mutash-ansari'];
  let IDX = null;

  // فهرس: لكل آية كلماتها وهياكلها، وفهرس مقلوب لكل ثلاث كلمات متتالية
  async function index() {
    if (IDX) return IDX;
    const items = await DB.byIndex('items', 'bookId', 'quran');
    const A = {}, G = new Map();
    for (const x of items) {
      let w = x.text.split(/\s+/).filter(Boolean);
      if (x.ayah === 1 && x.surah !== 1 && w.slice(0, 4).map(skel).join(' ') === 'بسم لله لرحمن لرحيم') w = w.slice(4);
      const k = w.map(skel).filter(Boolean), key = x.surah + ':' + x.ayah;
      A[key] = { s: x.surah, a: x.ayah, w: w.filter(t => skel(t)), k };
      const grams = new Set(); for (let i = 0; i + 2 < k.length; i++) grams.add(k[i] + ' ' + k[i + 1] + ' ' + k[i + 2]);
      if (k.length && k.length < 3) grams.add('#' + k.join(' '));
      A[key].g = grams;
      grams.forEach(g => { if (!G.has(g)) G.set(g, []); G.get(g).push(key); });
    }
    // العبارات الشائعة جداً (كالفواصل المتكررة) لا تكفي وحدها للحكم بالتشابه
    IDX = { A, G };
    return IDX;
  }

  const lcs = (x, y) => { let prev = new Int16Array(y.length + 1); for (let i = 1; i <= x.length; i++) { const cur = new Int16Array(y.length + 1); for (let j = 1; j <= y.length; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]); prev = cur; } return prev[y.length]; };
  // الآيات المتشابهة: تشترك مع الآية في عبارة نادرة (ثلاث كلمات لا تتكرر في أكثر من 8 آيات)،
  // وتتقارب ألفاظهما (60٪ فأكثر من الأقصر، أو 40٪ مع اشتراك عبارتين نادرتين)، أو تتكرر بلفظها
  async function similar(s, a, max = 12) {
    const { A, G } = await index(), me = A[s + ':' + a];
    if (!me) return [];
    if (!IDX.full) { IDX.full = new Map(); Object.entries(A).forEach(([k, o]) => { const f = o.k.join(' '); if (!IDX.full.has(f)) IDX.full.set(f, []); IDX.full.get(f).push(k); }); }
    const out = new Map(), mk = s + ':' + a;
    (IDX.full.get(me.k.join(' ')) || []).forEach(k => { if (k !== mk) out.set(k, { score: 1, same: true }); });
    const cnt = new Map();
    me.g.forEach(g => { const L = G.get(g) || []; if (L.length > 8) return; L.forEach(k => { if (k !== mk) cnt.set(k, (cnt.get(k) || 0) + 1); }); });
    cnt.forEach((c, k) => {
      if (out.has(k)) return;
      const o = A[k], mn = Math.min(me.k.length, o.k.length); if (mn < 3) return;
      const r = lcs(me.k, o.k) / mn;
      if (r >= 0.6 || (r >= 0.4 && (c >= 2 || mn >= 10))) out.set(k, { score: r, same: false });
    });
    return [...out].map(([k, v]) => ({ s: A[k].s, a: A[k].a, ...v })).sort((x, y) => y.score - x.score).slice(0, max).sort((x, y) => x.s - y.s || x.a - y.a);
  }

  // إبراز الكلمات المختلفة بين آيتين (أطول تتابع مشترك)
  function diffMarks(w1, k1, k2) {
    const n = k1.length, m = k2.length, L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = k1[i] === k2[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const same = new Set(); let i = 0, j = 0;
    while (i < n && j < m) { if (k1[i] === k2[j]) { same.add(i); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    return w1.map((w, x) => same.has(x) ? esc(w) : `<mark class="mt-diff">${esc(w)}</mark>`).join(' ');
  }

  // توجيه العلماء: المواضع في كتب المتشابه التي تذكر عبارة من الآية في سورتها
  async function explanations(s, a, sims) {
    const { A } = await index(), me = A[s + ':' + a]; if (!me) return [];
    const have = BOOKS.filter(b => (APP.state.books[b] || {}).count);
    if (!have.length) return null;
    const nn = t => AR.normalize(t).replace(/[^ء-ي ]/g, ' ').replace(/\s+/g, ' ');
    const phrases = [];
    for (let i = 0; i + 2 < me.w.length; i++) phrases.push(nn(me.w.slice(i, i + 3).join(' ')));
    if (me.w.length < 3) phrases.push(nn(me.w.join(' ')));
    const surahs = new Set([s, ...sims.map(x => x.s)]);
    const res = [];
    for (const b of have) {
      const items = (await DB.byIndex('items', 'bookId', b)).filter(x => x.surah === s);
      const scored = items.map(x => { const t = nn(x.text); return [phrases.filter(p => p && t.includes(p)).length, x]; }).filter(([c]) => c > 0).sort((p, q) => q[0] - p[0]);
      scored.slice(0, 2).forEach(([c, x]) => res.push({ c, x, book: APP.state.books[b] }));
    }
    void surahs;
    return res.sort((p, q) => q.c - p.c);
  }

  const label = (s, a) => `${AR.SURAHS[s - 1]} ${AR.toArabicDigits(a)}`;

  // القسم الكامل (يُعرض في صفحة الآية)
  async function sectionHtml(s, a) {
    const sims = await similar(s, a);
    if (!sims.length) return '';
    const { A } = await index(), me = A[s + ':' + a];
    const tree = { label: '﴿' + me.w.slice(0, 6).join(' ') + (me.w.length > 6 ? '…' : '') + '﴾ ' + label(s, a), children: sims.map(x => {
      const o = A[x.s + ':' + x.a];
      const extra = o.k.map((k, i) => me.k.includes(k) ? null : o.w[i]).filter(Boolean).slice(0, 5).join(' ');
      return { label: 'سورة ' + label(x.s, x.a), children: x.same ? [{ label: 'مطابقة في اللفظ (تكرار)', children: [] }] : extra ? [{ label: 'تنفرد بـ: ' + extra, children: [] }] : [] };
    }) };
    const ex = await explanations(s, a, sims);
    return `<h2>🔁 المتشابهات (${AR.toArabicDigits(sims.length)})</h2>
      <div class="sub">آيات تشبه هذه الآية في اللفظ — الكلمات المظلَّلة هي مواضع الاختلاف التي يُخطئ فيها الحافظ.</div>
      <details class="card"><summary><b>🗺 خريطة المتشابهات</b></summary><div class="mindmap-wrap">${MINDMAP.render(tree)}</div></details>
      <div class="card"><div class="quran-text" style="font-size:21px"><span class="tag">${esc(label(s, a))}</span> ${diffMarks(me.w, me.k, sims.length ? A[sims[0].s + ':' + sims[0].a].k : [])}</div></div>
      ${sims.map(x => { const o = A[x.s + ':' + x.a]; return `<div class="card"><div class="row"><a class="tag" href="#/item/quran:${x.s}:${x.a}">${esc('سورة ' + label(x.s, x.a))}</a>${x.same ? '<span class="tag st-ok">تكرار بلفظه</span>' : ''}<span class="spacer"></span><button class="ayah-play" data-mplay="${x.s}:${x.a}" title="استمع">🔊</button></div>
        <div class="quran-text" style="font-size:21px">${diffMarks(o.w, o.k, me.k)}</div></div>`; }).join('')}
      <h3>💡 حكمة التكرار ووجه الاختلاف عند العلماء</h3>
      ${ex === null ? `<div class="info">كتب توجيه المتشابه (الكرماني، الإسكافي، ابن الزبير الغرناطي، زكريا الأنصاري) غير مثبتة. <a href="#/library">ثبّتها من المكتبة</a> ← الكتب المدمجة.</div>`
        : ex.length ? ex.map(e => `<details class="card" ${e === ex[0] ? 'open' : ''}><summary><b>${esc(e.book.title)}</b> <small class="muted">— ${esc(e.book.author || '')}</small></summary><div class="text" style="line-height:2">${AR.highlight ? AR.highlight(esc(e.x.text.slice(0, 2500)), me.w.slice(0, 3).join(' ')) : esc(e.x.text.slice(0, 2500))}${e.x.text.length > 2500 ? '…' : ''}</div><a class="btn sm" href="#/item/${e.x.id}">افتح الموضع كاملاً</a></details>`).join('')
        : '<div class="muted">لم يُعثر على كلام صريح عن هذا الموضع في كتب المتشابه المثبتة. والغالب أن العلماء يتكلمون على الموضع الأول من المتشابه في سورته، فانظر صفحة الآية المتشابهة الأولى.</div>'}`;
  }
  function bindSection() { }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-mplay]'); if (!b) return; const [s, a] = b.dataset.mplay.split(':').map(Number); QA.play([[s, a]], { noBasmala: true }); });

  // عدد المتشابهات لكل آية في سورة (للشارات في المصحف)
  async function countsForSurah(s) {
    const { A } = await index(), out = {};
    for (let a = 1; a <= QA.COUNTS[s - 1]; a++) { const n = (await similar(s, a, 30)).length; if (n) out[a] = n; }
    return out;
  }

  window.MUT = { index, similar, diffMarks, sectionHtml, bindSection, countsForSurah, skel, label };
})();
