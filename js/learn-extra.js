/* 🌟 التحفيز في «الأطفال» و«محو الأمية»: رسم الحرف متحركاً، رحلتي (الخريطة)، الأوسمة، الشهادات، الهدف اليومي والأيام المتتالية،
   التذكير اليومي، ولوحة الأهل (حد الوقت اليومي والتقرير). كل ذلك على الجهاز فقط. */
(() => {
  const V = APP.views, { AD, esc } = LEARN;
  const say = LEARN.say;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dayKey = off => { const d = new Date(); d.setDate(d.getDate() - off); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // ===== الأستاذ جمال (صور الأوضاع في img/teacher/ — تختفي إن لم توجد) =====
  // الأحجام الصغيرة تستعمل نسخة نصف الجسم (-h) ليظهر الوجه بوضوح
  const who = (pose, cls = '') => `<img class="tc ${cls}" src="img/teacher/${pose}${pose !== 'face' && /\b(sm|sm2|md)\b/.test(cls) ? '-h' : ''}.png" alt="" onerror="this.remove()">`;

  // ===== رسم الحرف متحركاً (مسارات من خط النسخ) =====
  function drawLetter(host, ch, opt = {}) {
    const P = window.LEARN_PATHS && LEARN_PATHS[ch];
    if (!P) { host.innerHTML = `<div class="lr-glyph">${ch}</div>`; opt.onEnd && opt.onEnd(); return { replay() { } }; }
    const [x, y, w, h] = P.v;
    host.innerHTML = `<div class="dl-box"><svg viewBox="${x} ${y} ${w} ${h}" class="dl-svg">
      <g transform="scale(1,-1)"><path class="dl-fill" d="${P.c.join(' ')}"/>${P.c.map(d => `<path class="dl-stroke" d="${d}"/>`).join('')}</g>
      <text class="dl-pen" font-size="${h * 0.2}">✏️</text></svg>
      <button class="lr-btn ghost" data-replay>🔁</button></div>`;
    const svg = host.querySelector('svg'), paths = [...host.querySelectorAll('.dl-stroke')], fill = host.querySelector('.dl-fill'), pen = host.querySelector('.dl-pen');
    const sw = Math.max(w, h) * 0.028;
    paths.forEach(p => { p.style.strokeWidth = sw; });
    let run = 0;
    function play() {
      const my = ++run;
      fill.style.opacity = 0;
      const lens = paths.map(p => p.getTotalLength());
      paths.forEach((p, i) => { p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i]; });
      let i = 0, t0 = null;
      const speed = Math.max(w, h) * 1.1; // وحدات في الثانية
      function frame(ts) {
        if (my !== run || !svg.isConnected) return;
        if (i >= paths.length) { fill.style.opacity = 1; pen.style.opacity = 0; opt.onEnd && opt.onEnd(); return; }
        if (t0 == null) t0 = ts;
        const L = lens[i], dur = Math.max(500, L / speed * 1000), k = Math.min(1, (ts - t0) / dur);
        paths[i].style.strokeDashoffset = L * (1 - k);
        const pt = paths[i].getPointAtLength(L * k);
        pen.setAttribute('x', pt.x); pen.setAttribute('y', -pt.y); pen.style.opacity = 1;
        if (k >= 1) { i++; t0 = null; }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    host.querySelector('[data-replay]').onclick = play;
    play();
    return { replay: play };
  }

  // ===== التقدم اليومي =====
  async function cfg() { const p = await LEARN.prog(); return Object.assign({ goal: 2, limit: 0, remind: '', name: '', extra: {} }, p.cfg || {}); }
  async function saveCfg(c) { const p = await LEARN.prog(); p.cfg = c; await DB.setting('learn', p); }
  function streak(p) {
    const d = p.days || {}; let n = 0;
    for (let k = d[today()] && d[today()].n ? 0 : 1; k < 400; k++) { const x = d[dayKey(k)]; if (x && x.n) n++; else break; }
    return n;
  }
  const allDone = p => Object.assign({}, p.kids || {}, p.lit || {});

  // ===== الأوسمة =====
  const cnt = (o, re) => Object.keys(o).filter(k => re.test(k)).length;
  const nRules = () => LEARN.DECODE.filter(d => d.unit === 'rules').reduce((a, d) => a + Math.ceil(d.words.length / 6), 0);
  const nDecode = () => LEARN.DECODE.reduce((a, d) => a + Math.ceil(d.words.length / 6), 0);
  const BADGES = [
    ['first', '🌱', 'أول نجمة', p => (p.stars || 0) >= 1],
    ['s10', '⭐', '١٠ نجوم', p => (p.stars || 0) >= 10],
    ['s50', '🌟', '٥٠ نجمة', p => (p.stars || 0) >= 50],
    ['s100', '💫', '١٠٠ نجمة', p => (p.stars || 0) >= 100],
    ['letters', '🔤', 'بطل الحروف', p => cnt(allDone(p), /^l\d+$/) >= 28],
    ['madd', '〰️', 'بطل المدود', p => cnt(allDone(p), /^m\d+$/) >= 28],
    ['tanween', 'ًٌ', 'بطل التنوين', p => cnt(allDone(p), /^t\d+$/) >= 28],
    ['decode', '🔡', 'قارئ ماهر', p => cnt(allDone(p), /^d_/) >= nDecode()],
    ['words', '🖼️', 'قارئ الكلمات', p => cnt(allDone(p), /^w_/) >= 10],
    ['stories', '📚', 'راوي القصص', p => cnt(p.kids || {}, /^st_/) >= LEARN.STORIES.length],
    ['q10', '📖', 'حافظ ١٠ سور', p => cnt(allDone(p), /^q\d+$/) >= 10],
    ['qall', '🕋', 'خاتم جزء عمّ', p => cnt(allDone(p), /^q\d+$/) >= 38],
    ['games', '🎮', 'بطل الألعاب', p => cnt(p.kids || {}, /^g/) >= 13],
    ['numbers', '🔢', 'صديق الأرقام', p => cnt(p.kids || {}, /^n(learn|count|add|sub)$/) >= 4],
    ['d3', '🔥', '٣ أيام متتالية', p => streak(p) >= 3],
    ['d7', '🔥', 'أسبوع كامل', p => streak(p) >= 7],
    ['d30', '🏆', 'شهر كامل', p => streak(p) >= 30],
    ['grad', '🎓', 'تخرّج من محو الأمية', p => !!(p.lit && p.lit.grad)],
    ['kgrad', '🏆', 'بطل القراءة', p => !!(p.kids && p.kids.kgrad)],
    ['rules', '✍️', 'بطل قواعد الكتابة', p => cnt(allDone(p), /^d_(lamalif|taa|alifm|hamza|aa|tanw2)_/) >= nRules()],
    ['dict', '🎧', 'بطل الإملاء', p => cnt(allDone(p), /^dc\d/) >= 5],
    ['duas', '🤲', 'حافظ الأدعية', p => cnt(p.kids || {}, /^du\d/) >= 12],
    ['math', '🔢', 'بطل الحساب', p => cnt(allDone(p), /^mt_/) >= 6],
    ['texts', '📰', 'قارئ الحياة', p => cnt(p.lit || {}, /^tx_/) >= 10]
  ];
  // الشهادات: إنجازات كبيرة تُطبع
  const CERTS = { letters: 'إتمام تعلّم الحروف الهجائية', madd: 'إتمام المدود', tanween: 'إتمام التنوين', decode: 'إتمام القراءة بالسكون والشدة', stories: 'إتمام قصص الأطفال', q10: 'تعلّم عشر سور من القرآن الكريم', qall: 'إتمام جزء عمّ', grad: 'إتمام برنامج تعلّم القراءة والكتابة', kgrad: 'إتمام منهج القراءة والكتابة للأطفال', rules: 'إتمام قواعد الكتابة', math: 'إتمام الأرقام والحساب' };

  // تغليف التسجيل: يومي + سجل + أوسمة جديدة
  const baseMark = LEARN.mark;
  LEARN.mark = async (area, id, val = 1) => {
    const before = await LEARN.prog(), had = new Set(before.badges || []);
    const p = await baseMark(area, id, val);
    p.days = p.days || {}; const t = today(); p.days[t] = p.days[t] || { n: 0, s: 0 }; p.days[t].n++;
    p.log = [{ a: area, id, t: Date.now() }, ...(p.log || [])].slice(0, 200);
    const got = BADGES.filter(b => b[3](p)).map(b => b[0]);
    p.badges = got;
    await DB.setting('learn', p);
    const fresh = BADGES.filter(b => got.includes(b[0]) && !had.has(b[0]));
    if (fresh.length) setTimeout(() => badgePop(fresh[0]), 1800);
    return p;
  };
  function badgePop(b) {
    const d = document.createElement('div'); d.className = 'bd-pop';
    d.innerHTML = `<div class="bd-card">${who('celebrate', 'sm')}<div class="bd-ic">${b[1]}</div><b>${b[2]}</b>${CERTS[b[0]] ? '<a class="lr-btn ok" href="#/learnme/certs">📜 الشهادة</a>' : ''}<button class="lr-btn ghost" data-x>✖</button></div>`;
    document.body.appendChild(d); LEARN.tone('win'); LEARN.burst(d.querySelector('.bd-card')); say('p_badge');
    const close = () => d.remove();
    d.querySelector('[data-x]').onclick = close; d.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    setTimeout(close, 9000);
  }

  // ===== عدّاد الوقت وحد الأطفال اليومي =====
  setInterval(async () => {
    if (document.hidden || !document.body.classList.contains('learn-mode')) return;
    const p = await LEARN.prog(); p.days = p.days || {}; const t = today(); p.days[t] = p.days[t] || { n: 0, s: 0 }; p.days[t].s += 15;
    await DB.setting('learn', p);
    if (document.body.classList.contains('learn-kids') && !/^#\/kids\/(rest|parents)/.test(location.hash) && await overLimit(p)) location.replace('#/kids/rest');
  }, 15000);
  async function overLimit(p) {
    p = p || await LEARN.prog(); const c = Object.assign({ limit: 0, extra: {} }, p.cfg || {});
    if (!c.limit) return false;
    const used = ((p.days || {})[today()] || {}).s || 0;
    return used >= (c.limit + ((c.extra || {})[today()] || 0)) * 60;
  }

  // ===== بوابة الأهل =====
  function gate(onOk) {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    APP.ask('🔒 للأهل فقط', [{ key: 'x', label: `كم حاصل ضرب ${a} × ${b}؟ (بالأرقام)` }]).then(v => { if (!v) return; const n = +String(v.x).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); if (n === a * b) onOk(); else APP.toast('إجابة غير صحيحة'); });
  }

  // ===== الشهادة (صورة تُحفظ أو تُشارك) =====
  async function certificate(key, name) {
    const W = 1600, H = 1130, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#fffaf0'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#0d5c3f'; x.lineWidth = 18; x.strokeRect(40, 40, W - 80, H - 80);
    x.strokeStyle = '#c9a227'; x.lineWidth = 6; x.strokeRect(78, 78, W - 156, H - 156);
    for (const [cx, cy] of [[78, 78], [W - 78, 78], [78, H - 78], [W - 78, H - 78]]) { x.fillStyle = '#c9a227'; x.beginPath(); x.arc(cx, cy, 22, 0, 7); x.fill(); }
    await document.fonts.ready.catch(() => { });
    x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = '#0d5c3f';
    x.font = "700 92px Naskh, serif"; x.fillText('شهادة تقدير', W / 2, 230);
    x.fillStyle = '#333'; x.font = "500 44px 'Plex Arabic', sans-serif"; x.fillText('يسرّ تطبيق «مكتبة القرآن والسنة» أن يشهد بأن', W / 2, 340);
    x.fillStyle = '#b8860b'; x.font = "700 96px Naskh, serif"; x.fillText(name || '................................', W / 2, 480);
    x.fillStyle = '#333'; x.font = "500 44px 'Plex Arabic', sans-serif"; x.fillText('قد أتمّ بنجاح', W / 2, 580);
    x.fillStyle = '#0d5c3f'; x.font = "700 64px Naskh, serif"; x.fillText(CERTS[key] || '', W / 2, 690);
    x.fillStyle = '#555'; x.font = "500 34px 'Plex Arabic', sans-serif";
    const d = new Date(); let hd = ''; try { hd = window.HIJRI ? ' — ' + HIJRI.hStr(HIJRI.g2h(d)) : ''; } catch (e) { }
    x.fillText('بتاريخ ' + d.toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric' }) + hd, W / 2, 790);
    x.font = "500 38px 'Plex Arabic', sans-serif"; x.fillText('نسأل الله أن يبارك فيه ويجعله من أهل القرآن', W / 2, 860);
    x.textAlign = 'left'; x.fillStyle = '#0d5c3f'; x.font = "700 46px Naskh, serif"; x.fillText('الأستاذ جمال', 190, 990);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'img/teacher/certificate.png'; });
      x.drawImage(img, W - 400, H - 470, 320, 320);
    } catch (e) { x.font = '160px serif'; x.textAlign = 'right'; x.fillText('🏅', W - 140, H - 160); }
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    APP.download('شهادة-' + (CERTS[key] || key).replace(/\s+/g, '-') + '.png', blob, 'image/png');
  }

  // ===== شاشة «إنجازاتي» (رحلتي للأطفال + الأوسمة + الشهادات + الهدف) =====
  const STATIONS = [
    ['🔤', 'الحروف', p => cnt(allDone(p), /^l\d+$/) / 28, '#/kids/read/letters'],
    ['〰️', 'المدود', p => cnt(allDone(p), /^m\d+$/) / 28, '#/kids/read/madd'],
    ['ًٌ', 'التنوين', p => cnt(allDone(p), /^t\d+$/) / 28, '#/kids/read/tanween'],
    ['🔡', 'السكون والشدة', p => cnt(allDone(p), /^d_/) / nDecode(), '#/kids/read/decode'],
    ['🖼️', 'الكلمات', p => Math.min(1, cnt(allDone(p), /^w_/) / 20), '#/kids/words'],
    ['🧩', 'الجمل', p => Math.min(1, cnt(allDone(p), /^se_sk/) / 20), '#/kids/sent'],
    ['📚', 'القصص', p => cnt(p.kids || {}, /^st_/) / LEARN.STORIES.length, '#/kids/stories'],
    ['✍️', 'قواعد الكتابة', p => cnt(allDone(p), /^d_(lamalif|taa|alifm|hamza|aa|tanw2)_/) / nRules(), '#/kids/read/rules'],
    ['🎧', 'اسمع واكتب', p => Math.min(1, cnt(allDone(p), /^dc\d/) / 5), '#/kids/dict'],
    ['🕋', 'جزء عمّ', p => cnt(allDone(p), /^q\d+$/) / 38, '#/kids/quran'],
    ['🏆', 'اختبار البطل', p => (p.kids && p.kids.kgrad) ? 1 : 0, '#/kids/exam']
  ];
  function ring(f, label) { const r = 26, C = 2 * Math.PI * r; return `<svg viewBox="0 0 64 64" class="ring"><circle cx="32" cy="32" r="${r}" class="rg-bg"/><circle cx="32" cy="32" r="${r}" class="rg-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, f))}"/><text x="32" y="38" text-anchor="middle">${label}</text></svg>`; }

  V.learnme = async (el, [sec]) => {
    const kids = localStorage.getItem('audience') !== 'lit' && !/lit/.test(sec || '');
    const p = await LEARN.prog(), c = await cfg(), st = streak(p), td = (p.days || {})[today()] || { n: 0, s: 0 };
    const back = kids ? '#/kids' : '#/literacy';
    const b = LEARN.shell(el, { theme: kids ? 'kids' : 'lit', title: sec === 'certs' ? '📜 شهاداتي' : (kids ? '🗺️ رحلتي' : '🏅 إنجازاتي'), back: sec === 'certs' ? '#/learnme' : back, stars: p.stars || 0 });
    const got = new Set(p.badges || []);
    if (sec === 'certs') {
      const ks = Object.keys(CERTS).filter(k => got.has(k));
      b.innerHTML = `<div class="card">
        <label>اسم صاحب الشهادة <input id="cName" value="${esc(c.name)}" placeholder="اكتب الاسم ليظهر في الشهادة"></label></div>
        ${ks.length ? `<div class="lr-list">${ks.map(k => `<button class="lr-sline" data-c="${k}">📜 ${esc(CERTS[k])}</button>`).join('')}</div>` : `<div class="card" style="text-align:center">${who('point', 'md')}<p>أكمل مرحلة كاملة لتحصل على أول شهادة 💪</p></div>`}
        <div class="muted" style="margin-top:10px;font-size:13px">الشهادات المتاحة: ${Object.values(CERTS).map(esc).join(' · ')}</div>`;
      const nm = b.querySelector('#cName');
      nm.onchange = async () => { const cc = await cfg(); cc.name = nm.value.trim(); await saveCfg(cc); };
      b.querySelectorAll('[data-c]').forEach(x => x.onclick = async () => { const cc = await cfg(); cc.name = nm.value.trim(); await saveCfg(cc); certificate(x.dataset.c, cc.name); });
      return;
    }
    const cur = STATIONS.findIndex(s => s[2](p) < 1);
    b.innerHTML = `
      <div class="me-top">
        <div class="me-box">${ring(td.n / c.goal, AD(Math.min(td.n, c.goal)) + '/' + AD(c.goal))}<small>هدف اليوم</small></div>
        <div class="me-box"><span class="me-fire">🔥 ${AD(st)}</span><small>أيام متتالية</small></div>
        <div class="me-box"><span class="me-fire">⭐ ${AD(p.stars || 0)}</span><small>نجومي</small></div>
      </div>
      ${kids ? `<div class="map">${STATIONS.map((s, i) => { const f = s[2](p); return `<a class="map-st ${f >= 1 ? 'done' : ''} ${i === cur ? 'cur' : ''}" href="${s[3]}" style="--x:${i % 2 ? 50 : -50}px">${i === cur ? who('face', 'map-me') : ''}${ring(f, s[0])}<b>${s[1]}</b></a>`; }).join('<i class="map-road"></i>')}</div>` : ''}
      <h3 class="me-h">🏅 أوسمتي (${AD(got.size)} / ${AD(BADGES.length)})</h3>
      <div class="bd-grid">${BADGES.map(bd => `<div class="bd ${got.has(bd[0]) ? 'on' : ''}"><span>${bd[1]}</span><small>${bd[2]}</small></div>`).join('')}</div>
      <div class="row" style="gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">
        <a class="lr-btn ok" href="#/learnme/certs">📜 شهاداتي</a>
        ${kids ? '<button class="lr-btn" data-par>🔒 للأهل</button>' : '<button class="lr-btn" data-set>⚙️ الهدف والتذكير</button>'}
      </div>`;
    const pb = b.querySelector('[data-par]'); if (pb) pb.onclick = () => gate(() => { location.replace('#/kids/parents'); });
    const sb = b.querySelector('[data-set]'); if (sb) sb.onclick = () => settingsForm(false);
  };

  // إعدادات الهدف والتذكير (وحد الوقت للأطفال)
  async function settingsForm(kids) {
    const c = await cfg();
    const num = x => +String(x || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    const f = [{ key: 'goal', label: 'هدف اليوم (عدد الدروس)' }, { key: 'remind', label: 'تذكير يومي في الساعة، مثل 17:30 (اتركه فارغاً لإيقافه)' }];
    if (kids) f.unshift({ key: 'name', label: 'اسم الطفل (للشهادات)' }, { key: 'limit', label: 'حد الوقت اليومي بالدقائق (٠ = بلا حد)' });
    const v = await APP.ask('⚙️ الإعدادات', f, { goal: String(c.goal), remind: c.remind, name: c.name, limit: String(c.limit) });
    if (!v) return;
    const cc = await cfg();
    if (kids) { cc.name = (v.name || '').trim(); cc.limit = Math.max(0, num(v.limit) || 0); }
    cc.goal = Math.min(10, Math.max(1, num(v.goal) || 2));
    const rm = /^(\d{1,2})[:.٫](\d{2})$/.exec(String(v.remind || '').trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    cc.remind = rm && +rm[1] < 24 && +rm[2] < 60 ? rm[1].padStart(2, '0') + ':' + rm[2] : '';
    await saveCfg(cc);
    if (cc.remind && window.NOTIFY) await NOTIFY.request().catch(() => { });
    if (window.NOTIFY) NOTIFY.rescheduleAll();
    APP.toast('تم الحفظ'); APP.rerender();
  }

  // تذكير يومي
  if (window.NOTIFY) NOTIFY.register('learn', async () => {
    const c = await cfg(); if (!c.remind) return [];
    const aud = localStorage.getItem('audience'), [h, m] = c.remind.split(':').map(Number), out = [];
    const did = ((await LEARN.prog()).days || {})[today()];
    for (let k = did && did.n ? 1 : 0; k < 14; k++) {
      const at = new Date(); at.setDate(at.getDate() + k); at.setHours(h, m, 0, 0);
      out.push(aud === 'lit' ? { title: '✍️ درسك اليوم', body: 'عشر دقائق مع الأستاذ جمال وتقترب من القراءة 💪', at, route: '#/literacy' }
        : { title: '🌟 وقت التعلّم!', body: 'الأستاذ جمال ينتظرك — نجمة جديدة اليوم؟', at, route: '#/kids' });
    }
    return out;
  });

  // ===== شاشات الأهل والراحة (تُستدعى من V.kids) =====
  async function parents(b) {
    const p = await LEARN.prog(), c = await cfg();
    const days = Array.from({ length: 7 }, (_, k) => { const d = dayKey(6 - k), x = (p.days || {})[d] || { n: 0, s: 0 }; return { d, m: Math.round(x.s / 60), n: x.n }; });
    const mx = Math.max(10, ...days.map(x => x.m));
    const wk = days.reduce((a, x) => a + x.n, 0);
    const recent = (p.log || []).filter(x => x.a === 'kids').slice(0, 12);
    const name = id => { const m = /^l(\d+)$/.exec(id); if (m) return 'حرف ' + LEARN.L[+m[1]][0]; if (/^m\d/.test(id)) return 'مد ' + LEARN.L[+id.slice(1)][0]; if (/^t\d/.test(id)) return 'تنوين ' + LEARN.L[+id.slice(1)][0]; if (/^q\d/.test(id)) return 'سورة ' + AR.SURAHS[+id.slice(1) - 1]; if (/^st_/.test(id)) { const s = LEARN.STORIES.find(x => 'st_' + x.id === id); return 'قصة ' + (s ? s.t : ''); } if (/^w_/.test(id)) { const t = LEARN.THEMES.find(x => id.startsWith('w_' + x.id + '_')); return 'كلمات: ' + (t ? t.t : ''); } if (/^se_/.test(id)) return 'جملة'; if (/^g/.test(id)) return 'لعبة'; if (/^wr/.test(id)) return 'كتابة حرف'; return id; };
    b.innerHTML = `<div class="card"><h3 style="margin-top:0">📊 تقرير الأسبوع${c.name ? ' — ' + esc(c.name) : ''}</h3>
        <div class="pr-bars">${days.map(x => `<div class="pr-bar"><i style="height:${Math.round(x.m / mx * 100)}%"></i><small>${AD(x.m)}د</small><em>${new Date(x.d).toLocaleDateString('ar', { weekday: 'short' })}</em></div>`).join('')}</div>
        <div class="row" style="gap:16px;flex-wrap:wrap;margin-top:8px"><span>📘 دروس هذا الأسبوع: <b>${AD(wk)}</b></span><span>⭐ النجوم: <b>${AD(p.stars || 0)}</b></span><span>🏅 الأوسمة: <b>${AD((p.badges || []).length)}</b></span><span>🔥 أيام متتالية: <b>${AD(streak(p))}</b></span></div></div>
      <div class="card"><h3 style="margin-top:0">🕘 آخر ما أنجزه</h3>${recent.length ? `<ul class="pr-log">${recent.map(x => `<li>${esc(name(x.id))} <small class="muted">${new Date(x.t).toLocaleString('ar', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</small></li>`).join('')}</ul>` : '<div class="muted">لا شيء بعد</div>'}</div>
      <div class="card"><h3 style="margin-top:0">⚙️ الإعدادات</h3>
        <div>حد الوقت اليومي: <b>${c.limit ? AD(c.limit) + ' دقيقة' : 'بلا حد'}</b> · هدف اليوم: <b>${AD(c.goal)} دروس</b> · التذكير: <b>${c.remind || 'متوقف'}</b></div>
        <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><button class="lr-btn ok" data-set>✏️ تعديل</button>${c.limit ? '<button class="lr-btn" data-more>➕ ١٥ دقيقة لليوم</button>' : ''}</div>
        <p class="muted" style="font-size:13px">ننصح بجلسات قصيرة (١٥–٢٠ دقيقة) مع مشاركة الأهل. التطبيق لا يجمع أي بيانات، وكل هذا محفوظ على الجهاز فقط.</p></div>`;
    b.querySelector('[data-set]').onclick = () => settingsForm(true);
    const mb = b.querySelector('[data-more]'); if (mb) mb.onclick = async () => { const cc = await cfg(); cc.extra = { [today()]: ((cc.extra || {})[today()] || 0) + 15 }; await saveCfg(cc); APP.toast('أُضيفت ١٥ دقيقة لليوم'); location.replace('#/kids'); };
  }
  function rest(b) {
    b.innerHTML = `<div class="lr-step lr-done">${who('bye', 'lg')}<div class="lr-trophy" style="font-size:90px">🌙</div><div class="lr-cap">أحسنت! نكمل غداً إن شاء الله</div>
      <div class="lr-foot"><button class="lr-btn ghost" data-par>🔒 للأهل</button></div></div>`;
    say('p_rest');
    b.querySelector('[data-par]').onclick = () => gate(() => { location.replace('#/kids/parents'); });
  }

  // ===== 🎬 شاهد وتعلّم: درس الحرف كأنه فيديو يعمل وحده (الأستاذ جمال + رسم الحرف + الأصوات) =====
  let vgen = 0;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function sayMin(key, ms = 1300) { const t = Date.now(); await say(key); const left = ms - (Date.now() - t); if (left > 0) await sleep(left); }
  async function letterVideo(b, i, area, next) {
    const my = ++vgen, alive = () => my === vgen && b.isConnected;
    const L = LEARN.L, c = L[i][0];
    const scene = html => { if (alive()) b.innerHTML = `<div class="vd-stage">${html}</div><div class="vd-ctrl"><button class="lr-btn ghost" data-rep>🔁</button>${next ? '<button class="lr-btn ok" data-nx>⏭</button>' : ''}</div>`; bind(); };
    const bind = () => { const r = b.querySelector('[data-rep]'); if (r) r.onclick = () => letterVideo(b, i, area, next); const n = b.querySelector('[data-nx]'); if (n) n.onclick = () => { vgen++; LEARN.stop(); location.replace(next); }; };
    scene(`${who('wave', 'lg')}<div class="vd-big">${c}</div>`); await sayMin('l' + i, 1800); if (!alive()) return;
    scene(`<div class="row" style="align-items:center;gap:4px">${who('point', 'sm2 flip')}<div class="lr-dl"></div></div>`);
    await new Promise(res => drawLetter(b.querySelector('.lr-dl'), c, { onEnd: res })); if (!alive()) return;
    await sayMin('l' + i, 1200); if (!alive()) return;
    for (const [set, mk, intro] of [['h', k => LEARN.harakah(c, k), 'p_harakat'], ['m', k => LEARN.madd(c, k), 'p_madd_intro']]) {
      scene(`${who('listen', 'md')}<div class="vd-row">${['a', 'u', 'i'].map(k => `<span data-k="${k}">${mk(k)}</span>`).join('')}</div>`);
      await sayMin(intro, 600); if (!alive()) return;
      for (const k of ['a', 'u', 'i']) { b.querySelectorAll('.vd-row span').forEach(x => x.classList.toggle('on', x.dataset.k === k)); await sayMin(`${set}${i}${k}`, 1300); if (!alive()) return; }
    }
    const w = LEARN.PICW.find(x => x.first === c);
    if (w) { scene(`<div class="lr-pic st-pic">${w.e}</div><div class="lr-word"><b class="hl">${esc(w.w[0])}</b>${esc(w.w.slice(1))}</div>`); await sayMin(w.id, 2000); if (!alive()) return; }
    scene(`${who('celebrate', 'lg')}<div class="vd-big sm">${c}</div>`); LEARN.tone('win'); LEARN.mark(area, 'v' + i); await sayMin('p_char_good', 1500); if (!alive()) return;
    if (next) { await sleep(1500); if (alive()) location.replace(next); }
  }
  async function watchView(sh, area, base, id, pg) {
    const list = base + '/watch';
    if (id == null) {
      const b = sh('🎬 شاهد وتعلّم', base);
      b.innerHTML = `${who('point', 'md')}<div class="muted" style="text-align:center;margin-bottom:8px">اختر حرفاً وشاهد الدرس — يعمل وحده ثم ينتقل للحرف التالي</div><div class="lr-grid">${LEARN.L.map(([ch], i) => `<a class="lr-tile kd ${pg['v' + i] ? 'done' : ''}" style="--h:${i * 13 % 360}" href="${list}/${i}"><span class="lr-g2">${ch}</span><small>▶</small>${pg['v' + i] ? '<i class="lr-ok">✓</i>' : ''}</a>`).join('')}</div>`;
      return;
    }
    const i = +id;
    letterVideo(sh('🎬 ' + LEARN.L[i][0], list), i, area, i < 27 ? `${list}/${i + 1}` : null);
  }
  window.addEventListener('hashchange', () => { if (!/\/watch\/\d/.test(location.hash)) vgen++; });

  // نافذة الانتقال لقسم آخر (من الأطفال أو محو الأمية)
  function switcher(from) {
    const opts = [['kids', '#/kids', '🧒', 'الأطفال'], ['lit', '#/literacy', '✍️', 'تعلّم القراءة والكتابة'], ['adult', '#/', '📚', 'الشباب والكبار']].filter(o => o[0] !== from);
    const d = document.createElement('div'); d.className = 'bd-pop';
    d.innerHTML = `<div class="bd-card sw-card">${opts.map(([k, h, ic, t]) => `<a class="st-card ${k}" href="${h}" data-aud="${k}"><span class="st-ic">${ic}</span><b>${t}</b></a>`).join('')}<button class="lr-btn ghost" data-x>✖ رجوع</button></div>`;
    document.body.appendChild(d);
    d.querySelector('[data-x]').onclick = () => d.remove();
    d.addEventListener('click', e => { if (e.target === d) d.remove(); });
    d.querySelectorAll('[data-aud]').forEach(a => a.addEventListener('click', () => { try { localStorage.setItem('audience', a.dataset.aud); } catch (x) { } LEARN.stop(); setTimeout(() => d.remove(), 50); }));
  }

  window.LX = { switcher, watchView, letterVideo, drawLetter, who, overLimit, parents, rest, gate, certificate, streak, BADGES };
})();
