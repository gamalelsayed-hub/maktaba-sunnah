"""يبني data/lugha.js من scripts/build-data/nahw_src.py ويربط الدروس بمواضعها في كتب المكتبة."""
import json, re, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data'))
import nahw_src as N
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
def L(b):
    s = open(os.path.join(D, f'book-{b}.js'), encoding='utf-8').read(); return json.loads(s[len('window.PACK='):-1])
NR = lambda s: re.sub('[ً-ْـ]', '', s or '').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي')
P = {}; miss = []
def ref(b, kw):
    if b not in P: P[b] = L(b)
    for it in P[b]['items']:
        if NR(kw) in NR(it['title']) or NR(kw) in NR(it.get('chapter', '')): return [it['id'], P[b]['book']['title'], it['title'][:70]]
    miss.append((b, kw)); return None
for l in N.L: l['r'] = [x for x in (ref(b, k) for b, k in l['r']) if x]
out = {'levels': N.LEVELS, 'lessons': N.L, 'sents': N.S, 'wiz': N.WIZ, 'quran': N.QT}
open(os.path.join(D, 'lugha.js'), 'w', encoding='utf-8').write('window.LUGHA=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('miss', miss); print(len(N.L), len(N.S))
