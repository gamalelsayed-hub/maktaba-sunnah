/* 📖 المعجم: حدّد أي كلمة في أي نص (أو ابحث في #/lugha/mujam) فيظهر معناها من «مختار الصحاح» للرازي و«مفردات ألفاظ القرآن» للراغب. */
(function () {
  const esc = s => (window.AR ? AR.escapeHtml(s) : String(s));
  let A = null, B = null;
  const loadJS = (src, name) => window[name] ? Promise.resolve(window[name]) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = src + '?v=' + (window.DATA_V || ''); s.onload = () => ok(window[name]); s.onerror = no; document.head.appendChild(s); });
  async function load() { if (!A) [A, B] = await Promise.all([loadJS('data/mujam-sihah.js', 'MUJAM_SIHAH'), loadJS('data/mujam-mufradat.js', 'MUJAM_MUFRADAT')]); }

  const HZ = { 'أ': 'ء', 'إ': 'ء', 'آ': 'ء', 'ؤ': 'ء', 'ئ': 'ء', 'ى': 'ي' };
  const ZW = 'ءاتسلمنوهي'; // حروف الزيادة «سألتمونيها»
  const PRE = ['وبال', 'فبال', 'وال', 'فال', 'بال', 'كال', 'ولل', 'فلل', 'لل', 'ال', 'وس', 'فس', 'وب', 'فب', 'ول', 'فل', 'وك', 'و', 'ف', 'ب', 'ك', 'ل', 'س'];
  const SUF = ['تموها', 'تمو', 'كموه', 'هما', 'كما', 'تما', 'ات', 'ون', 'ين', 'ان', 'تم', 'تن', 'هم', 'هن', 'ها', 'نا', 'كم', 'كن', 'ني', 'وا', 'يه', 'ية', 'ه', 'ك', 'ت', 'ي', 'ا', 'ن', 'ة'];
  const clean = w => String(w).replace(/[ً-ْـٰ]/g, '').replace(/[^ء-ي]/g, '');
  const hz = w => w.replace(/[أإآؤئى]/g, c => HZ[c]);

  function stems(w) {
    const out = new Map(); const add = (s, cost) => { if (s.length >= 2 && (!out.has(s) || out.get(s) > cost)) out.set(s, cost); };
    const pres = [['', 0], ...PRE.filter(p => w.startsWith(p) && w.length - p.length >= 2).map(p => [p, p.length * .6])];
    for (const [p, pc] of pres) {
      const a = w.slice(p.length); add(a, pc);
      for (const s1 of SUF) if (a.endsWith(s1) && a.length - s1.length >= 2) {
        const b = a.slice(0, -s1.length); add(b, pc + s1.length * .6);
        for (const s2 of SUF) if (b.endsWith(s2) && b.length - s2.length >= 2) add(b.slice(0, -s2.length), pc + s1.length + s2.length + 1);
      }
      // أحرف المضارعة
      if (/^[أيتن]/.test(a) && a.length >= 4) add(a.slice(1), pc + 1);
      for (const q of ['است', 'مست', 'يست', 'تست', 'نست']) if (a.startsWith(q) && a.length - q.length >= 3) { const c = a.slice(q.length); add(c, pc + 1); for (const s1 of SUF) if (c.endsWith(s1) && c.length - s1.length >= 2) add(c.slice(0, -s1.length), pc + 1 + s1.length); }
    }
    for (const [st, c] of [...out]) if (/^[أيتن]/.test(st) && st.length >= 3) add(st.slice(1), c + 1);
    return out;
  }
  function weak(r) { // تحويل الألف وحروف العلة إلى أصلها المحتمل
    const v = new Set([r]);
    const sw = (s, i, cs) => cs.forEach(c => v.add(s.slice(0, i) + c + s.slice(i + 1)));
    [...v].forEach(s => { for (let i = 0; i < s.length; i++) if (s[i] === 'ا') sw(s, i, i === 0 ? ['ء', 'و', 'ي'] : ['و', 'ي', 'ء']); });
    [...v].forEach(s => { for (let i = 0; i < s.length; i++) if (s[i] === 'و') sw(s, i, ['ي']); else if (s[i] === 'ي') sw(s, i, ['و']); });
    return [...v];
  }
  function cands(s) {
    const c = new Map(); const add = (r, cost) => { for (const x of weak(hz(r))) if (!c.has(x) || c.get(x) > cost) c.set(x, cost + (x === hz(r) ? 0 : 1)); };
    if (s.length === 2) { add(s + s[1], 1); add(s[0] + 'و' + s[1], 2); add(s[0] + 'ي' + s[1], 2); add(s + 'و', 2); add(s + 'ي', 2); add('و' + s, 3); }
    if (s.length === 3 || s.length === 4) add(s, 0);
    if (s.length >= 4) {
      const n = s.length;
      const pick = (k) => { const res = []; const rec = (i, cur, rm) => { if (cur.length === k) { const all = [...rm, ...s.slice(i)]; if (all.every(ch => ZW.includes(hz(ch)) || ch === 'ا')) res.push([cur, all.length]); return; } if (i >= n) return; rec(i + 1, cur + s[i], rm); if (n - i - 1 >= k - cur.length) rec(i + 1, cur, [...rm, s[i]]); }; rec(0, '', []); return res; };
      pick(3).forEach(([r, rm]) => add(r, rm)); if (n >= 5) pick(4).forEach(([r, rm]) => add(r, rm));
      // الإدغام: «مدّ» في «يمدّون»
    }
    if (s.length === 3 && s[1] === 'ا') add(s[0] + s[2] + s[2], 1);
    return c;
  }
  function roots(word) {
    let w = clean(word); if (!w) return [];
    const best = new Map();
    for (const [st, sc] of stems(w)) for (const [r, rc] of cands(st)) {
      if (!(A[r] || B[r])) continue; const sc2 = sc + rc + [...r].filter(ch => ZW.includes(ch)).length * .7 + [...r].filter(ch => ch === 'ا').length * .8;
      if (!best.has(r) || best.get(r) > sc2) best.set(r, sc2);
    }
    return [...best].sort((a, b) => a[1] - b[1]).slice(0, 4).map(x => x[0]);
  }
  const fmt = t => esc(t).replace(/\(([^)]{1,25})\)/g, '<b>$1</b>').replace(/\{([^}]+)\}/g, '<span class="mj-q">﴿$1﴾</span>').replace(/\n/g, '<br>');
  const pretty = r => r.split('').join(' ');
  function card(r) {
    return `<div class="mj-root"><div class="mj-h">الجذر: <b>${esc(pretty(r))}</b></div>
      ${A[r] ? `<details open><summary>📗 مختار الصحاح — الرازي</summary><div class="mj-t">${fmt(A[r])}</div></details>` : ''}
      ${B[r] ? `<details ${A[r] ? '' : 'open'}><summary>📘 مفردات ألفاظ القرآن — الراغب الأصفهاني</summary><div class="mj-t">${fmt(B[r])}</div></details>` : ''}</div>`;
  }
  async function html(word) {
    await load(); const rs = roots(word);
    if (!rs.length) return `<div class="muted">لم أجد جذراً مطابقاً لكلمة «${esc(word)}». جرّب كتابة جذرها الثلاثي، مثل: كتب، قول، رمي.</div>`;
    return `${rs.length > 1 ? `<div class="muted" style="margin-bottom:6px">الجذور المحتملة للكلمة «${esc(word)}»: ${rs.map((r, i) => `<a href="#" class="mj-tab${i ? '' : ' on'}" data-i="${i}">${esc(pretty(r))}</a>`).join(' · ')}</div>` : ''}
      ${rs.map((r, i) => `<div class="mj-pane" data-i="${i}" ${i ? 'hidden' : ''}>${card(r)}</div>`).join('')}`;
  }
  const bindTabs = el => el.querySelectorAll('.mj-tab').forEach(a => a.onclick = e => { e.preventDefault(); el.querySelectorAll('.mj-tab').forEach(x => x.classList.toggle('on', x === a)); el.querySelectorAll('.mj-pane').forEach(p => p.hidden = p.dataset.i !== a.dataset.i); });
  async function show(word) {
    const box = document.createElement('div'); box.className = 'mj-modal';
    box.innerHTML = `<div class="mj-sheet"><div class="row"><b>📖 معنى «${esc(word)}»</b><span class="spacer"></span><button class="btn sm mj-x">✕</button></div><div class="mj-body muted">جارٍ البحث في المعجم…</div><div class="muted" style="font-size:.8em;margin-top:6px">استخراج الجذر آلي وقد يخطئ، فاختر الجذر الأقرب من القائمة.</div></div>`;
    document.body.appendChild(box); const close = () => box.remove();
    box.onclick = e => { if (e.target === box || e.target.closest('.mj-x')) close(); };
    try { const b = box.querySelector('.mj-body'); b.innerHTML = await html(word); b.classList.remove('muted'); bindTabs(b); } catch (e) { box.querySelector('.mj-body').textContent = 'تعذر تحميل المعجم.'; }
  }

  // زر عائم عند تحديد كلمة
  let btn = null, t = null;
  function onSel() {
    clearTimeout(t); t = setTimeout(() => {
      const sel = window.getSelection(); const txt = sel ? sel.toString().trim() : '';
      const words = txt.split(/\s+/).filter(Boolean);
      if (!btn) { btn = document.createElement('button'); btn.className = 'mj-fab hidden'; document.body.appendChild(btn); btn.addEventListener('mousedown', e => e.preventDefault()); btn.onclick = () => { const w = btn.dataset.w; btn.classList.add('hidden'); show(w); }; }
      if (words.length === 1 && /[ء-ي]/.test(txt) && clean(txt).length >= 2 && clean(txt).length <= 15 && !(sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('input,textarea'))) {
        const r = sel.getRangeAt(0).getBoundingClientRect(); btn.dataset.w = clean(txt); btn.textContent = '📖 معنى «' + clean(txt) + '»';
        btn.style.top = (window.scrollY + r.bottom + 8) + 'px'; btn.style.left = Math.max(8, Math.min(window.innerWidth - 180, window.scrollX + r.left)) + 'px'; btn.classList.remove('hidden');
      } else btn.classList.add('hidden');
    }, 350);
  }
  document.addEventListener('selectionchange', onSel);

  // صفحة البحث في المعجم
  window.MUJAM = { show, html, roots: w => load().then(() => roots(w)), load };
  {
    APP.views.mujam = async (el, [q]) => {
      el.innerHTML = `<div class="rf-hero lg-hero"><h1>📖 المعجم</h1><div>اكتب أي كلمة (كما وردت أو بجذرها) لتعرف معناها من «مختار الصحاح» للرازي و«مفردات ألفاظ القرآن» للراغب الأصفهاني. ويمكنك في أي نص في التطبيق أن تحدّد كلمة بالضغط المطوّل عليها ثم تضغط «📖 معنى».</div></div>
        <form class="th-search" id="mjF"><input name="q" value="${esc(q || '')}" placeholder="مثال: يستغفرون، الكتاب، قالوا، رحمة"><button class="btn primary">ابحث</button></form><div id="mjR" style="margin-top:10px"></div>`;
      const f = el.querySelector('#mjF'); f.onsubmit = e => { e.preventDefault(); const v = f.q.value.trim(); if (v) location.hash = '#/mujam/' + encodeURIComponent(v); };
      if (q) { const r = el.querySelector('#mjR'); r.innerHTML = '<div class="muted">جارٍ البحث…</div>'; r.innerHTML = await html(q); bindTabs(r); }
    };
  }
})();
