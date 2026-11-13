/* 📖 خطة الختمة: تختار عدد الأيام فيُقسَّم المصحف إلى أوراد متساوية (بعدد الحروف، على حدود الآيات)،
   مع ورد اليوم والمتأخر، والقراءة والاستماع، وتذكير يومي، وسجل الختمات. */
(function () {
  const { esc } = APP;
  const V = APP.views;
  const D = AR.toArabicDigits;
  const KEY = 'khatma';
  const load = async () => Object.assign({ active: null, history: [] }, (await DB.setting(KEY)) || {});
  const save = K => DB.setting(KEY, K);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parse = s => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c); };
  const dayIdx = K => Math.floor((parse(iso(new Date())) - parse(K.active.start)) / 864e5);
  const days = k => k === 1 ? 'يوم واحد' : k === 2 ? 'يومان' : k <= 10 ? D(k) + ' أيام' : D(k) + ' يوماً';
  const pos = (s, a) => 'سورة ' + AR.SURAHS[s - 1] + ' ' + D(a);

  let QW = null; // [[s, a, وزن]]
  async function weights() {
    if (QW) return QW;
    const ay = (await DB.byIndex('items', 'bookId', 'quran')).sort((x, y) => x.surah - y.surah || x.ayah - y.ayah);
    QW = ay.map(x => {
      let t = x.text; if (x.ayah === 1 && x.surah !== 1 && x.surah !== 9 && t.startsWith('بِسْمِ')) t = t.split(' ').slice(4).join(' ');
      return [x.surah, x.ayah, t.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ\s]/g, '').length];
    });
    return QW;
  }
  async function split(n) {
    const w = await weights(), total = w.reduce((a, x) => a + x[2], 0);
    // إن كان عدد الأيام يقسم الثلاثين: أوراد على حدود الأجزاء المعروفة
    if (window.QA && QA.JUZ && 30 % n === 0) {
      const g = 30 / n, idx = ([s, a]) => w.findIndex(x => x[0] === s && x[1] === a);
      const out = [];
      for (let i = 0; i < n; i++) {
        const st = idx(QA.JUZ[i * g]), en = i === n - 1 ? w.length - 1 : idx(QA.JUZ[(i + 1) * g]) - 1;
        const wt = w.slice(st, en + 1).reduce((x, y) => x + y[2], 0);
        out.push([w[st][0], w[st][1], w[en][0], w[en][1], Math.round(604 * wt / total * 10) / 10, g]);
      }
      return out;
    }
    const parts = []; let acc = 0, start = 0;
    for (let i = 0; i < w.length; i++) {
      acc += w[i][2];
      const target = total * (parts.length + 1) / n;
      if (parts.length < n - 1 && acc >= target) {
        // نختار الحد الأقرب للهدف (قبل هذه الآية أو بعدها)
        const before = acc - w[i][2];
        const end = (target - before < acc - target && i > start) ? i - 1 : i;
        parts.push([start, end]); start = end + 1;
      }
    }
    parts.push([start, w.length - 1]);
    return parts.map(([a, b]) => { const wt = w.slice(a, b + 1).reduce((x, y) => x + y[2], 0); return [w[a][0], w[a][1], w[b][0], w[b][1], Math.round(604 * wt / total * 10) / 10]; });
  }
  const ayatOf = async p => (await weights()).filter(([s, a]) => (s > p[0] || (s === p[0] && a >= p[1])) && (s < p[2] || (s === p[2] && a <= p[3]))).map(([s, a]) => [s, a]);
  const partName = p => pos(p[0], p[1]) + ' ← ' + pos(p[2], p[3]);

  V.khatma = async (el, parts) => {
    const K = await load();
    // ===== قراءة ورد =====
    if (parts && parts[0] === 'read' && K.active) {
      const i = +parts[1], p = K.active.parts[i]; if (!p) { location.hash = '#/khatma'; return; }
      const list = await ayatOf(p);
      const all = await DB.byIndex('items', 'bookId', 'quran'); const map = new Map(all.map(x => [x.surah + ':' + x.ayah, x]));
      el.innerHTML = `<div class="row"><h1>📖 الورد ${D(i + 1)} من ${D(K.active.parts.length)}</h1><span class="spacer"></span><a class="btn sm" href="#/khatma">← الختمة</a></div>
        <div class="sub">${esc(partName(p))} — نحو ${D(p[4])} صفحة</div>
        <div class="row" style="gap:8px;margin-bottom:10px;flex-wrap:wrap"><button class="btn primary" id="khPlay">▶ استمع للورد</button><span class="muted" style="font-size:13px">اضغط على أي آية لتفسيرها ومعاني كلماتها وتجويدها</span></div>
        <div class="mushaf"><div class="mushaf-text quran-text">${list.map(([s, a]) => { const x = map.get(s + ':' + a); if (!x) return ''; let t = x.text; const head = a === 1 ? `</div><div class="surah-head"><span></span><b>سورة ${esc(AR.SURAHS[s - 1])}</b><span></span></div>${s !== 1 && s !== 9 ? '<div class="basmala">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>' : ''}<div class="mushaf-text quran-text">` : ''; if (a === 1 && s !== 1 && t.startsWith('بِسْمِ')) t = t.split(' ').slice(4).join(' '); return `${head}<span class="ay" data-card="${x.id}">${esc(t)}</span><a class="ayah-num" href="#/item/${x.id}">${D(a)}</a> `; }).join('')}</div></div>
        <div class="row" style="gap:8px;margin:14px 0"><button class="btn primary" id="khDone">${K.active.done[i] ? '✔ مقروء — إلغاء العلامة' : '✔ أتممت هذا الورد'}</button></div>`;
      el.querySelector('#khPlay').onclick = () => QA.play(list);
      el.querySelectorAll('.mushaf-text').forEach(m => m.onclick = e => {
        const sp = e.target.closest('.ay'); if (!sp) return; const it = map.get(sp.dataset.card.slice(6));
        APP.modal(`<div class="row"><b>${esc(pos(it.surah, it.ayah))}</b><span class="spacer"></span><button class="icon-btn" onclick="APP.closeModal()" style="color:var(--muted)">✕</button></div><div class="quran-text" style="margin:8px 0">${esc(it.text)}</div><button class="btn sm primary" id="m1">🔊 استمع</button><div id="mAp"></div>`, b => { b.querySelector('#m1').onclick = () => QA.play([[it.surah, it.ayah]], { noBasmala: true }); AYAH.panel(b.querySelector('#mAp'), it); });
      });
      el.querySelector('#khDone').onclick = async () => {
        if (K.active.done[i]) delete K.active.done[i]; else K.active.done[i] = iso(new Date());
        const fin = Object.keys(K.active.done).length >= K.active.parts.length;
        if (fin) { K.history.push({ start: K.active.start, end: iso(new Date()), days: K.active.parts.length }); K.active = null; await save(K); await NOTIFY.rescheduleAll(); APP.toast('🎉 ختمت القرآن! تقبّل الله منك', 7000); location.hash = '#/khatma'; return; }
        await save(K); await NOTIFY.rescheduleAll(); APP.toast('✔ بارك الله فيك'); location.hash = '#/khatma';
      };
      return;
    }
    // ===== لا توجد ختمة: إنشاء =====
    if (!K.active) {
      el.innerHTML = `<h1>📖 خطة ختمة القرآن</h1>
        <div class="sub">اختر في كم يوم تريد أن تختم، فيُقسَّم المصحف إلى أوراد متساوية، ويذكّرك التطبيق كل يوم بوردك.</div>
        <div class="card">
          <div class="row" style="flex-wrap:wrap;gap:6px">${[[7, 'أسبوع'], [10, '١٠ أيام'], [15, '١٥ يوماً'], [20, '٢٠ يوماً'], [30, 'شهر (جزء يومياً)'], [60, 'شهران'], [90, '٣ أشهر']].map(([n, l]) => `<button class="btn sm" data-n="${n}">${l}</button>`).join('')}</div>
          <label class="fld">أو عدد أيام آخر <input type="number" id="khN" min="3" max="365" value="30" style="width:90px"></label>
          <label class="fld">تبدأ من <input type="date" id="khS" value="${iso(new Date())}"></label>
          <label class="fld"><input type="checkbox" id="khR" checked> ذكّرني بوردي كل يوم الساعة <input type="time" id="khT" value="20:00"></label>
          <div id="khPrev" class="muted" style="margin:6px 0"></div>
          <button class="btn primary" id="khGo">ابدأ الختمة</button>
        </div>
        ${K.history.length ? `<h2>ختماتي السابقة (${D(K.history.length)})</h2>${K.history.slice().reverse().map(h => `<div class="card row"><b>🎉 ختمة في ${days(h.days)}</b><span class="spacer"></span><small class="muted">${esc(parse(h.start).toLocaleDateString('ar-EG'))} ← ${esc(parse(h.end).toLocaleDateString('ar-EG'))}</small></div>`).join('')}` : ''}
        <div class="gd-tip">💡 «اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه» — رواه مسلم. وقال ﷺ لعبد الله بن عمرو: «اقرأه في سبع ولا تزد على ذلك» (متفق عليه)، وقال: «لا يفقه من قرأه في أقل من ثلاث» (رواه أبو داود والترمذي وصححه).</div>`;
      const prev = () => { const n = +el.querySelector('#khN').value || 30; el.querySelector('#khPrev').textContent = 'وردك اليومي نحو ' + D(Math.round(604 / n * 10) / 10) + ' صفحة (≈ ' + D(Math.round(30 / n * 10) / 10) + ' جزء).'; };
      el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { el.querySelector('#khN').value = b.dataset.n; prev(); });
      el.querySelector('#khN').oninput = prev; prev();
      el.querySelector('#khGo').onclick = async () => {
        const n = Math.max(3, Math.min(365, +el.querySelector('#khN').value || 30));
        K.active = { start: el.querySelector('#khS').value || iso(new Date()), parts: await split(n), done: {}, remind: el.querySelector('#khR').checked, time: el.querySelector('#khT').value || '20:00' };
        await save(K);
        if (K.active.remind && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request();
        await NOTIFY.rescheduleAll(); APP.rerender();
      };
      return;
    }
    // ===== لوحة الختمة =====
    const A = K.active, n = A.parts.length, ti = Math.max(0, dayIdx(K)), doneN = Object.keys(A.done).length;
    const next = A.parts.findIndex((p, i) => !A.done[i]);
    const due = Math.min(n, ti + 1), behind = Math.max(0, due - doneN);
    const endDate = parse(A.start); endDate.setDate(endDate.getDate() + n - 1);
    el.innerHTML = `<div class="row"><h1>📖 ختمتي</h1><span class="spacer"></span><button class="btn sm" id="khStop">إنهاء/إعادة</button></div>
      <div class="sub">ختمة في ${days(n)} — من ${esc(parse(A.start).toLocaleDateString('ar-EG'))} إلى ${esc(endDate.toLocaleDateString('ar-EG'))}</div>
      <div class="kh-prog"><i style="width:${Math.round(doneN / n * 100)}%"></i></div>
      <div class="row muted" style="font-size:13px"><span>أتممت ${D(doneN)} من ${D(n)} ورداً (${D(Math.round(doneN / n * 100))}٪)</span><span class="spacer"></span><span>${behind > 1 ? '⚠️ متأخر ' + days(behind - 1) + ' — تقدر تعوّض' : behind === 0 ? '✔ أنت على الموعد أو متقدم' : ''}</span></div>
      ${next >= 0 ? `<div class="card kh-today"><b>${next < ti ? '📌 الورد التالي (متأخر)' : next === ti ? '☀️ وردك اليوم' : '⏩ الورد القادم (متقدم)'}: الورد ${D(next + 1)}</b><div>${esc(partName(A.parts[next]))}</div><div class="muted">${A.parts[next][5] ? (A.parts[next][5] === 1 ? 'جزء كامل' : D(A.parts[next][5]) + ' أجزاء') + ' — ' : ''}نحو ${D(A.parts[next][4])} صفحة</div>
        <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><a class="btn primary" href="#/khatma/read/${next}">📖 اقرأ الورد</a><button class="btn" id="khListen">▶ استمع</button><button class="btn" id="khMark">✔ قرأته</button></div></div>` : ''}
      <h2>كل الأوراد</h2>
      <div class="kh-days">${A.parts.map((p, i) => `<a href="#/khatma/read/${i}" title="${esc(partName(p))}"><span class="${A.done[i] ? 'done' : ''} ${i === ti ? 'today' : ''} ${!A.done[i] && i < ti ? 'late' : ''}">${D(i + 1)}</span></a>`).join('')}</div>
      <div class="card" style="margin-top:12px"><label class="fld"><input type="checkbox" id="khR" ${A.remind ? 'checked' : ''}> تذكير يومي الساعة <input type="time" id="khT" value="${A.time}"></label><button class="btn sm" id="khSave">حفظ</button></div>`;
    if (next >= 0) {
      el.querySelector('#khListen').onclick = async () => QA.play(await ayatOf(A.parts[next]));
      el.querySelector('#khMark').onclick = async () => { A.done[next] = iso(new Date()); if (Object.keys(A.done).length >= n) { K.history.push({ start: A.start, end: iso(new Date()), days: n }); K.active = null; APP.toast('🎉 ختمت القرآن! تقبّل الله منك', 7000); } await save(K); await NOTIFY.rescheduleAll(); APP.rerender(); };
    }
    el.querySelector('#khSave').onclick = async () => { A.remind = el.querySelector('#khR').checked; A.time = el.querySelector('#khT').value || '20:00'; await save(K); await NOTIFY.rescheduleAll(); APP.toast('✔ حُفظ'); };
    el.querySelector('#khStop').onclick = async () => { if (!(await APP.ask('إنهاء هذه الختمة والبدء بخطة جديدة؟'))) return; K.active = null; await save(K); await NOTIFY.rescheduleAll(); APP.rerender(); };
  };

  NOTIFY.register('khatma', async () => {
    const K = await load(); const A = K.active; if (!A || !A.remind) return [];
    const [h, m] = (A.time || '20:00').split(':').map(Number), out = [];
    const doneToday = Object.values(A.done).includes(iso(new Date()));
    for (let k = doneToday ? 1 : 0; k < 14; k++) {
      const at = new Date(); at.setDate(at.getDate() + k); at.setHours(h, m, 0, 0);
      out.push({ title: '📖 وردك من الختمة', body: 'لا تنسَ وردك اليوم — ' + D(Object.keys(A.done).length) + ' من ' + D(A.parts.length), at, route: '#/khatma' });
    }
    return out;
  });

  window.KHATMA = { split, load };
})();
