import json,sys
sys.path.insert(0,'.'); sys.path.insert(0,'/home/claude/tb')
import dawah_build as DB_  # يعيد بناء الدعوة أيضاً (لا بأس) ونستعمل دالة ev منه
from wajib_src import UNITS, W
DB_.miss.clear()
out={"units":UNITS,"items":[]}
for i,x in enumerate(W):
  out["items"].append({"i":i+1,"u":x['u'],"t":x['t'],"b":x['b'],"ev":[e for e in (DB_.ev(y) for y in x['ev']) if e],"q":x['q']})
print('MISS',DB_.miss, len(W))
open('/home/claude/maktaba-sunnah/data/wajib.js','w').write('window.WAJIB='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
