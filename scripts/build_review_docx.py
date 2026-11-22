"""يُخرج ملف Word واحداً بكل الدروس التي صاغها التطبيق (للمراجعة الشرعية): ما لا يسع المسلم جهله، وأصول العلوم ومساراتها، والدعوة، وعلوم العربية."""
import json, sys
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
def J(f):
    s = open(f, encoding='utf-8').read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])
doc = Document()
st = doc.styles['Normal']; st.font.name = 'Arial'; st.font.size = Pt(12); st.element.rPr.rFonts.set(qn('w:cs'), 'Arial')
def rtl(p):
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT; pPr = p._p.get_or_add_pPr(); b = pPr.makeelement(qn('w:bidi'), {}); pPr.append(b)
    for r in p.runs: r._r.get_or_add_rPr().append(r._r.get_or_add_rPr().makeelement(qn('w:rtl'), {}))
    return p
def P(t, bold=False, color=None, size=None, style=None):
    p = doc.add_paragraph(style=style) if style else doc.add_paragraph(); r = p.add_run(t); r.bold = bold
    if color: r.font.color.rgb = RGBColor(*color)
    if size: r.font.size = Pt(size)
    return rtl(p)
def H(t, l): return rtl(doc.add_heading(t, level=l))
N = [0]
def box():
    P('ملاحظة المراجع: ☐ معتمد   ☐ يحتاج تعديل: ..............................................', color=(150, 110, 40), size=10)
def lesson(l, src):
    N[0] += 1; H(f'{N[0]}. {l["t"]}', 3)
    P('الفكرة: ' + l['idea'])
    for x in l.get('rules', []): P('• ' + x)
    for e in l.get('ex', []): P('مثال: ' + ' — '.join(e), color=(14, 74, 58))
    for q in l.get('q', []): P(f'سؤال: {q[0]} {" / ".join(q[1])} ← الصحيح: {q[1][q[2]]}' + (f' ({q[3]})' if len(q) > 3 and q[3] else ''), size=10)
    if l.get('r'): P('الإحالات: ' + ' ؛ '.join(f'{r[1]}: {r[2]}' for r in l['r']), size=9, color=(100, 100, 100))
    box()
H('زاد الأسرة المسلمة — ملف المراجعة الشرعية للدروس', 0)
P('يضم هذا الملف كل الدروس التي صيغت داخل التطبيق (لا نصوص الكتب نفسها). الأدلة منسوبة إلى كتب المكتبة. نرجو من المراجع وضع علامة على كل درس، وكتابة التصويب بجانبه، ثم إعادته لصاحب التطبيق.')
W = J('data/wajib.js'); U = dict(W['units'] if False else [(u[0], u) for u in W['units']])
H('أولاً: ما لا يسع المسلم جهله', 1)
for u, ic, name in W['units']:
    H(f'{ic} {name}', 2)
    for x in [i for i in W['items'] if i['u'] == u]:
        N[0] += 1; H(f'{N[0]}. {x["t"]}', 3); P(x['b'])
        for e in x.get('ev', []): P(f'الدليل: {e["t"]} ({e.get("ref", "")})', color=(14, 74, 58))
        if x.get('q'): q = x['q']; P(f'سؤال: {q[0]} {" / ".join(q[1])} ← الصحيح: {q[1][q[2]]}', size=10)
        box()
US = J('data/usul.js')['tracks']
H('ثانياً: أصول العلوم والمسارات الشرعية', 1)
for k, t in US.items():
    H(f'{t["ic"]} {t["t"]}', 2); P(t['d'], size=10)
    for l in t['lessons']: lesson(l, k)
DW = J('data/dawah.js')
H('ثالثاً: الدعوة إلى الله', 1)
for p in DW['parts']:
    H(f'{p["ic"]} {p["name"]}', 2)
    for t in p['topics']:
        N[0] += 1; H(f'{N[0]}. {t["t"]}', 3)
        if t.get('intro'): P(t['intro'])
        for pt in t.get('points', []):
            P('• ' + pt.get('t', '') + ': ' + pt.get('d', ''), bold=False)
            for e in pt.get('ev', []): P(f'   الدليل: {e.get("t", "")} ({e.get("ref", "")})', size=10, color=(14, 74, 58))
        box()
G = J('data/lugha.js')
H('رابعاً: علوم العربية', 1)
H('📘 النحو', 2)
for l in G['lessons']: lesson(l, 'nahw')
for k, t in G['tracks'].items():
    H(f'{t["ic"]} {t["t"]}', 2)
    for l in t['lessons']: lesson(l, k)
doc.save(sys.argv[1]); print(N[0])
