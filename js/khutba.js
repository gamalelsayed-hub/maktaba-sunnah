/* مُعين الخطيب والداعية: يكتب الموضوع فيُجهَّز له هيكل خطبة جمعة أو درس أو موعظة،
   بالعناصر والأهداف والأدلة من القرآن والسنة الصحيحة (من المكتبة نفسها) والأحكام والنتائج والخاتمة.
   النصوص تُجلب من الكتب المثبتة بتوثيقها، والصياغة الرابطة قوالب يعدّلها الخطيب. */
(function () {
  const { esc, $ } = APP;
  const V = APP.views;
  const N = AR.normalize;
  const LS = 'khutab-saved';

  const STOP = ['في', 'من', 'عن', 'علي', 'الي', 'ما', 'ماذا', 'هل', 'كل', 'التي', 'الذي', 'او', 'ثم', 'مع', 'ان', 'لا', 'هو', 'هي', 'خطبه', 'خطبة', 'درس', 'موعظه', 'عن', 'حول', 'موضوع', 'فضل', 'اهميه', 'حكم', 'احكام', 'وجوب', 'خطر', 'الاسلام', 'المسلم'];

  // موضوعات شائعة: كلمات بديلة تُبحث بها النصوص، ونوع الموضوع (فضيلة يُرغَّب فيها، أو آفة يُحذَّر منها)
  const THEMES = [
    { k: ['صبر'], alt: [['الصبر'], ['الصابرين'], ['اصبروا'], ['صبروا'], ['فاصبر'], ['صابروا']], ay: [[2,153],[2,155],[2,156],[2,157],[39,10],[3,200]], hk: ["عجبا لامر المؤمن", "انما الصبر عند الصدمه الاولي", "ما اعطي احد عطاء خيرا واوسع من الصبر"], pol: '+' },
    { k: ['والدين', 'الوالدين', 'بر'], alt: [['الوالدين'], ['بالوالدين'], ['والديه'], ['لوالديك'], ['امك'], ['امه', 'ابيه'], ['عقوق']], ay: [[17,23],[17,24],[31,14],[46,15],[4,36]], hk: ["احق الناس بحسن صحابتي", "الصلاه علي وقتها", "الا انبئكم باكبر الكبائر", "رغم انف"], pol: '+' },
    { k: ['توبه', 'التوبه', 'استغفار'], alt: [['التوبه'], ['توبوا'], ['تاب'], ['التوابين'], ['استغفروا'], ['يستغفر'], ['الاستغفار']], ay: [[66,8],[24,31],[39,53],[2,222],[25,70]], hk: ["يبسط يده بالليل", "لله افرح بتوبه عبده", "كل ابن ادم خطاء"], pol: '+' },
    { k: ['صدق'], alt: [['الصدق'], ['الصادقين'], ['صدقوا'], ['الكذب']], ay: [[9,119],[39,33],[5,119]], hk: ["ان الصدق يهدي الي البر"], pol: '+' },
    { k: ['امانه'], alt: [['الامانه'], ['الامانات'], ['امانته'], ['خان'], ['الخيانه']], ay: [[4,58],[33,72],[8,27],[23,8]], hk: ["اذا ضيعت الامانه", "ايه المنافق ثلاث", "اد الامانه الي من ائتمنك"], pol: '+' },
    { k: ['صلاه', 'الصلاه'], alt: [['الصلاه'], ['اقيموا', 'الصلاه'], ['صلاتهم'], ['المصلين'], ['يصلي']], ay: [[2,238],[29,45],[23,1],[23,2],[4,103],[20,14]], hk: ["العهد الذي بيننا وبينهم الصلاه", "ارايتم لو ان نهرا", "بين الرجل وبين الشرك"], pol: '+' },
    { k: ['زكاه', 'الزكاه'], alt: [['الزكاه'], ['اتوا', 'الزكاه'], ['الصدقه'], ['صدقه']], ay: [[9,103],[2,43],[9,60],[2,261]], hk: ["بني الاسلام علي خمس", "ما نقصت صدقه من مال"], pol: '+' },
    { k: ['صدقه', 'الصدقه', 'انفاق', 'الانفاق'], alt: [['الصدقه'], ['تصدق'], ['ينفقون'], ['انفقوا'], ['المتصدقين']], ay: [[2,261],[2,274],[2,245],[57,18]], hk: ["ما نقصت صدقه من مال", "اتقوا النار ولو بشق تمره", "الصدقه تطفئ الخطيئه", "سبعه يظلهم الله"], pol: '+' },
    { k: ['صيام', 'صوم', 'رمضان'], alt: [['الصيام'], ['رمضان'], ['صام'], ['الصوم'], ['الصائم']], ay: [[2,183],[2,184],[2,185]], hk: ["من صام رمضان ايمانا", "الصيام جنه"], pol: '+' },
    { k: ['حج', 'الحج'], alt: [['الحج'], ['حج', 'البيت'], ['المناسك'], ['عرفه']], ay: [[3,97],[22,27],[2,197]], hk: ["من حج فلم يرفث", "الحج المبرور ليس له جزاء"], pol: '+' },
    { k: ['رحم'], alt: [['الرحم'], ['ارحامكم'], ['الارحام'], ['وصل', 'رحمه'], ['قاطع']], ay: [[47,22],[47,23],[4,1],[13,21]], hk: ["من احب ان يبسط له في رزقه", "لا يدخل الجنه قاطع", "الرحم معلقه"], pol: '+' },
    { k: ['غيبه', 'الغيبه', 'نميمه'], alt: [['الغيبه'], ['يغتب'], ['نميم'], ['النميمه'], ['اخاك', 'يكره']], ay: [[49,12],[104,1],[68,11]], hk: ["اتدرون ما الغيبه", "لا يدخل الجنه نمام", "لا يدخل الجنه قتات"], pol: '-' },
    { k: ['حياء'], alt: [['الحياء'], ['يستحيي'], ['استحيوا']], ay: [[28,25]], hk: ["الحياء لا ياتي الا بخير", "الحياء من الايمان", "الحياء شعبه من الايمان"], pol: '+' },
    { k: ['شكر'], alt: [['الشكر'], ['اشكروا'], ['شكرتم'], ['الشاكرين'], ['يشكر']], ay: [[14,7],[2,152],[34,13],[31,12]], hk: ["لا يشكر الله من لا يشكر الناس", "افلا اكون عبدا شكورا"], pol: '+' },
    { k: ['توكل'], alt: [['التوكل'], ['توكلوا'], ['يتوكل'], ['المتوكلين'], ['توكلت']], ay: [[65,3],[3,159],[25,58]], hk: ["لو انكم كنتم توكلون علي الله حق توكله"], pol: '+' },
    { k: ['موت', 'الموت'], alt: [['الموت'], ['ذائقه', 'الموت'], ['هادم'], ['القبر']], ay: [[3,185],[62,8],[50,19],[63,10]], hk: ["اكثروا ذكر هاذم اللذات", "كن في الدنيا كانك غريب"], pol: '+' },
    { k: ['اخره', 'القيامه', 'البعث'], alt: [['القيامه'], ['الاخره'], ['يوم', 'القيامه'], ['البعث'], ['الحساب']], ay: [[99,7],[99,8],[22,1],[2,281]], hk: [], pol: '+' },
    { k: ['جنه', 'الجنه'], alt: [['الجنه'], ['جنات'], ['الفردوس'], ['نعيم']], ay: [[3,133],[32,17],[47,15]], hk: ["اعددت لعبادي الصالحين", "حفت الجنه بالمكاره"], pol: '+' },
    { k: ['ظلم'], alt: [['الظلم'], ['الظالمين'], ['ظلموا'], ['المظلوم']], ay: [[14,42],[11,102],[26,227]], hk: ["الظلم ظلمات يوم القيامه", "ان الله ليملي للظالم"], pol: '-' },
    { k: ['ربا', 'الربا'], alt: [['الربا'], ['ربا']], ay: [[2,275],[2,276],[2,278],[2,279]], hk: ["اكل الربا وموكله", "اجتنبوا السبع الموبقات"], pol: '-' },
    { k: ['اخلاق', 'خلق'], alt: [['الخلق'], ['خلق', 'حسن'], ['اخلاقا'], ['حسن', 'الخلق']], ay: [[68,4],[3,134],[41,34]], hk: ["ما من شيء اثقل في الميزان", "اكمل المؤمنين ايمانا احسنهم خلقا", "البر حسن الخلق"], pol: '+' },
    { k: ['رزق'], alt: [['الرزق'], ['الرزاق'], ['يرزق'], ['رزقكم']], ay: [[65,2],[65,3],[11,6],[51,58],[71,10],[71,11],[71,12]], hk: ["لو انكم كنتم توكلون", "من احب ان يبسط له في رزقه"], pol: '+' },
    { k: ['تقوي', 'تقوى'], alt: [['التقوي'], ['اتقوا'], ['المتقين'], ['يتق']], ay: [[65,2],[3,102],[49,13],[2,197]], hk: ["اتق الله حيثما كنت", "التقوي ها هنا"], pol: '+' },
    { k: ['اخلاص'], alt: [['الاخلاص'], ['مخلصين'], ['بالنيات'], ['النيه']], ay: [[98,5],[39,2],[18,110]], hk: ["انما الاعمال بالنيات", "ان الله لا ينظر الي صوركم"], pol: '+' },
    { k: ['ذكر'], alt: [['الذكر'], ['اذكروا'], ['الذاكرين'], ['ذكر', 'الله']], ay: [[33,41],[33,42],[13,28],[2,152]], hk: ["مثل الذي يذكر ربه", "كلمتان خفيفتان", "سبق المفردون"], pol: '+' },
    { k: ['دعاء'], alt: [['الدعاء'], ['ادعوني'], ['دعوه'], ['يدعو']], ay: [[40,60],[2,186],[7,55]], hk: ["الدعاء هو العباده", "ما من مسلم يدعو بدعوه"], pol: '+' },
    { k: ['قران', 'القران'], alt: [['القران'], ['تلاوه'], ['يتلون'], ['اقرءوا'], ['اقرؤوا']], ay: [[35,29],[17,9],[38,29]], hk: ["خيركم من تعلم القران", "اقرءوا القران فانه ياتي", "الماهر بالقران"], pol: '+' },
    { k: ['علم', 'العلم'], alt: [['العلم'], ['العلماء'], ['يعلمون'], ['الفقه']], ay: [[58,11],[39,9],[20,114],[35,28]], hk: ["من سلك طريقا يلتمس فيه علما", "من يرد الله به خيرا يفقهه"], pol: '+' },
    { k: ['جار', 'الجار'], alt: [['الجار'], ['جاره'], ['والجار']], ay: [[4,36]], hk: ["ما زال جبريل يوصيني بالجار", "فليكرم جاره"], pol: '+' },
    { k: ['يتيم', 'الايتام'], alt: [['اليتيم'], ['اليتامي'], ['يتيما']], ay: [[93,9],[4,10],[2,220]], hk: ["انا وكافل اليتيم"], pol: '+' },
    { k: ['كبر', 'الكبر', 'تواضع'], alt: [['الكبر'], ['المتكبرين'], ['التواضع'], ['تواضع'], ['مختال']], ay: [[31,18],[17,37],[16,23],[25,63]], hk: ["مثقال ذره من كبر", "وما تواضع احد لله"], pol: '-' },
    { k: ['حسد'], alt: [['الحسد'], ['حاسد'], ['تحاسدوا']], ay: [[113,5],[4,54]], hk: ["لا تحاسدوا", "لا حسد الا في اثنتين"], pol: '-' },
    { k: ['غضب'], alt: [['الغضب'], ['تغضب'], ['الغيظ'], ['الكاظمين']], ay: [[3,134],[42,37]], hk: ["ليس الشديد بالصرعه", "اوصني قال لا تغضب"], pol: '-' },
    { k: ['خمر', 'مسكر', 'مخدرات'], alt: [['الخمر'], ['مسكر'], ['المسكر']], ay: [[5,90],[5,91]], hk: ["كل مسكر خمر", "لعن الله الخمر"], pol: '-' },
    { k: ['بدعه', 'البدع', 'سنه', 'السنه', 'اتباع'], alt: [['بدعه'], ['محدثه'], ['سنتي'], ['اتبعوا'], ['فاتبعوني'], ['الرسول', 'اطيعوا']], ay: [[3,31],[59,7],[6,153],[33,21]], hk: ["من احدث في امرنا هذا", "فعليكم بسنتي", "كل امتي يدخلون الجنه الا من ابي"], pol: '+' },
    { k: ['اخوه', 'الاخوه', 'محبه'], alt: [['اخوه'], ['المؤمنون', 'اخوه'], ['تحابوا'], ['المتحابين']], ay: [[49,10],[3,103],[59,9]], hk: ["حتي يحب لاخيه", "مثل المؤمنين في توادهم", "المسلم اخو المسلم"], pol: '+' },
    { k: ['زواج', 'نكاح', 'الاسره'], alt: [['النكاح'], ['ازواجا'], ['تزوج'], ['المرأه'], ['النساء', 'خيرا']], ay: [[30,21],[4,19],[24,32]], hk: ["تنكح المراه لاربع", "استوصوا بالنساء خيرا", "يا معشر الشباب"], pol: '+' },
    { k: ['تربيه', 'الابناء', 'الاولاد'], alt: [['اولادكم'], ['اهليكم'], ['راع'], ['مسؤول', 'رعيته']], ay: [[66,6],[31,13],[20,132]], hk: ["كلكم راع", "مروا اولادكم بالصلاه"], pol: '+' },
    { k: ['وقت', 'الوقت', 'الفراغ'], alt: [['الفراغ'], ['عمره', 'افناه'], ['والعصر']], ay: [[103,1],[103,2],[103,3]], hk: ["نعمتان مغبون فيهما", "اغتنم خمسا"], pol: '+' },
    { k: ['جمعه', 'الجمعه'], alt: [['الجمعه'], ['يوم', 'الجمعه']], ay: [[62,9],[62,10]], hk: ["خير يوم طلعت عليه الشمس", "من اغتسل يوم الجمعه"], pol: '+' }
  ];
  const themeOf = q => { const w = N(q).split(' '); return THEMES.find(t => t.k.some(k => w.some(x => x === k || x === 'ال' + k || AR.core(x) === AR.core(k)))); };

  // ===== نصوص ثابتة صحيحة =====
  const HAJA = 'إنَّ الحمدَ لله، نحمدُه ونستعينُه ونستغفرُه، ونعوذُ بالله من شرورِ أنفسِنا ومن سيئاتِ أعمالِنا، من يهدِه اللهُ فلا مُضِلَّ له، ومن يُضلِلْ فلا هاديَ له، وأشهدُ أن لا إله إلا اللهُ وحده لا شريك له، وأشهدُ أنَّ محمدًا عبدُه ورسولُه.';
  const HAJA_REF = 'خطبة الحاجة: رواه أبو داود (2118) والنسائي والترمذي وابن ماجه من حديث ابن مسعود رضي الله عنه، وصححه الألباني.';
  const AMMA = 'أما بعد: فإنَّ خيرَ الحديثِ كتابُ الله، وخيرَ الهَدْيِ هَدْيُ محمدٍ ﷺ، وشرَّ الأمورِ مُحدثاتُها، وكلَّ بدعةٍ ضلالة.';
  const AMMA_REF = 'رواه مسلم (867) من حديث جابر رضي الله عنه.';
  const SALAT = 'اللهم صلِّ على محمدٍ وعلى آل محمد، كما صليتَ على إبراهيمَ وعلى آل إبراهيم، إنك حميدٌ مجيد، اللهم باركْ على محمدٍ وعلى آل محمد، كما باركتَ على إبراهيمَ وعلى آل إبراهيم، إنك حميدٌ مجيد.';
  const SALAT_REF = 'رواه البخاري (3370) من حديث كعب بن عُجرة رضي الله عنه.';
  const DUA_MUSLIM = 'اللهم آتِ نفوسَنا تقواها، وزكِّها أنت خيرُ من زكّاها، أنت وليُّها ومولاها.';
  const DUA_MUSLIM_REF = 'من دعائه ﷺ، رواه مسلم (2722) من حديث زيد بن أرقم رضي الله عنه.';
  const AYAT_HAJA = [[3, 102], [4, 1], [33, 70], [33, 71]];
  const AYAT_DUA = [[2, 201], [59, 10], [3, 8]];
  const AYAH_SALAH = [33, 56];
  const AYAH_END = [16, 90];

  // ===== أدوات النص =====
  const TK = '[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u0640\\u200f\\u200e]*';
  const MAP = { 'ا': '[اأإآٱٰ]', 'ي': '[يىئ]', 'ه': '[هة]', 'و': '[وؤ]', 'ت': '[تة]' };
  const rawRe = ph => new RegExp(ph.split('').map(c => c === ' ' ? '\\s+' + TK : (MAP[c] || c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + TK).join(''));
  const PROPHET = ['قال رسول الله', 'ان رسول الله', 'ان النبي', 'قال النبي', 'عن النبي', 'سمعت رسول الله', 'سمعت النبي', 'عن رسول الله', 'كان رسول الله', 'كان النبي', 'سالت النبي', 'سالت رسول الله', 'جاء رجل الي النبي', 'جاء رجل الي رسول الله', 'قيل يا رسول الله', 'قلت يا رسول الله'].map(rawRe);
  const TAIL = ['قال ابو عيسي', 'وفي الباب', 'قال ابو داود', 'قال ابو عبد الرحمن', 'قال الشيخ'].map(rawRe);
  const clean = s => (s || '').replace(/[‏‎]/g, '').replace(/\s*‏?\.‏\s*/g, '. ').replace(/\s+/g, ' ').trim();

  // نص الحديث للخطبة: يُحذف الإسناد (من أول ذكر للصحابي أو للنبي ﷺ) وتعليقات المصنف في آخره
  function hadithText(it) {
    let s = (it.isnad ? it.isnad + ' ' : '') + (it.matn || '');
    s = s.replace(/[‏‎]/g, '');
    if (it.bookId !== 'riyad') {
      let at = -1;
      for (const re of PROPHET) { const m = re.exec(s); if (m && (at < 0 || m.index < at)) at = m.index; }
      if (at >= 0 && s.length - at < 60) at = -1;
      if (at < 0) { const q = s.search(/["“«]/); if (q > 0) at = q; }
      if (at > 0) {
        // نرجع إلى «عن فلان» القريب قبله ليظهر اسم الصحابي
        const from = Math.max(0, at - 230), back = s.slice(from, at);
        let last = -1; const re = new RegExp('(?:^|\\s)' + rawRe('عن').source + '\\s', 'g'); let m;
        const hits = []; while ((m = re.exec(back))) hits.push(m.index);
        last = hits.length ? hits[hits.length - 1] : -1;
        // «عن أبيه» و«عن جده» ليسا اسم الصحابي: نرجع خطوة
        while (hits.length > 1 && /^\s?عن\s(ابيه|جده|جدي)(\s|$)/.test(N(back.slice(last, last + 40)))) { hits.pop(); last = hits[hits.length - 1]; }
        s = last >= 0 ? s.slice(from + last).trim() : s.slice(at);
      }
    } else s = s.replace(/^وَ?و?(عن|عَنْ)/, '$1');
    for (const re of TAIL) { const m = re.exec(s); if (m && m.index > 40) s = s.slice(0, m.index); }
    s = clean(s);
    s = s.replace(/(\s\d+\s*[.\-]?)+\s*$/, '');
    if (/^["“«]/.test(s)) s = 'قال رسول الله ﷺ: ' + s;
    return s.length > 650 ? s.slice(0, 640).replace(/\s\S*$/, '') + ' …' : s;
  }
  // رقم الحديث كما في المطبوع (لمسلم: ترقيم عبد الباقي إن توفر)
  const hnum = it => it.printedNum ? it.printedNum : (it.bookId === 'muslim' ? it.num + ' بترقيم sunnah.com' : it.num);
  function hadithGrade(it) {
    if (it.bookId === 'bukhari') return { ok: true, label: 'رواه البخاري' };
    if (it.bookId === 'muslim') return { ok: true, label: 'رواه مسلم' };
    const gs = it.grades || [];
    if (gs.length) {
      const alb = gs.find(g => /الالباني/.test(N(g.grader)));
      const bad = gs.filter(g => APP.gradeCls(g.grade) === 'g-daif').length;
      const good = gs.filter(g => /g-sahih|g-hasan/.test(APP.gradeCls(g.grade))).length;
      const head = alb || gs[0];
      if (alb ? APP.gradeCls(alb.grade) === 'g-daif' : bad >= good) return { ok: false };
      if (!good) return { ok: false };
      const WHO = { abudawud: 'أبو داود', tirmidhi: 'الترمذي', nasai: 'النسائي', ibnmajah: 'ابن ماجه', ahmad: 'أحمد', malik: 'مالك في الموطأ', darimi: 'الدارمي', adab: 'البخاري في الأدب المفرد', shamail: 'الترمذي في الشمائل' };
      return { ok: true, label: WHO[it.bookId] ? 'رواه ' + WHO[it.bookId] : 'أورده ' + (APP.state.books[it.bookId] || {}).title, grade: head.grader + ': ' + head.grade };
    }
    // كتب مختارة بلا أحكام مسجلة: يُذكر تخريج المصنف إن وُجد في آخر النص
    if (['riyad', 'nawawi40', 'qudsi40', 'bulugh'].includes(it.bookId)) return { ok: true, label: 'أورده ' + (APP.state.books[it.bookId] || {}).title, review: true };
    return { ok: false };
  }

  // ===== البحث في المكتبة =====
  function termsFor(q) {
    const words = N(q).split(' ').filter(w => w.length >= 2 && !STOP.includes(w));
    const base = words.length ? words : N(q).split(' ').filter(w => w.length >= 2);
    const th = themeOf(q);
    const terms = [{ w: base, wt: 3 }];
    if (th) th.alt.forEach(a => terms.push({ w: a, wt: 2 }));
    if (base.length > 1 && !th) base.filter(w => AR.core(w).length >= 3).forEach(w => terms.push({ w: [w], wt: 1 }));
    return { terms, words: base, theme: th };
  }
  const scoreBy = (x, terms) => { let best = 0; for (const t of terms) { const s = APP.scoreText(x.n, x.t, t.w, null); if (s) best = Math.max(best, s * t.wt); } return best; };

  async function gather(q, size) {
    const { terms, words, theme } = termsFor(q);
    const idx = await DB.searchIndex();
    const pools = { ayah: [], hadith: [], fiqh: [], qaida: [], event: [] };
    const BOOST = { riyad: 4, nawawi40: 5, bukhari: 7, muslim: 7, bulugh: 2, qudsi40: 3, adab: 1, malik: -4 };
    const HK = theme && theme.hk ? theme.hk.map(N) : [];
    const CUR = new Set(theme && theme.ay ? theme.ay.map(([a, b]) => 'quran:' + a + ':' + b) : []);
    for (const x of idx) {
      if (!pools[x.type] || !APP.visible(x.id)) continue;
      if (x.type === 'ayah' && CUR.has(x.id)) continue;
      let s = scoreBy(x, terms);
      if (x.type === 'hadith' && HK.length) { const i = HK.findIndex(h => x.n.includes(h)); if (i >= 0) s += 60 - i * 3; }
      if (!s) continue;
      if (x.type === 'hadith') {
        if (/^daif/.test(x.grade)) continue;
        s += (BOOST[x.bookId] || 0) + (/^sahih/.test(x.grade) ? 4 : /^hasan/.test(x.grade) ? 2 : 0) - Math.min(8, (x.n || '').length / 250);
      }
      pools[x.type].push({ id: x.id, s });
    }
    // إذا قلّت الآيات: نوسّع بالجذر للكلمة الرئيسة
    if (pools.ayah.length < 4) {
      const main = words.map(w => AR.stem(w)).sort((a, b) => b.length - a.length)[0] || '';
      const rre = main.length === 3 ? AR.rootRegex(main.split('').join(' ')) : null;
      if (rre) for (const x of idx) if (x.type === 'ayah' && rre.test(x.n) && !pools.ayah.some(a => a.id === x.id)) pools.ayah.push({ id: x.id, s: 1 });
    }
    const lim = { ayah: size * 2 + 4, hadith: size * 3 + 6, fiqh: 6, qaida: 4, event: 5 };
    const out = {};
    for (const [k, arr] of Object.entries(pools)) {
      arr.sort((a, b) => b.s - a.s);
      const its = (await Promise.all(arr.slice(0, lim[k] * 2).map(h => DB.get('items', h.id)))).filter(Boolean);
      if (k === 'hadith') {
        // حذف المكرر: الحديث نفسه من كتب متعددة يُكتفى بأعلاها رتبة
        const kept = [];
        const wset = t => new Set(N(t).split(' ').filter(w => w.length > 2));
        for (const it of its) {
          const h = { it, g: hadithGrade(it), text: hadithText(it) };
          if (!h.g.ok || h.text.length < 25) continue;
          h.w = wset(h.text);
          if (kept.some(o => { let c = 0; h.w.forEach(w => o.w.has(w) && c++); return c / Math.min(h.w.size, o.w.size) > 0.55; })) continue;
          kept.push(h); if (kept.length >= lim[k]) break;
        }
        out[k] = kept;
      } else if (k === 'ayah') {
        const cur = theme && theme.ay ? await ayahGroup(theme.ay) : [];
        const cg = [];
        for (const a of cur) { const l = cg[cg.length - 1]; if (l && l[0].surah === a.surah && a.ayah - l[l.length - 1].ayah === 1) l.push(a); else cg.push([a]); }
        // آيات متتالية من موضع واحد تُضم في شاهد واحد
        const s = its.slice(0, Math.max(3, lim[k] - cur.length)).sort((a, b) => a.surah - b.surah || a.ayah - b.ayah); const g = [];
        for (const a of s) { const l = g[g.length - 1]; if (l && l[0].surah === a.surah && a.ayah - l[l.length - 1].ayah === 1 && l.length < 3) l.push(a); else g.push([a]); }
        const rank = new Map(arr.map((h, i) => [h.id, i]));
        out[k] = cg.concat(g.sort((a, b) => Math.min(...a.map(x => rank.get(x.id))) - Math.min(...b.map(x => rank.get(x.id)))));
      } else out[k] = its.slice(0, lim[k]);
    }
    return { out, theme, words };
  }

  async function ayahGroup(list) {
    const its = (await Promise.all(list.map(([s, a]) => DB.get('items', 'quran:' + s + ':' + a)))).filter(Boolean);
    return its;
  }
  const atext = a => a.ayah === 1 && a.surah !== 1 ? a.text.replace(/^بِسْمِ\s+\S+\s+\S+\s+\S+\s+/, '') : a.text;
  const ayahCite = g => '﴿' + g.map(a => atext(a) + ' (' + AR.toArabicDigits(String(a.ayah)) + ')').join(' ') + '﴾ [' + AR.SURAHS[g[0].surah - 1] + ': ' + g[0].ayah + (g.length > 1 ? '–' + g[g.length - 1].ayah : '') + ']';
  async function tafsirNote(a) {
    try {
      // التفسير المقصور على هذه الآية أو ما يقاربها، حتى لا يأتي كلام عن آيات أخرى
      const t = (await DB.byIndex('items', 'ref', a.id)).filter(x => x.type === 'tafsir' && x.surah === a.surah && x.ayah <= a.ayah && a.ayah <= (x.ayahTo || x.ayah) && (x.ayahTo || x.ayah) - x.ayah <= 2);
      const pick = t.find(x => x.bookId === 'tafsir-saadi') || t.find(x => x.bookId === 'tafsir-ibnkathir');
      if (!pick) return '';
      let s = clean(pick.text).replace(/[{}]/g, '');
      if (s.length > 380) s = s.slice(0, 370).replace(/\s\S*$/, '') + ' …';
      return { by: pick.bookId === 'tafsir-saadi' ? 'قال السعدي رحمه الله' : 'قال ابن كثير رحمه الله', s };
    } catch (e) { return ''; }
  }

  // ===== بناء الخطبة =====
  const KIND = { jumua: 'خطبة جمعة', dars: 'درس علمي', mawiza: 'موعظة قصيرة' };
  const SIZE = { short: 2, mid: 3, long: 5 };

  function objectives(T, pol, kind) {
    const o = pol === '-' ? [
      `التحذير من ${T}، وبيان خطره وسوء عاقبته من الكتاب والسنة.`,
      `بيان حكم ${T} وما يتعلق به من مسائل عند أهل العلم.`,
      `معرفة أسباب الوقوع فيه وسبل الوقاية والعلاج.`,
      `الحث على التوبة والمبادرة إلى ضده من الخير.`
    ] : [
      `بيان منزلة ${T} في كتاب الله وسنة رسوله ﷺ.`,
      `الترغيب في ${T} بذكر فضله وثمراته في الدنيا والآخرة.`,
      `معرفة ما يتعلق به من أحكام ومسائل عند أهل العلم.`,
      `عرض القدوة العملية فيه من سيرة النبي ﷺ وأحوال السلف.`
    ];
    o.push(kind === 'dars' ? 'تحويل الدرس إلى خطوات عملية يطبقها الحاضر في يومه.' : 'الخروج بعمل واحد على الأقل يطبقه السامع من يومه.');
    return o;
  }
  function results(T, pol) {
    return pol === '-' ? [
      `أن ${T} مما ذمه الشرع وتوعّد عليه، كما دلت عليه النصوص المذكورة.`,
      `أن العلم بحكمه وأسبابه سبيل إلى اجتنابه.`,
      `أن باب التوبة مفتوح، وأن ترك الذنب لله يُعقب خيراً منه.`,
      `ضرورة المبادرة إلى العمل بما سُمع، وعدم الاكتفاء بالسماع.`
    ] : [
      `عِظَم شأن ${T} في الشرع، ودلالة الكتاب والسنة عليه.`,
      `أن العلم بأحكامه طريق إلى العمل الصحيح المقبول.`,
      `أن في سيرة النبي ﷺ وأصحابه القدوة العملية فيه.`,
      `ضرورة المبادرة إلى العمل بما سُمع، وعدم الاكتفاء بالسماع.`
    ];
  }
  const ORD = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً', 'سادساً', 'سابعاً'];

  async function build(st) {
    const { T, kind, sel, data } = st;
    const pol = (data.theme || {}).pol || '+';
    const B = []; // كتل: { h, p, ref, cls }
    const H = (h, lvl) => B.push({ h, lvl: lvl || 2 });
    const P = (p, ref, cls) => B.push({ p, ref, cls });
    const L = arr => B.push({ list: arr });
    const ayat = data.out.ayah.filter((g, i) => sel.ayah.has(i));
    const hads = data.out.hadith.filter((h, i) => sel.hadith.has(i));
    const fiqh = data.out.fiqh.filter((x, i) => sel.fiqh.has(i));
    const qaw = data.out.qaida.filter((x, i) => sel.qaida.has(i));
    const evs = data.out.event.filter((x, i) => sel.event.has(i));

    const els = [];
    if (ayat.length) els.push(`${T} في كتاب الله`);
    if (hads.length) els.push(`${T} في السنة النبوية`);
    if (fiqh.length || qaw.length) els.push('أحكام ومسائل');
    if (evs.length) els.push('من السيرة والتاريخ');
    els.push(pol === '-' ? 'أسباب الوقوع فيه وسبل العلاج' : 'وسائل عملية للتطبيق');
    els.push('الثمرات والنتائج');

    B.push({ title: (kind === 'jumua' ? 'خطبة: ' : kind === 'dars' ? 'درس: ' : 'موعظة: ') + T });
    H('الأهداف'); L(objectives(T, pol, kind));
    H('العناصر'); L(els.map((e, i) => ORD[i] + ': ' + e));

    H(kind === 'jumua' ? 'الخطبة الأولى' : 'المقدمة');
    if (kind !== 'mawiza') {
      P(HAJA, HAJA_REF);
      const hj = await ayahGroup(AYAT_HAJA);
      if (hj.length === 4) { P(ayahCite([hj[0]])); P(ayahCite([hj[1]])); P(ayahCite([hj[2], hj[3]])); }
      P(AMMA, AMMA_REF);
    } else P('الحمد لله، والصلاة والسلام على رسول الله، وعلى آله وصحبه ومن والاه، أما بعد:');
    P(pol === '-'
      ? `عبادَ الله، حديثُنا اليوم عن ${T}؛ آفةٍ حذّر منها كتابُ ربنا وسنةُ نبينا ﷺ، نتعرف على خطرها، وحكمها، وسبيل النجاة منها. [✎ مهّد بمثال من واقع الناس]`
      : `عبادَ الله، حديثُنا اليوم عن ${T}؛ وهو من الموضوعات التي عُني بها كتابُ ربنا وسنةُ نبينا ﷺ، نتعرف على منزلته، وفضله، وأحكامه، وكيف نعيشه واقعاً. [✎ مهّد بمثال من واقع الناس]`, '', 'edit');

    let n = 0;
    if (ayat.length) {
      H(ORD[n++] + ': ' + els[n - 1], 3);
      P('قال الله تعالى:');
      let tf = 0;
      for (const g of ayat) {
        P(ayahCite(g), '', 'ayah');
        if (kind !== 'mawiza' && tf < 3) { const t = await tafsirNote(g[0]); if (t) { tf++; P(t.by + ': ' + t.s, '', 'tafsir'); } }
      }
    }
    if (hads.length) {
      H(ORD[n++] + ': ' + els[n - 1], 3);
      for (const h of hads) P('«' + h.text + '»', h.g.label + ' (' + hnum(h.it) + ')' + (h.g.grade ? ' — ' + h.g.grade : '') + (h.g.review ? ' — [✎ راجع درجته]' : ''), 'hadith');
    }
    if (fiqh.length || qaw.length) {
      H(ORD[n++] + ': ' + els[n - 1], 3);
      for (const f of fiqh) P('• ' + f.title + ': ' + clean(f.summary || f.jumhur || ''), '', '');
      for (const qd of qaw) P('• قاعدة: «' + qd.title + '»' + (qd.text ? ' — ' + clean(qd.text).slice(0, 260) : ''), qd.source || '', '');
    }
    if (evs.length) {
      H(ORD[n++] + ': ' + els[n - 1], 3);
      for (const e of evs) P('• ' + APP.titleOf(e) + ': ' + clean(e.summary || e.text || '').slice(0, 320), '', '');
    }
    H(ORD[n++] + ': ' + els[n - 1], 3);
    P(pol === '-' ? '[✎ اذكر أسباباً واقعية للوقوع فيه، ثم علاجاً من الكتاب والسنة لكل سبب]' : '[✎ اكتب ثلاث وسائل عملية تناسب جمهورك، مثل: ورد يومي، صحبة صالحة، محاسبة النفس]', '', 'edit');

    if (kind === 'jumua') {
      P('أقولُ قولي هذا، وأستغفرُ اللهَ العظيمَ لي ولكم، فاستغفروه إنه هو الغفور الرحيم.');
      H('الخطبة الثانية');
      P('الحمدُ لله على إحسانه، والشكرُ له على توفيقه وامتنانه، وأشهدُ أن لا إله إلا اللهُ وحده لا شريك له، وأشهدُ أنَّ محمداً عبدُه ورسولُه، صلى الله عليه وعلى آله وصحبه وسلم تسليماً كثيراً. أما بعد:');
    }
    H((kind === 'jumua' ? '' : ORD[n++] + ': ') + 'الثمرات والنتائج', 3);
    L(results(T, pol));
    H('الخاتمة', 3);
    if (kind !== 'mawiza') {
      const [sa] = await ayahGroup([AYAH_SALAH]);
      if (sa) { P('ثم صلُّوا وسلِّموا على من أمركم الله بالصلاة والسلام عليه، فقال:'); P(ayahCite([sa]), '', 'ayah'); }
      P(SALAT, SALAT_REF);
    }
    const du = await ayahGroup(AYAT_DUA);
    du.forEach(a => P(ayahCite([a]), '', 'ayah'));
    P(DUA_MUSLIM, DUA_MUSLIM_REF);
    P('[✎ أضف دعاءً مناسباً لموضوع ' + T + ']', '', 'edit');
    if (kind === 'jumua') {
      const [en] = await ayahGroup([AYAH_END]);
      if (en) { P('عبادَ الله:'); P(ayahCite([en]), '', 'ayah'); }
      P('فاذكروا الله يذكركم، واشكروه على نعمه يزدكم، ولذكرُ الله أكبر، والله يعلم ما تصنعون.');
    }
    return B;
  }

  const toHtml = B => B.map(b => b.title ? `<h1 class="kb-t">${esc(b.title)}</h1>`
    : b.h ? `<h${b.lvl}>${esc(b.h)}</h${b.lvl}>`
    : b.list ? '<ul>' + b.list.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>'
    : `<p class="${b.cls || ''}">${esc(b.p)}${b.ref ? ` <small class="kb-ref">[${esc(b.ref)}]</small>` : ''}</p>`).join('');
  const docText = el => {
    const out = [];
    el.querySelectorAll('h1,h2,h3,p,li').forEach(x => out.push((x.tagName === 'LI' ? '- ' : x.tagName[0] === 'H' ? '\n' : '') + x.innerText.trim()));
    return out.join('\n').trim();
  };

  // ===== الشاشة =====
  V.khutba = async (el, _, p) => {
    const T = (p.q || '').trim();
    const kind = KIND[p.kind] ? p.kind : 'jumua';
    const size = SIZE[p.len] ? p.len : 'mid';
    const saved = (() => { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } })();
    const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('');
    el.innerHTML = `<h1>🎤 مُعين الخطيب والداعية</h1>
      <div class="sub">اكتب موضوع الخطبة أو الدرس، فيُجهّز لك هيكلاً مرتباً: الأهداف، والعناصر، والأدلة من القرآن والسنة الصحيحة بتوثيقها، والأحكام، والنتائج، والخاتمة والدعاء. ثم عدّل النص كما تشاء واطبعه أو صدّره إلى Word.</div>
      <form id="kbF" class="filters">
        <input type="text" name="q" value="${esc(T)}" placeholder="الموضوع: مثل الصبر، بر الوالدين، التوبة، الأمانة…" style="flex:1;min-width:240px;font-size:16px">
        <select name="kind">${opt(KIND, kind)}</select>
        <select name="len">${opt({ short: 'قصيرة (10 دقائق)', mid: 'متوسطة (20 دقيقة)', long: 'مطولة (30 دقيقة فأكثر)' }, size)}</select>
        <button class="btn primary">جهّز</button>
      </form>
      <div id="kbR"></div>`;
    $('#kbF').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); const q = (f.get('q') || '').trim(); if (q) location.hash = '#/khutba?' + new URLSearchParams({ q, kind: f.get('kind'), len: f.get('len') }); };
    const box = $('#kbR');
    if (!T) {
      const ex = ['الصبر', 'بر الوالدين', 'التوبة', 'الأمانة', 'صلة الرحم', 'الغيبة والنميمة', 'حسن الخلق', 'الصلاة', 'الظلم', 'الشكر', 'التوكل على الله', 'تربية الأبناء'];
      box.innerHTML = `<h2>موضوعات مقترحة</h2><div class="row" style="flex-wrap:wrap;gap:6px">${ex.map(x => `<a class="btn sm" href="#/khutba?q=${encodeURIComponent(x)}&kind=${kind}&len=${size}">${x}</a>`).join('')}</div>
        ${saved.length ? `<h2>خطبي ودروسي المحفوظة</h2>${saved.map((s, i) => `<div class="card row"><b>${esc(s.title)}</b><small class="muted">${new Date(s.at).toLocaleDateString('ar')}</small><span class="spacer"></span><button class="btn sm" data-open="${i}">فتح</button><button class="btn sm" data-del="${i}">حذف</button></div>`).join('')}` : ''}
        <div class="warn" style="font-size:13px;margin-top:12px">الأدلة تُجلب من كتب المكتبة المثبتة بأرقامها، ولا يُدرج من الأحاديث إلا ما في الصحيحين أو ما حكم عليه أهل الحديث بالصحة أو الحسن. والعبارات الرابطة قوالب مقترحة؛ فراجع الخطبة وعدّلها قبل إلقائها. ولأوسع نتائج ثبّت كتب التفسير والشروح من <a href="#/library">المكتبة</a>.</div>`;
      box.querySelectorAll('[data-open]').forEach(b => b.onclick = () => showSaved(saved[+b.dataset.open]));
      box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { saved.splice(+b.dataset.del, 1); localStorage.setItem(LS, JSON.stringify(saved)); APP.rerender(); });
      return;
    }
    box.innerHTML = '<div class="muted">جارٍ جمع الأدلة من المكتبة… (أول مرة تأخذ ثوانٍ)</div>';
    const data = await gather(T, SIZE[size]);
    const n = SIZE[size];
    const st = {
      T, kind, data,
      sel: { ayah: new Set([...Array(Math.min(n, data.out.ayah.length)).keys()]), hadith: new Set([...Array(Math.min(n + 1, data.out.hadith.length)).keys()]), fiqh: new Set(kind === 'mawiza' ? [] : [0].filter(i => data.out.fiqh.length > i)), qaida: new Set(), event: new Set(kind === 'mawiza' ? [] : [0].filter(i => data.out.event.length > i)) }
    };
    const cnt = data.out.ayah.length + data.out.hadith.length;
    const pick = (k, title, label) => data.out[k].length ? `<details ${k === 'ayah' || k === 'hadith' ? 'open' : ''}><summary><b>${title}</b> <small class="muted">(${data.out[k].length})</small></summary>${data.out[k].map((x, i) => `<label class="kb-pick"><input type="checkbox" data-k="${k}" data-i="${i}" ${st.sel[k].has(i) ? 'checked' : ''}> <span>${label(x)}</span></label>`).join('')}</details>` : '';
    box.innerHTML = (cnt ? '' : `<div class="warn">لم يُعثر على نصوص كافية بهذه الكلمات. جرّب كلمة أدق أو أقصر (مثل «الصبر» بدل «الصبر على البلاء في زماننا»)، أو ثبّت مزيداً من الكتب.</div>`) + `
      <div class="kb-wrap">
        <aside class="kb-side card">
          <div class="muted" style="font-size:13px">اختر الأدلة التي تريدها، فتُرتّب في الخطبة تلقائياً:</div>
          ${pick('ayah', '📖 الآيات', g => esc(AR.SURAHS[g[0].surah - 1] + ' ' + g[0].ayah + (g.length > 1 ? '–' + g[g.length - 1].ayah : '') + ': ' + g.map(a => a.text).join(' ').slice(0, 90)) + '…')}
          ${pick('hadith', '📜 الأحاديث', h => esc(h.text.slice(0, 110)) + '… <small class="muted">' + esc(h.g.label + ' ' + hnum(h.it)) + '</small>')}
          ${pick('fiqh', '⚖️ المسائل الفقهية', f => esc(f.title))}
          ${pick('qaida', '🧩 القواعد', f => esc(f.title))}
          ${pick('event', '🕌 من السيرة', e => esc(APP.titleOf(e)))}
          <a class="btn sm" href="#/ask?q=${encodeURIComponent(T)}">كل ما في المكتبة عن الموضوع</a>
        </aside>
        <div class="kb-main">
          <div class="row kb-tools" style="flex-wrap:wrap;gap:6px">
            <button class="btn sm" id="kbCopy">📋 نسخ</button><button class="btn sm primary" id="kbWord">📄 Word</button><button class="btn sm primary" id="kbPdf">📥 PDF</button><button class="btn sm" id="kbPrint">🖨 طباعة</button><button class="btn sm" id="kbSave">💾 حفظ</button>${window.TTS ? '<button class="btn sm" id="kbRead">🔊 استماع</button>' : ''}
            <span class="muted" style="font-size:12px">النص قابل للتعديل مباشرة — ما بين [✎ …] أماكن تكملها أنت.</span>
          </div>
          <article id="kbDoc" class="kb-doc" contenteditable="true" spellcheck="false"><div class="muted">جارٍ التجهيز…</div></article>
        </div>
      </div>`;
    const doc = $('#kbDoc');
    let edited = false; doc.oninput = () => { edited = true; };
    const render = async () => { doc.innerHTML = toHtml(await build(st)); edited = false; };
    await render();
    box.querySelectorAll('.kb-pick input').forEach(c => c.onchange = async () => {
      if (edited && !confirm('تغيير الأدلة يعيد بناء النص وتضيع تعديلاتك عليه. متابعة؟')) { c.checked = !c.checked; return; }
      const s = st.sel[c.dataset.k]; c.checked ? s.add(+c.dataset.i) : s.delete(+c.dataset.i); await render();
    });
    wireTools(doc, () => (doc.querySelector('h1') || {}).innerText || T);
  };

  // كتل المستند من النص المعروض (بعد تعديل الخطيب)
  function blocksOf(doc) {
    const out = [];
    doc.querySelectorAll('h1,h2,h3,p,li').forEach(e => {
      const refEl = e.querySelector('.kb-ref');
      const ref = refEl ? refEl.innerText.replace(/^\[|\]$/g, '').trim() : '';
      const c = e.cloneNode(true); const r = c.querySelector('.kb-ref'); if (r) r.remove();
      const text = c.innerText.trim(); if (!text) return;
      const kind = e.tagName === 'H1' ? 'title' : e.tagName === 'H2' ? 'h2' : e.tagName === 'H3' ? 'h3' : e.tagName === 'LI' ? 'li' : (['ayah', 'hadith', 'tafsir', 'edit'].find(k => e.classList.contains(k)) || 'p');
      out.push({ text, ref, kind });
    });
    return out;
  }
  const printHtml = (doc, title) => `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    @page{size:A4;margin:18mm 16mm}body{font-family:'Traditional Arabic','Amiri','Noto Naskh Arabic','Simplified Arabic',serif;font-size:15pt;line-height:1.9;direction:rtl;color:#111}
    h1{color:#14532d;text-align:center;font-size:22pt;margin:0 0 10px}h2{color:#14532d;border-bottom:1px solid #a16207;font-size:17pt;margin:18px 0 8px}h3{color:#a16207;font-size:16pt;margin:14px 0 6px}
    p{margin:6px 0;text-align:justify}.ayah{color:#14532d;font-size:16.5pt}.hadith{color:#3b2a06}.tafsir{color:#555;font-size:13pt;border-right:3px solid #a16207;padding-right:8px}.edit{color:#b45309}.kb-ref{color:#777;font-size:10.5pt}
    ul{margin:4px 0;padding-right:22px}h2,h3{page-break-after:avoid}p{page-break-inside:avoid}
    </style></head><body>${doc.innerHTML}<p style="font-size:9pt;color:#999;margin-top:20px;text-align:center">أُعدّت بمُعين الخطيب — تطبيق نبراس</p></body></html>`;
  const fileName = t => (t || 'خطبة').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 80);

  function wireTools(doc, titleFn) {
    $('#kbCopy').onclick = () => APP.copy(docText(doc));
    $('#kbWord').onclick = () => {
      try { APP.download(fileName(titleFn()) + '.docx', DOCX.build(blocksOf(doc)), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); }
      catch (e) { APP.toast('تعذّر إنشاء ملف Word: ' + e.message); }
    };
    $('#kbPdf').onclick = async () => {
      const btn = $('#kbPdf'), old = btn.textContent; btn.disabled = true; btn.textContent = '⏳ جارٍ إنشاء PDF…';
      try { const blob = await PDFGEN.fromBlocks(blocksOf(doc), titleFn()); APP.download(fileName(titleFn()) + '.pdf', blob, 'application/pdf'); }
      catch (e) { APP.toast('تعذّر إنشاء PDF: ' + (e.message || e)); }
      btn.disabled = false; btn.textContent = old;
    };
    $('#kbPrint').onclick = async () => {
      if (window.NATIVE_FILE) {
        try { await window.NATIVE_FILE.print(printHtml(doc, titleFn()), fileName(titleFn())); } catch (e) { APP.toast('تعذّرت الطباعة: ' + (e.message || e)); }
        return;
      }
      // المتصفح (جوال أو كمبيوتر): طباعة الصفحة نفسها مع إخفاء كل شيء عدا الخطبة
      document.body.classList.add('kb-printing');
      const off = () => document.body.classList.remove('kb-printing');
      window.addEventListener('afterprint', off, { once: true });
      setTimeout(() => { try { window.print(); } catch (e) { APP.toast('المتصفح لا يدعم الطباعة — استعمل زر PDF'); } setTimeout(off, 1500); }, 50);
    };
    $('#kbSave').onclick = () => {
      let s = []; try { s = JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { }
      const title = titleFn(); const i = s.findIndex(x => x.title === title);
      const rec = { title, html: doc.innerHTML, at: new Date().toISOString() };
      if (i >= 0) s[i] = rec; else s.unshift(rec);
      try { localStorage.setItem(LS, JSON.stringify(s.slice(0, 50))); APP.toast('حُفظت في «خطبي ودروسي المحفوظة»'); } catch (e) { APP.toast('تعذّر الحفظ: المساحة ممتلئة'); }
    };
    const rd = $('#kbRead'); if (rd) rd.onclick = () => window.TTS.read(docText(doc));
  }

  function showSaved(s) {
    const box = $('#kbR');
    box.innerHTML = `<div class="kb-main"><div class="row kb-tools" style="flex-wrap:wrap;gap:6px"><a class="btn sm" href="#/khutba">← رجوع</a><button class="btn sm" id="kbCopy">📋 نسخ</button><button class="btn sm primary" id="kbWord">📄 Word</button><button class="btn sm primary" id="kbPdf">📥 PDF</button><button class="btn sm" id="kbPrint">🖨 طباعة</button><button class="btn sm" id="kbSave">💾 حفظ التعديلات</button>${window.TTS ? '<button class="btn sm" id="kbRead">🔊 استماع</button>' : ''}</div>
      <article id="kbDoc" class="kb-doc" contenteditable="true" spellcheck="false">${s.html}</article></div>`;
    wireTools($('#kbDoc'), () => s.title);
  }

  window.KHUTBA = { gather, build, hadithText, themeOf };
})();
