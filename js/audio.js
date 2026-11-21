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
    // تلاوة صاحب التطبيق (مُجاز برواية حفص): آيةً آية من تسجيلاته على الجهاز، أو المرفوعة على الموقع بعد التصدير
    { id: 'myvoice', n: 'الشيخ جمال السيد', d: 'رواية حفص — آيةً آية', era: 'mine', mine: true, src: [] },
    // قرّاء تلاواتهم متاحة بالسورة كاملة (لا آية آية): للاستماع فقط، بلا تتبّع الآيات ولا تكرار الآية
    { id: 'islam-sobhi', n: 'إسلام صبحي', d: 'مرتّل — بالسورة كاملة', era: 'full', full: true, base: 'https://cdn.mp3quran.net/download/audio/islam-sobhi/r1/', miss: [37, 39, 40, 45, 65] },
    { id: 'mosaad', n: 'عبد الرحمن مسعد', d: 'سور مختارة — بالسورة كاملة', era: 'full', full: true, base: 'https://archive.org/download/010_20221110/', only: [10, 19, 23, 29, 32, 49, 73, 78, 87, 88, 100, 107] },
  ];
  // سور القارئ المتاحة (لقرّاء السورة الكاملة)
  const surahsOf = r => { const R = rec(r); if (!R.full) return Array.from({ length: 114 }, (_, i) => i + 1); return R.only ? R.only.slice() : Array.from({ length: 114 }, (_, i) => i + 1).filter(x => !(R.miss || []).includes(x)); };
  const fullUrl = (r, s) => rec(r).base + String(s).padStart(3, '0') + '.mp3';
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
  const skey = (r, s) => `${r}/S${pad3(s)}`;
  const getSurahBlob = (r, s) => tx('readonly', st => st.get(skey(r, s)));
  async function storedSurahs(r, list) { const ks = new Set((await allKeys()).filter(k => k.startsWith(r + '/S'))); return (list || surahsOf(r)).filter(s => ks.has(skey(r, s))).length; }
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
  async function downloadSurah(r, s) {
    if (await getSurahBlob(r, s)) return true;
    const b = await fetchBlob(fullUrl(r, s)); await putBlob(skey(r, s), b); return true;
  }
  let cancelDl = false;
  async function downloadFull(r, surahs, onProg) {
    cancelDl = false; let done = 0, fail = 0, i = 0;
    const worker = async () => { while (i < surahs.length && !cancelDl) { const s = surahs[i++]; try { await downloadSurah(r, s); } catch (e) { fail++; } done++; onProg && onProg(done, surahs.length, fail); } };
    await Promise.all([worker(), worker()]);
    return { done, fail, cancelled: cancelDl };
  }
  async function download(r, list, onProg) {
    cancelDl = false; let done = 0, fail = 0, i = 0;
    const worker = async () => { while (i < list.length && !cancelDl) { const [s, a] = list[i++]; try { await downloadOne(r, s, a); } catch (e) { fail++; } done++; onProg && onProg(done, list.length, fail); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
    return { done, fail, cancelled: cancelDl };
  }

  // ===== المشغّل: مشغّلان متناوبان — تُحمَّل الآية التالية مسبقاً فتبدأ فور انتهاء الحالية بلا فاصل =====
  const P = { q: [], i: 0, r: null, rep: 1, repLeft: 1, playing: false, onEnd: null };
  const A = [new Audio(), new Audio()]; A.forEach(x => { x.preload = 'auto'; });
  let cur = 0;
  const audio = () => A[cur];
  const blobUrls = [null, null];
  const keyOf = i => P.q[i] ? P.r + '/' + P.q[i][0] + ':' + P.q[i][1] + '#' + i : '';
  const silent = x => (x.src || '').startsWith('data:');
  let tryIdx = 0, tryList = [];
  async function srcFor(i) {
    const [s, a] = P.q[i];
    if (rec(P.r).mine) {
      const own = window.LIBVOICE && LIBVOICE.blob ? await LIBVOICE.blob('quran:' + s + ':' + a) : null;
      if (own) return { url: URL.createObjectURL(own), blob: true, tries: [] };
      const f = (window.MY_QURAN || {})[pad3(s) + pad3(a)];
      if (f) return { url: 'audio/quran-voice/' + f, blob: false, tries: [] };
      if (!P.warned) { P.warned = 1; APP.toast((APP.state && APP.state.reviewerUnlocked ? 'بعض الآيات لم تُسجَّل بصوتك بعد' : 'بعض الآيات لم تُسجَّل بعد بصوت الشيخ جمال السيد') + ' — تُسمع بصوت الحصري', 4000); }
      const t = order('husary'); return { url: srcUrl(rec('husary').src[t[0]], s, a), blob: false, tries: [] };
    }
    const b = await getBlob(P.r, s, a);
    if (b) return { url: URL.createObjectURL(b), blob: true, tries: [] };
    const t = order(P.r); return { url: srcUrl(rec(P.r).src[t[0]], s, a), blob: false, tries: t };
  }
  function setSrc(k, src, i) {
    if (blobUrls[k]) { URL.revokeObjectURL(blobUrls[k]); blobUrls[k] = null; }
    if (src.blob) blobUrls[k] = src.url;
    A[k].src = src.url; A[k]._key = keyOf(i); A[k]._tries = src.tries; A[k]._try = 0;
  }
  async function preload() {
    const j = P.i + 1, k = 1 - cur;
    if (j >= P.q.length || A[k]._key === keyOf(j)) return;
    const src = await srcFor(j);
    if (P.stopped || P.i + 1 !== j) { if (src.blob) URL.revokeObjectURL(src.url); return; }
    setSrc(k, src, j); try { A[k].load(); } catch (e) { }
  }
  async function loadCur() {
    const k = 1 - cur;
    if (A[k]._key === keyOf(P.i) && A[k].src) { A[cur].pause(); cur = k; }   // التالية جاهزة مسبقاً
    else { const src = await srcFor(P.i); if (P.stopped) return; setSrc(cur, src, P.i); }
    tryList = audio()._tries || []; tryIdx = 0;
    const [s, a, isBasmala] = P.q[P.i];
    highlight(isBasmala ? null : [s, a]); bar(); mediaInfo();
  }
  function finish() { P.playing = false; bar(); highlight(null); keep(false); const f = P.onEnd; P.onEnd = null; f && f(); }
  async function advance() { await loadCur(); if (P.stopped) return; audio().play().catch(() => { }); }
  A.forEach(x => {
    x.onerror = () => {
      if (x !== audio()) { x._key = ''; return; } // فشل التحميل المسبق: يُعاد عند الحاجة
      if (P.stopped || !P.q.length || silent(x)) return;
      if (tryList.length && ++tryIdx < tryList.length) { const [s, a] = P.q[P.i]; x.src = srcUrl(rec(P.r).src[tryList[tryIdx]], s, a); x.play().catch(() => { }); return; }
      P.playing = false; bar(); APP.toast('تعذر تشغيل الصوت — تحقق من الإنترنت أو نزّل السورة للاستماع بدون إنترنت', 5000);
    };
    x.onplaying = () => { if (x !== audio() || silent(x)) return; if (tryList.length) remember(P.r, tryList[tryIdx]); preload(); };
    x.onplay = () => { if (x === audio() && !silent(x)) { P.playing = true; bar(); notif(); } };
    x.onpause = () => { if (x === audio() && !silent(x)) { P.playing = false; bar(); notif(); } };
    x.onended = () => {
      if (x !== audio() || P.stopped || !P.q.length || silent(x)) return;
      if (--P.repLeft > 0 && !P.q[P.i][2]) { x.currentTime = 0; x.play().catch(() => { }); return; }
      if (P.i + 1 < P.q.length) { P.i++; P.repLeft = P.rep; advance(); } else finish();
    };
  });
  // ملف صامت قصير: يُشغَّل فوراً عند اللمس ليسمح آيفون بالتشغيل بعد ذلك
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  function unlock() { if (P.unlocked) return; P.unlocked = true; A.forEach(x => { try { x.src = SILENT; const p = x.play(); if (p) p.catch(() => { }); } catch (e) { } }); }
  // التشغيل في الخلفية (تطبيق أندرويد) وأزرار شاشة القفل
  const nowText = () => P.q[P.i] && !P.q[P.i][2] ? 'سورة ' + AR.SURAHS[P.q[P.i][0] - 1] + ' — الآية ' + AR.toArabicDigits(P.q[P.i][1]) : 'البسملة';
  function keep(on) { if (window.KEEPALIVE) on ? KEEPALIVE.start('🎧 ' + rec(P.r).n, nowText()) : KEEPALIVE.stop(); }
  function notif() { if (window.KEEPALIVE && P.q.length) KEEPALIVE.update({ title: '🎧 ' + rec(P.r).n, text: nowText(), playing: !audio().paused }); }
  function mediaInfo() { notif(); }
  // تشغيل قائمة آيات؛ تُسبق السورة بالبسملة إن بدأت من أولها (عدا الفاتحة والتوبة)
  async function play(list, opts = {}) {
    unlock(); // يجب أن يسبق أي await
    let r = opts.reciter || (await DB.setting('reciter')) || P.r || 'husary';
    if (rec(r).full) {
      // قارئ بالسورة كاملة: يصلح للاستماع إلى سورة من أولها، لا لآيات متفرقة ولا للتكرار والتسميع
      const whole = list.length && list[0][1] === 1 && !opts.onEnd && !(opts.rep > 1);
      if (whole) { const ss = [...new Set(list.map(x => x[0]))]; return playFull(r, ss); }
      APP.toast('«' + rec(r).n + '» متاح بالسورة كاملة فقط — نسمعك هذه الآيات بصوت الحصري', 4500);
      r = 'husary';
    }
    if (window.MEDIA) MEDIA.claim('quran');
    P.r = r; P.warned = 0;
    P.rep = opts.rep || P.rep || 1; P.repLeft = P.rep; P.onEnd = opts.onEnd || null;
    P.q = []; list.forEach(([s, a]) => { if (a === 1 && s !== 1 && s !== 9 && !opts.noBasmala) P.q.push([1, 1, true]); P.q.push([s, a]); });
    A.forEach(x => { x._key = ''; });
    P.i = 0; P.playing = true; P.stopped = false; await loadCur();
    if (P.stopped) return;
    try { await audio().play(); } catch (e) { P.playing = false; }
    keep(true); bar();
  }
  const stop = () => {
    P.stopped = true;
    A.forEach((x, k) => { x.pause(); try { x.removeAttribute('src'); x.load(); } catch (e) { } x._key = ''; if (blobUrls[k]) { URL.revokeObjectURL(blobUrls[k]); blobUrls[k] = null; } });
    P.playing = false; P.onEnd = null; P.unlocked = false; highlight(null); keep(false); bar();
  };
  const toggle = () => { if (!P.q.length) return; const x = audio(); if (x.paused) { const p = x.play(); if (p) p.catch(() => { }); P.playing = true; keep(true); } else { x.pause(); P.playing = false; } bar(); };
  const jump = async j => { if (j < 0 || j >= P.q.length) return; audio().pause(); P.i = j; P.repLeft = P.rep; P.stopped = false; await loadCur(); audio().play().catch(() => { }); keep(true); };
  // تغيير القارئ أثناء التشغيل: يكمل من نفس الآية بصوت القارئ الجديد
  async function switchReciter(r) {
    await DB.setting('reciter', r);
    if (rec(r).full) { const s0 = (P.q[P.i] || [1])[0], ss = [...new Set(P.q.filter(x => !x[2]).map(x => x[0]))].filter(x => x >= s0); P.q = []; stop(); return playFull(r, ss.length ? ss : [s0]); }
    P.r = r; A.forEach(x => { x._key = ''; }); await jump(P.i);
  }
  const step = async d => { const j = P.i + d; if (j < 0 || j >= P.q.length) return; audio().pause(); P.i = j; P.repLeft = P.rep; P.stopped = false; await loadCur(); audio().play().catch(() => { }); };
  if (window.MEDIA) { MEDIA.register('quran', () => { if (P.q.length) { P.q = []; stop(); } }); MEDIA.controls('quran', { toggle: () => toggle(), next: () => step(1), prev: () => step(-1), stop: () => { P.q = []; stop(); } }); }

  // ===== تلاوة السورة كاملة (قرّاء بلا ملفات آيات) عبر المشغّل الطويل =====
  async function playFull(r, surahs, start) {
    const have = new Set(surahsOf(r)), ss = surahs.filter(x => have.has(x));
    if (!ss.length) { APP.toast('هذه السورة غير متاحة بصوت «' + rec(r).n + '» — اختر قارئاً آخر', 5000); return; }
    if (ss.length < surahs.length) APP.toast('بعض السور غير متاحة بصوت هذا القارئ فتُتخطّى', 3500);
    return LP.play(ss.map(s => ({ title: 'سورة ' + AR.SURAHS[s - 1], sub: rec(r).n, s, src: async () => { const b = await getSurahBlob(r, s); return b ? URL.createObjectURL(b) : fullUrl(r, s); } })), {
      name: 'quran-full', icon: '🎧', start: start || 0,
      extra: () => reciterSelect(r, 'data-a="rc" class="qa-rc" title="القارئ"'),
      bind: b => { const sel = b.querySelector('[data-a=rc]'); if (sel) sel.onchange = async e => { const nr = e.target.value, s0 = (LP.P.q[LP.P.i] || {}).s || ss[0], rest = ss.filter(x => x >= s0); await DB.setting('reciter', nr); if (rec(nr).full) playFull(nr, rest); else { LP.stop(); play(rest.flatMap(surahAyat), { reciter: nr }); } }; },
    });
  }

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
      <button class="btn sm primary" data-a="tog">${P.playing && !audio().paused ? '⏸' : '▶'}</button>
      <button class="btn sm" data-a="next" title="التالية">⏭</button>
      <span class="qa-now">🔊 ${bs ? 'البسملة' : 'سورة ' + esc(AR.SURAHS[s - 1]) + ' ' + AR.toArabicDigits(a)}</span>
      ${reciterSelect(P.r, 'data-a="rc" class="qa-rc" title="القارئ"')}
      <label class="muted">تكرار <select data-a="rep">${[1, 2, 3, 5, 7, 10].map(n => `<option ${n === P.rep ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="btn sm" data-a="x" title="إيقاف">✕</button>
      ${P.q.length > 2 ? `<div class="lp-row"><input type="range" class="lp-pos" data-a="pos" min="0" max="${P.q.length - 1}" value="${P.i}" style="--p:${(100 * P.i / (P.q.length - 1)).toFixed(1)}%"><span class="lp-time muted">${AR.toArabicDigits(P.i + 1)} / ${AR.toArabicDigits(P.q.length)}</span></div>` : ''}`;
    b.querySelector('[data-a=prev]').onclick = () => step(-1);
    b.querySelector('[data-a=next]').onclick = () => step(1);
    b.querySelector('[data-a=tog]').onclick = toggle;
    b.querySelector('[data-a=x]').onclick = () => { P.q = []; stop(); };
    b.querySelector('[data-a=rep]').onchange = e => { P.rep = P.repLeft = +e.target.value; };
    b.querySelector('[data-a=rc]').onchange = e => switchReciter(e.target.value);
    const pos = b.querySelector('[data-a=pos]');
    if (pos) { pos.oninput = () => { const t = b.querySelector('.lp-time'), q = P.q[+pos.value] || []; if (t) t.textContent = q[2] ? 'البسملة' : 'سورة ' + AR.SURAHS[q[0] - 1] + ' ' + AR.toArabicDigits(q[1]); }; pos.onchange = () => jump(+pos.value); }
  }

  const reciterSelect = (cur, attrs = '') => `<select ${attrs}>${[['old', 'القرّاء القدامى'], ['new', 'القرّاء المعاصرون'], ['full', 'بالسورة كاملة (استماع فقط)']].concat((APP.state && APP.state.reviewerUnlocked) || Object.keys(window.MY_QURAN || {}).length ? [['mine', 'الشيخ جمال السيد']] : []).map(([e, l]) => `<optgroup label="${l}">${RECITERS.filter(r => r.era === e).map(r => `<option value="${r.id}" ${r.id === cur ? 'selected' : ''}>${esc(r.n)} — ${esc(r.d)}</option>`).join('')}</optgroup>`).join('')}</select>`;

  // ===== شاشة الاستماع =====
  const MB = { husary: 900, 'husary-muallim': 1900, alafasy: 680, minshawi: 900 };
  const sizeOf = r => rec(r).full ? '≈ ١ جيجا' : '≈ ' + AR.toArabicDigits(Math.round((MB[r] || 800) / 100) / 10) + ' جيجا';
  V.listen = async (el, _, p) => {
    const cur = (await DB.setting('reciter')) || 'husary';
    const scope = p.all ? 'all' : p.juz ? 'juz' : 'surah';
    el.innerHTML = `<div class="row"><h1>🎧 الاستماع إلى القرآن</h1><span class="spacer"></span><a class="btn" href="#/radio">📻 إذاعات القرآن</a></div>
      <div class="sub">اختر القارئ والسورة أو الجزء أو المصحف كاملاً. التشغيل آية آية مع إبراز الآية الجارية وتكرارها للحفظ (عدا قرّاء «السورة كاملة» فللاستماع فقط). نزّل ما تريد ليعمل بدون إنترنت.</div>
      <div class="card"><div class="filters" style="flex-wrap:wrap">
        <label>القارئ ${reciterSelect(cur, 'id="lsR"')}</label>
        <label>النطاق <select id="lsScope"><option value="surah">سورة</option><option value="juz" ${scope === 'juz' ? 'selected' : ''}>جزء</option><option value="all" ${scope === 'all' ? 'selected' : ''}>المصحف كاملاً</option></select></label>
        <select id="lsS"></select>
        <select id="lsJ" style="display:none">${JUZ.map((_, i) => `<option value="${i + 1}" ${+p.juz === i + 1 ? 'selected' : ''}>الجزء ${AR.toArabicDigits(i + 1)}</option>`).join('')}</select>
        <label id="lsRepL">تكرار الآية <select id="lsRep">${[1, 2, 3, 5, 7, 10].map(n => `<option>${n}</option>`).join('')}</select></label>
      </div>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="btn primary" id="lsPlay">▶ استمع</button>
        <button class="btn" id="lsOpen">📖 افتح المصحف مع الصوت</button>
        <button class="btn" id="lsDl">⬇ نزّل للاستماع بدون إنترنت</button>
        <span id="lsInfo" class="muted"></span>
      </div>
      <div class="lp-dlbar hidden" id="lsBar"><i></i></div></div>
      <div class="card ls-full"><div class="row" style="gap:8px;flex-wrap:wrap"><b>📦 المصحف كاملاً بصوت قارئ واحد</b><span class="spacer"></span><button class="btn primary" id="lsAll">⬇ نزّل المصحف كاملاً</button></div>
        <div class="muted" id="lsAllInfo" style="font-size:13px;margin-top:6px"></div></div>
      <h2>📦 المنزَّل على جهازك</h2><div id="lsStore" class="muted">جارٍ الحساب…</div>
      <div class="info" style="margin-top:14px">💡 التنزيل يكمل من حيث توقف: لو انقطع الإنترنت اضغط التنزيل مرة أخرى فيكمل الباقي فقط. المصادر: everyayah.com وcdn.islamic.network وmp3quran.net وarchive.org.</div>`;
    const $ = s => el.querySelector(s);
    const R = () => $('#lsR').value, isFull = () => !!rec(R()).full;
    const fillS = () => { const have = new Set(surahsOf(R())), cur2 = +$('#lsS').value || +p.s || 1; $('#lsS').innerHTML = AR.SURAHS.map((n, i) => have.has(i + 1) ? `<option value="${i + 1}" ${cur2 === i + 1 ? 'selected' : ''}>${AR.toArabicDigits(i + 1)}. ${esc(n)}</option>` : '').join(''); };
    const list = () => $('#lsScope').value === 'all' ? Array.from({ length: 114 }, (_, i) => i + 1).flatMap(surahAyat) : $('#lsScope').value === 'juz' ? juzAyat(+$('#lsJ').value) : surahAyat(+$('#lsS').value);
    const surahList = () => { const have = new Set(surahsOf(R())); return [...new Set(list().map(x => x[0]))].filter(x => have.has(x)); };
    const showScope = () => { const sc = $('#lsScope').value, mine = !!rec(R()).mine; $('#lsJ').style.display = sc === 'juz' ? '' : 'none'; $('#lsS').style.display = sc === 'surah' ? '' : 'none'; $('#lsRepL').style.display = isFull() ? 'none' : ''; $('#lsOpen').style.display = isFull() ? 'none' : ''; $('#lsDl').style.display = mine ? 'none' : ''; el.querySelector('.ls-full').style.display = mine ? 'none' : ''; if (mine) { $('#lsInfo').textContent = 'تلاوتك المسجّلة على هذا الجهاز — سجّل من «تسجيل المكتبة بصوتي ← المصحف بصوتي»'; return; } info(); };
    const info = async () => {
      if (isFull()) { const L = surahList(), n = await storedSurahs(R(), L); $('#lsInfo').textContent = `${AR.toArabicDigits(L.length)} سورة — منزَّل منها ${AR.toArabicDigits(n)}` + (L.length && n === L.length ? ' ✔ تعمل بدون إنترنت' : ''); }
      else { const L = list(), n = await stored(R(), L); $('#lsInfo').textContent = `${AR.toArabicDigits(L.length)} آية — منزَّل منها ${AR.toArabicDigits(n)}` + (n === L.length ? ' ✔ تعمل بدون إنترنت' : ''); }
      const tot = isFull() ? surahsOf(R()).length : 6236, got = isFull() ? await storedSurahs(R()) : await stored(R());
      $('#lsAllInfo').innerHTML = `بصوت <b>${esc(rec(R()).n)}</b>: ${got >= tot ? '✔ المصحف كله منزَّل على جهازك ويعمل بدون إنترنت' : `منزَّل ${AR.toArabicDigits(Math.round(100 * got / tot))}٪ — الحجم الكامل ${sizeOf(R())} تقريباً. يُفضَّل التنزيل على شبكة واي فاي، ويمكنك الإيقاف والإكمال لاحقاً.`}${rec(R()).full && rec(R()).only ? '<br>هذا القارئ متاح له ' + AR.toArabicDigits(surahsOf(R()).length) + ' سورة فقط.' : ''}`;
      $('#lsAll').textContent = got >= tot ? '✔ مكتمل' : got ? '⬇ أكمل تنزيل المصحف' : '⬇ نزّل المصحف كاملاً';
    };
    const store = async () => {
      const ks = await allKeys(), by = {}; ks.forEach(k => { const r = k.split('/')[0]; by[r] = (by[r] || 0) + 1; });
      $('#lsStore').innerHTML = Object.keys(by).length ? `<table class="t"><tr><th>القارئ</th><th>المنزَّل</th><th></th></tr>${Object.entries(by).map(([r, n]) => `<tr><td>${esc(rec(r).n)} <small class="muted">${esc(rec(r).d)}</small></td><td>${rec(r).full ? `${AR.toArabicDigits(n)} سورة من ${AR.toArabicDigits(surahsOf(r).length)}` : `${AR.toArabicDigits(n)} آية من ٦٢٣٦ (${AR.toArabicDigits(Math.round(n / 62.36))}٪)`}</td><td><button class="btn sm" data-del="${r}">حذف</button></td></tr>`).join('')}</table>` : 'لا شيء بعد.';
      $('#lsStore').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (!await APP.ask('حذف تلاوات «' + rec(b.dataset.del).n + '» من الجهاز؟')) return; await removeReciter(b.dataset.del); store(); info(); });
    };
    $('#lsScope').onchange = showScope; $('#lsS').onchange = info; $('#lsJ').onchange = info;
    $('#lsR').onchange = async e => { await DB.setting('reciter', e.target.value); if (!rec(e.target.value).full) P.r = e.target.value; fillS(); showScope(); };
    $('#lsPlay').onclick = () => isFull() ? playFull(R(), surahList()) : play(list(), { reciter: R(), rep: +$('#lsRep').value });
    $('#lsOpen').onclick = () => { const [s, a] = list()[0]; P.pending = { list: list(), reciter: R(), rep: +$('#lsRep').value }; location.hash = '#/quran/' + s + (a > 1 ? '?a=' + a : ''); };
    // التنزيل (نطاق مختار أو المصحف كله): يستمر والشاشة مقفلة، ويكمل من حيث توقف
    let busy = null;
    const runDl = async (btn, all) => {
      if (busy) { cancelDl = true; return; }
      const r = R(), full = isFull(), bar = $('#lsBar'), labels = [$('#lsDl').textContent, $('#lsAll').textContent];
      busy = btn; btn.textContent = '⏹ إيقاف التنزيل'; bar.classList.remove('hidden');
      if (window.KEEPALIVE) KEEPALIVE.start('⬇ تنزيل التلاوة', rec(r).n, { controls: false });
      const prog = (d, n, f) => { const t = `جارٍ التنزيل ${AR.toArabicDigits(d)} من ${AR.toArabicDigits(n)}` + (f ? ` (تعذّر ${AR.toArabicDigits(f)})` : ''); $('#lsInfo').textContent = t; bar.firstElementChild.style.width = (100 * d / n).toFixed(1) + '%'; if (window.KEEPALIVE && d % 20 === 0) KEEPALIVE.update({ text: t }); };
      let res;
      if (full) res = await downloadFull(r, all ? surahsOf(r) : surahList(), prog);
      else { let L = all ? Array.from({ length: 114 }, (_, i) => i + 1).flatMap(surahAyat) : list(); const have = new Set((await allKeys()).filter(k => k.startsWith(r + '/'))); L = L.filter(([s, a]) => !have.has(key(r, s, a))); res = await download(r, L, prog); }
      if (window.KEEPALIVE) KEEPALIVE.stop();
      busy = null; $('#lsDl').textContent = labels[0].startsWith('⏹') ? '⬇ نزّل للاستماع بدون إنترنت' : labels[0]; bar.classList.add('hidden');
      APP.toast(res.cancelled ? 'أُوقف التنزيل — اضغط مرة أخرى للإكمال' : res.fail ? `تم مع تعذّر ${AR.toArabicDigits(res.fail)} — اضغط التنزيل مرة أخرى لإكمالها` : '✔ تم التنزيل، يعمل الآن بدون إنترنت', 5000);
      info(); store();
    };
    $('#lsDl').onclick = e => runDl(e.currentTarget, false);
    $('#lsAll').onclick = async e => { if (busy) { cancelDl = true; return; } if (!(await APP.ask(`تنزيل المصحف كاملاً بصوت «${rec(R()).n}» (${sizeOf(R())} تقريباً)؟ يُفضَّل أن تكون على واي فاي.`))) return; runDl(e.currentTarget, true); };
    fillS(); showScope(); store();
  };

  // ===== إذاعات القرآن الكريم (بث مباشر) =====
  const RADIOS = [
    { id: 'cairo', n: 'إذاعة القرآن الكريم من القاهرة', d: 'مصر — ٩٨٫٢ إف إم', url: 'https://stream.radiojar.com/8s5u5tpdtwzuv' },
    { id: 'saudi', n: 'إذاعة القرآن الكريم من السعودية', d: 'المملكة العربية السعودية', url: 'https://stream.radiojar.com/0tpy1h0kxtzuv' },
    { id: 'madinah', n: 'المسجد النبوي مباشر', d: 'قناة السنة النبوية الرسمية — صوت وصورة، يُفتح في يوتيوب', ext: 'https://www.youtube.com/channel/UCROKYPep-UuODNwyipe6JMw/live' },
  ];
  if (window.MEDIA) MEDIA.register('radio-native', () => { const A = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Adhan; if (A && A.stopRadio) A.stopRadio().catch(() => { }); });
  V.radio = async el => {
    const extra = ((window.NEWS && NEWS.data && NEWS.data.radios) || []).filter(x => x && x.url && x.n);
    const all = RADIOS.concat(extra);
    el.innerHTML = `<div class="row"><h1>📻 إذاعات القرآن الكريم</h1><span class="spacer"></span><a class="btn" href="#/listen">🎧 الاستماع للقرآن</a></div>
      <div class="sub">بث مباشر على مدار الساعة — يحتاج اتصالاً بالإنترنت. يستمر التشغيل والشاشة مقفلة، وتتحكم فيه من الإشعار.</div>
      <div class="grid">${all.map((r, i) => `<div class="card radio-card"><div class="radio-ic">${r.ext ? '🕌' : '📻'}</div><b>${esc(r.n)}</b><div class="muted" style="font-size:13px">${esc(r.d || '')}</div><button class="btn primary" data-r="${i}" style="margin-top:8px">${r.ext ? '📺 شاهد الآن' : '▶ استمع الآن'}</button></div>`).join('')}</div>`;
    // في تطبيق أندرويد تُشغَّل الإذاعة بمشغّل أندرويد نفسه (أقوى مع خوادم البث، ويستمر والتطبيق مغلق)
    const NAT = window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.Plugins && Capacitor.Plugins.Adhan && Capacitor.Plugins.Adhan.playRadio ? Capacitor.Plugins.Adhan : null;
    const paint = async () => { const st = NAT ? ((await NAT.radioState().catch(() => ({}))).url || '') : ''; el.querySelectorAll('[data-r]').forEach(b => { const r = all[+b.dataset.r]; if (r.ext) return; const on = st && st === r.url; b.textContent = on ? '⏹ إيقاف' : '▶ استمع الآن'; b.classList.toggle('on', !!on); }); };
    if (NAT) paint();
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = async () => { const r = all[+b.dataset.r]; if (NAT && !r.ext) { if (b.classList.contains('on')) { await NAT.stopRadio(); } else { if (window.MEDIA) MEDIA.claim('radio-native'); await NAT.playRadio({ url: r.url, title: r.n }).catch(e => APP.toast('تعذّر تشغيل الإذاعة: ' + (e.message || e))); APP.toast('📻 جارٍ الاتصال بـ' + r.n + ' — تتحكم فيها من الإشعار', 3500); } setTimeout(paint, 400); return; } if (r.ext) { const a = document.createElement('a'); a.href = r.ext; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); return; } LP.play([{ title: r.n, sub: 'بث مباشر', url: r.url, live: true }], { name: 'radio', icon: '📻' }); });
  };

  window.QA = { RECITERS, JUZ, COUNTS, juzAyat, surahAyat, juzOf, play, stop, P, reciterSelect, stored, download, rec, playFull, surahsOf, RADIOS };
})();
