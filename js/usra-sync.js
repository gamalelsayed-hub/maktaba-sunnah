/* 🔗 ربط جوالات الأسرة (اختياري): مزامنة «أسرتي» وقائمة التسوق ومهام البيت عبر Firebase
   - بلا ربط: يعمل التطبيق كما هو على الجهاز فقط ولا يتصل بأي خادم.
   - الدخول مجهول (بلا إيميل ولا رقم)، والانضمام برمز الأسرة + كلمة سر (للأفراد) أو كلمة سر الوالدين.
   - كل مستند يُحفظ كسجلات {مفتاح: {v, t}} وتُدمج بأحدث تعديل لكل مفتاح، فلا يمسح جهازٌ تعديلَ آخر.
   - الصلاحيات تفرضها قواعد Firestore (انظر scripts/firestore.rules). */
(function () {
  const CFG = { apiKey: 'AIzaSyBjuTpiiS3xhF2yYyoM8WP3MVI2l4s7zzQ', projectId: 'zad-usra', db: '(default)' };
  const ROOT = `projects/${CFG.projectId}/databases/${CFG.db}/documents`;
  const FS = 'https://firestore.googleapis.com/v1/' + ROOT;
  const LS = { auth: 'fb-token-usra', link: 'usra-link' };
  const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
  const now = () => Date.now();
  const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const rid = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x => ALPH[x % ALPH.length]).join(''); };
  async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  const pwHash = (fid, p) => sha('zad:' + fid + ':' + String(p).trim());

  // ===== الدخول المجهول =====
  async function token() {
    let a = ls(LS.auth);
    if (a && a.exp > now() + 60e3) return a;
    if (a && a.refresh) {
      const r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + CFG.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.refresh) });
      if (r.ok) { const j = await r.json(); a = { uid: j.user_id, id: j.id_token, refresh: j.refresh_token, exp: now() + (+j.expires_in || 3600) * 1000 }; ls(LS.auth, a); return a; }
    }
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + CFG.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
    if (!r.ok) throw new Error('auth ' + r.status);
    const j = await r.json(); a = { uid: j.localId, id: j.idToken, refresh: j.refreshToken, exp: now() + (+j.expiresIn || 3600) * 1000 }; ls(LS.auth, a); return a;
  }
  async function api(method, path, body, qs) {
    const a = await token();
    const url = (path.startsWith('http') ? path : FS + (path ? '/' + path : '')) + (qs ? '?' + qs : '');
    const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + a.id, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 404 && method === 'GET') return null;
    const t = await r.text(); const j = t ? JSON.parse(t) : {};
    if (!r.ok) { const e = new Error((j.error && j.error.status) || ('HTTP ' + r.status)); e.status = r.status; e.code = j.error && j.error.status; throw e; }
    return j;
  }
  // تحويل القيم من وإلى صيغة Firestore (للحقول البسيطة فقط)
  const enc = v => v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)])) } };
  const dec = f => f == null ? null : 'stringValue' in f ? f.stringValue : 'integerValue' in f ? +f.integerValue : 'doubleValue' in f ? f.doubleValue : 'booleanValue' in f ? f.booleanValue : 'nullValue' in f ? null : 'mapValue' in f ? Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, dec(x)])) : 'arrayValue' in f ? (f.arrayValue.values || []).map(dec) : null;
  const fields = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));
  const unf = d => d && d.fields ? Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, dec(v)])) : {};

  // ===== السجلات والدمج =====
  const merge = (a, b) => { const o = Object.assign({}, a || {}); for (const [k, r] of Object.entries(b || {})) if (!o[k] || (r.t || 0) > (o[k].t || 0)) o[k] = r; const old = now() - 90 * 864e5; for (const k of Object.keys(o)) if (o[k].d && o[k].t < old) delete o[k]; return o; };
  const plain = recs => { const o = {}; for (const [k, r] of Object.entries(recs || {})) if (!r.d) o[k] = r.v; return o; };

  const link = () => ls(LS.link);
  const linked = () => !!(link() && link().fid);
  const role = () => (link() || {}).role || null;
  const myMid = () => (link() || {}).mid || null;

  // مستندات الأسرة كسجلات مسطحة من البيانات المحلية
  async function localDocs() {
    const u = await USRA.get(), b = Object.assign({ extra: [], bought: {}, chores: [], choreDone: {} }, (await DB.setting('bayt')) || {});
    const D = {}; const st = D['data/state'] = {};
    for (const m of u.members) st['m:' + m.id] = { id: m.id, name: m.name, role: m.role, birth: m.birth || '', grade: m.grade || '', custom: m.custom || [], stars: m.stars || 0 };
    for (const r of u.rewards) st['rw:' + r.id] = r;
    for (const r of (u.rahim || [])) st['rh:' + r.id] = r;
    st.majlis = u.majlis; st.country = u.country;
    for (const m of u.members) {
      const dd = D['done/' + m.id] = {};
      for (const [day, per] of Object.entries(u.done || {})) if (per[m.id] && Object.keys(per[m.id]).length) dd['d:' + day] = per[m.id];
      for (const [id, p] of Object.entries(m.pending || {})) dd['p:' + id] = p;
      if ((m.log || []).length) dd.log = m.log;
      if (m.health || m.meds || m.vacc || m.taken) {
        const h = D['health/' + m.id] = {};
        if (m.health) h.h = m.health; h.meds = m.meds || []; if (m.vacc) h.vacc = m.vacc;
        for (const [day, x] of Object.entries(m.taken || {})) h['tk:' + day] = x;
      }
    }
    const sh = D['data/shop'] = {};
    for (const x of b.extra) sh['x:' + x.id] = x;
    for (const [k, v] of Object.entries(b.bought || {})) if (v) sh['b:' + k] = 1;
    for (const c of b.chores) sh['c:' + c.id] = c;
    for (const [day, x] of Object.entries(b.choreDone || {})) if (Object.keys(x || {}).length) sh['cd:' + day] = x;
    return D;
  }
  // إعادة بناء البيانات المحلية من المستندات المدموجة
  let applying = false;
  async function applyDocs(S) {
    applying = true;
    try {
      const u = await USRA.get(), b = Object.assign({ extra: [], bought: {}, chores: [], choreDone: {} }, (await DB.setting('bayt')) || {});
      const st = plain(S['data/state']);
      if (S['data/state']) {
        const old = Object.fromEntries(u.members.map(m => [m.id, m]));
        u.members = Object.entries(st).filter(([k]) => k.startsWith('m:')).map(([, v]) => Object.assign({}, old[v.id] || {}, v));
        u.rewards = Object.entries(st).filter(([k]) => k.startsWith('rw:')).map(([, v]) => v);
        u.rahim = Object.entries(st).filter(([k]) => k.startsWith('rh:')).map(([, v]) => v);
        if (st.majlis) u.majlis = st.majlis; if (st.country) u.country = st.country;
      }
      for (const m of u.members) {
        const dk = 'done/' + m.id, hk = 'health/' + m.id;
        if (S[dk]) {
          const d = plain(S[dk]);
          for (const day of Object.keys(u.done || {})) if (u.done[day][m.id]) delete u.done[day][m.id];
          for (const [k, v] of Object.entries(d)) if (k.startsWith('d:')) { const day = k.slice(2); (u.done[day] = u.done[day] || {})[m.id] = v; }
          m.pending = Object.fromEntries(Object.entries(d).filter(([k]) => k.startsWith('p:')).map(([k, v]) => [k.slice(2), v]));
          m.log = d.log || [];
        }
        if (S[hk]) {
          const h = plain(S[hk]); m.health = h.h || m.health; m.meds = h.meds || []; m.vacc = h.vacc || {};
          m.taken = Object.fromEntries(Object.entries(h).filter(([k]) => k.startsWith('tk:')).map(([k, v]) => [k.slice(3), v]));
        }
      }
      if (S['data/shop']) {
        const s = plain(S['data/shop']);
        b.extra = Object.entries(s).filter(([k]) => k.startsWith('x:')).map(([, v]) => v);
        b.bought = Object.fromEntries(Object.keys(s).filter(k => k.startsWith('b:')).map(k => [k.slice(2), 1]));
        b.chores = Object.entries(s).filter(([k]) => k.startsWith('c:')).map(([, v]) => v);
        b.choreDone = Object.fromEntries(Object.entries(s).filter(([k]) => k.startsWith('cd:')).map(([k, v]) => [k.slice(3), v]));
      }
      await DB.setting('usra', u); await DB.setting('bayt', b);
    } finally { applying = false; }
  }

  // ===== الحالة المحلية للمزامنة (الظلّ) =====
  const SH = 'usra-sync-shadow';
  async function shadow() { return (await DB.setting(SH)) || { docs: {}, rev: {} }; }
  // يحسب السجلات التي تغيّرت محلياً منذ آخر مزامنة ويختم وقتها
  async function stamp() {
    const s = await shadow(), L = await localDocs(), t = now(); const dirty = new Set(s.dirty || []);
    const keys = new Set([...Object.keys(L), ...Object.keys(s.docs)]);
    for (const d of keys) {
      if (!canWrite(d)) continue;
      const cur = L[d] || {}, sd = s.docs[d] = s.docs[d] || {};
      for (const [k, v] of Object.entries(cur)) { const j = JSON.stringify(v); if (!sd[k] || sd[k].d || JSON.stringify(sd[k].v) !== j) { sd[k] = { v, t }; dirty.add(d); } }
      for (const k of Object.keys(sd)) if (!(k in cur) && !sd[k].d) { sd[k] = { d: 1, t }; dirty.add(d); }
    }
    s.dirty = [...dirty]; await DB.setting(SH, s); return s;
  }
  function canWrite(d) {
    const r = role(); if (r === 'parent') return true;
    if (d === 'data/shop') return true;
    const mid = myMid(); if (!mid) return false;
    if (d === 'done/' + mid) return true;
    if (d === 'health/' + mid) { const u = window.__usraPrivHealth; return !(u && u[mid]); }
    return false;
  }

  // ===== الدفع والسحب =====
  let busy = false, lastSync = 0, lastErr = '';
  async function push() {
    const L = link(); if (!L) return;
    const s = await stamp(); const left = [];
    for (const d of s.dirty || []) {
      if (!canWrite(d)) continue;
      let ok = false;
      for (let tries = 0; tries < 4 && !ok; tries++) {
        const path = `families/${L.fid}/${d}`, rem = await api('GET', path).catch(e => { if (e.status === 403) throw e; return null; });
        const remote = rem && rem.fields && rem.fields.j ? JSON.parse(dec(rem.fields.j) || '{}') : {};
        const m = merge(remote, s.docs[d]);
        try {
          await api('PATCH', path, { fields: { j: enc(JSON.stringify(m)) } }, rem ? 'currentDocument.updateTime=' + encodeURIComponent(rem.updateTime) : 'currentDocument.exists=false');
          s.docs[d] = m; ok = true;
          const rv = now(); await api('PATCH', `families/${L.fid}`, { fields: { rev: { mapValue: { fields: { [rk(d)]: enc(rv) } } } } }, 'updateMask.fieldPaths=' + encodeURIComponent('rev.' + rk(d)));
          s.rev[rk(d)] = rv;
        } catch (e) { if (e.code !== 'FAILED_PRECONDITION' && e.code !== 'ALREADY_EXISTS') throw e; }
      }
      if (!ok) left.push(d);
    }
    s.dirty = left; await DB.setting(SH, s);
    if (Object.keys(s.docs).length) await applyDocs(s.docs);
  }
  const rk = d => d.replace('/', '_');
  async function pull() {
    const L = link(); if (!L) return false;
    const meta = await api('GET', `families/${L.fid}`);
    if (!meta) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
    const rev = unf(meta).rev || {}, s = await shadow(); let changed = false;
    const fetchDoc = async d => { const x = await api('GET', `families/${L.fid}/${d}`).catch(e => e.status === 403 ? null : Promise.reject(e)); if (!x || !x.fields) return; const r = JSON.parse(dec(x.fields.j) || '{}'); s.docs[d] = merge(s.docs[d] || {}, r); changed = true; };
    for (const [k, v] of Object.entries(rev)) {
      if ((s.rev[k] || 0) >= v) continue;
      const d = k.replace('_', '/');
      if (d.startsWith('health/') && role() !== 'parent' && d !== 'health/' + myMid()) { s.rev[k] = v; continue; }
      await fetchDoc(d); s.rev[k] = v;
    }
    await DB.setting(SH, s);
    if (changed) await applyDocs(s.docs);
    return changed;
  }
  async function sync(manual) {
    if (!linked() || busy || !navigator.onLine) return;
    busy = true;
    try {
      const ch = await pull(); await push(); lastSync = now(); lastErr = '';
      if (ch && /^#\/(usra|bayt)/.test(location.hash) && !document.querySelector('input:focus,textarea:focus,#modal:not(.hidden)')) APP.rerender();
      if (ch && window.NOTIFY) NOTIFY.rescheduleAll();
      if (manual) APP.toast('تمت المزامنة ✓');
    } catch (e) {
      lastErr = e.status === 403 ? 'هذا الجوال لم يعد مرتبطاً بالأسرة' : e.status === 404 ? 'الأسرة غير موجودة على الخادم' : 'تعذرت المزامنة (تحقق من الإنترنت)';
      if (e.status === 403 || e.status === 404) { ls(LS.link, null); await DB.setting(SH, null); }
      if (manual) APP.toast(lastErr);
    } finally { busy = false; }
  }
  let tmr = null;
  function changed() { if (applying || !linked()) return; clearTimeout(tmr); tmr = setTimeout(() => sync(), 2500); }
  setInterval(() => { if (!document.hidden && /^#\/(usra|bayt)/.test(location.hash)) sync(); }, 90e3);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  window.addEventListener('hashchange', () => { if (/^#\/(usra|bayt)/.test(location.hash) && now() - lastSync > 30e3) sync(); });
  window.addEventListener('online', () => sync());
  window.addEventListener('load', () => setTimeout(() => sync(), 3000));

  // ===== إنشاء الأسرة والانضمام والمغادرة =====
  const full = p => `${ROOT}/${p}`;
  const code = fid => 'ZAD-' + fid.slice(0, 4) + '-' + fid.slice(4);
  const parseCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^ZAD/, '');
  async function create(name, pwMembers, pwParents, myMember) {
    const a = await token(), fid = rid(8);
    await api('POST', FS + ':commit', {
      writes: [
        { update: { name: full('families/' + fid), fields: fields({ creator: a.uid, name, created: now(), rev: {} }) }, currentDocument: { exists: false } },
        { update: { name: full(`families/${fid}/secret/keys`), fields: fields({ pw: await pwHash(fid, pwMembers), pp: await pwHash(fid, pwParents) }) }, currentDocument: { exists: false } },
        { update: { name: full(`families/${fid}/joins/${a.uid}`), fields: fields({ role: 'parent', p: '', mid: myMember || '', name: deviceName(), t: now() }) }, currentDocument: { exists: false } },
      ],
    });
    ls(LS.link, { fid, role: 'parent', mid: myMember || '', name });
    await DB.setting(SH, { docs: {}, rev: {} });
    await sync(); return code(fid);
  }
  async function join(c, pw, asParent) {
    const a = await token(), fid = parseCode(c);
    if (fid.length !== 8) throw new Error('الرمز غير صحيح');
    try { await api('PATCH', `families/${fid}/joins/${a.uid}`, { fields: fields({ role: asParent ? 'parent' : 'member', p: await pwHash(fid, pw), mid: '', name: deviceName(), t: now() }) }, 'currentDocument.exists=false'); }
    catch (e) { if (e.code === 'ALREADY_EXISTS' || e.code === 'FAILED_PRECONDITION') { /* مرتبط سابقاً */ } else if (e.status === 403 || e.status === 404) throw new Error('رمز الأسرة أو كلمة السر غير صحيحة'); else throw e; }
    ls(LS.link, { fid, role: asParent ? 'parent' : 'member', mid: '' });
    // يبدأ الجوال المنضم من بيانات الأسرة
    const u = await USRA.get(); u.members = []; u.done = {}; u.rewards = []; u.rahim = []; await DB.setting('usra', u);
    await DB.setting(SH, { docs: {}, rev: {} });
    await sync(); return fid;
  }
  async function setMe(mid) {
    const L = link(), a = await token();
    await api('PATCH', `families/${L.fid}/joins/${a.uid}`, { fields: fields({ mid, name: deviceName(), t: now() }) }, 'updateMask.fieldPaths=mid&updateMask.fieldPaths=name&updateMask.fieldPaths=t');
    L.mid = mid; ls(LS.link, L); await DB.setting(SH, Object.assign(await shadow(), { rev: {} })); await sync();
  }
  async function devices() { const L = link(); const r = await api('GET', `families/${L.fid}/joins`); return (r.documents || []).map(d => Object.assign({ uid: d.name.split('/').pop() }, unf(d))); }
  async function kick(uid) { const L = link(); await api('DELETE', `families/${L.fid}/joins/${uid}`); }
  async function setRole(uid, r) { const L = link(); await api('PATCH', `families/${L.fid}/joins/${uid}`, { fields: fields({ role: r }) }, 'updateMask.fieldPaths=role'); }
  async function leave() {
    const L = link(); if (!L) return;
    try { const a = await token(); await api('DELETE', `families/${L.fid}/joins/${a.uid}`); } catch (e) { }
    await forget();
  }
  async function forget() {
    try { const a = ls(LS.auth); if (a) { const t = await token(); await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key=' + CFG.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: t.id }) }); } } catch (e) { }
    ls(LS.link, null); ls(LS.auth, null); await DB.setting(SH, null);
  }
  async function destroy() {
    const L = link(); if (!L || role() !== 'parent') return;
    const a = await token(), base = `families/${L.fid}`;
    const del = p => api('DELETE', p).catch(() => { });
    for (const col of ['done', 'health']) { const r = await api('GET', `${base}/${col}`).catch(() => ({})); for (const d of (r.documents || [])) await del(d.name.replace(ROOT + '/', '')); }
    await del(`${base}/data/state`); await del(`${base}/data/shop`); await del(`${base}/secret/keys`);
    const js = await devices().catch(() => []); for (const j of js) if (j.uid !== a.uid) await del(`${base}/joins/${j.uid}`);
    await del(base); await del(`${base}/joins/${a.uid}`);
    await forget();
  }
  function deviceName() { const u = navigator.userAgent; const m = u.match(/\(([^;)]+);[^;)]*;?\s*([^;)]*)\)/); return ((/Android/.test(u) ? '📱 ' : /iPhone|iPad/.test(u) ? '🍎 ' : '💻 ') + ((m && (m[2] || m[1])) || 'جهاز')).slice(0, 40); }

  window.USYNC = { linked, role, myMid, link, changed, sync, create, join, setMe, devices, kick, setRole, leave, destroy, code: () => linked() ? code(link().fid) : '', status: () => ({ lastSync, lastErr, busy }), canWrite };
})();
