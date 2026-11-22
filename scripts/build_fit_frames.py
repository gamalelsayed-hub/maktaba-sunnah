import json, os, glob
import numpy as np
from PIL import Image
R='/home/claude/maktaba-sunnah/'
def clean(f):
  a=np.asarray(f).astype(int); g=a[...,1]-np.maximum(a[...,0],a[...,2])
  a[...,3]=np.where(g>22,0,a[...,3]); return Image.fromarray(a.astype(np.uint8))
def place(img, s, align):
  f=img.resize((int(img.width*s),int(img.height*s)),Image.LANCZOS)
  if f.width>570 or f.height>560: f.thumbnail((570,560),Image.LANCZOS)
  c=Image.new('RGBA',(600,600),(0,0,0,0))
  x=(600-f.width)//2 if align=='c' else 585-f.width   # الأرضية: الرأس واليدان في نفس المكان
  c.paste(f,(x,580-f.height),f); return c
def build(look, folder, scales, MAP):
  out=R+f'img/fit/{look}/'
  for f in glob.glob(out+'*'): os.remove(f)
  for k,(a,b,al) in MAP.items():
    for j,n in ((1,a),(2,b)):
      place(clean(Image.open(f'{folder}/{n}.png')), scales(n), al).save(out+f'{k}-{j}.webp',quality=82)
  idx=json.load(open(R+'img/fit/index.json')); idx[look]=list(MAP); json.dump(idx,open(R+'img/fit/index.json','w'),ensure_ascii=False)
# الشاب
SA=['stand','jack','knee','tpose','squat','lunge','sidebend','tiptoe','armsup']
build('man','man',lambda n:1.5 if n in SA else 2.9,{
 'jacks':('stand','jack','c'),'highKnees':('stand','knee','c'),'march':('stand','knee','c'),'armCircles':('tpose','armsup','c'),'squat':('stand','squat','c'),
 'lunge':('stand','lunge','c'),'sideStretch':('stand','sidebend','c'),'calfRaise':('stand','tiptoe','c'),'pushUp':('plankhigh','pushdown','r'),'climber':('plankhigh','climb','r'),
 'plank':('forearm','forearm','r'),'catCow':('cat','cow','r'),'child':('cat','child','r'),'bridge':('lie','bridge','c')})
# الفتاة
W=lambda n: Image.open(f'w2/{n}.png').width; H=lambda n: Image.open(f'w2/{n}.png').height
WA=['stand','jack','knee','tpose','squat','lunge','sidebend','armsup']; WB=['forearm','cat','cow','kneetop','kneebottom','climb']
sa=520/H('stand'); sb=540/W('forearm'); sch=W('cat')*sb*1.18/W('child'); ss=420/H('sit')
build('woman','w2',lambda n: sa if n in WA else sb if n in WB else sch if n=='child' else ss,{
 'jacks':('stand','jack','c'),'highKnees':('stand','knee','c'),'march':('stand','knee','c'),'postWalk':('stand','knee','c'),'squat':('stand','squat','c'),'lunge':('stand','lunge','c'),
 'sideStretch':('stand','sidebend','c'),'armCircles':('tpose','armsup','c'),'plank':('forearm','forearm','r'),'catCow':('cat','cow','r'),'pushKnee':('kneetop','kneebottom','r'),
 'climber':('kneetop','climb','r'),'child':('cat','child','r'),'butterfly':('butterfly','butterfly','c'),'breathe':('sit','sit','c'),'kegel':('sit','sit','c'),'postBreath':('sit','sit','c')})
# معاينة
prev=Image.new('RGB',(1200,320),(235,243,238))
for i,(lk,k) in enumerate([('woman','catCow'),('woman','child'),('woman','pushKnee'),('man','pushUp')]):
  for j in (1,2):
    im=Image.open(R+f'img/fit/{lk}/{k}-{j}.webp'); im.thumbnail((150,150)); prev.paste(im,(i*300+(j-1)*150,10),im)
prev.save('frames_prev.png')
