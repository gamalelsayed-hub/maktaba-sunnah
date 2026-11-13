/* 🧒 قسم الأطفال: حروفي (طريقة نور البيان)، أكتب، أرقامي، قرآني (تلقين)، ألعابي — ملوّن وبالصوت ونجوم مكافأة */
(() => {
  const V = APP.views, { L, W, S, NUM, AD, esc } = LEARN;
  const say = LEARN.say;
  const SUR = [1, 112, 113, 114, 108, 103, 110, 111, 105, 106, 107, 109, 97, 99, 102, 101, 100, 95, 94, 93];

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
    animal: { ic: '🐾', t: 'أين الحيوان؟', run: b => rounds(b, 5, () => { const an = W.filter(w => LEARN.ANIMALS.includes(w.w)); const w = LEARN.shuffle(an)[0]; return LIT.choose(b, { hear: [w.id], options: LEARN.pick(an, 4, w).map(x => ({ html: `<span class="lr-pic sm">${x.e}</span>`, ok: x === w })), cols: 2 }); }) },
    speak: { ic: '🎤', t: 'قل اسمه', run: b => rounds(b, 4, () => sayName(b, LEARN.shuffle(W.filter(w => LEARN.ANIMALS.includes(w.w)))[0])) },
    first: { ic: '🔤', t: 'الحرف الأول', run: b => rounds(b, 5, () => { const w = LEARN.shuffle(W)[0]; const ls = LEARN.pick(L.map(x => x[0]), 3, w.first); return LIT.choose(b, { prompt: 'p_first_letter', show: `<span class="lr-pic" data-say="${w.id}">${w.e}</span>`, hear: [w.id], options: ls.map(c => ({ html: `<span class="lr-g2">${c}</span>`, ok: c === w.first })) }); }) },
    arrange: { ic: '🧩', t: 'رتّب الجملة', run: b => rounds(b, 3, () => LIT.arrange(b, Math.floor(Math.random() * S.length)).then(() => true)) },
    memory: { ic: '🃏', t: 'الذاكرة', run: b => memory(b) }
  };

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
      const ws = LEARN.shuffle(W.filter(w => LEARN.ANIMALS.includes(w.w))).slice(0, 6);
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

  V.kids = async (el, [sec, id]) => {
    const p = await LEARN.prog(), k = p.kids || {};
    const sh = (title, back, repeat) => { const b = LEARN.shell(el, { theme: 'kids', title, back, stars: p.stars || 0, repeat, exit: back ? '' : exitBtn }); bindExit(el); return b; };
    if (!sec) {
      const b = sh('🌟 عالم الصغار', '');
      const T = [['letters', '🔤', 'حروفي', 'k1'], ['write', '✍️', 'أكتب', 'k2'], ['numbers', '🔢', 'أرقامي', 'k3'], ['quran', '📖', 'قرآني', 'k4'], ['games', '🎮', 'ألعابي', 'k5']];
      b.innerHTML = `<div class="kd-home">${T.map(([s, ic, t, c]) => `<a class="kd-tile ${c}" href="#/kids/${s}" data-say-t="${t}"><span>${ic}</span><b>${t}</b></a>`).join('')}</div>`;
      b.querySelectorAll('[data-say-t]').forEach(a => a.addEventListener('pointerdown', () => say(null, a.dataset.sayT)));
      return;
    }
    if (sec === 'letters' || sec === 'write') {
      const pre = sec === 'letters' ? 'l' : 'wr';
      if (id == null) {
        const b = sh(sec === 'letters' ? '🔤 حروفي' : '✍️ أكتب', '#/kids');
        b.innerHTML = `<div class="lr-grid">${L.map(([c], i) => `<a class="lr-tile kd ${k[pre + i] ? 'done' : ''}" href="#/kids/${sec}/${i}" style="--h:${i * 13 % 360}"><span class="lr-g2">${c}</span>${k[pre + i] ? '<i class="lr-ok">⭐</i>' : ''}</a>`).join('')}</div>`;
        return;
      }
      const i = +id, back = '#/kids/' + sec;
      const b = sh(L[i][0], back, () => say('l' + i));
      if (sec === 'letters') return LIT.letterLesson(b, i, 'kids', back);
      say('l' + i);
      await LIT.writeStep(b, L[i][0], { guide: true, prompt: 'p_trace' });
      await LIT.writeStep(b, L[i][0], { guide: true, prompt: 'p_trace' });
      await LIT.writeStep(b, L[i][0], { guide: false, prompt: 'p_write', model: 'l' + i });
      return finish(b, 'wr' + i, back);
    }
    if (sec === 'numbers' || sec === 'games') {
      const SET = sec === 'numbers' ? NUMS : GAMES, back = '#/kids/' + sec;
      if (id == null || !SET[id]) {
        const b = sh(sec === 'numbers' ? '🔢 أرقامي' : '🎮 ألعابي', '#/kids');
        b.innerHTML = `<div class="kd-home">${Object.entries(SET).map(([g, o], i) => `<a class="kd-tile k${(i % 5) + 1}" href="#/kids/${sec}/${g}" data-say-t="${o.t}"><span>${o.ic}</span><b>${o.t}</b>${k[sec[0] + g] ? '<i class="lr-ok">⭐</i>' : ''}</a>`).join('')}</div>`;
        b.querySelectorAll('[data-say-t]').forEach(a => a.addEventListener('pointerdown', () => say(null, a.dataset.sayT)));
        return;
      }
      const b = sh(SET[id].ic + ' ' + SET[id].t, back);
      await SET[id].run(b);
      return finish(b, sec[0] + id, back);
    }
    if (sec === 'quran') {
      if (id == null) {
        const b = sh('📖 قرآني', '#/kids');
        b.innerHTML = `<div class="lr-grid g2">${SUR.map((s, i) => `<a class="lr-tile kd sur ${k['q' + s] ? 'done' : ''}" href="#/kids/quran/${s}" style="--h:${i * 37 % 360}"><b>${AR.SURAHS[s - 1]}</b>${k['q' + s] ? '<i class="lr-ok">⭐</i>' : ''}</a>`).join('')}</div>`;
        return;
      }
      const s = +id, back = '#/kids/quran';
      const b = sh('سورة ' + AR.SURAHS[s - 1], back);
      const ay = (await DB.byIndex('items', 'bookId', 'quran')).filter(a => a.surah === s).sort((x, y) => x.ayah - y.ayah);
      const heard = new Set(); wasQ = true;
      b.innerHTML = `<div class="kd-quran">
        <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap"><button class="lr-btn ok" data-all>▶ لقّنّي السورة</button><button class="lr-btn ghost" data-stop>⏹</button></div>
        <div class="muted" style="text-align:center;margin:8px 0">👆 اضغط على الآية لتسمعها ثم ردّدها</div>
        ${ay.map(a => `<button class="kd-ayah" data-a="${a.ayah}"><span>${esc(noBasm(a.text, s, a.ayah))}</span> <i>${AD(a.ayah)}</i></button>`).join('')}</div>`;
      const opt = { reciter: 'husary-muallim', noBasmala: s !== 1 };
      b.querySelector('[data-all]').onclick = () => { LEARN.stop(); QA.play(ay.map(a => [s, a.ayah]), Object.assign({}, opt, { onEnd: () => finish(b, 'q' + s, back) })); };
      b.querySelector('[data-stop]').onclick = () => QA.stop();
      b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => {
        LEARN.stop(); b.querySelectorAll('.kd-ayah').forEach(y => y.classList.remove('on')); x.classList.add('on');
        const a = +x.dataset.a; heard.add(a); QA.play([[s, a]], opt);
        if (heard.size === ay.length) LEARN.mark('kids', 'q' + s);
      });
    }
  };
  function noBasm(t, s, a) { const w = t.split(' '); return s !== 1 && a === 1 && w.length > 4 && /^ب/.test(w[0]) && /رحيم/.test(AR.normalize(w[3])) ? w.slice(4).join(' ') : t; }
  let wasQ = false;
  window.addEventListener('hashchange', () => { const q = /^#\/kids\/quran\/\d/.test(location.hash); if (wasQ && window.QA) QA.stop(); wasQ = q; });
})();
