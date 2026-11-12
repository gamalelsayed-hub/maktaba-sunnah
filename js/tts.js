/* 🔊 قراءة النصوص بصوت عربي (أحاديث، شروح، كتب) — يستعمل أصوات الجهاز المدمجة.
   القرآن لا يُقرأ بهذا الصوت الآلي، بل بتلاوات القرّاء (audio.js). */
(() => {
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const synth = window.speechSynthesis;
  const S = { chunks: [], i: 0, on: false, rate: 1, voice: null, title: '' };
  try { Object.assign(S, JSON.parse(localStorage.getItem('tts') || '{}'), { chunks: [], i: 0, on: false }); } catch (e) { }
  const saveCfg = () => { try { localStorage.setItem('tts', JSON.stringify({ rate: S.rate, voice: S.voice })); } catch (e) { } };

  const voices = () => (synth ? synth.getVoices() : []).filter(v => /^ar/i.test(v.lang));
  // نفضّل الأصوات الطبيعية (Natural/Online) ثم أصوات Google ثم غيرها
  const rank = v => (/natural|online/i.test(v.name) ? 0 : /google/i.test(v.name) ? 1 : 2);
  const pickVoice = () => { const vs = voices().sort((a, b) => rank(a) - rank(b)); return vs.find(v => v.name === S.voice) || vs[0] || null; };

  // تقسيم النص إلى جمل قصيرة (بعض المتصفحات تقطع الجمل الطويلة)
  function split(text) {
    const t = String(text || '').replace(/<[^>]+>/g, ' ').replace(/[\[\]{}#*_|]/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = t.split(/(?<=[.،؛:!؟?\n])\s+/), out = [];
    let cur = '';
    for (const p of parts) { if ((cur + ' ' + p).length > 220 && cur) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p; }
    if (cur) out.push(cur);
    return out.flatMap(c => c.length <= 300 ? [c] : c.match(/.{1,260}(\s|$)/g));
  }
  const NT = window.NATIVE_TTS;
  function speakNext() {
    if (!S.on || S.i >= S.chunks.length) { stop(); return; }
    if (NT) { // تطبيق الجوال: محرك القراءة في الجهاز
      const my = S.gen = (S.gen || 0) + 1;
      NT.speak(S.chunks[S.i], S.rate).then(() => { if (!S.on || my !== S.gen) return; S.i++; bar(); speakNext(); })
        .catch(e => { if (S.on) { APP.toast('تعذرت القراءة الصوتية — ثبّت صوتاً عربياً من إعدادات «تحويل النص إلى كلام» في جهازك', 7000); NT.openInstall(); stop(); } });
      return;
    }
    const u = new SpeechSynthesisUtterance(S.chunks[S.i]);
    const v = pickVoice(); if (v) u.voice = v; u.lang = v ? v.lang : 'ar-SA'; u.rate = S.rate;
    u.onend = () => { if (!S.on) return; S.i++; bar(); speakNext(); };
    u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') { APP.toast(voices().length ? 'تعذرت القراءة الصوتية: ' + e.error : 'لا يوجد صوت عربي في جهازك — راجع «الإعدادات ← القراءة الصوتية» لطريقة إضافته', 7000); stop(); } };
    synth.speak(u);
  }
  function read(text, title) {
    if (!synth && !NT) { APP.toast('القراءة الصوتية غير مدعومة في هذا المتصفح'); return; }
    if (window.QA) QA.stop();
    if (NT) NT.stop(); else synth.cancel();
    S.chunks = split(text); S.i = 0; S.on = true; S.title = title || '';
    if (!NT && !voices().length) APP.toast('لم يُعثر على صوت عربي في جهازك — ستُقرأ بالصوت الافتراضي. راجع «الإعدادات ← القراءة الصوتية»', 6000);
    bar(); speakNext();
  }
  function stop() { S.on = false; S.paused = false; if (NT) NT.stop(); else if (synth) synth.cancel(); bar(); }
  const pause = () => {
    if (NT) { if (S.paused) { S.paused = false; S.on = true; speakNext(); } else { S.paused = true; S.gen++; NT.stop(); } bar(); return; }
    if (synth.paused) synth.resume(); else synth.pause(); bar();
  };
  const jump = d => { S.i = Math.max(0, Math.min(S.chunks.length - 1, S.i + d)); if (NT) { S.gen++; NT.stop(); S.paused = false; setTimeout(speakNext, 80); } else { synth.cancel(); setTimeout(speakNext, 50); } bar(); };

  function bar() {
    let b = document.getElementById('ttsBar');
    if (!S.on) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'ttsBar'; b.className = 'qa-bar'; document.body.appendChild(b); }
    b.innerHTML = `<button class="btn sm" data-a="p">⏮</button><button class="btn sm primary" data-a="t">${(NT ? S.paused : synth.paused) ? '▶' : '⏸'}</button><button class="btn sm" data-a="n">⏭</button>
      <span class="qa-now">🗣️ ${esc(S.title.slice(0, 40))} — ${AR.toArabicDigits(S.i + 1)}/${AR.toArabicDigits(S.chunks.length)}</span>
      <label class="muted">السرعة <select data-a="r">${[0.7, 0.85, 1, 1.15, 1.3, 1.5].map(r => `<option value="${r}" ${r == S.rate ? 'selected' : ''}>${r}×</option>`).join('')}</select></label>
      <button class="btn sm" data-a="x">✕</button>`;
    b.querySelector('[data-a=p]').onclick = () => jump(-1);
    b.querySelector('[data-a=n]').onclick = () => jump(1);
    b.querySelector('[data-a=t]').onclick = pause;
    b.querySelector('[data-a=x]').onclick = stop;
    b.querySelector('[data-a=r]').onchange = e => { S.rate = +e.target.value; saveCfg(); jump(0); };
  }

  // إعدادات الصوت (تُعرض في شاشة الإعدادات)
  function settingsHtml() {
    if (NT) return `<div class="card"><h2 style="margin-top:0">🗣️ القراءة الصوتية للنصوص</h2><div class="sub">تستعمل محرك «تحويل النص إلى كلام» في جهازك. لأوضح صوت: إعدادات الجهاز ← تحويل النص إلى كلام ← محرك Google ← ثبّت بيانات اللغة العربية.</div><button class="btn sm" id="ttsTest">جرّب</button></div>`;
    const vs = voices();
    return `<div class="card"><h2 style="margin-top:0">🗣️ القراءة الصوتية للنصوص</h2>
      <div class="sub">تقرأ الأحاديث والشروح والكتب بصوت عربي من أصوات جهازك. القرآن يُسمع بتلاوات القرّاء لا بالصوت الآلي.</div>
      ${vs.length ? `<label>الصوت: <select id="ttsV">${vs.sort((a, b) => rank(a) - rank(b)).map(v => `<option ${v.name === (pickVoice() || {}).name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label> <button class="btn sm" id="ttsTest">جرّب</button>`
        : `<div class="warn">لا يوجد صوت عربي مثبت في جهازك. <b>في ويندوز:</b> الإعدادات ← الوقت واللغة ← اللغة ← أضف «العربية» وفعّل «تحويل النص إلى كلام». <b>في أندرويد:</b> إعدادات ← تحويل النص إلى كلام ← محرك Google ← ثبّت بيانات اللغة العربية. وأوضح الأصوات العربية حالياً في متصفح <b>Edge</b> (أصوات «Natural» تحتاج إنترنت).</div>`}
      <div class="muted" style="font-size:13px;margin-top:6px">💡 النص المشكول يُقرأ أصح من غير المشكول، والصوت الآلي قد يخطئ في بعض الأعلام والكلمات النادرة.</div></div>`;
  }
  function bindSettings(el) {
    const v = el.querySelector('#ttsV'); if (v) v.onchange = () => { S.voice = v.value; saveCfg(); };
    const t = el.querySelector('#ttsTest'); if (t) t.onclick = () => read('بسم الله، والحمد لله، والصلاة والسلام على رسول الله. هذا مثال على القراءة الصوتية.', 'تجربة');
  }
  if (synth) synth.onvoiceschanged = () => { };

  window.TTS = { read, stop, settingsHtml, bindSettings, split };
})();
