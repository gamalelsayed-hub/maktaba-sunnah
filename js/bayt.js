/* 🏡 إدارة البيت: وجبات الأسبوع، ومخزون المطبخ والثلاجة، وقائمة التسوق التلقائية،
   ومهام البيت بالتناوب، ودروس الأولاد ومواعيدها، وميزانية البيت ومصاريفه — بتنبيهات، وكل شيء على الجوال فقط. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const num = (v, d = 0) => { const x = parseFloat(String(v).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[٫,]/g, '.')); return isFinite(x) ? x : d; };
  const fmt = n => D((Math.round(n * 100) / 100).toLocaleString('en-US'));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MEALS = [['b', '🌅 الفطور'], ['l', '🍲 الغداء'], ['d', '🌙 العشاء']];
  const UNITS = ['حبة', 'كجم', 'جم', 'لتر', 'مل', 'كوب', 'ملعقة', 'علبة', 'كيس', 'ربطة', 'رغيف', 'طبق'];
  const norm = s => AR.normalize(String(s || '')).trim();

  // وصفات أمثلة يبدأ بها البيت (يعدّلها أو يحذفها)
  const SAMPLE_RECIPES = [
    { name: 'أرز بالدجاج (كبسة)', cat: 'غداء', serves: 5, ings: [['دجاج', 1.2, 'كجم'], ['أرز', 1, 'كجم'], ['بصل', 2, 'حبة'], ['طماطم', 3, 'حبة'], ['بهارات كبسة', 2, 'ملعقة'], ['زيت', 3, 'ملعقة']], steps: 'حمّر البصل، أضف الدجاج والبهارات والطماطم، ثم الماء حتى ينضج الدجاج، ثم أضف الأرز واتركه على نار هادئة.' },
    { name: 'فول مدمس', cat: 'فطور', serves: 4, ings: [['فول', 1, 'علبة'], ['ليمون', 1, 'حبة'], ['كمون', 1, 'ملعقة'], ['زيت زيتون', 2, 'ملعقة'], ['خبز', 4, 'رغيف']], steps: 'سخّن الفول واهرسه، وأضف الكمون والليمون وزيت الزيتون، وقدّمه مع الخبز.' },
    { name: 'شوربة عدس', cat: 'عشاء', serves: 4, ings: [['عدس', 0.5, 'كجم'], ['بصل', 1, 'حبة'], ['جزر', 2, 'حبة'], ['كمون', 1, 'ملعقة'], ['ليمون', 1, 'حبة']], steps: 'اسلق العدس مع البصل والجزر حتى ينضج، واخفقه، وأضف الكمون، وقدّمه مع الليمون.' },
    { name: 'مكرونة بالصلصة', cat: 'غداء', serves: 4, ings: [['مكرونة', 0.5, 'كجم'], ['صلصة طماطم', 1, 'علبة'], ['ثوم', 3, 'حبة'], ['لحم مفروم', 0.5, 'كجم']], steps: 'اسلق المكرونة، وحمّر المفروم مع الثوم ثم أضف الصلصة، واخلط الجميع.' },
    { name: 'بيض وجبن وخضار', cat: 'فطور', serves: 4, ings: [['بيض', 6, 'حبة'], ['جبن', 0.25, 'كجم'], ['خيار', 2, 'حبة'], ['طماطم', 2, 'حبة'], ['خبز', 4, 'رغيف']], steps: 'اسلق البيض أو اقلِه، وقطّع الخضار، وقدّمها مع الجبن والخبز.' },
  ];
  const DEF_CATS = [['🏠', 'الإيجار والسكن'], ['🛒', 'الطعام والبقالة'], ['💡', 'الكهرباء والماء والإنترنت'], ['🚗', 'المواصلات والسيارة'], ['🎓', 'تعليم الأولاد'], ['💊', 'العلاج'], ['👕', 'الملابس'], ['🤲', 'الصدقات والزكاة'], ['🎁', 'متفرقات'], ['💰', 'الادخار']];

  async function get() {
    const b = Object.assign({ recipes: null, plan: {}, pantry: [], extra: [], bought: {}, chores: [], choreDone: {}, lessons: [], budget: null }, (await DB.setting('bayt')) || {});
    if (!b.recipes) b.recipes = SAMPLE_RECIPES.map(r => ({ id: uid(), name: r.name, cat: r.cat, serves: r.serves, ings: r.ings.map(([n, q, u]) => ({ n, q, u })), steps: r.steps, sample: true }));
    if (!b.budget) b.budget = { income: [], cats: DEF_CATS.map(([ic, n]) => ({ id: uid(), ic, n, limit: 0 })), bills: [], exp: [] };
    return b;
  }
  const save = b => DB.setting('bayt', b);

  // ===== قائمة التسوق: مقادير وجبات الأسبوع ناقصاً ما في المطبخ، وما نقص عن الحد الأدنى، وما أضفته بيدك =====
  function shoppingList(b) {
    const need = new Map(), key = (n, u) => norm(n) + '|' + (u || '');
    for (const d of Object.keys(b.plan)) for (const m of Object.keys(b.plan[d] || {})) {
      const r = b.recipes.find(x => x.id === b.plan[d][m]); if (!r) continue;
      for (const g of r.ings) { const k = key(g.n, g.u), cur = need.get(k) || { n: g.n, u: g.u, q: 0, from: new Set() }; cur.q += num(g.q); cur.from.add(r.name); need.set(k, cur); }
    }
    const out = [];
    for (const [k, x] of need) {
      const have = b.pantry.filter(p => key(p.n, p.u) === k).reduce((s, p) => s + num(p.q), 0);
      const q = Math.max(0, Math.round((x.q - have) * 100) / 100);
      if (q > 0) out.push({ id: 'p:' + k, n: x.n, q, u: x.u, why: 'لوصفات: ' + [...x.from].slice(0, 2).join('، ') });
    }
    for (const p of b.pantry) if (num(p.min) > 0 && num(p.q) < num(p.min) && !out.find(o => norm(o.n) === norm(p.n))) out.push({ id: 'm:' + p.id, n: p.n, q: Math.round((num(p.min) - num(p.q)) * 100) / 100, u: p.u, why: 'أقل من الحد الأدنى في المطبخ' });
    for (const e of b.extra) out.push({ id: 'e:' + e.id, n: e.n, q: e.q, u: e.u, why: 'أضفته بنفسك', extra: true });
    return out;
  }

  // ===== المهام والدروس: هل الموعد في هذا اليوم؟ =====
  const dueOn = (x, d) => x.freq === 'daily' ? true : x.freq === 'monthly' ? d.getDate() === (+x.dom || 1) : (x.days || []).includes(d.getDay());
  const whoOf = (x, d) => { const p = (x.who || '').split(/[،,]/).map(s => s.trim()).filter(Boolean); if (p.length < 2 || !x.rotate) return p.join('، '); const w = Math.floor((d - new Date(2024, 0, 7)) / (7 * 864e5)); return p[((x.freq === 'daily' ? Math.floor((d - new Date(2024, 0, 7)) / 864e5) : w) % p.length + p.length) % p.length]; };

  // ===== الشاشة =====
  const TABS = [['home', '🏡 اليوم'], ['meals', '🍲 الوجبات'], ['pantry', '🧺 المطبخ'], ['shop', '🛒 التسوق'], ['chores', '🧹 مهام البيت'], ['lessons', '📚 دروس الأولاد'], ['budget', '💰 الميزانية']];
  V.bayt = async (el, [tab, sub]) => {
    tab = TABS.find(t => t[0] === tab) ? tab : 'home';
    const b = await get();
    const head = `<div class="row"><h1>🏡 إدارة البيت</h1></div>
      <div class="tabs bt-tabs">${TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
    el.innerHTML = head + '<div id="btBody"></div>';
    el.querySelectorAll('[data-tab]').forEach(x => x.onclick = () => { location.hash = '#/bayt/' + x.dataset.tab; });
    const body = el.querySelector('#btBody');
    const R = { home, meals, pantry, shop, chores, lessons, budget }[tab];
    await R(body, b, sub);
  };
  const rer = () => APP.rerender();
  const resched = async () => { if (window.NOTIFY) { if ((await NOTIFY.status()).perm !== 'granted') await NOTIFY.request(); NOTIFY.rescheduleAll(); } };

  // ----- اليوم: ملخص -----
  async function home(el, b) {
    const now = new Date(), di = now.getDay(), p = b.plan[di] || {}, dk = dayKey();
    const ch = b.chores.filter(x => dueOn(x, now)), done = b.choreDone[dk] || {};
    const ls = b.lessons.filter(x => (x.days || []).includes(di)).sort((a, c) => (a.time || '').localeCompare(c.time || ''));
    const shopN = shoppingList(b).filter(x => !b.bought[x.id]).length;
    const m = monthKey(), spent = b.budget.exp.filter(e => e.date.startsWith(m)).reduce((s, e) => s + num(e.amt), 0), inc = b.budget.income.reduce((s, x) => s + num(x.amt), 0);
    el.innerHTML = `<div class="sub">بيتك في صفحة واحدة: ماذا نطبخ اليوم، ومهام البيت، ودروس الأولاد، والتسوق، والميزانية. كل البيانات على جوالك فقط.</div>
      <div class="bt-grid">
        <a class="card bt-card" href="#/bayt/meals"><b>🍲 وجبات اليوم (${DAYS[di]})</b>${MEALS.map(([k, l]) => { const r = b.recipes.find(x => x.id === p[k]); return `<div class="bt-li">${l}: ${r ? esc(r.name) : '<span class="muted">لم تُحدَّد</span>'}</div>`; }).join('')}</a>
        <a class="card bt-card" href="#/bayt/chores"><b>🧹 مهام اليوم</b>${ch.length ? ch.slice(0, 5).map(x => `<div class="bt-li">${done[x.id] ? '✅' : '⬜'} ${esc(x.t)}${whoOf(x, now) ? ` <small class="muted">— ${esc(whoOf(x, now))}</small>` : ''}</div>`).join('') : '<div class="muted">لا مهام اليوم</div>'}</a>
        <a class="card bt-card" href="#/bayt/lessons"><b>📚 دروس اليوم</b>${ls.length ? ls.map(x => `<div class="bt-li">${esc(x.time || '')} — ${esc(x.child)}: ${esc(x.subject)}${x.teacher ? ` <small class="muted">(${esc(x.teacher)})</small>` : ''}</div>`).join('') : '<div class="muted">لا دروس اليوم</div>'}</a>
        <a class="card bt-card" href="#/bayt/shop"><b>🛒 قائمة التسوق</b><div class="bt-big">${D(shopN)}</div><div class="muted">صنفاً مطلوباً</div></a>
        <a class="card bt-card" href="#/bayt/budget"><b>💰 ميزانية هذا الشهر</b><div class="bt-big">${fmt(spent)}</div><div class="muted">مصروف${inc ? ` من دخل ${fmt(inc)} — المتبقي ${fmt(inc - spent)}` : ''}</div></a>
      </div>`;
  }

  // ----- الوجبات والوصفات -----
  async function meals(el, b) {
    const opt = (sel) => `<option value="">—</option>` + b.recipes.map(r => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
    el.innerHTML = `<div class="card"><div class="row"><h3 style="margin:0">📅 خطة وجبات الأسبوع</h3><span class="spacer"></span><button class="btn sm" id="mlClear">مسح الخطة</button></div>
        <div class="bt-week">${DAYS.map((d, i) => `<div class="bt-day"><b>${d}</b>${MEALS.map(([k, l]) => `<label>${l}<select data-pl="${i}:${k}">${opt((b.plan[i] || {})[k])}</select></label>`).join('')}</div>`).join('')}</div>
        <div class="muted" style="font-size:12.5px;margin-top:6px">مقادير الوصفات المختارة تُحسب تلقائياً في «قائمة التسوق» بعد طرح ما عندك في المطبخ.</div></div>
      <div class="row"><h2>📖 وصفاتي (${D(b.recipes.length)})</h2><span class="spacer"></span><button class="btn primary" id="rcAdd">➕ وصفة جديدة</button></div>
      <div class="bt-recipes">${b.recipes.map(r => `<div class="card bt-rc"><div class="row"><b>${esc(r.name)}</b><span class="spacer"></span><span class="tag">${esc(r.cat || '')}</span></div>
        <small class="muted">لـ ${D(r.serves || 1)} أشخاص · ${r.ings.map(g => esc(g.n)).join('، ')}</small>
        <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm" data-rc="${r.id}">✏️ تعديل</button><button class="btn sm" data-rcd="${r.id}">🗑️</button></div></div>`).join('')}</div>`;
    el.querySelectorAll('[data-pl]').forEach(s => s.onchange = async () => { const [d, k] = s.dataset.pl.split(':'); b.plan[d] = b.plan[d] || {}; if (s.value) b.plan[d][k] = s.value; else delete b.plan[d][k]; await save(b); });
    el.querySelector('#mlClear').onclick = async () => { if (!(await APP.ask('مسح خطة وجبات الأسبوع؟'))) return; b.plan = {}; await save(b); rer(); };
    el.querySelector('#rcAdd').onclick = () => recipeForm(b, null);
    el.querySelectorAll('[data-rc]').forEach(x => x.onclick = () => recipeForm(b, b.recipes.find(r => r.id === x.dataset.rc)));
    el.querySelectorAll('[data-rcd]').forEach(x => x.onclick = async () => { if (!(await APP.ask('حذف هذه الوصفة؟'))) return; b.recipes = b.recipes.filter(r => r.id !== x.dataset.rcd); for (const d in b.plan) for (const k in b.plan[d]) if (b.plan[d][k] === x.dataset.rcd) delete b.plan[d][k]; await save(b); rer(); });
  }
  function recipeForm(b, r) {
    r = r || { id: uid(), name: '', cat: 'غداء', serves: 4, ings: [{ n: '', q: '', u: 'حبة' }], steps: '' };
    const row = (g, i) => `<div class="bt-ing" data-i="${i}"><input placeholder="المكوّن" value="${esc(g.n)}" data-f="n"><input placeholder="الكمية" value="${esc(g.q)}" data-f="q" inputmode="decimal" style="width:70px"><select data-f="u">${UNITS.map(u => `<option ${u === g.u ? 'selected' : ''}>${u}</option>`).join('')}</select><button class="btn sm" data-x="${i}">✕</button></div>`;
    APP.modal(`<h2 style="margin-top:0">${r.name ? '✏️ تعديل وصفة' : '➕ وصفة جديدة'}</h2>
      <label class="fld">اسم الوصفة <input id="rN" value="${esc(r.name)}"></label>
      <div class="row" style="gap:8px"><label class="fld">النوع <select id="rC">${['فطور', 'غداء', 'عشاء', 'حلويات', 'مشروبات', 'سلطات'].map(c => `<option ${c === r.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label class="fld">لعدد أشخاص <input id="rS" type="number" min="1" value="${r.serves || 4}" style="width:70px"></label></div>
      <b>المكوّنات والمقادير</b><div id="rI">${r.ings.map(row).join('')}</div><button class="btn sm" id="rIA">➕ مكوّن</button>
      <label class="fld" style="margin-top:8px">طريقة التحضير <textarea id="rSt" rows="4" style="width:100%">${esc(r.steps || '')}</textarea></label>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn primary" id="rOk">حفظ</button><button class="btn" id="rNo">إلغاء</button></div>`, box => {
      const read = () => [...box.querySelectorAll('.bt-ing')].map(x => ({ n: x.querySelector('[data-f=n]').value.trim(), q: x.querySelector('[data-f=q]').value.trim(), u: x.querySelector('[data-f=u]').value })).filter(g => g.n);
      const bindX = () => box.querySelectorAll('[data-x]').forEach(x => x.onclick = () => x.parentElement.remove());
      bindX();
      box.querySelector('#rIA').onclick = () => { box.querySelector('#rI').insertAdjacentHTML('beforeend', row({ n: '', q: '', u: 'حبة' }, Date.now())); bindX(); };
      box.querySelector('#rNo').onclick = () => APP.closeModal();
      box.querySelector('#rOk').onclick = async () => {
        const name = box.querySelector('#rN').value.trim(); if (!name) { APP.toast('اكتب اسم الوصفة'); return; }
        const y = { id: r.id, name, cat: box.querySelector('#rC').value, serves: +box.querySelector('#rS').value || 1, ings: read(), steps: box.querySelector('#rSt').value.trim() };
        const i = b.recipes.findIndex(x => x.id === y.id); if (i >= 0) b.recipes[i] = y; else b.recipes.push(y);
        await save(b); APP.closeModal(); rer();
      };
    });
  }

  // ----- المطبخ والثلاجة (المخزون) -----
  async function pantry(el, b) {
    const places = ['الثلاجة', 'الفريزر', 'الخزين', 'المنظفات'];
    el.innerHTML = `<div class="sub">سجّل ما عندك في الثلاجة والخزين. وحدّد «الحد الأدنى» للأشياء الأساسية: إذا نقصت عنه تُضاف تلقائياً لقائمة التسوق.</div>
      <div class="card bt-add"><input id="pN" placeholder="الصنف (أرز، حليب، بيض…)"><input id="pQ" placeholder="الكمية" inputmode="decimal" style="width:80px"><select id="pU">${UNITS.map(u => `<option>${u}</option>`).join('')}</select><select id="pP">${places.map(p => `<option>${p}</option>`).join('')}</select><input id="pM" placeholder="الحد الأدنى" inputmode="decimal" style="width:90px"><button class="btn primary" id="pAdd">➕ أضف</button></div>
      ${places.map(pl => { const its = b.pantry.filter(x => (x.place || 'الخزين') === pl); return its.length ? `<h3>${pl === 'الثلاجة' ? '🧊' : pl === 'الفريزر' ? '❄️' : pl === 'المنظفات' ? '🧽' : '🥫'} ${pl}</h3><div class="bt-list">${its.map(x => `<div class="bt-row ${num(x.min) > 0 && num(x.q) < num(x.min) ? 'low' : ''}"><b>${esc(x.n)}</b><span class="spacer"></span><button class="btn sm" data-pm="${x.id}">−</button><span class="bt-q">${D(x.q || 0)} ${esc(x.u || '')}</span><button class="btn sm" data-pp="${x.id}">+</button>${num(x.min) ? `<small class="muted">حد ${D(x.min)}</small>` : ''}<button class="btn sm" data-pd="${x.id}">🗑️</button></div>`).join('')}</div>` : ''; }).join('') || '<div class="card muted">المطبخ فارغ — أضف أول صنف.</div>'}`;
    el.querySelector('#pAdd').onclick = async () => {
      const n = el.querySelector('#pN').value.trim(); if (!n) return APP.toast('اكتب اسم الصنف');
      const ex = b.pantry.find(x => norm(x.n) === norm(n) && x.u === el.querySelector('#pU').value);
      if (ex) ex.q = num(ex.q) + num(el.querySelector('#pQ').value, 1);
      else b.pantry.push({ id: uid(), n, q: num(el.querySelector('#pQ').value, 1), u: el.querySelector('#pU').value, place: el.querySelector('#pP').value, min: num(el.querySelector('#pM').value) });
      await save(b); rer();
    };
    const step = (id, d) => async () => { const x = b.pantry.find(y => y.id === id); x.q = Math.max(0, Math.round((num(x.q) + d) * 100) / 100); await save(b); rer(); };
    el.querySelectorAll('[data-pm]').forEach(x => x.onclick = step(x.dataset.pm, -1));
    el.querySelectorAll('[data-pp]').forEach(x => x.onclick = step(x.dataset.pp, 1));
    el.querySelectorAll('[data-pd]').forEach(x => x.onclick = async () => { b.pantry = b.pantry.filter(y => y.id !== x.dataset.pd); await save(b); rer(); });
  }

  // ----- قائمة التسوق -----
  async function shop(el, b) {
    const L = shoppingList(b), left = L.filter(x => !b.bought[x.id]), got = L.filter(x => b.bought[x.id]);
    const line = x => `<div class="bt-row ${b.bought[x.id] ? 'done' : ''}"><button class="tk-chk ${b.bought[x.id] ? 'on' : ''}" data-buy="${esc(x.id)}">${b.bought[x.id] ? '✓' : ''}</button><b>${esc(x.n)}</b><span class="bt-q">${D(x.q)} ${esc(x.u || '')}</span><small class="muted">${esc(x.why)}</small><span class="spacer"></span>${x.extra ? `<button class="btn sm" data-ed="${esc(x.id)}">🗑️</button>` : ''}</div>`;
    el.innerHTML = `<div class="sub">تُحسب القائمة تلقائياً: مقادير وجبات الأسبوع ناقصاً ما في المطبخ، وما نقص عن الحد الأدنى، وما تضيفه بنفسك. وعند شراء صنف يُضاف للمطبخ.</div>
      <div class="card bt-add"><input id="sN" placeholder="أضف صنفاً للقائمة"><input id="sQ" placeholder="الكمية" inputmode="decimal" style="width:80px"><select id="sU">${UNITS.map(u => `<option>${u}</option>`).join('')}</select><button class="btn primary" id="sAdd">➕</button></div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0"><button class="btn" id="sShare">📤 أرسل القائمة (واتساب أو غيره)</button><button class="btn" id="sImp">📥 استلام قائمة من رسالة</button>${got.length ? '<button class="btn" id="sReset">↺ قائمة جديدة</button>' : ''}</div>
      <h3>🛒 المطلوب (${D(left.length)})</h3><div class="bt-list">${left.map(line).join('') || '<div class="muted">لا شيء مطلوب الآن 👍</div>'}</div>
      ${got.length ? `<h3>✅ تم شراؤه (${D(got.length)})</h3><div class="bt-list">${got.map(line).join('')}</div>` : ''}`;
    el.querySelector('#sImp').onclick = async () => { const r = await APP.ask('📥 الصق قائمة التسوق التي وصلتك', [{ key: 't', label: 'كل صنف في سطر (تُتجاهل الأرقام والرموز في أول السطر)', type: 'textarea' }]); if (!r || !r.t.trim()) return;
      let n = 0; for (const ln of r.t.split(/\n/)) { const x = ln.replace(/^[\s\-•*✓✔️☐▫️·\d٠-٩.)]+/, '').trim(); if (!x || /^(قائمة|🛒)/.test(x)) continue; const m = x.match(/^(.*?)\s*[—\-:]\s*([\d٠-٩.]+)\s*(\S*)$/); b.extra.push({ id: uid(), n: (m ? m[1] : x).slice(0, 60), q: m ? num(m[2], 1) : 1, u: m && UNITS.includes(m[3]) ? m[3] : UNITS[0] }); n++; }
      await save(b); APP.toast('أُضيف ' + AR.toArabicDigits(n) + ' صنف'); rer(); };
    el.querySelector('#sAdd').onclick = async () => { const n = el.querySelector('#sN').value.trim(); if (!n) return; b.extra.push({ id: uid(), n, q: num(el.querySelector('#sQ').value, 1), u: el.querySelector('#sU').value }); await save(b); rer(); };
    el.querySelectorAll('[data-buy]').forEach(x => x.onclick = async () => {
      const id = x.dataset.buy, it = L.find(y => y.id === id);
      if (b.bought[id]) delete b.bought[id];
      else { b.bought[id] = 1; // يُضاف للمطبخ
        const ex = b.pantry.find(p => norm(p.n) === norm(it.n) && p.u === it.u); if (ex) ex.q = num(ex.q) + num(it.q); else b.pantry.push({ id: uid(), n: it.n, q: num(it.q), u: it.u, place: 'الخزين', min: 0 }); }
      await save(b); rer();
    });
    el.querySelectorAll('[data-ed]').forEach(x => x.onclick = async () => { const id = x.dataset.ed.slice(2); b.extra = b.extra.filter(e => e.id !== id); await save(b); rer(); });
    const rs = el.querySelector('#sReset'); if (rs) rs.onclick = async () => { b.bought = {}; b.extra = b.extra.filter(e => !L.find(x => x.id === 'e:' + e.id && got.includes(x))); await save(b); rer(); };
    el.querySelector('#sShare').onclick = async () => {
      const t = '🛒 قائمة التسوق\n' + left.map(x => `• ${x.n}: ${x.q} ${x.u || ''}`).join('\n') + '\n\n— من تطبيق «زاد الأسرة المسلمة»';
      if (navigator.share) { try { await navigator.share({ text: t }); return; } catch (e) { } }
      APP.copy(t);
    };
  }

  // ----- مهام البيت -----
  async function chores(el, b) {
    const now = new Date(), dk = dayKey(), done = b.choreDone[dk] || {};
    const today = b.chores.filter(x => dueOn(x, now));
    const fq = x => x.freq === 'daily' ? 'يومياً' : x.freq === 'monthly' ? 'شهرياً يوم ' + D(x.dom || 1) : (x.days || []).map(d => DAYS[d]).join('، ');
    el.innerHTML = `<div class="sub">مهام البيت المتكررة: التنظيف، والغسيل، والكي، وسقي الزرع… حدّد من يقوم بها (ويمكن أن تدور بين أفراد البيت)، ووقت التذكير.</div>
      <div class="row"><h3 style="margin:0">📅 مهام اليوم — ${DAYS[now.getDay()]}</h3><span class="spacer"></span><button class="btn primary" id="chAdd">➕ مهمة</button></div>
      <div class="bt-list">${today.map(x => `<div class="bt-row ${done[x.id] ? 'done' : ''}"><button class="tk-chk ${done[x.id] ? 'on' : ''}" data-cd="${x.id}">${done[x.id] ? '✓' : ''}</button><span>${esc(x.ic || '🧹')}</span><b>${esc(x.t)}</b>${whoOf(x, now) ? `<small class="muted">— ${esc(whoOf(x, now))}</small>` : ''}<span class="spacer"></span><small class="muted">${esc(x.time || '')}</small></div>`).join('') || '<div class="muted">لا مهام اليوم</div>'}</div>
      <h3>كل المهام</h3><div class="bt-list">${b.chores.map(x => `<div class="bt-row"><span>${esc(x.ic || '🧹')}</span><b>${esc(x.t)}</b><small class="muted">${fq(x)}${x.time ? ' · ' + esc(x.time) : ''}${x.who ? ' · ' + esc(x.who) + (x.rotate ? ' (بالتناوب)' : '') : ''}</small><span class="spacer"></span><button class="btn sm" data-ce="${x.id}">✏️</button><button class="btn sm" data-cx="${x.id}">🗑️</button></div>`).join('') || '<div class="muted">أضف مهام البيت المتكررة.</div>'}</div>`;
    el.querySelector('#chAdd').onclick = () => choreForm(b, null);
    el.querySelectorAll('[data-ce]').forEach(x => x.onclick = () => choreForm(b, b.chores.find(c => c.id === x.dataset.ce)));
    el.querySelectorAll('[data-cx]').forEach(x => x.onclick = async () => { b.chores = b.chores.filter(c => c.id !== x.dataset.cx); await save(b); resched(); rer(); });
    el.querySelectorAll('[data-cd]').forEach(x => x.onclick = async () => { b.choreDone[dk] = b.choreDone[dk] || {}; if (b.choreDone[dk][x.dataset.cd]) delete b.choreDone[dk][x.dataset.cd]; else b.choreDone[dk][x.dataset.cd] = 1; Object.keys(b.choreDone).sort().slice(0, -45).forEach(k => delete b.choreDone[k]); await save(b); rer(); });
  }
  function choreForm(b, x) {
    x = x || { id: uid(), t: '', ic: '🧹', freq: 'weekly', days: [new Date().getDay()], dom: 1, time: '', who: '', rotate: false, remind: true };
    const ICS = ['🧹', '🧺', '👕', '🍽️', '🪴', '🛏️', '🚿', '🗑️', '🧽', '🛒', '🚗', '💊'];
    APP.modal(`<h2 style="margin-top:0">${x.t ? '✏️ تعديل مهمة' : '➕ مهمة بيت'}</h2>
      <label class="fld">المهمة <input id="cT" value="${esc(x.t)}" placeholder="تنظيف المطبخ، غسيل الملابس…"></label>
      <div class="bt-ics">${ICS.map(i => `<button class="btn sm ${i === x.ic ? 'on' : ''}" data-ic="${i}">${i}</button>`).join('')}</div>
      <label class="fld">التكرار <select id="cF"><option value="daily" ${x.freq === 'daily' ? 'selected' : ''}>يومياً</option><option value="weekly" ${x.freq === 'weekly' ? 'selected' : ''}>أيام محددة من الأسبوع</option><option value="monthly" ${x.freq === 'monthly' ? 'selected' : ''}>شهرياً</option></select></label>
      <div id="cDays" class="bt-days">${DAYS.map((d, i) => `<label><input type="checkbox" value="${i}" ${(x.days || []).includes(i) ? 'checked' : ''}> ${d}</label>`).join('')}</div>
      <label class="fld" id="cDomL">يوم الشهر <input id="cDom" type="number" min="1" max="28" value="${x.dom || 1}" style="width:70px"></label>
      <label class="fld">وقت التذكير <input id="cTm" type="time" value="${esc(x.time)}"></label>
      <label class="fld">من يقوم بها؟ <input id="cW" value="${esc(x.who)}" placeholder="مثال: أحمد، سارة، أمي" list="cWl"><datalist id="cWl">${(window.__usraNames || []).map(n => `<option value="${esc(n)}">`).join('')}</datalist></label>
      <label><input type="checkbox" id="cR" ${x.rotate ? 'checked' : ''}> بالتناوب بين الأسماء (كل مرة على واحد)</label>
      <label style="display:block"><input type="checkbox" id="cRm" ${x.remind !== false ? 'checked' : ''}> 🔔 ذكّرني في الوقت المحدد</label>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn primary" id="cOk">حفظ</button><button class="btn" id="cNo">إلغاء</button></div>`, box => {
      let ic = x.ic;
      box.querySelectorAll('[data-ic]').forEach(e => e.onclick = () => { ic = e.dataset.ic; box.querySelectorAll('[data-ic]').forEach(z => z.classList.toggle('on', z === e)); });
      const sh = () => { const f = box.querySelector('#cF').value; box.querySelector('#cDays').style.display = f === 'weekly' ? '' : 'none'; box.querySelector('#cDomL').style.display = f === 'monthly' ? '' : 'none'; };
      box.querySelector('#cF').onchange = sh; sh();
      box.querySelector('#cNo').onclick = () => APP.closeModal();
      box.querySelector('#cOk').onclick = async () => {
        const t = box.querySelector('#cT').value.trim(); if (!t) return APP.toast('اكتب المهمة');
        const y = { id: x.id, t, ic, freq: box.querySelector('#cF').value, days: [...box.querySelectorAll('#cDays input:checked')].map(c => +c.value), dom: +box.querySelector('#cDom').value || 1, time: box.querySelector('#cTm').value, who: box.querySelector('#cW').value.trim(), rotate: box.querySelector('#cR').checked, remind: box.querySelector('#cRm').checked };
        if (y.freq === 'weekly' && !y.days.length) return APP.toast('اختر يوماً على الأقل');
        const i = b.chores.findIndex(c => c.id === y.id); if (i >= 0) b.chores[i] = y; else b.chores.push(y);
        await save(b); APP.closeModal(); if (y.remind && y.time) resched(); rer();
      };
    });
  }

  // ----- دروس الأولاد -----
  async function lessons(el, b) {
    const kids = [...new Set(b.lessons.map(x => x.child))];
    el.innerHTML = `<div class="sub">جدول دروس الأولاد: المادة، والمعلّم ورقمه، والأيام والوقت، وتذكير قبل الدرس.</div>
      <div class="row"><span class="spacer"></span><button class="btn primary" id="lsAdd">➕ درس</button></div>
      <div class="bt-tt">${DAYS.map((d, i) => { const L = b.lessons.filter(x => (x.days || []).includes(i)).sort((a, c) => (a.time || '').localeCompare(c.time || '')); return `<div class="bt-day ${i === new Date().getDay() ? 'today' : ''}"><b>${d}</b>${L.map(x => `<div class="bt-ls" style="--h:${(kids.indexOf(x.child) * 67) % 360}"><b>${esc(x.time || '')}</b> ${esc(x.child)}: ${esc(x.subject)}${x.teacher ? `<small>${esc(x.teacher)}</small>` : ''}</div>`).join('') || '<small class="muted">—</small>'}</div>`; }).join('')}</div>
      <h3>كل الدروس</h3><div class="bt-list">${b.lessons.map(x => `<div class="bt-row"><b>${esc(x.child)}: ${esc(x.subject)}</b><small class="muted">${(x.days || []).map(d => DAYS[d]).join('، ')} · ${esc(x.time || '')}${x.teacher ? ' · ' + esc(x.teacher) : ''}${x.fee ? ' · ' + fmt(num(x.fee)) + ' شهرياً' : ''}</small><span class="spacer"></span>${x.phone ? `<a class="btn sm" href="tel:${esc(x.phone)}">📞</a>` : ''}<button class="btn sm" data-le="${x.id}">✏️</button><button class="btn sm" data-lx="${x.id}">🗑️</button></div>`).join('') || '<div class="muted">أضف أول درس.</div>'}</div>`;
    el.querySelector('#lsAdd').onclick = () => lessonForm(b, null);
    el.querySelectorAll('[data-le]').forEach(x => x.onclick = () => lessonForm(b, b.lessons.find(c => c.id === x.dataset.le)));
    el.querySelectorAll('[data-lx]').forEach(x => x.onclick = async () => { b.lessons = b.lessons.filter(c => c.id !== x.dataset.lx); await save(b); resched(); rer(); });
  }
  function lessonForm(b, x) {
    x = x || { id: uid(), child: '', subject: '', teacher: '', phone: '', days: [], time: '', before: 30, fee: '' };
    APP.modal(`<h2 style="margin-top:0">${x.subject ? '✏️ تعديل درس' : '➕ درس جديد'}</h2>
      <label class="fld">اسم الابن أو البنت <input id="lC" value="${esc(x.child)}"></label>
      <label class="fld">المادة <input id="lS" value="${esc(x.subject)}" placeholder="رياضيات، قرآن، إنجليزي…"></label>
      <label class="fld">اسم المعلّم <input id="lT" value="${esc(x.teacher)}"></label>
      <label class="fld">جوال المعلّم <input id="lP" value="${esc(x.phone)}" inputmode="tel"></label>
      <div class="bt-days" id="lD">${DAYS.map((d, i) => `<label><input type="checkbox" value="${i}" ${(x.days || []).includes(i) ? 'checked' : ''}> ${d}</label>`).join('')}</div>
      <div class="row" style="gap:8px"><label class="fld">الوقت <input id="lTm" type="time" value="${esc(x.time)}"></label><label class="fld">ذكّرني قبلها <select id="lB">${[[0, 'بلا تذكير'], [15, '١٥ دقيقة'], [30, '٣٠ دقيقة'], [60, 'ساعة']].map(([v, l]) => `<option value="${v}" ${+x.before === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <label class="fld">الرسوم الشهرية (اختياري — تُضاف للميزانية) <input id="lF" value="${esc(x.fee)}" inputmode="decimal"></label>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn primary" id="lOk">حفظ</button><button class="btn" id="lNo">إلغاء</button></div>`, box => {
      box.querySelector('#lNo').onclick = () => APP.closeModal();
      box.querySelector('#lOk').onclick = async () => {
        const y = { id: x.id, child: box.querySelector('#lC').value.trim(), subject: box.querySelector('#lS').value.trim(), teacher: box.querySelector('#lT').value.trim(), phone: box.querySelector('#lP').value.trim(), days: [...box.querySelectorAll('#lD input:checked')].map(c => +c.value), time: box.querySelector('#lTm').value, before: +box.querySelector('#lB').value, fee: box.querySelector('#lF').value.trim() };
        if (!y.child || !y.subject) return APP.toast('اكتب اسم الابن والمادة');
        if (!y.days.length || !y.time) return APP.toast('اختر الأيام والوقت');
        const i = b.lessons.findIndex(c => c.id === y.id); if (i >= 0) b.lessons[i] = y; else b.lessons.push(y);
        await save(b); APP.closeModal(); if (y.before) resched(); rer();
      };
    });
  }

  // ----- الميزانية -----
  async function budget(el, b, sub) {
    const B = b.budget, m = sub && /^\d{4}-\d{2}$/.test(sub) ? sub : monthKey();
    const [yy, mm] = m.split('-').map(Number), prev = monthKey(new Date(yy, mm - 2, 1)), next = monthKey(new Date(yy, mm, 1));
    const exp = B.exp.filter(e => e.date.startsWith(m)).sort((a, c) => c.date.localeCompare(a.date));
    const inc = B.income.reduce((s, x) => s + num(x.amt), 0), spent = exp.reduce((s, e) => s + num(e.amt), 0);
    const byCat = id => exp.filter(e => e.cat === id).reduce((s, e) => s + num(e.amt), 0);
    const planned = B.cats.reduce((s, c) => s + num(c.limit), 0);
    const monthName = new Date(yy, mm - 1, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    el.innerHTML = `<div class="row bt-mnav"><a class="btn sm" href="#/bayt/budget/${prev}">→</a><h3 style="margin:0">${monthName}</h3><a class="btn sm" href="#/bayt/budget/${next}">←</a></div>
      <div class="bt-sum"><div><small>الدخل</small><b>${fmt(inc)}</b></div><div><small>المصروف</small><b>${fmt(spent)}</b></div><div class="${inc - spent < 0 ? 'neg' : 'pos'}"><small>المتبقي</small><b>${fmt(inc - spent)}</b></div></div>
      ${planned > inc && inc ? `<div class="warn">مجموع حدود البنود (${fmt(planned)}) أكبر من الدخل (${fmt(inc)}). راجع الحدود.</div>` : ''}
      <div class="card bt-add"><input id="eA" placeholder="المبلغ" inputmode="decimal" style="width:100px"><select id="eC">${B.cats.map(c => `<option value="${c.id}">${c.ic} ${esc(c.n)}</option>`).join('')}</select><input id="eN" placeholder="ملاحظة (اختياري)"><input id="eD" type="date" value="${m === monthKey() ? dayKey() : m + '-01'}"><button class="btn primary" id="eAdd">➕ مصروف</button></div>
      <h3>📊 البنود</h3><div class="bt-cats">${B.cats.map(c => { const s = byCat(c.id), l = num(c.limit), p = l ? Math.min(100, Math.round(s / l * 100)) : 0; return `<div class="bt-cat ${l && s > l ? 'over' : ''}"><div class="row"><span>${c.ic}</span><b>${esc(c.n)}</b><span class="spacer"></span><small>${fmt(s)}${l ? ' / ' + fmt(l) : ''}</small><button class="btn sm" data-cl="${c.id}">✏️</button></div>${l ? `<div class="kh-prog"><i style="width:${p}%"></i></div>` : ''}</div>`; }).join('')}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0"><button class="btn" id="incE">💵 الدخل الشهري</button><button class="btn" id="catA">➕ بند جديد</button><button class="btn" id="billA">🧾 فاتورة متكررة</button></div>
      ${B.bills.length ? `<h3>🧾 الفواتير والالتزامات الشهرية</h3><div class="bt-list">${B.bills.map(x => { const paid = B.exp.some(e => e.bill === x.id && e.date.startsWith(m)); return `<div class="bt-row ${paid ? 'done' : ''}"><b>${esc(x.n)}</b><small class="muted">${fmt(num(x.amt))} · يوم ${D(x.day)} من كل شهر</small><span class="spacer"></span>${paid ? '<span class="tag st-ok">✔ مدفوعة</span>' : `<button class="btn sm" data-pay="${x.id}">💳 سُدّدت</button>`}<button class="btn sm" data-bx="${x.id}">🗑️</button></div>`; }).join('')}</div>` : ''}
      <h3>🧾 مصروفات الشهر (${D(exp.length)})</h3><div class="bt-list">${exp.map(e => { const c = B.cats.find(x => x.id === e.cat) || { ic: '❔', n: '' }; return `<div class="bt-row"><span>${c.ic}</span><b>${fmt(num(e.amt))}</b><small class="muted">${esc(c.n)}${e.note ? ' — ' + esc(e.note) : ''} · ${D(e.date.slice(8))}/${D(e.date.slice(5, 7))}</small><span class="spacer"></span><button class="btn sm" data-ex="${e.id}">🗑️</button></div>`; }).join('') || '<div class="muted">لا مصروفات مسجّلة هذا الشهر.</div>'}</div>
      <button class="btn" id="bExp" style="margin-top:10px">📤 تصدير الشهر (CSV للإكسل)</button>`;
    const $ = s => el.querySelector(s);
    $('#eAdd').onclick = async () => { const a = num($('#eA').value); if (!a) return APP.toast('اكتب المبلغ'); B.exp.push({ id: uid(), amt: a, cat: $('#eC').value, note: $('#eN').value.trim(), date: $('#eD').value || dayKey() }); await save(b); rer(); };
    el.querySelectorAll('[data-ex]').forEach(x => x.onclick = async () => { B.exp = B.exp.filter(e => e.id !== x.dataset.ex); await save(b); rer(); });
    el.querySelectorAll('[data-cl]').forEach(x => x.onclick = async () => { const c = B.cats.find(y => y.id === x.dataset.cl); const r = await APP.ask('تعديل البند (امسح الاسم لحذفه)', [{ key: 'n', label: 'اسم البند' }, { key: 'l', label: 'الحد الشهري (0 = بلا حد)' }], { n: c.n, l: String(c.limit || 0) }); if (!r) return; if (!r.n) { if (await APP.ask('حذف البند «' + c.n + '»؟')) B.cats = B.cats.filter(y => y.id !== c.id); } else { c.n = r.n; c.limit = num(r.l); } await save(b); rer(); });
    $('#catA').onclick = async () => { const r = await APP.ask('بند جديد', [{ key: 'n', label: 'اسم البند' }, { key: 'l', label: 'الحد الشهري' }]); if (!r || !r.n) return; B.cats.push({ id: uid(), ic: '📌', n: r.n, limit: num(r.l) }); await save(b); rer(); };
    $('#incE').onclick = () => incomeForm(b);
    $('#billA').onclick = async () => { const r = await APP.ask('فاتورة أو التزام شهري', [{ key: 'n', label: 'الاسم (إيجار، كهرباء، قسط…)' }, { key: 'a', label: 'المبلغ' }, { key: 'd', label: 'يوم الاستحقاق من الشهر (1-28)' }]); if (!r || !r.n) return; const cat = B.cats.find(c => /إيجار|سكن/.test(c.n) && /إيجار|سكن/.test(r.n)) || B.cats.find(c => /كهرباء|ماء|إنترنت/.test(c.n) && /كهرباء|ماء|إنترنت|نت/.test(r.n)) || B.cats[B.cats.length - 2] || B.cats[0]; B.bills.push({ id: uid(), n: r.n, amt: num(r.a), day: Math.min(28, Math.max(1, +r.d || 1)), cat: cat.id }); await save(b); resched(); rer(); };
    el.querySelectorAll('[data-pay]').forEach(x => x.onclick = async () => { const bl = B.bills.find(y => y.id === x.dataset.pay); B.exp.push({ id: uid(), amt: num(bl.amt), cat: bl.cat, note: bl.n, date: m === monthKey() ? dayKey() : m + '-' + pad(bl.day), bill: bl.id }); await save(b); rer(); });
    el.querySelectorAll('[data-bx]').forEach(x => x.onclick = async () => { B.bills = B.bills.filter(y => y.id !== x.dataset.bx); await save(b); resched(); rer(); });
    $('#bExp').onclick = () => { const rows = [['التاريخ', 'البند', 'المبلغ', 'ملاحظة']].concat(exp.map(e => [e.date, (B.cats.find(c => c.id === e.cat) || {}).n || '', e.amt, e.note || ''])); const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n'); APP.download('ميزانية-' + m + '.csv', csv); };
  }
  function incomeForm(b) {
    const B = b.budget, row = x => `<div class="bt-ing"><input placeholder="المصدر (الراتب، عمل إضافي…)" value="${esc(x.n)}" data-f="n"><input placeholder="المبلغ" value="${esc(x.amt)}" data-f="a" inputmode="decimal" style="width:100px"><button class="btn sm" data-x>✕</button></div>`;
    APP.modal(`<h2 style="margin-top:0">💵 الدخل الشهري</h2><div id="iL">${(B.income.length ? B.income : [{ n: 'الراتب', amt: '' }]).map(row).join('')}</div><button class="btn sm" id="iA">➕ مصدر دخل</button>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn primary" id="iOk">حفظ</button><button class="btn" id="iNo">إلغاء</button></div>`, box => {
      const bx = () => box.querySelectorAll('[data-x]').forEach(x => x.onclick = () => x.parentElement.remove()); bx();
      box.querySelector('#iA').onclick = () => { box.querySelector('#iL').insertAdjacentHTML('beforeend', row({ n: '', amt: '' })); bx(); };
      box.querySelector('#iNo').onclick = () => APP.closeModal();
      box.querySelector('#iOk').onclick = async () => { B.income = [...box.querySelectorAll('.bt-ing')].map(x => ({ n: x.querySelector('[data-f=n]').value.trim(), amt: num(x.querySelector('[data-f=a]').value) })).filter(x => x.n && x.amt); await save(b); APP.closeModal(); rer(); };
    });
  }

  // ===== التنبيهات: مهام البيت، ودروس الأولاد، ومواعيد الفواتير =====
  if (window.NOTIFY) NOTIFY.register('bayt', async () => {
    const b = await get(), out = [];
    for (let k = 0; k < 7; k++) {
      const d = new Date(); d.setDate(d.getDate() + k);
      for (const x of b.chores) {
        if (!x.remind || !x.time || !dueOn(x, d)) continue;
        const [h, m] = x.time.split(':').map(Number), at = new Date(d); at.setHours(h, m, 0, 0);
        const w = whoOf(x, d);
        out.push({ title: (x.ic || '🧹') + ' ' + x.t, body: w ? 'على: ' + w : 'من «إدارة البيت»', at, route: '#/bayt/chores' });
      }
      for (const x of b.lessons) {
        if (!x.before || !x.time || !(x.days || []).includes(d.getDay())) continue;
        const [h, m] = x.time.split(':').map(Number), at = new Date(d); at.setHours(h, m - x.before, 0, 0);
        out.push({ title: '📚 درس ' + x.child + ': ' + x.subject, body: 'بعد ' + (x.before === 60 ? 'ساعة' : x.before + ' دقيقة') + (x.teacher ? ' مع ' + x.teacher : ''), at, route: '#/bayt/lessons' });
      }
    }
    for (const bl of b.budget.bills) {
      for (const mo of [0, 1]) { const d = new Date(); d.setMonth(d.getMonth() + mo, bl.day); d.setHours(10, 0, 0, 0); out.push({ title: '🧾 موعد سداد: ' + bl.n, body: 'المبلغ ' + bl.amt, at: d, route: '#/bayt/budget' }); }
    }
    return out;
  });

  window.BAYT = { get, shoppingList };
})();
