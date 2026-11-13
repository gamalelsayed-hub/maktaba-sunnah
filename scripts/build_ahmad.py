#!/usr/bin/env python3
"""مسند الإمام أحمد كاملاً (26363 حديثاً) من mhashim6/Open-Hadith-Data
(رخصة ODbL 1.0 للقاعدة وDbCL 1.0 للمحتوى؛ أصلها ملفات hadith-islamware).
الترقيم ترقيم المصدر (برنامج صخر/العالمية)، وهو يختلف عن ترقيم طبعة الرسالة.
يُكتب حزمة اختيارية data/hadith-ahmad.js تحل محل «مسند أحمد (جزء)».
الاستخدام: python3 scripts/build_ahmad.py"""
import csv, json, os, re, hashlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'scripts', 'build_pack.py'), encoding='utf-8').read()
G = {'re': re}; exec(src[src.index("TASHKEEL ="):src.index("def write_pack")], G)
split_isnad = G['split_isnad']
items = []
with open(os.path.join(ROOT, 'scripts', 'build-data', 'ahmad', 'musnad_ahmad_ibn-hanbal_ahadith_mushakkala.utf8.csv'), encoding='utf-8') as f:
    for row in csv.reader(f):
        if len(row) < 2 or not row[0].strip().isdigit(): continue
        t = re.sub(r'[‏‎]', '', row[1]); t = re.sub(r'\s+', ' ', t).strip()
        if not t: continue
        isnad, matn = split_isnad(t)
        n = int(row[0])
        items.append({'id': f'ahmad:{n}', 'bookId': 'ahmad', 'type': 'hadith', 'num': n, 'kitab': '', 'isnad': isnad, 'matn': matn})
book = {'id': 'ahmad', 'title': 'مسند الإمام أحمد', 'type': 'hadith', 'author': 'الإمام أحمد بن حنبل',
        'source': 'Open-Hadith-Data (mhashim6) — رخصة ODbL/DbCL، وأصلها hadith-islamware',
        'numbering': 'ترقيم المصدر (برنامج صخر/العالمية)، ويختلف عن ترقيم طبعة الرسالة'}
body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
book['packVersion'] = hashlib.sha1(body.encode()).hexdigest()[:12]
body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
path = os.path.join(ROOT, 'data', 'hadith-ahmad.js')
open(path, 'w', encoding='utf-8').write('window.PACK=' + body + ';')
mp = os.path.join(ROOT, 'data', 'manifest.js'); s = open(mp, encoding='utf-8').read()
man = json.loads(s[s.index('=') + 1:].strip().rstrip(';'))
for m in man:
    if m['id'] == 'ahmad':
        m.update({'title': book['title'], 'count': len(items), 'size': os.path.getsize(path), 'version': book['packVersion'], 'optional': True, 'type': 'hadith', 'author': book['author']})
open(mp, 'w', encoding='utf-8').write('window.PACK_MANIFEST=' + json.dumps(man, ensure_ascii=False, indent=1) + ';\n')
print('ahmad', len(items), os.path.getsize(path) // 1e6, 'MB')
