/* أدوات النص العربي: التطبيع، التجذير التقريبي، التمييز */
(function () {
  const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g; // حركات + تطويل

  function normalize(s) {
    if (!s) return '';
    return String(s)
      .replace(TASHKEEL, '')
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[^ء-ي0-9a-zA-Z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  const PREFIXES = ['وبال', 'وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك', 'س'];
  const SUFFIXES = ['هما', 'كما', 'ات', 'ون', 'ين', 'ان', 'ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'وا', 'ه', 'ي', 'ك'];

  // تجذير خفيف: إزالة السوابق واللواحق الشائعة
  function stem(word) {
    let w = normalize(word);
    for (const p of PREFIXES) {
      if (w.startsWith(p) && w.length - p.length >= 3) { w = w.slice(p.length); break; }
    }
    for (const s of SUFFIXES) {
      if (w.endsWith(s) && w.length - s.length >= 3) { w = w.slice(0, -s.length); break; }
    }
    return w;
  }

  // بحث بالجذر (تقريبي): "ق ت ل" أو "قتل" بعد بادئة "جذر:"
  function rootRegex(root) {
    const letters = normalize(root).replace(/\s/g, '').split('');
    if (letters.length < 2 || letters.length > 4) return null;
    const pre = '[وفبلكسالتمني]{0,4}';
    const mid = '[اويتن]{0,2}';
    const suf = '[اويتنهكمه]{0,4}';
    const body = letters.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(mid);
    return new RegExp('(^|\\s)' + pre + body + suf + '(?=\\s|$)');
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // تمييز كلمات البحث في نص مشكول: نبني regex يسمح بالحركات بين الحروف
  // ===== مطابقة الكلمة كاملة (لا أجزاء الكلمات): «الربا» تطابق الربا/بالربا/والربا، ولا تطابق الروابي أو قربان =====
  const PRE = ['وال', 'فال', 'بال', 'كال', 'ولل', 'فلل', 'لل', 'ال'];
  function core(w) {
    w = normalize(w);
    for (const p of PRE) if (w.startsWith(p) && w.length - p.length >= 2) return w.slice(p.length);
    return w;
  }
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const SUF = '(?:هما|كما|هم|هن|كم|كن|ها|نا|ني|ون|ين|ان|ات|وا|ه|ي|ك)?';
  function corePattern(c) {
    // الكلمة المنتهية بتاء مربوطة تصير تاءً مع الضمير: الصلاة ← صلاته
    if (c.endsWith('ه') && c.length > 2) return '(?:' + esc(c) + '|' + esc(c.slice(0, -1)) + 'ت(?:ه|ها|هم|هما|كم|نا|ي|ك|ين|ان))';
    if (/[اوي]$/.test(c)) return esc(c); // الربا: بلا لواحق حتى لا تطابق «ربانا»
    return esc(c) + SUF;
  }
  // للنص المطبّع (حقل البحث n)
  function wordRe(w) {
    return new RegExp('(?:^| )(?:[وف]?[بكل]?(?:ال)?|[وف]?لل)' + corePattern(core(w)) + '(?= |$)');
  }
  // للنص الأصلي المشكول (للتمييز وتحديد موضع المقتطف)
  const MAP = { 'ا': '[اأإآٱٰ]', 'ي': '[يىئ]', 'ه': '[هة]', 'و': '[وؤ]', 'ت': '[تة]' };
  const TK = '[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640]*';
  function rawPattern(w) {
    const c = core(w);
    const letters = x => x.split('').map(ch => (MAP[ch] || esc(ch)) + TK).join('');
    let body;
    if (c.endsWith('ه') && c.length > 2) body = '(?:' + letters(c) + '|' + letters(c.slice(0, -1)) + '[تة]' + TK + '(?:' + ['هما', 'هم', 'ها', 'كم', 'نا', 'ه', 'ك', 'ي'].map(letters).join('|') + ')?)';
    else if (/[اوي]$/.test(c)) body = letters(c);
    else body = letters(c) + '(?:' + ['هما', 'كما', 'هم', 'هن', 'كم', 'ها', 'نا', 'ون', 'ين', 'ان', 'ات', 'وا', 'ه', 'ي', 'ك'].map(letters).join('|') + ')?';
    const pre = '(?:(?:[وف]' + TK + ')?(?:[بكل]' + TK + ')?(?:' + MAP['ا'] + TK + 'ل' + TK + ')?|(?:[وف]' + TK + ')?ل' + TK + 'ل' + TK + ')';
    return '(?<![\\u0621-\\u064A])' + pre + body + '(?![\\u0621-\\u064A])';
  }
  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const words = normalize(query).split(' ').filter(w => w.length >= 2).slice(0, 6);
    if (!words.length) return safe;
    try { return safe.replace(new RegExp('(' + words.map(rawPattern).join('|') + ')', 'g'), '<mark>$1</mark>'); }
    catch (e) { return safe; }
  }

  // مقتطف حول أول موضع لكلمات البحث في نص طويل (مع التمييز)
  function snippetHtml(text, query, len = 520) {
    text = String(text || '');
    const words = normalize(query).split(' ').filter(w => w.length >= 2).slice(0, 6);
    if (!words.length || text.length <= len) return highlight(text.slice(0, len), query) + (text.length > len ? '…' : '');
    let pos = -1;
    for (const w of words) {
      try { const m = new RegExp(rawPattern(w)).exec(text); if (m && (pos < 0 || m.index < pos)) pos = m.index; } catch (e) {}
    }
    if (pos < 0) pos = 0;
    const a = Math.max(0, pos - Math.floor(len / 3)), b = Math.min(text.length, a + len);
    return (a > 0 ? '…' : '') + highlight(text.slice(a, b), query) + (b < text.length ? '…' : '');
  }

  const SURAHS = ['الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم', 'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر', 'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس', 'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد', 'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص', 'الفلق', 'الناس'];

  function surahByName(name) {
    const n = normalize(name).replace(/^سوره\s*/, '');
    let i = SURAHS.findIndex(s => normalize(s) === n);
    if (i < 0) i = SURAHS.findIndex(s => normalize(s).replace(/^ال/, '') === n.replace(/^ال/, ''));
    return i >= 0 ? i + 1 : 0;
  }

  // الرسم العثماني إلى قريب من الإملائي (لأجل البحث)
  function uthmaniAlt(s) { return normalize(String(s || '').replace(/[وى]\u0670[\u064B-\u065F]*ا?/g, 'ا').replace(/\u0640?\u0670/g, 'ا')); }

  const toArabicDigits = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  window.AR = { wordRe, core, snippetHtml, uthmaniAlt, normalize, stem, rootRegex, highlight, escapeHtml, SURAHS, surahByName, toArabicDigits };
})();
