/* عينة السيرة والتاريخ وسير الصحابة — غير مراجعة، للعرض فقط.
   السنة: موجبة = بعد الهجرة، سالبة = قبل الهجرة (‑13 = سنة البعثة). */
(function () {
  const D = window.SAMPLE_DATA;
  D.books.push(
    { id: 'sira', title: 'السيرة النبوية وتاريخ الخلفاء', type: 'sira', author: 'تجميع من كتب السيرة (ابن هشام، زاد المعاد، البداية والنهاية)', sample: true },
    { id: 'sahaba', title: 'سير الصحابة', type: 'sahaba', author: 'تجميع (الإصابة، أسد الغابة، سير أعلام النبلاء)', sample: true }
  );
  const ev = (id, o) => D.items.push(Object.assign({ id: 'sira:' + id, bookId: 'sira', type: 'event' }, o));

  ev('bitha', { title: 'البعثة النبوية ونزول الوحي', year: -13, month: 'رمضان', place: 'غار حراء — مكة', era: 'العهد المكي', category: 'حدث',
    summary: 'نزول أول الوحي على النبي ﷺ في غار حراء وهو ابن أربعين سنة، بقوله تعالى: اقرأ باسم ربك الذي خلق.', causes: [], events: ['نزول جبريل بأول سورة العلق', 'رجوعه ﷺ إلى خديجة رضي الله عنها', 'ذهابها به إلى ورقة بن نوفل'], results: ['بداية الدعوة السرية'], parties: ['sahabi:abubakr'], relatedHadith: ['bukhari:1'], sources: ['صحيح البخاري — كتاب بدء الوحي', 'سيرة ابن هشام'] });
  ev('hijra', { title: 'الهجرة النبوية إلى المدينة', year: 1, month: 'ربيع الأول', place: 'من مكة إلى المدينة', era: 'العهد المدني', category: 'حدث',
    summary: 'هاجر النبي ﷺ مع أبي بكر الصديق إلى المدينة، فكانت بداية الدولة الإسلامية، واتُّخذت بعدُ مبدأً للتاريخ الهجري في عهد عمر.', causes: ['اشتداد أذى قريش', 'بيعة العقبة الثانية'], events: ['المكث في غار ثور ثلاث ليال', 'النزول بقباء وبناء مسجدها', 'بناء المسجد النبوي', 'المؤاخاة بين المهاجرين والأنصار'], results: ['قيام المجتمع المسلم في المدينة'], parties: ['sahabi:abubakr'], sources: ['سيرة ابن هشام', 'زاد المعاد'] });
  ev('badr', { title: 'غزوة بدر الكبرى', year: 2, month: 'رمضان (17)', place: 'بدر — جنوب غرب المدينة', era: 'العهد المدني', category: 'غزوة',
    summary: 'أول مواجهة كبرى بين المسلمين وقريش، سمّاها الله يوم الفرقان، وانتهت بنصر المسلمين.', forces: { muslims: 'نحو 313 إلى 317', enemy: 'نحو 950 إلى 1000' },
    causes: ['الخروج لاعتراض عير قريش القادمة من الشام بقيادة أبي سفيان', 'نجاة العير وإصرار أبي جهل على القتال'],
    events: ['مشاورة النبي ﷺ أصحابه', 'نزول المسلمين على ماء بدر بمشورة الحباب بن المنذر', 'المبارزة في أول القتال', 'إمداد الله المؤمنين بالملائكة'],
    results: ['قُتل من المشركين سبعون وأُسر سبعون', 'استُشهد من المسلمين أربعة عشر', 'مقتل أبي جهل'], parties: ['sahabi:abubakr', 'sahabi:umar'], sources: ['سيرة ابن هشام', 'صحيح البخاري — كتاب المغازي', 'سورة الأنفال'] });
  ev('qibla', { title: 'تحويل القبلة إلى الكعبة', year: 2, month: 'رجب أو شعبان (على خلاف)', place: 'المدينة', era: 'العهد المدني', category: 'تشريع',
    summary: 'تحولت القبلة من بيت المقدس إلى الكعبة بعد نحو ستة عشر أو سبعة عشر شهراً من الهجرة.', events: ['نزول قوله تعالى: قد نرى تقلب وجهك في السماء'], results: [], parties: [], sources: ['صحيح البخاري — كتاب الصلاة'] });
  ev('uhud', { title: 'غزوة أحد', year: 3, month: 'شوال', place: 'جبل أحد — شمال المدينة', era: 'العهد المدني', category: 'غزوة',
    summary: 'خرجت قريش للثأر لبدر، وكانت الدائرة أولاً للمسلمين، ثم انقلبت لما ترك الرماة مواقعهم.', forces: { muslims: 'نحو 700 بعد انسحاب عبد الله بن أبي بنحو ثلث الجيش', enemy: 'نحو 3000' },
    causes: ['رغبة قريش في الثأر لقتلى بدر'], events: ['انسحاب المنافقين', 'وضع خمسين رامياً على جبل الرماة', 'مخالفة أكثر الرماة الأمر', 'التفاف خالد بن الوليد — ولم يكن أسلم بعد'],
    results: ['استُشهد نحو سبعين من المسلمين منهم حمزة بن عبد المطلب', 'دروس في طاعة القيادة'], parties: ['sahabi:abubakr', 'sahabi:umar'], sources: ['سيرة ابن هشام', 'سورة آل عمران'] });
  ev('khandaq', { title: 'غزوة الخندق (الأحزاب)', year: 5, month: 'شوال (وقيل سنة 4)', place: 'المدينة', era: 'العهد المدني', category: 'غزوة',
    summary: 'تحزبت قريش وغطفان وحلفاؤهما على المدينة، فحفر المسلمون الخندق بمشورة سلمان الفارسي، ورد الله الأحزاب بالريح.', forces: { muslims: 'نحو 3000', enemy: 'نحو 10000' },
    causes: ['تحريض يهود بني النضير للقبائل'], events: ['حفر الخندق', 'نقض بني قريظة العهد', 'حصار نحو شهر', 'إرسال الريح على الأحزاب'], results: ['انصراف الأحزاب', 'غزوة بني قريظة بعدها'], parties: [], sources: ['سورة الأحزاب', 'صحيح البخاري — كتاب المغازي'] });
  ev('hudaybiyah', { title: 'صلح الحديبية', year: 6, month: 'ذو القعدة', place: 'الحديبية — قرب مكة', era: 'العهد المدني', category: 'صلح',
    summary: 'خرج النبي ﷺ معتمراً فصدته قريش، فعُقد صلح لعشر سنين، وسماه الله فتحاً مبيناً.', forces: { muslims: 'نحو 1400' },
    events: ['بيعة الرضوان', 'كتابة شروط الصلح'], results: ['هدنة عشر سنين', 'انتشار الإسلام في فترة الهدنة'], parties: ['sahabi:umar', 'sahabi:abubakr'], sources: ['صحيح البخاري — كتاب الشروط', 'سورة الفتح'] });
  ev('khaybar', { title: 'غزوة خيبر', year: 7, month: 'محرم', place: 'خيبر — شمال المدينة', era: 'العهد المدني', category: 'غزوة', summary: 'فتح حصون خيبر.', events: ['حصار الحصون وفتحها'], results: ['فتح خيبر'], parties: [], sources: ['صحيح البخاري — كتاب المغازي'] });
  ev('fathmakkah', { title: 'فتح مكة', year: 8, month: 'رمضان', place: 'مكة', era: 'العهد المدني', category: 'غزوة', summary: 'دخل النبي ﷺ مكة فاتحاً بعد نقض قريش للعهد، وعفا عن أهلها.', forces: { muslims: 'نحو 10000' }, causes: ['نقض قريش صلح الحديبية بإعانة بني بكر على خزاعة'], events: ['دخول مكة', 'تطهير الكعبة من الأصنام'], results: ['دخول الناس في دين الله أفواجاً'], parties: ['sahabi:abubakr', 'sahabi:umar'], sources: ['سيرة ابن هشام', 'سورة النصر'] });
  ev('hunayn', { title: 'غزوة حنين', year: 8, month: 'شوال', place: 'وادي حنين', era: 'العهد المدني', category: 'غزوة', summary: 'قاتل المسلمون هوازن وثقيفاً، وانهزموا أول الأمر ثم كان النصر.', forces: { muslims: 'نحو 12000' }, events: [], results: ['النصر وغنائم كثيرة'], parties: [], sources: ['سورة التوبة'] });
  ev('tabuk', { title: 'غزوة تبوك (العسرة)', year: 9, month: 'رجب', place: 'تبوك — شمال الجزيرة', era: 'العهد المدني', category: 'غزوة', summary: 'خرج النبي ﷺ لملاقاة الروم في شدة الحر والعسرة، ولم يقع قتال.', forces: { muslims: 'نحو 30000' }, events: ['تجهيز جيش العسرة', 'تخلف الثلاثة الذين خُلّفوا'], results: [], parties: [], sources: ['سورة التوبة', 'صحيح البخاري — حديث كعب بن مالك'] });
  ev('wada', { title: 'حجة الوداع', year: 10, month: 'ذو الحجة', place: 'مكة وعرفات', era: 'العهد المدني', category: 'حدث', summary: 'الحجة الوحيدة للنبي ﷺ بعد الهجرة، وخطب فيها خطبته الجامعة.', events: ['خطبة عرفة'], results: [], parties: [], sources: ['صحيح مسلم — حديث جابر الطويل'] });
  ev('wafat', { title: 'وفاة النبي ﷺ', year: 11, month: 'ربيع الأول', place: 'المدينة', era: 'العهد المدني', category: 'وفاة', summary: 'توفي النبي ﷺ وله ثلاث وستون سنة.', events: [], results: ['بيعة أبي بكر بالخلافة'], parties: ['sahabi:abubakr', 'sahabi:umar'], sources: ['صحيح البخاري'] });
  ev('khilafa-abubakr', { title: 'خلافة أبي بكر الصديق وحروب الردة', year: 11, month: '', place: 'المدينة', era: 'الخلافة الراشدة', category: 'خلافة', summary: 'بويع أبو بكر بالخلافة في سقيفة بني ساعدة، وقاتل المرتدين ومانعي الزكاة.', events: ['بيعة السقيفة', 'إنفاذ جيش أسامة', 'حروب الردة'], results: ['توحيد الجزيرة', 'جمع القرآن في عهده'], parties: ['sahabi:abubakr', 'sahabi:umar'], sources: ['البداية والنهاية'] });
  ev('khilafa-umar', { title: 'خلافة عمر بن الخطاب', year: 13, month: 'جمادى الآخرة', place: 'المدينة', era: 'الخلافة الراشدة', category: 'خلافة', summary: 'استخلفه أبو بكر، فاتسعت الفتوحات ودُوّنت الدواوين ووُضع التاريخ الهجري.', events: ['فتح الشام والعراق ومصر', 'تدوين الدواوين'], results: [], parties: ['sahabi:umar'], sources: ['البداية والنهاية'] });
  ev('yarmouk', { title: 'معركة اليرموك', year: 15, month: 'رجب (وقيل سنة 13)', place: 'اليرموك — الشام', era: 'الخلافة الراشدة', category: 'معركة', summary: 'معركة فاصلة بين المسلمين والروم انتهت بفتح الشام.', events: [], results: ['فتح الشام'], parties: [], sources: ['البداية والنهاية', 'تاريخ الطبري'] });
  ev('istishhad-umar', { title: 'استشهاد عمر وخلافة عثمان', year: 23, month: 'ذو الحجة', place: 'المدينة', era: 'الخلافة الراشدة', category: 'خلافة', summary: 'طُعن عمر وهو يصلي الفجر، وجعل الأمر شورى في ستة، فبويع عثمان بن عفان.', events: ['طعن عمر في صلاة الفجر', 'الشورى في الستة'], results: ['خلافة عثمان'], parties: ['sahabi:umar'], sources: ['صحيح البخاري — قصة البيعة'] });

  D.items.push(
    { id: 'sahabi:abubakr', bookId: 'sahaba', type: 'sahabi', title: 'أبو بكر الصديق رضي الله عنه', name: 'عبد الله بن عثمان (أبي قحافة) بن عامر التيمي القرشي',
      laqab: 'الصديق، العتيق', birth: 'بعد عام الفيل بنحو سنتين', islam: 'أول من أسلم من الرجال الأحرار', death: 'جمادى الآخرة 13هـ — وله 63 سنة',
      summary: 'صاحب رسول الله ﷺ في الغار وفي الهجرة، وأول الخلفاء الراشدين.', virtues: ['ثاني اثنين إذ هما في الغار', 'أمّه النبي ﷺ أن يصلي بالناس في مرضه', 'إنفاقه ماله في سبيل الله'], mashahid: ['شهد بدراً والمشاهد كلها'], khilafa: '11–13هـ', rawi: '', sources: ['الإصابة لابن حجر', 'سير أعلام النبلاء'] },
    { id: 'sahabi:umar', bookId: 'sahaba', type: 'sahabi', title: 'عمر بن الخطاب رضي الله عنه', name: 'عمر بن الخطاب بن نفيل العدوي القرشي',
      laqab: 'الفاروق، أمير المؤمنين', birth: 'بعد عام الفيل بنحو ثلاث عشرة سنة', islam: 'أسلم في مكة قبل الهجرة، فكان إسلامه عزاً للمسلمين', death: 'ذو الحجة 23هـ — شهيداً',
      summary: 'ثاني الخلفاء الراشدين، اتسعت في عهده الفتوحات وأسس كثيراً من نظم الدولة.', virtues: ['وافق القرآن في مواضع', 'شهد له النبي ﷺ بالجنة'], mashahid: ['شهد بدراً والمشاهد كلها'], khilafa: '13–23هـ', rawi: 'rawi:umar', sources: ['الإصابة لابن حجر', 'سير أعلام النبلاء'] }
  );

  // رفوف كتب إضافية (فارغة حتى الاستيراد)
  D.books.push(
    { id: 'tafsir-tabari', title: 'جامع البيان (تفسير الطبري)', type: 'tafsir', author: 'ابن جرير الطبري', linkedTo: 'quran', shelf: true },
    { id: 'tafsir-qurtubi', title: 'الجامع لأحكام القرآن', type: 'tafsir', author: 'القرطبي', linkedTo: 'quran', shelf: true },
    { id: 'tafsir-saadi', title: 'تيسير الكريم الرحمن', type: 'tafsir', author: 'السعدي', linkedTo: 'quran', shelf: true },
    { id: 'ahkam-jassas', title: 'أحكام القرآن', type: 'tafsir', author: 'الجصاص', linkedTo: 'quran', shelf: true },
    { id: 'ahkam-ibnalarabi', title: 'أحكام القرآن', type: 'tafsir', author: 'ابن العربي', linkedTo: 'quran', shelf: true },
    { id: 'abudawud', title: 'سنن أبي داود', type: 'hadith', author: 'أبو داود السجستاني', shelf: true },
    { id: 'tirmidhi', title: 'جامع الترمذي', type: 'hadith', author: 'الترمذي', shelf: true },
    { id: 'nasai', title: 'سنن النسائي', type: 'hadith', author: 'النسائي', shelf: true },
    { id: 'sharh-nawawi', title: 'المنهاج شرح صحيح مسلم', type: 'sharh', author: 'النووي', linkedTo: 'muslim', shelf: true },
    { id: 'awn', title: 'عون المعبود', type: 'sharh', author: 'العظيم آبادي', linkedTo: 'abudawud', shelf: true },
    { id: 'tuhfa', title: 'تحفة الأحوذي', type: 'sharh', author: 'المباركفوري', linkedTo: 'tirmidhi', shelf: true },
    { id: 'sindi-nasai', title: 'حاشية السندي على النسائي', type: 'sharh', author: 'السندي', linkedTo: 'nasai', shelf: true },
    { id: 'sindi-ibnmajah', title: 'حاشية السندي على ابن ماجه', type: 'sharh', author: 'السندي', linkedTo: 'ibnmajah', shelf: true },
    { id: 'bidayat', title: 'بداية المجتهد ونهاية المقتصد', type: 'fiqhbook', author: 'ابن رشد', shelf: true },
    { id: 'mughni', title: 'المغني', type: 'fiqhbook', author: 'ابن قدامة', shelf: true },
    { id: 'muhalla', title: 'المحلى', type: 'fiqhbook', author: 'ابن حزم', shelf: true },
    { id: 'fiqhsunnah', title: 'فقه السنة', type: 'fiqhbook', author: 'سيد سابق', shelf: true, rights: 'كتاب حديث — يلزم إذن الناشر قبل التضمين' },
    { id: 'ibnhisham', title: 'السيرة النبوية', type: 'sirabook', author: 'ابن هشام', shelf: true },
    { id: 'zad', title: 'زاد المعاد', type: 'sirabook', author: 'ابن القيم', shelf: true },
    { id: 'bidaya-nihaya', title: 'البداية والنهاية', type: 'sirabook', author: 'ابن كثير', shelf: true },
    { id: 'isaba', title: 'الإصابة في تمييز الصحابة', type: 'sirabook', author: 'ابن حجر', shelf: true }
  );
})();
