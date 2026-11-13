/* 🧒 أساس قسمي «الأطفال» و«محو الأمية»: الحروف، الأصوات، لوح الكتابة بالتصحيح، الأصوات المسجلة.
   كل شيء يعمل بدون إنترنت. الصوت: تسجيل بشري إن وُجد (مسجّل على الجهاز أو مرفق مع التطبيق)، وإلا صوت الجهاز. */
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
  const W = [
    ['أسد', '🦁'], ['أرنب', '🐇'], ['بطة', '🦆'], ['بقرة', '🐄'], ['بيت', '🏠'], ['باب', '🚪'], ['تفاحة', '🍎'], ['تمر', '🌴'], ['ثعلب', '🦊'], ['جمل', '🐪'],
    ['حصان', '🐴'], ['خروف', '🐑'], ['خبز', '🍞'], ['دجاجة', '🐔'], ['ديك', '🐓'], ['ذئب', '🐺'], ['زرافة', '🦒'], ['ساعة', '⌚'], ['سمكة', '🐟'], ['سيارة', '🚗'],
    ['شمس', '☀️'], ['شجرة', '🌳'], ['صقر', '🦅'], ['ضفدع', '🐸'], ['طائرة', '✈️'], ['ظرف', '✉️'], ['عين', '👁️'], ['غزال', '🦌'], ['فيل', '🐘'], ['قطة', '🐈'],
    ['قمر', '🌙'], ['قلم', '✏️'], ['كتاب', '📖'], ['كلب', '🐕'], ['ليمون', '🍋'], ['ماء', '💧'], ['مسجد', '🕌'], ['موز', '🍌'], ['مفتاح', '🔑'], ['نحلة', '🐝'],
    ['نمر', '🐅'], ['نجمة', '⭐'], ['هاتف', '📱'], ['وردة', '🌹'], ['يد', '✋'], ['نقود', '💵'], ['مدرسة', '🏫'], ['بحر', '🌊'], ['طبيب', '🩺'], ['حليب', '🥛']
  ].map(([w, e], i) => ({ id: 'w' + i, w, e, first: AR.normalize(w)[0] === 'ا' ? 'ا' : w[0] === 'أ' ? 'ا' : w[0] }));
  const ANIMALS = ['أسد', 'أرنب', 'بطة', 'بقرة', 'ثعلب', 'جمل', 'حصان', 'خروف', 'دجاجة', 'ديك', 'ذئب', 'زرافة', 'سمكة', 'صقر', 'ضفدع', 'غزال', 'فيل', 'قطة', 'كلب', 'نحلة', 'نمر'];

  const S = [
    'السلام عليكم', 'بسم الله الرحمن الرحيم', 'الحمد لله رب العالمين', 'أنا أحب أمي', 'الشمس في السماء', 'القطة تشرب الماء',
    'الولد يقرأ الكتاب', 'ذهب أبي إلى المسجد', 'اشتريت خبزا من السوق', 'أحمد يأكل التفاحة', 'البنت تكتب بالقلم', 'الفيل حيوان كبير'
  ];
  const NUM = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر', 'عشرون'];
  const AD = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  // جمل التعليمات (تُسجَّل بصوت بشري، وإلا تُقرأ بصوت الجهاز)
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
    lit_intro: 'ابدأ بالحروف، ثم أشكال الحروف، ثم الكلمات، ثم الجمل، ثم الاختبار',
    t_letters: 'حروفي', t_write: 'أكتب', t_numbers: 'أرقامي', t_quran: 'قرآني', t_games: 'ألعابي',
    t_nlearn: 'تعلّم الأرقام', t_count: 'عُدّ', t_add: 'اجمع', t_sub: 'اطرح',
    t_animal: 'أين الحيوان؟', t_speak: 'قل اسمه', t_first: 'الحرف الأول', t_arrange: 'رتّب الجملة', t_memory: 'الذاكرة'
  };

  // ===== قائمة كل المقاطع الصوتية (للتسجيل) =====
  function clips() {
    const out = [];
    L.forEach(([c, n], i) => out.push({ key: 'l' + i, text: n, show: c, group: '١. أسماء الحروف', phase: 1 }));
    L.forEach(([c], i) => HAR.forEach(([k]) => out.push({ key: `h${i}${k}`, text: harakah(c, k), show: harakah(c, k), group: '٢. الحروف بالحركات (فتحة، ضمة، كسرة)', phase: 1 })));
    W.forEach(x => out.push({ key: x.id, text: x.w, show: x.e + ' ' + x.w, group: '٣. الكلمات', phase: 1 }));
    NUM.forEach((n, i) => out.push({ key: 'n' + i, text: n, show: AD(i) + ' — ' + n, group: '٤. الأرقام', phase: 1 }));
    Object.entries(P).forEach(([k, t]) => out.push({ key: 'p_' + k, text: t, show: t, group: k.startsWith('t_') ? '٦. أسماء الأقسام والألعاب' : '٥. جمل التعليمات والتشجيع', phase: 1 }));
    S.forEach((t, i) => out.push({ key: 's' + i, text: t, show: t, group: '٧. الجمل', phase: 1 }));
    L.forEach(([c], i) => ['a', 'u', 'i'].forEach(k => out.push({ key: `m${i}${k}`, text: madd(c, k), show: madd(c, k), group: '٨. المدود (المرحلة الثانية)', phase: 2 })));
    L.forEach(([c], i) => TAN.forEach(([k]) => out.push({ key: `t${i}${k}`, text: tanween(c, k), show: tanween(c, k), group: '٩. التنوين (المرحلة الثانية)', phase: 2 })));
    return out;
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
  const textOf = key => { const c = clips().find(x => x.key === key); return c ? c.text : ''; };
  let cur = null, curUrl = null, gen = 0;
  function stop() {
    gen++;
    if (cur) { try { cur.pause(); } catch (e) { } cur = null; }
    if (curUrl) { URL.revokeObjectURL(curUrl); curUrl = null; }
    if (window.NATIVE_TTS) NATIVE_TTS.stop(); else if (window.speechSynthesis) speechSynthesis.cancel();
  }
  const playUrl = (url, my) => new Promise(res => {
    const a = new Audio(url); cur = a;
    a.onended = a.onerror = () => res();
    a.play().catch(() => res());
    const chk = setInterval(() => { if (my !== gen) { clearInterval(chk); res(); } else if (a.ended) clearInterval(chk); }, 300);
  });
  function tts(text, my) {
    return new Promise(res => {
      if (!text) return res();
      if (window.NATIVE_TTS) { NATIVE_TTS.speak(text, 0.85).then(res, res); return; }
      if (!window.speechSynthesis) return res();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ar-SA'; u.rate = 0.85;
      const v = speechSynthesis.getVoices().find(v => /^ar/i.test(v.lang)); if (v) u.voice = v;
      u.onend = u.onerror = () => res();
      speechSynthesis.speak(u);
      setTimeout(res, 6000 + text.length * 200);
    });
  }
  async function say(key, text) {
    if (!key && text) { const c = clips().find(x => x.text === text); if (c) key = c.key; }
    stop(); const my = gen;
    const rec = key && await VS.get(key).catch(() => null);
    if (my !== gen) return;
    if (rec && rec.blob) { curUrl = URL.createObjectURL(rec.blob); return playUrl(curUrl, my); }
    const f = key && window.LEARN_AUDIO && LEARN_AUDIO[key];
    if (f) return playUrl('audio/learn/' + f, my);
    return tts(text != null ? text : textOf(key), my);
  }
  const sayTTS = text => { stop(); return tts(text, gen); };
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
  const praise = () => (Math.random() < 0.5 ? say('p_good') : say('p_great'));

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
  const LEARN_ROUTES = ['kids', 'literacy', 'start', 'learnrec'];
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

  window.LEARN = { sayTTS, L, HAR, TAN, W, S, NUM, P, ANIMALS, AD, harakah, tanween, madd, forms, clips, VS, say, sayAll, stop, tone, burst, praise, prog, mark, shuffle, pick, shell, pad, listen, sameWord, esc, syncMode };
})();
