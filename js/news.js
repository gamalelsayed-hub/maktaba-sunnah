/* 📬 رسائل من التطبيق + «أرسل ملاحظتك»
   - الرسائل يكتبها صاحب التطبيق في ملف news.json على الموقع، فتظهر لكل المستخدمين داخل التطبيق (مرة واحدة لكل رسالة، وتبقى في صفحة الرسائل).
   - لا حسابات ولا جمع بيانات: الملاحظة تُرسَل من جهاز المستخدم نفسه عبر واتساب أو البريد أو صفحة التطبيق في جوجل بلاي. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const SITE = 'https://gamalelsayed-hub.github.io/maktaba-sunnah/';
  const PLAY = 'https://play.google.com/store/apps/details?id=org.waqf.maktabasunnah';
  const native = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
  const NEWS = { data: ls('news-cache') || { messages: [], radios: [], feedback: {} } };
  window.NEWS = NEWS;

  async function load() {
    const url = (native || location.protocol === 'file:' ? SITE : '') + 'news.json?t=' + Math.floor(Date.now() / 600e3);
    try {
      const txt = window.desktop && window.desktop.fetchText ? await window.desktop.fetchText(url) : await (await fetch(url, { cache: 'no-store' })).text();
      const d = JSON.parse(txt);
      if (d && Array.isArray(d.messages)) { NEWS.data = d; ls('news-cache', d); }
    } catch (e) { }
    return NEWS.data;
  }
  const msgs = () => (NEWS.data.messages || []).filter(m => m && m.id && m.title && (!m.until || m.until >= new Date().toISOString().slice(0, 10))).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const seen = () => new Set(ls('news-seen') || []);
  const markSeen = ids => { const s = seen(); ids.forEach(i => s.add(i)); ls('news-seen', [...s]); badge(); };
  function badge() {
    const n = msgs().filter(m => !seen().has(m.id)).length, a = document.querySelector('[data-nav=inbox] span');
    if (a) a.innerHTML = 'رسائل وملاحظات' + (n ? ` <b class="nb-badge">${AR.toArabicDigits(n)}</b>` : '');
  }
  const body = t => esc(t).replace(/\n/g, '<br>');

  function openExt(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
  // نافذة كتابة الملاحظة
  function feedback(pre) {
    const fb = NEWS.data.feedback || {};
    APP.modal(`<h2 style="margin-top:0">✍️ أرسل ملاحظتك</h2>
      <div class="muted" style="font-size:13px;margin-bottom:8px">رأيك يساعدنا في تحسين التطبيق. اكتب ما أعجبك، أو مشكلة واجهتك، أو ما تتمنى إضافته.</div>
      <label class="fld">النوع <select id="fbT"><option>💡 اقتراح</option><option>🐞 مشكلة</option><option>🤍 شكر ودعاء</option><option>✏️ تصحيح خطأ علمي</option><option>أخرى</option></select></label>
      <textarea id="fbX" rows="6" style="width:100%" placeholder="اكتب ملاحظتك هنا…">${esc(pre || '')}</textarea>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">
        ${fb.whatsapp ? '<button class="btn primary" data-via="wa">💬 أرسل عبر واتساب</button>' : ''}
        ${fb.email ? `<button class="btn ${fb.whatsapp ? '' : 'primary'}" data-via="mail">✉️ أرسل بالبريد</button>` : ''}
        ${native ? `<button class="btn ${fb.whatsapp || fb.email ? '' : 'primary'}" data-via="play">⭐ اكتبها في جوجل بلاي</button>` : ''}
        <button class="btn" data-via="copy">📋 انسخ النص</button>
        <button class="btn" id="fbC">إغلاق</button></div>`, box => {
      const text = () => `${box.querySelector('#fbT').value}\n${box.querySelector('#fbX').value.trim()}\n\n— من تطبيق «زاد الأسرة المسلمة»${native ? ' (أندرويد)' : ' (الويب)'}`;
      box.querySelector('#fbC').onclick = () => APP.closeModal();
      box.querySelectorAll('[data-via]').forEach(b => b.onclick = () => {
        if (!box.querySelector('#fbX').value.trim() && b.dataset.via !== 'play') { APP.toast('اكتب ملاحظتك أولاً'); return; }
        const t = text(), v = b.dataset.via;
        if (v === 'wa') openExt('https://wa.me/' + String(fb.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(t));
        else if (v === 'mail') openExt('mailto:' + fb.email + '?subject=' + encodeURIComponent('ملاحظة على تطبيق زاد الأسرة المسلمة') + '&body=' + encodeURIComponent(t));
        else if (v === 'play') { APP.copy && APP.copy(t); openExt(PLAY); APP.toast('نسخنا ملاحظتك — الصقها في خانة التقييم في جوجل بلاي', 5000); }
        else { APP.copy && APP.copy(t); }
        if (v !== 'copy') { APP.closeModal(); APP.toast('جزاك الله خيراً 🤍'); }
      });
    });
  }

  function popup(list) {
    const m = list[0]; if (!m) return;
    APP.modal(`<div class="news-pop"><div class="news-ic">${esc(m.icon || '📬')}</div><h2 style="margin:6px 0">${esc(m.title)}</h2><div class="news-body">${body(m.body || '')}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px">
        ${m.ask ? '<button class="btn primary" id="nwF">✍️ أرسل ملاحظتك</button>' : ''}
        ${m.link ? `<button class="btn ${m.ask ? '' : 'primary'}" id="nwL">${esc(m.linkText || 'افتح')}</button>` : ''}
        <button class="btn" id="nwOk">${list.length > 1 ? 'التالية' : 'حسناً'}</button></div></div>`, box => {
      markSeen([m.id]);
      box.querySelector('#nwOk').onclick = () => { APP.closeModal(); if (list.length > 1) setTimeout(() => popup(list.slice(1)), 250); };
      const f = box.querySelector('#nwF'); if (f) f.onclick = () => feedback();
      const l = box.querySelector('#nwL'); if (l) l.onclick = () => { APP.closeModal(); if (/^#\//.test(m.link)) location.hash = m.link; else openExt(m.link); };
    });
  }

  V.inbox = async el => {
    el.innerHTML = '<div class="card">جارٍ التحميل…</div>';
    await load();
    const L = msgs();
    el.innerHTML = `<div class="row"><h1>📬 رسائل وملاحظات</h1><span class="spacer"></span><button class="btn primary" id="ibF">✍️ أرسل ملاحظتك</button></div>
      <div class="sub">رسائل من فريق التطبيق، وطريقتك لإرسال رأيك واقتراحاتك. لا نجمع أي بيانات عنك.</div>
      ${L.length ? L.map(m => `<div class="card news-card"><div class="row" style="gap:8px"><span class="news-ic sm">${esc(m.icon || '📬')}</span><b>${esc(m.title)}</b><span class="spacer"></span><small class="muted">${esc(m.date || '')}</small></div><div class="news-body">${body(m.body || '')}</div>${m.ask ? '<button class="btn sm" data-fb>✍️ أرسل ملاحظتك</button>' : ''}${m.link ? `<a class="btn sm" href="${esc(m.link)}" ${/^#\//.test(m.link) ? '' : 'target="_blank" rel="noopener"'}>${esc(m.linkText || 'افتح')}</a>` : ''}</div>`).join('') : '<div class="card muted">لا رسائل حالياً.</div>'}`;
    markSeen(L.map(m => m.id));
    el.querySelector('#ibF').onclick = () => feedback();
    el.querySelectorAll('[data-fb]').forEach(b => b.onclick = () => feedback());
  };

  // عند فتح التطبيق: تحميل الرسائل وعرض الجديد منها (بعد أن يستقر التطبيق)
  setTimeout(async () => {
    await load(); badge();
    const fresh = msgs().filter(m => !seen().has(m.id) && m.popup !== false);
    if (!fresh.length) return;
    const tryShow = () => { const md = document.getElementById('modal'); if ((md && !md.classList.contains('hidden')) || document.body.classList.contains('learn-mode')) { setTimeout(tryShow, 8000); return; } popup(fresh.slice(0, 3)); };
    tryShow();
  }, 6000);
  NEWS.load = load; NEWS.feedback = feedback; NEWS.badge = badge;
})();
