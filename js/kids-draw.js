/* 🎨 زاد البراعم: أرسم وألوّن — دروس رسم خطوة بخطوة، وصفحات تلوين باللمس، ورسم حر.
   الصور كلها لأشياء (بيوت، مساجد، أشجار، أزهار، مركبات، أشكال) بلا ذوات أرواح. */
(() => {
  const C = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const E = (x, y, rx, ry) => `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const STAR = (cx, cy, ro, ri) => { let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); } return d + 'Z'; };
  const f = (d, tr) => ({ d, f: 1, tr }), l = d => ({ d });
  const petals = (cx, cy, n, len, w) => Array.from({ length: n }, (_, i) => f(`M${cx} ${cy}Q${cx - w} ${cy - len / 2} ${cx} ${cy - len}Q${cx + w} ${cy - len / 2} ${cx} ${cy}Z`, `rotate(${i * 360 / n} ${cx} ${cy})`));

  // كل صورة: خطوات، وكل خطوة عناصر (f = قابلة للتلوين)
  const PICS = [
    { id: 'shapes', n: 'الأشكال', ic: '🔷', s: [[f(C(85, 85, 50))], [f(R(170, 40, 90, 90))], [f('M85 170L140 260H30Z')], [f(STAR(215, 215, 52, 22))]] },
    { id: 'sun', n: 'الشمس', ic: '☀️', s: [[f(C(150, 150, 60))], Array.from({ length: 8 }, (_, i) => f('M143 70L150 40L157 70Z', `rotate(${i * 45} 150 150)`))] },
    { id: 'house', n: 'البيت', ic: '🏠', s: [[f(R(70, 150, 160, 110))], [f('M55 155L150 70L245 155Z')], [f(R(130, 195, 40, 65))], [f(R(85, 170, 32, 32)), f(R(183, 170, 32, 32))], [l('M101 170v32M85 186h32M199 170v32M183 186h32'), l('M20 260H280')]] },
    { id: 'tree', n: 'الشجرة', ic: '🌳', s: [[f(R(135, 165, 30, 95))], [f('M88 168Q55 150 80 118Q72 78 116 78Q138 46 170 72Q212 62 216 104Q248 124 222 160Q214 182 180 174Q150 192 120 176Q100 186 88 168Z')], [f(C(115, 120, 9)), f(C(180, 105, 9)), f(C(160, 150, 9)), f(C(198, 140, 9)), f(C(135, 95, 9))], [l('M40 260H260')]] },
    { id: 'flower', n: 'الزهرة', ic: '🌸', s: [[f('M105 220h90l-12 60h-66Z')], [l('M150 220V140'), f('M150 190Q120 175 115 195Q135 205 150 190Z'), f('M150 175Q180 160 185 180Q165 190 150 175Z')], petals(150, 110, 6, 58, 24), [f(C(150, 110, 18))]] },
    { id: 'mosque', n: 'المسجد', ic: '🕌', s: [[f(R(80, 160, 140, 100))], [f('M90 160Q90 95 150 82Q210 95 210 160Z')], [l('M150 82V60'), f('M150 40a14 14 0 1 0 0 26a10 10 0 1 1 0-26Z')], [f(R(40, 110, 26, 150)), f(R(234, 110, 26, 150)), f('M40 110L53 80L66 110Z'), f('M234 110L247 80L260 110Z')], [f('M132 260V215Q150 192 168 215V260Z'), f('M98 205V185Q107 174 116 185V205Z'), f('M184 205V185Q193 174 202 185V205Z')], [l('M20 260H280')]] },
    { id: 'kaaba', n: 'الكعبة', ic: '🕋', s: [[f('M60 110L170 130V265L60 240Z')], [f('M170 130L250 105V235L170 265Z')], [f('M60 110L140 88L250 105L170 130Z')], [f('M60 128L170 150L250 124V136L170 162L60 140Z')], [f('M100 175L132 181V253L100 246Z')]] },
    { id: 'lantern', n: 'الفانوس', ic: '🏮', s: [[l('M150 20V45'), f('M120 70L150 45L180 70Z')], [f('M110 70H190L205 110H95Z')], [f('M95 110H205L190 220H110Z')], [l('M150 110V220M122 110L130 220M178 110L170 220')], [f('M110 220H190L175 250H125Z'), f(R(140, 250, 20, 18))]] },
    { id: 'apple', n: 'التفاحة', ic: '🍎', s: [[f('M150 95Q110 70 80 100Q50 140 75 200Q100 255 150 238Q200 255 225 200Q250 140 220 100Q190 70 150 95Z')], [l('M150 95Q148 70 160 50')], [f('M158 70Q185 45 210 60Q185 85 158 70Z')]] },
    { id: 'icecream', n: 'المثلجات', ic: '🍦', s: [[f('M105 150L150 275L195 150Z')], [l('M118 175L182 175M127 200L173 200M136 225L164 225')], [f('M100 152Q90 110 130 108Q150 80 175 108Q212 112 200 152Z')], [f(C(150, 80, 28))]] },
    { id: 'car', n: 'السيارة', ic: '🚗', s: [[f('M40 200V160Q40 150 52 148L95 145L125 105H200L235 145L255 150Q262 152 262 162V200Z')], [f('M105 145L130 115H158V145Z'), f('M168 115H195L220 145H168Z')], [f(C(95, 205, 26)), f(C(210, 205, 26))], [f(C(95, 205, 10)), f(C(210, 205, 10)), f(R(245, 160, 14, 10))]] },
    { id: 'boat', n: 'القارب', ic: '⛵', s: [[f('M60 200H240L215 240H85Z')], [l('M150 200V50')], [f('M150 60L150 185L80 185Z'), f('M155 75L155 185L215 185Z')], [l('M20 255Q45 240 70 255T120 255T170 255T220 255T270 255')], [f(C(250, 50, 20))]] },
    { id: 'balloons', n: 'البالونات', ic: '🎈', s: [[f(E(100, 100, 38, 46)), l('M100 146Q92 200 110 270')], [f(E(170, 80, 38, 46)), l('M170 126Q178 190 150 270')], [f(E(220, 140, 34, 42)), l('M220 182Q210 230 160 270')]] },
    { id: 'kite', n: 'الطائرة الورقية', ic: '🪁', s: [[f('M150 30L150 120L90 120Z'), f('M150 30L210 120L150 120Z')], [f('M90 120L150 120L150 230Z'), f('M150 120L210 120L150 230Z')], [l('M150 230Q170 250 150 270Q130 290 160 300'), f('M150 250l10 6l-10 6z'), f('M142 278l10 6l-10 6z')]] },
    { id: 'umbrella', n: 'المظلة', ic: '☂️', s: [[f('M40 150Q50 60 150 50Q250 60 260 150Q235 132 205 150Q178 132 150 150Q122 132 95 150Q68 132 40 150Z')], [l('M150 50Q130 100 150 150M150 50Q170 100 150 150M150 50Q90 90 95 150M150 50Q210 90 205 150')], [l('M150 150V250Q150 270 130 270Q115 270 115 255')]] },
    { id: 'rocket', n: 'الصاروخ', ic: '🚀', s: [[f('M150 30Q195 80 190 210H110Q105 80 150 30Z')], [f(C(150, 110, 20))], [f('M110 170L75 230L110 210Z'), f('M190 170L225 230L190 210Z')], [f('M120 210Q150 290 180 210Z')], [f(STAR(60, 60, 14, 6)), f(STAR(245, 80, 12, 5)), f(STAR(250, 250, 10, 4))]] },
    { id: 'moonstar', n: 'الهلال والنجمة', ic: '🌙', s: [[f('M150 40A110 110 0 1 0 150 260A90 90 0 1 1 150 40Z')], [f(STAR(200, 140, 40, 17))]] },
  ];
  const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa', '#ec407a', '#8d6e63', '#212121', '#9e9e9e', '#ffffff', '#81d4fa', '#a5d6a7', '#ffcc80', '#f8bbd0'];

  const els = (pic, opts = {}) => pic.s.map((st, i) => st.map(e => `<path d="${e.d}"${e.tr ? ` transform="${e.tr}"` : ''} data-st="${i}"${e.f ? ' class="kdw-f"' : ''}/>`).join('')).join('');
  const svgOf = (pic, inner) => `<svg viewBox="0 0 300 300" class="kdw-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const key = id => 'kdraw-' + id;
  const loadFill = id => { try { return JSON.parse(localStorage.getItem(key(id)) || '{}'); } catch (e) { return {}; } };
  const saveFill = (id, o) => { try { localStorage.setItem(key(id), JSON.stringify(o)); } catch (e) { } };
  const say = t => { try { LEARN.say ? LEARN.say(t) : null; } catch (e) { } };

  function palette(b, cur, onPick) {
    return `<div class="kdw-pal">${COLORS.map(c => `<button class="kdw-c${c === cur ? ' on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>`;
  }
  function bindPal(b, set) {
    b.querySelectorAll('.kdw-c').forEach(x => x.onclick = () => { b.querySelectorAll('.kdw-c').forEach(y => y.classList.remove('on')); x.classList.add('on'); set(x.dataset.c); });
  }
  function download(svgEl, name) {
    const s = new XMLSerializer().serializeToString(svgEl), img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 900; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 900, 900); x.drawImage(img, 0, 0, 900, 900); dl(c, name); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }
  function dl(canvas, name) { const a = document.createElement('a'); a.download = name + '.png'; a.href = canvas.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); APP.toast && APP.toast('حُفظت الصورة 👍'); }

  // ===== التلوين =====
  function color(b, pic) {
    let cur = COLORS[0]; const fill = loadFill(pic.id);
    b.innerHTML = `<div class="kdw-wrap"><div class="kdw-board">${svgOf(pic, els(pic))}</div>${palette(b, cur)}
      <div class="kdw-act"><button class="btn" id="kUndo">↩️ تراجع</button><button class="btn" id="kClear">🧽 مسح الألوان</button><button class="btn" id="kSave">💾 حفظ الصورة</button></div>
      <div class="kdw-tip">اختر لوناً ثم المس أي جزء من الرسمة ليتلوّن.</div></div>`;
    const svg = b.querySelector('svg'), fs = [...svg.querySelectorAll('.kdw-f')], hist = [];
    fs.forEach((p, i) => { p.style.fill = fill[i] || '#fff'; p.onclick = () => { hist.push([i, p.style.fill]); p.style.fill = cur; fill[i] = cur; saveFill(pic.id, fill); }; });
    bindPal(b, c => cur = c);
    b.querySelector('#kUndo').onclick = () => { const h = hist.pop(); if (!h) return; fs[h[0]].style.fill = h[1]; fill[h[0]] = h[1]; saveFill(pic.id, fill); };
    b.querySelector('#kClear').onclick = () => { fs.forEach((p, i) => { p.style.fill = '#fff'; }); for (const k in fill) delete fill[k]; saveFill(pic.id, fill); };
    b.querySelector('#kSave').onclick = () => download(svg, 'تلوين-' + pic.n);
  }

  // ===== لوحة رسم (للرسم الحر والدروس) =====
  function pad(holder, getColor, getSize) {
    const cv = document.createElement('canvas'); cv.className = 'kdw-cv'; holder.appendChild(cv);
    const ctx = cv.getContext('2d'), strokes = [];
    const fit = () => { const r = holder.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); redraw(); };
    const redraw = () => { ctx.clearRect(0, 0, cv.width, cv.height); strokes.forEach(s => { ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); s.p.forEach(([x, y], i) => { const r = cv.getBoundingClientRect(); const X = x * r.width, Y = y * r.height; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); if (s.p.length === 1) { ctx.lineTo(s.p[0][0] * cv.getBoundingClientRect().width + .1, s.p[0][1] * cv.getBoundingClientRect().height); } ctx.stroke(); }); };
    let cur = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); cur = { c: getColor(), w: getSize(), p: [pt(e)] }; strokes.push(cur); redraw(); });
    cv.addEventListener('pointermove', e => { if (!cur) return; cur.p.push(pt(e)); redraw(); });
    const end = () => cur = null; cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    setTimeout(fit, 30); window.addEventListener('resize', fit);
    return { undo() { strokes.pop(); redraw(); }, clear() { strokes.length = 0; redraw(); }, cv, strokes };
  }
  function tools(b) {
    let col = '#212121', size = 6;
    const h = `${palette(b, col)}<div class="kdw-size">${[3, 6, 12, 22].map(s => `<button class="kdw-s${s === size ? ' on' : ''}" data-s="${s}"><i style="width:${s}px;height:${s}px"></i></button>`).join('')}<button class="kdw-s" data-s="er">🧽</button></div>`;
    return { h, bind(pd) {
      bindPal(b, c => { col = c; b.querySelectorAll('.kdw-s[data-s="er"]').forEach(x => x.classList.remove('on')); });
      b.querySelectorAll('.kdw-s').forEach(x => x.onclick = () => { b.querySelectorAll('.kdw-s').forEach(y => y.classList.remove('on')); x.classList.add('on'); if (x.dataset.s === 'er') { col = '#ffffff'; size = 24; } else { size = +x.dataset.s; if (col === '#ffffff') col = '#212121'; } });
    }, col: () => col, size: () => size };
  }
  function free(b) {
    const t = tools(b);
    b.innerHTML = `<div class="kdw-wrap"><div class="kdw-board kdw-paper" id="kPad"></div>${t.h}
      <div class="kdw-act"><button class="btn" id="kUndo">↩️ تراجع</button><button class="btn" id="kClear">🗑️ ورقة جديدة</button><button class="btn" id="kSave">💾 حفظ</button></div></div>`;
    const pd = pad(b.querySelector('#kPad'), t.col, t.size); t.bind(pd);
    b.querySelector('#kUndo').onclick = pd.undo; b.querySelector('#kClear').onclick = pd.clear;
    b.querySelector('#kSave').onclick = () => { const c = document.createElement('canvas'); c.width = pd.cv.width; c.height = pd.cv.height; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(pd.cv, 0, 0); dl(c, 'رسمتي'); };
  }

  // ===== درس رسم خطوة بخطوة =====
  function lesson(b, pic) {
    const t = tools(b); let step = 0; const N = pic.s.length;
    b.innerHTML = `<div class="kdw-wrap"><div class="kdw-steps" id="kSt"></div>
      <div class="kdw-board kdw-paper kdw-lesson" id="kPad"><div class="kdw-guide" id="kG"></div></div>${t.h}
      <div class="kdw-act"><button class="btn" id="kPrev">→ السابقة</button><button class="btn" id="kShow">👀 شاهد</button><button class="btn primary" id="kNext">التالية ←</button></div>
      <div class="kdw-act"><button class="btn" id="kUndo">↩️ تراجع</button><button class="btn" id="kClear">🗑️ امسح رسمي</button><button class="btn" id="kHide">🙈 إخفاء الدليل</button></div>
      <div class="kdw-tip">انظر إلى الخطوة الملوّنة المتقطعة، ثم ارسمها بإصبعك فوقها. عندما تنتهي اضغط «التالية».</div></div>`;
    const G = b.querySelector('#kG'), pd = pad(b.querySelector('#kPad'), t.col, t.size); t.bind(pd);
    const draw = anim => {
      G.innerHTML = svgOf(pic, pic.s.map((st, i) => i > step ? '' : st.map(e => `<path d="${e.d}"${e.tr ? ` transform="${e.tr}"` : ''} pathLength="1" class="${i === step ? 'kdw-now' + (anim ? ' kdw-anim' : '') : 'kdw-old'}"/>`).join('')).join(''));
      b.querySelector('#kSt').innerHTML = `<b>${pic.ic} ${pic.n}</b> — الخطوة ${AR.toArabicDigits(String(step + 1))} من ${AR.toArabicDigits(String(N))}<div class="kdw-dots">${pic.s.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>`;
      b.querySelector('#kNext').textContent = step === N - 1 ? '🎨 لوّنها' : 'التالية ←';
    };
    draw(true);
    b.querySelector('#kPrev').onclick = () => { if (step > 0) { step--; draw(true); } };
    b.querySelector('#kNext').onclick = () => { if (step < N - 1) { step++; draw(true); } else location.hash = '#/kids/draw/color/' + pic.id; };
    b.querySelector('#kShow').onclick = () => draw(true);
    b.querySelector('#kUndo').onclick = pd.undo; b.querySelector('#kClear').onclick = pd.clear;
    b.querySelector('#kHide').onclick = e => { G.classList.toggle('off'); e.target.textContent = G.classList.contains('off') ? '👁️ إظهار الدليل' : '🙈 إخفاء الدليل'; };
  }

  window.KDRAW = (sh, mode, id) => {
    const pic = PICS.find(p => p.id === id);
    if (mode === 'color' && pic) return color(sh('🎨 لوّن: ' + pic.n, '#/kids/draw/color'), pic);
    if (mode === 'learn' && pic) return lesson(sh('✏️ ارسم: ' + pic.n, '#/kids/draw/learn'), pic);
    if (mode === 'free') return free(sh('🖍️ ارسم ما تحب', '#/kids/draw'));
    if (mode === 'color' || mode === 'learn') {
      const b = sh(mode === 'color' ? '🎨 اختر صورة لتلوّنها' : '✏️ اختر ما تتعلم رسمه', '#/kids/draw');
      b.innerHTML = `<div class="kdw-list">${PICS.map(p => `<a class="kdw-pic" href="#/kids/draw/${mode}/${p.id}"><div class="kdw-thumb">${svgOf(p, els(p))}</div><b>${p.ic} ${p.n}</b></a>`).join('')}</div>`;
      if (mode === 'color') b.querySelectorAll('.kdw-pic').forEach((a, i) => { const fl = loadFill(PICS[i].id); a.querySelectorAll('.kdw-f').forEach((p, j) => p.style.fill = fl[j] || '#fff'); });
      return;
    }
    const b = sh('🎨 أرسم وألوّن', '#/kids');
    b.innerHTML = `<div class="kd-home">
      <a class="kd-tile k1" href="#/kids/draw/learn"><span>✏️</span><b>تعلّم الرسم</b></a>
      <a class="kd-tile k2" href="#/kids/draw/color"><span>🎨</span><b>لوّن الصور</b></a>
      <a class="kd-tile k3" href="#/kids/draw/free"><span>🖍️</span><b>ارسم ما تحب</b></a></div>
      <div class="kdw-tip">«تعلّم الرسم»: ارسم الصورة خطوة خطوة فوق الدليل. «لوّن الصور»: المس الأجزاء لتلوّنها. «ارسم ما تحب»: ورقة بيضاء وألوان.</div>`;
  };
})();
