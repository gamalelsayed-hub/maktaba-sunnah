"""يبني المكتبة المدمجة للبرنامج من الملفات التي أرسلها المستخدم.
الاستخدام: python3 -I build_pack.py <quran.txt> <hadith-json db/by_book dir> <out data dir>
"""
import json, re, sys, os

quran_txt, hadith_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
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
    with open(path, 'w', encoding='utf-8') as f:
        f.write('window.PACK=' + json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':')) + ';')
    return path, os.path.getsize(path)

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
manifest.append({'file': 'quran', 'id': 'quran', 'title': book['title'], 'count': len(ayat), 'size': sz})

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
for rel, bid, title, author in BOOKS:
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
    manifest.append({'file': 'hadith-' + bid, 'id': bid, 'title': title, 'count': len(items), 'size': sz})
    stats[bid] = (len(items), split_ok)

with open(os.path.join(out, 'manifest.js'), 'w', encoding='utf-8') as f:
    f.write('window.PACK_MANIFEST=' + json.dumps(manifest, ensure_ascii=False, indent=1) + ';')

for m in manifest:
    s = stats.get(m['id'])
    print(f"{m['title']:<30} {m['count']:>6} نص  {m['size']/1e6:6.1f} MB" + (f"  فصل الإسناد آلياً: {s[1]*100//s[0]}%" if s else ''))
print('الإجمالي', round(sum(m['size'] for m in manifest) / 1e6, 1), 'MB')
