#!/usr/bin/env python3
"""يبني data/pages/: تخطيط صفحات مصحف المدينة (604 صفحة، طبعة مجمع الملك فهد 1405هـ) سطراً سطراً.
المصدر: zonetecde/mushaf-layout (ملفات QPC1/page-XXX.json في scripts/build-data/pages/).
الناتج:
  data/pages/index.js  — أول آية في كل صفحة (للانتقال إلى الصفحة)
  data/pages/pNN.js    — كل 20 صفحة في ملف: الأسطر، وكل سطر مقاطع [سورة، آية، نص، نهاية الآية؟]
"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'scripts', 'build-data', 'pages')
OUT = os.path.join(ROOT, 'data', 'pages')
DIG = re.compile(r'\s*[٠-٩]+\s*$')
os.makedirs(OUT, exist_ok=True)
pages, first = [], []
for p in range(1, 605):
    d = json.load(open(os.path.join(SRC, f'page-{p:03d}.json'), encoding='utf-8'))
    lines = []
    for l in d['lines']:
        if l['type'] == 'surah-header': lines.append(['h', int(l['surah'])])
        elif l['type'] == 'basmala': lines.append(['b'])
        else:
            segs = []
            for w in l['words']:
                s, a, _ = map(int, w['location'].split(':'))
                txt = w['word']; end = bool(DIG.search(txt)); txt = DIG.sub('', txt)
                if segs and segs[-1][0] == s and segs[-1][1] == a and not segs[-1][3]:
                    segs[-1][2] += ' ' + txt; segs[-1][3] = end
                else: segs.append([s, a, txt, end])
            lines.append(['t', [[x[0], x[1], x[2], 1 if x[3] else 0] for x in segs]])
    pages.append(lines)
    fa = next(x[1][0] for x in lines if x[0] == 't')
    first.append([fa[0], fa[1]])
for i in range(0, 604, 20):
    chunk = {str(p + 1): pages[p] for p in range(i, min(604, i + 20))}
    open(os.path.join(OUT, f'p{i // 20 + 1:02d}.js'), 'w', encoding='utf-8').write(
        'window.MUSHAF_PAGES=window.MUSHAF_PAGES||{};Object.assign(MUSHAF_PAGES,%s);\n' % json.dumps(chunk, ensure_ascii=False, separators=(',', ':')))
open(os.path.join(OUT, 'index.js'), 'w', encoding='utf-8').write('window.MUSHAF_INDEX=%s;\n' % json.dumps(first, separators=(',', ':')))
print('pages ok', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)) // 1024, 'KB')

# ===== إحداثيات الآيات (رقم السطر في مصحف المدينة) — تُستعمل لتقدير صفحات أي مصحف آخر =====
coord, head = {}, {}
for p in range(1, 605):
    for li, l in enumerate(pages[p - 1]):
        c = (p - 1) * 15 + li
        if l[0] == 'h': head[l[1]] = c
        if l[0] == 't':
            for x in l[1]:
                coord.setdefault((x[0], x[1]), c)
order = sorted(coord)
open(os.path.join(OUT, 'coords.js'), 'w', encoding='utf-8').write('window.MUSHAF_COORDS=%s;\n' % json.dumps(
    {'a': [[s, a, coord[(s, a)]] for s, a in order], 'h': [head.get(s, coord[(s, 1)]) for s in range(1, 115)], 'total': 604 * 15}, separators=(',', ':')))
print('coords ok', len(order))
