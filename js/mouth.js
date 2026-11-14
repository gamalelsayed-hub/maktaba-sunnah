// فم متحرك يبيّن مخرج كل حرف (مقطع جانبي للفم والحلق) — للمتعلم الذي لا يسمع جيداً أو يحتاج أن يرى
(() => {
  // أشكال اللسان على مقطع جانبي حقيقي للرأس (نفس بنية المسار حتى يتحول بسلاسة)
  const T = {
    rest: 'M112 200 C106 160 130 130 165 128 C188 127 202 130 207 134 L207 142 C180 148 150 158 128 195 Z',
    tip: 'M112 200 C106 158 132 128 168 124 C190 120 202 116 208 114 L209 132 C180 146 150 158 128 195 Z',
    teeth: 'M112 200 C106 160 132 130 168 128 C195 127 210 129 221 130 L219 136 C180 146 150 158 128 195 Z',
    low: 'M112 200 C106 158 132 124 170 120 C190 119 202 128 207 136 L207 144 C180 148 150 158 128 195 Z',
    mid: 'M112 200 C104 150 135 108 165 108 C188 109 200 126 206 134 L206 143 C180 148 150 158 128 195 Z',
    back: 'M112 200 C100 150 112 112 132 112 C165 116 195 128 206 134 L206 143 C180 148 150 158 128 195 Z',
    side: 'M112 200 C106 156 134 120 168 118 C188 118 200 126 206 134 L206 143 C180 148 150 158 128 195 Z'
  };
  // مخارج الحروف: [شكل اللسان، نقطة المخرج x,y، حركة الشفاه، فتحة الفك بالدرجات، اسم المخرج]
  const G = {
    deep: ['rest', 108, 214, '', 7, 'أقصى الحلق (أبعده عن الفم)'],
    midT: ['rest', 104, 170, '', 7, 'وسط الحلق'],
    nearT: ['back', 111, 128, '', 6, 'أدنى الحلق (أقربه إلى الفم)'],
    q: ['back', 124, 112, '', 4, 'أقصى اللسان مع ما فوقه من الحنك'],
    k: ['back', 138, 111, '', 4, 'أقصى اللسان أسفل مخرج القاف قليلاً'],
    mid: ['mid', 165, 108, '', 3, 'وسط اللسان مع ما فوقه من الحنك'],
    dad: ['side', 180, 118, '', 3, 'حافة اللسان مع الأضراس العليا'],
    lam: ['tip', 200, 114, '', 3, 'حافة اللسان من أدناها إلى منتهى طرفه'],
    nun: ['tip', 205, 113, '', 3, 'طرف اللسان مع ما فوقه من اللثة'],
    ra: ['tip', 205, 113, 'trill', 3, 'طرف اللسان مع ظهره قريباً من مخرج النون'],
    td: ['tip', 208, 114, '', 3, 'طرف اللسان مع أصول الأسنان العليا'],
    th: ['teeth', 219, 129, '', 4, 'طرف اللسان مع أطراف الأسنان العليا (يخرج قليلاً)'],
    s: ['low', 210, 134, '', 2, 'طرف اللسان مع الأسنان السفلى، والصوت يمر بين الأسنان'],
    f: ['rest', 216, 128, 'f', 2, 'باطن الشفة السفلى مع أطراف الأسنان العليا'],
    lips: ['rest', 231, 130, 'close', 0, 'الشفتان معاً'],
    w: ['back', 231, 130, 'round', 2, 'الشفتان مع ضمّهما']
  };
  const BY = { 'ا': 'deep', 'ء': 'deep', 'أ': 'deep', 'ه': 'deep', 'ع': 'midT', 'ح': 'midT', 'غ': 'nearT', 'خ': 'nearT', 'ق': 'q', 'ك': 'k', 'ج': 'mid', 'ش': 'mid', 'ي': 'mid', 'ض': 'dad', 'ل': 'lam', 'ن': 'nun', 'ر': 'ra', 'ت': 'td', 'د': 'td', 'ط': 'td', 'ث': 'th', 'ذ': 'th', 'ظ': 'th', 'ص': 's', 'س': 's', 'ز': 's', 'ف': 'f', 'ب': 'lips', 'م': 'lips', 'و': 'w' };

  function html(ch) {
    const g = G[BY[ch]]; if (!g) return '';
    const [tg, x, y, lip, jaw, name] = g;
    const id = 'm' + Math.random().toString(36).slice(2, 8);
    const dur = '1.8s';
    const anim = (attr, vals, extra = '') => `<animate attributeName="${attr}" values="${vals}" keyTimes="0;0.3;0.75;1" dur="${dur}" begin="indefinite" fill="freeze" ${extra}/>`;
    const animT = (type, vals) => `<animateTransform attributeName="transform" type="${type}" values="${vals}" keyTimes="0;0.3;0.75;1" dur="${dur}" begin="indefinite" fill="freeze"/>`;
    const tongueVals = `${T.rest};${T[tg]};${T[tg]};${T.rest}`;
    const jawVals = `0 120 115;${jaw} 120 115;${jaw} 120 115;0 120 115`;
    const lipVals = lip === 'close' ? '0 0;0 -4;0 -4;0 0' : lip === 'f' ? '0 0;-5 -6;-5 -6;0 0' : lip === 'round' ? '0 0;5 -1;5 -1;0 0' : '0 0;0 0;0 0;0 0';
    const upVals = lip === 'close' ? '0 0;0 2;0 2;0 0' : lip === 'round' ? '0 0;5 1;5 1;0 0' : '0 0;0 0;0 0;0 0';
    const lbl = (x, y, tx, ty, t, cls = '') => `<line class="m-ld" x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/><text class="m-lb ${cls}" x="${tx}" y="${ty + (ty > y ? 9 : -2)}">${t}</text>`;
    return `<div class="mouth" data-mouth="${id}">
      <svg viewBox="10 20 290 225" role="img" aria-label="مخرج الحرف ${ch}">
        <path class="m-skin" d="M20 20 L185 22 C200 30 207 45 208 62 C212 74 228 88 239 98 C241 103 236 107 224 108 C229 110 234 115 234 121 C234 126 230 129 226 130 C231 133 234 137 234 142 C234 149 228 152 220 154 C222 162 230 170 230 178 C228 192 210 198 180 204 C172 214 170 230 170 245 L20 245 Z"/>
        <path class="m-hair" d="M20 20 L185 22 C170 24 150 26 120 30 C90 34 60 40 40 50 L20 56 Z"/>
        <path class="m-ear" d="M70 70 C58 66 50 76 52 90 C54 104 62 112 72 108 C78 104 76 96 74 90 C78 84 78 74 70 70 Z"/>
        <path class="m-ear-in" d="M66 80 C60 84 60 96 66 102"/>
        <path class="m-brow" d="M160 46 C168 41 180 41 192 46"/>
        <path class="m-eyew" d="M164 58 C170 52 182 52 190 57 C184 63 172 64 164 58 Z"/>
        <circle class="m-iris" cx="181" cy="57.5" r="3.6"/><circle class="m-pupil" cx="182" cy="57.5" r="1.6"/>
        <path class="m-lid" d="M164 58 C170 52 182 52 190 57"/>
        <path class="m-nose" d="M118 80 C150 66 192 66 214 84 L220 100 C190 103 150 103 118 104 Z"/>
        <path class="m-cav" d="M110 116 C130 110 180 108 212 112 L214 152 C180 158 140 168 120 196 L112 200 Z"/>
        <path class="m-phar" d="M93 112 C89 140 90 178 98 214 L120 214 C114 180 110 150 112 116 Z"/>
        <path class="m-lar" d="M96 206 L124 206 L126 245 L94 245 Z"/>
        <path class="m-vf" d="M100 218 L120 218 M100 224 L120 224"/>
        <path class="m-epi" d="M120 182 C126 172 128 168 124 160"/>
        <path class="m-bone" d="M208 107 C186 103 150 102 126 107"/>
        <path class="m-soft" d="M126 107 C116 109 110 117 108 126"/>
        <ellipse class="m-uvula" cx="107" cy="129" rx="3.5" ry="5"/>
        <path class="m-gum" d="M203 104 L216 104 L216 112 L203 112 Z"/>
        <path class="m-tooth" d="M205 109 L215 109 L217 127 C215 130 210 130 208 127 Z"/>
        <g>${animT('translate', upVals)}<path class="m-lip" d="M214 108 C224 108 234 114 234 121 C233 127 224 128 214 127 Z"/></g>
        <g>${animT('rotate', jawVals)}
          <path class="m-gum" d="M203 146 L216 146 L216 154 L203 154 Z"/>
          <path class="m-tooth" d="M205 150 L215 150 L217 134 C215 131 210 131 208 134 Z"/>
          <g>${animT('translate', lipVals)}<path class="m-lip" d="M214 132 C224 131 234 135 234 141 C233 148 224 151 214 150 Z"/></g>
          <path class="m-tongue" d="${T.rest}">${anim('d', tongueVals)}</path>
        </g>
        ${lbl(236, 96, 262, 84, 'الأنف')}${lbl(214, 118, 262, 104, 'الأسنان')}${lbl(234, 130, 262, 126, 'الشفتان')}
        ${lbl(165, 104, 150, 92, 'الحَنَك (سقف الفم)')}${lbl(106, 131, 62, 126, 'اللهاة')}${lbl(97, 170, 52, 166, 'الحلق')}${lbl(98, 220, 50, 228, 'الحنجرة')}${lbl(160, 150, 168, 178, 'اللسان', 'in')}
        ${lip === 'trill' ? `<circle class="m-trill" cx="${x}" cy="${y}" r="3"/>` : ''}
        <circle class="m-pt" cx="${x}" cy="${y}" r="6"/>
        <circle class="m-ring" cx="${x}" cy="${y}" r="6"/>
      </svg>
      <div class="m-name">👄 <b>${ch}</b>: ${name}</div>
      <button class="lr-btn ghost m-play" type="button">▶ شاهد الفم</button>
    </div>`;
  }
  function play(root) {
    (root.querySelectorAll ? root : document).querySelectorAll('.mouth').forEach(m => {
      m.querySelectorAll('animate').forEach(a => { try { a.beginElement(); } catch (e) { } });
      m.classList.remove('on'); void m.offsetWidth; m.classList.add('on');
    });
  }
  function bind(root) {
    root.querySelectorAll('.mouth').forEach(m => { const b = m.querySelector('.m-play'); if (b) b.onclick = () => play(m); });
    setTimeout(() => play(root), 350);
  }
  window.MOUTH = { html, play, bind, has: ch => !!BY[ch] };
})();
