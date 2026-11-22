/* 📌 ما لا يسع المسلم جهله: درس قصير كل يوم يصل بالإشعار، يُقرأ من الإشعار نفسه، وبالضغط عليه يُفتح الدرس بدليله وسؤال تثبيت.
   المحتوى في data/wajib.js، وكل دليل حديثي مُتحقق من وجوده في كتب الحديث بالمكتبة. */
(() => {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(String(n));
  let W = null;
  const load = () => W ? Promise.resolve(W) : new Promise((ok, no) => { if (window.WAJIB) return ok(W = window.WAJIB); const s = document.createElement('script'); s.src = 'data/wajib.js?v=' + (window.DATA_V || ''); s.onload = () => ok(W = window.WAJIB); s.onerror = no; document.head.appendChild(s); });
  const getDone = async () => new Set((await DB.setting('wajib-done')) || []);
  const cfg = async () => Object.assign({ on: true, time: '20:30' }, (await DB.setting('wajib-n')) || {});
  // درس اليوم يتقدّم يوماً بيوم من تاريخ البدء، ولو لم يفتح المستخدم التطبيق (فالإشعار يحمل الدرس كاملاً)
  let START = null;
  const start = async () => { if (START) return START; let s = await DB.setting('wajib-start'); if (!s) { const d = new Date(); d.setHours(0, 0, 0, 0); s = d.getTime(); await DB.setting('wajib-start', s); } return (START = s); };
  const dayIdx = async (k = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); return Math.floor((d.getTime() - await start()) / 864e5) + k; };
  const nextFor = async (k = 0) => W.items[((await dayIdx(k)) % W.items.length + W.items.length) % W.items.length];
  const evHtml = ev => (ev || []).map(e => `<a class="wj-ev ${e.k}" href="#/item/${encodeURIComponent(e.id)}"><div>${esc(e.t)}</div><small>📚 ${esc(e.ref)} ↗</small></a>`).join('');
  const unitOf = u => W.units.find(x => x[0] === u) || ['', '📌', ''];

  V.wajib = async (el, [id]) => {
    el.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
    try { await load(); } catch (e) { el.innerHTML = '<div class="card">تعذر التحميل.</div>'; return; }
    const done = await getDone();
    if (id) return lesson(el, W.items.find(x => x.i === +id), done);
    const c = await cfg(), td = await nextFor(0), n = done.size, N = W.items.length;
    el.innerHTML = `<div class="rf-hero wj-hero"><h1>📌 ما لا يسع المسلم جهله</h1><div>درس قصير كل يوم في دقيقة واحدة: العقيدة، والطهارة، والصلاة، والصيام، والزكاة، والحج، والحلال والحرام، والأخلاق. كل معلومة بدليلها من القرآن والسنة.</div></div>
      <div class="card wj-today"><small>درس اليوم</small><h2>${unitOf(td.u)[1]} ${esc(td.t)}</h2><p>${esc(td.b)}</p><a class="btn primary" href="#/wajib/${td.i}">اقرأ الدليل وأجب عن السؤال ←</a></div>
      <div class="wj-prog"><div style="width:${Math.round(n / N * 100)}%"></div></div><div class="muted">أتممت ${D(n)} من ${D(N)} درساً</div>
      <div class="card wj-notif"><b>🔔 تذكير يومي بالإشعار</b><p class="muted">يصلك درس اليوم في إشعار تقرؤه مباشرة دون فتح التطبيق.</p>
        <div class="row"><label class="wj-sw"><input type="checkbox" id="wjOn" ${c.on ? 'checked' : ''}> مفعّل</label><label>الوقت: <input type="time" id="wjT" value="${c.time}"></label><button class="btn sm" id="wjTest">جرّب الإشعار</button></div></div>
      ${W.units.map(([u, ic, name]) => { const its = W.items.filter(x => x.u === u); return `<h3>${ic} ${esc(name)} <small class="muted">${D(its.filter(x => done.has(x.i)).length)}/${D(its.length)}</small></h3><div class="lg-list">${its.map(x => `<a class="lg-row${done.has(x.i) ? ' ok' : ''}" href="#/wajib/${x.i}"><span class="lg-n">${done.has(x.i) ? '✓' : D(x.i)}</span><b>${esc(x.t)}</b></a>`).join('')}</div>`; }).join('')}`;
    const save = async () => { await DB.setting('wajib-n', { on: el.querySelector('#wjOn').checked, time: el.querySelector('#wjT').value || '20:30' }); if (el.querySelector('#wjOn').checked && window.NOTIFY) await NOTIFY.request(); window.NOTIFY && NOTIFY.rescheduleAll(); APP.toast('تم الحفظ ✓'); };
    el.querySelector('#wjOn').onchange = save; el.querySelector('#wjT').onchange = save;
    el.querySelector('#wjTest').onclick = async () => { if (!window.NOTIFY) return; await NOTIFY.request(); await NOTIFY.schedule('wajib', [{ title: '📌 ' + td.t, body: td.b, at: new Date(Date.now() + 8000), route: '#/wajib/' + td.i }]); APP.toast('سيصلك الإشعار بعد ثوانٍ'); setTimeout(() => NOTIFY.rescheduleAll(), 15000); };
  };

  async function lesson(el, x, done) {
    if (!x) { location.hash = '#/wajib'; return; }
    const u = unitOf(x.u), nx = W.items.find(y => y.i === x.i + 1);
    const [q, opts, a] = x.q;
    el.innerHTML = `<a class="btn sm" href="#/wajib">← ما لا يسع المسلم جهله</a>
      <div class="card wj-l"><small>${u[1]} ${esc(u[2])} · الدرس ${D(x.i)}</small><h2>${esc(x.t)}</h2><p class="wj-b">${esc(x.b)}</p></div>
      <h3>📖 الدليل</h3>${evHtml(x.ev)}
      <div class="card lg-q"><b>✅ ${esc(q)}</b><div class="lg-opts">${opts.map((o, j) => `<button class="lg-o" data-j="${j}">${esc(o)}</button>`).join('')}</div><div class="lg-why"></div></div>
      <div class="row th-nav"><a class="btn" href="#/wajib">كل الدروس</a>${nx ? `<a class="btn primary" href="#/wajib/${nx.i}">الدرس التالي ←</a>` : ''}</div>`;
    el.querySelectorAll('.lg-o').forEach(b => b.onclick = async () => {
      const ok = +b.dataset.j === a; b.classList.add(ok ? 'ok' : 'no');
      el.querySelector('.lg-why').textContent = ok ? '✅ أحسنت! حُفظ الدرس في تقدّمك.' : '❌ ليس هذا، أعد قراءة الدرس وحاول مرة أخرى.';
      if (ok) { done.add(x.i); await DB.setting('wajib-done', [...done]); el.querySelectorAll('.lg-o').forEach(z => z.disabled = true); window.NOTIFY && NOTIFY.rescheduleAll(); }
    });
  }

  // بطاقة صغيرة لشاشة البداية
  window.WAJIB_APP = {
    async card() { try { await load(); } catch (e) { return ''; } const td = await nextFor(0); return `<a class="wj-mini" href="#/wajib/${td.i}"><small>📌 ما لا يسع المسلم جهله · درس اليوم</small><b>${esc(td.t)}</b><span>${esc(td.b.slice(0, 90))}…</span></a>`; },
  };

  // الإشعارات: درس كل يوم لأربعين يوماً قادمة (تتجدد عند فتح التطبيق)
  if (window.NOTIFY) NOTIFY.register('wajib', async () => {
    const c = await cfg(); if (!c.on) return [];
    try { await load(); } catch (e) { return []; }
    const [h, m] = c.time.split(':').map(Number), out = [];
    for (let k = 0; k < 40; k++) { const d = new Date(); d.setDate(d.getDate() + k); d.setHours(h, m, 0, 0); const x = await nextFor(k); out.push({ title: '📌 ' + x.t, body: x.b, at: d, route: '#/wajib/' + x.i }); }
    return out;
  });
})();
