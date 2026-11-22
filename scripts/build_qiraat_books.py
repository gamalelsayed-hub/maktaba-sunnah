"""كتب القراءات والتجويد من OpenITI (المكتبة الشاملة): المتون بيتاً بيتاً مع ربط كل بيت بموضعه في شروحه، والشروح مقسمة على أبوابها.
الاستخدام: python3 -I build_qiraat_books.py <texts dir> <out data dir>
"""
import json, re, sys, os, hashlib
TXT, OUT = sys.argv[1:3]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_books.py'), encoding='utf-8').read()
start = src.index('SURAHS = ['); end = src.index('# ---------- الشروح المرقمة')
exec(src[start:end])  # norm, parse, meta, write_pack, clean_head, sections

def bayts(blocks):
    out, chap = [], 'المقدمة'
    for kind, lvl, text, pg in blocks:
        if kind == 'h':
            h = re.sub(r'^\$?\s*\d+\s*-\s*', '', text.strip()); h = re.sub(r'\s+\d+\s*$', '', h).strip(' -|$')
            if h and not re.fullmatch(r'[\d\s\-]*', h): chap = clean_head(h) or chap
            continue
        t = re.sub(r'\(\d+\)', '', text); t = re.sub(r'\bms\d+\b', '', t)
        if ' ... ' in t or '…' in t:
            a, b = re.split(r'\s*(?:\.\.\.|…)\s*', t, maxsplit=1)
            out.append({'chapter': chap, 'a': a.strip(), 'b': b.strip(), 'page': pg})
    return out

NS = {}
def find_in(items, hemi):
    k = nospace(hemi)[:28]
    if len(k) < 10: return None
    key = id(items)
    if key not in NS: NS[key] = [(it['id'], nospace(it.get('title', '')) + ' ' + nospace(it['text'])) for it in items]
    for i, t in NS[key]:
        if k in t: return i
    return None

MUTUN = [  # (ملف، معرف، عنوان، مؤلف، الشروح المرتبطة)
    ('0590IbnFirruhShatibi.HirzAmani', 'shatibiyya', 'الشاطبية (حرز الأماني ووجه التهاني) — القراءات السبع', 'القاسم بن فيره الشاطبي (ت ٥٩٠هـ)', ['ibraz', 'siraj']),
    ('0833IbnJazari.DurraMudiyya', 'durra', 'الدرة المضية في القراءات الثلاث المتممة للعشر', 'ابن الجزري (ت ٨٣٣هـ)', []),
    ('0833IbnJazari.MatnTayyibatNashr', 'tayyiba', 'طيبة النشر في القراءات العشر', 'ابن الجزري (ت ٨٣٣هـ)', ['sharh-tayyiba-nazim', 'sharh-tayyiba-nuwayri']),
    ('0833IbnJazari.ManzumaJazariyya', 'jazariyya', 'المقدمة الجزرية (فيما على قارئ القرآن أن يعلمه)', 'ابن الجزري (ت ٨٣٣هـ)', ['tamhid']),
    ('1208SulaymanJamzuriAffandi.TuhfatAtfal', 'tuhfa', 'تحفة الأطفال والغلمان في تجويد القرآن', 'سليمان الجمزوري (ت بعد ١١٩٨هـ)', []),
]
SHURUH = [
    ('0665AbuShama.IbrazMacani', 'ibraz', 'إبراز المعاني من حرز الأماني (شرح الشاطبية)', 'أبو شامة المقدسي (ت ٦٦٥هـ)'),
    ('0801IbnCuthmanIbnQasihBaghdadiCudhri.SirajQari', 'siraj', 'سراج القارئ المبتدي (شرح الشاطبية)', 'ابن القاصح (ت ٨٠١هـ)'),
    ('0835ShihabDinIbnJazari.SharhTayyibatNashr', 'sharh-tayyiba-nazim', 'شرح طيبة النشر', 'ابن الناظم: أحمد بن محمد بن الجزري (ت ٨٣٥هـ)'),
    ('0857MuhibbDinNuwayri.SharhTayyibatNashr', 'sharh-tayyiba-nuwayri', 'شرح طيبة النشر', 'محب الدين النويري (ت ٨٥٧هـ)'),
    ('0833IbnJazari.TamhidFiCulumTajwid', 'tamhid', 'التمهيد في علم التجويد', 'ابن الجزري (ت ٨٣٣هـ)'),
    ('0833IbnJazari.Nashr', 'nashr', 'النشر في القراءات العشر', 'ابن الجزري (ت ٨٣٣هـ)'),
]
files = os.listdir(TXT); manifest = []; SH = {}
def fpath(stem): return os.path.join(TXT, next(f for f in files if f.startswith(stem + '.')))
for stem, bid, title, author in SHURUH:
    p = fpath(stem); items = sections(bid, parse(p)); SH[bid] = items
    md = meta(p)
    book = {'id': bid, 'title': title, 'type': 'qiraatbook', 'author': author, 'source': 'المكتبة الشاملة (' + md['shamela'].replace('Shamela_', 'رقم ').lstrip('0') + ') عبر مشروع OpenITI', 'edition': md['publisher'], 'optional': True}
    size = write_pack('book-' + bid, book, items)
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': title, 'author': author, 'count': len(items), 'size': size, 'version': book['packVersion'], 'optional': True, 'type': 'qiraatbook'})
    print(bid, len(items), round(size / 1e6, 2), 'MB')
MUTUN_OUT = {}
for stem, bid, title, author, shr in MUTUN:
    p = fpath(stem); bs = bayts(parse(p)); items = []
    linked = 0
    for i, b in enumerate(bs, 1):
        it = {'id': f'{bid}:{i}', 'bookId': bid, 'type': 'bayt', 'num': i, 'seq': i, 'chapter': b['chapter'], 'title': f'البيت {i}', 'page': b['page'], 'text': b['a'] + ' ... ' + b['b'], 'a': b['a'], 'b': b['b']}
        refs = [x for x in (find_in(SH[s], b['a']) for s in shr) if x]
        if refs: it['ref'] = refs; linked += 1
        items.append(it)
    md = meta(p)
    book = {'id': bid, 'title': title, 'type': 'matn', 'author': author, 'source': 'المكتبة الشاملة (' + md['shamela'].replace('Shamela_', 'رقم ').lstrip('0') + ') عبر مشروع OpenITI', 'edition': md['publisher'], 'optional': False}
    size = write_pack('book-' + bid, book, items)
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': title, 'author': author, 'count': len(items), 'size': size, 'version': book['packVersion'], 'optional': True, 'type': 'matn'})
    print(bid, len(items), 'أبيات، مربوط بالشرح:', linked)
json.dump(manifest, open(os.path.join(OUT, '..', 'scripts', 'build-data', '_qiraat_manifest.json') if False else '/tmp/_qiraat_manifest.json', 'w'), ensure_ascii=False, indent=1)
