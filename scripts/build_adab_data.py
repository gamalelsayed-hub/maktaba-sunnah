import json,re
O='/home/claude/tr/out/'; D='/home/claude/maktaba-sunnah/data/'
meta=json.load(open('/tmp/_tarikh_adab.json'))
N=lambda s:re.sub(r'[ً-ْـ،,.؛:!؟?«»"()\-]','',s or '').replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ة','ه').replace('ى','ي').replace(' ','')
def L(b):
  s=open(O+f'book-{b}.js').read(); return json.loads(s[len('window.PACK='):-1])
P={p['id']:L(p['id']) for p in meta['poets']}
for b in ['sharh-mutanabbi','muallaqat']: P[b]=L(b)
SEL=[ # (موضوع، عبارة، كتاب مفضّل)
 ('الإيمان والتوحيد','ألا كل شيء ما خلا الله باطل','diwan-labid'),
 ('الحكمة','سئمت تكاليف الحياة','diwan-zuhayr'),
 ('الحكمة','ومن لا يصانع في أمور كثيرة','diwan-zuhayr'),
 ('الحكمة','ومهما تكن عند امرئ من خليقة','diwan-zuhayr'),
 ('الحكمة','ستبدي لك الأيام ما كنت جاهلا','diwan-tarafa'),
 ('الأخلاق','وإن أنت أكرمت اللئيم تمردا','sharh-mutanabbi'),
 ('الحكمة','على قدر أهل العزم تأتي العزائم','sharh-mutanabbi'),
 ('الحكمة','ما كل ما يتمنى المرء يدركه','sharh-mutanabbi'),
 ('الحكمة','وإذا كانت النفوس كبارا','sharh-mutanabbi'),
 ('العلم','الخيل والليل والبيداء تعرفني','sharh-mutanabbi'),
 ('الزهد','دع الأيام تفعل ما تشاء','diwan-shafii'),
 ('العلم','شكوت إلى وكيع سوء حفظي','diwan-shafii'),
 ('الأخلاق','نعيب زماننا والعيب فينا','diwan-shafii'),
 ('الأخلاق','إذا رمت أن تحيا سليما من الأذى','diwan-shafii'),
 ('الزهد','الناس في غفلة','diwan-atahiya'),
 ('الزهد','ألا إننا كلنا بائد','diwan-atahiya'),
 ('المديح النبوي','بانت سعاد فقلبي اليوم متبول','diwan-kaab'),
 ('المديح النبوي','إن الرسول لنور يستضاء به','diwan-kaab'),
 ('المديح النبوي','وأحسن منك لم تر قط عيني','diwan-hassan'),
 ('المديح النبوي','هجوت محمدا فأجبت عنه','diwan-hassan'),
 ('البطولة','السيف أصدق إنباء من الكتب','diwan-abutammam'),
 ('الحنين','أقول وقد ناحت بقربي حمامة','diwan-abufiras'),
 ('الرثاء','قذى بعينك أم بالعين عوار','diwan-khansa'),
 ('الكرم','أماوي إن المال غاد ورائح','diwan-hatim'),
 ('الحكمة','غير مجد في ملتي واعتقادي','diwan-maarri'),
 ('الوصف','أتاك الربيع الطلق يختال ضاحكا','diwan-buhturi'),
 ('الحنين','أضحى التنائي بديلا من تدانينا','diwan-zaydun'),
 ('الأخلاق','لا تسقني ماء الحياة بذلة','diwan-abufiras'),
]
out=[]; miss=[]
for topic,ph,pref in SEL:
  k=N(ph); found=None
  for b in [pref]+[x for x in P if x!=pref]:
    for it in P[b]['items']:
      lines=it['text'].split('\n')
      for i,l in enumerate(lines):
        if k in N(l):
          found=(b,it,i); break
      if found: break
    if found: break
  if not found: miss.append(ph); continue
  b,it,i=found; lines=it['text'].split('\n')
  # من كتاب الشرح نأخذ سطر البيت فقط
  if b.startswith('diwan'):
    v=[lines[i]] if '…' in lines[i] else [lines[i].strip(' ،,')+' … '+(lines[i+1].strip(' ،,') if i+1<len(lines) else '')]
  else: v=[re.sub(r'\s+',' ',lines[i])[:200]]
  poet={'ومهما تكن عند امرئ من خليقة':'زهير بن أبي سلمى'}.get(ph) or next((p['name'] for p in meta['poets'] if p['id']==b), 'المتنبي' if b=='sharh-mutanabbi' else P[b]['book']['author'])
  out.append({'topic':topic,'v':v[:2] if b.startswith('diwan') else v,'poet':poet,'id':it['id']})
print('miss',miss,len(out))
adab_books=[{'id':m['id'],'title':m['title'],'author':m['author'],'type':m['type']} for m in meta['manifest'] if m['type']=='adabbook']
json.dump({'poets':meta['poets'],'eras':meta['eras'],'books':adab_books,'sel':out},open('/tmp/adab_out.json','w'),ensure_ascii=False)
open(D+'adab.js','w').write('window.ADAB='+json.dumps({'poets':meta['poets'],'eras':meta['eras'],'books':adab_books,'sel':out},ensure_ascii=False,separators=(',',':'))+';\n')
for o in out: print(o['topic'],'|',o['poet'],'|',o['v'][0][:70])
