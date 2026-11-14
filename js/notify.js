/* 🔔 التنبيهات: جدولة الأذان والأذكار والصيام والزكاة
   - تطبيق أندرويد: تنبيهات حقيقية من النظام تعمل والتطبيق مغلق (LocalNotifications) مع صوت الأذان.
   - الويب: تنبيهات المتصفح وصوت الأذان ما دامت الصفحة مفتوحة فقط (حدود المتصفحات). */
(() => {
  const C = window.Capacitor, native = !!(C && C.isNativePlatform && C.isNativePlatform());
  const LN = native && C.Plugins && C.Plugins.LocalNotifications;
  // الأذان الكامل في أندرويد: منبّه من النظام يشغّل الأذان على صوت المنبّه مع زر إيقاف (AdhanPlugin)
  const AD = native && C.Plugins && C.Plugins.Adhan;
  const isAdhan = n => n.channel === 'adhan' || n.channel === 'adhan_fajr';
  // نطاقات المعرّفات لكل نوع، حتى تُعاد جدولة كل نوع دون المساس بغيره
  const RANGE = { prayer: [1000, 1999], adhkar: [2000, 2499], fasting: [3000, 3499], zakat: [4000, 4499], khatma: [4500, 4599], learn: [4600, 4699] };
  const CHANNELS = [
    { id: 'adhan', name: 'الأذان', description: 'تنبيه بالأذان عند دخول وقت الصلاة', importance: 5, sound: 'adhan.mp3', visibility: 1, vibration: true },
    { id: 'adhan_fajr', name: 'أذان الفجر', description: 'أذان الفجر', importance: 5, sound: 'adhan_fajr.mp3', visibility: 1, vibration: true },
    { id: 'reminders', name: 'تذكيرات', description: 'الأذكار والصيام والزكاة وما قبل الصلاة', importance: 4, visibility: 1, vibration: true },
  ];
  let ready = null;
  async function setup() {
    if (ready) return ready;
    ready = (async () => {
      if (!LN) return;
      try { for (const ch of CHANNELS) await LN.createChannel(ch); } catch (e) { }
      LN.addListener('localNotificationActionPerformed', a => { const r = a.notification && a.notification.extra && a.notification.extra.route; if (r) location.hash = r; });
    })();
    return ready;
  }

  async function status() {
    if (LN) {
      const p = await LN.checkPermissions().catch(() => ({}));
      let exact = 'granted'; try { if (LN.checkExactNotificationSetting) exact = (await LN.checkExactNotificationSetting()).exact_alarm || 'granted'; } catch (e) { }
      return { kind: 'native', perm: p.display || 'prompt', exact };
    }
    if ('Notification' in window) return { kind: 'web', perm: Notification.permission === 'default' ? 'prompt' : Notification.permission };
    return { kind: 'none', perm: 'denied' };
  }
  // طلب الصلاحيات اللازمة (التنبيهات + المنبهات الدقيقة في أندرويد 12+)
  async function request() {
    await setup();
    if (LN) {
      const p = await LN.requestPermissions().catch(() => ({}));
      try {
        if (LN.checkExactNotificationSetting) {
          const ex = await LN.checkExactNotificationSetting();
          if (ex.exact_alarm && ex.exact_alarm !== 'granted') {
            if (await APP.ask('لكي يُرفع الأذان في وقته بالدقيقة، يحتاج التطبيق صلاحية «المنبهات والتذكيرات». ستُفتح لك الإعدادات: فعّلها ثم ارجع للتطبيق.')) await LN.changeExactNotificationSetting();
          }
        }
      } catch (e) { }
      return p.display === 'granted';
    }
    if ('Notification' in window) return (await Notification.requestPermission()) === 'granted';
    return false;
  }

  // ===== الويب: مؤقتات داخل الصفحة =====
  const webTimers = {};
  const adhanAudio = new Audio(); adhanAudio.preload = 'none';
  // أصوات الأذان المرفقة (ولأذان الفجر «الصلاة خير من النوم» فلا يُستعمل لغيره)، ويمكن إضافة ملف من الجهاز
  const VOICES = { afasy: { n: 'مشاري العفاسي', f: 'audio/adhan.mp3' }, makkah: { n: 'أذان المسجد الحرام', f: 'audio/adhan_makkah.mp3' }, shayba: { n: 'مالك شيبة الحمد (أذان الفجر)', f: 'audio/adhan_fajr.mp3', fajr: true }, custom: { n: '📁 ملف من جهازك' } };
  const getVoice = () => { try { return Object.assign({ reg: 'afasy', fajr: 'shayba' }, JSON.parse(localStorage.getItem('adhan-voice') || '{}')); } catch (e) { return { reg: 'afasy', fajr: 'shayba' }; } };
  async function setVoice(fajr, v) { const c = getVoice(); c[fajr ? 'fajr' : 'reg'] = v; localStorage.setItem('adhan-voice', JSON.stringify(c)); if (AD && AD.setVoice) await AD.setVoice({ fajr: !!fajr, voice: v }).catch(() => { }); }
  async function setCustom(fajr, file) {
    if (AD && AD.setCustom) { const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(file); }); await AD.setCustom({ fajr: !!fajr, data: b64 }); }
    await DB.setting(fajr ? 'adhan-custom-fajr' : 'adhan-custom', file);
    await setVoice(fajr, 'custom');
  }
  let customUrl = null;
  async function srcFor(fajr, voice) {
    const v = voice || getVoice()[fajr ? 'fajr' : 'reg'];
    if (v === 'custom') { const f = await DB.setting(fajr ? 'adhan-custom-fajr' : 'adhan-custom'); if (f) { if (customUrl) URL.revokeObjectURL(customUrl); return (customUrl = URL.createObjectURL(f)); } }
    return (VOICES[v] && VOICES[v].f) || (fajr ? 'audio/adhan_fajr.mp3' : 'audio/adhan.mp3');
  }
  async function playAdhan(fajr, voice) {
    if (AD) { AD.test(Object.assign({ fajr: !!fajr }, voice ? { voice } : {})).catch(() => { }); return; }
    if (window.MEDIA) MEDIA.claim('adhan');
    try { adhanAudio.src = await srcFor(fajr, voice); adhanAudio.play().catch(() => { }); } catch (e) { }
  }
  function stopAdhan() { if (AD) { AD.stop().catch(() => { }); return; } try { adhanAudio.pause(); adhanAudio.currentTime = 0; } catch (e) { } }
  function webShow(n) {
    if (n.channel === 'adhan' || n.channel === 'adhan_fajr') playAdhan(n.channel === 'adhan_fajr');
    if ('Notification' in window && Notification.permission === 'granted') {
      try { const x = new Notification(n.title, { body: n.body, icon: 'icons/icon-192.png', tag: 'mk-' + n.id, lang: 'ar', dir: 'rtl' }); x.onclick = () => { window.focus(); if (n.route) location.hash = n.route; stopAdhan(); }; } catch (e) { }
    }
    if (window.APP) APP.toast('🔔 ' + n.title + (n.body ? ' — ' + n.body : ''), 8000);
  }

  /** schedule(kind, list): يستبدل كل تنبيهات النوع بالقائمة الجديدة
      عنصر القائمة: { title, body, at: Date, channel: 'adhan'|'adhan_fajr'|'reminders', route } */
  async function schedule(kind, list) {
    const [lo, hi] = RANGE[kind];
    const now = Date.now();
    list = list.filter(n => n.at && n.at.getTime() > now + 5000).sort((a, b) => a.at - b.at).slice(0, hi - lo);
    if (LN) {
      await setup();
      let adCount = 0;
      if (AD && kind === 'prayer') {
        const ad = list.filter(isAdhan); adCount = ad.length;
        try { await AD.schedule({ items: ad.map((n, i) => ({ id: i, at: n.at.getTime(), title: n.title, body: n.body || '', fajr: n.channel === 'adhan_fajr' })) }); list = list.filter(n => !isAdhan(n)); }
        catch (e) { console.warn('adhan', e); }
      }
      try {
        const pend = await LN.getPending();
        const mine = (pend.notifications || []).filter(n => n.id >= lo && n.id <= hi).map(n => ({ id: n.id }));
        if (mine.length) await LN.cancel({ notifications: mine });
        if (list.length) await LN.schedule({ notifications: list.map((n, i) => ({
          id: lo + i, title: n.title, body: n.body || '', channelId: n.channel || 'reminders',
          schedule: { at: n.at, allowWhileIdle: true }, smallIcon: 'ic_stat_notify', iconColor: '#0d5c3f',
          sound: n.channel === 'adhan' ? 'adhan.mp3' : n.channel === 'adhan_fajr' ? 'adhan_fajr.mp3' : undefined,
          extra: { route: n.route || '' },
        })) });
      } catch (e) { console.warn('schedule', e); }
      return list.length + adCount;
    }
    // الويب: ما كان خلال 36 ساعة القادمة فقط (الصفحة لا تبقى مفتوحة أكثر عادة)
    (webTimers[kind] || []).forEach(clearTimeout);
    webTimers[kind] = list.filter(n => n.at - now < 36 * 3600e3).map(n => setTimeout(() => webShow(n), n.at - now));
    return list.length;
  }

  // إعادة جدولة الكل (عند فتح التطبيق، وعند تغيير أي إعداد، ومرة كل 6 ساعات والتطبيق مفتوح)
  const SOURCES = {};
  const register = (kind, fn) => { SOURCES[kind] = fn; };
  async function rescheduleAll() {
    for (const [k, fn] of Object.entries(SOURCES)) { try { await schedule(k, (await fn()) || []); } catch (e) { console.warn('reschedule', k, e); } }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) rescheduleAll(); });
  setInterval(rescheduleAll, 6 * 3600e3);

  if (window.MEDIA) MEDIA.register('adhan', () => { if (!adhanAudio.paused) stopAdhan(); });
  window.NOTIFY = { VOICES, getVoice, setVoice, setCustom, native: !!LN, status, request, schedule, register, rescheduleAll, playAdhan, stopAdhan };
})();
