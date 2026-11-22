/* 📣 الدعوة إلى الله: دعوة أهل الكتاب وأصحاب الأديان، ودعوة اللادينيين، وفقه الدعوة.
   كل فكرة بدليلها من القرآن والسنة، ومعها نص من كتب المكتبة (مقارنة الأديان وأدلة وجود الله) يفتح بالضغط عليه.
   المحتوى في data/dawah.js، والأدلة تحققنا من وجودها في كتب المكتبة. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = s => AR.toArabicDigits(String(s));
  let loading = null;
  const load = () => window.DAWAH ? Promise.resolve(window.DAWAH) : (loading || (loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/dawah.js?v=' + (window.DATA_V || ''); s.onload = () => res(window.DAWAH); s.onerror = rej; document.head.appendChild(s); })));
  const BOOKS = [['jawab-sahih', 'الجواب الصحيح لمن بدّل دين المسيح', 'ابن تيمية'], ['hidayat-hayara', 'هداية الحيارى في أجوبة اليهود والنصارى', 'ابن القيم'], ['izhar-haqq', 'إظهار الحق', 'رحمة الله الهندي'], ['iclam-nasara', 'الإعلام بما في دين النصارى', 'القرطبي'], ['ifham-yahud', 'بذل المجهود في إفحام اليهود', 'السموأل المغربي'], ['radd-nasara-jahiz', 'الرد على النصارى', 'الجاحظ'], ['fisal', 'الفِصَل في الملل والأهواء والنحل', 'ابن حزم'], ['milal', 'الملل والنحل', 'الشهرستاني'], ['dar-taarud', 'درء تعارض العقل والنقل', 'ابن تيمية'], ['miftah-sada', 'مفتاح دار السعادة', 'ابن القيم'], ['shifa-alil', 'شفاء العليل', 'ابن القيم'], ['iqtisad', 'الاقتصاد في الاعتقاد', 'الغزالي'], ['fasl-maqal', 'فصل المقال', 'ابن رشد'], ['amr-maruf', 'الأمر بالمعروف والنهي عن المنكر', 'ابن تيمية']];
  const evHtml = list => list.map(e => e.k === 'q'
    ? `<blockquote class="dw-q"><span class="quran-text">﴿${esc(D(e.t).replace(/﴿(\d+|[٠-٩]+)﴾/g, '($1)'))}﴾</span> <a class="tb-src" href="#/item/${encodeURIComponent(e.id)}">📖 ${esc(D(e.ref))} ↗</a></blockquote>`
    : e.k === 'h' ? `<blockquote class="tb-ev">${esc(e.t)} <a class="tb-src" href="#/item/${encodeURIComponent(e.id)}">📚 ${esc(e.ref)} ↗</a></blockquote>`
    : `<div class="dw-book"><div class="dw-bh">📕 ${esc(e.ref)}</div><p>${esc(e.t)}</p><a class="btn sm" href="#/item/${encodeURIComponent(e.id)}">اقرأ الفصل كاملاً في الكتاب ↗</a></div>`).join('');

  V.dawah = async (el, [pid, tid]) => {
    el.innerHTML = '<div class="card muted">جارٍ التحميل…</div>';
    let W; try { W = await load(); } catch (e) { el.innerHTML = '<div class="warn">تعذّر تحميل المحتوى. حدّث الصفحة.</div>'; return; }
    if (pid === 'card') {
      el.innerHTML = `<a class="btn sm" href="#/dawah">← الدعوة</a><h1>🪪 تعريف موجز بالإسلام</h1><div class="sub">أرسله لمن تحب أن تعرّفه بالإسلام، أو اقرأه عليه.</div>
        <div class="card dw-card">${W.card.split('\n').map(l => `<p>${esc(l)}</p>`).join('')}</div>
        <div class="row" style="gap:8px"><button class="btn primary" id="dwCopy">📋 نسخ</button><button class="btn" id="dwShare">📤 مشاركة</button></div>`;
      el.querySelector('#dwCopy').onclick = () => APP.copy ? APP.copy(W.card) : navigator.clipboard.writeText(W.card);
      el.querySelector('#dwShare').onclick = () => { if (navigator.share) navigator.share({ text: W.card }).catch(() => { }); else (APP.copy ? APP.copy(W.card) : navigator.clipboard.writeText(W.card)); };
      return;
    }
    if (pid === 'kutub') {
      el.innerHTML = `<a class="btn sm" href="#/dawah">← الدعوة</a><h1>📚 مكتبة الداعية</h1><div class="sub">كتب العلماء في مقارنة الأديان والرد على الشبهات وأدلة وجود الله وفقه الدعوة. كلها داخل مكتبة التطبيق، ويُبحث فيها من البحث العام.</div>
        <div class="bt-list">${BOOKS.map(([id, t, a]) => `<a class="bt-row" href="#/book/${id}" style="text-decoration:none;color:inherit"><b>${esc(t)}</b><small class="muted">${esc(a)}</small><span class="spacer"></span>↗</a>`).join('')}</div>
        <div class="muted" style="font-size:12.5px;margin-top:8px">إن لم يكن الكتاب مثبتاً فثبّته من «طلب العلم ← الكتب وتحميلها».</div>`;
      return;
    }
    const P = W.parts.find(p => p.id === pid);
    if (!P) {
      el.innerHTML = `<div class="rf-hero dw-hero"><h1>📣 الدعوة إلى الله</h1><div>﴿ادع إلى سبيل ربك بالحكمة والموعظة الحسنة﴾: تعريف بالإسلام لأهل الأديان، وأدلة وجود الله لمن لا يؤمن، وطرق الدعوة لكل مسلم ومسلمة.</div></div>
        <div class="dw-parts">${W.parts.map(p => `<a class="card dw-part" href="#/dawah/${p.id}"><span class="dw-ic">${p.ic}</span><div><b>${esc(p.name)}</b><small>${esc(p.intro)}</small><small class="muted">${D(p.topics.length)} موضوعاً</small></div></a>`).join('')}</div>
        <div class="fam-grid" style="margin-top:10px"><a class="fam-tile" href="#/dawah/card"><span class="fam-ic">🪪</span><b>تعريف موجز بالإسلام</b><small>للنسخ والمشاركة</small></a><a class="fam-tile" href="#/dawah/kutub"><span class="fam-ic">📚</span><b>مكتبة الداعية</b><small>١٤ كتاباً من كتب العلماء</small></a></div>
        <div class="muted" style="font-size:12.5px;margin-top:10px">المنهج: كل فكرة بدليلها من القرآن والسنة الصحيحة، ونقول من كتب أهل العلم الموجودة في المكتبة. ونخاطب الناس بالاحترام والرحمة، فالغاية هدايتهم لا الغلبة عليهم.</div>`;
      return;
    }
    const T = P.topics.find(t => t.id === tid);
    if (!T) {
      el.innerHTML = `<a class="btn sm" href="#/dawah">← الدعوة</a><h1>${P.ic} ${esc(P.name)}</h1><p>${esc(P.intro)}</p>
        <div class="bt-list">${P.topics.map((t, i) => `<a class="bt-row" href="#/dawah/${P.id}/${t.id}" style="text-decoration:none;color:inherit"><b>${D(i + 1)}. ${esc(t.t)}</b><small class="muted">${esc(t.intro.slice(0, 90))}${t.intro.length > 90 ? '…' : ''}</small></a>`).join('')}</div>
        ${W.tips[P.id] ? `<div class="card"><h3>💡 نصائح عملية</h3><ul>${W.tips[P.id].map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}`;
      return;
    }
    const i = P.topics.indexOf(T), prev = P.topics[i - 1], next = P.topics[i + 1];
    el.innerHTML = `<a class="btn sm" href="#/dawah/${P.id}">← ${esc(P.name)}</a><h1>${esc(T.t)}</h1><div class="card dw-intro">${esc(T.intro)}</div>
      ${T.points.map(pt => `<div class="card tb-item"><h3>${esc(pt.t)}</h3>${pt.d ? `<p>${esc(pt.d)}</p>` : ''}${evHtml(pt.ev)}</div>`).join('')}
      <div class="row" style="gap:8px;margin-top:8px">${prev ? `<a class="btn" href="#/dawah/${P.id}/${prev.id}">→ ${esc(prev.t)}</a>` : ''}<span class="spacer"></span>${next ? `<a class="btn primary" href="#/dawah/${P.id}/${next.id}">${esc(next.t)} ←</a>` : ''}</div>`;
  };
  window.DAWAH_APP = { load };
})();
