/* 📄 المصحف بالصفحات: تخطيط مصحف المدينة (604 صفحة — طبعة مجمع الملك فهد 1405هـ) سطراً بسطر،
   بتقليب الصفحات (سحب أو أزرار)، والضغط على الآية لتفسيرها، ومتابعة القراءة من آخر صفحة.
   النظام مهيأ لاستقبال تخطيطات مصاحف أخرى (كمصحف الأزهر) متى توفرت بياناتها. */
(function () {
  const { esc } = APP;
  const V = APP.views;
  const D = AR.toArabicDigits;
  const N_PAGES = 604;
  const loads = {};
  const script = src => loads[src] || (loads[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loads[src]; rej(new Error('تعذّر تحميل صفحات المصحف')); }; document.head.appendChild(s); }));
  const loadIndex = () => window.MUSHAF_INDEX ? Promise.resolve() : script('data/pages/index.js');
  async function loadPage(p) {
    window.MUSHAF_PAGES = window.MUSHAF_PAGES || {};
    if (!MUSHAF_PAGES[p]) await script('data/pages/p' + String(Math.floor((p - 1) / 20) + 1).padStart(2, '0') + '.js');
    return MUSHAF_PAGES[p];
  }
  /** رقم الصفحة التي فيها الآية */
  async function pageOf(s, a) {
    await loadIndex(); const I = MUSHAF_INDEX;
    let lo = 0, hi = I.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; const [ms, ma] = I[m]; if (ms < s || (ms === s && ma <= a)) lo = m; else hi = m - 1; }
    return lo + 1;
  }
  const getLast = () => { try { return +localStorage.getItem('mushaf-page') || 1; } catch (e) { return 1; } };

  function pageHtml(p, lines) {
    const surahs = [...new Set(lines.filter(l => l[0] === 't').flatMap(l => l[1].map(x => x[0])))];
    const fa = lines.find(l => l[0] === 't')[1][0];
    const juz = window.QA ? QA.juzOf(fa[0], fa[1]) : '';
    const center = p <= 2;
    const body = lines.map(l => {
      if (l[0] === 'h') return `<div class="mp-head"><span>سورة ${esc(AR.SURAHS[l[1] - 1])}</span></div>`;
      if (l[0] === 'b') return '<div class="mp-basm">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>';
      return `<div class="mp-line ${center ? 'c' : ''}">${l[1].map(([s, a, t, e]) => t.split(' ').map((w, i, arr) => `<span class="mp-w" data-k="${s}:${a}">${esc(w)}${e && i === arr.length - 1 ? `<span class="mp-n">${D(a)}</span>` : ''}</span>`).join('')).join('')}</div>`;
    }).join('');
    return `<div class="mp-top"><span>${esc(surahs.map(s => AR.SURAHS[s - 1]).join(' — '))}</span><span>الجزء ${D(juz)}</span></div>
      <div class="mp-page ${center ? 'mp-first' : ''}">${body}</div>
      <div class="mp-num">${D(p)}</div>`;
  }
  // تصغير الخط حتى لا يتجاوز أي سطر عرض الصفحة
  function fit(box) {
    const pg = box.querySelector('.mp-page'); if (!pg) return;
    let fs = Math.min(30, Math.max(14, pg.clientWidth / 15.5));
    pg.style.fontSize = fs + 'px';
    for (let k = 0; k < 14; k++) {
      const over = [...pg.querySelectorAll('.mp-line')].some(l => l.scrollWidth > l.clientWidth + 1);
      if (!over) break; fs -= 0.8; pg.style.fontSize = fs + 'px';
    }
  }

  V.mushaf = async (el, parts, p) => {
    await loadIndex();
    const raw = +(parts && parts[0]) || 0;
    let page = raw ? Math.min(N_PAGES, Math.max(1, raw)) : 0;
    if (!page) {
      if (p.s) page = await pageOf(+p.s, +(p.a || 1));
      else page = getLast();
      location.replace('#/mushaf/' + page + (p.a ? '?hl=' + p.s + ':' + p.a : '')); return;
    }
    try { localStorage.setItem('mushaf-page', page); } catch (e) { }
    let lines;
    try { lines = await loadPage(page); } catch (e) { el.innerHTML = '<div class="warn">' + esc(e.message) + '</div>'; return; }
    const juzStarts = window.QA ? QA.JUZ : [];
    el.innerHTML = `<div class="mp-bar row">
        <a class="btn sm" href="#/mushaf/${Math.max(1, page - 1)}" title="السابقة">→</a>
        <select id="mpSurah" class="mp-sel">${AR.SURAHS.map((n, i) => `<option value="${i + 1}">${D(i + 1)}. ${esc(n)}</option>`).join('')}</select>
        <select id="mpJuz" class="mp-sel"><option value="">الجزء</option>${juzStarts.map((j, i) => `<option value="${i}">الجزء ${D(i + 1)}</option>`).join('')}</select>
        <input id="mpGo" type="number" min="1" max="604" value="${page}" class="mp-in" title="رقم الصفحة">
        <a class="btn sm" href="#/mushaf/${Math.min(N_PAGES, page + 1)}" title="التالية">←</a>
      </div>
      <div class="mp-wrap" id="mpWrap">${pageHtml(page, lines)}</div>
      <div class="row mp-tools" style="gap:6px;flex-wrap:wrap;justify-content:center">
        <button class="btn sm primary" id="mpPlay">▶ استمع للصفحة</button>
        <a class="btn sm" href="#/quran/${lines.find(l => l[0] === 't')[1][0][0]}">📖 عرض السورة بالآيات</a>
        <span class="muted" style="font-size:12px">اسحب يميناً ويساراً لتقليب الصفحات، واضغط على آية لتفسيرها</span>
      </div>
      <div class="muted" style="font-size:11.5px;text-align:center;margin-top:6px">تخطيط مصحف المدينة النبوية (604 صفحة). مصحف الأزهر (الصفحة تنتهي في وسط الآية) يُضاف متى توفرت بيانات تخطيطه.</div>`;
    const $ = s => el.querySelector(s);
    const firstT = lines.find(l => l[0] === 't')[1][0];
    $('#mpSurah').value = firstT[0];
    const wrap = $('#mpWrap');
    fit(wrap);
    const ro = window.ResizeObserver ? new ResizeObserver(() => fit(wrap)) : null; if (ro) ro.observe(wrap);
    $('#mpSurah').onchange = async e => { location.hash = '#/mushaf/' + (await pageOf(+e.target.value, 1)); };
    $('#mpJuz').onchange = async e => { if (e.target.value === '') return; const [s, a] = juzStarts[+e.target.value]; location.hash = '#/mushaf/' + (await pageOf(s, a)); };
    $('#mpGo').onchange = e => { const v = Math.min(N_PAGES, Math.max(1, +e.target.value || 1)); location.hash = '#/mushaf/' + v; };
    // آيات الصفحة بالترتيب
    const ayat = []; lines.forEach(l => l[0] === 't' && l[1].forEach(([s, a]) => { const k = s + ':' + a; if (!ayat.includes(k)) ayat.push(k); }));
    $('#mpPlay').onclick = () => window.QA && QA.play(ayat.map(k => k.split(':').map(Number)));
    // تمييز آية
    const hl = k => { wrap.querySelectorAll('.mp-w.sel').forEach(x => x.classList.remove('sel')); wrap.querySelectorAll(`[data-k="${k}"]`).forEach(x => x.classList.add('sel')); };
    if (p.hl) hl(p.hl);
    wrap.onclick = async e => {
      const w = e.target.closest('.mp-w'); if (!w) return;
      const k = w.dataset.k; hl(k);
      const [s, a] = k.split(':').map(Number);
      const it = await DB.get('items', 'quran:' + s + ':' + a); if (!it) return;
      APP.modal(`<div class="row"><b>سورة ${esc(AR.SURAHS[s - 1])} — الآية ${D(a)}</b><span class="spacer"></span><button class="icon-btn" onclick="APP.closeModal()" style="color:var(--muted)">✕</button></div>
        <div class="quran-text" style="margin:8px 0">${esc(it.text)}</div>
        <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary sm" id="m1">🔊 استمع للآية</button><button class="btn sm" id="m2">▶ من هنا</button></div>
        <div id="mAp"></div>${APP.actionsBar(it)}`, box => {
        box.querySelector('#m1').onclick = () => { APP.closeModal(); QA.play([[s, a]], { noBasmala: true }); };
        box.querySelector('#m2').onclick = () => { APP.closeModal(); const i = ayat.indexOf(k); QA.play(ayat.slice(i).map(x => x.split(':').map(Number))); };
        if (window.AYAH) AYAH.panel(box.querySelector('#mAp'), it);
      });
    };
    // السحب لتقليب الصفحات: السحب نحو اليمين يعرض الصفحة التالية (كالمصحف الورقي)
    let x0 = null, y0 = null;
    wrap.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) location.hash = '#/mushaf/' + Math.min(N_PAGES, Math.max(1, page + (dx > 0 ? 1 : -1)));
    }, { passive: true });
    // تحميل الصفحة التالية مسبقاً
    if (page < N_PAGES) loadPage(page + 1).catch(() => { });
  };

  document.addEventListener('keydown', e => {
    const m = /^#\/mushaf\/(\d+)/.exec(location.hash); if (!m || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    if (e.key === 'ArrowLeft') location.hash = '#/mushaf/' + Math.min(N_PAGES, +m[1] + 1);
    if (e.key === 'ArrowRight') location.hash = '#/mushaf/' + Math.max(1, +m[1] - 1);
  });
  window.MUSHAF = { pageOf, loadPage };
})();
