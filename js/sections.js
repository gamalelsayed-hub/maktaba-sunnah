/* 🧭 قوائم الأقسام: عند الدخول إلى قسم مستقل (رفيقة، رفيق، التربية، البيت، القراءات)
   تختفي قائمة التطبيق العامة وتظهر قائمة القسم نفسه، مع زر للرجوع إلى شاشة البداية. */
(() => {
  const SECS = {
    rafiqa: { t: '🌸 رفيقة', cls: 'rf', links: async () => { const w = await DB.setting('rafiqa-who'); return [['#/rafiqa', '🏠', 'رئيسية رفيقة'], ['g', '🩺 صحتي', [['#/rafiqa/cycle', '🩸', 'دورتي'], w && w !== 'girl' ? ['#/rafiqa/preg', '🤰', 'حملي'] : null, ['#/rafiqa/fit', '🏃‍♀️', 'تمارين']].filter(Boolean)], ['g', '⚖️ ديني ومعرفتي', [['#/rafiqa/fiqh', '⚖️', 'أحكامك'], ['#/rafiqa/seerah', '🌟', 'قدوتي'], ['#/rafiqa/status', '👑', 'مكانتك'], ['#/rafiqa/books', '📚', 'المصادر']]], ['g', '🌱 حياتي', [['#/rafiqa/life', '🌱', 'مراحل حياتك'], w && w !== 'girl' ? ['#/tarbiya', '👨‍👩‍👧', 'تربية الأبناء'] : null].filter(Boolean)]]; } },
    rafiq: { t: '🧭 رفيق', cls: 'rq', links: async () => { const w = await DB.setting('rafiq-who'); return [['#/rafiq', '🏠', 'رئيسية رفيق'], ['#/rafiq/fit', '💪', 'تماريني'], ['g', '🕌 ديني', [['#/rafiq/bulugh', '🌱', 'بلغتَ'], ['#/rafiq/salat', '🕌', 'صلاتي'], ['#/rafiq/iffa', '🛡️', 'العفة'], ['#/rafiq/thabat', '⚓', 'شبهات وثبات'], ['#/rafiq/qudwa', '🌟', 'قدوتي']]], ['g', '🧘 نفسي وجسمي', [['#/rafiq/jism', '⚖️', 'جسمي ولياقتي'], ['#/rafiq/nafs', '🧘', 'نفسيتي'], ['#/rafiq/ahdaf', '🎯', 'أهدافي ووقتي']]], ['g', '🤝 علاقاتي', [['#/rafiq/walidain', '🤍', 'والداي'], ['#/rafiq/suhba', '👥', 'صحبتي'], w && w !== 'shab' ? ['#/rafiq/zawja', '💍', 'زوجتي'] : null, w && w !== 'shab' ? ['#/tarbiya', '👨‍👩‍👧', 'تربية الأبناء'] : null].filter(Boolean)]]; } },
    tarbiya: { t: '👨‍👩‍👧 تربية الأبناء', cls: 'tb', links: async () => [['#/tarbiya', '🧭', 'المنهج'], ['#/tarbiya/barnamaj', '📅', 'برنامج حسب العمر'], ['#/tarbiya/wasail', '🛠️', 'الوسائل'], ['#/tarbiya/marahil', '📈', 'المراحل'], ['#/tarbiya/mawlud', '👶', 'حقوق المولود'], ['#/tarbiya/akhta', '⚠️', 'أخطاء شائعة'], ['#/tarbiya/mushkilat', '🧩', 'مشكلات وحلول'], ['#/tarbiya/birr', '🤍', 'البرّ'], ['#/mirath', '⚖️', 'حاسبة الميراث'], ['#/tarbiya/masadir', '📚', 'المصادر']] },
    bayt: { t: '🏡 إدارة البيت', cls: 'bt', links: async () => [['#/bayt', '🏡', 'اليوم'], ['#/bayt/meals', '🍲', 'الوجبات'], ['#/bayt/pantry', '🧺', 'المطبخ'], ['#/bayt/shop', '🛒', 'التسوق'], ['#/bayt/chores', '🧹', 'مهام البيت'], ['#/bayt/lessons', '📚', 'دروس الأولاد'], ['#/bayt/budget', '💰', 'الميزانية'], ['#/mirath', '⚖️', 'حاسبة الميراث']] },
    qiraat: { t: '📜 القراءات والتجويد', cls: 'qr', links: async () => [['#/qiraat', '🏠', 'الرئيسية'], ['#/qiraat/surah', '📖', 'حسب السورة'], ['#/qiraat/search', '🔎', 'قراءات كلمة'], ['#/qiraat/mutun', '📜', 'المتون'], ['#/qiraat/kutub', '📚', 'الشروح والكتب'], ['#/qiraat/qurra', '👥', 'القراء ورواتهم'], ['#/tajweed', '🎙️', 'دروس التجويد']] },
  };
  SECS.parents = { t: '👨‍👩‍👧 الأب والأم', cls: 'pa', links: async () => [['#/parents', '🏠', 'الأب والأم'], ['g', '🧭 تربية الأبناء', [['#/tarbiya', '🧭', 'المنهج'], ['#/tarbiya/barnamaj', '📅', 'برنامج حسب العمر'], ['#/tarbiya/wasail', '🛠️', 'الوسائل'], ['#/tarbiya/marahil', '📈', 'المراحل'], ['#/tarbiya/mawlud', '👶', 'حقوق المولود'], ['#/tarbiya/akhta', '⚠️', 'أخطاء شائعة'], ['#/tarbiya/mushkilat', '🧩', 'مشكلات وحلول'], ['#/tarbiya/masadir', '📖', 'المصادر']]], ['g', '🏡 إدارة البيت', [['#/bayt', '🏡', 'اليوم'], ['#/bayt/meals', '🍲', 'الوجبات'], ['#/bayt/pantry', '🧺', 'المطبخ'], ['#/bayt/shop', '🛒', 'التسوق'], ['#/bayt/chores', '🧹', 'مهام البيت'], ['#/bayt/lessons', '📚', 'دروس الأولاد'], ['#/bayt/budget', '💰', 'الميزانية']]], ['g', '⚖️ البرّ والمواريث', [['#/tarbiya/birr', '🤍', 'برّ الوالدين'], ['#/mirath', '🧮', 'حاسبة المواريث']]]] };
  SECS.tarbiya = SECS.bayt = SECS.mirath = SECS.parents;
  SECS.ilm = { t: '📚 طلب العلم', cls: 'ilm', links: async () => [['#/ilm', '🏠', 'طلب العلم'], ['#/search', '🔎', 'البحث في المكتبة'], ['#/ask', '❓', 'اسأل عن مسألة'], ['g', '📖 القرآن والحديث', [['#/quran', '📖', 'المصحف والتفسير'], ['#/qiraat', '📜', 'القراءات والتجويد'], ['#/hadith', '📜', 'الحديث وشروحه'], ['#/rijal', '🔗', 'الرواة']]], ['g', '⚖️ الفقه', [['#/fiqh', '⚖️', 'الفقه المقارن'], ['#/qawaid', '🧩', 'القواعد الفقهية'], ['#/mirath', '🧮', 'حاسبة المواريث']]], ['g', '🕌 السيرة والتراجم', [['#/sira', '🕌', 'السيرة والتاريخ'], ['#/sahaba', '👥', 'سير الصحابة']]], ['g', '📣 الدعوة والخطابة', [['#/dawah', '📣', 'الدعوة إلى الله'], ['#/khutba', '🎤', 'مُعين الخطيب']]], ['g', '🎓 أدوات الطالب', [['#/talab', '🎓', 'منهج طلب العلم'], ['#/saved', '⭐', 'محفوظاتي'], ['#/library', '⬇️', 'الكتب وتحميلها']]]] };
  ['hadith', 'fiqh', 'qawaid', 'sira', 'sahaba', 'rijal', 'talab', 'khutba', 'saved', 'library', 'ask'].forEach(k => SECS[k] = SECS.ilm);
  // صفحات مشتركة (الكتاب، والنص، والبحث): تبقى في القسم الذي جاء منه المستخدم، وإلا ففي طلب العلم
  const STICKY = ['book', 'item', 'search'];
  SECS.qiraat.links = ((f) => async () => [...(await f()), ['#/ilm', '📚', 'طلب العلم']])(SECS.qiraat.links);
  let cur = null;
  async function apply() {
    const top = (location.hash.match(/^#\/([^/?]+)/) || [])[1];
    const key = top === 'tajweed' && cur === 'qiraat' ? 'qiraat' : STICKY.includes(top) ? cur : (SECS[top] ? top : null);
    const S = key && SECS[key], body = document.body;
    if (!S) { body.classList.remove('sec-mode'); cur = null; return; }
    const links = await S.links();
    let nav = document.getElementById('secNav');
    if (!nav) { nav = document.createElement('div'); nav.id = 'secNav'; document.getElementById('sidebar').prepend(nav); }
    let tabs = document.getElementById('secTabs');
    if (!tabs) { tabs = document.createElement('nav'); tabs.id = 'secTabs'; tabs.className = 'tabbar sec-tabs'; document.getElementById('tabbar').after(tabs); }
    const h = location.hash.split('?')[0], act = l => h === l[0] || (l[0] !== '#/' + top && h.startsWith(l[0] + '/'));
    nav.className = 'sec-nav sec-' + S.cls;
    const A = l => `<a href="${l[0]}" class="${act(l) ? 'on' : ''}"><i class="ni">${l[1]}</i><span>${l[2]}</span></a>`;
    nav.innerHTML = `<div class="sec-head">${S.t}</div>${links.map(l => l[0] === 'g' ? `<details class="sec-grp" ${l[2].some(act) ? 'open' : ''}><summary>${l[1]}</summary>${l[2].map(A).join('')}</details>` : A(l)).join('')}
      <div class="sec-foot"><a href="#/start"><i class="ni">↩</i><span>شاشة البداية</span></a><a href="#/"><i class="ni">🕌</i><span>للجميع (القائمة الكاملة)</span></a></div>`;
    const flat = links.flatMap(l => l[0] === 'g' ? l[2] : [l]).filter((l, i, a) => a.findIndex(x => x[0] === l[0]) === i);
    const short = flat.slice(0, 4);
    tabs.innerHTML = short.map(l => `<a href="${l[0]}" class="${act(l) ? 'on' : ''}"><span class="ti">${l[1]}</span>${l[2]}</a>`).join('') + '<button type="button" class="sec-more"><span class="ti">☰</span>القائمة</button>';
    tabs.querySelector('.sec-more').onclick = () => { document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').classList.remove('hidden'); };
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.add('hidden'); }));
    body.classList.add('sec-mode'); cur = key;
  }
  window.addEventListener('hashchange', apply);
  window.addEventListener('load', apply);
  setTimeout(apply, 300);
  window.SECNAV = { refresh: apply };
})();
