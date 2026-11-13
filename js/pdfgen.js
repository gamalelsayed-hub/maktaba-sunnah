/* مولّد PDF داخل التطبيق (يعمل على الجوال والكمبيوتر بلا نافذة طباعة):
   يرسم النص العربي على لوحة رسم (canvas) صفحةً صفحة — والمتصفح يتكفّل بتشكيل الحروف واتجاهها —
   ثم يضع الصفحات صوراً في ملف PDF بمقاس A4. */
(function () {
  const W = 1240, H = 1754, M = 100; // A4 بدقة 150 نقطة/بوصة
  const ST = {
    title: { size: 46, font: 'Naskh', bold: true, color: '#14532d', align: 'center', before: 0, after: 24 },
    h2: { size: 38, font: 'Naskh', bold: true, color: '#14532d', before: 26, after: 8, rule: true },
    h3: { size: 34, font: 'Naskh', bold: true, color: '#a16207', before: 20, after: 6 },
    p: { size: 30, font: 'Naskh', color: '#111111' },
    li: { size: 30, font: 'Naskh', color: '#111111', bullet: true },
    ayah: { size: 34, font: 'Amiri Quran', color: '#14532d', lh: 2.25 },
    hadith: { size: 30, font: 'Naskh', color: '#3b2a06' },
    tafsir: { size: 26, font: 'Naskh', color: '#555555', bar: true },
    edit: { size: 28, font: 'Naskh', color: '#b45309' },
    ref: { size: 22, font: 'Naskh', color: '#777777' },
  };
  const fontOf = s => (s.bold ? '700 ' : '400 ') + s.size + "px '" + s.font + "', 'Noto Naskh Arabic', 'Traditional Arabic', serif";

  function wrap(ctx, text, max) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(/\s+/).filter(Boolean); let line = '';
      for (const w of words) {
        const t = line ? line + ' ' + w : w;
        if (ctx.measureText(t).width <= max || !line) line = t; else { lines.push(line); line = w; }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  async function render(blocks, title) {
    try { await Promise.all(['Naskh', 'Amiri Quran'].map(f => document.fonts.load("30px '" + f + "'", 'بسم'))); await document.fonts.ready; } catch (e) { }
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.setAttribute('dir', 'rtl');
    cv.style.cssText = 'position:fixed;left:-99999px;top:0'; document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const pages = []; let y = 0, pageNo = 0;
    const startPage = () => {
      pageNo++; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      try { ctx.direction = 'rtl'; } catch (e) { }
      y = M;
    };
    const endPage = () => {
      ctx.font = fontOf(ST.ref); ctx.fillStyle = '#999999'; ctx.textAlign = 'center';
      ctx.fillText(AR.toArabicDigits(String(pageNo)) + (title ? '  —  ' + title : ''), W / 2, H - 45);
      pages.push(cv.toDataURL('image/jpeg', 0.86));
    };
    startPage();
    const drawLines = (lines, s, indent) => {
      const lh = s.size * (s.lh || 1.85);
      for (const ln of lines) {
        if (y + lh > H - M) { endPage(); startPage(); }
        ctx.font = fontOf(s); ctx.fillStyle = s.color;
        if (s.align === 'center') { ctx.textAlign = 'center'; ctx.fillText(ln, W / 2, y + s.size); }
        else { ctx.textAlign = 'right'; ctx.fillText(ln, W - M - (indent || 0), y + s.size); }
        if (s.bar) { ctx.fillStyle = '#a16207'; ctx.fillRect(W - M + 6, y + 4, 4, lh - 4); }
        y += lh;
      }
    };
    for (const b of blocks) {
      const s = ST[b.kind] || ST.p;
      if (s.before && y > M) y += s.before;
      // لا يبدأ عنوان في آخر الصفحة
      if ((b.kind === 'h2' || b.kind === 'h3') && y + s.size * 4 > H - M) { endPage(); startPage(); }
      ctx.font = fontOf(s);
      const indent = s.bullet ? 34 : s.bar ? 22 : 0;
      const lines = wrap(ctx, b.text, W - 2 * M - indent);
      if (s.bullet && lines.length) {
        if (y + s.size * 1.85 > H - M) { endPage(); startPage(); }
        ctx.fillStyle = s.color; ctx.textAlign = 'right'; ctx.font = fontOf(s); ctx.fillText('•', W - M, y + s.size);
      }
      drawLines(lines, s, indent);
      if (s.rule) { ctx.fillStyle = 'rgba(161,98,7,.55)'; ctx.fillRect(M, y - 6, W - 2 * M, 2); }
      if (b.ref) { ctx.font = fontOf(ST.ref); drawLines(wrap(ctx, '[' + b.ref + ']', W - 2 * M - indent), ST.ref, indent); }
      y += s.after || 8;
    }
    endPage(); cv.remove();
    return pages;
  }

  // ===== كاتب PDF بسيط: كل صفحة صورة JPEG =====
  function pdf(pages) {
    const enc = new TextEncoder(), chunks = [], offs = []; let len = 0;
    const push = x => { const u = typeof x === 'string' ? enc.encode(x) : x; chunks.push(u); len += u.length; };
    const obj = (n, body) => { offs[n] = len; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
    const PW = 595.28, PH = 841.89;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const N = pages.length, kids = [];
    for (let i = 0; i < N; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + N + ' >>'));
    pages.forEach((url, i) => {
      const bin = atob(url.split(',')[1]); const img = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) img[k] = bin.charCodeAt(k);
      const p = 3 + i * 3, c = p + 1, im = p + 2;
      const content = 'q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im0 Do Q';
      obj(p, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + c + ' 0 R >>'));
      obj(c, () => push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'));
      obj(im, () => { push('<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.length + ' >>\nstream\n'); push(img); push('\nendstream'); });
    });
    const xref = len, total = 3 + N * 3;
    let x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (let n = 1; n < total; n++) x += String(offs[n]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(chunks, { type: 'application/pdf' });
  }

  window.PDFGEN = { async fromBlocks(blocks, title) { return pdf(await render(blocks, title)); } };
})();
