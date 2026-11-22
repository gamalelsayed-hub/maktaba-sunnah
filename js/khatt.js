/* 🖋️ الخط العربي: تدريب النسخ والرقعة والكوفي بالتتبع على الشاشة، مع قياس دقة التتبع.
   الخطوط: Noto Naskh Arabic، وAref Ruqaa، وReem Kufi (رخصة OFL المفتوحة). */
(() => {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(String(n));
  const STY = {
    naskh: { n: 'النسخ', font: 'Naskh', d: 'خط المصاحف والكتب المطبوعة، واضح متناسق، وهو أنسب خط يبدأ به المتعلم. تُقاس أطوال حروفه بالنقطة المربعة التي يرسمها رأس القلم، وتنزل بعض حروفه تحت السطر كالجيم والعين والميم والنون والواو والراء.' },
    ruqaa: { n: 'الرقعة', font: 'Ruqaa', d: 'خط الكتابة اليومية السريعة، حروفه قصيرة مستقيمة بلا زخرفة، ويُكتب بسرعة. أكثر حروفه على السطر، وينزل بعضها تحته كالجيم والعين والميم في آخر الكلمة. أتقنه تتحسّن كتابتك في الدفتر مباشرة.' },
    kufi: { n: 'الكوفي', font: 'Kufi', d: 'أقدم الخطوط العربية، هندسي ذو زوايا وخطوط مستقيمة، وبه كُتبت أوائل المصاحف. يكثر اليوم في الزخرفة والشعارات.' },
  };
  const LETTERS = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');
  const FORMS = l => 'ادذرزو'.includes(l) ? [l, 'ـ' + l] : [l, l + 'ـ', 'ـ' + l + 'ـ', 'ـ' + l];
  const WORDS = ['بسم', 'الله', 'محمد', 'رحمة', 'علم', 'كتاب', 'قلم', 'نور', 'صبر', 'شكر', 'سلام', 'جنة', 'مسجد', 'وطن', 'أمي', 'أبي'];
  const PHRASES = ['بسم الله الرحمن الرحيم', 'الحمد لله رب العالمين', 'لا إله إلا الله', 'سبحان الله وبحمده', 'رب زدني علماً', 'العلم نور', 'من جدّ وجد'];
  const SETS = { letters: ['الحروف المفردة', LETTERS], forms: ['أشكال الحرف في الكلمة', LETTERS.flatMap(FORMS)], words: ['كلمات', WORDS], phrases: ['جمل وعبارات', PHRASES] };

  V.khatt = async (el, [sty, set, idx]) => {
    if (!sty || !STY[sty]) {
      el.innerHTML = `<a class="btn sm" href="#/lugha">← علوم العربية</a><div class="rf-hero lg-hero"><h1>🖋️ الخط العربي</h1><div>تدرّب بإصبعك أو بالقلم: تتبّع الحرف فوق النموذج، ثم اكتبه بلا نموذج، ويقيس لك التطبيق دقة تتبعك.</div></div>
        <div class="lg-grid">${Object.entries(STY).map(([k, s]) => `<a class="card lg-tile" href="#/khatt/${k}"><span class="kh-sample" style="font-family:${s.font}">خط ${s.n}</span><b>${s.n}</b><small>${esc(s.d.slice(0, 70))}…</small></a>`).join('')}</div>
        <div class="card"><b>💡 نصائح للبداية</b><ul class="lg-rules"><li>ابدأ بخط الرقعة إن كان هدفك تحسين الكتابة اليومية، وبالنسخ إن أردت الخط الجميل المتقن.</li><li>اكتب الحرف ببطء أولاً فوق النموذج، ثم أسرع تدريجياً.</li><li>تدرّب ربع ساعة كل يوم أفضل من ساعتين مرة في الأسبوع.</li><li>بعد الشاشة جرّب بقلم حقيقي على ورق مسطّر بالشكل نفسه.</li></ul></div>`;
      return;
    }
    const S = STY[sty];
    if (!set || !SETS[set]) {
      el.innerHTML = `<a class="btn sm" href="#/khatt">← الخطوط</a><div class="rf-hero lg-hero"><h1 style="font-family:${S.font}">خط ${S.n}</h1><div>${esc(S.d)}</div></div>
        <div class="lg-list">${Object.entries(SETS).map(([k, [t, arr]]) => `<a class="lg-row" href="#/khatt/${sty}/${k}/0"><span class="lg-n">✍️</span><b>${t}</b><small class="muted">${D(arr.length)}</small></a>`).join('')}</div>`;
      return;
    }
    const [title, arr] = SETS[set], i = Math.max(0, Math.min(arr.length - 1, +idx || 0)), txt = arr[i];
    el.innerHTML = `<a class="btn sm" href="#/khatt/${sty}">← ${S.n}</a>
      <div class="kh-head"><b>${title}</b><span class="muted">${D(i + 1)} / ${D(arr.length)}</span></div>
      <div class="kh-board" id="khB"><div class="kh-guide" id="khG" style="font-family:${S.font}">${esc(txt)}</div><canvas id="khC"></canvas><div class="kh-line"></div></div>
      <div class="kdw-size">${[4, 7, 11, 16].map(s => `<button class="kdw-s${s === 7 ? ' on' : ''}" data-s="${s}"><i style="width:${s}px;height:${s}px"></i></button>`).join('')}</div>
      <div class="kdw-act"><button class="btn" id="khU">↩️ تراجع</button><button class="btn" id="khX">🗑️ امسح</button><button class="btn" id="khH">🙈 بلا نموذج</button><button class="btn primary" id="khS">⭐ قيّم كتابتي</button></div>
      <div class="kh-res" id="khR"></div>
      <div class="row th-nav">${i > 0 ? `<a class="btn" href="#/khatt/${sty}/${set}/${i - 1}">→ السابق</a>` : '<span></span>'}${i < arr.length - 1 ? `<a class="btn primary" href="#/khatt/${sty}/${set}/${i + 1}">التالي ←</a>` : ''}</div>`;
    const B = el.querySelector('#khB'), C = el.querySelector('#khC'), G = el.querySelector('#khG'), x = C.getContext('2d');
    let size = 7, strokes = [], cur = null;
    G.style.fontSize = (txt.length <= 3 ? 140 : txt.length <= 6 ? 96 : txt.length <= 12 ? 56 : 36) + 'px';
    const fit = () => { const r = B.getBoundingClientRect(), d = window.devicePixelRatio || 1; C.width = r.width * d; C.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0); draw(); };
    const draw = () => { const r = C.getBoundingClientRect(); x.clearRect(0, 0, r.width, r.height); x.strokeStyle = '#123'; x.lineCap = x.lineJoin = 'round'; strokes.forEach(s => { x.lineWidth = s.w; x.beginPath(); s.p.forEach(([a, b], k) => k ? x.lineTo(a * r.width, b * r.height) : x.moveTo(a * r.width, b * r.height)); x.stroke(); }); };
    const pt = e => { const r = C.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    C.addEventListener('pointerdown', e => { C.setPointerCapture(e.pointerId); cur = { w: size, p: [pt(e)] }; strokes.push(cur); draw(); });
    C.addEventListener('pointermove', e => { if (cur) { cur.p.push(pt(e)); draw(); } });
    C.addEventListener('pointerup', () => cur = null); C.addEventListener('pointercancel', () => cur = null);
    setTimeout(fit, 50);
    el.querySelectorAll('.kdw-s').forEach(b => b.onclick = () => { el.querySelectorAll('.kdw-s').forEach(y => y.classList.remove('on')); b.classList.add('on'); size = +b.dataset.s; });
    el.querySelector('#khU').onclick = () => { strokes.pop(); draw(); };
    el.querySelector('#khX').onclick = () => { strokes = []; draw(); el.querySelector('#khR').innerHTML = ''; };
    el.querySelector('#khH').onclick = e => { G.classList.toggle('off'); e.target.textContent = G.classList.contains('off') ? '👁️ أظهر النموذج' : '🙈 بلا نموذج'; };
    // التقييم: نرسم النموذج في لوحة خفية ونقارن: كم من كتابتك داخل النموذج، وكم من النموذج غطّيت
    el.querySelector('#khS').onclick = async () => {
      if (!strokes.length) { APP.toast('اكتب أولاً'); return; }
      await document.fonts.ready;
      const r = C.getBoundingClientRect(), W = Math.round(r.width / 2), H = Math.round(r.height / 2);
      const g = document.createElement('canvas'); g.width = W; g.height = H; const gx = g.getContext('2d');
      const cs = getComputedStyle(G); gx.font = `${parseFloat(cs.fontSize) / 2}px ${S.font}`; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.direction = 'rtl'; gx.fillStyle = '#000';
      const gr = G.getBoundingClientRect(); gx.fillText(txt, (gr.left - r.left + gr.width / 2) / 2, (gr.top - r.top + gr.height / 2) / 2);
      const m = document.createElement('canvas'); m.width = W; m.height = H; const mx = m.getContext('2d'); mx.lineCap = mx.lineJoin = 'round'; mx.strokeStyle = '#000';
      strokes.forEach(s => { mx.lineWidth = Math.max(2, s.w / 2); mx.beginPath(); s.p.forEach(([a, b], k) => k ? mx.lineTo(a * W, b * H) : mx.moveTo(a * W, b * H)); mx.stroke(); });
      const A = gx.getImageData(0, 0, W, H).data, Bm = mx.getImageData(0, 0, W, H).data;
      // تسامح بسيط: نوسّع النموذج بضع بكسلات
      const near = new Uint8Array(W * H), rad = 4;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (A[(yy * W + xx) * 4 + 3] > 80) for (let dy = -rad; dy <= rad; dy++) { const y2 = yy + dy; if (y2 < 0 || y2 >= H) continue; for (let dx = -rad; dx <= rad; dx++) { const x2 = xx + dx; if (x2 >= 0 && x2 < W) near[y2 * W + x2] = 1; } }
      let drawn = 0, inside = 0, glyph = 0, covered = 0;
      const mine = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) if (Bm[k * 4 + 3] > 80) { mine[k] = 1; drawn++; if (near[k]) inside++; }
      const myNear = new Uint8Array(W * H); for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (mine[yy * W + xx]) for (let dy = -rad; dy <= rad; dy++) { const y2 = yy + dy; if (y2 < 0 || y2 >= H) continue; for (let dx = -rad; dx <= rad; dx++) { const x2 = xx + dx; if (x2 >= 0 && x2 < W) myNear[y2 * W + x2] = 1; } }
      for (let k = 0; k < W * H; k++) if (A[k * 4 + 3] > 80) { glyph++; if (myNear[k]) covered++; }
      const acc = drawn ? inside / drawn : 0, cov = glyph ? covered / glyph : 0, sc = Math.round(Math.min(acc, cov) * 100);
      const stars = sc >= 85 ? 3 : sc >= 65 ? 2 : sc >= 40 ? 1 : 0;
      el.querySelector('#khR').innerHTML = `<div class="card kh-score"><div class="kh-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><b>${D(sc)}٪</b><small>الدقة ${D(Math.round(acc * 100))}٪ · تغطية النموذج ${D(Math.round(cov * 100))}٪</small><div class="muted">${stars === 3 ? 'ممتاز! جرّب الآن «بلا نموذج».' : stars === 2 ? 'جيد جداً، انتبه لاتجاه الحرف ونهاياته.' : 'تمهّل واتبع النموذج حرفاً حرفاً.'}</div></div>`;
    };
  };
})();
