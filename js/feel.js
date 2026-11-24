// ✨ لمسات الرفاهية: اهتزاز خفيف عند اللمس، وحركات ناعمة (قابلة للإيقاف من الإعدادات)
(() => {
  const on = k => { try { return localStorage.getItem(k) !== '0'; } catch (e) { return true; } };
  if (!on('motion')) document.body.classList.add('no-motion');
  const H = () => window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics;
  const tap = (style = 'LIGHT') => { if (!on('haptics')) return; const h = H(); if (h) { h.impact({ style }).catch(() => { }); } };
  const SEL = '.btn, .tile, .tk-chk, .sidebar a, .bottom-nav a, .tabbar a, .sp-main, .sp-card, .fam-learn a, .lr-tile, .lr-btn, .lr-opt, .chip, summary, .dk-count';
  document.addEventListener('pointerdown', e => { const t = e.target.closest && e.target.closest(SEL); if (t) tap(t.classList.contains('tk-chk') || t.classList.contains('dk-count') ? 'MEDIUM' : 'LIGHT'); }, { passive: true });
  // 🎉 احتفال خفيف عند الإنجاز (قصاصات ذهبية وخضراء ورسالة)
  const celebrate = (msg = 'أحسنت! بارك الله فيك') => {
    if (document.body.classList.contains('no-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches) { if (window.APP) APP.toast(msg); return; }
    const w = document.createElement('div'); w.className = 'cele';
    const cs = ['#d9b86a', '#b8913f', '#0f5540', '#2fa77a', '#f3dc9b', '#ffffff'];
    w.innerHTML = Array.from({ length: 46 }, () => `<i style="left:${Math.random() * 100}%;background:${cs[Math.random() * cs.length | 0]};--x:${(Math.random() - .5) * 160}px;--r:${(Math.random() * 900 - 450) | 0}deg;--d:${(Math.random() * .5).toFixed(2)}s;--t:${(1.4 + Math.random() * 1.2).toFixed(2)}s"></i>`).join('') + `<b>${msg}</b>`;
    document.body.appendChild(w); setTimeout(() => w.remove(), 3200);
    const h = H(); if (h && on('haptics')) h.notification({ type: 'SUCCESS' }).catch(() => { });
  };
  window.CELEBRATE = celebrate;
  window.FEEL = { tap, celebrate, success: () => { const h = H(); if (h && on('haptics')) h.notification({ type: 'SUCCESS' }).catch(() => { }); } };
})();

// ↩️ في الويب (زر رجوع المتصفح أو السحب): الرجوع من رئيسية أي قسم يذهب إلى شاشة البداية
(() => {
  if (window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) return;
  const HOMES = ['', 'all', 'parents', 'rafiq', 'rafiqa', 'usra', 'ilm', 'lugha', 'tarikh', 'dawah', 'wajib', 'taqaddum', 'literacy', 'kids', 'usul', 'bayt', 'tarbiya'];
  // نعرف الرجوع بمقارنة الصفحة الجديدة بالتي قبل الحالية في سجلّنا
  const st = [location.hash];
  window.addEventListener('hashchange', () => {
    const cur = location.hash;
    if (st.length > 1 && cur === st[st.length - 2]) {
      const pp = (st[st.length - 1].slice(1) || '/').split('?')[0].split('/').filter(Boolean); st.pop();
      if (pp.length <= 1 && HOMES.includes(pp[0] || '') && !/^#\/start/.test(cur)) { st[st.length - 1] = '#/start'; location.replace('#/start'); }
      return;
    }
    if (st[st.length - 1] === cur) return;
    st.push(cur); if (st.length > 200) st.shift();
  });
})();
