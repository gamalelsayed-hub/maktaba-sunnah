// 📋 مهامي: جدول متابعة يومي يجمع ما في التطبيق (الورد، الختمة، الأذكار، حديث اليوم، الحفظ، الدروس)
// مع مهام يضيفها المستخدم بنفسه، ولكل مهمة تذكير بإشعار أو منبّه
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const AD = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const get = async () => Object.assign({ tasks: [], done: {}, visits: {}, auto: { adhkar: true, hadith: true, learn: true } }, (await DB.setting('tasks')) || {});
  const save = t => DB.setting('tasks', t);

  // حديث اليوم: يتنقّل في رياض الصالحين يوماً بيوم
  const hadithOfDay = () => { const d = new Date(), start = new Date(d.getFullYear(), 0, 0), n = Math.floor((d - start) / 864e5) + d.getFullYear() * 366; return 'riyad:' + (n % 1896 + 1); };

  // زيارة صفحة اليوم تُحتسب إنجازاً للمهام المرتبطة بها (حديث اليوم، درس القراءة…)
  window.addEventListener('hashchange', async () => {
    const h = location.hash; if (!/^#\/(item|literacy|kids)/.test(h)) return;
    const t = await get(), k = dayKey(); t.visits[k] = t.visits[k] || {};
    if (h === '#/item/' + encodeURIComponent(hadithOfDay())) t.visits[k].hadith = 1;
    if (/^#\/literacy\/./.test(h)) t.visits[k].lit = 1;
    if (/^#\/kids\/./.test(h)) t.visits[k].kids = 1;
    // تنظيف السجلات الأقدم من 60 يوماً
    Object.keys(t.visits).sort().slice(0, -60).forEach(x => delete t.visits[x]);
    await save(t);
  });

  // المهام التلقائية من أقسام التطبيق
  async function autoItems(t) {
    const k = dayKey(), out = [], vis = t.visits[k] || {};
    const me = await DB.setting('me');
    if (me && me.wird) out.push({ id: 'a-wird', ic: '☀️', t: 'ورد القرآن اليومي', href: '#/wird', done: !!(me.wird.log || {})[new Date().toISOString().slice(0, 10)] });
    const K = await DB.setting('khatma');
    if (K && K.active) {
      const A = K.active, ti = Math.max(0, Math.floor((new Date(dayKey()) - new Date(A.start)) / 864e5)), doneN = Object.keys(A.done || {}).length, next = A.parts.findIndex((p, i) => !A.done[i]);
      if (next >= 0) out.push({ id: 'a-khatma', ic: '📖', t: `ورد الختمة (${AD(next + 1)} من ${AD(A.parts.length)})`, href: '#/khatma/read/' + next, done: doneN >= Math.min(A.parts.length, ti + 1) });
    }
    try { const due = (await DB.all('srs')).filter(s => new Date(s.due) <= new Date()).length; if (due) out.push({ id: 'a-hifz', ic: '🧠', t: `مراجعة الحفظ (${AD(due)} مستحقة)`, href: '#/hifz', done: false }); } catch (e) { }
    if (t.auto.adhkar && window.ADHKAR_DATA) {
      const p = (await DB.setting('adhkar-prog')) || {}, c = p.day === new Date().toISOString().slice(0, 10) ? p.c || {} : {};
      for (const [tab, kk, name, ic] of [['sabah', 1, 'أذكار الصباح', '🌅'], ['masa', 2, 'أذكار المساء', '🌇']]) {
        const list = ADHKAR_DATA.sm.filter(x => x.k === 0 || x.k === kk).map((x, i) => ({ c: x.c, key: tab + i }));
        out.push({ id: 'a-' + tab, ic, t: name, href: '#/adhkar/' + tab, done: list.every(x => (c[x.key] || 0) >= x.c) });
      }
    }
    if (t.auto.hadith && APP.state.books.riyad && APP.state.books.riyad.count) out.push({ id: 'a-hadith', ic: '📜', t: 'حديث اليوم (رياض الصالحين)', href: '#/item/' + encodeURIComponent(hadithOfDay()), done: !!vis.hadith });
    let aud = ''; try { aud = localStorage.getItem('audience') || ''; } catch (e) { }
    if (t.auto.learn && aud === 'lit') out.push({ id: 'a-lit', ic: '✍️', t: 'درس اليوم في تعلّم القراءة', href: '#/literacy', done: !!vis.lit });
    if (t.auto.learn && aud === 'kids') out.push({ id: 'a-kids', ic: '🧒', t: 'درس اليوم للأطفال', href: '#/kids', done: !!vis.kids });
    return out;
  }

  // هل المهمة اليدوية مستحقة في يوم معيّن؟
  const dueOn = (x, d) => x.repeat === 'daily' ? true : x.repeat === 'week' ? (x.days || []).includes(d.getDay()) : x.date === dayKey(d);
  const when = x => x.repeat === 'daily' ? 'كل يوم' : x.repeat === 'week' ? (x.days || []).map(d => DAYS[d]).join('، ') : (x.date || '');

  async function view(el) {
    const t = await get(), k = dayKey(), now = new Date();
    const auto = await autoItems(t);
    const mine = t.tasks.filter(x => dueOn(x, now)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    const dn = t.done[k] || {};
    const all = auto.length + mine.length, doneN = auto.filter(x => x.done).length + mine.filter(x => dn[x.id]).length;
    const pct = all ? Math.round(doneN / all * 100) : 0;
    const row = (x, done, extra = '') => `<div class="tk-row ${done ? 'done' : ''}">${extra}<span class="tk-ic">${x.ic || '📌'}</span><div class="tk-b"><b>${esc(x.t)}</b>${x.sub ? `<small>${x.sub}</small>` : ''}</div>${x.href ? `<a class="btn sm ${done ? '' : 'primary'}" href="${x.href}">${done ? '✔' : 'افتح'}</a>` : ''}</div>`;
    el.innerHTML = `<div class="row"><h1>📋 مهامي</h1><span class="spacer"></span><button class="btn primary sm" id="tkAdd">➕ مهمة جديدة</button></div>
      <div class="sub">جدول يومك: ما في التطبيق يظهر وحده، وتضيف أنت ما تشاء من مهام وتذكيرات.</div>
      <div class="card tk-sum"><b>${now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</b><span>أنجزت ${AD(doneN)} من ${AD(all)}</span><div class="kh-prog"><i style="width:${pct}%"></i></div>${all && doneN === all ? '<div class="tk-cheer">🌟 أتممت مهام اليوم — تقبّل الله منك</div>' : ''}</div>
      <h2>من التطبيق</h2>${auto.length ? auto.map(x => row(x, x.done, `<span class="tk-chk ${x.done ? 'on' : ''}">${x.done ? '✔' : ''}</span>`)).join('') : '<div class="muted">لا شيء الآن. فعّل وردك أو ختمة من «خطة الختمة».</div>'}
      <h2>مهامي الخاصة</h2>${mine.length ? mine.map(x => row(Object.assign({}, x, { sub: [x.time ? '⏰ ' + AD(x.time) : '', when(x), x.remind === 'alarm' ? '🔔 منبّه' : x.remind === 'notif' ? '🔔 إشعار' : ''].filter(Boolean).join(' · ') }), dn[x.id], `<button class="tk-chk ${dn[x.id] ? 'on' : ''}" data-chk="${x.id}">${dn[x.id] ? '✔' : ''}</button>`) + `<div class="tk-act"><button class="btn sm" data-edit="${x.id}">تعديل</button><button class="btn sm" data-del="${x.id}">حذف</button></div>`).join('') : '<div class="muted">لم تضف مهام بعد. اضغط «➕ مهمة جديدة».</div>'}
      ${t.tasks.filter(x => !dueOn(x, now)).length ? `<h2>مهام أيام أخرى</h2>${t.tasks.filter(x => !dueOn(x, now)).map(x => `<div class="tk-row other"><span class="tk-ic">${x.ic || '📌'}</span><div class="tk-b"><b>${esc(x.t)}</b><small>${esc(when(x))}${x.time ? ' · ⏰ ' + AD(x.time) : ''}</small></div><button class="btn sm" data-edit="${x.id}">تعديل</button><button class="btn sm" data-del="${x.id}">حذف</button></div>`).join('')}` : ''}
      <h2>إعدادات</h2><div class="card">
        <label class="fld"><input type="checkbox" data-auto="adhkar" ${t.auto.adhkar ? 'checked' : ''}> أظهر أذكار الصباح والمساء في جدولي</label>
        <label class="fld"><input type="checkbox" data-auto="hadith" ${t.auto.hadith ? 'checked' : ''}> أظهر «حديث اليوم» من رياض الصالحين</label>
        <label class="fld"><input type="checkbox" data-auto="learn" ${t.auto.learn ? 'checked' : ''}> أظهر درس اليوم للأطفال أو تعلّم القراءة</label>
      </div>`;
    $('#tkAdd', el).onclick = () => edit();
    el.querySelectorAll('[data-chk]').forEach(b => b.onclick = async () => { const t2 = await get(); t2.done[k] = t2.done[k] || {}; if (t2.done[k][b.dataset.chk]) delete t2.done[k][b.dataset.chk]; else t2.done[k][b.dataset.chk] = 1; Object.keys(t2.done).sort().slice(0, -60).forEach(x => delete t2.done[x]); await save(t2); view(el); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (!confirm('حذف المهمة؟')) return; const t2 = await get(); t2.tasks = t2.tasks.filter(x => x.id !== b.dataset.del); await save(t2); NOTIFY.rescheduleAll(); view(el); });
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => edit(t.tasks.find(x => x.id === b.dataset.edit)));
    el.querySelectorAll('[data-auto]').forEach(c => c.onchange = async () => { const t2 = await get(); t2.auto[c.dataset.auto] = c.checked; await save(t2); view(el); });
  }

  const ICONS = ['📌', '📖', '📜', '🤲', '🕌', '💊', '🏃', '📚', '👨‍👩‍👧', '🛒', '💼', '🌙'];
  function edit(x) {
    x = x || { id: 't' + Date.now().toString(36), t: '', ic: '📌', time: '', repeat: 'daily', days: [], date: dayKey(), remind: 'notif' };
    APP.modal(`<h2 style="margin-top:0">${x.t ? 'تعديل المهمة' : '➕ مهمة جديدة'}</h2>
      <label class="fld">المهمة<input type="text" id="tkT" value="${esc(x.t)}" placeholder="مثال: قراءة سورة الكهف، دواء الضغط، صلة الرحم" style="width:100%"></label>
      <div class="tk-icons">${ICONS.map(i => `<button type="button" class="${i === x.ic ? 'on' : ''}" data-ic="${i}">${i}</button>`).join('')}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap"><label class="fld">الوقت <input type="time" id="tkTime" value="${x.time || ''}"></label>
        <label class="fld">التكرار <select id="tkRep"><option value="daily" ${x.repeat === 'daily' ? 'selected' : ''}>كل يوم</option><option value="week" ${x.repeat === 'week' ? 'selected' : ''}>أيام محددة</option><option value="once" ${x.repeat === 'once' ? 'selected' : ''}>مرة واحدة</option></select></label></div>
      <div id="tkDays" class="tk-days" ${x.repeat === 'week' ? '' : 'hidden'}>${DAYS.map((d, i) => `<label><input type="checkbox" value="${i}" ${(x.days || []).includes(i) ? 'checked' : ''}>${d}</label>`).join('')}</div>
      <label class="fld" id="tkDateL" ${x.repeat === 'once' ? '' : 'hidden'}>التاريخ <input type="date" id="tkDate" value="${x.date || dayKey()}"></label>
      <label class="fld">التذكير <select id="tkRem"><option value="none" ${x.remind === 'none' ? 'selected' : ''}>بدون تذكير</option><option value="notif" ${x.remind === 'notif' ? 'selected' : ''}>🔔 إشعار</option><option value="alarm" ${x.remind === 'alarm' ? 'selected' : ''}>⏰ منبّه (صوت أعلى وأطول)</option></select></label>
      <div class="muted" style="font-size:12px">التذكير يحتاج تحديد الوقت. في تطبيق الجوال يصلك والتطبيق مغلق، وفي المتصفح ما دامت الصفحة مفتوحة.</div>
      <div class="row" style="margin-top:12px"><button class="btn primary" id="tkSave">حفظ</button><button class="btn" id="tkCancel">إلغاء</button></div>`, box => {
      let ic = x.ic;
      box.querySelectorAll('[data-ic]').forEach(b => b.onclick = () => { ic = b.dataset.ic; box.querySelectorAll('[data-ic]').forEach(y => y.classList.toggle('on', y === b)); });
      const rep = $('#tkRep', box); rep.onchange = () => { $('#tkDays', box).hidden = rep.value !== 'week'; $('#tkDateL', box).hidden = rep.value !== 'once'; };
      $('#tkCancel', box).onclick = () => APP.closeModal();
      $('#tkSave', box).onclick = async () => {
        const title = $('#tkT', box).value.trim(); if (!title) { $('#tkT', box).focus(); return; }
        const y = { id: x.id, t: title, ic, time: $('#tkTime', box).value, repeat: rep.value, days: [...box.querySelectorAll('#tkDays input:checked')].map(c => +c.value), date: $('#tkDate', box).value, remind: $('#tkRem', box).value };
        if (y.repeat === 'week' && !y.days.length) { APP.toast('اختر يوماً واحداً على الأقل'); return; }
        const t = await get(); const i = t.tasks.findIndex(z => z.id === y.id); if (i >= 0) t.tasks[i] = y; else t.tasks.push(y);
        await save(t); APP.closeModal();
        if (y.remind !== 'none' && y.time && window.NOTIFY && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request();
        if (window.NOTIFY) NOTIFY.rescheduleAll();
        APP.toast('حُفظت المهمة'); APP.rerender();
      };
      setTimeout(() => $('#tkT', box).focus(), 50);
    });
  }

  // تذكيرات المهام اليدوية للأيام السبعة القادمة
  if (window.NOTIFY) NOTIFY.register('tasks', async () => {
    const t = await get(), out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      for (const x of t.tasks) {
        if (x.remind === 'none' || !x.time || !dueOn(x, d)) continue;
        const [h, m] = x.time.split(':').map(Number); const at = new Date(d); at.setHours(h, m, 0, 0);
        out.push({ title: (x.ic || '📌') + ' ' + x.t, body: 'من «مهامي» — اضغط للمتابعة', at, channel: x.remind === 'alarm' ? 'alarm' : 'reminders', route: '#/tasks' });
      }
    }
    return out;
  });

  // ملخص للرئيسية
  async function summary() { const t = await get(), auto = await autoItems(t), dn = t.done[dayKey()] || {}, mine = t.tasks.filter(x => dueOn(x, new Date())); return { all: auto.length + mine.length, done: auto.filter(x => x.done).length + mine.filter(x => dn[x.id]).length }; }

  APP.views.tasks = el => view(el);
  window.TASKS = { view, summary, hadithOfDay };
})();
