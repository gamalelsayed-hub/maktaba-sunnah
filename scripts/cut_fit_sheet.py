import numpy as np
from PIL import Image
from scipy import ndimage
def _alpha(fg):
  # نملأ الثقوب الصغيرة فقط (داخل القميص مثلاً)، ونترك الفراغات الكبيرة بين الرجلين شفافة
  holes=ndimage.binary_fill_holes(fg)&~fg
  hl,hn=ndimage.label(holes)
  if hn:
    sz=ndimage.sum(holes,hl,range(1,hn+1)); small=np.isin(hl,[i+1 for i,s in enumerate(sz) if s<250])
    fg=fg|small
  return (ndimage.gaussian_filter(fg.astype(float),0.7)*255).astype(np.uint8)
def figures(path, minarea, cells=None, dil=None):
  im=np.asarray(Image.open(path).convert('RGB')).astype(int); H,W,_=im.shape
  bg=np.median(np.concatenate([im[:6].reshape(-1,3),im[-6:].reshape(-1,3),im[:,:6].reshape(-1,3),im[:,-6:].reshape(-1,3)]),0)
  d=np.sqrt(((im-bg)**2).sum(2)); g=im[:,:,1]-np.maximum(im[:,:,0],im[:,:,2])
  fg=(d>38)&~((g>25)&(d<90)); fg=ndimage.binary_opening(fg,iterations=1)
  grp=ndimage.binary_dilation(fg,iterations=dil or max(3,int(W*0.008)))
  lab,n=ndimage.label(grp); objs=ndimage.find_objects(lab)
  sz=ndimage.sum(fg,lab,range(1,n+1)); out=[]
  for i,sl in enumerate(objs):
    if sz[i]<minarea: continue
    m=fg&(lab==i+1); a=_alpha(m)
    rgb=im.copy(); edge=(a>0)&(a<250)
    rgb[...,1]=np.where(edge,np.minimum(rgb[...,1],np.maximum(rgb[...,0],rgb[...,2])+10),rgb[...,1])
    y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
    out.append(((y0+y1)/2,(x0+x1)/2,Image.fromarray(np.dstack([rgb,a]).astype(np.uint8)).crop((x0,y0,x1,y1))))
  return out
