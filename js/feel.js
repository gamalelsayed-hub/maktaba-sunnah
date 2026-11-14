// ✨ لمسات الرفاهية: اهتزاز خفيف عند اللمس، وحركات ناعمة (قابلة للإيقاف من الإعدادات)
(() => {
  const on = k => { try { return localStorage.getItem(k) !== '0'; } catch (e) { return true; } };
  if (!on('motion')) document.body.classList.add('no-motion');
  const H = () => window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics;
  const tap = (style = 'LIGHT') => { if (!on('haptics')) return; const h = H(); if (h) { h.impact({ style }).catch(() => { }); } };
  const SEL = '.btn, .tile, .tk-chk, .sidebar a, .bottom-nav a, .tabbar a, .sp-main, .sp-card, .fam-learn a, .lr-tile, .lr-btn, .lr-opt, .chip, summary, .dk-count';
  document.addEventListener('pointerdown', e => { const t = e.target.closest && e.target.closest(SEL); if (t) tap(t.classList.contains('tk-chk') || t.classList.contains('dk-count') ? 'MEDIUM' : 'LIGHT'); }, { passive: true });
  window.FEEL = { tap, success: () => { const h = H(); if (h && on('haptics')) h.notification({ type: 'SUCCESS' }).catch(() => { }); } };
})();
