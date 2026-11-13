#!/usr/bin/env python3
"""مشكاة المصابيح كاملة (6294 حديثاً) بتحقيق الألباني، من نسخة المكتبة الشاملة في مشروع OpenITI
(0741KhatibTabrizi.MishkatMasabih.Shamela0008360-ara1)، وتحل محل النسخة الناقصة.
الترقيم ترقيم طبعة المكتب الإسلامي بتحقيق الألباني، وحكمه بين قوسين بعد الرقم.
الاستخدام: python3 scripts/build_mishkat.py"""
import json, os, re, hashlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = open(os.path.join(ROOT, 'scripts', 'build-data', 'mishkat', '0741KhatibTabrizi.MishkatMasabih.Shamela0008360-ara1'), encoding='utf-8').read()
t = t[t.index('#META#Header#End#'):]
hadith, cur, kitab, bab, fasl = [], None, '', '', ''
def clean(s): return re.sub(r'\s+', ' ', re.sub(r'\bms\d+\b', '', s)).strip()
for l in t.split('\n'):
    m = re.match(r'^### \| (\d+) - ?(.*)$', l)
    if m:
        if cur: hadith.append(cur)
        cur = {'n': int(m.group(1)), 'lines': [], 'kitab': kitab, 'bab': (bab + ' — ' + fasl) if bab and fasl else (bab or fasl)}; continue
    m2 = re.match(r'^### \|+ (.*)$', l)
    if m2:
        title = clean(m2.group(1))
        if title.startswith('[ص'): continue
        if cur: hadith.append(cur); cur = None
        if title.startswith('كتاب'): kitab, bab, fasl = title, '', ''
        elif title.startswith('باب'): bab, fasl = title, ''
        elif title.startswith('الفصل'): fasl = title
        continue
    if l.startswith('# PageV') or l.startswith('#META'): continue
    if cur is not None: cur['lines'].append(l)
if cur: hadith.append(cur)
items, seen = [], {}
for h in hadith:
    body = clean(' '.join(re.sub(r'^(# |~~)', '', x) for x in h['lines']))
    grade = ''
    gm = re.match(r'^(?:\[\d+\]\s*)?\(([^)]{2,40})\)\s*', body)
    if gm: grade, body = gm.group(1).strip(), body[gm.end():]
    if not body: continue
    hid = f"mishkat:{h['n']}"
    if hid in seen: seen[hid] += 1; hid += '-' + str(seen[hid])
    else: seen[hid] = 1
    it = {'id': hid, 'bookId': 'mishkat', 'type': 'hadith', 'num': h['n'], 'kitab': h['kitab'], 'bab': h['bab'], 'isnad': '', 'matn': body}
    if grade: it['grades'] = [{'grader': 'الألباني', 'grade': 'صحيح، متفق عليه' if grade == 'متفق عليه' else grade, 'reason': '', 'source': 'تحقيق مشكاة المصابيح'}]
    items.append(it)
book = {'id': 'mishkat', 'title': 'مشكاة المصابيح', 'type': 'hadith', 'author': 'الخطيب التبريزي، بتحقيق الألباني',
        'source': 'OpenITI — نسخة المكتبة الشاملة (Shamela0008360)', 'numbering': 'ترقيم طبعة المكتب الإسلامي بتحقيق الألباني'}
body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
book['packVersion'] = hashlib.sha1(body.encode()).hexdigest()[:12]
body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
path = os.path.join(ROOT, 'data', 'hadith-mishkat.js'); open(path, 'w', encoding='utf-8').write('window.PACK=' + body + ';')
mp = os.path.join(ROOT, 'data', 'manifest.js'); s = open(mp, encoding='utf-8').read()
man = json.loads(s[s.index('=') + 1:].strip().rstrip(';'))
for m in man:
    if m['id'] == 'mishkat': m.update({'count': len(items), 'size': os.path.getsize(path), 'version': book['packVersion']})
open(mp, 'w', encoding='utf-8').write('window.PACK_MANIFEST=' + json.dumps(man, ensure_ascii=False, indent=1) + ';\n')
import collections
print('mishkat', len(items), collections.Counter(i['grades'][0]['grade'] if i.get('grades') else '-' for i in items).most_common(8))
