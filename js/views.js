/* الشاشات: الرئيسية، القرآن، الحديث، الكتب، صفحة النص، الفقه، القواعد، السيرة، الصحابة، الرواة، الخريطة الذهنية */
(function () {
  const { esc } = APP;
  const V = APP.views;
  const talib = () => APP.state.profile === 'talib';
  const open = () => (talib() ? 'open' : '');
  const sampleWarn = it => (!APP.state.reviewer && APP.reviewStatus(it.id) === 'ok') ? '' : (it.sampleOverlay ? `<div class="warn">⚠️ النص نفسه من المصدر، أما <b>الأحكام والروابط والموضوعات المضافة إليه فإعداد أولي</b> يحتاج مراجعة.</div>` : '') + (it.sample ? `<div class="warn">⚠️ <b>إعداد أولي غير مراجع</b> — يُتحقق منه من المصادر قبل الاعتماد.</div>` : '') + (it.placeholder ? `<div class="warn">هذا النص ملخص مؤقت، ويُستبدل بنص الكتاب الأصلي عند استيراده.</div>` : '');
  const byType = (arr, t) => arr.filter(x => x.type === t);
  const books = t => Object.values(APP.state.books).filter(b => b.type === t);

  // ===== بطاقات مختصرة (للقوائم ونتائج البحث) =====
  APP.mini = function (it, q) {
    const hl = s => APP.withGharib(AR.highlight(s || '', q));
    const head = `<div class="row"><a href="#/item/${encodeURIComponent(it.id)}" class="ref">${esc(APP.titleOf(it))}</a>${APP.state.reviewer ? APP.statusTag(it.id) : APP.userBadge(it.id)}</div>`;
    let body = '';
    switch (it.type) {
      case 'ayah': body = `<div class="quran-text" style="font-size:calc(var(--fs)*1.35)">${hl(it.text)} <span class="ayah-num">${AR.toArabicDigits(it.ayah)}</span></div>`; break;
      case 'hadith': body = `${it.bab ? '<div class="muted">' + esc(it.bab) + '</div>' : ''}<div class="matn">${APP.withGharib(AR.snippetHtml(it.matn, q, 700))}</div><div>${APP.gradeSummary(it)}</div>`; break;
      case 'fiqh': body = `<b>${hl(it.title)}</b><div class="text">${hl(it.summary)}</div><div>${(it.schools || []).map(s => '<span class="tag">' + esc(s) + '</span>').join('')}</div>`; break;
      case 'event': body = `<span class="cat cat-${esc(it.category)}">${esc(it.category)}</span> <b>${hl(it.title)}</b> — <span class="muted">${esc(APP.yearLabel(it.year))} ${esc(it.month || '')}</span><div class="text">${hl(it.summary)}</div>`; break;
      case 'sahabi': body = `<b>${hl(it.title)}</b><div class="text">${hl(it.summary)}</div>`; break;
      case 'rawi': body = `<b>${hl(it.title)}</b> — <span class="muted">${hl(it.rank)}</span>`; break;
      case 'qaida': body = `<b>${hl(it.title)}</b><div class="text">${hl(it.text)}</div>`; break;
      default: body = `${it.bab ? '<div class="muted">' + esc(it.bab.slice(0, 160)) + '</div>' : ''}<div class="text">${APP.withGharib(AR.snippetHtml(it.text || '', q))}</div>${it.page ? '<small class="muted">' + esc(it.page) + '</small>' : ''}`;
    }
    return `<div class="card ${APP.hlClass(it.id)}" data-card="${esc(it.id)}">${head}${body}${APP.actionsBar(it)}</div>`;
  };

  // ===== الرئيسية =====
  V.home = async el => {
    const bs = Object.values(APP.state.books);
    const total = bs.reduce((s, b) => s + (b.count || 0), 0);
    const srs = await DB.all('srs'); const due = srs.filter(s => new Date(s.due) <= new Date()).length;
    const sampleOnly = bs.every(b => b.sample || !b.count);
    el.innerHTML = `
      <h1>مكتبة القرآن والسنة</h1>
      <div class="sub">مرجع يجمع القرآن الكريم والكتب الستة وشروحها، والفقه المقارن وأدلته، والقواعد، والسيرة وسير الصحابة — ويعمل بدون إنترنت.</div>
      ${sampleOnly ? `<div class="warn">المكتبة الآن فيها <b>عينة تجريبية</b> فقط. لاستيراد الكتب كاملة اذهب إلى <a href="#/library">المكتبة وتحميل الكتب</a>.</div>` : ''}
      <div class="grid">
        <a class="tile" href="#/quran"><b>📖 القرآن والتفسير</b><small>تصفح بالسورة والآية، مع التفاسير والأحاديث والأحكام المرتبطة</small></a>
        <a class="tile" href="#/hadith"><b>📜 الحديث وشروحه</b><small>الكتب الستة بأحكام المحدثين وعللها، والإسناد ورجاله</small></a>
        <a class="tile" href="#/fiqh"><b>⚖️ الفقه المقارن</b><small>المذاهب الأربعة والظاهرية وأقوال الصحابة والتابعين بأدلتها</small></a>
        <a class="tile" href="#/qawaid"><b>🧩 القواعد الفقهية</b><small>القاعدة وتأصيلها وفروعها</small></a>
        <a class="tile" href="#/sira"><b>🕌 السيرة والتاريخ</b><small>الخط الزمني، الغزوات، أحداث كل سنة هجرية، الخلفاء</small></a>
        <a class="tile" href="#/sahaba"><b>👥 سير الصحابة</b><small>نسبهم وإسلامهم وفضائلهم ومشاهدهم</small></a>
        <a class="tile" href="#/hifz"><b>🧠 مراجعة الحفظ</b><small>${due ? '<span class="badge">' + due + '</span> بطاقة مستحقة اليوم' : srs.length + ' بطاقة في حفظك'}</small></a>
        <a class="tile" href="#/saved"><b>⭐ محفوظاتي</b><small>${APP.state.bookmarks.length} محفوظ، ${APP.state.comments.length} هامش</small></a>
      </div>
      <h2>جرّب البحث</h2>
      <div class="row">${['النية', 'الربا', 'الفاتحة خلف الإمام', 'البقرة 255', 'البخاري 1', 'أحداث سنة 2 هـ', 'الغزوات', 'جذر: ق ر ا', 'تحريم'].map(s => `<a class="tag" href="#/search?q=${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>
      <h2>المكتبة</h2><div class="muted">${bs.filter(b => b.count).length} كتاباً مستورداً — ${total.toLocaleString('ar')} نصاً. ${bs.filter(b => !b.count).length} رفاً بانتظار الاستيراد.</div>`;
  };

  // ===== القرآن =====
  V.quran = async (el, [s]) => {
    if (!s) {
      const ayat = await DB.byIndex('items', 'bookId', 'quran');
      const cnt = {}; ayat.forEach(a => cnt[a.surah] = (cnt[a.surah] || 0) + 1);
      el.innerHTML = `<h1>القرآن الكريم والتفسير</h1><div class="sub">${ayat.length} آية مستوردة. التفاسير المتاحة: ${books('tafsir').map(b => esc(b.title + ' (' + b.author + ')') + (b.count ? '' : ' <small class="muted">— لم يُستورد</small>')).join('، ')}</div>
        <div class="grid">${AR.SURAHS.map((n, i) => `<a class="tile" href="#/quran/${i + 1}"><b>${AR.toArabicDigits(i + 1)}. سورة ${esc(n)}</b><small>${cnt[i + 1] ? cnt[i + 1] + ' آية متاحة' : 'غير مستوردة'}</small></a>`).join('')}</div>`;
      return;
    }
    s = +s;
    const ayat = (await DB.byIndex('items', 'bookId', 'quran')).filter(a => a.surah === s && APP.visible(a.id)).sort((a, b) => a.ayah - b.ayah);
    el.innerHTML = `<div class="row"><h1>سورة ${esc(AR.SURAHS[s - 1])}</h1><span class="spacer"></span>${s > 1 ? `<a class="btn" href="#/quran/${s - 1}">السابقة</a>` : ''}${s < 114 ? `<a class="btn" href="#/quran/${s + 1}">التالية</a>` : ''}</div>
      ${ayat.length ? '' : '<div class="warn">هذه السورة لم تُستورد بعد.</div>'}
      ${ayat.map(a => `<div class="card ${APP.hlClass(a.id)}" data-card="${a.id}"><div class="quran-text">${APP.withGharib(esc(a.text))} <a class="ayah-num" href="#/item/${a.id}">${AR.toArabicDigits(a.ayah)}</a></div>${APP.actionsBar(a)}</div>`).join('')}`;
  };

  // ===== الحديث =====
  V.hadith = async el => {
    const hb = books('hadith'), sb = books('sharh');
    el.innerHTML = `<h1>الحديث النبوي وشروحه</h1><div class="sub">كل حديث يُعرض بأحكام المحدثين عليه، ومَن حكم، ولماذا (العلة أو وجه التصحيح)، مع الإسناد ورجاله.</div>
      <h2>كتب الحديث</h2><div class="grid">${hb.map(b => `<a class="tile" href="#/book/${b.id}"><b>${esc(b.title)}</b><small>${esc(b.author || '')} — ${b.count ? b.count.toLocaleString('ar') + ' حديث' : 'لم يُستورد'}</small><br><small>${sb.filter(x => x.linkedTo === b.id).map(x => '📗 ' + esc(x.title)).join('<br>')}</small></a>`).join('')}</div>
      <h2>الشروح</h2><div class="grid">${sb.map(b => `<a class="tile" href="#/book/${b.id}"><b>${esc(b.title)}</b><small>${esc(b.author)} — على ${esc(APP.state.books[b.linkedTo] ? APP.state.books[b.linkedTo].title : '')} — ${b.count ? b.count + ' موضع' : 'لم يُستورد'}</small></a>`).join('')}</div>`;
  };

  // ===== تصفح كتاب =====
  V.book = async (el, [id], params) => {
    const b = APP.state.books[id];
    if (!b) { el.innerHTML = '<div class="warn">الكتاب غير موجود.</div>'; return; }
    if (b.type === 'quran') { location.hash = '#/quran'; return; }
    let items = (await DB.byIndex('items', 'bookId', id)).filter(x => APP.visible(x.id));
    const head = `<h1>${esc(b.title)}</h1><div class="sub">${esc(b.author || '')}${b.rights ? ' — <b>' + esc(b.rights) + '</b>' : ''}</div>`;
    if (!items.length) { el.innerHTML = head + `<div class="warn">هذا الرف فارغ — الكتاب لم يُستورد بعد. <a href="#/library">استيراد الآن</a></div>`; return; }
    const sortKey = x => (x.type === 'section' && b.type !== 'fiqhbook' && b.type !== 'sirabook' && b.type !== 'other' && !String(b.type).endsWith('book') ? -100000 + (x.seq || 0) : 0) + (x.surah ? x.surah * 1000 + x.ayah : (x.num ?? x.seq ?? 0));
    items.sort((a, c) => (sortKey(a) - sortKey(c)) || (a.year || 0) - (c.year || 0) || String(a.title || '').localeCompare(String(c.title || ''), 'ar'));
    if (b.type === 'tafsir') items.forEach(x => x._g = x.surah ? 'سورة ' + AR.SURAHS[x.surah - 1] : 'المقدمة');
    const groupField = b.type === 'tafsir' ? '_g' : b.type === 'sharh' ? null : (b.type === 'hadith' || b.type === 'fiqh' ? 'kitab' : (items[0].chapter ? 'chapter' : null));
    const jump = (b.type === 'sharh' || b.type === 'hadith') ? `<form class="row" onsubmit="event.preventDefault();location.hash='#/item/${id}:'+this.n.value"><input type="number" name="n" placeholder="رقم الحديث" style="width:130px"><button class="btn sm">اذهب</button></form>` : '';
    if (groupField && !params.g) {
      const groups = []; const seen = {};
      for (const x of items) { const k = x[groupField] || 'بدون عنوان'; if (!seen[k]) { seen[k] = { k, n: 0, first: x }; groups.push(seen[k]); } seen[k].n++; }
      if (groups.length > 150) {
        // فهرس طويل (مثل المغني): قائمة عناوين مقسمة على صفحات
        const pg = +(params.tp || 0), PER = 200, sl = items.slice(pg * PER, pg * PER + PER);
        const nav = `<div class="row">${pg > 0 ? `<a class="btn" href="#/book/${id}?tp=${pg - 1}">السابق</a>` : ''}<span class="muted">${pg * PER + 1}–${Math.min(items.length, pg * PER + PER)} من ${items.length}</span>${(pg + 1) * PER < items.length ? `<a class="btn" href="#/book/${id}?tp=${pg + 1}">التالي</a>` : ''}</div>`;
        el.innerHTML = head + `<div class="info">ابحث داخل الكتاب: <a href="#/search?book=${id}&deep=1&nodirect=1">البحث المتقدم في «${esc(b.title)}»</a></div><h2>الفهرس</h2>` + nav + '<ol start="' + (pg * PER + 1) + '">' + sl.map(x => `<li>${APP.link(x.id, x.title || x.id)} ${x.page ? '<small class="muted">' + esc(x.page) + '</small>' : ''}</li>`).join('') + '</ol>' + nav;
        return;
      }
      if (groups.length > 1) {
        el.innerHTML = head + jump + `<h2>الفهرس</h2><div class="grid">${groups.map(g => `<a class="tile" href="#/book/${id}?g=${encodeURIComponent(g.k)}"><b>${esc(g.k)}</b><small>${g.n} نص${g.first.num ? ' — يبدأ من ' + esc(String(g.first.num)) : ''}</small></a>`).join('')}</div>`;
        return;
      }
    }
    if (params.g) items = items.filter(x => (x[groupField] || 'بدون عنوان') === params.g);
    const page = +(params.p || 0), PER = 40;
    const slice = items.slice(page * PER, page * PER + PER);
    const nav = items.length > PER ? `<div class="row">${page > 0 ? `<a class="btn" href="#/book/${id}?g=${encodeURIComponent(params.g || '')}&p=${page - 1}">السابق</a>` : ''}<span class="muted">${page * PER + 1}–${Math.min(items.length, page * PER + PER)} من ${items.length}</span>${(page + 1) * PER < items.length ? `<a class="btn" href="#/book/${id}?g=${encodeURIComponent(params.g || '')}&p=${page + 1}">التالي</a>` : ''}</div>` : '';
    el.innerHTML = head + jump + (params.g ? `<div class="row"><a href="#/book/${id}">← الفهرس</a> <b>${esc(params.g)}</b></div>` : '') + nav + slice.map(x => APP.mini(x)).join('') + nav;
  };

  // ===== صفحة النص الكاملة =====
  V.item = async (el, [id]) => {
    const it = await DB.get('items', id);
    if (!it) { el.innerHTML = `<div class="warn">النص «${esc(id)}» غير موجود في المكتبة. ربما لم يُستورد كتابه بعد — <a href="#/library">المكتبة</a>.</div>`; return; }
    const linked = await APP.linked(it);
    const R = RENDER[it.type] || RENDER.generic;
    el.innerHTML = sampleWarn(it) + (APP.state.reviewer ? '' : `<div class="row" style="margin-bottom:6px">${APP.userBadge(it.id, true)}</div>`) + await R(it, linked) + `<div style="margin-top:16px"><button class="btn" onclick="history.back()">← رجوع</button></div>`;
    // مواضع المسألة في كتب الفقه المثبتة (بحث تلقائي بكلماتها المفتاحية)
    const box = el.querySelector('#fiqhSrc');
    if (box && APP.deepFind) {
      const ids = ['bidayat', 'mughni', 'muhalla'].filter(b => (APP.state.books[b] || {}).count);
      const words = AR.normalize(it.kw || it.title).split(' ').filter(w => w.length >= 2);
      if (!ids.length) { box.innerHTML = 'ثبّت بداية المجتهد والمغني والمحلى من <a href="#/library">المكتبة</a>.'; return; }
      const hits = await APP.deepFind(words, null, ids, {});
      hits.sort((a, b) => b.score - a.score);
      // نأخذ أفضل 8 من كل كتاب، ثم نقدّم ما طابقت كلماته عنوان الفصل، ونكتفي باثنين لكل كتاب
      const per = {}; const cand = hits.filter(h => (per[h.bookId] = (per[h.bookId] || 0) + 1) <= 8);
      const all = (await Promise.all(cand.map(h => DB.get('items', h.id)))).filter(Boolean);
      const tHit = x => words.every(w => AR.wordRe(w).test(AR.normalize((x.title || '') + ' ' + (x.bab || ''))));
      all.sort((a, b) => tHit(b) - tHit(a));
      const per2 = {}; const items = all.filter(x => (per2[x.bookId] = (per2[x.bookId] || 0) + 1) <= 2);
      box.outerHTML = items.length ? '<div>' + items.map(x => APP.mini(x, words.join(' '))).join('') + `<a class="btn sm" href="#/ask?q=${encodeURIComponent(it.kw || it.title)}">كل ما في المكتبة عن المسألة</a></div>` : '<div class="muted">لم يُعثر على موضع مطابق بالكلمات المفتاحية.</div>';
    }
  };

  const section = (title, arr, q) => arr.length ? `<h2>${title} <small class="muted">(${arr.length})</small></h2>` + arr.map(x => APP.mini(x, q)).join('') : '';

  const RENDER = {
    async ayah(it, L) {
      return `<h1>سورة ${esc(AR.SURAHS[it.surah - 1])} — الآية ${AR.toArabicDigits(it.ayah)}</h1>
        <div class="card ${APP.hlClass(it.id)}" data-card="${it.id}"><div class="quran-text">﴿${APP.withGharib(esc(it.text))}﴾</div>
        <div>${(it.topics || []).map(t => `<a class="tag" href="#/search?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>${APP.actionsBar(it)}</div>
        <div class="row"><a class="btn" href="#/item/quran:${it.surah}:${it.ayah - 1}">الآية السابقة</a><a class="btn" href="#/item/quran:${it.surah}:${it.ayah + 1}">الآية التالية</a><a class="btn" href="#/quran/${it.surah}">السورة كاملة</a></div>`
        + section('التفسير', byType(L, 'tafsir')) + section('الأحاديث المرتبطة', byType(L, 'hadith')) + section('المسائل الفقهية (أحكام القرآن)', byType(L, 'fiqh')) + section('القواعد المؤصّلة بها', byType(L, 'qaida'));
    },

    async hadith(it, L) {
      const chain = (it.narrators || []).map(r => `<a href="#/item/${encodeURIComponent(r)}">${esc(APP.state.names[r] || r)}</a>`).join('<span class="arrow">←</span>');
      const grades = (it.grades || []).map((g, i) => `<tr><td><b>${esc(g.grader)}</b>${g.sample ? ' <small class="tag st-fix">تجريبي</small>' : ''}</td><td><span class="tag ${APP.gradeCls(g.grade)}">${esc(g.grade)}</span></td>
        <td>${g.reason ? `<details ${open()}><summary>لماذا؟</summary><div class="why">${esc(g.reason)}</div></details>` : '<span class="muted">—</span>'}</td><td class="muted">${esc(g.source || '')}</td></tr>`).join('');
      const takhrij = await Promise.all((it.takhrij || []).map(APP.linkFor));
      const bk = APP.state.books[it.bookId] || {};
      return `<h1>${esc(APP.titleOf(it))}</h1><div class="sub">${esc(it.kitab || '')}${it.bab ? ' — ' + esc(it.bab) : ''}${bk.numbering ? '<br><small>' + esc(bk.numbering) + '</small>' : ''}</div>
        <div class="row"><a class="btn sm" href="#/item/${it.bookId}:${it.num - 1}">→ الحديث السابق</a><a class="btn sm" href="#/item/${it.bookId}:${it.num + 1}">الحديث التالي ←</a></div>
        <div class="summary-box"><b>الحكم باختصار:</b> ${APP.gradeSummary(it)}</div>
        <div class="card ${APP.hlClass(it.id)}" data-card="${it.id}">
          ${it.isnad ? `<details ${open()}><summary>الإسناد</summary><div class="isnad">${esc(it.isnad)}</div>${chain ? '<div class="chain"><b>رجال السند:</b> ' + chain + '<span class="arrow">←</span> النبي ﷺ</div>' : ''}</details>` : ''}
          ${!it.isnad ? '<div class="muted" style="font-size:13px">لم يُفصل الإسناد عن المتن آلياً في هذا الحديث.</div>' : ''}
          <div class="matn">${APP.withGharib(esc(it.matn))}</div>
          <div>${(it.topics || []).map(t => `<a class="tag" href="#/search?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div>
          ${APP.actionsBar(it)}</div>
        <h2>أحكام المحدثين عليه</h2>
        ${grades ? `<table class="t"><tr><th>المحدّث</th><th>الحكم</th><th>وجه الحكم / العلة</th><th>المصدر</th></tr>${grades}</table>${(it.grades || []).some(g => !g.reason) ? '<div class="muted" style="font-size:13px;margin-top:4px">الأحكام منقولة عن مشروع hadith-api، ووجه الحكم والعلة يُضافان أثناء المراجعة العلمية.</div>' : ''}` : '<div class="muted">لا يوجد حكم مسجل بعد.</div>'}
        ${takhrij.length ? `<h2>التخريج (رواه أيضاً)</h2><div>${takhrij.join(' — ')}</div>` : ''}`
        + section('الشروح', byType(L, 'sharh')) + section('آيات مرتبطة', byType(L, 'ayah')) + section('مسائل فقهية استُدل به فيها', byType(L, 'fiqh')) + section('قواعد مؤصّلة به', byType(L, 'qaida'));
    },

    async fiqh(it, L) {
      const ops = it.opinions || [];
      const evid = async o => {
        const n = await Promise.all((o.naqli || []).map(async d => `<li>${d.ref ? await APP.linkFor(d.ref) + ': ' : ''}«${esc(d.text)}»</li>`));
        return (n.length ? '<b>الأدلة النقلية:</b><ul>' + n.join('') + '</ul>' : '') + ((o.aqli || []).length ? '<b>الأدلة العقلية ووجه الاستدلال:</b><ul>' + o.aqli.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') + (o.source ? '<div class="muted">المصدر: ' + esc(o.source) + '</div>' : '');
      };
      const details = (await Promise.all(ops.map(async o => `<div class="card"><h3>${esc(o.school)}</h3><div class="text">${esc(o.qawl)}</div>${await evid(o)}</div>`))).join('');
      const qaida = it.qaida ? await APP.linkFor(it.qaida) : '';
      return `<h1>${esc(it.title)}</h1><div class="sub">${esc(it.kitab || '')} — ${esc(it.bab || '')}</div>
        <div class="summary-box" data-card="${it.id}"><b>الخلاصة:</b> <span class="text">${esc(it.summary || '')}</span>${it.jumhur ? '<br><b>رأي الجمهور:</b> ' + esc(it.jumhur) : ''}</div>
        ${APP.actionsBar(it)}
        <h2>مقارنة المذاهب</h2><table class="t"><tr><th style="width:140px">المذهب</th><th>القول</th></tr>${ops.map(o => `<tr><td><b>${esc(o.school)}</b></td><td class="text">${esc(o.qawl)}</td></tr>`).join('')}</table>
        <details ${open()}><summary>تحرير محل النزاع والإجماع</summary><div class="card">${it.nizaa ? '<b>المتفق عليه:</b> ' + esc(it.nizaa.agreed) + '<br><b>محل الخلاف:</b> ' + esc(it.nizaa.disputed) : ''}${it.ijma ? '<br><b>الإجماع:</b> ' + esc(it.ijma) : ''}</div></details>
        <details ${open()}><summary>الأقوال بأدلتها النقلية والعقلية</summary>${details}</details>
        ${it.sabab ? `<h2>سبب الخلاف (فلسفة الأقوال)</h2><div class="card text">${esc(it.sabab)}</div>` : ''}
        ${qaida ? `<h2>القاعدة المؤثرة في المسألة</h2><div class="card">${qaida}</div>` : ''}
        ${(it.rajih || []).length ? `<h2>الترجيح عند العلماء</h2><table class="t"><tr><th>المرجِّح</th><th>القول الراجح عنده</th><th>وجه الترجيح</th></tr>${it.rajih.map(r => `<tr><td>${esc(r.by)}</td><td>${esc(r.qawl)}</td><td>${esc(r.why || '')}</td></tr>`).join('')}</table><div class="muted" style="margin-top:6px">الترجيح منسوب لقائله، والبرنامج لا يرجّح من عنده.</div>` : ''}
        ${(it.refs || []).length ? `<h2>المراجع</h2><ul>${it.refs.map(r => '<li>' + esc(r) + '</li>').join('')}</ul>` : ''}
        <h2>المسألة في كتب الفقه</h2><div id="fiqhSrc" class="muted">جارٍ جلب المواضع من بداية المجتهد والمغني والمحلى…</div>`;
    },

    async qaida(it, L) {
      const tasil = await Promise.all((it.tasil || []).map(async t => `<li>«${esc(t.text)}» — ${t.ref ? await APP.linkFor(t.ref) : ''}</li>`));
      return `<h1>قاعدة: ${esc(it.title)}</h1><div class="sub">${esc(it.rank || '')}</div>
        <div class="card" data-card="${it.id}"><div class="text">${esc(it.text)}</div>${APP.actionsBar(it)}</div>
        <h2>التأصيل من الكتاب والسنة</h2>${tasil.length ? '<ul>' + tasil.join('') + '</ul>' : '<div class="muted">يُستكمل.</div>'}
        ${(it.furu || []).length ? `<h2>الفروع والتطبيقات</h2><ul>${it.furu.map(f => '<li class="text">' + esc(f) + '</li>').join('')}</ul>` : ''}
        ${it.source ? '<div class="muted">المصدر: ' + esc(it.source) + '</div>' : ''}` + section('مسائل مبنية عليها', byType(L, 'fiqh'));
    },

    async rawi(it, L) {
      const sahabi = (await DB.byIndex('items', 'ref', it.id)).find(x => x.type === 'sahabi');
      return `<h1>${esc(it.title)}</h1><div class="card" data-card="${it.id}"><table class="t"><tr><th>الحكم عليه</th><td class="text"><b>${esc(it.rank)}</b></td></tr><tr><th>الطبقة</th><td>${esc(it.tabaqa || '—')}</td></tr><tr><th>الوفاة</th><td>${esc(it.death || '—')}</td></tr></table>
        ${sahabi ? '<div style="margin-top:8px">📘 ' + APP.link(sahabi.id, 'سيرته كاملة') + '</div>' : ''}${APP.actionsBar(it)}</div>` + section('من رواياته في المكتبة', byType(L, 'hadith'));
    },

    async event(it, L) {
      const all = (await DB.byIndex('items', 'bookId', it.bookId)).filter(x => x.type === 'event').sort((a, b) => a.year - b.year);
      const i = all.findIndex(x => x.id === it.id);
      const rel = await Promise.all((it.relatedHadith || []).map(APP.linkFor));
      const li = a => a && a.length ? '<ul>' + a.map(x => '<li class="text">' + esc(x) + '</li>').join('') + '</ul>' : '<div class="muted">—</div>';
      return `<h1>${esc(it.title)}</h1><div class="sub"><span class="cat cat-${esc(it.category)}">${esc(it.category)}</span> ${esc(it.era || '')}</div>
        <div class="card" data-card="${it.id}"><table class="t"><tr><th style="width:130px">الزمان</th><td><a href="#/sira?year=${it.year}">${esc(APP.yearLabel(it.year))}</a> ${esc(it.month || '')}</td></tr><tr><th>المكان</th><td>${esc(it.place || '—')}</td></tr>
        ${it.forces ? `<tr><th>القوات</th><td>${it.forces.muslims ? 'المسلمون: ' + esc(it.forces.muslims) : ''}${it.forces.enemy ? '<br>الخصم: ' + esc(it.forces.enemy) : ''}</td></tr>` : ''}</table>
        <div class="summary-box" style="margin-top:10px">${esc(it.summary || '')}</div>${APP.actionsBar(it)}</div>
        <h2>الأسباب</h2>${li(it.causes)}<h2>مجريات الأحداث</h2>${li(it.events)}<h2>النتائج والدروس</h2>${li(it.results)}
        ${rel.length ? '<h2>أحاديث متعلقة</h2>' + rel.join(' — ') : ''}`
        + section('من شارك فيها', byType(L, 'sahabi'))
        + `<h2>المصادر</h2>${li(it.sources)}<div class="row">${all[i - 1] ? `<a class="btn" href="#/item/${all[i - 1].id}">← ${esc(all[i - 1].title)}</a>` : ''}<span class="spacer"></span>${all[i + 1] ? `<a class="btn" href="#/item/${all[i + 1].id}">${esc(all[i + 1].title)} →</a>` : ''}</div>`;
    },

    async sahabi(it, L) {
      if (!it.name && it.text) return RENDER.generic(it, L);
      const rows = [['الاسم والنسب', it.name], ['اللقب والكنية', it.laqab], ['المولد', it.birth], ['إسلامه', it.islam], ['الخلافة', it.khilafa], ['الوفاة', it.death]].filter(r => r[1]);
      return `<h1>${esc(it.title)}</h1><div class="summary-box" data-card="${it.id}">${esc(it.summary || '')}</div>${APP.actionsBar(it)}
        <table class="t">${rows.map(r => `<tr><th style="width:140px">${r[0]}</th><td class="text">${esc(r[1])}</td></tr>`).join('')}</table>
        ${(it.virtues || []).length ? '<h2>فضائله</h2><ul>' + it.virtues.map(v => '<li class="text">' + esc(v) + '</li>').join('') + '</ul>' : ''}
        ${(it.mashahid || []).length ? '<h2>مشاهده</h2><ul>' + it.mashahid.map(v => '<li>' + esc(v) + '</li>').join('') + '</ul>' : ''}
        ${it.rawi ? '<h2>روايته للحديث</h2>' + await APP.linkFor(it.rawi) : ''}`
        + section('أحداث شارك فيها', byType(L, 'event').sort((a, b) => a.year - b.year))
        + ((it.sources || []).length ? '<h2>المصادر</h2><ul>' + it.sources.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' : '');
    },

    async generic(it, L) {
      const target = it.hadithRef || (it.type === 'tafsir' ? 'quran:' + it.surah + ':' + it.ayah : '');
      const tgt = target ? await DB.get('items', target) : null;
      const nb = it.type === 'section' ? `<div class="row"><a class="btn sm" href="#/item/${it.bookId}:${(it.seq || 1) - 1}">→ السابق</a><a class="btn sm" href="#/book/${it.bookId}">فهرس الكتاب</a><a class="btn sm" href="#/item/${it.bookId}:${(it.seq || 0) + 1}">التالي ←</a></div>` :
        it.type === 'sharh' ? `<div class="row"><a class="btn sm" href="#/item/${it.bookId}:${(it.num || 1) - 1}">→ السابق</a><a class="btn sm" href="#/item/${it.bookId}:${(it.num || 0) + 1}">التالي ←</a></div>` : '';
      const tgtHtml = tgt ? `<div class="summary-box">${tgt.type === 'ayah' ? '<div class="quran-text" style="font-size:calc(var(--fs)*1.3)">﴿' + esc(tgt.text) + '﴾</div>' : '<div class="matn">' + esc((tgt.matn || '').slice(0, 600)) + '</div>' + APP.gradeSummary(tgt)}</div>` : '';
      return `<h1>${esc(APP.titleOf(it))}</h1>${it.chapter && it.chapter !== it.title ? '<div class="sub">' + esc(it.chapter) + '</div>' : ''}${(it.ref || []).length ? '<div class="sub">على: ' + (await Promise.all(it.ref.filter(r => !r.startsWith(it.bookId)).slice(0, 4).map(APP.linkFor))).join('، ') + '</div>' : ''}${nb}${tgtHtml}
        <div class="card ${APP.hlClass(it.id)}" data-card="${it.id}">${it.page ? '<div class="muted">الصفحة ' + esc(it.page) + '</div>' : ''}<div class="text" style="white-space:pre-wrap">${APP.withGharib(esc(it.text || ''))}</div>${APP.actionsBar(it)}</div>`;
    }
  };
  RENDER.tafsir = RENDER.sharh = RENDER.section = RENDER.gharib = RENDER.generic;

  // ===== الفقه =====
  V.fiqh = async el => {
    const items = (await DB.byIndex('items', 'bookId', 'fiqh')).filter(x => APP.visible(x.id));
    const groups = {}; items.forEach(x => (groups[x.kitab || 'عام'] = groups[x.kitab || 'عام'] || []).push(x));
    el.innerHTML = `<h1>الفقه المقارن</h1><div class="sub">لكل مسألة: الخلاصة، رأي الجمهور، مقارنة المذاهب (الأربعة والظاهرية وأقوال الصحابة والتابعين)، الأدلة النقلية والعقلية، سبب الخلاف، القاعدة، والترجيح منسوباً لقائله.</div>
      ${Object.entries(groups).map(([k, arr]) => `<h2>${esc(k)}</h2>` + arr.map(x => APP.mini(x)).join('')).join('') || '<div class="muted">لا توجد مسائل بعد.</div>'}
      <h2>كتب الفقه والخلاف</h2><div class="grid">${books('fiqhbook').map(b => `<a class="tile" href="#/book/${b.id}"><b>${esc(b.title)}</b><small>${esc(b.author)} — ${b.count ? b.count + ' موضع' : 'لم يُستورد'}</small></a>`).join('')}</div>
      <h2>أحكام القرآن والتفاسير الفقهية</h2><div class="grid">${books('tafsir').filter(b => /احكام|لاحكام/.test(AR.normalize(b.title))).map(b => `<a class="tile" href="#/book/${b.id}"><b>${esc(b.title)}</b><small>${esc(b.author)} — ${b.count ? b.count + ' موضع' : 'لم يُستورد'}</small></a>`).join('')}</div>`;
  };

  V.qawaid = async el => {
    const items = (await DB.byIndex('items', 'bookId', 'qawaid')).filter(x => APP.visible(x.id));
    el.innerHTML = `<h1>القواعد الفقهية</h1><div class="sub">القاعدة، معناها، تأصيلها من الكتاب والسنة، وفروعها، والمسائل المبنية عليها.</div>` + items.map(x => APP.mini(x)).join('');
  };

  // ===== السيرة: خط زمني + بحث بالسنة + تصفية =====
  V.sira = async (el, _, params) => {
    let evs = [];
    for (const b of Object.values(APP.state.books).filter(b => b.type === 'sira')) evs.push(...await DB.byIndex('items', 'bookId', b.id));
    evs = evs.filter(x => x.type === 'event' && APP.visible(x.id)).sort((a, b) => a.year - b.year);
    const cats = [...new Set(evs.map(e => e.category))], eras = [...new Set(evs.map(e => e.era).filter(Boolean))];
    if (params.year) evs = evs.filter(e => e.year === +params.year);
    if (params.cat) evs = evs.filter(e => e.category === params.cat);
    if (params.era) evs = evs.filter(e => e.era === params.era);
    const years = [...new Set(evs.map(e => e.year))];
    el.innerHTML = `<h1>السيرة النبوية وتاريخ الخلفاء</h1><div class="sub">خط زمني بالسنوات الهجرية. اكتب سنة لعرض أحداثها، أو صفِّ بالنوع (الغزوات مثلاً) أو بالعهد.</div>
      <form class="filters" id="siraF"><input type="number" name="year" placeholder="السنة الهجرية (سالب = قبل الهجرة)" value="${esc(params.year || '')}" style="width:230px">
        <select name="cat"><option value="">كل الأنواع</option>${cats.map(c => `<option ${c === params.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <select name="era"><option value="">كل العهود</option>${eras.map(c => `<option ${c === params.era ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <button class="btn primary">عرض</button><a class="btn" href="#/sira">الكل</a><a class="btn" href="#/sira?cat=${encodeURIComponent('غزوة')}">⚔️ الغزوات فقط</a></form>
      <div class="timeline">${years.map(y => `<div class="tl-year"><a href="#/sira?year=${y}">${esc(APP.yearLabel(y))}</a></div>` + evs.filter(e => e.year === y).map(e => APP.mini(e)).join('')).join('') || '<div class="muted">لا توجد أحداث مطابقة.</div>'}</div>
      <h2>كتب السيرة والتاريخ</h2><div class="grid">${books('sirabook').map(b => `<a class="tile" href="#/book/${b.id}"><b>${esc(b.title)}</b><small>${esc(b.author)} — ${b.count ? b.count + ' موضع' : 'لم يُستورد'}</small></a>`).join('')}</div>`;
    APP.$('#siraF').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); location.hash = '#/sira?' + new URLSearchParams([...f].filter(([, v]) => v)).toString(); };
  };

  V.sahaba = async el => {
    const items = [];
    for (const b of Object.values(APP.state.books).filter(b => b.type === 'sahaba')) items.push(...await DB.byIndex('items', 'bookId', b.id));
    items.splice(0, items.length, ...items.filter(x => x.type === 'sahabi' && APP.visible(x.id)));
    el.innerHTML = `<h1>سير الصحابة رضي الله عنهم</h1><div class="sub">${items.length} ترجمة.</div>` + items.map(x => APP.mini(x)).join('');
  };

  V.rijal = async el => {
    const items = (await DB.byIndex('items', 'bookId', 'rijal')).filter(x => APP.visible(x.id));
    el.innerHTML = `<h1>تراجم الرواة</h1><div class="sub">الحكم على الراوي من تقريب التهذيب، مع رواياته الموجودة في المكتبة.</div>
      <table class="t"><tr><th>الراوي</th><th>الحكم عليه</th><th>الطبقة</th><th>الوفاة</th></tr>${items.map(r => `<tr><td>${APP.link(r.id, r.title)}</td><td>${esc(r.rank)}</td><td>${esc(r.tabaqa || '')}</td><td>${esc(r.death || '')}</td></tr>`).join('')}</table>`;
  };

  // ===== الخريطة الذهنية =====
  V.mindmap = async (el, [id]) => {
    const it = await DB.get('items', id);
    if (!it) { el.innerHTML = '<div class="warn">غير موجود.</div>'; return; }
    const linked = await APP.linked(it);
    const tree = MINDMAP.build(it, linked, { titleOf: APP.titleOf, names: APP.state.names, bookTitle: APP.bookTitle, yearLabel: APP.yearLabel, cite: APP.titleOf(it) });
    const svg = MINDMAP.render(tree);
    el.innerHTML = `<div class="row"><h1>🗺 خريطة ذهنية: ${esc(APP.titleOf(it))}</h1><span class="spacer"></span>
      <button class="btn" id="mmSvg">تنزيل صورة SVG</button><button class="btn" id="mmPng">تنزيل صورة PNG</button><button class="btn" onclick="window.print()">طباعة</button><a class="btn" href="#/item/${encodeURIComponent(id)}">فتح النص</a></div>
      <div class="sub">الفروع التي عليها نقطة قابلة للضغط وتفتح النص المرتبط.</div><div class="mindmap-wrap">${svg}</div>`;
    APP.$('#mmSvg').onclick = () => APP.download('خريطة-' + id.replace(/[:/]/g, '-') + '.svg', svg, 'image/svg+xml');
    APP.$('#mmPng').onclick = () => {
      const img = new Image(); const svgEl = el.querySelector('svg');
      img.onload = () => { const c = document.createElement('canvas'); c.width = svgEl.width.baseVal.value * 2; c.height = svgEl.height.baseVal.value * 2; const x = c.getContext('2d'); x.scale(2, 2); x.drawImage(img, 0, 0); c.toBlob(b => APP.download('خريطة-' + id.replace(/[:/]/g, '-') + '.png', b)); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };
  };

  V.notfound = el => { el.innerHTML = '<div class="warn">الصفحة غير موجودة. <a href="#/">الرئيسية</a></div>'; };
})();
