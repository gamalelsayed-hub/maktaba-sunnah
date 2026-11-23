"""كتب أصول العلوم (أصول الفقه، والمصطلح، وعلوم القرآن، والعقيدة، والمذاهب، والتزكية، والطب النبوي) من OpenITI.
الاستخدام: python3 -I build_usul_books.py <texts dir> <out data dir>"""
import json, re, sys, os, hashlib
TXT, OUT = sys.argv[1:3]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_books.py'), encoding='utf-8').read()
exec(src[src.index('SURAHS = ['):src.index('# ---------- الشروح المرقمة')])
# (ملف، معرّف، العنوان، المؤلف، العلم)
BOOKS = [
 ('0478ImamHaramaynJuwayni.Waraqat.Shamela0006297-ara1', 'waraqat', 'الورقات في أصول الفقه', 'إمام الحرمين الجويني (ت ٤٧٨هـ)', 'usul'),
 ('0204Shafici.Risala.Shamela0008180-ara1', 'risala-shafii', 'الرسالة', 'الإمام الشافعي (ت ٢٠٤هـ)', 'usul'),
 ('0620IbnQudamaMaqdisi.RawdatNazir.Shamela0012010-ara1', 'rawdat-nazir', 'روضة الناظر وجنة المناظر', 'ابن قدامة المقدسي (ت ٦٢٠هـ)', 'usul'),
 ('0790IbnMusaGharnatiShatibi.Muwafaqat.Shamela0011435-ara1', 'muwafaqat', 'الموافقات', 'الشاطبي (ت ٧٩٠هـ)', 'usul'),
 ('0852IbnHajarCasqalani.NukhbatFikar.Shamela0005940-ara1', 'nukhba', 'نخبة الفكر في مصطلح أهل الأثر', 'ابن حجر العسقلاني (ت ٨٥٢هـ)', 'mustalah'),
 ('0852IbnHajarCasqalani.NuzhatNazar.Shamela0012115-ara1', 'nuzhat-nazar', 'نزهة النظر في توضيح نخبة الفكر', 'ابن حجر العسقلاني (ت ٨٥٢هـ)', 'mustalah'),
 ('0643IbnSalahShahrazuri.MuqaddimatCulumHadith.Shamela0022870-ara1', 'muqaddima-ibnsalah', 'مقدمة ابن الصلاح (معرفة أنواع علوم الحديث)', 'ابن الصلاح (ت ٦٤٣هـ)', 'mustalah'),
 ('0911Suyuti.TadribRawi.Shamela0009329-ara1', 'tadrib', 'تدريب الراوي في شرح تقريب النواوي', 'السيوطي (ت ٩١١هـ)', 'mustalah'),
 ('0911Suyuti.Itqan.Shamela0011728-ara1', 'itqan', 'الإتقان في علوم القرآن', 'السيوطي (ت ٩١١هـ)', 'ulumquran'),
 ('0794BadrDinZarkashi.BurhanFiCulumQuran.Shamela0011436-ara1', 'burhan', 'البرهان في علوم القرآن', 'الزركشي (ت ٧٩٤هـ)', 'ulumquran'),
 ('0468IbnAhmadWahidiNaysaburi.AsbabNuzul.Shamela0011314-ara1', 'asbab-nuzul', 'أسباب النزول', 'الواحدي (ت ٤٦٨هـ)', 'ulumquran'),
 ('0338AbuJacfarNahhas.NasikhWaMansukh.Shamela0013073-ara1', 'nasikh-nahhas', 'الناسخ والمنسوخ', 'أبو جعفر النحاس (ت ٣٣٨هـ)', 'ulumquran'),
 ('0321Tahawi.MatnCaqida.JK000126-ara1', 'tahawiyya', 'العقيدة الطحاوية', 'أبو جعفر الطحاوي (ت ٣٢١هـ)', 'aqida'),
 ('0792SadrDinIbnAbiCizzAdhraci.SharhCaqidaTahawiyya.Shamela0008352-ara1', 'sharh-tahawiyya', 'شرح العقيدة الطحاوية', 'ابن أبي العز الحنفي (ت ٧٩٢هـ)', 'aqida'),
 ('0728IbnTaymiyya.CaqidaWasitiyya.Shamela0022665-ara1', 'wasitiyya', 'العقيدة الواسطية', 'ابن تيمية (ت ٧٢٨هـ)', 'aqida'),
 ('0620IbnQudamaMaqdisi.LumcatIctiqad.Shamela0030855-ara1', 'lumat', 'لمعة الاعتقاد', 'ابن قدامة المقدسي (ت ٦٢٠هـ)', 'aqida'),
 ('0593IbnHusaynShihabDinIsbahani.GhayaWaTaqrib.Shamela0011370-ara1', 'abushuja', 'متن أبي شجاع (الغاية والتقريب) — الشافعي', 'أبو شجاع الأصفهاني (ت ٥٩٣هـ)', 'madhhab'),
 ('0386IbnAbiZaydQayrawani.Risala.Shamela0011373-ara1', 'risala-qayrawani', 'الرسالة — المالكي', 'ابن أبي زيد القيرواني (ت ٣٨٦هـ)', 'madhhab'),
 ('0428AbuHusaynQuduri.Mukhtasar.Sham19Y0124336-ara1', 'quduri', 'مختصر القدوري — الحنفي', 'القدوري (ت ٤٢٨هـ)', 'madhhab'),
 ('0968IbnAhmadAbuNajaHajjawi.ZadMustaqnic.Shamela0011230-ara1', 'zad-mustaqni', 'زاد المستقنع — الحنبلي', 'الحجاوي (ت ٩٦٨هـ)', 'madhhab'),
 ('1051IbnYunusBuhutiHanbali.RawdMurbic.ShamAY0034262-ara1', 'rawd-murbi', 'الروض المربع شرح زاد المستقنع', 'البهوتي (ت ١٠٥١هـ)', 'madhhab'),
 ('0620IbnQudamaMaqdisi.CumdatFiqh.Shamela0011315-ara1', 'umdat-fiqh', 'عمدة الفقه — الحنبلي', 'ابن قدامة المقدسي (ت ٦٢٠هـ)', 'madhhab'),
 ('0600CabdGhaniMaqdisi.CumdatAhkam.Shamela0006075-ara1', 'umdat-ahkam', 'عمدة الأحكام من كلام خير الأنام', 'عبد الغني المقدسي (ت ٦٠٠هـ)', 'madhhab'),
 ('0751IbnQayyimJawziyya.MadarijSalikin.Shamela0008370-ara1', 'madarij', 'مدارج السالكين', 'ابن القيم (ت ٧٥١هـ)', 'tazkiya'),
 ('0751IbnQayyimJawziyya.WabilSayyib.Shamela0000216-ara1', 'wabil', 'الوابل الصيب من الكلم الطيب', 'ابن القيم (ت ٧٥١هـ)', 'tazkiya'),
 ('0689AhmadIbnCabdRahmanIbnQudama.MukhtasarMinhajQasidin.Shamela0098087-ara1', 'mukhtasar-minhaj', 'مختصر منهاج القاصدين', 'نجم الدين ابن قدامة المقدسي (ت ٦٨٩هـ)', 'tazkiya'),
 ('0751IbnQayyimJawziyya.TibbNabawi.Shamela0023649-ara1', 'tibb-nabawi', 'الطب النبوي', 'ابن القيم (ت ٧٥١هـ)', 'tibb'),
]
def fix(t):
    t = re.sub(r'\b(AUTO|CHECK)\b', '', (t or '').replace('\u200f', '')); t = re.sub(r'^[\s|\[]+', '', t); t = re.sub(r'\s*\n\s*', ' — ', t)
    return re.sub(r'\s+', ' ', t).strip(' ]|')
manifest = []
for fn, bid, title, author, ilm in BOOKS:
    p = os.path.join(TXT, fn); md = meta(p)
    items = sections(bid, parse(p))
    for it in items: it['chapter'] = fix(it['chapter']); it['title'] = fix(it['title'])
    book = {'id': bid, 'title': title, 'type': 'usulbook', 'ilm': ilm, 'author': author, 'source': 'المكتبة الشاملة / هنداوي عبر مشروع OpenITI', 'edition': md['publisher'], 'optional': True}
    size = write_pack('book-' + bid, book, items)
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': title, 'author': author, 'count': len(items), 'size': size, 'version': book['packVersion'], 'optional': True, 'type': 'usulbook', 'ilm': ilm})
    print(bid, len(items), round(size / 1e6, 2), [i['title'][:30] for i in items[:4]])
json.dump(manifest, open('/tmp/_usul_manifest.json', 'w'), ensure_ascii=False, indent=1)
