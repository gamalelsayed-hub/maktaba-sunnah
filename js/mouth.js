// فم متحرك يبيّن مخرج كل حرف (مقطع جانبي للفم والحلق) — للمتعلم الذي لا يسمع جيداً أو يحتاج أن يرى
(() => {
  // أشكال اللسان (نفس بنية المسار حتى تتحول بسلاسة)
  const T = {
    rest: 'M70 132 C70 102 95 88 120 88 C135 88 144 90 147 94 L147 101 C120 105 90 111 78 136 Z',
    tip: 'M70 132 C70 100 96 86 118 84 C132 82 141 78 147 77 L149 90 C120 104 90 111 78 136 Z',
    teeth: 'M70 132 C70 100 96 88 120 86 C140 85 152 83 163 83 L161 91 C120 103 90 111 78 136 Z',
    low: 'M70 132 C70 100 96 85 121 81 C136 80 145 86 148 91 L148 98 C120 104 90 111 78 136 Z',
    mid: 'M70 132 C70 94 95 64 114 63 C132 64 142 84 147 90 L147 99 C120 104 90 111 78 136 Z',
    back: 'M70 132 C67 90 77 66 93 67 C120 72 140 86 147 91 L147 99 C120 104 90 111 78 136 Z',
    side: 'M70 132 C70 98 96 80 120 78 C134 78 142 84 147 90 L147 99 C120 104 90 111 78 136 Z'
  };
  // مخارج الحروف: [شكل اللسان، نقطة المخرج x,y، حركة الشفاه، فتحة الفك، اسم المخرج]
  const G = {
    deep: ['rest', 62, 132, '', 7, 'أقصى الحلق (أبعده عن الفم)'],
    midT: ['rest', 62, 112, '', 7, 'وسط الحلق'],
    nearT: ['back', 67, 92, '', 6, 'أدنى الحلق (أقربه إلى الفم)'],
    q: ['back', 82, 67, '', 4, 'أقصى اللسان مع ما فوقه من الحنك'],
    k: ['back', 93, 65, '', 4, 'أقصى اللسان أسفل مخرج القاف قليلاً'],
    mid: ['mid', 113, 61, '', 3, 'وسط اللسان مع ما فوقه من الحنك'],
    dad: ['side', 128, 80, '', 3, 'حافة اللسان مع الأضراس العليا'],
    lam: ['tip', 140, 77, '', 3, 'حافة اللسان من أدناها إلى منتهى طرفه'],
    nun: ['tip', 146, 76, '', 3, 'طرف اللسان مع ما فوقه من اللثة'],
    ra: ['tip', 146, 76, 'trill', 3, 'طرف اللسان مع ظهره قريباً من مخرج النون'],
    td: ['tip', 148, 78, '', 3, 'طرف اللسان مع أصول الأسنان العليا'],
    th: ['teeth', 156, 83, '', 4, 'طرف اللسان مع أطراف الأسنان العليا (يخرج قليلاً)'],
    s: ['low', 150, 88, '', 2, 'طرف اللسان مع الأسنان السفلى، والصوت يمر بين الأسنان'],
    f: ['rest', 159, 84, 'f', 2, 'باطن الشفة السفلى مع أطراف الأسنان العليا'],
    lips: ['rest', 168, 85, 'close', 0, 'الشفتان معاً'],
    w: ['back', 168, 85, 'round', 2, 'الشفتان مع ضمّهما']
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
    const jawVals = `0 150 70;${jaw} 150 70;${jaw} 150 70;0 150 70`;
    // الشفة السفلى: إغلاق (ب م) أو صعود إلى الأسنان (ف) أو ضمّ (و)
    const lipVals = lip === 'close' ? '0 0;0 -9;0 -9;0 0' : lip === 'f' ? '0 0;-6 -8;-6 -8;0 0' : lip === 'round' ? '0 0;5 -3;5 -3;0 0' : '0 0;0 0;0 0;0 0';
    const upVals = lip === 'close' ? '0 0;0 4;0 4;0 0' : lip === 'round' ? '0 0;5 2;5 2;0 0' : '0 0;0 0;0 0;0 0';
    return `<div class="mouth" data-mouth="${id}">
      <svg viewBox="30 30 160 125" role="img" aria-label="مخرج الحرف ${ch}">
        <path class="m-face" d="M40 40 C70 34 120 36 150 50 C160 55 166 60 166 64 C172 66 175 70 172 73 L176 80 C176 84 172 86 170 87 L174 92 C176 100 170 104 164 108 C150 128 120 140 100 150 L40 150 Z"/>
        <path class="m-throat" d="M54 74 C52 100 52 125 56 150 L72 150 C70 125 70 100 74 74 Z"/>
        <path class="m-cavity" d="M74 74 C80 62 100 56 120 58 C138 60 150 66 156 72 L156 96 C130 104 100 108 80 132 Z"/>
        <path class="m-palate" d="M152 70 C140 60 125 56 110 56 C96 56 86 60 78 66 C74 70 72 74 71 78"/>
        <rect class="m-tooth" x="148" y="68" width="8" height="12" rx="2"/>
        <g class="m-uplip"><path class="m-lip" d="M158 64 C166 64 172 68 172 73 C172 77 166 79 158 79 Z"/>${animT('translate', upVals)}</g>
        <g class="m-jaw">
          <rect class="m-tooth" x="146" y="88" width="8" height="11" rx="2"/>
          <g class="m-lolip"><path class="m-lip" d="M156 87 C166 87 172 90 172 95 C172 100 166 103 156 102 Z"/>${animT('translate', lipVals)}</g>
          <path class="m-tongue" d="${T.rest}">${anim('d', tongueVals)}</path>
          ${animT('rotate', jawVals)}
        </g>
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
