"""يبني data/usul.js من scripts/build-data/usul_tracks*.py ويربط الدروس بمواضعها في كتب المكتبة."""
import json, re, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data'))
import usul_tracks as TT
import usul_tracks2  # noqa: يضيف المسارات إلى TT.TR
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
NR = lambda s: re.sub('[ً-ْـ]', '', s or '').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ة', 'ه').replace('ى', 'ي')
ms = open(os.path.join(D, 'manifest.js'), encoding='utf-8').read(); MAN = {m['id']: m for m in json.loads(ms[ms.index('['):ms.rindex(']') + 1])}
P = {}; miss = []
def pack(b):
    if b not in P:
        s = open(os.path.join(D, MAN[b]['file'] + '.js'), encoding='utf-8').read(); P[b] = json.loads(s[s.index('{'):s.rindex('}') + 1])
    return P[b]
TI = lambda it: it.get('title') or it.get('kitab') or ''
TX = lambda it: it.get('text') or it.get('matn') or ''
def ref(spec):
    if spec[0] == 'T':
        _, b, s = spec; pk = pack(b)
        it = next((i for i in pk['items'] if i.get('surah') == s), None)
        if it: return [it['id'], pk['book']['title'], 'تفسير سورة ' + SN[s - 1]]
        miss.append(spec); return None
    b, kw = spec; pk = pack(b); bt = pk['book']['title']
    lab = lambda it: (TI(it) or re.sub(r'\s+', ' ', TX(it))[:60])[:70]
    for it in pk['items']:
        if NR(kw) in NR(TI(it)) or NR(kw) in NR(it.get('chapter', '')): return [it['id'], bt, lab(it) if TI(it) and NR(kw) in NR(TI(it)) else (TI(it) + ' — ' + re.sub(r'\s+', ' ', TX(it))[:40])[:70]]
    for it in pk['items']:
        x = NR(TX(it)); k = x.find(NR(kw))
        if k >= 0: return [it['id'], bt, ((TI(it) + ' — ') if TI(it) else '') + '…' + re.sub(r'\s+', ' ', x[max(0, k - 15):k + 35]) + '…']
    miss.append(spec); return None
import builtins
qs = open(os.path.join(D, '..', 'js', 'arabic.js'), encoding='utf-8').read()
SN = re.findall(r"'([^']+)'", qs[qs.index('const SURAHS = ['):].split('];')[0])
for tk in TT.TR.values():
    for l in tk['lessons']: l['r'] = [x for x in (ref(tuple(r)) for r in l['r']) if x]
open(os.path.join(D, 'usul.js'), 'w', encoding='utf-8').write('window.USUL=' + json.dumps({'tracks': TT.TR}, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('miss', miss); print(len(TT.TR), sum(len(t['lessons']) for t in TT.TR.values()))
for k in ['sira', 'ibadat', 'adab', 'faraid', 'tafsir']:
    for l in TT.TR[k]['lessons'][:20]: print(k, l['id'], [x[2][:45] for x in l['r']])
