"""Extract isolated Arabic letter outlines (Noto Naskh, bold instance) as SVG paths for the letter-drawing animation.
Output: js/learn-paths.js  -> window.LEARN_PATHS = { letter: { v: [minX, minY, w, h], c: [path d per contour, biggest first] } }"""
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.areaPen import AreaPen

f = TTFont('fonts/NotoNaskhArabic.ttf')
if 'fvar' in f:
    from fontTools.varLib.instancer import instantiateVariableFont
    f = instantiateVariableFont(f, {'wght': 700})
gs = f.getGlyphSet(); cmap = f.getBestCmap()
LET = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'
out = {}
for ch in LET:
    g = cmap[ord(ch)]
    rec = DecomposingRecordingPen(gs); gs[g].draw(rec)
    # split into contours
    contours, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ('closePath', 'endPath'): contours.append(cur); cur = []
    items = []
    for c in contours:
        sp = SVGPathPen(gs); ap = AreaPen(gs)
        for op, args in c: getattr(sp, op)(*args); getattr(ap, op)(*args)
        items.append((abs(ap.value), sp.getCommands()))
    items.sort(key=lambda x: -x[0])
    bp = BoundsPen(gs); gs[g].draw(bp); x0, y0, x1, y1 = bp.bounds
    pad = 60
    out[ch] = {'v': [x0 - pad, -(y1 + pad), (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad], 'c': [d for _, d in items]}
js = '/* مسارات الحروف لرسمها متحركة (مستخرجة من خط Noto Naskh Arabic — رخصة OFL). مولَّد بـ scripts/build_letter_paths.py */\nwindow.LEARN_PATHS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open('js/learn-paths.js', 'w').write(js)
print(len(js), {k: len(v['c']) for k, v in out.items()})
