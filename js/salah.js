/* 🕌 مواقيت الصلاة والأذان والقبلة — حسب الموقع، تُحسب على الجهاز بدون إنترنت */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const NAMES = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  const FIVE = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const fmt = d => d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  const DEF = { lat: null, lng: null, place: '', method: '', asr: 'std', adj: {}, adhan: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true }, pre: 0, sunriseAlert: false, iqama: 0, enabled: false, sound: 'adhan' };
  async function cfg() { const c = Object.assign({}, DEF, (await DB.setting('prayer')) || {}); c.adhan = Object.assign({}, DEF.adhan, c.adhan); c.adj = c.adj || {}; return c; }
  const save = c => DB.setting('prayer', c);
  const isRamadan = d => { try { return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { month: 'numeric' }).format(d) === '9'; } catch (e) { return false; } };
  const timesFor = (c, d) => PRAYCALC.times(d, c.lat, c.lng, { method: c.method || PRAYCALC.guessMethod(c.lat, c.lng), asr: c.asr, adj: c.adj, ramadan: isRamadan(d) });

  function next(c) {
    const now = new Date();
    for (let k = 0; k < 2; k++) {
      const d = new Date(); d.setDate(d.getDate() + k);
      const t = timesFor(c, d);
      for (const p of FIVE) if (t[p] > now) return { p, at: t[p] };
    }
    return null;
  }
  const left = ms => { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return h ? `${AR.toArabicDigits(h)} س ${AR.toArabicDigits(m % 60)} د` : `${AR.toArabicDigits(m)} دقيقة`; };

  // تحديد الموقع (GPS) — يطلب الإذن من المستخدم
  function locate() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('الجهاز لا يدعم تحديد الموقع'));
      navigator.geolocation.getCurrentPosition(p => res(p.coords), e => rej(new Error(e.code === 1 ? 'رُفض إذن الموقع — اسمح للتطبيق بالوصول إلى الموقع من إعدادات الجهاز، أو اختر مدينتك من القائمة' : 'تعذر تحديد الموقع، تأكد من تشغيل GPS ثم أعد المحاولة')), { enableHighAccuracy: false, timeout: 20000, maximumAge: 3600e3 });
    });
  }
  const nearestCity = (lat, lng) => PRAYCALC.CITIES.map(c => [Math.hypot(c[1] - lat, (c[2] - lng) * Math.cos(lat * Math.PI / 180)), c]).sort((a, b) => a[0] - b[0])[0];

  V.prayer = async el => {
    const c = await cfg();
    if (c.lat == null) {
      el.innerHTML = `<h1>🕌 مواقيت الصلاة والأذان</h1>
        <div class="card"><h2 style="margin-top:0">حدّد موقعك</h2>
        <div class="sub">تُحسب المواقيت على جهازك حسب موقعك، وتعمل بدون إنترنت بعد ذلك.</div>
        <button class="btn primary" id="gps">📍 تحديد موقعي تلقائياً</button>
        <div style="margin:14px 0 6px">أو اختر مدينتك:</div>
        <select id="city" style="width:100%;max-width:360px"><option value="">— اختر —</option>${PRAYCALC.CITIES.map((x, i) => `<option value="${i}">${esc(x[0])}</option>`).join('')}</select>
        <div id="gpsMsg" class="muted" style="margin-top:8px"></div></div>`;
      const set = async (lat, lng, place) => { c.lat = lat; c.lng = lng; c.place = place; c.method = PRAYCALC.guessMethod(lat, lng); await save(c); APP.rerender(); };
      el.querySelector('#gps').onclick = async () => {
        el.querySelector('#gpsMsg').textContent = '… جارٍ تحديد الموقع';
        try { const p = await locate(); const nc = nearestCity(p.latitude, p.longitude); await set(+p.latitude.toFixed(4), +p.longitude.toFixed(4), nc && nc[0] < 0.6 ? nc[1][0] : 'موقعي الحالي'); }
        catch (e) { el.querySelector('#gpsMsg').textContent = e.message; }
      };
      el.querySelector('#city').onchange = e => { const x = PRAYCALC.CITIES[+e.target.value]; if (x) set(x[1], x[2], x[0]); };
      return;
    }
    const t = timesFor(c, new Date()), nx = next(c), q = PRAYCALC.qibla(c.lat, c.lng), st = await NOTIFY.status();
    const method = c.method || PRAYCALC.guessMethod(c.lat, c.lng);
    let hijri = ''; try { hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); } catch (e) { }
    el.innerHTML = `<div class="row"><h1>🕌 مواقيت الصلاة</h1><span class="spacer"></span><button class="btn sm" id="chg">📍 ${esc(c.place || 'تغيير الموقع')}</button></div>
      <div class="sub">${esc(hijri)} — ${esc(PRAYCALC.METHODS[method].n)}</div>
      ${nx ? `<div class="hero next-pr"><div class="date">الصلاة القادمة</div><h1>${NAMES[nx.p]} — ${fmt(nx.at)}</h1><div class="ayah-day" style="font-family:var(--ui);font-size:17px" id="cd">بعد ${left(nx.at - Date.now())}</div></div>` : ''}
      <div class="pr-list">${['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => `<div class="pr-row ${nx && nx.p === p ? 'now' : ''}">
        <span class="pr-n">${NAMES[p]}</span><span class="pr-t">${fmt(t[p])}</span>
        ${p === 'sunrise' ? `<button class="pr-bell ${c.sunriseAlert && c.enabled ? 'on' : ''}" data-bell="sunrise" title="تنبيه بالشروق">${c.sunriseAlert && c.enabled ? '🔔' : '🔕'}</button>` : `<button class="pr-bell ${c.adhan[p] && c.enabled ? 'on' : ''}" data-bell="${p}" title="الأذان">${c.adhan[p] && c.enabled ? '🔊' : '🔕'}</button>`}</div>`).join('')}</div>

      <div class="card"><div class="row"><h2 style="margin:0">🔔 الأذان والتنبيه</h2><span class="spacer"></span>
        <label class="switch"><input type="checkbox" id="en" ${c.enabled ? 'checked' : ''}><span></span></label></div>
        ${st.kind === 'web' ? `<div class="warn" style="margin-top:8px">في نسخة المتصفح يُرفع الأذان ما دام التطبيق مفتوحاً فقط. ليُرفع الأذان والجوال مغلق استعمل <b>تطبيق أندرويد</b>.</div>` : ''}
        ${c.enabled && st.perm !== 'granted' ? '<div class="warn" style="margin-top:8px">⚠️ صلاحية التنبيهات غير ممنوحة، فلن يُرفع الأذان. <button class="btn sm primary" id="perm">منح الصلاحية</button></div>' : ''}
        ${c.enabled && st.exact && st.exact !== 'granted' ? '<div class="warn" style="margin-top:8px">⚠️ صلاحية «المنبهات الدقيقة» غير مفعلة، فقد يتأخر الأذان دقائق. <button class="btn sm primary" id="perm2">تفعيلها</button></div>' : ''}
        <div class="muted" style="font-size:13px;margin:6px 0">اضغط 🔊/🔕 بجوار كل صلاة لتشغيل أذانها أو إسكاته.${st.kind === 'native' ? ' الأذان الكامل يُرفع على <b>صوت المنبّه</b>، فيُسمع ولو كان الجوال صامتاً، ويُوقف من زر «إيقاف» في الإشعار.' : ''}</div>
        <div class="filters">
          <label>صوت الأذان <select id="snd"><option value="adhan" ${c.sound === 'adhan' ? 'selected' : ''}>أذان كامل</option><option value="beep" ${c.sound === 'beep' ? 'selected' : ''}>تنبيه قصير فقط</option></select></label>
          <label>تذكير قبل الأذان <select id="pre">${[0, 5, 10, 15, 20, 30].map(m => `<option value="${m}" ${+c.pre === m ? 'selected' : ''}>${m ? m + ' دقيقة' : 'بدون'}</option>`).join('')}</select></label>
          <button class="btn sm" id="test">▶ جرّب الأذان</button><button class="btn sm" id="stopA">⏹</button></div>
        <div class="filters">${[[false, 'reg', 'صوت المؤذن'], [true, 'fajr', 'صوت أذان الفجر']].map(([fj, k, lab]) => `<label>${lab} <select data-voice="${k}">${Object.entries(NOTIFY.VOICES).filter(([id, v]) => fj ? (v.fajr || id === 'custom') : !v.fajr).map(([id, v]) => `<option value="${id}" ${NOTIFY.getVoice()[k] === id ? 'selected' : ''}>${v.n}</option>`).join('')}</select></label><button class="btn sm" data-try="${k}" title="استمع">▶</button>`).join('')}
          <input type="file" id="adFile" accept="audio/*" hidden></div>
        <div class="muted" style="font-size:12.5px">«ملف من جهازك»: اختر أي تسجيل أذان تحبه (mp3 وغيره) ليُرفع به الأذان.</div></div>

      <div class="card"><h2 style="margin-top:0">🧭 اتجاه القبلة</h2>
        <div class="row" style="gap:18px;align-items:center"><div class="compass" id="comp"><div class="needle" style="transform:rotate(${q.deg}deg)"><span>🕋</span></div><b class="cN">ش</b></div>
        <div><div style="font-size:22px;font-weight:700;color:var(--brand)">${AR.toArabicDigits(Math.round(q.deg))}° من الشمال</div><div class="muted">باتجاه عقارب الساعة — المسافة إلى الكعبة ${q.km.toLocaleString('ar')} كم</div>
        <button class="btn sm" id="live" style="margin-top:8px">🧭 بوصلة حيّة (الجوال)</button><div id="liveMsg" class="muted" style="font-size:12.5px"></div></div></div></div>

      <details class="card"><summary>⚙️ إعدادات الحساب</summary>
        <div class="filters" style="margin-top:10px">
          <label>طريقة الحساب <select id="meth">${Object.entries(PRAYCALC.METHODS).map(([k, m]) => `<option value="${k}" ${k === method ? 'selected' : ''}>${esc(m.n)}</option>`).join('')}</select></label>
          <label>العصر <select id="asr"><option value="std" ${c.asr !== 'hanafi' ? 'selected' : ''}>الجمهور (ظل المثل)</option><option value="hanafi" ${c.asr === 'hanafi' ? 'selected' : ''}>الحنفية (ظل المثلين)</option></select></label></div>
        <div class="muted" style="font-size:13px">تعديل يدوي بالدقائق ليطابق تقويم مدينتك الرسمي:</div>
        <div class="filters">${FIVE.concat('sunrise').map(p => `<label>${NAMES[p]} <input type="number" data-adj="${p}" value="${c.adj[p] || 0}" style="width:64px"></label>`).join('')}</div>
        <div class="muted" style="font-size:12.5px">الإحداثيات: ${c.lat}, ${c.lng}</div>
        <button class="btn primary" id="saveS">حفظ</button></details>

      <details class="card"><summary>📅 جدول الشهر</summary><div id="month"></div></details>`;
    const $ = s => el.querySelector(s);
    const persist = async () => { await save(c); await NOTIFY.rescheduleAll(); };
    $('#chg').onclick = async () => { c.lat = null; await save(c); APP.rerender(); };
    el.querySelectorAll('[data-bell]').forEach(b => b.onclick = async () => {
      const p = b.dataset.bell;
      if (!c.enabled) { c.enabled = true; FIVE.forEach(x => { c.adhan[x] = false; }); }
      if (p === 'sunrise') c.sunriseAlert = !c.sunriseAlert; else c.adhan[p] = !c.adhan[p];
      if ((await NOTIFY.status()).perm !== 'granted') await NOTIFY.request();
      await persist(); APP.rerender();
    });
    $('#en').onchange = async e => { c.enabled = e.target.checked; if (c.enabled && (await NOTIFY.status()).perm !== 'granted') await NOTIFY.request(); await persist(); APP.toast(c.enabled ? '✔ فُعّل الأذان' : 'أُوقف الأذان'); APP.rerender(); };
    if ($('#perm')) $('#perm').onclick = async () => { await NOTIFY.request(); await persist(); APP.rerender(); };
    if ($('#perm2')) $('#perm2').onclick = async () => { await NOTIFY.request(); APP.rerender(); };
    $('#snd').onchange = async e => { c.sound = e.target.value; await persist(); };
    $('#pre').onchange = async e => { c.pre = +e.target.value; await persist(); };
    $('#test').onclick = () => NOTIFY.playAdhan(false);
    $('#stopA').onclick = () => NOTIFY.stopAdhan();
    let pickFor = null;
    const fileIn = $('#adFile');
    fileIn.onchange = async () => { const f = fileIn.files[0]; if (!f || !pickFor) return; try { await NOTIFY.setCustom(pickFor === 'fajr', f); APP.toast('تم حفظ صوت الأذان من جهازك'); NOTIFY.playAdhan(pickFor === 'fajr'); } catch (e) { APP.toast('تعذر حفظ الملف'); } fileIn.value = ''; };
    el.querySelectorAll('[data-voice]').forEach(sel => sel.onchange = async () => {
      const fj = sel.dataset.voice === 'fajr';
      if (sel.value === 'custom') { pickFor = sel.dataset.voice; fileIn.click(); return; }
      await NOTIFY.setVoice(fj, sel.value); NOTIFY.playAdhan(fj);
    });
    el.querySelectorAll('[data-try]').forEach(b => b.onclick = () => NOTIFY.playAdhan(b.dataset.try === 'fajr'));
    $('#saveS').onclick = async () => { c.method = $('#meth').value; c.asr = $('#asr').value; el.querySelectorAll('[data-adj]').forEach(i => { c.adj[i.dataset.adj] = +i.value || 0; }); await persist(); APP.toast('✔ حُفظ'); APP.rerender(); };
    // البوصلة الحية: اتجاه الجوال من مستشعر الاتجاه
    $('#live').onclick = async () => {
      try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (e) { }
      const comp = $('#comp'); let got = false;
      const h = e => { const head = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null ? 360 - e.alpha : null; if (head == null) return; got = true; comp.style.transform = `rotate(${-head}deg)`; $('#liveMsg').textContent = 'وجّه 🕋 إلى أعلى الجوال، ثم اتجه حيث يشير'; };
      window.addEventListener('deviceorientationabsolute', h); window.addEventListener('deviceorientation', h);
      setTimeout(() => { if (!got) $('#liveMsg').textContent = 'لا يوجد مستشعر اتجاه في هذا الجهاز — استعمل الدرجة المكتوبة مع أي بوصلة.'; }, 2500);
    };
    // جدول الشهر
    const mt = [], d0 = new Date(); d0.setDate(1);
    for (let d = new Date(d0); d.getMonth() === d0.getMonth(); d.setDate(d.getDate() + 1)) { const x = timesFor(c, d); mt.push(`<tr ${d.toDateString() === new Date().toDateString() ? 'style="background:var(--brand-l)"' : ''}><td>${AR.toArabicDigits(d.getDate())}</td>${['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => `<td>${fmt(x[p])}</td>`).join('')}</tr>`); }
    $('#month').innerHTML = `<table class="t"><tr><th>اليوم</th>${['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(p => `<th>${NAMES[p]}</th>`).join('')}</tr>${mt.join('')}</table>`;
    // عدّاد تنازلي
    clearInterval(V._prT); V._prT = setInterval(() => { const n = document.getElementById('cd'); if (!n || !nx) { clearInterval(V._prT); return; } n.textContent = 'بعد ' + left(nx.at - Date.now()); if (nx.at < Date.now()) APP.rerender(); }, 30000);
  };

  // ===== جدولة الأذان لسبعة أيام =====
  NOTIFY.register('prayer', async () => {
    const c = await cfg(); if (!c.enabled || c.lat == null) return [];
    const out = [];
    for (let k = 0; k < 7; k++) {
      const d = new Date(); d.setDate(d.getDate() + k);
      const t = timesFor(c, d);
      for (const p of FIVE) {
        if (!c.adhan[p]) continue;
        const ch = c.sound === 'beep' ? 'reminders' : p === 'fajr' ? 'adhan_fajr' : 'adhan';
        out.push({ title: `🕌 حان الآن وقت صلاة ${NAMES[p]}`, body: `${c.place || ''} — ${fmt(t[p])}`, at: t[p], channel: ch, route: '#/prayer' });
        if (+c.pre) out.push({ title: `⏰ بقي ${c.pre} دقيقة على أذان ${NAMES[p]}`, body: 'تهيّأ للصلاة', at: new Date(t[p] - c.pre * 60000), channel: 'reminders', route: '#/prayer' });
      }
      if (c.sunriseAlert) out.push({ title: '🌤 الشروق', body: 'انتهى وقت صلاة الفجر', at: t.sunrise, channel: 'reminders', route: '#/prayer' });
    }
    return out;
  });

  // بطاقة الصلاة القادمة للرئيسية
  APP.nextPrayerTile = async () => {
    const c = await cfg();
    if (c.lat == null) return `<a class="tile" href="#/prayer"><span class="ic c1">🕌</span><b>مواقيت الصلاة</b><small>حدّد موقعك لتظهر المواقيت والأذان</small></a>`;
    const nx = next(c);
    return nx ? `<a class="tile" href="#/prayer"><span class="ic c1">🕌</span><b>${NAMES[nx.p]} ${fmt(nx.at)}</b><small>بعد ${left(nx.at - Date.now())} — ${esc(c.place)}</small></a>` : '';
  };
})();
