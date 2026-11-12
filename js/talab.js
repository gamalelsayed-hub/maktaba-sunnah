/* 🎓 طلب العلم: منهج متدرج من التأسيس إلى المطولات — مسار عام أو تخصص، مع متابعة التقدم */
(function () {
  const { esc, $ } = APP;
  const C = window.CURRICULUM;
  const STATUS = { no: 'لم أبدأ', doing: 'أقرأ الآن', done: 'أنهيته ✔' };
  const MADHHAB = { hanbali: 'الحنبلي', shafii: 'الشافعي', maliki: 'المالكي', hanafi: 'الحنفي' };

  async function state() {
    return Object.assign({ track: '', science: 'aqida', madhhab: 'hanbali', status: {}, started: '' }, (await DB.setting('talab')) || {});
  }
  const save = s => DB.setting('talab', s);

  // الكتب حسب المسار: العام = كل العلوم (والفقه بالمذهب المختار) مستوى بمستوى، والتخصص = علم واحد بعمق
  function booksFor(s) {
    const sci = C.sciences, fq = C.fiqh;
    const tag = (arr, name) => arr.map(b => Object.assign({ science: name }, b));
    if (s.track === 'general') {
      let all = [];
      for (const k of Object.keys(sci)) all = all.concat(tag(sci[k].books, sci[k].name));
      all = all.concat(tag(fq[s.madhhab].books, fq[s.madhhab].name));
      return all;
    }
    if (s.science === 'fiqh') return tag(fq[s.madhhab].books, fq[s.madhhab].name).concat(tag(fq.muqaran.books, fq.muqaran.name)).concat(tag(sci.usul.books, sci.usul.name));
    const base = sci[s.science] ? tag(sci[s.science].books, sci[s.science].name) : [];
    // تمهيد مشترك لكل تخصص: متون المستوى الأول من العقيدة واللغة
    const prelim = s.science !== 'aqida' && s.science !== 'lugha' ? tag(sci.aqida.books.filter(b => b.level === 1), 'تمهيد: العقيدة').concat(tag(sci.lugha.books.filter(b => b.level === 1), 'تمهيد: اللغة')) : [];
    return prelim.concat(base);
  }

  function libId(b) { return b.lib || (b.v ? IMPORT.slug(b.v) : ''); }
  function installed(b) { const id = libId(b); return id && (APP.state.books[id] || {}).count; }

  APP.views.talab = async (el, _, p) => {
    const s = await state();
    if (p.track) { s.track = p.track; if (p.science) s.science = p.science; if (!s.started) s.started = new Date().toISOString(); await save(s); location.replace('#/talab'); return; }
    if (!s.track) {
      el.innerHTML = `<h1>🎓 طلب العلم</h1>
        <div class="sub">منهج متدرج في العلوم الشرعية، يبدأ بالمتون المختصرة ثم شروحها ثم المطولات — على طريقة أهل العلم في التدرج. اختر مسارك (تقدر تغيّره في أي وقت):</div>
        <div class="choice">
          <a class="tile" href="#/talab?track=general"><b>📚 المسار العام</b>تأسيس متوازن في كل العلوم: العقيدة، والفقه على مذهبك، والحديث ومصطلحه، والتفسير وعلوم القرآن، والأصول، واللغة، والسيرة، والآداب — مستوى بمستوى.</a>
          <div class="tile"><b>🎯 التخصص</b>تعمّق في علم واحد من أوله إلى مطولاته:
            <div class="row" style="margin-top:8px">${Object.entries(C.sciences).map(([k, v]) => `<a class="btn sm" href="#/talab?track=special&science=${k}">${esc(v.name)}</a>`).join('')}<a class="btn sm" href="#/talab?track=special&science=fiqh">الفقه وأصوله</a></div></div>
        </div>
        <a class="tile" href="#/tajweed" style="display:block;margin:12px 0"><b>🎙️ ابدأ بتصحيح التلاوة: تعلّم التجويد من الصفر</b> دروس قصيرة بأمثلة صوتية من المصحف واختبار لكل درس — يُستحسن قبل أي مسار.</a>
        <div class="warn">هذا منهج مقترح مبني على المتون المشهورة في التدرج، ويُستحسن أن يكون الطلب على يد شيخ أو عبر شروح أهل العلم المسموعة. والمراجع العلمي يقدر يعدّله.</div>`;
      return;
    }
    if (p.exam) {
      const lv = +p.exam, qs = EXAMS.examFor(lv, s.track, s.science);
      el.innerHTML = `<div class="row"><h1>📝 اختبار ${esc(C.levels[lv - 1])}</h1><span class="spacer"></span><a class="btn" href="#/talab">رجوع للمنهج</a></div><div id="exBox"></div>`;
      if (!qs.length) { $('#exBox').innerHTML = '<div class="info">لا توجد أسئلة لهذا المستوى في هذا التخصص بعد.</div>'; return; }
      EXAMS.runQuiz($('#exBox'), {
        sub: `${qs.length} سؤالاً من كتب هذا المستوى. النجاح من 70٪. <span class="muted">(أسئلة مقترحة تحت المراجعة العلمية)</span>`, qs,
        onDone: async r => { s.exams = s.exams || {}; const k = (s.track === 'general' ? 'g' : s.science) + '-' + lv, old = s.exams[k]; if (!old || r.pct >= old.pct) s.exams[k] = { pct: r.pct, at: Date.now(), passed: r.passed }; await save(s); }
      });
      return;
    }
    const books = booksFor(s);
    const exKey = lv => (s.track === 'general' ? 'g' : s.science) + '-' + lv, exRes = lv => (s.exams || {})[exKey(lv)];
    const done = books.filter(b => s.status[b.id] === 'done').length;
    const pct = books.length ? Math.round(done / books.length * 100) : 0;
    const current = C.levels.findIndex((_, i) => books.some(b => b.level === i + 1 && s.status[b.id] !== 'done'));
    const title = s.track === 'general' ? 'المسار العام' : 'تخصص: ' + (s.science === 'fiqh' ? 'الفقه وأصوله' : C.sciences[s.science].name);
    el.innerHTML = `<div class="row"><h1>🎓 ${esc(title)}</h1><span class="spacer"></span>
        ${(s.track === 'general' || s.science === 'fiqh') ? `<label>المذهب: <select id="tMad">${Object.entries(MADHHAB).map(([k, v]) => `<option value="${k}" ${k === s.madhhab ? 'selected' : ''}>${v}</option>`).join('')}</select></label>` : ''}
        <button class="btn" id="tChange">تغيير المسار</button></div>
      <div class="card"><div class="row"><b>تقدمك: ${done} من ${books.length} كتاباً (${pct}%)</b><span class="spacer"></span>${current >= 0 ? '<span class="tag st-fix">أنت الآن في ' + esc(C.levels[current]) + '</span>' : '<span class="tag st-ok">أتممت المنهج — بارك الله فيك</span>'}</div>
        <div class="progress" style="margin-top:8px"><div style="width:${pct}%"></div></div></div>
      ${C.levels.map((lv, i) => {
        const arr = books.filter(b => b.level === i + 1);
        if (!arr.length) return '';
        const d = arr.filter(b => s.status[b.id] === 'done').length;
        const ex = exRes(i + 1);
        return `<div class="row" style="margin-top:18px"><h2 style="margin:0">${esc(lv)} <small class="muted">(${d}/${arr.length})</small></h2><span class="spacer"></span>
          ${ex ? `<span class="tag ${ex.passed ? 'st-ok' : 'st-fix'}">${ex.passed ? '✔ ناجح' : 'آخر محاولة'} ${ex.pct}٪</span>` : ''}
          <a class="btn sm ${d === arr.length && !(ex && ex.passed) ? 'primary' : ''}" href="#/talab?exam=${i + 1}">📝 ${ex ? 'أعد ' : ''}اختبار المستوى</a></div>` + arr.map(b => {
          const st = s.status[b.id] || 'no', inst = installed(b);
          const act = inst ? `<a class="btn sm primary" href="#/book/${libId(b)}">📖 افتح الكتاب</a>`
            : b.lib ? `<a class="btn sm" href="#/library">ثبّته من المكتبة</a>`
            : b.v ? `<button class="btn sm primary" data-dl="${esc(b.id)}">⬇ تحميل</button>`
            : `<a class="btn sm" href="#/library?cq=${encodeURIComponent(b.q || b.t)}">ابحث في الفهرس</a>`;
          return `<div class="card ${st === 'done' ? 'hl-green' : st === 'doing' ? 'hl-yellow' : ''}"><div class="row"><b>${esc(b.t)}</b> <span class="muted">— ${esc(b.a)}</span><span class="spacer"></span><span class="tag">${esc(b.science)}</span></div>
            <div class="row" style="margin-top:8px">${act}
              <select data-st="${esc(b.id)}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === st ? 'selected' : ''}>${v}</option>`).join('')}</select>
              <a class="btn sm" href="#/search?q=${encodeURIComponent(b.t)}&nodirect=1">🔎 شروح ومواضع</a></div></div>`;
        }).join('');
      }).join('')}
      <div class="warn" style="margin-top:16px">منهج مقترح مبني على المتون المشهورة في التدرج، ويُستحسن أن يكون الطلب على يد شيخ أو عبر شروح أهل العلم. اكتب ملاحظاتك على كل كتاب من زر 📝.</div>`;
    el.querySelectorAll('[data-st]').forEach(x => x.onchange = async () => { s.status[x.dataset.st] = x.value; await save(s); APP.rerender(); });
    if ($('#tMad')) $('#tMad').onchange = async e => { s.madhhab = e.target.value; await save(s); APP.rerender(); };
    $('#tChange').onclick = async () => { s.track = ''; await save(s); APP.rerender(); };
    el.querySelectorAll('[data-dl]').forEach(btn => btn.onclick = async () => {
      const b = books.find(x => x.id === btn.dataset.dl);
      const r = await APP.downloadBook({ v: b.v, u: b.u, t: b.found || b.t, a: b.a }, btn);
      if (r) APP.rerender();
    });
  };
})();
