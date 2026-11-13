/* 🎙️ استوديو التسجيل + شاشة البداية (اختيار الفئة) */
(() => {
  const V = APP.views, esc = LEARN.esc, AD = LEARN.AD;

  // ===== شاشة البداية: من أنت؟ =====
  V.start = async el => {
    const b = LEARN.shell(el, { title: 'مكتبة القرآن والسنة', repeat: () => LEARN.say('p_welcome') });
    b.innerHTML = `<div class="st-grid">
      <a class="st-card kids" href="#/kids" data-aud="kids"><span class="st-ic">🧒</span><b>الأطفال</b><small>حروف، كتابة، أرقام، قرآن، ألعاب</small></a>
      <a class="st-card lit" href="#/literacy" data-aud="lit"><span class="st-ic">✍️</span><b>تعلّم القراءة والكتابة</b><small>لمن لا يعرف القراءة — بالصوت والصور</small></a>
      <a class="st-card adult" href="#/" data-aud="adult"><span class="st-ic">📚</span><b>الشباب والكبار</b><small>المصحف والتفسير والحديث والفقه</small></a>
    </div>
    <div class="muted" style="text-align:center;margin-top:14px;font-size:13px">يمكنك التغيير لاحقاً من القائمة: «الأطفال ومحو الأمية». <a href="#/learnrec">🎙️ استوديو تسجيل الأصوات</a></div>`;
    b.querySelectorAll('[data-aud]').forEach(a => a.addEventListener('click', () => {
      try { localStorage.setItem('audience', a.dataset.aud); } catch (e) { } LEARN.stop();
      if (a.dataset.aud === 'adult') setTimeout(() => { try { if (!localStorage.getItem('tour-done') && window.GUIDE) GUIDE.tour(0); } catch (e) { } }, 1500);
    }));
    setTimeout(() => LEARN.say('p_welcome'), 400);
  };

  // التوجيه عند فتح التطبيق حسب الفئة المختارة
  try {
    const aud = localStorage.getItem('audience'), h = location.hash;
    if (!h || h === '#/' || h === '#') {
      if (aud === 'kids') location.replace('#/kids');
      else if (aud === 'lit') location.replace('#/literacy');
      else if (!aud && !localStorage.getItem('tour-done')) location.replace('#/start');
    }
  } catch (e) { }

  // ===== استوديو التسجيل =====
  let rec = null, chunks = [];
  async function startRec() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mt = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
    rec = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined); chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.start();
    return new Promise(res => { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); rec = null; }; });
  }
  const extOf = t => /ogg/.test(t) ? 'ogg' : /mp4|aac|m4a/.test(t) ? 'm4a' : 'webm';

  V.learnrec = async (el, [mode]) => {
    const b = LEARN.shell(el, { title: '🎙️ استوديو تسجيل الأصوات', back: '#/start' });
    const all = LEARN.clips(), have = new Set(await LEARN.VS.keys());
    const groups = [...new Set(all.map(c => c.group))];
    if (mode === 'go') return focus(b, all, have);
    const done = all.filter(c => have.has(c.key)).length, p1 = all.filter(c => c.phase === 1), d1 = p1.filter(c => have.has(c.key)).length;
    b.innerHTML = `<div class="card">
        <div><b>سجّلت ${AD(done)} من ${AD(all.length)} مقطعاً</b> — المرحلة الأولى: ${AD(d1)} من ${AD(p1.length)}</div>
        <div class="lr-progress"><i style="width:${Math.round(done / all.length * 100)}%"></i></div>
        <div class="muted" style="font-size:13px;margin:8px 0">التسجيلات تُستعمل فوراً في التطبيق على هذا الجهاز. وعند الانتهاء صدّرها وأرسلها لتُضاف للتطبيق عند الجميع.</div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <a class="lr-btn ok" href="#/learnrec/go">🎙️ ابدأ التسجيل (المقطع التالي)</a>
          <button class="lr-btn" data-export>📦 تصدير التسجيلات (${AD(done)})</button>
        </div>
        <details style="margin-top:10px"><summary>نصائح للتسجيل</summary><ul style="margin:6px 0;font-size:14px;line-height:1.9">
          <li>غرفة هادئة، والجوال على بُعد شبر من فمك.</li>
          <li>صوت واضح متوسط السرعة، كأنك تعلّم طفلاً.</li>
          <li>الحروف بالحركات: انطق الصوت فقط «بَ» وليس «باء فتحة».</li>
          <li>المرحلة الثانية (المدود والتنوين) ليست مطلوبة الآن.</li>
          <li>اضغط «سجّل»، انتظر نصف ثانية، انطق، ثم «إيقاف».</li>
        </ul></details>
      </div>
      ${groups.map(g => { const cs = all.filter(c => c.group === g); const n = cs.filter(c => have.has(c.key)).length; return `<details class="card"><summary><b>${esc(g)}</b> <span class="muted">${AD(n)}/${AD(cs.length)}</span></summary>
        <div class="rc-list">${cs.map(c => `<div class="rc-row ${have.has(c.key) ? 'ok' : ''}" data-k="${c.key}"><span class="rc-show">${esc(c.show)}</span><span class="row" style="gap:4px"><button class="lr-ic sm" data-play title="استماع">▶</button><button class="lr-ic sm" data-rec title="تسجيل">🎙️</button>${have.has(c.key) ? '<button class="lr-ic sm" data-del title="حذف">🗑</button>' : ''}</span></div>`).join('')}</div></details>`; }).join('')}`;
    b.querySelector('[data-export]').onclick = exportZip;
    b.querySelectorAll('.rc-row').forEach(row => {
      const k = row.dataset.k;
      row.querySelector('[data-play]').onclick = () => LEARN.say(k);
      row.querySelector('[data-rec]').onclick = async e => {
        const btn = e.currentTarget;
        if (rec) { rec.stop(); return; }
        try { btn.textContent = '⏹'; btn.classList.add('rec-on'); const blob = await startRec(); await LEARN.VS.put(k, blob); row.classList.add('ok'); btn.textContent = '🎙️'; btn.classList.remove('rec-on'); LEARN.say(k); }
        catch (x) { btn.textContent = '🎙️'; btn.classList.remove('rec-on'); APP.toast('تعذر الوصول إلى الميكروفون — اسمح للتطبيق باستعماله', 4000); }
      };
      const d = row.querySelector('[data-del]'); if (d) d.onclick = async () => { await LEARN.VS.del(k); APP.rerender(); };
    });
  };

  async function focus(b, all, have) {
    let todo = all.filter(c => !have.has(c.key) && c.phase === 1);
    if (!todo.length) todo = all.filter(c => !have.has(c.key));
    let i = 0;
    const show = () => {
      const c = todo[i];
      if (!c) { b.innerHTML = '<div class="card" style="text-align:center"><h2>🎉 سجّلت كل المقاطع</h2><a class="lr-btn ok" href="#/learnrec">رجوع للقائمة</a></div>'; return; }
      b.innerHTML = `<div class="card rc-focus">
        <div class="muted">${esc(c.group)} — باقي ${AD(todo.length - i)}</div>
        <div class="rc-big">${esc(c.show)}</div>
        <div class="muted" style="font-size:13px">${c.text !== c.show ? 'انطق: ' + esc(c.text) : ''}</div>
        <div class="row" style="gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">
          <button class="lr-btn rec" data-rec>🎙️ سجّل</button>
          <button class="lr-btn ghost" data-skip>⏭ تخطَّ</button>
        </div>
        <div id="rcAfter" style="margin-top:12px"></div>
        <a href="#/learnrec" class="muted" style="display:block;margin-top:16px">↩ القائمة</a></div>`;
      b.querySelector('[data-skip]').onclick = () => { i++; show(); };
      const rb = b.querySelector('[data-rec]');
      rb.onclick = async () => {
        if (rec) { rec.stop(); return; }
        try {
          LEARN.stop(); rb.textContent = '⏹ إيقاف'; rb.classList.add('rec-on');
          const blob = await startRec(); rb.textContent = '🎙️ أعد التسجيل'; rb.classList.remove('rec-on');
          await LEARN.VS.put(c.key, blob); LEARN.say(c.key);
          const af = b.querySelector('#rcAfter');
          af.innerHTML = '<button class="lr-btn ok" data-next>✔ ممتاز، التالي</button>';
          af.querySelector('[data-next]').onclick = () => { i++; show(); };
        } catch (x) { rb.textContent = '🎙️ سجّل'; rb.classList.remove('rec-on'); APP.toast('تعذر الوصول إلى الميكروفون — اسمح للتطبيق باستعماله', 4000); }
      };
    };
    show();
  }

  async function exportZip() {
    const recs = await LEARN.VS.all();
    if (!recs.length) return APP.toast('لا توجد تسجيلات بعد');
    const enc = new TextEncoder(), files = [], idx = {};
    for (const r of recs) { const name = r.key + '.' + extOf(r.type || ''); idx[r.key] = name; files.push({ name, data: new Uint8Array(await r.blob.arrayBuffer()) }); }
    const texts = Object.fromEntries(LEARN.clips().map(c => [c.key, c.text]));
    files.push({ name: 'index.json', data: enc.encode(JSON.stringify({ files: idx, texts }, null, 1)) });
    const z = DOCX.zip(files);
    APP.download('learn-voices-' + new Date().toISOString().slice(0, 10) + '.zip', new Blob([z], { type: 'application/zip' }), 'application/zip');
  }
})();
