#!/usr/bin/env python3
"""يكمل كتب الحديث المأخوذة من hadith-api بما سقط منها عند البناء الأول من نسخ sqlite.

السبب: نسخ sqlite من hadith-api لا تحوي الأحاديث غير المنسوبة إلى «كتاب» (section 0)،
ومنها مقدمة سنن ابن ماجه (1–266) وأحاديث من صحيح مسلم. ملفات JSON في المصدر نفسه
(editions/ara-<كتاب>.json) تحويها، فنضيف منها ما ليس نصه موجوداً عندنا.
كما نسجّل في الحديث الذي يحوي نص رقم غائب أنه يشمله (alsoNums)، لأن المصدر يضم أحياناً
أحاديث متتالية في رقم واحد (كثير في البخاري).

الاستخدام: python3 scripts/supplement_hadith.py <مجلد editions في hadith-api>
"""
import json, os, re, sys, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDI = sys.argv[1]
src = open(os.path.join(ROOT, 'scripts', 'build_pack.py'), encoding='utf-8').read()
helpers = src[src.index("TASHKEEL ="):src.index("def write_pack")] + src[src.index("SCHOLARS ="):src.index("def build_api")]
G = {'re': re, 'json': json, 'os': os, '__file__': os.path.join(ROOT, 'scripts', 'build_pack.py')}
exec(helpers, G)
split_isnad, grade_ar, SCHOLARS, MUSLIM_ABD = G['split_isnad'], G['grade_ar'], G['SCHOLARS'], G.get('MUSLIM_ABD', {})

DIAC = re.compile('[ؐ-ًؚ-ٰٟـ‏‎]')
def N(t): return re.sub(r'\s+', ' ', re.sub('[^ء-ي ]', ' ', DIAC.sub('', t or ''))).strip()

IMPLICIT = {'bukhari': 'البخاري', 'muslim': 'مسلم'}
manifest_path = os.path.join(ROOT, 'data', 'manifest.js')
mtxt = open(manifest_path, encoding='utf-8').read()
manifest = json.loads(mtxt[mtxt.index('=') + 1:].strip().rstrip(';'))

for b in ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah', 'malik']:
    path = os.path.join(ROOT, 'data', f'hadith-{b}.js')
    s = open(path, encoding='utf-8').read(); P = json.loads(s[s.index('=') + 1:].strip().rstrip(';'))
    book, items = P['book'], P['items']
    have = {x['num'] for x in items}
    texts = [N((x.get('isnad') or '') + ' ' + (x.get('matn') or '')) for x in items]
    srcd = json.load(open(os.path.join(EDI, f'ara-{b}.json'), encoding='utf-8'))
    added, alias = 0, 0
    bynum = sorted(items, key=lambda x: x['num'])
    for h in srcd['hadiths']:
        n = h['hadithnumber']
        if not isinstance(n, int) or n in have: continue
        t = (h.get('text') or '').strip()
        if not t: continue
        nt = N(t); probe = nt[-80:] if len(nt) > 100 else nt
        hit = next((i for i, x in enumerate(texts) if probe and probe in x), None)
        if hit is not None:
            it = items[hit]; it.setdefault('alsoNums', [])
            if n not in it['alsoNums']: it['alsoNums'].append(n); alias += 1
            continue
        prev = [x for x in bynum if x['num'] < n]
        kitab = 'المقدمة' if b == 'ibnmajah' and n <= 266 else (prev[-1]['kitab'] if prev else '')
        isnad, matn = split_isnad(t)
        gs = []
        for g in h.get('grades') or []:
            ga = grade_ar(g.get('grade'))
            if ga: gs.append({'grader': SCHOLARS.get(g.get('name'), g.get('name')), 'grade': ga, 'reason': '', 'source': ''})
        if b in IMPLICIT:
            gs = [{'grader': 'الإمام ' + IMPLICIT[b], 'grade': 'صحيح', 'reason': 'أخرجه في صحيحه الذي التزم فيه الصحة: اتصال السند بنقل العدل الضابط عن مثله، مع السلامة من الشذوذ والعلة.', 'source': book['title']}] + gs
        it = {'id': f'{b}:{n}', 'bookId': b, 'type': 'hadith', 'num': n, 'kitab': kitab, 'isnad': isnad, 'matn': matn}
        if b == 'muslim' and str(n) in MUSLIM_ABD: it['printedNum'] = MUSLIM_ABD[str(n)]
        if gs: it['grades'] = gs
        items.append(it); texts.append(nt); have.add(n); added += 1
    if not added and not alias:
        print(f'{b}: لا تغيير'); continue
    items.sort(key=lambda x: (x['num'], x['id']))
    book.pop('packVersion', None)
    if b == 'ibnmajah': book['numbering'] = 'الترقيم المطبوع المشهور (ترقيم محمد فؤاد عبد الباقي)'
    body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
    book['packVersion'] = hashlib.sha1(body.encode()).hexdigest()[:12]
    body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
    open(path, 'w', encoding='utf-8').write('window.PACK=' + body + ';')
    for m in manifest:
        if m['id'] == b: m['count'] = len(items); m['size'] = os.path.getsize(path); m['version'] = book['packVersion']
    print(f'{b}: +{added} أحاديث جديدة، و{alias} رقماً مضموماً إلى أحاديث موجودة — المجموع {len(items)}')
open(manifest_path, 'w', encoding='utf-8').write('window.PACK_MANIFEST=' + json.dumps(manifest, ensure_ascii=False, indent=1) + ';\n')
