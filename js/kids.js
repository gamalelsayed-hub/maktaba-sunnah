/* 🧒 قسم الأطفال: حروفي (طريقة نور البيان)، أكتب، أرقامي، قرآني (تلقين)، ألعابي — ملوّن وبالصوت ونجوم مكافأة */
(() => {
  const V = APP.views, { L, W, S, NUM, AD, esc } = LEARN;
  const say = LEARN.say;
  // الفاتحة ثم جزء عمّ كاملاً من الناس إلى النبأ (ترتيب الحفظ المعتاد)
  const SUR = [1, ...Array.from({ length: 37 }, (_, i) => 114 - i)];

  // زر الخروج: ضغط مطوّل (حتى لا يخرج الطفل بالخطأ)
  const exitBtn = '<button class="lr-ic" data-exit aria-label="خروج (اضغط مطولاً)">🚪</button>';
  function bindExit(el) {
    const x = el.querySelector('[data-exit]'); if (!x) return;
    let t = null;
    const start = e => { e.preventDefault(); x.classList.add('holding'); t = setTimeout(() => { location.hash = '#/start'; }, 1500); };
    const end = () => { clearTimeout(t); x.classList.remove('holding'); };
    x.addEventListener('pointerdown', start); x.addEventListener('pointerup', end); x.addEventListener('pointerleave', end);
    x.addEventListener('click', () => say('p_exit_hold'));
  }

  async function rounds(b, n, mk) { let ok = 0; for (let r = 0; r < n; r++) { if (LIT.gone(b)) return LIT.gone(b); if (await mk(r)) ok++; } return ok; }

  // ===== الألعاب =====
  const GAMES = {
    animal: { ic: '🐾', t: 'أين الحيوان؟', run: b => rounds(b, 5, () => { const an = LEARN.THEMES.find(t => t.id === 'animals').words; const w = LEARN.shuffle(an)[0]; return LIT.choose(b, { hear: [w.id], options: LEARN.pick(an, 4, w).map(x => ({ html: `<span class="lr-pic sm">${x.e}</span>`, ok: x === w })), cols: 2 }); }) },
    speak: { ic: '🎤', t: 'قل اسمه', run: b => rounds(b, 4, () => sayName(b, LEARN.shuffle(LEARN.PICW.filter(w => !/\s/.test(w.w)))[0])) },
    first: { ic: '🔤', t: 'الحرف الأول', run: b => rounds(b, 5, () => { const w = LEARN.shuffle(LEARN.PICW)[0]; const ls = LEARN.pick(L.map(x => x[0]), 3, w.first); return LIT.choose(b, { prompt: 'p_first_letter', show: `<span class="lr-pic" data-say="${w.id}">${w.e}</span>`, hear: [w.id], options: ls.map(c => ({ html: `<span class="lr-g2">${c}</span>`, ok: c === w.first })) }); }) },
    arrange: { ic: '🧩', t: 'رتّب الجملة', run: b => rounds(b, 3, () => { const x = LEARN.shuffle(LEARN.SK)[0]; return LIT.arrange(b, x.id, x.t).then(() => true); }) },
    memory: { ic: '🃏', t: 'الذاكرة', run: b => memory(b) },
    missing: { ic: '❓', t: 'الحرف الناقص', run: b => rounds(b, 5, () => missing(b)) },
    build: { ic: '🔠', t: 'كوّن الكلمة', run: b => rounds(b, 4, () => build(b)) },
    pop: { ic: '🎈', t: 'البالونات', run: b => rounds(b, 5, () => pop(b)) },
    tf: { ic: '✅', t: 'صح أم خطأ', run: b => rounds(b, 6, () => trueFalse(b)) },
    color: { ic: '🎨', t: 'الألوان', run: b => rounds(b, 5, () => { const cs = LEARN.THEMES.find(t => t.id === 'colors').words; const w = LEARN.shuffle(cs)[0]; return LIT.choose(b, { prompt: 'p_color', hear: [w.id], cols: 2, options: LEARN.pick(cs, 4, w).map(x => ({ html: `<span class="lr-pic sm">${x.e}</span>`, ok: x === w })) }); }) },
    more: { ic: '⚖️', t: 'أكثر وأقل', run: b => rounds(b, 5, () => more(b)) },
    order: { ic: '🚂', t: 'رتب الأرقام', run: b => rounds(b, 4, () => order(b)) },
    match: { ic: '🔗', t: 'صل الكلمة بالصورة', run: b => rounds(b, 3, () => match(b)) }
  };
  const GKEY = { animal: 't_animal', speak: 't_speak', first: 't_first', arrange: 't_arrange', memory: 't_memory', missing: 't_missing', build: 't_build', pop: 't_pop', tf: 't_tf', color: 't_color', more: 't_more', order: 't_order', match: 't_match', learn: 't_nlearn', count: 't_count', add: 't_add', sub: 't_sub' };
  const plain = w => w.replace(/[\u064B-\u0652]/g, '');
  const short = () => LEARN.PICW.filter(x => !/\s/.test(x.w) && x.w.length >= 3 && x.w.length <= 5);

  // الحرف الناقص: كلمة ناقصة حرفاً، يختار الطفل الحرف
  function missing(b) {
    const w = LEARN.shuffle(short())[0], k = Math.floor(Math.random() * w.w.length), c = w.w[k];
    const norm = ch => /[أإآ]/.test(ch) ? 'ا' : ch === 'ة' ? 'ه' : ch === 'ى' ? 'ي' : ch;
    const shown = w.w.slice(0, k) + '<b class="hl">_</b>' + w.w.slice(k + 1);
    const opts = LEARN.pick(L.map(x => x[0]).filter(x => x !== norm(c)), 2).concat([c]);
    return LIT.choose(b, { prompt: 'p_missing', hear: [w.id], show: `<div class="lr-pic sm">${w.e}</div><div class="lr-w2">${shown}</div>`, options: LEARN.shuffle(opts).map(x => ({ html: `<span class="lr-g2">${x}</span>`, ok: x === c })) });
  }
  // كوّن الكلمة: يضغط الحروف بالترتيب
  function build(b) {
    return LIT.gone(b) || new Promise(res => {
      const w = LEARN.shuffle(short())[0], letters = w.w.split(''), order = LEARN.shuffle(letters.map((_, k) => k)); let pos = 0;
      b.innerHTML = `<div class="lr-step"><div class="lr-pic" data-say="${w.id}">${w.e}</div><div class="lr-line">${letters.map(() => '<span class="lr-slot sm"></span>').join('')}</div>
        <div class="lr-chips">${order.map(k => `<button class="lr-chip big" data-k="${k}">${letters[k]}</button>`).join('')}</div></div>`;
      LIT.bindSay(b); say('p_build').then(() => say(w.id));
      const slots = b.querySelectorAll('.lr-slot');
      b.querySelectorAll('[data-k]').forEach(ch => ch.onclick = async () => {
        const k = +ch.dataset.k;
        if (letters[k] === letters[pos]) { slots[pos].textContent = letters[k]; slots[pos].classList.add('ok'); ch.disabled = true; ch.classList.add('used'); pos++; LEARN.tone('ok');
          if (pos === letters.length) { LEARN.burst(b.querySelector('.lr-line')); await LEARN.praise(); await say(w.id); res(true); } }
        else { ch.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => ch.classList.remove('bad'), 500); }
      });
    });
  }
  // البالونات: حروف تطير، يفقع الطفل حرف الصوت الذي سمعه
  function pop(b) {
    return LIT.gone(b) || new Promise(res => {
      const i = Math.floor(Math.random() * 28), ks = LEARN.pick(L.map((_, k) => k), 5, i);
      b.innerHTML = `<div class="lr-step"><button class="lr-ic xl" data-hear>🔊</button><div class="pop-sky">${ks.map((k, n) => `<button class="pop-b" data-k="${k}" style="--x:${8 + n * 18}%;--d:${5 + (n % 3) * 1.4}s;--h:${n * 67 % 360}"><span>${L[k][0]}</span></button>`).join('')}</div></div>`;
      const hear = () => say('l' + i);
      b.querySelector('[data-hear]').onclick = hear;
      say('p_pop').then(hear);
      let tries = 0;
      b.querySelectorAll('.pop-b').forEach(x => x.onclick = async () => {
        if (+x.dataset.k === i) { x.classList.add('popped'); LEARN.tone('win'); LEARN.burst(b.querySelector('.pop-sky')); b.querySelectorAll('.pop-b').forEach(y => y.disabled = true); await LEARN.praise(); res(tries === 0); }
        else { tries++; x.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => x.classList.remove('bad'), 400); }
      });
    });
  }
  // صح أم خطأ: صورة واسم مسموع
  function trueFalse(b) {
    const w = LEARN.shuffle(LEARN.PICW)[0], right = Math.random() < 0.5, heard = right ? w : LEARN.shuffle(LEARN.PICW.filter(x => x !== w))[0];
    return LIT.choose(b, { prompt: 'p_true_false', hear: [heard.id], show: `<span class="lr-pic">${w.e}</span>`, cols: 2, options: [{ html: '<span class="lr-pic sm">✅</span>', ok: right }, { html: '<span class="lr-pic sm">❌</span>', ok: !right }] });
  }
  function more(b) {
    const e1 = LEARN.shuffle(EMO)[0], a = 1 + Math.floor(Math.random() * 8); let c = 1 + Math.floor(Math.random() * 8); if (c === a) c = a < 8 ? a + 1 : a - 1;
    return LIT.choose(b, { prompt: 'p_more', cols: 2, options: [{ html: objs(a, e1), ok: a > c }, { html: objs(c, e1), ok: c > a }] });
  }
  function order(b) {
    return LIT.gone(b) || new Promise(res => {
      const start = Math.floor(Math.random() * 6), nums = Array.from({ length: 5 }, (_, k) => start + k), sh = LEARN.shuffle(nums); let pos = 0;
      b.innerHTML = `<div class="lr-step"><div class="train">🚂${nums.map(() => '<span class="lr-slot sm"></span>').join('')}</div><div class="lr-chips">${sh.map(n => `<button class="lr-chip big" data-n="${n}">${AD(n)}</button>`).join('')}</div></div>`;
      say('p_order');
      const slots = b.querySelectorAll('.lr-slot');
      b.querySelectorAll('[data-n]').forEach(ch => ch.onclick = async () => {
        const n = +ch.dataset.n;
        if (n === nums[pos]) { slots[pos].textContent = AD(n); slots[pos].classList.add('ok'); ch.disabled = true; ch.classList.add('used'); say('n' + n); pos++;
          if (pos === nums.length) { LEARN.burst(b.querySelector('.train')); await LEARN.praise(); res(true); } }
        else { ch.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => ch.classList.remove('bad'), 400); }
      });
    });
  }
  // صل الكلمة بصورتها: يضغط كلمة ثم صورتها
  function match(b) {
    return LIT.gone(b) || new Promise(res => {
      const ws = LEARN.shuffle(LEARN.PICW).slice(0, 4), pics = LEARN.shuffle(ws);
      b.innerHTML = `<div class="lr-step"><div class="match-g"><div class="match-col">${ws.map((w, k) => `<button class="lr-chip big" data-w="${k}">${esc(w.w)}</button>`).join('')}</div><div class="match-col">${pics.map(w => `<button class="lr-tile" data-p="${ws.indexOf(w)}"><span class="lr-pic sm">${w.e}</span></button>`).join('')}</div></div></div>`;
      say('p_match');
      let sel = null, got = 0;
      b.querySelectorAll('[data-w]').forEach(x => x.onclick = () => { b.querySelectorAll('[data-w]').forEach(y => y.classList.remove('sel')); sel = +x.dataset.w; x.classList.add('sel'); say(ws[sel].id); });
      b.querySelectorAll('[data-p]').forEach(x => x.onclick = async () => {
        if (sel == null) return;
        const wb = b.querySelector(`[data-w="${sel}"]`);
        if (+x.dataset.p === sel) { x.classList.add('good'); x.disabled = true; wb.classList.remove('sel'); wb.classList.add('used'); wb.disabled = true; sel = null; LEARN.tone('ok');
          if (++got === ws.length) { LEARN.burst(b.querySelector('.match-g')); await LEARN.praise(); res(true); } }
        else { x.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => x.classList.remove('bad'), 400); }
      });
    });
  }

  // ===== الأشكال =====
  const SHC = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#fdd835', '#e91e63', '#8e24aa', '#00acc1'];
  function shapeSvg(id, col) {
    const f = `fill="${col}"`;
    const body = { circle: `<circle cx="50" cy="50" r="42" ${f}/>`, square: `<rect x="12" y="12" width="76" height="76" rx="4" ${f}/>`, triangle: `<polygon points="50,8 94,90 6,90" ${f}/>`, rect: `<rect x="4" y="26" width="92" height="48" rx="4" ${f}/>`,
      star: `<polygon points="50,5 61,38 96,38 68,59 78,93 50,72 22,93 32,59 4,38 39,38" ${f}/>`, heart: `<path d="M50 88 C10 60 4 34 22 20 C36 10 48 18 50 28 C52 18 64 10 78 20 C96 34 90 60 50 88Z" ${f}/>`,
      diamond: `<polygon points="50,4 92,50 50,96 8,50" ${f}/>`, crescent: `<path d="M64 8 A44 44 0 1 0 64 92 A34 34 0 1 1 64 8Z" ${f}/>` }[id];
    return `<svg viewBox="0 0 100 100" class="shp">${body}</svg>`;
  }
  async function shapesLesson(b, back) {
    const S = LEARN_DATA.SHAPES;
    for (const [i, [id]] of S.entries()) await LIT.stepNext(b, `<div data-say="sh_${id}">${shapeSvg(id, SHC[i])}</div><div class="lr-cap" data-say="sh_${id}">${S[i][1]}</div>`, bb => { LIT.bindSay(bb); say('sh_' + id); });
    await rounds(b, 6, () => { const k = R0(S.length), [id] = S[k]; return LIT.choose(b, { prompt: 'p_shape', hear: ['sh_' + id], cols: 2, options: LEARN.pick(S.map((_, j) => j), 4, k).map(j => ({ html: shapeSvg(S[j][0], SHC[(j + 3) % 8]), ok: j === k })) }); });
    return LIT.done(b, 'kids', 'shp', back);
  }
  const R0 = n => Math.floor(Math.random() * n);

  // ===== أدعية اليوم =====
  async function duasView(sh, id, k) {
    const DU = LEARN_DATA.DUAS, list = '#/kids/duas';
    if (id == null) {
      const b = sh('🤲 أدعية يومي', '#/kids');
      b.innerHTML = `${LX.who('read', 'md')}<div class="lr-list">${DU.map((d, i) => `<a class="lr-sline ${k['du' + i] ? 'done' : ''}" href="${list}/${i}" data-sk="duw${i}"><span style="font-size:30px">${d.e}</span><span style="font-family:'Plex Arabic';font-size:18px">${esc(d.w)}</span>${k['du' + i] ? ' <i class="lr-ok">✓</i>' : ''}</a>`).join('')}
        <a class="lr-sline" href="${list}/quiz" style="justify-content:center">🎯 اختبر نفسك</a></div>`;
      LIT.sayTiles(b); return;
    }
    if (id === 'quiz') {
      const b = sh('🎯 أدعية يومي', list);
      await rounds(b, 6, () => { const i = R0(DU.length), d = DU[i]; return LIT.choose(b, { show: `<div style="font-size:60px">${d.e}</div><div class="lr-cap" style="font-size:22px">${esc(d.w)}</div>`, hear: ['duw' + i], options: LEARN.pick(DU.map((_, j) => j), 3, i).map(j => ({ html: `<span style="font:700 20px/1.7 Naskh,serif">${esc(DU[j].t)}</span>`, ok: j === i })) }); });
      return LIT.done(b, 'kids', 'duq', list);
    }
    const i = +id, d = DU[i]; if (!d) { location.hash = list; return; }
    const b = sh(d.e + ' ' + d.w, list);
    await LIT.stepNext(b, `${LX.who('read', 'md')}<div style="font-size:64px">${d.e}</div><div class="lr-cap" style="font-size:22px" data-say="duw${i}">${esc(d.w)}</div><div class="lr-sent" data-say="du${i}">${esc(d.t)}</div><div class="muted">رواه ${esc(d.src)}</div>`, bb => { LIT.bindSay(bb); say('duw' + i).then(() => say('du' + i)); });
    await LEARN.mark('kids', 'du' + i);
    location.hash = i < DU.length - 1 ? `${list}/${i + 1}` : list;
  }

  // ===== القصص =====
  async function story(b, st, back) {
    await say('stt_' + st.id);
    for (const pg of st.pages) await LIT.stepNext(b, `<div class="lr-pic st-pic">${pg.e}</div><div class="lr-sent st-sent" data-say="${pg.id}">${pg.t.split(' ').map((w, k) => `<span style="animation-delay:${0.3 + k * 0.35}s">${esc(w)}</span>`).join(' ')}</div><div class="lr-dots">${st.pages.map(x => `<i class="${x === pg ? 'on' : ''}"></i>`).join('')}</div>`, bb => { LIT.bindSay(bb); say(pg.id); });
    const pg = LEARN.shuffle(st.pages.filter(x => x.t.split(' ').length >= 3))[0];
    if (pg) await LIT.arrange(b, pg.id, pg.t);
    return LIT.done(b, 'kids', 'st_' + st.id, back);
  }

  function sayName(b, w) {
    return LIT.gone(b) || new Promise(res => {
      b.innerHTML = `<div class="lr-step"><div class="lr-pic" data-say="${w.id}">${w.e}</div>
        <button class="lr-mic" data-mic>🎤</button><div class="lr-heard" id="heard"></div>
        <div class="lr-foot"><button class="lr-btn ghost" data-skip>⬅</button></div></div>`;
      LIT.bindSay(b);
      say('p_say_name');
      const mic = b.querySelector('[data-mic]'), hd = b.querySelector('#heard');
      let tries = 0;
      mic.onclick = () => {
        mic.classList.add('on'); hd.textContent = '…';
        LEARN.listen((t, fin) => {
          hd.textContent = t;
          if (LEARN.sameWord(t, w.w)) { mic.classList.remove('on'); LEARN.tone('win'); LEARN.burst(mic); LEARN.praise().then(() => say(w.id)).then(() => res(true)); return true; }
          return false;
        }, () => {
          mic.classList.remove('on');
          if (!b.isConnected || hd.dataset.ok) return;
          if (!LEARN.sameWord(hd.textContent, w.w)) { tries++; say('p_try_again').then(() => say(w.id)); if (tries >= 2) b.querySelector('[data-skip]').classList.add('lr-pulse'); }
          else hd.dataset.ok = 1;
        });
      };
      b.querySelector('[data-skip]').onclick = () => { LEARN.stop(); res(false); };
    });
  }

  function memory(b) {
    return LIT.gone(b) || new Promise(res => {
      const ws = LEARN.shuffle(LEARN.PICW).slice(0, 6);
      const cards = LEARN.shuffle([...ws, ...ws].map((w, k) => ({ w, k })));
      b.innerHTML = `<div class="lr-step"><div class="mem-grid">${cards.map((c, i) => `<button class="mem" data-i="${i}"><span>${c.w.e}</span></button>`).join('')}</div></div>`;
      say('p_memory');
      let open = [], found = 0, lock = false;
      b.querySelectorAll('.mem').forEach(m => m.onclick = () => {
        if (lock || m.classList.contains('up')) return;
        const c = cards[+m.dataset.i]; m.classList.add('up'); say(c.w.id); open.push([m, c]);
        if (open.length === 2) {
          lock = true;
          const [[m1, c1], [m2, c2]] = open; open = [];
          if (c1.w === c2.w) { setTimeout(() => { m1.classList.add('got'); m2.classList.add('got'); LEARN.tone('ok'); lock = false; if (++found === ws.length) { LEARN.burst(b.querySelector('.mem-grid')); LEARN.praise().then(() => res(true)); } }, 500); }
          else setTimeout(() => { m1.classList.remove('up'); m2.classList.remove('up'); lock = false; }, 1100);
        }
      });
    });
  }

  // ===== الأرقام =====
  const EMO = ['🍎', '⭐', '🐟', '🌹', '🍌', '🐝', '🎈', '🚗'];
  const objs = (n, e) => `<div class="num-objs">${Array.from({ length: n }, () => `<span>${e}</span>`).join('')}</div>`;
  const NUMS = {
    learn: { ic: '🔢', t: 'تعلّم الأرقام', run: async b => { for (let n = 0; n <= 10; n++) await LIT.stepNext(b, `<div class="lr-glyph" data-say="n${n}">${AD(n)}</div>${objs(n, EMO[n % EMO.length])}<div class="lr-cap" data-say="n${n}">${NUM[n]}</div>`, bb => { LIT.bindSay(bb); say('n' + n); }); return true; } },
    count: { ic: '🧮', t: 'عُدّ', run: b => rounds(b, 5, () => { const n = 1 + Math.floor(Math.random() * 9), e = LEARN.shuffle(EMO)[0]; return LIT.choose(b, { prompt: 'p_count', show: objs(n, e), options: LEARN.pick(Array.from({ length: 10 }, (_, k) => k + 1), 3, n).map(x => ({ html: `<span class="lr-g2">${AD(x)}</span>`, ok: x === n })) }); }) },
    add: { ic: '➕', t: 'اجمع', run: b => rounds(b, 5, () => { const a = 1 + Math.floor(Math.random() * 5), c = 1 + Math.floor(Math.random() * 4), e = LEARN.shuffle(EMO)[0]; return LIT.choose(b, { prompt: 'p_add', show: `<div class="num-eq">${objs(a, e)}<b>+</b>${objs(c, e)}</div><div class="lr-cap">${AD(a)} + ${AD(c)} = ؟</div>`, options: LEARN.pick(Array.from({ length: 10 }, (_, k) => k + 1), 3, a + c).map(x => ({ html: `<span class="lr-g2">${AD(x)}</span>`, ok: x === a + c })) }); }) },
    sub: { ic: '➖', t: 'اطرح', run: b => rounds(b, 5, () => { const a = 3 + Math.floor(Math.random() * 6), c = 1 + Math.floor(Math.random() * (a - 1)), e = LEARN.shuffle(EMO)[0]; return LIT.choose(b, { prompt: 'p_sub', show: `<div class="num-objs">${Array.from({ length: a }, (_, k) => `<span class="${k >= a - c ? 'gone' : ''}">${e}</span>`).join('')}</div><div class="lr-cap">${AD(a)} − ${AD(c)} = ؟</div>`, options: LEARN.pick(Array.from({ length: 9 }, (_, k) => k), 3, a - c).map(x => ({ html: `<span class="lr-g2">${AD(x)}</span>`, ok: x === a - c })) }); }) }
  };

  async function finish(b, id, back) {
    return LIT.done(b, 'kids', id, back);
  }

  V.kids = async (el, [sec, id, sub, sub2]) => {
    const p = await LEARN.prog(), k = p.kids || {};
    const sh = (title, back, repeat) => { const b = LEARN.shell(el, { theme: 'kids', title, back, stars: p.stars || 0, repeat, exit: back ? '' : exitBtn }); bindExit(el); return b; };
    const tiles = (b, T) => { b.innerHTML = `<div class="kd-home">${T.map(([href, ic, key, done], i) => `<a class="kd-tile k${(i % 5) + 1}" href="${href}" data-sk="${key}"><span>${ic}</span><b>${LEARN.P[key.slice(2)] || ''}</b>${done ? '<i class="lr-ok">⭐</i>' : ''}</a>`).join('')}</div>`; LIT.sayTiles(b); };
    if (sec === 'watch') return LX.watchView(sh, 'kids', '#/kids', id, k);
    if (sec === 'math') return LMATH.view({ sh, area: 'kids', base: '#/kids/numbers', list: '#/kids/math', id, pg: k });
    if (sec === 'duas') return duasView(sh, id, k);
    if (sec === 'exam') return LIT.gradTest(sh('🏆 اختبار البطل', '#/kids'), 'kids');
    if (sec === 'dict' || sec === 'review') { if (!(await LIT.reading({ sec, id, sub, area: 'kids', base: '#/kids', pg: k, sh }))) location.hash = '#/kids'; return; }
    if (sec === 'shapes') return shapesLesson(sh('🔷 الأشكال', '#/kids/numbers'), '#/kids/numbers');
    if (sec === 'parents') return LX.parents(sh('🔒 للأهل', '#/kids'));
    if (sec === 'rest' || await LX.overLimit()) return LX.rest(sh('🌙', ''));
    if (sec === 'letters') { location.replace('#/kids/read/letters' + (id != null ? '/' + id : '')); return; }
    if (!sec) {
      const b = sh('🌟 عالم الصغار', '');
      const hi = sessionStorage.getItem('kids-hi') !== new Date().toDateString();
      if (hi) { sessionStorage.setItem('kids-hi', new Date().toDateString()); setTimeout(() => say('p_char_hi'), 300); }
      const nMiss = Object.keys(p.miss || {}).length;
      tiles(b, [['#/learnme', '🗺️', 'p_t_map'], ['#/kids/watch', '🎬', 'p_t_watch'], ['#/kids/read', '🔤', 'p_t_letters'], ['#/kids/words', '🖼️', 'p_t_words'], ['#/kids/dict', '🎧', 'p_l_dict'], ['#/kids/stories', '📚', 'p_t_stories'], ['#/kids/sent', '🧩', 'p_l_sent'],
        ['#/kids/write', '✍️', 'p_t_write'], ['#/kids/numbers', '🔢', 'p_t_numbers'], ['#/kids/quran', '📖', 'p_t_quran'], ['#/kids/duas', '🤲', 'p_t_duas'], ['#/kids/games', '🎮', 'p_t_games'], ...(nMiss ? [['#/kids/review', '🔁', 'p_l_review']] : []), ['#/kids/exam', '🏆', 'p_t_exam', k.kgrad]]);
      return;
    }
    if (sec === 'read') {
      if (id == null) {
        const b = sh('🔤 حروفي', '#/kids');
        const n = re => Object.keys(k).filter(x => re.test(x)).length;
        b.innerHTML = `<div class="lr-path">${[['letters', '🔤', 'l_letters', n(/^l\d/), 28], ['madd', '〰️', 'l_madd', n(/^m\d/), 28], ['tanween', 'ًٌ', 'l_tanween', n(/^t\d/), 28], ['decode', '🔡', 'l_decode', n(/^d_(sukun|shadda|shams|verbs)_/), LEARN.DECODE.filter(d => !d.unit).reduce((a, d) => a + LIT.chunk(d.words, 6).length, 0)], ['rules', '✍️', 'l_rules', n(/^d_(lamalif|taa|alifm|hamza|aa|tanw2)_/), LEARN.DECODE.filter(d => d.unit === 'rules').reduce((a, d) => a + LIT.chunk(d.words, 6).length, 0)]]
          .map(([r, ic, key, d, tot], i) => `<a class="lr-level" href="#/kids/read/${r}" data-sk="p_${key}"><span class="lr-num">${AD(i + 1)}</span><span class="lr-lic">${ic}</span><b>${LEARN.P[key]}</b><span class="lr-bar"><i style="width:${Math.round(d / tot * 100)}%"></i></span><small>${AD(d)} / ${AD(tot)}</small></a>`).join('')}</div>`;
        LIT.sayTiles(b); return;
      }
      if (!(await LIT.reading({ sec: id, id: sub, sub: sub2, area: 'kids', base: '#/kids/read', pg: k, sh }))) location.hash = '#/kids/read';
      return;
    }
    if (sec === 'words' || sec === 'sent') { if (!(await LIT.reading({ sec, id, sub, area: 'kids', base: '#/kids', pg: k, sh }))) location.hash = '#/kids'; return; }
    if (sec === 'stories') {
      if (id == null) {
        const b = sh('📚 قصصي', '#/kids');
        b.innerHTML = `${LX.who('read', 'md')}<div class="lr-grid g2">${LEARN.STORIES.map((st, i) => `<a class="lr-tile kd sur ${k['st_' + st.id] ? 'done' : ''}" href="#/kids/stories/${st.id}" style="--h:${i * 53 % 360}" data-sk="stt_${st.id}"><span class="lr-emo" style="font-size:44px">${st.ic}</span><b>${st.t}</b>${k['st_' + st.id] ? '<i class="lr-ok">⭐</i>' : ''}</a>`).join('')}</div>`;
        LIT.sayTiles(b); return;
      }
      const st = LEARN.STORIES.find(x => x.id === id); if (!st) { location.hash = '#/kids/stories'; return; }
      return story(sh(st.ic + ' ' + st.t, '#/kids/stories'), st, '#/kids/stories');
    }
    if (sec === 'write') {
      const pre = 'wr';
      if (id == null) {
        const b = sh('✍️ أكتب', '#/kids');
        b.innerHTML = `<div class="lr-grid">${L.map(([c], i) => `<a class="lr-tile kd ${k[pre + i] ? 'done' : ''}" href="#/kids/${sec}/${i}" style="--h:${i * 13 % 360}"><span class="lr-g2">${c}</span>${k[pre + i] ? '<i class="lr-ok">⭐</i>' : ''}</a>`).join('')}</div>`;
        return;
      }
      const i = +id, back = '#/kids/' + sec;
      const b = sh(L[i][0], back, () => say('l' + i));
      await LIT.watch(b, L[i][0]);
      await LIT.writeStep(b, L[i][0], { guide: true, prompt: 'p_trace' });
      await LIT.writeStep(b, L[i][0], { guide: true, prompt: 'p_trace' });
      await LIT.writeStep(b, L[i][0], { guide: false, prompt: 'p_write', model: 'l' + i });
      return finish(b, 'wr' + i, back);
    }
    if (sec === 'numbers' || sec === 'games') {
      const SET = sec === 'numbers' ? NUMS : GAMES, back = '#/kids/' + sec;
      if (id == null || !SET[id]) {
        const b = sh(sec === 'numbers' ? '🔢 أرقامي' : '🎮 ألعابي', '#/kids');
        tiles(b, Object.entries(SET).map(([g, o]) => [`#/kids/${sec}/${g}`, o.ic, 'p_' + GKEY[g], k[sec[0] + g]]).concat(sec === 'numbers' ? [['#/kids/math', '💯', 'p_l_math', k.mt_tens], ['#/kids/shapes', '🔷', 'p_l_shapes', k.shp]] : []));
        return;
      }
      const b = sh(SET[id].ic + ' ' + SET[id].t, back);
      await SET[id].run(b);
      return finish(b, sec[0] + id, back);
    }
    if (sec === 'quran') return quran(sh, 'kids', '#/kids', id, k);
  };

  // قرآني: الفاتحة وجزء عمّ بالتلقين (الحصري المعلّم) — مشترك بين الأطفال ومحو الأمية
  async function quran(sh, area, base, id, pg) {
    const list = `${base}/quran`;
    if (id == null) {
      const b = sh(area === 'kids' ? '📖 قرآني' : '📖 جزء عمّ', base);
      b.innerHTML = `<div class="lr-grid g2">${SUR.map((s, i) => `<a class="lr-tile kd sur ${pg['q' + s] ? 'done' : ''}" href="${list}/${s}" style="--h:${i * 37 % 360}"><b>${AR.SURAHS[s - 1]}</b><small>${AD(s)}</small>${pg['q' + s] ? '<i class="lr-ok">⭐</i>' : ''}</a>`).join('')}</div>`;
      return;
    }
    const s = +id;
    const b = sh('سورة ' + AR.SURAHS[s - 1], list);
    const ay = (await DB.byIndex('items', 'bookId', 'quran')).filter(a => a.surah === s).sort((x, y) => x.ayah - y.ayah);
    const heard = new Set(); wasQ = true;
    b.innerHTML = `${LX.who('read', 'md')}<div class="kd-quran">
      <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap"><button class="lr-btn ok" data-all>▶ لقّنّي السورة</button><button class="lr-btn ghost" data-stop>⏹</button></div>
      <div class="muted" style="text-align:center;margin:8px 0">👆 اضغط على الآية لتسمعها ثم ردّدها</div>
      ${ay.map(a => `<button class="kd-ayah" data-a="${a.ayah}" data-card="quran:${s}:${a.ayah}"><span>${esc(noBasm(a.text, s, a.ayah))}</span> <i>${AD(a.ayah)}</i></button>`).join('')}</div>`;
    const opt = { reciter: 'husary-muallim', noBasmala: s !== 1 };
    const on = a => { b.querySelectorAll('.kd-ayah').forEach(y => y.classList.toggle('on', +y.dataset.a === a)); const el = b.querySelector(`[data-a="${a}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    b.querySelector('[data-all]').onclick = () => {
      LEARN.stop(); on(null);
      QA.play(ay.map(a => [s, a.ayah]), Object.assign({}, opt, { onEnd: () => LIT.done(b, area, 'q' + s, list) }));
    };
    b.querySelector('[data-stop]').onclick = () => QA.stop();
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => {
      LEARN.stop(); const a = +x.dataset.a; on(a); heard.add(a); QA.play([[s, a]], opt);
      if (heard.size === ay.length) LEARN.mark(area, 'q' + s);
    });
  }
  window.KIDSQ = { quran, SUR };
  function noBasm(t, s, a) { const w = t.split(' '); return s !== 1 && a === 1 && w.length > 4 && /^ب/.test(w[0]) && /رحيم/.test(AR.normalize(w[3])) ? w.slice(4).join(' ') : t; }
  let wasQ = false;
  window.addEventListener('hashchange', () => { const q = /^#\/(kids|literacy)\/quran\/\d/.test(location.hash); if (wasQ && window.QA) QA.stop(); wasQ = q; });
})();
