/* 🖼️ صمّم صورة للمشاركة: أي نص (آية، حديث، ذكر، فقرة من كتاب، أو نص تحدّده) يصير صورة جميلة
   لمنشور فيسبوك أو حالة واتساب، بخلفيات طبيعية مرسومة على الجهاز (بحر، غروب، سماء ليل، صحراء، جبال...)
   أو بصورة من جهازك. كل شيء يُرسم محلياً بلا إنترنت. */
(() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // مولّد أرقام عشوائية ثابت (حتى يبقى شكل الخلفية كما هو حتى تضغط «شكل آخر»)
  const RNG = seed => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const lg = (x, y0, y1, stops, W) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const glow = (x, cx, cy, r, c) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };
  const ridge = (x, W, H, base, amp, rnd, color, steps = 7, jag = 0.5) => {
    x.beginPath(); x.moveTo(0, H); let y = base + (rnd() - .5) * amp; x.lineTo(0, y);
    const n = steps * 4;
    for (let i = 1; i <= n; i++) { const px = W * i / n; y = base + Math.sin(i / n * Math.PI * (1 + rnd())) * amp * .4 + (rnd() - .5) * amp * jag; x.lineTo(px, y); }
    x.lineTo(W, H); x.closePath(); x.fillStyle = color; x.fill();
  };
  const hills = (x, W, H, base, amp, rnd, color) => {
    x.beginPath(); x.moveTo(0, H); x.lineTo(0, base);
    const a = rnd() * 6, f = 1 + rnd() * 1.5;
    for (let i = 0; i <= 60; i++) { const px = W * i / 60; x.lineTo(px, base + Math.sin(i / 60 * Math.PI * f + a) * amp + Math.sin(i / 60 * Math.PI * 3.1 + a * 2) * amp * .3); }
    x.lineTo(W, H); x.closePath(); x.fillStyle = color; x.fill();
  };

  // ===== أدوات الواقعية: ضجيج متدرّج، غيوم مظلّلة، ماء بمنظور، حبيبات وإضاءة كالصور =====
  const clamp = (v, a = 0, b = 255) => v < a ? a : v > b ? b : v;
  const sstep = (a, b, v) => { v = clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); };
  const mkNoise = rnd => {
    const N = 256, t = new Float32Array(N * N); for (let i = 0; i < t.length; i++) t[i] = rnd();
    const sm = v => v * v * (3 - 2 * v);
    return (px, py) => {
      const xi = Math.floor(px), yi = Math.floor(py), fx = sm(px - xi), fy = sm(py - yi);
      const a = t[((yi & 255) << 8) | (xi & 255)], b = t[((yi & 255) << 8) | ((xi + 1) & 255)], c = t[(((yi + 1) & 255) << 8) | (xi & 255)], d = t[(((yi + 1) & 255) << 8) | ((xi + 1) & 255)];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  };
  const fbm = (n, px, py, oct = 5) => { let s = 0, a = .5, f = 1, m = 0; for (let i = 0; i < oct; i++) { s += n(px * f, py * f) * a; m += a; a *= .5; f *= 2; } return s / m; };
  const lowCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(2, w | 0); c.height = Math.max(2, h | 0); return c; };
  const upscale = (x, c, dx, dy, dw, dh) => { x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(c, dx, dy, dw, dh); };
  const blurred = (x, px, fn) => { const ok = 'filter' in x; if (ok) x.filter = `blur(${px}px)`; fn(); if (ok) x.filter = 'none'; };
  // غيوم حقيقية الشكل: كثافة ضجيجية + تظليل من جهة الشمس + حافة ناعمة
  const clouds = (x, W, H, r, o) => {
    const n = mkNoise(r), y0 = H * o.y0, hh = H * (o.y1 - o.y0), c = lowCanvas(W / 5, hh / 5), cx = c.getContext('2d'), im = cx.createImageData(c.width, c.height), D = im.data;
    const sc = o.scale || 3, thr = 1 - (o.cover == null ? .5 : o.cover), L = o.lit, K = o.dark, ox = r() * 60, oy = r() * 60;
    const sdx = o.sun ? (o.sun[0] - .5) * -1 : 0, sdy = o.sun ? (o.sun[1] - .5) * -.4 : 0.35;
    const dens = (i, j) => fbm(n, ox + i / c.width * sc * 1.7, oy + j / c.height * sc * .85, 6);
    for (let j = 0; j < c.height; j++) {
      const v = j / c.height, edge = Math.min(1, v * 3.2, (1 - v) * 2.4);
      for (let i = 0; i < c.width; i++) {
        const d = dens(i, j), a = sstep(thr, thr + .2, d) * edge;
        const d2 = dens(i + sdx * 6, j + sdy * 6), lit = clamp(.55 + (d2 - d) * 5.5 + (1 - v) * .12, 0, 1);
        const p = (j * c.width + i) * 4;
        D[p] = K[0] + (L[0] - K[0]) * lit; D[p + 1] = K[1] + (L[1] - K[1]) * lit; D[p + 2] = K[2] + (L[2] - K[2]) * lit; D[p + 3] = a * 255 * (o.alpha == null ? 1 : o.alpha);
      }
    }
    cx.putImageData(im, 0, 0);
    blurred(x, 1.2, () => upscale(x, c, 0, y0, W, hh));
  };
  // ماء بمنظور: أمواج تكبر نحو الأسفل + لمعان الشمس
  const water = (x, W, H, r, hz, o) => {
    const n = mkNoise(r), hh = H - hz, c = lowCanvas(W / 4, hh / 3), cx = c.getContext('2d'), im = cx.createImageData(c.width, c.height), D = im.data;
    const sx = o.sun == null ? -9 : o.sun * c.width, off = r() * 30;
    for (let j = 0; j < c.height; j++) {
      const t = j / c.height, z = 1 / (t * .95 + .05);
      for (let i = 0; i < c.width; i++) {
        const w = fbm(n, off + i / c.width * 3.2 * z * .5, off + z * 1.1, 4), wv = (w - .5) * 2;
        const R = o.top[0] + (o.bot[0] - o.top[0]) * t, G = o.top[1] + (o.bot[1] - o.top[1]) * t, B = o.top[2] + (o.bot[2] - o.top[2]) * t;
        const sh = wv * (10 + 34 * (1 - t * .6));
        let g = 0; if (o.sun != null) { const dx = (i - sx) / c.width; g = Math.exp(-dx * dx / (.0025 + .03 * t)) * clamp(wv * 1.8 + .55, 0, 1.4) * (1 - t * .45); }
        const p = (j * c.width + i) * 4, gl = o.glint || [255, 240, 210];
        D[p] = clamp(R + sh + g * gl[0] * .9); D[p + 1] = clamp(G + sh + g * gl[1] * .9); D[p + 2] = clamp(B + sh * 1.05 + g * gl[2] * .9); D[p + 3] = 255;
      }
    }
    cx.putImageData(im, 0, 0);
    blurred(x, .8, () => upscale(x, c, 0, hz, W, hh));
  };
  const rays = (x, sx, sy, W, H, r, col, n = 14) => {
    x.save(); x.globalCompositeOperation = 'screen';
    blurred(x, 6, () => { for (let i = 0; i < n; i++) { const a = Math.PI * (.08 + r() * .84), w = .02 + r() * .05, L = H * 1.4; const g = x.createLinearGradient(sx, sy, sx + Math.cos(a) * L, sy - Math.sin(a) * L); g.addColorStop(0, col + (.16 + r() * .12) + ')'); g.addColorStop(1, col + '0)'); x.fillStyle = g; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a - w) * L, sy - Math.sin(a - w) * L); x.lineTo(sx + Math.cos(a + w) * L, sy - Math.sin(a + w) * L); x.closePath(); x.fill(); } });
    x.restore();
  };
  // قمم جبال بضجيج «حرفي» (ridged) مع ضباب جوي بين الطبقات
  const mountain = (x, W, H, r, n, idx, base, amp, rough, top, bot) => {
    const o = r() * 90; x.beginPath(); x.moveTo(0, H);
    const step = Math.max(2, W / 360);
    for (let i = 0; i <= W + step; i += step) { const u = i / W, rid = 1 - Math.abs(fbm(n, o + u * rough, idx * 7.3, 5) * 2 - 1); x.lineTo(i, base - Math.pow(rid, 1.7) * amp); }
    x.lineTo(W, H); x.closePath(); x.fillStyle = lg(x, base - amp, base + amp * .5, [[0, top], [1, bot]]); x.fill();
  };
  const haze = (x, W, y0, y1, col) => { x.fillStyle = lg(x, y0, y1, [[0, col + '0)'], [.55, col + '.55)'], [1, col + '0)']]); x.fillRect(0, y0, W, y1 - y0); };
  // لمسة التصوير: تعتيم الأطراف + حبيبات خفيفة
  const finish = (x, W, H, r, vig = .32, grain = .045) => {
    const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .32, W / 2, H / 2, Math.hypot(W, H) * .56); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vig})`); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const t = lowCanvas(128, 128), tx = t.getContext('2d'), im = tx.createImageData(128, 128), d = im.data;
    for (let i = 0; i < 128 * 128; i++) { const v = r() * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = grain * 255; }
    tx.putImageData(im, 0, 0); x.fillStyle = x.createPattern(t, 'repeat'); x.fillRect(0, 0, W, H);
  };
  // الخلفيات: [المعرف، الاسم، نص فاتح؟، الرسم]
  const BG = [
    ['sea', 'بحر', true, (x, W, H, r) => {
      const hz = H * (.62 + r() * .06), sxF = .25 + r() * .5, sx = W * sxF;
      x.fillStyle = lg(x, 0, hz, [[0, '#1f5fa6'], [.55, '#6aa9dc'], [.9, '#cfe4f2'], [1, '#f6e7cc']]); x.fillRect(0, 0, W, hz);
      clouds(x, W, H, r, { y0: 0, y1: .62, cover: .42, scale: 3, lit: [255, 252, 246], dark: [150, 176, 208], sun: [sxF, .55], alpha: .92 });
      glow(x, sx, hz - H * .02, W * .5, 'rgba(255,238,200,.5)');
      water(x, W, H, r, hz, { top: [120, 172, 208], bot: [8, 50, 90], sun: sxF, glint: [255, 240, 210] });
      haze(x, W, hz - H * .035, hz + H * .045, 'rgba(255,240,215,');
      finish(x, W, H, r, .3, .045);
    }],
    ['sunset', 'غروب', true, (x, W, H, r) => {
      const hz = H * .64, sxF = .3 + r() * .4, sx = W * sxF, sy = hz - H * .06;
      x.fillStyle = lg(x, 0, hz, [[0, '#2a2552'], [.3, '#7a3f7a'], [.58, '#e0705a'], [.82, '#ffb36b'], [1, '#ffe3a8']]); x.fillRect(0, 0, W, hz);
      glow(x, sx, sy, W * .75, 'rgba(255,205,130,.75)');
      clouds(x, W, H, r, { y0: .04, y1: .62, cover: .5, scale: 3.2, lit: [255, 208, 150], dark: [96, 52, 98], sun: [sxF, .62], alpha: .85 });
      rays(x, sx, sy, W, H, r, 'rgba(255,214,150,');
      const sg = x.createRadialGradient(sx, sy, 0, sx, sy, W * .06); sg.addColorStop(0, '#fffbe8'); sg.addColorStop(.7, '#ffe7a8'); sg.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = sg; x.beginPath(); x.arc(sx, sy, W * .06, 0, 7); x.fill();
      water(x, W, H, r, hz, { top: [236, 150, 104], bot: [36, 26, 62], sun: sxF, glint: [255, 226, 160] });
      haze(x, W, hz - H * .03, hz + H * .04, 'rgba(255,214,160,');
      finish(x, W, H, r, .38, .05);
    }],
    ['night', 'سماء الليل', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#03071a'], [.55, '#0d1b44'], [.9, '#27386a'], [1, '#2c3e72']]); x.fillRect(0, 0, W, H);
      // مجرّة: حزام سديمي مائل
      const n = mkNoise(r), c = lowCanvas(W / 6, H / 6), cx = c.getContext('2d'), im = cx.createImageData(c.width, c.height), D = im.data, ang = -.6 + r() * .3;
      for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
        const u = (i / c.width - .5), v = (j / c.height - .45), d = Math.abs(-Math.sin(ang) * u + Math.cos(ang) * v * (H / W)), band = Math.exp(-d * d / .02);
        const f = fbm(n, i / c.width * 5, j / c.height * 6, 5), a = band * sstep(.3, .75, f) * .55, p = (j * c.width + i) * 4;
        D[p] = 170 + f * 70; D[p + 1] = 170 + f * 50; D[p + 2] = 255; D[p + 3] = a * 255;
      }
      cx.putImageData(im, 0, 0); blurred(x, 2, () => upscale(x, c, 0, 0, W, H));
      for (let i = 0; i < 650; i++) { const s = Math.pow(r(), 4) * 2.3 + .35, px = r() * W, py = Math.pow(r(), 1.15) * H * .88; x.fillStyle = `rgba(${225 + r() * 30 | 0},${230 + r() * 25 | 0},255,${.25 + r() * .75})`; x.beginPath(); x.arc(px, py, s, 0, 7); x.fill(); if (s > 2) glow(x, px, py, s * 7, 'rgba(210,225,255,.35)'); }
      const hzy = H * .86; glow(x, W * .5, hzy, W * .7, 'rgba(90,120,190,.28)');
      const n2 = mkNoise(r); mountain(x, W, H, r, n2, 1, H * .9, H * .12, 2.2, '#0b1430', '#060b1c'); mountain(x, W, H, r, n2, 2, H * .96, H * .08, 3, '#050a18', '#03060f');
      finish(x, W, H, r, .35, .05);
    }],
    ['desert', 'صحراء', false, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H * .6, [[0, '#f0b574'], [.6, '#f8d7a3'], [1, '#fdecc9']]); x.fillRect(0, 0, W, H);
      const sxF = .2 + r() * .6; glow(x, W * sxF, H * .3, W * .55, 'rgba(255,248,225,.85)');
      clouds(x, W, H, r, { y0: 0, y1: .4, cover: .22, scale: 2.4, lit: [255, 244, 226], dark: [236, 190, 150], sun: [sxF, .3], alpha: .6 });
      const cols = [['#e9b777', '#cf9559'], ['#e0a460', '#bd8248'], ['#d18f4c', '#a96f38'], ['#bb7a3b', '#8c5a2a']];
      cols.forEach((cc, i) => {
        const base = H * (.5 + i * .12), amp = H * (.05 + i * .012), a = r() * 6, f = 1.1 + r() * 1.2, n = mkNoise(r);
        x.beginPath(); x.moveTo(0, H);
        for (let k = 0; k <= 120; k++) { const u = k / 120, crest = Math.pow(Math.abs(Math.sin(u * Math.PI * f + a)), .75); x.lineTo(W * u, base - amp * crest * (.65 + fbm(n, u * 3, i, 3) * .7)); }
        x.lineTo(W, H); x.closePath();
        const g = x.createLinearGradient(0, base - amp, W, base + amp); g.addColorStop(0, cc[0]); g.addColorStop(.55, cc[1]); g.addColorStop(1, cc[1]); x.fillStyle = g; x.fill();
        x.save(); x.clip(); for (let k = 0; k < 60; k++) { x.strokeStyle = `rgba(255,230,190,${.04 + r() * .07})`; x.lineWidth = 1 + r() * 1.5; const y = base - amp + r() * (H - base + amp), px = r() * W; x.beginPath(); x.moveTo(px, y); x.bezierCurveTo(px + 60, y - 4, px + 120, y + 4, px + 180 + r() * 160, y - 2); x.stroke(); } x.restore();
        haze(x, W, base - amp * .4, base + amp * 1.4, 'rgba(255,222,176,');
      });
      finish(x, W, H, r, .22, .04);
    }],
    ['mount', 'جبال', true, (x, W, H, r) => {
      const sxF = .2 + r() * .6;
      x.fillStyle = lg(x, 0, H * .7, [[0, '#6fa3d6'], [.55, '#bcd6ec'], [1, '#eef1f2']]); x.fillRect(0, 0, W, H);
      clouds(x, W, H, r, { y0: 0, y1: .5, cover: .32, scale: 2.6, lit: [255, 255, 255], dark: [196, 214, 232], sun: [sxF, .15], alpha: .85 });
      const n = mkNoise(r), L = [['#b8cde4', '#dbe7f2', .50, .2], ['#93b0cf', '#c3d4e6', .58, .2], ['#6a8db2', '#a4bdd7', .66, .19], ['#436789', '#7a9bb9', .75, .17], ['#223c58', '#3b5876', .86, .12]];
      L.forEach((l, i) => { mountain(x, W, H, r, n, i, H * l[2], H * l[3], 2.2 + i * .5, l[0], l[1]); if (i < 4) haze(x, W, H * l[2] - H * .02, H * (l[2] + .1), 'rgba(226,238,248,'); });
      finish(x, W, H, r, .3, .045);
    }],
    ['clouds', 'غيوم', false, (x, W, H, r) => {
      const sxF = .5 + (r() - .5) * .6;
      x.fillStyle = lg(x, 0, H, [[0, '#2f7fd0'], [.55, '#79b6ea'], [1, '#cfe8fb']]); x.fillRect(0, 0, W, H);
      glow(x, W * sxF, H * .12, W * .5, 'rgba(255,255,240,.45)');
      clouds(x, W, H, r, { y0: .02, y1: .98, cover: .55, scale: 3.4, lit: [255, 255, 255], dark: [160, 186, 220], sun: [sxF, .1], alpha: .95 });
      finish(x, W, H, r, .22, .04);
    }],
    ['green', 'مروج خضراء', true, (x, W, H, r) => {
      const sxF = .6 + r() * .3;
      x.fillStyle = lg(x, 0, H * .6, [[0, '#4f93d6'], [.7, '#aad2ee'], [1, '#e9f4f6']]); x.fillRect(0, 0, W, H);
      glow(x, W * sxF, H * .13, W * .5, 'rgba(255,250,215,.8)');
      clouds(x, W, H, r, { y0: 0, y1: .5, cover: .38, scale: 2.8, lit: [255, 255, 255], dark: [190, 210, 232], sun: [sxF, .1], alpha: .9 });
      rays(x, W * sxF, H * .05, W, H, r, 'rgba(255,250,210,', 9);
      const n = mkNoise(r);
      [['#a8cf74', '#7eb255', .5], ['#7fb552', '#5a9a3a', .58], ['#5b9a3c', '#3f7b2c', .67], ['#3f7a2c', '#265a1e', .78]].forEach((c, i) => {
        const base = H * c[2], amp = H * (.05 - i * .005), a = r() * 6; x.beginPath(); x.moveTo(0, H);
        for (let k = 0; k <= 90; k++) { const u = k / 90; x.lineTo(W * u, base + (fbm(n, u * 2.2 + i * 5, i, 4) - .5) * amp * 3 + Math.sin(u * 6 + a) * amp * .4); }
        x.lineTo(W, H); x.closePath(); x.fillStyle = lg(x, base - amp * 2, base + amp * 3, [[0, c[0]], [1, c[1]]]); x.fill();
        if (i < 3) haze(x, W, base - amp * 2, base + amp * 2, 'rgba(225,240,230,');
      });
      for (let i = 0; i < 1100; i++) { const t = Math.pow(r(), .8), y0 = H * (.8 + t * .2), px = r() * W, hh = 14 + r() * 70 * (.4 + t), bend = (r() - .5) * 26; x.strokeStyle = `rgba(${40 + r() * 50 | 0},${100 + r() * 70 | 0},${30 + r() * 30 | 0},${.5 + r() * .45})`; x.lineWidth = .8 + t * 2.6; x.beginPath(); x.moveTo(px, y0); x.quadraticCurveTo(px + bend * .3, y0 - hh * .6, px + bend, y0 - hh); x.stroke(); }
      for (let i = 0; i < 46; i++) { const px = r() * W, py = H * (.84 + r() * .15), s = 3 + r() * 6; blurred(x, 1.2, () => { x.fillStyle = ['rgba(255,255,255,.9)', 'rgba(255,224,110,.9)', 'rgba(255,170,200,.85)'][i % 3]; x.beginPath(); x.arc(px, py, s, 0, 7); x.fill(); }); }
      finish(x, W, H, r, .3, .045);
    }],
    ['aurora', 'شفق', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#020b16'], [1, '#0b2233']]); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 360; i++) { x.fillStyle = `rgba(255,255,255,${r() * .75})`; const s = r() * 1.6 + .3; x.fillRect(r() * W, r() * H * .75, s, s); }
      x.save(); x.globalCompositeOperation = 'lighter';
      blurred(x, 7, () => { for (let b = 0; b < 3; b++) { const col = ['rgba(60,255,170,', 'rgba(90,180,255,', 'rgba(190,90,255,'][b], a = r() * 6;
        for (let i = 0; i < 90; i++) { const px = W * i / 90, py = H * (.3 + b * .08) + Math.sin(i / 90 * 7 + a) * H * .06, hh = H * (.18 + .1 * Math.abs(Math.sin(i / 7 + a))); const g = x.createLinearGradient(px, py - hh, px, py); g.addColorStop(0, col + '0)'); g.addColorStop(.7, col + '.12)'); g.addColorStop(1, col + '.2)'); x.fillStyle = g; x.fillRect(px, py - hh, W / 90 + 2, hh); } } });
      x.restore();
      const n = mkNoise(r); mountain(x, W, H, r, n, 1, H * .88, H * .1, 2.4, '#04101a', '#01070d'); mountain(x, W, H, r, n, 2, H * .96, H * .06, 3, '#020a12', '#01050a');
      finish(x, W, H, r, .3, .05);
    }],
    ['bokeh', 'ضوء ناعم', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#cfe6b5'], [.5, '#7fb87a'], [1, '#2f6b4c']]); x.fillRect(0, 0, W, H);
      glow(x, W * (.3 + r() * .4), H * .15, W * .6, 'rgba(255,244,190,.7)');
      blurred(x, 10, () => { for (let i = 0; i < 70; i++) { const px = r() * W, py = r() * H, s = W * (.02 + r() * .07); x.fillStyle = `rgba(${[255, 240, 200][i % 3]},${[250, 255, 235][i % 3]},${[200, 190, 170][i % 3]},${.08 + r() * .25})`; x.beginPath(); x.arc(px, py, s, 0, 7); x.fill(); } });
      finish(x, W, H, r, .3, .04);
    }],
    ['islamic', 'زخرفة زمرّدية', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#0d5c3f'], [1, '#05281c']]); x.fillRect(0, 0, W, H);
      const s = W / 7; x.strokeStyle = 'rgba(233,207,141,.16)'; x.lineWidth = 2;
      for (let gy = -1; gy < H / s + 1; gy++) for (let gx = -1; gx < 8; gx++) { const cx = gx * s + (gy % 2 ? s / 2 : 0), cy = gy * s; x.beginPath(); for (let k = 0; k < 16; k++) { const ang = k * Math.PI / 8, rr = k % 2 ? s * .22 : s * .42; x.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr); } x.closePath(); x.stroke(); }
      glow(x, W / 2, H / 2, W * .7, 'rgba(255,230,160,.12)');
    }],
    ['marble', 'رخام', false, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#fbfaf7'], [1, '#ecebe6']]); x.fillRect(0, 0, W, H);
      for (let v = 0; v < 14; v++) { let px = r() * W, py = 0; x.strokeStyle = `rgba(120,120,125,${.05 + r() * .15})`; x.lineWidth = .6 + r() * 2.2; x.beginPath(); x.moveTo(px, py); while (py < H) { px += (r() - .45) * 40; py += 10 + r() * 30; x.lineTo(px, py); } x.stroke(); }
      for (let v = 0; v < 4; v++) { x.strokeStyle = 'rgba(190,160,90,.25)'; x.lineWidth = 1.2; let px = r() * W, py = 0; x.beginPath(); x.moveTo(px, py); while (py < H) { px += (r() - .5) * 50; py += 20 + r() * 30; x.lineTo(px, py); } x.stroke(); }
    }],
    ['paper', 'ورق عتيق', false, (x, W, H, r) => {
      x.fillStyle = '#f2e6c9'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(120,90,40,${r() * .06})`; x.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3); }
      const g = x.createRadialGradient(W / 2, H / 2, W * .3, W / 2, H / 2, W * .85); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(110,70,20,.35)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    }],
    ['gold', 'ذهبي فاخر', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#1b1710'], [1, '#0c0a06']]); x.fillRect(0, 0, W, H);
      glow(x, W * .5, H * .4, W * .7, 'rgba(217,184,106,.18)');
      const m = W * .045; x.strokeStyle = '#c9a54e'; x.lineWidth = 3; x.strokeRect(m, m, W - m * 2, H - m * 2); x.lineWidth = 1; x.strokeRect(m * 1.5, m * 1.5, W - m * 3, H - m * 3);
      [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([cx, cy]) => { x.fillStyle = '#d9b86a'; x.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? m * .25 : m * .55; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); });
    }],
  ];
  const SIZES = { post: [1080, 1080, 'منشور (مربع)'], story: [1080, 1920, 'حالة واتساب / قصة'], wide: [1200, 675, 'عريض'] };
  const FONTS = { naskh: ["'Naskh'", 'نسخ'], amiri: ["'Amiri Quran'", 'أميري'], ruqaa: ["'Ruqaa'", 'رقعة'], kufi: ["'Kufi'", 'كوفي'], plex: ["'Plex Arabic'", 'حديث'] };

  let logo = null; const loadLogo = () => logo || (logo = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'icons/icon-192.png'; }));

  function wrap(x, text, maxW) {
    const out = [];
    String(text).split(/\n/).forEach(par => { const ws = par.split(/\s+/).filter(Boolean); let line = ''; ws.forEach(w => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); out.push(line); });
    return out;
  }

  async function render(cv, S) {
    const [W, H] = SIZES[S.size]; cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const bg = BG.find(b => b[0] === S.bg);
    if (S.bg === 'photo' && S.photo) { const im = S.photo, k = Math.max(W / im.width, H / im.height); x.drawImage(im, (W - im.width * k) / 2, (H - im.height * k) / 2, im.width * k, im.height * k); }
    else (bg || BG[0])[3](x, W, H, RNG(S.seed * 7919 + 13));
    const light = S.bg === 'photo' ? true : (bg || BG[0])[2];
    if (S.dim) { x.fillStyle = light ? `rgba(0,0,0,${S.dim / 100})` : `rgba(255,255,255,${S.dim / 100})`; x.fillRect(0, 0, W, H); }
    const fam = FONTS[S.font][0];
    try { await document.fonts.load(`700 60px ${fam}`, S.text); } catch (e) { }
    const pad = W * .1, maxW = W - pad * 2, maxH = H * (S.size === 'story' ? .58 : .62);
    x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = Math.round(W * .085 * S.scale), lines, lh;
    for (; fs > 18; fs -= 2) { x.font = `700 ${fs}px ${fam}, 'Naskh', serif`; lines = wrap(x, S.text, maxW); lh = fs * 1.75; if (lines.length * lh <= maxH) break; }
    const blockH = lines.length * lh, srcFs = Math.max(22, Math.round(fs * .45)), cy = H * .47;
    const top = cy - blockH / 2;
    if (S.panel) { const pw = Math.min(W - pad, Math.max(...lines.map(l => x.measureText(l).width)) + pad * 1.2), ph = blockH + pad * .8 + (S.source ? srcFs * 2.2 : 0); x.fillStyle = light ? 'rgba(0,0,0,.38)' : 'rgba(255,255,255,.62)'; const rx = (W - pw) / 2, ry = top - pad * .4; if (x.roundRect) { x.beginPath(); x.roundRect(rx, ry, pw, ph, 36); x.fill(); } else x.fillRect(rx, ry, pw, ph); }
    const ink = light ? '#ffffff' : '#1f2a24', sub = light ? 'rgba(255,240,200,.95)' : '#8a6a2a';
    x.shadowColor = light ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.4)'; x.shadowBlur = light ? 14 : 4;
    x.fillStyle = ink; x.font = `700 ${fs}px ${fam}, 'Naskh', serif`;
    lines.forEach((l, i) => x.fillText(l, W / 2, top + lh * (i + .5)));
    if (S.source) { x.font = `500 ${srcFs}px 'Plex Arabic', sans-serif`; x.fillStyle = sub; x.fillText(S.source, W / 2, top + blockH + srcFs * 1.3); }
    // التوقيع
    x.shadowBlur = 0; const im = await loadLogo(), fy = H - H * (S.size === 'story' ? .07 : .06), ls = Math.round(W * .045);
    x.font = `600 ${Math.round(W * .026)}px 'Plex Arabic', sans-serif`; x.fillStyle = light ? 'rgba(255,255,255,.85)' : 'rgba(31,42,36,.75)';
    const label = 'زاد الأسرة المسلمة', lw = x.measureText(label).width;
    x.textAlign = 'right'; x.fillText(label, W / 2 + (lw + ls + 10) / 2 - ls - 10, fy);
    if (im) { x.save(); x.beginPath(); if (x.roundRect) x.roundRect(W / 2 + (lw + ls + 10) / 2 - ls, fy - ls / 2, ls, ls, ls * .25); else x.rect(W / 2 + (lw + ls + 10) / 2 - ls, fy - ls / 2, ls, ls); x.clip(); x.drawImage(im, W / 2 + (lw + ls + 10) / 2 - ls, fy - ls / 2, ls, ls); x.restore(); }
  }

  async function open(o) {
    const S = { text: '', source: '', bg: 'sea', size: 'post', font: 'naskh', scale: 1, dim: 0, panel: false, seed: 1, photo: null };
    try { const p = JSON.parse(localStorage.getItem('sharecard') || '{}'); ['bg', 'size', 'font', 'panel'].forEach(k => { if (p[k] != null && !(k === 'bg' && p[k] === 'photo')) S[k] = p[k]; }); } catch (e) { }
    Object.assign(S, o || {});
    if (/[﴿﴾]/.test(S.text) && !(o && o.font)) S.font = 'amiri'; // الأقواس القرآنية تظهر بأجمل شكل بخط المصحف
    const save = () => { try { localStorage.setItem('sharecard', JSON.stringify({ bg: S.bg, size: S.size, font: S.font, panel: S.panel })); } catch (e) { } };
    APP.modal(`<div class="sc-wrap">
      <h3 style="margin:0 0 8px">🖼️ صمّم صورة للمشاركة</h3>
      <div class="sc-prev"><canvas id="scC"></canvas></div>
      <div class="sc-bgs" id="scBgs">${BG.map(b => `<button class="sc-bg" data-bg="${b[0]}" title="${b[1]}"><canvas width="96" height="96"></canvas><span>${b[1]}</span></button>`).join('')}<button class="sc-bg" data-bg="photo"><span class="sc-ph">📷</span><span>صورة من جهازي</span></button></div>
      <div class="sc-row"><div class="seg" id="scSize">${Object.entries(SIZES).map(([k, v]) => `<button data-v="${k}">${v[2]}</button>`).join('')}</div></div>
      <div class="sc-row"><div class="seg" id="scFont">${Object.entries(FONTS).map(([k, v]) => `<button data-v="${k}">${v[1]}</button>`).join('')}</div></div>
      <label class="sc-lbl">النص<textarea id="scT" rows="3">${esc(S.text)}</textarea></label>
      <label class="sc-lbl">المصدر (يظهر تحت النص)<input id="scS" value="${esc(S.source)}" placeholder="مثال: رواه البخاري"></label>
      <div class="sc-row sc-sl"><label>حجم الخط <input type="range" id="scZ" min="0.6" max="1.4" step="0.05" value="${S.scale}"></label><label>تعتيم الخلفية <input type="range" id="scD" min="0" max="60" step="5" value="${S.dim}"></label></div>
      <label class="row" style="gap:8px;margin:6px 0"><input type="checkbox" id="scP" ${S.panel ? 'checked' : ''}> مربع شفاف خلف النص</label>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn primary" id="scShare">📤 مشاركة</button><button class="btn" id="scSave">⬇️ حفظ الصورة</button><button class="btn" id="scSeed">🔄 شكل آخر للخلفية</button><button class="btn" id="scX">إغلاق</button></div>
    </div>`, async box => {
      const $ = q => box.querySelector(q), cv = $('#scC');
      let busy = 0; const draw = async () => { const my = ++busy; await render(cv, S); if (my !== busy) return; };
      const mark = () => { box.querySelectorAll('.sc-bg').forEach(b => b.classList.toggle('on', b.dataset.bg === S.bg)); box.querySelectorAll('#scSize button').forEach(b => b.classList.toggle('on', b.dataset.v === S.size)); box.querySelectorAll('#scFont button').forEach(b => b.classList.toggle('on', b.dataset.v === S.font)); };
      // صور مصغرة للخلفيات
      box.querySelectorAll('.sc-bg canvas').forEach((c, i) => BG[i][3](c.getContext('2d'), 96, 96, RNG(13)));
      box.querySelectorAll('.sc-bg').forEach(b => b.onclick = async () => {
        if (b.dataset.bg === 'photo') {
          const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
          inp.onchange = () => { const f = inp.files[0]; if (!f) return; const im = new Image(); im.onload = () => { S.photo = im; S.bg = 'photo'; if (!S.dim) { S.dim = 25; $('#scD').value = 25; } mark(); draw(); }; im.src = URL.createObjectURL(f); };
          inp.click(); return;
        }
        S.bg = b.dataset.bg; save(); mark(); draw();
      });
      box.querySelectorAll('#scSize button').forEach(b => b.onclick = () => { S.size = b.dataset.v; save(); mark(); draw(); });
      box.querySelectorAll('#scFont button').forEach(b => b.onclick = () => { S.font = b.dataset.v; save(); mark(); draw(); });
      let tm; const later = () => { clearTimeout(tm); tm = setTimeout(draw, 250); };
      $('#scT').oninput = e => { S.text = e.target.value; later(); };
      $('#scS').oninput = e => { S.source = e.target.value; later(); };
      $('#scZ').oninput = e => { S.scale = +e.target.value; later(); };
      $('#scD').oninput = e => { S.dim = +e.target.value; later(); };
      $('#scP').onchange = e => { S.panel = e.target.checked; save(); draw(); };
      $('#scSeed').onclick = () => { S.seed++; draw(); };
      $('#scX').onclick = () => APP.closeModal();
      const blob = async () => { await render(cv, S); return new Promise(r => cv.toBlob(r, 'image/png')); };
      const name = () => 'zad-' + Date.now() + '.png';
      $('#scSave').onclick = async () => APP.download(name(), await blob(), 'image/png');
      $('#scShare').onclick = async () => {
        const b = await blob(), f = new File([b], name(), { type: 'image/png' });
        if (!window.NATIVE_FILE && navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: 'من تطبيق زاد الأسرة المسلمة' }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
        APP.download(f.name, b, 'image/png');
      };
      mark(); draw();
    });
  }

  // نص العنصر ومصدره (آية، حديث، أو فقرة)
  function fromItem(it) {
    if (!it) return {};
    if (it.type === 'ayah') return { text: '﴿' + it.text + '﴾', source: 'سورة ' + AR.SURAHS[it.surah - 1] + ' — الآية ' + AR.toArabicDigits(String(it.ayah)) };
    if (it.type === 'hadith') { const m = String(it.matn || '').replace(/\s+/g, ' ').trim(); return { text: '«' + (m.length > 420 ? m.slice(0, 420) + '…' : m) + '»', source: 'رواه ' + (APP.titleOf ? APP.titleOf(it) : '') }; }
    const t = String(it.text || it.summary || '').replace(/\s+/g, ' ').trim();
    return { text: t.length > 420 ? t.slice(0, 420) + '…' : t, source: APP.bookTitle ? APP.bookTitle(it.bookId) : '' };
  }

  // زر عائم عند تحديد نص (جملتين فأكثر) في أي مكان
  let fab = null, tmo = 0;
  document.addEventListener('selectionchange', () => {
    clearTimeout(tmo); tmo = setTimeout(() => {
      const sel = window.getSelection(), txt = sel ? sel.toString().trim() : '';
      if (!fab) { fab = document.createElement('button'); fab.className = 'sc-fab hidden'; fab.textContent = '🖼️ صمّم صورة للمشاركة'; document.body.appendChild(fab); fab.addEventListener('mousedown', e => e.preventDefault()); fab.onclick = () => { fab.classList.add('hidden'); open({ text: fab.dataset.t }); }; }
      const words = txt.split(/\s+/).filter(Boolean).length;
      const inField = sel && sel.anchorNode && sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest('input,textarea,#modal');
      if (words >= 3 && txt.length <= 700 && /[ء-ي]/.test(txt) && !inField) {
        const r = sel.getRangeAt(0).getBoundingClientRect(); fab.dataset.t = txt;
        fab.style.top = (window.scrollY + Math.max(8, r.top - 46)) + 'px'; fab.style.left = Math.max(8, Math.min(window.innerWidth - 230, window.scrollX + r.left)) + 'px'; fab.classList.remove('hidden');
      } else fab.classList.add('hidden');
    }, 400);
  });

  window.SHARECARD = { open, fromItem, render, BG };
})();
