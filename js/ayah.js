/* 📖 ما تحت الآية: التفسير (الميسر والمختصر)، ومعاني الكلمات، وأسباب النزول من السنة، وأحكام التجويد بالألوان.
   البيانات في data/ayah/<سورة>.js وتُحمّل عند الحاجة فقط. */
(function () {
  const { esc } = APP;
  const D = AR.toArabicDigits;
  const RULES = ['hamzat_wasl', 'lam_shamsiyyah', 'silent', 'madd_2', 'madd_246', 'madd_munfasil', 'madd_muttasil', 'madd_6',
    'ghunnah', 'ikhfa', 'ikhfa_shafawi', 'idghaam_ghunnah', 'idghaam_no_ghunnah', 'idghaam_shafawi', 'iqlab',
    'qalqalah', 'idghaam_mutajanisayn', 'idghaam_mutaqaribayn'];
  const TJ = {
    hamzat_wasl: ['همزة الوصل', 'تُكتب ولا تُنطق عند وصل الكلام بما قبله، وتُنطق عند البدء بها.'],
    lam_shamsiyyah: ['اللام الشمسية', 'لام «ال» قبل حرف شمسي: تُكتب ولا تُنطق، ويُشدَّد الحرف الذي بعدها.'],
    silent: ['حرف لا يُنطق', 'حرف مرسوم في المصحف لا يُلفظ به وصلاً ولا وقفاً، كالألف في «أولئك».'],
    madd_2: ['المد الطبيعي', 'يُمد بمقدار حركتين، وهو مد حرف المد بلا سبب من همز أو سكون.'],
    madd_246: ['المد العارض للسكون', 'حرف مد بعده حرف يُسكَّن لأجل الوقف: يجوز مده حركتين أو أربعاً أو ستاً عند الوقف.'],
    madd_munfasil: ['المد المنفصل', 'حرف مد في آخر كلمة وهمزة في أول التي تليها: يُمد أربع أو خمس حركات لحفص من طريق الشاطبية.'],
    madd_muttasil: ['المد المتصل (الواجب)', 'حرف مد بعده همزة في الكلمة نفسها: يجب مده أربع أو خمس حركات، ويجوز الست عند الوقف إذا تطرفت الهمزة.'],
    madd_6: ['المد اللازم', 'حرف مد بعده سكون أصلي: يلزم مده ست حركات وصلاً ووقفاً.'],
    ghunnah: ['الغنة (النون والميم المشددتان)', 'صوت يخرج من الخيشوم: تُمد الغنة بمقدار حركتين.'],
    ikhfa: ['الإخفاء الحقيقي', 'نون ساكنة أو تنوين بعده أحد حروف الإخفاء الخمسة عشر: تُنطق بين الإظهار والإدغام مع غنة حركتين.'],
    ikhfa_shafawi: ['الإخفاء الشفوي', 'ميم ساكنة بعدها باء: تُخفى الميم عند الباء مع غنة حركتين.'],
    idghaam_ghunnah: ['الإدغام بغنة', 'نون ساكنة أو تنوين بعده أحد حروف «ينمو» في كلمة أخرى: تُدغم مع غنة حركتين.'],
    idghaam_no_ghunnah: ['الإدغام بلا غنة', 'نون ساكنة أو تنوين بعده لام أو راء: تُدغم إدغاماً كاملاً بلا غنة.'],
    idghaam_shafawi: ['إدغام المثلين الصغير (الشفوي)', 'ميم ساكنة بعدها ميم: تُدغم الأولى في الثانية مع غنة حركتين.'],
    iqlab: ['الإقلاب', 'نون ساكنة أو تنوين بعده باء: تُقلب النون ميماً مخفاة مع غنة حركتين.'],
    qalqalah: ['القلقلة', 'أحد حروف «قطب جد» ساكناً: يُنطق باهتزاز في المخرج حتى يُسمع له نبرة قوية.'],
    idghaam_mutajanisayn: ['إدغام المتجانسين', 'حرفان اتحدا مخرجاً واختلفا صفة، الأول ساكن: يُدغم الأول في الثاني (مثل: قد تبين، أردتم).'],
    idghaam_mutaqaribayn: ['إدغام المتقاربين', 'حرفان تقاربا مخرجاً أو صفة، الأول ساكن: يُدغم الأول في الثاني (مثل: قل ربّ).'],
  };

  // ===== تحميل بيانات السورة =====
  const loading = {};
  function load(s) {
    window.AYAH_DATA = window.AYAH_DATA || {};
    if (AYAH_DATA[s]) return Promise.resolve(AYAH_DATA[s]);
    if (loading[s]) return loading[s];
    return (loading[s] = new Promise((res, rej) => {
      const sc = document.createElement('script'); sc.src = 'data/ayah/' + s + '.js';
      sc.onload = () => res(AYAH_DATA[s]); sc.onerror = () => { delete loading[s]; rej(new Error('تعذّر تحميل بيانات السورة')); };
      document.head.appendChild(sc);
    }));
  }

  // نص الآية كما حُسبت عليه مواضع التجويد
  const tjText = (s, a, text) => {
    let t = text;
    if (a === 1 && s !== 1 && s !== 9 && t.startsWith('بِسْمِ')) t = t.split(' ').slice(4).join(' ');
    return t.replace(/ـٰ/g, 'ٰ');
  };
  function tajweedHtml(s, a, text, d) {
    const t = [...tjText(s, a, text)];
    const enc = d && d.t && d.t[a];
    if (!enc) return { html: esc(t.join('')), used: {} };
    const mark = new Array(t.length).fill(-1), used = {};
    enc.split(',').forEach(x => {
      const [st, ln, r] = x.split('.').map(v => parseInt(v, 36));
      for (let i = st; i < st + ln && i < t.length; i++) mark[i] = r;
      const name = RULES[r]; (used[name] = used[name] || []).push(t.slice(Math.max(0, st - 3), st + ln + 3).join('').trim());
    });
    let html = '', i = 0;
    while (i < t.length) {
      const r = mark[i]; let j = i; while (j < t.length && mark[j] === r) j++;
      const seg = esc(t.slice(i, j).join(''));
      html += r < 0 ? seg : `<span class="tj-${RULES[r]}" title="${esc(TJ[RULES[r]][0])}">${seg}</span>`;
      i = j;
    }
    return { html, used };
  }
  const legend = () => `<div class="tj-legend">${['madd_6', 'madd_muttasil', 'madd_munfasil', 'madd_246', 'ghunnah', 'ikhfa', 'idghaam_ghunnah', 'idghaam_no_ghunnah', 'iqlab', 'qalqalah', 'hamzat_wasl'].map(r => `<span><i class="tj-${r}">●</i>${esc(TJ[r][0])}</span>`).join('')}</div>`;

  // ===== أجزاء اللوحة =====
  const grp = (arr, a) => { const v = arr[a - 1]; return typeof v === 'number' ? { from: v, text: arr[v - 1] } : { from: a, text: v || '' }; };
  const lastOf = (arr, from) => { let e = from; while (e < arr.length && arr[e] === from) e++; return e; };
  function tafsirHtml(s, a, d) {
    const m = grp(d.m, a), x = grp(d.x, a);
    const rng = (g, arr) => { const e = lastOf(arr, g.from); return e > g.from ? `<small class="muted">(تفسير الآيات ${D(g.from)}–${D(e)})</small>` : ''; };
    const p = t => esc(t).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
    return `${a === 1 && d.mi ? `<details class="ap-intro"><summary>📌 مقدمة السورة: تسميتها ومقاصدها</summary><p>${p(d.mi)}</p></details>` : ''}
      <h4>التفسير الميسر ${rng(m, d.m)}</h4><p>${p(m.text)}</p>
      <details><summary><b>المختصر في تفسير القرآن</b> ${rng(x, d.x)}</summary><p>${p(x.text)}</p></details>
      <div class="muted ap-src">التفسير الميسر: نخبة من العلماء، مجمع الملك فهد. المختصر: مركز تفسير للدراسات القرآنية. <a href="#/item/quran:${s}:${a}" onclick="APP.closeModal()">التفاسير المطوّلة المثبتة ←</a></div>`;
  }
  const gharibHtml = (a, d) => {
    const g = d.g && d.g[a];
    return g ? `<dl class="ap-gh">${g.map(([w, m]) => `<dt>${esc(w)}</dt><dd>${esc(m)}</dd>`).join('')}</dl><div class="muted ap-src">من «الميسر في غريب القرآن» — مجمع الملك فهد.</div>`
      : '<div class="muted">لا كلمات غريبة تحتاج بياناً في هذه الآية.</div>';
  };
  async function asbabHtml(a, d) {
    const ids = (d.b && d.b[a]) || [];
    if (!ids.length) return '<div class="muted">لم يُعثر في كتب الحديث المثبتة على حديث مقبول يذكر نزول هذه الآية. وكثير من آيات القرآن نزل ابتداءً بلا سبب خاص.</div>';
    const its = (await Promise.all(ids.map(id => DB.get('items', id)))).filter(Boolean);
    if (!its.length) return '<div class="muted">الأحاديث المتعلقة بنزولها في كتب لم تُثبت بعد — ثبّتها من المكتبة.</div>';
    return its.map(h => {
      const t = window.KHUTBA ? KHUTBA.hadithText(h) : (h.matn || '');
      return `<div class="ap-had"><div>«${esc(t)}»</div><div class="row" style="gap:6px;flex-wrap:wrap"><small class="muted">${esc(APP.titleOf(h))}</small> ${APP.gradeSummary(h)}<a class="btn sm" href="#/item/${encodeURIComponent(h.id)}" onclick="APP.closeModal()">الحديث كاملاً</a></div></div>`;
    }).join('') + '<div class="muted ap-src">أحاديث من الصحيحين والسنن (المقبولة فقط) ورد فيها ذكر نزول الآية، جُمعت آلياً بمطابقة نصها؛ فتأمل السياق، فقد يكون الحديث في فضلها أو تفسيرها.</div>';
  }
  function tajweedPanel(s, a, text, d) {
    const r = tajweedHtml(s, a, text, d);
    const rules = Object.keys(r.used).sort((x, y) => RULES.indexOf(x) - RULES.indexOf(y));
    return `<div class="quran-text tj-on ap-tjtext">${r.html}</div>
      ${rules.length ? rules.map(k => `<div class="ap-rule"><b class="tj-${k}">● ${esc(TJ[k][0])}</b> <small class="muted">(${D(r.used[k].length)} ${r.used[k].length > 2 && r.used[k].length < 11 ? 'مواضع' : 'موضع'})</small><div>${esc(TJ[k][1])}</div><div class="ap-ex">${r.used[k].slice(0, 4).map(w => `<span class="quran-text">${esc(w)}</span>`).join(' ، ')}</div></div>`).join('') : '<div class="muted">لا أحكام ملوّنة في هذه الآية.</div>'}
      <div class="muted ap-src">التلوين آلي (مشروع quran-tajweed، رخصة CC BY 4.0)، والعمدة التلقي من مقرئ متقن. <a href="#/tajweed" onclick="APP.closeModal()">دورة التجويد ←</a></div>`;
  }

  /** يرسم لوحة الآية داخل عنصر: التبويبات وما تحتها */
  async function panel(box, it, opts) {
    opts = opts || {};
    const s = it.surah, a = it.ayah;
    box.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
    let d;
    try { d = await load(s); } catch (e) { box.innerHTML = '<div class="warn">' + esc(e.message) + '</div>'; return; }
    const nB = ((d.b && d.b[a]) || []).length;
    const tabs = [['tf', '📗 التفسير'], ['gh', '🔤 معاني الكلمات'], ['sb', '📜 أسباب النزول' + (nB ? ' •' : '')], ['tj', '🎨 التجويد']];
    const cur = opts.tab || localStorage.getItem('ap-tab') || 'tf';
    box.innerHTML = `<div class="tabs ap-tabs">${tabs.map(([k, l]) => `<button data-apt="${k}" class="${k === cur ? 'on' : ''}">${l}</button>`).join('')}</div><div class="ap-body"></div>`;
    const body = box.querySelector('.ap-body');
    const show = async k => {
      try { localStorage.setItem('ap-tab', k); } catch (e) { }
      box.querySelectorAll('[data-apt]').forEach(b => b.classList.toggle('on', b.dataset.apt === k));
      body.innerHTML = k === 'tf' ? tafsirHtml(s, a, d) : k === 'gh' ? gharibHtml(a, d) : k === 'tj' ? tajweedPanel(s, a, it.text, d) : '<div class="muted">…</div>';
      if (k === 'sb') body.innerHTML = await asbabHtml(a, d);
    };
    box.querySelectorAll('[data-apt]').forEach(b => b.onclick = () => show(b.dataset.apt));
    show(tabs.some(t => t[0] === cur) ? cur : 'tf');
  }

  // ===== تلوين سورة كاملة في المصحف =====
  async function colorSurah(el, s, ayat) {
    const d = await load(s);
    ayat.forEach(it => { const sp = el.querySelector(`[data-card="${it.id}"]`); if (sp) sp.innerHTML = tajweedHtml(s, it.ayah, it.text, d).html; });
  }

  // ===== صفحة الآية (#/item/quran:…): اللوحة في أعلاها =====
  const V = APP.views, origItem = V.item;
  V.item = async (el, parts, p) => {
    await origItem(el, parts, p);
    const id = decodeURIComponent((parts && parts[0]) || '');
    const m = /^quran:(\d+):(\d+)$/.exec(id); if (!m) return;
    const it = await DB.get('items', id); if (!it) return;
    const box = document.createElement('div'); box.className = 'card ap-card';
    const anchor = el.querySelector('h1'); (anchor && anchor.nextElementSibling ? anchor.nextElementSibling : el.firstChild).after(box);
    panel(box, it);
  };

  window.AYAH = { load, panel, tajweedHtml, colorSurah, legend, TJ };
})();
