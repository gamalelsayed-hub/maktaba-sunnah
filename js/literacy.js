/* ✍️ محو الأمية: تعليم القراءة والكتابة للكبار — كل التعليمات بالصوت والصور، والكتابة باللمس مع التصحيح.
   الهدف: أن يصل المتعلم لمستوى يستطيع به استعمال قسم الكبار. ودروس الحروف نفسها تُستعمل في قسم الأطفال. */
(() => {
  const V = APP.views, { L, W, S, AD, esc } = LEARN;
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

  const showHarakat = (b, i) => gone(b) || new Promise(res => {
    const c = L[i][0];
    b.innerHTML = `<div class="lr-step"><div class="lr-row3">${LEARN.HAR.map(([k, , n]) => `<button class="lr-tile" data-k="${k}"><span class="lr-g2">${LEARN.harakah(c, k)}</span><small>${n}</small></button>`).join('')}</div>
      <div class="lr-hint">👆 اضغط على كل واحدة واسمعها</div><div class="lr-foot">${NEXT}</div></div>`;
    const seen = new Set(), nx = b.querySelector('[data-next]'); nx.disabled = true;
    b.querySelectorAll('[data-k]').forEach(t => t.onclick = () => { const k = t.dataset.k; seen.add(k); t.classList.add('seen'); say(`h${i}${k}`); if (seen.size === 3) nx.disabled = false; });
    nx.onclick = () => { LEARN.stop(); res(); };
    say('p_harakat').then(() => { });
  });

  // سؤال اختيار: يسمع المتعلم شيئاً (أو يقرأه) ثم يختار
  function choose(b, { prompt, hear, show, options, cols }) {
    return gone(b) || new Promise(res => {
      b.innerHTML = `<div class="lr-step">${show ? `<div class="lr-q">${show}</div>` : `<button class="lr-ic xl" data-hear>🔊</button>`}
        <div class="lr-opts ${cols === 2 ? 'c2' : ''}">${options.map((o, k) => `<button class="lr-tile opt" data-o="${k}">${o.html}</button>`).join('')}</div></div>`;
      const play = () => hear && say(hear[0], hear[1]);
      const hb = b.querySelector('[data-hear]'); if (hb) hb.onclick = play;
      (prompt ? say(prompt) : Promise.resolve()).then(() => wait(150)).then(play);
      let tries = 0;
      b.querySelectorAll('[data-o]').forEach(t => t.onclick = async () => {
        const o = options[+t.dataset.o];
        if (o.ok) { t.classList.add('good'); LEARN.tone('ok'); LEARN.burst(t); b.querySelectorAll('[data-o]').forEach(x => x.disabled = true); await LEARN.praise(); res(tries === 0); }
        else { tries++; t.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => t.classList.remove('bad'), 500); await say('p_try_again'); play(); }
      });
    });
  }

  function writeStep(b, text, { guide, prompt, model }) {
    return gone(b) || new Promise(res => {
      b.innerHTML = `<div class="lr-step">${model ? `<div class="lr-model" data-say="${model}">${text}</div>` : ''}<div class="lr-padhost"></div><div class="lr-foot"><button class="lr-btn ghost" data-skip>تخطَّ ⬅</button></div></div>`;
      bindSay(b);
      say(prompt);
      let fails = 0;
      LEARN.pad(b.querySelector('.lr-padhost'), text, {
        guide, onCheck: async (sc, ok) => {
          if (ok) { LEARN.tone('win'); LEARN.burst(b.querySelector('.lr-padhost')); await LEARN.praise(); res(true); }
          else { fails++; LEARN.tone('bad'); await say('p_try_again'); if (fails >= 3) b.querySelector('[data-skip]').classList.add('lr-pulse'); }
        }
      });
      b.querySelector('[data-skip]').onclick = () => { LEARN.stop(); res(false); };
    });
  }

  async function done(b, area, id, back) {
    if (!b.isConnected) return;
    await LEARN.mark(area, id);
    LEARN.tone('win');
    b.innerHTML = `<div class="lr-step lr-done"><div class="lr-trophy">🏆</div><div class="lr-cap">⭐</div>
      <div class="lr-foot"><a class="lr-btn ok big" href="${back}">⬅</a></div></div>`;
    LEARN.burst(b.querySelector('.lr-trophy'));
    say('p_done');
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
    const w = W.find(x => x.first === c);
    if (w) await stepNext(b, `<div class="lr-pic" data-say="${w.id}">${w.e}</div><div class="lr-word" data-say="${w.id}"><b class="hl">${w.w[0]}</b>${w.w.slice(1)}</div>`, bb => { bindSay(bb); say(w.id); });
    await writeStep(b, c, { guide: true, prompt: 'p_trace' });
    await writeStep(b, c, { guide: false, prompt: 'p_write', model: 'l' + i });
    await done(b, area, 'l' + i, back);
  }

  async function formsLesson(b, i, back) {
    const c = L[i][0], f = LEARN.forms(c);
    const ws = W.filter(x => x.w.includes(c) || (c === 'ا' && /[اأ]/.test(x.w))).slice(0, 3);
    await stepNext(b, `<div class="lr-forms">${[['iso', 'وحده'], ['ini', 'أول الكلمة'], ['med', 'وسط الكلمة'], ['fin', 'آخر الكلمة']].map(([k, n]) => `<div class="lr-tile" data-say="l${i}"><span class="lr-g2">${f[k]}</span><small>${n}</small></div>`).join('')}</div>
      ${ws.map(w => `<div class="lr-wline" data-say="${w.id}"><span>${w.e}</span> ${hl(w.w, c)}</div>`).join('')}`, bb => { bindSay(bb); say('l' + i); });
    const target = ws[0] || W.find(x => x.w.includes(c));
    if (target) {
      const others = LEARN.shuffle(W.filter(x => !x.w.includes(c) && !(c === 'ا' && /[اأ]/.test(x.w)))).slice(0, 2);
      await choose(b, { prompt: null, show: `<span class="lr-g2">${c}</span>`, options: LEARN.shuffle([target, ...others]).map(x => ({ html: `<span class="lr-w2">${x.w}</span>`, ok: x === target })) });
    }
    await done(b, 'lit', 'f' + i, back);
  }
  const hl = (w, c) => esc(w).split('').map(ch => ch === c || (c === 'ا' && ch === 'أ') ? `<b class="hl">${ch}</b>` : ch).join('');

  async function wordsLesson(b, g, back) {
    const ws = W.slice(g * 5, g * 5 + 5);
    for (const w of ws) await stepNext(b, `<div class="lr-pic" data-say="${w.id}">${w.e}</div><div class="lr-word" data-say="${w.id}">${w.w}</div>
      <div class="lr-spell">${w.w.split('').map(ch => { const k = L.findIndex(x => x[0] === ch || (x[0] === 'ا' && /[أإآ]/.test(ch)) || (x[0] === 'ه' && ch === 'ة')); return `<button class="lr-chip" ${k >= 0 ? `data-say="l${k}"` : ''}>${ch}</button>`; }).join('')}</div>`, bb => { bindSay(bb); say(w.id); });
    // قراءة: يرى الكلمة مكتوبة ويختار صورتها (بدون صوت)
    for (const w of LEARN.shuffle(ws)) {
      const opts = LEARN.pick(W, 3, w);
      await choose(b, { prompt: 'p_choose_pic', show: `<span class="lr-w2">${w.w}</span>`, options: opts.map(x => ({ html: `<span class="lr-pic sm">${x.e}</span>`, ok: x === w })) });
    }
    // كتابة كلمتين
    for (const w of LEARN.shuffle(ws).slice(0, 2)) await writeStep(b, w.w, { guide: true, prompt: 'p_write_word', model: w.id });
    await done(b, 'lit', 'w' + g, back);
  }

  function arrange(b, i) {
    return gone(b) || new Promise(res => {
      const words = S[i].split(' ');
      const order = LEARN.shuffle(words.map((w, k) => k)); let pos = 0;
      b.innerHTML = `<div class="lr-step"><button class="lr-ic xl" data-hear>🔊</button><div class="lr-line" id="arLine">${words.map(() => '<span class="lr-slot"></span>').join('')}</div>
        <div class="lr-chips">${order.map(k => `<button class="lr-chip big" data-k="${k}">${esc(words[k])}</button>`).join('')}</div></div>`;
      const hearIt = () => say('s' + i);
      b.querySelector('[data-hear]').onclick = hearIt;
      say('p_arrange').then(hearIt);
      const slots = b.querySelectorAll('.lr-slot');
      b.querySelectorAll('[data-k]').forEach(ch => ch.onclick = async () => {
        const k = +ch.dataset.k;
        if (words[k] === words[pos]) { slots[pos].textContent = words[k]; slots[pos].classList.add('ok'); ch.disabled = true; ch.classList.add('used'); pos++; LEARN.tone('ok');
          if (pos === words.length) { LEARN.burst(b.querySelector('#arLine')); await LEARN.praise(); res(); } }
        else { ch.classList.add('bad'); LEARN.tone('bad'); setTimeout(() => ch.classList.remove('bad'), 500); }
      });
    });
  }

  async function sentenceLesson(b, i, back) {
    await stepNext(b, `<div class="lr-sent" data-say="s${i}">${esc(S[i])}</div>`, bb => { bindSay(bb); say('s' + i); });
    await arrange(b, i);
    await writeStep(b, S[i].split(' ').slice(0, 2).join(' '), { guide: false, prompt: 'p_write_sentence', model: 's' + i });
    await done(b, 'lit', 's' + i, back);
  }

  async function gradTest(b) {
    await say('p_grad_intro');
    let ok = 0;
    const qs = [
      ...LEARN.shuffle(L.map((_, k) => k)).slice(0, 3).map(k => () => choose(b, { hear: ['l' + k], options: LEARN.pick(L.map((_, x) => x), 3, k).map(x => ({ html: `<span class="lr-g2">${L[x][0]}</span>`, ok: x === k })) })),
      ...LEARN.shuffle(W).slice(0, 4).map(w => () => choose(b, { show: `<span class="lr-w2">${w.w}</span>`, options: LEARN.pick(W, 3, w).map(x => ({ html: `<span class="lr-pic sm">${x.e}</span>`, ok: x === w })) })),
      ...LEARN.shuffle(W).slice(0, 3).map(w => () => choose(b, { show: `<span class="lr-pic">${w.e}</span>`, options: LEARN.pick(W, 3, w).map(x => ({ html: `<span class="lr-w2">${x.w}</span>`, ok: x === w })) }))
    ];
    for (const q of qs) if (await q()) ok++;
    const pass = ok >= 8;
    if (pass) await LEARN.mark('lit', 'grad');
    b.innerHTML = `<div class="lr-step lr-done"><div class="lr-trophy">${pass ? '🎓' : '📚'}</div><div class="lr-cap">${AD(ok)} / ${AD(qs.length)}</div>
      <div class="lr-foot">${pass ? '<a class="lr-btn ok big" href="#/" data-adult>📚 قسم الكبار</a>' : ''}<a class="lr-btn big" href="#/literacy">🏠</a></div></div>`;
    const a = b.querySelector('[data-adult]'); if (a) a.onclick = () => { try { localStorage.setItem('audience', 'adult'); } catch (e) { } };
    say(pass ? 'p_grad_pass' : 'p_grad_fail');
  }

  // ===== الشاشات =====
  const exitBtn = '<a class="lr-ic" href="#/start" aria-label="خروج">🚪</a>';
  V.literacy = async (el, [sec, id]) => {
    const p = await LEARN.prog(), lit = p.lit || {};
    const sh = (title, back, repeat) => LEARN.shell(el, { theme: 'lit', title, back, stars: p.stars || 0, repeat, exit: back ? '' : exitBtn });
    if (!sec) {
      const n = pre => Object.keys(lit).filter(k => k.startsWith(pre)).length;
      const lv = [['letters', '🔤', 'الحروف', n('l'), 28], ['forms', '🔗', 'أشكال الحروف', n('f'), 28], ['words', '🖼️', 'الكلمات', n('w'), Math.ceil(W.length / 5)], ['sent', '📝', 'الجمل', n('s'), S.length], ['grad', '🎓', 'الاختبار', lit.grad ? 1 : 0, 1]];
      const b = sh('تعلّم القراءة والكتابة', '', () => say(null, 'ابدأ بالحروف، ثم أشكال الحروف، ثم الكلمات، ثم الجمل، ثم الاختبار'));
      b.innerHTML = `<div class="lr-path">${lv.map(([k, ic, t, d, tot], i) => `<a class="lr-level" href="#/literacy/${k}" data-t="${t}"><span class="lr-num">${AD(i + 1)}</span><span class="lr-lic">${ic}</span><b>${t}</b><span class="lr-bar"><i style="width:${Math.round(d / tot * 100)}%"></i></span><small>${AD(d)} / ${AD(tot)}</small></a>`).join('')}</div>`;
      say(null, 'ابدأ بالحروف، ثم أشكال الحروف، ثم الكلمات، ثم الجمل، ثم الاختبار');
      return;
    }
    if (sec === 'letters' || sec === 'forms') {
      const pre = sec === 'letters' ? 'l' : 'f';
      if (id == null) {
        const b = sh(sec === 'letters' ? '🔤 الحروف' : '🔗 أشكال الحروف', '#/literacy');
        b.innerHTML = `<div class="lr-grid">${L.map(([c], i) => `<a class="lr-tile ${lit[pre + i] ? 'done' : ''}" href="#/literacy/${sec}/${i}"><span class="lr-g2">${c}</span>${lit[pre + i] ? '<i class="lr-ok">✓</i>' : ''}</a>`).join('')}</div>`;
        return;
      }
      const i = +id, back = '#/literacy/' + sec;
      const b = sh(L[i][0], back, () => say('l' + i));
      return sec === 'letters' ? letterLesson(b, i, 'lit', back) : formsLesson(b, i, back);
    }
    if (sec === 'words') {
      if (id == null) {
        const b = sh('🖼️ الكلمات', '#/literacy');
        const G = Math.ceil(W.length / 5);
        b.innerHTML = `<div class="lr-grid g2">${Array.from({ length: G }, (_, g) => `<a class="lr-tile ${lit['w' + g] ? 'done' : ''}" href="#/literacy/words/${g}"><span class="lr-emo">${W.slice(g * 5, g * 5 + 5).map(x => x.e).join('')}</span>${lit['w' + g] ? '<i class="lr-ok">✓</i>' : ''}</a>`).join('')}</div>`;
        return;
      }
      return wordsLesson(sh('🖼️', '#/literacy/words'), +id, '#/literacy/words');
    }
    if (sec === 'sent') {
      if (id == null) {
        const b = sh('📝 الجمل', '#/literacy');
        b.innerHTML = `<div class="lr-list">${S.map((t, i) => `<a class="lr-sline ${lit['s' + i] ? 'done' : ''}" href="#/literacy/sent/${i}"><span class="lr-num">${AD(i + 1)}</span>${esc(t)}${lit['s' + i] ? ' <i class="lr-ok">✓</i>' : ''}</a>`).join('')}</div>`;
        return;
      }
      const i = +id;
      return sentenceLesson(sh('📝', '#/literacy/sent', () => say('s' + i)), i, '#/literacy/sent');
    }
    if (sec === 'grad') return gradTest(sh('🎓 الاختبار', '#/literacy'));
  };

  window.LIT = { gone, letterLesson, writeStep, choose, arrange, stepNext, bindSay, done };
})();
