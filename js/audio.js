/* سماع القرآن: قرّاء قدامى ومعاصرون، تشغيل آية آية، تكرار للحفظ، وتنزيل للاستماع بدون إنترنت */
(() => {
    const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const START = []; COUNTS.reduce((s, c, i) => (START[i] = s, s + c), 0);
  const globalNo = (s, a) => START[s - 1] + a;
  // بدايات الأجزاء الثلاثين [سورة، آية]
  const JUZ = [[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];
  // كل آيات الجزء n كقائمة [سورة، آية]
  function juzAyat(n) {
    const [s0, a0] = JUZ[n - 1], [s1, a1] = n < 30 ? JUZ[n] : [115, 1], out = [];
    for (let s = s0; s <= Math.min(s1, 114); s++) for (let a = (s === s0 ? a0 : 1); a <= COUNTS[s - 1]; a++) { if (s === s1 && a >= a1) break; out.push([s, a]); }
    return out;
  }
  const surahAyat = s => Array.from({ length: COUNTS[s - 1] }, (_, i) => [s, i + 1]);
  const juzOf = (s, a) => { let j = 1; JUZ.forEach(([js, ja], i) => { if (s > js || (s === js && a >= ja)) j = i + 1; }); return j; };

  // ===== القرّاء =====
  // لكل قارئ أكثر من مصدر: يُجرَّب الأول، فإن تعذر انتقل البرنامج للتالي وتذكّره
  const EA = f => ({ k: 'ea', f }), IN = (e, b) => ({ k: 'in', e, b });
  const RECITERS = [
    { id: 'husary', n: 'محمود خليل الحصري', d: 'مرتّل — أنسب تلاوة للحفظ', era: 'old', src: [EA('Husary_64kbps'), IN('ar.husary', 64), IN('ar.husary', 128)] },
    { id: 'husary-muallim', n: 'الحصري (المصحف المعلّم)', d: 'بطيء بتكرار — للتعليم والتلقين', era: 'old', src: [EA('Husary_Muallim_128kbps')] },
    { id: 'minshawi', n: 'محمد صديق المنشاوي', d: 'مرتّل', era: 'old', src: [EA('Minshawy_Murattal_128kbps'), IN('ar.minshawi', 128)] },
    { id: 'minshawi-mj', n: 'المنشاوي', d: 'مجوّد', era: 'old', src: [IN('ar.minshawimujawwad', 64), EA('Minshawy_Mujawwad_192kbps')] },
    { id: 'abdulbasit', n: 'عبد الباسط عبد الصمد', d: 'مرتّل', era: 'old', src: [EA('Abdul_Basit_Murattal_64kbps'), IN('ar.abdulbasitmurattal', 64), IN('ar.abdulbasit', 192)] },
    { id: 'abdulbasit-mj', n: 'عبد الباسط عبد الصمد', d: 'مجوّد', era: 'old', src: [EA('Abdul_Basit_Mujawwad_128kbps'), IN('ar.abdulbasitmujawwad', 192)] },
    { id: 'mustafa-ismail', n: 'مصطفى إسماعيل', d: 'مرتّل', era: 'old', src: [EA('Mustafa_Ismail_48kbps')] },
    { id: 'tablawi', n: 'محمد محمود الطبلاوي', d: 'مرتّل', era: 'old', src: [EA('Mohammad_al_Tablaway_128kbps')] },
    { id: 'alafasy', n: 'مشاري راشد العفاسي', d: 'مرتّل', era: 'new', src: [IN('ar.alafasy', 64), EA('Alafasy_64kbps'), EA('Alafasy_128kbps')] },
    { id: 'sudais', n: 'عبد الرحمن السديس', d: 'إمام الحرم المكي', era: 'new', src: [IN('ar.abdurrahmaansudais', 64), EA('Abdurrahmaan_As-Sudais_192kbps'), IN('ar.sudais', 192)] },
    { id: 'shuraim', n: 'سعود الشريم', d: 'إمام الحرم المكي', era: 'new', src: [IN('ar.saoodshuraym', 64), EA('Saood_ash-Shuraym_128kbps'), IN('ar.shuraim', 128)] },
    { id: 'maher', n: 'ماهر المعيقلي', d: 'إمام الحرم المكي', era: 'new', src: [IN('ar.mahermuaiqly', 64), EA('MaherAlMuaiqly128kbps')] },
    { id: 'dosari', n: 'ياسر الدوسري', d: 'إمام الحرم المكي', era: 'new', src: [EA('Yasser_Ad-Dussary_128kbps')] },
    { id: 'hudhaify', n: 'علي الحذيفي', d: 'إمام الحرم النبوي', era: 'new', src: [IN('ar.hudhaify', 64), EA('Hudhaify_64kbps')] },
    { id: 'ayyoub', n: 'محمد أيوب', d: 'إمام الحرم النبوي سابقاً', era: 'new', src: [IN('ar.muhammadayyoub', 128), EA('Muhammad_Ayyoub_64kbps')] },
    { id: 'shaatree', n: 'أبو بكر الشاطري', d: 'مرتّل', era: 'new', src: [EA('Abu_Bakr_Ash-Shaatree_128kbps'), IN('ar.shaatree', 64)] },
    { id: 'rifai', n: 'هاني الرفاعي', d: 'مرتّل', era: 'new', src: [IN('ar.hanirifai', 64), EA('Hani_Rifai_192kbps')] },
    { id: 'ghamdi', n: 'سعد الغامدي', d: 'مرتّل', era: 'new', src: [EA('Ghamadi_40kbps')] },
    { id: 'ajamy', n: 'أحمد العجمي', d: 'مرتّل', era: 'new', src: [IN('ar.ahmedajamy', 64)] },
    { id: 'qatami', n: 'ناصر القطامي', d: 'مرتّل', era: 'new', src: [EA('Nasser_Alqatami_128kbps')] },
  ];
  const pad3 = n => String(n).padStart(3, '0');
  const srcUrl = (src, s, a) => src.k === 'ea' ? `https://everyayah.com/data/${src.f}/${pad3(s)}${pad3(a)}.mp3` : `https://cdn.islamic.network/quran/audio/${src.b}/${src.e}/${globalNo(s, a)}.mp3`;
  const rec = id => RECITERS.find(r => r.id === id) || RECITERS[0];
  const goodSrc = {}; try { Object.assign(goodSrc, JSON.parse(localStorage.getItem('qa-src') || '{}')); } catch (e) { }
  const remember = (r, i) => { goodSrc[r] = i; try { localStorage.setItem('qa-src', JSON.stringify(goodSrc)); } catch (e) { } };
  const order = r => { const R = rec(r), g = goodSrc[r] || 0; return [g, ...R.src.map((_, i) => i).filter(i => i !== g)].filter(i => i < R.src.length); };

  // ===== التخزين بدون إنترنت (قاعدة مستقلة) =====
  let dbp;
  const adb = () => dbp || (dbp = new Promise((res, rej) => { const q = indexedDB.open('maktaba-audio', 1); q.onupgradeneeded = () => q.result.createObjectStore('files'); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  const tx = async (mode, fn) => { const d = await adb(); return new Promise((res, rej) => { const t = d.transaction('files', mode), st = t.objectStore('files'); const r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
  const key = (r, s, a) => `${r}/${pad3(s)}${pad3(a)}`;
  const getBlob = (r, s, a) => tx('readonly', st => st.get(key(r, s, a)));
  const putBlob = (k, b) => tx('readwrite', st => st.put(b, k));
  const allKeys = () => tx('readonly', st => st.getAllKeys());
  async function stored(r, list) { const ks = new Set((await allKeys()).filter(k => k.startsWith(r + '/'))); return list ? list.filter(([s, a]) => ks.has(key(r, s, a))).length : ks.size; }
  async function removeReciter(r) { const ks = (await allKeys()).filter(k => k.startsWith(r + '/')); await tx('readwrite', st => { ks.forEach(k => st.delete(k)); }); return ks.length; }

  async function fetchBlob(url) {
    if (window.desktop && window.desktop.fetchBin) { const u8 = await window.desktop.fetchBin(url); return new Blob([u8], { type: 'audio/mpeg' }); }
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const b = await res.blob(); if (b.size < 500) throw new Error('ملف فارغ'); return b;
  }
  async function downloadOne(r, s, a) {
    if (await getBlob(r, s, a)) return true;
    let last;
    for (const i of order(r)) {
      try { const b = await fetchBlob(srcUrl(rec(r).src[i], s, a)); await putBlob(key(r, s, a), b); remember(r, i); return true; } catch (e) { last = e; }
    }
    throw last || new Error('تعذر التنزيل');
  }
  let cancelDl = false;
  async function download(r, list, onProg) {
    cancelDl = false; let done = 0, fail = 0, i = 0;
    const worker = async () => { while (i < list.length && !cancelDl) { const [s, a] = list[i++]; try { await downloadOne(r, s, a); } catch (e) { fail++; } done++; onProg && onProg(done, list.length, fail); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return { done, fail, cancelled: cancelDl };
  }

  // ===== المشغّل =====
  const P = { q: [], i: 0, r: null, rep: 1, repLeft: 1, url: null, playing: false, onEnd: null };
  const audio = new Audio(); audio.preload = 'auto';
  let tryIdx = 0, tryList = [];
  async function loadCur() {
    const [s, a, isBasmala] = P.q[P.i];
    if (P.url) { URL.revokeObjectURL(P.url); P.url = null; }
    const b = await getBlob(P.r, s, a);
    if (b) { P.url = URL.createObjectURL(b); audio.src = P.url; tryList = []; }
    else { tryList = order(P.r); tryIdx = 0; audio.src = srcUrl(rec(P.r).src[tryList[0]], s, a); }
    highlight(isBasmala ? null : [s, a]); bar();
  }
  audio.onerror = () => {
    if (tryList.length && ++tryIdx < tryList.length) { const [s, a] = P.q[P.i]; audio.src = srcUrl(rec(P.r).src[tryList[tryIdx]], s, a); audio.play().catch(() => { }); return; }
    P.playing = false; bar(); APP.toast('تعذر تشغيل الصوت — تحقق من الإنترنت أو نزّل السورة للاستماع بدون إنترنت', 5000);
  };
  audio.onplaying = () => { if (tryList.length) remember(P.r, tryList[tryIdx]); };
  audio.onended = async () => {
    if (--P.repLeft > 0 && !P.q[P.i][2]) { audio.currentTime = 0; audio.play(); return; }
    if (P.i + 1 < P.q.length) { P.i++; P.repLeft = P.rep; await loadCur(); audio.play().catch(() => { }); }
    else { P.playing = false; bar(); highlight(null); const f = P.onEnd; P.onEnd = null; f && f(); }
  };
  // تشغيل قائمة آيات؛ تُسبق السورة بالبسملة إن بدأت من أولها (عدا الفاتحة والتوبة)
  async function play(list, opts = {}) {
    P.r = opts.reciter || P.r || (await DB.setting('reciter')) || 'husary';
    P.rep = opts.rep || P.rep || 1; P.repLeft = P.rep; P.onEnd = opts.onEnd || null;
    P.q = []; list.forEach(([s, a]) => { if (a === 1 && s !== 1 && s !== 9 && !opts.noBasmala) P.q.push([1, 1, true]); P.q.push([s, a]); });
    P.i = 0; P.playing = true; await loadCur();
    try { await audio.play(); } catch (e) { }
    bar();
  }
  const stop = () => { audio.pause(); P.playing = false; P.onEnd = null; highlight(null); bar(); };
  const toggle = () => { if (!P.q.length) return; if (audio.paused) { audio.play(); P.playing = true; } else { audio.pause(); P.playing = false; } bar(); };
  const step = async d => { const j = P.i + d; if (j < 0 || j >= P.q.length) return; P.i = j; P.repLeft = P.rep; await loadCur(); audio.play().catch(() => { }); };

  function highlight(sa) {
    document.querySelectorAll('.ayah-playing').forEach(e => e.classList.remove('ayah-playing'));
    if (!sa) return;
    const c = document.querySelector(`[data-card="quran:${sa[0]}:${sa[1]}"]`);
    if (c) { c.classList.add('ayah-playing'); if (P.follow !== false) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }
  function bar() {
    let b = document.getElementById('qaBar');
    if (!P.q.length) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'qaBar'; b.className = 'qa-bar'; document.body.appendChild(b); }
    const [s, a, bs] = P.q[P.i] || [];
    b.innerHTML = `<button class="btn sm" data-a="prev" title="السابقة">⏮</button>
      <button class="btn sm primary" data-a="tog">${P.playing && !audio.paused ? '⏸' : '▶'}</button>
      <button class="btn sm" data-a="next" title="التالية">⏭</button>
      <span class="qa-now">🔊 ${esc(rec(P.r).n)} — ${bs ? 'البسملة' : 'سورة ' + esc(AR.SURAHS[s - 1]) + ' ' + AR.toArabicDigits(a)}</span>
      <label class="muted">تكرار <select data-a="rep">${[1, 2, 3, 5, 7, 10].map(n => `<option ${n === P.rep ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="btn sm" data-a="x" title="إيقاف">✕</button>`;
    b.querySelector('[data-a=prev]').onclick = () => step(-1);
    b.querySelector('[data-a=next]').onclick = () => step(1);
    b.querySelector('[data-a=tog]').onclick = toggle;
    b.querySelector('[data-a=x]').onclick = () => { stop(); P.q = []; bar(); };
    b.querySelector('[data-a=rep]').onchange = e => { P.rep = P.repLeft = +e.target.value; };
  }

  const reciterSelect = (cur, attrs = '') => `<select ${attrs}>${[['old', 'القرّاء القدامى'], ['new', 'القرّاء المعاصرون']].map(([e, l]) => `<optgroup label="${l}">${RECITERS.filter(r => r.era === e).map(r => `<option value="${r.id}" ${r.id === cur ? 'selected' : ''}>${esc(r.n)} — ${esc(r.d)}</option>`).join('')}</optgroup>`).join('')}</select>`;

  // ===== شاشة الاستماع =====
  V.listen = async (el, _, p) => {
    const cur = (await DB.setting('reciter')) || 'husary';
    const scope = p.juz ? 'juz' : 'surah';
    el.innerHTML = `<h1>🎧 الاستماع إلى القرآن</h1>
      <div class="sub">اختر القارئ والسورة أو الجزء. التشغيل آية آية مع إبراز الآية الجارية، ويمكنك تكرار كل آية للحفظ. نزّل ما تريد ليعمل بدون إنترنت.</div>
      <div class="card"><div class="filters" style="flex-wrap:wrap">
        <label>القارئ ${reciterSelect(cur, 'id="lsR"')}</label>
        <label>النطاق <select id="lsScope"><option value="surah">سورة</option><option value="juz" ${scope === 'juz' ? 'selected' : ''}>جزء</option></select></label>
        <select id="lsS">${AR.SURAHS.map((n, i) => `<option value="${i + 1}" ${+p.s === i + 1 ? 'selected' : ''}>${AR.toArabicDigits(i + 1)}. ${esc(n)}</option>`).join('')}</select>
        <select id="lsJ" style="display:none">${JUZ.map((_, i) => `<option value="${i + 1}" ${+p.juz === i + 1 ? 'selected' : ''}>الجزء ${AR.toArabicDigits(i + 1)}</option>`).join('')}</select>
        <label>تكرار الآية <select id="lsRep">${[1, 2, 3, 5, 7, 10].map(n => `<option>${n}</option>`).join('')}</select></label>
      </div>
      <div class="row" style="gap:8px;margin-top:8px">
        <button class="btn primary" id="lsPlay">▶ استمع</button>
        <button class="btn" id="lsOpen">📖 افتح المصحف مع الصوت</button>
        <button class="btn" id="lsDl">⬇ نزّل للاستماع بدون إنترنت</button>
        <span id="lsInfo" class="muted"></span>
      </div></div>
      <h2>📦 المنزَّل على جهازك</h2><div id="lsStore" class="muted">جارٍ الحساب…</div>
      <div class="info" style="margin-top:14px">💡 للتحميل الكامل للمصحف بصوت قارئ واحد: اختر «جزء» ونزّل الأجزاء واحداً بعد الآخر (الجزء نحو 10–25 ميجا حسب القارئ). المصادر: everyayah.com وcdn.islamic.network.</div>`;
    const $ = s => el.querySelector(s);
    const list = () => $('#lsScope').value === 'juz' ? juzAyat(+$('#lsJ').value) : surahAyat(+$('#lsS').value);
    const showScope = () => { const j = $('#lsScope').value === 'juz'; $('#lsJ').style.display = j ? '' : 'none'; $('#lsS').style.display = j ? 'none' : ''; info(); };
    const info = async () => { const L = list(), n = await stored($('#lsR').value, L); $('#lsInfo').textContent = `${L.length} آية — منزَّل منها ${n}` + (n === L.length ? ' ✔ تعمل بدون إنترنت' : ''); };
    const store = async () => {
      const ks = await allKeys(), by = {}; ks.forEach(k => { const r = k.split('/')[0]; by[r] = (by[r] || 0) + 1; });
      $('#lsStore').innerHTML = Object.keys(by).length ? `<table class="t"><tr><th>القارئ</th><th>آيات منزّلة</th><th></th></tr>${Object.entries(by).map(([r, n]) => `<tr><td>${esc(rec(r).n)} <small class="muted">${esc(rec(r).d)}</small></td><td>${n} من 6236 (${Math.round(n / 62.36)}٪)</td><td><button class="btn sm" data-del="${r}">حذف</button></td></tr>`).join('')}</table>` : 'لا شيء بعد.';
      $('#lsStore').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (!await APP.ask('حذف تلاوات «' + rec(b.dataset.del).n + '» من الجهاز؟')) return; await removeReciter(b.dataset.del); store(); info(); });
    };
    $('#lsScope').onchange = showScope; $('#lsS').onchange = info; $('#lsJ').onchange = info;
    $('#lsR').onchange = async e => { await DB.setting('reciter', e.target.value); P.r = e.target.value; info(); };
    $('#lsPlay').onclick = () => play(list(), { reciter: $('#lsR').value, rep: +$('#lsRep').value });
    $('#lsOpen').onclick = () => { const [s, a] = list()[0]; P.pending = { list: list(), reciter: $('#lsR').value, rep: +$('#lsRep').value }; location.hash = '#/quran/' + s + (a > 1 ? '?a=' + a : ''); };
    $('#lsDl').onclick = async e => {
      const btn = e.target;
      if (btn.dataset.busy) { cancelDl = true; return; }
      btn.dataset.busy = 1; btn.textContent = '⏹ إيقاف التنزيل';
      const r = await download($('#lsR').value, list(), (d, n, f) => { $('#lsInfo').textContent = `جارٍ التنزيل ${d} من ${n}` + (f ? ` (تعذر ${f})` : ''); });
      delete btn.dataset.busy; btn.textContent = '⬇ نزّل للاستماع بدون إنترنت';
      APP.toast(r.cancelled ? 'أُوقف التنزيل' : r.fail ? `تم مع تعذر ${r.fail} آية — أعد المحاولة لإكمالها` : '✔ تم التنزيل، تعمل الآن بدون إنترنت', 5000);
      info(); store();
    };
    showScope(); store();
  };

  window.QA = { RECITERS, JUZ, COUNTS, juzAyat, surahAyat, juzOf, play, stop, P, reciterSelect, stored, download, rec };
})();
