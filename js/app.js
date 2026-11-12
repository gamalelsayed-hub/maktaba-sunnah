/* النواة: الحالة، التوجيه، أدوات مشتركة، بطاقات النصوص وأزرارها */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = AR.escapeHtml;

  const APP = {
    state: { profile: 'aam', reviewer: false, hideUnreviewed: false, books: {}, names: {}, gharib: [], route: '', review: {}, bookmarks: [], comments: [] },
    views: {},
    $, $$: (s, r = document) => [...r.querySelectorAll(s)], esc,
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),

    toast(msg, ms = 2500) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), ms); },
    modal(html, onMount) { $('#modalBox').innerHTML = html; $('#modal').classList.remove('hidden'); onMount && onMount($('#modalBox')); },
    closeModal() { $('#modal').classList.add('hidden'); },
    ask(title, fields, initial = {}) {
      return new Promise(resolve => {
        const f = fields.map(x => `<label class="muted">${esc(x.label)}</label>` + (x.type === 'textarea'
          ? `<textarea data-k="${x.key}">${esc(initial[x.key] || '')}</textarea>`
          : x.options ? `<select data-k="${x.key}" style="width:100%">${x.options.map(o => `<option ${o === initial[x.key] ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
          : `<input type="text" data-k="${x.key}" style="width:100%" value="${esc(initial[x.key] || '')}" ${x.list ? 'list="dl-' + x.key + '"' : ''}>` + (x.list ? `<datalist id="dl-${x.key}">${x.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : '')) + '<div style="height:8px"></div>').join('');
        APP.modal(`<h2 style="margin-top:0">${esc(title)}</h2>${f}<div class="row"><button class="btn primary" id="mOk">حفظ</button><button class="btn" id="mCancel">إلغاء</button></div>`, box => {
          const first = box.querySelector('[data-k]'); first && first.focus();
          $('#mOk').onclick = () => { const r = {}; $$('[data-k]', box).forEach(e => r[e.dataset.k] = e.value); APP.closeModal(); resolve(r); };
          $('#mCancel').onclick = () => { APP.closeModal(); resolve(null); };
        });
      });
    },

    // ---------- تنسيق ----------
    yearLabel(y) {
      if (y === undefined || y === null || isNaN(y)) return '';
      return y > 0 ? y + ' هـ' : (y === 0 ? 'عام الهجرة' : Math.abs(y) + ' قبل الهجرة');
    },
    bookTitle(id) { const b = APP.state.books[id]; return b ? b.title + (b.author && b.type !== 'hadith' && b.type !== 'quran' ? ' — ' + b.author : '') : id; },
    titleOf(it) {
      if (!it) return '';
      switch (it.type) {
        case 'ayah': return 'سورة ' + AR.SURAHS[it.surah - 1] + ' — آية ' + it.ayah;
        case 'hadith': return (APP.state.books[it.bookId] ? APP.state.books[it.bookId].title : it.bookId) + ' (' + it.num + (it.printedNum && it.printedNum !== it.num ? '، وفي المطبوع ' + it.printedNum : '') + ')';
        case 'tafsir': return (APP.state.books[it.bookId] ? APP.state.books[it.bookId].title + ' (' + APP.state.books[it.bookId].author + ')' : it.bookId) + ' — ' + AR.SURAHS[it.surah - 1] + ' ' + it.ayah + (it.ayahTo && it.ayahTo !== it.ayah ? '–' + it.ayahTo : '');
        case 'sharh': return (APP.state.books[it.bookId] ? APP.state.books[it.bookId].title : it.bookId) + ' — حديث ' + (it.num || (it.hadithRef || '').split(':')[1]);
        case 'section': return (APP.state.books[it.bookId] ? APP.state.books[it.bookId].title : it.bookId) + ' — ' + (it.title || '');
        case 'event': return it.title + ' (' + APP.yearLabel(it.year) + ')';
        default: return it.title || it.id;
      }
    },
    cite(it) {
      if (it.type === 'ayah') return '﴿' + it.text + '﴾ [' + AR.SURAHS[it.surah - 1] + ': ' + it.ayah + ']';
      if (it.type === 'hadith') {
        const g = (it.grades || []).map(g => g.grader + ': ' + g.grade).join('، ');
        return '«' + it.matn + '» ' + 'رواه ' + APP.titleOf(it) + (g ? ' [' + g + ']' : '');
      }
      return (it.title ? it.title + ': ' : '') + (it.text || it.summary || '') + ' — ' + APP.bookTitle(it.bookId) + (it.page ? ' (' + it.page + ')' : '');
    },
    gradeCls(g) { const n = AR.normalize(g); return /ضعيف|منكر|موضوع|باطل/.test(n) ? 'g-daif' : /حسن/.test(n) ? 'g-hasan' : /صحيح/.test(n) ? 'g-sahih' : 'g-none'; },
    gradeSummary(it) {
      const gs = it.grades || [];
      if (!gs.length) return '<span class="tag g-none">لا يوجد حكم مسجل</span>';
      const ok = gs.filter(g => APP.gradeCls(g.grade) !== 'g-daif' && APP.gradeCls(g.grade) !== 'g-none');
      const bad = gs.filter(g => APP.gradeCls(g.grade) === 'g-daif');
      const alb = gs.find(g => /الالباني/.test(AR.normalize(g.grader)));
      const head = alb || gs[0];
      if (!bad.length) return `<span class="tag ${APP.gradeCls(head.grade)}">${esc(head.grade)}</span>` + (gs.length > 1 ? ` <small class="muted">مقبول عند ${ok.length === gs.length ? 'جميع' : ok.length + ' من'} المحدثين المذكورين (${gs.length})</small>` : ' <small class="muted">— ' + esc(head.grader) + '</small>');
      if (!ok.length) return `<span class="tag g-daif">${esc(head.grade)}</span> <small class="muted">ضعيف عند ${bad.length === gs.length ? 'جميع' : bad.length + ' من'} المحدثين المذكورين (${gs.length})</small>`;
      return '<span class="tag g-none">مختلف في الحكم عليه</span> ' + gs.map(g => `<span class="tag ${APP.gradeCls(g.grade)}">${esc(g.grader)}: ${esc(g.grade)}</span>`).join('');
    },
    // تمييز كلمات الغريب
    withGharib(html) {
      for (const g of APP.state.gharib) {
        const w = esc(g.title);
        html = html.replace(new RegExp('(^|[\\s،.])(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=[\\s،.]|$)', 'g'), `$1<span class="gharib" title="${esc(g.text)}">$2</span>`);
      }
      return html;
    },
    link(id, label) { return `<a href="#/item/${encodeURIComponent(id)}">${esc(label || id)}</a>`; },
    async linkFor(id) { const it = await DB.get('items', id); return it ? APP.link(id, APP.titleOf(it)) : `<span class="muted">${esc(id)} (غير مستورد بعد)</span>`; },

    // ---------- بيانات المستخدم ----------
    async refreshUser() {
      APP.state.bookmarks = await DB.all('bookmarks');
      APP.state.comments = await DB.all('comments');
      APP.state.review = Object.fromEntries((await DB.all('review')).map(r => [r.id, r]));
      const now = Date.now();
      const due = (await DB.all('srs')).filter(s => new Date(s.due).getTime() <= now).length;
      $('#dueBadge').textContent = due || '';
    },
    reviewStatus(id) { return (APP.state.review[id] || {}).status || 'pending'; },
    // المرفوض لا يظهر للمستخدم العادي، و«إخفاء غير المعتمد» يُظهر المعتمد فقط
    visible(id) {
      if (APP.state.reviewer) return true;
      const s = APP.reviewStatus(id);
      if (s === 'reject') return false;
      return !APP.state.hideUnreviewed || s === 'ok';
    },
    // علامة المستخدم العادي: «✔ رُوجع» على المعتمد فقط
    userBadge(id, full) {
      if (APP.state.reviewer) return '';
      return APP.reviewStatus(id) === 'ok' ? '<span class="tag st-ok" title="راجعه المراجع العلمي واعتمده">✔ رُوجع</span>' : (full ? '<span class="muted" style="font-size:12px">لم يُراجع بعد</span>' : '');
    },
    statusTag(id) {
      const s = APP.reviewStatus(id);
      const L = { ok: '✔ معتمد', fix: '✎ يحتاج تصحيح', reject: '✗ مرفوض', pending: 'غير مراجع' };
      return `<span class="tag st-${s}">${L[s]}</span>`;
    },

    // شريط الأزرار لكل نص
    actionsBar(it) {
      const bm = APP.state.bookmarks.find(b => b.itemId === it.id);
      const canHifz = it.type === 'ayah' || it.type === 'hadith';
      let h = `<div class="actions" data-item="${esc(it.id)}">
        <button class="btn sm ${bm ? 'on' : ''}" data-act="bookmark">${bm ? '★ محفوظ' : '☆ حفظ'}</button>
        <button class="btn sm" data-act="highlight">🖍 تعليم</button>
        <button class="btn sm" data-act="comment">✍️ هامش</button>
        ${canHifz ? '<button class="btn sm" data-act="hifz">🧠 أضف لحفظي</button>' : ''}
        <button class="btn sm" data-act="mindmap">🗺 خريطة ذهنية</button>
        <button class="btn sm" data-act="copy">📋 نسخ مع التوثيق</button>`;
      if (APP.state.reviewer) h += `<span class="spacer"></span>${APP.statusTag(it.id)}
        <button class="btn sm" data-act="rv-ok">✔ اعتماد</button><button class="btn sm" data-act="rv-fix">✎ تصحيح</button><button class="btn sm" data-act="rv-reject">✗ رفض</button><button class="btn sm" data-act="edit">تعديل النص</button>`;
      return h + '</div>' + APP.commentsHtml(it.id);
    },
    commentsHtml(id) {
      const cs = APP.state.comments.filter(c => c.itemId === id);
      const rv = APP.state.review[id];
      let h = cs.map(c => `<div class="comment">${c.quote ? '<q>' + esc(c.quote) + '</q><br>' : ''}${esc(c.text)} <button class="btn sm" data-delcomment="${c.id}">حذف</button></div>`).join('');
      if (APP.state.reviewer && rv && rv.note) h += `<div class="comment" style="border-color:var(--red)"><b>ملاحظة المراجعة:</b> ${esc(rv.note)}</div>`;
      return h;
    },
    hlClass(id) { const b = APP.state.bookmarks.find(b => b.itemId === id && b.color); return b ? 'hl-' + b.color : ''; },

    async onAction(act, id, btn) {
      const it = await DB.get('items', id);
      const folders = [...new Set(APP.state.bookmarks.map(b => b.folder).filter(Boolean))];
      switch (act) {
        case 'bookmark': {
          const ex = APP.state.bookmarks.find(b => b.itemId === id);
          if (ex) { await DB.del('bookmarks', ex.id); APP.toast('أزيل من المحفوظات'); break; }
          const r = await APP.ask('حفظ في محفوظاتي', [{ key: 'folder', label: 'المجلد (موضوع البحث)', list: folders.length ? folders : ['عام'] }, { key: 'label', label: 'عنوان أو تذكير (اختياري)' }], { folder: folders[0] || 'عام' });
          if (!r) return;
          await DB.put('bookmarks', { id: APP.uid(), itemId: id, folder: r.folder || 'عام', label: r.label, createdAt: new Date().toISOString() });
          APP.toast('تم الحفظ في "' + (r.folder || 'عام') + '"'); break;
        }
        case 'highlight': {
          const r = await APP.ask('تعليم النص بلون', [{ key: 'color', label: 'اللون', options: ['yellow', 'green', 'blue', 'red', 'بدون'] }]);
          if (!r) return;
          let ex = APP.state.bookmarks.find(b => b.itemId === id);
          if (r.color === 'بدون') { if (ex) { ex.color = ''; await DB.put('bookmarks', ex); } }
          else { ex = ex || { id: APP.uid(), itemId: id, folder: 'تعليمات', createdAt: new Date().toISOString() }; ex.color = r.color; await DB.put('bookmarks', ex); }
          break;
        }
        case 'comment': await APP.addComment(id, ''); return;
        case 'hifz': {
          if (await DB.get('srs', id)) { APP.toast('موجود في حفظك بالفعل'); return; }
          await DB.put('srs', { id, ef: 2.5, interval: 0, reps: 0, due: new Date().toISOString(), added: new Date().toISOString() });
          APP.toast('أضيف إلى مراجعة الحفظ'); break;
        }
        case 'mindmap': location.hash = '#/mindmap/' + encodeURIComponent(id); return;
        case 'copy': APP.copy(APP.cite(it)); return;
        case 'rv-ok': case 'rv-fix': case 'rv-reject': {
          const status = act.slice(3);
          let note = (APP.state.review[id] || {}).note || '';
          if (status !== 'ok') { const r = await APP.ask(status === 'fix' ? 'ما المطلوب تصحيحه؟' : 'سبب الرفض', [{ key: 'note', label: 'الملاحظة', type: 'textarea' }], { note }); if (!r) return; note = r.note; }
          await DB.put('review', { id, bookId: it.bookId, status, note, updatedAt: new Date().toISOString() });
          APP.toast('تم تسجيل المراجعة'); break;
        }
        case 'edit': await APP.editItem(it); return;
      }
      await APP.refreshUser(); APP.rerender();
    },

    async addComment(itemId, quote) {
      const r = await APP.ask('إضافة هامش / تعليق', [{ key: 'text', label: quote ? 'على: «' + quote.slice(0, 80) + '»' : 'التعليق', type: 'textarea' }]);
      if (!r || !r.text.trim()) return;
      await DB.put('comments', { id: APP.uid(), itemId, quote, text: r.text.trim(), createdAt: new Date().toISOString() });
      await APP.refreshUser(); APP.rerender(); APP.toast('أضيف الهامش');
    },

    // تعديل النص من المراجع (يحفظ الأصل أول مرة)
    async editItem(it) {
      const editable = Object.assign({}, it); delete editable.n; delete editable._orig; delete editable.ref; delete editable.gradeClass; delete editable.schools;
      APP.modal(`<h2 style="margin-top:0">تعديل: ${esc(APP.titleOf(it))}</h2>
        <div class="info">عدّل الحقول مباشرة (صيغة JSON). يُحفظ النص الأصلي تلقائياً ويمكن استرجاعه.</div>
        <textarea id="edJson" style="min-height:340px;direction:rtl;font-family:monospace">${esc(JSON.stringify(editable, null, 2))}</textarea>
        <div class="row" style="margin-top:8px"><button class="btn primary" id="edSave">حفظ التعديل</button>${it._orig ? '<button class="btn" id="edRestore">استرجاع الأصل</button>' : ''}<button class="btn" id="edCancel">إلغاء</button></div>`, () => {
        $('#edCancel').onclick = APP.closeModal;
        $('#edSave').onclick = async () => {
          let v; try { v = JSON.parse($('#edJson').value); } catch (e) { return APP.toast('خطأ في الصيغة: ' + e.message); }
          v.id = it.id; v.bookId = it.bookId; v._orig = it._orig || JSON.stringify(editable);
          await DB.put('items', IMPORT.prepareItem(v)); DB.invalidate();
          await DB.put('review', { id: it.id, bookId: it.bookId, status: 'ok', note: 'عُدّل وصُحّح بواسطة المراجع', edited: true, updatedAt: new Date().toISOString() });
          APP.closeModal(); await APP.refreshUser(); APP.rerender(); APP.toast('حُفظ التعديل واعتُمد');
        };
        if ($('#edRestore')) $('#edRestore').onclick = async () => {
          const o = JSON.parse(it._orig); await DB.put('items', IMPORT.prepareItem(o)); DB.invalidate(); APP.closeModal(); APP.rerender(); APP.toast('استُرجع الأصل');
        };
      });
    },

    copy(text) {
      const done = () => APP.toast('نُسخ مع التوثيق');
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
      function fallback() { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
    },
    download(name, content, type = 'application/json') {
      const blob = content instanceof Blob ? content : new Blob([content], { type: type + ';charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },

    // جلب العناصر المرتبطة: ما يشير إليه العنصر + ما يشير إلى العنصر
    async linked(it) {
      const ids = new Set(it.ref || []);
      const back = await DB.byIndex('items', 'ref', it.id);
      const out = [...back];
      for (const id of ids) { if (!out.some(x => x.id === id)) { const x = await DB.get('items', id); if (x) out.push(x); } }
      if (it.type === 'rawi') out.push(...(await DB.byIndex('items', 'narrators', it.id)));
      return out.filter(x => x.id !== it.id && APP.visible(x.id));
    },

    // ---------- التوجيه ----------
    async route() {
      const hash = location.hash.slice(1) || '/';
      const [path, qs] = hash.split('?');
      const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
      const params = Object.fromEntries(new URLSearchParams(qs || ''));
      APP.state.route = hash;
      const name = parts[0] || 'home';
      $$('.sidebar a').forEach(a => a.classList.toggle('active', a.dataset.nav === name || (name === 'item' && false)));
      $('#sidebar').classList.remove('open');
      const view = APP.views[name] || APP.views.notfound;
      const el = $('#view');
      el.innerHTML = '<div class="muted">جارٍ التحميل…</div>';
      try { await view(el, parts.slice(1), params); }
      catch (e) { console.error(e); el.innerHTML = `<div class="warn">حدث خطأ: ${esc(e.message)}</div>`; }
      APP.renderNotes();
      if (!APP._keepScroll) window.scrollTo(0, 0);
      APP._keepScroll = false;
    },
    rerender() { APP._keepScroll = true; const y = window.scrollY; APP.route().then(() => window.scrollTo(0, y)); },

    // ---------- ملاحظات الشاشة ----------
    async renderNotes() {
      if ($('#notesPanel').classList.contains('hidden')) return;
      const scope = APP.state.route;
      const notes = (await DB.all('notes')).filter(n => n.scope === scope).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      $('#notesList').innerHTML = notes.length ? notes.map(n => `<div class="note">${esc(n.text)}<small>${new Date(n.updatedAt).toLocaleString('ar')} <a href="#" data-delnote="${n.id}">حذف</a></small></div>`).join('') : '<div class="muted" style="margin-bottom:8px">لا توجد ملاحظات على هذه الشاشة بعد.</div>';
    },

    async loadMeta() {
      const books = await DB.all('books');
      APP.state.books = Object.fromEntries(books.map(b => [b.id, b]));
      const rijal = await DB.byIndex('items', 'bookId', 'rijal');
      APP.state.names = Object.fromEntries(rijal.map(r => [r.id, r.title]));
      APP.state.gharib = (await DB.byIndex('items', 'bookId', 'gharib')).sort((a, b) => b.title.length - a.title.length);
    },

    setProfile(p) {
      APP.state.profile = p; DB.setting('profile', p);
      $('#profileBtn').textContent = p === 'talib' ? '🎓 طالب علم / باحث' : '🙂 مسلم (عرض مبسط)';
    },
    setReviewer(on) {
      APP.state.reviewer = on; DB.setting('reviewer', on);
      $('#reviewerBtn').textContent = 'وضع المراجع: ' + (on ? 'تشغيل' : 'إيقاف');
      $('#reviewerBtn').classList.toggle('on', on);
      $('#reviewerBtn').classList.toggle('hidden', !APP.state.reviewerUnlocked);
      APP.$$('[data-nav=review]').forEach(a => a.classList.toggle('hidden', !APP.state.reviewerUnlocked));
    },
    applyLook(s) {
      document.documentElement.style.setProperty('--fs', (s.fontSize || 17) + 'px');
      document.body.classList.toggle('dark', !!s.dark);
    },

    chooseProfile(first) {
      return new Promise(res => APP.modal(`
        <h2 style="margin-top:0">${first ? 'أهلاً بك في مكتبة القرآن والسنة' : 'تغيير نوع العرض'}</h2>
        <p>اختر طريقة العرض المناسبة لك (يمكنك تغييرها في أي وقت من الأعلى):</p>
        <div class="choice">
          <button data-p="aam"><b>🙂 مسلم يريد أن يعرف</b>خلاصة واضحة: الحكم، رأي الجمهور، الدليل باختصار، مع إمكانية فتح التفاصيل.</button>
          <button data-p="talib"><b>🎓 طالب علم / باحث</b>كل التفاصيل مفتوحة: الأسانيد، أحكام المحدثين وعللها، الأقوال وأدلتها، سبب الخلاف، التوثيق.</button>
        </div>`, box => $$('[data-p]', box).forEach(b => b.onclick = () => { APP.setProfile(b.dataset.p); APP.closeModal(); res(); APP.rerender(); }))
      );
    },

    async init() {
      await DB.open();
      const sig = IMPORT.coreSig();
      if (sig && (await DB.setting('packsInstalled')) !== sig) await APP.installScreen();
      // المحتوى المُعدّ (المسائل والقواعد والأحداث) يُحدَّث كلما زاد
      const sv = window.SAMPLE_DATA.items.length + ':' + window.SAMPLE_DATA.books.length;
      if ((await DB.setting('sampleVersion')) !== sv) { await IMPORT.loadSample(); await DB.setting('sampleVersion', sv); }
      await APP.loadMeta();
      const s = { fontSize: await DB.setting('fontSize'), dark: await DB.setting('dark') };
      APP.applyLook(s);
      APP.state.hideUnreviewed = !!(await DB.setting('hideUnreviewed'));
      APP.state.reviewerUnlocked = !!(await DB.setting('reviewerUnlocked'));
      APP.setReviewer(APP.state.reviewerUnlocked && !!(await DB.setting('reviewer')));
      // مراجعات منشورة مع البرنامج (data/review.js) تُدمج عند التشغيل
      if (window.PACK_REVIEW && window.PACK_REVIEW.length) {
        const sigR = window.PACK_REVIEW.length + ':' + (window.PACK_REVIEW_DATE || '');
        if ((await DB.setting('reviewSig')) !== sigR) {
          const local = Object.fromEntries((await DB.all('review')).map(r => [r.id, r]));
          await DB.putMany('review', window.PACK_REVIEW.filter(r => !local[r.id] || (local[r.id].updatedAt || '') < (r.updatedAt || '')));
          await DB.setting('reviewSig', sigR);
        }
      }
      const p = await DB.setting('profile');
      if (p) APP.setProfile(p); else { APP.setProfile('aam'); }
      await APP.refreshUser();
      window.addEventListener('hashchange', APP.route);
      APP.fixTopbarH(); window.addEventListener('resize', APP.fixTopbarH);
      APP.bindGlobal();
      await APP.route();
      if (!p) APP.chooseProfile(true);
    },

    // قفل وضع المراجع بكلمة سر (تُحفظ مُجزّأة SHA-256 على هذا الجهاز)
    async hash(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('maktaba:' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); },
    async unlockReviewer() {
      const saved = await DB.setting('reviewerPass');
      const r = await APP.ask(saved ? 'دخول المراجع' : 'إنشاء كلمة سر المراجع', [{ key: 'p', label: saved ? 'كلمة السر' : 'اختر كلمة سر (احفظها عندك)' }]);
      if (!r || !r.p) return;
      if (!saved) await DB.setting('reviewerPass', await APP.hash(r.p));
      else if (saved !== await APP.hash(r.p)) return APP.toast('كلمة السر غير صحيحة');
      APP.state.reviewerUnlocked = true; await DB.setting('reviewerUnlocked', true);
      APP.setReviewer(true); APP.toast('تم فتح وضع المراجع'); APP.rerender();
    },
    async lockReviewer() {
      APP.state.reviewerUnlocked = false; await DB.setting('reviewerUnlocked', false);
      APP.setReviewer(false); APP.toast('أُغلق وضع المراجع'); APP.rerender();
    },

    fixTopbarH() { const t = document.querySelector('.topbar'); if (t) document.documentElement.style.setProperty('--tbH', t.offsetHeight + 'px'); },
    async installScreen() {
      const el = $('#view');
      const removed = (await DB.setting('removedBooks')) || [];
      const list = window.PACK_MANIFEST.filter(m => !removed.includes(m.id));
      const mb = Math.round(list.reduce((s, m) => s + m.size, 0) / 1e6);
      el.innerHTML = `<h1>تثبيت المكتبة</h1><div class="sub">يُثبَّت القرآن الكريم وكتب الحديث وشروحها والتفاسير وكتب الفقه والسيرة داخل البرنامج (${list.length} كتاباً، نحو ${mb} ميجا) — مرة واحدة فقط، ثم يعمل كل شيء بدون إنترنت.</div>
        <div class="card"><div class="progress"><div id="insBar" style="width:0%"></div></div><div id="insMsg" style="margin-top:8px"></div></div>
        <table class="t">${list.map(m => `<tr><td>${esc(m.title)}</td><td>${m.count.toLocaleString('ar')} نص</td><td id="ins-${m.id}" class="muted">بالانتظار</td></tr>`).join('')}</table>`;
      try {
        await IMPORT.installPacks((i, n, title, msg) => {
          if (!list[i - 1]) return;
          $('#insBar').style.width = Math.round((i - 1) / n * 100) + '%';
          $('#insMsg').textContent = '(' + i + ' من ' + n + ') ' + title + ' — ' + msg;
          const c = $('#ins-' + list[i - 1].id); if (c) c.textContent = msg;
          for (let k = 0; k < i - 1; k++) { const d = $('#ins-' + list[k].id); if (d) d.textContent = '✓ تم'; }
        });
      } catch (e) { el.innerHTML += `<div class="warn">تعذر إكمال التثبيت: ${esc(e.message)}. تأكد أن مجلد data موجود بجانب index.html.</div>`; throw e; }
    },

    bindGlobal() {
      $('#globalSearch').onsubmit = e => { e.preventDefault(); const q = $('#q').value.trim(); if (q) location.hash = '#/search?q=' + encodeURIComponent(q); };
      $('#profileBtn').onclick = () => APP.chooseProfile(false);
      $('#reviewerBtn').onclick = () => { APP.setReviewer(!APP.state.reviewer); APP.rerender(); };
      $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
      $('#modal').onclick = e => { if (e.target.id === 'modal') APP.closeModal(); };
      $('#notesFab').onclick = () => { $('#notesPanel').classList.toggle('hidden'); APP.renderNotes(); };
      $('#notesClose').onclick = () => $('#notesPanel').classList.add('hidden');
      $('#noteSave').onclick = async () => {
        const text = $('#noteText').value.trim(); if (!text) return;
        await DB.put('notes', { id: APP.uid(), scope: APP.state.route, title: document.querySelector('#view h1') ? document.querySelector('#view h1').textContent : APP.state.route, text, updatedAt: new Date().toISOString() });
        $('#noteText').value = ''; APP.renderNotes(); APP.toast('حُفظت الملاحظة');
      };
      $('#notesList').onclick = async e => { const id = e.target.dataset.delnote; if (id) { e.preventDefault(); await DB.del('notes', id); APP.renderNotes(); } };
      // أزرار البطاقات
      $('#view').addEventListener('click', async e => {
        const b = e.target.closest('[data-act]');
        if (b) { const bar = b.closest('[data-item]'); APP.onAction(b.dataset.act, bar.dataset.item, b); return; }
        const dc = e.target.closest('[data-delcomment]');
        if (dc) { await DB.del('comments', dc.dataset.delcomment); await APP.refreshUser(); APP.rerender(); return; }
        const g = e.target.closest('svg [data-link]');
        if (g) location.hash = '#/item/' + encodeURIComponent(g.dataset.link);
      });
      // هامش على نص محدد
      let selItem = null, selText = '';
      document.addEventListener('mouseup', e => {
        if (e.target.closest('#selTool')) return;
        setTimeout(() => {
          const sel = window.getSelection(); const txt = sel ? sel.toString().trim() : '';
          const card = sel && sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('[data-card]');
          const tool = $('#selTool');
          if (txt.length > 2 && card) {
            selItem = card.dataset.card; selText = txt;
            const r = sel.getRangeAt(0).getBoundingClientRect();
            tool.style.top = (window.scrollY + r.top - 40) + 'px'; tool.style.left = (window.scrollX + r.left) + 'px';
            tool.classList.remove('hidden');
          } else tool.classList.add('hidden');
        }, 10);
      });
      $('#selComment').onclick = () => { $('#selTool').classList.add('hidden'); if (selItem) APP.addComment(selItem, selText); };
    }
  };

  window.APP = APP;
  document.addEventListener('DOMContentLoaded', () => APP.init());
  // نسخة الويب: تفعيل العمل بدون إنترنت وإمكانية التثبيت كتطبيق
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.desktop) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
