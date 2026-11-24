/* 🌙 حارس الوضع الليلي: أي بطاقة أو مربع بخلفية فاتحة ثابتة يتحول إلى خلفية داكنة تحمل لونه الخفيف، ونصّه يصير فاتحاً مقروءاً.
   لا يمس أقسام التعلّم (البراعم والأميين) لأن ألوانها مقصودة. */
(() => {
  const parse = c => { const m = c && c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]] : null; };
  const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const on = () => document.body.classList.contains('dark') && !document.body.classList.contains('learn-mode');
  const ROOTS = '#view, #modal, #notesPanel';
  function fixEl(el) {
    if (el.dataset.dkx || el.closest('.sp2, svg, .no-dkx, .mushaf-page, img, video, canvas')) return;
    const cs = getComputedStyle(el); let col = parse(cs.backgroundColor);
    if ((!col || col[3] < .5) && cs.backgroundImage.includes('gradient')) { const all = cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []; const cols = all.map(parse).filter(x => x && x[3] > .5); if (cols.length && cols.every(x => lum(x) > .72)) col = cols[0]; else col = null; }
    if (!col || col[3] < .5 || lum(col) <= .72) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) { el.dataset.dkx = 1; el.classList.add('dkx-in'); return; }
    const [r, g, b] = col, sat = Math.max(r, g, b) - Math.min(r, g, b);
    el.dataset.dkx = 1; el.classList.add('dkx');
    // نحتفظ بلمسة اللون الأصلي إن كان ملوّناً (وردي، أزرق، كريمي...)
    el.style.setProperty('--dkx-bg', sat > 12 ? `color-mix(in srgb, rgb(${r},${g},${b}) 10%, var(--panel))` : 'var(--panel)');
    el.style.setProperty('--dkx-bd', sat > 12 ? `color-mix(in srgb, rgb(${r},${g},${b}) 30%, var(--line))` : 'var(--line)');
    if (lum(parse(cs.color) || [0, 0, 0]) < .45) el.classList.add('dkx-ink');
  }
  function scan(root) {
    if (!on() || !root || !root.querySelectorAll) return;
    const els = root.matches && root.matches('*') ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
    if (els.length > 4000) return; // صفحات الكتب الطويلة: نتركها لقواعد التنسيق
    els.forEach(fixEl);
    // النصوص الداكنة داخل البطاقات المصلَّحة
    root.querySelectorAll('.dkx *').forEach(c => { if (c.dataset.dki) return; c.dataset.dki = 1; const p = parse(getComputedStyle(c).color); if (p && lum(p) < .3) c.classList.add('dkx-ink'); });
  }
  function clear() { document.querySelectorAll('[data-dkx], [data-dki]').forEach(e => { delete e.dataset.dkx; delete e.dataset.dki; e.classList.remove('dkx', 'dkx-ink', 'dkx-in'); e.style.removeProperty('--dkx-bg'); e.style.removeProperty('--dkx-bd'); }); }
  let q = new Set(), t = 0;
  const flush = () => { t = 0; const a = [...q]; q.clear(); if (!on()) return; a.forEach(n => n.isConnected && scan(n)); };
  new MutationObserver(ms => {
    if (!on()) return;
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.closest(ROOTS))) q.add(n);
    if (q.size && !t) t = setTimeout(flush, 60);
  }).observe(document.documentElement, { childList: true, subtree: true });
  // عند تبديل الوضع الليلي
  let was = null; new MutationObserver(() => { const n = on(); if (n === was) return; was = n; if (n) document.querySelectorAll(ROOTS).forEach(scan); else clear(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('load', () => setTimeout(() => document.querySelectorAll(ROOTS).forEach(scan), 300));
  window.DARKFIX = { scan, clear };
})();
