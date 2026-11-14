/* 🔢 الأرقام والحساب: للأطفال حتى ١٠٠، وللكبار (محو الأمية) الأرقام والمئات والنقود والساعة وأرقام الهاتف */
(() => {
  const { AD, esc } = LEARN;
  const say = LEARN.say;
  const R = n => Math.floor(Math.random() * n);

  // ===== الأعداد بالكلمات =====
  const ONES = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUND = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];
  function under100(n) { if (n < 20) return ONES[n]; const t = Math.floor(n / 10), o = n % 10; return o ? ONES[o] + ' و' + TENS[t] : TENS[t]; }
  function numWord(n) {
    if (n < 100) return under100(n);
    if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return HUND[h] + (r ? ' و' + under100(r) : ''); }
    const th = Math.floor(n / 1000), r = n % 1000;
    const k = th === 1 ? 'ألف' : th === 2 ? 'ألفان' : th <= 10 ? under100(th) + ' آلاف' : under100(th) + ' ألفا';
    return k + (r ? ' و' + numWord(r) : '');
  }
  const rial = n => n === 1 ? 'ريال واحد' : n === 2 ? 'ريالان' : n <= 10 ? numWord(n) + ' ريالات' : (n % 100 >= 11 && n % 100 <= 99) ? numWord(n) + ' ريالا' : numWord(n) + ' ريال';
  const nKey = n => (n <= 100 || (n % 100 === 0 && n <= 1000)) ? 'n' + n : null;
  const sayN = n => say(nKey(n), numWord(n));

  // ===== الساعة =====
  const HRS = ['الثانية عشرة', 'الواحدة', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة', 'الحادية عشرة', 'الثانية عشرة'];
  const clockText = (h, m) => m === 45 ? 'الساعة ' + HRS[(h % 12) + 1] + ' إلا ربعا' : 'الساعة ' + HRS[h % 12 || 12] + (m === 15 ? ' والربع' : m === 30 ? ' والنصف' : '');
  function clockSvg(h, m) {
    const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
    return `<svg viewBox="-60 -60 120 120" class="clk"><circle r="56" class="clk-f"/>${Array.from({ length: 12 }, (_, i) => { const a = (i + 1) * 30 * Math.PI / 180; return `<text x="${Math.sin(a) * 44}" y="${-Math.cos(a) * 44 + 4}" text-anchor="middle">${AD(i + 1)}</text>`; }).join('')}
      <line x1="0" y1="0" x2="${Math.sin(ha * Math.PI / 180) * 26}" y2="${-Math.cos(ha * Math.PI / 180) * 26}" class="clk-h"/><line x1="0" y1="0" x2="${Math.sin(ma * Math.PI / 180) * 40}" y2="${-Math.cos(ma * Math.PI / 180) * 40}" class="clk-m"/><circle r="3.5" class="clk-c"/></svg>`;
  }

  // مقاطع التسجيل الإضافية: الأعداد حتى ١٠٠ والمئات، وجمل الساعة
  window.LEARN_EXTRA_CLIPS = (window.LEARN_EXTRA_CLIPS || []).concat(add => {
    for (let n = 21; n <= 100; n++) add('n' + n, numWord(n), AD(n) + ' — ' + numWord(n), '١٥. الأعداد حتى ١٠٠ والمئات');
    for (let n = 200; n <= 1000; n += 100) add('n' + n, numWord(n), AD(n) + ' — ' + numWord(n), '١٥. الأعداد حتى ١٠٠ والمئات');
    for (let h = 1; h <= 12; h++) for (const m of [0, 15, 30, 45]) add(`ck${h}_${m}`, clockText(h, m), null, '١٦. الساعة');
  });

  const C = () => window.LIT;
  const opts = (n, make, k = 3) => { const s = new Set([n]); let g = 0; while (s.size < k && g++ < 200) s.add(make()); return LEARN.shuffle([...s]); };
  const digits = n => `<span class="lr-g2">${AD(n)}</span>`;
  const EMO = ['🍎', '⭐', '🐟', '🌹', '🍌', '🐝', '🎈', '🚗'];
  const tenBlock = '<span class="ten">🟦🟦🟦🟦🟦<br>🟦🟦🟦🟦🟦</span>', one = '<span class="one">🟨</span>';

  // ===== دروس الأطفال =====
  const KIDS = {
    teens: { ic: '🔟', t: 'من ١١ إلى ٢٠', run: async b => { for (let n = 11; n <= 20; n++) await C().stepNext(b, `<div class="lr-glyph" style="font-size:150px" data-say="n${n}">${AD(n)}</div><div class="num-tens">${tenBlock}${one.repeat(n - 10)}</div><div class="lr-cap">${numWord(n)}</div>`, bb => { C().bindSay(bb); sayN(n); }); return true; } },
    tens: { ic: '💯', t: 'العشرات حتى ١٠٠', run: async b => { for (let n = 10; n <= 100; n += 10) await C().stepNext(b, `<div class="lr-glyph" style="font-size:130px" data-say="n${n}">${AD(n)}</div><div class="num-tens">${tenBlock.repeat(n / 10)}</div><div class="lr-cap">${numWord(n)}</div>`, bb => { C().bindSay(bb); sayN(n); }); return true; } },
    hear100: { ic: '👂', t: 'اسمع واختر الرقم', run: b => rounds(b, 6, () => { const n = 1 + R(100); return C().choose(b, { prompt: 'p_choose_num', hear: [nKey(n), numWord(n)], options: opts(n, () => Math.max(0, n + R(21) - 10)).map(x => ({ html: digits(x), ok: x === n })) }); }) },
    build: { ic: '🧱', t: 'عشرات وآحاد', run: b => rounds(b, 5, () => { const t = 1 + R(9), o = R(10), n = t * 10 + o; return C().choose(b, { prompt: 'p_count', show: `<div class="num-tens">${tenBlock.repeat(t)}${one.repeat(o)}</div>`, options: opts(n, () => (1 + R(9)) * 10 + R(10)).map(x => ({ html: digits(x), ok: x === n })) }); }) },
    add20: { ic: '➕', t: 'اجمع حتى ٢٠', run: b => rounds(b, 6, () => { const a = 2 + R(9), c = 1 + R(9), e = LEARN.shuffle(EMO)[0]; return C().choose(b, { prompt: 'p_add', show: `<div class="lr-cap" style="font-size:44px">${AD(a)} + ${AD(c)} = ؟</div>`, options: opts(a + c, () => 2 + R(18)).map(x => ({ html: digits(x), ok: x === a + c })) }); }) },
    cmp: { ic: '⚖️', t: 'الأكبر', run: b => rounds(b, 5, () => { const a = R(100), c = (a + 1 + R(50)) % 100; return C().choose(b, { prompt: 'p_bigger', cols: 2, options: [{ html: digits(a), ok: a > c }, { html: digits(c), ok: c > a }] }); }) }
  };
  async function rounds(b, n, mk) { let ok = 0; for (let r = 0; r < n; r++) { if (!b.isConnected) return new Promise(() => { }); if (await mk(r)) ok++; } return ok; }

  // ===== دروس الكبار =====
  const ADULT = [
    { id: 'digits', ic: '١٢٣', t: 'الأرقام ٠–٩ بشكليها', run: async b => {
      for (let n = 0; n <= 9; n++) await C().stepNext(b, `<div class="row" style="gap:30px;justify-content:center"><span class="lr-glyph" style="font-size:130px">${AD(n)}</span><span class="lr-glyph" style="font-size:110px;font-family:sans-serif">${n}</span></div><div class="lr-cap">${numWord(n)}</div>`, () => sayN(n));
      return rounds(b, 6, () => { const n = R(10), west = Math.random() < 0.5; return C().choose(b, { hear: [nKey(n), numWord(n)], options: opts(n, () => R(10)).map(x => ({ html: west ? `<span class="lr-g2" style="font-family:sans-serif">${x}</span>` : digits(x), ok: x === n })) }); });
    } },
    { id: 'n100', ic: '💯', t: 'الأعداد حتى ١٠٠', run: b => rounds(b, 8, () => { const n = 10 + R(91); return C().choose(b, { prompt: 'p_choose_num', hear: [nKey(n), numWord(n)], options: opts(n, () => { const t = Math.floor(n / 10), o = n % 10; return R(2) ? o * 10 + t : n + R(21) - 10; }).filter(x => x >= 0).map(x => ({ html: digits(x), ok: x === n })) }); }) },
    { id: 'n1000', ic: '🔢', t: 'المئات والألوف', run: b => rounds(b, 8, () => { const n = (1 + R(9)) * 100 + (R(2) ? R(10) * 10 : 0) + (R(4) === 0 ? 1000 : 0); return C().choose(b, { prompt: 'p_choose_num', hear: [nKey(n), numWord(n)], options: opts(n, () => (1 + R(19)) * 50).map(x => ({ html: digits(x), ok: x === n })) }); }) },
    { id: 'money', ic: '💵', t: 'النقود', run: b => rounds(b, 8, r => {
      if (r % 2 === 0) {
        const notes = [50, 10, 5, 1].flatMap(v => Array(R(v === 50 ? 2 : 3)).fill(v)); if (!notes.length) notes.push(10);
        const sum = notes.reduce((a, c) => a + c, 0);
        return C().choose(b, { prompt: 'p_money_total', show: `<div class="money">${notes.map(v => `<span class="note n${v}">${AD(v)}</span>`).join('')}</div>`, options: opts(sum, () => Math.max(1, sum + (R(5) - 2) * 5)).map(x => ({ html: `<span class="lr-w2" style="font-size:30px">${AD(x)} ريال</span>`, ok: x === sum })) });
      }
      const pay = [10, 20, 50, 100][R(4)], price = 1 + R(pay - 1), ch = pay - price;
      return C().choose(b, { prompt: 'p_money_change', show: `<div class="lr-cap" style="font-size:24px;line-height:2">معك <b class="note n50">${AD(pay)}</b> ريال<br>واشتريت بـ <b>${AD(price)}</b> ريال<br>كم الباقي؟</div>`, hear: [null, `معك ${rial(pay)}، واشتريت بـ${rial(price)}، كم الباقي؟`], options: opts(ch, () => Math.max(0, ch + R(11) - 5)).map(x => ({ html: `<span class="lr-w2" style="font-size:30px">${AD(x)}</span>`, ok: x === ch })) });
    }) },
    { id: 'clock', ic: '🕒', t: 'الساعة', run: b => rounds(b, 8, () => { const h = 1 + R(12), m = [0, 15, 30, 45][R(4)]; const mk = () => [1 + R(12), [0, 15, 30, 45][R(4)]]; const all = [[h, m]]; while (all.length < 3) { const x = mk(); if (!all.some(y => y[0] === x[0] && y[1] === x[1])) all.push(x); } return C().choose(b, { prompt: 'p_clock', show: clockSvg(h, m), options: LEARN.shuffle(all).map(([hh, mm]) => ({ html: `<span style="font-size:20px;font-weight:700" data-k="ck${hh}_${mm}">${esc(clockText(hh, mm))}</span>`, ok: hh === h && mm === m })) }); }) },
    { id: 'phone', ic: '📞', t: 'أرقام الهاتف والتاريخ', run: b => rounds(b, 6, r => {
      if (r % 2 === 0) { const num = '05' + Array.from({ length: 8 }, () => R(10)).join(''); const other = () => num.slice(0, 4) + LEARN.shuffle(num.slice(4).split('')).join('');
        return C().choose(b, { prompt: 'p_phone', hear: [null, num.split('').map(d => ONES[+d]).join('، ')], options: opts(num, other).map(x => ({ html: `<span style="font-size:26px;font-weight:700;direction:ltr;display:inline-block">${AD(x)}</span>`, ok: x === num })) }); }
      const d = 1 + R(28), mo = 1 + R(12); const MON = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      const ok = `${AD(d)} ${MON[mo - 1]}`;
      return C().choose(b, { prompt: 'p_date', show: `<div class="lr-g2" style="direction:ltr">${AD(d)}/${AD(mo)}</div>`, options: opts(ok, () => `${AD(1 + R(28))} ${MON[R(12)]}`).map(x => ({ html: `<span style="font-size:22px;font-weight:700">${x}</span>`, ok: x === ok })) });
    }) }
  ];

  async function view(o) {
    const { sh, area, base, id, pg } = o, list = o.list || base + '/math';
    const SET = area === 'kids' ? Object.entries(KIDS).map(([k, v]) => Object.assign({ id: k }, v)) : ADULT;
    if (id == null) {
      const b = sh(area === 'kids' ? '🔢 أرقام أكبر' : '🔢 الأرقام والحساب', base);
      b.innerHTML = `<div class="lr-path">${SET.map((x, i) => `<a class="lr-level" href="${list}/${x.id}"><span class="lr-num">${AD(i + 1)}</span><span class="lr-lic" style="font-size:28px">${x.ic}</span><b>${x.t}</b><span class="lr-bar"><i style="width:${pg['mt_' + x.id] ? 100 : 0}%"></i></span><small>${pg['mt_' + x.id] ? '✓' : ''}</small></a>`).join('')}</div>`;
      return;
    }
    const x = SET.find(y => y.id === id); if (!x) { location.replace(list); return; }
    const b = sh(x.ic + ' ' + x.t, list);
    await x.run(b);
    if (b.isConnected) C().done(b, area, 'mt_' + x.id, list);
  }

  window.LMATH = { numWord, rial, clockText, clockSvg, view, KIDS, ADULT };
})();
