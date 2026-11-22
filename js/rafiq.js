/* 🧭 رفيق: للشاب المسلم — يختار عند الدخول: شاب / زوج / أب، فيُعرض له ما يخصّه.
   كل مبدأ بدليله المربوط بمكتبة التطبيق، والمحتوى في data/rafiq.js. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const theme = () => document.body.classList.toggle('rq-theme', /^#\/rafiq(\/|$)/.test(location.hash));
  window.addEventListener('hashchange', theme); theme();
  let loading = null;
  const loadJs = (src, key) => window[key] ? Promise.resolve(window[key]) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(window[key]); s.onerror = rej; document.head.appendChild(s); });
  const load = () => loading || (loading = Promise.all([loadJs('data/rafiq.js', 'RAFIQ'), loadJs('js/tarbiya.js', 'TB_EV'), loadJs('data/fit-men.js', 'FITMEN')]).then(([r]) => r));
  const WHO = { shab: ['👦', 'شاب', 'لم أتزوج بعد'], zawj: ['💍', 'زوج', 'متزوج'], ab: ['👨‍👧', 'أب', 'عندي أولاد'] };


  // ===== بيانات الشاب: سجل التمارين، وأيام الثبات، والمهام اليومية =====
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const getU = async () => Object.assign({ log: [], streak: null, best: 0, check: {}, w: '', h: '' }, (await DB.setting('rafiq')) || {});
  const saveU = u => DB.setting('rafiq', u);
  const CHECK = [['fajr', '🕌 الفجر في وقتها'], ['quran', '📖 وِردي من القرآن'], ['adhkar', '☀️ أذكار الصباح والمساء'], ['sport', '💪 تمرين أو حركة'], ['birr', '🤍 بِرّ بوالديّ اليوم']];
  // ===== رسمة شاب بقميص وبنطال، بنفس محرّك حركات «رفيقة» =====
  const JOINTS = ['head', 'neck', 'hip', 'le', 'lh', 're', 'rh', 'lk', 'lf', 'rk', 'rf'];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function figSvg(e, t) {
    const PO = window.FITMEN.poses, A = PO[e.frames[0]] || PO.stand, B = PO[e.frames[1]] || A, p = {};
    JOINTS.forEach(j => p[j] = lerp(A[j] || PO.stand[j], B[j] || A[j] || PO.stand[j], t));
    const L = (a, b, w, c) => `<line x1="${p[a][0]}" y1="${p[a][1]}" x2="${p[b][0]}" y2="${p[b][1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    const dx = p.hip[0] - p.neck[0], dy = p.hip[1] - p.neck[1], len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
    const sh = k => [p.neck[0] + px * k, p.neck[1] + py * k], hp = k => [p.hip[0] + px * k, p.hip[1] + py * k];
    const shirt = `M${sh(-6)} L${hp(-5)} L${hp(5)} L${sh(6)} Z`;
    const toN = [p.neck[0] - p.head[0], p.neck[1] - p.head[1]], tl = Math.hypot(toN[0], toN[1]) || 1;
    const hair = `M${p.head[0] - toN[1] / tl * 6.6},${p.head[1] + toN[0] / tl * 6.6} A6.6,6.6 0 0 1 ${p.head[0] + toN[1] / tl * 6.6},${p.head[1] - toN[0] / tl * 6.6} Z`;
    return `<svg viewBox="0 0 100 100" width="100%" height="100%"><line x1="4" y1="91" x2="96" y2="91" stroke="#d6dde6" stroke-width="1.5"/>
      ${L('hip', 'lk', 6.2, '#5b6b7f')}${L('lk', 'lf', 5.4, '#5b6b7f')}${L('neck', 'le', 4.8, '#7fa3cf')}${L('le', 'lh', 4.2, '#e9c3a6')}
      ${L('hip', 'rk', 6.6, '#3c4a5c')}${L('rk', 'rf', 5.8, '#3c4a5c')}<circle cx="${p.lf[0]}" cy="${p.lf[1]}" r="2.6" fill="#22303f"/><circle cx="${p.rf[0]}" cy="${p.rf[1]}" r="2.8" fill="#22303f"/>
      <path d="${shirt}" fill="#1E4E8C" stroke="#1E4E8C" stroke-width="3" stroke-linejoin="round"/>
      ${L('neck', 're', 5.2, '#2a62a8')}${L('re', 'rh', 4.4, '#f0cdb7')}<circle cx="${p.rh[0]}" cy="${p.rh[1]}" r="2.3" fill="#f0cdb7"/><circle cx="${p.lh[0]}" cy="${p.lh[1]}" r="2.1" fill="#e9c3a6"/>
      <circle cx="${p.head[0]}" cy="${p.head[1]}" r="6.6" fill="#f0cdb7"/><path d="${hair}" fill="#2b1d16"/></svg>`;
  }
  let animT = null;
  function animate(root) {
    clearInterval(animT); const t0 = Date.now();
    animT = setInterval(() => {
      if (!document.body.contains(root)) { clearInterval(animT); return; }
      root.querySelectorAll('[data-fig]').forEach(f => { if (f.dataset.pause === '1' && f.firstChild) return; const e = window.FITMEN.exercises[f.dataset.fig]; if (!e) return; const t = f.dataset.pause === '1' ? 0 : (1 - Math.cos((Date.now() - t0) / (e.speed || 1200) * Math.PI)) / 2; f.innerHTML = figSvg(e, t); });
    }, 60);
  }
  const box = (id, big, pause) => `<div data-fig="${id}" ${pause ? 'data-pause="1"' : ''} class="rf-figbox${big ? ' big' : ''}" style="width:${big ? 200 : 110}px;height:${big ? 200 : 110}px;${big ? 'margin:0 auto' : ''}"></div>`;
  async function fit(el, a, b) {
    const F = window.FITMEN;
    if (!a) {
      const u = await getU(), wk = u.log.filter(x => (Date.now() - new Date(x.d).getTime()) < 7 * 864e5).length;
      el.innerHTML = `<a class="btn sm" href="#/rafiq">← رفيق</a><h1>💪 تماريني</h1><div class="sub">تمارين بوزن الجسم بلا أجهزة: لكل تمرين رسمة متحركة وخطوات، وبرامج جاهزة بمؤقت كامل.</div>
        <div class="bt-sum"><div><small>تمارين هذا الأسبوع</small><b>${D(wk)}</b></div><div><small>إجمالي التمارين</small><b>${D(u.log.length)}</b></div><div><small>الهدف الأسبوعي</small><b>${D(3)}</b></div></div>
        <h2>▶ برامج جاهزة</h2><div class="bt-list">${F.routines.map(x => `<a class="bt-row" href="#/rafiq/fit/run/${x.id}" style="text-decoration:none;color:inherit"><b>${esc(x.name)}</b><small class="muted">${esc(x.level)} · ${D(x.list.length)} تمارين × ${D(x.rounds)} جولات</small><span class="spacer"></span><span class="btn sm primary">ابدأ</span></a>`).join('')}</div>
        ${F.cats.map(c => `<h2>${c.name}</h2><div class="muted">${esc(c.desc)}</div><div class="rf-exs">${Object.entries(F.exercises).filter(([, e]) => e.cat === c.key).map(([k, e]) => `<a class="card rf-exc" href="#/rafiq/fit/ex/${k}">${box(k)}<b>${esc(e.name)}</b></a>`).join('')}</div>`).join('')}
        <div class="warn"><b>⚠️ للأمان</b><ul>${F.safety.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
      animate(el); return;
    }
    if (a === 'ex') {
      const e = F.exercises[b]; if (!e) return;
      el.innerHTML = `<a class="btn sm" href="#/rafiq/fit">← تماريني</a><div class="card rf-ex">${box(b, true)}<h2>${esc(e.name)}</h2><p class="muted">🎯 ${esc(e.target)}</p><ol>${e.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p>💡 ${esc(e.tip)}</p><div class="muted">${D(e.secs)} ثانية</div></div>`;
      animate(el); return;
    }
    // تشغيل برنامج
    const rt = F.routines.find(x => x.id === b); if (!rt) return;
    const pl = F.phasePlan[rt.cat] || { warm: [], cool: [] }, steps = [{ k: 'ready', id: rt.list[0], s: 10 }];
    pl.warm.forEach(w => steps.push({ k: 'warm', id: w, s: F.warmSecs }));
    for (let rn = 0; rn < rt.rounds; rn++) rt.list.forEach((x, i) => { steps.push({ k: 'ex', id: x, s: F.exercises[x].secs, rn }); if (!(rn === rt.rounds - 1 && i === rt.list.length - 1)) steps.push({ k: 'rest', id: rt.list[i + 1] || rt.list[0], s: rt.rest }); });
    pl.cool.forEach(w => steps.push({ k: 'cool', id: w, s: F.warmSecs }));
    const run = { i: 0, left: steps[0].s, paused: false };
    let wake = null; try { wake = await navigator.wakeLock.request('screen'); } catch (er) { }
    const LBL = { ready: 'استعد', warm: 'إحماء', ex: 'تمرين', rest: 'راحة', cool: 'تهدئة' };
    const end = () => { clearInterval(run.t); try { wake && wake.release(); } catch (er) { } };
    const paint = () => {
      const st = steps[run.i], e = F.exercises[st.id];
      el.innerHTML = `<div class="card rf-run ${st.k}"><div class="row"><b>${esc(rt.name)}</b><span class="spacer"></span><small>${D(run.i + 1)}/${D(steps.length)}</small></div>
        <div class="tag">${LBL[st.k]}${st.k === 'ex' ? ' — الجولة ' + D(st.rn + 1) + ' من ' + D(rt.rounds) : ''}</div>
        ${box(st.id, true, run.paused || st.k === 'rest' || st.k === 'ready')}<h2>${st.k === 'rest' ? 'التالي: ' : ''}${esc(e.name)}</h2><div class="rf-clock">${D(run.left)}</div>
        <div class="lr-progress"><i style="width:${Math.round(run.i / steps.length * 100)}%"></i></div>
        <div class="row" style="gap:8px;justify-content:center;margin-top:10px"><button class="btn" id="rP">⏮</button><button class="btn primary" id="rT">${run.paused ? '▶ استمر' : '⏸ إيقاف مؤقت'}</button><button class="btn" id="rN">⏭</button><button class="btn" id="rX">✕ إنهاء</button></div>
        ${st.k !== 'rest' ? `<ol class="rf-steps">${e.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}</div>`;
      el.querySelector('#rT').onclick = () => { run.paused = !run.paused; paint(); };
      el.querySelector('#rN').onclick = () => go(1); el.querySelector('#rP').onclick = () => go(-1);
      el.querySelector('#rX').onclick = () => { end(); location.hash = '#/rafiq/fit'; };
      animate(el);
    };
    const go = d => { run.i = Math.max(0, Math.min(steps.length - 1, run.i + d)); run.left = steps[run.i].s; if (navigator.vibrate) navigator.vibrate(200); paint(); };
    paint();
    run.t = setInterval(async () => {
      if (!document.body.contains(el)) return end();
      if (run.paused) return;
      run.left--; const c = el.querySelector('.rf-clock'); if (c) c.textContent = D(Math.max(0, run.left));
      if (run.left <= 0) {
        if (run.i >= steps.length - 1) {
          end(); const u = await getU(); u.log.push({ d: today(), r: rt.id }); u.log = u.log.slice(-400); u.check[today()] = Object.assign(u.check[today()] || {}, { sport: 1 }); await saveU(u);
          el.innerHTML = '<div class="card rf-run"><h2>🎉 أحسنت! أتممت البرنامج</h2><p>سُجّل التمرين في إحصائياتك. «المؤمن القوي خير وأحب إلى الله».</p><a class="btn primary" href="#/rafiq/fit">رجوع للتمارين</a></div>';
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]); return;
        }
        go(1);
      }
    }, 1000);
  }

  V.rafiq = async (el, [sec, a, b]) => {
    let who = await DB.setting('rafiq-who');
    if (!WHO[who]) {
      el.innerHTML = `<div class="card rf-gate"><div class="rf-ic">🧭</div><h2>أهلاً بك في «رفيق»</h2><p>اختر ما يناسبك، ليعرض لك القسم ما يخصّك:</p>
        <div class="rf-who">${Object.entries(WHO).map(([k, [ic, t, d]]) => `<button class="card" data-who="${k}"><span>${ic}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div>
        <small class="muted">يمكنك التغيير في أي وقت.</small><div style="margin-top:8px"><a class="btn sm" href="#/">رجوع</a></div></div>`;
      el.querySelectorAll('[data-who]').forEach(x => x.onclick = async () => { await DB.setting('rafiq-who', x.dataset.who); APP.rerender(); });
      return;
    }
    el.innerHTML = '<div class="card muted">جارٍ التحميل…</div>';
    let R; try { R = await load(); } catch (e) { el.innerHTML = '<div class="warn">تعذّر تحميل المحتوى.</div>'; return; }
    const secs = R.secs.filter(s => s.who.includes(who));
    const ev = window.TB_EV;
    if (sec === 'fit') return fit(el, a, b);
    if (!sec) {
      const u = await getU(), t = today(), ck = u.check[t] || {};
      const days = u.streak ? Math.floor((Date.now() - new Date(u.streak).getTime()) / 864e5) : null;
      const wk = u.log.filter(x => (Date.now() - new Date(x.d).getTime()) < 7 * 864e5).length;
      el.innerHTML = `<div class="rf-hero rq-hero"><h1>🧭 رفيق</h1><div>رفيقك في دينك وأخلاقك وصحتك ومستقبلك.</div></div>
        <div class="row rf-whobar"><small>${WHO[who][0]} القسم معروض لك: <b>${WHO[who][1]}</b></small><span class="spacer"></span><button class="btn sm" id="rqWho">تغيير</button></div>
        <div class="card rq-today"><h3>✅ يومي</h3><div class="rq-checks">${CHECK.map(([k, l]) => `<button class="${ck[k] ? 'on' : ''}" data-ck="${k}">${l}</button>`).join('')}</div>
          <div class="muted">${D(Object.keys(ck).filter(k => ck[k]).length)} من ${D(CHECK.length)} اليوم</div></div>
        <div class="bt-sum"><a href="#/rafiq/fit" style="text-decoration:none;color:inherit"><small>💪 تمارين الأسبوع</small><b>${D(wk)}/${D(3)}</b></a>
          <div><small>🛡️ أيام الثبات</small><b>${days == null ? '—' : D(days)}</b><button class="btn sm" id="rqSt">${days == null ? 'ابدأ العدّ' : 'إعادة'}</button></div>
          <div><small>🏆 أفضل سلسلة</small><b>${D(Math.max(u.best || 0, days || 0))}</b></div></div>
        <a class="card rq-fitcta" href="#/rafiq/fit">${box('pushUp')}<div><b>💪 تماريني</b><div class="muted">٢٢ تمريناً برسوم متحركة، و٨ برامج جاهزة بمؤقت</div></div></a>
        <div class="fam-grid">${secs.map(s => `<a class="fam-tile" href="#/rafiq/${s.id}"><span class="fam-ic">${s.ic}</span><b>${esc(s.name)}</b></a>`).join('')}
          <a class="fam-tile" href="#/rafiq/qudwa"><span class="fam-ic">🌟</span><b>قدوتي: شباب الصحابة</b></a>
          ${who === 'shab' ? '' : '<a class="fam-tile" href="#/tarbiya"><span class="fam-ic">👨‍👩‍👧</span><b>تربية الأبناء</b></a>'}</div>
        <div class="muted" style="font-size:12.5px;margin-top:10px">بياناتك على جوالك فقط. وكل مبدأ هنا بدليله من القرآن والسنة، ويفتح نصه من مكتبة التطبيق.</div>`;
      el.querySelector('#rqWho').onclick = async () => { await DB.setting('rafiq-who', null); APP.rerender(); };
      el.querySelectorAll('[data-ck]').forEach(x => x.onclick = async () => { const v = await getU(); v.check[t] = v.check[t] || {}; v.check[t][x.dataset.ck] = v.check[t][x.dataset.ck] ? 0 : 1; const ks = Object.keys(v.check).sort(); ks.slice(0, -60).forEach(k => delete v.check[k]); await saveU(v); APP.rerender(); });
      el.querySelector('#rqSt').onclick = async () => { const v = await getU(); if (v.streak) { if (!(await APP.ask('إعادة عدّ أيام الثبات؟ لا تيأس، فالتوبة تمحو ما قبلها، وابدأ من جديد.'))) return; v.best = Math.max(v.best || 0, days || 0); } v.streak = new Date().toISOString(); await saveU(v); APP.rerender(); };
      animate(el);
      return;
    }
    if (sec === 'qudwa') {
      el.innerHTML = `<a class="btn sm" href="#/rafiq">← رفيق</a><h1>🌟 قدوتي: شباب الصحابة</h1><div class="sub">حملوا الإسلام وهم في مثل سنك. اضغط الاسم لتقرأ ترجمته في «الإصابة» لابن حجر.</div>
        <div class="bt-list">${R.role.map(x => `<a class="bt-row" href="#/item/${x.id}" style="text-decoration:none;color:inherit"><b>${esc(x.n)}</b><small class="muted">${esc(x.d)}</small><span class="spacer"></span>↗</a>`).join('')}</div>
        <a class="btn" href="#/sahaba">👥 سير الصحابة كاملة</a>`;
      return;
    }
    const s = secs.find(x => x.id === sec); if (!s) { location.hash = '#/rafiq'; return; }
    el.innerHTML = `<a class="btn sm" href="#/rafiq">← رفيق</a><h1>${s.ic} ${esc(s.name)}</h1><p>${esc(s.intro)}</p>
      ${s.items.map((x, i) => `<div class="card tb-item"><h3>${D(i + 1)}. ${esc(x.t)}</h3>${x.d ? `<p>${esc(x.d)}</p>` : ''}${ev(x.ev)}</div>`).join('')}
      ${s.id === 'jism' ? `<a class="card rq-fitcta" href="#/rafiq/fit">${box('squat')}<div><b>💪 ابدأ تماريني</b><div class="muted">برامج بمؤقت ورسوم متحركة</div></div></a><div class="card"><h3>⚖️ مؤشر كتلة الجسم</h3><div class="bt-add"><input id="bmW" inputmode="decimal" placeholder="الوزن (كجم)" style="width:110px"><input id="bmH" inputmode="decimal" placeholder="الطول (سم)" style="width:110px"><button class="btn primary" id="bmGo">احسب</button></div><div id="bmR"></div><small class="muted">لمن تجاوز ١٨ سنة؛ أما الأصغر فيُقاس بمنحنيات النمو عند الطبيب.</small></div>` : ''}
      ${s.steps && s.steps.length ? `<div class="card"><h3>✅ خطوات عملية</h3><ol>${s.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}`;
    if (s.id === 'jism') {
      animate(el); const u = await getU(); const w = el.querySelector('#bmW'), h = el.querySelector('#bmH'); w.value = u.w || ''; h.value = u.h || '';
      el.querySelector('#bmGo').onclick = async () => { const W = parseFloat(w.value), Hm = parseFloat(h.value) / 100; if (!W || !Hm) return; const b = W / (Hm * Hm), v = await getU(); v.w = w.value; v.h = h.value; await saveU(v);
        const [lab, c] = b < 18.5 ? ['نحافة', '#5A8ED6'] : b < 25 ? ['وزن مثالي ✔', '#2e9e5b'] : b < 30 ? ['زيادة وزن', '#D0843A'] : ['سمنة', '#C73552'];
        el.querySelector('#bmR').innerHTML = `<div class="bt-big" style="color:${c}">${D(b.toFixed(1))}</div><b style="color:${c}">${lab}</b><div class="muted">الوزن المثالي لطولك تقريباً: ${D(Math.round(18.5 * Hm * Hm))} – ${D(Math.round(24.9 * Hm * Hm))} كجم</div>`; };
    }
  };
})();
