/* اختبار التسميع: يحدد الطالب السورة أو الجزء، ويُسمِّع بصوته أو يكتب، ثم يصحَّح له كلمة كلمة بعد «انتهيت» */
(() => {
    const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const BASMALA = /^بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\s*/;

  // هيكل الكلمة للمقارنة: يتسامح مع الرسم العثماني والتشكيل والهمزات والألفات
  const skel = w => AR.uthmaniAlt(w).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[اإأآٱءؤئ]/g, '').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^ء-ي]/g, '');
  const words = t => String(t || '').replace(/[ۛۚۖۗۙۘۜ۞۩]/g, ' ').replace(/(^|\s)يا\s+/g, '$1يا').split(/\s+/).map(w => ({ w, k: skel(w) })).filter(x => x.k);
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // 2 = مطابقة، 1 = قريبة (اختلاف رسم/إملاء يسير)، 0 = مختلفة
  const sim = (x, y) => x === y ? 2 : (Math.min(x.length, y.length) >= 4 && lev(x, y) <= (Math.max(x.length, y.length) >= 7 ? 2 : 1)) ? 1 : 0;
  // محاذاة الإجابة مع النص (أطول تتابع مشترك بتسامح)
  function diff(refText, ansText) {
    const R = words(refText), A = words(ansText), n = R.length, m = A.length;
    const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) { const s = sim(R[i].k, A[j].k); L[i][j] = Math.max(s ? L[i + 1][j + 1] + 1 + (s === 2 ? 0.0 : 0) : 0, L[i + 1][j], L[i][j + 1]); }
    const out = []; let i = 0, j = 0;
    while (i < n && j < m) {
      const s = sim(R[i].k, A[j].k);
      if (s && L[i][j] === L[i + 1][j + 1] + 1) { out.push({ t: s === 2 ? 'ok' : 'near', w: R[i].w, u: A[j].w }); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out.push({ t: 'miss', w: R[i].w }); i++; }
      else { out.push({ t: 'extra', u: A[j].w }); j++; }
    }
    while (i < n) out.push({ t: 'miss', w: R[i++].w });
    while (j < m) out.push({ t: 'extra', u: A[j++].w });
    const ok = out.filter(x => x.t === 'ok' || x.t === 'near').length;
    return { out, ok, total: n, extra: out.filter(x => x.t === 'extra').length, pct: n ? Math.round(100 * ok / n) : 0 };
  }
  const diffHtml = d => d.out.map(x => x.t === 'ok' ? `<span class="tw-ok">${esc(x.w)}</span>`
    : x.t === 'near' ? `<span class="tw-near" title="كتبتَ: ${esc(x.u)}">${esc(x.w)}</span>`
    : x.t === 'miss' ? `<span class="tw-miss" title="ناقصة أو خطأ">${esc(x.w)}</span>`
    : `<span class="tw-extra" title="زائدة">${esc(x.u)}</span>`).join(' ');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceOK = !!SR && !(window.desktop && window.desktop.isDesktop);

  let quranCache;
  const ayahText = async (s, a) => {
    if (!quranCache) quranCache = DB.byIndex('items', 'bookId', 'quran').then(L => { const m = {}; L.forEach(x => { m[x.surah + ':' + x.ayah] = x.text; }); return m; });
    let t = (await quranCache)[s + ':' + a] || ''; if (a === 1 && s !== 1) { const w = t.split(/\s+/); if (w.slice(0, 4).map(skel).join(' ') === 'بسم لله لرحمن لرحيم') t = w.slice(4).join(' '); } return t;
  };

  const T = { st: null };
  V.tasmee = async (el, _, p) => {
    const st = T.st;
    if (!st || p.new) return setup(el, p);
    if (st.mode === 'full') return st.done ? results(el) : fullTest(el);
    if (st.mode === 'mutash' || st.mode === 'surah') return mcqTest(el);
    if (st.i >= st.qs.length) return results(el);
    return question(el);
  };

  async function setup(el, p) {
    const hist = (await DB.setting('tasmee-history')) || [];
    const cur = (await DB.setting('reciter')) || 'husary';
    el.innerHTML = `<h1>📝 اختبار التسميع ومراجعة الحفظ</h1>
      <div class="sub">حدّد ما تريد مراجعته، فيعطيك البرنامج مواضع عشوائية منه. تُسمِّع بصوتك أو تكتب، ثم تضغط «انتهيت» فيُصحَّح لك كلمة كلمة: الأخضر صحيح، والأحمر ما نقص أو أخطأتَ فيه، والبرتقالي ما زدتَه.</div>
      <form class="card" id="tsF">
        <div class="filters" style="flex-wrap:wrap">
          <label>النطاق <select name="scope"><option value="surah">سورة</option><option value="juz">جزء</option><option value="range">من آية إلى آية</option></select></label>
          <select name="s">${AR.SURAHS.map((n, i) => `<option value="${i + 1}" ${i === 66 ? 'selected' : ''}>${AR.toArabicDigits(i + 1)}. ${esc(n)}</option>`).join('')}</select>
          <select name="j" style="display:none">${QA.JUZ.map((_, i) => `<option value="${i + 1}" ${i === 29 ? 'selected' : ''}>الجزء ${AR.toArabicDigits(i + 1)}</option>`).join('')}</select>
          <span id="tsRange" style="display:none">من <select name="s1">${AR.SURAHS.map((n, i) => `<option value="${i + 1}" ${i === 1 ? 'selected' : ''}>${AR.toArabicDigits(i + 1)}. ${esc(n)}</option>`).join('')}</select> آية <input name="a1" type="number" min="1" value="1" style="width:70px">
            إلى <select name="s2">${AR.SURAHS.map((n, i) => `<option value="${i + 1}" ${i === 1 ? 'selected' : ''}>${AR.toArabicDigits(i + 1)}. ${esc(n)}</option>`).join('')}</select> آية <input name="a2" type="number" min="1" value="20" style="width:70px"></span>
        </div>
        <div class="filters" style="flex-wrap:wrap;margin-top:6px">
          <label>نوع الاختبار <select name="mode">
            <option value="full">تسميع المقطع كاملاً (مع طلب مساعدة عند التوقف)</option>
            <option value="recall">من حفظك: تظهر آية فتُكمل ما بعدها</option>
            <option value="start">بداية الآية: يظهر أولها فتُكمل الآية</option>
            <option value="dict">إملاء: تسمع الآيات بصوت القارئ فتكتبها</option>
            <option value="mutash">المتشابهات: أكمل الآية التي تشتبه بغيرها</option>
            <option value="surah">اذكر اسم السورة: تظهر آية فتختار سورتها</option></select></label>
          <label class="ts-n">عدد الأسئلة <select name="n">${[3, 5, 10, 15, 20].map(n => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="ts-len">آيات في كل سؤال <select name="len">${[1, 2, 3, 5].map(n => `<option ${n === 2 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="ts-ans">طريقة الإجابة <select name="ans"><option value="text">كتابة</option><option value="voice" ${voiceOK ? '' : 'disabled'}>بالصوت${voiceOK ? '' : ' (غير متاح هنا)'}</option></select></label>
        </div>
        <div class="filters" style="margin-top:6px"><label>القارئ (للإملاء وسماع الصواب) ${QA.reciterSelect(cur, 'name="r"')}</label></div>
        ${voiceOK ? '<div class="muted" style="font-size:13px;margin-top:6px">🎙️ الإجابة بالصوت تستعمل خدمة التعرف على الكلام في المتصفح، فتحتاج إنترنت أثناء التسميع.</div>' : '<div class="muted" style="font-size:13px;margin-top:6px">🎙️ الإجابة بالصوت متاحة في نسخة الويب على متصفح Chrome أو Edge (حاسوب أو جوال). في نسخة سطح المكتب استعمل الكتابة.</div>'}
        <button class="btn primary" style="margin-top:10px">ابدأ الاختبار</button>
      </form>
      ${hist.length ? `<h2>نتائجك السابقة</h2><table class="t"><tr><th>التاريخ</th><th>النطاق</th><th>النوع</th><th>النتيجة</th></tr>${hist.slice(-15).reverse().map(h => `<tr><td>${new Date(h.at).toLocaleDateString('ar')}</td><td>${esc(h.scope)}</td><td>${esc(h.mode)}</td><td><b>${h.pct}٪</b></td></tr>`).join('')}</table>` : ''}`;
    const f = el.querySelector('#tsF');
    const sync = () => {
      const sc = f.scope.value, m = f.mode.value;
      f.j.style.display = sc === 'juz' ? '' : 'none'; f.s.style.display = sc === 'surah' ? '' : 'none'; el.querySelector('#tsRange').style.display = sc === 'range' ? '' : 'none';
      el.querySelector('.ts-n').style.display = m === 'full' ? 'none' : '';
      el.querySelector('.ts-len').style.display = ['full', 'mutash', 'surah'].includes(m) ? 'none' : '';
      el.querySelector('.ts-ans').style.display = ['mutash', 'surah'].includes(m) ? 'none' : '';
    };
    f.scope.onchange = sync; f.mode.onchange = sync; sync();
    f.onsubmit = async e => {
      e.preventDefault();
      const scope = f.scope.value;
      let list, scopeName;
      if (scope === 'juz') { list = QA.juzAyat(+f.j.value); scopeName = 'الجزء ' + AR.toArabicDigits(f.j.value); }
      else if (scope === 'surah') { list = QA.surahAyat(+f.s.value); scopeName = 'سورة ' + AR.SURAHS[f.s.value - 1]; }
      else {
        const s1 = +f.s1.value, s2 = +f.s2.value, a1 = Math.min(Math.max(1, +f.a1.value || 1), QA.COUNTS[s1 - 1]), a2 = Math.min(Math.max(1, +f.a2.value || 1), QA.COUNTS[s2 - 1]);
        if (s2 < s1 || (s2 === s1 && a2 < a1)) { APP.toast('نهاية المقطع قبل بدايته — صحّح الاختيار'); return; }
        list = []; for (let s = s1; s <= s2; s++) for (let a = (s === s1 ? a1 : 1); a <= (s === s2 ? a2 : QA.COUNTS[s - 1]); a++) list.push([s, a]);
        scopeName = `${AR.SURAHS[s1 - 1]} ${AR.toArabicDigits(a1)} ← ${AR.SURAHS[s2 - 1]} ${AR.toArabicDigits(a2)}`;
      }
      await DB.setting('reciter', f.r.value);
      const base = { mode: f.mode.value, voice: f.ans.value === 'voice', r: f.r.value, i: 0, res: [], scopeName, list };
      if (f.mode.value === 'full') { T.st = Object.assign(base, { qs: [{ ans: list }] }); location.hash = '#/tasmee?q=' + Date.now(); return; }
      if (f.mode.value === 'mutash' || f.mode.value === 'surah') { T.st = Object.assign(base, { qs: [], n: +f.n.value }); location.hash = '#/tasmee?q=' + Date.now(); return; }
      const len = Math.min(+f.len.value, list.length - (f.mode.value === 'recall' ? 1 : 0)) || 1;
      const n = +f.n.value, qs = [], used = new Set();
      const maxStart = list.length - len - (f.mode.value === 'recall' ? 1 : 0);
      for (let t = 0; qs.length < n && t < n * 20; t++) {
        const k = Math.max(0, Math.floor(Math.random() * (maxStart + 1)));
        if (used.has(k) && used.size <= maxStart) continue; used.add(k);
        const prompt = f.mode.value === 'recall' ? list[k] : null, ans = list.slice(f.mode.value === 'recall' ? k + 1 : k, (f.mode.value === 'recall' ? k + 1 : k) + len);
        qs.push({ prompt, ans });
      }
      qs.sort((a, b) => (a.ans[0][0] - b.ans[0][0]) || (a.ans[0][1] - b.ans[0][1]));
      await DB.setting('reciter', f.r.value);
      T.st = Object.assign(base, { qs });
      location.hash = '#/tasmee?q=' + Date.now();
    };
  }

  async function question(el) {
    const st = T.st, q = st.qs[st.i];
    const ref = (await Promise.all(q.ans.map(([s, a]) => ayahText(s, a)))).join(' ');
    const where = `سورة ${AR.SURAHS[q.ans[0][0] - 1]} ${AR.toArabicDigits(q.ans[0][1])}` + (q.ans.length > 1 ? '–' + AR.toArabicDigits(q.ans[q.ans.length - 1][1]) : '');
    let promptHtml = '';
    if (st.mode === 'recall') promptHtml = `<div class="muted">اقرأ ما بعد هذه الآية (${q.ans.length} ${q.ans.length > 1 ? 'آيات' : 'آية'}):</div><div class="quran-text">${esc(await ayahText(...q.prompt))} <span class="ayah-num">${AR.toArabicDigits(q.prompt[1])}</span></div><small class="muted">سورة ${esc(AR.SURAHS[q.prompt[0] - 1])}</small>`;
    else if (st.mode === 'start') { const w = ref.split(/\s+/), k = Math.min(4, Math.max(2, Math.floor(w.length / 4))); q.given = w.slice(0, k).join(' '); promptHtml = `<div class="muted">أكمل من هنا (${where}):</div><div class="quran-text">${esc(q.given)} …</div>`; }
    else promptHtml = `<div class="muted">استمع ثم اكتب ما سمعتَ (${q.ans.length} ${q.ans.length > 1 ? 'آيات' : 'آية'}):</div><button class="btn" id="tsHear">🔊 استمع</button>`;
    el.innerHTML = `<div class="row"><h1>📝 ${esc(st.scopeName)}</h1><span class="spacer"></span><span class="tag">السؤال ${AR.toArabicDigits(st.i + 1)} من ${AR.toArabicDigits(st.qs.length)}</span></div>
      <div class="progress"><div style="width:${100 * st.i / st.qs.length}%"></div></div>
      <div class="card" style="margin-top:10px">${promptHtml}</div>
      <div class="card">
        ${st.voice ? `<div class="row" style="gap:8px"><button class="btn primary" id="tsMic">🎙️ ابدأ التسميع</button><span id="tsMicSt" class="muted">اضغط وابدأ القراءة، وما تقوله يظهر هنا</span></div>` : ''}
        <textarea id="tsA" rows="5" style="width:100%;font-family:var(--quran,inherit);font-size:20px;margin-top:8px" placeholder="${st.voice ? 'سيظهر هنا ما تقرؤه، ويمكنك تعديله قبل التصحيح' : 'اكتب الآيات هنا (التشكيل غير مطلوب)'}"></textarea>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" id="tsDone">✔ انتهيت — صحّح لي</button><button class="btn" id="tsSkip">لا أذكرها — أظهر الجواب</button><button class="btn" id="tsQuit">إنهاء الاختبار</button></div>
      </div><div id="tsRes"></div>`;
    const $ = s => el.querySelector(s);
    if ($('#tsHear')) $('#tsHear').onclick = () => QA.play(q.ans, { reciter: st.r, rep: 1, noBasmala: true });
    if (st.mode === 'dict') QA.play(q.ans, { reciter: st.r, rep: 1, noBasmala: true });
    let recog = null, finalTxt = '';
    if ($('#tsMic')) $('#tsMic').onclick = () => {
      if (recog) { recog.stop(); return; }
      recog = new SR(); recog.lang = 'ar-SA'; recog.continuous = true; recog.interimResults = true;
      finalTxt = $('#tsA').value ? $('#tsA').value + ' ' : '';
      recog.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalTxt += t + ' '; else interim += t; } $('#tsA').value = finalTxt + interim; };
      recog.onerror = e => { $('#tsMicSt').textContent = e.error === 'not-allowed' ? 'اسمح للمتصفح باستعمال الميكروفون' : e.error === 'network' ? 'التعرف على الصوت يحتاج إنترنت' : 'تعذر: ' + e.error; };
      recog.onend = () => { recog = null; $('#tsMic').textContent = '🎙️ تابع التسميع'; $('#tsMic').classList.add('primary'); $('#tsMicSt').textContent = 'توقف الاستماع — اضغط «انتهيت» للتصحيح أو تابع'; };
      recog.start(); $('#tsMic').textContent = '⏹ إيقاف'; $('#tsMic').classList.remove('primary'); $('#tsMicSt').textContent = '… أستمع إليك';
    };
    const finish = async skipped => {
      if (recog) recog.stop();
      QA.stop();
      const ans = (st.mode === 'start' ? q.given + ' ' : '') + (skipped ? '' : $('#tsA').value);
      const d = diff(ref, ans);
      st.res.push({ ans: q.ans, where, pct: d.pct, skipped });
      $('#tsRes').innerHTML = `<div class="card"><div class="row"><h2 style="margin:0">${d.pct >= 90 ? '✅ ممتاز' : d.pct >= 70 ? '👍 جيد' : '⚠️ يحتاج مراجعة'} — ${d.pct}٪</h2><span class="spacer"></span><span class="muted">${esc(where)}</span></div>
        <div class="quran-text tasmee-diff" style="margin-top:8px">${diffHtml(d)}</div>
        <div class="muted" style="font-size:13px;margin-top:6px"><span class="tw-ok">صحيح</span> <span class="tw-near">صحيح باختلاف كتابة يسير</span> <span class="tw-miss">ناقص أو خطأ</span> <span class="tw-extra">زائد</span></div>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn" id="tsListen">🔊 اسمع الصواب</button>${d.pct < 90 ? '<button class="btn" id="tsHifz">🧠 أضفها لمراجعة الحفظ</button>' : ''}<span class="spacer"></span><button class="btn primary" id="tsNext">${st.i + 1 < st.qs.length ? 'السؤال التالي ←' : 'النتيجة النهائية'}</button></div></div>`;
      $('#tsDone').disabled = $('#tsSkip').disabled = true;
      $('#tsListen').onclick = () => QA.play(q.ans, { reciter: st.r, rep: 1, noBasmala: true });
      if ($('#tsHifz')) $('#tsHifz').onclick = async e => { for (const [s, a] of q.ans) { const id = `quran:${s}:${a}`; if (!await DB.get('srs', id)) await DB.put('srs', { id, ef: 2.5, interval: 0, reps: 0, due: new Date().toISOString(), added: new Date().toISOString() }); } await APP.refreshUser(); e.target.disabled = true; e.target.textContent = '✔ أضيفت'; };
      $('#tsNext').onclick = () => { QA.stop(); st.i++; location.hash = '#/tasmee?q=' + Date.now(); };
      $('#tsRes').scrollIntoView({ behavior: 'smooth' });
    };
    $('#tsDone').onclick = () => finish(false);
    $('#tsSkip').onclick = () => finish(true);
    $('#tsQuit').onclick = () => { if (recog) recog.stop(); QA.stop(); st.qs = st.qs.slice(0, st.i); location.hash = '#/tasmee?q=' + Date.now(); };
    $('#tsA').focus();
  }

  // ===== محاذاة طويلة آية آية (لتسميع مقطع كامل دون استهلاك ذاكرة كبيرة) =====
  function alignAyat(refAyat, ansText) {
    const A = words(ansText), out = [], per = [];
    let j = 0, gi = 0;
    for (const ay of refAyat) {
      const R = words(ay.text), win = A.slice(j, j + R.length * 2 + 8), n = R.length, m = win.length;
      const L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
      for (let i = n - 1; i >= 0; i--) for (let k = m - 1; k >= 0; k--) L[i][k] = sim(R[i].k, win[k].k) ? L[i + 1][k + 1] + 1 : Math.max(L[i + 1][k], L[i][k + 1]);
      const ops = []; let i = 0, k = 0, lastK = -1;
      while (i < n && k < m) {
        const s2 = sim(R[i].k, win[k].k);
        if (s2 && L[i][k] === L[i + 1][k + 1] + 1) { ops.push({ t: s2 === 2 ? 'ok' : 'near', w: R[i].w, u: win[k].w, gi: gi + i }); lastK = k; i++; k++; }
        else if (L[i + 1][k] >= L[i][k + 1]) { ops.push({ t: 'miss', w: R[i].w, gi: gi + i }); i++; }
        else { ops.push({ t: 'extra', u: win[k].w, ak: k }); k++; }
      }
      while (i < n) { ops.push({ t: 'miss', w: R[i].w, gi: gi + i }); i++; }
      // ما بعد آخر كلمة مطابقة يُترك للآية التالية
      const kept = ops.filter(o => o.t !== 'extra' || o.ak < lastK);
      out.push(...kept); per.push({ s: ay.s, a: ay.a, ops: kept, n });
      if (lastK >= 0) j += lastK + 1;
      gi += n;
    }
    A.slice(j).forEach(x => out.push({ t: 'extra', u: x.w }));
    return { out, per, total: gi };
  }

  async function fullTest(el) {
    const st = T.st, list = st.list;
    if (list.length > 400) { el.innerHTML = '<div class="warn">المقطع طويل جداً للتسميع دفعة واحدة — اختر جزءاً واحداً أو أقل.</div><a class="btn" href="#/tasmee?new=1">رجوع</a>'; return; }
    const ayat = await Promise.all(list.map(async ([s, a]) => ({ s, a, text: await ayahText(s, a) })));
    const flat = []; ayat.forEach(ay => words(ay.text).forEach(w => flat.push({ w: w.w, s: ay.s, a: ay.a })));
    st.hints = st.hints || new Set();
    el.innerHTML = `<div class="row"><h1>📝 تسميع: ${esc(st.scopeName)}</h1><span class="spacer"></span><span class="tag">${AR.toArabicDigits(list.length)} آية — ${AR.toArabicDigits(flat.length)} كلمة</span></div>
      <div class="card">
        <div class="muted">ابدأ من أول المقطع: ﴿${esc(flat.slice(0, 2).map(x => x.w).join(' '))} …﴾ ${esc(MUT ? MUT.label(list[0][0], list[0][1]) : '')}</div>
        ${st.voice ? `<div class="row" style="gap:8px;margin-top:8px"><button class="btn primary" id="tsMic">🎙️ ابدأ التسميع</button><span id="tsMicSt" class="muted">اقرأ من حفظك، وما تقوله يظهر هنا</span></div>` : ''}
        <textarea id="tsA" rows="8" style="width:100%;font-size:20px;margin-top:8px" placeholder="${st.voice ? 'سيظهر هنا ما تقرؤه' : 'اكتب المقطع من حفظك (التشكيل غير مطلوب)'}">${esc(st.draft || '')}</textarea>
        <div class="row" style="gap:8px;margin-top:8px">
          <button class="btn" id="hW">💡 أظهر الكلمة التالية</button><button class="btn" id="hA">💡 أظهر الآية التالية</button>
          <span class="spacer"></span><button class="btn primary" id="tsDone">✔ انتهيت — صحّح لي</button></div>
        <div id="hintBox"></div>
      </div><div id="tsRes"></div>`;
    const $ = s => el.querySelector(s);
    // أين وصل القارئ؟ أول كلمة بعد آخر كلمة صحيحة
    const nextIdx = () => { const r = alignAyat(ayat, $('#tsA').value); let last = -1; r.out.forEach(o => { if ((o.t === 'ok' || o.t === 'near') && o.gi > last) last = o.gi; }); return Math.min(last + 1, flat.length - 1); };
    const showHint = (from, to) => {
      for (let i = from; i <= to; i++) st.hints.add(i);
      const f = flat[from];
      $('#hintBox').innerHTML = `<div class="hint-box quran-text">💡 ${esc(flat.slice(from, to + 1).map(x => x.w).join(' '))}</div><div class="muted" style="font-size:13px">${esc(MUT.label(f.s, f.a))} — عدد المساعدات: ${AR.toArabicDigits(st.hints.size)} كلمة (تُحسب في النتيجة)</div>`;
    };
    $('#hW').onclick = () => { const i = nextIdx(); showHint(i, i); };
    $('#hA').onclick = () => { const i = nextIdx(), f = flat[i]; let e = i; while (e + 1 < flat.length && flat[e + 1].s === f.s && flat[e + 1].a === f.a) e++; showHint(i, e); };
    $('#tsA').oninput = () => { st.draft = $('#tsA').value; };
    // التعرف على الصوت: يُعاد تشغيله تلقائياً إن توقف المتصفح أثناء القراءة الطويلة
    let recog = null, listening = false, finalTxt = '';
    const startRec = () => {
      recog = new SR(); recog.lang = 'ar-SA'; recog.continuous = true; recog.interimResults = true;
      recog.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalTxt += t + ' '; else interim += t; } $('#tsA').value = finalTxt + interim; st.draft = $('#tsA').value; };
      recog.onerror = e => { if (e.error === 'not-allowed') { listening = false; $('#tsMicSt').textContent = 'اسمح للمتصفح باستعمال الميكروفون'; } else if (e.error === 'network') { listening = false; $('#tsMicSt').textContent = 'التعرف على الصوت يحتاج إنترنت'; } };
      recog.onend = () => { if (listening) { try { startRec(); } catch (e) { } } else { $('#tsMic').textContent = '🎙️ تابع التسميع'; $('#tsMicSt').textContent = 'توقف الاستماع'; } };
      recog.start();
    };
    if ($('#tsMic')) $('#tsMic').onclick = () => {
      if (listening) { listening = false; recog && recog.stop(); return; }
      listening = true; finalTxt = $('#tsA').value ? $('#tsA').value + ' ' : '';
      startRec(); $('#tsMic').textContent = '⏹ إيقاف'; $('#tsMicSt').textContent = '… أستمع إليك';
    };
    $('#tsDone').onclick = () => {
      listening = false; if (recog) recog.stop();
      const r = alignAyat(ayat, $('#tsA').value);
      const isOk = o => (o.t === 'ok' || o.t === 'near') && !st.hints.has(o.gi);
      const okN = r.out.filter(isOk).length, pct = r.total ? Math.round(100 * okN / r.total) : 0;
      st.res = r.per.map(p => { const good = p.ops.filter(isOk).length; return { ans: [[p.s, p.a]], where: MUT.label(p.s, p.a), pct: p.n ? Math.round(100 * good / p.n) : 0, ops: p.ops }; });
      st.total = pct; st.done = true; st.hintsN = st.hints.size;
      const html = r.out.map(o => st.hints.has(o.gi) ? `<span class="tw-hint" title="بمساعدة">${esc(o.w)}</span>`
        : o.t === 'ok' ? `<span class="tw-ok">${esc(o.w)}</span>` : o.t === 'near' ? `<span class="tw-near" title="كتبتَ: ${esc(o.u)}">${esc(o.w)}</span>`
        : o.t === 'miss' ? `<span class="tw-miss">${esc(o.w)}</span>` : `<span class="tw-extra">${esc(o.u)}</span>`).join(' ');
      const bad = st.res.filter(x => x.pct < 90);
      $('#tsRes').innerHTML = `<div class="card"><div class="row"><h2 style="margin:0">${pct >= 90 ? '✅ ممتاز' : pct >= 70 ? '👍 جيد' : '⚠️ يحتاج مراجعة'} — ${pct}٪</h2><span class="spacer"></span><span class="muted">مساعدات: ${AR.toArabicDigits(st.hints.size)} كلمة</span></div>
        <div class="quran-text tasmee-diff" style="margin-top:8px">${html}</div>
        <div class="muted" style="font-size:13px;margin-top:6px"><span class="tw-ok">صحيح</span> <span class="tw-near">باختلاف كتابة يسير</span> <span class="tw-miss">ناقص أو خطأ</span> <span class="tw-extra">زائد</span> <span class="tw-hint">بمساعدة</span></div></div>
        ${bad.length ? `<h2>الآيات التي أخطأت فيها (${AR.toArabicDigits(bad.length)})</h2><table class="t"><tr><th>الموضع</th><th>النتيجة</th><th></th></tr>${bad.map(b => `<tr><td>${esc(b.where)}</td><td>${b.pct}٪</td><td><button class="btn sm" data-mplay="${b.ans[0][0]}:${b.ans[0][1]}">🔊 اسمع</button> <a class="btn sm" href="#/item/quran:${b.ans[0][0]}:${b.ans[0][1]}">🔁 المتشابهات</a></td></tr>`).join('')}</table>
        <button class="btn" id="tsHifzAll" style="margin-top:8px">🧠 أضف هذه الآيات لمراجعة الحفظ</button>` : '<div class="info">✔ لا أخطاء تُذكر — بارك الله في حفظك.</div>'}
        <div class="row" style="gap:8px;margin-top:12px"><button class="btn" id="tsAgain">↻ أعد تسميع المقطع</button><a class="btn primary" href="#/tasmee?new=1">اختبار جديد</a></div>`;
      $('#tsDone').disabled = $('#hW').disabled = $('#hA').disabled = true;
      saveHist(st, pct);
      if ($('#tsHifzAll')) $('#tsHifzAll').onclick = async e => { for (const b of bad) { const id = `quran:${b.ans[0][0]}:${b.ans[0][1]}`; if (!await DB.get('srs', id)) await DB.put('srs', { id, ef: 2.5, interval: 0, reps: 0, due: new Date().toISOString(), added: new Date().toISOString() }); } await APP.refreshUser(); e.target.disabled = true; e.target.textContent = '✔ أضيفت'; };
      $('#tsAgain').onclick = () => { st.done = false; st.draft = ''; st.hints = new Set(); st.saved = false; APP.rerender(); };
      $('#tsRes').scrollIntoView({ behavior: 'smooth' });
    };
  }

  async function saveHist(st, pct) {
    if (st.saved) return; st.saved = true;
    const h = (await DB.setting('tasmee-history')) || [];
    h.push({ at: Date.now(), scope: st.scopeName, mode: { recall: 'من الحفظ', start: 'بداية الآية', dict: 'إملاء', full: 'تسميع المقطع', mutash: 'المتشابهات', surah: 'اسم السورة' }[st.mode], pct });
    await DB.setting('tasmee-history', h.slice(-200));
  }

  // ===== المتشابهات واسم السورة: اختيار من متعدد =====
  async function mcqTest(el) {
    const st = T.st, pool = st.list.slice().sort(() => Math.random() - .5), qs = [];
    el.innerHTML = '<div class="muted">جارٍ تجهيز الأسئلة…</div>';
    if (st.mode === 'surah') {
      for (const [s, a] of pool) {
        if (qs.length >= st.n) break;
        const t = await ayahText(s, a); if (t.split(/\s+/).length < 3) continue;
        // خيارات قريبة: سور مجاورة ومن نفس الجزء ليكون الاختيار مميِّزاً
        const near = [s - 2, s - 1, s + 1, s + 2, s + 3, s - 3].filter(x => x >= 1 && x <= 114 && x !== s).sort(() => Math.random() - .5).slice(0, 3);
        qs.push([`في أي سورة هذه الآية؟ ﴿${t.length > 160 ? t.slice(0, 160) + '…' : t}﴾`, [s, ...near].map(x => 'سورة ' + AR.SURAHS[x - 1]), 0, `سورة ${MUT.label(s, a)}`]);
      }
    } else {
      for (const [s, a] of pool) {
        if (qs.length >= st.n) break;
        const sims = (await MUT.similar(s, a)).filter(x => !x.same); if (!sims.length) continue;
        const { A } = await MUT.index(), me = A[s + ':' + a];
        // الجزء المشترك من أول الآية، ثم يُطلب إكمالها كما في هذه السورة
        let p = 0; while (p < me.k.length && sims.some(x => A[x.s + ':' + x.a].k[p] === me.k[p])) p++;
        p = Math.max(2, Math.min(p, me.k.length - 2));
        const cont = k => { const o = A[k]; return o.w.slice(p, p + 6).join(' '); };
        const right = cont(s + ':' + a), wrong = [...new Set(sims.map(x => cont(x.s + ':' + x.a)).filter(c => c && MUT.skel(c) !== MUT.skel(right)))].slice(0, 3);
        if (!wrong.length || !right) continue;
        qs.push([`أكمل كما في سورة ${AR.SURAHS[s - 1]} (الآية ${AR.toArabicDigits(a)}): ﴿${me.w.slice(0, p).join(' ')} …﴾`, [right + ' …', ...wrong.map(w => w + ' …')], 0,
          `الصواب في ${MUT.label(s, a)}. ونظائرها: ${sims.map(x => MUT.label(x.s, x.a)).join('، ')} — افتح صفحة الآية لترى الفروق وحكمتها.`]);
      }
    }
    if (!qs.length) { el.innerHTML = `<div class="info">${st.mode === 'mutash' ? 'لا توجد آيات متشابهة كافية في هذا النطاق — جرّب نطاقاً أوسع (جزءاً أو سورة طويلة).' : 'النطاق قصير جداً.'}</div><a class="btn" href="#/tasmee?new=1">رجوع</a>`; return; }
    el.innerHTML = `<div class="row"><h1>📝 ${st.mode === 'mutash' ? 'اختبار المتشابهات' : 'اذكر اسم السورة'}: ${esc(st.scopeName)}</h1><span class="spacer"></span><a class="btn" href="#/tasmee?new=1">اختبار جديد</a></div><div id="mq"></div>`;
    EXAMS.runQuiz(el.querySelector('#mq'), { qs, pass: 70, onDone: r => saveHist(st, r.pct) });
  }

  async function results(el) {
    const st = T.st, avg = st.res.length ? Math.round(st.res.reduce((s, r) => s + r.pct, 0) / st.res.length) : 0;
    if (st.res.length && !st.saved) {
      const h = (await DB.setting('tasmee-history')) || [];
      h.push({ at: Date.now(), scope: st.scopeName, mode: { recall: 'من الحفظ', start: 'بداية الآية', dict: 'إملاء', full: 'تسميع المقطع', mutash: 'المتشابهات', surah: 'اسم السورة' }[st.mode], pct: avg, n: st.res.length });
      await DB.setting('tasmee-history', h.slice(-200)); st.saved = true;
    }
    el.innerHTML = `<h1>نتيجة اختبار ${esc(st.scopeName)}</h1>
      <div class="card" style="text-align:center"><div style="font-size:48px;font-weight:700;color:${avg >= 90 ? 'var(--brand)' : avg >= 70 ? '#b45309' : 'var(--red)'}">${avg}٪</div>
      <div>${avg >= 90 ? 'ما شاء الله، حفظ متقن' : avg >= 70 ? 'حفظ جيد، راجع المواضع المعلَّمة' : 'تحتاج إلى مراجعة هذا المقدار قبل الانتقال'}</div></div>
      <table class="t"><tr><th>الموضع</th><th>النتيجة</th><th></th></tr>${st.res.map(r => `<tr><td>${esc(r.where)}</td><td>${r.skipped ? 'لم يُجب' : r.pct + '٪'}</td><td><a class="btn sm" href="#/quran/${r.ans[0][0]}?a=${r.ans[0][1]}">افتح في المصحف</a></td></tr>`).join('')}</table>
      <div class="row" style="gap:8px;margin-top:12px"><a class="btn primary" href="#/tasmee?new=1">اختبار جديد</a><a class="btn" href="#/hifz">🧠 مراجعة الحفظ</a></div>`;
  }

  window.TASMEE = { diff, skel, alignAyat, words };
})();
