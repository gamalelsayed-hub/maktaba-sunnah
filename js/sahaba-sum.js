/* 👤 مختصر سيرة الصحابي: يستخلص من ترجمة «الإصابة» أهم ما فيها (النسب، الكنية، الأم، المولد،
   الإسلام، المشاهد، المكانة، الوفاة)، ويحوّل تراجم الكنى المحالة («تقدم») إلى الترجمة الأصلية. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const N = s => AR.normalize(String(s || '')).replace(/[^ء-ي ]/g, ' ').replace(/\s+/g, ' ').trim();
  let CACHE = null;
  const load = async () => CACHE || (CACHE = (await DB.byIndex('items', 'bookId', 'isaba')).filter(x => x.type === 'sahabi').map(x => {
    const name = String(x.title || '').replace(/^\s*\d+\s*-\s*/, '').replace(/[«»"]?\s*«?\d+»?\s*$/, '').replace(/«\d+»/g, '').trim();
    return { it: x, name, n: N(name), head: N(String(x.text || '').slice(0, 500)), len: (x.text || '').length };
  }));
  const clean = t => String(t || '').replace(/«\d+»/g, '').replace(/\[|\]/g, '').replace(/[ \t]+/g, ' ').trim();
  const ISNAD = /^(?:و?(?:حدثنا|حدثني|أخبرنا|أنبأنا|أخرج|أخرجه|رواه|روى|ذكره|ذكر|قال [^:،]{0,40}(?:حدث|أخبر))|في\s+«)/;

  function summarize(x) {
    const raw = clean(x.it.text);
    // النسب: إن بدأ النص بـ«بن» فهو تتمة للعنوان
    let nasab = x.name; const m0 = raw.match(/^(?:بن|ابن)\s[^.\n]{0,220}/);
    if (m0) nasab = (x.name + ' ' + m0[0]).replace(/\s+/g, ' ');
    const sents = raw.split(/\n|(?<=[.!؟])\s+/).map(s => s.trim()).filter(s => s.length > 8 && !ISNAD.test(s));
    const pick = (re, max = 190) => { const s = sents.find(z => re.test(z)); return s ? (s.length > max ? s.slice(0, max).replace(/\s\S*$/, '') + '…' : s) : ''; };
    const kunya = (nasab.match(/(?:،|\s)(أبو|أبي|أم)\s+[ء-ي]+(?:\s+[ء-ي]+)?/) || [])[0];
    const death = (raw.match(/(?:مات|توفي|توفّي|استشهد|قتل|وفاته)(?:\s+[^\s،.:\n]+){0,7}?\s+سنة\s+[^.\n،]{2,40}/) || [])[0];
    const facts = [
      ['الاسم والنسب', nasab.length > 260 ? nasab.slice(0, 260) + '…' : nasab],
      ['الكنية واللقب', kunya ? kunya.replace(/^[،\s]+/, '') : pick(/^(?:يكنى|كنيته|لقبه|يلقب|يقال له)/)],
      ['أمه', pick(/^(?:و)?أمه\s/)],
      ['المولد', pick(/^(?:و)?ولد\s|مولده/)],
      ['إسلامه وهجرته', pick(/(?:أسلم|إسلامه|السابقين|هاجر\s|الهجرتين)/)],
      ['مشاهده', pick(/(?:شهد\s|المشاهد|بدرا|أحدا|الحديبية|بيعة الرضوان)/)],
      ['مكانته', pick(/(?:أحد العشرة|خليفة|أمير المؤمنين|ذو النورين|الفاروق|سيف الله|حواري|أمين هذه الأمة|المبشرين|كاتب الوحي|من فقهاء|أعلم)/)],
      ['وفاته', death ? death.trim() : pick(/(?:مات|توفي|استشهد|قتل)\s/)],
    ].filter(f => f[1]);
    // لا تكرر الجملة نفسها في أكثر من خانة
    const seen = new Set(); return facts.filter(f => { const k = f[1].slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  // البحث: يقدّم ما يطابق الاسم من أوله، ثم ما يذكر الكنية في صدر الترجمة، ويحيل «تقدم» إلى الأصل
  async function find(q, max = 3) {
    const L = await load(), nq = N(q).replace(/^(?:الصحابي|سيره|سيرة|ترجمه|ترجمة)\s+/, '');
    if (nq.length < 3) return [];
    const ws = nq.split(' '), base = w => w.replace(/^ال/, '');
    // مطابقة كلمات كاملة (مع أداة التعريف) لا أجزاء كلمات: «تميم» لا تطابق «التميمي»
    const hasW = (toks, w) => toks.some(t => t === w || base(t) === base(w));
    const score = x => {
      const toks = (x.n + ' ' + x.head.slice(0, 140)).split(' ');
      let s = 0;
      if (x.n === nq) s += 100; else if (x.n.startsWith(nq + ' ') || x.n === nq) s += 60; else if (ws.every(w => hasW(toks, w)) && hasW(x.n.split(' '), ws[0])) s += 40;
      if (!s && ws.some(w => hasW(toks, w)) && (' ' + x.head + ' ').includes(' ' + nq + ' ')) s += 25;
      if (!s) return 0;
      return s + Math.min(60, x.len / 150); // التراجم الطويلة أوفى وأشهر غالباً
    };
    const hits = L.map(x => [score(x), x]).filter(h => h[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 12);
    const out = [], ids = new Set();
    for (const [, x] of hits) {
      let y = x;
      if (x.len < 160 && /تقدم|يأتي|سيأتي/.test(x.it.text || '')) {
        // «أبو بكر الصديق: اسمه عبد الله... تقدم» → الترجمة التي تذكر الكنية في صدرها
        const ism = N(((x.it.text || '').match(/اسمه\s+([^.«\n]{3,40})/) || [])[1] || '');
        const kn = x.n.split(' ').slice(0, 3).join(' ');
        const cand = L.filter(z => z !== x && z.len > 300 && z.head.includes(kn) && (!ism || z.n.startsWith(ism.split(' ')[0])));
        if (cand.length) y = cand.sort((a, b) => b.len - a.len)[0];
      }
      if (ids.has(y.it.id)) continue; ids.add(y.it.id); out.push(y);
      if (out.length >= max) break;
    }
    return out;
  }

  const TOP = () => window.SAHABA_TOP || [];
  function topFind(q) {
    const nq = N(q).replace(/^(?:الصحابي|سيره|سيرة|ترجمه|ترجمة)\s+/, '').replace(/\s*رضي الله عنه[ما]?$/, '');
    if (nq.length < 2) return [];
    const sc = t => { const names = [t.n, ...t.a].map(N); if (names.includes(nq)) return 100; if (names.some(x => x.startsWith(nq + ' ') || nq.startsWith(x + ' '))) return 50; if (nq.length >= 4 && names.some(x => x.includes(nq))) return 30; return 0; };
    return TOP().map(t => [sc(t), t]).filter(h => h[0]).sort((a, b) => b[0] - a[0]).map(h => h[1]);
  }
  async function isabaFor(t) {
    const L = (await load()).filter(x => x.len > 300), nq = N(t.q), ws = nq.split(' ');
    const by = f => L.filter(f).sort((a, b) => b.len - a.len)[0];
    const hh = t.h ? N(t.h) : null, ok = x => !hh || (x.n + ' ' + x.head).includes(hh);
    // لا رابط أفضل من رابط خاطئ: لا نطابق بصدر الترجمة وحده
    return by(x => x.n.startsWith(nq) && ok(x)) || by(x => ws.every(w => x.n.split(' ').some(k => k === w || k.replace(/^ال/, '') === w.replace(/^ال/, ''))) && ok(x)) || null;
  }
  function topCardHtml(t, isaba) {
    const rows = [['الاسم والنسب', t.full], ['الكنية واللقب', t.k], ['إسلامه', t.i], ['مكانته وفضله', t.m], ['مشاهده', t.s], ['وفاته', t.d], ['روايته', t.r]].filter(r => r[1]);
    return `<div class="card sah-card"><div class="row"><span class="ic c2" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:20px">⭐</span><h2 style="margin:0;flex:1">${esc(t.n)} <small class="muted" style="font-size:13px">رضي الله عنه${/بنت|خديجة|أم سلمة|فاطمة|أسماء/.test(t.n) ? 'ا' : ''}</small></h2>${isaba ? `<a class="btn sm" href="#/item/${encodeURIComponent(isaba.it.id)}">📖 الترجمة في الإصابة</a>` : ''}</div>
      <table class="t sah-t">${rows.map(([k, v]) => `<tr><th>${k}</th><td class="text">${esc(v)}</td></tr>`).join('')}</table>
      <div class="muted" style="font-size:12px;margin-top:6px">مختصر مكتوب للتطبيق — تحت المراجعة العلمية.</div></div>`;
  }
  function cardHtml(x, full) {
    const f = summarize(x);
    return `<div class="card sah-card"><div class="row"><span class="ic c3" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:20px">👤</span><h2 style="margin:0;flex:1">${esc(x.name)}</h2>${full ? '' : `<a class="btn sm" href="#/item/${encodeURIComponent(x.it.id)}">📖 الترجمة كاملة</a>`}</div>
      <table class="t sah-t">${f.map(([k, v]) => `<tr><th>${k}</th><td class="text">${esc(v)}</td></tr>`).join('')}</table>
      <div class="muted" style="font-size:12px;margin-top:6px">مستخلص آلياً من «الإصابة في تمييز الصحابة» لابن حجر (${esc(x.it.page || '')}) — راجع الترجمة كاملة للتفصيل والأسانيد.</div></div>`;
  }

  // ١) في نتائج البحث: بطاقة الصحابي أعلى النتائج
  const origSearch = V.search;
  V.search = async (el, parts, p) => {
    const run = origSearch(el, parts, p); // البحث يكمل في الخلفية، والبطاقة تظهر فوق نتائجه فوراً
    const q = (p && p.q) || '';
    if (!q || /\d/.test(q) || !(APP.state.books.isaba || {}).count || q.split(/\s+/).length > 6) return run;
    for (let i = 0; i < 50 && !el.querySelector('#sr'); i++) await new Promise(r => setTimeout(r, 100));
    const tops = topFind(q).slice(0, 2);
    let html = '';
    if (tops.length) { for (const t of tops) html += topCardHtml(t, await isabaFor(t)); }
    else {
      const hits = await find(q, p.type === 'sahabi' ? 5 : 2);
      const strong = hits.filter(h => h.n.includes(N(q)) || N(q).split(' ').every(w => h.n.includes(w) || h.head.includes(w)));
      html = strong.map(h => cardHtml(h)).join('');
    }
    if (!html) return run;
    const box = document.createElement('div');
    box.innerHTML = `<h2>👤 سيرة الصحابي مختصرة</h2>` + html;
    const sr = el.querySelector('#sr');
    if (sr) sr.parentNode.insertBefore(box, sr); else el.prepend(box);
    return run;
  };
  // ٢) في صفحة ترجمة من الإصابة: المختصر أولاً ثم النص الكامل
  const origItem = V.item;
  V.item = async (el, parts, p) => {
    await origItem(el, parts, p);
    const id = decodeURIComponent((parts || [])[0] || '');
    if (!id.startsWith('isaba:')) return;
    const L = await load(); let x = L.find(z => z.it.id === id); if (!x) return;
    if (x.len < 160 && /تقدم/.test(x.it.text || '')) { const r = await find(x.name, 1); if (r[0] && r[0] !== x) { el.querySelector('h1') && el.querySelector('h1').insertAdjacentHTML('afterend', `<div class="info">هذه ترجمة بالكنية، والترجمة الأصلية: <a href="#/item/${encodeURIComponent(r[0].it.id)}">${esc(r[0].name)}</a></div>`); x = r[0]; } }
    const h = el.querySelector('h1');
    const top = TOP().find(t => x.n.startsWith(N(t.q)) && t.q.length > 6);
    const wrap = document.createElement('div'); wrap.innerHTML = (top ? topCardHtml(top, null) : cardHtml(x, x.it.id === id)) + '<h2>📜 الترجمة كاملة</h2>';
    if (h) h.after(wrap); else el.prepend(wrap);
  };

  window.SAHABA = { find, summarize, cardHtml, topFind, isabaFor };
})();
