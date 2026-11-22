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
    '#/ilm': ['📚 طلب العلم', 'لطالب العلم: الحديث وشروحه، والفقه والقواعد، والتفسير، والقراءات، والسيرة.', ['ابدأ بالمنهج المقترح في «طلب العلم» ثم تدرّج.', 'القراءات: كل قراءات الآية من الشاطبية والدرة والطيبة.', 'كل الأقوال والأحكام منسوبة إلى كتب المكتبة.']],
    '#/dawah': ['📣 الدعوة إلى الله', 'لتعرّف غيرك بالإسلام بالحكمة: لأهل الأديان، ولمن لا يؤمن بالله، وطرق الدعوة.', ['اختر الفئة ثم الموضوع، وكل نقطة لها دليلها من القرآن والسنة والكتب.', 'بطاقة التعريف بالإسلام جاهزة للنسخ والمشاركة.', 'ابدأ بفقه الدعوة: الأخلاق قبل الجدال.']],
    '#/lugha': ['🔤 علوم العربية', 'لتتعلم العربية من الصفر حتى الإتقان: النحو والإعراب، ثم الصرف والبلاغة والإملاء والعروض والخط.', ['ابدأ «مسار النحو» من الدرس الأول، وفي آخر كل درس اختبار قصير.', '«مدرّب الإعراب»: تختار موقع كل كلمة وحكمها، فيصحّح لك ويشرح.', '«إعراب القرآن»: تدرّب على الفاتحة وقصار السور، وتحت كل آية في المصحف زر «إعراب الآية».', '«كيف أعرب؟»: أسئلة متتابعة توصلك لإعراب أي كلمة.']],
    '#/tarikh': ['🏛️ التاريخ', 'تاريخ الأنبياء والأمم والدول من آدم عليه السلام إلى العصر الحديث، من كتب التاريخ المعروفة.', ['تصفح العصور بالترتيب، أو ابحث باسم دولة أو حقبة أو شخصية.', 'لكل عصر ملخص، وأحداث بارزة، وإحالة إلى مواضعها في الكتب.', 'ما اختلف فيه المؤرخون يُذكر الخلاف فيه.']],
    '#/adab': ['🪶 الشعر والأدب', 'الشعراء ودواوينهم وكتب الأدب في المكتبة.', ['ابحث ببيت أو كلمة أو اسم شاعر.', 'تصفح الشعراء حسب العصر: الجاهلي، والإسلامي، والعباسي، وما بعده.', 'مختارات في الحكمة والزهد والأخلاق.']],
  };
  // ===== شاشة البداية: من أنت؟ =====
  V.start = async el => {
    document.body.classList.add('learn-mode'); document.body.classList.remove('learn-kids', 'learn-lit');
    const C = (aud, href, ic, t, d, cls = '') => `<div class="sp-cw"><a class="sp-card ${cls}" href="${href}" data-aud="${aud}"><span class="sp-ic">${ic}</span><b>${t}</b><small>${d}</small></a><button class="sp-help" data-help="${href}" aria-label="كيف أستفيد">؟</button></div>`;
    el.innerHTML = `<div class="sp">
      <div class="sp-brand"><img src="icons/icon-192.png" alt=""><h1>زاد الأسرة المسلمة</h1><div class="sp-motto">لكل فرد في البيت: دينه، وعلمه، وصحته، وحياته</div></div>
      <div class="sp-cw"><a class="sp-main" href="#/" data-aud="adult"><span class="sp-ic">🕌</span><div><b>زاد الأسرة</b><small>القرآن الكريم، والصلاة والأذان، والأذكار والأدعية، والرقية، والمكتبة كاملة</small></div><span class="sp-go">‹</span></a><button class="sp-help" data-help="#/" aria-label="كيف أستفيد">؟</button></div>
      <div class="sp-sub">أفراد الأسرة: من الكبير إلى الصغير</div>
      <div class="sp-grid">
        ${C('r:#/parents', '#/parents', '👨‍👩‍👧', 'زاد الوالدين', 'تربية الأبناء، وإدارة البيت، والمواريث')}
        ${C('lit', '#/literacy', '✍️', 'زاد الكبار والأميين', 'القراءة والكتابة من الصفر')}
        ${C('r:#/rafiqa', '#/rafiqa', '🌸', 'زاد الرفيقة', 'للمرأة والفتاة', 'sp-rf')}
        ${C('r:#/rafiq', '#/rafiq', '🧭', 'زاد الرفيق', 'للشباب', 'sp-rq')}
        ${C('kids', '#/kids', '🧒', 'زاد البراعم', 'الحروف وجزء عمّ والقصص والرسم')}
      </div>
      <div class="sp-sub">العلم</div>
      <div class="sp-grid">
        ${C('r:#/ilm', '#/ilm', '📚', 'طلب العلم', 'الحديث والفقه والتفسير والقراءات')}
        ${C('r:#/dawah', '#/dawah', '📣', 'الدعوة إلى الله', 'لأهل الأديان واللادينيين، وطرق الدعوة')}
        ${C('r:#/lugha', '#/lugha', '🔤', 'علوم العربية', 'النحو والإعراب والصرف والبلاغة')}
        ${C('r:#/tarikh', '#/tarikh', '🏛️', 'التاريخ', 'من آدم إلى العصر الحديث')}
        ${C('r:#/adab', '#/adab', '🪶', 'الشعر والأدب', 'الشعراء ودواوينهم وكتب الأدب')}
      </div>
      <button class="sp-guide" id="spGuide">💡 كيف أستفيد من التطبيق؟ (دليل الأقسام)</button>
      <div class="sp-note">هذه هي الشاشة الرئيسية، وترجع إليها من أي قسم بزر «↩ شاشة البداية». اضغط «؟» بجوار أي قسم لتعرف كيف تستفيد منه.</div>
    </div>`;
    const HELP = window.START_HELP || {};
    const showHelp = k => { const h = HELP[k]; if (!h) return; APP.modal(`<h3>${h[0]}</h3><div class="sp-hl">${h[1]}</div><ul class="sp-hlist">${h[2].map(x => `<li>${x}</li>`).join('')}</ul><a class="btn" href="${k}" onclick="document.getElementById('modal').classList.add('hidden')">ادخل القسم ‹</a>`); };
    el.querySelectorAll('.sp-help').forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); showHelp(b.dataset.help); }));
    el.querySelector('#spGuide').addEventListener('click', () => APP.modal(`<h3>💡 دليل الاستفادة من أقسام التطبيق</h3>${Object.entries(HELP).map(([k, h]) => `<details class="sp-gd"><summary>${h[0]}</summary><div class="sp-hl">${h[1]}</div><ul class="sp-hlist">${h[2].map(x => `<li>${x}</li>`).join('')}</ul><a href="${k}" onclick="document.getElementById('modal').classList.add('hidden')">ادخل القسم ‹</a></details>`).join('')}`));
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
