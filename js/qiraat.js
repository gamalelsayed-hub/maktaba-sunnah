/* 📜 القراءات العشر ومتون التجويد
   - القراءات الصغرى (طريق الشاطبية): نصوص الروايات الثماني المطبوعة في مجمع الملك فهد (ورش، قالون، البزي، قنبل، الدوري، السوسي، شعبة، حفص)،
     قورنت آلياً بحفص كلمة كلمة → data/qiraat/NNN.js
   - فرش الحروف للرواة العشرين من «النشر» (الكبرى): جدول «جدول القراءات العشر» لصاحبه (santrirevo-droid/qiraat-table) يُحمَّل من مستودعه عند الطلب، مع الإحالة إلى صفحات النشر.
   - المتون: الشاطبية، والدرة، والطيبة، والجزرية، والتحفة — كل بيت مربوط بموضعه في شروحه من المكتبة. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const SN = s => (AR.SURAHS || [])[s - 1] || s;
  const nrm = s => String(s || '').replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').trim();

  // ===== الروايات الثماني (المصاحف المطبوعة) =====
  const RW8 = [['qaloon', 'قالون', 'نافع'], ['warsh', 'ورش', 'نافع'], ['bazzi', 'البزي', 'ابن كثير'], ['qumbul', 'قنبل', 'ابن كثير'], ['doori', 'الدوري', 'أبو عمرو'], ['soosi', 'السوسي', 'أبو عمرو'], ['shouba', 'شعبة', 'عاصم']];
  const loadJs = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const surahQR = async s => { window.QR = window.QR || {}; if (!window.QR[s]) await loadJs(`data/qiraat/${String(s).padStart(3, '0')}.js?v=${window.DATA_V || ''}`); return window.QR[s] || {}; };
  // ===== الرواة العشرون: فرش الحروف من النشر =====
  const QURRA = [['نافع', ['qa', 'قالون'], ['wr', 'ورش']], ['ابن كثير', ['bz', 'البزّي'], ['qn', 'قنبل']], ['أبو عمرو', ['da', 'الدوري'], ['su', 'السوسي']], ['ابن عامر', ['hi', 'هشام'], ['dh', 'ابن ذكوان']], ['عاصم', ['sh', 'شعبة'], ['hf', 'حفص']], ['حمزة', ['kh', 'خلف'], ['kd', 'خلّاد']], ['الكسائي', ['ah', 'أبو الحارث'], ['dk', 'الدوري']], ['أبو جعفر', ['iw', 'ابن وردان'], ['ij', 'ابن جمّاز']], ['يعقوب', ['rw', 'رويس'], ['rh', 'روح']], ['خلف العاشر', ['is', 'إسحاق'], ['id', 'إدريس']]];
  const CODES = QURRA.flatMap(q => [q[1][0], q[2][0]]);
  const RNAME = Object.fromEntries(QURRA.flatMap(q => [[q[1][0], q[1][1]], [q[2][0], q[2][1]]]));
  const NASHR_URL = 'https://cdn.jsdelivr.net/gh/santrirevo-droid/qiraat-table@main/data/qiraat-data.js';
  let nashrP = null;
  const nashr = () => nashrP || (nashrP = (window.QIRAAT_SURAHS && window.QIRAAT_SURAHS.length ? Promise.resolve() : loadJs(NASHR_URL)).then(() => {
    const by = {};
    (window.QIRAAT_SURAHS || []).forEach(s => s.items.forEach(it => {
      const mentioned = new Set(), vs = it.v.map(([text, spec, note]) => { const m = {}; let rest = false; spec.trim().split(/\s+/).forEach(tok => { if (tok === '*') { rest = true; return; } const c = tok.replace(/^~/, '').replace(/!$/, ''); m[c] = tok.startsWith('~') ? 'k' : 1; mentioned.add(c); }); return { text, note, m, rest }; });
      vs.forEach(v => { if (v.rest) CODES.filter(c => !mentioned.has(c)).forEach(c => v.m[c] = 1); });
      (by[`${s.surah}:${it.a}`] = by[`${s.surah}:${it.a}`] || []).push({ h: it.h, ref: it.ref, vs, s: s.surah, a: it.a });
    }));
    return by;
  }).catch(e => { nashrP = null; throw e; }));

  // ===== عرض قراءات آية =====
  function rw8Html(list) {
    if (!list.length) return '<div class="muted">لا خلاف بين الروايات الثماني المطبوعة في هذه الآية (في الرسم والضبط).</div>';
    return `<div class="qr-list">${list.map(([k, e]) => `<div class="qr-w"><div class="qr-h"><span class="qr-hafs">${esc(e.h)}</span> <small class="muted">حفص</small></div>
      <div class="qr-rows">${RW8.filter(([r]) => e[r]).map(([r, n, q]) => `<div><b>${n}</b> <small class="muted">(${q})</small><span class="qr-t">${esc(e[r])}</span></div>`).join('')}</div></div>`).join('')}</div>`;
  }
  function nashrHtml(items) {
    if (!items || !items.length) return '<div class="muted">لا يوجد فرش حروف في هذه الآية (ما عدا الأصول كالمدّ والإمالة والإدغام والهمز).</div>';
    return items.map(it => `<div class="card qr-nashr"><div class="qr-h"><span class="qr-hafs">${esc(it.h)}</span> <small class="muted">${esc(it.ref)}</small></div>
      ${it.vs.map(v => { const who = Object.keys(v.m); return `<div class="qr-v"><span class="qr-t">${esc(v.text)}</span>${v.note ? ` <small class="muted">${esc(v.note)}</small>` : ''}<div class="qr-who">${QURRA.map(q => [q[1], q[2]].filter(([c]) => v.m[c]).map(([c, n]) => `<span class="${v.m[c] === 'k' ? 'kh' : ''}" title="${v.m[c] === 'k' ? 'بخُلف عنه' : ''}">${n}${v.m[c] === 'k' ? '*' : ''}</span>`).join('')).join('')}</div></div>`; }).join('')}</div>`).join('');
  }
  async function ayahView(el, s, a) {
    const q = await surahQR(s), list = Object.entries(q).filter(([k]) => +k.split(':')[0] === +a);
    el.innerHTML = `<a class="btn sm" href="#/qiraat/surah/${s}">← سورة ${esc(SN(s))}</a> <a class="btn sm" href="#/item/quran:${s}:${a}">📖 الآية في المصحف</a>
      <h1>📜 القراءات في ${esc(SN(s))}: ${D(a)}</h1>
      <h2>القراءات الصغرى: الروايات المطبوعة</h2><div class="sub">من مصاحف مجمع الملك فهد للروايات، مقارنة بحفص كلمة كلمة (تشمل الأصول كالصلة والإبدال والنقل والإمالة).</div><div id="qr8">${rw8Html(list)}</div>
      <h2>فرش الحروف للرواة العشرين (من النشر)</h2><div id="qrN" class="muted">جارٍ التحميل…</div>`;
    try { const by = await nashr(); el.querySelector('#qrN').outerHTML = `<div>${nashrHtml(by[`${s}:${a}`])}</div><small class="muted">* بخُلفٍ عنه. المصدر: «جدول القراءات العشر» مأخوذ من «النشر في القراءات العشر» لابن الجزري ومقابَل بـ«البدور الزاهرة»، وصاحبه ينبّه إلى أنه لم يُحقَّق بشرياً بعد، فيُراجع على الكتاب قبل الإقراء.</small>`; }
    catch (e) { el.querySelector('#qrN').textContent = 'يحتاج اتصالاً بالإنترنت لتحميل جدول الرواة العشرين أول مرة.'; }
  }
  async function surahView(el, s) {
    const q = await surahQR(s), by = {};
    Object.entries(q).forEach(([k, e]) => (by[k.split(':')[0]] = by[k.split(':')[0]] || []).push([k, e]));
    let nb = {}; try { nb = await nashr(); } catch (e) { }
    const ayat = [...new Set([...Object.keys(by).map(Number), ...Object.keys(nb).filter(k => +k.split(':')[0] === s).map(k => +k.split(':')[1])])].sort((x, y) => x - y);
    el.innerHTML = `<a class="btn sm" href="#/qiraat">← القراءات</a><h1>📜 القراءات في سورة ${esc(SN(s))}</h1>
      <div class="row" style="gap:6px;margin-bottom:8px">${s > 1 ? `<a class="btn sm" href="#/qiraat/surah/${s - 1}">→ ${esc(SN(s - 1))}</a>` : ''}<span class="spacer"></span>${s < 114 ? `<a class="btn sm" href="#/qiraat/surah/${s + 1}">${esc(SN(s + 1))} ←</a>` : ''}</div>
      <div class="sub">${D(ayat.length)} آية فيها خلاف. اضغط الآية لرؤية كل قراءاتها.</div>
      <div class="bt-list">${ayat.map(a => { const w8 = (by[a] || []).map(([, e]) => e.h).slice(0, 4), fn = (nb[`${s}:${a}`] || []).map(x => x.h); return `<a class="bt-row" href="#/qiraat/ayah/${s}/${a}" style="text-decoration:none;color:inherit"><b>الآية ${D(a)}</b><small class="qr-hafs">${esc([...new Set([...fn, ...w8])].slice(0, 5).join(' · '))}</small><span class="spacer"></span><small class="muted">${fn.length ? D(fn.length) + ' فرش' : ''}</small></a>`; }).join('')}</div>`;
  }
  async function searchView(el, q) {
    el.innerHTML = `<a class="btn sm" href="#/qiraat">← القراءات</a><h1>🔎 قراءات كلمة</h1><form class="filters" id="qrF"><input name="q" value="${esc(q || '')}" placeholder="اكتب الكلمة كما في المصحف: مالك، يخادعون، الصراط…" style="flex:1"><button class="btn primary">بحث</button></form><div id="qrR"></div>`;
    el.querySelector('#qrF').onsubmit = e => { e.preventDefault(); location.hash = '#/qiraat/search/' + encodeURIComponent(e.target.q.value.trim()); };
    if (!q) return;
    const box = el.querySelector('#qrR'), nq = nrm(q), sk = x => nrm(x).replace(/[اويى]/g, ''), sq = sk(q);
    const hit = h => nrm(h).includes(nq) || (sq.length >= 2 && h.split(/\s+/).some(w => sk(w) === sq));
    box.innerHTML = '<div class="muted">جارٍ البحث في القرآن كله…</div>';
    const hits = [];
    let nb = {}; try { nb = await nashr(); } catch (e) { }
    Object.values(nb).forEach(arr => arr.forEach(it => { if (hit(it.h)) hits.push({ s: it.s, a: it.a, n: it }); }));
    for (let s = 1; s <= 114; s++) { const qq = await surahQR(s); Object.entries(qq).forEach(([k, e]) => { if (hit(e.h)) hits.push({ s, a: +k.split(':')[0], w: e }); }); }
    const grp = {}; hits.forEach(h => { const k = h.s + ':' + h.a; (grp[k] = grp[k] || { s: h.s, a: h.a, n: [], w: [] }); if (h.n) grp[k].n.push(h.n); if (h.w) grp[k].w.push(['', h.w]); });
    const list = Object.values(grp).sort((x, y) => x.s - y.s || x.a - y.a);
    box.innerHTML = list.length ? `<div class="sub">${D(list.length)} موضعاً</div>` + list.slice(0, 80).map(g => `<div class="card"><h3><a href="#/qiraat/ayah/${g.s}/${g.a}">${esc(SN(g.s))}: ${D(g.a)}</a></h3>${g.n.length ? nashrHtml(g.n) : ''}${g.w.length ? `<details ${g.n.length ? '' : 'open'}><summary>الروايات المطبوعة</summary>${rw8Html(g.w)}</details>` : ''}</div>`).join('') + (list.length > 80 ? '<div class="muted">عرضنا أول ٨٠ موضعاً، فدقّق الكلمة لنتائج أقل.</div>' : '')
      : '<div class="card muted">لا خلاف مسجّل في هذه الكلمة. جرّب كتابتها بلا تشكيل وبرسم المصحف (مثل: الصرط، ملك).</div>';
  }

  // ===== المتون =====
  const MUTUN = [['shatibiyya', '📗', 'الشاطبية', 'القراءات السبع — ١١٧٣ بيتاً', ['ibraz', 'siraj']], ['durra', '📘', 'الدرة المضية', 'الثلاث المتممة للعشر — ٢٤١ بيتاً', []], ['tayyiba', '📕', 'طيبة النشر', 'القراءات العشر الكبرى — نحو ١٠١٤ بيتاً', ['sharh-tayyiba-nazim', 'sharh-tayyiba-nuwayri']], ['jazariyya', '📙', 'المقدمة الجزرية', 'التجويد — ١٠٩ أبيات', ['tamhid']], ['tuhfa', '📒', 'تحفة الأطفال', 'التجويد للمبتدئين — ٦١ بيتاً', []]];
  const SHNAME = { ibraz: 'إبراز المعاني (أبو شامة)', siraj: 'سراج القارئ (ابن القاصح)', 'sharh-tayyiba-nazim': 'شرح ابن الناظم', 'sharh-tayyiba-nuwayri': 'شرح النويري', tamhid: 'التمهيد (ابن الجزري)', nashr: 'النشر (ابن الجزري)' };
  async function getBook(id) {
    let items = await DB.byIndex('items', 'bookId', id);
    if (!items.length) { try { await loadJs(`data/book-${id}.js`); items = (window.PACK && window.PACK.book.id === id) ? window.PACK.items : []; } catch (e) { items = []; } }
    return items.sort((x, y) => (x.num || x.seq) - (y.num || y.seq));
  }
  async function matnView(el, id) {
    const M = MUTUN.find(m => m[0] === id); if (!M) return;
    el.innerHTML = '<div class="card muted">جارٍ تحميل المتن…</div>';
    const bs = await getBook(id);
    const T = window.TUHFA_SHARH || {};
    let ch = '', h = `<a class="btn sm" href="#/qiraat/mutun">← المتون</a><h1>${M[1]} ${esc(M[2])}</h1><div class="sub">${esc(M[3])}${M[4].length ? ' · اضغط «الشرح» تحت البيت لتقرأ شرحه في: ' + M[4].map(x => SHNAME[x]).join('، ') : ''}</div>
      <form class="filters" id="mtF"><input name="q" placeholder="ابحث في أبيات المتن…" style="flex:1"></form><div class="matn">`;
    bs.forEach(b => {
      if (b.chapter !== ch) { ch = b.chapter; h += `<h2 class="matn-ch">${esc(ch)}</h2>${id === 'tuhfa' && T[ch] ? `<details class="card tuhfa-sh"><summary>💡 شرح ميسّر للباب</summary>${T[ch]}</details>` : ''}`; }
      h += `<div class="bayt" data-t="${esc(nrm(b.text))}"><span class="bn">${D(b.num)}</span><div class="sh"><span>${esc(b.a)}</span><span>${esc(b.b)}</span></div>${(b.ref || []).length ? `<div class="bref">${b.ref.map(r => `<a class="btn sm" href="#/item/${encodeURIComponent(r)}">📖 الشرح: ${SHNAME[r.split(':')[0]] || ''}</a>`).join('')}</div>` : ''}</div>`;
    });
    el.innerHTML = h + '</div><small class="muted">النص من المكتبة الشاملة عبر مشروع OpenITI.</small>';
    el.querySelector('#mtF').oninput = e => { const q = nrm(e.target.value); el.querySelectorAll('.bayt').forEach(x => x.style.display = !q || x.dataset.t.includes(q) ? '' : 'none'); };
    el.querySelector('#mtF').onsubmit = e => e.preventDefault();
  }

  const TABS = [['', '🏠 الرئيسية'], ['surah', '📖 حسب السورة'], ['search', '🔎 قراءات كلمة'], ['mutun', '📜 المتون'], ['kutub', '📚 الشروح والكتب'], ['qurra', '👥 القراء ورواتهم']];
  V.qiraat = async (el, [tab, a, b]) => {
    if (tab === 'ayah') return ayahView(el, +a, +b);
    if (tab === 'surah' && a) return surahView(el, +a);
    if (tab === 'search') return searchView(el, a ? decodeURIComponent(a) : '');
    if (tab === 'matn') { if (a === 'tuhfa' && !window.TUHFA_SHARH) try { await loadJs('data/tuhfa-sharh.js?v=' + (window.DATA_V || '')); } catch (e) { } return matnView(el, a); }
    let h = `<h1>📜 القراءات العشر والتجويد</h1><div class="tabs">${TABS.map(([k, l]) => `<button class="${(tab || '') === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>`;
    if (!tab) h += `<div class="card"><p>القراءات العشر المتواترة: <b>الصغرى</b> من طريق «الشاطبية» (للسبعة) و«الدرة» (للثلاثة المتممة)، و<b>الكبرى</b> من طريق «طيبة النشر» بطرقها الكثيرة.</p>
        <form class="filters" onsubmit="event.preventDefault();location.hash='#/qiraat/search/'+encodeURIComponent(this.q.value.trim())"><input name="q" placeholder="🔎 اكتب كلمة من القرآن لتظهر كل قراءاتها" style="flex:1"><button class="btn primary">بحث</button></form></div>
      <div class="fam-grid">${[['#/qiraat/surah', '📖', 'القراءات حسب السورة', 'كل آية بقراءاتها'], ['#/qiraat/search', '🔎', 'قراءات كلمة', 'ابحث بالكلمة'], ['#/qiraat/mutun', '📜', 'المتون', 'الشاطبية والدرة والطيبة والجزرية والتحفة'], ['#/qiraat/kutub', '📚', 'الشروح والكتب', 'إبراز المعاني، وسراج القارئ، وشروح الطيبة، والنشر'], ['#/qiraat/qurra', '👥', 'القراء العشرة', 'ورواتهم العشرون'], ['#/tajweed', '🎨', 'دروس التجويد', 'مع الأمثلة الملوّنة']].map(([h1, i, t, d]) => `<a class="fam-tile" href="${h1}"><span class="fam-ic">${i}</span><b>${t}</b><small>${d}</small></a>`).join('')}</div>`;
    else if (tab === 'surah') h += `<div class="du-grid">${(AR.SURAHS || []).map((n, i) => `<a class="card du-cat" href="#/qiraat/surah/${i + 1}"><b>${D(i + 1)}. ${esc(n)}</b></a>`).join('')}</div>`;
    else if (tab === 'mutun') h += MUTUN.map(([id, ic, t, d, sh]) => `<a class="card bt-row" href="#/qiraat/matn/${id}" style="text-decoration:none;color:inherit;margin-bottom:8px"><b>${ic} ${t}</b><small class="muted">${d}${sh.length ? ' · مع ' + sh.map(x => SHNAME[x]).join(' و') : ''}</small></a>`).join('') + '<div class="muted" style="font-size:12.5px">«تحفة الأطفال» معها شرح ميسّر لكل باب. و«الجزرية» يرجع شرحها إلى كتاب ناظمها «التمهيد في علم التجويد».</div>';
    else if (tab === 'kutub') h += `<div class="bt-list">${Object.entries(SHNAME).map(([id, n]) => `<a class="bt-row" href="#/book/${id}" style="text-decoration:none;color:inherit"><b>${esc(n)}</b><span class="spacer"></span>↗</a>`).join('')}</div><div class="muted" style="font-size:12.5px;margin-top:8px">إن لم يكن الكتاب مثبتاً فثبّته من «طلب العلم ← الكتب وتحميلها»، وبعدها يظهر في البحث العام أيضاً.</div>`;
    else if (tab === 'qurra') h += `<table class="t"><tr><th>القارئ</th><th>الراوي الأول</th><th>الراوي الثاني</th></tr>${QURRA_INFO.map(r => `<tr><td><b>${r[0]}</b><br><small class="muted">${r[1]}</small></td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</table>
      <div class="card"><p><b>السبعة</b> (الشاطبية): نافع، وابن كثير، وأبو عمرو، وابن عامر، وعاصم، وحمزة، والكسائي. <b>والثلاثة المتممة للعشر</b> (الدرة): أبو جعفر، ويعقوب، وخلف العاشر.</p><p>والقراءات العشر كلها متواترة، ومن «طيبة النشر» تُقرأ بطرقها الكبرى.</p></div>`;
    el.innerHTML = h;
    el.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { location.hash = '#/qiraat' + (x.dataset.t ? '/' + x.dataset.t : ''); });
  };
  const QURRA_INFO = [['نافع المدني', 'ت ١٦٩هـ', 'قالون (ت ٢٢٠هـ)', 'ورش (ت ١٩٧هـ)'], ['ابن كثير المكي', 'ت ١٢٠هـ', 'البزّي (ت ٢٥٠هـ)', 'قنبل (ت ٢٩١هـ)'], ['أبو عمرو البصري', 'ت ١٥٤هـ', 'الدوري (ت ٢٤٦هـ)', 'السوسي (ت ٢٦١هـ)'], ['ابن عامر الشامي', 'ت ١١٨هـ', 'هشام (ت ٢٤٥هـ)', 'ابن ذكوان (ت ٢٤٢هـ)'], ['عاصم الكوفي', 'ت ١٢٧هـ', 'شعبة (ت ١٩٣هـ)', 'حفص (ت ١٨٠هـ)'], ['حمزة الكوفي', 'ت ١٥٦هـ', 'خلف (ت ٢٢٩هـ)', 'خلّاد (ت ٢٢٠هـ)'], ['الكسائي الكوفي', 'ت ١٨٩هـ', 'أبو الحارث (ت ٢٤٠هـ)', 'الدوري (ت ٢٤٦هـ)'], ['أبو جعفر المدني', 'ت ١٣٠هـ', 'ابن وردان (ت ١٦٠هـ)', 'ابن جمّاز (ت ١٧٠هـ)'], ['يعقوب الحضرمي', 'ت ٢٠٥هـ', 'رويس (ت ٢٣٨هـ)', 'روح (ت ٢٣٤هـ)'], ['خلف العاشر', 'ت ٢٢٩هـ', 'إسحاق الورّاق (ت ٢٨٦هـ)', 'إدريس الحدّاد (ت ٢٩٢هـ)']];

  // زر «القراءات» في صفحة الآية
  const orig = V.item;
  V.item = async (el, parts, p) => {
    await orig(el, parts, p);
    const m = /^quran:(\d+):(\d+)$/.exec(decodeURIComponent(parts[0] || ''));
    if (m && !el.querySelector('.qr-link')) { const row = el.querySelector('.row'); const a = `<a class="btn qr-link" href="#/qiraat/ayah/${m[1]}/${m[2]}">📜 القراءات في هذه الآية</a>`; if (row) row.insertAdjacentHTML('beforeend', a); else el.insertAdjacentHTML('beforeend', a); }
  };
})();
