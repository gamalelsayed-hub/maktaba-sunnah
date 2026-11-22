/* 👨‍👩‍👧 منهج تربية الأبناء — للأب والأم معاً.
   كل مبدأ مربوط بدليله من القرآن أو السنة، والدليل يفتح نصّه في مكتبة التطبيق (تحقّقنا من وجوده فيها).
   المحتوى في data/tarbiya.js، ويُحمَّل عند أول دخول. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  let loading = null;
  const load = () => window.TARBIYA ? Promise.resolve(window.TARBIYA) : (loading || (loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/tarbiya.js'; s.onload = () => res(window.TARBIYA); s.onerror = rej; document.head.appendChild(s); })));
  // دليل: نص + مصدر + رابط للنص في المكتبة
  const evHtml = list => (list || []).map(e => `<blockquote class="tb-ev">${esc(e.t)}${e.id ? ` <a class="tb-src" href="#/item/${encodeURIComponent(e.id)}">${e.id.startsWith('quran:') ? '📖 ' + esc((AR.SURAHS || [])[+e.ref.split(':')[0] - 1] || '') + ' ' + AR.toArabicDigits(e.ref.split(':')[1]) : '📚 ' + esc(e.ref)} ↗</a>` : ` <small class="muted">(${esc(e.ref)})</small>`}</blockquote>`).join('');
  const search = q => `<a class="btn sm" href="#/search?q=${encodeURIComponent(q)}">🔎 ابحث في المكتبة عن «${esc(q)}»</a>`;
  window.TB_EV = evHtml;

  const TABS = [['manhaj', '🧭 المنهج'], ['barnamaj', '📅 برنامج حسب العمر'], ['wasail', '🛠️ الوسائل'], ['marahil', '📈 المراحل'], ['mawlud', '👶 حقوق المولود'], ['akhta', '⚠️ أخطاء شائعة'], ['mushkilat', '🧩 مشكلات وحلول'], ['birr', '🤍 البرّ والميراث'], ['masadir', '📚 المصادر']];
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
    } else if (tab === 'wasail') h += `<p>الوسائل التي ربّى بها النبي ﷺ أصحابه، ودلّ عليها القرآن:</p>` + T.methods.map((m, i) => `<div class="card tb-item"><h3>${i + 1}. ${esc(m.t)}</h3><p>${esc(m.d)}</p>${evHtml(m.ev)}</div>`).join('');
    else if (tab === 'marahil') h += T.stages.map(s => `<details class="card"><summary><b>${esc(s.name)}</b> <small class="muted">${esc(s.age)}</small></summary><p><b>${esc(s.role)}</b></p><ul>${s.common.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${s.boys.length ? `<b>👦 للأولاد</b><ul>${s.boys.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${s.girls.length ? `<b>👧 للبنات</b><ul>${s.girls.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>`).join('');
    else if (tab === 'mawlud') h += `<p>من هدي النبي ﷺ في المولود، كما جمعه ابن القيم في «زاد المعاد»:</p>` + T.newborn.map(n => `<div class="card tb-item"><h3>${esc(n.t)}</h3>${evHtml(n.ev)}${n.zad ? `<a class="btn sm" href="#/item/${n.zad}">📖 اقرأ الفصل في زاد المعاد</a>` : ''}</div>`).join('');
    else if (tab === 'mushkilat') h += T.problems.map(p => `<details class="card"><summary><b>${esc(p.t)}</b></summary><p class="muted">${esc(p.d)}</p><ol>${p.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${search(p.q)}</details>`).join('') + '<div class="muted" style="font-size:12.5px">إذا استمرت المشكلة أو أثّرت في حياة الطفل ودراسته، فاستشر أخصائياً في نفس الطفل.</div>';
    else if (tab === 'birr') { const B = T.birr, I = T.inheritance; h += `<h2>🤍 برّ الوالدين</h2><div class="card"><ul>${B.life.map(x => `<li>${esc(x)}</li>`).join('')}</ul><b>بعد وفاتهما</b><ul>${B.after.map(x => `<li><b>${esc(x.t)}:</b> ${esc(x.d)}</li>`).join('')}</ul><b>لك أنت</b><ul>${B.forYou.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <h2>⚖️ الميراث باختصار</h2><a class="btn primary" href="#/mirath" style="margin-bottom:8px">🧮 افتح حاسبة المواريث</a><div class="card"><p>${esc(I.intro)}</p><ol>${I.order.map(x => `<li>${esc(x)}</li>`).join('')}</ol><ul>${I.shares.map(x => `<li><b>${esc(x.who)}:</b> ${esc(x.rule)}</li>`).join('')}</ul>${I.doubts.map(x => `<p class="muted">${esc(x)}</p>`).join('')}</div>`; }
    else if (tab === 'masadir') h += T.sources.map(c => `<h2>${esc(c.cat)}</h2><div class="bt-list">${c.items.map(x => x.href ? `<a class="bt-row" href="${x.href}" style="text-decoration:none;color:inherit"><b>${esc(x.t)}</b><span class="spacer"></span>↗</a>` : `<div class="bt-row"><b>${esc(x.t)}</b></div>`).join('')}</div>`).join('') + '<p class="muted" style="font-size:12.5px">كل دليل في القسم تحققنا من وجوده في كتب المكتبة، ويفتح نصّه بالضغط عليه. وإن لم يكن الكتاب مثبتاً فثبّته من «طلب العلم ← الكتب وتحميلها».</p>';
    el.innerHTML = h;
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { location.hash = '#/tarbiya/' + b.dataset.t; });
    el.querySelectorAll('[data-ag]').forEach(b => b.onclick = () => { location.hash = '#/tarbiya/barnamaj/' + b.dataset.ag; });
  };
})();
