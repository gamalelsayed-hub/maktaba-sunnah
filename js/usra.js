/* 👨‍👩‍👧 أسرتي: إدارة منظمة لأفراد الأسرة
   - ملف لكل فرد (العمر، الصف، الدور) وبرنامج يومي تلقائي حسب العمر + مهام خاصة
   - لوحة النجوم والمكافآت (بلا مقارنة بين الإخوة)
   - صحة الأسرة: الملف الصحي، ومواعيد الأدوية، وزيارات التطعيم، والطوارئ والإسعافات الأولية
   - مجلس الأسرة الأسبوعي، وصلة الرحم، ووضع الأطفال الآمن (رقم سري وحدّ يومي)
   كل البيانات على الجهاز فقط (DB.setting('usra')) وتدخل في النسخة الاحتياطية. */
(function () {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(n);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const dk = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const ROLES = { father: ['👨', 'الأب'], mother: ['👩', 'الأم'], son: ['👦', 'ابن'], daughter: ['👧', 'ابنة'], grandpa: ['👴', 'الجد'], grandma: ['👵', 'الجدة'], other: ['🙂', 'فرد آخر'] };
  async function get() {
    return Object.assign({ members: [], rewards: [{ id: 'r1', t: 'نزهة مع الأسرة', cost: 30 }, { id: 'r2', t: 'اختيار وجبة العشاء', cost: 15 }, { id: 'r3', t: 'كتاب أو قصة جديدة', cost: 40 }], done: {}, majlis: { on: true, day: 5, time: '20:00', goals: [] }, rahim: [], kids: { pin: '', limit: 0, used: {} }, country: 'sa' }, (await DB.setting('usra')) || {});
  }
  const save = async u => { window.__usraNames = u.members.map(m => m.name); window.__usraPrivHealth = Object.fromEntries(u.members.filter(m => m.privHealth).map(m => [m.id, 1])); await DB.setting('usra', u); if (window.USYNC) USYNC.changed(); };
  const SY = () => window.USYNC && USYNC.linked();
  const isParentDev = () => !SY() || USYNC.role() === 'parent';
  const canEdit = isParentDev;
  const mineOrParent = m => isParentDev() || (SY() && USYNC.myMid() === m.id);
  const beta = () => { try { return localStorage.getItem('zad-beta') === '1'; } catch (e) { return false; } };
  const age = m => { if (!m.birth) return null; const b = new Date(m.birth), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
  const ageMonths = m => { if (!m.birth) return null; const b = new Date(m.birth), n = new Date(); return (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth() - (n.getDate() < b.getDate() ? 1 : 0); };
  const isChild = m => ['son', 'daughter'].includes(m.role) || (age(m) != null && age(m) < 15);
  const ageTxt = m => { const a = age(m); if (a == null) return ''; if (a < 2) return D(Math.max(0, ageMonths(m))) + ' شهراً'; return D(a) + ' سنة'; };
  const male = m => ['father', 'son', 'grandpa'].includes(m.role);

  // ===== البرنامج اليومي حسب العمر =====
  const PR = [['fajr', 'الفجر'], ['dhuhr', 'الظهر'], ['asr', 'العصر'], ['maghrib', 'المغرب'], ['isha', 'العشاء']];
  function plan(m) {
    const a = age(m), out = [];
    const T = (id, ic, t, s = 1, href) => out.push({ id, ic, t, s, href });
    if (a != null && a < 3) { T('care', '🤱', 'وقت لعب وكلام وحضن مع الطفل', 0); T('read', '📚', 'قصة مصورة قبل النوم', 0); return out; }
    if (a != null && a < 7) {
      T('dhikr', '🌅', 'ذكر الصباح مع أحد الوالدين', 1, '#/adhkar'); T('sura', '📖', 'سماع أو حفظ سورة قصيرة', 2, '#/kids'); T('toys', '🧸', 'ترتيب الألعاب', 1); T('teeth', '🦷', 'تنظيف الأسنان صباحاً ومساءً', 1); T('story', '🌙', 'قصة وأذكار النوم', 1); return out;
    }
    const salah = a == null || a >= 7;
    if (salah) PR.forEach(([k, n]) => T('p_' + k, '🕌', 'صلاة ' + n + (male(m) && a >= 10 ? ' (في المسجد إن أمكن)' : ''), 1, '#/salah'));
    T('quran', '📖', a != null && a < 10 ? 'حفظ أو مراجعة ٥ آيات' : 'ورد القرآن (١٠ دقائق على الأقل)', 2, '#/khatma');
    T('adhkar', '🤲', 'أذكار الصباح والمساء', 1, '#/adhkar');
    if (a != null && a < 19) T('study', '✏️', 'الواجبات والمذاكرة', 2);
    if (a != null && a < 19) T('chore', '🧹', 'مهمة منزلية', 1, '#/bayt/chores');
    if (a != null && a >= 10 && a < 19) T('read', '📚', 'قراءة ١٥ دقيقة', 1);
    T('birr', '🤍', a != null && a < 19 ? 'مساعدة أو كلمة طيبة للوالدين' : 'صلة رحم أو برّ', 1, a != null && a < 19 ? null : '#/usra/rahim');
    if (a == null || a >= 12) T('wajib', '📌', 'درس اليوم: ما لا يسع المسلم جهله', 1, '#/wajib');
    return out;
  }
  const tasksOf = m => [...plan(m), ...(m.custom || []).map(c => ({ id: 'c_' + c.id, ic: c.ic || '⭐', t: c.t, s: +c.s || 1 }))];
  const doneOf = (u, m, d = dk()) => ((u.done[d] || {})[m.id]) || {};
  const starsOf = m => (m.stars || 0);

  // ===== تطعيمات: زيارات الجدول الوطني (الأسماء من بطاقة الطفل) =====
  const VACC = [[0, 'عند الولادة'], [2, 'عمر شهرين'], [4, 'عمر ٤ أشهر'], [6, 'عمر ٦ أشهر'], [9, 'عمر ٩ أشهر'], [12, 'عمر سنة'], [18, 'عمر سنة ونصف'], [24, 'عمر سنتين'], [48, 'عمر ٤–٦ سنوات (قبل المدرسة)']];
  const vaccDue = m => { if (!m.birth) return []; const b = new Date(m.birth); return VACC.map(([mo, l]) => { const d = new Date(b); d.setMonth(d.getMonth() + mo); return { k: 'v' + mo, mo, l, d, done: (m.vacc || {})['v' + mo] }; }); };

  const EMERG = {
    sa: [['911', 'الرقم الموحد للطوارئ (في المناطق المفعّل بها)'], ['997', 'الإسعاف (الهلال الأحمر)'], ['998', 'الدفاع المدني'], ['999', 'الشرطة'], ['937', 'وزارة الصحة (استشارات)']],
    eg: [['123', 'الإسعاف'], ['122', 'الشرطة'], ['180', 'المطافئ'], ['16000', 'خط نجدة الطفل'], ['105', 'وزارة الصحة (الشكاوى والاستفسارات)']],
  };
  const AID = [
    ['😮‍💨 الاختناق (شيء عالق في الحلق)', ['إن كان يسعل بقوة فشجّعه على السعال ولا تتدخل.', 'الرضيع (أقل من سنة): ضعه على ساعدك ووجهه لأسفل، و٥ ضربات بين الكتفين، ثم اقلبه و٥ ضغطات على وسط الصدر بإصبعين، وكرّر.', 'الطفل الأكبر والكبير: ٥ ضربات بين الكتفين، ثم ٥ ضغطات على البطن فوق السرة (مناورة هايمليخ).', 'إن فقد الوعي: اتصل بالإسعاف فوراً وابدأ الإنعاش إن كنت مدرّباً.']],
    ['🔥 الحروق', ['ضع الحرق تحت ماء جارٍ فاتر أو بارد (لا مثلج) ٢٠ دقيقة.', 'انزع الخواتم والملابس القريبة إن لم تكن ملتصقة.', 'غطّه بغطاء نظيف أو كيس بلاستيك نظيف.', 'لا تضع معجون أسنان ولا زبدة ولا ثلجاً.', 'اذهب للطوارئ إن كان الحرق كبيراً أو في الوجه أو اليدين أو الأعضاء التناسلية، أو عند الرضيع.']],
    ['🩸 النزيف والجروح', ['اضغط على الجرح مباشرة بقطعة قماش نظيفة ١٠ دقائق دون رفعها.', 'ارفع الطرف المصاب إن أمكن.', 'إن لم يتوقف النزيف أو كان الجرح عميقاً: إلى الطوارئ.']],
    ['☠️ ابتلاع مادة سامة أو دواء', ['لا تجعله يتقيأ.', 'احتفظ بعلبة المادة أو الدواء.', 'اتصل بالإسعاف أو اذهب للطوارئ فوراً حتى لو بدا بخير.', 'الوقاية: الأدوية والمنظفات في مكان مرتفع مغلق.']],
    ['🌡️ الحرارة', ['الرضيع أقل من ٣ أشهر بحرارة ٣٨ فأكثر: إلى الطبيب فوراً.', 'أعطِ خافض الحرارة بالجرعة المكتوبة على العلبة حسب الوزن، أو كما وصفها الطبيب.', 'إلى الطوارئ عند: تشنج، أو خمول شديد، أو صعوبة تنفس، أو طفح لا يختفي بالضغط، أو جفاف.']],
    ['🤕 إصابة الرأس', ['ضع كمادة باردة وراقبه ٢٤ ساعة.', 'إلى الطوارئ عند: قيء متكرر، أو نعاس غير طبيعي، أو فقدان وعي، أو تشنج، أو اختلاف حجم الحدقتين، أو سيلان من الأنف أو الأذن.']],
  ];

  // ===== الواجهة =====
  const TABS0 = [['home', '👨‍👩‍👧 أسرتي'], ['stars', '⭐ النجوم والمكافآت'], ['sihha', '🩺 صحة الأسرة'], ['majlis', '🪑 مجلس الأسرة'], ['rahim', '🤝 صلة الرحم'], ['aman', '🔒 الأمان والبصمة']];
  let TABS = TABS0;
  V.usra = async (el, [tab, id], p) => {
    if (p && p.beta === '1') try { localStorage.setItem('zad-beta', '1'); } catch (e) { }
    TABS = (beta() || SY()) ? [...TABS0, ['sync', '🔗 ربط الجوالات']] : TABS0;
    const u = await get();
    if (tab === 'm' && id) return member(el, u, id);
    tab = TABS.find(t => t[0] === tab) ? tab : 'home';
    el.innerHTML = `<h1>👨‍👩‍👧 أسرتي</h1><div class="tabs bt-tabs">${TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div id="usB"></div>`;
    el.querySelectorAll('[data-tab]').forEach(x => x.onclick = () => location.hash = '#/usra/' + x.dataset.tab);
    let taps = 0; el.querySelector('h1').onclick = () => { if (++taps === 7) { try { localStorage.setItem('zad-beta', '1'); } catch (e) { } APP.toast('ظهر تبويب «ربط الجوالات» (تجريبي)'); location.hash = '#/usra/sync'; } };
    if (SY()) { const st = USYNC.status(); el.querySelector('h1').insertAdjacentHTML('afterend', `<div class="us-sync">🔗 مرتبط بالأسرة (${USYNC.role() === 'parent' ? 'أحد الوالدين' : 'فرد من الأسرة'})${st.lastErr ? ' — <span class="us-late">' + esc(st.lastErr) + '</span>' : st.lastSync ? ' — آخر مزامنة ' + new Date(st.lastSync).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''} <button class="btn sm" id="usSy">⟳</button></div>`); el.querySelector('#usSy').onclick = () => USYNC.sync(true).then(rer); }
    await ({ home, stars, sihha, majlis, rahim, aman, sync: syncTab })[tab](el.querySelector('#usB'), u);
  };
  const rer = () => APP.rerender();
  const resched = async () => { if (window.NOTIFY) { if ((await NOTIFY.status()).perm !== 'granted') await NOTIFY.request(); NOTIFY.rescheduleAll(); } };

  function memberForm(m) {
    m = m || { id: uid(), name: '', role: 'son', birth: '', grade: '', custom: [], stars: 0, health: {}, meds: [], vacc: {} };
    return new Promise(res => APP.modal(`<h2 style="margin-top:0">${m.name ? 'تعديل ' + esc(m.name) : '➕ فرد جديد'}</h2>
      <label class="muted">الاسم</label><input id="fN" value="${esc(m.name)}" style="width:100%">
      <label class="muted">الدور في الأسرة</label><select id="fR" style="width:100%">${Object.entries(ROLES).map(([k, [ic, l]]) => `<option value="${k}" ${k === m.role ? 'selected' : ''}>${ic} ${l}</option>`).join('')}</select>
      <label class="muted">تاريخ الميلاد (لحساب العمر والبرنامج والتطعيمات)</label><input id="fB" type="date" value="${esc(m.birth || '')}" style="width:100%">
      <label class="muted">الصف الدراسي (اختياري)</label><input id="fG" value="${esc(m.grade || '')}" style="width:100%" placeholder="مثال: الثالث الابتدائي">
      <div class="row" style="margin-top:10px"><button class="btn primary" id="fOk">حفظ</button><button class="btn" id="fNo">إلغاء</button>${m.name ? '<span class="spacer"></span><button class="btn danger" id="fDel">حذف</button>' : ''}</div>`, box => {
      box.querySelector('#fNo').onclick = () => { APP.closeModal(); res(null); };
      box.querySelector('#fOk').onclick = () => { const n = box.querySelector('#fN').value.trim(); if (!n) return APP.toast('اكتب الاسم'); Object.assign(m, { name: n, role: box.querySelector('#fR').value, birth: box.querySelector('#fB').value, grade: box.querySelector('#fG').value.trim() }); APP.closeModal(); res(m); };
      const del = box.querySelector('#fDel'); if (del) del.onclick = () => { APP.closeModal(); res({ del: m.id }); };
    }));
  }
  async function editMember(u, m) {
    const r = await memberForm(m && JSON.parse(JSON.stringify(m))); if (!r) return;
    if (r.del) { if (!confirm('حذف ' + m.name + ' وكل بياناته؟')) return; u.members = u.members.filter(x => x.id !== r.del); }
    else { const i = u.members.findIndex(x => x.id === r.id); if (i >= 0) u.members[i] = r; else u.members.push(r); }
    await save(u); rer();
  }

  async function home(el, u) {
    const ms = u.members;
    const card = m => { const T = tasksOf(m), d = doneOf(u, m), n = T.filter(t => d[t.id]).length;
      return `<a class="card us-m" href="#/usra/m/${m.id}"><span class="us-av">${ROLES[m.role][0]}</span><b>${esc(m.name)}</b><small class="muted">${ROLES[m.role][1]}${ageTxt(m) ? ' · ' + ageTxt(m) : ''}</small>
        <div class="pg-bar"><i style="width:${T.length ? Math.round(n * 100 / T.length) : 0}%"></i></div><small>اليوم: ${D(n)} / ${D(T.length)}${isChild(m) ? ` · ⭐ ${D(starsOf(m))}` : ''}</small></a>`; };
    const meds = ms.flatMap(m => (m.meds || []).filter(x => !x.until || x.until >= dk()).map(x => `${ROLES[m.role][0]} ${esc(m.name)}: ${esc(x.n)} ${x.times.map(D).join('، ')}`));
    const vac = ms.flatMap(m => vaccDue(m).filter(v => !v.done && v.d - Date.now() < 30 * 864e5 && Date.now() - v.d < 60 * 864e5).map(v => `💉 ${esc(m.name)}: زيارة تطعيم ${v.l} — ${v.d.toLocaleDateString('ar-SA-u-ca-gregory')}`));
    const rh = (u.rahim || []).filter(r => dueRahim(r) <= Date.now()).map(r => `🤝 ${esc(r.name)}`);
    el.innerHTML = `<div class="sub">لوحة واحدة لكل أفراد الأسرة: برنامج يومي لكل فرد حسب عمره، ونجوم ومكافآت للأبناء، وصحة الأسرة، ومجلس أسبوعي، وصلة الرحم. البيانات على جهازك فقط.</div>
      <div class="us-grid">${ms.map(card).join('')}${canEdit() ? '' : '<!--'}<button class="card us-m us-add" id="usAdd"><span class="us-av">➕</span><b>أضف فرداً</b><small class="muted">الأب، الأم، الأبناء، الأجداد</small></button>${canEdit() ? '' : '-->'}</div>
      ${ms.length ? `<div class="card"><h3>📋 اليوم في الأسرة — ${DAYS[new Date().getDay()]}</h3>
        ${meds.length ? `<div><b>💊 الأدوية:</b><br>${meds.join('<br>')}</div>` : ''}
        ${vac.length ? `<div style="margin-top:6px">${vac.join('<br>')}</div>` : ''}
        ${rh.length ? `<div style="margin-top:6px"><b>صلة الرحم المستحقة:</b> ${rh.join('، ')} — <a href="#/usra/rahim">افتح</a></div>` : ''}
        ${new Date().getDay() === +u.majlis.day ? `<div style="margin-top:6px">🪑 اليوم موعد <a href="#/usra/majlis">مجلس الأسرة</a> الساعة ${D(u.majlis.time)}</div>` : ''}
        ${!meds.length && !vac.length && !rh.length ? '<div class="muted">لا مواعيد خاصة اليوم.</div>' : ''}</div>
      <div class="card"><h3>🧹 توزيع مهام البيت</h3><div class="sub">مهام البيت في «إدارة البيت»؛ اكتب في خانة «على من» اسم الفرد كما هو هنا، فتظهر في صفحته.</div><a class="btn" href="#/bayt/chores">افتح مهام البيت</a></div>` : '<div class="card muted">ابدأ بإضافة أفراد أسرتك.</div>'}`;
    const ua = el.querySelector('#usAdd'); if (ua) ua.onclick = () => editMember(u);
  }

  // ===== صفحة الفرد =====
  async function member(el, u, id) {
    const m = u.members.find(x => x.id === id); if (!m) { location.hash = '#/usra'; return; }
    const T = tasksOf(m), d = doneOf(u, m), kid = isChild(m);
    let bayt = null; try { bayt = await DB.setting('bayt'); } catch (e) { }
    const chores = ((bayt && bayt.chores) || []).filter(c => (c.who || '').split(/[،,]/).map(s => s.trim()).includes(m.name));
    const H = m.health || {};
    const mine = mineOrParent(m), pend = Object.entries(m.pending || {});
    el.innerHTML = `<div class="row"><a class="btn sm" href="#/usra">→ أسرتي</a><span class="spacer"></span>${canEdit() ? '<button class="btn sm" id="mEd">✏️ تعديل</button>' : ''}</div>
      <div class="us-head"><span class="us-av big">${ROLES[m.role][0]}</span><div><h1 style="margin:0">${esc(m.name)}</h1><div class="muted">${ROLES[m.role][1]}${ageTxt(m) ? ' · ' + ageTxt(m) : ''}${m.grade ? ' · ' + esc(m.grade) : ''}</div></div>${kid ? `<span class="spacer"></span><div class="us-st">⭐ ${D(starsOf(m))}</div>` : ''}</div>
      <div class="card"><div class="row"><h3 style="margin:0">📅 برنامج اليوم</h3><span class="spacer"></span>${canEdit() ? '<button class="btn sm" id="mAddT">➕ مهمة خاصة</button>' : ''}</div>
        <div class="bt-list">${T.map(t => `<div class="bt-row ${d[t.id] ? 'done' : ''}"><button class="tk-chk ${d[t.id] ? 'on' : ''}" data-t="${t.id}">${d[t.id] ? '✓' : ''}</button><span>${t.ic}</span><b>${t.href ? `<a href="${t.href}">${esc(t.t)}</a>` : esc(t.t)}</b><span class="spacer"></span>${kid && t.s ? `<small class="muted">⭐${D(t.s)}</small>` : ''}${t.id.startsWith('c_') && canEdit() ? `<button class="btn sm" data-rmt="${t.id.slice(2)}">✕</button>` : ''}</div>`).join('')}</div>
        <div class="muted" style="font-size:12.5px">البرنامج يُبنى تلقائياً حسب العمر، وتُضاف إليه المهام الخاصة. ${kid ? 'كل مهمة منجزة تعطي نجوماً تُستبدل بمكافأة.' : ''}</div></div>
      ${(m.pending && !isParentDev() && pend.length) ? '' : ''}${pend.length ? `<div class="card us-pend"><div class="row"><h3 style="margin:0">⏳ بانتظار اعتماد الوالدين (${D(pend.length)})</h3><span class="spacer"></span>${isParentDev() ? '<button class="btn sm primary" id="apAll">✓ اعتماد الكل</button>' : ''}</div>${pend.map(([id, x]) => `<div class="bt-row"><span class="muted">${D(x.d.slice(5).split('-').reverse().join('/'))}</span><b>${esc(x.t)}</b><span class="spacer"></span><small>⭐${D(x.s)}</small>${isParentDev() ? `<button class="btn sm primary" data-ap="${id}">✓</button><button class="btn sm" data-rj="${id}">✕</button>` : ''}</div>`).join('')}</div>` : ''}
      ${chores.length ? `<div class="card"><h3>🧹 مسؤولياته في البيت</h3>${chores.map(c => `<div>${c.ic || '🧹'} ${esc(c.t)}</div>`).join('')}</div>` : ''}
      ${kid ? `<div class="card"><h3>🎁 المكافآت</h3><div class="bt-list">${u.rewards.map(r => `<div class="bt-row"><b>${esc(r.t)}</b><span class="spacer"></span><small>⭐ ${D(r.cost)}</small>${isParentDev() ? `<button class="btn sm ${starsOf(m) >= r.cost ? 'primary' : ''}" data-rw="${r.id}" ${starsOf(m) >= r.cost ? '' : 'disabled'}>استبدال</button>` : ''}</div>`).join('')}</div>
        ${(m.log || []).length ? `<details><summary class="muted">سجل النجوم</summary>${m.log.slice(-15).reverse().map(x => `<div class="muted" style="font-size:.9em">${esc(x.d)} — ${esc(x.t)} (${x.s > 0 ? '+' : ''}${D(x.s)})</div>`).join('')}</details>` : ''}</div>` : ''}
      ${!mine ? '<div class="card muted">🔒 الملف الصحي والأدوية خاصة بصاحبها وبالوالدين.</div><!--' : ''}      <div class="card"><div class="row"><h3 style="margin:0">🩺 الملف الصحي</h3><span class="spacer"></span><button class="btn sm" id="mH">✏️</button></div>
        <div>🩸 فصيلة الدم: <b>${esc(H.blood || '—')}</b></div><div>⚠️ الحساسية: <b>${esc(H.allergy || 'لا يوجد')}</b></div><div>🏥 أمراض مزمنة: <b>${esc(H.chronic || 'لا يوجد')}</b></div>${H.notes ? `<div>📝 ${esc(H.notes)}</div>` : ''}</div>
      <div class="card"><div class="row"><h3 style="margin:0">💊 الأدوية والتذكير</h3><span class="spacer"></span><button class="btn sm" id="mMed">➕ دواء</button></div>
        ${(m.meds || []).map(x => `<div class="bt-row"><b>${esc(x.n)}</b><small class="muted">${esc(x.dose || '')} — ${x.times.map(D).join('، ')}${x.until ? ' — حتى ' + D(x.until) : ''}</small><span class="spacer"></span><button class="btn sm" data-rmm="${x.id}">✕</button></div>`).join('') || '<div class="muted">لا أدوية مسجلة.</div>'}
        ${(m.meds || []).length ? `<div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px"><b>اليوم:</b>${(m.meds || []).filter(x => !x.until || x.until >= dk()).flatMap(x => x.times.map(tm => { const k = x.id + '@' + tm, on = ((m.taken || {})[dk()] || {})[k]; return `<button class="btn sm ${on ? 'primary' : ''}" data-tk="${k}">${on ? '✓' : '○'} ${esc(x.n)} ${D(tm)}</button>`; })).join('')}</div>` : ''}
        <div class="muted" style="font-size:12.5px">التذكير بالمواعيد فقط؛ الجرعة كما وصفها الطبيب أو كما في نشرة الدواء. اضغط على الجرعة عند أخذها ليعرف الوالدان.</div>
        ${SY() && !isParentDev() && USYNC.myMid() === m.id && age(m) >= 18 ? `<label class="muted"><input type="checkbox" id="mPriv" ${m.privHealth ? 'checked' : ''}> لا تشارك ملفي الصحي مع الوالدين</label>` : ''}</div>
${!mine ? '-->' : ''}      ${m.birth && age(m) < 7 && isParentDev() ? `<div class="card"><h3>💉 زيارات التطعيم</h3><div class="sub">مواعيد زيارات التطعيم الأساسية حسب العمر. أسماء اللقاحات في كل زيارة تجدها في بطاقة التطعيم الخاصة بالطفل، وقد تختلف قليلاً بين الدول.</div>
        <div class="bt-list">${vaccDue(m).map(v => `<div class="bt-row ${v.done ? 'done' : ''}"><button class="tk-chk ${v.done ? 'on' : ''}" data-v="${v.k}">${v.done ? '✓' : ''}</button><b>${v.l}</b><span class="spacer"></span><small class="${!v.done && v.d < Date.now() && Date.now() - v.d < 60 * 864e5 ? 'us-late' : 'muted'}">${v.d.toLocaleDateString('ar-SA-u-ca-gregory')}${v.done ? '' : v.d < Date.now() ? (Date.now() - v.d < 60 * 864e5 ? ' — متأخر' : ' — علّمها إن أُخذت (راجع البطاقة)') : ''}</small></div>`).join('')}</div></div>` : ''}`;
    const me_ = el.querySelector('#mEd'); if (me_) me_.onclick = () => editMember(u, m);
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = async () => {
      if (!mine) return APP.toast('يعلّم كل فرد مهامه من جواله، أو يعلّمها الوالدان');
      const t = T.find(x => x.id === b.dataset.t), day = dk(); u.done[day] = u.done[day] || {}; const dd = u.done[day][m.id] = u.done[day][m.id] || {};
      const pid = day + '_' + t.id; m.pending = m.pending || {};
      if (dd[t.id]) { delete dd[t.id];
        if (m.pending[pid]) delete m.pending[pid];
        else if (kid && t.s && isParentDev()) { m.stars = Math.max(0, starsOf(m) - t.s); (m.log = m.log || []).push({ d: day, t: 'إلغاء: ' + t.t, s: -t.s }); } }
      else { dd[t.id] = 1;
        if (kid && t.s) { if (isParentDev()) { m.stars = starsOf(m) + t.s; (m.log = m.log || []).push({ d: day, t: t.t, s: t.s }); } else m.pending[pid] = { d: day, t: t.t, s: t.s }; } }
      m.log = (m.log || []).slice(-200);
      for (const k of Object.keys(u.done)) if (k < dk(new Date(Date.now() - 60 * 864e5))) delete u.done[k];
      await save(u); rer();
    });
    const approve = async ids => { for (const id of ids) { const x = m.pending[id]; if (!x) continue; m.stars = starsOf(m) + x.s; (m.log = m.log || []).push({ d: x.d, t: x.t, s: x.s }); delete m.pending[id]; } m.log = m.log.slice(-200); await save(u); rer(); };
    el.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => approve([b.dataset.ap]));
    const apA = el.querySelector('#apAll'); if (apA) apA.onclick = () => approve(Object.keys(m.pending || {}));
    el.querySelectorAll('[data-rj]').forEach(b => b.onclick = async () => { const x = m.pending[b.dataset.rj]; delete m.pending[b.dataset.rj]; const dd = (u.done[x.d] || {})[m.id]; if (dd) for (const t of T) if (t.t === x.t) delete dd[t.id]; await save(u); rer(); });
    if (el.querySelector('#mAddT')) el.querySelector('#mAddT').onclick = async () => { const r = await APP.ask('مهمة يومية خاصة لـ' + m.name, [{ key: 't', label: 'المهمة (مثال: تمارين النطق، سقي الزرع)' }, { key: 's', label: 'النجوم', options: ['1', '2', '3', '5'] }]); if (!r || !r.t.trim()) return; (m.custom = m.custom || []).push({ id: uid(), t: r.t.trim(), s: +r.s || 1 }); await save(u); rer(); };
    el.querySelectorAll('[data-rmt]').forEach(b => b.onclick = async () => { m.custom = (m.custom || []).filter(c => c.id !== b.dataset.rmt); await save(u); rer(); });
    el.querySelectorAll('[data-rw]').forEach(b => b.onclick = async () => { const r = u.rewards.find(x => x.id === b.dataset.rw); if (starsOf(m) < r.cost) return; m.stars -= r.cost; (m.log = m.log || []).push({ d: dk(), t: '🎁 ' + r.t, s: -r.cost }); await save(u); APP.toast('مبارك! 🎁 ' + r.t); rer(); });
    el.querySelectorAll('[data-tk]').forEach(b => b.onclick = async () => { const day = dk(); m.taken = m.taken || {}; const x = m.taken[day] = m.taken[day] || {}; if (x[b.dataset.tk]) delete x[b.dataset.tk]; else x[b.dataset.tk] = Date.now(); for (const k of Object.keys(m.taken)) if (k < dk(new Date(Date.now() - 14 * 864e5))) delete m.taken[k]; await save(u); await resched(); rer(); });
    const pv = el.querySelector('#mPriv'); if (pv) pv.onchange = async () => { m.privHealth = pv.checked; await save(u); };
    if (el.querySelector('#mH')) el.querySelector('#mH').onclick = async () => { const r = await APP.ask('الملف الصحي: ' + m.name, [{ key: 'blood', label: 'فصيلة الدم', options: ['', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] }, { key: 'allergy', label: 'الحساسية (أدوية، أطعمة…)' }, { key: 'chronic', label: 'أمراض مزمنة' }, { key: 'notes', label: 'ملاحظات للطوارئ', type: 'textarea' }], H); if (!r) return; m.health = r; await save(u); rer(); };
    if (el.querySelector('#mMed')) el.querySelector('#mMed').onclick = () => APP.modal(`<h2 style="margin-top:0">💊 دواء لـ${esc(m.name)}</h2><label class="muted">اسم الدواء</label><input id="dN" style="width:100%"><label class="muted">الجرعة (كما وصفها الطبيب)</label><input id="dD" style="width:100%"><label class="muted">أوقات التذكير</label><div id="dT"><input type="time" value="08:00"></div><button class="btn sm" id="dTa">➕ وقت</button><label class="muted">حتى تاريخ (اتركه فارغاً للدواء الدائم)</label><input id="dU" type="date" style="width:100%"><div class="row" style="margin-top:10px"><button class="btn primary" id="dOk">حفظ وتذكير</button><button class="btn" id="dNo">إلغاء</button></div>`, box => {
      box.querySelector('#dTa').onclick = () => box.querySelector('#dT').insertAdjacentHTML('beforeend', ' <input type="time" value="20:00">');
      box.querySelector('#dNo').onclick = () => APP.closeModal();
      box.querySelector('#dOk').onclick = async () => { const n = box.querySelector('#dN').value.trim(); const times = [...box.querySelectorAll('#dT input')].map(i => i.value).filter(Boolean); if (!n || !times.length) return APP.toast('اكتب الاسم والوقت'); (m.meds = m.meds || []).push({ id: uid(), n, dose: box.querySelector('#dD').value.trim(), times, until: box.querySelector('#dU').value }); APP.closeModal(); await save(u); await resched(); rer(); };
    });
    el.querySelectorAll('[data-rmm]').forEach(b => b.onclick = async () => { m.meds = m.meds.filter(x => x.id !== b.dataset.rmm); await save(u); await resched(); rer(); });
    el.querySelectorAll('[data-v]').forEach(b => b.onclick = async () => { m.vacc = m.vacc || {}; if (m.vacc[b.dataset.v]) delete m.vacc[b.dataset.v]; else m.vacc[b.dataset.v] = dk(); await save(u); await resched(); rer(); });
  }

  // ===== النجوم والمكافآت =====
  async function stars(el, u) {
    const kids = u.members.filter(isChild);
    el.innerHTML = `<div class="sub">كل مهمة ينجزها الابن من برنامجه اليومي تعطيه نجوماً، ويستبدلها بمكافأة تحددونها أنتم. كل طفل يُقارن بنفسه فقط، لا بإخوته.</div>
      ${kids.map(m => { const wk = (m.log || []).filter(x => x.s > 0 && x.d >= dk(new Date(Date.now() - 6 * 864e5))).reduce((s, x) => s + x.s, 0);
        return `<a class="card pg-row" href="#/usra/m/${m.id}" style="text-decoration:none;color:inherit"><span class="us-av">${ROLES[m.role][0]}</span><b class="pg-t">${esc(m.name)}</b><span>⭐ ${D(starsOf(m))}</span><small class="muted" style="flex-basis:100%">هذا الأسبوع: ${D(wk)} نجمة</small></a>`; }).join('') || '<div class="card muted">أضف الأبناء من «أسرتي» أولاً.</div>'}
      <div class="card"><div class="row"><h3 style="margin:0">🎁 قائمة المكافآت</h3><span class="spacer"></span>${canEdit() ? '<button class="btn sm primary" id="rwAdd">➕ مكافأة</button>' : ''}</div>
        <div class="bt-list">${u.rewards.map(r => `<div class="bt-row"><b>${esc(r.t)}</b><span class="spacer"></span><small>⭐ ${D(r.cost)}</small>${canEdit() ? `<button class="btn sm" data-rd="${r.id}">✕</button>` : ''}</div>`).join('')}</div>
        <div class="muted" style="font-size:12.5px">اقتراح: مكافآت معنوية وتجارب مشتركة (نزهة، اختيار نشاط، وقت خاص مع الأب أو الأم) أنفع من الحلوى والأجهزة.</div></div>`;
    if (el.querySelector('#rwAdd')) el.querySelector('#rwAdd').onclick = async () => { const r = await APP.ask('مكافأة جديدة', [{ key: 't', label: 'المكافأة' }, { key: 'c', label: 'عدد النجوم المطلوبة' }]); if (!r || !r.t.trim()) return; u.rewards.push({ id: uid(), t: r.t.trim(), cost: Math.max(1, parseInt(String(r.c).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))) || 10) }); await save(u); rer(); };
    el.querySelectorAll('[data-rd]').forEach(b => b.onclick = async () => { u.rewards = u.rewards.filter(x => x.id !== b.dataset.rd); await save(u); rer(); });
  }

  // ===== صحة الأسرة =====
  async function sihha(el, u) {
    const E = EMERG[u.country] || EMERG.sa;
    el.innerHTML = `<div class="card"><div class="row"><h3 style="margin:0">🚑 أرقام الطوارئ</h3><span class="spacer"></span><select id="cty"><option value="sa" ${u.country === 'sa' ? 'selected' : ''}>🇸🇦 السعودية</option><option value="eg" ${u.country === 'eg' ? 'selected' : ''}>🇪🇬 مصر</option></select></div>
        <div class="bt-list">${E.map(([n, l]) => `<a class="bt-row" href="tel:${n}" style="text-decoration:none;color:inherit"><b class="us-num">${D(n)}</b><span>${l}</span><span class="spacer"></span>📞</a>`).join('')}</div></div>
      <div class="card"><h3>👨‍👩‍👧 الملفات الصحية</h3>${u.members.map(m => { const H = m.health || {}; return `<a class="bt-row" href="#/usra/m/${m.id}" style="text-decoration:none;color:inherit;flex-wrap:wrap"><b>${ROLES[m.role][0]} ${esc(m.name)}</b><small class="muted" style="flex-basis:100%">🩸 ${esc(H.blood || '—')} · ⚠️ ${esc(H.allergy || 'لا حساسية مسجلة')}${(m.meds || []).length ? ' · 💊 ' + D(m.meds.length) + ' دواء' : ''}</small></a>`; }).join('') || '<div class="muted">أضف أفراد الأسرة أولاً.</div>'}</div>
      <h2>🩹 إسعافات أولية مبسطة</h2><div class="sub">للتوعية فقط. في أي حالة خطيرة اتصل بالإسعاف فوراً، ويُستحسن حضور دورة إسعافات أولية معتمدة.</div>
      ${AID.map(([t, s]) => `<details class="card"><summary><b>${t}</b></summary><ol>${s.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details>`).join('')}`;
    el.querySelector('#cty').onchange = async e => { u.country = e.target.value; await save(u); rer(); };
  }

  // ===== مجلس الأسرة الأسبوعي =====
  const loadJS = (src, name) => window[name] ? Promise.resolve(window[name]) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = src + '?v=' + (window.DATA_V || ''); s.onload = () => ok(window[name]); s.onerror = no; document.head.appendChild(s); });
  const weekNo = () => Math.floor((Date.now() / 864e5 + 4) / 7);
  async function majlis(el, u) {
    const [W, U] = await Promise.all([loadJS('data/wajib.js', 'WAJIB').catch(() => null), loadJS('data/usul.js', 'USUL').catch(() => null)]);
    const w = weekNo(), pick = (a, k = 0) => a && a.length ? a[(w + k) % a.length] : null;
    const op = W && pick(W.items.filter(x => (x.ev || []).length));
    const sira = U && pick(U.tracks.sira.lessons), adab = U && pick(U.tracks.adab.lessons, 3);
    const qs = U ? [U.tracks.tafsir, U.tracks.adab, U.tracks.sira, U.tracks.ibadat, U.tracks.aqida].map((t, i) => { const l = pick(t.lessons, i * 2); return l && l.q[0] ? { q: l.q[0], src: t.t } : null; }).filter(Boolean) : [];
    const kids = u.members.filter(isChild);
    const wk = m => (m.log || []).filter(x => x.s > 0 && x.d >= dk(new Date(Date.now() - 6 * 864e5))).reduce((s, x) => s + x.s, 0);
    const M = u.majlis;
    el.innerHTML = `<div class="sub">لقاء أسبوعي قصير (٢٠–٣٠ دقيقة) يجمع الأسرة: ذكرٌ وقصة ومسابقة وتشجيع وهدف للأسبوع. يتغير البرنامج تلقائياً كل أسبوع.</div>
      ${canEdit() ? '' : '<!--'}<div class="card row" style="flex-wrap:wrap;gap:8px"><b>⏰ الموعد:</b><select id="mjD">${DAYS.map((n, i) => `<option value="${i}" ${+M.day === i ? 'selected' : ''}>${n}</option>`).join('')}</select><input id="mjT" type="time" value="${esc(M.time)}"><label><input type="checkbox" id="mjOn" ${M.on ? 'checked' : ''}> تذكير</label><button class="btn sm primary" id="mjS">حفظ</button></div>${canEdit() ? '' : '-->'}
      <div class="card us-mj"><h3>١. 🌿 الافتتاح</h3>${op ? `<p><b>${esc(op.t)}</b></p>${op.ev.slice(0, 1).map(e => `<p class="mj-q">${esc(e.t)}</p><small class="muted">${esc(e.ref || '')}</small>`).join('')}` : ''}
        <h3>٢. 🌙 قصة من السيرة</h3>${sira ? `<p><b>${esc(sira.t)}</b>: ${esc(sira.idea)}</p><a href="#/usul/sira/${sira.id}">الدرس كاملاً ←</a>` : ''}
        <h3>٣. 🌸 أدب الأسبوع</h3>${adab ? `<p><b>${esc(adab.t)}</b>: ${esc(adab.rules[0] || adab.idea)}</p><a href="#/usul/adab/${adab.id}">الدرس كاملاً ←</a>` : ''}
        <h3>٤. 🏆 مسابقة الأسرة</h3>${qs.map(({ q, src }, i) => `<details><summary>${D(i + 1)}. ${esc(q[0])} <small class="muted">(${esc(src)})</small></summary><div>${q[1].map((o, j) => `<span class="${j === q[2] ? 'us-ok' : 'muted'}">${j === q[2] ? '✓ ' : ''}${esc(o)}</span>`).join(' · ')}</div></details>`).join('')}
        <h3>٥. ⭐ نجوم الأسبوع</h3>${kids.map(m => `<div>${ROLES[m.role][0]} <b>${esc(m.name)}</b>: ${D(wk(m))} نجمة هذا الأسبوع — اذكروا له شيئاً أحسن فيه.</div>`).join('') || '<div class="muted">أضف الأبناء من «أسرتي».</div>'}
        <h3>٦. 🎯 هدف الأسبوع</h3>${canEdit() ? '<div class="row"><input id="mjG" placeholder="مثال: صلاة الفجر جماعة في البيت" style="flex:1"><button class="btn sm" id="mjGa">حفظ</button></div>' : ''}
        ${(M.goals || []).slice(-5).reverse().map(g => `<div class="muted">• ${esc(g.d)}: ${esc(g.t)}</div>`).join('')}
        <h3>٧. 🤲 الختام</h3><p>كفارة المجلس: «سبحانك اللهم وبحمدك، أشهد أن لا إله إلا أنت، أستغفرك وأتوب إليك».</p></div>`;
    if (el.querySelector('#mjS')) el.querySelector('#mjS').onclick = async () => { Object.assign(u.majlis, { day: +el.querySelector('#mjD').value, time: el.querySelector('#mjT').value || '20:00', on: el.querySelector('#mjOn').checked }); await save(u); await resched(); APP.toast('تم الحفظ'); rer(); };
    if (el.querySelector('#mjGa')) el.querySelector('#mjGa').onclick = async () => { const t = el.querySelector('#mjG').value.trim(); if (!t) return; (u.majlis.goals = u.majlis.goals || []).push({ d: dk(), t }); await save(u); rer(); };
  }

  // ===== صلة الرحم =====
  const dueRahim = r => (r.last ? new Date(r.last).getTime() : 0) + (+r.every || 14) * 864e5;
  async function rahim(el, u) {
    const L = [...(u.rahim || [])].sort((a, b) => dueRahim(a) - dueRahim(b));
    const st = r => { const d = Math.ceil((dueRahim(r) - Date.now()) / 864e5); return d <= 0 ? '<span class="us-late">حان وقت التواصل</span>' : 'بعد ' + D(d) + ' يوم'; };
    const ph = p => String(p || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d+]/g, '');
    el.innerHTML = `<div class="sub">«من أحب أن يُبسط له في رزقه ويُنسأ له في أثره فليصل رحمه» متفق عليه. أضف أقاربك وكم مرة تريد التواصل معهم، ويذكّرك التطبيق.</div>
      ${canEdit() ? '<button class="btn primary" id="rhAdd">➕ قريب</button>' : ''}
      <div class="bt-list" style="margin-top:8px">${L.map(r => `<div class="bt-row" style="flex-wrap:wrap"><b>${esc(r.name)}</b><small class="muted">${esc(r.rel || '')} · كل ${D(r.every)} يوم</small><span class="spacer"></span><small>${st(r)}</small>
        <div class="row" style="flex-basis:100%;gap:6px;margin-top:4px">${r.phone ? `<a class="btn sm" href="tel:${ph(r.phone)}">📞 اتصال</a><a class="btn sm" href="https://wa.me/${ph(r.phone).replace(/^\+/, '')}" target="_blank" rel="noopener">💬 واتساب</a>` : ''}${canEdit() ? `<button class="btn sm primary" data-ok="${r.id}">✓ تواصلت اليوم</button><button class="btn sm" data-rr="${r.id}">✕</button>` : ''}</div></div>`).join('') || '<div class="muted">لا أقارب بعد.</div>'}</div>`;
    if (el.querySelector('#rhAdd')) el.querySelector('#rhAdd').onclick = async () => { const r = await APP.ask('قريب جديد', [{ key: 'name', label: 'الاسم' }, { key: 'rel', label: 'القرابة (خالة، عم، جدة…)' }, { key: 'phone', label: 'رقم الجوال (اختياري، مع رمز الدولة)' }, { key: 'every', label: 'التواصل كل', options: ['7', '14', '30', '60'] }], { every: '14' }); if (!r || !r.name.trim()) return; (u.rahim = u.rahim || []).push({ id: uid(), name: r.name.trim(), rel: r.rel.trim(), phone: r.phone.trim(), every: +r.every || 14, last: '' }); await save(u); await resched(); rer(); };
    el.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => { const r = u.rahim.find(x => x.id === b.dataset.ok); r.last = dk(); await save(u); await resched(); APP.toast('تقبّل الله 🤍'); rer(); });
    el.querySelectorAll('[data-rr]').forEach(b => b.onclick = async () => { u.rahim = u.rahim.filter(x => x.id !== b.dataset.rr); await save(u); rer(); });
  }

  // ===== 🔗 ربط الجوالات =====
  // موافقة صريحة قبل رفع أي بيانات للأسرة (تُطلب قبل الإنشاء والانضمام)
  async function syncConsent() {
    const C = [
      'قبل ربط الأسرة، اقرأ ما سيُرسل إلى خوادم Google (Firebase):',
      '• أسماء الأفراد وأدوارهم وتواريخ ميلادهم وصفوفهم',
      '• برامجهم ومهامهم ونجومهم وقائمة التسوق ومهام البيت',
      '• الملف الصحي لمن له ملف: الحالات والأدوية والتطعيمات',
      'الملف الصحي يراه صاحبه والوالدان فقط، والدخول مجهول بلا إيميل ولا رقم.',
      'لا يُرسل أبداً: الملاحظات والمحفوظات والتسجيلات والموقع.',
      'يمكنك الفصل أو حذف الأسرة وبياناتها من الخادم في أي وقت.',
      'هل توافق على رفع هذه البيانات؟'
    ].join('\n');
    if (!confirm(C)) return false;
    try { await DB.setting('usraSyncConsent', new Date().toISOString()); } catch (e) { }
    return true;
  }
  async function syncTab(el, u) {
    if (!window.USYNC) { el.innerHTML = '<div class="card muted">غير متاح.</div>'; return; }
    if (!SY()) {
      el.innerHTML = `<div class="card"><h3>🔗 اربط جوالات أسرتك</h3><div class="sub">ميزة اختيارية: يصبح لكل فرد «أسرتي» على جواله، وتتزامن البرامج والنجوم وقائمة التسوق ومهام البيت عبر الإنترنت. من لا يربط يبقى التطبيق عنده على الجهاز فقط كما هو.</div>
        <ul class="muted" style="line-height:1.9"><li>لا نطلب إيميلاً ولا رقم جوال.</li><li>بيانات «زاد الرفيقة» والملاحظات والمحفوظات لا تُرفع أبداً.</li><li>الملف الصحي لكل فرد يراه هو والوالدان فقط.</li><li>يمكن حذف الأسرة وكل بياناتها من الخادم في أي وقت.</li></ul></div>
        <div class="card"><h3>👨 أنا الأب أو الأم: أنشئ أسرة</h3><div class="sub">أضف أفراد الأسرة في «أسرتي» أولاً، ثم اختر كلمتي سر: واحدة للأبناء والأفراد، وأخرى للوالد الآخر فقط.</div><button class="btn primary" id="syC">إنشاء الأسرة على الإنترنت</button></div>
        <div class="card"><h3>👪 انضم لأسرة موجودة</h3><div class="sub">اكتب رمز الأسرة الذي أعطاك إياه الأب أو الأم.</div>
          <label class="muted">رمز الأسرة</label><input id="syK" placeholder="ZAD-XXXX-XXXX" style="width:100%;direction:ltr">
          <label class="muted">أنا:</label><select id="syR" style="width:100%"><option value="m">فرد من الأسرة</option><option value="p">الأب أو الأم (بكلمة سر الوالدين)</option></select>
          <label class="muted">كلمة السر</label><input id="syP" type="password" style="width:100%">
          <button class="btn primary" id="syJ" style="margin-top:8px">انضمام</button></div>`;
      el.querySelector('#syC').onclick = async () => {
        if (!u.members.length) return APP.toast('أضف أفراد الأسرة أولاً من «أسرتي»');
        if (!(await syncConsent())) return;
        const r = await APP.ask('إنشاء الأسرة', [{ key: 'name', label: 'اسم الأسرة (مثال: أسرة السيد)' }, { key: 'me', label: 'من أنت؟', options: u.members.filter(m => !isChild(m) || ['father', 'mother'].includes(m.role)).map(m => m.name) }, { key: 'pw', label: 'كلمة سر الأبناء والأفراد (٦ أحرف فأكثر)' }, { key: 'pp', label: 'كلمة سر الوالدين (مختلفة، للأب أو الأم الآخر)' }]);
        if (!r) return; if ((r.pw || '').length < 6 || (r.pp || '').length < 6 || r.pw === r.pp) return APP.toast('كلمتا السر ٦ أحرف فأكثر ومختلفتان');
        const me = u.members.find(m => m.name === r.me);
        try { APP.toast('جارٍ الإنشاء…'); const c = await USYNC.create(r.name || 'أسرتي', r.pw, r.pp, me && me.id); APP.modal(`<h2 style="margin-top:0">✅ تم إنشاء الأسرة</h2><p>رمز الأسرة:</p><div class="us-code">${esc(c)}</div><p class="muted">أعطِ الرمز وكلمة سر الأفراد لأبنائك، والرمز وكلمة سر الوالدين للأم أو الأب. احفظ كلمتي السر عندك، فلا يمكن استرجاعهما.</p><button class="btn primary" onclick="APP.closeModal()">تم</button>`); rer(); }
        catch (e) { APP.toast('تعذر الإنشاء: ' + (e.message || 'تحقق من الإنترنت')); }
      };
      el.querySelector('#syJ').onclick = async () => {
        const k = el.querySelector('#syK').value, p = el.querySelector('#syP').value, asP = el.querySelector('#syR').value === 'p';
        if (!k || !p) return APP.toast('اكتب الرمز وكلمة السر');
        if (u.members.length && !confirm('سيُستبدل ما في «أسرتي» على هذا الجوال ببيانات الأسرة. متابعة؟')) return;
        if (!(await syncConsent())) return;
        try { APP.toast('جارٍ الانضمام…'); await USYNC.join(k, p, asP); APP.toast('تم الانضمام ✓'); rer(); } catch (e) { APP.toast(e.message || 'تعذر الانضمام'); }
      };
      return;
    }
    const L = USYNC.link(), me = u.members.find(m => m.id === USYNC.myMid());
    el.innerHTML = `<div class="card"><h3>🔗 الأسرة مرتبطة</h3><div>رمز الأسرة: <span class="us-code sm">${esc(USYNC.code())}</span></div><div>دورك: <b>${USYNC.role() === 'parent' ? 'أحد الوالدين' : 'فرد من الأسرة'}</b></div>
        <label class="muted">أنا في الأسرة:</label><select id="syMe" style="width:100%"><option value="">— اختر اسمك —</option>${u.members.map(m => `<option value="${m.id}" ${me && me.id === m.id ? 'selected' : ''}>${ROLES[m.role][0]} ${esc(m.name)}</option>`).join('')}</select>
        <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap"><button class="btn" id="syNow">⟳ مزامنة الآن</button><button class="btn" id="syLv">مغادرة الأسرة على هذا الجوال</button></div></div>
      ${USYNC.role() === 'parent' ? `<div class="card"><h3>📱 الجوالات المرتبطة</h3><div id="syDv" class="muted">جارٍ التحميل…</div></div>
      <div class="card"><h3>🗑️ حذف الأسرة من الخادم</h3><div class="sub">يحذف كل بيانات الأسرة من الإنترنت نهائياً ويفصل كل الجوالات، وتبقى نسخة على هذا الجوال.</div><button class="btn danger" id="syDel">حذف الأسرة نهائياً</button></div>` : ''}`;
    el.querySelector('#syMe').onchange = async e => { try { await USYNC.setMe(e.target.value); APP.toast('تم'); rer(); } catch (x) { APP.toast('تعذر الحفظ'); } };
    el.querySelector('#syNow').onclick = () => USYNC.sync(true).then(rer);
    el.querySelector('#syLv').onclick = async () => { if (!confirm('فصل هذا الجوال عن الأسرة؟ تبقى البيانات على الجوال.')) return; await USYNC.leave(); rer(); };
    const dl = el.querySelector('#syDel'); if (dl) dl.onclick = async () => { if (!confirm('حذف الأسرة وكل بياناتها من الخادم نهائياً؟')) return; await USYNC.destroy(); APP.toast('تم حذف الأسرة من الخادم'); rer(); };
    const dv = el.querySelector('#syDv');
    if (dv) try { const ds = await USYNC.devices(); dv.innerHTML = ds.map(d => { const m = u.members.find(x => x.id === d.mid); return `<div class="bt-row"><b>${esc(d.name || 'جهاز')}</b><small class="muted">${d.role === 'parent' ? 'والد' : 'فرد'}${m ? ' · ' + esc(m.name) : ''}</small><span class="spacer"></span>${(USYNC.link().self || '') ? '' : `<button class="btn sm" data-kk="${d.uid}">فصل</button>`}</div>`; }).join('') || 'لا أجهزة';
      dv.querySelectorAll('[data-kk]').forEach(b => b.onclick = async () => { if (!confirm('فصل هذا الجهاز؟')) return; await USYNC.kick(b.dataset.kk); rer(); }); } catch (e) { dv.textContent = 'تعذر التحميل'; }
  }

  // ===== وضع الأطفال الآمن =====
  async function aman(el, u) {
    const K = u.kids, used = (K.used || {})[dk()] || 0;
    el.innerHTML = `<div class="card"><h3>🔒 رقم سري للخروج من «زاد البراعم»</h3><div class="sub">عند ضبطه، لا يخرج الطفل من قسم الأطفال إلى بقية التطبيق إلا بإدخال الرقم.</div>
        <div class="row"><input id="kP" type="password" inputmode="numeric" maxlength="6" placeholder="${K.pin ? '•••• (مضبوط)' : '٤ أرقام'}"><button class="btn primary" id="kPs">حفظ</button>${K.pin ? '<button class="btn" id="kPd">إلغاء الرقم</button>' : ''}</div></div>
      <div class="card"><h3>⏳ حدّ الاستخدام اليومي للأطفال</h3><div class="sub">بعد انتهاء المدة تظهر رسالة لطيفة «انتهى وقت اليوم» ولا يكمل الطفل إلا بالرقم السري.</div>
        <div class="row"><select id="kL">${[0, 15, 20, 30, 45, 60, 90].map(n => `<option value="${n}" ${+K.limit === n ? 'selected' : ''}>${n ? D(n) + ' دقيقة' : 'بلا حدّ'}</option>`).join('')}</select><button class="btn primary" id="kLs">حفظ</button></div>
        <div class="muted">استُخدم اليوم: ${D(used)} دقيقة.</div></div>
      <div class="card"><h3>👆 بصمة الإصبع</h3><div id="bioS" class="sub">جارٍ الفحص…</div>
        <label class="row" style="gap:8px"><input type="checkbox" id="kBio" ${K.bio ? 'checked' : ''}> استعمل البصمة بدل الرقم السري (للخروج من البراعم ومتابعة الوقت)</label>
        <label class="row" style="gap:8px;margin-top:6px"><input type="checkbox" id="kLock" ${appLockOn() ? 'checked' : ''}> 🔐 قفل التطبيق كله بالبصمة عند فتحه</label>
        <div class="muted" style="font-size:12.5px">البصمة لا تُحفظ في التطبيق ولا تُرسل لأي مكان؛ نظام الجوال يتحقق منها ويخبر التطبيق بالنتيجة فقط. وإن تعذرت البصمة يُقبل رمز قفل الجوال.</div></div>`;
    bioInfo().then(bi => { const x = el.querySelector('#bioS'); if (!x) return; x.textContent = !bi ? 'البصمة متاحة في تطبيق أندرويد فقط (لا تعمل في المتصفح).' : bi.biometric ? 'البصمة مفعّلة في جوالك ✓' : bi.secure ? 'لا توجد بصمة مسجلة في الجوال، وسيُستعمل رمز قفل الجوال.' : 'سجّل بصمة أو رمز قفل في إعدادات الجوال أولاً.'; if (!bi || (!bi.biometric && !bi.secure)) { el.querySelector('#kBio').disabled = true; el.querySelector('#kLock').disabled = true; } });
    el.querySelector('#kBio').onchange = async e => { if (e.target.checked && !(await bioAuth('تفعيل البصمة'))) { e.target.checked = false; return; } if (!e.target.checked && !(await checkPin(u))) { e.target.checked = true; return; } K.bio = e.target.checked; await save(u); APP.toast('تم الحفظ'); };
    el.querySelector('#kLock').onchange = async e => { if (!(await bioAuth(e.target.checked ? 'تفعيل قفل التطبيق' : 'إلغاء قفل التطبيق'))) { e.target.checked = !e.target.checked; return; } setAppLock(e.target.checked); APP.toast(e.target.checked ? 'سيُقفل التطبيق بالبصمة عند فتحه' : 'أُلغي قفل التطبيق'); };
    el.querySelector('#kPs').onclick = async () => { const v = el.querySelector('#kP').value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim(); if (!/^\d{4,6}$/.test(v)) return APP.toast('الرقم من ٤ إلى ٦ أرقام'); K.pin = await hash(v); await save(u); APP.toast('تم ضبط الرقم السري'); rer(); };
    const pd = el.querySelector('#kPd'); if (pd) pd.onclick = async () => { if (!(await checkPin(u))) return; K.pin = ''; await save(u); rer(); };
    el.querySelector('#kLs').onclick = async () => { K.limit = +el.querySelector('#kL').value; await save(u); APP.toast('تم الحفظ'); rer(); };
  }
  const BIO = () => window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Biometric;
  async function bioInfo() { try { const b = BIO(); if (!b) return null; return await b.available(); } catch (e) { return null; } }
  async function bioAuth(title) { try { await BIO().auth({ title, subtitle: 'زاد الأسرة المسلمة' }); return true; } catch (e) { return false; } }
  async function hash(s) { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('usra:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return 'p:' + s; } }
  async function checkPin(u) {
    u = u || await get();
    if (u.kids.bio) { const bi = await bioInfo(); if (bi && (bi.biometric || bi.secure)) { if (await bioAuth('للوالدين: تأكيد بالبصمة')) return true; if (!u.kids.pin) return false; } }
    if (!u.kids.pin) return true;
    const r = await APP.ask('🔒 أدخل الرقم السري (للوالدين)', [{ key: 'p', label: 'الرقم السري' }]); if (!r) return false;
    const ok = (await hash(String(r.p).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim())) === u.kids.pin; if (!ok) APP.toast('الرقم غير صحيح'); return ok;
  }
  // ===== 🔐 قفل التطبيق بالبصمة =====
  function appLockOn() { try { return localStorage.getItem('app-lock') === '1'; } catch (e) { return false; } }
  function setAppLock(v) { try { if (v) localStorage.setItem('app-lock', '1'); else localStorage.removeItem('app-lock'); } catch (e) { } }
  let hiddenAt = 0, locking = false;
  async function lockNow() {
    if (!appLockOn() || locking || !BIO()) return; locking = true;
    const bi = await bioInfo(); if (!bi || (!bi.biometric && !bi.secure)) { setAppLock(false); locking = false; return; }
    const o = document.createElement('div'); o.className = 'us-lock app-lock';
    o.innerHTML = '<div><div style="font-size:64px">🔐</div><h2>زاد الأسرة المسلمة</h2><p>التطبيق مقفل</p><button class="btn primary" id="alU">👆 افتح بالبصمة</button></div>';
    document.body.appendChild(o);
    const go = async () => { if (await bioAuth('افتح زاد الأسرة')) { o.remove(); locking = false; } };
    o.querySelector('#alU').onclick = go; go();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 60e3) lockNow(); });
  if (appLockOn()) setTimeout(lockNow, 300);

  // يُستدعى من زر خروج الأطفال
  window.USRA = { checkPin, get };
  get().then(u => { window.__usraNames = u.members.map(m => m.name); }).catch(() => { });
  // عدّاد وقت الأطفال
  let unlockedUntil = 0;
  setInterval(async () => {
    if (!document.body.classList.contains('learn-kids') || document.hidden) return;
    const u = await get(), K = u.kids; const d = dk(); K.used = { [d]: ((K.used || {})[d] || 0) + 1 }; await save(u);
    if (K.limit && K.used[d] >= K.limit && Date.now() > unlockedUntil && !document.querySelector('.us-lock')) {
      const o = document.createElement('div'); o.className = 'us-lock';
      o.innerHTML = `<div><div style="font-size:64px">🌙</div><h2>انتهى وقت اليوم</h2><p>أحسنت! نكمل غداً بإذن الله.</p><button class="btn" id="ulk">للوالدين: متابعة</button></div>`;
      document.body.appendChild(o);
      o.querySelector('#ulk').onclick = async () => { if (await checkPin()) { unlockedUntil = Date.now() + 30 * 60e3; o.remove(); } };
    }
  }, 60e3);

  // ===== التنبيهات =====
  if (window.NOTIFY) NOTIFY.register('usra', async () => {
    const u = await get(), out = [], now = new Date();
    for (const m of u.members) {
      if (SY() && !isParentDev() && USYNC.myMid() !== m.id) continue;
      for (const x of (m.meds || [])) for (let k = 0; k < 7; k++) {
        const d = new Date(); d.setDate(d.getDate() + k); if (x.until && dk(d) > x.until) continue;
        for (const t of x.times) { const [h, mi] = t.split(':').map(Number), at = new Date(d); at.setHours(h, mi, 0, 0);
          const own = !SY() || USYNC.myMid() === m.id || !isChild(m);
          if (at > now && own) out.push({ title: '💊 ' + x.n + ' — ' + m.name, body: x.dose || 'موعد الدواء', at, route: '#/usra/m/' + m.id });
          if (SY() && isParentDev() && isChild(m) && USYNC.myMid() !== m.id) { const chk = new Date(at.getTime() + 30 * 60e3); const tk = ((m.taken || {})[dk(d)] || {})[x.id + '@' + t]; if (chk > now && !tk) out.push({ title: '💊 تحقق: دواء ' + m.name, body: 'هل أخذ ' + m.name + ' «' + x.n + '» موعد ' + t + '؟', at: chk, route: '#/usra/m/' + m.id }); } }
      }
      if (SY() && !isParentDev()) continue;
      for (const v of vaccDue(m)) { if (v.done) continue; for (const before of [7, 0]) { const at = new Date(v.d); at.setDate(at.getDate() - before); at.setHours(9, 0, 0, 0); if (at > now && at - now < 60 * 864e5) out.push({ title: '💉 تطعيم ' + m.name, body: (before ? 'بعد أسبوع: ' : 'اليوم: ') + 'زيارة التطعيم ' + v.l, at, route: '#/usra/m/' + m.id }); } }
    }
    if (u.majlis.on) for (let k = 0; k < 4; k++) { const d = new Date(); d.setDate(d.getDate() + ((+u.majlis.day - d.getDay() + 7) % 7) + 7 * k); const [h, mi] = u.majlis.time.split(':').map(Number); d.setHours(h, mi, 0, 0); if (d > now) out.push({ title: '🪑 مجلس الأسرة', body: 'حان موعد لقاء الأسرة الأسبوعي', at: d, route: '#/usra/majlis' }); }
    for (const r of (u.rahim || [])) { const at = new Date(Math.max(dueRahim(r), Date.now() + 3600e3)); at.setHours(18, 0, 0, 0); if (at <= now) at.setDate(at.getDate() + 1); if (at - now < 30 * 864e5) out.push({ title: '🤝 صلة الرحم', body: 'تواصل مع ' + r.name + (r.rel ? ' (' + r.rel + ')' : ''), at, route: '#/usra/rahim' }); }
    return out.slice(0, 190);
  });
})();
