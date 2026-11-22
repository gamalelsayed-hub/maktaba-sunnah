"""إصلاح فهارس: الطحاوية (تقسيم بالفقرات المرقمة)، وروضة الناظر والناسخ والمنسوخ (دمج العناوين الفارغة/الصفحات)."""
import json, re, sys
D = sys.argv[1] if len(sys.argv) > 1 else 'data'
def rd(b): return json.loads(open(f'{D}/book-{b}.js', encoding='utf-8').read()[len('window.PACK='):-1])
def wr(b, P):
    for k, it in enumerate(P['items']): it['seq'] = k + 1; it['id'] = f'{b}:{k+1}'
    P['book']['count'] = len(P['items']) if 'count' in P['book'] else None
    if P['book']['count'] is None: del P['book']['count']
    open(f'{D}/book-{b}.js', 'w', encoding='utf-8').write('window.PACK=' + json.dumps(P, ensure_ascii=False, separators=(',', ':')) + ';')
JUNK = re.compile(r'^[\s\.…\-]*$|^ص: ?\d+|^\d+$')
for b in ['rawdat-nazir', 'nasikh-nahhas']:
    P = rd(b); out = []
    for it in P['items']:
        if JUNK.match(it['title']) and out and len(out[-1]['text']) < 9000: out[-1]['text'] += '\n' + it['text']; continue
        if JUNK.match(it['title']): it['title'] = ' '.join(re.sub(r'[\$\#\*]', '', it['text']).split()[:8]) + '…'
        out.append(it)
    P['items'] = out; wr(b, P); print(b, len(out))
P = rd('tahawiyya'); it0 = P['items'][0]; lines = it0['text'].split('\n')
head, rest = lines[0], lines[1:]; grp = [[head]]
for ln in rest:
    if len(grp[-1]) >= 10: grp.append([])
    grp[-1].append(ln)
items = []
for g in grp:
    nums = [m.group(1) for m in (re.match(r'^(\d+) ', x) for x in g) if m]
    first = re.sub(r'^\d+ ', '', next((x for x in g if re.match(r'^\d+ ', x)), g[0]).lstrip('$ '))
    t = (f'الفقرات {nums[0]}–{nums[-1]}: ' if nums else 'المقدمة: ') + ' '.join(first.split()[:7])
    items.append(dict(it0, title=t, chapter='العقيدة الطحاوية', text='\n'.join(g)))
P['items'] = items; wr('tahawiyya', P); print('tahawiyya', len(items))
