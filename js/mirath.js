/* ⚖️ حاسبة المواريث — على قول جمهور الفقهاء، للحالات الشائعة
   الفروض، والتعصيب (بالنفس، وبالغير، ومع الغير)، والحجب، والعول، والردّ، والعُمَريّتان. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const Fr = (n, d = 1) => { const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const add = (a, b) => Fr(a.n * b.d + b.n * a.d, a.d * b.d), sub = (a, b) => Fr(a.n * b.d - b.n * a.d, a.d * b.d), mul = (a, b) => Fr(a.n * b.n, a.d * b.d), div = (a, b) => Fr(a.n * b.d, a.d * b.n);
  const fs = f => f.n === 0 ? '٠' : f.d === 1 ? D(f.n) : `${D(f.n)}/${D(f.d)}`;
  const NAMES = { 1: 'الكل', '1/2': 'النصف', '1/4': 'الربع', '1/8': 'الثمن', '2/3': 'الثلثان', '1/3': 'الثلث', '1/6': 'السدس' };
  const fname = f => NAMES[f.d === 1 ? f.n : f.n + '/' + f.d] || fs(f);

  const FIELDS = [
    ['husband', 'الزوج', 'b', 'f'], ['wives', 'الزوجات', 'n', 'm', 4],
    ['sons', 'الأبناء', 'n'], ['daughters', 'البنات', 'n'], ['sonsSons', 'أبناء الابن', 'n'], ['sonsDaughters', 'بنات الابن', 'n'],
    ['father', 'الأب', 'b'], ['mother', 'الأم', 'b'], ['grandfather', 'الجد (أبو الأب)', 'b'], ['gmM', 'الجدة (أم الأم)', 'b'], ['gmF', 'الجدة (أم الأب)', 'b'],
    ['brothers', 'الإخوة الأشقاء', 'n'], ['sisters', 'الأخوات الشقيقات', 'n'], ['pBrothers', 'الإخوة لأب', 'n'], ['pSisters', 'الأخوات لأب', 'n'], ['mSiblings', 'الإخوة والأخوات لأم', 'n'],
    ['farAsaba', 'عاصب أبعد (ابن أخ، عم، ابن عم…)', 'b'],
  ];

  function calc(x) {
    const out = [], notes = [], blocked = [];
    const hasMaleDesc = x.sons + x.sonsSons > 0, hasDesc = hasMaleDesc || x.daughters + x.sonsDaughters > 0;
    const sibCount = x.brothers + x.sisters + x.pBrothers + x.pSisters + x.mSiblings;
    const father = x.father, gf = !father && x.grandfather;
    const fard = (key, label, count, f) => out.push({ key, label, count, f, kind: 'fard' });
    const blk = (label, why) => blocked.push([label, why]);
    // الزوجان
    if (x.husband) fard('husband', 'الزوج', 1, hasDesc ? Fr(1, 4) : Fr(1, 2));
    if (x.wives) fard('wives', x.wives > 1 ? 'الزوجات' : 'الزوجة', x.wives, hasDesc ? Fr(1, 8) : Fr(1, 4));
    // البنات وبنات الابن
    if (x.daughters && !x.sons) fard('daughters', 'البنات', x.daughters, x.daughters === 1 ? Fr(1, 2) : Fr(2, 3));
    let sdAsaba = false;
    if (x.sonsDaughters) {
      if (x.sons) blk('بنات الابن', 'حجبهن الابن');
      else if (x.sonsSons) sdAsaba = true;
      else if (x.daughters >= 2) blk('بنات الابن', 'حجبهن استكمال البنات الثلثين (ولا معصّب لهن)');
      else if (x.daughters === 1) fard('sonsDaughters', 'بنات الابن', x.sonsDaughters, Fr(1, 6)), notes.push('بنات الابن مع البنت الواحدة لهن السدس تكملة للثلثين.');
      else fard('sonsDaughters', 'بنات الابن', x.sonsDaughters, x.sonsDaughters === 1 ? Fr(1, 2) : Fr(2, 3));
    }
    if (x.sonsSons && x.sons) blk('أبناء الابن', 'حجبهم الابن');
    // الأب والجد
    const parentAsaba = [];
    if (father) { if (hasMaleDesc) fard('father', 'الأب', 1, Fr(1, 6)); else if (hasDesc) { fard('father', 'الأب', 1, Fr(1, 6)); parentAsaba.push('father'); } else parentAsaba.push('father'); }
    if (x.grandfather && father) blk('الجد', 'حجبه الأب');
    if (gf) {
      if (hasMaleDesc) fard('gf', 'الجد', 1, Fr(1, 6)); else if (hasDesc) { fard('gf', 'الجد', 1, Fr(1, 6)); parentAsaba.push('gf'); } else parentAsaba.push('gf');
      if (x.brothers + x.sisters + x.pBrothers + x.pSisters) notes.push('مسألة «الجد مع الإخوة» خلافية: حسبناها على قول أبي بكر الصديق وأبي حنيفة بأن الجد يحجب الإخوة كالأب، وعند الجمهور يقاسمهم بشروط؛ فاسأل مختصاً.');
    }
    // الأم والجدات
    const umariyya = x.mother && father && (x.husband || x.wives) && !hasDesc && sibCount < 2;
    if (x.mother) fard('mother', 'الأم', 1, hasDesc || sibCount >= 2 ? Fr(1, 6) : Fr(1, 3));
    if (umariyya) notes.push('هذه إحدى «العُمَريّتين»: للأم ثلث الباقي بعد فرض الزوج أو الزوجة، لا ثلث الكل.');
    const gms = [];
    if (x.mother && (x.gmM || x.gmF)) blk('الجدات', 'حجبتهن الأم');
    else { if (x.gmM) gms.push('أم الأم'); if (x.gmF) { if (father) blk('الجدة (أم الأب)', 'حجبها الأب'); else gms.push('أم الأب'); } }
    if (gms.length) fard('gm', gms.length > 1 ? 'الجدتان' : 'الجدة', gms.length, Fr(1, 6));
    // الإخوة لأم
    if (x.mSiblings) { if (hasDesc || father || gf) blk('الإخوة لأم', 'حجبهم ' + (hasDesc ? 'الفرع الوارث' : 'الأصل الوارث من الذكور')); else fard('mSib', 'الإخوة لأم', x.mSiblings, x.mSiblings === 1 ? Fr(1, 6) : Fr(1, 3)); }
    // الإخوة الأشقاء ولأب
    const sibBlock = hasMaleDesc ? 'الفرع الوارث المذكر' : father ? 'الأب' : gf ? 'الجد' : null;
    let sisAsaba = null, pSisAsaba = null;
    if (sibBlock) { ['brothers', 'sisters', 'pBrothers', 'pSisters'].forEach(k => { if (x[k]) blk(FIELDS.find(f => f[0] === k)[1], 'حجبهم ' + sibBlock); }); }
    else {
      const femDesc = x.daughters + x.sonsDaughters > 0;
      if (x.sisters && !x.brothers) { if (femDesc) { sisAsaba = 'withOther'; notes.push('الأخوات الشقيقات مع البنات عصبة مع الغير، فيأخذن الباقي.'); } else fard('sisters', 'الأخوات الشقيقات', x.sisters, x.sisters === 1 ? Fr(1, 2) : Fr(2, 3)); }
      const fullAsaba = x.brothers > 0 || sisAsaba;
      if (x.pBrothers && fullAsaba) blk('الإخوة لأب', 'حجبهم ' + (x.brothers ? 'الإخوة الأشقاء' : 'الأخت الشقيقة العصبة مع الغير'));
      if (x.pSisters) {
        if (fullAsaba) blk('الأخوات لأب', 'حجبهن ' + (x.brothers ? 'الإخوة الأشقاء' : 'الأخت الشقيقة العصبة مع الغير'));
        else if (x.pBrothers) pSisAsaba = 'withBro';
        else if (x.sisters >= 2) blk('الأخوات لأب', 'حجبهن استكمال الشقيقات الثلثين');
        else if (x.sisters === 1) fard('pSisters', 'الأخوات لأب', x.pSisters, Fr(1, 6)), notes.push('الأخوات لأب مع الشقيقة الواحدة لهن السدس تكملة للثلثين.');
        else if (femDesc) { pSisAsaba = 'withOther'; }
        else fard('pSisters', 'الأخوات لأب', x.pSisters, x.pSisters === 1 ? Fr(1, 2) : Fr(2, 3));
      }
    }
    // العصبة بالترتيب
    let asaba = null;
    if (x.sons) asaba = [['sons', 'الأبناء', x.sons, 2], ['daughters', 'البنات', x.daughters, 1]];
    else if (x.sonsSons) asaba = [['sonsSons', 'أبناء الابن', x.sonsSons, 2], ['sonsDaughters', 'بنات الابن', sdAsaba ? x.sonsDaughters : 0, 1]];
    else if (parentAsaba.length) asaba = [[parentAsaba[0], parentAsaba[0] === 'father' ? 'الأب' : 'الجد', 1, 1]];
    else if (!sibBlock && x.brothers) asaba = [['brothers', 'الإخوة الأشقاء', x.brothers, 2], ['sisters', 'الأخوات الشقيقات', x.sisters, 1]];
    else if (!sibBlock && sisAsaba) asaba = [['sisters', 'الأخوات الشقيقات', x.sisters, 1]];
    else if (!sibBlock && x.pBrothers) asaba = [['pBrothers', 'الإخوة لأب', x.pBrothers, 2], ['pSisters', 'الأخوات لأب', pSisAsaba ? x.pSisters : 0, 1]];
    else if (!sibBlock && pSisAsaba === 'withOther') asaba = [['pSisters', 'الأخوات لأب', x.pSisters, 1]];
    else if (x.farAsaba) asaba = [['far', 'العاصب الأبعد', 1, 1]];
    if (x.farAsaba && asaba && asaba[0][0] !== 'far') blk('العاصب الأبعد', 'حجبه من هو أقرب منه');
    // العمريتان: ثلث الباقي للأم
    if (umariyya) { const sp = out.find(o => o.key === 'husband' || o.key === 'wives'); out.find(o => o.key === 'mother').f = mul(Fr(1, 3), sub(Fr(1), sp.f)); }
    let total = out.reduce((s, o) => add(s, o.f), Fr(0));
    // العول
    if (total.n > total.d) { notes.push(`عالت المسألة: مجموع الفروض ${fs(total)}، فنُقصت السهام كلها بالنسبة نفسها.`); out.forEach(o => o.f = div(o.f, total)); total = Fr(1); }
    let rest = sub(Fr(1), total);
    if (asaba && rest.n > 0) {
      const units = asaba.reduce((s, a) => s + a[2] * a[3], 0);
      asaba.filter(a => a[2]).forEach(a => { const f = mul(rest, Fr(a[2] * a[3], units)), ex = out.find(o => o.key === a[0]); if (ex) { ex.f = add(ex.f, f); ex.kind = 'both'; } else out.push({ key: a[0], label: a[1], count: a[2], f, kind: 'asaba' }); });
      if (asaba.length > 1 && asaba[1][2]) notes.push('للذكر مثل حظ الأنثيين: ' + asaba[0][1] + ' مع ' + asaba[1][1] + '.');
      rest = Fr(0);
    } else if (asaba && rest.n === 0) asaba.filter(a => a[2] && !out.find(o => o.key === a[0])).forEach(a => blk(a[1], 'لم يبق لهم شيء بعد أصحاب الفروض'));
    // الرد
    if (rest.n > 0) {
      const rd = out.filter(o => o.key !== 'husband' && o.key !== 'wives');
      if (rd.length) { const sum = rd.reduce((s, o) => add(s, o.f), Fr(0)); rd.forEach(o => o.f = add(o.f, mul(rest, div(o.f, sum)))); notes.push('بقي شيء بعد الفروض ولا عاصب، فرُدّ على أصحاب الفروض بنسبة فروضهم، ولا يُرد على الزوجين (قول الجمهور).'); rest = Fr(0); }
      else notes.push(`بقي ${fs(rest)} ولا وارث غير الزوجين: فيرد على الزوج أو الزوجة عند كثير من المتأخرين، أو يكون لبيت مال المسلمين عند آخرين.`);
    }
    return { out, notes, blocked, rest };
  }

  V.mirath = async el => {
    const st = (await DB.setting('mirath')) || {};
    el.innerHTML = `<h1>⚖️ حاسبة المواريث</h1>
      <div class="card"><p>﴿يوصيكم الله في أولادكم للذكر مثل حظ الأنثيين﴾ (النساء: ١١). اختر الورثة الأحياء عند وفاة المتوفى، فتظهر لك الأنصبة على قول جمهور الفقهاء.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><label class="fld">المتوفى: <select id="mG"><option value="m">رجل</option><option value="f">امرأة</option></select></label>
      <label class="fld">التركة الصافية (بعد التجهيز والديون والوصية): <input id="mAmt" inputmode="decimal" placeholder="مثلاً ٣٠٠٠٠٠" style="width:150px"></label></div></div>
      <div class="card mr-grid" id="mF"></div>
      <div class="row" style="gap:8px"><button class="btn primary" id="mGo">احسب الأنصبة</button><button class="btn" id="mClr">مسح</button></div>
      <div id="mR"></div>
      <div class="muted" style="font-size:12.5px;margin-top:10px">الحاسبة للحالات الشائعة وللتعلّم. وفي الحالات المعقدة (الجد مع الإخوة، والمناسخات، والحمل، والمفقود، والخنثى) وعند القسمة الفعلية يلزم الرجوع إلى المحكمة ومتخصص في الفرائض.</div>`;
    const g = el.querySelector('#mG'); g.value = st.g || 'm';
    const paint = () => {
      const male = g.value === 'm';
      el.querySelector('#mF').innerHTML = FIELDS.filter(f => !f[3] || f[3] === g.value).map(([k, l, t, , max]) => t === 'b'
        ? `<label class="mr-f"><input type="checkbox" data-k="${k}" ${st[k] ? 'checked' : ''}> ${l}</label>`
        : `<label class="mr-f">${l} <input type="number" min="0" max="${max || 40}" data-k="${k}" value="${st[k] || ''}" placeholder="٠"></label>`).join('');
    };
    paint(); g.onchange = paint;
    el.querySelector('#mAmt').value = st.amt || '';
    el.querySelector('#mClr').onclick = async () => { await DB.setting('mirath', {}); APP.rerender(); };
    el.querySelector('#mGo').onclick = async () => {
      const x = { g: g.value, amt: el.querySelector('#mAmt').value };
      FIELDS.forEach(([k, , t]) => { const i = el.querySelector(`[data-k="${k}"]`); x[k] = !i ? 0 : t === 'b' ? (i.checked ? 1 : 0) : Math.max(0, Math.min(+i.value || 0, 40)); });
      if (x.g === 'm') x.husband = 0; else x.wives = 0;
      await DB.setting('mirath', x);
      const r = calc(x), amt = parseFloat(String(x.amt).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d.]/g, '')) || 0;
      if (!r.out.length) { el.querySelector('#mR').innerHTML = '<div class="warn">اختر وارثاً واحداً على الأقل.</div>'; return; }
      const L = r.out.reduce((l, o) => l * o.f.d / gcd(l, o.f.d), 1);
      const money = n => amt ? D(Math.round(n * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, '٬') : '';
      el.querySelector('#mR').innerHTML = `<div class="card"><h2>النتيجة</h2><table class="t mr-t"><tr><th>الوارث</th><th>العدد</th><th>النصيب</th><th>السهام من ${D(L)}</th>${amt ? '<th>المبلغ</th><th>للفرد</th>' : ''}</tr>
        ${r.out.map(o => `<tr><td><b>${esc(o.label)}</b><br><small class="muted">${o.kind === 'fard' ? 'فرضاً: ' + fname(o.f) : o.kind === 'asaba' ? 'تعصيباً' : 'فرضاً وتعصيباً'}</small></td><td>${D(o.count)}</td><td>${fs(o.f)}</td><td>${D(o.f.n * L / o.f.d)}</td>${amt ? `<td>${money(amt * o.f.n / o.f.d)}</td><td>${money(amt * o.f.n / o.f.d / o.count)}</td>` : ''}</tr>`).join('')}</table>
        ${r.notes.length ? `<h3>ملاحظات</h3><ul>${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
        ${r.blocked.length ? `<h3>المحجوبون</h3><ul>${r.blocked.map(([a, b]) => `<li><b>${esc(a)}</b>: ${esc(b)}</li>`).join('')}</ul>` : ''}</div>`;
    };
  };
  window.MIRATH = { calc };
})();
