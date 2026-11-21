/* ✨ أسماء الله الحسنى: ٩٩ اسماً — لكل اسم شعار ومعنى ودليل وأثر في حياتك وكيف تتعبّد الله به ودعاء.
   «اسم اليوم» يتجدد كل يوم، وتذكير يومي اختياري، والاستماع بصوت القارئ إن سُجّل وإلا بصوت الجهاز. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const L = () => window.ASMA || [];
  const HUES = [152, 40, 200, 280, 20, 120, 330, 180, 60, 240];
  const dayIdx = () => { const d = new Date(), s = new Date(d.getFullYear(), 0, 0); return Math.floor((d - s) / 864e5) % L().length; };
  const textOf = (x, ayah) => `${x[0]}. معناه: ${x[1]} ${ayah ? 'قال الله تعالى: ' + ayah + '. ' : typeof x[2] === 'string' ? x[2] + ' ' : ''}أثره في حياتك: ${x[3]} كيف تتعبّد الله به: ${x[4]} دعاء: ${x[5]}`;
  async function ayahOf(x) { if (!Array.isArray(x[2])) return null; const it = await DB.get('items', 'quran:' + x[2][0] + ':' + x[2][1]).catch(() => null); return it ? (it.surah !== 1 && it.ayah === 1 ? it.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\s*/, '') : it.text) : null; }
  const emblem = (x, i, big) => `<div class="as-emb ${big ? 'big' : ''}" style="--h:${HUES[i % HUES.length]}"><span class="as-orn">۞</span><b>${esc(x[0])}</b><span class="as-num">${D(i + 1)}</span></div>`;

  // مصدر للتسجيل بصوت القارئ
  if (window.LIBVOICE && LIBVOICE.addSource) LIBVOICE.addSource({ id: 'asma-husna', title: '✨ أسماء الله الحسنى وشرحها', items: async () => Promise.all(L().map(async (x, i) => ({ id: 'asma:' + i, title: x[0], text: textOf(x, await ayahOf(x)), chapter: 'أسماء الله الحسنى' }))) });

  let seqOn = false;
  async function listen(i, all) {
    SAY.cancel(); seqOn = !!all;
    for (let k = i; k < L().length; k++) {
      const x = L()[k];
      const ok = await SAY.item({ id: 'asma:' + k, title: x[0], sub: 'أسماء الله الحسنى · ' + D(k + 1) + '/' + D(L().length), text: textOf(x, await ayahOf(x)), name: 'asma', icon: '✨' });
      if (!ok || !seqOn) return;
      if (location.hash.startsWith('#/asma/')) location.replace('#/asma/' + (k + 2 > L().length ? k + 1 : k + 2));
    }
  }

  async function cfg() { return Object.assign({ on: false, t: '08:00' }, (await DB.setting('asma-cfg')) || {}); }

  V.asma = async (el, [id]) => {
    const list = L();
    if (id != null && id !== '') {
      const i = Math.max(0, Math.min(list.length - 1, (+id || 1) - 1)), x = list[i], ay = await ayahOf(x);
      el.innerHTML = `<div class="row"><a class="btn sm" href="#/asma">← كل الأسماء</a><span class="spacer"></span><span class="muted">${D(i + 1)} / ${D(list.length)}</span></div>
        <div class="as-page">${emblem(x, i, true)}
          <div class="card as-sec"><h3>📖 المعنى</h3><p>${esc(x[1])}</p></div>
          <div class="card as-sec"><h3>📜 الدليل</h3>${ay ? `<p class="quran-text as-ayah">﴿${esc(ay)}﴾</p><small class="muted">سورة ${esc(AR.SURAHS[x[2][0] - 1])} — الآية ${D(x[2][1])}</small>` : `<p>${esc(x[2])}</p>`}</div>
          <div class="card as-sec"><h3>🌱 أثره في حياتك</h3><p>${esc(x[3])}</p></div>
          <div class="card as-sec"><h3>🤲 كيف تتعبّد الله به</h3><p>${esc(x[4])}</p></div>
          <div class="card as-sec as-dua"><h3>💬 دعاء بهذا الاسم</h3><p>${esc(x[5])}</p></div>
          <div class="row as-ctl"><a class="btn" href="#/asma/${i > 0 ? i : list.length}">⏮ السابق</a><button class="btn primary" data-l>🔊 استمع</button><button class="btn" data-copy>📋 نسخ</button><a class="btn" href="#/asma/${i + 2 > list.length ? 1 : i + 2}">التالي ⏭</a></div>
          <div class="muted" style="font-size:12px;text-align:center;margin-top:8px">المعاني مختصرة من تفسير السعدي للأسماء الحسنى، و«شأن الدعاء» للخطابي.</div></div>`;
      el.querySelector('[data-l]').onclick = () => listen(i, false);
      el.querySelector('[data-copy]').onclick = () => APP.copy(`✨ ${x[0]}\n\n📖 المعنى: ${x[1]}\n${ay ? '📜 ﴿' + ay + '﴾' : '📜 ' + x[2]}\n🌱 أثره: ${x[3]}\n🤲 العمل به: ${x[4]}\n💬 ${x[5]}\n\n— من تطبيق «زاد الأسرة المسلمة»`);
      return;
    }
    const c = await cfg(), t = dayIdx(), tx = list[t];
    el.innerHTML = `<div class="row"><h1>✨ أسماء الله الحسنى</h1><span class="spacer"></span><button class="btn" data-all>▶ استمع لها كلها</button></div>
      <div class="sub">قال ﷺ: «إن لله تسعة وتسعين اسماً، مائةً إلا واحداً، من أحصاها دخل الجنة» (متفق عليه). وإحصاؤها: حفظها، وفهم معانيها، والعمل بها، ودعاء الله بها. هذه تسعة وتسعون اسماً ثابتة بالكتاب والسنة.</div>
      <a class="card as-today" href="#/asma/${t + 1}">${emblem(tx, t)}<span><small class="muted">🌟 اسم اليوم</small><b>${esc(tx[0])}</b><span>${esc(tx[1])}</span></span></a>
      <div class="card"><label class="fld"><input type="checkbox" id="asOn" ${c.on ? 'checked' : ''}> 🔔 ذكّرني كل يوم باسم من أسماء الله ومعناه الساعة <input type="time" id="asT" value="${c.t}"></label></div>
      <input type="search" id="asQ" placeholder="ابحث عن اسم…" style="width:100%;margin:6px 0 12px">
      <div class="as-grid">${list.map((x, i) => `<a href="#/asma/${i + 1}" data-n="${esc(AR.normalize(x[0]))}">${emblem(x, i)}</a>`).join('')}</div>`;
    const $ = s => el.querySelector(s);
    $('[data-all]').onclick = () => { location.hash = '#/asma/1'; setTimeout(() => listen(0, true), 300); };
    $('#asQ').oninput = e => { const q = AR.normalize(e.target.value); el.querySelectorAll('.as-grid a').forEach(a => { a.style.display = !q || a.dataset.n.includes(q) ? '' : 'none'; }); };
    const save = async () => { const n = { on: $('#asOn').checked, t: $('#asT').value || '08:00' }; await DB.setting('asma-cfg', n); if (n.on && window.NOTIFY && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request(); if (window.NOTIFY) await NOTIFY.rescheduleAll(); APP.toast(n.on ? '✔ ستصلك كل يوم باسم من أسماء الله' : 'أُوقف التذكير'); };
    $('#asOn').onchange = save; $('#asT').onchange = () => { if ($('#asOn').checked) save(); };
  };

  // تذكير يومي باسم ومعناه
  if (window.NOTIFY) NOTIFY.register('asma', async () => {
    const c = await cfg(); if (!c.on) return [];
    const out = [], [h, m] = (c.t || '08:00').split(':').map(Number);
    for (let k = 0; k < 14; k++) {
      const d = new Date(); d.setDate(d.getDate() + k); d.setHours(h, m, 0, 0);
      const s = new Date(d.getFullYear(), 0, 0), i = Math.floor((d - s) / 864e5) % L().length, x = L()[i];
      out.push({ title: '✨ اسم اليوم: ' + x[0], body: x[1], at: d, route: '#/asma/' + (i + 1) });
    }
    return out;
  });
  window.ASMA_VIEW = { listen };
})();
