/* 🧒 أساس قسمي «الأطفال» و«محو الأمية»: الحروف، الأصوات، لوح الكتابة بالتصحيح، الأصوات المسجلة.
   كل شيء يعمل بدون إنترنت. الصوت بشري فقط: مسجّل على الجهاز أو مرفق مع التطبيق (لا صوت آلي). */
(() => {
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));

  // ===== الحروف =====
  const L = [
    ['ا', 'ألف'], ['ب', 'باء'], ['ت', 'تاء'], ['ث', 'ثاء'], ['ج', 'جيم'], ['ح', 'حاء'], ['خ', 'خاء'], ['د', 'دال'], ['ذ', 'ذال'], ['ر', 'راء'],
    ['ز', 'زاي'], ['س', 'سين'], ['ش', 'شين'], ['ص', 'صاد'], ['ض', 'ضاد'], ['ط', 'طاء'], ['ظ', 'ظاء'], ['ع', 'عين'], ['غ', 'غين'], ['ف', 'فاء'],
    ['ق', 'قاف'], ['ك', 'كاف'], ['ل', 'لام'], ['م', 'ميم'], ['ن', 'نون'], ['ه', 'هاء'], ['و', 'واو'], ['ي', 'ياء']
  ];
  const NOJOIN = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و']); // حروف لا تتصل بما بعدها
  const HAR = [['a', 'َ', 'فتحة'], ['u', 'ُ', 'ضمة'], ['i', 'ِ', 'كسرة']];
  const TAN = [['a', 'ً', 'تنوين فتح'], ['u', 'ٌ', 'تنوين ضم'], ['i', 'ٍ', 'تنوين كسر']];
  const base = c => c === 'ا' ? 'أ' : c;
  const harakah = (c, k) => { const h = HAR.find(x => x[0] === k); return k === 'i' && c === 'ا' ? 'إِ' : base(c) + h[1]; };
  const tanween = (c, k) => { const t = TAN.find(x => x[0] === k); const b = k === 'i' && c === 'ا' ? 'إ' : base(c); return b + t[1] + (k === 'a' && !['ة', 'ء'].includes(c) ? 'ا' : ''); };
  const madd = (c, k) => k === 'a' ? (c === 'ا' ? 'آ' : c + 'َا') : k === 'u' ? base(c) + 'ُو' : (c === 'ا' ? 'إِي' : c + 'ِي');
  const forms = c => NOJOIN.has(c) ? { iso: c, ini: c, med: 'ـ' + c, fin: 'ـ' + c } : { iso: c, ini: c + 'ـ', med: 'ـ' + c + 'ـ', fin: 'ـ' + c };

  // ===== كلمات بصور (إيموجي) =====
  function firstOf(w) { const c = w.replace(/[\u064B-\u0652]/g, '')[0]; return /[اأإآ]/.test(c) ? 'ا' : c; }
  const W = [
    ['أسد', '🦁'], ['أرنب', '🐇'], ['بطة', '🦆'], ['بقرة', '🐄'], ['بيت', '🏠'], ['باب', '🚪'], ['تفاحة', '🍎'], ['تمر', '🌴'], ['ثعلب', '🦊'], ['جمل', '🐪'],
    ['حصان', '🐴'], ['خروف', '🐑'], ['خبز', '🍞'], ['دجاجة', '🐔'], ['ديك', '🐓'], ['ذئب', '🐺'], ['زرافة', '🦒'], ['ساعة', '⌚'], ['سمكة', '🐟'], ['سيارة', '🚗'],
    ['شمس', '☀️'], ['شجرة', '🌳'], ['صقر', '🦅'], ['ضفدع', '🐸'], ['طائرة', '✈️'], ['ظرف', '✉️'], ['عين', '👁️'], ['غزال', '🦌'], ['فيل', '🐘'], ['قطة', '🐈'],
    ['قمر', '🌙'], ['قلم', '✏️'], ['كتاب', '📖'], ['كلب', '🐕'], ['ليمون', '🍋'], ['ماء', '💧'], ['مسجد', '🕌'], ['موز', '🍌'], ['مفتاح', '🔑'], ['نحلة', '🐝'],
    ['نمر', '🐅'], ['نجمة', '⭐'], ['هاتف', '📱'], ['وردة', '🌹'], ['يد', '✋'], ['نقود', '💵'], ['مدرسة', '🏫'], ['بحر', '🌊'], ['طبيب', '🩺'], ['حليب', '🥛']
  ].map(([w, e], i) => ({ id: 'w' + i, w, e, first: firstOf(w) }));
  const D = window.LEARN_DATA;
  // كل كلمات المنهج (الكلمات القديمة تحتفظ بمفاتيحها حتى لا تضيع تسجيلاتها)
  const WMAP = new Map(W.map(x => [x.w, x]));
  D.THEMES.forEach(th => th.w.forEach(([w, e]) => { if (!WMAP.has(w)) WMAP.set(w, { id: 'v_' + w, w, e, first: firstOf(w) }); }));
  const THEMES = D.THEMES.map(th => Object.assign({}, th, { words: th.w.map(([w]) => WMAP.get(w)) }));
  const ALLW = [...WMAP.values()];
  const PICW = ALLW.filter(x => x.e);
  const ANIMALS = THEMES.find(t => t.id === 'animals').words.map(x => x.w);
  const DECODE = D.DECODE.map(d => Object.assign({}, d, { words: d.w.map(w => ({ id: 'd_' + w, w, e: '' })) }));
  const SK = D.SENT_K.map((t, i) => ({ id: 'sk' + i, t })), SA = D.SENT_A.map((t, i) => ({ id: 'sa' + i, t }));
  const SIGNS = D.SIGNS.map(([t, c], i) => ({ id: 'g' + i, t, c }));
  const STORIES = D.STORIES.map(st => Object.assign({}, st, { pages: st.p.map(([t, e], i) => ({ id: `st_${st.id}_${i}`, t, e })) }));

  const S = [
    'السلام عليكم', 'بسم الله الرحمن الرحيم', 'الحمد لله رب العالمين', 'أنا أحب أمي', 'الشمس في السماء', 'القطة تشرب الماء',
    'الولد يقرأ الكتاب', 'ذهب أبي إلى المسجد', 'اشتريت خبزا من السوق', 'أحمد يأكل التفاحة', 'البنت تكتب بالقلم', 'الفيل حيوان كبير'
  ];
  const NUM = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر', 'عشرون'];
  const AD = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  // جمل التعليمات والتشجيع (بصوت بشري مسجّل)
  const P = {
    welcome: 'أهلا بك. للأطفال اضغط على صورة الطفل. لتتعلم القراءة والكتابة اضغط على صورة القلم. وللمكتبة اضغط على صورة الكتاب',
    listen: 'استمع جيدا',
    repeat: 'كرر بعدي',
    choose_letter: 'اختر الحرف الذي تسمعه',
    choose_word: 'اختر الكلمة الصحيحة',
    choose_pic: 'اختر الصورة الصحيحة',
    trace: 'اكتب فوق النقاط بإصبعك',
    write: 'الآن اكتب وحدك',
    write_word: 'اكتب هذه الكلمة',
    write_sentence: 'اكتب هذه الجملة',
    arrange: 'رتب الكلمات لتكون جملة',
    say_name: 'اضغط على الميكروفون وقل اسم الصورة',
    first_letter: 'اختر الحرف الأول من الكلمة',
    count: 'كم عددها؟',
    add: 'كم المجموع؟',
    sub: 'كم الباقي؟',
    memory: 'اقلب البطاقات وابحث عن كل صورتين متشابهتين',
    good: 'أحسنت',
    great: 'ممتاز، بارك الله فيك',
    try_again: 'حاول مرة أخرى',
    done: 'انتهى الدرس، أحسنت',
    next: 'هيا إلى الدرس التالي',
    harakat: 'هذه هي الحركات: فتحة، ضمة، كسرة',
    grad_intro: 'هذا اختبار صغير لتعرف مستواك',
    grad_pass: 'مبارك! أنت الآن تستطيع القراءة. يمكنك دخول قسم الكبار',
    grad_fail: 'تحتاج مراجعة قليلة ثم أعد الاختبار',
    exit_hold: 'اضغط مطولا للخروج',
    lit_intro: 'ابدأ من الأعلى: الحروف، ثم الحركات والمدود، ثم الكلمات واللافتات، ثم الجمل، ثم الاختبار',
    t_letters: 'حروفي', t_write: 'أكتب', t_numbers: 'أرقامي', t_quran: 'قرآني', t_games: 'ألعابي',
    t_nlearn: 'تعلّم الأرقام', t_count: 'عُدّ', t_add: 'اجمع', t_sub: 'اطرح',
    t_animal: 'أين الحيوان؟', t_speak: 'قل اسمه', t_first: 'الحرف الأول', t_arrange: 'رتّب الجملة', t_memory: 'الذاكرة',
    madd_intro: 'هذه حروف المد: الألف والواو والياء، تمد الصوت',
    tanween_intro: 'التنوين: نون ساكنة نسمعها ولا نكتبها',
    short_long: 'هل الصوت قصير أم طويل؟ اختر ما تسمع',
    sukun_intro: 'السكون: الحرف الساكن لا يتحرك',
    shadda_intro: 'الشدة: الحرف المشدد يُنطق مرتين',
    shams_intro: 'اللام الشمسية لا تنطق، واللام القمرية تنطق',
    verbs_intro: 'اقرأ الكلمة حرفا حرفا ثم اقرأها كاملة',
    story: 'استمع إلى القصة',
    read_sign: 'اقرأ هذه اللوحة',
    missing: 'اختر الحرف الناقص',
    build: 'كوّن الكلمة بالحروف',
    pop: 'افقع البالون الذي فيه الحرف',
    true_false: 'هل هذا صحيح؟',
    color: 'اختر اللون',
    more: 'أيهما أكثر؟',
    order: 'رتب الأرقام من الأصغر إلى الأكبر',
    match: 'صل كل كلمة بصورتها',
    t_words: 'كلماتي', t_stories: 'قصصي', t_reading: 'أتعلم القراءة',
    t_missing: 'الحرف الناقص', t_build: 'كوّن الكلمة', t_pop: 'البالونات', t_tf: 'صح أم خطأ', t_color: 'الألوان', t_more: 'أكثر وأقل', t_order: 'رتب الأرقام', t_match: 'صل الكلمة بالصورة',
    watch: 'انظر كيف يكتب الحرف، ثم اكتب أنت',
    badge: 'مبارك، حصلت على وسام جديد',
    rest: 'أحسنت، كفى اليوم، نكمل غدا إن شاء الله',
    char_hi: 'أنا الأستاذ جمال، هيا نتعلم معا',
    char_good: 'أحسنت يا بطل',
    char_done: 'ما شاء الله، أنهيت الدرس',
    t_map: 'رحلتي', t_me: 'إنجازاتي', t_watch: 'شاهد وتعلم',
    l_letters: 'الحروف', l_harakat: 'الحركات', l_madd: 'المدود', l_tanween: 'التنوين', l_forms: 'أشكال الحروف', l_decode: 'السكون والشدة', l_words: 'الكلمات', l_signs: 'اللافتات', l_sent: 'الجمل', l_quran: 'جزء عمّ', l_grad: 'الاختبار'
  };

  // ===== قائمة كل المقاطع الصوتية (للتسجيل) =====
  let CLIPS = null;
  function clips() {
    if (CLIPS) return CLIPS;
    const out = [], add = (key, text, show, group) => out.push({ key, text, show: show || text, group, phase: 1 });
    L.forEach(([c, n], i) => add('l' + i, n, c, '١. أسماء الحروف'));
    L.forEach(([c], i) => HAR.forEach(([k]) => add(`h${i}${k}`, harakah(c, k), null, '٢. الحروف بالحركات (فتحة، ضمة، كسرة)')));
    Object.entries(P).filter(([k]) => !/^[tl]_/.test(k)).forEach(([k, t]) => add('p_' + k, t, null, '٣. جمل التعليمات والتشجيع'));
    Object.entries(P).filter(([k]) => /^[tl]_/.test(k)).forEach(([k, t]) => add('p_' + k, t, null, '٤. أسماء الأقسام والألعاب'));
    THEMES.forEach(th => add('th_' + th.id, th.t, th.ic + ' ' + th.t, '٤. أسماء الأقسام والألعاب'));
    DECODE.forEach(d => add('dt_' + d.id, d.t, null, '٤. أسماء الأقسام والألعاب'));
    STORIES.forEach(st => add('stt_' + st.id, st.t, st.ic + ' ' + st.t, '٤. أسماء الأقسام والألعاب'));
    NUM.forEach((n, i) => add('n' + i, n, AD(i) + ' — ' + n, '٥. الأرقام'));
    const seen = new Set();
    THEMES.forEach(th => th.words.forEach(x => { if (seen.has(x.id)) return; seen.add(x.id); add(x.id, x.w, (x.e ? x.e + ' ' : '') + x.w, `٦. الكلمات — ${th.t}`); }));
    W.forEach(x => { if (!seen.has(x.id)) { seen.add(x.id); add(x.id, x.w, x.e + ' ' + x.w, '٦. الكلمات — متنوعة'); } });
    L.forEach(([c], i) => ['a', 'u', 'i'].forEach(k => add(`m${i}${k}`, madd(c, k), null, '٧. المدود (بَا بُو بِي)')));
    L.forEach(([c], i) => TAN.forEach(([k]) => add(`t${i}${k}`, tanween(c, k), null, '٨. التنوين')));
    DECODE.forEach(d => d.words.forEach(x => add(x.id, x.w, null, '٩. ' + d.t)));
    S.forEach((t, i) => add('s' + i, t, null, '١٠. جمل أساسية'));
    SK.forEach(x => add(x.id, x.t, null, '١١. جمل الأطفال'));
    SA.forEach(x => add(x.id, x.t, null, '١٢. جمل الحياة اليومية (الكبار)'));
    SIGNS.forEach(x => add(x.id, x.t, null, '١٣. اللافتات'));
    STORIES.forEach(st => st.pages.forEach(pg => add(pg.id, pg.t, pg.e + ' ' + pg.t, '١٤. القصص — ' + st.t)));
    return (CLIPS = out);
  }

  // ===== تخزين التسجيلات على الجهاز =====
  let dbp = null;
  const vdb = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('maktaba-learn', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('voice', { keyPath: 'key' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const d = await vdb(); return new Promise((res, rej) => { const t = d.transaction('voice', mode); const st = t.objectStore('voice'); const out = fn(st); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
  const VS = {
    get: async key => { const d = await vdb(); return new Promise(res => { const r = d.transaction('voice').objectStore('voice').get(key); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); },
    put: (key, blob) => tx('readwrite', st => st.put({ key, blob, type: blob.type, at: Date.now() })),
    del: key => tx('readwrite', st => st.delete(key)),
    keys: async () => { const d = await vdb(); return new Promise(res => { const r = d.transaction('voice').objectStore('voice').getAllKeys(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); }); },
    all: async () => { const d = await vdb(); return new Promise(res => { const r = d.transaction('voice').objectStore('voice').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); }); }
  };

  // ===== النطق =====
  let cur = null, curUrl = null, gen = 0;
  function stop() {
    gen++;
    if (cur) { try { cur.pause(); } catch (e) { } cur = null; }
    if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null; }
  }
  const playUrl = (url, my) => new Promise(res => {
    const a = new Audio(url); cur = a;
    a.onended = a.onerror = () => res();
    a.play().catch(() => res());
    const chk = setInterval(() => { if (my !== gen) { clearInterval(chk); res(); } else if (a.ended) clearInterval(chk); }, 300);
  });
  async function say(key, text) {
    if (!key && text) { const c = clips().find(x => x.text === text); if (c) key = c.key; }
    stop(); const my = gen;
    const rec = key && await VS.get(key).catch(() => null);
    if (my !== gen) return;
    if (rec && rec.blob) { curUrl = URL.createObjectURL(rec.blob); return playUrl(curUrl, my); }
    const f = key && window.LEARN_AUDIO && LEARN_AUDIO[key];
    if (f) return playUrl('audio/learn/' + f, my);
    // لا يُستعمل صوت الجهاز أبداً: إن لم يُسجَّل المقطع بعد يبقى صامتاً
  }
  async function sayAll(list) { const my = gen + 1; for (const [k, t] of list) { await say(k, t); if (gen !== my) return; await new Promise(r => setTimeout(r, 250)); } }

  // أصوات قصيرة للتفاعل (بدون ملفات)
  let ac = null;
  function tone(kind) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const notes = kind === 'ok' ? [660, 880] : kind === 'win' ? [523, 659, 784, 1046] : [220, 180];
      notes.forEach((f, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f; o.type = kind === 'bad' ? 'sawtooth' : 'sine';
        g.gain.setValueAtTime(0.0001, ac.currentTime + i * 0.12); g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + i * 0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.12 + 0.2);
        o.connect(g).connect(ac.destination); o.start(ac.currentTime + i * 0.12); o.stop(ac.currentTime + i * 0.12 + 0.22);
      });
    } catch (e) { }
    if (navigator.vibrate) navigator.vibrate(kind === 'bad' ? [60, 40, 60] : 30);
  }
  function burst(host) {
    const b = document.createElement('div'); b.className = 'lr-burst';
    b.innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * 26}deg;--d:${60 + (i % 3) * 30}px">${['⭐', '✨', '🌟'][i % 3]}</i>`).join('');
    (host || document.body).appendChild(b); setTimeout(() => b.remove(), 1100);
  }
  // ردّ فعل الأستاذ جمال في زاوية الشاشة (تصفيق، إبهام، تفكير…)
  let rt = null;
  function react(pose, ms = 1600) {
    let el = document.getElementById('tcReact');
    if (!el) { el = document.createElement('img'); el.id = 'tcReact'; el.className = 'tc-react'; el.alt = ''; el.onerror = () => el.classList.remove('on'); document.body.appendChild(el); }
    el.src = 'img/teacher/' + pose + '-h.png'; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(rt); rt = setTimeout(() => el.classList.remove('on'), ms);
  }
  const praise = () => say(['p_good', 'p_great', 'p_char_good'][Math.floor(Math.random() * 3)]);

  // ===== التقدم =====
  async function prog() { return (await DB.setting('learn')) || { lit: {}, kids: {}, stars: 0 }; }
  async function mark(area, id, val = 1) {
    const p = await prog(); p[area] = p[area] || {};
    if (!p[area][id]) p.stars = (p.stars || 0) + 1;
    p[area][id] = Math.max(p[area][id] || 0, val);
    await DB.setting('learn', p); return p;
  }

  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = (arr, n, must) => { const rest = shuffle(arr.filter(x => x !== must)).slice(0, n - (must ? 1 : 0)); return shuffle(must ? [must, ...rest] : rest); };

  // ===== الإطار (شاشة كاملة بلا قوائم التطبيق) =====
  const LEARN_ROUTES = ['kids', 'literacy', 'start', 'learnrec', 'learnme'];
  function syncMode() {
    const r = (location.hash.slice(2).split(/[/?]/)[0]) || '';
    const on = LEARN_ROUTES.includes(r);
    stop();
    document.body.classList.toggle('learn-mode', on);
    if (!on) document.body.classList.remove('learn-kids', 'learn-lit');
  }
  window.addEventListener('hashchange', syncMode);
  function shell(el, o) {
    document.body.classList.add('learn-mode');
    document.body.classList.toggle('learn-kids', o.theme === 'kids');
    document.body.classList.toggle('learn-lit', o.theme === 'lit');
    el.innerHTML = `<div class="lr-wrap">
      <div class="lr-top">
        ${o.back ? `<a class="lr-ic" href="${o.back}" aria-label="رجوع">➜</a>` : '<span></span>'}
        <div class="lr-title">${o.title || ''}</div>
        <div class="row" style="gap:6px">${o.stars != null ? `<span class="lr-stars">⭐ ${AD(o.stars)}</span>` : ''}${o.repeat ? '<button class="lr-ic" data-rep aria-label="أعد السماع">🔊</button>' : ''}${o.exit || ''}</div>
      </div>
      <div class="lr-body" id="lrBody"></div>
    </div>`;
    const rep = el.querySelector('[data-rep]'); if (rep && o.repeat) rep.onclick = () => o.repeat();
    return el.querySelector('#lrBody');
  }

  // ===== لوح الكتابة باللمس مع التصحيح =====
  // target: نص الحرف أو الكلمة. guide: إظهار النقاط للكتابة فوقها
  function pad(host, target, opt = {}) {
    const wide = target.replace(/[ً-ْـ]/g, '').length > 1;
    const W = Math.min(host.clientWidth || 340, wide ? 640 : 360), H = wide ? Math.round(W * 0.5) : W;
    host.innerHTML = `<div class="lr-pad"><canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px"></canvas>
      <div class="lr-padbar"><button class="lr-btn ghost" data-clear>🧽 امسح</button><button class="lr-btn ok" data-check>✔ تحقق</button></div></div>`;
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    const font = s => `700 ${s}px Naskh, 'Amiri Quran', serif`;
    // حجم الخط ليملأ اللوح
    let fs = H * 1.3, by = cv.height * 0.7;
    const fit = () => { ctx.font = font(fs); ctx.direction = 'rtl'; const m = ctx.measureText(target); return [m.width, (m.actualBoundingBoxAscent || fs * 0.8) + (m.actualBoundingBoxDescent || fs * 0.3), m]; };
    for (let [w, h, m] = fit(); (w > cv.width * 0.84 || h > cv.height * 0.8) && fs > 20; [w, h, m] = fit()) fs -= 6;
    { const m = fit()[2]; const a = m.actualBoundingBoxAscent || fs * 0.8, d = m.actualBoundingBoxDescent || fs * 0.3; by = (cv.height + a - d) / 2; }
    const strokes = []; let curS = null;
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--lr-pad') || '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(cv.width, by); ctx.stroke();
      if (opt.guide) {
        ctx.font = font(fs); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.direction = 'rtl';
        ctx.fillStyle = 'rgba(30,120,80,.16)'; ctx.fillText(target, cv.width / 2, by);
        ctx.setLineDash([12, 10]); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,120,80,.75)'; ctx.strokeText(target, cv.width / 2, by); ctx.setLineDash([]);
      }
      ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(16, fs * 0.07); ctx.strokeStyle = opt.color || '#1565c0';
      strokes.forEach(s => { ctx.beginPath(); s.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (s.length === 1) ctx.lineTo(s[0][0] + 0.1, s[0][1]); ctx.stroke(); });
    }
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); curS = [pos(e)]; strokes.push(curS); draw(); });
    cv.addEventListener('pointermove', e => { if (!curS) return; e.preventDefault(); curS.push(pos(e)); draw(); });
    const up = () => { curS = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.style.touchAction = 'none';
    host.querySelector('[data-clear]').onclick = () => { strokes.length = 0; draw(); };
    host.querySelector('[data-check]').onclick = () => {
      if (!strokes.length) { say('p_' + (opt.guide ? 'trace' : 'write')); return; }
      const sc = score(); host.dataset.score = sc.toFixed(3); opt.onCheck && opt.onCheck(sc, sc >= (opt.pass || (opt.guide ? 0.55 : 0.5)));
    };
    draw();

    // التصحيح: مقارنة شكل ما كُتب بشكل الحرف الصحيح بعد توحيد الموضع والحجم
    function mask(drawFn) {
      const c = document.createElement('canvas'); c.width = cv.width / 2; c.height = cv.height / 2; const x = c.getContext('2d');
      x.scale(0.5, 0.5); drawFn(x);
      const d = x.getImageData(0, 0, c.width, c.height).data, pts = [];
      for (let y = 0; y < c.height; y += 2) for (let xx = 0; xx < c.width; xx += 2) if (d[(y * c.width + xx) * 4 + 3] > 40) pts.push([xx, y]);
      return pts;
    }
    // نقاط الحرف الصحيح (ممتلئ) ونقاط خط المستخدم (منتصف الخط)، ثم «مسافة شامفر» في الاتجاهين بعد توحيد الحجم
    const N = 64;
    function norm(pts) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
      const w = Math.max(x1 - x0, 1), h = Math.max(y1 - y0, 1), s = Math.max(w, h), ox = (s - w) / 2, oy = (s - h) / 2, g = new Uint8Array(N * N);
      pts.forEach(([x, y]) => { g[Math.min(N - 1, Math.floor((y - y0 + oy) / s * (N - 1))) * N + Math.min(N - 1, Math.floor((x - x0 + ox) / s * (N - 1)))] = 1; });
      return { g, asp: w / h };
    }
    function dtf(g) {
      const d = new Float32Array(N * N); for (let i = 0; i < d.length; i++) d[i] = g[i] ? 0 : 1e6;
      const R = Math.SQRT2;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; let v = d[i]; if (x) v = Math.min(v, d[i - 1] + 1); if (y) { v = Math.min(v, d[i - N] + 1); if (x) v = Math.min(v, d[i - N - 1] + R); if (x < N - 1) v = Math.min(v, d[i - N + 1] + R); } d[i] = v; }
      for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; let v = d[i]; if (x < N - 1) v = Math.min(v, d[i + 1] + 1); if (y < N - 1) { v = Math.min(v, d[i + N] + 1); if (x < N - 1) v = Math.min(v, d[i + N + 1] + R); if (x) v = Math.min(v, d[i + N - 1] + R); } d[i] = v; }
      return d;
    }
    const meanOn = (g, d) => { let s = 0, n = 0; for (let i = 0; i < g.length; i++) if (g[i]) { s += d[i]; n++; } return n ? s / n : 99; };
    function score() {
      const tp = mask(x => { x.font = font(fs); x.textAlign = 'center'; x.direction = 'rtl'; x.fillStyle = '#000'; x.fillText(target, cv.width / 2, by); });
      const up = [];
      strokes.forEach(st => { for (let i = 0; i < st.length; i++) { const [x, y] = st[i]; up.push([x / 2, y / 2]); if (i) { const [px, py] = st[i - 1], L = Math.hypot(x - px, y - py), n = Math.floor(L / 6); for (let k = 1; k < n; k++) up.push([(px + (x - px) * k / n) / 2, (py + (y - py) * k / n) / 2]); } } });
      if (tp.length < 5 || up.length < 3) return 0;
      const T = norm(tp), U = norm(up);
      const mT = meanOn(T.g, dtf(U.g)), mU = meanOn(U.g, dtf(T.g));
      const asp = Math.max(T.asp / U.asp, U.asp / T.asp);
      const d = Math.max(mT, mU) * (asp > 1.8 ? asp / 1.8 : 1);
      return Math.max(0, Math.min(1, 1 - (d - 1) / 5));
    }
    return { clear: () => { strokes.length = 0; draw(); } };
  }

  // ===== التعرف على الكلام (قل اسم الصورة) =====
  function listen(onText, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { APP.toast('التعرف على الصوت غير متاح في هذا الجهاز', 4000); onEnd && onEnd(); return null; }
    stop();
    const r = new SR(); r.lang = 'ar-SA'; r.continuous = false; r.interimResults = true;
    let done = false;
    r.onresult = e => { const t = Array.from(e.results).map(x => x[0].transcript).join(' '); if (onText(t, e.results[e.results.length - 1].isFinal) && !done) { done = true; try { r.stop(); } catch (x) { } } };
    r.onerror = () => { };
    r.onend = () => onEnd && onEnd();
    try { r.start(); } catch (e) { onEnd && onEnd(); }
    setTimeout(() => { try { r.stop(); } catch (e) { } }, 7000);
    return r;
  }
  const sameWord = (heard, w) => { const h = ' ' + AR.normalize(heard) + ' ', c = AR.normalize(w); return h.includes(c) || h.includes(' ال' + c) || h.includes(c.replace(/ه$/, '')); };

  window.LEARN = { react, THEMES, ALLW, PICW, DECODE, SK, SA, SIGNS, STORIES, firstOf, L, HAR, TAN, W, S, NUM, P, ANIMALS, AD, harakah, tanween, madd, forms, clips, VS, say, sayAll, stop, tone, burst, praise, prog, mark, shuffle, pick, shell, pad, listen, sameWord, esc, syncMode };
})();
