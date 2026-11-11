"""يبني فهرس كتب OpenITI (آلاف كتب التراث) ليبحث فيه المستخدم ويحمّل ما يريد من داخل البرنامج.
الاستخدام: python3 -I build_catalog.py <OpenITI_Github_clone_metadata_light.csv> <out data dir>"""
import csv, json, re, sys, os
csv.field_size_limit(10**9)
src, out = sys.argv[1], sys.argv[2]
cat = []
for r in csv.DictReader(open(src, encoding='utf-8'), delimiter='\t'):
    if r['language'] != 'ara' or r['uncorrected_OCR'] == 'True': continue
    first = lambda s: (s or '').split('::')[0].strip()
    tags = [t.strip() for t in (r['tags'] or '').split('::')]
    g = next((t.split('@', 1)[1] for t in tags if re.match(r'^(Shamela|ShamAY|JK|Sham30K|Sham19Y)@', t) and re.search(r'[؀-ۿ]', t)), '')
    g = re.sub(r'\s*-\s*مرقم آليا', '', g).strip()
    url = r['url'].replace('https://raw.githubusercontent.com/OpenITI/', '')
    try: d = int(r['date'])
    except ValueError: d = 0
    cat.append({'v': r['versionUri'], 't': first(r['title_ar'])[:160], 'a': first(r['author_ar'])[:80], 'd': d, 'u': url,
                'c': int(r['char_length'] or 0), 's': 'p' if r['status'] == 'pri' else 's', 'g': g[:60]})
cat.sort(key=lambda x: (x['d'], x['t']))
with open(os.path.join(out, 'catalog.js'), 'w', encoding='utf-8') as f:
    f.write('window.CATALOG=' + json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + ';')
print(len(cat), 'كتاب', round(os.path.getsize(os.path.join(out, 'catalog.js')) / 1e6, 1), 'MB')
