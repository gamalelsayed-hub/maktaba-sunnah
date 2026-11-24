/* 🎙️ استوديو التسجيل + شاشة البداية (اختيار الفئة) */
(() => {
  const V = APP.views, esc = LEARN.esc, AD = LEARN.AD;


  window.START_HELP = {
    '#/': ['🕌 زاد الأسرة', 'القسم العام لكل فرد في البيت: عبادتك اليومية والقرآن والمكتبة كاملة.', ['صفحة «اليوم»: مواقيت الصلاة، وورد اليوم، وأذكار الصباح والمساء.', 'المصحف: قراءة واستماع وتفسير، واضغط أي آية لترى تفسيرها وقراءاتها.', 'حفظي: خطة حفظ ومراجعة بالتكرار المتباعد.', 'المكتبة والبحث: ابحث بكلمة في القرآن والحديث والشروح والكتب.', 'فعّل الأذان والتنبيهات من الإعدادات.']],
    '#/parents': ['👨‍👩‍👧 زاد الوالدين', 'كل ما يحتاجه الوالدان: تربية الأبناء بمنهج موثق، وإدارة البيت، والمواريث.', ['التربية: برنامج حسب عمر الطفل، والوسائل، والأخطاء الشائعة، وحل المشكلات.', 'البيت: الحقوق الزوجية، والميزانية، والمشكلات الأسرية.', 'حاسبة المواريث: أدخل الورثة فتظهر الأنصبة مع الشرح.']],
    '#/literacy': ['✍️ زاد الكبار والأميين', 'لمن لا يقرأ ولا يكتب: يتعلم الحروف والكلمات خطوة بخطوة بالصوت والصورة.', ['ابدأ من الدرس الأول ولا تنتقل حتى تتقن.', 'اضغط على أي حرف أو كلمة لتسمعها.', 'جلسة قصيرة كل يوم أفضل من جلسة طويلة متقطعة.']],
    '#/rafiqa': ['🌸 زاد الرفيقة', 'للمرأة والفتاة: صحتها ودينها وحياتها، ويظهر لكل واحدة ما يناسبها حسب عمرها (فتاة/زوجة/أم).', ['دورتي: سجّلي الأيام فتعرفي الأحكام والطهارة والتوقعات.', 'تمارين مصورة بالحركة ومؤقت.', 'أحكامك وقدوتي ومكانتك: من الكتب المعتمدة.', 'يمكن تغيير الاختيار (فتاة/زوجة/أم) من رئيسية القسم.']],
    '#/rafiq': ['🧭 زاد الرفيق', 'للشباب: دينه وأخلاقه وجسمه ومستقبله.', ['لوحة «يومي»: صلواتك وأذكارك وتمرينك، وعدّاد أيام الثبات.', 'تماريني: برامج مصورة بالحركة ومؤقت، وحاسبة الوزن.', 'العفة، والشبهات والثبات، والصحبة، وبر الوالدين.']],
    '#/kids': ['🧒 زاد البراعم', 'للأطفال: يتعلمون باللعب والصوت والصورة.', ['الحروف والكلمات والقصص وجزء عمّ.', 'الأرقام والأشكال والألعاب.', 'أرسم وألوّن: دروس رسم خطوة بخطوة وصفحات تلوين.', 'ركن «للأهل» فيه حدّ الوقت اليومي ومتابعة التقدم.']],
    '#/ilm': ['📗 علوم الشريعة', 'كل العلوم الشرعية في مكان واحد: القرآن والقراءات، والحديث والمصطلح، والفقه وأصوله، والعقيدة، والتزكية، والمعاملات.', ['ابدأ بالمنهج المقترح في «طلب العلم» ثم تدرّج.', 'القراءات: كل قراءات الآية من الشاطبية والدرة والطيبة.', 'كل الأقوال والأحكام منسوبة إلى كتب المكتبة.']],
    '#/dawah': ['📣 الدعوة إلى الله', 'لتعرّف غيرك بالإسلام بالحكمة: لأهل الأديان، ولمن لا يؤمن بالله، وطرق الدعوة.', ['اختر الفئة ثم الموضوع، وكل نقطة لها دليلها من القرآن والسنة والكتب.', 'بطاقة التعريف بالإسلام جاهزة للنسخ والمشاركة.', 'ابدأ بفقه الدعوة: الأخلاق قبل الجدال.']],
    '#/wajib': ['📌 ما لا يسع المسلم جهله', 'العلم الذي يجب على كل مسلم: العقيدة والطهارة والصلاة والصيام والزكاة والحج والحلال والحرام والأخلاق، في دروس قصيرة جداً.', ['يصلك كل يوم إشعار بدرس جديد تقرؤه من الإشعار نفسه.', 'اضغط الإشعار لترى الدليل وتجيب عن سؤال قصير.', 'غيّر وقت الإشعار أو أوقفه من صفحة القسم.']],
    '#/usra': ['🏠 أسرتي', 'إدارة منظمة لكل أفراد الأسرة في مكان واحد.', ['أضف كل فرد باسمه ودوره وتاريخ ميلاده، فيُبنى له برنامج يومي حسب عمره (صلاة، قرآن، أذكار، مذاكرة، مهام).', 'للأبناء نجوم على كل مهمة يستبدلونها بمكافآت تحددونها، ويُقارن كل طفل بنفسه فقط.', 'صحة الأسرة: ملف صحي لكل فرد، وتذكير بالأدوية وزيارات التطعيم، وأرقام الطوارئ والإسعافات الأولية.', 'مجلس الأسرة الأسبوعي ببرنامج جاهز يتغير كل أسبوع، وصلة الرحم بتذكير دوري.', 'وضع الأطفال الآمن: رقم سري للخروج من قسم الأطفال، وحدّ يومي للاستخدام.']],
    '#/taqaddum': ['📊 تقدمي وشهاداتي', 'لوحة واحدة لكل مسارات الدروس في التطبيق.', ['ترى كم أنهيت من كل مسار، وزر «أكمل» يأخذك لأول درس لم تنهه.', 'إذا أتممت مساراً ظهر زر «🎓 الشهادة» فتكتب اسمك وتحفظها صورة.', 'ابحث في كل الدروس من مربع البحث، وتظهر نتائج الدروس أيضاً في البحث العام.', 'صدّر نسخة احتياطية واحفظها في Drive لتنقل تقدمك إلى جوال آخر.']],
    '#/usul': ['🧭 أصول العلوم', 'مفاتيح العلوم الشرعية في دروس مبسّطة على ترتيب المتون المعتمدة، مع الإحالة إلى مواضعها في الكتب.', ['اختر العلم: أصول الفقه، أو المصطلح، أو علوم القرآن، أو العقيدة، أو المذاهب، أو التزكية، أو المعاملات، أو الطب النبوي.', 'في كل درس فكرة مبسطة وقواعد وأمثلة واختبار قصير.', 'روابط «من المتون والشروح» تفتح الموضع في الكتاب، وتُحمَّل الكتب من داخل القسم.']],
    '#/lugha': ['🔤 علوم العربية', 'لتتعلم العربية من الصفر حتى الإتقان: النحو والإعراب، ثم الصرف والبلاغة والإملاء والعروض والخط، والشعر والأدب.', ['ابدأ «مسار النحو» من الدرس الأول، وفي آخر كل درس اختبار قصير.', '«مدرّب الإعراب»: تختار موقع كل كلمة وحكمها، فيصحّح لك ويشرح.', '«إعراب القرآن»: تدرّب على الفاتحة وقصار السور، وتحت كل آية في المصحف زر «إعراب الآية».', '«كيف أعرب؟»: أسئلة متتابعة توصلك لإعراب أي كلمة.']],
    '#/tarikh': ['🏛️ التاريخ والحضارة', 'تاريخ الأنبياء والأمم والدول من آدم عليه السلام إلى العصر الحديث، من كتب التاريخ المعروفة.', ['تصفح العصور بالترتيب، أو ابحث باسم دولة أو حقبة أو شخصية.', 'لكل عصر ملخص، وأحداث بارزة، وإحالة إلى مواضعها في الكتب.', 'ما اختلف فيه المؤرخون يُذكر الخلاف فيه.']],
    '#/adab': ['🪶 الشعر والأدب', 'الشعراء ودواوينهم وكتب الأدب في المكتبة.', ['ابحث ببيت أو كلمة أو اسم شاعر.', 'تصفح الشعراء حسب العصر: الجاهلي، والإسلامي، والعباسي، وما بعده.', 'مختارات في الحكمة والزهد والأخلاق.']],
  };
  // ===== شاشة البداية: من أنت؟ =====
  // أيقونات مرسومة موحّدة (خطوط بلون السمة)
  const ICO = {
    mosque: '<path d="M4 21h16M6 21V11M18 21V11M12 3c-3 2.5-6 4.5-6 8h12c0-3.5-3-5.5-6-8z"/><path d="M12 1.5v1.5M10 21v-4a2 2 0 014 0v4"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    parents: '<circle cx="8" cy="7" r="3"/><circle cx="16.5" cy="8.5" r="2.5"/><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M13 20c.3-2.7 1.8-4.5 3.5-4.5S20 17.3 21 20"/>',
    pen: '<path d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path d="M13.5 6.5l4 4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    flower: '<circle cx="12" cy="9" r="2.2"/><path d="M12 6.8c0-3 3.5-3 3.5-.3S12 9 12 9s-3.5-.2-3.5-2.5S12 3.8 12 6.8zM14.2 9c3 0 3 3.5.3 3.5S12 9 12 9M9.8 9c-3 0-3 3.5-.3 3.5S12 9 12 9"/><path d="M12 11.5V21M12 17c-2-2.5-5-2-5-2s.5 3 5 3M12 16c2-2 4.5-1.5 4.5-1.5s-.5 2.5-4.5 2.5"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 7 8 5 4 5c0 4 3 7 8 7zM12 14c0-4 3-6.5 7.5-6.5 0 4-3 6.5-7.5 6.5z"/><path d="M8 21h8"/>',
    book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
    columns: '<path d="M3 21h18M4 18h16M5 9h14M12 3L4 7.5h16z"/><path d="M7 9v9M12 9v9M17 9v9"/>',
    mega: '<path d="M3 10v4h3l7 4V6L6 10z"/><path d="M16.5 9a4 4 0 010 6M19 7a7 7 0 010 10"/>',
    pin: '<path d="M6 3h12v18l-6-4-6 4z"/><path d="M9.5 8.5h5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z"/>',
  };
  const ic = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`;
  window.SP_ICON = ic;
  const THEMES = [['emerald', 'زمردي', '#0d5c3f'], ['royal', 'كحلي ملكي', '#1e3a8a'], ['teal', 'فيروزي', '#0f5e66'], ['sand', 'رملي', '#7a4a1d'], ['ruby', 'عنّابي', '#6e1f30'], ['slate', 'رمادي فاخر', '#2f3b4c']];

  // أيام الاستخدام المتتالية
  function streak() {
    let a = []; try { a = JSON.parse(localStorage.getItem('open-days') || '[]'); } catch (e) { }
    const key = d => d.toISOString().slice(0, 10), t = key(new Date());
    if (a[a.length - 1] !== t) { a.push(t); a = a.slice(-400); try { localStorage.setItem('open-days', JSON.stringify(a)); } catch (e) { } }
    const set = new Set(a); let n = 0; const d = new Date();
    while (set.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const calm = () => document.body.classList.contains('no-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countTo(node, to, suffix = '') {
    if (!node) return; const dur = calm() ? 0 : 1100, t0 = performance.now();
    const st = t => { const p = dur ? Math.min(1, (t - t0) / dur) : 1; node.textContent = AD(Math.round(to * (1 - Math.pow(1 - p, 3)))) + suffix; if (p < 1) requestAnimationFrame(st); };
    requestAnimationFrame(st);
  }

  V.start = async el => {
    document.body.classList.add('learn-mode', 'sp-on'); document.body.classList.remove('learn-kids', 'learn-lit');
    const tab = (() => { try { return localStorage.getItem('sp-tab') || 'fam'; } catch (e) { return 'fam'; } })();
    const theme = (await DB.setting('theme')) || 'emerald', dark = !!(await DB.setting('dark'));
    let n = 0; const I = () => `style="--i:${n++}"`;
    const HU = { home: '#a3375c', parents: '#8a4a7a', pen: '#b7791f', book: '#0f7a55', abt: '#0f8088', columns: '#8a5a2b', mega: '#b7791f', pin: '#2f56a0', chart: '#5b6578' };
    const C = (aud, href, k, t, d, cls = '') => `<div class="sp-cw rv" ${I()}><a class="sp-card ${cls}" href="${href}" data-aud="${aud}"${HU[k] ? ` style="--hue:${HU[k]}"` : ''}><span class="sp-ic">${k === 'abt' ? '<span class="abc-ic">أ ب ت</span>' : ic(k)}</span><b>${t}</b><small>${d}</small></a><button class="sp-help" data-help="${href}" aria-label="كيف أستفيد">؟</button></div>`;
    const h = new Date().getHours(), morning = h >= 4 && h < 12;
    const st = streak();
    el.innerHTML = `<div class="sp sp2">
      <header class="sp-hero">
        <span class="sp-orb o1"></span><span class="sp-orb o2"></span><span class="sp-orb o3"></span>
        <div class="sp-themes" role="group" aria-label="ألوان التطبيق">
          ${THEMES.map(([k, t, c]) => `<button class="sp-dot ${!dark && theme === k ? 'on' : ''}" data-th="${k}" title="${t}" aria-label="${t}" style="--c:${c}"></button>`).join('')}
          <button class="sp-dot sp-night ${dark ? 'on' : ''}" data-dark="1" title="ليلي" aria-label="الوضع الليلي">${ic('moon')}</button>
        </div>
        <div class="sp-logo"><img src="icons/icon-192.png" alt=""></div>
        <h1>زاد <em>الأسرة المسلمة</em></h1>
        <div class="sp-motto">لكل فرد في البيت: دينه، وعلمه، وصحته، وحياته</div>
        <div class="sp-greet"><i></i><span id="spGreet">${morning ? 'صباح الخير' : 'مساء الخير'}</span></div>
      </header>
      <div class="sp-body">
        <div class="sp-cw rv" ${I()}><a class="sp-main" href="#/" data-aud="adult"><span class="sp-ic">${ic('mosque')}</span><div><b>زاد الأسرة</b><small>القرآن الكريم، والصلاة والأذان، والأذكار والأدعية، والرقية، والمكتبة كاملة</small></div><span class="sp-go"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></span></a><button class="sp-help" data-help="#/" aria-label="كيف أستفيد">؟</button></div>
        <a class="sp-today rv" ${I()} href="#/taqaddum">
          <div class="sp-ring"><svg viewBox="0 0 74 74"><defs><linearGradient id="spGG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--gold)"/><stop offset="1" stop-color="var(--gold2)"/></linearGradient></defs><circle class="bgc" cx="37" cy="37" r="32"/><circle class="fg" id="spRing" cx="37" cy="37" r="32"/></svg><span id="spPct">٠٪</span></div>
          <div class="sp-tdx"><h3>تقدّمك في الدروس</h3><p id="spTdP">كل خطوة تقرّبك، واصل ولو بدرس قصير</p>
            <div class="sp-bar"><i id="spBar"></i></div>
            <div class="sp-stats"><span><b id="spStreak">٠</b> ${st === 1 ? 'يوم' : 'أيام متتالية'}</span><span><b id="spDone">٠</b> درساً منجزاً</span><span><b id="spCert">٠</b> شهادات</span></div></div>
        </a>
        <div id="spWj" class="rv" ${I()}></div>
        <div class="sp-tabs rv" ${I()} id="spTabs"><span class="sp-ind" id="spInd"></span><button data-tab="fam" class="${tab === 'fam' ? 'on' : ''}">أفراد الأسرة</button><button data-tab="ilm" class="${tab === 'ilm' ? 'on' : ''}">العلم</button></div>
        <div id="spPanels">
          <div class="sp-panel ${tab === 'fam' ? 'on' : ''}" data-p="fam"><div class="sp-sub">من الكبير إلى الصغير</div><div class="sp-grid">
            ${C('r:#/usra', '#/usra', 'home', 'أسرتي', 'ملف لكل فرد، والنجوم، والصحة، ومجلس الأسرة، وصلة الرحم')}
            ${C('r:#/parents', '#/parents', 'parents', 'زاد الوالدين', 'تربية الأبناء، وإدارة البيت، والمواريث')}
            ${C('lit', '#/literacy', 'pen', 'زاد الكبار والأميين', 'القراءة والكتابة من الصفر')}
            ${C('r:#/rafiq', '#/rafiq', 'compass', 'زاد الرفيق', 'للشباب', 'sp-rq')}
            ${C('r:#/rafiqa', '#/rafiqa', 'flower', 'زاد الرفيقة', 'للمرأة والفتاة', 'sp-rf')}
            ${C('kids', '#/kids', 'sprout', 'زاد البراعم', 'الحروف وجزء عمّ والقصص والرسم', 'sp-kd')}
          </div></div>
          <div class="sp-panel ${tab === 'ilm' ? 'on' : ''}" data-p="ilm">${(n = 4, '')}<div class="sp-sub">العلم الشرعي والعربي والتاريخ</div><div class="sp-grid">
            ${C('r:#/ilm', '#/ilm', 'book', 'علوم الشريعة', 'القرآن والقراءات والحديث والفقه والعقيدة وأصول العلوم والتزكية')}
            ${C('r:#/lugha', '#/lugha', 'abt', 'علوم العربية', 'النحو والصرف والبلاغة والإملاء والعروض والخط والشعر والأدب')}
            ${C('r:#/tarikh', '#/tarikh', 'columns', 'التاريخ والحضارة', 'السيرة والصحابة والعصور والدول والخلفاء')}
            ${C('r:#/dawah', '#/dawah', 'mega', 'الدعوة إلى الله', 'لأهل الأديان واللادينيين، وطرق الدعوة')}
            ${C('r:#/wajib', '#/wajib', 'pin', 'ما لا يسع المسلم جهله', 'درس يومي قصير بالإشعار')}
            ${C('r:#/taqaddum', '#/taqaddum', 'chart', 'تقدمي وشهاداتي', 'كل دروسك في مكان واحد، والبحث فيها، والشهادات، ونقل التقدم')}
          </div></div>
        </div>
        <button class="sp-guide rv" style="--i:11" id="spGuide">💡 كيف أستفيد من التطبيق؟ (دليل الأقسام)</button>
        <div class="sp-note">ترجع إلى هذه الشاشة من أي قسم بزر «↩ شاشة البداية». اضغط «؟» بجوار أي قسم لتعرف كيف تستفيد منه، وغيّر ألوان التطبيق من الدوائر أعلى الشاشة.</div>
      </div>
    </div>`;
    const $ = s => el.querySelector(s);
    // لمسة الموسم: فوانيس رمضان أو نجوم العيد
    { const ss = window.ZICONS && ZICONS.season && ZICONS.season(), hero = $('.sp-hero');
      const LN = '<svg viewBox="0 0 30 70"><path d="M15 0v14" stroke="#e9cf8d" stroke-width="1.2"/><path d="M9 18h12l-2-4h-8z" fill="#c9a54e"/><path d="M8 18c-3 6-3 18 0 24h14c3-6 3-18 0-24z" fill="rgba(243,210,120,.25)" stroke="#e9cf8d" stroke-width="1.2"/><path d="M15 18v24M10.5 18c-1.5 6-1.5 18 0 24M19.5 18c1.5 6 1.5 18 0 24" stroke="#e9cf8d" stroke-width=".8" fill="none"/><circle cx="15" cy="30" r="3" fill="#ffe7a3"/><path d="M9 42h12l-2 4h-8z" fill="#c9a54e"/><path d="M15 46v4" stroke="#e9cf8d"/></svg>';
      if (ss && hero) { const box = document.createElement('div'); box.className = 'sp-season';
        box.innerHTML = ss === 'ramadan' ? [[5, 0, 34], [16, -1.2, 14], [82, -.6, 22], [93, -1.8, 40]].map(([x, d, h]) => `<span class="sp-lantern" style="left:${x}%;animation-delay:${d}s;top:${h - 30}px">${LN}</span>`).join('')
          : Array.from({ length: 14 }, (_, i) => `<span class="sp-twk" style="left:${(i * 37) % 96 + 2}%;top:${(i * 53) % 70 + 8}%;animation-delay:${(i % 5) * -.5}s">✦</span>`).join('');
        hero.prepend(box); } }
    requestAnimationFrame(() => { const r = el.querySelector('.sp2'); if (r) r.classList.add('in'); });

    // الألوان من أعلى الشاشة
    el.querySelectorAll('.sp-dot').forEach(b => b.addEventListener('click', async () => {
      const fs = (await DB.setting('fontSize')) || 17;
      if (b.dataset.dark) { const d = !(await DB.setting('dark')); await DB.setting('dark', d); APP.applyLook({ fontSize: fs, dark: d, theme: (await DB.setting('theme')) || 'emerald' }); b.classList.toggle('on', d); el.querySelectorAll('[data-th]').forEach(x => x.classList.toggle('on', !d && x.dataset.th === ((document.body.dataset.theme) || 'emerald'))); }
      else { await DB.setting('theme', b.dataset.th); await DB.setting('dark', false); APP.applyLook({ fontSize: fs, dark: false, theme: b.dataset.th }); el.querySelectorAll('.sp-dot').forEach(x => x.classList.toggle('on', x === b)); }
      const hero = $('.sp-hero'); if (hero) { hero.classList.remove('sp-glow'); void hero.offsetWidth; hero.classList.add('sp-glow'); }
      window.FEEL && FEEL.tap();
    }));

    // التبويبات بمؤشر منزلق
    const moveInd = () => { const on = $('#spTabs button.on'), tb = $('#spTabs'), ind = $('#spInd'); if (!on || !tb) return; const r = on.getBoundingClientRect(), tr = tb.getBoundingClientRect(); ind.style.width = r.width + 'px'; ind.style.right = (tr.right - r.right) + 'px'; };
    el.querySelectorAll('#spTabs button').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('#spTabs button').forEach(x => x.classList.toggle('on', x === b)); moveInd();
      el.querySelectorAll('.sp-panel').forEach(p => { const on = p.dataset.p === b.dataset.tab; p.classList.toggle('on', on); if (on) { p.classList.remove('re'); void p.offsetWidth; p.classList.add('re'); } });
      try { localStorage.setItem('sp-tab', b.dataset.tab); } catch (e) { }
    }));
    requestAnimationFrame(moveInd); setTimeout(moveInd, 400);
    V.start._mv = moveInd;
    if (!V.start._rs) { V.start._rs = 1; addEventListener('resize', () => { if (document.getElementById('spTabs')) V.start._mv(); }); }

    // لمعة خفيفة تتبع الإصبع
    el.querySelectorAll('.sp-card, .sp-main').forEach(a => a.addEventListener('pointerdown', e => {
      if (calm()) return; const r = a.getBoundingClientRect(), s = document.createElement('span'); s.className = 'sp-ripple'; s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px'; a.appendChild(s); setTimeout(() => s.remove(), 650);
    }));

    // التحية والصلاة القادمة
    if (APP.nextPrayerInfo) APP.nextPrayerInfo().then(p => { const g = $('#spGreet'); if (g && p) g.textContent = `${morning ? 'صباح الخير' : 'مساء الخير'} — ${p.name} ${p.time} (بعد ${p.left})`; }).catch(() => { });
    if (window.WAJIB_APP) WAJIB_APP.card().then(h => { const b = $('#spWj'); if (b) b.innerHTML = h; });

    // التقدم الحقيقي في الدروس
    countTo($('#spStreak'), st);
    const fill = (pct, done, cert) => {
      const ring = $('#spRing'), bar = $('#spBar'); if (!ring) return;
      setTimeout(() => { ring.style.strokeDashoffset = 201 * (1 - pct / 100); bar.style.width = pct + '%'; }, 250);
      countTo($('#spPct'), pct, '٪'); countTo($('#spDone'), done); countTo($('#spCert'), cert);
      const p = $('#spTdP'); if (p) p.textContent = done === 0 ? 'ابدأ أول درس اليوم، وستُسجَّل خطواتك هنا' : pct >= 100 ? 'ما شاء الله! أتممت كل الدروس' : `أحسنت، أنجزت ${AD(done)} درساً، واصل ولو بدرس قصير`;
    };
    setTimeout(async () => {
      try {
        if (!window.PROGRESS) return fill(0, 0, 0);
        const T = await PROGRESS.allTracks(); let all = 0, dn = 0, cert = 0;
        for (const t of T) { const d = t.lessons.filter(l => l.done).length; all += t.lessons.length; dn += d; if (t.lessons.length && d === t.lessons.length) cert++; }
        fill(all ? Math.round(dn * 100 / all) : 0, dn, cert);
      } catch (e) { fill(0, 0, 0); }
    }, 350);

    const HELP = window.START_HELP || {};
    const showHelp = k => { const h = HELP[k]; if (!h) return; APP.modal(`<h3>${h[0]}</h3><div class="sp-hl">${h[1]}</div><ul class="sp-hlist">${h[2].map(x => `<li>${x}</li>`).join('')}</ul><a class="btn" href="${k}" onclick="document.getElementById('modal').classList.add('hidden')">ادخل القسم ‹</a>`); };
    el.querySelectorAll('.sp-help').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); showHelp(b.dataset.help); }));
    $('#spGuide').addEventListener('click', () => APP.modal(`<h3>💡 دليل الاستفادة من أقسام التطبيق</h3>${Object.entries(HELP).map(([k, h]) => `<details class="sp-gd"><summary>${h[0]}</summary><div class="sp-hl">${h[1]}</div><ul class="sp-hlist">${h[2].map(x => `<li>${x}</li>`).join('')}</ul><a href="${k}" onclick="document.getElementById('modal').classList.add('hidden')">ادخل القسم ‹</a></details>`).join('')}`));
    el.querySelectorAll('[data-aud]').forEach(a => a.addEventListener('click', () => {
      try { localStorage.setItem('audience', a.dataset.aud); } catch (e) { } LEARN.stop();
      if (a.dataset.aud === 'adult') setTimeout(() => { try { if (!localStorage.getItem('tour-done') && window.GUIDE) GUIDE.tour(0); } catch (e) { } }, 1500);
    }));
  };

  // عند فتح التطبيق: أول مرة شاشة الاختيار، وبعدها يفتح على آخر قسم اختاره (إلا إن فُتح على رابط محدد كإشعار)
  try {
    const h = location.hash;
    // الشاشة الرئيسية الرسمية: شاشة اختيار القسم دائماً عند فتح التطبيق (إلا إن فُتح على رابط محدد كإشعار)
    if (!h || h === '#/' || h === '#') location.replace('#/start');
  } catch (e) { }

  // ===== استوديو التسجيل =====
  let rec = null, chunks = [];
  async function startRec() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mt = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
    rec = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined); chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.start();
    return new Promise(res => { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); rec = null; }; });
  }
  const extOf = t => /ogg/.test(t) ? 'ogg' : /mp4|aac|m4a/.test(t) ? 'm4a' : 'webm';

  V.learnrec = async (el, [mode]) => {
    const b = LEARN.shell(el, { title: '🎙️ استوديو تسجيل الأصوات', back: '#/start' });
    const all = LEARN.clips(), have = new Set(await LEARN.VS.keys());
    const groups = [...new Set(all.map(c => c.group))];
    if (mode === 'go') return focus(b, all, have);
    const done = all.filter(c => have.has(c.key)).length, p1 = all.filter(c => c.phase === 1), d1 = p1.filter(c => have.has(c.key)).length;
    b.innerHTML = `<div class="card">
        <div><b>سجّلت ${AD(done)} من ${AD(all.length)} مقطعاً</b></div>
        <div class="lr-progress"><i style="width:${Math.round(done / all.length * 100)}%"></i></div>
        <div class="muted" style="font-size:13px;margin:8px 0">التسجيلات تُستعمل فوراً في التطبيق على هذا الجهاز. وعند الانتهاء صدّرها وأرسلها لتُضاف للتطبيق عند الجميع.</div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <a class="lr-btn ok" href="#/learnrec/go">🎙️ ابدأ التسجيل (المقطع التالي)</a>
          <button class="lr-btn" data-export>📦 تصدير التسجيلات (${AD(done)})</button>
        </div>
        <details style="margin-top:10px"><summary>نصائح للتسجيل</summary><ul style="margin:6px 0;font-size:14px;line-height:1.9">
          <li>غرفة هادئة، والجوال على بُعد شبر من فمك.</li>
          <li>صوت واضح متوسط السرعة، كأنك تعلّم طفلاً.</li>
          <li>الحروف بالحركات: انطق الصوت فقط «بَ» وليس «باء فتحة».</li>
          <li>المقاطع مرتبة حسب الأهمية: ابدأ من الأعلى، وكل مجموعة تكملها تشغّل دروسها.</li>
          <li>اضغط «سجّل»، انتظر نصف ثانية، انطق، ثم «إيقاف».</li>
        </ul></details>
      </div>
      ${groups.map(g => { const cs = all.filter(c => c.group === g); const n = cs.filter(c => have.has(c.key)).length; return `<details class="card"><summary><b>${esc(g)}</b> <span class="muted">${AD(n)}/${AD(cs.length)}</span></summary>
        <div class="rc-list">${cs.map(c => `<div class="rc-row ${have.has(c.key) ? 'ok' : ''}" data-k="${c.key}"><span class="rc-show">${esc(c.show)}</span><span class="row" style="gap:4px"><button class="lr-ic sm" data-play title="استماع">▶</button><button class="lr-ic sm" data-rec title="تسجيل">🎙️</button>${have.has(c.key) ? '<button class="lr-ic sm" data-del title="حذف">🗑</button>' : ''}</span></div>`).join('')}</div></details>`; }).join('')}`;
    b.querySelector('[data-export]').onclick = exportZip;
    b.querySelectorAll('.rc-row').forEach(row => {
      const k = row.dataset.k;
      row.querySelector('[data-play]').onclick = () => LEARN.say(k);
      row.querySelector('[data-rec]').onclick = async e => {
        const btn = e.currentTarget;
        if (rec) { rec.stop(); return; }
        try { btn.textContent = '⏹'; btn.classList.add('rec-on'); const blob = await startRec(); await LEARN.VS.put(k, blob); row.classList.add('ok'); btn.textContent = '🎙️'; btn.classList.remove('rec-on'); LEARN.say(k); }
        catch (x) { btn.textContent = '🎙️'; btn.classList.remove('rec-on'); APP.toast('تعذر الوصول إلى الميكروفون — اسمح للتطبيق باستعماله', 4000); }
      };
      const d = row.querySelector('[data-del]'); if (d) d.onclick = async () => { await LEARN.VS.del(k); APP.rerender(); };
    });
  };

  async function focus(b, all, have) {
    let todo = all.filter(c => !have.has(c.key) && c.phase === 1);
    if (!todo.length) todo = all.filter(c => !have.has(c.key));
    let i = 0;
    const show = () => {
      const c = todo[i];
      if (!c) { b.innerHTML = '<div class="card" style="text-align:center"><h2>🎉 سجّلت كل المقاطع</h2><a class="lr-btn ok" href="#/learnrec">رجوع للقائمة</a></div>'; return; }
      b.innerHTML = `<div class="card rc-focus">
        <div class="muted">${esc(c.group)} — باقي ${AD(todo.length - i)}</div>
        <div class="rc-big">${esc(c.show)}</div>
        <div class="muted" style="font-size:13px">${c.text !== c.show ? 'انطق: ' + esc(c.text) : ''}</div>
        <div class="row" style="gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">
          <button class="lr-btn rec" data-rec>🎙️ سجّل</button>
          <button class="lr-btn ghost" data-skip>⏭ تخطَّ</button>
        </div>
        <div id="rcAfter" style="margin-top:12px"></div>
        <a href="#/learnrec" class="muted" style="display:block;margin-top:16px">↩ القائمة</a></div>`;
      b.querySelector('[data-skip]').onclick = () => { i++; show(); };
      const rb = b.querySelector('[data-rec]');
      rb.onclick = async () => {
        if (rec) { rec.stop(); return; }
        try {
          LEARN.stop(); rb.textContent = '⏹ إيقاف'; rb.classList.add('rec-on');
          const blob = await startRec(); rb.textContent = '🎙️ أعد التسجيل'; rb.classList.remove('rec-on');
          await LEARN.VS.put(c.key, blob); LEARN.say(c.key);
          const af = b.querySelector('#rcAfter');
          af.innerHTML = '<button class="lr-btn ok" data-next>✔ ممتاز، التالي</button>';
          af.querySelector('[data-next]').onclick = () => { i++; show(); };
        } catch (x) { rb.textContent = '🎙️ سجّل'; rb.classList.remove('rec-on'); APP.toast('تعذر الوصول إلى الميكروفون — اسمح للتطبيق باستعماله', 4000); }
      };
    };
    show();
  }

  async function exportZip() {
    const recs = await LEARN.VS.all();
    if (!recs.length) return APP.toast('لا توجد تسجيلات بعد');
    const enc = new TextEncoder(), files = [], idx = {};
    for (const r of recs) { const name = r.key + '.' + extOf(r.type || ''); idx[r.key] = name; files.push({ name, data: new Uint8Array(await r.blob.arrayBuffer()) }); }
    const texts = Object.fromEntries(LEARN.clips().map(c => [c.key, c.text]));
    files.push({ name: 'index.json', data: enc.encode(JSON.stringify({ files: idx, texts }, null, 1)) });
    const z = DOCX.zip(files);
    APP.download('learn-voices-' + new Date().toISOString().slice(0, 10) + '.zip', new Blob([z], { type: 'application/zip' }), 'application/zip');
  }
})();
