/* 🌸 رفيقة: للمرأة والفتاة — دورتي، وحملي، والتمارين، والأحكام، وقدوتي، ومكانتك، ومراحل حياتها، وتربية الأبناء.
   المحتوى في data/rafiqa.js (يُحمَّل عند أول دخول للقسم)، وكل البيانات الشخصية على الجوال فقط.
   القسم خلف بوابة للفتيات من سن البلوغ والنساء. */
(() => {
  const V = APP.views;
  // طابع «رفيقة» الخاص (ألوانها وروحها) يُطبَّق ما دامت داخل القسم
  const theme = () => document.body.classList.toggle('rf-theme', /^#\/rafiqa/.test(location.hash));
  window.addEventListener('hashchange', theme); theme();
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const pad = n => String(n).padStart(2, '0');
  // ===== التواريخ =====
  const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d); };
  const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 864e5);
  const today = () => toKey(new Date());
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const fmtD = (k, wd) => { const d = fromKey(k); return (wd ? DAYS[d.getDay()] + ' ' : '') + D(d.getDate()) + ' ' + MONTHS[d.getMonth()]; };

  // ===== المحتوى (يُحمَّل عند الحاجة) =====
  let loading = null;
  const R = () => window.RAFIQA;
  function load() {
    if (window.RAFIQA) return Promise.resolve(window.RAFIQA);
    return loading || (loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/rafiqa.js?v=' + (window.DATA_V || ''); s.onload = () => res(window.RAFIQA); s.onerror = rej; document.head.appendChild(s); }));
  }
  // ===== بياناتها =====
  async function get() { return Object.assign({ periods: [], journal: {}, preg: null, visits: [], kicks: [], fit: { secs: 0, rest: 0, rounds: 0 }, seen: {}, fav: {}, remind: { period: true, checks: true, seerah: false, seerahT: '09:00' } }, (await DB.setting('rafiqa')) || {}); }
  const save = r => DB.setting('rafiqa', r);
  const rer = () => APP.rerender();

  // ===== تحليل الدورة: متوسط موزون لآخر ٦ دورات، ونافذة توقّع تتسع إذا لم تكن منتظمة =====
  function analyze(periods, t = today()) {
    const s = [...periods].sort((a, b) => a.start.localeCompare(b.start));
    if (!s.length) return { has: false };
    const lens = []; for (let i = 1; i < s.length; i++) { const l = diffDays(s[i - 1].start, s[i].start); if (l >= 15 && l <= 90) lens.push(l); }
    const rec = lens.slice(-6);
    const pl = s.filter(p => p.end).map(p => diffDays(p.start, p.end) + 1).filter(n => n >= 1 && n <= 15).slice(-6);
    let avg = 28; if (rec.length) { let w = 0, x = 0; rec.forEach((l, i) => { x += l * (i + 1); w += i + 1; }); avg = Math.round(x / w); }
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    const sd = rec.length >= 2 ? Math.sqrt(rec.reduce((x, l) => x + (l - mean(rec)) ** 2, 0) / (rec.length - 1)) : null;
    const spread = rec.length ? Math.max(...rec) - Math.min(...rec) : null;
    const irregular = rec.length >= 2 && (spread > 8 || sd > 5);
    const avgP = pl.length ? Math.round(mean(pl)) : 6;
    const last = s[s.length - 1];
    const onPeriod = !last.end && diffDays(last.start, t) >= 0 && diffDays(last.start, t) < Math.max(10, avgP + 4);
    const margin = !rec.length ? 5 : rec.length === 1 ? 4 : Math.max(2, Math.min(10, Math.round(sd || 2)));
    const next = addDays(last.start, avg), wS = addDays(next, -margin), wE = addDays(next, margin);
    const ov = addDays(next, -14), fS = addDays(ov, -5), fE = addDays(ov, 1), pmsS = addDays(next, -7);
    const until = diffDays(t, next), past = onPeriod ? 0 : Math.max(0, -until);
    let phase = onPeriod ? 'period' : past > 0 ? 'late' : t >= fS && t <= fE ? (t === ov ? 'ovulation' : 'fertile') : t >= pmsS ? 'pms' : t < fS ? 'follicular' : 'luteal';
    return { has: true, s, last, rec, avg, avgP, sd, irregular, onPeriod, dayOfPeriod: onPeriod ? diffDays(last.start, t) + 1 : null, cycleDay: diffDays(last.start, t) + 1, next, wS, wE, ov, fS, fE, pmsS, until, past, phase, conf: rec.length >= 3 && !irregular ? 'عالية' : rec.length >= 1 ? 'متوسطة' : 'منخفضة' };
  }
  function lateGuide(p, irr, girl) {
    if (p <= 0) return null;
    if (girl) return p < 60 ? ['تأخرت الدورة ' + D(p) + ' يوماً عن موعدها المتوقع', 'تأخر الدورة أو عدم انتظامها شائع في السنوات الأولى بعد البلوغ، ويتأثر بالتوتر والدراسة وقلة النوم وتغيّر الوزن. إن تكرر أو طال فأخبري أمك وراجعي الطبيبة.'] : ['غابت الدورة أكثر من شهرين', 'أخبري أمك وراجعي طبيبة النساء للاطمئنان، فلذلك أسباب كثيرة قابلة للعلاج.'];
    if (p < 7) return ['تأخرت الدورة ' + D(p) + (p === 1 ? ' يوماً' : ' أيام') + ' عن موعدها المتوقع', irr ? 'دورتك متغيرة في العادة، فقد يكون هذا التأخير طبيعياً. وإن كان الحمل محتملاً، فاختبار الحمل المنزلي يُظهر النتيجة من أول يوم تأخير، ويكون أدق بعد أسبوع.' : 'التوتر وقلة النوم وتغيّر الطعام أو السفر قد تؤخر الدورة أياماً. وإن كان الحمل محتملاً، فاختبار الحمل المنزلي يُظهر النتيجة من أول يوم تأخير، والأفضل إجراؤه صباحاً بأول بول.'];
    if (p < 21) return ['بلغ التأخير ' + D(p) + ' يوماً', 'إن كان الحمل محتملاً، فهذا وقت مناسب جداً لاختبار الحمل المنزلي لأن نتيجته الآن دقيقة. وإن كان سلبياً ولم تنزل الدورة، فأعيديه بعد ثلاثة أو أربعة أيام، أو اعملي تحليل الدم (Beta hCG) وهو أدق.'];
    if (p < 90) return ['بلغ التأخير ' + D(p) + ' يوماً', 'إن كان الاختبار سلبياً فمن المهم مراجعة طبيبة النساء؛ فقد يكون السبب تكيّس المبايض، أو الغدة الدرقية، أو هرمون الحليب، أو نقص الوزن أو زيادته، ولكلٍّ منها علاج.'];
    return ['غابت الدورة أكثر من ثلاثة أشهر', 'هذا يسمّى انقطاع الطمث، ويلزم مراجعة طبيبة النساء قريباً ولو كنتِ تشعرين بالعافية.'];
  }

  // ===== الحمل =====
  function pregInfo(lmp, t = today()) {
    const days = diffDays(lmp, t), week = Math.floor(days / 7), day = days % 7, edd = addDays(lmp, 280);
    return { days, week, day, edd, left: diffDays(t, edd), tri: week < 14 ? 1 : week < 28 ? 2 : 3, month: Math.min(9, Math.floor(days / 30.4) + 1), prog: Math.max(0, Math.min(1, days / 280)) };
  }
  function weekInfo(w) { const W = R().pregnancy.weeks, ks = Object.keys(W).map(Number).sort((a, b) => a - b); let k = ks[0]; for (const x of ks) if (x <= w) k = x; return Object.assign({ from: k }, W[k]); }

  // ===== البوابة: تختار عند أول دخول (فتاة / زوجة / أم) فيتكيّف المحتوى =====
  const WHO = { girl: ['👧', 'فتاة', 'لم أتزوج بعد'], wife: ['💍', 'زوجة', 'متزوجة'], mom: ['🤱', 'أم', 'أمٌّ أو حامل'] };
  let who = 'girl';
  const AGES = [['u12', '🧒', 'أقل من ١٢ سنة'], ['teen', '🌱', 'من ١٢ إلى ١٧ سنة'], ['adult', '🌷', '١٨ سنة فأكثر']];
  async function gate(el) {
    const age = await DB.setting('rafiqa-age');
    if (!age) {
      el.innerHTML = `<div class="card rf-gate"><div class="rf-ic">🌸</div><h2>أهلاً بكِ في «رفيقة»</h2><p>كم عمرك؟ ليعرض لكِ القسم ما يناسبك.</p>
        <div class="rf-who">${AGES.map(([k, ic, t]) => `<button class="card" data-age="${k}"><span>${ic}</span><b>${t}</b></button>`).join('')}</div>
        <small class="muted">لا نطلب تاريخ ميلادك، والجواب يُحفظ على جوالك فقط.</small><div style="margin-top:8px"><a class="btn sm" href="#/">رجوع</a></div></div>`;
      el.querySelectorAll('[data-age]').forEach(x => x.onclick = async () => { const a = x.dataset.age; await DB.setting('rafiqa-age', a); if (a === 'teen') await DB.setting('rafiqa-who', 'girl'); else if (a === 'adult') await DB.setting('rafiqa-who', null); window.SECNAV && SECNAV.refresh(); rer(); });
      return false;
    }
    if (age === 'u12') {
      el.innerHTML = `<div class="card rf-gate"><div class="rf-ic">🌷</div><h2>هذا القسم للفتيات الأكبر سناً</h2><p>لكِ قسم كامل ممتع: الحروف، وجزء عمّ، والقصص، والأناشيد.</p>
        <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap"><a class="btn primary" href="#/kids">🧒 اذهبي إلى قسم الأطفال</a><button class="btn sm" id="rfAgeX">تغيير العمر</button></div></div>`;
      el.querySelector('#rfAgeX').onclick = async () => { await DB.setting('rafiqa-age', null); rer(); };
      return false;
    }
    const w = await DB.setting('rafiqa-who');
    if (age === 'teen') { who = 'girl'; if (w !== 'girl') await DB.setting('rafiqa-who', 'girl'); return true; }
    if (w && WHO[w]) { who = w; return true; }
    el.innerHTML = `<div class="card rf-gate"><div class="rf-ic">🌸</div><h2>أهلاً بكِ في «رفيقة»</h2>
      <p>اختاري ما يناسبك، ليعرض لكِ القسم ما يخصّك:</p>
      <div class="rf-who">${Object.entries(WHO).map(([k, [ic, t, d]]) => `<button class="card" data-who="${k}"><span>${ic}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div>
      <small class="muted">يمكنك التغيير في أي وقت، وبياناتك تبقى على جوالك فقط.</small><div style="margin-top:8px"><a class="btn sm" href="#/">رجوع</a></div></div>`;
    el.querySelectorAll('[data-who]').forEach(x => x.onclick = async () => { await DB.setting('rafiqa-who', x.dataset.who); window.SECNAV && SECNAV.refresh(); rer(); });
    return false;
  }
  const isGirl = () => who === 'girl';
  const HIDE_FIQH_GIRL = ['marriage', 'nikah', 'talaq', 'radaa', 'siyam', 'nifas'];   // الزواج والحمل والولادة
  const HIDE_LIFE_STAGE_GIRL = ['bride', 'mother', 'menopause'];
  // أي نصيحة فيها ذكر للعلاقة أو الزوج أو الحمل أو الرضاعة لا تظهر للفتاة
  const ADULT_RX = /العلاقة|الجماع|المعاشرة|زوج|الحمل|حمل|حامل|المتزوج|الرضاعة|الرضيع|الولادة|النفاس|الإجهاض|اختبار الحمل|منع|الرغبة/;
  const cutA = t => t.split(/(?<=[.؟])\s+/).filter(x => !ADULT_RX.test(x)).join(' ').replace(/،\s*والجماع/g, '');
  const gq = a => isGirl() ? (a || []).filter(x => !ADULT_RX.test(x.q)).map(x => ({ q: x.q, a: cutA(x.a) })).filter(x => x.a) : (a || []);
  const gf = a => isGirl() ? (a || []).filter(x => !ADULT_RX.test(typeof x === 'string' ? x : (x.q || '') + ' ' + (x.a || ''))) : (a || []);
  const HIDE_LIFE_GIRL = ['العلاقة بين الزوجين', 'تنظيم النسل', 'أهل الزوج', 'السنة الأولى'];
  const HIDE_FIT_GIRL = ['preg', 'birth', 'post'];

  const GIRL_D = { fit: 'تخسيس، وتهدئة، ولياقة', fiqh: 'الطهارة والعبادات والزينة', life: 'البلوغ والثقة وأهدافك' };
  const SECS = [
    ['cycle', '🩸', 'دورتي', 'التقويم والتوقّع وعلامات الطهر'],
    ['preg', '🤰', 'حملي', 'الحمل أسبوعاً بأسبوع والكشوفات والولادة'],
    ['fit', '🏃‍♀️', 'تمارين', 'تخسيس، وتهدئة، وللحامل، وبعد الولادة'],
    ['fiqh', '⚖️', 'أحكامك', 'الطهارة والعبادات والزينة والأسرة'],
    ['seerah', '🌟', 'قدوتي', 'سِيَر الصالحات من القرآن والسنة'],
    ['status', '👑', 'مكانتك', 'كرامة المرأة والرد على الشبهات'],
    ['life', '🌱', 'مراحل حياتك', 'فتاةً وعروساً وزوجةً وأماً'],
    ['parent', '👨‍👩‍👧', 'تربية الأبناء', 'من الرضاعة حتى الزواج'],
    ['books', '📚', 'المصادر', 'الكتب والمراجع ومنهج القسم'],
  ];

  V.rafiqa = async (el, [sec, a, b]) => {
    if (!(await gate(el))) return;
    el.innerHTML = '<div class="card muted">جارٍ التحميل…</div>';
    try { await load(); } catch (e) { el.innerHTML = '<div class="warn">تعذّر تحميل محتوى «رفيقة».</div>'; return; }
    const r = await get();
    const back = sec ? `<a class="btn sm" href="#/rafiqa${sec && a ? '/' + sec : ''}">← ${sec && a ? 'رجوع' : 'رفيقة'}</a>` : '';
    if (sec === 'parent') { location.replace('#/tarbiya'); return; }
    const F = { cycle, preg, fit, fiqh, seerah, status, life, books }[sec];
    if (!F) {
      const info = analyze(r.periods);
      const ph = info.has ? R().cycle.phases[isGirl() && (info.phase === 'fertile' || info.phase === 'ovulation') ? 'follicular' : info.phase] : null;
      const pi = r.preg && r.preg.lmp ? pregInfo(r.preg.lmp) : null;
      const sw = R().seerah.women, si = Math.floor(Date.now() / 864e5) % sw.length, sd = sw[si];
      el.innerHTML = `<div class="rf-hero"><h1>🌸 رفيقة</h1><div>رفيقتك في كل مراحل حياتك: صحتك، ودينك، وبيتك.</div></div>
        <div class="rf-now">${!isGirl() && pi && pi.week >= 0 && pi.week <= 42 ? `<a class="card rf-nc" href="#/rafiqa/preg"><b>🤰 الأسبوع ${D(pi.week)} من الحمل</b><small>باقٍ على الولادة ${D(Math.max(0, pi.left))} يوماً</small></a>` : info.has ? `<a class="card rf-nc" href="#/rafiqa/cycle" style="--c:#c2185b"><b>${esc(ph.name)}</b><small>${info.onPeriod ? 'اليوم ' + D(info.dayOfPeriod) + ' من الدورة' : info.past ? 'متأخرة ' + D(info.past) + ' يوماً' : 'الدورة القادمة بعد ' + D(info.until) + ' يوماً تقريباً'}</small></a>` : `<a class="card rf-nc" href="#/rafiqa/cycle"><b>🩸 ابدئي بتسجيل دورتك</b><small>ليتوقّع التطبيق موعدها القادم</small></a>`}
          <a class="card rf-nc" href="#/rafiqa/seerah/w/${sd.id}"><b>🌟 قدوة اليوم: ${esc(sd.name)}</b><small>${esc(sd.short)}</small></a></div>
        <div class="row rf-whobar"><small>${WHO[who][0]} القسم معروض لكِ: <b>${WHO[who][1]}</b></small><span class="spacer"></span><button class="btn sm" id="rfWho">تغيير</button></div>
        <div class="fam-grid">${SECS.filter(([k]) => !(isGirl() && (k === 'preg' || k === 'parent'))).map(([k, ic, t, d]) => [k, ic, t, isGirl() ? (GIRL_D[k] || d) : d]).map(([k, ic, t, d]) => `<a class="fam-tile rf-tile" href="${k === 'parent' ? '#/tarbiya' : '#/rafiqa/' + k}"><span class="fam-ic">${ic}</span><b>${t}</b><small>${d}</small></a>`).join('')}</div>
        <div class="muted" style="font-size:12.5px;margin-top:10px">المعلومات الطبية للتوعية، وليست بديلاً عن الطبيبة. والأحكام بأدلتها من الكتاب والسنة وكتب أهل العلم.</div>`;
      el.querySelector('#rfWho').onclick = async () => { await DB.setting('rafiqa-who', null); await DB.setting('rafiqa-age', null); window.SECNAV && SECNAV.refresh(); rer(); };
      return;
    }
    el.innerHTML = `<div class="row rf-top">${back}<span class="spacer"></span></div><div id="rfB"></div>`;
    await F(el.querySelector('#rfB'), r, a, b);
  };

  // ================= دورتي =================
  const PHC = { period: '#E04F7E', follicular: '#8E6CCB', fertile: '#3C9C8E', ovulation: '#2E7D6F', luteal: '#5A8ED6', pms: '#D0843A', late: '#C73552' };
  const MARK = { period: '#E04F7E', predicted: '#FDE4EC', fertile: '#DFF4EF', ovulation: '#3C9C8E', pms: '#FDEEDC' };
  function marks(r, info) {
    const map = {}, t = today(), s = [...r.periods].sort((a, b) => a.start.localeCompare(b.start));
    for (const p of s) { const end = p.end || (p === s[s.length - 1] && info.onPeriod ? t : addDays(p.start, (info.avgP || 6) - 1)); for (let k = p.start; k <= end; k = addDays(k, 1)) map[k] = 'period'; }
    if (info.has && !r.preg) for (let i = 0; i < 3; i++) {
      const st = addDays(info.next, i * info.avg), ov = addDays(st, -14);
      if (!isGirl()) for (let k = addDays(ov, -5); k <= addDays(ov, 1); k = addDays(k, 1)) if (k > t && !map[k]) map[k] = k === ov ? 'ovulation' : 'fertile';
      for (let k = addDays(st, -5); k < st; k = addDays(k, 1)) if (k > t && !map[k]) map[k] = 'pms';
      for (let j = 0; j < info.avgP; j++) { const k = addDays(st, j); if (k > t && !map[k]) map[k] = 'predicted'; }
    }
    return map;
  }
  let calM = null, calSel = null;
  async function cycle(el, r, tab) {
    const C = R().cycle, info = analyze(r.periods), t = today();
    tab = tab || 'cal';
    const tabs = `<div class="tabs"><button class="${tab === 'cal' ? 'on' : ''}" data-t="cal">📅 التقويم</button><button class="${tab === 'log' ? 'on' : ''}" data-t="log">📝 يومياتي</button><button class="${tab === 'pure' ? 'on' : ''}" data-t="pure">🤍 علامات الطهر</button><button class="${tab === 'calm' ? 'on' : ''}" data-t="calm">🌿 هدّئي نفسك</button><button class="${tab === 'health' ? 'on' : ''}" data-t="health">🩺 صحتك</button><button class="${tab === 'stats' ? 'on' : ''}" data-t="stats">📊 إحصائياتي</button></div>`;
    let h = '<h1>🩸 دورتي</h1>' + tabs;
    if (tab === 'cal') {
      const gp = info.has && isGirl() && (info.phase === 'fertile' || info.phase === 'ovulation') ? 'follicular' : info.phase;
      const ph = info.has ? C.phases[gp] : null, lg = info.has ? lateGuide(info.past, info.irregular, isGirl()) : null;
      const last = [...r.periods].sort((a, b) => a.start.localeCompare(b.start)).pop();
      calM = calM || { y: new Date().getFullYear(), m: new Date().getMonth() }; calSel = calSel || t;
      const mk = marks(r, info), first = new Date(calM.y, calM.m, 1), n = new Date(calM.y, calM.m + 1, 0).getDate();
      h += `${ph ? `<div class="card rf-phase" style="--c:${PHC[gp]}"><b>${esc(ph.name)}</b><div>${esc(ph.summary)}</div>
          ${info.onPeriod ? `<div class="muted">اليوم ${D(info.dayOfPeriod)} من الدورة</div>` : `<div class="muted">اليوم ${D(info.cycleDay)} من الدورة · الدورة القادمة المتوقعة: ${fmtD(info.wS)} – ${fmtD(info.wE)} (دقة التوقع ${info.conf})</div>`}
          <details><summary>تفاصيل هذه المرحلة</summary>${ph.body && ph.body.length ? `<b>جسمك</b><ul>${gf(ph.body).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${ph.mood && ph.mood.length ? `<b>مزاجك</b><ul>${gf(ph.mood).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${ph.tips && ph.tips.length ? `<b>نصائح</b><ul>${gf(ph.tips).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details></div>` : '<div class="card">سجّلي أول يوم في دورتك القادمة (أو الأخيرة) ليبدأ التطبيق في التوقّع. وكلما سجّلتِ أكثر صار التوقّع أدق.</div>'}
        ${lg ? `<div class="warn"><b>${esc(lg[0])}</b><div>${esc(lg[1])}</div></div>` : ''}
        <div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0">${last && !last.end && diffDays(last.start, t) < 15 ? '<button class="btn primary" id="cEnd">✔ انتهت دورتي اليوم</button>' : '<button class="btn primary" id="cStart">🩸 بدأت دورتي اليوم</button>'}<button class="btn" id="cPick">📅 تسجيل بتاريخ آخر</button></div>
        <div class="card"><div class="row rf-mnav"><button class="btn sm" id="mPrev">→</button><b>${MONTHS[calM.m]} ${D(calM.y)}</b><button class="btn sm" id="mNext">←</button></div>
          <div class="rf-cal">${['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => `<i>${d}</i>`).join('')}${'<span></span>'.repeat(first.getDay())}${Array.from({ length: n }, (_, i) => { const k = toKey(new Date(calM.y, calM.m, i + 1)), kind = mk[k]; return `<button class="${k === t ? 'today' : ''} ${k === calSel ? 'sel' : ''}" data-d="${k}" style="${kind ? `--k:${MARK[kind]}` : ''}" ${kind ? 'data-k="' + kind + '"' : ''}>${D(i + 1)}${r.journal[k] ? '<s></s>' : ''}</button>`; }).join('')}</div>
          <div class="rf-leg">${[['period', 'الدورة'], ['predicted', 'متوقعة'], ['fertile', 'خصوبة'], ['ovulation', 'تبويض'], ['pms', 'ما قبل الدورة']].filter(([k]) => !(isGirl() && (k === 'fertile' || k === 'ovulation'))).map(([k, l]) => `<span><i style="background:${MARK[k]}"></i>${l}</span>`).join('')}</div></div>
        <div id="cDay"></div>`;
    } else if (tab === 'log') {
      const ks = Object.keys(r.journal).sort().reverse();
      h += `<div class="sub">سجّلي مزاجك وأعراضك يومياً من التقويم، فيستخرج التطبيق ما يتكرر معك قبل الدورة.</div><button class="btn primary" id="jToday">📝 يوميات اليوم</button>
        <div class="bt-list" style="margin-top:10px">${ks.map(k => { const j = r.journal[k], md = C.moods.find(m => m.key === j.mood); return `<div class="bt-row"><b>${fmtD(k, true)}</b><small>${md ? esc(md.label) : ''} ${(j.sym || []).map(esc).join('، ')} ${j.flow ? '· ' + esc((C.flow.find(f => f.key === j.flow) || {}).label || '') : ''}</small>${j.note ? `<small class="muted">${esc(j.note)}</small>` : ''}<span class="spacer"></span><button class="btn sm" data-jd="${k}">✏️</button></div>`; }).join('') || '<div class="muted">لا يوميات بعد.</div>'}</div>`;
    } else if (tab === 'pure') {
      const P = C.purity;
      h += `<div class="card"><p>${esc(P.intro)}</p>${P.signs.map(s => `<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`).join('')}<h3>كيف تتأكدين؟</h3><ul>${P.howTo.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><a class="btn" href="#/rafiqa/fiqh">⚖️ أحكام الحيض والطهارة كاملة</a>`;
    } else if (tab === 'calm') {
      h += `<div class="sub">اختاري ما تشعرين به الآن:</div>${Object.entries(C.calm).map(([k, v]) => `<details class="card"><summary><b>${esc(k)}</b></summary><ul>${gf(v).map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
        <h2>🌬️ تمارين التنفّس</h2>${C.breathing.map((b, i) => `<div class="card"><b>${esc(b.name)}</b><div class="muted">${esc(b.desc)}</div><small>${b.steps.map(x => esc(x.label) + ' ' + D(x.secs)).join(' ← ')} · ${D(b.rounds)} جولات</small><div><button class="btn sm" data-br="${i}">▶ ابدئي</button></div><div class="rf-breath" id="br${i}"></div></div>`).join('')}
        <a class="btn" href="#/ruqyah">🛡️ الرقية الشرعية</a> <a class="btn" href="#/duas/hamm">🤲 أدعية الهم والحزن</a>`;
    } else if (tab === 'health') {
      h += C.health.map(x => `<details class="card"><summary><b>${esc(x.title)}</b></summary><ul>${gf(x.points).map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>`).join('') + (C.healthSources ? `<div class="muted" style="font-size:12.5px">المصادر: ${esc([].concat(C.healthSources).join('، '))}</div>` : '');
    } else if (tab === 'stats') {
      const pre = {}; if (info.has) for (const p of info.s) for (let k = addDays(p.start, -5); k < p.start; k = addDays(k, 1)) (r.journal[k] && r.journal[k].sym || []).forEach(x => pre[x] = (pre[x] || 0) + 1);
      const top = Object.entries(pre).sort((a, b) => b[1] - a[1]).slice(0, 5);
      h += info.has ? `<div class="bt-sum"><div><small>متوسط الدورة</small><b>${D(info.avg)} يوماً</b></div><div><small>متوسط أيام الحيض</small><b>${D(info.avgP)}</b></div><div><small>الانتظام</small><b>${info.irregular ? 'غير منتظمة' : 'منتظمة'}</b></div></div>
        <div class="card"><h3>آخر الدورات</h3><div class="bt-list">${[...info.s].reverse().slice(0, 12).map(p => `<div class="bt-row"><b>${fmtD(p.start)}</b><small>${p.end ? D(diffDays(p.start, p.end) + 1) + ' أيام' : 'جارية'}</small><span class="spacer"></span><button class="btn sm" data-pd="${p.start}">🗑️</button></div>`).join('')}</div></div>
        ${top.length ? `<div class="card"><h3>ما يتكرر معك قبل الدورة</h3><ul>${top.map(([s, n]) => `<li>${esc(s)} (${D(n)} مرات)</li>`).join('')}</ul></div>` : ''}` : '<div class="card muted">سجّلي دورتين على الأقل لتظهر الإحصائيات.</div>';
    }
    el.innerHTML = h;
    el.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { location.hash = '#/rafiqa/cycle/' + x.dataset.t; });
    const $ = s => el.querySelector(s);
    const startOn = async k => { r.periods = r.periods.filter(p => p.start !== k); r.periods.push({ start: k, end: null }); await save(r); if (window.NOTIFY) NOTIFY.rescheduleAll(); APP.toast('سُجّلت بداية الدورة — شفاكِ الله وأعانكِ'); rer(); };
    if ($('#cStart')) $('#cStart').onclick = () => startOn(t);
    if ($('#cEnd')) $('#cEnd').onclick = async () => { const l = [...r.periods].sort((a, b) => a.start.localeCompare(b.start)).pop(); l.end = t; await save(r); APP.toast('سُجّلت نهاية الدورة — راجعي علامات الطهر قبل الغسل'); rer(); };
    if ($('#cPick')) $('#cPick').onclick = async () => { const x = await APP.ask('تسجيل دورة سابقة', [{ key: 's', label: 'تاريخ البداية (YYYY-MM-DD)' }, { key: 'e', label: 'تاريخ النهاية (اختياري)' }], { s: t }); if (!x || !/^\d{4}-\d{2}-\d{2}$/.test(x.s)) return; r.periods = r.periods.filter(p => p.start !== x.s); r.periods.push({ start: x.s, end: /^\d{4}-\d{2}-\d{2}$/.test(x.e || '') ? x.e : (x.s < addDays(t, -14) ? addDays(x.s, 5) : null) }); await save(r); rer(); };
    if ($('#mPrev')) { $('#mPrev').onclick = () => { calM = calM.m ? { y: calM.y, m: calM.m - 1 } : { y: calM.y - 1, m: 11 }; rer(); }; $('#mNext').onclick = () => { calM = calM.m < 11 ? { y: calM.y, m: calM.m + 1 } : { y: calM.y + 1, m: 0 }; rer(); }; }
    const dayPanel = k => {
      const j = r.journal[k] || {}, box = $('#cDay'); if (!box) return;
      box.innerHTML = `<div class="card"><h3>${fmtD(k, true)}</h3>
        <b>المزاج</b><div class="rf-chips">${C.moods.map(m => `<button class="${j.mood === m.key ? 'on' : ''}" data-m="${m.key}">${esc(m.label)}</button>`).join('')}</div>
        <b>الأعراض</b><div class="rf-chips">${C.symptoms.map(s => `<button class="${(j.sym || []).includes(s) ? 'on' : ''}" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <b>كمية الدم</b><div class="rf-chips">${C.flow.map(f => `<button class="${j.flow === f.key ? 'on' : ''}" data-f="${f.key}">${esc(f.label)}</button>`).join('')}</div>
        <input id="jN" placeholder="ملاحظة" value="${esc(j.note || '')}" style="width:100%;margin-top:6px">
        <div class="row" style="gap:6px;margin-top:8px"><button class="btn primary" id="jS">حفظ</button>${r.periods.some(p => p.start === k) ? '' : '<button class="btn" id="jP">🩸 بدأت الدورة في هذا اليوم</button>'}</div></div>`;
      const st = { mood: j.mood, sym: [...(j.sym || [])], flow: j.flow };
      box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { st.mood = st.mood === b.dataset.m ? null : b.dataset.m; box.querySelectorAll('[data-m]').forEach(z => z.classList.toggle('on', z.dataset.m === st.mood)); });
      box.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const s = b.dataset.s, i = st.sym.indexOf(s); if (i >= 0) st.sym.splice(i, 1); else st.sym.push(s); b.classList.toggle('on'); });
      box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { st.flow = st.flow === b.dataset.f ? null : b.dataset.f; box.querySelectorAll('[data-f]').forEach(z => z.classList.toggle('on', z.dataset.f === st.flow)); });
      box.querySelector('#jS').onclick = async () => { const note = box.querySelector('#jN').value.trim(); if (!st.mood && !st.sym.length && !st.flow && !note) delete r.journal[k]; else r.journal[k] = { mood: st.mood, sym: st.sym, flow: st.flow, note }; await save(r); APP.toast('حُفظت يوميات اليوم'); rer(); };
      const jp = box.querySelector('#jP'); if (jp) jp.onclick = () => startOn(k);
    };
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { calSel = b.dataset.d; el.querySelectorAll('[data-d]').forEach(z => z.classList.toggle('sel', z === b)); dayPanel(calSel); });
    if ($('#cDay')) dayPanel(calSel);
    if ($('#jToday')) $('#jToday').onclick = () => { calSel = t; location.hash = '#/rafiqa/cycle/cal'; };
    el.querySelectorAll('[data-jd]').forEach(b => b.onclick = () => { calSel = b.dataset.jd; const d = fromKey(calSel); calM = { y: d.getFullYear(), m: d.getMonth() }; location.hash = '#/rafiqa/cycle/cal'; });
    el.querySelectorAll('[data-pd]').forEach(b => b.onclick = async () => { if (!(await APP.ask('حذف هذه الدورة من السجل؟'))) return; r.periods = r.periods.filter(p => p.start !== b.dataset.pd); await save(r); rer(); });
    el.querySelectorAll('[data-br]').forEach(b => b.onclick = () => breathe(el.querySelector('#br' + b.dataset.br), C.breathing[b.dataset.br]));
  }
  function breathe(box, B) {
    const st = B.steps; let i = 0, n = 0, left = st[0].secs;
    document.querySelectorAll('.rf-breath').forEach(x => { clearInterval(x._t); x.innerHTML = ''; });
    box.innerHTML = '<div class="rf-ball"></div><b></b>';
    const ball = box.firstChild, lab = box.lastChild;
    const show = () => { const s = st[i], up = /شهيق/.test(s.label), down = /زفير/.test(s.label); lab.textContent = s.label + ' ' + D(left); if (left === s.secs) { ball.style.transitionDuration = s.secs + 's'; ball.style.transform = `scale(${up ? 1.6 : down ? 0.8 : ball.dataset.s || 1})`; ball.dataset.s = up ? 1.6 : down ? 0.8 : ball.dataset.s || 1; } };
    show();
    box._t = setInterval(() => { if (!document.body.contains(box)) return clearInterval(box._t); if (--left <= 0) { i = (i + 1) % st.length; if (!i && ++n >= B.rounds) { clearInterval(box._t); lab.textContent = 'أحسنتِ 🌿'; ball.style.transform = 'scale(1)'; return; } left = st[i].secs; } show(); }, 1000);
  }

  // ================= حملي =================
  async function preg(el, r, tab) {
    if (isGirl()) { el.innerHTML = '<div class="card">هذا الجزء للمتزوجات. يمكنك تغيير اختيارك من صفحة «رفيقة».</div>'; return; }
    const P = R().pregnancy, t = today();
    if (!r.preg || !r.preg.lmp) {
      el.innerHTML = `<h1>🤰 حملي</h1><div class="card"><p>أدخلي <b>أول يوم في آخر دورة</b> قبل الحمل، فيحسب التطبيق عمر الحمل بالأسابيع، وموعد الولادة المتوقع (قاعدة نيجل)، والكشوفات القادمة.</p>
        <input type="date" id="pL" max="${t}"><div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" id="pGo">ابدئي متابعة الحمل</button></div>
        <small class="muted">أو إن كنتِ تعرفين موعد الولادة من الطبيبة: <input type="date" id="pE"></small></div>
        <h2>بعد الولادة</h2>${P.postpartum.map(x => `<details class="card"><summary><b>${esc(x.title)}</b></summary><ul>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>`).join('')}`;
      el.querySelector('#pGo').onclick = async () => { let l = el.querySelector('#pL').value; const e = el.querySelector('#pE').value; if (!l && e) l = addDays(e, -280); if (!l) return APP.toast('اختاري التاريخ'); r.preg = { lmp: l }; await save(r); if (window.NOTIFY) NOTIFY.rescheduleAll(); rer(); };
      return;
    }
    const pi = pregInfo(r.preg.lmp), wk = weekInfo(Math.max(4, pi.week));
    tab = tab || 'week';
    const T = [['week', '📆 أسبوعك'], ['checks', '🩺 الكشوفات'], ['visits', '📋 زياراتي'], ['kicks', '👣 حركة الجنين'], ['labor', '⏱️ الولادة'], ['after', '🍼 بعد الولادة']];
    let h = `<h1>🤰 حملي</h1><div class="card rf-preg"><div class="row"><b>الأسبوع ${D(pi.week)} و${D(pi.day)} أيام</b><span class="spacer"></span><span class="tag">${esc(P.trimesters[pi.tri].name)}</span></div>
      <div class="lr-progress"><i style="width:${Math.round(pi.prog * 100)}%"></i></div><div class="muted">الشهر ${D(pi.month)} · موعد الولادة المتوقع: <b>${fmtD(pi.edd, true)}</b> · باقٍ ${D(Math.max(0, pi.left))} يوماً</div></div>
      <div class="tabs">${T.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>`;
    if (tab === 'week') h += `<div class="card"><h3>👶 حجم الجنين: ${esc(wk.size)}</h3><p>${esc(wk.baby)}</p><h3>🤱 لكِ</h3><p>${esc(wk.mom)}</p></div>
      <div class="card"><h3>نصائح ${esc(P.trimesters[pi.tri].name)}</h3><ul>${(P.tips[pi.tri] || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="warn"><b>⚠️ علامات خطر: راجعي الطوارئ فوراً</b><ul>${P.danger.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    else if (tab === 'checks') h += `<div class="sub">جدول الكشوفات والتحاليل المعتاد، بموعده حسب عمر حملك. وتصلك تذكرة قبل كل موعد.</div><div class="bt-list">${P.checks.map(c => { const d = addDays(r.preg.lmp, c.week * 7), past = d < t; return `<div class="bt-row ${past ? 'done' : ''}"><b>الأسبوع ${D(c.week)}: ${esc(c.title)}</b><small class="muted">${fmtD(d)}</small><div style="flex-basis:100%"><small>${c.items.map(esc).join(' · ')}</small></div></div>`; }).join('')}</div>`;
    else if (tab === 'visits') h += `<div class="card bt-add"><input id="vW" placeholder="الوزن (كجم)" inputmode="decimal" style="width:110px"><input id="vB" placeholder="الضغط (120/80)" style="width:120px"><input id="vN" placeholder="ملاحظات الطبيبة"><button class="btn primary" id="vAdd">➕ زيارة</button></div>
      <div class="bt-list">${[...r.visits].reverse().map(v => `<div class="bt-row"><b>${fmtD(v.date)}</b><small>الأسبوع ${D(v.week)}${v.w ? ' · ' + D(v.w) + ' كجم' : ''}${v.bp ? ' · ضغط ' + esc(v.bp) : ''}</small>${v.n ? `<small class="muted">${esc(v.n)}</small>` : ''}<span class="spacer"></span><button class="btn sm" data-vx="${v.id}">🗑️</button></div>`).join('') || '<div class="muted">سجّلي زيارات الطبيبة لتتابعي وزنك وضغطك.</div>'}</div>`;
    else if (tab === 'kicks') { const k = r.kicks.filter(x => x.d === t); h += `<div class="card rf-kick"><p>من الأسبوع ٢٨: عُدّي حركات الجنين في وقت نشاطه. المعتاد ١٠ حركات خلال ساعتين أو أقل.</p><button class="btn primary rf-kb" id="kick">👣 حركة</button><div class="bt-big">${D(k.length)}</div><div class="muted">${k.length ? 'من ' + new Date(k[0].t).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}${k.length >= 10 ? ' — ✔ أحسنتِ، ١٠ حركات' : ''}</div><button class="btn sm" id="kReset">تصفير</button></div><div class="warn">إن قلّت الحركة بوضوح عن المعتاد، فراجعي المستشفى ولا تنتظري.</div>`; }
    else if (tab === 'labor') { const L = P.labor; h += `<div class="card"><h3>علامات الولادة</h3><ul>${L.signs.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p><b>${esc(L.rule)}</b></p></div>
      <div class="card"><h3>⏱️ مؤقت الطلق</h3><button class="btn primary" id="ctB">بدأ الطلق</button><div id="ctL" class="bt-list" style="margin-top:8px"></div></div>
      <div class="card"><h3>🎒 شنطة الولادة</h3><ul>${L.bag.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>${L.duaa ? `<div class="card"><h3>🤲 دعاء</h3><p>${esc(L.duaa)}</p></div>` : ''}`; }
    else if (tab === 'after') h += P.postpartum.map(x => `<details class="card" open><summary><b>${esc(x.title)}</b></summary><ul>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>`).join('');
    h += `<div class="row" style="margin-top:12px"><button class="btn sm" id="pStop">انتهى الحمل / بدء من جديد</button></div>`;
    el.innerHTML = h;
    const $ = s => el.querySelector(s);
    el.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { location.hash = '#/rafiqa/preg/' + x.dataset.t; });
    $('#pStop').onclick = async () => { if (!(await APP.ask('إنهاء متابعة الحمل؟ (يبقى سجل الزيارات)'))) return; r.preg = null; await save(r); if (window.NOTIFY) NOTIFY.rescheduleAll(); rer(); };
    if ($('#vAdd')) $('#vAdd').onclick = async () => { r.visits.push({ id: Date.now().toString(36), date: t, week: pi.week, w: $('#vW').value.trim(), bp: $('#vB').value.trim(), n: $('#vN').value.trim() }); await save(r); rer(); };
    el.querySelectorAll('[data-vx]').forEach(b => b.onclick = async () => { r.visits = r.visits.filter(v => v.id !== b.dataset.vx); await save(r); rer(); });
    if ($('#kick')) { $('#kick').onclick = async () => { r.kicks = r.kicks.filter(x => x.d >= addDays(t, -7)); r.kicks.push({ d: t, t: Date.now() }); if (navigator.vibrate) navigator.vibrate(30); await save(r); rer(); }; $('#kReset').onclick = async () => { r.kicks = r.kicks.filter(x => x.d !== t); await save(r); rer(); }; }
    if ($('#ctB')) {
      const L = []; let cur = null;
      const paint = () => { $('#ctB').textContent = cur ? 'انتهى الطلق' : 'بدأ الطلق'; $('#ctL').innerHTML = L.slice(-8).reverse().map((c, i, a) => { const gap = a[i + 1] ? Math.round((c.s - a[i + 1].s) / 60000) : null; return `<div class="bt-row"><b>${D(Math.round((c.e - c.s) / 1000))} ثانية</b>${gap != null ? `<small>كل ${D(gap)} دقائق</small>` : ''}</div>`; }).join(''); const last = L.slice(-6); if (last.length >= 4) { const gaps = last.slice(1).map((c, i) => (c.s - last[i].s) / 60000), dur = last.map(c => (c.e - c.s) / 1000); if (gaps.every(g => g <= 5.5) && dur.every(d => d >= 50)) $('#ctL').insertAdjacentHTML('afterbegin', '<div class="warn"><b>قاعدة ٥-١-١ تحققت تقريباً: توجّهي للمستشفى.</b></div>'); } };
      $('#ctB').onclick = () => { if (cur) { cur.e = Date.now(); L.push(cur); cur = null; } else cur = { s: Date.now() }; paint(); };
    }
  }

  // ================= التمارين =================
  const JOINTS = ['head', 'neck', 'hip', 'le', 'lh', 're', 'rh', 'lk', 'lf', 'rk', 'rf'];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const figSvg = (e, t, preg) => window.FIG.svg(R().fitness.poses, e, t, { look: 'woman', preg, kegel: e.kegel });
  // تحريك كل الرسومات الظاهرة
  let animT = null;
  function animate(root) {
    clearInterval(animT); const t0 = Date.now();
    animT = setInterval(() => {
      if (!document.body.contains(root)) { clearInterval(animT); return; }
      root.querySelectorAll('[data-fig]').forEach(f => { if (f.dataset.pause === '1' && f.firstChild) return; const e = R().fitness.exercises[f.dataset.fig]; if (!e) return; const t = f.dataset.pause === '1' ? 0 : (1 - Math.cos((Date.now() - t0) / (e.speed || 1200) * Math.PI)) / 2; f.innerHTML = figSvg(e, t, f.dataset.preg === '1'); });
    }, 60);
  }
  async function fit(el, r, cat, id) {
    const F = R().fitness, isPreg = c => !isGirl() && (c === 'preg' || (r.preg && r.preg.lmp));
    if (!cat) {
      el.innerHTML = `<h1>🏃‍♀️ تمارين</h1><div class="sub">تمارين منزلية بلا أجهزة، لكل تمرين رسمة متحركة وخطوات ومؤقت، وبرامج جاهزة بمؤقت كامل.</div>
        <div class="du-grid">${F.cats.filter(c => !(isGirl() && HIDE_FIT_GIRL.includes(c.key))).map(c => `<a class="card du-cat" href="#/rafiqa/fit/${c.key}"><b>${esc(c.name)}</b><small class="muted">${esc(c.desc)}</small></a>`).join('')}</div>
        <div class="warn"><b>⚠️ للأمان</b><ul>${[].concat(F.safety && (F.safety.general || F.safety) || []).slice(0, 6).map(x => `<li>${esc(typeof x === 'string' ? x : x.text || '')}</li>`).join('')}</ul></div>`;
      return;
    }
    if (isGirl() && HIDE_FIT_GIRL.includes(cat === 'run' ? (F.routines.find(x => x.id === id) || {}).cat : cat)) { el.innerHTML = '<div class="card">هذا الجزء للمتزوجات.</div>'; return; }
    if (cat === 'run') return runRoutine(el, r, id);
    if (cat === 'ex') {
      const e = F.exercises[id], d = (F.details || {})[id] || {};
      el.innerHTML = `<div class="card rf-ex"><div data-fig="${id}" data-preg="${isPreg(e.cat) ? 1 : 0}" class="rf-figbox big" style="width:200px;height:200px;margin:0 auto"></div><h2>${esc(e.name)}</h2>
        <ol>${e.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${e.tip ? `<p>💡 ${esc(e.tip)}</p>` : ''}
        ${d.target ? `<p><b>العضلات:</b> ${esc(d.target)}</p>` : ''}${d.breath ? `<p><b>التنفّس:</b> ${esc(d.breath)}</p>` : ''}
        ${d.mistakes ? `<b>أخطاء شائعة</b><ul>${d.mistakes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${d.easier ? `<p><b>أسهل:</b> ${esc(d.easier)}</p>` : ''}${d.harder ? `<p><b>أصعب:</b> ${esc(d.harder)}</p>` : ''}
        <div class="muted">${D(e.secs || 30)} ثانية${e.calories ? ' · نحو ' + D(e.calories) + ' سعرات' : ''}</div></div>`;
      animate(el); return;
    }
    const c = F.cats.find(x => x.key === cat), ex = Object.entries(F.exercises).filter(([, e]) => e.cat === cat && !(isGirl() && e.kegel)), rt = F.routines.filter(x => x.cat === cat);
    el.innerHTML = `<h1>${esc(c ? c.name : '')}</h1><div class="sub">${esc(c ? c.desc : '')}</div>
      ${rt.length ? `<h2>▶ برامج جاهزة</h2><div class="bt-list">${rt.map(x => `<a class="bt-row" href="#/rafiqa/fit/run/${x.id}" style="text-decoration:none;color:inherit"><b>${esc(x.name)}</b><small class="muted">${esc(x.level || '')} · ${D(x.list.length)} تمارين × ${D(x.rounds)} جولات</small><span class="spacer"></span><span class="btn sm primary">ابدئي</span></a>`).join('')}</div>` : ''}
      <h2>التمارين</h2><div class="rf-exs">${ex.map(([k, e]) => `<a class="card rf-exc" href="#/rafiqa/fit/ex/${k}"><div data-fig="${k}" data-preg="${isPreg(cat) ? 1 : 0}" class="rf-figbox" style="width:110px;height:110px"></div><b>${esc(e.name)}</b></a>`).join('')}</div>`;
    animate(el);
  }
  let run = null;
  async function runRoutine(el, r, id) {
    const F = R().fitness, rt = F.routines.find(x => x.id === id); if (!rt) { el.innerHTML = '<div class="warn">البرنامج غير موجود.</div>'; return; }
    const secs = r.fit.secs || 0, rest = r.fit.rest || rt.rest || 20, rounds = r.fit.rounds || rt.rounds || 2;
    const pl = F.phasePlan && F.phasePlan[rt.cat] || { warm: [], cool: [] };
    const steps = [{ k: 'ready', id: rt.list[0], s: 10 }];
    pl.warm.forEach(w => F.exercises[w] && steps.push({ k: 'warm', id: w, s: F.warmSecs || 30 }));
    for (let rn = 0; rn < rounds; rn++) rt.list.forEach((x, i) => { if (!F.exercises[x]) return; steps.push({ k: 'ex', id: x, s: secs || F.exercises[x].secs || 40, rn }); if (!(rn === rounds - 1 && i === rt.list.length - 1)) steps.push({ k: 'rest', id: rt.list[i + 1] || rt.list[0], s: rest }); });
    pl.cool.forEach(w => F.exercises[w] && steps.push({ k: 'cool', id: w, s: F.warmSecs || 30 }));
    if (run) clearInterval(run.t);
    run = { i: 0, left: steps[0].s, paused: false, t: null };
    let wake = null; try { wake = await navigator.wakeLock.request('screen'); } catch (e) { }
    const LBL = { ready: 'استعدّي', warm: 'إحماء', ex: 'تمرين', rest: 'راحة', cool: 'تهدئة' };
    const paint = () => {
      const s = steps[run.i], e = F.exercises[s.id];
      el.innerHTML = `<div class="card rf-run ${s.k}"><div class="row"><b>${esc(rt.name)}</b><span class="spacer"></span><small>${D(run.i + 1)}/${D(steps.length)}</small></div>
        <div class="tag">${LBL[s.k]}${s.k === 'ex' ? ' — الجولة ' + D(s.rn + 1) + ' من ' + D(rounds) : ''}</div>
        <div data-fig="${s.id}" data-pause="${run.paused || s.k === 'rest' || s.k === 'ready' ? 1 : 0}" data-preg="${!isGirl() && (rt.cat === 'preg' || (r.preg && r.preg.lmp)) ? 1 : 0}" class="rf-figbox big" style="width:200px;height:200px;margin:0 auto"></div>
        <h2>${s.k === 'rest' ? 'التالي: ' : ''}${esc(e.name)}</h2><div class="rf-clock">${D(run.left)}</div>
        <div class="lr-progress"><i style="width:${Math.round(run.i / steps.length * 100)}%"></i></div>
        <div class="row" style="gap:8px;justify-content:center;margin-top:10px"><button class="btn" id="rP">⏮</button><button class="btn primary" id="rT">${run.paused ? '▶ استمري' : '⏸ إيقاف مؤقت'}</button><button class="btn" id="rN">⏭</button><button class="btn" id="rX">✕ إنهاء</button></div>
        ${s.k !== 'rest' && e.steps ? `<ol class="rf-steps">${e.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}</div>`;
      el.querySelector('#rT').onclick = () => { run.paused = !run.paused; paint(); };
      el.querySelector('#rN').onclick = () => go(1); el.querySelector('#rP').onclick = () => go(-1);
      el.querySelector('#rX').onclick = () => { clearInterval(run.t); try { wake && wake.release(); } catch (e) { } location.hash = '#/rafiqa/fit/' + rt.cat; };
      animate(el);
    };
    const go = d => { run.i = Math.max(0, Math.min(steps.length - 1, run.i + d)); run.left = steps[run.i].s; if (navigator.vibrate) navigator.vibrate(200); paint(); };
    paint();
    run.t = setInterval(() => {
      if (!document.body.contains(el)) { clearInterval(run.t); try { wake && wake.release(); } catch (e) { } return; }
      if (run.paused) return;
      run.left--; const c = el.querySelector('.rf-clock'); if (c) c.textContent = D(Math.max(0, run.left));
      if (run.left <= 3 && run.left > 0 && navigator.vibrate) navigator.vibrate(60);
      if (run.left <= 0) { if (run.i >= steps.length - 1) { clearInterval(run.t); try { wake && wake.release(); } catch (e) { } el.innerHTML = '<div class="card rf-run"><h2>🎉 أحسنتِ! أتممتِ البرنامج</h2><p>تقبّل الله منكِ، والقوة في الطاعة.</p><a class="btn primary" href="#/rafiqa/fit">رجوع للتمارين</a></div>'; if (navigator.vibrate) navigator.vibrate([200, 100, 200]); return; } go(1); }
    }, 1000);
  }

  // ================= المعرفة =================
  async function fiqh(el, r, tid) {
    const F0 = R().fiqh, Fq = Object.assign({}, F0, { topics: F0.topics.filter(t => !(isGirl() && HIDE_FIQH_GIRL.includes(t.id))).map(t => Object.assign({}, t, { items: gq(t.items) })).filter(t => t.items.length) });
    if (tid) { const t = Fq.topics.find(x => x.id === tid); if (!t) { el.innerHTML = '<div class="card">غير متاح.</div>'; return; } el.innerHTML = `<h1>${esc(t.title)}</h1>${t.items.map(x => `<details class="card"><summary><b>${esc(x.q)}</b></summary><p class="rf-a">${esc(x.a)}</p></details>`).join('')}`; return; }
    const tags = [...new Set(Fq.topics.map(t => t.tag))];
    el.innerHTML = `<h1>⚖️ أحكامك</h1><div class="sub">${esc(Fq.note || '')}</div><input type="search" id="fqQ" placeholder="ابحثي في الأحكام…" style="width:100%;margin-bottom:10px"><div id="fqR"></div>
      ${tags.map(tg => `<h2>${esc(tg)}</h2><div class="bt-list">${Fq.topics.filter(t => t.tag === tg).map(t => `<a class="bt-row" href="#/rafiqa/fiqh/${t.id}" style="text-decoration:none;color:inherit"><b>${esc(t.title)}</b><small class="muted">${D(t.items.length)} مسائل</small></a>`).join('')}</div>`).join('')}
      ${Fq.sources ? `<div class="muted" style="font-size:12.5px;margin-top:10px">المصادر: ${esc(Fq.sources.join('، '))}</div>` : ''}`;
    el.querySelector('#fqQ').oninput = e => { const q = AR.normalize(e.target.value.trim()), box = el.querySelector('#fqR'); if (q.length < 2) { box.innerHTML = ''; return; } const hits = []; Fq.topics.forEach(t => t.items.forEach(x => { if (AR.normalize(x.q + ' ' + x.a).includes(q)) hits.push([t, x]); })); box.innerHTML = hits.slice(0, 20).map(([t, x]) => `<details class="card"><summary><b>${esc(x.q)}</b> <small class="muted">${esc(t.title)}</small></summary><p class="rf-a">${esc(x.a)}</p></details>`).join('') || '<div class="muted">لا نتائج</div>'; };
  }
  async function seerah(el, r, a, id) {
    const S = R().seerah;
    if (a === 'w') {
      const w = S.women.find(x => x.id === id); if (!w) return;
      r.seen[id] = 1; await save(r);
      el.innerHTML = `<div class="card rf-sw"><h1>${esc(w.name)}</h1><div class="tag">${esc(w.title)}</div><p class="muted">${esc(w.short)}</p>
        <h3>📖 سيرتها</h3>${w.story.map(p => `<p>${esc(p)}</p>`).join('')}<h3>🌟 من مواقفها</h3><ul>${w.stances.map(x => `<li>${esc(x)}</li>`).join('')}</ul><h3>💡 دروس لكِ</h3><ul>${w.lessons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        ${w.refs ? `<div class="muted" style="font-size:12.5px">المصادر: ${esc([].concat(w.refs).join('، '))}</div>` : ''}<button class="btn" id="swF">${r.fav[id] ? '★ في المفضلة' : '☆ أضيفي للمفضلة'}</button></div>`;
      el.querySelector('#swF').onclick = async () => { if (r.fav[id]) delete r.fav[id]; else r.fav[id] = 1; await save(r); rer(); };
      return;
    }
    const seen = Object.keys(r.seen).length;
    el.innerHTML = `<h1>🌟 قدوتي</h1><div class="sub">${D(S.women.length)} سيرة من الصالحات. قرأتِ منها ${D(seen)}.</div>
      ${S.groups.map(g => `<h2>${esc(g.name)}</h2><div class="rf-ws">${S.women.filter(w => w.group === g.key).map(w => `<a class="card rf-wc ${r.seen[w.id] ? 'seen' : ''}" href="#/rafiqa/seerah/w/${w.id}"><b>${esc(w.name)}${r.fav[w.id] ? ' ★' : ''}</b><small class="muted">${esc(w.title)}</small></a>`).join('')}</div>`).join('')}
      <div class="card"><label class="fld"><input type="checkbox" id="swR" ${r.remind.seerah ? 'checked' : ''}> 🔔 سيرة جديدة كل يوم الساعة <input type="time" id="swT" value="${r.remind.seerahT || '09:00'}"></label></div>`;
    const sv = async () => { r.remind.seerah = el.querySelector('#swR').checked; r.remind.seerahT = el.querySelector('#swT').value || '09:00'; await save(r); if (window.NOTIFY) { if (r.remind.seerah && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request(); NOTIFY.rescheduleAll(); } };
    el.querySelector('#swR').onchange = sv; el.querySelector('#swT').onchange = sv;
  }
  async function status(el) {
    const S = R().status;
    el.innerHTML = `<h1>👑 مكانتك في الإسلام</h1><div class="card"><h3>كرامتك</h3><ul>${S.honor.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <h2>💭 لنفسك</h2>${S.feelings.map(f => `<details class="card"><summary><b>${esc(f.q)}</b></summary><ul>${f.a.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
      <h2>🛡️ الرد على الشبهات</h2>${S.doubts.map(f => `<details class="card"><summary><b>${esc(f.q)}</b></summary><ul>${f.a.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}
      <div class="card"><h3>كيف تثبتين أمام الشبهات؟</h3><ul>${S.defense.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  }
  async function life(el) {
    const L = R().life;
    el.innerHTML = `<h1>🌱 مراحل حياتك</h1>${L.stages.filter(s => !(isGirl() && HIDE_LIFE_STAGE_GIRL.includes(s.id))).map(s => `<h2>${esc(s.name)}</h2>${s.sections.filter(x => !(isGirl() && HIDE_LIFE_GIRL.includes(x.title))).map(x => `<details class="card"><summary><b>${esc(x.title)}</b></summary><ul>${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>`).join('')}`).join('')}`;
  }
  async function books(el) {
    const B = R().library;
    el.innerHTML = `<h1>📚 المصادر ومنهج القسم</h1><div class="card"><h3>منهجنا</h3><ul>${B.method.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      ${B.books.map(c => `<h2>${esc(c.cat)}</h2><div class="bt-list">${c.items.map(x => `<div class="bt-row"><b>${esc(x.t)}</b><small class="muted">${esc(x.a)}</small>${x.d ? `<div style="flex-basis:100%"><small>${esc(x.d)}</small></div>` : ''}</div>`).join('')}</div>`).join('')}`;
  }

  // ===== التنبيهات: الدورة القادمة، وكشوفات الحمل، وسيرة اليوم =====
  if (window.NOTIFY) NOTIFY.register('rafiqa', async () => {
    const r = (await DB.setting('rafiqa')) || null; if (!r) return [];
    try { await load(); } catch (e) { return []; }
    const out = [], now = Date.now(), at = (k, h) => { const d = fromKey(k); d.setHours(h, 0, 0, 0); return d; };
    const info = analyze(r.periods || []);
    if (info.has && !(r.preg && r.preg.lmp) && (!r.remind || r.remind.period !== false) && !info.onPeriod) { const d = at(addDays(info.wS, -1), 9); if (d > now) out.push({ title: '🌸 قد تبدأ دورتك خلال يومين', body: 'استعدي، واعتني بنفسك. سجّلي أول يوم عند بدايتها.', at: d, route: '#/rafiqa/cycle' }); }
    const wh = await DB.setting('rafiqa-who');
    if (wh !== 'girl' && r.preg && r.preg.lmp) for (const c of R().pregnancy.checks) { const d = at(addDays(r.preg.lmp, c.week * 7 - 2), 10); if (d > now && d - now < 120 * 864e5) out.push({ title: '🩺 موعد قريب: ' + c.title, body: 'في الأسبوع ' + c.week + ' من الحمل', at: d, route: '#/rafiqa/preg/checks' }); }
    if (r.remind && r.remind.seerah) { const W = R().seerah.women, [h, m] = (r.remind.seerahT || '09:00').split(':').map(Number); for (let k = 0; k < 7; k++) { const d = new Date(); d.setDate(d.getDate() + k); d.setHours(h, m, 0, 0); const w = W[Math.floor(d.getTime() / 864e5) % W.length]; out.push({ title: '🌟 قدوة اليوم: ' + w.name, body: w.short, at: d, route: '#/rafiqa/seerah/w/' + w.id }); } }
    return out;
  });
  window.RAFIQA_APP = { analyze, pregInfo, load };
})();
