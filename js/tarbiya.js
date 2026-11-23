/* 👨‍👩‍👧 منهج تربية الأبناء — للأب والأم معاً.
   كل مبدأ مربوط بدليله من القرآن أو السنة، والدليل يفتح نصّه في مكتبة التطبيق (تحقّقنا من وجوده فيها).
   المحتوى في data/tarbiya.js، ويُحمَّل عند أول دخول. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  let loading = null;
  const load = () => window.TARBIYA ? Promise.resolve(window.TARBIYA) : (loading || (loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/tarbiya.js?v=' + (window.DATA_V || ''); s.onload = () => res(window.TARBIYA); s.onerror = rej; document.head.appendChild(s); })));
  // دليل: نص + مصدر + رابط للنص في المكتبة
  const evHtml = list => (list || []).map(e => `<blockquote class="tb-ev">${esc(e.t)}${e.id ? ` <a class="tb-src" href="#/item/${encodeURIComponent(e.id)}">${e.id.startsWith('quran:') ? '📖 ' + esc((AR.SURAHS || [])[+e.ref.split(':')[0] - 1] || '') + ' ' + AR.toArabicDigits(e.ref.split(':')[1]) : '📚 ' + esc(e.ref)} ↗</a>` : ` <small class="muted">(${esc(e.ref)})</small>`}</blockquote>`).join('');
  const search = q => `<a class="btn sm" href="#/search?q=${encodeURIComponent(q)}">🔎 ابحث في المكتبة عن «${esc(q)}»</a>`;
  window.TB_EV = evHtml;

  const TABS = [['manhaj', '🧭 المنهج'], ['barnamaj', '📅 برنامج حسب العمر'], ['wasail', '🛠️ الوسائل'], ['marahil', '📈 المراحل'], ['mawlud', '👶 حقوق المولود'], ['akhta', '⚠️ أخطاء شائعة'], ['mushkilat', '🧩 مشكلات وحلول'], ['birr', '🤍 البرّ والميراث'], ['podcast', '🎧 بودكاست في التربية'], ['masadir', '📚 المصادر']];
  V.tarbiya = async (el, [tab, sub]) => {
    el.innerHTML = '<div class="card muted">جارٍ التحميل…</div>';
    let T; try { T = await load(); } catch (e) { el.innerHTML = '<div class="warn">تعذّر تحميل المحتوى.</div>'; return; }
    tab = tab || 'manhaj';
    let h = `<h1>👨‍👩‍👧 تربية الأبناء</h1><div class="sub">منهج متكامل للأب والأم، كل مبدأ فيه بدليله، والأدلة تفتح من مكتبة التطبيق مباشرة.</div>
      <div class="card"><p class="quran-text" style="font-size:22px;line-height:1.8">${esc(T.intro.ayah)}</p><p>${esc(T.intro.hadith)}</p><p class="muted">${esc(T.intro.note)}</p></div>
      <div class="tabs">${TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>`;
    if (tab === 'manhaj') {
      if (sub) {
        const p = T.pillars.find(x => x.id === sub);
        h += `<a class="btn sm" href="#/tarbiya">← كل الجوانب</a><h2>${p.ic} ${esc(p.name)}</h2><p>${esc(p.desc)}</p>
          ${p.items.map((x, i) => `<div class="card tb-item"><h3>${i + 1}. ${esc(x.t)}</h3>${x.d ? `<p>${esc(x.d)}</p>` : ''}${evHtml(x.ev)}</div>`).join('')}${search(p.name.replace('التربية ', '').replace('على ', ''))}`;
      } else h += `<p>للتربية في الإسلام جوانب متكاملة، لا يغني بعضها عن بعض. اختر جانباً:</p><div class="fam-grid">${T.pillars.map(p => `<a class="fam-tile" href="#/tarbiya/manhaj/${p.id}"><span class="fam-ic">${p.ic}</span><b>${esc(p.name)}</b><small>${AR.toArabicDigits(p.items.length)} مبادئ</small></a>`).join('')}</div>`;
    } else if (tab === 'barnamaj') {
      const P = T.program || [], cur = P.find(x => x.id === sub) || P[0];
      const L = (t, arr) => arr && arr.length ? `<h3>${t}</h3><ul class="tb-list">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
      h += `<p>اختر عمر الطفل لترى ما تفعله معه يومياً وأسبوعياً، والأهداف المرجوّة في هذه المرحلة:</p>
        <div class="chips">${P.map(x => `<button class="chip${x === cur ? ' on' : ''}" data-ag="${x.id}">${x.ic || ''} ${esc(x.name)}</button>`).join('')}</div>
        ${cur ? `<div class="card tb-item"><h2>${cur.ic || ''} ${esc(cur.name)}</h2>${L('☀️ كل يوم', cur.daily)}${L('📆 كل أسبوع', cur.weekly)}${L('🎯 الأهداف', cur.goals)}${L('⚠️ احذر', cur.avoid)}${cur.ev ? evHtml(cur.ev) : ''}</div>` : ''}`;
    } else if (tab === 'akhta') {
      h += `<p>أخطاء يقع فيها كثير من الآباء والأمهات: لماذا هي خطأ بحسب علم نفس الطفل، وما الخطوات العملية البديلة، وماذا تقول بدلاً منها.</p>` + (T.mistakes || []).map((m, i) => `<div class="card tb-item"><h3>${i + 1}. ${esc(m.t)}</h3>${m.d ? `<p>${esc(m.d)}</p>` : ''}
        ${m.sci ? `<div class="tb-sci"><b>🔬 لماذا هو خطأ؟</b><p>${esc(m.sci)}</p></div>` : ''}
        ${m.steps ? `<div class="tb-steps"><b>🪜 ماذا أفعل بدلاً منه؟</b><ol>${m.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}
        ${m.say ? `<div class="tb-say"><b>🗣️ بدل أن تقول… قل:</b>${m.say.map(([a, b]) => `<div class="tb-sayrow"><span class="no">✗ ${esc(a)}</span><span class="yes">✓ ${esc(b)}</span></div>`).join('')}</div>` : ''}
        ${m.fix ? `<p><b>✅ البديل:</b> ${esc(m.fix)}</p>` : ''}${m.ev ? `<details class="tb-ev"><summary>📖 الدليل الشرعي</summary>${evHtml(m.ev)}</details>` : ''}</div>`).join('') + '<div class="muted" style="font-size:12.5px">إذا استمرت مشكلة سلوكية أو أثّرت في حياة الطفل ودراسته، فاستشر أخصائياً في نفس الطفل أو طبيب الأطفال.</div>';
    } else if (tab === 'wasail') h += `<p>الوسائل التي ربّى بها النبي ﷺ أصحابه، ودلّ عليها القرآن:</p>` + T.methods.map((m, i) => `<div class="card tb-item"><h3>${i + 1}. ${esc(m.t)}</h3><p>${esc(m.d)}</p>${evHtml(m.ev)}</div>`).join('');
    else if (tab === 'marahil') h += T.stages.map(s => `<details class="card"><summary><b>${esc(s.name)}</b> <small class="muted">${esc(s.age)}</small></summary><p><b>${esc(s.role)}</b></p><ul>${s.common.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${s.boys.length ? `<b>👦 للأولاد</b><ul>${s.boys.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${s.girls.length ? `<b>👧 للبنات</b><ul>${s.girls.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>`).join('');
    else if (tab === 'mawlud') h += `<p>من هدي النبي ﷺ في المولود، كما جمعه ابن القيم في «زاد المعاد»:</p>` + T.newborn.map(n => `<div class="card tb-item"><h3>${esc(n.t)}</h3>${evHtml(n.ev)}${n.zad ? `<a class="btn sm" href="#/item/${n.zad}">📖 اقرأ الفصل في زاد المعاد</a>` : ''}</div>`).join('');
    else if (tab === 'mushkilat') {
      const CATS = [['', 'الكل'], ['صغار', '👶 الصغار'], ['سلوك', '🧩 السلوك'], ['مشاعر', '💛 المشاعر'], ['دراسة', '📚 الدراسة'], ['عبادة', '🕌 العبادة'], ['مراهقة', '🧑 المراهقة'], ['أمان', '🛡️ الشاشات والأمان'], ['إخوة', '👫 الإخوة'], ['عادات', '🌱 العادات']];
      const PR = T.problems || [];
      h += `<p>${AR.toArabicDigits(PR.length)} مشكلة تربوية شائعة، ولكل منها: لماذا تحدث (بحسب علم نفس الطفل)، وخطوات الحل، وماذا تقول بدلاً من الكلام الخاطئ.</p>
        <input id="tbQ" class="tb-q" placeholder="🔎 ابحث عن مشكلة: الكذب، النوم، الغيرة، الجوال…">
        <div class="tb-cats">${CATS.map(([k, l]) => `<button class="chip${k ? '' : ' on'}" data-cat="${k}">${l}</button>`).join('')}</div>
        <div id="tbList">${PR.map((p, i) => `<details class="card tb-pr" data-c="${esc(p.cat || '')}" data-s="${esc(AR.normalize(p.t + ' ' + p.d + ' ' + (p.steps || []).join(' ')))}"><summary><b>${esc(p.t)}</b>${p.age ? ` <small class="muted">(${esc(p.age)} سنة)</small>` : ''}</summary><p class="muted">${esc(p.d)}</p>
          ${p.sci ? `<div class="tb-sci"><b>🔬 لماذا يحدث؟</b><p>${esc(p.sci)}</p></div>` : ''}
          <div class="tb-steps"><b>🪜 خطوات الحل</b><ol>${p.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
          ${(p.say || []).length ? `<div class="tb-say"><b>🗣️ بدل أن تقول… قل:</b>${p.say.map(([a, b]) => `<div class="tb-sayrow"><span class="no">✗ ${esc(a)}</span><span class="yes">✓ ${esc(b)}</span></div>`).join('')}</div>` : ''}
          ${p.q ? search(p.q) : ''}</details>`).join('')}</div>
        <div class="muted" style="font-size:12.5px">هذه إرشادات عامة للتوعية. إذا استمرت المشكلة أو أثّرت في حياة الطفل ودراسته، أو ظهرت علامات خطر (إيذاء للنفس، أو حزن شديد مستمر، أو تحرّش)، فاستشر طبيب الأطفال أو أخصائياً نفسياً فوراً.</div>`;
    }
    else if (tab === 'birr') { const B = T.birr, I = T.inheritance; h += `<h2>🤍 برّ الوالدين</h2><div class="card"><ul>${B.life.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>بعد وفاتهما</b><ul>${B.after.map(x => `<li><b>${esc(x.t)}:</b> ${esc(x.d)}</li>`).join('')}</ul><b>لك أنت</b><ul>${B.forYou.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <h2>⚖️ الميراث باختصار</h2><a class="btn primary" href="#/mirath" style="margin-bottom:8px">🧮 افتح حاسبة المواريث</a><div class="card"><p>${esc(I.intro)}</p><ol>${I.order.map(x => `<li>${esc(x)}</li>`).join('')}</ol><ul>${I.shares.map(x => `<li><b>${esc(x.who)}:</b> ${esc(x.rule)}</li>`).join('')}</ul>${I.doubts.map(x => `<p class="muted">${esc(x)}</p>`).join('')}</div>`; }
    else if (tab === 'podcast') h += `<p class="muted">مختصون في التربية وجهات أسرية رسمية مرخّصة. الجانب الشرعي في التطبيق مأخوذ من كتب المكتبة، وهذه للجانب التربوي والنفسي.</p><div class="tb-music">🎵 <b>تنبيه:</b> كثير من البودكاستات تضع موسيقى في المقدمة أو الخاتمة أو بين الفقرات. إن وُجدت فتخطَّ المقدمة، واستعمل زر التقديم ٣٠ ثانية عند الفواصل، وما ظهر عندنا من تنبيه خاص لكل بودكاست كتبناه تحت اسمه.</div><div class="bt-list">${(T.podcasts || []).map(x => `<a class="bt-row" href="${x.href}" ${/^tel:/.test(x.href) ? '' : 'target="_blank" rel="noopener"'} style="text-decoration:none;color:inherit;flex-wrap:wrap"><b>🎧 ${esc(x.t)}</b><small class="muted" style="flex-basis:100%">${esc(x.by)} — ${esc(x.d)}</small>${x.music ? `<small class="tb-mus" style="flex-basis:100%">🎵 ${esc(x.music)}</small>` : ''}<span class="spacer"></span>↗</a>`).join('')}</div>`;
    else if (tab === 'masadir') h += (false ? `<h2>🎧 للاستماع: بودكاست وجهات موثوقة</h2><p class="muted">اخترنا مختصين في التربية وجهات أسرية رسمية مرخّصة. الجانب الشرعي في التطبيق مأخوذ من كتب المكتبة، وهذه للجانب التربوي والنفسي.</p><div class="bt-list">${T.podcasts.map(x => `<a class="bt-row" href="${x.href}" ${/^tel:/.test(x.href) ? '' : 'target="_blank" rel="noopener"'} style="text-decoration:none;color:inherit;flex-wrap:wrap"><b>🎧 ${esc(x.t)}</b><small class="muted" style="flex-basis:100%">${esc(x.by)} — ${esc(x.d)}</small><span class="spacer"></span>↗</a>`).join('')}</div>` : '') + T.sources.map(c => `<h2>${esc(c.cat)}</h2><div class="bt-list">${c.items.map(x => x.href ? `<a class="bt-row" href="${x.href}" style="text-decoration:none;color:inherit"><b>${esc(x.t)}</b><span class="spacer"></span>↗</a>` : `<div class="bt-row"><b>${esc(x.t)}</b></div>`).join('')}</div>`).join('') + '<p class="muted" style="font-size:12.5px">كل دليل في القسم تحققنا من وجوده في كتب المكتبة، ويفتح نصّه بالضغط عليه. وإن لم يكن الكتاب مثبتاً فثبّته من «طلب العلم ← الكتب وتحميلها».</p>';
    el.innerHTML = h;
    const tq = el.querySelector('#tbQ');
    if (tq) { let cat = ''; const flt = () => { const q = AR.normalize(tq.value.trim()); el.querySelectorAll('.tb-pr').forEach(d => d.hidden = !((!cat || d.dataset.c === cat) && (!q || d.dataset.s.includes(q)))); };
      tq.oninput = flt; el.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; el.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); flt(); }); }
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { location.hash = '#/tarbiya/' + b.dataset.t; });
    el.querySelectorAll('[data-ag]').forEach(b => b.onclick = () => { location.hash = '#/tarbiya/barnamaj/' + b.dataset.ag; });
  };
})();
