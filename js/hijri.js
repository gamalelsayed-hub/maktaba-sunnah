/* 📅 التقويم الهجري (أم القرى) وأيام الصيام المسنونة والمنهي عنها، مع التذكير بها.
   يمكن تعديل التقويم ±يومين ليوافق رؤية البلد. */
(function () {
  const { esc } = APP;
  const V = APP.views;
  const D = AR.toArabicDigits;
  const MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const DEF = { adj: 0, monThu: false, beed: true, special: true, time: '21:00' };
  let CFG = Object.assign({}, DEF);
  const loadCfg = async () => (CFG = Object.assign({}, DEF, (await DB.setting('hijri-cfg')) || {}));

  // ===== التحويل =====
  let fmt = null;
  try { fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' }); } catch (e) { }
  const utc = d => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
  function g2h(date, adj) {
    const d = utc(date); d.setUTCDate(d.getUTCDate() + (adj === undefined ? CFG.adj : adj));
    if (!fmt) return null;
    const p = {}; fmt.formatToParts(d).forEach(x => { p[x.type] = +x.value; });
    return { y: p.year, m: p.month, d: p.day };
  }
  const hkey = h => h.y * 400 + h.m * 32 + h.d;
  function h2g(y, m, d) {
    const now = new Date(); const t = g2h(now);
    if (!t) return null;
    const g = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    g.setDate(g.getDate() + Math.round(((y - t.y) * 12 + (m - t.m)) * 29.5306 + (d - t.d)));
    for (let i = 0; i < 60; i++) {
      const c = g2h(g), dk = hkey({ y, m, d }) - hkey(c);
      if (!dk) return g;
      g.setDate(g.getDate() + (dk > 0 ? 1 : -1));
    }
    return null;
  }
  const monthLen = (y, m) => { const a = h2g(y, m, 1), b = h2g(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1); return a && b ? Math.round((b - a) / 864e5) : 30; };
  const hStr = h => D(h.d) + ' ' + MONTHS[h.m - 1] + ' ' + D(h.y) + ' هـ';
  const gStr = g => g.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ===== أحكام الأيام =====
  // يرجع: { forbid, label, kinds:[{k, t}] }
  const EV = {
    monThu: { t: 'صيام الاثنين والخميس', d: '«تُعرض الأعمال يوم الاثنين والخميس، فأحب أن يُعرض عملي وأنا صائم».', r: 'رواه الترمذي (747) وصححه الألباني. وسُئل ﷺ عن صوم يوم الاثنين فقال: «ذاك يوم وُلدتُ فيه، ويوم بُعثتُ أو أُنزل عليّ فيه» رواه مسلم (1162).' },
    beed: { t: 'الأيام البيض (13 و14 و15)', d: 'أوصى النبي ﷺ أبا هريرة بصيام ثلاثة أيام من كل شهر، وصيامها كصيام الدهر، وأرشد أبا ذر إلى صيامها في الثالث عشر والرابع عشر والخامس عشر.', r: 'الوصية متفق عليها، وتعيين الأيام البيض رواه الترمذي والنسائي، وحسّنه الترمذي.' },
    ashura: { t: 'تاسوعاء وعاشوراء', d: 'صيام عاشوراء «يكفّر السنة التي قبله»، وقال ﷺ: «لئن بقيتُ إلى قابل لأصومنّ التاسع».', r: 'رواه مسلم (1162) و(1134).' },
    muharram: { t: 'شهر الله المحرم', d: '«أفضل الصيام بعد رمضان شهرُ الله المحرّم».', r: 'رواه مسلم (1163).' },
    shaban: { t: 'الإكثار من الصيام في شعبان', d: 'قالت عائشة رضي الله عنها: «ما رأيته أكثر صياماً منه في شعبان».', r: 'رواه البخاري (1969) ومسلم.' },
    ramadan: { t: 'صيام رمضان', d: 'فرضٌ على كل مسلم مكلف قادر مقيم.', r: 'قال تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ﴾ [البقرة: 183].' },
    shawwal: { t: 'ست من شوال', d: '«من صام رمضان ثم أتبعه ستاً من شوال كان كصيام الدهر».', r: 'رواه مسلم (1164). تُصام بعد يوم العيد، متتابعة أو متفرقة.' },
    dhul10: { t: 'العشر الأوائل من ذي الحجة', d: '«ما العملُ في أيامٍ أفضلَ منها في هذه» — والصيام من العمل الصالح فيها.', r: 'رواه البخاري (969).' },
    arafa: { t: 'يوم عرفة', d: 'صيامه «يكفّر السنة التي قبله والسنة التي بعده» لغير الحاج.', r: 'رواه مسلم (1162).' },
    eid: { t: 'يوم العيد — يحرم صيامه', d: 'نهى النبي ﷺ عن صيام يوم الفطر ويوم الأضحى.', r: 'متفق عليه: البخاري (1990) ومسلم.' },
    tashriq: { t: 'أيام التشريق — يحرم صيامها', d: '«أيام التشريق أيام أكل وشرب وذكر لله».', r: 'رواه مسلم (1141). ويُرخّص للمتمتع والقارن الذي لم يجد الهدي.' },
    friday: { t: 'إفراد الجمعة بالصيام مكروه', d: '«لا يصومنّ أحدكم يوم الجمعة إلا يوماً قبله أو بعده».', r: 'متفق عليه.' },
  };
  function dayInfo(g) {
    const h = g2h(g); if (!h) return { kinds: [] };
    const w = g.getDay(), k = [];
    let forbid = false;
    if ((h.m === 10 && h.d === 1) || (h.m === 12 && h.d === 10)) { k.push('eid'); forbid = true; }
    if (h.m === 12 && h.d >= 11 && h.d <= 13) { k.push('tashriq'); forbid = true; }
    if (!forbid) {
      if (h.m === 9) k.push('ramadan');
      if (h.m === 12 && h.d === 9) k.push('arafa');
      else if (h.m === 12 && h.d <= 8) k.push('dhul10');
      if (h.m === 1 && (h.d === 9 || h.d === 10)) k.push('ashura');
      if (h.m !== 9 && h.d >= 13 && h.d <= 15) k.push('beed');
      if (h.m !== 9 && (w === 1 || w === 4)) k.push('monThu');
      if (h.m === 10 && h.d >= 2) k.push('shawwal');
      if (h.m === 8 && h.d <= 29) k.push('shaban');
      if (h.m === 1 && !k.includes('ashura')) k.push('muharram');
      if (w === 5 && !k.length) k.push('friday');
    }
    return { h, forbid, kinds: k };
  }

  // ===== الشاشة =====
  V.hijri = async (el, _, p) => {
    await loadCfg();
    if (!fmt) { el.innerHTML = '<h1>📅 التقويم الهجري</h1><div class="warn">هذا المتصفح لا يدعم التقويم الهجري. حدّث المتصفح أو استخدم تطبيق أندرويد.</div>'; return; }
    const today = new Date(), th = g2h(today);
    let y = +p.y || th.y, m = +p.m || th.m;
    const first = h2g(y, m, 1), len = monthLen(y, m);
    const prev = m === 1 ? [y - 1, 12] : [y, m - 1], next = m === 12 ? [y + 1, 1] : [y, m + 1];
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push('<div class="hc empty"></div>');
    const seen = new Set();
    for (let d = 1; d <= len; d++) {
      const g = new Date(first); g.setDate(first.getDate() + d - 1);
      const inf = dayInfo(g); inf.kinds.forEach(x => seen.add(x));
      const isT = g.toDateString() === today.toDateString();
      const cls = inf.forbid ? 'forbid' : inf.kinds.some(x => ['arafa', 'ashura', 'beed', 'ramadan'].includes(x)) ? 'major' : inf.kinds.some(x => ['monThu', 'shawwal', 'dhul10'].includes(x)) ? 'sunna' : '';
      cells.push(`<button class="hc ${cls} ${isT ? 'today' : ''}" data-g="${g.getTime()}"><b>${D(d)}</b><small>${D(g.getDate())}/${D(g.getMonth() + 1)}</small>${inf.kinds.length && inf.kinds[0] !== 'friday' && inf.kinds[0] !== 'muharram' && inf.kinds[0] !== 'shaban' ? '<i></i>' : ''}</button>`);
    }
    const last = new Date(first); last.setDate(first.getDate() + len - 1);
    el.innerHTML = `<h1>📅 التقويم الهجري والصيام</h1>
      <div class="sub">اليوم: <b>${hStr(th)}</b> — ${esc(gStr(today))}</div>
      <div class="hcal card">
        <div class="row hc-head"><a class="btn sm" href="#/hijri?y=${prev[0]}&m=${prev[1]}">→</a><span class="spacer"></span><b style="font-size:18px">${MONTHS[m - 1]} ${D(y)} هـ</b><span class="spacer"></span><a class="btn sm" href="#/hijri?y=${next[0]}&m=${next[1]}">←</a></div>
        <div class="muted" style="text-align:center;font-size:12.5px">${esc(first.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }))} — ${esc(last.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }))}${y !== th.y || m !== th.m ? ` · <a href="#/hijri">الشهر الحالي</a>` : ''}</div>
        <div class="hgrid">${WD.map(w => `<div class="hw">${w.replace('ال', '').slice(0, 3)}</div>`).join('')}${cells.join('')}</div>
        <div class="hc-legend"><span><i class="lg major"></i>صيام مؤكد</span><span><i class="lg sunna"></i>صيام مسنون</span><span><i class="lg forbid"></i>يحرم صيامه</span><span><i class="lg today"></i>اليوم</span></div>
        <div id="hcDay" class="hc-day"></div>
      </div>
      ${seen.size ? `<h2>صيام هذا الشهر وأدلته</h2>${[...seen].map(k => `<div class="card hc-ev ${k === 'eid' || k === 'tashriq' ? 'bad' : ''}"><b>${EV[k].t}</b><div>${esc(EV[k].d)}</div><small class="muted">${esc(EV[k].r)}</small></div>`).join('')}` : ''}

      <h2>🔁 تحويل التاريخ</h2>
      <div class="card"><div class="row" style="flex-wrap:wrap;gap:8px"><label>ميلادي → هجري <input type="date" id="cvG"></label><b id="cvGo" class="hc-out"></b></div>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:8px"><label>هجري → ميلادي</label><input type="number" id="cvD" min="1" max="30" placeholder="اليوم" style="width:70px"><select id="cvM">${MONTHS.map((x, i) => `<option value="${i + 1}" ${i + 1 === th.m ? 'selected' : ''}>${x}</option>`).join('')}</select><input type="number" id="cvY" value="${th.y}" style="width:90px"><button class="btn sm" id="cvHgo">حوّل</button><b id="cvHo" class="hc-out"></b></div></div>

      <h2>🔔 التذكير بالصيام</h2>
      <div class="card">
        <div class="muted" style="font-size:13px">يصلك التذكير مساء اليوم السابق للصيام.${NOTIFY.native ? '' : ' (في نسخة المتصفح يعمل التذكير ما دام التطبيق مفتوحاً فقط.)'}</div>
        <label class="fld"><input type="checkbox" id="fMT" ${CFG.monThu ? 'checked' : ''}> صيام الاثنين والخميس</label>
        <label class="fld"><input type="checkbox" id="fBD" ${CFG.beed ? 'checked' : ''}> الأيام البيض من كل شهر</label>
        <label class="fld"><input type="checkbox" id="fSP" ${CFG.special ? 'checked' : ''}> المواسم: عرفة، تاسوعاء وعاشوراء، ست من شوال، العشر من ذي الحجة، اقتراب رمضان</label>
        <label class="fld">وقت التذكير <input type="time" id="fT" value="${CFG.time}"></label>
        <label class="fld">تعديل التقويم ليوافق رؤية بلدك <select id="fAdj">${[-2, -1, 0, 1, 2].map(v => `<option value="${v}" ${CFG.adj === v ? 'selected' : ''}>${v === 0 ? 'بدون تعديل (أم القرى)' : (v > 0 ? '+' : '') + D(v) + ' يوم'}</option>`).join('')}</select></label>
        <button class="btn primary" id="fSave">حفظ</button>
      </div>`;
    const $ = s => el.querySelector(s);
    const showDay = g => {
      const inf = dayInfo(g);
      $('#hcDay').innerHTML = `<b>${esc(WD[g.getDay()])} ${hStr(inf.h)}</b> — ${esc(g.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }))}` +
        (inf.kinds.length ? inf.kinds.map(k => `<div class="${k === 'eid' || k === 'tashriq' || k === 'friday' ? 'bad' : 'good'}">• ${EV[k].t}</div>`).join('') : '<div class="muted">لا يوجد صيام مخصوص في هذا اليوم.</div>');
    };
    el.querySelectorAll('.hc[data-g]').forEach(b => b.onclick = () => { el.querySelectorAll('.hc.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); showDay(new Date(+b.dataset.g)); });
    const tb = el.querySelector('.hc.today'); showDay(tb ? new Date(+tb.dataset.g) : first);
    $('#cvG').onchange = e => { const v = e.target.value; if (!v) return; const [a, b, c] = v.split('-').map(Number); const g = new Date(a, b - 1, c); $('#cvGo').textContent = hStr(g2h(g)) + ' — ' + WD[g.getDay()]; };
    $('#cvHgo').onclick = () => { const g = h2g(+$('#cvY').value, +$('#cvM').value, +$('#cvD').value || 1); $('#cvHo').textContent = g ? gStr(g) : 'تاريخ غير صحيح'; };
    $('#fSave').onclick = async () => {
      Object.assign(CFG, { monThu: $('#fMT').checked, beed: $('#fBD').checked, special: $('#fSP').checked, time: $('#fT').value || '21:00', adj: +$('#fAdj').value });
      await DB.setting('hijri-cfg', CFG);
      if ((CFG.monThu || CFG.beed || CFG.special) && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request();
      await NOTIFY.rescheduleAll(); APP.toast('✔ حُفظ'); APP.rerender();
    };
  };

  // ===== جدولة التذكير (60 يوماً قادمة) =====
  NOTIFY.register('fasting', async () => {
    await loadCfg(); if (!fmt) return [];
    const out = [], [hh, mm] = (CFG.time || '21:00').split(':').map(Number);
    for (let k = 1; k <= 60; k++) {
      const g = new Date(); g.setHours(12, 0, 0, 0); g.setDate(g.getDate() + k);
      const inf = dayInfo(g); if (inf.forbid) continue;
      const at = new Date(g); at.setDate(at.getDate() - 1); at.setHours(hh, mm, 0, 0);
      const name = WD[g.getDay()] + ' ' + hStr(inf.h);
      const has = x => inf.kinds.includes(x), H = inf.h;
      let t = null;
      if (CFG.special && has('arafa')) t = ['🕋 غداً يوم عرفة', 'صيامه يكفّر سنتين — ' + name];
      else if (CFG.special && has('ashura')) t = [H.d === 9 ? '🌙 غداً تاسوعاء' : '🌙 غداً عاشوراء', 'يُسن صيامه — ' + name];
      else if (CFG.special && H.m === 10 && H.d === 2) t = ['🌙 ست من شوال', 'ابدأ صيام الست من شوال من الغد إن شئت'];
      else if (CFG.special && H.m === 12 && H.d === 1) t = ['🌙 دخلت عشر ذي الحجة', 'أفضل أيام الدنيا: أكثر من الصيام والذكر والعمل الصالح'];
      else if (CFG.special && H.m === 8 && H.d === 25) t = ['🌙 رمضان على الأبواب', 'بقيت أيام قليلة على رمضان، تهيّأ له'];
      else if (CFG.beed && has('beed')) t = ['🌕 ' + (H.d === 13 ? 'غداً أول الأيام البيض' : 'غداً من الأيام البيض'), name];
      else if (CFG.monThu && has('monThu')) t = ['🌙 غداً ' + WD[g.getDay()], 'يُسن صيام الاثنين والخميس — تُعرض فيهما الأعمال'];
      if (t && !has('ramadan')) out.push({ title: t[0], body: t[1], at, route: '#/hijri' });
    }
    return out;
  });

  window.HIJRI = { g2h, h2g, hStr, MONTHS, monthLen };
})();
