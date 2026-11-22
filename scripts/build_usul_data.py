"""يبني data/usul.js من scripts/build-data/usul_tracks.py ويربط الدروس بمواضعها في كتب المكتبة."""
import json, re, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data'))
import usul_tracks as TT
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
NR = lambda s: re.sub('[ً-ْـ]', '', s or '').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي')
P = {}; miss = []
def ref(b, kw):
    if b not in P:
        s = open(os.path.join(D, f'book-{b}.js'), encoding='utf-8').read(); P[b] = json.loads(s[len('window.PACK='):-1])
    for it in P[b]['items']:
        if NR(kw) in NR(it['title']) or NR(kw) in NR(it.get('chapter', '')): return [it['id'], P[b]['book']['title'], it['title'][:70]]
    for it in P[b]['items'][:400]:
        if NR(kw) in NR(it['text'][:200]): return [it['id'], P[b]['book']['title'], it['title'][:70]]
    miss.append((b, kw)); return None
for tk in TT.TR.values():
    for l in tk['lessons']: l['r'] = [x for x in (ref(b, k) for b, k in l['r']) if x]
open(os.path.join(D, 'usul.js'), 'w', encoding='utf-8').write('window.USUL=' + json.dumps({'tracks': TT.TR}, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('miss', miss); print(sum(len(t['lessons']) for t in TT.TR.values()))
