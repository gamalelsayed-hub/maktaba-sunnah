/* 💰 حاسبة الزكاة وسجل الأموال الزكوية: النقود والذهب والفضة وعروض التجارة والديون المرجوّة،
   والأنعام (الإبل والبقر والغنم) والزروع والثمار، مع حساب الحول الهجري والتذكير بقربه. */
(function () {
  const { esc } = APP;
  const V = APP.views;
  const D = AR.toArabicDigits;
  const KEY = 'zakat-data';
  const DEF = { basis: 'gold', gold: 0, silver: 0, cur: 'ريال', jewelry: 'exclude', deduct: false, debts: 0, hawl: '', remind: true, assets: [], paid: [] };
  const load = async () => Object.assign({}, DEF, (await DB.setting(KEY)) || {});
  const save = Z => DB.setting(KEY, Z);
  const n = v => +(+v || 0).toFixed(2);
  const money = (v, Z) => (Math.round(v * 100) / 100).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ' + Z.cur;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const NISAB_GOLD = 85, NISAB_SILVER = 595, NISAB_CROP = 612;

  const TYPES = {
    cash: { t: '💵 نقود ومدخرات وأرصدة بنكية', f: ['name', 'amount'] },
    gold: { t: '🥇 ذهب', f: ['name', 'grams', 'karat', 'jewel'] },
    silver: { t: '🥈 فضة', f: ['name', 'grams', 'purity', 'jewel'] },
    trade: { t: '📦 عروض تجارة (بضاعة للبيع بسعر السوق)', f: ['name', 'amount'] },
    debt: { t: '🧾 ديون لك على الغير مرجوّة السداد', f: ['name', 'amount'] },
    stock: { t: '📈 أسهم وصناديق للمتاجرة', f: ['name', 'amount'] },
    livestock: { t: '🐑 أنعام (إبل، بقر، غنم)', f: ['name', 'animal', 'count', 'saima', 'start'] },
    crop: { t: '🌾 زروع وثمار', f: ['name', 'kg', 'irrig', 'value'] },
  };
  const ANIMAL = { sheep: 'غنم (ضأن ومعز)', cattle: 'بقر (وجاموس)', camel: 'إبل' };
  const IRRIG = { rain: 'تُسقى بلا كلفة (مطر، أنهار، عيون) — العشر', cost: 'تُسقى بكلفة (آلات، مضخات) — نصف العشر', mix: 'مختلط بالتساوي — ثلاثة أرباع العشر' };
  const IRR_RATE = { rain: 0.10, cost: 0.05, mix: 0.075 };

  // ===== الحول الهجري =====
  const H = () => window.HIJRI;
  const parseD = s => { if (!s) return null; const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c); };
  const isoD = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function hawlDue(startStr) {
    const s = parseD(startStr); if (!s || !H()) return null;
    const h = H().g2h(s); if (!h) return null;
    const d = Math.min(h.d, H().monthLen(h.y + 1, h.m));
    return H().h2g(h.y + 1, h.m, d);
  }
  const days = k => k === 1 ? 'يوم واحد' : k === 2 ? 'يومان' : k <= 10 ? D(k) + ' أيام' : D(k) + ' يوماً';
  const daysTo = d => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(new Date().toDateString())) / 864e5);
  const hdate = d => H() ? H().hStr(H().g2h(d)) : '';

  // ===== الأنعام =====
  function combo(cnt, a, b) { // أفضل توزيع: a وحدات صغرى وb وحدات كبرى
    let best = null;
    for (let y = Math.floor(cnt / b); y >= 0; y--) { const x = Math.floor((cnt - b * y) / a); const r = cnt - a * x - b * y; if (!best || r < best.r) best = { x, y, r }; }
    return best;
  }
  const join = parts => parts.filter(Boolean).join(' و');
  const num = (k, one, two, many) => k === 1 ? one : k === 2 ? two : D(k) + ' ' + many;
  function animalDue(type, c) {
    if (type === 'sheep') {
      if (c < 40) return { none: true, nisab: 40 };
      const k = c <= 120 ? 1 : c <= 200 ? 2 : c <= 399 ? 3 : Math.floor(c / 100);
      return { due: num(k, 'شاة واحدة', 'شاتان', 'شياه'), nisab: 40 };
    }
    if (type === 'cattle') {
      if (c < 30) return { none: true, nisab: 30 };
      if (c < 40) return { due: 'تبيع أو تبيعة (ما له سنة)', nisab: 30 };
      if (c < 60) return { due: 'مُسنّة (ما لها سنتان)', nisab: 30 };
      const b = combo(c, 30, 40);
      return { due: join([b.x ? num(b.x, 'تبيع', 'تبيعان', 'أتبعة') : '', b.y ? num(b.y, 'مسنة', 'مسنتان', 'مسنّات') : '']), nisab: 30 };
    }
    if (type === 'camel') {
      if (c < 5) return { none: true, nisab: 5 };
      if (c < 25) { const k = Math.floor(c / 5); return { due: num(k, 'شاة واحدة', 'شاتان', 'شياه'), nisab: 5 }; }
      const T = [[35, 'بنت مخاض (لها سنة)'], [45, 'بنت لبون (لها سنتان)'], [60, 'حِقّة (لها ثلاث سنين)'], [75, 'جَذَعة (لها أربع سنين)'], [90, 'بنتا لبون'], [120, 'حِقّتان']];
      for (const [mx, t] of T) if (c <= mx) return { due: t, nisab: 5 };
      const b = combo(c, 40, 50);
      return { due: join([b.x ? num(b.x, 'بنت لبون', 'بنتا لبون', 'بنات لبون') : '', b.y ? num(b.y, 'حقة', 'حقتان', 'حقاق') : '']), nisab: 5 };
    }
  }

  // ===== الحساب =====
  function compute(Z) {
    const pureGold = a => n(a.grams) * (+a.karat || 24) / 24, pureSilver = a => n(a.grams) * (+a.purity || 999) / 1000;
    const rows = [];
    let total = 0;
    for (const a of Z.assets) {
      if (!['cash', 'gold', 'silver', 'trade', 'debt', 'stock'].includes(a.type)) continue;
      let v = 0, note = '';
      if (a.type === 'gold') { v = pureGold(a) * Z.gold; note = D(n(a.grams)) + ' جم عيار ' + D(a.karat || 24) + ' = ' + D(n(pureGold(a))) + ' جم خالص'; }
      else if (a.type === 'silver') { v = pureSilver(a) * Z.silver; note = D(n(a.grams)) + ' جم = ' + D(n(pureSilver(a))) + ' جم خالص'; }
      else v = n(a.amount);
      const skip = a.jewel && Z.jewelry === 'exclude';
      if (skip) note += ' — حُلي للاستعمال (غير محسوب حسب اختيارك)';
      if (!skip) total += v;
      rows.push({ a, v, note, skip });
    }
    const ded = Z.deduct ? Math.min(total, n(Z.debts)) : 0;
    const net = total - ded;
    const nisabV = Z.basis === 'gold' ? NISAB_GOLD * Z.gold : NISAB_SILVER * Z.silver;
    const priced = Z.basis === 'gold' ? Z.gold > 0 : Z.silver > 0;
    const needGold = Z.assets.some(a => a.type === 'gold') && !Z.gold, needSilver = Z.assets.some(a => a.type === 'silver') && !Z.silver;
    const reached = priced && net >= nisabV && net > 0;
    return { rows, total, ded, net, nisabV, priced, reached, due: reached ? net * 0.025 : 0, needGold, needSilver };
  }

  // ===== الشاشة =====
  V.zakat = async (el, _, p) => {
    const Z = await load();
    const C = compute(Z);
    const due = hawlDue(Z.hawl), left = due ? daysTo(due) : null;
    const lastPaid = Z.paid.length ? Z.paid[Z.paid.length - 1] : null;
    const herd = Z.assets.filter(a => a.type === 'livestock'), crops = Z.assets.filter(a => a.type === 'crop');
    const statusCard = !C.priced ? `<div class="warn">أدخل سعر جرام ${Z.basis === 'gold' ? 'الذهب عيار 24' : 'الفضة الخالصة'} في الإعدادات أدناه ليُحسب النصاب.</div>`
      : `<div class="zk-sum ${C.reached ? 'ok' : ''}">
          <div><small>مجموع الأموال الزكوية</small><b>${money(C.net, Z)}</b>${C.ded ? `<small class="muted">بعد خصم ديون ${money(C.ded, Z)}</small>` : ''}</div>
          <div><small>النصاب (${Z.basis === 'gold' ? D(NISAB_GOLD) + ' جم ذهب' : D(NISAB_SILVER) + ' جم فضة'})</small><b>${money(C.nisabV, Z)}</b></div>
          <div><small>${C.reached ? 'الزكاة الواجبة (٢٫٥٪)' : 'الحالة'}</small><b>${C.reached ? money(C.due, Z) : 'لم يبلغ النصاب'}</b></div>
        </div>`;
    const hawlCard = `<div class="card zk-hawl">
        <h3 style="margin-top:0">⏳ الحول</h3>
        ${Z.hawl ? `<div>بلغ مالُك النصاب في: <b>${hdate(parseD(Z.hawl))}</b> <small class="muted">(${esc(parseD(Z.hawl).toLocaleDateString('ar-EG'))})</small></div>
          <div>يتم الحول في: <b>${due ? hdate(due) : '—'}</b> <small class="muted">(${due ? esc(due.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) : ''})</small></div>
          <div class="${left !== null && left <= 0 ? 'bad' : left <= 30 ? 'warnt' : 'muted'}" style="margin-top:4px">${left === null ? '' : left > 0 ? 'باقي ' + days(left) : left === 0 ? 'اليوم يتم الحول — أخرج زكاتك' : 'تمّ الحول منذ ' + days(-left) + (lastPaid && parseD(lastPaid.date) >= due ? ' — وسُجّل إخراجها ✔' : ' — الزكاة مستحقة')}</div>
          ${left !== null && left <= 0 ? `<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn sm primary" id="zPay">✔ سجّل أني أخرجت ${C.reached ? money(C.due, Z) : 'الزكاة'}</button><button class="btn sm" id="zNew">بدء حول جديد من ${hdate(due)}</button></div>` : ''}`
        : '<div class="muted">لم تحدد بعد تاريخ بلوغ مالك النصاب. حدّده في الإعدادات ليُحسب لك الحول الهجري ويذكّرك بقربه.</div>'}
      </div>`;
    const assetRow = r => `<div class="zk-row"><div><b>${esc(r.a.name || TYPES[r.a.type].t)}</b><small class="muted">${r.a.name ? esc(TYPES[r.a.type].t) + (r.note ? ' — ' : '') : ''}${esc(r.note || '')}</small></div><b class="${r.skip ? 'muted' : ''}">${money(r.v, Z)}</b><button class="btn sm" data-del="${r.a.id}" title="حذف">✕</button></div>`;
    const herdRow = a => {
      const r = animalDue(a.animal, +a.count || 0); const hd = hawlDue(a.start), lf = hd ? daysTo(hd) : null;
      return `<div class="zk-row"><div><b>${esc(a.name || ANIMAL[a.animal])}</b><small class="muted">${esc(ANIMAL[a.animal])} — العدد ${D(+a.count || 0)}${a.saima === false ? ' — معلوفة' : ' — سائمة'}${hd ? ' — يتم الحول ' + hdate(hd) + (lf > 0 ? ' (بعد ' + days(lf) + ')' : ' (تم)') : ''}</small></div>
        <b>${a.saima === false ? '<span class="muted">لا زكاة فيها عند الجمهور</span>' : r.none ? '<span class="muted">دون النصاب (' + D(r.nisab) + ')</span>' : esc(r.due)}</b><button class="btn sm" data-del="${a.id}">✕</button></div>`;
    };
    const cropRow = a => {
      const kg = n(a.kg), ok = kg >= NISAB_CROP, rate = IRR_RATE[a.irrig || 'rain'];
      return `<div class="zk-row"><div><b>${esc(a.name || 'محصول')}</b><small class="muted">${D(kg)} كجم — ${esc(IRRIG[a.irrig || 'rain'])}</small></div>
        <b>${ok ? D(n(kg * rate)) + ' كجم' + (n(a.value) ? ' ≈ ' + money(kg * rate * n(a.value), Z) : '') : '<span class="muted">دون النصاب (نحو ' + D(NISAB_CROP) + ' كجم)</span>'}</b><button class="btn sm" data-del="${a.id}">✕</button></div>`;
    };
    const typeSel = p.add || 'cash';
    const fields = TYPES[typeSel].f;
    const F = {
      name: '<input id="aName" placeholder="وصف (اختياري): حساب البنك، سبيكة، محل…">',
      amount: '<input id="aAmount" type="number" inputmode="decimal" placeholder="القيمة">',
      grams: '<input id="aGrams" type="number" inputmode="decimal" placeholder="الوزن بالجرام">',
      karat: '<select id="aKarat">' + [24, 22, 21, 18].map(k => `<option value="${k}" ${k === 21 ? 'selected' : ''}>عيار ${D(k)}</option>`).join('') + '</select>',
      purity: '<select id="aPurity"><option value="999">خالصة 999</option><option value="925">925</option><option value="900">900</option></select>',
      jewel: '<label class="row" style="gap:4px"><input type="checkbox" id="aJewel"> حُلي ملبوس للاستعمال</label>',
      animal: '<select id="aAnimal">' + Object.entries(ANIMAL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') + '</select>',
      count: '<input id="aCount" type="number" inputmode="numeric" placeholder="العدد">',
      saima: '<label class="row" style="gap:4px"><input type="checkbox" id="aSaima" checked> سائمة (ترعى أكثر الحول)</label>',
      start: '<label>تاريخ بلوغها النصاب <input id="aStart" type="date"></label>',
      kg: '<input id="aKg" type="number" inputmode="decimal" placeholder="المحصول بالكيلوجرام">',
      irrig: '<select id="aIrrig">' + Object.entries(IRRIG).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') + '</select>',
      value: '<input id="aValue" type="number" inputmode="decimal" placeholder="سعر الكيلو (اختياري)">',
    };
    el.innerHTML = `<h1>💰 الزكاة</h1>
      <div class="sub">سجّل أموالك الزكوية، فيُحسب لك النصاب ومقدار الزكاة، ويُذكّرك بتمام الحول الهجري. البيانات محفوظة على جهازك فقط.</div>
      ${statusCard}${C.needGold ? '<div class="warn">أدخل سعر جرام الذهب في الإعدادات ليُحسب ذهبك.</div>' : ''}${C.needSilver ? '<div class="warn">أدخل سعر جرام الفضة في الإعدادات ليُحسب فضتك.</div>' : ''}
      ${hawlCard}
      <h2>أموالي الزكوية (تُضم بعضها إلى بعض)</h2>
      ${C.rows.length ? C.rows.map(assetRow).join('') : '<div class="muted">لم تضف شيئاً بعد.</div>'}
      ${herd.length ? '<h2>🐑 الأنعام</h2>' + herd.map(herdRow).join('') : ''}
      ${crops.length ? '<h2>🌾 الزروع والثمار</h2><div class="muted" style="font-size:13px">لا يُشترط فيها الحول؛ تجب عند الحصاد.</div>' + crops.map(cropRow).join('') : ''}

      <div class="card zk-add"><h3 style="margin-top:0">＋ إضافة مال</h3>
        <select id="aType">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === typeSel ? 'selected' : ''}>${v.t}</option>`).join('')}</select>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:8px">${fields.map(f => F[f]).join('')}</div>
        <button class="btn primary" id="aAdd" style="margin-top:8px">إضافة</button></div>

      <details class="card" ${C.priced && Z.hawl ? '' : 'open'}><summary><b>⚙️ الإعدادات والأسعار</b></summary>
        <label class="fld">سعر جرام الذهب عيار 24 <input id="sGold" type="number" inputmode="decimal" value="${Z.gold || ''}" style="width:120px"></label>
        <label class="fld">سعر جرام الفضة الخالصة <input id="sSilver" type="number" inputmode="decimal" value="${Z.silver || ''}" style="width:120px"></label>
        <label class="fld">العملة <input id="sCur" value="${esc(Z.cur)}" style="width:90px"></label>
        <label class="fld">النصاب يُقدّر بـ <select id="sBasis"><option value="gold" ${Z.basis === 'gold' ? 'selected' : ''}>الذهب (85 جم)</option><option value="silver" ${Z.basis === 'silver' ? 'selected' : ''}>الفضة (595 جم) — الأحوط والأنفع للفقراء</option></select></label>
        <label class="fld">الذهب والفضة المعدّان للبس <select id="sJewel"><option value="exclude" ${Z.jewelry === 'exclude' ? 'selected' : ''}>لا زكاة فيها (قول الجمهور)</option><option value="include" ${Z.jewelry === 'include' ? 'selected' : ''}>تُزكّى (قول الحنفية، ورجّحه ابن باز وابن عثيمين)</option></select></label>
        <label class="fld"><input type="checkbox" id="sDed" ${Z.deduct ? 'checked' : ''}> خصم الديون الحالّة التي عليّ <input id="sDebts" type="number" inputmode="decimal" value="${Z.debts || ''}" placeholder="المبلغ" style="width:120px"></label>
        <label class="fld">تاريخ بلوغ مالي النصاب (بداية الحول) <input id="sHawl" type="date" value="${Z.hawl || ''}"></label>
        <label class="fld"><input type="checkbox" id="sRem" ${Z.remind ? 'checked' : ''}> ذكّرني قبل تمام الحول بشهر وبأسبوع وفي يومه</label>
        <button class="btn primary" id="sSave">حفظ</button>
        <div class="muted" style="font-size:12px;margin-top:6px">أسعار الذهب والفضة تتغير يومياً؛ حدّثها قبل الحساب من أي مصدر موثوق.</div>
      </details>

      ${Z.paid.length ? `<h2>سجل الإخراج</h2>${Z.paid.slice().reverse().map(x => `<div class="zk-row"><div><b>${hdate(parseD(x.date))}</b><small class="muted">${esc(parseD(x.date).toLocaleDateString('ar-EG'))}</small></div><b>${money(x.amount, Z)}</b><span></span></div>`).join('')}` : ''}

      <details class="card"><summary><b>📚 الأحكام والأدلة باختصار</b></summary>
        <p><b>النقدان وعروض التجارة:</b> ربع العشر (٢٫٥٪) إذا بلغت النصاب وحال عليها الحول. قال ﷺ: «فإذا كانت لك مائتا درهم وحال عليها الحول ففيها خمسة دراهم، وليس عليك شيء حتى يكون لك عشرون ديناراً». <small class="muted">رواه أبو داود (1573) وصححه الألباني.</small> والعشرون ديناراً نحو 85 جراماً من الذهب، والمائتا درهم نحو 595 جراماً من الفضة. وتُضمّ النقود والذهب والفضة وعروض التجارة بعضها إلى بعض في تكميل النصاب عند الجمهور.</p>
        <p><b>الأنعام:</b> تجب في الإبل والبقر والغنم السائمة إذا بلغت النصاب وحال عليها الحول، على تفصيل كتاب أبي بكر الصديق رضي الله عنه في الصدقة. <small class="muted">رواه البخاري (1454).</small> والمعلوفة لا زكاة فيها عند الجمهور، خلافاً للمالكية. وما كان منها للتجارة يُزكّى زكاة عروض التجارة.</p>
        <p><b>الزروع والثمار:</b> «فيما سقت السماء والعيون أو كان عَثَرياً العُشر، وما سُقي بالنضح نصف العشر». <small class="muted">رواه البخاري (1483).</small> و«ليس فيما دون خمسة أوسق صدقة» <small class="muted">متفق عليه</small>، وتُقدّر بنحو 612 كجم (وقدّرها بعضهم بـ653 كجم). وتجب عند الحصاد بلا حول، فيما يُكال ويُدّخر كالحبوب والتمر والزبيب عند الجمهور.</p>
        <p><b>الحلي المعدّ للبس:</b> مسألة خلافية؛ الجمهور على أنه لا زكاة فيه، والحنفية على وجوبها، واختاره من المعاصرين ابن باز وابن عثيمين. اختر ما تطمئن إليه من الإعدادات.</p>
        <p><b>الديون:</b> الدين المرجوّ على مليء يُزكّى مع المال عند الجمهور. وفي خصم الديون التي عليك من المال الزكوي خلاف؛ ففعّل الخصم إن أخذت به.</p>
        <div class="warn" style="font-size:12.5px">هذه حاسبة تُعين على التقدير، وللحالات الخاصة (الشركات، الأسهم الاستثمارية، المستغلات، الرواتب المتفرقة) يُرجع إلى أهل العلم.</div>
      </details>`;
    const $ = s => el.querySelector(s);
    $('#aType').onchange = e => { location.hash = '#/zakat?add=' + e.target.value; };
    $('#aAdd').onclick = async () => {
      const g = id => $('#' + id);
      const a = { id: uid(), type: typeSel, name: (g('aName') || {}).value || '' };
      if (g('aAmount')) a.amount = n(g('aAmount').value);
      if (g('aGrams')) a.grams = n(g('aGrams').value);
      if (g('aKarat')) a.karat = +g('aKarat').value;
      if (g('aPurity')) a.purity = +g('aPurity').value;
      if (g('aJewel')) a.jewel = g('aJewel').checked;
      if (g('aAnimal')) { a.animal = g('aAnimal').value; a.count = +g('aCount').value || 0; a.saima = g('aSaima').checked; a.start = g('aStart').value; }
      if (g('aKg')) { a.kg = n(g('aKg').value); a.irrig = g('aIrrig').value; a.value = n(g('aValue').value); }
      if (!(a.amount || a.grams || a.count || a.kg)) { APP.toast('أدخل القيمة أو الوزن أو العدد'); return; }
      Z.assets.push(a); await save(Z); await NOTIFY.rescheduleAll(); APP.rerender();
    };
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (!(await APP.ask('حذف هذا البند؟'))) return; Z.assets = Z.assets.filter(a => a.id !== b.dataset.del); await save(Z); await NOTIFY.rescheduleAll(); APP.rerender(); });
    $('#sSave').onclick = async () => {
      Object.assign(Z, { gold: n($('#sGold').value), silver: n($('#sSilver').value), cur: $('#sCur').value.trim() || 'ريال', basis: $('#sBasis').value, jewelry: $('#sJewel').value, deduct: $('#sDed').checked, debts: n($('#sDebts').value), hawl: $('#sHawl').value, remind: $('#sRem').checked });
      await save(Z);
      if (Z.remind && Z.hawl && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request();
      await NOTIFY.rescheduleAll(); APP.toast('✔ حُفظ'); APP.rerender();
    };
    if ($('#zPay')) $('#zPay').onclick = async () => { Z.paid.push({ date: isoD(new Date()), amount: n(C.due) }); await save(Z); APP.toast('✔ سُجّل — تقبّل الله'); APP.rerender(); };
    if ($('#zNew')) $('#zNew').onclick = async () => { Z.hawl = isoD(due); await save(Z); await NOTIFY.rescheduleAll(); APP.rerender(); };
  };

  // ===== التذكير بتمام الحول =====
  NOTIFY.register('zakat', async () => {
    const Z = await load(); if (!Z.remind) return [];
    const out = [];
    const add = (d, label, route) => {
      if (!d) return;
      for (const [k, t] of [[30, 'بعد شهر'], [7, 'بعد أسبوع'], [0, 'اليوم']]) {
        const at = new Date(d); at.setDate(at.getDate() - k); at.setHours(10, 0, 0, 0);
        out.push({ title: '💰 ' + label + ': يتم الحول ' + t, body: (k ? 'استعد لإخراج الزكاة — ' : 'حان وقت إخراج الزكاة — ') + hdate(d), at, route });
      }
    };
    add(hawlDue(Z.hawl), 'زكاة المال', '#/zakat');
    Z.assets.filter(a => a.type === 'livestock' && a.start && a.saima !== false).forEach(a => add(hawlDue(a.start), 'زكاة ' + (a.name || ANIMAL[a.animal]), '#/zakat'));
    return out;
  });

  window.ZAKAT = { animalDue, compute, hawlDue };
})();
