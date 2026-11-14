// مكتبة القصص الكبرى: قصص مصوّرة بمستويات + كتب السيرة لكامل كيلاني، مشتركة بين الأطفال ومحو الأمية
(() => {
  const AD = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LV = [[1, '🌱', 'المستوى الأول — قصص قصيرة'], [2, '🌿', 'المستوى الثاني — قصص أطول'], [3, '🌳', 'المستوى الثالث — قصص الأنبياء والقيم']];
  const LV_A = [[1, '🌱', 'المستوى الأول — مواقف قصيرة من الحياة'], [2, '🌿', 'المستوى الثاني — قصص من الحياة'], [3, '🌳', 'المستوى الثالث — قصص أطول من الحياة'], [4, '🕌', 'قصص الأنبياء والقيم']];
  // قصص كل قسم: الأطفال لهم قصصهم، والكبار مواقف من الحياة + قصص الأنبياء
  const listFor = area => area === 'lit' ? LEARN.STORIES_A.concat(LEARN.STORIES.filter(s => s.lvl === 3).map(s => Object.assign({}, s, { lvl: 4 }))) : LEARN.STORIES;
  const findSt = id => LEARN.STORIES_A.find(x => x.id === id) || LEARN.STORIES.find(x => x.id === id);
  const DECOR = {
    night: ['🌙', '⭐', '✨'], sky: ['☁️', '☀️', '🕊️'], sea: ['🌊', '🐚', '⛵'], lake: ['🌿', '💧', '🪷'], garden: ['🌼', '🦋', '🌷'],
    desert: ['🏜️', '☀️', '🌴'], mountain: ['⛰️', '☁️', '🦅'], mosque: ['🕌', '🌙', '✨'], home: ['🪴', '🖼️', '💡'],
    school: ['📚', '✏️', '🔔'], market: ['🧺', '🍊', '🏪'], street: ['🌳', '🚦', '🏠']
  };
  // خلفية متحركة للمشهد
  const scene = (bg, inner) => {
    const d = DECOR[bg] || DECOR.sky;
    return `<div class="scene sc-${bg || 'sky'}"><i class="sc-a">${d[0]}</i><i class="sc-b">${d[1]}</i><i class="sc-c">${d[2]}</i><i class="sc-d">${d[1]}</i><div class="sc-in">${inner}</div></div>`;
  };
  // ===== محرّك تجسيد القصة: بطل القصة يتحرك حسب الفعل في الجملة =====
  // قصص الأنبياء والصحابة: لا يُجسَّد فيها أي شخص، بل الأشياء والمكان فقط
  const CAST = {
    cat: '🐈', masjid: '🧒', tree: '🧒', rain: '👧', race: '🐇', bee: '🐝', wudu: '🧒', honest: '🧒', garden: '👧', share: '🧒', ramadan: '🧒', eid: '👧',
    kitten: '🐱', market: '👧', sleep: '🧒', ant: '🐜', school1: '🧒', guests: '👧', dove: '🕊️', clean: '🧒', ball: '🧒', fish: '🐟', moon: '🧒', bird: '🐦',
    apple: '👧', car: '🚗', rabbit: '🐇', sun: '🧒', milk: '🧒', kitty: '🐈', duck: '🐥', bigtree: '🧒', drops: '☁️', kite: '🧒', cup: '🧒', quran: '🧒',
    sick: '🧒', camel: '🐪', tap: '👧', granny: '🧒', friday: '🧒', bike: '🚲', seed: '👧', lost: '🧒', sparrow: '🐦', smile: '🧒', beach: '🧒', thanks: '🧒',
    amana: '🐪', team: '🧒', stars: '🚙', patient: '👧',
    nuh: '', yunus: '', ibrahim: '', ant2: '🐜', cave: '', fil: '🐘', hira: '', hijra: '🐪'
  };
  const MOT = [['fall', /سقط|وقع|انكسر|هدم|برك/], ['sleep', /نام|ينام|تنام|النوم|ناموا|نمت/], ['fly', /طار|يطير|تطير|طارت|طيرا|حلق/], ['swim', /يسبح|تسبح|سبح|نزلت إلى الماء|البحر|الحوت/],
    ['eat', /اكل|اكلها|شرب|يأكل|تأكل|شبع/], ['sad', /حزين|خاف|بكى|يبك|تائه|مريض|جائع|عطش|غضب|وحيد|ظلمات/], ['happy', /تحب|يحب|احب|فرح|سعيد|ضحك|ابتسم|احسنت|الحمد|سعداء|يحتضن|احتضن/],
    ['grow', /نبت|كبر|ظهر|صار|طلع|ارتفع|نجى|نجاه/], ['give', /اعطى|اعطت|وضع|حمل|ساعد|احضر|اخذ|رمت|رمى|اشترت|اشترى/], ['run', /جرى|يجري|اسرع|بسرعة|قفز|ركض|تلعب|يلعب|لعب|يلعبون|نلعب/],
    ['walk', /ذهب|مشى|يمشي|رجع|دخل|خرج|جاء|ركب|زار|سافر|وصل|يسير|ذهبنا|ركبنا/]];
  const FX = { rain: /مطر|المطر|نزل منها/, night: /الليل|القمر|النجوم|ظلمات/, wind: /الهواء|الريح|طارت في/ };
  const plain = t => t.replace(/[ً-ْٰ]/g, '').replace(/[أإآ]/g, 'ا');
  function anim(st, i) {
    const pg = st.pages[i], t = plain(pg.t);
    const m = (MOT.find(([, re]) => re.test(t)) || [i === 0 ? 'walk' : 'idle'])[0];
    let actor = CAST[st.id] != null ? CAST[st.id] : (st.cast || st.ic); const prop = pg.e;
    if (actor === prop) actor = '';
    const fx = [];
    if (FX.rain.test(t)) for (let k = 0; k < 10; k++) fx.push(`<b class="fx-drop" style="--x:${(k * 37) % 100}%;--d:${(k % 5) * 0.3}s">💧</b>`);
    if (FX.night.test(t)) for (let k = 0; k < 6; k++) fx.push(`<b class="fx-star" style="--x:${8 + k * 16}%;--y:${6 + (k * 23) % 30}%;--d:${k * 0.4}s">⭐</b>`);
    if (m === 'happy') for (let k = 0; k < 5; k++) fx.push(`<b class="fx-up" style="--x:${20 + k * 15}%;--d:${k * 0.5}s">${['❤️', '✨', '🌟', '💛', '✨'][k]}</b>`);
    if (m === 'sleep') for (let k = 0; k < 3; k++) fx.push(`<b class="fx-up z" style="--x:${70 - k * 6}%;--d:${k * 0.9}s">💤</b>`);
    if (m === 'sad') fx.push('<b class="fx-tear">💧</b>');
    if (m === 'fall') fx.push('<b class="fx-boom">💥</b>');
    if (FX.wind.test(t)) fx.push('<b class="fx-wind">🌬️</b>');
    const d = DECOR[st.bg] || DECOR.sky;
    return `<div class="scene anim sc-${st.bg || 'sky'} m-${m}${actor ? '' : ' solo'}"><i class="sc-a">${d[0]}</i><i class="sc-b">${d[1]}</i><i class="sc-c">${d[2]}</i>${fx.join('')}${actor ? `<span class="act"><i>${actor}</i></span>` : ''}<span class="prop"><i>${prop}</i></span></div>`;
  }

  const spoken = t => t.replace(/ﷺ/g, 'صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ').replace(/^[–-]\s*/, '');
  const shown = t => String(t).split(' ').map(w => window.GL ? GL.wrap(w, esc(w)) : esc(w)).join(' ').replace(/^– ([^:–«]{1,30}):/, '– <b class="spk">$1:</b>').replace(/ﷺ/g, '<span class="saw">ﷺ</span>');

  // قائمة القصص مقسّمة على المستويات + رف كتب السيرة
  function shelf(b, base, pg, area) {
    const S = listFor(area), B = window.LIB_BOOKS || [], LVS = area === 'lit' ? LV_A : LV;
    const tile = (st, i) => `<a class="lr-tile kd sur ${pg['st_' + st.id] ? 'done' : ''}" href="${base}/stories/${st.id}" style="--h:${i * 53 % 360}" data-sk="stt_${st.id}"><span class="lr-emo" style="font-size:44px">${st.ic}</span><b>${st.t}</b>${pg['st_' + st.id] ? '<i class="lr-ok">⭐</i>' : ''}</a>`;
    const nDone = xs => xs.filter(st => pg['st_' + st.id]).length;
    b.innerHTML = `<div class="lib-tabs">${LVS.map(([l, ic]) => `<button data-lv="${l}">${ic} ${AD(l)}</button>`).join('')}<button data-lv="b">📚 كيلاني</button></div>` +
      LVS.map(([l, ic, t]) => { const xs = S.filter(s => (s.lvl || 1) === l); return `<section class="lib-sec" data-sec="${l}"><h3>${ic} ${t} <small>${AD(nDone(xs))}/${AD(xs.length)}</small></h3><div class="lr-grid g2">${xs.map(st => tile(st, S.indexOf(st))).join('')}</div></section>`; }).join('') +
      `<section class="lib-sec" data-sec="b"><h3>📚 كتب كامل كيلاني: السيرة النبوية ومسرحية</h3><div class="lib-books">${B.map(bk => { const d = bk.s.filter((_, n) => pg[`bk_${bk.id}_${n}`]).length; return `<a class="lib-book" href="${base}/books/${bk.id}">${scene(bk.bg, `<span class="lr-emo">${bk.ic}</span>`)}<b>${esc(bk.t)}</b><span class="lr-bar"><i style="width:${Math.round(d / bk.s.length * 100)}%"></i></span><small>${AD(d)} / ${AD(bk.s.length)} فصل</small></a>`; }).join('')}</div><p class="lib-src">نصوص هذه الكتب للأديب كامل كيلاني (ت ١٩٥٩م) — رائد أدب الأطفال — عن طبعة مؤسسة هنداوي، والنص في الملكية العامة.</p></section>`;
    const show = lv => { b.querySelectorAll('.lib-sec').forEach(s => s.hidden = s.dataset.sec !== String(lv)); b.querySelectorAll('[data-lv]').forEach(x => x.classList.toggle('on', x.dataset.lv === String(lv))); try { localStorage.setItem('lib_lv_' + area, lv); } catch (e) { } };
    b.querySelectorAll('[data-lv]').forEach(x => x.onclick = () => show(x.dataset.lv));
    let lv = '1'; try { lv = localStorage.getItem('lib_lv_' + area) || '1'; } catch (e) { }
    if (!b.querySelector(`[data-sec="${lv}"]`)) lv = '1';
    show(lv);
  }

  // فهرس كتاب
  function bookIndex(b, base, bk, pg) {
    b.innerHTML = `<div class="lib-head">${scene(bk.bg, `<span class="lr-emo">${bk.ic}</span>`)}<b>${esc(bk.t)}</b><small>كامل كيلاني</small></div><div class="lr-list">${bk.s.map(([t, l], n) => `<a class="lr-sline ${pg[`bk_${bk.id}_${n}`] ? 'done' : ''}" href="${base}/books/${bk.id}/${n}"><span class="lr-num">${AD(n + 1)}</span>${esc(t)} <small>(${AD(Math.ceil(l.length / 3))} صفحة)</small>${pg[`bk_${bk.id}_${n}`] ? ' <i class="lr-ok">✓</i>' : ''}</a>`).join('')}</div>`;
  }

  // قارئ الفصل: صفحات قصيرة، كل سطر يُضغط فيُقرأ، وزر «اقرأ لي» يقرأ الصفحة كلها
  async function readSection(b, area, base, bk, n) {
    const [title, lines] = bk.s[n] || [];
    if (!lines) return false;
    const pages = []; let cur = [];
    for (const l of lines) { cur.push(l); if (cur.length >= 3 || cur.join(' ').split(' ').length > 45) { pages.push(cur); cur = []; } }
    if (cur.length) pages.push(cur);
    const back = `${base}/books/${bk.id}`, glDone = new Set();
    for (let p = 0; p < pages.length; p++) {
      if (!b.isConnected) return true;
      await LIT.stepNext(b, `${p === 0 ? `<div class="lib-ttl">${esc(title)}</div>` : ''}${scene(bk.bg, `<span class="lr-emo sm">${bk.ic}</span>`)}<div class="lib-page">${pages[p].map((l, k) => `<p class="lib-ln ${/^[–-]/.test(l) ? 'dlg d' + (k % 2) : ''}" data-i="${k}">${shown(l)}</p>`).join('')}</div><button class="lr-btn ghost lib-read" data-readall>🔊 اقرأ لي</button><div class="lr-dots">${pages.map((_, i) => `<i class="${i === p ? 'on' : ''}"></i>`).join('')}</div>`, bb => {
        const ps = [...bb.querySelectorAll('.lib-ln')];
        if (window.GL) GL.bind(bb);
        const read = async from => { for (let i = from; i < ps.length; i++) { if (!bb.isConnected) return; ps.forEach(x => x.classList.toggle('on', x === ps[i])); await LEARN.say(null, spoken(pages[p][i])); if (window.GL) await GL.explain(ps[i], pages[p][i], glDone); } ps.forEach(x => x.classList.remove('on')); };
        ps.forEach((x, i) => x.onclick = () => { LEARN.stop(); ps.forEach(y => y.classList.toggle('on', y === x)); LEARN.say(null, spoken(pages[p][i])).then(() => window.GL && GL.explain(x, pages[p][i])).then(() => x.classList.remove('on')); });
        bb.querySelector('[data-readall]').onclick = () => { LEARN.stop(); read(0); };
      });
    }
    if (b.isConnected) await LIT.done(b, area, `bk_${bk.id}_${n}`, n + 1 < bk.s.length ? `${back}/${n + 1}` : back);
    return true;
  }

  // موجّه مشترك: sec = 'stories' أو 'books'
  async function route(sh, area, base, sec, id, sub, pg) {
    if (sec === 'stories') {
      if (id == null) { const b = sh('📚 مكتبة القصص', base); shelf(b, base, pg, area); LIT.sayTiles(b); return true; }
      const st = findSt(id); if (!st) return false;
      await KIDSQ.story(sh(st.ic + ' ' + st.t, `${base}/stories`), st, `${base}/stories`, area); return true;
    }
    if (sec === 'books') {
      const bk = (window.LIB_BOOKS || []).find(x => x.id === id);
      if (!bk) { location.replace(`${base}/stories`); return true; }
      if (sub == null) { bookIndex(sh('📚 ' + bk.t, `${base}/stories`), base, bk, pg); return true; }
      return readSection(sh('📖 ' + bk.t, `${base}/books/${bk.id}`), area, base, bk, +sub);
    }
    return false;
  }

  window.LIB = { route, scene, shelf, anim, listFor };
})();
