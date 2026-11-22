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
  const load = () => loading || (loading = Promise.all([loadJs('data/rafiq.js', 'RAFIQ'), loadJs('js/tarbiya.js', 'TB_EV')]).then(([r]) => r));
  const WHO = { shab: ['👦', 'شاب', 'لم أتزوج بعد'], zawj: ['💍', 'زوج', 'متزوج'], ab: ['👨‍👧', 'أب', 'عندي أولاد'] };

  V.rafiq = async (el, [sec]) => {
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
    if (!sec) {
      el.innerHTML = `<div class="rf-hero rq-hero"><h1>🧭 رفيق</h1><div>رفيقك في دينك وأخلاقك وصحتك ومستقبلك.</div></div>
        <div class="row rf-whobar"><small>${WHO[who][0]} القسم معروض لك: <b>${WHO[who][1]}</b></small><span class="spacer"></span><button class="btn sm" id="rqWho">تغيير</button></div>
        <div class="fam-grid">${secs.map(s => `<a class="fam-tile" href="#/rafiq/${s.id}"><span class="fam-ic">${s.ic}</span><b>${esc(s.name)}</b></a>`).join('')}
          <a class="fam-tile" href="#/rafiq/qudwa"><span class="fam-ic">🌟</span><b>قدوتي: شباب الصحابة</b></a>
          ${who === 'shab' ? '' : '<a class="fam-tile" href="#/tarbiya"><span class="fam-ic">👨‍👩‍👧</span><b>تربية الأبناء</b></a>'}</div>
        <div class="muted" style="font-size:12.5px;margin-top:10px">كل مبدأ هنا بدليله من القرآن والسنة، ويفتح نصه من مكتبة التطبيق.</div>`;
      el.querySelector('#rqWho').onclick = async () => { await DB.setting('rafiq-who', null); APP.rerender(); };
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
      ${s.steps && s.steps.length ? `<div class="card"><h3>✅ خطوات عملية</h3><ol>${s.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}`;
  };
})();
