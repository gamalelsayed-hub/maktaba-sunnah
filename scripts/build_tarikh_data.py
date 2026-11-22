import json,re,sys
sys.path.insert(0,'/home/claude/maktaba-sunnah/scripts/build-data')
from tarikh_src import ERAS,COUNTRIES
D='/home/claude/maktaba-sunnah/data/'; O='/home/claude/tr/out/'
def L(b):
  for p in (O,D):
    try: s=open(p+f'book-{b}.js').read(); return json.loads(s[len('window.PACK='):-1])
    except FileNotFoundError: pass
N=lambda s:re.sub('[ً-ْـ]','',s or '').replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ة','ه').replace('ى','ي')
HB=['bidaya-nihaya','tarikh-tabari','kamil-athir','mukhtasar-fida','tarikh-khaldun','tarikh-khulafa','jabarti','dawla-aliyya','ibnhisham','iqd-farid']
packs={b:L(b) for b in HB}
miss=[]
def ref(b,kw):
  P=packs[b]; k=N(kw)
  for it in P['items']:
    if k in N(it['title']) or k in N(it.get('bab','')): return [it['id'],it['title'][:90],P['book']['title']]
  miss.append((b,kw)); return None
for e in ERAS:
  e['refs']=[x for x in (ref(b,k) for b,k in e.pop('r')) if x]
out={'eras':ERAS,'countries':[dict(n=n,ic=ic,s=s,eras=er,q=q) for n,ic,s,er,q in COUNTRIES],
 'books':[[b,packs[b]['book']['title'],packs[b]['book']['author']] for b in HB[:8]]}
open(D+'tarikh.js','w').write('window.TARIKH='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
idx=[]
YR=re.compile(r'دخلت سنة ([^\n.،:(]{3,45})')
for b in HB[:8]:
  for it in packs[b]['items']:
    idx.append([it['id'],it['title'][:100]])
    if 'سنة' not in it['title']:
      m=YR.search(it['text'][:3000])
      if m: idx.append([it['id'],'حوادث سنة '+m[1].strip()+' — '+it['title'][:60]])
open(D+'tarikh-index.js','w').write('window.TARIKH_IDX='+json.dumps(idx,ensure_ascii=False,separators=(',',':'))+';\n')
print('miss',miss); print(len(idx))
