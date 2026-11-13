/* 📿 المسبحة الإلكترونية: عدّاد بلمسة على أي مكان في الدائرة، مع اختيار الذكر والعدد،
   وتسبيح ما بعد الصلاة وتسبيح النوم بالتتابع، واهتزاز عند تمام العدد، وإحصاء اليوم والإجمالي. */
(function () {
  const { esc } = APP;
  const D = AR.toArabicDigits;
  const KEY = 'tasbih';
  const DHIKR = [
    { k: 'subhan', t: 'سبحان الله' },
    { k: 'hamd', t: 'الحمد لله' },
    { k: 'akbar', t: 'الله أكبر' },
    { k: 'tahlil', t: 'لا إله إلا الله' },
    { k: 'istighfar', t: 'أستغفر الله' },
    { k: 'salat', t: 'اللهم صلِّ وسلم على نبينا محمد' },
    { k: 'hawqala', t: 'لا حول ولا قوة إلا بالله' },
    { k: 'bihamdih', t: 'سبحان الله وبحمده' },
    { k: 'azim', t: 'سبحان الله وبحمده، سبحان الله العظيم' },
    { k: 'tahlil10', t: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير' },
  ];
  // أوراد متتابعة بأدلتها
  const SETS = {
    salah: { t: 'تسبيح ما بعد الصلاة', steps: [['subhan', 33], ['hamd', 33], ['akbar', 33], ['tahlil10', 1]],
      ref: '«من سبّح الله في دبر كل صلاة ثلاثاً وثلاثين، وحمد الله ثلاثاً وثلاثين، وكبّر الله ثلاثاً وثلاثين… وقال تمام المائة: لا إله إلا الله وحده لا شريك له… غُفرت خطاياه وإن كانت مثل زبد البحر» — رواه مسلم (597).' },
    nawm: { t: 'تسبيح النوم', steps: [['subhan', 33], ['hamd', 33], ['akbar', 34]],
      ref: 'قال ﷺ لعلي وفاطمة: «إذا أخذتما مضاجعكما فكبّرا أربعاً وثلاثين، وسبّحا ثلاثاً وثلاثين، واحمدا ثلاثاً وثلاثين» — متفق عليه.' },
    istighfar: { t: 'الاستغفار مائة مرة', steps: [['istighfar', 100]],
      ref: '«يا أيها الناس توبوا إلى الله، فإني أتوب في اليوم إليه مائة مرة» — رواه مسلم (2702).' },
    bihamdih: { t: 'سبحان الله وبحمده مائة مرة', steps: [['bihamdih', 100]],
      ref: '«من قال: سبحان الله وبحمده، في يوم مائة مرة، حُطّت خطاياه وإن كانت مثل زبد البحر» — متفق عليه.' },
    tahlil: { t: 'التهليل مائة مرة', steps: [['tahlil10', 100]],
      ref: '«من قال: لا إله إلا الله وحده لا شريك له… في يوم مائة مرة، كانت له عدل عشر رقاب…» — متفق عليه.' },
  };
  const today = () => new Date().toISOString().slice(0, 10);
  const load = async () => Object.assign({ mode: 'free', dhikr: 'subhan', target: 33, count: 0, set: 'salah', step: 0, day: today(), daily: {}, total: {}, custom: '' }, (await DB.setting(KEY)) || {});
  let saveT = null;
  const save = S => { clearTimeout(saveT); saveT = setTimeout(() => DB.setting(KEY, S), 400); };
  const textOf = (S, k) => k === 'custom' ? (S.custom || 'ذكر من اختيارك') : (DHIKR.find(d => d.k === k) || DHIKR[0]).t;
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };

  async function render(box) {
    const S = await load();
    if (S.day !== today()) { S.day = today(); S.daily = {}; }
    const cur = () => S.mode === 'set' ? SETS[S.set].steps[Math.min(S.step, SETS[S.set].steps.length - 1)] : [S.dhikr, S.target];
    const draw = () => {
      const [k, target] = cur(), left = target ? Math.max(0, target - S.count) : 0, pct = target ? Math.min(1, S.count / target) : 0;
      const set = S.mode === 'set' ? SETS[S.set] : null;
      const todayAll = Object.values(S.daily).reduce((a, b) => a + b, 0), totAll = Object.values(S.total).reduce((a, b) => a + b, 0);
      box.innerHTML = `
        <div class="row tsb-modes" style="gap:6px;flex-wrap:wrap;justify-content:center">
          <button class="btn sm ${S.mode === 'free' ? 'primary' : ''}" data-mode="free">ذكر واحد</button>
          <button class="btn sm ${S.mode === 'set' ? 'primary' : ''}" data-mode="set">ورد متتابع</button>
        </div>
        ${S.mode === 'free' ? `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px">
            <select id="tsD">${DHIKR.map(d => `<option value="${d.k}" ${S.dhikr === d.k ? 'selected' : ''}>${esc(d.t.length > 34 ? d.t.slice(0, 32) + '…' : d.t)}</option>`).join('')}<option value="custom" ${S.dhikr === 'custom' ? 'selected' : ''}>✎ ذكر آخر…</option></select>
            <select id="tsT">${[[33, '٣٣'], [34, '٣٤'], [99, '٩٩'], [100, '١٠٠'], [1000, '١٠٠٠'], [0, 'بلا حد']].map(([v, l]) => `<option value="${v}" ${+S.target === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          </div>${S.dhikr === 'custom' ? `<input id="tsC" value="${esc(S.custom)}" placeholder="اكتب الذكر" style="display:block;margin:8px auto;max-width:340px;width:100%">` : ''}`
        : `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center;margin-top:8px"><select id="tsS">${Object.entries(SETS).map(([k, v]) => `<option value="${k}" ${S.set === k ? 'selected' : ''}>${esc(v.t)}</option>`).join('')}</select></div>
           <div class="tsb-steps">${set.steps.map(([sk, n], i) => `<span class="${i < S.step ? 'done' : i === S.step ? 'cur' : ''}">${esc(textOf(S, sk).split('،')[0])} ×${D(n)}</span>`).join('')}</div>`}
        <div class="tsb-text">${esc(textOf(S, k))}</div>
        <button class="tsb-ring" id="tsTap" style="--p:${pct}" aria-label="سبّح">
          <span class="tsb-n">${D(S.count)}</span>
          <small>${target ? (left ? 'باقي ' + D(left) : (set && S.step >= set.steps.length - 1 ? '✔ تمّ الورد' : '✔ تمّ')) : 'اضغط للتسبيح'}</small>
        </button>
        <div class="row" style="gap:6px;justify-content:center;flex-wrap:wrap">
          <button class="btn sm" id="tsUndo">↶ تراجع</button><button class="btn sm" id="tsReset">↺ من جديد</button>
          <button class="btn sm" id="tsFull">⛶ ملء الشاشة</button>
        </div>
        <div class="tsb-stats muted">اليوم: ${D(todayAll)} — الإجمالي: ${D(totAll)}</div>
        ${set ? `<div class="gd-tip" style="font-size:13px">${esc(set.ref)}</div>` : ''}
        <div class="muted" style="font-size:12px;text-align:center;margin-top:6px">الاهتزاز يعلمك بتمام العدد، فتقدر تسبّح والجوال في يدك دون أن تنظر إليه. وكان النبي ﷺ يعقد التسبيح بيمينه (رواه أبو داود والترمذي وصححه الألباني).</div>`;
      const $ = s => box.querySelector(s);
      box.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { S.mode = b.dataset.mode; S.count = 0; S.step = 0; save(S); draw(); });
      if ($('#tsD')) $('#tsD').onchange = e => { S.dhikr = e.target.value; S.count = 0; save(S); draw(); };
      if ($('#tsT')) $('#tsT').onchange = e => { S.target = +e.target.value; S.count = 0; save(S); draw(); };
      if ($('#tsC')) $('#tsC').oninput = e => { S.custom = e.target.value; save(S); box.querySelector('.tsb-text').textContent = textOf(S, 'custom'); };
      if ($('#tsS')) $('#tsS').onchange = e => { S.set = e.target.value; S.step = 0; S.count = 0; save(S); draw(); };
      $('#tsTap').onclick = tap;
      $('#tsUndo').onclick = () => { if (S.count > 0) { S.count--; const kk = cur()[0]; S.daily[kk] = Math.max(0, (S.daily[kk] || 1) - 1); S.total[kk] = Math.max(0, (S.total[kk] || 1) - 1); save(S); draw(); } };
      $('#tsReset').onclick = () => { S.count = 0; S.step = 0; save(S); draw(); };
      $('#tsFull').onclick = () => { const r = box.closest('.view') || document.documentElement; try { (document.fullscreenElement ? document.exitFullscreen() : (r.requestFullscreen || r.webkitRequestFullscreen).call(r)); } catch (e) { } };
    };
    function tap() {
      const set = S.mode === 'set' ? SETS[S.set] : null;
      let [k, target] = cur();
      // بعد التمام: لمسة جديدة تبدأ الذكر التالي في الورد، أو دورة جديدة
      if (target && S.count >= target) {
        if (set && S.step < set.steps.length - 1) { S.step++; S.count = 0; [k, target] = cur(); }
        else { S.count = 0; S.step = 0; [k, target] = cur(); }
      }
      S.count++; S.daily[k] = (S.daily[k] || 0) + 1; S.total[k] = (S.total[k] || 0) + 1;
      if (target && S.count === target) buzz(set && S.step === set.steps.length - 1 ? [80, 80, 80, 80, 200] : [60, 60, 120]);
      else if (S.count % 10 === 0) buzz(25); else buzz(8);
      save(S);
      const n = box.querySelector('.tsb-n'); if (n && !(target && S.count === target) && !(S.count === 1)) {
        n.textContent = D(S.count); box.querySelector('#tsTap').style.setProperty('--p', target ? Math.min(1, S.count / target) : 0);
        box.querySelector('#tsTap small').textContent = target ? 'باقي ' + D(target - S.count) : 'اضغط للتسبيح';
        const st = box.querySelector('.tsb-stats'); if (st) st.textContent = 'اليوم: ' + D(Object.values(S.daily).reduce((a, b) => a + b, 0)) + ' — الإجمالي: ' + D(Object.values(S.total).reduce((a, b) => a + b, 0));
      } else draw();
    }
    draw();
  }
  window.TASBIH = { render };
})();
