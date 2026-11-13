/* 📿 الأذكار: الصباح والمساء + حصن المسلم كاملاً، مع عدّاد التكرار والاستماع والتذكير الدوري */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = () => window.ADHKAR_DATA || { sm: [], hisn: [], groups: [] };
  const today = () => new Date().toISOString().slice(0, 10);
  const isMorningNow = () => { const h = new Date().getHours(); return h >= 3 && h < 14; };

  // تقدّم العدّ لهذا اليوم (يُصفَّر تلقائياً كل يوم)
  async function prog() { const p = (await DB.setting('adhkar-prog')) || {}; if (p.day !== today()) return { day: today(), c: {} }; return p; }
  const saveProg = p => DB.setting('adhkar-prog', p);
  async function settings() { return Object.assign({ fs: 1, morning: '05:30', evening: '16:30', morningOn: false, eveningOn: false, periodic: 0, sleepOn: false, sleep: '22:30', voice: 'rec' }, (await DB.setting('adhkar-cfg')) || {}); }

  // الاستماع: التسجيل الصوتي إن وُجد، وإلا القراءة الصوتية
  const player = new Audio();
  let queue = [], qi = 0;
  function bar() {
    let b = document.getElementById('dkBar');
    if (!queue.length) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'dkBar'; b.className = 'qa-bar'; document.body.appendChild(b); }
    b.innerHTML = `<button class="btn sm primary" data-a="t">${player.paused ? '▶' : '⏸'}</button>${queue.length > 1 ? '<button class="btn sm" data-a="n">⏭</button>' : ''}
      <span class="qa-now">📿 ${queue.length > 1 ? `الذكر ${AR.toArabicDigits(qi + 1)} من ${AR.toArabicDigits(queue.length)}` : 'ذكر'}</span><button class="btn sm" data-a="x" title="إيقاف">✕</button>`;
    b.querySelector('[data-a=t]').onclick = () => { if (player.paused) player.play().catch(() => { }); else player.pause(); };
    const n = b.querySelector('[data-a=n]'); if (n) n.onclick = () => playAt(qi + 1);
    b.querySelector('[data-a=x]').onclick = stop;
  }
  function playAt(i) { if (i >= queue.length) { stop(); return; } qi = i; player.src = queue[i]; player.play().catch(() => { }); bar(); }
  function stop() { const had = queue.length; queue = []; qi = 0; try { player.pause(); player.removeAttribute('src'); player.load(); } catch (e) { } if (had && window.KEEPALIVE) KEEPALIVE.stop(); bar(); }
  if (window.MEDIA) MEDIA.register('adhkar', () => { if (queue.length) stop(); });
  player.onplay = player.onpause = () => bar();
  player.onended = () => playAt(qi + 1);
  function play(urls) { if (window.MEDIA) MEDIA.claim('adhkar'); queue = urls; playAt(0); if (window.KEEPALIVE) KEEPALIVE.start('📿 الأذكار', ''); }
  function listen(item) {
    if (item.a && navigator.onLine !== false) { play([item.a]); player.onerror = () => { stop(); if (window.TTS) TTS.read(item.t, 'ذكر'); }; return; }
    stop(); if (window.TTS) TTS.read(item.t, 'ذكر');
  }

  function card(it, key, done, fs) {
    const left = Math.max(0, it.c - (done || 0)), fin = left === 0;
    return `<div class="card dk ${fin ? 'dk-done' : ''}" data-k="${key}">
      <div class="dk-text" style="font-size:${(1.18 * fs).toFixed(2)}em">${esc(it.t)}</div>
      ${it.f ? `<div class="dk-fadl">✨ ${esc(it.f)}</div>` : ''}
      <div class="row dk-bar">
        <button class="dk-count ${fin ? 'fin' : ''}" data-tap="${key}" aria-label="عدّ"><b>${fin ? '✔' : AR.toArabicDigits(left)}</b><small>${fin ? 'تمّ' : it.c > 1 ? 'من ' + AR.toArabicDigits(it.c) : 'مرة'}</small></button>
        <span class="spacer"></span>
        <button class="btn sm" data-listen="${key}">${it.a ? '🔊 استمع' : '🗣️ اقرأ لي'}</button>
        <button class="btn sm" data-copy="${key}">📋</button>
        ${it.s ? `<button class="btn sm" data-src="${key}">📚 المصدر</button>` : ''}
      </div>
      ${it.s ? `<div class="dk-src hidden" id="src-${key}">${esc(it.s)}${it.v ? '<br><b>غريب الألفاظ:</b> ' + esc(it.v) : ''}</div>` : ''}
    </div>`;
  }

  V.adhkar = async (el, [tab, cat]) => {
    const d = D(), cfg = await settings(), p = await prog();
    tab = tab || (isMorningNow() ? 'sabah' : 'masa');
    const tabs = [['sabah', '🌅 الصباح'], ['masa', '🌇 المساء'], ['hisn', '🏰 حصن المسلم'], ['remind', '🔔 التذكير']];
    const head = `<div class="row"><h1>📿 الأذكار</h1><span class="spacer"></span>
      <button class="btn sm" id="fsMinus">ا-</button><button class="btn sm" id="fsPlus">ا+</button></div>
      <div class="tabs">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
    let body = '', list = [];
    if (tab === 'sabah' || tab === 'masa') {
      // النوع: 0 للصباح والمساء، 1 للصباح فقط، 2 للمساء فقط؛ وتُبدَّل ألفاظ «أصبحنا/أمسينا» في المساء
      list = d.sm.filter(x => x.k === 0 || x.k === (tab === 'sabah' ? 1 : 2)).map((x, i) => ({ ...x, key: tab + i }));
      const done = list.filter(x => (p.c[x.key] || 0) >= x.c).length;
      body = `<div class="card"><div class="row"><b>${done === list.length ? '✔ أتممت أذكار ' + (tab === 'sabah' ? 'الصباح' : 'المساء') + ' — تقبّل الله' : `أتممت ${AR.toArabicDigits(done)} من ${AR.toArabicDigits(list.length)}`}</b><span class="spacer"></span>
          <button class="btn sm primary" id="playAll">▶ استمع لها كلها</button><button class="btn sm" id="resetAll">↺ من جديد</button></div>
          <div class="progress" style="margin-top:8px"><div style="width:${100 * done / Math.max(1, list.length)}%"></div></div>
          <div class="muted" style="font-size:12.5px;margin-top:6px">اضغط على الدائرة كلما قلت الذكر — يُصفَّر العدّ كل يوم. ${tab === 'masa' ? 'في المساء يقال: «أمسينا وأمسى الملك لله»… بدل «أصبحنا».' : ''}</div></div>
        ${list.map(x => card(x, x.key, p.c[x.key], cfg.fs)).join('')}
        <div class="muted" style="font-size:12px">المصدر: ${esc(d.src.sm)}</div>`;
    } else if (tab === 'hisn') {
      if (cat) {
        const c = d.hisn.find(x => String(x.id) === String(cat));
        if (!c) { location.hash = '#/adhkar/hisn'; return; }
        list = c.items.map((x, i) => ({ ...x, key: 'h' + c.id + '_' + i }));
        const i = d.hisn.indexOf(c);
        body = `<div class="row" style="margin-bottom:10px"><a class="btn sm" href="#/adhkar/hisn">← الأبواب</a><h2 style="margin:0;flex:1">${esc(c.title)}</h2></div>
          ${list.map(x => card(x, x.key, p.c[x.key], cfg.fs)).join('')}
          ${c.notes.length ? `<details class="card"><summary>📚 التخريج والحواشي</summary><ol class="dk-notes">${c.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ol></details>` : ''}
          <div class="row">${i > 0 ? `<a class="btn" href="#/adhkar/hisn/${d.hisn[i - 1].id}">→ ${esc(d.hisn[i - 1].title)}</a>` : ''}<span class="spacer"></span>${i < d.hisn.length - 1 ? `<a class="btn" href="#/adhkar/hisn/${d.hisn[i + 1].id}">${esc(d.hisn[i + 1].title)} ←</a>` : ''}</div>
          <div class="muted" style="font-size:12px;margin-top:8px">${esc(d.src.hisn)}</div>`;
      } else {
        body = `<input type="search" id="hq" placeholder="ابحث في أبواب حصن المسلم… (مثال: السفر، الهم، المطر)" style="width:100%;margin-bottom:12px">
          ${d.groups.map(g => { const cs = d.hisn.filter(c => c.g === g); return cs.length ? `<h2>${esc(g)}</h2><div class="grid hisn-grid">${cs.map(c => `<a class="tile" href="#/adhkar/hisn/${c.id}" data-t="${esc(AR.normalize(c.title))}"><b>${esc(c.title)}</b><small>${AR.toArabicDigits(c.items.length)} ${c.items.length > 2 && c.items.length < 11 ? 'أذكار' : 'ذكر'}</small></a>`).join('')}</div>` : ''; }).join('')}`;
      }
    } else {
      const st = await NOTIFY.status();
      body = `<div class="card"><h2 style="margin-top:0">🔔 تذكير بالأذكار</h2>
        ${st.kind === 'web' ? '<div class="warn">في نسخة المتصفح يظهر التذكير ما دام التطبيق مفتوحاً فقط. للتذكير والتطبيق مغلق استعمل تطبيق أندرويد.</div>' : ''}
        ${st.perm !== 'granted' ? '<div class="info">لم تُمنح صلاحية التنبيهات بعد. <button class="btn sm primary" id="perm">السماح بالتنبيهات</button></div>' : ''}
        <label class="fld"><input type="checkbox" id="mOn" ${cfg.morningOn ? 'checked' : ''}> أذكار الصباح الساعة <input type="time" id="mT" value="${cfg.morning}"></label>
        <label class="fld"><input type="checkbox" id="eOn" ${cfg.eveningOn ? 'checked' : ''}> أذكار المساء الساعة <input type="time" id="eT" value="${cfg.evening}"></label>
        <label class="fld"><input type="checkbox" id="sOn" ${cfg.sleepOn ? 'checked' : ''}> أذكار النوم الساعة <input type="time" id="sT" value="${cfg.sleep}"></label>
        <label class="fld">تذكير دوري بذكر قصير (سبحان الله وبحمده، الاستغفار، الصلاة على النبي ﷺ…) <select id="per">${[[0, 'إيقاف'], [1, 'كل ساعة'], [2, 'كل ساعتين'], [3, 'كل 3 ساعات'], [4, 'كل 4 ساعات'], [6, 'كل 6 ساعات']].map(([v, l]) => `<option value="${v}" ${+cfg.periodic === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="muted" style="font-size:12.5px">التذكير الدوري يتوقف من 11 مساءً إلى 5 صباحاً.</div>
        <button class="btn primary" id="saveR" style="margin-top:10px">حفظ</button></div>`;
    }
    el.innerHTML = head + body;
    const $ = s => el.querySelector(s);
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { location.hash = '#/adhkar/' + b.dataset.tab; });
    const setFs = async d2 => { cfg.fs = Math.min(1.8, Math.max(0.8, +(cfg.fs + d2).toFixed(2))); await DB.setting('adhkar-cfg', cfg); APP.rerender(); };
    $('#fsMinus').onclick = () => setFs(-0.1); $('#fsPlus').onclick = () => setFs(0.1);
    const byKey = k => list.find(x => x.key === k);
    el.querySelectorAll('[data-tap]').forEach(b => b.onclick = async () => {
      const it = byKey(b.dataset.tap), n = (p.c[it.key] || 0);
      if (n >= it.c) return;
      p.c[it.key] = n + 1; await saveProg(p);
      if (navigator.vibrate) navigator.vibrate(p.c[it.key] >= it.c ? [40, 60, 40] : 25);
      const cardEl = b.closest('.dk'), left = it.c - p.c[it.key];
      b.querySelector('b').textContent = left ? AR.toArabicDigits(left) : '✔';
      if (!left) { b.classList.add('fin'); b.querySelector('small').textContent = 'تمّ'; cardEl.classList.add('dk-done'); const nx = cardEl.nextElementSibling; if (nx && nx.classList.contains('dk')) setTimeout(() => nx.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250); }
    });
    el.querySelectorAll('[data-listen]').forEach(b => b.onclick = () => listen(byKey(b.dataset.listen)));
    el.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => APP.copy(byKey(b.dataset.copy).t));
    el.querySelectorAll('[data-src]').forEach(b => b.onclick = () => $('#src-' + b.dataset.src).classList.toggle('hidden'));
    if ($('#resetAll')) $('#resetAll').onclick = async () => { list.forEach(x => delete p.c[x.key]); await saveProg(p); APP.rerender(); };
    if ($('#playAll')) $('#playAll').onclick = () => {
      // تشغيل متتابع: التسجيلات حيث وُجدت
      const q = list.filter(x => x.a); let i = 0;
      if (!q.length) { if (window.TTS) TTS.read(list.map(x => x.t).join('. '), 'الأذكار'); return; }
      void i; player.onerror = null; play(q.map(x => x.a)); APP.toast('▶ يُشغَّل ' + q.length + ' ذكراً بالتتابع — اضغط أي ذكر للاستماع له وحده', 4000);
    };
    if ($('#hq')) $('#hq').oninput = e => { const q = AR.normalize(e.target.value); el.querySelectorAll('.hisn-grid .tile').forEach(t => { t.style.display = !q || t.dataset.t.includes(q) ? '' : 'none'; }); };
    if ($('#perm')) $('#perm').onclick = async () => { await NOTIFY.request(); APP.rerender(); };
    if ($('#saveR')) $('#saveR').onclick = async () => {
      Object.assign(cfg, { morningOn: $('#mOn').checked, morning: $('#mT').value, eveningOn: $('#eOn').checked, evening: $('#eT').value, sleepOn: $('#sOn').checked, sleep: $('#sT').value, periodic: +$('#per').value });
      await DB.setting('adhkar-cfg', cfg);
      if ((cfg.morningOn || cfg.eveningOn || cfg.sleepOn || cfg.periodic) && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request();
      await NOTIFY.rescheduleAll(); APP.toast('✔ حُفظ التذكير');
    };
  };

  // ===== جدولة تنبيهات الأذكار للأيام القادمة =====
  const SHORT = ['سبحان الله وبحمده، سبحان الله العظيم', 'أستغفر الله وأتوب إليه', 'اللهم صلّ وسلّم على نبينا محمد', 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', 'لا حول ولا قوة إلا بالله', 'سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر', 'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم', 'رب اغفر لي وتب عليّ إنك أنت التواب الرحيم'];
  NOTIFY.register('adhkar', async () => {
    const cfg = await settings(), out = [], at = (d, hm) => { const [h, m] = hm.split(':').map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
    for (let k = 0; k < 7; k++) {
      const d = new Date(); d.setDate(d.getDate() + k);
      if (cfg.morningOn) out.push({ title: '🌅 أذكار الصباح', body: 'أصبحنا وأصبح الملك لله — حان وقت أذكار الصباح', at: at(d, cfg.morning), route: '#/adhkar/sabah' });
      if (cfg.eveningOn) out.push({ title: '🌇 أذكار المساء', body: 'أمسينا وأمسى الملك لله — حان وقت أذكار المساء', at: at(d, cfg.evening), route: '#/adhkar/masa' });
      if (cfg.sleepOn) out.push({ title: '🌙 أذكار النوم', body: 'باسمك اللهم أموت وأحيا', at: at(d, cfg.sleep), route: '#/adhkar/hisn/' + ((D().hisn.find(c => c.title === 'أذكار النوم') || {}).id || '') });
    }
    if (+cfg.periodic) {
      let t = new Date(); t.setMinutes(0, 0, 0);
      for (let i = 0; i < 48 * 3 && out.length < 400; i++) {
        t = new Date(t.getTime() + cfg.periodic * 3600e3); const h = t.getHours();
        if (h >= 23 || h < 5) continue;
        out.push({ title: '📿 ذكّر قلبك', body: SHORT[(t.getDate() * 24 + h) % SHORT.length], at: t, route: '#/adhkar' });
      }
    }
    return out;
  });

  window.ADHKAR = { listen, stop };
})();
