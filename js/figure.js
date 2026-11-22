/* 🧍 رسّام الشخصيات المتحركة للتمارين (رفيقة ورفيق)
   أطراف مخروطية بمفاصل، وظلال للعمق، وجسم بكتفين وخصر، ووجه يتجه مع الحركة، وحذاء، وظل على الأرض.
   FIG.svg(poses, exercise, t, { look: 'man' | 'woman', preg, kegel }) */
(() => {
  const J = ['head', 'neck', 'hip', 'le', 'lh', 're', 'rh', 'lk', 'lf', 'rk', 'rf'];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const f = n => Math.round(n * 100) / 100;
  const P = p => f(p[0]) + ',' + f(p[1]);
  const LOOKS = {
    man: { skin: '#E8B996', skinD: '#C98E68', top: '#1F5FA8', topD: '#164781', topL: '#2E76C7', pants: '#2F3B4C', pantsD: '#222B37', shoe: '#F2F4F7', sole: '#5B6573', hair: '#2A1C14' },
    woman: { skin: '#F0CDB7', skinD: '#D9A98E', top: '#C2578A', topD: '#9E3F6C', topL: '#D47FA6', pants: '#7A3F62', pantsD: '#5E2E4B', shoe: '#FFFFFF', sole: '#B58AA3', hijab: '#7E2156', hijabL: '#9B3A70' },
  };
  // طرف مخروطي: شبه منحرف بين مفصلين مع دائرتين عند الطرفين
  function limb(a, b, wa, wb, fill) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return `<path d="M${P([a[0] + nx * wa / 2, a[1] + ny * wa / 2])} L${P([b[0] + nx * wb / 2, b[1] + ny * wb / 2])} L${P([b[0] - nx * wb / 2, b[1] - ny * wb / 2])} L${P([a[0] - nx * wa / 2, a[1] - ny * wa / 2])} Z" fill="${fill}"/><circle cx="${f(a[0])}" cy="${f(a[1])}" r="${f(wa / 2)}" fill="${fill}"/><circle cx="${f(b[0])}" cy="${f(b[1])}" r="${f(wb / 2)}" fill="${fill}"/>`;
  }
  // حذاء: بيضاوي ممتد إلى جهة الوجه
  function shoe(k, ft, dir, L, far) {
    const ang = Math.atan2(ft[1] - k[1], ft[0] - k[0]) - dir * Math.PI / 2;
    const cx = ft[0] + Math.cos(ang) * 2.2, cy = ft[1] + Math.sin(ang) * 2.2, deg = ang * 180 / Math.PI;
    return `<g transform="rotate(${f(deg)} ${f(cx)} ${f(cy)})"><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="4.6" ry="2.3" fill="${far ? L.sole : L.shoe}"/><rect x="${f(cx - 4.4)}" y="${f(cy + 1.1)}" width="8.8" height="1.3" rx=".6" fill="${L.sole}"/></g>`;
  }
  function svg(PO, e, t, o = {}) {
    const L = LOOKS[o.look] || LOOKS.man, A = PO[e.frames[0]] || PO.stand, B = PO[e.frames[1]] || A, p = {};
    J.forEach(j => p[j] = lerp(A[j] || PO.stand[j], B[j] || A[j] || PO.stand[j], t));
    const dx = p.hip[0] - p.neck[0], dy = p.hip[1] - p.neck[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const front = Math.abs(dx) < 6 && Math.abs(p.head[0] - p.neck[0]) < 3 && dy > 0;
    // جهة الوجه: نحو الأمام في الوقفة الجانبية، ونحو الرأس عند الاستلقاء
    let dir = p.head[0] < p.hip[0] - 4 ? -1 : p.head[0] > p.hip[0] + 4 ? 1 : (p.lf[0] + p.rf[0]) / 2 < p.hip[0] ? -1 : 1;
    if (Math.abs(dy) > Math.abs(dx)) dir = (p.lk[0] + p.rk[0]) / 2 < p.hip[0] - 1 ? -1 : (p.lk[0] + p.rk[0]) / 2 > p.hip[0] + 1 ? 1 : -1;
    const W = o.look === 'woman' ? { sh: 5.6, hip: 6.2, waist: 4.4 } : { sh: 7.2, hip: 5.4, waist: 5 };
    const S = k => [p.neck[0] + px * k + ux * 1.5, p.neck[1] + py * k + uy * 1.5], H = k => [p.hip[0] + px * k, p.hip[1] + py * k];
    const mid = lerp(p.neck, p.hip, .55), M = k => [mid[0] + px * k, mid[1] + py * k];
    const sw = front ? 1 : .62; // في الوقفة الجانبية يضيق الجسم
    const torso = `M${P(S(-W.sh * sw))} Q${P(M(-W.waist * sw))} ${P(H(-W.hip * sw))} L${P(H(W.hip * sw))} Q${P(M(W.waist * sw))} ${P(S(W.sh * sw))} Z`;
    const id = 'g' + (o.look || 'm');
    let s = `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs>
      <linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L.topL}"/><stop offset=".55" stop-color="${L.top}"/><stop offset="1" stop-color="${L.topD}"/></linearGradient>
      <radialGradient id="${id}s" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="${L.skin}"/><stop offset="1" stop-color="${L.skinD}"/></radialGradient></defs>
      <ellipse cx="${f(p.hip[0])}" cy="92.5" rx="${f(18 + Math.abs(dx) * .35)}" ry="2.2" fill="rgba(0,0,0,.12)"/>
      <line x1="2" y1="91" x2="98" y2="91" stroke="rgba(0,0,0,.12)" stroke-width="1"/>`;
    // الأطراف البعيدة (أغمق)
    const far = o.look === 'woman' ? L.pantsD : L.pantsD;
    s += limb(p.hip, p.lk, 7.2, 5.4, far) + limb(p.lk, p.lf, 5.2, 3.6, far) + shoe(p.lk, p.lf, dir, L, true);
    s += limb(S(-W.sh * sw * .7), p.le, 4.6, 3.6, L.topD) + limb(p.le, p.lh, 3.4, 2.6, L.skinD) + `<circle cx="${f(p.lh[0])}" cy="${f(p.lh[1])}" r="2" fill="${L.skinD}"/>`;
    // الرقبة والجسم
    s += limb(p.neck, lerp(p.neck, p.head, .45), 3.6, 3.4, L.skinD);
    s += `<path d="${torso}" fill="url(#${id}t)"/>`;
    if (o.look === 'woman') { // ثوب رياضي طويل واسع حتى الركبة
      const km = lerp(p.lk, p.rk, .5), sp = Math.max(6, Math.hypot(p.lk[0] - p.rk[0], p.lk[1] - p.rk[1]) / 2 + 4);
      const hem = k => [km[0] + px * k + (km[0] - p.hip[0]) * .12, km[1] + py * k + (km[1] - p.hip[1]) * .12];
      s += `<path d="M${P(H(-W.hip * sw))} L${P(hem(-sp))} Q${P(lerp(hem(-sp), hem(sp), .5))} ${P(hem(sp))} L${P(H(W.hip * sw))} Z" fill="${L.top}" opacity=".95"/>`;
      if (o.preg) { const b = lerp(p.neck, p.hip, .64); let nx = px, ny = py; if (Math.abs(dx) < 6) { nx = .9; ny = 0; } else if (ny < 0) { nx = -nx; ny = -ny; } s += `<ellipse cx="${f(b[0] + nx * 5)}" cy="${f(b[1] + ny * 5)}" rx="7.4" ry="7" fill="${L.topL}"/>`; }
      if (o.kegel) s += `<circle cx="${f(p.hip[0])}" cy="${f(p.hip[1])}" r="${f(3 + t * 4)}" fill="none" stroke="#3C9C8E" stroke-width="1.3"/>`;
    } else {
      s += `<path d="M${P(H(-W.hip * sw - .4))} L${P(H(W.hip * sw + .4))} L${P([p.hip[0] + px * W.hip * sw - ux * 2.4, p.hip[1] + py * W.hip * sw - uy * 2.4])} L${P([p.hip[0] - px * W.hip * sw - ux * 2.4, p.hip[1] - py * W.hip * sw - uy * 2.4])} Z" fill="${L.topD}"/>`; // حافة القميص
    }
    // الأطراف القريبة
    s += limb(p.hip, p.rk, 7.8, 5.8, L.pants) + limb(p.rk, p.rf, 5.6, 3.9, L.pants) + shoe(p.rk, p.rf, dir, L, false);
    s += limb(S(W.sh * sw * .7), p.re, 5, 3.9, L.top) + limb(p.re, p.rh, 3.7, 2.8, `url(#${id}s)`) + `<circle cx="${f(p.rh[0])}" cy="${f(p.rh[1])}" r="2.2" fill="${L.skin}"/>`;
    // الرأس
    const hx = p.head[0], hy = p.head[1], tn = [p.neck[0] - hx, p.neck[1] - hy], tl = Math.hypot(tn[0], tn[1]) || 1, qx = -tn[1] / tl, qy = tn[0] / tl;
    const ang = Math.atan2(tn[1], tn[0]) * 180 / Math.PI - 90;
    if (o.look === 'woman') {
      const drape = `M${P([hx + qx * 7.6, hy + qy * 7.6])} L${P([p.neck[0] + qx * 7.4 + tn[0] / tl * 4, p.neck[1] + qy * 7.4 + tn[1] / tl * 4])} Q${P([p.neck[0] + tn[0] / tl * 8, p.neck[1] + tn[1] / tl * 8])} ${P([p.neck[0] - qx * 7.4 + tn[0] / tl * 4, p.neck[1] - qy * 7.4 + tn[1] / tl * 4])} L${P([hx - qx * 7.6, hy - qy * 7.6])} Z`;
      s += `<path d="${drape}" fill="${L.hijab}"/><circle cx="${f(hx)}" cy="${f(hy)}" r="7.6" fill="${L.hijab}"/><circle cx="${f(hx - 1.5)}" cy="${f(hy - 2)}" r="5" fill="${L.hijabL}" opacity=".35"/>`;
      s += front ? `<ellipse cx="${f(hx)}" cy="${f(hy + .6)}" rx="4.3" ry="5" fill="url(#${id}s)"/>` : `<g transform="rotate(${f(ang)} ${f(hx)} ${f(hy)})"><ellipse cx="${f(hx + dir * 1.8)}" cy="${f(hy + .4)}" rx="3.9" ry="4.9" fill="url(#${id}s)"/><circle cx="${f(hx + dir * 3)}" cy="${f(hy - .4)}" r=".55" fill="#3a2a22"/></g>`;
    } else {
      s += `<g transform="rotate(${f(ang)} ${f(hx)} ${f(hy)})"><ellipse cx="${f(hx)}" cy="${f(hy)}" rx="5.4" ry="6.3" fill="url(#${id}s)"/>`;
      if (front) s += `<path d="M${f(hx - 5.6)},${f(hy - .6)} Q${f(hx - 5.8)},${f(hy - 7.6)} ${f(hx)},${f(hy - 7.2)} Q${f(hx + 5.8)},${f(hy - 7.6)} ${f(hx + 5.6)},${f(hy - .6)} Q${f(hx)},${f(hy - 4.4)} ${f(hx - 5.6)},${f(hy - .6)} Z" fill="${L.hair}"/><circle cx="${f(hx - 1.9)}" cy="${f(hy + .4)}" r=".55" fill="#2a1c14"/><circle cx="${f(hx + 1.9)}" cy="${f(hy + .4)}" r=".55" fill="#2a1c14"/><path d="M${f(hx - 1.6)},${f(hy + 3)} Q${f(hx)},${f(hy + 4)} ${f(hx + 1.6)},${f(hy + 3)}" stroke="#9a5a45" stroke-width=".5" fill="none"/>`;
      else s += `<path d="M${f(hx - dir * 5.6)},${f(hy + 2)} Q${f(hx - dir * 6.4)},${f(hy - 7.4)} ${f(hx + dir * 1.5)},${f(hy - 6.9)} Q${f(hx + dir * 5.2)},${f(hy - 6.2)} ${f(hx + dir * 4.6)},${f(hy - 2.6)} Q${f(hx)},${f(hy - 3.6)} ${f(hx - dir * 2)},${f(hy + 1.5)} Z" fill="${L.hair}"/><ellipse cx="${f(hx - dir * 1.2)}" cy="${f(hy + .6)}" rx="1.1" ry="1.6" fill="${L.skinD}"/><circle cx="${f(hx + dir * 2.7)}" cy="${f(hy - .2)}" r=".55" fill="#2a1c14"/><path d="M${f(hx + dir * 5.3)},${f(hy + .4)} l${f(dir * .9)},1.6 l${f(-dir * 1)},.3" fill="${L.skin}"/>`;
      s += '</g>';
    }
    return s + '</svg>';
  }
  window.FIG = { svg };

  // صور حقيقية للتمارين (اختيارية): img/fit/<man|woman>/<id>-1.webp و <id>-2.webp، وأسماؤها مسجّلة في img/fit/index.json
  // إن وُجدت الصورتان تُعرض بالتبادل الناعم بدل الرسم، وإلا يبقى الرسم المتحرك.
  let PH = { man: [], woman: [] };
  try { fetch('img/fit/index.json?v=' + (window.DATA_V || ''), { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { if (j) PH = j; }).catch(() => { }); } catch (e) { }
  window.FIG.draw = (el, look, id, t, svgFn) => {
    if ((PH[look] || []).includes(id)) {
      let ph = el.querySelector('.fig-ph');
      if (!ph) { el.innerHTML = `<div class="fig-ph"><img src="img/fit/${look}/${id}-1.webp" alt=""><img src="img/fit/${look}/${id}-2.webp" alt=""></div>`; ph = el.querySelector('.fig-ph'); }
      ph.lastChild.style.opacity = Math.max(0, Math.min(1, (t - .47) / .06)).toFixed(2);
      return;
    }
    el.innerHTML = svgFn();
  };
})();
