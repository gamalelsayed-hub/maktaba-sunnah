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

  // الخلفيات: [المعرف، الاسم، نص فاتح؟، الرسم]
  const BG = [
    ['sea', 'بحر', true, (x, W, H, r) => {
      const hz = H * (.66 + r() * .06);
      x.fillStyle = lg(x, 0, hz, [[0, '#2b6fb3'], [.6, '#7fb6e0'], [1, '#f3dcb8']]); x.fillRect(0, 0, W, hz);
      glow(x, W * (.25 + r() * .5), hz - H * .06, W * .35, 'rgba(255,240,200,.75)');
      x.fillStyle = lg(x, hz, H, [[0, '#3b7fb8'], [.35, '#1d5f95'], [1, '#0b2f52']]); x.fillRect(0, hz, W, H - hz);
      for (let i = 0; i < 90; i++) { const y = hz + Math.pow(r(), 1.6) * (H - hz), w = 20 + r() * W * .2 * (y - hz) / (H - hz) + 10, px = r() * W; x.strokeStyle = `rgba(255,255,255,${.05 + r() * .14})`; x.lineWidth = .8 + 2 * (y - hz) / (H - hz); x.beginPath(); x.moveTo(px, y); x.quadraticCurveTo(px + w / 2, y - 3, px + w, y); x.stroke(); }
    }],
    ['sunset', 'غروب', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#2a1a4a'], [.35, '#a8436b'], [.58, '#f28b4b'], [.7, '#ffcf7a'], [1, '#3a1f2e']]); x.fillRect(0, 0, W, H);
      const sx = W * (.3 + r() * .4), sy = H * .66; glow(x, sx, sy, W * .5, 'rgba(255,214,140,.7)');
      x.fillStyle = '#ffe3a3'; x.beginPath(); x.arc(sx, sy, W * .08, 0, 7); x.fill();
      x.fillStyle = 'rgba(40,18,40,.92)'; x.fillRect(0, H * .7, W, H * .3);
      for (let i = 0; i < 40; i++) { const y = H * .71 + r() * H * .2, w = W * (.05 + r() * .25); x.fillStyle = `rgba(255,190,120,${.15 + r() * .3})`; x.fillRect(sx - w / 2 + (r() - .5) * 60, y, w, 2 + r() * 3); }
      ridge(x, W, H, H * .69, H * .05, r, 'rgba(30,12,30,.95)', 5, .25);
    }],
    ['night', 'سماء الليل', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#050a1f'], [.6, '#0f1d45'], [1, '#22305e']]); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 420; i++) { const s = Math.pow(r(), 3) * 2.6 + .4; x.fillStyle = `rgba(255,255,${220 + r() * 35 | 0},${.3 + r() * .7})`; x.beginPath(); x.arc(r() * W, r() * H * .85, s, 0, 7); x.fill(); }
      const mx = W * (.2 + r() * .6), my = H * .2, mr = W * .07; glow(x, mx, my, mr * 4, 'rgba(255,240,200,.25)');
      x.fillStyle = '#fff3c9'; x.beginPath(); x.arc(mx, my, mr, 0, 7); x.fill(); x.fillStyle = '#0a1430'; x.beginPath(); x.arc(mx + mr * .45, my - mr * .2, mr * .92, 0, 7); x.fill();
      hills(x, W, H, H * .9, H * .03, r, '#070d22');
    }],
    ['desert', 'صحراء', false, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H * .5, [[0, '#f6c98a'], [1, '#fbe6c4']]); x.fillRect(0, 0, W, H);
      glow(x, W * (.2 + r() * .6), H * .25, W * .4, 'rgba(255,250,230,.8)');
      ['#e8b06a', '#d99a55', '#c98444', '#b57036'].forEach((c, i) => hills(x, W, H, H * (.5 + i * .12), H * .05, r, c));
    }],
    ['mount', 'جبال', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#9cc3e6'], [.5, '#dbe9f5'], [1, '#e9eef4']]); x.fillRect(0, 0, W, H);
      ['#8aa6c4', '#6c8bad', '#4e6d91', '#33506f', '#1f3550'].forEach((c, i) => ridge(x, W, H, H * (.42 + i * .1), H * (.18 - i * .02), r, c, 6, .9));
    }],
    ['clouds', 'غيوم', false, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#4f95d6'], [1, '#bfe0fb']]); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { const cx = r() * W, cy = r() * H, s = W * (.08 + r() * .14); for (let j = 0; j < 6; j++) glow(x, cx + (r() - .5) * s * 1.6, cy + (r() - .5) * s * .5, s * (.6 + r() * .6), 'rgba(255,255,255,.55)'); }
    }],
    ['green', 'مروج خضراء', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H * .6, [[0, '#6fb2e6'], [1, '#e6f3fb']]); x.fillRect(0, 0, W, H);
      glow(x, W * .75, H * .15, W * .3, 'rgba(255,250,220,.8)');
      ['#9cc96b', '#6faa4a', '#4b8a38', '#2f6a2a'].forEach((c, i) => hills(x, W, H, H * (.52 + i * .11), H * .05, r, c));
    }],
    ['aurora', 'شفق', true, (x, W, H, r) => {
      x.fillStyle = lg(x, 0, H, [[0, '#020b16'], [1, '#0b2233']]); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${r() * .7})`; x.fillRect(r() * W, r() * H * .7, 1.6, 1.6); }
      x.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 3; b++) { const col = ['rgba(60,255,170,', 'rgba(90,180,255,', 'rgba(190,90,255,'][b], a = r() * 6;
        for (let i = 0; i < 80; i++) { const px = W * i / 80, py = H * (.3 + b * .08) + Math.sin(i / 80 * 7 + a) * H * .06; const g = x.createLinearGradient(px, py - H * .25, px, py); g.addColorStop(0, col + '0)'); g.addColorStop(1, col + '.10)'); x.fillStyle = g; x.fillRect(px, py - H * .25, W / 80 + 2, H * .25); } }
      x.globalCompositeOperation = 'source-over'; ridge(x, W, H, H * .85, H * .08, r, '#01070d', 6, .8);
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
