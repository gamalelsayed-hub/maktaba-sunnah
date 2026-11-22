"""يربط أحاديث الكتب غير المحكوم عليها (الأدب المفرد، المسند، الدارمي، الشمائل، الأربعين...) بنظيرها في الكتب المحكوم عليها
(البخاري، مسلم، السنن، الموطأ) بمطابقة نص المتن، ويكتب data/grade-xref.js: id -> [id النظير, الحكم, المحكِّم]."""
import json, re, glob, os, collections
D = 'data'
def load(f):
    s = open(f, encoding='utf-8').read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])['items']
def norm(t):
    t = re.sub('[ً-ْـٰ‏‎]', '', t or '')
    t = t.translate(str.maketrans('أإآىة', 'ااايه')); return re.findall(r'[ء-ي]+', t)
STOP = set('قال عن رسول الله صلي عليه وسلم حدثنا اخبرنا ان من في ما لا علي الي ثم يا هو هي او و'.split())
def sh(t):
    w = [x for x in norm(t) if x not in STOP]; return {' '.join(w[i:i + 4]) for i in range(len(w) - 3)}
GRADED = ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah', 'malik']
RANK = {'bukhari': 0, 'muslim': 1, 'abudawud': 2, 'tirmidhi': 3, 'nasai': 4, 'ibnmajah': 5, 'malik': 6}
idx = collections.defaultdict(list); G = {}
for b in GRADED:
    for it in load(f'{D}/hadith-{b}.js'):
        if not it.get('grades'): continue
        s = sh(it.get('matn')); G[it['id']] = (len(s), it['grades'], b)
        for x in s: idx[x].append(it['id'])
print('graded', len(G))
def pick(gs):
    alb = next((g for g in gs if 'الألباني' in g['grader'] or 'الالباني' in g['grader']), None); g = alb or gs[0]; return g['grade'], g['grader']
out = {}
for f in ['adab', 'ahmad', 'darimi', 'shamail', 'dehlawi40', 'nawawi40', 'qudsi40', 'riyad', 'bulugh']:
    n = 0
    for it in load(f'{D}/hadith-{f}.js'):
        s = sh(it.get('matn'))
        if len(s) < 4: continue
        c = collections.Counter()
        for x in s:
            l = idx.get(x)
            if l and len(l) < 60: c.update(l)
        best = None
        for gid, k in c.most_common(8):
            ln = G[gid][0]; r = k / min(len(s), ln)
            if r >= .5 and k >= 4:
                key = (-(r >= .8), RANK[G[gid][2]], -r)
                if best is None or key < best[0]: best = (key, gid)
        if best:
            gid = best[1]; gr, by = pick(G[gid][1]); out[it['id']] = [gid, gr, by]; n += 1
    print(f, n)
open(f'{D}/grade-xref.js', 'w', encoding='utf-8').write('window.GRADE_XREF=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';')
print(len(out), os.path.getsize(f'{D}/grade-xref.js'))
