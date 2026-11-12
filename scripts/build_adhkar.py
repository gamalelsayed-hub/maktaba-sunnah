#!/usr/bin/env python3
"""الأذكار: أذكار الصباح والمساء (Seen-Arabic، رخصة MIT) + حصن المسلم كاملاً (rn0x) → js/adhkar-data.js"""
import json, os, re
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data', 'adhkar')
seen = json.load(open(os.path.join(B, 'seen-ar.json'), encoding='utf-8'))
hisn = json.load(open(os.path.join(B, 'hisn.json'), encoding='utf-8'))

sm = [{'t': x['content'].strip(), 'c': int(x.get('count') or 1), 'cd': x.get('count_description', ''), 'f': x.get('fadl', ''),
       's': x.get('source', ''), 'k': int(x.get('type') or 0), 'a': x.get('audio', ''), 'v': x.get('explanation_of_hadith_vocabulary', '')}
      for x in sorted(seen, key=lambda x: x.get('order', 0))]

NUM = {'مرة': 1, 'مرتين': 2, 'مرتان': 2, 'ثلاث': 3, 'ثلاثا': 3, 'ثلاثاً': 3, 'أربع': 4, 'سبع': 7, 'عشر': 10, 'مائة': 100, 'مئة': 100, 'ثلاثاً وثلاثين': 33, 'ثلاثا وثلاثين': 33, 'أربعا وثلاثين': 34}
def count_of(t):
    m = re.search(r'[\(（]\s*([^\)）]{2,25})\s*[\)）]\s*$', t.strip())
    if not m: return 1, t
    inner = m[1].strip()
    for k in sorted(NUM, key=len, reverse=True):
        if inner.startswith(k) or inner.replace('ً', '').startswith(k.replace('ً', '')):
            return NUM[k], t[:m.start()].strip()
    d = re.search(r'\d+', inner)
    if d and ('مر' in inner): return int(d[0]), t[:m.start()].strip()
    return 1, t
SKIP = {'المقدمة'}
cats = []
for title, v in hisn.items():
    if title in SKIP: continue
    items = []
    for t in v.get('text', []):
        t = re.sub(r'\s+', ' ', t).strip()
        if len(t) < 3: continue
        c, body = count_of(t)
        items.append({'t': body, 'c': c})
    if items: cats.append({'id': len(cats) + 1, 'title': title, 'items': items, 'notes': [re.sub(r'\s+', ' ', f).strip() for f in v.get('footnote', []) if f.strip()]})

GROUPS = [('🌅 اليوم والليلة', ['الاستيقاظ', 'النوم', 'تقلب', 'القلق والفزع', 'الرؤيا', 'لبس', 'الثوب', 'الخلاء', 'المنزل', 'الطعام', 'العطاس', 'المجلس']),
          ('🕌 الصلاة والطهارة', ['الوضوء', 'المسجد', 'الأذان', 'الاستفتاح', 'الركوع', 'السجود', 'التشهد', 'السلام من الصلاة', 'الاستخارة', 'الوتر', 'الجلسة', 'الصلاة على النبي', 'سجود التلاوة']),
          ('💭 الهم والكرب والحاجات', ['الهم', 'الكرب', 'العدو', 'السلطان', 'خاف', 'الشك', 'الدين', 'الوسوسة', 'استصعب', 'أذنب', 'الشيطان', 'لا يرضاه', 'الغضب', 'الاستغفار', 'الطيرة', 'الشرك', 'الدجال']),
          ('🤒 المرض والموت والمصائب', ['المريض', 'المحتضر', 'مصيبة', 'الميت', 'التعزية', 'القبر', 'القبور', 'الفرط', 'وجعا', 'بعينه', 'مبتلى']),
          ('🌧 الأحوال والمناسبات', ['الريح', 'الرعد', 'الاستسقاء', 'المطر', 'الاستصحاء', 'الهلال', 'الصائم', 'إفطار', 'الثمر', 'المتزوج', 'المولود', 'الأولاد', 'الزوجة', 'الديك', 'الكلاب', 'يسره', 'التعجب', 'الفزع', 'الذبح']),
          ('✈️ السفر', ['السفر', 'الدابة', 'القرية', 'السوق', 'المركوب', 'المسافر', 'المقيم', 'منزلا', 'أسحر']),
          ('🕋 الحج والعمرة', ['المحرم', 'الركن', 'الصفا', 'عرفة', 'المشعر', 'الجمار']),
          ('🤝 المعاملة والآداب', ['السلام', 'معروفا', 'معروفاً', 'غفر الله', 'أحبك', 'ماله', 'أقرض', 'بارك الله', 'سببته', 'مدح', 'زكي', 'الكافر', 'للمتزوج', 'الضيف', 'سقاه', 'أهل بيت']),
          ('📿 فضل الذكر والتسبيح', ['فضل', 'التسبيح', 'يسبح', 'الخير والآداب'])]
for c in cats:
    c['g'] = next((g for g, keys in GROUPS if any(k in c['title'] for k in keys)), '📚 أخرى')
out = {'sm': sm, 'hisn': cats, 'groups': [g for g, _ in GROUPS] + ['📚 أخرى'],
       'src': {'sm': 'قاعدة أذكار الصباح والمساء — Seen Arabic (رخصة MIT)، والتسجيلات من موقع حصن المسلم', 'hisn': 'كتاب حصن المسلم للشيخ سعيد بن علي بن وهف القحطاني رحمه الله'}}
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'adhkar-data.js')
open(p, 'w', encoding='utf-8').write('// مولَّد بـ scripts/build_adhkar.py\nwindow.ADHKAR_DATA=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('صباح ومساء:', len(sm), 'بصوت:', sum(1 for x in sm if x['a']), '| حصن المسلم أبواب:', len(cats), 'أذكار:', sum(len(c['items']) for c in cats), '| حجم', os.path.getsize(p))
from collections import Counter; print(Counter(c['g'] for c in cats)); print('بعدد تكرار>1:', sum(1 for c in cats for i in c['items'] if i['c'] > 1))
