"""كتب علوم العربية (النحو والصرف والبلاغة والإعراب والعروض واللغة) من OpenITI.
الاستخدام: python3 -I build_lugha_books.py <texts dir> <out data dir>"""
import json, re, sys, os, hashlib
TXT, OUT = sys.argv[1:3]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_books.py'), encoding='utf-8').read()
exec(src[src.index('SURAHS = ['):src.index('# ---------- الشروح المرقمة')])
# (ملف، معرّف، العنوان، المؤلف، العلم)
BOOKS = [
 ('0723IbnAjrum.Ajrumiyya.Shamela0011371-ara1', 'ajurrumiyya', 'متن الآجرومية', 'ابن آجروم (ت ٧٢٣هـ)', 'nahw'),
 ('1304Dahlan.SharhAjrumiyya.ShamAY0037050-ara1', 'sharh-ajurrumiyya', 'شرح الآجرومية', 'أحمد زيني دحلان (ت ١٣٠٤هـ)', 'nahw'),
 ('0516IbnCaliHariri.MulhatIcrab.Shamela0007840-ara1', 'mulhat-irab', 'ملحة الإعراب', 'الحريري (ت ٥١٦هـ)', 'nahw'),
 ('0761JamalDinIbnHisham.MatnQatrNada.Shamela0011376-ara1', 'qatr-nada', 'قطر الندى وبل الصدى (المتن)', 'ابن هشام الأنصاري (ت ٧٦١هـ)', 'nahw'),
 ('0761JamalDinIbnHisham.SharhQatrNada.Shamela0006970-ara1', 'sharh-qatr', 'شرح قطر الندى', 'ابن هشام الأنصاري (ت ٧٦١هـ)', 'nahw'),
 ('0761JamalDinIbnHisham.MatnShudhurDhahab.Shamela0096770-ara1', 'shudhur', 'شذور الذهب (المتن)', 'ابن هشام الأنصاري (ت ٧٦١هـ)', 'nahw'),
 ('0761JamalDinIbnHisham.SharhShudhurDhahab.Shamela0006969-ara1', 'sharh-shudhur', 'شرح شذور الذهب', 'ابن هشام الأنصاري (ت ٧٦١هـ)', 'nahw'),
 ('0672IbnMalik.Alfiyya.Shamela0008522-ara1', 'alfiyya', 'ألفية ابن مالك', 'ابن مالك (ت ٦٧٢هـ)', 'nahw'),
 ('0769IbnCaqilBahaDinMisri.SharhCalaAlfiyya.Shamela0009904-ara1', 'ibn-aqil', 'شرح ابن عقيل على ألفية ابن مالك', 'ابن عقيل (ت ٧٦٩هـ)', 'nahw'),
 ('0761JamalDinIbnHisham.AwdahMasalik.Shamela0011825-ara1', 'awdah-masalik', 'أوضح المسالك إلى ألفية ابن مالك', 'ابن هشام الأنصاري (ت ٧٦١هـ)', 'nahw'),
 ('0672IbnMalik.NazmLamiyyatAfcal.ShamAY0037033-ara1', 'lamiyyat-afal', 'لامية الأفعال', 'ابن مالك (ت ٦٧٢هـ)', 'sarf'),
 ('0646IbnCumarIbnHajibKurdi.ShafiyaFiCilmTasrif.Shamela0022391-ara1', 'shafiya', 'الشافية في علم التصريف', 'ابن الحاجب (ت ٦٤٦هـ)', 'sarf'),
 ('0686RadiDinAstarabadhi.SharhShafiyaIbnHajib.Shamela0021567-ara1', 'sharh-shafiya', 'شرح الشافية', 'الرضي الأستراباذي (ت ٦٨٦هـ)', 'sarf'),
 ('0338AbuJacfarNahhas.IcrabQuran.Shamela0023587-ara1', 'irab-nahhas', 'إعراب القرآن', 'أبو جعفر النحاس (ت ٣٣٨هـ)', 'irab'),
 ('0437MakkiIbnHammushQaysi.MushkilIcrabQuran.Shamela0005538-ara1', 'mushkil-irab', 'مشكل إعراب القرآن', 'مكي بن أبي طالب (ت ٤٣٧هـ)', 'irab'),
 ('0739JalalDinQazwini.TalkhisMiftah.Shamela0042822BK1-ara1.completed', 'talkhis-miftah', 'تلخيص المفتاح في علوم البلاغة', 'الخطيب القزويني (ت ٧٣٩هـ)', 'balagha'),
 ('0471CabdQahirJurjani.DalailIcjaz.Shamela0012055-ara1', 'dalail-ijaz', 'دلائل الإعجاز', 'عبد القاهر الجرجاني (ت ٤٧١هـ)', 'balagha'),
 ('0471CabdQahirJurjani.AsrarBalagha.Shamela0008187-ara1', 'asrar-balagha', 'أسرار البلاغة', 'عبد القاهر الجرجاني (ت ٤٧١هـ)', 'balagha'),
 ('1362AhmadHashimi.JawahirBalagha.Hindawi085925824-ara1', 'jawahir-balagha', 'جواهر البلاغة في المعاني والبيان والبديع', 'أحمد الهاشمي (ت ١٣٦٢هـ)', 'balagha'),
 ('1362AhmadHashimi.MizanDhahab.Hindawi050259706-ara1', 'mizan-dhahab', 'ميزان الذهب في صناعة شعر العرب (العروض)', 'أحمد الهاشمي (ت ١٣٦٢هـ)', 'arud'),
 ('0395AbuHilalCaskari.FuruqLughawiyya.Shamela0001736-ara1', 'furuq-lughawiyya', 'الفروق اللغوية', 'أبو هلال العسكري (ت ٣٩٥هـ)', 'lugha'),
]
def fix(t):
    t = re.sub(r'\b(AUTO|CHECK)\b', '', (t or '').replace('\u200f', '')); t = re.sub(r'^[\s|\[]+', '', t); t = re.sub(r'\s*\n\s*', ' — ', t)
    return re.sub(r'\s+', ' ', t).strip(' ]|')
SUR = {}
def by_ayah(bid, p):
    # إعراب النحاس مرتب على الآيات: «[سورة البقرة (2) : الآيات 3 الى 4]» → عنصر لكل موضع
    raw = open(p, encoding='utf-8').read().split('#META#Header#End#', 1)[-1]
    raw = re.sub(r'PageV\d+P\d+', ' ', raw); raw = re.sub(r'\bms\d+\b', '', raw); raw = re.sub(r'\n~~', ' ', raw)
    parts = re.split(r'\[سورة ([^(\]]+)\((\d+)\)\s*:\s*(?:آية|الآيات|الآية)\s*(\d+)(?:\s*(?:الى|إلى)\s*(\d+))?\s*\]', raw)
    items = []; idx = {}
    for i in range(1, len(parts) - 4, 5):
        name, sn, a1, a2, body = parts[i].strip(), int(parts[i + 1]), int(parts[i + 2]), parts[i + 3], parts[i + 4]
        a2 = int(a2) if a2 else a1
        body = re.sub(r'(?m)^#+\s*\|?\s*', '', body); body = re.sub(r'[ \t]+', ' ', body).strip()
        iid = f'{bid}:{sn}:{a1}'
        if any(x['id'] == iid for x in items[-3:]): continue
        items.append({'id': iid, 'bookId': bid, 'type': 'section', 'seq': len(items) + 1, 'chapter': 'سورة ' + name, 'title': f'سورة {name}: ' + (f'الآية {a1}' if a1 == a2 else f'الآيات {a1}–{a2}'), 'page': '', 'text': body})
        idx.setdefault(sn, []).append([a1, a2])
    SUR[bid] = idx
    return items
manifest = []
for fn, bid, title, author, ilm in BOOKS:
    p = os.path.join(TXT, fn); md = meta(p)
    items = by_ayah(bid, p) if bid == 'irab-nahhas' else sections(bid, parse(p))
    for it in items: it['chapter'] = fix(it['chapter']); it['title'] = fix(it['title'])
    book = {'id': bid, 'title': title, 'type': 'lughabook', 'ilm': ilm, 'author': author, 'source': 'المكتبة الشاملة / هنداوي عبر مشروع OpenITI', 'edition': md['publisher'], 'optional': True}
    size = write_pack('book-' + bid, book, items)
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': title, 'author': author, 'count': len(items), 'size': size, 'version': book['packVersion'], 'optional': True, 'type': 'lughabook', 'ilm': ilm})
    print(bid, len(items), round(size / 1e6, 2), [i['title'][:30] for i in items[:4]])
json.dump(manifest, open('/tmp/_lugha_manifest.json', 'w'), ensure_ascii=False, indent=1)
open(os.path.join(OUT, 'irab-index.js'), 'w').write('window.IRAB_IDX=' + json.dumps(SUR, separators=(',', ':')) + ';\n')
