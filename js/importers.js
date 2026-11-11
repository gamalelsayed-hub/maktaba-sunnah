/* الاستيراد: JSON بصيغة البرنامج، نص تنزيل للقرآن، CSV للحديث والتفسير والشروح والأحكام والكتب العامة */
(function () {
  const N = s => AR.normalize(s);

  // درجة الحديث للتصفية: حكم الألباني إن وُجد، وإلا رأي أغلب المحدثين؛ مع علامة «مختلف»
  function cls(g) { g = N(g); return /ضعيف|منكر|موضوع|باطل|شاذ|معلول/.test(g) ? 'daif' : /صحيح/.test(g) ? 'sahih' : /حسن/.test(g) ? 'hasan' : ''; }
  function gradeClass(it) {
    if (['bukhari', 'muslim'].includes(it.bookId)) return 'sahih';
    const gs = (it.grades || []).map(g => ({ who: g.grader, c: cls(g.grade) })).filter(g => g.c);
    if (!gs.length) return '';
    const alb = gs.find(g => /الالباني/.test(N(g.who)));
    let main = alb ? alb.c : null;
    if (!main) { const n = {}; gs.forEach(g => n[g.c] = (n[g.c] || 0) + 1); main = Object.entries(n).sort((a, b) => b[1] - a[1])[0][0]; }
    const mixed = gs.some(g => g.c === 'daif') && gs.some(g => g.c !== 'daif');
    return main + (mixed ? ' mixed' : '');
  }

  // تجهيز العنصر: نص البحث المطبّع + الروابط
  function prepareItem(it) {
    const parts = [it.title, it.text, it.matn, it.isnad, it.summary, it.name, it.laqab, it.rank, it.kitab, it.bab, it.place, it.jumhur, it.sabab];
    if (it.opinions) for (const o of it.opinions) parts.push(o.school, o.qawl, ...(o.aqli || []), ...(o.naqli || []).map(x => x.text));
    if (it.events) parts.push(...(it.events || []));
    if (it.results) parts.push(...(it.results || []));
    if (it.virtues) parts.push(...it.virtues);
    if (it.furu) parts.push(...it.furu);
    it.n = N(parts.filter(Boolean).join(' '));
    if (it.type === 'ayah') it.n += ' ' + AR.uthmaniAlt(it.text);
    const ref = new Set(it.ref || []);
    if (it.hadithRef) ref.add(it.hadithRef);
    if (it.type === 'tafsir' && it.surah) ref.add('quran:' + it.surah + ':' + it.ayah);
    if (it.related && it.related.ayat) it.related.ayat.forEach(a => ref.add(a));
    if (it.takhrij) it.takhrij.forEach(a => ref.add(a));
    if (it.opinions) it.opinions.forEach(o => (o.naqli || []).forEach(x => x.ref && ref.add(x.ref)));
    if (it.tasil) it.tasil.forEach(x => x.ref && ref.add(x.ref));
    if (it.qaida) ref.add(it.qaida);
    if (it.relatedHadith) it.relatedHadith.forEach(a => ref.add(a));
    if (it.parties) it.parties.forEach(a => ref.add(a));
    if (it.rawi) ref.add(it.rawi);
    it.ref = [...ref];
    if (it.type === 'hadith') it.gradeClass = gradeClass(it);
    if (it.opinions) it.schools = it.opinions.map(o => o.school);
    if (!it.narrators) it.narrators = [];
    return it;
  }

  async function saveBook(book, items, onProgress) {
    items.forEach(prepareItem);
    const old = await DB.get('books', book.id);
    book = Object.assign({}, old || {}, book, { count: ((old && old.count) || 0) + items.length, importedAt: new Date().toISOString() });
    delete book.shelf;
    await DB.put('books', book);
    await DB.putMany('items', items, onProgress);
    // إعادة حساب العدد الحقيقي
    book.count = await DB.count('items', 'bookId', book.id);
    await DB.put('books', book);
    DB.invalidate();
    return book;
  }

  // العينة: إن كان الكتاب الحقيقي مثبتاً تُضاف بيانات العينة (الأحكام والروابط والموضوعات) فوق النص الحقيقي دون تغييره
  const KEEP_REAL = ['id', 'bookId', 'type', 'num', 'text', 'matn', 'isnad', 'kitab', 'surah', 'ayah', 'ayahTo', 'placeholder', 'hadithRef', 'ref', 'page', 'bab'];
  async function loadSample() {
    const D = window.SAMPLE_DATA;
    for (const b of D.books) {
      const existing = await DB.get('books', b.id);
      if (b.shelf) { if (!existing) await DB.put('books', Object.assign({ count: 0 }, b)); continue; }
      const items = D.items.filter(i => i.bookId === b.id).map(i => Object.assign({ sample: true }, JSON.parse(JSON.stringify(i))));
      if (existing && existing.count && !existing.sample) {
        for (const s of items) {
          const real = await DB.get('items', s.id);
          if (!real) continue; // لا نضيف نصاً تجريبياً لكتاب حقيقي
          const merged = Object.assign({}, real);
          for (const [k, v] of Object.entries(s)) if (!KEEP_REAL.includes(k) && k !== 'sample' && k !== 'grades') merged[k] = v;
          // الأحكام: نُبقي أحكام المصدر ونضيف من العينة ما ليس فيها (مع تمييزه كتجريبي)
          if (s.grades) {
            const have = (real.grades || []).map(g => N(g.grader));
            const extra = s.grades.filter(g => !have.some(h => h.includes(N(g.grader)) || N(g.grader).includes(h))).map(g => Object.assign({}, g, { sample: true }));
            merged.grades = (real.grades || []).filter(g => !g.sample).concat(extra);
          }
          merged.sampleOverlay = true;
          await DB.put('items', prepareItem(merged));
        }
      } else await saveBook(Object.assign({}, b), items);
    }
    DB.invalidate();
    await DB.setting('sampleLoaded', true);
  }

  // تثبيت المكتبة المدمجة (ملفات data/*.js)
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => { s.remove(); res(); }; s.onerror = () => { s.remove(); rej(new Error('تعذر تحميل ' + src)); }; document.body.appendChild(s); });
  }
  async function installOne(m, onStep, i = 1, n = 1) {
    const have = await DB.get('books', m.id);
    if (have && !have.sample && have.count >= m.count && (!m.version || have.packVersion === m.version)) { onStep && onStep(i, n, m.title, 'مثبت'); return false; }
    onStep && onStep(i, n, m.title, 'جارٍ التحميل…');
    await loadScript('data/' + m.file + '.js');
    const P = window.PACK; window.PACK = null;
    if (have) await DB.deleteBook(m.id); // نزيل العينة أو النسخة القديمة قبل الجديدة
    await saveBook(P.book, P.items, (d, t) => onStep && onStep(i, n, m.title, 'حفظ ' + d + ' / ' + t));
    return true;
  }
  // الأساسية تُثبَّت تلقائياً، والإضافية (الشروح والتفاسير والمطولات) عند طلب المستخدم
  async function installPacks(onStep, ids) {
    const chosen = (await DB.setting('optionalBooks')) || [];
    // كل الكتب المدمجة تُثبَّت افتراضياً (الأساسية والإضافية) — والمستخدم يقدر يحذف ما لا يريده من المكتبة
    const removed = (await DB.setting('removedBooks')) || [];
    const list = (window.PACK_MANIFEST || []).filter(m => ids ? ids.includes(m.id) : !removed.includes(m.id));
    let i = 0;
    for (const m of list) await installOne(m, onStep, ++i, list.length);
    if (!ids) await DB.setting('packsInstalled', coreSig());
    if (ids) await DB.setting('optionalBooks', [...new Set(chosen.concat(ids))]);
    await loadSample(); // إعادة تركيب الأحكام والروابط التجريبية فوق النصوص الحقيقية
  }
  const coreSig = () => (window.PACK_MANIFEST || []).map(m => m.id + ':' + (m.version || m.count)).join(',');

  // ---------- نصوص OpenITI (المكتبة الشاملة) ----------
  function parseOpenITI(raw) {
    raw = raw.split('#META#Header#End#').pop();
    const blocks = []; let page = '', cur = null;
    const flush = () => { if (cur && cur.text.trim()) { cur.text = cur.text.replace(/\s+/g, ' ').trim(); blocks.push(cur); } cur = null; };
    for (let line of raw.split('\n')) {
      const m = line.match(/PageV(\d+)P(\d+)/);
      if (m) { page = (+m[1] ? 'ج' + (+m[1]) + ' ' : '') + 'ص' + (+m[2]); line = line.replace(/#?\s*PageV\d+P\d+/g, ' '); }
      line = line.replace(/\bms\d+\b/g, '').replace(/<\/?span[^>]*>/g, '');
      if (line.startsWith('### ')) { flush(); const h = line.match(/^### (\|+)\s?(.*)/); cur = { kind: 'h', lvl: h ? h[1].length : 1, text: h ? h[2] : line.slice(4), page }; }
      else if (line.startsWith('~~')) { if (cur) cur.text += ' ' + line.slice(2); }
      else if (line.startsWith('# ')) {
        if (cur && cur.kind === 'h' && (!cur.text.trim() || (cur.text.split('[').length > cur.text.split(']').length))) { cur.text += ' ' + line.slice(2); continue; }
        flush(); cur = { kind: 'p', lvl: 0, text: line.slice(2), page };
      } else if (line.trim() && cur) cur.text += ' ' + line.trim();
    }
    flush();
    return blocks;
  }
  function openitiMeta(raw) {
    const g = k => { const m = raw.slice(0, 8000).match(new RegExp('#META# ' + k.replace('.', '\\.') + '\\s*::\\s*(.+)')); return m && m[1].trim() !== 'NODATA' ? m[1].trim() : ''; };
    return { title: g('020.BookTITLE'), author: g('010.AuthorNAME'), subject: g('021.BookSUBJ'), publisher: g('043.EdPUBLISHER') };
  }
  function openitiItems(bid, blocks, maxlen = 12000) {
    const items = []; let chapter = '', title = '', buf = [], page = '', seq = 0;
    const emit = () => {
      const text = buf.join('\n').trim(); if (text.length < 2) return;
      const parts = text.length > maxlen * 1.3 ? text.match(new RegExp('[\\s\\S]{1,' + maxlen + '}', 'g')) : [text];
      parts.forEach((t, k) => { seq++; items.push({ id: bid + ':' + seq, bookId: bid, type: 'section', seq, chapter: (chapter || 'مقدمة').slice(0, 120), title: ((title || chapter || 'مقدمة').slice(0, 140) + (parts.length > 1 ? ' (' + (k + 1) + ')' : '')), page, text: t }); });
    };
    for (const b of blocks) {
      if (b.kind === 'h') { emit(); buf = []; page = b.page; if (b.lvl === 1) chapter = title = b.text; else title = b.text; }
      else { if (!buf.length) page = page || b.page; buf.push(b.text); }
    }
    emit();
    return items;
  }
  function guessType(cat, title) {
    const s = (cat || '') + ' ' + (title || '');
    if (/فقه|أصول|اصول|فتاوى|فتاوي|قواعد/.test(s)) return 'fiqhbook';
    if (/سيرة|سير|تاريخ|تراجم|طبقات|مغازي|صحابة/.test(s)) return 'sirabook';
    if (/تفسير|علوم القرآن|قراءات/.test(s)) return 'tafsirbook';
    if (/حديث|سنن|مسند|شروح|أجزاء/.test(s)) return 'hadithbook';
    return 'other';
  }
  const slug = v => 'oi-' + v.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase().slice(0, 80);
  async function importOpenITI(raw, info, onProgress) {
    const md = openitiMeta(raw);
    const id = info.id || slug(info.v || (md.title + Date.now()));
    const book = { id, title: info.t || md.title || 'كتاب', author: info.a || md.author || '', type: info.type || guessType(info.g || md.subject, info.t || md.title),
      source: 'المكتبة الشاملة عبر مشروع OpenITI' + (info.v ? ' (' + info.v + ')' : ''), edition: md.publisher, openiti: info.v || '' };
    const items = openitiItems(id, parseOpenITI(raw));
    await saveBook(book, items, onProgress);
    return { book, count: items.length };
  }
  const OPENITI_RAW = 'https://raw.githubusercontent.com/OpenITI/';
  async function downloadOpenITI(entry, onProgress) {
    onProgress && onProgress('جارٍ التحميل من GitHub…');
    let raw;
    if (window.desktop && window.desktop.fetchText) {
      // نسخة سطح المكتب: التحميل من العملية الرئيسية
      try { raw = await window.desktop.fetchText(OPENITI_RAW + entry.u); } catch (e) { throw new Error('تعذر التحميل: ' + (e.message || 'تحقق من الاتصال بالإنترنت')); }
    } else {
      let res;
      try { res = await fetch(OPENITI_RAW + entry.u); } catch (e) { throw new Error('تعذر الاتصال بالإنترنت أو بالمصدر'); }
      if (!res.ok) throw new Error('المصدر رد بخطأ ' + res.status);
      raw = await res.text();
    }
    onProgress && onProgress('جارٍ التجهيز والحفظ…');
    return importOpenITI(raw, entry, (d, t) => onProgress && onProgress('حفظ ' + d + ' / ' + t));
  }

  // ---------- CSV ----------
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const delim = (text.split('\n')[0].match(/\t/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? '\t' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    const head = rows.shift().map(h => h.trim());
    return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
  }

  // أعمدة CSV المدعومة لكل نوع
  const CSV_TEMPLATES = {
    hadith: ['num', 'kitab', 'bab', 'isnad', 'matn', 'grader', 'grade', 'reason', 'source', 'topics'],
    grades: ['bookId', 'num', 'grader', 'grade', 'reason', 'source'],
    tafsir: ['surah', 'ayah', 'text'],
    sharh: ['hadith_num', 'text'],
    section: ['part', 'chapter', 'title', 'page', 'text'],
    event: ['title', 'year', 'month', 'place', 'era', 'category', 'summary', 'events', 'results', 'sources'],
    sahabi: ['title', 'name', 'laqab', 'islam', 'death', 'summary', 'virtues', 'sources'],
    rawi: ['key', 'title', 'rank', 'death', 'tabaqa']
  };
  const split = s => (s || '').split(/[|؛]/).map(x => x.trim()).filter(Boolean);

  function rowsToItems(kind, book, rows) {
    const linked = book.linkedTo || '';
    const stamp = Date.now().toString(36);
    const key = (r, i) => book.id + ':' + (r.id || stamp + '-' + (i + 1));
    return rows.map((r, i) => {
      const base = { bookId: book.id };
      switch (kind) {
        case 'hadith': return Object.assign(base, { id: book.id + ':' + (r.num || i + 1), type: 'hadith', num: +r.num || i + 1, kitab: r.kitab, bab: r.bab, isnad: r.isnad, matn: r.matn || r.text,
          grades: r.grade ? [{ grader: r.grader || '', grade: r.grade, reason: r.reason || '', source: r.source || '' }] : [], topics: split(r.topics) });
        case 'tafsir': return Object.assign(base, { id: book.id + ':' + r.surah + ':' + r.ayah, type: 'tafsir', surah: +r.surah, ayah: +r.ayah, text: r.text });
        case 'sharh': return Object.assign(base, { id: book.id + ':' + r.hadith_num, type: 'sharh', hadithRef: linked + ':' + r.hadith_num, text: r.text });
        case 'section': return Object.assign(base, { id: key(r, i), type: 'section', seq: i + 1, part: r.part, chapter: r.chapter, title: r.title || r.chapter, page: r.page, text: r.text });
        case 'event': return Object.assign(base, { id: key(r, i), type: 'event', title: r.title, year: +r.year, month: r.month, place: r.place, era: r.era, category: r.category || 'حدث', summary: r.summary, events: split(r.events), results: split(r.results), sources: split(r.sources) });
        case 'sahabi': return Object.assign(base, { id: key(r, i), type: 'sahabi', title: r.title, name: r.name, laqab: r.laqab, islam: r.islam, death: r.death, summary: r.summary, virtues: split(r.virtues), sources: split(r.sources) });
        case 'rawi': return Object.assign(base, { id: 'rawi:' + (r.key || i + 1), type: 'rawi', title: r.title, rank: r.rank, death: r.death, tabaqa: r.tabaqa });
      }
    });
  }

  // دمج ملف أحكام (أكثر من محدث) على أحاديث موجودة
  async function mergeGrades(rows) {
    let n = 0;
    for (const r of rows) {
      const id = r.bookId + ':' + r.num;
      const it = await DB.get('items', id);
      if (!it) continue;
      it.grades = (it.grades || []).filter(g => g.grader !== r.grader);
      it.grades.push({ grader: r.grader, grade: r.grade, reason: r.reason || '', source: r.source || '' });
      await DB.put('items', prepareItem(it)); n++;
    }
    DB.invalidate();
    return n;
  }

  // نص القرآن بصيغة تنزيل: سورة|آية|نص
  function parseTanzil(text) {
    const items = [];
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^(\d+)\|(\d+)\|(.+)$/);
      if (!m) continue;
      const s = +m[1], a = +m[2];
      items.push({ id: 'quran:' + s + ':' + a, bookId: 'quran', type: 'ayah', surah: s, ayah: a, text: m[3].trim() });
    }
    return items;
  }

  async function importJSON(data, onProgress, fileName = '') {
    if (data.kind === 'user-backup') { await DB.importUserData(data); return { msg: 'تمت استعادة بياناتك (المحفوظات والملاحظات والمراجعة).' }; }
    const ext = detectJSON(data, fileName);
    if (ext) { const b = await saveBook(ext.book, ext.items, onProgress); return { msg: 'تم استيراد "' + b.title + '": ' + ext.items.length + ' حديث.' }; }
    const books = data.books || (data.book ? [data.book] : []);
    const items = data.items || [];
    let total = 0;
    for (const b of books) {
      const its = items.filter(i => (i.bookId || b.id) === b.id).map(i => (i.bookId = b.id, i));
      await saveBook(b, its, onProgress); total += its.length;
    }
    return { msg: 'تم استيراد ' + books.length + ' كتاب و' + total + ' نص.' };
  }

  // التعرف على صيغ المصادر المفتوحة الشائعة
  const BOOK_GUESS = [['bukhari', 'bukhari'], ['muslim', 'muslim'], ['dawud', 'abudawud'], ['tirmidhi', 'tirmidhi'], ['nasai', 'nasai'], ['majah', 'ibnmajah'], ['malik', 'malik'], ['ahmad', 'ahmad'], ['darimi', 'darimi']];
  const BOOK_TITLES = { bukhari: 'صحيح البخاري', muslim: 'صحيح مسلم', abudawud: 'سنن أبي داود', tirmidhi: 'جامع الترمذي', nasai: 'سنن النسائي', ibnmajah: 'سنن ابن ماجه', malik: 'موطأ مالك', ahmad: 'مسند أحمد', darimi: 'سنن الدارمي' };
  function guessBookId(name) {
    const s = String(name || '').toLowerCase();
    const g = BOOK_GUESS.find(([k]) => s.includes(k));
    return g ? g[1] : null;
  }

  // صيغة fawazahmed0/hadith-api: { metadata:{name,sections}, hadiths:[{hadithnumber,text,grades,reference}] }
  function fromHadithApi(data, fileName) {
    const id = guessBookId((data.metadata && data.metadata.name) + ' ' + fileName) || 'book-' + Date.now();
    const sections = (data.metadata && data.metadata.sections) || {};
    const items = data.hadiths.filter(h => h.text).map(h => ({
      id: id + ':' + h.hadithnumber, bookId: id, type: 'hadith', num: h.hadithnumber,
      kitab: h.reference && sections[h.reference.book] ? sections[h.reference.book] : (h.reference ? 'الكتاب ' + h.reference.book : ''),
      isnad: '', matn: h.text,
      grades: (h.grades || []).map(g => ({ grader: g.name || '', grade: g.grade || '', reason: '', source: '' }))
    }));
    return { book: { id, title: BOOK_TITLES[id] || (data.metadata && data.metadata.name) || fileName, type: 'hadith' }, items };
  }

  // صيغة AhmedBaset/hadith-json: { metadata, chapters:[{id,arabic}], hadiths:[{idInBook,chapterId,arabic}] }
  function fromHadithJson(data, fileName) {
    const meta = data.metadata || {};
    const id = guessBookId((meta.english && meta.english.title) + ' ' + fileName) || 'book-' + Date.now();
    const ch = Object.fromEntries((data.chapters || []).map(c => [c.id, c.arabic || c.english]));
    const items = data.hadiths.map(h => ({
      id: id + ':' + h.idInBook, bookId: id, type: 'hadith', num: h.idInBook, kitab: ch[h.chapterId] || '', isnad: '', matn: h.arabic, grades: []
    }));
    return { book: { id, title: BOOK_TITLES[id] || (meta.arabic && meta.arabic.title) || fileName, type: 'hadith' }, items };
  }

  function detectJSON(data, fileName) {
    if (data.kind === 'user-backup' || data.app === 'maktaba-sunnah' || data.books || data.book) return null; // صيغتنا
    if (Array.isArray(data.hadiths) && data.hadiths[0] && 'hadithnumber' in data.hadiths[0]) return fromHadithApi(data, fileName);
    if (Array.isArray(data.hadiths) && data.hadiths[0] && 'idInBook' in data.hadiths[0]) return fromHadithJson(data, fileName);
    throw new Error('صيغة JSON غير معروفة');
  }

  async function exportBook(bookId) {
    const book = await DB.get('books', bookId);
    const items = (await DB.byIndex('items', 'bookId', bookId)).map(i => { const c = Object.assign({}, i); delete c.n; return c; });
    return { app: 'maktaba-sunnah', format: 1, book, items };
  }

  // مصادر التحميل المقترحة (تحقق من الترخيص قبل التضمين في نسخة منشورة)
  const SOURCES = [
    { title: 'الكتب الستة بالتشكيل مع أحكام المحدثين — hadith-api', url: 'https://github.com/fawazahmed0/hadith-api', how: 'نزّل ملفات ara-bukhari وara-muslim وara-abudawud وara-tirmidhi وara-nasai وara-ibnmajah (JSON) واستوردها مباشرة — البرنامج يتعرف عليها تلقائياً.', license: 'مفتوح (Unlicense).' },
    { title: 'الأحاديث مقسمة بالكتب والأبواب — hadith-json', url: 'https://github.com/AhmedBaset/hadith-json', how: 'ملفات db/by_book/the_9_books — تُستورد مباشرة.', license: 'راجع ملف الترخيص في المستودع.' },
    { title: 'نص القرآن الكريم — مشروع تنزيل', url: 'https://tanzil.net/download/', how: 'اختر "Simple" أو "Uthmani" وصيغة "Text (with aya numbers)" ثم استورده من "نص تنزيل".', license: 'مسموح بالنقل بشرط عدم تعديل النص وذكر المصدر.' },
    { title: 'المكتبة الشاملة', url: 'https://shamela.ws/', how: 'فيها أغلب كتب الحديث والشروح والتفسير والفقه والسيرة. صدّر الكتاب نصاً ثم حوّله لصيغة CSV (أو أرسله لي أحوّله).', license: 'كتب التراث ملك عام؛ راجع حقوق التحقيق لكل طبعة.' },
    { title: 'مشروع OpenITI (نصوص التراث المفتوحة)', url: 'https://github.com/OpenITI', how: 'نصوص تراثية مفتوحة بصيغة نصية موحدة، مناسبة للتحويل الآلي.', license: 'مفتوح للاستخدام البحثي — راجع ملف الترخيص.' },
    { title: 'الدرر السنية — الموسوعة الحديثية', url: 'https://dorar.net/hadith', how: 'مرجع لأحكام المحدثين على الأحاديث (الألباني وغيره) للمراجعة والمقابلة.', license: 'للمراجعة؛ لا يُنسخ المحتوى بالجملة دون إذن.' }
  ];

  window.IMPORT = { installOne, coreSig, importOpenITI, downloadOpenITI, slug, OPENITI_RAW, installPacks, detectJSON, prepareItem, saveBook, loadSample, parseCSV, rowsToItems, mergeGrades, parseTanzil, importJSON, exportBook, CSV_TEMPLATES, SOURCES };
})();
