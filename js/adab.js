/* 🪶 الشعر والأدب: الشعراء ودواوينهم حسب العصور، ومختارات في الحكمة والزهد والأخلاق، وكتب الأدب، والبحث في الشعر. */
(() => {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(String(n));
  let A = null;
  const load = () => A ? Promise.resolve(A) : new Promise((ok, no) => { if (window.ADAB) return ok(A = window.ADAB); const s = document.createElement('script'); s.src = 'data/adab.js?v=' + (window.DATA_V || ''); s.onload = () => ok(A = window.ADAB); s.onerror = no; document.head.appendChild(s); });
  const N = s => AR.normalize ? AR.normalize(s || '') : (s || '');
  const ERA_ORDER = ['jahili', 'mukhadram', 'umawi', 'abbasi', 'andalusi', 'mamluki', 'hadith'];
  const hero = () => `<div class="rf-hero ad-hero"><h1>🪶 الشعر والأدب</h1><div>دواوين الشعراء من الجاهلية إلى العصر الحديث، وكتب الأدب: طبقات فحول الشعراء، والشعر والشعراء، والمعلقات، والعقد الفريد، والبيان والتبيين، والكامل.</div></div>`;
  const tabs = cur => `<div class="tabs th-tabs">${[['', '👤 الشعراء'], ['mukhtarat', '✨ مختارات'], ['kutub', '📚 كتب الأدب']].map(([k, l]) => `<a class="${cur === k ? 'on' : ''}" href="#/adab${k ? '/' + k : ''}">${l}</a>`).join('')}</div>`;
  const searchBox = (q = '') => `<form class="th-search" id="adS"><input name="q" value="${esc(q)}" placeholder="ابحث ببيت أو كلمة أو اسم شاعر"><button class="btn primary">بحث</button></form>`;
  const bindSearch = el => { const f = el.querySelector('#adS'); if (f) f.onsubmit = e => { e.preventDefault(); const q = f.q.value.trim(); if (q) location.hash = '#/adab/q/' + encodeURIComponent(q); }; };
  const verses = (text, hl) => `<div class="ad-poem">${text.split('\n').filter(Boolean).map(l => { const [a, b] = l.split(' … '); const m = s => hl && N(s).includes(N(hl)) ? `<mark>${esc(s)}</mark>` : esc(s); return b != null ? `<div class="ad-bayt"><span>${m(a)}</span><span>${m(b)}</span></div>` : `<div class="ad-line">${m(l)}</div>`; }).join('')}</div>`;
  const items = async id => (await DB.byIndex('items', 'bookId', id)).sort((a, b) => a.seq - b.seq);
  const notInstalled = id => `<div class="card">الديوان غير مثبت في مكتبتك بعد. <a class="btn sm primary" href="#/book/${id}">ثبّته من هنا</a></div>`;

  V.adab = async (el, [sec, id, sub], prm = {}) => {
    el.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
    try { await load(); } catch (e) { el.innerHTML = '<div class="card">تعذر تحميل بيانات الأدب.</div>'; return; }
    if (sec === 'poet') return poet(el, A.poets.find(p => p.id === id), sub);
    if (sec === 'poem') return poem(el, id, prm.hl || '');
    if (sec === 'q') return search(el, id || '');
    if (sec === 'mukhtarat') {
      const topics = [...new Set(A.sel.map(s => s.topic))];
      el.innerHTML = hero() + tabs('mukhtarat') + topics.map(t => `<h3>${esc(t)}</h3>${A.sel.filter(s => s.topic === t).map(s => `<a class="card ad-sel" href="#/item/${encodeURIComponent(s.id)}">${verses(s.v.join('\n'))}<small>— ${esc(s.poet)}</small></a>`).join('')}`).join('');
      return;
    }
    if (sec === 'kutub') {
      el.innerHTML = hero() + tabs('kutub') + `<div class="bt-list">${A.books.map(b => `<a class="bt-row" href="#/book/${b.id}" style="text-decoration:none;color:inherit"><b>${esc(b.title)}</b><small class="muted">${esc(b.author)}</small><span class="spacer"></span>↗</a>`).join('')}</div>`;
      return;
    }
    el.innerHTML = hero() + searchBox() + tabs('') + ERA_ORDER.map(er => { const ps = A.poets.filter(p => p.era === er); return ps.length ? `<h3>${esc(A.eras[er])}</h3><div class="ad-poets">${ps.map(p => `<a class="card ad-poet" href="#/adab/poet/${p.id}"><b>${esc(p.name)}</b><small>ت ${esc(p.death)} · ${D(p.poems)} قصيدة</small></a>`).join('')}</div>` : ''; }).join('')
      + `<div class="muted th-note">المختارات مشكولة. أما نصوص الدواوين فمنقولة كما هي في مصادرها (المكتبة الشاملة والموسوعة الشعرية) بلا تشكيل.<br>المتنبي: الديوان كاملاً مع الشرح في «شرح ديوان المتنبي» للواحدي (تبويب كتب الأدب). وتراجم الشعراء وأخبارهم في «طبقات فحول الشعراء» و«الشعر والشعراء».</div>`;
    bindSearch(el);
  };

  async function poet(el, p, bahr) {
    if (!p) { location.hash = '#/adab'; return; }
    const its = await items(p.id);
    const bh = [...new Set(its.map(i => i.chapter))];
    const list = bahr ? its.filter(i => i.chapter === bahr) : its;
    el.innerHTML = `<a class="btn sm" href="#/adab">← الشعراء</a><div class="rf-hero ad-hero"><h1>${esc(p.name)}</h1><div>${esc(A.eras[p.era])} · ت ${esc(p.death)}</div></div>
      <div class="card">${esc(p.bio)}</div>
      ${its.length ? `<form class="th-search" id="adP"><input name="q" placeholder="ابحث في ديوان ${esc(p.name)}"><button class="btn">بحث</button></form>
      ${bh.length > 1 ? `<div class="chips"><a class="chip${bahr ? '' : ' on'}" href="#/adab/poet/${p.id}">الكل (${D(its.length)})</a>${bh.map(b => `<a class="chip${bahr === b ? ' on' : ''}" href="#/adab/poet/${p.id}/${encodeURIComponent(b)}">${esc(b.replace('البحر: ', ''))}</a>`).join('')}</div>` : ''}
      <div class="ad-list" id="adL">${list.map(i => `<a class="ad-row" href="#/adab/poem/${encodeURIComponent(i.id)}"><b>${esc(i.title)}</b><small>${D(i.text.split('\n').length)} ${i.text.includes(' … ') ? 'بيتاً' : 'سطراً'}</small></a>`).join('')}</div>` : notInstalled(p.id)}`;
    const f = el.querySelector('#adP');
    if (f) f.onsubmit = e => { e.preventDefault(); const q = N(f.q.value.trim()); const L = el.querySelector('#adL'); const r = its.filter(i => N(i.text).includes(q)); L.innerHTML = r.length ? r.map(i => { const l = i.text.split('\n').find(x => N(x).includes(q)) || ''; return `<a class="ad-row" href="#/adab/poem/${encodeURIComponent(i.id)}?hl=${encodeURIComponent(f.q.value.trim())}"><b>${esc(i.title)}</b><small>${esc(l.slice(0, 120))}</small></a>`; }).join('') : '<div class="muted">لا نتائج.</div>'; };
  }

  async function poem(el, id, hl) {
    const it = await DB.get('items', id);
    if (!it) { el.innerHTML = '<div class="card">القصيدة غير موجودة؛ ربما الديوان غير مثبت.</div>'; return; }
    const p = A.poets.find(x => x.id === it.bookId);
    el.innerHTML = `<a class="btn sm" href="#/adab/poet/${it.bookId}">← ${esc(p ? p.name : 'الديوان')}</a>
      <div class="card ad-card"><div class="ad-head"><b>${esc(p ? p.name : '')}</b><small>${esc(it.chapter || '')}</small></div>${verses(it.text, hl)}</div>
      <div class="row"><button class="btn" id="adCp">📋 نسخ</button><a class="btn" href="#/item/${encodeURIComponent(it.id)}">فتح في المكتبة</a></div>`;
    el.querySelector('#adCp').onclick = () => APP.copy ? APP.copy(it.text.replace(/ … /g, '    ') + '\n— ' + (p ? p.name : '')) : null;
  }

  async function search(el, q) {
    el.innerHTML = `<a class="btn sm" href="#/adab">← الشعر والأدب</a>` + searchBox(q) + '<div id="adR" class="muted">جارٍ البحث في الدواوين…</div>';
    bindSearch(el);
    const nq = N(q), R = el.querySelector('#adR');
    const poets = A.poets.filter(p => N(p.name + ' ' + p.bio).includes(nq));
    const out = []; let missing = 0;
    for (const p of A.poets) {
      const its = await items(p.id); if (!its.length) { missing++; continue; }
      for (const i of its) { const l = i.text.split('\n').find(x => N(x).includes(nq)); if (l) out.push([p, i, l]); if (out.length > 200) break; }
    }
    R.className = '';
    R.innerHTML = `${poets.length ? `<h3>👤 الشعراء</h3><div class="ad-poets">${poets.map(p => `<a class="card ad-poet" href="#/adab/poet/${p.id}"><b>${esc(p.name)}</b><small>${esc(A.eras[p.era])}</small></a>`).join('')}</div>` : ''}
      <h3>📜 في الدواوين (${D(out.length)})</h3>${out.length ? out.slice(0, 120).map(([p, i, l]) => `<a class="card ad-sel" href="#/adab/poem/${encodeURIComponent(i.id)}?hl=${encodeURIComponent(q)}">${verses(l, q)}<small>— ${esc(p.name)}</small></a>`).join('') : '<div class="muted">لا نتائج في الدواوين.</div>'}
      ${missing ? `<div class="muted th-note">${D(missing)} ديواناً غير مثبت فلم يُبحث فيه.</div>` : ''}
      <h3>🔎 ابحث في كتب الأدب</h3><div class="chips">${A.books.map(b => `<a class="chip" href="#/search?q=${encodeURIComponent(q)}&book=${b.id}&deep=1&nodirect=1">${esc(b.title)}</a>`).join('')}</div>`;
  }
})();
