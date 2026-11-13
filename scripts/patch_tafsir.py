#!/usr/bin/env python3
"""سد ثغرات ربط التفاسير بالآيات:
1) في نسخ OpenITI يُقسَّم التفسير على الآيات آلياً، فقد يغطي المقطع آيات بعده دون أن يُسجَّل ذلك؛
   فنمد مدى كل مقطع (ayahTo) إلى ما قبل المقطع التالي في السورة نفسها، فيظهر لكل آية تفسيرها.
2) سور 104 و110 و111 غائبة من نسخة ابن كثير: تُضاف من tafsir_api (qul.tarteel.ai)."""
import json, os, re, sys, hashlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KATHIR = sys.argv[1] if len(sys.argv) > 1 else None   # مجلد tafsir/ar-tafsir-ibn-kathir
Q = json.loads((lambda s: s[s.index('=') + 1:].strip().rstrip(';'))(open(os.path.join(ROOT, 'data', 'quran.js'), encoding='utf-8').read()))['items']
CNT = {}
for x in Q: CNT[x['surah']] = max(CNT.get(x['surah'], 0), x['ayah'])
mp = os.path.join(ROOT, 'data', 'manifest.js'); ms = open(mp, encoding='utf-8').read()
man = json.loads(ms[ms.index('=') + 1:].strip().rstrip(';'))
for bid in ['tafsir-ibnkathir', 'tafsir-tabari', 'tafsir-qurtubi', 'tafsir-saadi']:
    path = os.path.join(ROOT, 'data', f'book-{bid}.js'); s = open(path, encoding='utf-8').read()
    P = json.loads(s[s.index('=') + 1:].strip().rstrip(';')); items, book = P['items'], P['book']
    if bid == 'tafsir-ibnkathir' and KATHIR:
        have = {int(x['surah']) for x in items if x.get('surah')}
        for su in (104, 110, 111):
            if su in have: continue
            arr = json.load(open(os.path.join(KATHIR, f'{su}.json'), encoding='utf-8'))
            txt = re.sub(r'\n{3,}', '\n\n', arr[0]['text']).strip()
            items.append({'id': f'{bid}:{su}:1', 'bookId': bid, 'type': 'tafsir', 'surah': su, 'ayah': 1, 'ayahTo': CNT[su], 'page': '', 'text': txt,
                          'ref': [f'quran:{su}:{a}' for a in range(1, CNT[su] + 1)], 'note': 'من tafsir_api (qul.tarteel.ai)'})
    by = {}
    for x in items:
        if x.get('surah'): by.setdefault(int(x['surah']), []).append(x)
    ext = 0
    for su, arr in by.items():
        arr.sort(key=lambda x: (int(x['ayah']), int(x.get('ayahTo') or x['ayah'])))
        for i, x in enumerate(arr):
            nxt = int(arr[i + 1]['ayah']) if i + 1 < len(arr) else CNT[su] + 1
            a, to = int(x['ayah']), int(x.get('ayahTo') or x['ayah'])
            if nxt - 1 > to and nxt > a:
                x['ayahTo'] = nxt - 1; ext += nxt - 1 - to
                refs = set(x.get('ref') or []); refs.update(f'quran:{su}:{k}' for k in range(a, nxt))
                x['ref'] = sorted(refs, key=lambda r: int(r.split(':')[2]))
    book.pop('packVersion', None)
    body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
    book['packVersion'] = hashlib.sha1(body.encode()).hexdigest()[:12]
    body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
    open(path, 'w', encoding='utf-8').write('window.PACK=' + body + ';')
    for m in man:
        if m['id'] == bid: m.update({'count': len(items), 'size': os.path.getsize(path), 'version': book['packVersion']})
    cov = set()
    for x in items:
        if x.get('surah'):
            for k in range(int(x['ayah']), int(x.get('ayahTo') or x['ayah']) + 1): cov.add((int(x['surah']), k))
    print(bid, 'مدّ', ext, 'آية؛ التغطية', len(cov), '/ 6236')
open(mp, 'w', encoding='utf-8').write('window.PACK_MANIFEST=' + json.dumps(man, ensure_ascii=False, indent=1) + ';\n')
