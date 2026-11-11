/* الخرائط الذهنية: تُبنى تلقائياً من بنية أي نص (حديث، مسألة، غزوة، صحابي، آية...) وترسم SVG */
(function () {
  const short = (s, n = 60) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const node = (label, children = [], link) => ({ label: short(label), children: children.filter(Boolean), link });
  const list = (label, arr, n) => (arr && arr.length ? node(label, arr.map(x => node(short(x, n || 55)))) : null);

  // linked: عناصر مرتبطة محمّلة مسبقاً (شروح، تفاسير، أحاديث...)
  function build(it, linked = [], ctx = {}) {
    const titleOf = ctx.titleOf || (x => x.title || x.id);
    const byType = t => linked.filter(x => x.type === t);
    switch (it.type) {
      case 'hadith': return node(ctx.cite || it.id, [
        it.kitab || it.bab ? node('الموضع', [it.kitab && node(it.kitab), it.bab && node(it.bab)]) : null,
        it.narrators && it.narrators.length ? node('الإسناد', it.narrators.map(r => node(ctx.names[r] || r, [], r))) : null,
        node('المتن', [node(short(it.matn, 70))]),
        it.grades && it.grades.length ? node('الأحكام', it.grades.map(g => node(g.grader + ': ' + g.grade, g.reason ? [node(short(g.reason, 60))] : []))) : null,
        byType('sharh').length ? node('الشروح', byType('sharh').map(s => node(ctx.bookTitle(s.bookId), [], s.id))) : null,
        byType('ayah').length ? node('آيات مرتبطة', byType('ayah').map(a => node(titleOf(a), [], a.id))) : null,
        byType('fiqh').length ? node('مسائل فقهية', byType('fiqh').map(f => node(f.title, [], f.id))) : null,
        list('الموضوعات', it.topics)
      ]);
      case 'ayah': return node(titleOf(it), [
        node('النص', [node(short(it.text, 70))]),
        byType('tafsir').length ? node('التفاسير', byType('tafsir').map(t => node(ctx.bookTitle(t.bookId), [node(short(t.text, 60))], t.id))) : null,
        byType('hadith').length ? node('الأحاديث', byType('hadith').map(h => node(titleOf(h), [], h.id))) : null,
        byType('fiqh').length ? node('الأحكام الفقهية', byType('fiqh').map(f => node(f.title, [], f.id))) : null,
        byType('qaida').length ? node('القواعد', byType('qaida').map(q => node(q.title, [], q.id))) : null,
        list('الموضوعات', it.topics)
      ]);
      case 'fiqh': return node(it.title, [
        it.nizaa ? node('تحرير محل النزاع', [node('المتفق عليه: ' + (it.nizaa.agreed || '—')), node('المختلف فيه: ' + (it.nizaa.disputed || '—'))]) : null,
        node('الأقوال', (it.opinions || []).map(o => node(o.school, [node(short(o.qawl, 55)),
          (o.naqli || []).length ? node('أدلة نقلية', o.naqli.map(d => node(d.text, [], d.ref))) : null,
          (o.aqli || []).length ? node('أدلة عقلية', o.aqli.map(d => node(d))) : null]))),
        it.sabab ? node('سبب الخلاف', [node(short(it.sabab, 70))]) : null,
        it.jumhur ? node('رأي الجمهور', [node(short(it.jumhur, 60))]) : null,
        it.rajih && it.rajih.length ? node('الترجيح', it.rajih.map(r => node(r.by + ': ' + r.qawl))) : null
      ]);
      case 'qaida': return node(it.title, [
        node('المعنى', [node(short(it.text, 70))]),
        it.tasil && it.tasil.length ? node('التأصيل', it.tasil.map(t => node(t.text, [], t.ref))) : null,
        list('الفروع والتطبيقات', it.furu),
        byType('fiqh').length ? node('مسائل مبنية عليها', byType('fiqh').map(f => node(f.title, [], f.id))) : null
      ]);
      case 'event': return node(it.title, [
        node('الزمان والمكان', [node(ctx.yearLabel(it.year) + (it.month ? ' — ' + it.month : '')), it.place && node(it.place)]),
        it.forces ? node('القوات', [it.forces.muslims && node('المسلمون: ' + it.forces.muslims), it.forces.enemy && node('الخصم: ' + it.forces.enemy)]) : null,
        list('الأسباب', it.causes), list('الأحداث', it.events), list('النتائج', it.results),
        byType('sahabi').length ? node('من شارك', byType('sahabi').map(s => node(s.title, [], s.id))) : null,
        list('المصادر', it.sources)
      ]);
      case 'sahabi': return node(it.title, [
        node('التعريف', [it.name && node(it.name), it.laqab && node('اللقب: ' + it.laqab)]),
        it.islam ? node('إسلامه', [node(it.islam)]) : null,
        list('فضائله', it.virtues), list('مشاهده', it.mashahid),
        it.khilafa ? node('الخلافة', [node(it.khilafa)]) : null,
        byType('event').length ? node('أحداث في حياته', byType('event').map(e => node(e.title, [], e.id))) : null,
        it.death ? node('وفاته', [node(it.death)]) : null
      ]);
      case 'rawi': return node(it.title, [node('الحكم عليه', [node(it.rank)]), it.death && node('الوفاة: ' + it.death), it.tabaqa && node('الطبقة: ' + it.tabaqa),
        byType('hadith').length ? node('من رواياته', byType('hadith').slice(0, 12).map(h => node(titleOf(h), [], h.id))) : null]);
      default: return node(it.title || titleOf(it), [node(short(it.text, 80))]);
    }
  }

  // تقسيم النص على أسطر
  function wrap(text, max = 22) {
    const words = String(text).split(' '); const lines = []; let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }

  const PALETTE = ['#0f766e', '#b45309', '#1d4ed8', '#7c3aed', '#be123c', '#047857', '#a16207', '#4338ca'];

  // رسم شجرة من اليمين لليسار (مناسب للعربية)
  function render(tree) {
    const COL = 230, NODE_W = 200, LINE_H = 17, PAD = 10, GAP = 12;
    let y = 0; const nodes = []; const edges = [];
    function layout(n, depth, colorIdx) {
      const lines = wrap(n.label, depth === 0 ? 20 : 24);
      const h = lines.length * LINE_H + PAD * 2;
      const me = { n, depth, lines, h, color: depth === 0 ? '#14532d' : PALETTE[colorIdx % PALETTE.length] };
      nodes.push(me);
      if (!n.children.length) { me.y = y; y += h + GAP; }
      else {
        const kids = n.children.map((c, i) => layout(c, depth + 1, depth === 0 ? i : colorIdx));
        const top = kids[0].y, bot = kids[kids.length - 1].y + kids[kids.length - 1].h;
        me.y = (top + bot) / 2 - h / 2;
        kids.forEach(k => edges.push([me, k]));
      }
      return me;
    }
    layout(tree, 0, 0);
    const maxDepth = Math.max(...nodes.map(n => n.depth));
    const W = (maxDepth + 1) * COL + 20, H = Math.max(y, 100) + 20;
    const X = d => W - 10 - NODE_W - d * COL;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Tahoma, 'Noto Naskh Arabic', sans-serif" direction="rtl">`;
    svg += `<rect width="100%" height="100%" fill="#fffdf7"/>`;
    for (const [a, b] of edges) {
      const x1 = X(a.depth), y1 = a.y + a.h / 2 + 10, x2 = X(b.depth) + NODE_W, y2 = b.y + b.h / 2 + 10;
      const mx = (x1 + x2) / 2;
      svg += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${b.color}" stroke-opacity=".55" stroke-width="2"/>`;
    }
    for (const m of nodes) {
      const x = X(m.depth), yy = m.y + 10;
      const fill = m.depth === 0 ? m.color : (m.depth === 1 ? m.color : '#ffffff');
      const txt = m.depth <= 1 ? '#ffffff' : '#1f2937';
      const attr = m.n.link ? ` data-link="${AR.escapeHtml(m.n.link)}" style="cursor:pointer"` : '';
      svg += `<g${attr}><rect x="${x}" y="${yy}" width="${NODE_W}" height="${m.h}" rx="10" fill="${fill}" stroke="${m.color}" stroke-width="1.5"/>`;
      m.lines.forEach((l, i) => {
        svg += `<text x="${x + NODE_W - PAD}" y="${yy + PAD + (i + 1) * LINE_H - 4}" text-anchor="start" font-size="${m.depth === 0 ? 15 : 13}" font-weight="${m.depth <= 1 ? 700 : 400}" fill="${txt}">${AR.escapeHtml(l)}</text>`;
      });
      if (m.n.link) svg += `<circle cx="${x + 8}" cy="${yy + 8}" r="3" fill="${m.depth <= 1 ? '#fff' : m.color}"/>`;
      svg += `</g>`;
    }
    return svg + '</svg>';
  }

  window.MINDMAP = { build, render };
})();
