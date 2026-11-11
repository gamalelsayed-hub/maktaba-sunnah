"""يبني المكتبة المدمجة للبرنامج من ملفات المصادر.
الاستخدام: python3 -I build_pack.py <quran.txt> <hadith-json db/by_book dir> <out data dir> [<hadith-api sqlite dir>]
- hadith-api (ملفات ara-*.sqlite): المصدر الأساسي للكتب المتوفرة فيه — ترقيم مطبوع + أحكام المحدثين.
- hadith-json: لباقي الكتب (مسند أحمد، الدارمي، رياض الصالحين، ...).
"""
import json, re, sys, os, sqlite3, hashlib

quran_txt, hadith_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
api_dir = sys.argv[4] if len(sys.argv) > 4 else None
os.makedirs(out, exist_ok=True)

TASHKEEL = re.compile(r'[ؐ-ًؚ-ٰٟۖ-ۭـ‎‏]')

def strip_with_map(s):
    """نص بلا حركات + خريطة من موضع الحرف المجرد إلى موضعه في الأصل"""
    out_chars, idx = [], []
    for i, ch in enumerate(s):
        if TASHKEEL.match(ch):
            continue
        ch = {'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ة': 'ه'}.get(ch, ch)
        out_chars.append(ch); idx.append(i)
    return ''.join(out_chars), idx

MARKERS = re.compile(r'(قال رسول الله صلي الله عليه وسلم|ان رسول الله صلي الله عليه وسلم قال|ان النبي صلي الله عليه وسلم قال|عن النبي صلي الله عليه وسلم قال|سمعت رسول الله صلي الله عليه وسلم يقول|عن رسول الله صلي الله عليه وسلم قال|قال النبي صلي الله عليه وسلم)')

def split_isnad(text):
    text = text.strip()
    q = text.find('"')
    if q > 15:
        return re.sub(r'\s+', ' ', text[:q]).strip(' :،,'), re.sub(r'\s+', ' ', text[q:]).strip()
    plain, idx = strip_with_map(text)
    m = MARKERS.search(plain)
    if m and m.end() < len(plain) - 10:
        cut = idx[m.end() - 1] + 1
        while cut < len(text) and TASHKEEL.match(text[cut]):
            cut += 1
        return re.sub(r'\s+', ' ', text[:cut]).strip(' :،,'), re.sub(r'\s+', ' ', text[cut:]).strip(' :،,')
    return '', re.sub(r'\s+', ' ', text)

def write_pack(name, book, items):
    path = os.path.join(out, name + '.js')
    body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
    book['packVersion'] = hashlib.sha1(body.encode()).hexdigest()[:12]
    body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
    with open(path, 'w', encoding='utf-8') as f:
        f.write('window.PACK=' + body + ';')
    return path, os.path.getsize(path)

# ---- ترجمة أحكام hadith-api إلى العربية ----
SCHOLARS = {'Al-Albani': 'الألباني', 'Shuaib Al Arnaut': 'شعيب الأرناؤوط', 'Zubair Ali Zai': 'زبير علي زئي',
            'Muhammad Muhyi Al-Din Abdul Hamid': 'محمد محيي الدين عبد الحميد', 'Muhammad Fouad Abd al-Baqi': 'محمد فؤاد عبد الباقي',
            'Abu Ghuddah': 'عبد الفتاح أبو غدة', 'Ahmad Muhammad Shakir': 'أحمد محمد شاكر', 'Bashar Awad Maarouf': 'بشار عواد معروف',
            'Salim al-Hilali': 'سليم الهلالي'}
WHOLE = {'Sahih - Agreed Upon': 'صحيح متفق عليه', 'Sahih - Bukhari And Muslim': 'صحيح، رواه البخاري ومسلم', 'Sahih Muslim': 'صحيح، رواه مسلم',
         'Sahih Bukhari': 'صحيح، رواه البخاري', 'Isnaad Sahih Agreed Upon': 'إسناده صحيح، متفق عليه', 'Isnaad Sahih Sahih Muslim': 'إسناده صحيح، رواه مسلم',
         'Isnaad Sahih Sahih Bukhari': 'إسناده صحيح، رواه البخاري', 'Sahih Hadith': 'حديث صحيح', '-': ''}
WORDS = {'Sahih': 'صحيح', 'Hasan': 'حسن', 'Daif': 'ضعيف', 'Lighairihi': 'لغيره', 'Mauquf': 'موقوف', 'Muquf': 'موقوف', 'Maqtu': 'مقطوع',
         'Shadh': 'شاذ', 'Munkar': 'منكر', 'Mawdu': 'موضوع', 'Mursal': 'مرسل', 'Batil': 'باطل', 'Mutawatir': 'متواتر', 'Malool': 'معلول',
         'Matn': 'المتن', 'Hadith': 'حديث', 'Very': '', 'Agreed': 'متفق', 'Upon': 'عليه', 'And': 'و', 'Mudtarib': 'مضطرب', 'Muallaq': 'معلق',
         'Jayyid': 'جيد', 'Qawi': 'قوي', 'Thabit': 'ثابت', 'Mutabaat': 'بالمتابعات', 'Shawahid': 'بالشواهد', 'Marfu': 'مرفوع', 'Gharib': 'غريب', 'Bukhari': 'البخاري', 'Muslim': 'مسلم', 'After': 'بعد'}
unknown_words = {}

def grade_ar(g):
    g = re.sub(r'\s+', ' ', (g or '').strip())
    if g in WHOLE: return WHOLE[g]
    refs = re.findall(r'Sahih (Bukhari|Muslim) \((\d+)\)', g)
    if refs:
        return 'صحيح: ' + '، '.join(('البخاري' if b == 'Bukhari' else 'مسلم') + ' (' + n + ')' for b, n in refs)
    toks = g.replace('-', ' ').split()
    out_t, very = [], 'Very' in toks
    for i, t in enumerate(toks):
        if t in ('Isnaad', 'Sanad', 'Isnad'):
            out_t.append('الإسناد' if i else 'إسناده'); continue
        if t in WORDS: out_t.append(WORDS[t])
        else: out_t.append(t); unknown_words[t] = unknown_words.get(t, 0) + 1
    r = ' '.join(x for x in out_t if x)
    if very: r = r.replace('ضعيف', 'ضعيف جداً', 1)
    if r.startswith('صحيح الإسناد'): pass
    return r.replace(' و ', ' و')

API_BOOKS = [  # (ملف, معرف, العنوان, المؤلف, ملاحظة الترقيم, حكم ضمني)
    ('ara-bukhari', 'bukhari', 'صحيح البخاري', 'محمد بن إسماعيل البخاري', 'الترقيم المطبوع المشهور (ترقيم فتح الباري)', 'البخاري'),
    ('ara-muslim', 'muslim', 'صحيح مسلم', 'مسلم بن الحجاج النيسابوري', 'ترقيم موقع sunnah.com، ويختلف عن ترقيم محمد فؤاد عبد الباقي', 'مسلم'),
    ('ara-abudawud', 'abudawud', 'سنن أبي داود', 'أبو داود السجستاني', 'الترقيم المطبوع المشهور', None),
    ('ara-tirmidhi', 'tirmidhi', 'جامع الترمذي', 'محمد بن عيسى الترمذي', 'الترقيم المطبوع المشهور (ترقيم أحمد شاكر)', None),
    ('ara-nasai', 'nasai', 'سنن النسائي', 'أحمد بن شعيب النسائي', 'الترقيم المطبوع المشهور (ترقيم أبي غدة)', None),
    ('ara-ibnmajah', 'ibnmajah', 'سنن ابن ماجه', 'ابن ماجه القزويني', 'الترقيم المطبوع المشهور (ترقيم محمد فؤاد عبد الباقي) — المقدمة (1–266) غير موجودة في هذا المصدر', None),
    ('ara-malik', 'malik', 'موطأ مالك', 'الإمام مالك بن أنس', 'ترقيم المصدر', None),
    ('ara-nawawi', 'nawawi40', 'الأربعون النووية', 'النووي', 'الترقيم المطبوع', None),
    ('ara-qudsi', 'qudsi40', 'الأربعون القدسية', 'تجميع', 'ترقيم المصدر', None),
    ('ara-dehlawi', 'dehlawi40', 'الأربعون حديثاً', 'الشاه ولي الله الدهلوي', 'ترقيم المصدر', None),
]

def build_api(fname, bid, title, author, numbering, implicit):
    c = sqlite3.connect(os.path.join(api_dir, fname + '.sqlite'))
    # أسماء الكتب العربية في hadith-api غير دقيقة أحياناً (مثل «كتاب الصلاة» لكتاب الأذان)،
    # فنأخذ الاسم العربي من hadith-json بمطابقة الاسم الإنجليزي
    better = {}
    hj = os.path.join(hadith_dir, 'the_9_books', bid + '.json')
    if os.path.exists(hj):
        for ch in json.load(open(hj, encoding='utf-8')).get('chapters', []):
            if ch.get('english') and ch.get('arabic'): better[ch['english'].strip()] = ch['arabic'].strip()
    sec = {i: better.get((en or '').strip(), (n or '').strip()) for i, en, n in c.execute('select id, section_name, section_name_native from sections')}
    grades = {}
    for hid, sch, g in c.execute('select hadith_id, scholar_name, grade from grades'):
        ga = grade_ar(g)
        if ga: grades.setdefault(hid, []).append({'grader': SCHOLARS.get(sch, sch), 'grade': ga, 'reason': '', 'source': ''})
    items, split_ok = [], 0
    for hid, num, text, sid in c.execute('select id, hadith_number, text, section_id from hadiths order by id'):
        text = (text or '').strip()
        if not text: continue
        isnad, matn = split_isnad(text)
        split_ok += bool(isnad)
        gs = grades.get(hid, [])
        if implicit: gs = [{'grader': 'الإمام ' + implicit, 'grade': 'صحيح', 'reason': 'أخرجه في صحيحه الذي التزم فيه الصحة: اتصال السند بنقل العدل الضابط عن مثله، مع السلامة من الشذوذ والعلة.', 'source': title}] + gs
        it = {'id': f'{bid}:{num}', 'bookId': bid, 'type': 'hadith', 'num': num, 'kitab': sec.get(sid, ''), 'isnad': isnad, 'matn': matn}
        if gs: it['grades'] = gs
        items.append(it)
    # أرقام مكررة (نادرة): نُبقي الأول ونميز الباقي
    seen = {}
    for it in items:
        if it['id'] in seen:
            seen[it['id']] += 1; it['id'] += '-' + str(seen[it['id']])
        else: seen[it['id']] = 1
    book = {'id': bid, 'title': title, 'type': 'hadith', 'author': author, 'source': 'hadith-api (fawazahmed0) — مفتوح المصدر', 'numbering': numbering}
    return book, items, split_ok

manifest = []

# ---- القرآن ----
ayat, header = [], []
for line in open(quran_txt, encoding='utf-8-sig'):
    line = line.rstrip('\n')
    m = re.match(r'^(\d+)\|(\d+)\|(.+)$', line)
    if m:
        ayat.append({'id': f'quran:{m[1]}:{m[2]}', 'bookId': 'quran', 'type': 'ayah', 'surah': int(m[1]), 'ayah': int(m[2]), 'text': m[3].strip()})
    elif line.startswith('#'):
        header.append(line.lstrip('# ').rstrip())
assert len(ayat) == 6236, len(ayat)
book = {'id': 'quran', 'title': 'القرآن الكريم', 'type': 'quran', 'author': '', 'edition': 'الرسم العثماني — رواية حفص', 'source': 'مشروع تنزيل tanzil.net', 'license': '\n'.join(h for h in header if h)}
p, sz = write_pack('quran', book, ayat)
manifest.append({'file': 'quran', 'id': 'quran', 'title': book['title'], 'count': len(ayat), 'size': sz, 'version': book['packVersion']})

# ---- كتب الحديث ----
BOOKS = [
    ('the_9_books/bukhari', 'bukhari', 'صحيح البخاري', 'محمد بن إسماعيل البخاري'),
    ('the_9_books/muslim', 'muslim', 'صحيح مسلم', 'مسلم بن الحجاج النيسابوري'),
    ('the_9_books/abudawud', 'abudawud', 'سنن أبي داود', 'أبو داود السجستاني'),
    ('the_9_books/tirmidhi', 'tirmidhi', 'جامع الترمذي', 'محمد بن عيسى الترمذي'),
    ('the_9_books/nasai', 'nasai', 'سنن النسائي', 'أحمد بن شعيب النسائي'),
    ('the_9_books/ibnmajah', 'ibnmajah', 'سنن ابن ماجه', 'ابن ماجه القزويني'),
    ('the_9_books/malik', 'malik', 'موطأ مالك', 'الإمام مالك بن أنس'),
    ('the_9_books/ahmed', 'ahmad', 'مسند أحمد (جزء)', 'الإمام أحمد بن حنبل'),
    ('the_9_books/darimi', 'darimi', 'سنن الدارمي', 'عبد الله بن عبد الرحمن الدارمي'),
    ('other_books/riyad_assalihin', 'riyad', 'رياض الصالحين', 'النووي'),
    ('other_books/bulugh_almaram', 'bulugh', 'بلوغ المرام من أدلة الأحكام', 'ابن حجر العسقلاني'),
    ('other_books/aladab_almufrad', 'adab', 'الأدب المفرد', 'البخاري'),
    ('other_books/shamail_muhammadiyah', 'shamail', 'الشمائل المحمدية', 'الترمذي'),
    ('other_books/mishkat_almasabih', 'mishkat', 'مشكاة المصابيح', 'الخطيب التبريزي'),
    ('forties/nawawi40', 'nawawi40', 'الأربعون النووية', 'النووي'),
    ('forties/qudsi40', 'qudsi40', 'الأربعون القدسية', 'تجميع'),
]
stats = {}
api_ids = set()
if api_dir:
    for args in API_BOOKS:
        if not os.path.exists(os.path.join(api_dir, args[0] + '.sqlite')): continue
        book, items, ok = build_api(*args)
        p, sz = write_pack('hadith-' + book['id'], book, items)
        manifest.append({'file': 'hadith-' + book['id'], 'id': book['id'], 'title': book['title'], 'count': len(items), 'size': sz, 'version': book['packVersion']})
        stats[book['id']] = (len(items), ok); api_ids.add(book['id'])
for rel, bid, title, author in BOOKS:
    if bid in api_ids: continue
    d = json.load(open(os.path.join(hadith_dir, rel + '.json'), encoding='utf-8'))
    ch = {c['id']: (c.get('arabic') or c.get('english') or '').strip() for c in d.get('chapters', [])}
    items, split_ok = [], 0
    for h in d['hadiths']:
        ar = (h.get('arabic') or '').strip()
        if not ar:
            continue
        isnad, matn = split_isnad(ar)
        split_ok += bool(isnad)
        items.append({'id': f'{bid}:{h["idInBook"]}', 'bookId': bid, 'type': 'hadith', 'num': h['idInBook'], 'kitab': ch.get(h.get('chapterId'), ''), 'isnad': isnad, 'matn': matn})
    book = {'id': bid, 'title': title, 'type': 'hadith', 'author': author, 'source': 'hadith-json (AhmedBaset) — مأخوذ من sunnah.com',
            'numbering': 'ترقيم تسلسلي خاص بالمصدر، وقد يختلف عن الترقيم المطبوع'}
    p, sz = write_pack('hadith-' + bid, book, items)
    manifest.append({'file': 'hadith-' + bid, 'id': bid, 'title': title, 'count': len(items), 'size': sz, 'version': book['packVersion']})
    stats[bid] = (len(items), split_ok)

with open(os.path.join(out, 'manifest.js'), 'w', encoding='utf-8') as f:
    f.write('window.PACK_MANIFEST=' + json.dumps(manifest, ensure_ascii=False, indent=1) + ';')

for m in manifest:
    s = stats.get(m['id'])
    print(f"{m['title']:<30} {m['count']:>6} نص  {m['size']/1e6:6.1f} MB" + (f"  فصل الإسناد آلياً: {s[1]*100//s[0]}%" if s else ''))
print('كلمات أحكام لم تُترجم:', sorted(unknown_words.items(), key=lambda x: -x[1])[:30])
print('الإجمالي', round(sum(m['size'] for m in manifest) / 1e6, 1), 'MB')
