"""كتب الدعوة ومقارنة الأديان وأدلة وجود الله من OpenITI (المكتبة الشاملة)، مقسمة على أبوابها وفصولها.
الاستخدام: python3 -I build_dawah_books.py <texts dir> <out data dir>
"""
import json, re, sys, os, hashlib
TXT, OUT = sys.argv[1:3]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_books.py'), encoding='utf-8').read()
exec(src[src.index('SURAHS = ['):src.index('# ---------- الشروح المرقمة')])
BOOKS = [
    ('0728IbnTaymiyya.JawabSahih', 'jawab-sahih', 'الجواب الصحيح لمن بدّل دين المسيح', 'ابن تيمية (ت ٧٢٨هـ)'),
    ('0751IbnQayyimJawziyya.HidayatHayara', 'hidayat-hayara', 'هداية الحيارى في أجوبة اليهود والنصارى', 'ابن قيم الجوزية (ت ٧٥١هـ)'),
    ('1308IbnKhalilHindiCuthmani.IzharHaqq', 'izhar-haqq', 'إظهار الحق', 'رحمة الله الهندي (ت ١٣٠٨هـ)'),
    ('0456IbnHazm.FisalFiMilal', 'fisal', 'الفِصَل في الملل والأهواء والنحل', 'ابن حزم (ت ٤٥٦هـ)'),
    ('0548Shahrastani.MilalWaNihal', 'milal', 'الملل والنحل', 'الشهرستاني (ت ٥٤٨هـ)'),
    ('0570IbnYahyaSamawalMaghribi.IfhamYahud', 'ifham-yahud', 'بذل المجهود في إفحام اليهود', 'السموأل المغربي (ت ٥٧٠هـ)، وكان يهودياً فأسلم'),
    ('0671AbuCabdAllahQurtubi.IclamBimaFiDinNasara', 'iclam-nasara', 'الإعلام بما في دين النصارى من الفساد والأوهام', 'القرطبي (ت ٦٧١هـ)'),
    ('0255Jahiz.RaddCalaNasara', 'radd-nasara-jahiz', 'الرد على النصارى', 'الجاحظ (ت ٢٥٥هـ)'),
    ('0728IbnTaymiyya.DarTacarud', 'dar-taarud', 'درء تعارض العقل والنقل', 'ابن تيمية (ت ٧٢٨هـ)'),
    ('0751IbnQayyimJawziyya.MiftahDarSacada', 'miftah-sada', 'مفتاح دار السعادة', 'ابن قيم الجوزية (ت ٧٥١هـ)'),
    ('0751IbnQayyimJawziyya.ShifaCalil', 'shifa-alil', 'شفاء العليل في القضاء والقدر والحكمة والتعليل', 'ابن قيم الجوزية (ت ٧٥١هـ)'),
    ('0505Ghazali.Iqtisad', 'iqtisad', 'الاقتصاد في الاعتقاد', 'أبو حامد الغزالي (ت ٥٠٥هـ)'),
    ('0595IbnRushdHafid.FaslMaqal', 'fasl-maqal', 'فصل المقال فيما بين الحكمة والشريعة من الاتصال', 'ابن رشد الحفيد (ت ٥٩٥هـ)'),
    ('0728IbnTaymiyya.AmrBiMacruf', 'amr-maruf', 'الأمر بالمعروف والنهي عن المنكر', 'ابن تيمية (ت ٧٢٨هـ)'),
]
files = os.listdir(TXT); manifest = []
for stem, bid, title, author in BOOKS:
    fn = next(f for f in files if f.startswith(stem + '.')); p = os.path.join(TXT, fn)
    items = sections(bid, parse(p)); md = meta(p)
    book = {'id': bid, 'title': title, 'type': 'dawahbook', 'author': author, 'source': 'المكتبة الشاملة (' + (md['shamela'] or '').replace('Shamela_', 'رقم ').lstrip('0') + ') عبر مشروع OpenITI', 'edition': md['publisher'], 'optional': True}
    size = write_pack('book-' + bid, book, items)
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': title, 'author': author, 'count': len(items), 'size': size, 'version': book['packVersion'], 'optional': True, 'type': 'dawahbook'})
    print(bid, len(items), round(size / 1e6, 2), 'MB')
json.dump(manifest, open('/tmp/_dawah_manifest.json', 'w'), ensure_ascii=False, indent=1)
