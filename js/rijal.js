/* 🔗 تراجم الرواة: بحث فوري في «تقريب التهذيب» لابن حجر (8800+ راوٍ) مع تلوين المرتبة وشرح الرموز */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const N = s => (' ' + AR.normalize(String(s || '')).replace(/[^\u0621-\u064A0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' ').replace(/ بن /g, ' ابن ').replace(/ بن /g, ' ابن ').trim();
  const SYM = { 'ع': 'الجماعة', '4': 'أصحاب السنن الأربعة', 'خ': 'البخاري', 'م': 'مسلم', 'د': 'أبو داود', 'ت': 'الترمذي', 'س': 'النسائي', 'ق': 'ابن ماجه',
    'خت': 'البخاري تعليقاً', 'بخ': 'البخاري في الأدب المفرد', 'عخ': 'البخاري في خلق أفعال العباد', 'ر': 'البخاري في جزء القراءة', 'ي': 'البخاري في رفع اليدين', 'ى': 'البخاري في رفع اليدين',
    'مق': 'مسلم في المقدمة', 'مد': 'أبو داود في المراسيل', 'قد': 'أبو داود في القدر', 'خد': 'أبو داود في الناسخ', 'ل': 'أبو داود في المسائل', 'كد': 'أبو داود في مسند مالك',
    'تم': 'الترمذي في الشمائل', 'سي': 'النسائي في عمل اليوم والليلة', 'ص': 'النسائي في خصائص علي', 'عس': 'النسائي في مسند علي', 'كن': 'النسائي في مسند مالك', 'فق': 'ابن ماجه في التفسير', 'تمييز': 'ذُكر للتمييز (ليس له رواية في الكتب الستة)' };
  // مرتبة الراوي ولونها (اصطلاح ابن حجر في مقدمة التقريب)
  function grade(rank) {
    const r = String(rank || '');
    if (/صحابي|له صحبة|له رؤية|صحبة/.test(r)) return ['صحابي', 'gr-sahabi'];
    if (/كذاب|متهم|يضع|متروك|ساقط|واه|منكر الحديث|ضعيف جدا/.test(r)) return ['متروك / شديد الضعف', 'gr-bad'];
    if (/ضعيف|مجهول|لين/.test(r)) return ['ضعيف أو مجهول', 'gr-weak'];
    if (/مقبول|مستور/.test(r)) return ['مقبول (حيث يُتابع)', 'gr-ok'];
    if (/صدوق/.test(r)) return ['صدوق (حسن الحديث)', 'gr-good'];
    if (/ثقة|ثبت|حافظ|حجة|إمام|متقن/.test(r)) return ['ثقة', 'gr-top'];
    return ['', ''];
  }
  function books(x) {
    const tail = String(x.death || x.text || '').trim().split(/\s+/).reverse(), out = [];
    for (const t of tail) { const k = t.replace(/[^ء-ي0-9]/g, ''); if (SYM[k]) out.unshift(k); else if (out.length || /سنة|مات|بعد|قبل/.test(t)) break; }
    return out;
  }
  // الوفاة بدون رموز الكتب في آخرها
  function deathText(x) { const w = String(x.death || '').trim().split(/\s+/); while (w.length && SYM[w[w.length - 1].replace(/[^\u0621-\u064A0-9]/g, '')]) w.pop(); return w.join(' '); }
  // الوفاة بدون رموز الكتب في آخرها
  function deathText(x) { const w = String(x.death || '').trim().split(/\s+/); while (w.length && SYM[w[w.length - 1].replace(/[^\u0621-\u064A0-9]/g, '')]) w.pop(); return w.join(' '); }
  let CACHE = null;
  const load = async () => CACHE || (CACHE = (await DB.byIndex('items', 'bookId', 'taqrib')).map(x => ({ x, n: N(x.title), toks: N(x.title).split(' ') })));

  // الأعلام المشتهرون بلقب أو نسبة: المقصود عند الإطلاق
  const FAMOUS = { 'الزهري': 'محمد ابن مسلم ابن عبيد الله ابن عبد الله ابن شهاب', 'ابن شهاب': 'محمد ابن مسلم ابن عبيد الله ابن عبد الله ابن شهاب', 'الاعمش': 'سليمان ابن مهران', 'الثوري': 'سفيان ابن سعيد ابن مسروق', 'سفيان الثوري': 'سفيان ابن سعيد ابن مسروق',
    'ابن عيينه': 'سفيان ابن عيينه', 'شعبه': 'شعبه ابن الحجاج', 'ابن جريج': 'عبد الملك ابن عبد العزيز ابن جريج', 'الشعبي': 'عامر ابن شراحيل', 'ابن سيرين': 'محمد ابن سيرين', 'الحسن البصري': 'الحسن ابن ابي الحسن', 'نافع': 'نافع ابو عبد الله المدني',
    'الاوزاعي': 'عبد الرحمن ابن عمرو ابن ابي عمرو', 'ابن المبارك': 'عبد الله ابن المبارك', 'وكيع': 'وكيع ابن الجراح', 'عكرمه': 'عكرمه ابو عبد الله', 'مجاهد': 'مجاهد ابن جبر', 'عطاء': 'عطاء ابن ابي رباح', 'ابن المسيب': 'سعيد ابن المسيب', 'سعيد ابن المسيب': 'سعيد ابن المسيب',
    'ابو اسحاق السبيعي': 'عمرو ابن عبد الله ابن عبيد', 'السبيعي': 'عمرو ابن عبد الله ابن عبيد', 'الليث': 'الليث ابن سعد', 'مالك': 'مالك ابن انس', 'ابن لهيعه': 'عبد الله ابن لهيعه', 'يحيي القطان': 'يحيي ابن سعيد ابن فروخ', 'ابن مهدي': 'عبد الرحمن ابن مهدي', 'ابن ابي ذئب': 'محمد ابن عبد الرحمن ابن المغيره' };
  function search(L, q) {
    const nq = N(q); if (nq.length < 2) return [];
    const fam = FAMOUS[nq] ? N(FAMOUS[nq]) : null;
    const ws = nq.split(' '), base = w => w.replace(/^ال/, '');
    const has = (toks, w) => toks.some(t => t === w || base(t) === base(w) || (w.length >= 4 && t.startsWith(w)));
    return L.map(r => {
      let s = 0;
      if (r.n === nq) s = 100; else if (r.n.startsWith(nq + ' ')) s = 70; else if (ws.every(w => has(r.toks, w))) s = 40 + (has(r.toks.slice(0, 2), ws[0]) ? 15 : 0);
      if (s && (' ' + r.n + ' ').includes(' ' + nq + ' ')) s += 30;
      if (fam && r.n.startsWith(fam)) s = Math.max(s, 40) + 200;
      if (s) { const b = books(r.x); s += (b.includes('ع') ? 12 : b.length * 2) + (grade(r.x.rank)[1] === 'gr-top' ? 6 : 0); }
      return [s, r];
    }).filter(h => h[0]).sort((a, b) => b[0] - a[0] || a[1].x.num - b[1].x.num).slice(0, 60).map(h => h[1].x);
  }

  function card(x) {
    const [gl, gc] = grade(x.rank || x.text), bk = books(x);
    return `<div class="card rawi-card"><div class="row"><a href="#/item/${encodeURIComponent(x.id)}" class="rawi-name">${esc(x.title)}</a></div>
      <div class="row" style="margin-top:6px;gap:6px">${gl ? `<span class="tag ${gc}">${gl}</span>` : ''}<span class="text" style="font-size:15px">${esc(x.rank || '')}</span>${/اختلط|خلط|تغير|احترق|تلقن/.test(x.text || '') ? '<span class="tag gr-weak" title="تُنظر روايته قبل الاختلاط وبعده">⚠️ اختلط أو تغيّر</span>' : ''}${/مدلس|يدلس|تدليس/.test(x.text || '') ? '<span class="tag gr-ok" title="يُشترط تصريحه بالسماع">⚠️ مدلّس</span>' : ''}</div>
      <div class="muted" style="font-size:13px;margin-top:4px">${[x.tabaqa, deathText(x)].filter(Boolean).map(esc).join(' — ')}</div>
      ${bk.length ? `<div style="font-size:13px;margin-top:6px">📚 روى له: ${bk.map(k => `<span class="tag" title="${esc(SYM[k])}">${esc(k)} = ${esc(SYM[k])}</span>`).join(' ')}</div>` : ''}</div>`;
  }

  V.rijal = async (el, parts, p) => {
    const t = APP.state.books.taqrib;
    el.innerHTML = `<h1>🔗 تراجم الرواة</h1>
      <div class="sub">ابحث عن أي راوٍ في «تقريب التهذيب» لابن حجر: الحكم عليه، وطبقته، ووفاته، ومن روى له من أصحاب الكتب الستة.</div>
      ${t && t.count ? '' : '<div class="warn">«تقريب التهذيب» غير مثبت — ثبّته من <a href="#/library">المكتبة</a>.</div>'}
      <input type="search" id="rq" placeholder="اكتب اسم الراوي أو كنيته أو نسبته (مثال: الزهري، قتادة، سفيان بن عيينة، أبو الزبير)" value="${esc(p.q || '')}" style="width:100%;font-size:16px;margin-bottom:12px">
      <div id="rr"></div>
      <details class="card" ${p.q ? '' : 'open'}><summary>📏 مراتب الرواة عند ابن حجر وألوانها</summary>
        <table class="t" style="margin-top:8px">
          <tr><td><span class="tag gr-sahabi">صحابي</span></td><td>المرتبة الأولى: الصحابة، وكلهم عدول</td></tr>
          <tr><td><span class="tag gr-top">ثقة</span></td><td>المراتب 2–3: «ثقة ثقة، ثقة حافظ، ثقة متقن، ثقة» — حديثه صحيح</td></tr>
          <tr><td><span class="tag gr-good">صدوق</span></td><td>المرتبتان 4–5: «صدوق، لا بأس به، صدوق يهم، له أوهام» — حديثه حسن في الجملة</td></tr>
          <tr><td><span class="tag gr-ok">مقبول</span></td><td>المرتبة 6: «مقبول» حيث يُتابع، وإلا فليّن الحديث</td></tr>
          <tr><td><span class="tag gr-weak">ضعيف</span></td><td>المراتب 7–10: «مستور، ضعيف، مجهول»</td></tr>
          <tr><td><span class="tag gr-bad">متروك</span></td><td>المراتب 11–12: «متروك، متهم بالكذب، كذاب»</td></tr></table>
        <div class="muted" style="font-size:12.5px;margin-top:6px">الرموز: خ البخاري، م مسلم، د أبو داود، ت الترمذي، س النسائي، ق ابن ماجه، ع الجماعة، 4 أصحاب السنن الأربعة. الحكم على الحديث لا يقف على راوٍ واحد، بل على الإسناد كله وعلله.</div></details>`;
    const box = el.querySelector('#rr'), inp = el.querySelector('#rq');
    let tm;
    const run = async () => {
      const q = inp.value.trim();
      if (q.length < 2) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="muted">… جارٍ البحث</div>';
      const L = await load(), hits = search(L, q);
      box.innerHTML = hits.length ? `<div class="muted" style="margin-bottom:8px">${hits.length >= 60 ? 'أول 60 نتيجة — زد الاسم تحديداً' : AR.toArabicDigits(hits.length) + ' نتيجة'}</div>` + hits.map(card).join('') : '<div class="info">لا نتائج — جرّب جزءاً من الاسم أو الكنية أو النسبة.</div>';
      history.replaceState(null, '', '#/rijal?q=' + encodeURIComponent(q));
    };
    inp.oninput = () => { clearTimeout(tm); tm = setTimeout(run, 250); };
    if (p.q) run(); else setTimeout(() => inp.focus(), 50);
  };

  window.RIJAL = { search, grade, books, load };
})();
