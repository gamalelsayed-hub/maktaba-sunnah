/* 📊 تقدمي: لوحة موحدة لكل الدروس، وشهادات إتمام، وبحث في الدروس، والنسخ الاحتياطي لنقل التقدم بين الأجهزة. */
(function () {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(n);
  const loadJS = (src, name) => window[name] ? Promise.resolve(window[name]) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = src + '?v=' + (window.DATA_V || ''); s.onload = () => ok(window[name]); s.onerror = no; document.head.appendChild(s); });
  const NR = s => AR.normalize(String(s || ''));

  // كل المسارات بصيغة موحدة: {key, ic, t, base, lessons:[{id, t, txt, done}]}
  async function allTracks() {
    const [G, U, W] = await Promise.all([loadJS('data/lugha.js', 'LUGHA').catch(() => null), loadJS('data/usul.js', 'USUL').catch(() => null), loadJS('data/wajib.js', 'WAJIB').catch(() => null)]);
    const dn = new Set((await DB.setting('lugha-done')) || []), wd = new Set((await DB.setting('wajib-done')) || []);
    const txt = l => [l.t, l.idea, ...(l.rules || []), ...(l.ex || []).flat()].join(' ');
    const out = [];
    if (W) out.push({ key: 'wajib', grp: 'ش', ic: '📌', t: 'ما لا يسع المسلم جهله', base: '#/wajib', lessons: W.items.map(x => ({ id: x.i, t: x.t, txt: x.t + ' ' + (x.b || '') + ' ' + (x.d || ''), done: wd.has(x.i), href: '#/wajib/' + x.i })) });
    if (U) for (const [k, tk] of Object.entries(U.tracks)) out.push({ key: 'u-' + k, grp: 'ش', ic: tk.ic, t: tk.t, base: '#/usul/' + k, lessons: tk.lessons.map(l => ({ id: l.id, t: l.t, txt: txt(l), done: dn.has(k + ':' + l.id), href: '#/usul/' + k + '/' + l.id })) });
    if (G) {
      out.push({ key: 'nahw', grp: 'ع', ic: '📘', t: 'النحو', base: '#/lugha/nahw', lessons: G.lessons.map(l => ({ id: l.id, t: l.t, txt: txt(l), done: dn.has(l.id), href: '#/lugha/nahw/' + l.id })) });
      for (const [k, tk] of Object.entries(G.tracks)) out.push({ key: 'l-' + k, grp: 'ع', ic: tk.ic, t: tk.t, base: '#/lugha/' + k, lessons: tk.lessons.map(l => ({ id: l.id, t: l.t, txt: txt(l), done: dn.has(k + ':' + l.id), href: '#/lugha/' + k + '/' + l.id })) });
    }
    return out;
  }

  // 🎓 شهادة إتمام (صورة تُحفظ أو تُشارك)
  async function certificate(tr) {
    const name = ((await APP.ask('🎓 شهادة إتمام «' + tr.t + '»', [{ key: 'n', label: 'الاسم كما تريد أن يظهر في الشهادة' }])) || {}).n;
    if (!name) return;
    const c = document.createElement('canvas'); c.width = 1600; c.height = 1130; const x = c.getContext('2d');
    try { await document.fonts.load('60px Amiri'); } catch (e) { }
    x.fillStyle = '#fbf7ec'; x.fillRect(0, 0, 1600, 1130);
    x.strokeStyle = '#0e4a3a'; x.lineWidth = 18; x.strokeRect(40, 40, 1520, 1050); x.strokeStyle = '#b8892f'; x.lineWidth = 4; x.strokeRect(78, 78, 1444, 974);
    x.direction = 'rtl'; x.textAlign = 'center'; x.fillStyle = '#0e4a3a';
    const F = (sz, w = '') => (x.font = `${w} ${sz}px Amiri, "Noto Naskh Arabic", serif`);
    F(46); x.fillText('زاد الأسرة المسلمة', 800, 190);
    F(96, 'bold'); x.fillText('شهادة إتمام', 800, 320);
    x.fillStyle = '#333'; F(48); x.fillText('يشهد التطبيق بأن', 800, 430);
    x.fillStyle = '#b8892f'; F(84, 'bold'); x.fillText(name.slice(0, 40), 800, 545);
    x.fillStyle = '#333'; F(48); x.fillText('أتمّ دروس مسار', 800, 650);
    x.fillStyle = '#0e4a3a'; F(70, 'bold'); x.fillText(tr.t, 800, 755);
    x.fillStyle = '#555'; F(40); x.fillText(`(${D(tr.lessons.length)} درساً مع اختباراتها)`, 800, 830);
    F(36); x.fillText('بتاريخ ' + new Date().toLocaleDateString('ar-SA-u-ca-islamic-umalqura') + ' هـ', 800, 920);
    x.fillStyle = '#888'; F(30); x.fillText('«من سلك طريقاً يلتمس فيه علماً سهّل الله له به طريقاً إلى الجنة» — رواه مسلم', 800, 1010);
    const url = c.toDataURL('image/png');
    const fn = 'شهادة-' + tr.t.replace(/[^؀-ۿ\w]+/g, '-') + '.png';
    APP.modal(`<h2 style="margin-top:0">🎓 شهادتك</h2><img src="${url}" style="width:100%;border-radius:8px"><div class="row" style="margin-top:8px"><button class="btn primary" id="crtDl">⬇️ حفظ الشهادة</button><button class="btn" id="crtX">إغلاق</button></div><div class="muted" style="font-size:.85em">شهادة تحفيزية على إتمام دروس التطبيق، وليست إجازة علمية.</div>`, box => {
      box.querySelector('#crtDl').onclick = async () => APP.download(fn, await (await fetch(url)).blob(), 'image/png');
      box.querySelector('#crtX').onclick = () => document.getElementById('modal').classList.add('hidden');
    });
  }

  const bar = (a, b) => `<div class="pg-bar"><i style="width:${b ? Math.round(a * 100 / b) : 0}%"></i></div>`;
  V.taqaddum = async (el, _, p) => {
    el.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
    const T = await allTracks(); const q = (p && p.q) || '';
    const all = T.reduce((s, t) => s + t.lessons.length, 0), dn = T.reduce((s, t) => s + t.lessons.filter(l => l.done).length, 0);
    const last = await DB.setting('backup-last');
    const days = last ? Math.floor((Date.now() - last) / 864e5) : null;
    const row = t => { const d = t.lessons.filter(l => l.done).length, full = d === t.lessons.length && d > 0;
      return `<div class="card pg-row"><a href="${t.base}" class="pg-t">${t.ic} <b>${esc(t.t)}</b></a><small class="muted">${D(d)} / ${D(t.lessons.length)}</small>${bar(d, t.lessons.length)}${full ? `<button class="btn sm primary" data-crt="${t.key}">🎓 الشهادة</button>` : (d ? `<a class="btn sm" href="${(t.lessons.find(l => !l.done) || {}).href}">أكمل ←</a>` : `<a class="btn sm" href="${t.base}">ابدأ</a>`)}</div>`; };
    el.innerHTML = `<div class="rf-hero lg-hero"><h1>📊 تقدمي في الدروس</h1><div>أنهيت <b>${D(dn)}</b> من <b>${D(all)}</b> درساً ${bar(dn, all)} أتمّ أي مسار لتحصل على شهادة إتمام.</div></div>
      <form class="th-search" id="pgS"><input name="q" value="${esc(q)}" placeholder="🔎 ابحث في كل الدروس: الربا، المفعول به، التيمم، الحجب…"><button class="btn primary">بحث</button></form><div id="pgR"></div>
      <div class="card pg-bk ${days == null || days > 14 ? 'due' : ''}"><h3>💾 احفظ تقدمك وانقله لجهاز آخر</h3>
        <div class="sub">التطبيق لا يرفع بياناتك لأي خادم. لنقل تقدمك (الدروس، والمحفوظات، والهوامش، والحفظ، والإعدادات) إلى جوال جديد: صدّر نسخة واحفظها في Google Drive أو أرسلها لنفسك، ثم استعدها في الجهاز الآخر.${last ? ' آخر نسخة: قبل ' + D(days) + ' يوم.' : ' لم تحفظ نسخة بعد.'}</div>
        <div class="row"><button class="btn primary" id="pgExp">📤 تصدير نسخة</button><label class="btn">📥 استعادة نسخة <input type="file" id="pgImp" accept=".json,application/json" hidden></label></div></div>
      <h2>📗 علوم الشريعة</h2>${T.filter(t => t.grp === 'ش').map(row).join('')}
      <h2>🔤 علوم العربية</h2>${T.filter(t => t.grp === 'ع').map(row).join('')}`;
    el.querySelectorAll('[data-crt]').forEach(b => b.onclick = () => certificate(T.find(t => t.key === b.dataset.crt)));
    const f = el.querySelector('#pgS'); f.onsubmit = e => { e.preventDefault(); location.hash = '#/taqaddum?q=' + encodeURIComponent(f.q.value.trim()); };
    if (q) el.querySelector('#pgR').innerHTML = resultsHtml(search(T, q), q);
    el.querySelector('#pgExp').onclick = async () => { await APP.download('زاد-الأسرة-نسخة-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(await DB.exportUserData())); await DB.setting('backup-last', Date.now()); APP.toast('تم تصدير النسخة. احفظها في مكان آمن.'); };
    el.querySelector('#pgImp').onchange = async e => { const fl = e.target.files[0]; if (!fl) return; try { await DB.importUserData(JSON.parse(await fl.text())); await APP.refreshUser(); APP.toast('تمت استعادة تقدمك'); APP.rerender(); } catch (x) { APP.toast('الملف غير صالح'); } };
  };

  // 🔎 البحث في الدروس
  function search(T, q) {
    const ws = NR(q).split(/\s+/).filter(w => w.length > 1); if (!ws.length) return [];
    const res = [];
    for (const t of T) for (const l of t.lessons) {
      const h = NR(l.txt), ht = NR(l.t); if (!ws.every(w => h.includes(w))) continue;
      res.push({ t, l, sc: ws.filter(w => ht.includes(w)).length * 3 + 1 });
    }
    return res.sort((a, b) => b.sc - a.sc).slice(0, 30);
  }
  function snip(txt, q) { const n = String(txt), w = NR(q).split(/\s+/)[0], i = NR(n).indexOf(w); return esc(n.slice(Math.max(0, i - 40), i + 90)); }
  const resultsHtml = (r, q) => r.length ? `<h3>📘 من الدروس (${D(r.length)})</h3><div class="lg-list">${r.map(({ t, l }) => `<a class="lg-row${l.done ? ' ok' : ''}" href="${l.href}"><span class="lg-n">${t.ic}</span><span><b>${esc(l.t)}</b> <small class="muted">— ${esc(t.t)}</small><br><small class="muted">…${snip(l.txt, q)}…</small></span></a>`).join('')}</div>` : `<div class="muted">لا توجد دروس فيها «${esc(q)}».</div>`;

  // إضافة نتائج الدروس أعلى نتائج البحث العام
  const origSearch = V.search;
  V.search = async (el, parts, p) => {
    const run = origSearch(el, parts, p); const q = (p && p.q) || '';
    if (!q || q.length < 2) return run;
    try {
      const r = search(await allTracks(), q).slice(0, 5); if (!r.length) return run;
      for (let i = 0; i < 50 && !el.querySelector('#sr'); i++) await new Promise(z => setTimeout(z, 100));
      const box = document.createElement('div'); box.className = 'card'; box.innerHTML = resultsHtml(r, q) + `<a href="#/taqaddum?q=${encodeURIComponent(q)}">كل نتائج الدروس ←</a>`;
      const sr = el.querySelector('#sr'); if (sr) sr.parentNode.insertBefore(box, sr); else el.append(box);
    } catch (e) { }
    return run;
  };
  window.PROGRESS = { allTracks, search };

  // 🍎 الآيفون: إرشاد لتثبيت التطبيق على الشاشة الرئيسية (يعمل بدون إنترنت كتطبيق)
  window.addEventListener('load', () => setTimeout(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
    let seen = false; try { seen = localStorage.getItem('ios-hint') === '1'; } catch (e) { }
    if (!ios || standalone || seen || window.Capacitor) return;
    const d = document.createElement('div'); d.className = 'ios-hint';
    d.innerHTML = `<b>🍎 ثبّت «زاد الأسرة» على الآيفون</b><div>اضغط زر المشاركة <span style="font-size:1.2em">⬆️</span> أسفل Safari، ثم اختر «إضافة إلى الشاشة الرئيسية». سيعمل كتطبيق، وبدون إنترنت بعد التحميل.</div><button class="btn sm">فهمت</button>`;
    d.querySelector('button').onclick = () => { d.remove(); try { localStorage.setItem('ios-hint', '1'); } catch (e) { } };
    document.body.appendChild(d);
  }, 3000));
})();
