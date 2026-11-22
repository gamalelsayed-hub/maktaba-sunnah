"""كتب التاريخ والأدب ودواوين الشعر من OpenITI (المكتبة الشاملة والموسوعة الشعرية).
الاستخدام: python3 -I build_tarikh_adab.py <texts dir> <out data dir>
"""
import json, re, sys, os, hashlib
TXT, OUT = sys.argv[1:3]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_books.py'), encoding='utf-8').read()
exec(src[src.index('SURAHS = ['):src.index('# ---------- الشروح المرقمة')])

# (ملف، معرّف، العنوان، المؤلف، النوع)
BOOKS = [
    ('0310Tabari.Tarikh.ShamAY0033812-ara2', 'tarikh-tabari', 'تاريخ الرسل والملوك (تاريخ الطبري)', 'محمد بن جرير الطبري (ت ٣١٠هـ)', 'tarikhbook'),
    ('0630IbnAthirCizzDin.Kamil.Shamela0021712-ara2', 'kamil-athir', 'الكامل في التاريخ', 'عز الدين ابن الأثير (ت ٦٣٠هـ)', 'tarikhbook'),
    ('0732AbuFida.MukhtasarFiAkhbar.JK010358-ara1', 'mukhtasar-fida', 'المختصر في أخبار البشر', 'أبو الفداء (ت ٧٣٢هـ)', 'tarikhbook'),
    ('0808IbnKhaldun.Tarikh.ShamAY0033819-ara1', 'tarikh-khaldun', 'تاريخ ابن خلدون (ديوان المبتدأ والخبر) ومقدمته', 'عبد الرحمن ابن خلدون (ت ٨٠٨هـ)', 'tarikhbook'),
    ('0911Suyuti.TarikhKhulafa.Shamela0011997-ara1.completed', 'tarikh-khulafa', 'تاريخ الخلفاء', 'جلال الدين السيوطي (ت ٩١١هـ)', 'tarikhbook'),
    ('1237Jabarti.CajaibAthar.Shamela0011998-ara1', 'jabarti', 'عجائب الآثار في التراجم والأخبار (تاريخ الجبرتي)', 'عبد الرحمن الجبرتي (ت ١٢٣٧هـ)', 'tarikhbook'),
    ('1338MuhammadFaridBey.Tarikh.Shamela0006638-ara1.completed', 'dawla-aliyya', 'تاريخ الدولة العلية العثمانية', 'محمد فريد بك المحامي (ت ١٣٣٨هـ)', 'tarikhbook'),
    ('0231IbnSallamJumahi.TabaqatFuhulShucara.Shamela0006738-ara1', 'tabaqat-shuara', 'طبقات فحول الشعراء', 'محمد بن سلام الجمحي (ت ٢٣١هـ)', 'adabbook'),
    ('0276IbnQutaybaDinawari.ShicrWaShucara.Shamela0023785-ara1.mARkdown', 'shir-shuara', 'الشعر والشعراء', 'ابن قتيبة الدينوري (ت ٢٧٦هـ)', 'adabbook'),
    ('0486IbnAhmadZuzani.SharhMucallaqat.Shamela0011253-ara1', 'muallaqat', 'شرح المعلقات السبع', 'الزوزني (ت ٤٨٦هـ)', 'adabbook'),
    ('0468IbnAhmadWahidiNaysaburi.SharhDiwanMutanabbi.Shamela0000754-ara1', 'sharh-mutanabbi', 'شرح ديوان المتنبي', 'الواحدي (ت ٤٦٨هـ)', 'adabbook'),
    ('0328IbnCabdRabbih.CiqdFarid.Shamela0023789-ara1.completed', 'iqd-farid', 'العقد الفريد', 'ابن عبد ربه الأندلسي (ت ٣٢٨هـ)', 'adabbook'),
    ('0255Jahiz.BayanWaTabyin.Shamela0010614-ara1.completed', 'bayan-tabyin', 'البيان والتبيين', 'الجاحظ (ت ٢٥٥هـ)', 'adabbook'),
    ('0285IbnYazidMubarrad.KamilFiLugha.Shamela0008505-ara1.mARkdown', 'kamil-mubarrad', 'الكامل في اللغة والأدب', 'المبرّد (ت ٢٨٥هـ)', 'adabbook'),
    ('1356MustafaSadiqRafici.TarikhAdabCarab.Shamela0010548-ara1', 'adab-rafii', 'تاريخ آداب العرب', 'مصطفى صادق الرافعي (ت ١٣٥٦هـ)', 'adabbook'),
]
# (ملف، معرّف، الشاعر، العصر، الوفاة، نبذة)
DIWANS = [
    ('0001ZuhayrIbnAbiSulma.Diwan.ShamAY0037933-ara1', 'diwan-zuhayr', 'زهير بن أبي سلمى', 'jahili', 'نحو ١٣ ق.هـ', 'حكيم شعراء الجاهلية، صاحب المعلقة، اشتهر بالحكمة والدعوة إلى السلم.'),
    ('0001NabighaDhubyani.Diwan.ShamAY0037896-ara1', 'diwan-nabigha', 'النابغة الذبياني', 'jahili', 'نحو ١٨ ق.هـ', 'من فحول الطبقة الأولى، كانت تُضرب له قبة في سوق عكاظ يحكم بين الشعراء، واشتهر باعتذارياته.'),
    ('0001TarafaIbnCabd.Diwan.Shamela0036422-ara1', 'diwan-tarafa', 'طرفة بن العبد', 'jahili', 'نحو ٦٠ ق.هـ', 'صاحب المعلقة الدالية، قُتل شاباً.'),
    ('0001HatimTai.Diwan.ShamAY0037913-ara1', 'diwan-hatim', 'حاتم الطائي', 'jahili', 'نحو ٤٦ ق.هـ', 'المضروب به المثل في الكرم، وابنه عدي صحابي.'),
    ('0001SamawalIbnCadiya.Diwan.ShamAY0037887-ara1', 'diwan-samawal', 'السموأل', 'jahili', 'نحو ٦٥ ق.هـ', 'المضروب به المثل في الوفاء، صاحب اللامية: «إذا المرء لم يدنس من اللؤم عرضه».'),
    ('0001Shanfara.Diwan.ShamAY0037893-ara1', 'diwan-shanfara', 'الشنفرى', 'jahili', 'نحو ٧٠ ق.هـ', 'صاحب «لامية العرب».'),
    ('0001CamrIbnKulthum.Diwan.ShamAY0037904-ara1', 'diwan-amr-kulthum', 'عمرو بن كلثوم', 'jahili', 'نحو ٤٠ ق.هـ', 'سيد تغلب وصاحب المعلقة.'),
    ('0007MaymunIbnQaysAcsha.Diwan.JK007503-ara1.completed', 'diwan-asha', 'الأعشى ميمون بن قيس', 'jahili', '٧هـ', 'من أصحاب المعلقات، أدرك الإسلام ولم يُسلم.'),
    ('0041LabidIbnRabica.Diwan.Shamela0035077-ara1', 'diwan-labid', 'لبيد بن ربيعة', 'mukhadram', '٤١هـ', 'صحابي وصاحب معلقة، قال النبي ﷺ: «أصدق كلمة قالها شاعر كلمة لبيد: ألا كل شيء ما خلا الله باطل».'),
    ('0024TumadirBinCamrKhansa.Diwan.ShamAY0037828-ara1', 'diwan-khansa', 'الخنساء', 'mukhadram', '٢٤هـ', 'صحابية، أشعر النساء، اشتهرت برثاء أخيها صخر، واستشهد أبناؤها الأربعة في القادسية.'),
    ('0026KacbIbnZuhayr.Diwan.ShamAY0037833-ara1', 'diwan-kaab', 'كعب بن زهير', 'mukhadram', '٢٦هـ', 'صحابي، صاحب «بانت سعاد» التي أنشدها بين يدي النبي ﷺ.'),
    ('0054HassanIbnThabit.Diwan.ShamAY0037912-ara1', 'diwan-hassan', 'حسان بن ثابت', 'mukhadram', '٥٤هـ', 'شاعر رسول الله ﷺ، المنافح عنه بشعره.'),
    ('0110JarirShacir.Diwan.ShamAY0037926-ara1', 'diwan-jarir', 'جرير', 'umawi', '١١٠هـ', 'من فحول العصر الأموي، اشتهر بنقائضه مع الفرزدق.'),
    ('0110Farazdaq.Diwan.ShamAY0037829-ara1', 'diwan-farazdaq', 'الفرزدق', 'umawi', '١١٠هـ', 'من فحول العصر الأموي، صاحب الفخر والنقائض.'),
    ('0204Shafici.Diwan.ShamAY0037916-ara1', 'diwan-shafii', 'الإمام الشافعي', 'abbasi', '٢٠٤هـ', 'الإمام الفقيه، له شعر في الحكمة والزهد والأدب.'),
    ('0211AbuCatahiya.Diwan.ShamAY0037815-ara1', 'diwan-atahiya', 'أبو العتاهية', 'abbasi', '٢١١هـ', 'شاعر الزهد والموعظة.'),
    ('0231AbuTamam.Diwan.ShamAY0037821-ara1', 'diwan-abutammam', 'أبو تمام', 'abbasi', '٢٣١هـ', 'صاحب «السيف أصدق إنباء من الكتب» في فتح عمورية.'),
    ('0284Buhturi.Diwan.ShamAY0037844-ara1', 'diwan-buhturi', 'البحتري', 'abbasi', '٢٨٤هـ', 'من أشهر شعراء العصر العباسي، اشتهر بالوصف.'),
    ('0354Mutanabbi.Diwan.ShamAY0037830-ara1', 'diwan-mutanabbi', 'المتنبي (مختارات)', 'abbasi', '٣٥٤هـ', 'أشهر شعراء العربية وأكثرهم حكمة سائرة. الديوان كاملاً مع الشرح في «شرح ديوان المتنبي» للواحدي.'),
    ('0357AbuFirasHamdani.Diwan.ShamAY0037823-ara1', 'diwan-abufiras', 'أبو فراس الحمداني', 'abbasi', '٣٥٧هـ', 'الأمير الفارس، صاحب «الروميات» في أسره.'),
    ('0406SharifRadi.Diwan.ShamAY0037890-ara1', 'diwan-radi', 'الشريف الرضي', 'abbasi', '٤٠٦هـ', 'من كبار شعراء العصر العباسي.'),
    ('0449AbuCalaMacarri.Diwan.ShamAY0037816-ara1', 'diwan-maarri', 'أبو العلاء المعري', 'abbasi', '٤٤٩هـ', 'الشاعر الفيلسوف. في شعره حكمة كثيرة، وفيه أبيات انتقدها العلماء في الاعتقاد، فليُقرأ بتمييز.'),
    ('0463IbnZaydun.Diwan.ShamAY0037870-ara1', 'diwan-zaydun', 'ابن زيدون', 'andalusi', '٤٦٣هـ', 'أشهر شعراء الأندلس.'),
    ('0750SafiDinHilli.Diwan.ShamAY0037951-ara1', 'diwan-hilli', 'صفي الدين الحلي', 'mamluki', '٧٥٠هـ', 'أبرز شعراء العصر المملوكي.'),
    ('1332MahmudSamiBarudi.Diwan.ShamAY0037857-ara1', 'diwan-barudi', 'محمود سامي البارودي', 'hadith', '١٣٢٢هـ (١٩٠٤م)', 'رائد مدرسة الإحياء في الشعر الحديث.'),
]
ERA = {'jahili': 'العصر الجاهلي', 'mukhadram': 'المخضرمون وصدر الإسلام', 'umawi': 'العصر الأموي', 'abbasi': 'العصر العباسي', 'andalusi': 'الأندلس', 'mamluki': 'العصر المملوكي', 'hadith': 'العصر الحديث'}

def clean(s):
    s = re.sub(r'PageV\d+P\d+', ' ', s); s = re.sub(r'\bms\d+\b', '', s)
    return re.sub(r'\s+', ' ', s).strip(' #')

def poems(path):
    """دواوين الموسوعة الشعرية: كل قصيدة تبدأ بسطر «البحر :»، والبيت «صدر %~% عجز»"""
    raw = open(path, encoding='utf-8').read().split('#META#Header#End#', 1)[-1]
    raw = re.sub(r'\n~~', ' ', raw)
    out, cur = [], None
    for line in raw.split('\n'):
        m = re.search(r'البحر\s*:\s*([^#%]*)', line)
        if m and '%~%' not in line.split('البحر')[0]:
            bh = m[1]; rest = line[m.end():]
            if '(' in bh: bh, first = bh.split('(', 1); rest = first + rest
            cur = {'bahr': clean(bh).strip(' -'), 'v': []}; out.append(cur)
            line = rest
        if '%~%' in line:
            a, b = line.split('%~%', 1)
            a = re.sub(r'^\s*#\s*(\d+\s+)?', '', clean(a)); b = clean(b)
            a = re.sub(r'البحر.*$', '', a).strip(); b = re.sub(r'البحر.*$', '', b).strip()
            if cur is None: cur = {'bahr': '', 'v': []}; out.append(cur)
            if a or b: cur['v'].append(a + ' … ' + b)
    return [p for p in out if p['v']]

def maarri(path):
    raw = open(path, encoding='utf-8').read().split('#META#Header#End#', 1)[-1]
    raw = re.sub(r'\n~~', ' ', raw)
    out, cur, half = [], None, None
    for line in raw.split('\n'):
        if 'عنوان القصيدة' in line:
            cur = {'bahr': '', 'v': []}; out.append(cur); half = None; continue
        if line.startswith('###') or cur is None: continue
        t = clean(line)
        if not t or '¶' in t: continue
        if half is None: half = t
        else: cur['v'].append(half + ' … ' + t); half = None
    return [p for p in out if p['v']]

files = os.listdir(TXT); manifest = []
def fix(t):
    t = re.sub(r'\b(AUTO|CHECK)\b', '', t or ''); t = re.sub(r'^[\s|\[]+', '', t); t = re.sub(r'\s*\n\s*', ' — ', t)
    return re.sub(r'\s+', ' ', t).strip(' ]|')
def emit(bid, book, items):
    for it in items:
        it['chapter'] = fix(it['chapter']); it['title'] = fix(it['title'])
        if re.match(r'^(الجزء|جزء|مقدمة)\s*\d*\s*(\(\d+\))?$', it['title']) and it['text']:
            m = re.search(r'(الخبر عن [^.،:\n]{5,60}|الفصل [^.،:\n]{5,60}|ذكر [^.،:\n]{5,50})', it['text'])
            if m: first = m[1].strip()
            else:
                t = it['text'].lstrip('# '); t = t[t.find(' ') + 1:] if not re.match(r'\S+\s', t[:3]) else t
                first = '… ' + re.split(r'[.:،\n]', t, maxsplit=1)[0].strip()[:70]
            it['title'] = (first or it['title'])
        if re.match(r'^(الجزء|جزء)\s*\d+$', it['chapter']): it['chapter'] = it['chapter'].replace('جزء', 'الجزء').replace('الالجزء', 'الجزء')
    size = write_pack('book-' + bid, book, items)
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': book['title'], 'author': book['author'], 'count': len(items), 'size': size, 'version': book['packVersion'], 'optional': True, 'type': book['type']})
    print(bid, len(items), round(size / 1e6, 2), 'MB')

for fn, bid, title, author, typ in BOOKS:
    p = os.path.join(TXT, fn); md = meta(p)
    items = sections(bid, parse(p))
    emit(bid, {'id': bid, 'title': title, 'type': typ, 'author': author, 'source': 'المكتبة الشاملة عبر مشروع OpenITI', 'edition': md['publisher'], 'optional': True}, items)

poets = []
for fn, bid, name, era, death, bio in DIWANS:
    p = os.path.join(TXT, fn)
    if 'Macarri' in fn: ps = maarri(p)
    elif fn.startswith(('0001Tarafa', '0041Labid', '0054Hassan')): ps = None
    else: ps = poems(p)
    if ps is None:
        items = sections(bid, parse(p))
        for it in items: it['type'] = 'poem'
    else:
        items = [{'id': f'{bid}:{i + 1}', 'bookId': bid, 'type': 'poem', 'seq': i + 1, 'chapter': ('البحر: ' + q['bahr']) if q['bahr'] else 'قصائد', 'title': q['v'][0].split(' … ')[0][:120], 'page': '', 'text': '\n'.join(q['v'])} for i, q in enumerate(ps)]
    nv = sum(it['text'].count('\n') + 1 for it in items)
    emit(bid, {'id': bid, 'title': 'ديوان ' + name, 'type': 'diwan', 'author': name + ' (ت ' + death + ')', 'source': 'الموسوعة الشعرية / المكتبة الشاملة عبر مشروع OpenITI', 'optional': True, 'era': era}, items)
    poets.append({'id': bid, 'name': name, 'era': era, 'death': death, 'bio': bio, 'poems': len(items), 'verses': nv})
json.dump({'manifest': manifest, 'poets': poets, 'eras': ERA}, open('/tmp/_tarikh_adab.json', 'w'), ensure_ascii=False, indent=1)
