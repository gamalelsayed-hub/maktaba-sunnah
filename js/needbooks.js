/* 📥 كتب كل قسم: لا تُحمَّل إجبارياً؛ عند فتح القسم تظهر بطاقة تقترح تحميل كتبه (كتاباً كتاباً أو الكل) ليبقى حجم التطبيق صغيراً. */
(() => {
  const V = APP.views, esc = AR.escapeHtml, D = n => AR.toArabicDigits(String(n));
  const T = t => (window.PACK_MANIFEST || []).filter(m => m.optional && m.type === t).map(m => m.id);
  const MAP = {
    ilm: () => ({ t: 'كتب طلب العلم: التفاسير وشروح الحديث والفقه', ids: ['tafsir-saadi', 'tafsir-ibnkathir', 'fath', 'sharh-nawawi', 'mughni', 'bidayat', 'zad', 'taqrib', 'tafsir-tabari', 'tafsir-qurtubi', 'awn', 'sindi-nasai', 'sindi-ibnmajah', 'ahmad', 'muhalla', 'ahkam-jassas', 'ahkam-ibnalarabi'] }),
    hadith: () => ({ t: 'شروح الحديث ومسند أحمد', ids: ['fath', 'sharh-nawawi', 'awn', 'sindi-nasai', 'sindi-ibnmajah', 'ahmad'] }),
    fiqh: () => ({ t: 'كتب الفقه المقارن وأحكام القرآن', ids: ['bidayat', 'mughni', 'muhalla', 'ahkam-jassas', 'ahkam-ibnalarabi'] }),
    sira: () => ({ t: 'كتب السيرة', ids: ['ibnhisham', 'zad', 'bidaya-nihaya'] }),
    sahaba: () => ({ t: 'كتاب الإصابة في تمييز الصحابة', ids: ['isaba'] }),
    rijal: () => ({ t: 'تقريب التهذيب', ids: ['taqrib'] }),
    qiraat: () => ({ t: 'شروح القراءات والتجويد', ids: T('qiraatbook') }),
    dawah: () => ({ t: 'مكتبة الداعية: مقارنة الأديان والرد على الشبهات', ids: T('dawahbook') }),
    tarikh: () => ({ t: 'كتب التاريخ', ids: ['tarikh-khulafa', 'mukhtasar-fida', 'dawla-aliyya', 'jabarti', 'bidaya-nihaya', 'kamil-athir', 'tarikh-tabari', 'tarikh-khaldun'] }),
    adab: () => ({ t: 'الدواوين وكتب الأدب', ids: T('diwan').concat(T('adabbook')) }),
  };
  const MB = ids => Math.max(1, Math.round(ids.reduce((s, id) => s + ((window.PACK_MANIFEST || []).find(m => m.id === id) || { size: 0 }).size, 0) / 1e6));
  const title = id => ((window.PACK_MANIFEST || []).find(m => m.id === id) || { title: id }).title;
  const dismissed = k => { try { return sessionStorage.getItem('nb-' + k) === '1'; } catch (e) { return false; } };

  async function banner(el, key) {
    if (!MAP[key] || dismissed(key) || el.querySelector('.nb-card')) return;
    const g = MAP[key](); const ids = g.ids.filter(id => (window.PACK_MANIFEST || []).some(m => m.id === id));
    const have = await Promise.all(ids.map(id => DB.get('books', id)));
    const miss = ids.filter((id, i) => !have[i] || have[i].sample);
    if (!miss.length) return;
    const box = document.createElement('div'); box.className = 'card nb-card';
    const all = miss.length === ids.length;
    box.innerHTML = `<div class="nb-head"><b>📥 للاستفادة الكاملة من هذا القسم حمّل كتبه</b><button class="nb-x" title="لاحقاً">✕</button></div>
      <div class="nb-sub">${esc(g.t)}: ${all ? '' : 'بقي '}${miss.length === 1 ? 'كتاب واحد' : miss.length === 2 ? 'كتابان' : D(miss.length) + (miss.length < 11 ? ' كتب' : ' كتاباً')}، نحو ${D(MB(miss))} ميجا. تُحمَّل مرة واحدة ثم تعمل بدون إنترنت، ويمكنك اختيار ما تحتاجه فقط.</div>
      <div class="nb-list">${miss.map(id => `<button class="nb-b" data-id="${id}">⬇️ ${esc(title(id))} <small>${D(MB([id]))} م</small></button>`).join('')}</div>
      <div class="row"><button class="btn primary nb-all">⬇️ حمّل الكل (${D(MB(miss))} ميجا)</button><button class="btn nb-later">لاحقاً</button></div>
      <div class="nb-msg muted"></div>`;
    el.prepend(box);
    const msg = box.querySelector('.nb-msg');
    const run = async list => {
      box.querySelectorAll('button').forEach(b => b.disabled = true);
      try {
        await IMPORT.installPacks((i, n, t, m) => { msg.textContent = `(${D(i)} من ${D(n)}) ${t} — ${m}`; }, list);
        await APP.loadMeta(); APP.toast('تم التحميل ✓'); APP.rerender();
      } catch (e) { msg.textContent = 'تعذر التحميل: تأكد من الاتصال بالإنترنت ثم أعد المحاولة.'; box.querySelectorAll('button').forEach(b => b.disabled = false); }
    };
    box.querySelectorAll('.nb-b').forEach(b => b.onclick = () => run([b.dataset.id]));
    box.querySelector('.nb-all').onclick = () => run(miss);
    const later = () => { try { sessionStorage.setItem('nb-' + key, '1'); } catch (e) { } box.remove(); };
    box.querySelector('.nb-x').onclick = later; box.querySelector('.nb-later').onclick = later;
  }
  Object.keys(MAP).forEach(k => {
    const orig = V[k]; if (!orig) return;
    V[k] = async (el, parts, p) => { const r = await orig(el, parts, p); try { if (!parts || !parts.length || ['tarikh', 'adab', 'dawah', 'qiraat'].includes(k) && parts.length <= 1) await banner(el, k); } catch (e) { } return r; };
  });
  window.NEEDBOOKS = { banner };
})();
