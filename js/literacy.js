/* ✍️ محو الأمية: تعليم القراءة والكتابة للكبار — كل التعليمات بالصوت والصور، والكتابة باللمس مع التصحيح.
   الهدف: أن يصل المتعلم لمستوى يستطيع به استعمال قسم الكبار. ودروس الحروف نفسها تُستعمل في قسم الأطفال. */
(() => {
  const V = APP.views, { L, W, S, AD, esc } = LEARN;
  const strip = w => w.replace(/[\u064B-\u0652]/g, '');
  const say = LEARN.say;
  const NEXT = '<button class="lr-btn ok big" data-next aria-label="التالي">⬅</button>';
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // ===== خطوات الدروس (كل خطوة ترجع وعداً ينتهي عند إتمامها) =====
  const gone = b => !b.isConnected && new Promise(() => { }); // ترك الدرس: تتوقف السلسلة
  function stepNext(b, html, onShow) {
    return gone(b) || new Promise(res => {
      b.innerHTML = `<div class="lr-step">${html}<div class="lr-foot">${NEXT}</div></div>`;
      b.querySelector('[data-next]').onclick = () => { LEARN.stop(); res(); };
      onShow && onShow(b);
    });
  }
  function bindSay(b) { b.querySelectorAll('[data-say]').forEach(x => x.addEventListener('click', () => { x.classList.add('lr-pulse'); setTimeout(() => x.classList.remove('lr-pulse'), 600); say(x.dataset.say, x.dataset.t); })); }

  const showLetter = (b, i) => stepNext(b, `<div class="lr-glyph" data-say="l${i}">${L[i][0]}</div><div class="lr-cap">${L[i][1]}</div>`,
    bb => { bindSay(bb); say('l' + i); });

  // مجموعة بطاقات يضغط المتعلم على كل واحدة ويسمعها قبل المتابعة
  const showSet = (b, items, intro) => gone(b) || new Promise(res => {
    b.innerHTML = `<div class="lr-step"><div class="lr-row3">${items.map((x, k) => `<button class="lr-tile" data-k="${k}"><span class="lr-g2">${x.g}</span><small>${x.n || ''}</small></button>`).join('')}</div>
      <div class="lr-hint">👆</div><div class="lr-foot">${NEXT}</div></div>`;
    const seen = new Set(), nx = b.querySelector('[data-next]'); nx.disabled = true;
    b.querySelectorAll('[data-k]').forEach(t => t.onclick = () => { const k = +t.dataset.k; seen.add(k); t.classList.add('seen'); say(items[k].key); if (seen.size === items.length) nx.disabled = false; });
    nx.onclick = () => { LEARN.stop(); res(); };
    if (intro) say(intro);
  });
  const showHarakat = (b, i) => showSet(b, LEARN.HAR.map(([k, , n]) => ({ g: LEARN.harakah(L[i][0], k), n, key: `h${i}${k}` })), 'p_harakat');

  // سؤال اختيار: يسمع المتعلم شيئاً (أو يقرأه) ثم يختار
  function choose(b, { prompt, hear, show, options, cols, mid }) {
    mid = mid || (hear && /^(l\d|w\d|v_|d_)/.test(hear[0]) ? hear[0] : null);
    return gone(b) || new Promise(res => {
      b.innerHTML = `<div class="lr-step">${show ? `<div class="lr-q">${show}</div>` : `<div class="row" style="align-items:center;gap:6px">${LX.who('listen', 'sm2')}<button class="lr-ic xl" data-hear>🔊</button></div>`}
        <div class="lr-opts ${cols === 2 ? 'c2' : ''}">${options.map((o, k) => `<button class="lr-tile opt" data-o="${k}">${o.html}</button>`).join('')}</div></div>`;
      const play = () => hear && say(hear[0], hear[1]);
      const hb = b.querySelector('[data-hear]'); if (hb) hb.onclick = play;
      (prompt ? say(prompt) : Promise.resolve()).then(() => wait(150)).then(play);
      let tries = 0;
      b.querySelectorAll('[data-o]').forEach(t => t.onclick = async () => {
        const o = options[+t.dataset.o];
        if (o.ok) { t.classList.add('good'); LEARN.tone('ok'); LEARN.burst(t); LEARN.react(Math.random() < 0.5 ? 'clap' : 'thumbs'); b.querySelectorAll('[data-o]').forEach(x => x.disabled = true); if (mid && tries === 0) LEARN.miss(mid, -1); await LEARN.praise(); res(tries === 0); }
        else { if (!tries && mid) LEARN.miss(mid, 1); tries++; t.classList.add('bad'); LEARN.tone('bad'); LEARN.react('think'); setTimeout(() => t.classList.remove('bad'), 500); await say('p_try_again'); play(); }
      });
    });
  }

  function writeStep(b, text, { guide, prompt, model }) {
    return gone(b) || new Promise(res => {
      b.innerHTML = `<div class="lr-step"><div class="row" style="align-items:center;gap:8px">${LX.who('write', 'sm2')}${model ? `<div class="lr-model" data-say="${model}">${text}</div>` : ''}</div><div class="lr-padhost"></div><div class="lr-foot"><button class="lr-btn ghost" data-skip>تخطَّ ⬅</button></div></div>`;
      bindSay(b);
      say(prompt);
      let fails = 0;
      LEARN.pad(b.querySelector('.lr-padhost'), text, {
        guide, onCheck: async (sc, ok) => {
          if (ok) { LEARN.tone('win'); LEARN.burst(b.querySelector('.lr-padhost')); LEARN.react('thumbs'); await LEARN.praise(); res(true); }
          else { fails++; LEARN.tone('bad'); LEARN.react('think'); await say('p_try_again'); if (fails >= 3) b.querySelector('[data-skip]').classList.add('lr-pulse'); }
        }
      });
      b.querySelector('[data-skip]').onclick = () => { LEARN.stop(); res(false); };
    });
  }

  // شاهد رسم الحرف متحركاً قبل أن يكتبه
  function watch(b, c) {
    return gone(b) || new Promise(res => {
      b.innerHTML = `<div class="lr-step"><div class="row" style="align-items:center;gap:4px">${LX.who('point', 'sm2 flip')}<div class="lr-dl"></div></div><div class="lr-foot">${NEXT}</div></div>`;
      const nx = b.querySelector('[data-next]'); nx.onclick = () => { LEARN.stop(); res(); };
      say('p_watch'); LX.drawLetter(b.querySelector('.lr-dl'), c);
    });
  }

  async function done(b, area, id, back) {
    if (!b.isConnected) return;
    await LEARN.mark(area, id);
    LEARN.tone('win');
    b.innerHTML = `<div class="lr-step lr-done">${LX.who('celebrate', 'lg')}<div class="lr-trophy">🏆</div><div class="lr-cap">⭐</div>
      <div class="lr-foot"><a class="lr-btn ok big" href="${back}">⬅</a></div></div>`;
    LEARN.burst(b.querySelector('.lr-trophy'));
    say(Math.random() < 0.5 ? 'p_done' : 'p_char_done');
  }

  // ===== درس حرف (مشترك بين الكبار والأطفال) =====
  async function letterLesson(b, i, area, back) {
    const c = L[i][0];
    await showLetter(b, i);
    await showHarakat(b, i);
    const near = LEARN.pick(L.map((_, k) => k), 3, i);
    await choose(b, { prompt: 'p_choose_letter', hear: ['l' + i], options: near.map(k => ({ html: `<span class="lr-g2">${L[k][0]}</span>`, ok: k === i })) });
    for (const k of LEARN.shuffle(['a', 'u', 'i']).slice(0, 2))
      await choose(b, { prompt: 'p_choose_letter', hear: [`h${i}${k}`], options: LEARN.shuffle(['a', 'u', 'i']).map(x => ({ html: `<span class="lr-g2">${LEARN.harakah(c, x)}</span>`, ok: x === k })) });
    // كلمة تبدأ بالحرف
    const w = LEARN.shuffle(LEARN.PICW).find(x => x.first === c);
    if (w) await stepNext(b, `<div class="lr-pic" data-say="${w.id}">${w.e}</div><div class="lr-word" data-say="${w.id}"><b class="hl">${w.w[0]}</b>${w.w.slice(1)}</div>`, bb => { bindSay(bb); say(w.id); });
    await watch(b, c);
    await writeStep(b, c, { guide: true, prompt: 'p_trace' });
    await writeStep(b, c, { guide: false, prompt: 'p_write', model: 'l' + i });
    await done(b, area, 'l' + i, back);
  }

  async function formsLesson(b, i, back) {
    const c = L[i][0], f = LEARN.forms(c);
    const ws = LEARN.shuffle(LEARN.PICW.filter(x => x.w.includes(c) || (c === 'ا' && /[اأ]/.test(x.w)))).slice(0, 3);
    await stepNext(b, `<div class="lr-forms">${[['iso', 'وحده'], ['ini', 'أول الكلمة'], ['med', 'وسط الكلمة'], ['fin', 'آخر الكلمة']].map(([k, n]) => `<div class="lr-tile" data-say="l${i}"><span class="lr-g2">${f[k]}</span><small>${n}</small></div>`).join('')}</div>
      ${ws.map(w => `<div class="lr-wline" data-say="${w.id}"><span>${w.e}</span> ${hl(w.w, c)}</div>`).join('')}`, bb => { bindSay(bb); say('l' + i); });
    const target = ws[0];
    if (target) {
      const others = LEARN.shuffle(LEARN.PICW.filter(x => !x.w.includes(c) && !(c === 'ا' && /[اأإآ]/.test(x.w)))).slice(0, 2);
      await choose(b, { prompt: null, show: `<span class="lr-g2">${c}</span>`, options: LEARN.shuffle([target, ...others]).map(x => ({ html: `<span class="lr-w2">${x.w}</span>`, ok: x === target })) });
    }
    await done(b, 'lit', 'f' + i, back);
  }
  const hl = (w, c) => esc(w).split('').map(ch => ch === c || (c === 'ا' && ch === 'أ') ? `<b class="hl">${ch}</b>` : ch).join('');

  // حروف الكلمة أزراراً: كل حرف بحركته، والضغط يُسمع اسم الحرف
  function chips(w) {
    return (w.match(/[\u0621-\u064A][\u064B-\u0652]*|\s/g) || []).map(p => {
      if (/\s/.test(p)) return '<span style="width:14px"></span>';
      const c = p[0], k = L.findIndex(x => x[0] === c || (x[0] === 'ا' && /[أإآ]/.test(c)) || (x[0] === 'ه' && c === 'ة') || (x[0] === 'ي' && c === 'ى'));
      return `<button class="lr-chip" ${k >= 0 ? `data-say="l${k}"` : ''}>${p}</button>`;
    }).join('');
  }
  // درس عام لقائمة كلمات: عرض كل كلمة، ثم اسمع واختر، ثم اقرأ واختر الصورة، ثم اكتب
  async function listLesson(b, items, o) {
    if (o.intro) await say(o.intro);
    for (const w of items) await stepNext(b, `${w.e ? `<div class="lr-pic" data-say="${w.id}">${w.e}</div>` : ''}<div class="lr-word" data-say="${w.id}">${esc(w.w)}</div><div class="lr-spell">${chips(w.w)}</div>`, bb => { bindSay(bb); say(w.id); });
    const pool = items.length >= 3 ? items : items.concat(LEARN.shuffle(LEARN.ALLW.filter(x => !items.includes(x))).slice(0, 3));
    for (const w of LEARN.shuffle(items)) await choose(b, { prompt: 'p_choose_word', hear: [w.id], options: LEARN.pick(pool, 3, w).map(x => ({ html: `<span class="lr-w2">${esc(x.w)}</span>`, ok: x === w })) });
    for (const w of LEARN.shuffle(items.filter(x => x.e)).slice(0, 4)) await choose(b, { prompt: 'p_choose_pic', mid: w.id, show: `<span class="lr-w2">${esc(w.w)}</span>`, options: LEARN.pick(LEARN.PICW, 3, w).map(x => ({ html: `<span class="lr-pic sm">${x.e}</span>`, ok: x === w })) });
    for (const w of LEARN.shuffle(items.filter(x => strip(x.w).replace(/\s/g, '').length <= 6)).slice(0, 2)) await writeStep(b, strip(w.w), { guide: true, prompt: 'p_write_word', model: w.id });
    await done(b, o.area, o.id, o.back);
  }
  const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

  // المدود والتنوين لحرف: يسمع الثلاثة، ثم يميّز بينها، ثم يميّز القصير من الطويل
  async function maddLesson(b, i, area, back, kind) {
    const c = L[i][0], ks = ['a', 'u', 'i'];
    const g = kind === 'm' ? k => LEARN.madd(c, k) : k => LEARN.tanween(c, k);
    await showSet(b, ks.map(k => ({ g: g(k), key: `${kind}${i}${k}` })), kind === 'm' ? 'p_madd_intro' : 'p_tanween_intro');
    for (const k of LEARN.shuffle(ks).slice(0, 2)) await choose(b, { prompt: 'p_choose_letter', hear: [`${kind}${i}${k}`], options: LEARN.shuffle(ks).map(x => ({ html: `<span class="lr-g2">${g(x)}</span>`, ok: x === k })) });
    for (const k of LEARN.shuffle(ks).slice(0, 2)) {
      const longIt = Math.random() < 0.5;
      await choose(b, { prompt: 'p_short_long', hear: [longIt ? `${kind}${i}${k}` : `h${i}${k}`], cols: 2, options: LEARN.shuffle([{ html: `<span class="lr-g2">${LEARN.harakah(c, k)}</span>`, ok: !longIt }, { html: `<span class="lr-g2">${g(k)}</span>`, ok: longIt }]) });
    }
    await writeStep(b, strip(g('a')), { guide: true, prompt: 'p_trace' });
    await done(b, area, kind + i, back);
  }

  async function signsLesson(b, items, id, back) {
    for (const x of items) await stepNext(b, `<div class="lr-sign s-${x.c}" data-say="${x.id}">${esc(x.t)}</div>`, bb => { bindSay(bb); say(x.id); });
    for (const x of LEARN.shuffle(items)) await choose(b, { prompt: 'p_read_sign', hear: [x.id], options: LEARN.pick(LEARN.SIGNS, 3, x).map(y => ({ html: `<span class="lr-sign sm s-${y.c}">${esc(y.t)}</span>`, ok: y === x })) });
    await done(b, 'lit', id, back);
  }

  // قراءة جملة ثم ترتيبها (لأي جملة لها مفتاح تسجيل)
  async function sentLesson(b, key, text, area, id, back, write) {
    await stepNext(b, `<div class="lr-sent" data-say="${key}">${esc(text)}</div>`, bb => { bindSay(bb); say(key); });
    await arrange(b, key, text);
    if (write) await writeStep(b, text.split(' ').slice(0, 2).join(' '), { guide: false, prompt: 'p_write_sentence', model: key });
    await done(b, area, id, back);
  }

  function arrange(b, key, text) {
    if (typeof key === 'number') { text = S[key]; key = 's' + key; }
    return gone(b) || new Promise(res => {
      const words = text.split(' ');
      const order = LEARN.shuffle(words.map((w, k) => k)); let pos = 0;
      b.innerHTML = `<div class="lr-step"><button class="lr-ic xl" data-hear>🔊</button><div class="lr-line" id="arLine">${words.map(() => '<span class="lr-slot"></span>').join('')}</div>
        <div class="lr-chips">${order.map(k => `<button class="lr-chip big" data-k="${k}">${esc(words[k])}</button>`).join('')}</div></div>`;
      const hearIt = () => say(key);
      b.querySelector('[data-hear]').onclick = hearIt;
      say('p_arrange').then(hearIt);
      const slots = b.querySelectorAll('.lr-slot');
      b.querySelectorAll('[data-k]').forEach(ch => ch.onclick = async () => {
        const k = +ch.dataset.k;
        if (words[k] === words[pos]) { slots[pos].textContent = words[k]; slots[pos].classList.add('ok'); ch.disabled = true; ch.classList.add('used'); pos++; LEARN.tone('ok');
          if (pos === words.length) { LEARN.burst(b.querySelector('#arLine')); LEARN.react('clap'); await LEARN.praise(); res(); } }
        else { ch.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => ch.classList.remove('bad'), 500); }
      });
    });
  }

  // ===== ✍️ الإملاء: يسمع الكلمة ثم يركّبها من الحروف، ثم (للكبار) يكتبها بيده بلا نموذج =====
  const letterSplit = w => strip(w).replace(/\s/g, '').split('');
  function tilesDictation(b, w) {
    return gone(b) || new Promise(res => {
      const letters = letterSplit(w.w), extra = LEARN.pick(L.map(x => x[0]).filter(c => !letters.includes(c)), 2);
      const pool = LEARN.shuffle([...letters.map((c, k) => ({ c, k })), ...extra.map(c => ({ c, k: -1 }))]); let pos = 0, fails = 0;
      b.innerHTML = `<div class="lr-step"><div class="row" style="align-items:center;gap:6px">${LX.who('listen', 'sm2')}<button class="lr-ic xl" data-hear>🔊</button></div>
        <div class="lr-line dict">${letters.map(() => '<span class="lr-slot sm"></span>').join('')}</div>
        <div class="lr-chips">${pool.map((x, n) => `<button class="lr-chip big" data-n="${n}">${x.c}</button>`).join('')}</div>
        <div class="lr-foot"><button class="lr-btn ghost" data-hint>💡</button></div></div>`;
      const hear = () => say(w.id);
      b.querySelector('[data-hear]').onclick = hear; say('p_dictation').then(hear);
      const slots = b.querySelectorAll('.lr-slot');
      b.querySelector('[data-hint]').onclick = () => { if (pos < letters.length) { const n = pool.findIndex((x, i) => x.c === letters[pos] && !b.querySelector(`[data-n="${i}"]`).disabled); b.querySelector(`[data-n="${n}"]`).classList.add('lr-pulse'); } };
      b.querySelectorAll('[data-n]').forEach(ch => ch.onclick = async () => {
        const x = pool[+ch.dataset.n];
        if (x.c === letters[pos]) { slots[pos].textContent = x.c; slots[pos].classList.add('ok'); ch.disabled = true; ch.classList.add('used'); pos++; LEARN.tone('ok');
          if (pos === letters.length) { b.querySelector('.dict').innerHTML = `<span class="lr-w2">${esc(strip(w.w))}</span>`; LEARN.react('clap'); if (!fails) LEARN.miss(w.id, -1); await LEARN.praise(); res(!fails); } }
        else { if (!fails) LEARN.miss(w.id, 1); fails++; ch.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => ch.classList.remove('bad'), 400); }
      });
    });
  }
  function handDictation(b, w) {
    return gone(b) || new Promise(res => {
      const t = strip(w.w);
      b.innerHTML = `<div class="lr-step"><div class="row" style="align-items:center;gap:6px">${LX.who('write', 'sm2')}<button class="lr-ic xl" data-hear>🔊</button></div><div class="lr-padhost"></div><div class="lr-model hidden" id="dm">${esc(t)}</div><div class="lr-foot"><button class="lr-btn ghost" data-skip>تخطَّ ⬅</button></div></div>`;
      const hear = () => say(w.id); b.querySelector('[data-hear]').onclick = hear; say('p_dictation_hand').then(hear);
      let fails = 0;
      LEARN.pad(b.querySelector('.lr-padhost'), t, { guide: false, pass: 0.48, onCheck: async (sc, ok) => {
        if (ok) { LEARN.tone('win'); LEARN.react('thumbs'); b.querySelector('#dm').classList.remove('hidden'); await LEARN.praise(); res(true); }
        else { fails++; LEARN.tone('bad'); LEARN.react('think'); if (fails >= 2) b.querySelector('#dm').classList.remove('hidden'); await say('p_try_again'); }
      } });
      b.querySelector('[data-skip]').onclick = () => { LEARN.stop(); res(false); };
    });
  }
  const DICT = () => LEARN.PICW.filter(x => !/\s/.test(x.w) && letterSplit(x.w).length >= 2 && letterSplit(x.w).length <= 6);
  async function dictationLesson(b, items, area, id, back) {
    for (const w of items) await tilesDictation(b, w);
    if (area === 'lit') for (const w of LEARN.shuffle(items).slice(0, 2)) await handDictation(b, w);
    await done(b, area, id, back);
  }

  // ===== 🔁 المراجعة الذكية: ما أخطأ فيه المتعلم =====
  function itemOf(id) {
    let m = /^l(\d+)$/.exec(id); if (m) return { id, w: L[+m[1]][0], kind: 'l' };
    const w = LEARN.ALLW.find(x => x.id === id); if (w) return Object.assign({ kind: 'w' }, w);
    for (const d of LEARN.DECODE) { const x = d.words.find(y => y.id === id); if (x) return Object.assign({ kind: 'd' }, x); }
    return null;
  }
  async function reviewLesson(b, back, area) {
    const p = await LEARN.prog(), ids = Object.entries(p.miss || {}).sort((a, c) => c[1] - a[1]).map(x => x[0]);
    const items = ids.map(itemOf).filter(Boolean).slice(0, 8);
    if (!items.length) { b.innerHTML = `<div class="lr-step lr-done">${LX.who('thumbs', 'lg')}<div class="lr-cap">لا توجد أخطاء للمراجعة 👏</div><div class="lr-foot"><a class="lr-btn ok big" href="${back}">⬅</a></div></div>`; return; }
    for (const it of LEARN.shuffle(items)) {
      const pool = it.kind === 'l' ? L.map((x, k) => ({ id: 'l' + k, w: x[0] })) : it.kind === 'd' ? LEARN.DECODE.flatMap(d => d.words) : LEARN.ALLW;
      const opts = LEARN.pick(pool.filter(x => x.id !== it.id), 2).concat([pool.find(x => x.id === it.id) || it]);
      await choose(b, { prompt: it.kind === 'l' ? 'p_choose_letter' : 'p_choose_word', hear: [it.id], mid: it.id, options: LEARN.shuffle(opts).map(x => ({ html: `<span class="${it.kind === 'l' ? 'lr-g2' : 'lr-w2'}">${esc(x.w)}</span>`, ok: x.id === it.id })) });
    }
    await done(b, area, 'rv' + new Date().toDateString(), back);
  }

  // ===== 📰 نص من الحياة: يقرأ النص (بلا تشكيل) ثم يجيب عن أسئلة الفهم =====
  async function textLesson(b, x, area, back) {
    const doc = `<div class="doc doc-${x.k}" data-say="tx_${x.id}">${x.l.map(l => `<div>${esc(l)}</div>`).join('')}</div>`;
    await stepNext(b, `${LX.who('read', 'sm2')}${doc}<div class="muted">👆 اقرأ النص، واضغط عليه لتسمعه</div>`, bb => { bindSay(bb); say('p_read_text'); });
    for (const [j, q] of x.q.entries()) await choose(b, { show: `${doc}<div class="lr-cap" style="font-size:22px;margin-top:10px">❓ ${esc(q[0])}</div>`, hear: [`txq_${x.id}_${j}`], cols: q.length === 3 ? 2 : 0, options: LEARN.shuffle(q.slice(1).map((o, n) => ({ html: `<span style="font:700 20px 'Plex Arabic',sans-serif">${esc(o)}</span>`, ok: n === 0 }))) });
    await done(b, area, 'tx_' + x.id, back);
  }

  // ===== 🎓 الاختبار النهائي (للكبار: شهادة محو الأمية، وللأطفال: «اختبار البطل») =====
  async function gradTest(b, area = 'lit') {
    await say('p_grad_intro');
    let ok = 0;
    const PW = LEARN.PICW, kids = area === 'kids';
    const qs = [
      ...LEARN.shuffle(L.map((_, k) => k)).slice(0, 3).map(k => () => choose(b, { hear: ['l' + k], options: LEARN.pick(L.map((_, x) => x), 3, k).map(x => ({ html: `<span class="lr-g2">${L[x][0]}</span>`, ok: x === k })) })),
      ...LEARN.shuffle(L.map((_, k) => k)).slice(0, 2).map(k => () => { const h = ['a', 'u', 'i'][Math.floor(Math.random() * 3)]; return choose(b, { hear: [`h${k}${h}`], options: ['a', 'u', 'i'].map(x => ({ html: `<span class="lr-g2">${LEARN.harakah(L[k][0], x)}</span>`, ok: x === h })) }); }),
      ...LEARN.shuffle(LEARN.DECODE.flatMap(d => d.words)).slice(0, 2).map(w => () => choose(b, { hear: [w.id], options: LEARN.pick(LEARN.DECODE.flatMap(d => d.words), 3, w).map(x => ({ html: `<span class="lr-w2">${esc(x.w)}</span>`, ok: x === w })) })),
      ...LEARN.shuffle(PW).slice(0, 3).map(w => () => choose(b, { show: `<span class="lr-w2">${w.w}</span>`, options: LEARN.pick(PW, 3, w).map(x => ({ html: `<span class="lr-pic sm">${x.e}</span>`, ok: x === w })) })),
      ...LEARN.shuffle(PW).slice(0, 2).map(w => () => choose(b, { show: `<span class="lr-pic">${w.e}</span>`, options: LEARN.pick(PW, 3, w).map(x => ({ html: `<span class="lr-w2">${x.w}</span>`, ok: x === w })) })),
      ...LEARN.shuffle(DICT()).slice(0, 2).map(w => () => tilesDictation(b, w)),
      ...(kids ? [] : [
        ...LEARN.shuffle(LEARN.SIGNS).slice(0, 2).map(x => () => choose(b, { show: `<span class="lr-sign s-${x.c}">${esc(x.t)}</span>`, options: LEARN.pick(LEARN.SIGNS, 3, x).map(y => ({ html: `<span class="lr-w2" style="font-size:26px">${esc(y.t)}</span>`, ok: y === x })) })),
        ...LEARN.shuffle(LEARN_DATA.TEXTS).slice(0, 2).map(x => () => { const q = x.q[0]; return choose(b, { show: `<div class="doc doc-${x.k}">${x.l.map(l => `<div>${esc(l)}</div>`).join('')}</div><div class="lr-cap" style="font-size:22px">❓ ${esc(q[0])}</div>`, options: LEARN.shuffle(q.slice(1).map((o, n) => ({ html: `<span style="font:700 20px 'Plex Arabic',sans-serif">${esc(o)}</span>`, ok: n === 0 }))) }); })
      ])
    ];
    for (const q of qs) if (await q()) ok++;
    const pass = ok >= Math.ceil(qs.length * 0.8);
    if (pass) await LEARN.mark(area, kids ? 'kgrad' : 'grad');
    b.innerHTML = `<div class="lr-step lr-done">${LX.who(pass ? 'certificate' : 'think', 'lg')}<div class="lr-trophy">${pass ? '🎓' : '📚'}</div><div class="lr-cap">${AD(ok)} / ${AD(qs.length)}</div>
      <div class="lr-foot">${pass ? '<a class="lr-btn ok" href="#/learnme/certs">📜 الشهادة</a>' : ''}${pass && !kids ? '<a class="lr-btn ok big" href="#/" data-adult>📚 قسم الكبار</a>' : ''}<a class="lr-btn big" href="${kids ? '#/kids' : '#/literacy'}">🏠</a></div></div>`;
    const a = b.querySelector('[data-adult]'); if (a) a.onclick = () => { try { localStorage.setItem('audience', 'adult'); } catch (e) { } };
    say(pass ? (kids ? 'p_kgrad_pass' : 'p_grad_pass') : 'p_grad_fail');
  }

  // ===== شاشات القراءة المشتركة (الكبار والأطفال) =====
  const tick = (pg, id) => pg[id] ? '<i class="lr-ok">✓</i>' : '';
  function grid(b, base, pg, pre, items) { b.innerHTML = `<div class="lr-grid">${items.map((g, i) => `<a class="lr-tile ${pg[pre + i] ? 'done' : ''}" href="${base}/${i}"><span class="lr-g2">${g}</span>${tick(pg, pre + i)}</a>`).join('')}</div>`; }
  function sayTiles(b) { b.querySelectorAll('[data-sk]').forEach(a => a.addEventListener('pointerdown', () => say(a.dataset.sk))); }
  const themesFor = area => LEARN.THEMES.filter(t => t.aud === 'b' || t.aud === (area === 'kids' ? 'k' : 'a'));

  // يرجع true إن عالج المسار
  async function reading(o) {
    const { sec, id, sub, area, base, pg, sh } = o;
    const back = base;
    if (sec === 'letters' || sec === 'forms' || sec === 'madd' || sec === 'tanween') {
      const pre = { letters: 'l', forms: 'f', madd: 'm', tanween: 't' }[sec];
      const glyph = i => sec === 'madd' ? LEARN.madd(L[i][0], 'a') : sec === 'tanween' ? LEARN.tanween(L[i][0], 'u') : L[i][0];
      const title = { letters: '🔤 الحروف', forms: '🔗 أشكال الحروف', madd: '〰️ المدود', tanween: 'ًٌ التنوين' }[sec];
      if (id == null) { grid(sh(title, back), `${base}/${sec}`, pg, pre, L.map((_, i) => glyph(i))); return true; }
      const i = +id, bk = `${base}/${sec}`, b = sh(glyph(i), bk, () => say('l' + i));
      if (sec === 'letters') return letterLesson(b, i, area, bk), true;
      if (sec === 'forms') return formsLesson(b, i, bk), true;
      return maddLesson(b, i, area, bk, pre), true;
    }
    if (sec === 'decode' || sec === 'rules') {
      const SETS = LEARN.DECODE.filter(d => (d.unit || 'basic') === (sec === 'rules' ? 'rules' : 'basic'));
      if (id == null) {
        const b = sh(sec === 'rules' ? '✍️ قواعد الكتابة' : '🔡 السكون والشدة', back);
        b.innerHTML = `<div class="lr-path">${SETS.map((d, k) => { const n = chunk(d.words, 6).length, dn = Object.keys(pg).filter(x => x.startsWith(`d_${d.id}_`)).length; return `<a class="lr-level" href="${base}/${sec}/${d.id}" data-sk="dt_${d.id}"><span class="lr-num">${AD(k + 1)}</span><span class="lr-lic" style="font-family:Naskh">${d.ic}</span><b>${d.t}</b><span class="lr-bar"><i style="width:${Math.round(dn / n * 100)}%"></i></span><small>${AD(dn)} / ${AD(n)}</small></a>`; }).join('')}</div>`;
        sayTiles(b); return true;
      }
      const d = SETS.find(x => x.id === id); if (!d) return false;
      const parts = chunk(d.words, 6), bk = `${base}/${sec}/${d.id}`;
      if (sub == null) { const b = sh(d.t, `${base}/${sec}`, () => say(d.intro)); b.innerHTML = `<div class="lr-grid g2">${parts.map((ws, c) => `<a class="lr-tile ${pg[`d_${d.id}_${c}`] ? 'done' : ''}" href="${bk}/${c}"><span class="lr-w2" style="font-size:24px">${ws.slice(0, 3).map(x => x.w).join(' ')}</span>${tick(pg, `d_${d.id}_${c}`)}</a>`).join('')}</div>`; say(d.intro); return true; }
      listLesson(sh(d.t, bk), parts[+sub] || [], { area, id: `d_${d.id}_${sub}`, back: bk, intro: +sub === 0 ? d.intro : null }); return true;
    }
    if (sec === 'words') {
      const TH = themesFor(area);
      if (id == null) {
        const b = sh('🖼️ الكلمات', back);
        b.innerHTML = `<div class="lr-grid g2">${TH.map(t => { const n = chunk(t.words, 6).length, dn = Object.keys(pg).filter(x => x.startsWith(`w_${t.id}_`)).length; return `<a class="lr-tile th ${dn >= n ? 'done' : ''}" href="${base}/words/${t.id}" data-sk="th_${t.id}"><span class="lr-emo">${t.ic}</span><b>${t.t}</b><small>${AD(dn)} / ${AD(n)}</small></a>`; }).join('')}</div>`;
        sayTiles(b); return true;
      }
      const t = TH.find(x => x.id === id); if (!t) return false;
      const parts = chunk(t.words, 6), bk = `${base}/words/${t.id}`;
      if (sub == null) { const b = sh(t.ic + ' ' + t.t, `${base}/words`, () => say('th_' + t.id)); b.innerHTML = `<div class="lr-grid g2">${parts.map((ws, c) => `<a class="lr-tile ${pg[`w_${t.id}_${c}`] ? 'done' : ''}" href="${bk}/${c}"><span class="lr-emo">${ws.map(x => x.e || '▫️').join('')}</span>${tick(pg, `w_${t.id}_${c}`)}</a>`).join('')}</div>`; say('th_' + t.id); return true; }
      listLesson(sh(t.ic + ' ' + t.t, bk), parts[+sub] || [], { area, id: `w_${t.id}_${sub}`, back: bk }); return true;
    }
    if (sec === 'dict') {
      const parts = chunk(DICT(), 6), bk = `${base}/dict`;
      if (id == null) { const b = sh('🎧 اسمع واكتب', back, () => say('p_dictation')); b.innerHTML = `${LX.who('listen', 'md')}<div class="lr-grid g2">${parts.map((ws, c) => `<a class="lr-tile ${pg['dc' + c] ? 'done' : ''}" href="${bk}/${c}"><span class="lr-num" style="margin:0 auto">${AD(c + 1)}</span><small>${AD(ws.length)} كلمات</small>${tick(pg, 'dc' + c)}</a>`).join('')}</div>`; return true; }
      dictationLesson(sh('🎧 اسمع واكتب', bk), parts[+id] || [], area, 'dc' + id, bk); return true;
    }
    if (sec === 'texts') {
      const T = LEARN_DATA.TEXTS, bk = `${base}/texts`;
      if (id == null) { const b = sh('📰 نصوص من الحياة', back); b.innerHTML = `<div class="lr-grid g2">${T.map(x => `<a class="lr-tile th ${pg['tx_' + x.id] ? 'done' : ''}" href="${bk}/${x.id}" data-sk="txt_${x.id}"><span class="lr-emo" style="font-size:40px">${x.ic}</span><b>${esc(x.t)}</b>${tick(pg, 'tx_' + x.id)}</a>`).join('')}</div>`; sayTiles(b); return true; }
      const x = T.find(y => y.id === id); if (!x) return false;
      textLesson(sh(x.ic + ' ' + x.t, bk), x, area, bk); return true;
    }
    if (sec === 'review') { reviewLesson(sh('🔁 راجع أخطائي', back), back, area); return true; }
    if (sec === 'signs') {
      const parts = chunk(LEARN.SIGNS, 5), bk = `${base}/signs`;
      if (id == null) { const b = sh('🪧 اللافتات', back); b.innerHTML = `<div class="lr-grid g2">${parts.map((xs, c) => `<a class="lr-tile ${pg['g' + c] ? 'done' : ''}" href="${bk}/${c}"><span class="lr-sign sm s-${xs[0].c}">${esc(xs[0].t)}</span><small>${xs.slice(1).map(x => esc(x.t)).join(' · ')}</small>${tick(pg, 'g' + c)}</a>`).join('')}</div>`; return true; }
      signsLesson(sh('🪧', bk), parts[+id] || [], 'g' + id, bk); return true;
    }
    if (sec === 'sent') {
      const list = area === 'kids' ? LEARN.SK.map(x => [x.id, x.t]) : [...LEARN.S.map((t, i) => ['s' + i, t]), ...LEARN.SA.map(x => [x.id, x.t])];
      const bk = `${base}/sent`;
      if (id == null) { const b = sh('📝 الجمل', back); b.innerHTML = `<div class="lr-list">${list.map(([k, t], i) => `<a class="lr-sline ${pg['se_' + k] ? 'done' : ''}" href="${bk}/${i}"><span class="lr-num">${AD(i + 1)}</span>${esc(t)}${pg['se_' + k] ? ' <i class="lr-ok">✓</i>' : ''}</a>`).join('')}</div>`; return true; }
      const [k, t] = list[+id] || list[0];
      sentLesson(sh('📝', bk, () => say(k)), k, t, area, 'se_' + k, bk, area !== 'kids'); return true;
    }
    return false;
  }

  // ===== شاشة محو الأمية =====
  const exitBtn = '<button class="lr-ic" data-switch aria-label="الأقسام">🔄</button>';
  V.literacy = async (el, [sec, id, sub]) => {
    const p = await LEARN.prog(), lit = p.lit || {};
    const sh = (title, back, repeat) => { const b = LEARN.shell(el, { theme: 'lit', title, back, stars: p.stars || 0, repeat, exit: back ? '' : exitBtn }); const sw = el.querySelector('[data-switch]'); if (sw) sw.onclick = () => LX.switcher('lit'); return b; };
    if (!sec) {
      const n = re => Object.keys(lit).filter(k => re.test(k)).length;
      const TH = themesFor('lit'), nW = TH.reduce((a, t) => a + chunk(t.words, 6).length, 0), nD = LEARN.DECODE.reduce((a, d) => a + chunk(d.words, 6).length, 0), nS = LEARN.S.length + LEARN.SA.length;
      const nR = LEARN.DECODE.filter(d => d.unit === 'rules').reduce((a, d) => a + chunk(d.words, 6).length, 0), nB = nD - nR, nDc = Math.ceil(LEARN.PICW.filter(x => !/\s/.test(x.w)).length / 6);
      const lv = [['letters', '🔤', 'l_letters', n(/^l\d/), 28], ['forms', '🔗', 'l_forms', n(/^f\d/), 28], ['madd', '〰️', 'l_madd', n(/^m\d/), 28], ['tanween', 'ًٌ', 'l_tanween', n(/^t\d/), 28],
        ['decode', '🔡', 'l_decode', n(/^d_(sukun|shadda|shams|verbs)_/), nB], ['rules', '✍️', 'l_rules', n(/^d_(lamalif|taa|alifm|hamza|aa|tanw2)_/), nR], ['words', '🖼️', 'l_words', n(/^w_/), nW], ['dict', '🎧', 'l_dict', n(/^dc\d/), nDc],
        ['signs', '🪧', 'l_signs', n(/^g\d/), Math.ceil(LEARN.SIGNS.length / 5)], ['math', '🔢', 'l_math', n(/^mt_/), LMATH.ADULT.length], ['sent', '📝', 'l_sent', n(/^se_/), nS], ['texts', '📰', 'l_texts', n(/^tx_/), LEARN_DATA.TEXTS.length], ['stories', '📚', 'l_stories', n(/^st_|^bk_/), LEARN.STORIES.length + (window.LIB_BOOKS || []).reduce((a, x) => a + x.s.length, 0)],
        ['quran', '📖', 'l_quran', n(/^q\d/), 38], ['grad', '🎓', 'l_grad', lit.grad ? 1 : 0, 1]];
      const nMiss = Object.keys(p.miss || {}).length;
      const b = sh('تعلّم القراءة والكتابة', '', () => say('p_lit_intro'));
      b.innerHTML = `<a class="lr-me" href="#/learnme" data-sk="p_t_me">${LX.who('face', 'sm')}<b>🏅 إنجازاتي</b><span>🔥 ${AD(LX.streak(p))}</span><span>⭐ ${AD(p.stars || 0)}</span></a><a class="lr-me vd" href="#/literacy/watch" data-sk="p_t_watch">${LX.who('point', 'sm')}<b>🎬 شاهد وتعلّم</b><span>▶</span></a>${nMiss ? `<a class="lr-me rv" href="#/literacy/review" data-sk="p_l_review">${LX.who('think', 'sm')}<b>🔁 راجع أخطائي</b><span>${AD(nMiss)}</span></a>` : ''}<div class="lr-path">${lv.map(([k, ic, key, d, tot], i) => `<a class="lr-level" href="#/literacy/${k}" data-sk="p_${key}"><span class="lr-num">${AD(i + 1)}</span><span class="lr-lic">${ic}</span><b>${LEARN.P[key]}</b><span class="lr-bar"><i style="width:${Math.round(d / tot * 100)}%"></i></span><small>${AD(d)} / ${AD(tot)}</small></a>`).join('')}</div>`;
      sayTiles(b);
      say('p_lit_intro');
      return;
    }
    if (sec === 'grad') return gradTest(sh('🎓 الاختبار', '#/literacy'));
    if (sec === 'stories' || sec === 'books') { if (!(await LIB.route(sh, 'lit', '#/literacy', sec, id, sub, lit))) location.replace('#/literacy/stories'); return; }
    if (sec === 'quran') return KIDSQ.quran(sh, 'lit', '#/literacy', id, lit);
    if (sec === 'math') return LMATH.view({ sh, area: 'lit', base: '#/literacy', id, pg: lit });
    if (sec === 'watch') return LX.watchView(sh, 'lit', '#/literacy', id, lit);
    if (!(await reading({ sec, id, sub, area: 'lit', base: '#/literacy', pg: lit, sh }))) location.replace('#/literacy');
  };

  window.LIT = { gradTest, itemOf, dictationLesson, reviewLesson, watch, gone, letterLesson, writeStep, choose, arrange, stepNext, bindSay, done, reading, listLesson, chunk, sayTiles, chips };
})();
