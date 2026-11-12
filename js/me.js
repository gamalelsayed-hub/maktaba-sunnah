/* 👤 ملفي: ملف شخصي اختياري يُحفظ على الجهاز فقط (لا حسابات ولا خوادم)
   — الاسم والهدف والمذهب والورد اليومي، ولوحة «يومي» في الرئيسية، والختمة المتتابعة. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const GOALS = { hifz: 'حفظ القرآن ومراجعته', talab: 'طلب العلم الشرعي', tilawa: 'تلاوة القرآن وتدبره', general: 'معرفة الأحكام والثقافة الإسلامية' };
  const MADHHAB = { hanbali: 'الحنبلي', shafii: 'الشافعي', maliki: 'المالكي', hanafi: 'الحنفي', none: 'لا ألتزم مذهباً معيناً' };
  // مقدار الورد: بالآيات أو بأجزاء من الجزء
  const WIRD = [['a10', '10 آيات'], ['a20', '20 آية'], ['a50', '50 آية'], ['j0.25', 'ربع جزء'], ['j0.5', 'نصف جزء'], ['j1', 'جزء (ختمة في شهر)'], ['j2', 'جزءان (ختمة في 15 يوماً)'], ['j3', '3 أجزاء (ختمة في 10 أيام)']];
  const today = () => new Date().toISOString().slice(0, 10);
  const get = async () => (await DB.setting('me')) || null;
  const put = me => DB.setting('me', me);

  // الآيات المتتالية من موضع معين (تلتف إلى أول المصحف عند الختم)
  function nextAyat(pos, n) {
    const out = []; let [s, a] = pos;
    while (out.length < n) { out.push([s, a]); a++; if (a > QA.COUNTS[s - 1]) { s++; a = 1; if (s > 114) { s = 1; } } }
    return out;
  }
  function portion(me) {
    const pos = me.wird.pos || [1, 1], k = me.wird.amount || 'j1';
    let n = 10;
    if (k[0] === 'a') n = +k.slice(1);
    else { const f = +k.slice(1), j = QA.juzOf(pos[0], pos[1]); n = Math.max(5, Math.round(QA.juzAyat(j).length * f)); }
    return nextAyat(pos, n);
  }
  function streak(log) {
    let d = new Date(), n = 0;
    if (!log[today()]) d.setDate(d.getDate() - 1); // لم يقرأ اليوم بعد: نحسب حتى أمس
    while (log[d.toISOString().slice(0, 10)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'صباح الخير' : h < 17 ? 'طاب يومك' : 'مساء الخير'; };
  const posName = ([s, a]) => `سورة ${AR.SURAHS[s - 1]} ${AR.toArabicDigits(a)}`;

  // ===== لوحة «يومي» في أعلى الرئيسية =====
  APP.homeDashboard = async () => {
    const me = await get();
    if (!me) return (await DB.setting('me-skip')) ? '' : `<div class="card me-card"><div class="row"><b>👋 أهلاً بك! عرّفنا بنفسك ليصير البرنامج برنامجك</b><span class="spacer"></span><a class="btn primary sm" href="#/me">إنشاء ملفي (دقيقة واحدة)</a><button class="btn sm" id="meSkip">لاحقاً</button></div>
      <div class="muted" style="font-size:13px;margin-top:4px">اسمك وهدفك وورد يومي تحدده — يُحفظ على جهازك فقط، بلا تسجيل ولا إنترنت.</div></div>`;
    const log = me.wird.log || {}, done = !!log[today()], st = streak(log), por = portion(me);
    const due = (await DB.all('srs')).filter(s => new Date(s.due) <= new Date()).length;
    const talab = (await DB.setting('talab')) || {};
    const tj = (await DB.setting('tajweed')) || {}, tjDone = window.TAJWEED ? TAJWEED.LESSONS.filter(l => tj[l.id] && tj[l.id].passed).length : 0;
    const hist = (await DB.setting('tasmee-history')) || [], last = hist[hist.length - 1];
    const cards = [];
    cards.push(`<a class="tile ${done ? 'hl-green' : ''}" href="#/wird"><b>📖 وردك اليوم</b><small>${done ? '✔ أتممته اليوم — بارك الله فيك' : `${por.length} آية من ${esc(posName(por[0]))}`}${st ? `<br>🔥 ${st === 1 ? 'يوم واحد — استمر' : st === 2 ? 'يومان متتاليان' : AR.toArabicDigits(st) + (st < 11 ? ' أيام' : ' يوماً') + ' متتالية'}` : ''}</small></a>`);
    if (me.goal === 'hifz' || due) cards.push(`<a class="tile" href="#/hifz"><b>🧠 مراجعة الحفظ</b><small>${due ? `<span class="badge">${due}</span> مستحقة اليوم` : 'لا شيء مستحق اليوم'}</small></a>`);
    if (me.goal === 'hifz' || me.goal === 'tilawa') cards.push(`<a class="tile" href="#/tasmee?new=1"><b>📝 سمّع حفظك</b><small>${last ? 'آخر اختبار: ' + esc(last.scope) + ' — ' + last.pct + '٪' : 'اختبر نفسك في سورة أو جزء'}</small></a>`);
    if (me.goal === 'talab' || talab.track) cards.push(`<a class="tile" href="#/talab"><b>🎓 منهجك</b><small>${talab.track ? Object.values(talab.status || {}).filter(x => x === 'done').length + ' كتاب أنهيته — تابع من حيث وقفت' : 'اختر مسارك وابدأ'}</small></a>`);
    if (tjDone < (window.TAJWEED ? TAJWEED.LESSONS.length : 0)) cards.push(`<a class="tile" href="#/tajweed"><b>🎙️ التجويد</b><small>${tjDone ? tjDone + ' دروس اجتزتها — تابع' : 'صحّح تلاوتك من الصفر'}</small></a>`);
    if (me.goal === 'general') cards.push(`<a class="tile" href="#/ask"><b>❓ اسأل عن مسألة</b><small>ابحث عن حكم بأدلته وأقوال العلماء</small></a>`);
    return `<div class="me-hello"><h1 style="margin:0">${greet()} يا ${esc(me.name || 'أخي')} 👋</h1><span class="spacer"></span><a class="btn sm" href="#/me">👤 ملفي</a></div>
      <div class="grid" style="margin-bottom:6px">${cards.join('')}</div>`;
  };
  APP.bindHomeDashboard = el => { const b = el.querySelector('#meSkip'); if (b) b.onclick = async () => { await DB.setting('me-skip', true); APP.rerender(); }; };

  // ===== شاشة ملفي =====
  V.me = async el => {
    const me = (await get()) || { name: '', goal: 'tilawa', madhhab: 'none', wird: { amount: 'j1', pos: [1, 1], log: {} } };
    const talab = (await DB.setting('talab')) || {};
    el.innerHTML = `<h1>👤 ملفي</h1>
      <div class="sub">يُحفظ على جهازك فقط — لا يُرسل لأي جهة، ولا يحتاج تسجيلاً أو إنترنت. لنقله لجهاز آخر استعمل «النسخة الاحتياطية» في الإعدادات.</div>
      <form id="meF" class="card">
        <label class="fld">الاسم الذي نناديك به <input name="name" value="${esc(me.name)}" placeholder="مثال: أحمد" maxlength="30"></label>
        <label class="fld">هدفك الأساسي <select name="goal">${Object.entries(GOALS).map(([k, v]) => `<option value="${k}" ${k === me.goal ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="fld">مذهبك الفقهي <select name="madhhab">${Object.entries(MADHHAB).map(([k, v]) => `<option value="${k}" ${k === me.madhhab ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="fld">نوع العرض <select name="profile"><option value="aam" ${APP.state.profile === 'aam' ? 'selected' : ''}>🙂 مسلم (عرض مبسط)</option><option value="talib" ${APP.state.profile === 'talib' ? 'selected' : ''}>🎓 طالب علم / باحث (تفاصيل كاملة)</option></select></label>
        <h2>📖 الورد اليومي</h2>
        <label class="fld">مقداره <select name="amount">${WIRD.map(([k, v]) => `<option value="${k}" ${k === me.wird.amount ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="fld">تبدأ (أو تكمل) من <select name="ps">${AR.SURAHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === me.wird.pos[0] ? 'selected' : ''}>${AR.toArabicDigits(i + 1)}. ${esc(n)}</option>`).join('')}</select>
          آية <input name="pa" type="number" min="1" value="${me.wird.pos[1]}" style="width:80px"></label>
        <label class="fld">القارئ المفضّل ${QA.reciterSelect((await DB.setting('reciter')) || 'husary', 'name="reciter"')}</label>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn primary">حفظ</button>${await get() ? '<button type="button" class="btn" id="meDel">حذف ملفي</button>' : ''}</div>
      </form>`;
    const f = el.querySelector('#meF');
    f.onsubmit = async e => {
      e.preventDefault();
      const s = +f.ps.value, a = Math.min(Math.max(1, +f.pa.value || 1), QA.COUNTS[s - 1]);
      Object.assign(me, { name: f.name.value.trim(), goal: f.goal.value, madhhab: f.madhhab.value });
      me.wird = Object.assign(me.wird || {}, { amount: f.amount.value, pos: [s, a] }); me.wird.log = me.wird.log || {};
      me.created = me.created || new Date().toISOString();
      await put(me);
      await DB.setting('reciter', f.reciter.value);
      if (f.profile.value !== APP.state.profile) await APP.setProfile(f.profile.value);
      if (me.madhhab !== 'none') { talab.madhhab = me.madhhab; await DB.setting('talab', Object.assign({ track: '', science: 'aqida', status: {} }, talab)); }
      APP.toast('✔ حُفظ ملفك'); location.hash = '#/';
    };
    const d = el.querySelector('#meDel');
    if (d) d.onclick = async () => { if (!await APP.ask('حذف ملفك الشخصي وسجل الورد؟ (لا يُحذف حفظك ولا محفوظاتك)')) return; await DB.del('settings', 'me'); APP.toast('حُذف'); location.hash = '#/'; };
  };

  // ===== شاشة الورد =====
  V.wird = async el => {
    const me = await get();
    if (!me) { location.hash = '#/me'; return; }
    const por = portion(me), log = me.wird.log || {}, done = !!log[today()];
    const ayat = (await DB.byIndex('items', 'bookId', 'quran')).filter(x => por.some(([s, a]) => s === x.surah && a === x.ayah));
    const key = x => x.surah * 1000 + x.ayah; ayat.sort((a, b) => key(a) - key(b));
    // ترتيب يراعي الالتفاف من الناس إلى الفاتحة
    const ord = new Map(por.map(([s, a], i) => [s * 1000 + a, i])); ayat.sort((a, b) => ord.get(key(a)) - ord.get(key(b)));
    const last = por[por.length - 1], days = Object.keys(log).length;
    el.innerHTML = `<div class="row"><h1>📖 وردك اليوم</h1><span class="spacer"></span><span class="tag">${esc(posName(por[0]))} ← ${esc(posName(last))}</span></div>
      <div class="row" style="gap:8px;margin-bottom:10px"><button class="btn primary" id="wPlay">▶ استمع للورد</button><a class="btn" href="#/me">تغيير المقدار</a><span class="spacer"></span><span class="muted">قرأت وردك ${AR.toArabicDigits(days)} يوماً — 🔥 ${AR.toArabicDigits(streak(log))} متتالية${me.wird.khatmas ? ' — ختمات: ' + AR.toArabicDigits(me.wird.khatmas) : ''}</span></div>
      ${done ? '<div class="info">✔ أتممت ورد اليوم. يمكنك قراءة ورد الغد إن شئت.</div>' : ''}
      ${ayat.map((x, i) => `${x.ayah === 1 ? `<h2 style="text-align:center">سورة ${esc(AR.SURAHS[x.surah - 1])}</h2>` : ''}<div class="card" data-card="${x.id}"><div class="quran-text">${esc(x.text)} <a class="ayah-num" href="#/item/${x.id}">${AR.toArabicDigits(x.ayah)}</a></div></div>`).join('')}
      <div class="row" style="gap:8px;margin:14px 0"><button class="btn primary" id="wDone">✔ أتممت وردي</button><span class="muted">ينتقل الورد القادم إلى ${esc(posName(nextAyat(last, 2)[1]))}</span></div>`;
    el.querySelector('#wPlay').onclick = () => QA.play(por);
    el.querySelector('#wDone').onclick = async () => {
      const nx = nextAyat(last, 2)[1];
      if (nx[0] === 1 && nx[1] === 1) { me.wird.khatmas = (me.wird.khatmas || 0) + 1; APP.toast('🎉 ختمت القرآن! تقبّل الله منك', 6000); }
      me.wird.pos = nx; me.wird.log = Object.assign(log, { [today()]: (log[today()] || 0) + por.length });
      await put(me); QA.stop();
      if (!(nx[0] === 1 && nx[1] === 1)) APP.toast('✔ بارك الله فيك — سُجّل وردك');
      location.hash = '#/';
    };
  };
})();
