/* 🧭 قوائم الأقسام: عند الدخول إلى قسم مستقل (رفيقة، رفيق، التربية، البيت، القراءات)
   تختفي قائمة التطبيق العامة وتظهر قائمة القسم نفسه، مع زر للرجوع إلى شاشة البداية. */
(() => {
  const SECS = {
    rafiqa: { t: '🌸 رفيقة', cls: 'rf', links: async () => { const w = await DB.setting('rafiqa-who'); return [['#/rafiqa', '🏠', 'رئيسية رفيقة'], ['#/rafiqa/cycle', '🩸', 'دورتي'], w && w !== 'girl' ? ['#/rafiqa/preg', '🤰', 'حملي'] : null, ['#/rafiqa/fit', '🏃‍♀️', 'تمارين'], ['#/rafiqa/fiqh', '⚖️', 'أحكامك'], ['#/rafiqa/seerah', '🌟', 'قدوتي'], ['#/rafiqa/status', '👑', 'مكانتك'], ['#/rafiqa/life', '🌱', 'مراحل حياتك'], w && w !== 'girl' ? ['#/tarbiya', '👨‍👩‍👧', 'تربية الأبناء'] : null, ['#/rafiqa/books', '📚', 'المصادر']].filter(Boolean); } },
    rafiq: { t: '🧭 رفيق', cls: 'rq', links: async () => { const w = await DB.setting('rafiq-who'); return [['#/rafiq', '🏠', 'رئيسية رفيق'], ['#/rafiq/fit', '💪', 'تماريني'], ['#/rafiq/bulugh', '🌱', 'بلغتَ'], ['#/rafiq/salat', '🕌', 'صلاتي'], ['#/rafiq/iffa', '🛡️', 'العفة'], ['#/rafiq/suhba', '👥', 'صحبتي'], ['#/rafiq/walidain', '🤍', 'والداي'], ['#/rafiq/ahdaf', '🎯', 'أهدافي'], ['#/rafiq/jism', '⚖️', 'جسمي'], ['#/rafiq/nafs', '🧘', 'نفسيتي'], ['#/rafiq/thabat', '⚓', 'ثبات'], ['#/rafiq/qudwa', '🌟', 'قدوتي'], w && w !== 'shab' ? ['#/rafiq/zawja', '💍', 'زوجتي'] : null, w && w !== 'shab' ? ['#/tarbiya', '👨‍👩‍👧', 'تربية الأبناء'] : null].filter(Boolean); } },
    tarbiya: { t: '👨‍👩‍👧 تربية الأبناء', cls: 'tb', links: async () => [['#/tarbiya', '🧭', 'المنهج'], ['#/tarbiya/barnamaj', '📅', 'برنامج حسب العمر'], ['#/tarbiya/wasail', '🛠️', 'الوسائل'], ['#/tarbiya/marahil', '📈', 'المراحل'], ['#/tarbiya/mawlud', '👶', 'حقوق المولود'], ['#/tarbiya/akhta', '⚠️', 'أخطاء شائعة'], ['#/tarbiya/mushkilat', '🧩', 'مشكلات وحلول'], ['#/tarbiya/birr', '🤍', 'البرّ'], ['#/mirath', '⚖️', 'حاسبة الميراث'], ['#/tarbiya/masadir', '📚', 'المصادر']] },
    bayt: { t: '🏡 إدارة البيت', cls: 'bt', links: async () => [['#/bayt', '🏡', 'اليوم'], ['#/bayt/meals', '🍲', 'الوجبات'], ['#/bayt/pantry', '🧺', 'المطبخ'], ['#/bayt/shop', '🛒', 'التسوق'], ['#/bayt/chores', '🧹', 'مهام البيت'], ['#/bayt/lessons', '📚', 'دروس الأولاد'], ['#/bayt/budget', '💰', 'الميزانية'], ['#/mirath', '⚖️', 'حاسبة الميراث']] },
    qiraat: { t: '📜 القراءات والتجويد', cls: 'qr', links: async () => [['#/qiraat', '🏠', 'الرئيسية'], ['#/qiraat/surah', '📖', 'حسب السورة'], ['#/qiraat/search', '🔎', 'قراءات كلمة'], ['#/qiraat/mutun', '📜', 'المتون'], ['#/qiraat/kutub', '📚', 'الشروح والكتب'], ['#/qiraat/qurra', '👥', 'القراء ورواتهم'], ['#/tajweed', '🎙️', 'دروس التجويد']] },
  };
  SECS.mirath = SECS.tarbiya;
  let cur = null;
  async function apply() {
    const top = (location.hash.match(/^#\/([^/?]+)/) || [])[1];
    const key = top === 'tajweed' && cur === 'qiraat' ? 'qiraat' : (SECS[top] ? top : null);
    const S = key && SECS[key], body = document.body;
    if (!S) { body.classList.remove('sec-mode'); cur = null; return; }
    const links = await S.links();
    let nav = document.getElementById('secNav');
    if (!nav) { nav = document.createElement('div'); nav.id = 'secNav'; document.getElementById('sidebar').prepend(nav); }
    let tabs = document.getElementById('secTabs');
    if (!tabs) { tabs = document.createElement('nav'); tabs.id = 'secTabs'; tabs.className = 'tabbar sec-tabs'; document.getElementById('tabbar').after(tabs); }
    const h = location.hash.split('?')[0], act = l => h === l[0] || (l[0] !== '#/' + top && h.startsWith(l[0] + '/'));
    nav.className = 'sec-nav sec-' + S.cls;
    nav.innerHTML = `<div class="sec-head">${S.t}</div>${links.map(l => `<a href="${l[0]}" class="${act(l) ? 'on' : ''}"><i class="ni">${l[1]}</i><span>${l[2]}</span></a>`).join('')}
      <div class="sec-foot"><a href="#/start"><i class="ni">↩</i><span>شاشة البداية</span></a><a href="#/"><i class="ni">🕌</i><span>للجميع (القائمة الكاملة)</span></a></div>`;
    const short = links.slice(0, 4);
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
