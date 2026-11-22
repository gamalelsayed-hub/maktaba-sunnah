/* 🔤 علوم العربية: مسار النحو المتدرج، ومدرّب الإعراب، وتدريب إعراب القرآن، و«كيف أعرب؟»، وإعراب الآية تحتها.
   الدروس مبسّطة ومرتبة على أبواب الآجرومية وقطر الندى والألفية، وكل درس يحيل إلى موضعه في المتون والشروح بالمكتبة. */
(() => {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(String(n));
  let G = null;
  const loadJS = (src, key) => window[key] ? Promise.resolve(window[key]) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = src + '?v=' + (window.DATA_V || ''); s.onload = () => ok(window[key]); s.onerror = no; document.head.appendChild(s); });
  const load = async () => G || (G = await loadJS('data/lugha.js', 'LUGHA'));
  const done = async () => new Set((await DB.setting('lugha-done')) || []);
  const markDone = async id => { const s = await done(); s.add(id); await DB.setting('lugha-done', [...s]); };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const HUKM = ['رفع', 'نصب', 'جر', 'جزم', 'مبني'];
  const hero = (t, d) => `<div class="rf-hero lg-hero"><h1>${t}</h1>${d ? `<div>${d}</div>` : ''}</div>`;
  const back = (h, t) => `<a class="btn sm" href="${h}">← ${t}</a>`;

  V.lugha = async (el, [sec, id, sub], prm = {}) => {
    el.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
    try { await load(); } catch (e) { el.innerHTML = '<div class="card">تعذر تحميل الدروس.</div>'; return; }
    if (sec === 'nahw' && id) return lesson(el, id);
    if (sec === 'nahw') return path(el);
    if (sec === 'train') return train(el, id, prm.ids);
    if (sec === 'quran') return quran(el);
    if (sec === 'wiz') return wiz(el, id || 'start');
    if (sec === 'kutub') return kutub(el);
    const T = (h, ic, t, d, soon) => `<a class="card lg-tile${soon ? ' soon' : ''}" href="${soon ? 'javascript:void 0' : h}"><span>${ic}</span><b>${t}</b><small>${d}</small>${soon ? '<i>قريباً</i>' : ''}</a>`;
    const dn = await done();
    el.innerHTML = hero('🔤 علوم العربية', 'من الصفر إلى الإتقان: دروس مبسّطة، وتدريب تفاعلي، وإحالة إلى المتون والشروح.') + `<div class="lg-grid">
      ${T('#/lugha/nahw', '📘', 'النحو', `مسار متدرج: ${D(G.lessons.length)} درساً · أنهيت ${D(G.lessons.filter(l => dn.has(l.id)).length)}`)}
      ${T('#/lugha/train', '🎯', 'مدرّب الإعراب', 'أعرب الجمل كلمةً كلمة، واعرف خطأك فوراً')}
      ${T('#/lugha/quran', '📖', 'إعراب القرآن', 'تدرّب على إعراب الفاتحة وقصار السور، وإعراب أي آية من كتب الإعراب')}
      ${T('#/lugha/wiz', '🧭', 'كيف أُعرب أي كلمة؟', 'أسئلة متتابعة توصلك إلى الإعراب الصحيح')}
      ${T('', '🔄', 'الصرف', 'مُصرِّف الأفعال والميزان والمشتقات', 1)}
      ${T('', '🌸', 'البلاغة والتعبير', 'التشبيه والاستعارة والكناية والبديع وبنك التعابير', 1)}
      ${T('', '✍️', 'الإملاء', 'الهمزات والتاء والألف اللينة والترقيم', 1)}
      ${T('', '🎼', 'العروض', 'بحور الشعر وتقطيعه', 1)}
      ${T('', '🖋️', 'الخط العربي', 'تدريب النسخ والرقعة بالتتبع', 1)}
      ${T('#/lugha/kutub', '📚', 'كتب علوم العربية', 'الآجرومية وقطر الندى والألفية وشروحها، وكتب البلاغة والإعراب')}
    </div>`;
  };

  async function path(el) {
    const dn = await done();
    el.innerHTML = back('#/lugha', 'علوم العربية') + hero('📘 مسار النحو', 'ابدأ من أول درس وتدرّج. في كل درس فكرة مبسّطة، وقواعد، وأمثلة من القرآن، وأسئلة، وتدريب على الإعراب.') +
      G.levels.map(([k, t, d]) => { const ls = G.lessons.filter(l => l.lvl === k); const n = ls.filter(l => dn.has(l.id)).length; return `<h2>${t} <small class="muted">${D(n)}/${D(ls.length)}</small></h2><p class="muted">${esc(d)}</p><div class="lg-list">${ls.map((l, i) => `<a class="lg-row${dn.has(l.id) ? ' ok' : ''}" href="#/lugha/nahw/${l.id}"><span class="lg-n">${dn.has(l.id) ? '✓' : D(i + 1)}</span><b>${esc(l.t)}</b></a>`).join('')}</div>`; }).join('');
  }

  async function lesson(el, id) {
    const l = G.lessons.find(x => x.id === id); if (!l) { location.hash = '#/lugha/nahw'; return; }
    const all = G.lessons, i = all.indexOf(l), nx = all[i + 1], pv = all[i - 1];
    el.innerHTML = back('#/lugha/nahw', 'مسار النحو') + `<h1 class="lg-t">${esc(l.t)}</h1>
      <div class="card lg-idea"><b>💡 الفكرة ببساطة</b><p>${esc(l.idea)}</p></div>
      <h3>📏 القواعد</h3><ul class="lg-rules">${l.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <h3>📖 أمثلة</h3>${l.ex.map(([a, b]) => `<div class="card lg-ex"><div class="lg-exa">${esc(a)}</div>${b && b !== '—' ? `<small>${esc(b)}</small>` : ''}</div>`).join('')}
      ${l.r.length ? `<h3>📚 من المتون والشروح</h3><div class="th-refs">${l.r.map(r => `<a class="th-ref" href="#/item/${encodeURIComponent(r[0])}"><b>${esc(r[1])}</b><small>${esc(r[2])}</small></a>`).join('')}</div>` : ''}
      <h3>✅ اختبر فهمك</h3><div id="lgQ"></div>
      ${l.s.length ? `<a class="btn primary lg-big" href="#/lugha/train/x?ids=${l.s.join(',')}">🎯 تدرّب على إعراب جمل هذا الدرس</a>` : ''}
      <div class="row th-nav">${pv ? `<a class="btn" href="#/lugha/nahw/${pv.id}">→ ${esc(pv.t)}</a>` : '<span></span>'}${nx ? `<a class="btn" href="#/lugha/nahw/${nx.id}">${esc(nx.t)} ←</a>` : ''}</div>`;
    const Q = el.querySelector('#lgQ'); let right = 0;
    Q.innerHTML = l.q.map(([q, o], k) => `<div class="card lg-q" data-k="${k}"><b>${D(k + 1)}. ${esc(q)}</b><div class="lg-opts">${o.map((x, j) => `<button class="lg-o" data-j="${j}">${esc(x)}</button>`).join('')}</div><div class="lg-why"></div></div>`).join('');
    Q.querySelectorAll('.lg-q').forEach(c => {
      const [, , a, why] = l.q[+c.dataset.k];
      c.querySelectorAll('.lg-o').forEach(b => b.onclick = async () => {
        if (c.dataset.done) return; c.dataset.done = 1;
        const ok = +b.dataset.j === a; b.classList.add(ok ? 'ok' : 'no'); c.querySelectorAll('.lg-o')[a].classList.add('ok');
        c.querySelector('.lg-why').innerHTML = `${ok ? '✅ أحسنت.' : '❌ ليس هذا.'} ${esc(why || '')}`;
        if (ok) right++;
        if (Q.querySelectorAll('[data-done]').length === l.q.length) {
          if (right === l.q.length) { await markDone(l.id); APP.toast('أحسنت! أتممت الدرس ✓'); }
          else Q.insertAdjacentHTML('beforeend', `<div class="muted">أجبت ${D(right)} من ${D(l.q.length)}. راجع القواعد ثم <a href="#/lugha/nahw/${l.id}" onclick="setTimeout(()=>APP.rerender(),0)">أعد الاختبار</a>.</div>`);
        }
      });
    });
  }

  // ===== مدرّب الإعراب =====
  const ROLES = () => [...new Set(Object.values(G.sents).flatMap(s => s.w.map(w => w.r)))];
  async function train(el, lvl, ids) {
    let pool = ids ? ids.split(',').map(n => G.sents[n]).filter(Boolean) : Object.values(G.sents).filter(s => !lvl || lvl === 'all' ? s.lvl !== 'q' : s.lvl === lvl);
    if (!ids) pool = shuffle(pool);
    const st = (await DB.setting('lugha-train')) || { ok: 0, all: 0 };
    let si = 0, wi = 0, step = 0, score = 0, tries = 0;
    const roles = ROLES();
    const head = () => `${back(lvl === 'q' || (ids && pool[0] && pool[0].lvl === 'q') ? '#/lugha/quran' : '#/lugha', 'رجوع')}<h1 class="lg-t">🎯 مدرّب الإعراب</h1>
      ${ids ? '' : `<div class="chips">${[['all', 'الكل'], ['m1', 'مبتدئ'], ['m2', 'متوسط'], ['m3', 'متقدم'], ['q', 'قرآن']].map(([k, t]) => `<a class="chip${(lvl || 'all') === k ? ' on' : ''}" href="#/lugha/train/${k}">${t}</a>`).join('')}</div>`}
      <div class="muted lg-score">صحيح في هذه الجلسة: <b id="lgSc">${D(score)}</b> · مجموعك: ${D(st.ok)} من ${D(st.all)}</div>`;
    const render = () => {
      const s = pool[si]; if (!s) { el.innerHTML = head() + `<div class="card">🎉 انتهت الجمل. <a class="btn" href="#/lugha/train/${lvl || 'all'}" onclick="setTimeout(()=>APP.rerender(),0)">ابدأ من جديد</a></div>`; return; }
      const w = s.w[wi];
      let opts = step === 0 ? shuffle([w.r, ...shuffle(roles.filter(r => r !== w.r)).slice(0, 3)]) : HUKM;
      el.innerHTML = head() + `<div class="card lg-train">
        ${s.src ? `<div class="lg-src">﴿ ${esc(s.src)} ﴾</div>` : ''}
        <div class="lg-sent">${s.w.map((x, k) => `<span class="lg-w${k === wi ? ' cur' : k < wi ? ' did' : ''}">${esc(x.w)}</span>`).join(' ')}</div>
        <div class="lg-ask">${step === 0 ? `ما موقع كلمة <b>«${esc(w.w)}»</b>؟` : `وما حكمها الإعرابي؟`}</div>
        <div class="lg-opts">${opts.map(o => `<button class="lg-o" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <div class="lg-why" id="lgW"></div></div>
        <div class="muted">الجملة ${D(si + 1)} من ${D(pool.length)} · الكلمة ${D(wi + 1)} من ${D(s.w.length)}</div>`;
      el.querySelectorAll('.lg-o').forEach(b => b.onclick = async () => {
        const ans = step === 0 ? w.r : (w.h === 'مبني' ? 'مبني' : w.h);
        const ok = b.dataset.v === ans; tries++;
        if (!ok) { b.classList.add('no'); el.querySelector('#lgW').innerHTML = step === 0 ? '❌ حاول مرة أخرى. فكّر: ما الذي قبلها؟ وما الذي يتم به المعنى؟' : '❌ حاول مرة أخرى.'; return; }
        b.classList.add('ok');
        if (step === 0) { step = 1; setTimeout(render, 350); return; }
        if (tries === 2) score++;
        st.all++; if (tries === 2) st.ok++; DB.setting('lugha-train', st);
        el.querySelector('#lgW').innerHTML = `<div class="lg-full">✅ <b>${esc(w.w)}:</b> ${esc(w.x)}</div>${s.note && wi === s.w.length - 1 ? `<div class="muted">ℹ️ ${esc(s.note)}</div>` : ''}<button class="btn primary" id="lgN">${wi < s.w.length - 1 ? 'الكلمة التالية ←' : 'الجملة التالية ←'}</button>`;
        el.querySelectorAll('.lg-o').forEach(x => x.disabled = true);
        el.querySelector('#lgN').onclick = () => { tries = 0; step = 0; if (wi < s.w.length - 1) wi++; else { wi = 0; si++; } render(); };
      });
    };
    render();
  }

  function quran(el) {
    el.innerHTML = back('#/lugha', 'علوم العربية') + hero('📖 إعراب القرآن', 'تدرّب على إعراب سور كاملة كلمةً كلمة، ثم اقرأ إعراب أي آية من «إعراب القرآن» للنحاس تحت الآية نفسها.') +
      `<div class="lg-list">${G.quran.map(([t, ids]) => `<a class="lg-row" href="#/lugha/train/q?ids=${ids.join(',')}"><span class="lg-n">📖</span><b>${esc(t)}</b><small class="muted">${D(ids.length)} ${ids.length > 2 && ids.length < 11 ? 'آيات' : 'آية'}</small></a>`).join('')}</div>
      <div class="card"><b>🔤 إعراب أي آية</b><p class="muted">افتح أي آية في المصحف واضغط زر «🔤 إعراب الآية» تحتها، فيظهر كلام أبي جعفر النحاس (ت ٣٣٨هـ) في إعرابها. وفي «مشكل إعراب القرآن» لمكي بن أبي طالب بيان المواضع المشكلة.</p>
      <div class="row"><a class="btn" href="#/item/quran:1:2">جرّب على الفاتحة</a><a class="btn" href="#/book/irab-nahhas">إعراب القرآن للنحاس</a><a class="btn" href="#/book/mushkil-irab">مشكل إعراب القرآن</a></div></div>`;
  }

  function wiz(el, node) {
    const n = G.wiz[node] || G.wiz.start; const [q, opts] = n;
    el.innerHTML = back('#/lugha', 'علوم العربية') + hero('🧭 كيف أُعرب أي كلمة؟', 'أجب عن الأسئلة خطوة خطوة، وستصل إلى إعراب الكلمة. هذه الطريقة نفسها هي ما يفعله المعرب في ذهنه.') +
      `<div class="card lg-wiz"><div class="lg-ask">${esc(q)}</div>${opts.length ? `<div class="lg-opts col">${opts.map(([t, k]) => `<a class="lg-o" href="#/lugha/wiz/${k}">${esc(t)}</a>`).join('')}</div>` : `<div class="row"><a class="btn primary" href="#/lugha/wiz">↺ كلمة أخرى</a><a class="btn" href="#/lugha/train">🎯 تدرّب الآن</a></div>`}</div>`;
  }

  function kutub(el) {
    const M = (window.PACK_MANIFEST || []).filter(m => m.type === 'lughabook');
    const IL = [['nahw', '📘 النحو'], ['sarf', '🔄 الصرف'], ['irab', '📖 إعراب القرآن'], ['balagha', '🌸 البلاغة'], ['arud', '🎼 العروض'], ['lugha', '📚 اللغة']];
    el.innerHTML = back('#/lugha', 'علوم العربية') + hero('📚 كتب علوم العربية') + IL.map(([k, t]) => { const bs = M.filter(m => m.ilm === k); return bs.length ? `<h3>${t}</h3><div class="bt-list">${bs.map(b => `<a class="bt-row" href="#/book/${b.id}" style="text-decoration:none;color:inherit"><b>${esc(b.title)}</b><small class="muted">${esc(b.author)}</small><span class="spacer"></span>↗</a>`).join('')}</div>` : ''; }).join('');
  }

  // ===== «🔤 إعراب الآية» تحت كل آية =====
  const origItem = V.item;
  V.item = async (el, parts, p) => {
    await origItem(el, parts, p);
    const m = /^quran:(\d+):(\d+)$/.exec(decodeURIComponent(parts[0] || ''));
    if (!m || el.querySelector('.lg-irab-btn')) return;
    const s = +m[1], a = +m[2];
    const row = el.querySelector('.row'), btn = `<button class="btn lg-irab-btn">🔤 إعراب الآية</button>`;
    if (row) row.insertAdjacentHTML('beforeend', btn); else el.insertAdjacentHTML('beforeend', btn);
    const box = document.createElement('div'); box.className = 'lg-irab'; (row || el.lastElementChild).insertAdjacentElement('afterend', box);
    el.querySelector('.lg-irab-btn').onclick = async () => {
      if (box.dataset.open) { box.innerHTML = ''; delete box.dataset.open; return; }
      box.dataset.open = 1; box.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
      let idx; try { idx = await loadJS('data/irab-index.js', 'IRAB_IDX'); } catch (e) { box.innerHTML = '<div class="card">تعذر التحميل.</div>'; return; }
      const r = ((idx['irab-nahhas'] || {})[s] || []).find(([x, y]) => a >= x && a <= y);
      await load(); const qt = Object.values(G.sents).find(x => x.lvl === 'q' && trainMatch(x.src, s, a));
      const tr = qt ? `<a class="btn primary" href="#/lugha/train/x?ids=${qt.n}">🎯 تدرّب على إعراب هذه الآية كلمةً كلمة</a>` : '';
      if (!r) { box.innerHTML = `<div class="card lg-irab-card">لم يتكلم أبو جعفر النحاس في «إعراب القرآن» على هذه الآية؛ لأنه يعرب ما يحتاج إلى بيان. ${tr} <a class="btn sm" href="#/book/mushkil-irab">مشكل إعراب القرآن</a></div>`; return; }
      const iid = `irab-nahhas:${s}:${r[0]}`, it = await DB.get('items', iid);
      if (!it) {
        box.innerHTML = `<div class="card lg-irab-card">📥 إعراب الآية من كتاب «إعراب القرآن» لأبي جعفر النحاس، ويحتاج تحميل الكتاب مرة واحدة (نحو ٥ ميجا). <button class="btn primary" id="lgDl">⬇️ حمّل الآن</button> ${tr}<div class="muted" id="lgDm"></div></div>`;
        box.querySelector('#lgDl').onclick = async () => { const msg = box.querySelector('#lgDm'); try { await IMPORT.installPacks((i, n, t, mm) => { msg.textContent = mm || ''; }, ['irab-nahhas']); await APP.loadMeta(); delete box.dataset.open; el.querySelector('.lg-irab-btn').click(); } catch (e) { msg.textContent = 'تعذر التحميل، تأكد من الاتصال.'; } };
        return;
      }
      box.innerHTML = `<div class="card lg-irab-card"><div class="lg-irab-h"><b>🔤 ${esc(it.title)}</b><small>إعراب القرآن لأبي جعفر النحاس (ت ٣٣٨هـ)</small></div><div class="lg-irab-t">${esc(it.text).replace(/\n/g, '<br>')}</div><div class="row">${tr}<a class="btn sm" href="#/item/${encodeURIComponent(iid)}">فتح في الكتاب</a></div></div>`;
    };
  };
  const trainMatch = (src, s, a) => { const nm = (AR.SURAHS || [])[s - 1]; if (!nm || !src.startsWith(nm)) return false; const ns = src.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/(\d+)(?:–(\d+))?/); return ns && a >= +ns[1] && a <= +(ns[2] || ns[1]); };
})();
