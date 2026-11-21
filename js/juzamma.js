/* 🧒 حفظ جزء عمّ للأطفال: من سورة الناس صعوداً إلى النبأ.
   «لقّنّي»: تُسمع الآية بتكرار ثم مهلة ليردّدها الطفل، آيةً بعد آية، ثم الآيتان معاً… حتى السورة كاملة.
   نجمة لكل سورة يحفظها، وشارة عند كل عشر سور، والتلقين بصوت المعلّم الذي يختاره ولي الأمر. */
(() => {
  const V = APP.views;
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const D = n => AR.toArabicDigits(String(n));
  const SURAHS = Array.from({ length: 37 }, (_, i) => 114 - i);  // الناس ← النبأ
  const stripB = t => /^بِسْمِ /.test(t) ? t.split(' ').slice(4).join(' ') : t;
  const prog = async () => (await DB.setting('juzamma')) || {};
  const okReciters = () => QA.RECITERS.filter(r => !r.full && (!r.mine || (APP.state && APP.state.reviewerUnlocked) || Object.keys(window.MY_QURAN || {}).length));
  async function ayat(s) { const n = QA.COUNTS[s - 1]; return (await Promise.all(Array.from({ length: n }, (_, k) => DB.get('items', `quran:${s}:${k + 1}`).catch(() => null)))).map((x, k) => x ? (k === 0 ? stripB(x.text) : x.text) : ''); }

  let run = 0;
  const stop = () => { run++; QA.P.q = []; QA.stop(); };
  const playOne = (list, reciter, rep) => new Promise(res => QA.play(list, { reciter, rep, noBasmala: true, onEnd: () => res(true) }));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  V.juzamma = async (el, [sid]) => {
    const p = await prog(), done = SURAHS.filter(s => p[s]).length;
    if (!sid) {
      el.innerHTML = `<div class="row"><h1>🧒 حفظ جزء عمّ</h1></div>
        <div class="sub">نبدأ من قصار السور: سورة الناس ثم الفلق ثم الإخلاص… اضغط «لقّنّي» فيسمع طفلك الآية ويردّدها بعد الشيخ. وكلما حفظ سورة نال نجمة ⭐</div>
        <div class="card jz-score"><b>⭐ ${D(done)} / ${D(SURAHS.length)} سورة</b><div class="lr-progress"><i style="width:${Math.round(done / SURAHS.length * 100)}%"></i></div>
          <div class="jz-badges">${[10, 20, 30, 37].map(n => `<span class="${done >= n ? 'on' : ''}">${n === 37 ? '🏆 الجزء كاملاً' : '🏅 ' + D(n) + ' سورة'}</span>`).join('')}</div></div>
        <div class="jz-grid">${SURAHS.map((s, i) => `<a class="jz-tile ${p[s] ? 'done' : ''}" href="#/juzamma/${s}" style="--h:${i * 41 % 360}"><span class="jz-n">${D(s)}</span><b>${esc(AR.SURAHS[s - 1])}</b><small>${D(QA.COUNTS[s - 1])} آيات</small>${p[s] ? '<i>⭐</i>' : ''}</a>`).join('')}</div>`;
      return;
    }
    const s = +sid, txt = await ayat(s), n = txt.length;
    const cur = (await DB.setting('juzamma-reciter')) || 'husary-muallim';
    el.innerHTML = `<div class="row"><a class="btn sm" href="#/juzamma">← السور</a><h2 style="margin:0">سورة ${esc(AR.SURAHS[s - 1])}</h2><span class="spacer"></span>${p[s] ? '<span class="tag st-ok">⭐ محفوظة</span>' : ''}</div>
      <div class="card"><div class="filters" style="flex-wrap:wrap">
        <label>الشيخ المعلّم <select id="jzR">${okReciters().map(r => `<option value="${r.id}" ${r.id === cur ? 'selected' : ''}>${esc(r.n)} — ${esc(r.d)}</option>`).join('')}</select></label>
        <label>تكرار كل آية <select id="jzN"><option>2</option><option selected>3</option><option>5</option></select></label></div>
        <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn primary" data-t>🔁 لقّنّي آيةً آية</button><button class="btn" data-all>🎧 استمع للسورة</button><button class="btn" data-x>⏹ إيقاف</button></div>
        <div class="muted" style="font-size:12.5px;margin-top:6px">بعد كل آية مهلة قصيرة ليردّد الطفل. ثم تُعاد الآيات معاً حتى يحفظ السورة متصلة.</div></div>
      <div class="jz-ayat">${txt.map((t, k) => `<p class="quran-text jz-a" data-k="${k}">${esc(t)} <span class="muted">﴿${D(k + 1)}﴾</span></p>`).join('')}</div>
      <div class="row" style="justify-content:center;gap:8px;margin-top:12px"><button class="btn ${p[s] ? '' : 'primary'}" data-ok>${p[s] ? '↺ ألغِ النجمة' : '⭐ حفظتها!'}</button>${SURAHS.indexOf(s) + 1 < SURAHS.length ? `<a class="btn" href="#/juzamma/${SURAHS[SURAHS.indexOf(s) + 1]}">السورة التالية ←</a>` : ''}</div>`;
    const $ = q => el.querySelector(q), R = () => $('#jzR').value;
    const mark = k => el.querySelectorAll('.jz-a').forEach(x => x.classList.toggle('on', +x.dataset.k === k));
    $('#jzR').onchange = e => DB.setting('juzamma-reciter', e.target.value);
    $('[data-x]').onclick = () => { stop(); mark(-1); };
    $('[data-all]').onclick = () => { stop(); QA.play(QA.surahAyat(s), { reciter: R() }); };
    $('[data-t]').onclick = async () => {
      stop(); const my = run, rep = +$('#jzN').value;
      for (let k = 0; k < n; k++) {
        mark(k); if (!(await playOne([[s, k + 1]], R(), rep)) || my !== run) return;
        await wait(1500 + txt[k].length * 70); if (my !== run) return;
        // كل آيتين: تُعاد الآيات المحفوظة حتى الآن متصلة
        if (k > 0 && (k % 2 === 1 || k === n - 1)) { mark(-1); if (!(await playOne(Array.from({ length: k + 1 }, (_, j) => [s, j + 1]), R(), 1)) || my !== run) return; await wait(1200); if (my !== run) return; }
      }
      mark(-1); if (my === run) APP.toast('👏 أحسنت! هل حفظتها؟ اضغط «حفظتها» لتأخذ نجمة', 5000);
    };
    $('[data-ok]').onclick = async () => { const q = await prog(); if (q[s]) delete q[s]; else { q[s] = Date.now(); if (navigator.vibrate) navigator.vibrate([40, 60, 40]); APP.toast('⭐ ما شاء الله! حفظت سورة ' + AR.SURAHS[s - 1]); } await DB.setting('juzamma', q); APP.rerender(); };
  };
  window.JUZAMMA = { SURAHS, stop };
})();
