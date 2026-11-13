/* 📜 تفاصيل أحداث السيرة من كتبها المدمجة: سيرة ابن هشام، والبداية والنهاية، وزاد المعاد.
   لكل حدث كلمات تطابق عناوين الأبواب في هذه الكتب، فيُعرض نص الحدث كما رواه أهل السير. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const N = s => AR.normalize(String(s || '')).replace(/[^ء-ي ]/g, ' ').replace(/\s+/g, ' ').trim();
  const BOOKS = [['ibnhisham', 'سيرة ابن هشام'], ['bidaya-nihaya', 'البداية والنهاية'], ['zad', 'زاد المعاد']];
  // كلمات عناوين الأبواب لكل حدث (أولها أدقها)
  const KW = {
    fil: ['الفيل', 'مولد رسول الله', 'مولده'], khadija: ['تزويج', 'خديجة'], 'kaba-build': ['بنيان الكعبة', 'بناء الكعبة', 'الحجر الأسود'],
    bitha: ['المبعث', 'مبعث', 'بدء الوحي', 'ابتداء الوحي'], jahr: ['الجهر', 'إظهار الدعوة', 'وأنذر عشيرتك'], habasha1: ['الهجرة إلى الحبشة', 'الحبشة'],
    'hamza-umar': ['إسلام حمزة', 'إسلام عمر'], shib: ['الصحيفة', 'حصار الشعب', 'دخول الشعب'], huzn: ['وفاة أبي طالب', 'وفاة خديجة', 'خروجه إلى الطائف'], isra: ['الإسراء', 'المعراج'],
    aqaba1: ['العقبة الأولى'], aqaba2: ['العقبة الثانية', 'العقبة الأخيرة'], hijra: ['هجرة رسول الله', 'الهجرة إلى المدينة', 'هجرة النبي', 'قدوم رسول الله المدينة'],
    masjid: ['بناء المسجد', 'المؤاخاة', 'الموادعة'], adhan: ['بدء الأذان', 'الأذان'], abwa: ['ودان', 'الأبواء'], nakhla: ['عبد الله بن جحش', 'نخلة'],
    siyam: ['فرض الصيام', 'صيام رمضان'], qibla: ['تحويل القبلة', 'صرف القبلة', 'القبلة'], badr: ['غزوة بدر الكبرى', 'غزوة بدر', 'وقعة بدر', 'يوم بدر'], qaynuqa: ['قينقاع'],
    uhud: ['غزوة أحد', 'وقعة أحد', 'يوم أحد'], hamra: ['حمراء الأسد'], rajic: ['الرجيع', 'بئر معونة'], nadir: ['بني النضير', 'النضير'], badr2: ['بدر الآخرة', 'بدر الموعد'],
    dumat: ['دومة الجندل'], mustaliq: ['بني المصطلق', 'المريسيع', 'الإفك'], khandaq: ['غزوة الخندق', 'الخندق', 'الأحزاب'], qurayza: ['بني قريظة', 'قريظة'],
    hudaybiyah: ['الحديبية', 'بيعة الرضوان'], kutub: ['كتب رسول الله', 'الرسل إلى الملوك', 'كتابه إلى'], khaybar: ['غزوة خيبر', 'فتح خيبر'], qada: ['عمرة القضاء', 'عمرة القضية'],
    muta: ['غزوة مؤتة', 'مؤتة'], fathmakkah: ['فتح مكة'], hunayn: ['غزوة حنين', 'يوم حنين', 'هوازن'], taif: ['غزوة الطائف', 'حصار الطائف'], tabuk: ['غزوة تبوك'], wufud: ['عام الوفود', 'الوفود'], haj9: ['حج أبي بكر', 'بعث أبي بكر'],
    yemen: ['بعث معاذ', 'بعث أبي موسى', 'بعثه معاذا'], wada: ['حجة الوداع'], wafat: ['وفاة رسول الله', 'مرض رسول الله', 'ذكر وفاته', 'وفاته صلى الله عليه وسلم'], usama: ['جيش أسامة', 'بعث أسامة'],
    'khilafa-abubakr': ['خلافة أبي بكر', 'الردة', 'أهل الردة'], yamama: ['اليمامة', 'مسيلمة'], iraq: ['فتوح العراق', 'فتح العراق', 'خالد بن الوليد إلى العراق'], ajnadayn: ['أجنادين'], jisr: ['الجسر'],
    'khilafa-umar': ['خلافة عمر'], yarmouk: ['اليرموك'], qadisiya: ['القادسية'], madain: ['المدائن'], quds: ['بيت المقدس', 'إيلياء'], tarikh: ['التاريخ الهجري', 'وضع التاريخ', 'ابتداء التاريخ'],
    ramada: ['عام الرمادة', 'طاعون عمواس', 'عمواس'], misr: ['فتح مصر', 'فتح الديار المصرية'], nahawand: ['نهاوند'], 'istishhad-umar': ['مقتل عمر', 'وفاة عمر', 'الشورى'],
    mushaf: ['جمع القرآن', 'المصاحف'], ifriqiya: ['إفريقية'], qubrus: ['قبرص'], sawari: ['ذات الصواري', 'الصواري'], uthman: ['مقتل عثمان', 'حصر عثمان', 'مقتل أمير المؤمنين عثمان'],
    jamal: ['وقعة الجمل', 'يوم الجمل'], siffin: ['صفين', 'التحكيم'], nahrawan: ['النهروان', 'الخوارج'], ali: ['مقتل علي', 'مقتل أمير المؤمنين علي'], jamaa: ['عام الجماعة', 'تسليم الحسن'],
  };
  // الأعوام التي تقع فيها الأحداث في «البداية والنهاية» (مرتب على السنين بعد الهجرة)
  async function find(ev) {
    const key = ev.id.replace(/^sira:/, ''), kws = (KW[key] || ev.title.replace(/\(.*?\)/g, '').split(/[،:—-]/)[0].replace(/^(غزوة|معركة|وقعة|سرية|فتح)\s+/, '').split(' ').slice(0, 2).join(' ').split('|')).map(N).filter(k => k.length > 2);
    const out = [];
    for (const [bid, bname] of BOOKS) {
      if (!(APP.state.books[bid] || {}).count) continue;
      const items = await DB.byIndex('items', 'bookId', bid);
      const scored = [];
      for (const x of items) {
        const t = N(x.title), c = N(x.chapter);
        let s = 0;
        const wi = (hay, k) => (' ' + hay + ' ').includes(' ' + k + ' ') || (' ' + hay + ' ').includes(' ال' + k + ' ');
        kws.forEach((k, i) => { const w = 10 - i * 2; if (wi(t, k)) s += w * 2 + (t.startsWith(k) ? 6 : 0); else if (wi(c, k)) s += w; });
        if (s && /الاخره|الآخرة/.test(t) && !/الاخره|الآخرة/.test(kws.join(' '))) s -= 15;
        if (s && /شعر|قصيده|رثاء|قال حسان|ما قيل|ابيات|يرثي|الاشعار/.test(t)) s -= 25;
        if (s > 0) scored.push([s + Math.min(4, (x.text || '').length / 2000), x]);
      }
      scored.sort((a, b) => b[0] - a[0] || a[1].seq - b[1].seq);
      // أفضل باب، ثم ما يليه من أبواب الحدث نفسه بترتيب الكتاب
      const top = scored.slice(0, 8).map(h => h[1]).sort((a, b) => a.seq - b.seq);
      if (top.length) out.push({ bid, bname, items: top, best: scored[0][1] });
    }
    return out;
  }

  function sectionHtml(found) {
    if (!found.length) return '';
    return `<h2>📚 تفصيل الحدث من كتب السيرة</h2>
      <div class="tabs" id="sbTabs">${found.map((f, i) => `<button class="${i ? '' : 'on'}" data-sb="${i}">${esc(f.bname)}</button>`).join('')}</div>
      ${found.map((f, i) => `<div class="sb-pane ${i ? 'hidden' : ''}" data-pane="${i}">
        <div class="card"><div class="row"><b>${esc(f.best.title)}</b><span class="spacer"></span><small class="muted">${esc(f.best.page || '')}</small></div>
          <div class="text sb-text" style="margin-top:8px">${esc(f.best.text.length > 1800 ? f.best.text.slice(0, 1800) + '…' : f.best.text)}</div>
          <div class="row" style="gap:8px;margin-top:8px">${f.best.text.length > 1800 ? `<a class="btn sm" href="#/item/${encodeURIComponent(f.best.id)}">📖 اقرأ الباب كاملاً</a>` : ''}<button class="btn sm" data-sbread="${i}">🗣️ اقرأ لي</button></div></div>
        ${f.items.length > 1 ? `<div class="muted" style="margin:6px 0">أبواب أخرى عن الحدث في ${esc(f.bname)}:</div><div class="chips">${f.items.filter(x => x !== f.best).map(x => `<a href="#/item/${encodeURIComponent(x.id)}">${esc(x.title)}</a>`).join('')}</div>` : ''}</div>`).join('')}`;
  }

  const origItem = V.item;
  V.item = async (el, parts, p) => {
    await origItem(el, parts, p);
    const id = decodeURIComponent((parts || [])[0] || '');
    if (!id.startsWith('sira:')) return;
    const ev = await DB.get('items', id); if (!ev || ev.type !== 'event') return;
    const found = await find(ev);
    const html = sectionHtml(found);
    if (!html) return;
    const box = document.createElement('div'); box.innerHTML = html;
    const src = [...el.querySelectorAll('h2')].find(h => h.textContent.trim().startsWith('المصادر'));
    if (src) src.before(box); else el.appendChild(box);
    box.querySelectorAll('[data-sb]').forEach(b => b.onclick = () => {
      box.querySelectorAll('[data-sb]').forEach(x => x.classList.toggle('on', x === b));
      box.querySelectorAll('[data-pane]').forEach(x => x.classList.toggle('hidden', x.dataset.pane !== b.dataset.sb));
    });
    box.querySelectorAll('[data-sbread]').forEach(b => b.onclick = () => { const f = found[+b.dataset.sbread]; if (window.TTS) TTS.read(f.best.text, f.best.title); });
  };

  window.SIRAMORE = { find, KW };
})();
