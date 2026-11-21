/* 🛡️ الرقية الشرعية من القرآن والسنة — للكبار وللأطفال
   الآيات تُتلى بصوت القارئ الذي تختاره من كبار القرّاء (آيةً آية)، والأدعية النبوية بصوت القارئ المسجَّل إن وُجد وإلا بصوت الجهاز.
   يمكن تكرار الرقية (مرة أو ثلاثاً أو سبعاً)، والقراءة على النفس أو على المريض مع النفث. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  // مقاطع الآيات: [عنوان، سورة، من آية، إلى آية]
  const AYAT = {
    adult: [['سورة الفاتحة', 1, 1, 7], ['أول سورة البقرة', 2, 1, 5], ['﴿وإلهكم إله واحد﴾', 2, 163, 164], ['آية الكرسي', 2, 255, 255], ['خواتيم سورة البقرة', 2, 285, 286], ['﴿شهد الله أنه لا إله إلا هو﴾', 3, 18, 19],
      ['﴿إن ربكم الله الذي خلق السماوات والأرض﴾', 7, 54, 56], ['إبطال السحر — من الأعراف', 7, 117, 122], ['إبطال السحر — من يونس', 10, 79, 82], ['إبطال السحر — من طه', 20, 65, 70], ['خواتيم سورة المؤمنون', 23, 115, 118],
      ['أول سورة الصافات', 37, 1, 10], ['من سورة الأحقاف', 46, 29, 32], ['من سورة الرحمن', 55, 33, 36], ['خواتيم سورة الحشر', 59, 21, 24], ['أول سورة الجن', 72, 1, 9], ['سورة الكافرون', 109, 1, 6],
      ['سورة الإخلاص', 112, 1, 4], ['سورة الفلق', 113, 1, 5], ['سورة الناس', 114, 1, 6]],
    kids: [['سورة الفاتحة', 1, 1, 7], ['آية الكرسي', 2, 255, 255], ['سورة الإخلاص', 112, 1, 4], ['سورة الفلق', 113, 1, 5], ['سورة الناس', 114, 1, 6]],
  };
  // الأدعية النبوية: [المعرّف، النص، عدد المرات، التخريج، ملاحظة]
  const DUAS = {
    adult: [
      ['d1', 'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ', 3, 'رواه مسلم', 'رقية جبريل عليه السلام للنبي ﷺ'],
      ['d2', 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', 3, 'متفق عليه', 'كان النبي ﷺ يرقي به المريض'],
      ['d3', 'بِسْمِ اللَّهِ (ثلاثاً)، أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (سبعاً)', 1, 'رواه مسلم', 'تضع يدك على موضع الألم'],
      ['d4', 'أَسْأَلُ اللَّهَ الْعَظِيمَ، رَبَّ الْعَرْشِ الْعَظِيمِ، أَنْ يَشْفِيَكَ', 7, 'رواه أبو داود والترمذي', 'عند زيارة المريض'],
      ['d5', 'بِسْمِ اللَّهِ يُبْرِيكَ، وَمِنْ كُلِّ دَاءٍ يَشْفِيكَ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ، وَشَرِّ كُلِّ ذِي عَيْنٍ', 1, 'رواه مسلم', ''],
      ['d6', 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', 3, 'رواه مسلم', 'حصن من كل ضرر'],
      ['d7', 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ', 3, 'رواه أبو داود والترمذي', 'صباحاً ومساءً'],
    ],
    kids: [
      ['k1', 'أُعِيذُكَ بِكَلِمَاتِ اللَّهِ التَّامَّةِ، مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ', 3, 'رواه البخاري', 'كان النبي ﷺ يعوّذ بها الحسن والحسين'],
      ['k2', 'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ', 3, 'رواه مسلم', ''],
      ['k3', 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا', 3, 'متفق عليه', ''],
    ],
  };
  const stripB = t => /^بِسْمِ /.test(t) ? t.split(' ').slice(4).join(' ') : t;
  const noBasmala = x => +x.surah !== 1 && +x.ayah === 1 ? stripB(x.text) : x.text;
  const spoken = t => t.replace(/\((ثلاثاً|سبعاً)\)/g, '');
  const ayatList = kind => AYAT[kind].flatMap(([, s, a, b]) => Array.from({ length: b - a + 1 }, (_, k) => [s, a + k]));
  const isOk = r => !r.full && r.id !== 'alafasy';  // قرّاء الآيات المتاحون (عدا العفاسي)
  const reciters = () => QA.RECITERS.filter(isOk).filter(r => !r.mine || (APP.state && APP.state.reviewerUnlocked) || Object.keys(window.MY_QURAN || {}).length);

  if (window.LIBVOICE && LIBVOICE.addSource) LIBVOICE.addSource({ id: 'ruqyah-duas', title: '🛡️ أدعية الرقية الشرعية', items: async () => DUAS.adult.concat(DUAS.kids).map(([id, t, n, src]) => ({ id: 'rq:' + id, title: 'دعاء الرقية' + (n > 1 ? ` (${D(n)} مرات)` : ''), text: spoken(t), chapter: src })) });

  // ===== التشغيل: الآيات بصوت القارئ ثم الأدعية، وتكرار الرقية كلها =====
  let run = 0;
  const stop = () => { run++; QA.P.q = []; QA.stop(); if (window.SAY) SAY.cancel(); };
  async function playDuas(kind, my) {
    for (const [id, t, n] of DUAS[kind]) {
      for (let k = 0; k < Math.min(n, 3); k++) { if (my !== run) return false; const ok = await SAY.item({ id: 'rq:' + id, title: 'الرقية الشرعية', sub: 'دعاء نبوي', text: spoken(t), name: 'ruqyah', icon: '🛡️' }); if (!ok || my !== run) return false; }
    }
    return true;
  }
  async function playAll(kind, reciter, times, part) {
    stop(); const my = run;
    for (let r = 0; r < times; r++) {
      if (part !== 'duas') { const ok = await new Promise(res => QA.play(ayatList(kind), { reciter, onEnd: () => res(true) }).then(() => { if (!QA.P.q.length) res(false); })); if (!ok || my !== run) return; }
      if (part !== 'ayat') { if (!(await playDuas(kind, my))) return; }
    }
    if (my === run) APP.toast('✔ تمت الرقية — شفاكم الله وعافاكم');
  }

  V.ruqyah = async (el, [tab]) => {
    const kind = tab === 'kids' ? 'kids' : 'adult';
    const cur = (await DB.setting('ruqyah-reciter')) || 'husary';
    const items = await Promise.all(AYAT[kind].map(async ([t, s, a, b]) => ({ t, s, a, b, txt: (await Promise.all(Array.from({ length: b - a + 1 }, (_, k) => DB.get('items', `quran:${s}:${a + k}`).catch(() => null)))).filter(Boolean).map(x => noBasmala(x) + ' ﴿' + D(x.ayah) + '﴾').join(' ') })));
    el.innerHTML = `<div class="row"><h1>🛡️ الرقية الشرعية</h1><span class="spacer"></span>${APP.state.reviewerUnlocked ? '<a class="btn sm" href="#/voicerec/ruqyah-duas">🎙️ سجّل الأدعية بصوتك</a>' : ''}</div>
      <div class="sub">رقية من القرآن الكريم والأدعية الثابتة عن النبي ﷺ. اسمعها بصوت قارئك المفضّل، أو اقرأها بنفسك على نفسك أو على المريض وانفث، مع اليقين بأن الشفاء من الله وحده.</div>
      <div class="tabs"><button class="${kind === 'adult' ? 'on' : ''}" data-tab="">👨 للكبار</button><button class="${kind === 'kids' ? 'on' : ''}" data-tab="kids">🧒 للأطفال</button></div>
      <div class="card"><div class="filters" style="flex-wrap:wrap">
        <label>القارئ <select id="rqR">${reciters().map(r => `<option value="${r.id}" ${r.id === cur ? 'selected' : ''}>${esc(r.n)} — ${esc(r.d)}</option>`).join('')}</select></label>
        <label>التكرار <select id="rqN"><option value="1">مرة</option><option value="3">٣ مرات</option><option value="7">٧ مرات</option></select></label></div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn primary" data-p="all">▶ استمع للرقية كاملة</button><button class="btn" data-p="ayat">📖 الآيات فقط</button><button class="btn" data-p="duas">🤲 الأدعية فقط</button><button class="btn" data-stop>⏹ إيقاف</button></div>
        <div class="muted" style="font-size:12.5px;margin-top:6px">مدة الرقية كاملة نحو ${kind === 'kids' ? 'خمس دقائق' : 'ثلاثين دقيقة'} حسب القارئ. يستمر التشغيل والشاشة مقفلة.</div></div>
      ${kind === 'kids' ? '<div class="info">👶 للأطفال: ضع يدك على رأس الطفل واقرأ عليه وانفث، أو شغّلها له قبل النوم. وعلّمه أن يقرأ المعوذات بنفسه.</div>' : ''}
      <h2>📖 من القرآن الكريم</h2>
      ${items.map((x, i) => `<div class="card rq-sec"><div class="row"><b>${esc(x.t)}</b><span class="spacer"></span><small class="muted">${esc(AR.SURAHS[x.s - 1])} ${D(x.a)}${x.b > x.a ? '–' + D(x.b) : ''}</small><button class="btn sm" data-one="${i}">▶</button></div><p class="quran-text rq-ayat">${esc(x.txt)}</p></div>`).join('')}
      <h2>🤲 من السنة النبوية</h2>
      ${DUAS[kind].map(([id, t, n, src, note]) => `<div class="card rq-sec"><p class="rq-dua">${esc(t)}</p><div class="row" style="gap:8px;flex-wrap:wrap"><span class="tag">${n > 1 ? D(n) + ' مرات' : 'مرة'}</span><small class="muted">${esc(src)}${note ? ' — ' + esc(note) : ''}</small><span class="spacer"></span><button class="btn sm" data-dua="${id}">🔊</button></div></div>`).join('')}
      <details class="card"><summary><b>💡 آداب الرقية</b></summary><ul style="line-height:1.9;margin:6px 0">
        <li>الرقية دعاء، وأعظم أسباب نفعها: الإخلاص واليقين بأن الشافي هو الله.</li>
        <li>يجوز أن يرقي المسلم نفسه، وأن يرقي غيره، وأن يقرأ في ماء ويشربه المريض أو يغتسل به.</li>
        <li>النفث: نفخ خفيف معه شيء من الريق بعد القراءة، كما كان النبي ﷺ يفعل بالمعوذات.</li>
        <li>لا تُغني الرقية عن الدواء المباح، بل يُجمع بينهما.</li></ul></details>`;
    const $ = s => el.querySelector(s);
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { location.hash = '#/ruqyah' + (b.dataset.tab ? '/' + b.dataset.tab : ''); });
    $('#rqR').onchange = e => DB.setting('ruqyah-reciter', e.target.value);
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => playAll(kind, $('#rqR').value, +$('#rqN').value, b.dataset.p));
    $('[data-stop]').onclick = stop;
    el.querySelectorAll('[data-one]').forEach(b => b.onclick = () => { stop(); const x = items[+b.dataset.one]; QA.play(Array.from({ length: x.b - x.a + 1 }, (_, k) => [x.s, x.a + k]), { reciter: $('#rqR').value }); });
    el.querySelectorAll('[data-dua]').forEach(b => b.onclick = () => { stop(); const d = DUAS[kind].find(x => x[0] === b.dataset.dua); SAY.item({ id: 'rq:' + d[0], title: 'الرقية الشرعية', sub: 'دعاء نبوي', text: spoken(d[1]), name: 'ruqyah', icon: '🛡️' }); });
  };
  window.RUQYAH = { AYAT, DUAS, stop };
})();
