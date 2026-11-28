/* 📥 استيراد تسجيل قرآن متصل (صفحة أو ربع أو سورة) وتقطيعه تلقائياً على الآيات ثم مراجعته قبل الحفظ.
   الفكرة: نحلّل الصمت في الملف، ونأخذ أطول (عدد الآيات − 1) فجوة حدوداً بين الآيات، ثم يراجع المراجع الحدود
   (استماع، نقل الحد إلى فجوة أخرى، تحريكه، أو تخطّي آية) ويعتمد، فيُحفظ لكل آية تسجيلها كأنه سُجّل منفرداً. */
(() => {
  const esc = s => AR.escapeHtml(String(s == null ? '' : s));
  const AD = n => AR.toArabicDigits(n);
  const SR = 24000;          // معدّل العيّنات بعد فك الترميز (يكفي للصوت البشري ويوفّر الذاكرة)
  const PAD = 0.2;           // هامش صمت يُترك قبل الآية وبعدها (ثانية)
  const MINGAP = 0.12;       // أقصر فجوة تُعدّ مرشّحة (ثانية)
  const FR = 0.02;           // طول الإطار لتحليل الطاقة
  const SENS = { high: 24, mid: 30, low: 38 }; // الفرق (ديسيبل) تحت مستوى الكلام الذي نعدّه صمتاً
  const LETTERS = /[ء-ي]/g;
  const fmt1 = t => AD((Math.round(t * 10) / 10).toFixed(1)).replace('.', '٫');
  const mmss = t => { t = Math.round(t); return AD(Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0')); };
  const I = () => window.LIBVOICE && window.LIBVOICE._int;

  // ---------- فك الترميز ----------
  async function decode(file) {
    const buf = await file.arrayBuffer();
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new OAC(1, 1, SR);
    const ab = await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf, res, rej); if (p && p.catch) p.catch(rej); });
    if (ab.numberOfChannels === 1) return ab;
    const mono = ctx.createBuffer(1, ab.length, ab.sampleRate), out = mono.getChannelData(0), ch = ab.numberOfChannels;
    for (let c = 0; c < ch; c++) { const d = ab.getChannelData(c); for (let i = 0; i < out.length; i++) out[i] += d[i] / ch; }
    return mono;
  }

  // ---------- تحليل الصمت ----------
  function analyze(pcm, sr, sensDb) {
    const hop = Math.round(sr * FR), n = Math.floor(pcm.length / hop), db = new Float32Array(n);
    for (let f = 0; f < n; f++) { let s = 0; const o = f * hop; for (let i = 0; i < hop; i++) { const v = pcm[o + i]; s += v * v; } db[f] = 10 * Math.log10(s / hop + 1e-12); }
    const sorted = Array.from(db).sort((a, b) => a - b);
    const floor = sorted[Math.floor(n * 0.05)], speech = sorted[Math.floor(n * 0.9)];
    let thr = Math.max(floor + 8, speech - sensDb); thr = Math.min(thr, speech - 10);
    const minF = Math.max(1, Math.round(MINGAP / FR)), gaps = [];
    let f = 0, first = 0, last = n * FR;
    while (f < n) {
      if (db[f] < thr) {
        let g = f; while (g < n && db[g] < thr) g++;
        if (f === 0) first = g * FR;
        else if (g >= n) last = f * FR;
        else if (g - f >= minF) gaps.push({ gs: f * FR, ge: g * FR, len: (g - f) * FR });
        f = g;
      } else f++;
    }
    return { gaps, first, last, dur: pcm.length / sr, thr, speech, floor };
  }

  // ---------- وحدات النص المتوقعة (آيات + بسملات) ----------
  function buildUnits(items, basmala) {
    const U = [];
    for (const it of items) {
      if (basmala && it.ayah === 1 && it.surah !== 1 && it.surah !== 9) U.push({ kind: 'basmala', label: 'البسملة — ' + 'سورة ' + AR.SURAHS[it.surah - 1], chars: 17, text: 'بسم الله الرحمن الرحيم' });
      U.push({ kind: 'ayah', it, id: it.id, label: 'سورة ' + AR.SURAHS[it.surah - 1] + ' — الآية ' + AD(it.ayah), text: it.text || '', chars: ((it.text || '').match(LETTERS) || []).length });
    }
    return U;
  }

  // اختيار أطول (U−1) فجوة حدوداً
  function pickCuts(A, U) {
    const need = Math.max(0, U - 1);
    const ranked = A.gaps.slice().sort((a, b) => b.len - a.len);
    const chosen = ranked.slice(0, need).sort((a, b) => a.gs - b.gs);
    const runnerUp = ranked[need] ? ranked[need].len : 0;
    return { cuts: chosen, runnerUp, missing: Math.max(0, need - chosen.length) };
  }

  // ---------- الترميز: Opus داخل Ogg (إن توفّر WebCodecs) وإلا WAV ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let r = (i << 24) >>> 0; for (let j = 0; j < 8; j++) r = (r & 0x80000000) ? (((r << 1) ^ 0x04C11DB7) >>> 0) : ((r << 1) >>> 0); t[i] = r >>> 0; } return t; })();
  const crc32 = b => { let c = 0; for (let i = 0; i < b.length; i++) c = (((c << 8) >>> 0) ^ CRC[((c >>> 24) ^ b[i]) & 0xFF]) >>> 0; return c >>> 0; };
  function oggPage(type, granule, serial, seq, packets) {
    const seg = []; packets.forEach(p => { let l = p.length; while (l >= 255) { seg.push(255); l -= 255; } seg.push(l); });
    const body = packets.reduce((a, p) => a + p.length, 0), out = new Uint8Array(27 + seg.length + body), dv = new DataView(out.buffer);
    out.set([0x4F, 0x67, 0x67, 0x53, 0, type], 0);
    dv.setUint32(6, granule % 4294967296, true); dv.setUint32(10, Math.floor(granule / 4294967296), true);
    dv.setUint32(14, serial, true); dv.setUint32(18, seq, true); dv.setUint32(22, 0, true);
    out[26] = seg.length; out.set(seg, 27);
    let o = 27 + seg.length; packets.forEach(p => { out.set(p, o); o += p.length; });
    dv.setUint32(22, crc32(out), true);
    return out;
  }
  function muxOgg(pk, sr, preSkip, totalSamples) {
    const serial = (Math.random() * 4294967295) >>> 0, pages = [];
    const head = new Uint8Array(19), hv = new DataView(head.buffer);
    head.set([0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64, 1, 1], 0); hv.setUint16(10, preSkip, true); hv.setUint32(12, sr, true); hv.setUint16(16, 0, true); head[18] = 0;
    const vendor = new TextEncoder().encode('maktaba'), tags = new Uint8Array(8 + 4 + vendor.length + 4), tv = new DataView(tags.buffer);
    tags.set([0x4F, 0x70, 0x75, 0x73, 0x54, 0x61, 0x67, 0x73], 0); tv.setUint32(8, vendor.length, true); tags.set(vendor, 12); tv.setUint32(12 + vendor.length, 0, true);
    pages.push(oggPage(0x02, 0, serial, 0, [head]), oggPage(0, 0, serial, 1, [tags]));
    let seq = 2, acc = 0, i = 0;
    while (i < pk.length) {
      const grp = []; let seg = 0;
      while (i < pk.length && grp.length < 50 && seg + Math.floor(pk[i].b.length / 255) + 1 <= 250) { grp.push(pk[i]); seg += Math.floor(pk[i].b.length / 255) + 1; acc += pk[i].s48; i++; }
      const lastPage = i >= pk.length;
      const gran = lastPage ? Math.min(preSkip + totalSamples, preSkip + acc) : preSkip + acc;
      pages.push(oggPage(lastPage ? 0x04 : 0, gran, serial, seq++, grp.map(g => g.b)));
    }
    return new Blob(pages, { type: 'audio/ogg' });
  }
  async function encodeOpus(pcm, sr) {
    if (!window.AudioEncoder || !window.AudioData) return null;
    const cfg = { codec: 'opus', sampleRate: sr, numberOfChannels: 1, bitrate: 56000 };
    try { const sup = await AudioEncoder.isConfigSupported(cfg); if (!sup.supported) return null; } catch (e) { return null; }
    const pk = []; let preSkip = 312, err = null;
    const enc = new AudioEncoder({
      output: (chunk, meta) => {
        const b = new Uint8Array(chunk.byteLength); chunk.copyTo(b);
        pk.push({ b, s48: Math.round((chunk.duration || 20000) * 48 / 1000) });
        const d = meta && meta.decoderConfig && meta.decoderConfig.description;
        if (d && pk.length === 1) { try { const u = d instanceof ArrayBuffer ? new Uint8Array(d) : new Uint8Array(d.buffer, d.byteOffset, d.byteLength); if (u.length >= 12 && u[0] === 0x4F) preSkip = u[10] | (u[11] << 8); } catch (e) { } }
      },
      error: e => { err = e; }
    });
    enc.configure(cfg);
    const step = sr; // ثانية في كل دفعة
    for (let o = 0; o < pcm.length; o += step) {
      const part = pcm.subarray(o, Math.min(pcm.length, o + step));
      const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: part.length, numberOfChannels: 1, timestamp: Math.round(o / sr * 1e6), data: part });
      enc.encode(ad); ad.close();
    }
    await enc.flush(); enc.close();
    if (err || !pk.length) return null;
    return muxOgg(pk, sr, preSkip, Math.round(pcm.length / sr * 48000));
  }
  function encodeWav(pcm, sr) {
    const n = pcm.length, out = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) { const v = Math.max(-1, Math.min(1, pcm[i])); out.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7FFF, true); }
    return new Blob([out.buffer], { type: 'audio/wav' });
  }
  async function encode(pcm, sr) { const o = await encodeOpus(pcm, sr).catch(() => null); return o ? { blob: o, wav: false } : { blob: encodeWav(pcm, sr), wav: true }; }

  // ---------- الواجهة ----------
  async function open(el, bookId, done) {
    const all = (await DB.byIndex('items', 'bookId', bookId)).filter(x => x.type === 'ayah').sort((a, b) => a.surah * 1000 + a.ayah - (b.surah * 1000 + b.ayah));
    if (!all.length) { APP.toast('لم يُعثر على آيات القرآن'); return; }
    const QR = await DB.setting('libvoiceQRange');
    const R = QR ? { s1: QR.s1, a1: QR.a1, s2: QR.s2, a2: QR.a2 === 999 ? '' : QR.a2 } : { s1: 1, a1: 1, s2: 1, a2: '' };
    const opts = sel => AR.SURAHS.map((n, k) => `<option value="${k + 1}" ${k + 1 === sel ? 'selected' : ''}>${AD(k + 1)}. ${esc(n)}</option>`).join('');
    el.innerHTML = `<div class="row" style="gap:8px"><a href="#" id="lsBack">↩ رجوع</a></div>
      <div class="card"><h2 style="margin-top:0">📥 استيراد تسجيل متصل وتقطيعه على الآيات</h2>
        <p class="muted" style="margin-top:0">سجّل صفحة أو ربعاً أو سورة بتطبيق التسجيل الذي تفضّله، مع وقفة قصيرة (نحو ثانية) بعد كل آية. ثم اختر النطاق والملف، فيقطّعه التطبيق على الآيات وتراجعه قبل الحفظ. الأفضل ألا يزيد الملف عن نحو ٢٠ دقيقة، فالسور الطويلة قسّمها إلى أجزاء.</p>
        <div class="row" style="gap:8px;flex-wrap:wrap;align-items:end">
          <label>من سورة<br><select id="ls1" style="max-width:190px">${opts(R.s1)}</select></label><label>الآية<br><input id="la1" type="number" min="1" value="${R.a1}" style="width:80px"></label>
          <label>إلى سورة<br><select id="ls2" style="max-width:190px">${opts(R.s2)}</select></label><label>الآية<br><input id="la2" type="number" min="1" value="${R.a2}" placeholder="آخر السورة" style="width:90px"></label>
        </div>
        <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap;align-items:end"><label>أو رقم الصفحة<br><input id="lpg" type="number" min="1" max="604" style="width:90px" placeholder="١–٦٠٤"></label><button class="btn sm" id="lpgGo">املأ النطاق من الصفحة</button></div>
        <label class="row" style="gap:8px;margin-top:12px"><input type="checkbox" id="lbsm" checked> قرأتُ البسملة في أول كل سورة (عدا الفاتحة والتوبة)</label>
        <div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" id="lpick">🎵 اختر ملف التسجيل</button></div>
        <div id="lmsg" class="muted" style="margin-top:8px"></div></div>`;
    const $ = s => el.querySelector(s);
    $('#lsBack').onclick = e => { e.preventDefault(); done(); };
    $('#lpgGo').onclick = async () => {
      const p = +$('#lpg').value; if (!(p >= 1 && p <= 604) || !window.MUSHAF) return APP.toast('أدخل رقم صفحة بين ١ و٦٠٤');
      try {
        const lines = await MUSHAF.loadPage(p), ks = [];
        lines.forEach(l => l[0] === 't' && l[1].forEach(([s, a]) => { if (!ks.some(k => k[0] === s && k[1] === a)) ks.push([s, a]); }));
        const f = ks[0], l = ks[ks.length - 1];
        $('#ls1').value = f[0]; $('#la1').value = f[1]; $('#ls2').value = l[0]; $('#la2').value = l[1];
      } catch (e) { APP.toast('تعذّر قراءة الصفحة'); }
    };
    $('#lpick').onclick = async () => {
      const s1 = +$('#ls1').value, a1 = Math.max(1, +$('#la1').value || 1), s2 = +$('#ls2').value, a2 = +$('#la2').value || 999;
      let lo = s1 * 1000 + a1, hi = s2 * 1000 + a2; if (hi < lo) { const t = lo; lo = hi; hi = t; }
      const items = all.filter(x => x.surah * 1000 + x.ayah >= lo && x.surah * 1000 + x.ayah <= hi);
      if (!items.length) return APP.toast('النطاق فارغ');
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'audio/*,.m4a,.mp3,.wav,.ogg,.opus,.aac';
      inp.onchange = async () => { const f = inp.files[0]; if (!f) return; await process(el, bookId, items, f, $('#lbsm').checked, done); };
      inp.click();
    };
  }

  async function process(el, bookId, items, file, basmala, done) {
    el.innerHTML = `<div class="card" style="text-align:center"><h3>جارٍ تجهيز «${esc(file.name)}»…</h3><p class="muted" id="lpMsg">فك ترميز الملف (قد يستغرق دقيقة للملفات الطويلة)</p></div>`;
    let ab;
    try { ab = await decode(file); }
    catch (e) { el.innerHTML = `<div class="card"><h3>تعذّر فك ترميز الملف</h3><p>${esc(e && e.message || e)}</p><p class="muted">إن كان الملف طويلاً جداً فقسّمه إلى أجزاء أقصر (ربع أو صفحات) وأعد المحاولة. جرّب أيضاً صيغة M4A أو MP3 أو WAV.</p><button class="btn" id="lpBack">رجوع</button></div>`; el.querySelector('#lpBack').onclick = () => open(el, bookId, done); return; }
    const pcm = ab.getChannelData(0), sr = ab.sampleRate;
    const have = new Set(await I().VS.keys(bookId).catch(() => []));
    const units = buildUnits(items, basmala);
    const S = { ab, pcm, sr, units, sens: 'mid', skip: new Set(), file, have, bookId };
    const recompute = () => {
      S.A = analyze(pcm, sr, SENS[S.sens]);
      const c = pickCuts(S.A, units.length); S.cuts = c.cuts; S.runnerUp = c.runnerUp; S.missing = c.missing;
    };
    recompute();
    review(el, S, done);
  }

  function review(el, S, done) {
    const { units, pcm, sr } = S;
    let pctx = null, src = null;
    const stopP = () => { if (src) { try { src.stop(); } catch (e) { } src = null; } };
    const playR = (a, b) => {
      stopP(); if (!pctx) pctx = new (window.AudioContext || window.webkitAudioContext)();
      if (pctx.state === 'suspended') pctx.resume();
      a = Math.max(0, a); b = Math.min(S.A.dur, b); if (b <= a) return;
      src = pctx.createBufferSource(); src.buffer = S.ab; src.connect(pctx.destination); src.start(0, a, b - a);
    };
    const startOf = k => k === 0 ? Math.max(0, S.A.first - PAD) : Math.max(S.cuts[k - 1].gs, S.cuts[k - 1].ge - PAD);
    const endOf = k => k >= S.cuts.length ? Math.min(S.A.dur, S.A.last + PAD) : Math.min(S.cuts[k].ge, S.cuts[k].gs + PAD);
    const matched = k => k <= S.cuts.length;
    const render = () => {
      // مدة الكلام لكل وحدة ومعدّلها لكشف الشواذ
      const speechDur = k => Math.max(0, (k >= S.cuts.length ? S.A.last : S.cuts[k].gs) - (k === 0 ? S.A.first : S.cuts[k - 1].ge));
      let totD = 0, totC = 0; units.forEach((u, k) => { if (matched(k)) { totD += speechDur(k); totC += u.chars; } });
      const rate = totC ? totD / totC : 0;
      const minCut = S.cuts.length ? Math.min(...S.cuts.map(c => c.len || (c.ge - c.gs))) : 0;
      let warn = 0;
      const rows = units.map((u, k) => {
        const m = matched(k), d = m ? speechDur(k) : 0;
        const ratio = m && rate && u.chars ? d / (u.chars * rate) : 1;
        const cutLen = m && k < S.cuts.length ? (S.cuts[k].ge - S.cuts[k].gs) : 99;
        const doubt = m && (ratio < 0.5 || ratio > 2 || (k < S.cuts.length && cutLen > 0 && (cutLen < 0.35 || (S.runnerUp && cutLen < S.runnerUp * 1.25))));
        if (doubt || !m) warn++;
        const prev = u.kind === 'ayah' && S.have.has(u.id);
        const isAyah = u.kind === 'ayah';
        return `<div class="card lvs-row" data-k="${k}" style="${doubt ? 'border-color:#e0a21b;' : !m ? 'border-color:#c0392b;' : ''}">
          <div class="row" style="gap:8px;justify-content:space-between;flex-wrap:wrap"><b>${isAyah ? '' : '﷽ '}${esc(u.label)}</b><span class="muted">${m ? '⏱ ' + fmt1(d) + ' ث' : 'لا مقطع'} ${doubt ? '<span class="tag" style="background:#fff3d6;color:#8a5a00">⚠ راجع</span>' : ''} ${prev ? '<span class="tag">يستبدل تسجيلاً سابقاً</span>' : ''}</span></div>
          <div class="muted" style="font-size:13px;margin:4px 0">${esc(u.text.split(/\s+/).slice(0, 9).join(' '))}${u.text.split(/\s+/).length > 9 ? ' …' : ''}</div>
          ${m ? `<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm" data-a="play">▶ استمع</button>${k < S.cuts.length ? `<button class="btn sm" data-a="edge">🎧 الحدّ مع التالية</button>` : ''}${isAyah ? `<label class="row" style="gap:4px"><input type="checkbox" data-a="skip" ${S.skip.has(k) ? '' : 'checked'}> احفظ</label>` : '<span class="muted">لا تُحفظ</span>'}</div>
          ${k < S.cuts.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted" style="font-size:12px">نهاية هذه:</span><button class="btn sm" data-a="gprev">◀ فجوة سابقة</button><button class="btn sm" data-a="gnext">فجوة تالية ▶</button><button class="btn sm" data-a="nm">−٠٫٢ث</button><button class="btn sm" data-a="np">+٠٫٢ث</button></div>` : ''}` : ''}
        </div>`;
      }).join('');
      const n = units.filter((u, k) => u.kind === 'ayah' && matched(k) && !S.skip.has(k)).length;
      el.innerHTML = `<div class="row" style="gap:8px;justify-content:space-between;flex-wrap:wrap"><a href="#" id="lrBack">↩ إلغاء والرجوع</a><span class="muted">${esc(S.file.name)} — ${mmss(S.A.dur)}</span></div>
        <div class="card"><b>نتيجة التقطيع:</b> ${AD(units.length)} وحدة متوقعة، و${AD(S.cuts.length + 1)} مقطعاً مُطابقاً${S.missing ? ` <span style="color:#c0392b">— ينقص ${AD(S.missing)} فجوة (لم تُستخرج لها مقاطع)</span>` : ''}${warn ? ` · ⚠ ${AD(warn)} تحتاج مراجعة` : ' · لا تنبيهات'}
          <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center"><label>حساسية الصمت <select id="lrSens"><option value="high" ${S.sens === 'high' ? 'selected' : ''}>عالية (يعدّ الخافت صمتاً)</option><option value="mid" ${S.sens === 'mid' ? 'selected' : ''}>متوسطة</option><option value="low" ${S.sens === 'low' ? 'selected' : ''}>منخفضة (للتسجيل المليء بالضجيج)</option></select></label><span class="muted" style="font-size:12px">تغييرها يعيد التقطيع ويُلغي تعديلاتك</span></div>
          <div class="muted" style="font-size:12px;margin-top:6px">الحدود تُؤخذ من أطول الوقفات. إن قُطعت آية في المنتصف فانقل حدّها إلى «الفجوة السابقة/التالية»، وإن تأخر الصمت فحرّك الحدّ بـ٠٫٢ ثانية.</div></div>
        ${rows}
        <div class="lv-ctl" style="gap:8px"><button class="btn primary" id="lrSave" ${n ? '' : 'disabled'}>✔ اعتماد ${AD(n)} آية</button><button class="btn" id="lrStop">⏹ إيقاف الصوت</button></div>`;
      bind();
    };
    const moveGap = (k, dir) => {
      const cur = S.cuts[k], lo = k === 0 ? -1 : S.cuts[k - 1].ge, hi = k + 1 < S.cuts.length ? S.cuts[k + 1].gs : 1e9;
      const cand = S.A.gaps.filter(g => g.gs >= lo && g.ge <= hi + 1e-6 && (dir < 0 ? g.ge < cur.gs - 1e-6 : g.gs > cur.ge + 1e-6));
      if (!cand.length) return APP.toast('لا توجد فجوة أخرى في هذا الاتجاه');
      S.cuts[k] = dir < 0 ? cand[cand.length - 1] : cand[0]; render();
    };
    const nudge = (k, d) => {
      const c = S.cuts[k], mid = (c.gs + c.ge) / 2 + d, lo = k === 0 ? S.A.first : S.cuts[k - 1].ge, hi = k + 1 < S.cuts.length ? S.cuts[k + 1].gs : S.A.last;
      const t = Math.min(hi - 0.3, Math.max(lo + 0.3, mid)); S.cuts[k] = { gs: t, ge: t, len: 0 }; render();
    };
    function bind() {
      el.querySelector('#lrBack').onclick = e => { e.preventDefault(); stopP(); done(); };
      el.querySelector('#lrStop').onclick = stopP;
      el.querySelector('#lrSens').onchange = e => { S.sens = e.target.value; S.skip.clear(); const A = analyze(pcm, sr, SENS[S.sens]), c = pickCuts(A, units.length); S.A = A; S.cuts = c.cuts; S.runnerUp = c.runnerUp; S.missing = c.missing; render(); };
      el.querySelectorAll('.lvs-row').forEach(row => {
        const k = +row.dataset.k, q = a => row.querySelector(`[data-a=${a}]`);
        if (q('play')) q('play').onclick = () => playR(startOf(k), endOf(k));
        if (q('edge')) q('edge').onclick = () => { const t = (S.cuts[k].gs + S.cuts[k].ge) / 2; playR(t - 1.6, t + 1.6); };
        if (q('skip')) q('skip').onchange = e => { e.target.checked ? S.skip.delete(k) : S.skip.add(k); const b = el.querySelector('#lrSave'), n = units.filter((u, j) => u.kind === 'ayah' && matched(j) && !S.skip.has(j)).length; b.disabled = !n; b.textContent = '✔ اعتماد ' + AD(n) + ' آية'; };
        if (q('gprev')) q('gprev').onclick = () => moveGap(k, -1);
        if (q('gnext')) q('gnext').onclick = () => moveGap(k, 1);
        if (q('nm')) q('nm').onclick = () => nudge(k, -0.2);
        if (q('np')) q('np').onclick = () => nudge(k, 0.2);
      });
      el.querySelector('#lrSave').onclick = () => save();
    }
    async function save() {
      stopP();
      const todo = units.map((u, k) => ({ u, k })).filter(x => x.u.kind === 'ayah' && matched(x.k) && !S.skip.has(x.k));
      const pend = todo.filter(x => S.have.has(x.u.id)).length;
      if (pend && !confirm('سيُستبدل التسجيل السابق لـ' + AD(pend) + ' آية. متابعة؟')) return;
      el.innerHTML = `<div class="card" style="text-align:center"><h3>جارٍ حفظ الآيات…</h3><p id="lsP" class="muted">٠ / ${AD(todo.length)}</p><div class="lr-progress"><i id="lsBar" style="width:0%"></i></div></div>`;
      let n = 0, wav = 0, secs = 0;
      try {
        for (const { u, k } of todo) {
          const a = Math.floor(startOf(k) * sr), b = Math.ceil(endOf(k) * sr), part = pcm.subarray(a, b);
          const { blob, wav: isW } = await encode(part, sr); if (isW) wav++;
          const sec = Math.round(part.length / sr), isNew = !S.have.has(u.id);
          await I().VS.put({ id: u.id, bookId: S.bookId, blob, type: blob.type, sec, at: Date.now(), src: 'مقطّع من ' + S.file.name });
          S.have.add(u.id); secs += sec; n++;
          if (isNew) await DB.setting('libvoiceSince', ((await DB.setting('libvoiceSince')) || 0) + 1);
          const p = el.querySelector('#lsP'); if (p) { p.textContent = AD(n) + ' / ' + AD(todo.length); el.querySelector('#lsBar').style.width = Math.round(n / todo.length * 100) + '%'; }
        }
        await I().addSeconds(secs);
        APP.toast('✔ حُفظ ' + AD(n) + ' آية' + (wav ? ' (بصيغة WAV أكبر حجماً لأن الجهاز لا يدعم الضغط)' : ''), 7000);
      } catch (e) { APP.toast('تعذّر الحفظ بعد ' + AD(n) + ' آية: ' + (e.message || e), 9000); }
      done();
    }
    render();
  }

  window.LVSPLIT = { open, _t: { analyze, pickCuts, encode, muxOgg, decode } };
})();
