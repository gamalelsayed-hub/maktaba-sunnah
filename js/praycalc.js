/* حساب مواقيت الصلاة فلكياً (بدون إنترنت) — المعادلات المعتمدة في حساب موضع الشمس:
   الميل الشمسي ومعادلة الزمن، ثم وقت كل صلاة بزاوية انخفاض الشمس أو طول الظل.
   الطرق: أم القرى، الهيئة المصرية، رابطة العالم الإسلامي، أمريكا الشمالية، كراتشي، دبي، الكويت، قطر. */
(() => {
  const D = Math.PI / 180, sin = x => Math.sin(x * D), cos = x => Math.cos(x * D), tan = x => Math.tan(x * D);
  const asin = x => Math.asin(x) / D, acos = x => Math.acos(x) / D, atan2 = (y, x) => Math.atan2(y, x) / D, acot = x => Math.atan(1 / x) / D;
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

  const METHODS = {
    umm:   { n: 'أم القرى (السعودية)', fajr: 18.5, ishaMin: 90, ramadanIshaMin: 120 },
    egypt: { n: 'الهيئة المصرية العامة للمساحة', fajr: 19.5, isha: 17.5, dhuhrMin: 0 },
    mwl:   { n: 'رابطة العالم الإسلامي', fajr: 18, isha: 17 },
    karachi: { n: 'جامعة العلوم الإسلامية بكراتشي', fajr: 18, isha: 18 },
    isna:  { n: 'أمريكا الشمالية (ISNA)', fajr: 15, isha: 15 },
    dubai: { n: 'دبي (الإمارات)', fajr: 18.2, isha: 18.2 },
    kuwait: { n: 'الكويت', fajr: 18, isha: 17.5 },
    qatar: { n: 'قطر', fajr: 18, ishaMin: 90 },
    gulf:  { n: 'دول الخليج', fajr: 19.5, ishaMin: 90 },
    turkey: { n: 'تركيا (الشؤون الدينية)', fajr: 18, isha: 17 },
  };

  // موضع الشمس ليوم جولياني
  function sun(jd) {
    const d = jd - 2451545.0, g = fix(357.529 + 0.98560028 * d, 360), q = fix(280.459 + 0.98564736 * d, 360);
    const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * d;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
  }
  const julian = (y, m, d) => { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; };

  /** times(date, lat, lng, opts) → كائن بأوقات Date محلية
      opts: { method, asr: 'std'|'hanafi', elev (متر), tz (ساعات، اختياري)، adj: {fajr: دقائق…}, ramadan } */
  function times(date, lat, lng, opts = {}) {
    const M = METHODS[opts.method] || METHODS.mwl;
    const y = date.getFullYear(), mo = date.getMonth() + 1, da = date.getDate();
    const tz = opts.tz != null ? opts.tz : -new Date(y, mo - 1, da, 12).getTimezoneOffset() / 60;
    const jd = julian(y, mo, da) - lng / (15 * 24);
    const midDay = t => { const s = sun(jd + t / 24); return fix(12 - s.eqt, 24); };
    const angleTime = (angle, t, ccw) => { const s = sun(jd + t / 24), noon = midDay(t); const v = acos((-sin(angle) - sin(s.decl) * sin(lat)) / (cos(s.decl) * cos(lat))) / 15; return noon + (ccw ? -v : v); };
    const asrTime = (f, t) => { const s = sun(jd + t / 24); return angleTime(-acot(f + tan(Math.abs(lat - s.decl))), t); };
    const riseAng = 0.833 + 0.0347 * Math.sqrt(Math.max(0, opts.elev || 0));
    // تقدير أولي ثم تكرار مرتين لتصحيح موضع الشمس عند وقت كل صلاة
    let T = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
    for (let k = 0; k < 2; k++) {
      T = {
        fajr: angleTime(M.fajr, T.fajr, true), sunrise: angleTime(riseAng, T.sunrise, true), dhuhr: midDay(T.dhuhr),
        asr: asrTime(opts.asr === 'hanafi' ? 2 : 1, T.asr), maghrib: angleTime(riseAng, T.maghrib), isha: M.isha ? angleTime(M.isha, T.isha) : T.isha,
      };
    }
    // تعديل خطوط العرض العالية: إن تعذّر الفجر أو العشاء فبنسبة الزاوية من الليل
    const night = fix(T.sunrise - T.maghrib, 24);
    if (!isFinite(T.fajr) || fix(T.sunrise - T.fajr, 24) > M.fajr / 60 * night) T.fajr = T.sunrise - M.fajr / 60 * night;
    if (M.ishaMin) T.isha = T.maghrib + ((opts.ramadan && M.ramadanIshaMin) || M.ishaMin) / 60;
    else if (!isFinite(T.isha) || fix(T.isha - T.maghrib, 24) > M.isha / 60 * night) T.isha = T.maghrib + M.isha / 60 * night;
    const adj = opts.adj || {}, out = {};
    for (const k of Object.keys(T)) {
      const h = T[k] + tz - lng / 15 + (adj[k] || 0) / 60 + (k === 'dhuhr' ? (opts.dhuhrMin != null ? opts.dhuhrMin : M.dhuhrMin != null ? M.dhuhrMin : 1) / 60 : 0);
      const ms = Math.round(h * 60) * 60000; // تقريب للدقيقة
      out[k] = new Date(new Date(y, mo - 1, da).getTime() + ms);
    }
    return out;
  }

  // اتجاه القبلة (درجات من الشمال باتجاه عقارب الساعة) والمسافة إلى الكعبة
  const KAABA = [21.422487, 39.826206];
  function qibla(lat, lng) {
    const [la, lo] = KAABA, dL = lo - lng;
    const deg = fix(atan2(sin(dL), cos(lat) * tan(la) - sin(lat) * cos(dL)), 360);
    const dist = 6371 * Math.acos(Math.min(1, sin(lat) * sin(la) + cos(lat) * cos(la) * cos(dL)));
    return { deg, km: Math.round(dist) };
  }
  // الطريقة الافتراضية بحسب الموقع التقريبي
  function guessMethod(lat, lng) {
    const inBox = (a, b, c, d) => lat >= a && lat <= b && lng >= c && lng <= d;
    if (inBox(16, 32.5, 34.5, 55.7)) return 'umm';           // السعودية
    if (inBox(22, 31.7, 24.7, 36.9)) return 'egypt';          // مصر
    if (inBox(22.5, 26.1, 51.5, 56.4)) return 'dubai';        // الإمارات
    if (inBox(28.5, 30.1, 46.5, 48.5)) return 'kuwait';
    if (inBox(24.4, 26.2, 50.7, 51.7)) return 'qatar';
    if (inBox(36, 42.2, 26, 45)) return 'turkey';
    if (inBox(23.5, 37.1, 60.8, 77.9)) return 'karachi';
    if (lng < -30 && lat > 15) return 'isna';
    return 'mwl';
  }

  const CITIES = [
    ['مكة المكرمة', 21.4225, 39.8262], ['المدينة المنورة', 24.4672, 39.6111], ['الرياض', 24.7136, 46.6753], ['جدة', 21.5433, 39.1728], ['الدمام', 26.4207, 50.0888],
    ['الطائف', 21.2703, 40.4158], ['أبها', 18.2164, 42.5053], ['تبوك', 28.3998, 36.5715], ['بريدة', 26.326, 43.975], ['حائل', 27.5114, 41.7208], ['جازان', 16.8892, 42.5511], ['نجران', 17.4924, 44.1277],
    ['القاهرة', 30.0444, 31.2357], ['الإسكندرية', 31.2001, 29.9187], ['الجيزة', 30.0131, 31.2089], ['المنصورة', 31.0409, 31.3785], ['طنطا', 30.7865, 31.0004], ['الزقازيق', 30.5877, 31.502], ['أسيوط', 27.1783, 31.1859], ['سوهاج', 26.5591, 31.6957], ['المنيا', 28.0871, 30.7618], ['الأقصر', 25.6872, 32.6396], ['أسوان', 24.0889, 32.8998], ['بورسعيد', 31.2653, 32.3019], ['الإسماعيلية', 30.5965, 32.2715], ['السويس', 29.9668, 32.5498], ['دمياط', 31.4165, 31.8133], ['كفر الشيخ', 31.1107, 30.9388], ['بني سويف', 29.0661, 31.0994], ['الفيوم', 29.3084, 30.8428], ['قنا', 26.1551, 32.716],
    ['دبي', 25.2048, 55.2708], ['أبوظبي', 24.4539, 54.3773], ['الكويت', 29.3759, 47.9774], ['الدوحة', 25.2854, 51.531], ['المنامة', 26.2285, 50.586], ['مسقط', 23.5859, 58.4059], ['عمّان', 31.9454, 35.9284], ['القدس', 31.7683, 35.2137], ['بيروت', 33.8938, 35.5018], ['دمشق', 33.5138, 36.2765], ['بغداد', 33.3152, 44.3661], ['الخرطوم', 15.5007, 32.5599], ['طرابلس', 32.8872, 13.1913], ['تونس', 36.8065, 10.1815], ['الجزائر', 36.7538, 3.0588], ['الرباط', 34.0209, -6.8416], ['الدار البيضاء', 33.5731, -7.5898], ['صنعاء', 15.3694, 44.191], ['إسطنبول', 41.0082, 28.9784], ['كراتشي', 24.8607, 67.0011], ['جاكرتا', -6.2088, 106.8456], ['كوالالمبور', 3.139, 101.6869], ['لندن', 51.5072, -0.1276], ['باريس', 48.8566, 2.3522], ['نيويورك', 40.7128, -74.006],
  ];

  window.PRAYCALC = { times, qibla, guessMethod, METHODS, CITIES };
})();
