/* 🌙 مواسم الطاعات: رمضان، والعشر الأواخر، وست شوال، والعشر من ذي الحجة، وعرفة، وعاشوراء، وشعبان، والأيام البيض…
   لكل موسم: موعده القادم بالهجري والميلادي وعدّ تنازلي، وفضله مع الدليل، وبرنامج أعمال مقترح، وتنبيه قبله بيوم وفي يومه. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  // [المعرّف، الرمز، الاسم، الشهر، من يوم، إلى يوم، الفضل، الدليل، الأعمال]
  const S = [
    ['ramadan', '🌙', 'شهر رمضان', 9, 1, 30, 'شهر الصيام والقيام والقرآن، تُفتح فيه أبواب الجنة وتُغلق أبواب النار.', '«من صام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه» — متفق عليه.', ['صيام الشهر بنية خالصة', 'صلاة التراويح مع الإمام حتى ينصرف', 'ختمة على الأقل، ووِرد يومي ثابت', 'تفطير الصائمين والصدقة', 'حفظ اللسان والوقت']],
    ['last10', '✨', 'العشر الأواخر وليلة القدر', 9, 21, 30, 'فيها ليلة القدر، خير من ألف شهر، وكان النبي ﷺ يجتهد فيها ما لا يجتهد في غيرها.', '«تحرّوا ليلة القدر في الوتر من العشر الأواخر من رمضان» — رواه البخاري.', ['إحياء الليل بالصلاة والقرآن والدعاء', 'الاعتكاف لمن استطاع', 'الإكثار من: اللهم إنك عفو تحب العفو فاعفُ عني', 'إيقاظ الأهل للصلاة', 'زكاة الفطر قبل صلاة العيد']],
    ['shawwal', '🌸', 'ست من شوال', 10, 2, 29, 'صيام ستة أيام من شوال بعد رمضان أجره كصيام الدهر.', '«من صام رمضان ثم أتبعه ستاً من شوال كان كصيام الدهر» — رواه مسلم.', ['صيامها بعد يوم العيد متتابعة أو متفرقة', 'المبادرة بها قبل أن تشغلك الأعمال', 'من عليه قضاء من رمضان يبدأ بالقضاء']],
    ['dhul10', '🕋', 'العشر الأوائل من ذي الحجة', 12, 1, 10, 'أفضل أيام الدنيا، والعمل الصالح فيها أحب إلى الله من غيرها.', '«ما من أيام العمل الصالح فيهن أحب إلى الله من هذه الأيام العشر» — رواه البخاري.', ['الإكثار من التكبير والتهليل والتحميد', 'صيام التسعة الأولى أو ما تيسر منها', 'الصدقة وصلة الرحم', 'الأضحية لمن قدر، والإمساك عن الشعر والأظفار لمن أراد أن يضحي', 'التوبة والإكثار من النوافل']],
    ['arafa', '⛰️', 'يوم عرفة', 12, 9, 9, 'خير يوم طلعت عليه الشمس، يُكثر الله فيه العتق من النار.', '«صيام يوم عرفة أحتسب على الله أن يكفّر السنة التي قبله والسنة التي بعده» — رواه مسلم.', ['صيامه لغير الحاج', 'الإكثار من: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', 'الدعاء طول اليوم وخاصة آخره', 'التكبير المقيد بعد الصلوات من فجر عرفة']],
    ['adha', '🐑', 'عيد الأضحى وأيام التشريق', 12, 10, 13, 'يوم النحر أعظم الأيام عند الله، وأيام التشريق أيام أكل وشرب وذكر لله.', '«أيام التشريق أيام أكل وشرب وذكر لله» — رواه مسلم.', ['صلاة العيد والتكبير', 'ذبح الأضحية والأكل والإهداء والصدقة منها', 'صلة الرحم وإدخال السرور', 'لا يُصام يوم العيد ولا أيام التشريق']],
    ['muharram', '📅', 'شهر الله المحرم', 1, 1, 29, 'أول شهور السنة الهجرية، وأفضل الصيام بعد رمضان صيامه.', '«أفضل الصيام بعد رمضان شهر الله المحرم» — رواه مسلم.', ['الإكثار من الصيام فيه', 'محاسبة النفس مع بداية العام', 'التوبة وتجديد العزم']],
    ['ashura', '🌊', 'تاسوعاء وعاشوراء', 1, 9, 10, 'اليوم الذي نجّى الله فيه موسى عليه السلام، وصيامه يكفّر سنة.', '«صيام يوم عاشوراء أحتسب على الله أن يكفّر السنة التي قبله» — رواه مسلم.', ['صيام التاسع والعاشر', 'أو العاشر والحادي عشر', 'شكر الله على نصره لأوليائه']],
    ['shaban', '🌿', 'شهر شعبان', 8, 1, 29, 'شهر يغفل عنه الناس بين رجب ورمضان، تُرفع فيه الأعمال إلى الله.', 'قالت عائشة رضي الله عنها: «ما رأيته أكثر صياماً منه في شعبان» — رواه البخاري.', ['الإكثار من الصيام', 'قضاء ما فات من رمضان', 'التهيؤ لرمضان: ورد قرآن، وتوبة، وتنظيم للوقت']],
    ['beed', '🌕', 'الأيام البيض', 0, 13, 15, 'صيام ثلاثة أيام من كل شهر كصيام الدهر، وأفضلها الأيام البيض.', 'أوصى النبي ﷺ بصيام ثلاثة أيام من كل شهر — متفق عليه.', ['صيام ١٣ و١٤ و١٥ من كل شهر هجري', 'من فاتته صام ثلاثة غيرها']],
  ];
  // الموعد القادم (أو الجاري) لموسم: { from, to, now }
  function next(x) {
    if (!window.HIJRI) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const h = HIJRI.g2h(today); if (!h) return null;
    const tries = x[3] === 0 ? [[h.y, h.m], h.m === 12 ? [h.y + 1, 1] : [h.y, h.m + 1]] : [[h.y, x[3]], [h.y + 1, x[3]]];
    for (const [y, m] of tries) {
      const a = HIJRI.h2g(y, m, x[4]); if (!a) continue;
      let b = HIJRI.h2g(y, m, Math.min(x[5], 29)); if (!b) continue;
      if (x[5] === 30) { const len = HIJRI.monthLen(y, m); b = new Date(a); b.setDate(a.getDate() + len - x[4]); }
      if (b >= today) return { from: a, to: b, now: a <= today, y, m };
    }
    return null;
  }
  const days = (a, b) => Math.round((a - b) / 864e5);
  const gS = d => d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  async function cfg() { return Object.assign({ on: true }, (await DB.setting('mawasim-cfg')) || {}); }

  V.mawasim = async (el, [id]) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = S.map(x => ({ x, n: next(x) })).filter(r => r.n).sort((a, b) => (a.n.now ? -1 : 0) - (b.n.now ? -1 : 0) || a.n.from - b.n.from);
    if (id) {
      const r = rows.find(r => r.x[0] === id) || { x: S.find(x => x[0] === id), n: null }; if (!r.x) { location.replace('#/mawasim'); return; }
      const [, ic, t, , , , fadl, dalil, acts] = r.x;
      el.innerHTML = `<div class="row"><a class="btn sm" href="#/mawasim">← المواسم</a></div>
        <div class="card mw-head"><span class="mw-ic">${ic}</span><h2>${esc(t)}</h2>${r.n ? `<div>${r.n.now ? '🟢 الموسم قائم الآن — حتى ' + gS(r.n.to) : '⏳ بعد ' + D(days(r.n.from, today)) + ' يوماً — ' + gS(r.n.from)}</div><small class="muted">${esc(HIJRI.hStr({ y: r.n.y, m: r.n.m, d: r.x[4] }))}</small>` : ''}</div>
        <div class="card"><h3 style="margin-top:0">🌟 فضله</h3><p>${esc(fadl)}</p><p class="muted">${esc(dalil)}</p></div>
        <div class="card"><h3 style="margin-top:0">📋 برنامجك المقترح</h3><ul class="mw-acts">${acts.map((a, i) => `<li><label><input type="checkbox" data-a="${i}"> ${esc(a)}</label></li>`).join('')}</ul></div>`;
      const key = 'mw-' + id + '-' + (r.n ? r.n.y : ''), st = (await DB.setting(key)) || {};
      el.querySelectorAll('[data-a]').forEach(c => { c.checked = !!st[c.dataset.a]; c.onchange = async () => { st[c.dataset.a] = c.checked; await DB.setting(key, st); }; });
      return;
    }
    const c = await cfg();
    el.innerHTML = `<h1>🌙 مواسم الطاعات</h1>
      <div class="sub">«إن لربكم في أيام دهركم نفحات فتعرّضوا لها». تابع المواسم القادمة، واعرف فضلها، واتّبع برنامجاً مقترحاً لكل موسم.</div>
      <div class="card"><label class="fld"><input type="checkbox" id="mwOn" ${c.on ? 'checked' : ''}> 🔔 نبّهني قبل كل موسم بيوم، وفي أول يوم منه</label></div>
      <div class="mw-list">${rows.map(({ x, n }) => `<a class="card mw-row ${n.now ? 'now' : ''}" href="#/mawasim/${x[0]}"><span class="mw-ic">${x[1]}</span><span class="mw-t"><b>${esc(x[2])}</b><small class="muted">${n.now ? '🟢 قائم الآن' : gS(n.from)}</small></span><span class="mw-d">${n.now ? 'الآن' : D(days(n.from, today)) + '<small>يوماً</small>'}</span></a>`).join('')}</div>
      <div class="muted" style="font-size:12px;margin-top:8px">التواريخ الهجرية حسابية (تقويم أم القرى) وقد تختلف يوماً عن رؤية الهلال في بلدك — اضبط الفرق من «التقويم الهجري».</div>`;
    el.querySelector('#mwOn').onchange = async e => { await DB.setting('mawasim-cfg', { on: e.target.checked }); if (window.NOTIFY) await NOTIFY.rescheduleAll(); APP.toast(e.target.checked ? '✔ ستصلك تنبيهات المواسم' : 'أُوقفت تنبيهات المواسم'); };
  };

  if (window.NOTIFY) NOTIFY.register('mawasim', async () => {
    const c = await cfg(); if (!c.on) return [];
    const out = [];
    for (const x of S) {
      if (x[0] === 'beed') continue; // للأيام البيض تنبيه في «التقويم الهجري»
      const n = next(x); if (!n || n.now) continue;
      const before = new Date(n.from); before.setDate(before.getDate() - 1); before.setHours(20, 0, 0, 0);
      const day = new Date(n.from); day.setHours(7, 0, 0, 0);
      out.push({ title: x[1] + ' غداً: ' + x[2], body: x[6], at: before, route: '#/mawasim/' + x[0] });
      out.push({ title: x[1] + ' بدأ ' + x[2], body: 'اطّلع على برنامجك المقترح لهذا الموسم', at: day, route: '#/mawasim/' + x[0] });
    }
    return out;
  });
  window.MAWASIM = { S, next };
})();
