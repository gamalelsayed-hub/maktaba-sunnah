"""يحوّل نصوص OpenITI (المأخوذة من المكتبة الشاملة) إلى كتب البرنامج:
- الشروح: كل شرح مقسّم على أرقام الأحاديث ومربوط بالحديث في كتابه.
- التفاسير: كل تفسير مقسّم على الآيات ومربوط بالآية.
- كتب الفقه والسيرة والتاريخ: مقسمة على أبوابها وفصولها.
- تقريب التهذيب: تراجم رواة.

الاستخدام: python3 -I build_books.py <texts dir> <quran.txt> <ara-muslim.sqlite> <out data dir>
"""
import json, re, sys, os, sqlite3, hashlib

TXT, QURAN, MUSLIM_DB, OUT = sys.argv[1:5]

SURAHS = ['الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم', 'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر', 'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس', 'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد', 'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص', 'الفلق', 'الناس']

TASH = re.compile(r'[ؐ-ًؚ-ٟۖ-ۭـ]')
def norm(s):
    s = re.sub(r'[وى]ٰ', 'ا', s or '')
    s = s.replace('ٰ', 'ا')
    s = TASH.sub('', s)
    for a, b in (('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ٱ', 'ا'), ('ى', 'ي'), ('ة', 'ه'), ('ؤ', 'و'), ('ئ', 'ي')):
        s = s.replace(a, b)
    s = re.sub(r'[^ء-ي0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()
def nospace(s): return norm(s).replace(' ', '')

SURAH_NORM = {norm(n): i + 1 for i, n in enumerate(SURAHS)}
def surah_by_name(name):
    n = norm(name).replace('سوره ', '')
    if n in SURAH_NORM: return SURAH_NORM[n]
    for k, v in SURAH_NORM.items():
        if k.replace('ال', '', 1) == n.replace('ال', '', 1): return v
    return 0

# ---------- قراءة صيغة OpenITI ----------
def parse(path):
    """يعيد قائمة كتل: (نوع، مستوى، نص، صفحة) — النوع h عنوان أو p فقرة"""
    raw = open(path, encoding='utf-8').read()
    raw = raw.split('#META#Header#End#', 1)[-1]
    blocks, page = [], ''
    cur = None
    def flush():
        nonlocal cur
        if cur and cur[2].strip():
            cur[2] = re.sub(r'\s+', ' ', cur[2]).strip()
            blocks.append(tuple(cur))
        cur = None
    for line in raw.split('\n'):
        m = re.search(r'PageV(\d+)P(\d+)', line)
        if m:
            page = f'ج{int(m[1])} ص{int(m[2])}' if int(m[1]) else f'ص{int(m[2])}'
            line = re.sub(r'#?\s*PageV\d+P\d+', ' ', line)
        line = re.sub(r'\bms\d+\b', '', line)
        line = re.sub(r'</?span[^>]*>', '', line)
        if line.startswith('### '):
            flush()
            hm = re.match(r'### (\|+)\s?(.*)', line)
            lvl = len(hm[1]) if hm else 1
            cur = ['h', lvl, hm[2] if hm else line[4:], page]
        elif line.startswith('~~'):
            if cur: cur[2] += ' ' + line[2:]
        elif line.startswith('# '):
            # تكملة عنوان مكسور على سطرين (مثل «[سورة البقرة (2): آية» ثم «255]»)
            if cur and cur[0] == 'h' and (cur[2].count('[') > cur[2].count(']') or cur[2].count('{') > cur[2].count('}') or not cur[2].strip()):
                cur[2] += ' ' + line[2:]; continue
            flush()
            cur = ['p', 0, line[2:], page]
        elif line.strip() and cur:
            cur[2] += ' ' + line.strip()
    flush()
    return blocks

def meta(path):
    raw = open(path, encoding='utf-8').read(6000)
    get = lambda k: (re.search(r'#META# ' + re.escape(k) + r'\s*::\s*(.+)', raw) or [None, ''])[1].strip()
    pub = get('043.EdPUBLISHER')
    return {'publisher': '' if pub == 'NODATA' else pub, 'shamela': get('030.LibURI')}

def write_pack(name, book, items):
    body = json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':'))
    book['packVersion'] = hashlib.sha1(body.encode()).hexdigest()[:12]
    with open(os.path.join(OUT, name + '.js'), 'w', encoding='utf-8') as f:
        f.write('window.PACK=' + json.dumps({'book': book, 'items': items}, ensure_ascii=False, separators=(',', ':')) + ';')
    return os.path.getsize(os.path.join(OUT, name + '.js'))

# ---------- أقسام عامة (للمقدمات وكتب الفقه والسيرة) ----------
def sections(bid, blocks, prefix='', maxlen=12000, start=0):
    items, chapter, title, buf, page = [], '', '', [], ''
    seq = [start]
    def emit():
        text = '\n'.join(buf).strip()
        if len(text) < 2: return
        parts = [text[i:i + maxlen] for i in range(0, len(text), maxlen)] if len(text) > maxlen * 1.3 else [text]
        for k, t in enumerate(parts):
            seq[0] += 1
            items.append({'id': f'{bid}:{prefix}{seq[0]}', 'bookId': bid, 'type': 'section', 'seq': seq[0], 'chapter': chapter[:120] or 'مقدمة',
                          'title': ((title or chapter or 'مقدمة')[:140] + (f' ({k + 1})' if len(parts) > 1 else '')), 'page': page, 'text': t})
    for kind, lvl, text, pg in blocks:
        if kind == 'h':
            emit(); buf = []; page = pg
            if lvl == 1: chapter = text; title = text
            else: title = text
        else:
            if not buf: page = page or pg
            buf.append(text)
    emit()
    return items

# ---------- الشروح المرقمة بأرقام الأحاديث ----------
def sharh(bid, target, blocks, marker=r'^\[(\d{1,5})\]\s*'):
    intro, items, cur, bab = [], {}, None, ''
    order = []
    for kind, lvl, text, pg in blocks:
        if kind == 'h':
            bab = text
            if cur is None: intro.append((kind, lvl, text, pg))
            continue
        m = re.match(marker, text)
        if m:
            n = int(m[1])
            key = f'{bid}:{n}'
            if key not in items:
                items[key] = {'id': key, 'bookId': bid, 'type': 'sharh', 'num': n, 'hadithRef': f'{target}:{n}', 'bab': bab[:200], 'page': pg, 'text': ''}
                order.append(key)
            cur = items[key]
            text = text[m.end():]
        if cur is None: intro.append((kind, lvl, text, pg)); continue
        cur['text'] += ('\n' if cur['text'] else '') + text
    out = sections(bid, intro, prefix='m') + [items[k] for k in order]
    return out

# ---------- التفاسير ----------
QURAN_AYAT = {}
for line in open(QURAN, encoding='utf-8-sig'):
    m = re.match(r'^(\d+)\|(\d+)\|(.+)$', line.strip())
    if m: QURAN_AYAT[(int(m[1]), int(m[2]))] = nospace(m[3])
AYA_COUNT = {}
for (s, a) in QURAN_AYAT: AYA_COUNT[s] = max(AYA_COUNT.get(s, 0), a)
SEQ = sorted(QURAN_AYAT)

def match_quran(text, ptr, window=400):
    """يطابق نص آية (أو آيات) بالقرآن بدءاً من موضع المؤشر — يعيد (سورة، من، إلى)"""
    q = nospace(text)
    if len(q) < 6: return None
    try: i0 = SEQ.index(ptr)
    except ValueError: i0 = 0
    head = q[:14]
    for i in range(i0, min(len(SEQ), i0 + window)):
        key = SEQ[i]; ay = QURAN_AYAT[key]
        if ay.startswith(head) or (len(head) > 8 and head[:10] == ay[:10]):
            s, a = key; to = a; rem = q[len(ay):]
            while len(rem) > 8 and (s, to + 1) in QURAN_AYAT and QURAN_AYAT[(s, to + 1)][:8] == rem[:8]:
                to += 1; rem = rem[len(QURAN_AYAT[(s, to)]):]
            return (s, a, to)
    return None

def tafsir(bid, blocks, method):
    items, cur, intro, ptr = {}, None, [], (1, 1)
    last = (1, 0)
    order = []
    def start(s, a, to, pg):
        nonlocal cur
        key = f'{bid}:{s}:{a}'
        if key not in items:
            items[key] = {'id': key, 'bookId': bid, 'type': 'tafsir', 'surah': s, 'ayah': a, 'ayahTo': max(a, to), 'page': pg, 'text': '',
                          'ref': [f'quran:{s}:{x}' for x in range(a, max(a, to) + 1)]}
            order.append(key)
        cur = items[key]
    surah_ctx = 1
    for kind, lvl, text, pg in blocks:
        hit = None
        if method == 'qurtubi':
            m = re.search(r'\[\s*سورة\s+([^\(\]]+?)\s*\((\d+)\)\s*:\s*(?:الآيات|آية|الآية|آيه)\s*(\d+)(?:\s*(?:الى|إلى|-)\s*(\d+))?', text)
            if m: hit = (int(m[2]), int(m[3]), int(m[4] or m[3]))
        elif method == 'ibnkathir' and kind == 'h':
            m = re.search(r'تفسير\s+سورة\s+([^\s\(\]\[]+(?:\s+[^\s\(\]\[]+)?)', text)
            if m and surah_by_name(m[1]): surah_ctx = surah_by_name(m[1]); last = (surah_ctx, 0)
            if '{' in text:
                nums = [int(x) for x in re.findall(r'\((\d{1,3})\)', text)]
                if nums:
                    if nums[0] < last[1] - 2 and nums[0] <= 3 and surah_ctx == last[0]: surah_ctx = min(114, surah_ctx + 1)
                    hit = (surah_ctx, min(nums), max(nums))
        elif method == 'tabari' and kind == 'h' and '{' in text:
            m = re.search(r'\[([^\]:]+):\s*(\d+)(?:\s*-\s*(\d+))?\]', text)
            if m and surah_by_name(m[1]): hit = (surah_by_name(m[1]), int(m[2]), int(m[3] or m[2]))
            else:
                b = re.search(r'\{([^}]+)\}?', text)
                r = match_quran(b[1], ptr) if b else None
                if r: hit = r
        if hit and (hit[0], hit[1]) in QURAN_AYAT:
            s, a, to = hit
            last = (s, to); ptr = (s, a); surah_ctx = s
            start(s, a, to, pg)
            if kind == 'h': continue
        if cur is None: intro.append((kind, lvl, text, pg)); continue
        cur['text'] += ('\n' if cur['text'] else '') + (('【' + text + '】') if kind == 'h' else text)
    return sections(bid, intro, prefix='m') + [items[k] for k in order]

# ---------- تقريب التهذيب: تراجم الرواة ----------
RANKS = ['صحابي', 'صحابية', 'له صحبة', 'ثقة', 'صدوق', 'مقبول', 'مستور', 'لين', 'ضعيف', 'مجهول', 'متروك', 'متهم', 'كذاب', 'يقال له صحبة', 'إمام', 'حافظ']
def taqrib(bid, blocks):
    items, num = [], None
    for kind, lvl, text, pg in blocks:
        if kind == 'h':
            m = re.match(r'^\s*(\d{1,5})\s*[-–]', text); num = int(m[1]) if m else None; continue
        if num is None: continue
        pos = min([p for p in (text.find(r) for r in RANKS) if p > 3] or [len(text)])
        name = text[:pos].strip(' ،,')
        rest = text[pos:]
        tab = re.search(r'من (?:كبار |صغار |أوساط )?(?:ال\S+)(?: عشرة)?', rest)
        death = re.search(r'(?:مات|قتل|توفي)[^.]*?(?:سنة [^\s]+(?: [^\s]+){0,3})', rest)
        rank = rest[:tab.start()].strip(' ،,') if tab else rest[:80]
        items.append({'id': f'{bid}:{num}', 'bookId': bid, 'type': 'rawi', 'num': num, 'title': name[:150], 'rank': rank[:200],
                      'tabaqa': tab[0] if tab else '', 'death': death[0] if death else '', 'page': pg, 'text': text})
        num = None
    return items

# ---------- مطابقة ترقيم عبد الباقي لصحيح مسلم من شرح النووي ----------
def muslim_map(nawawi_items):
    c = sqlite3.connect(MUSLIM_DB)
    skel = lambda t: nospace(t).replace('صلياللهعليهوسلم', '').replace('ا', '')
    rows = [(n, skel(t)) for n, t in c.execute('select hadith_number, text from hadiths order by id')]
    pos = {n: i for i, (n, _) in enumerate(rows)}
    mapping, ptr, last = {}, 0, 0
    for it in sorted([x for x in nawawi_items if x['type'] == 'sharh'], key=lambda x: x['num']):
        win = 60 + max(0, it['num'] - last) * 5
        head = it['text'][:2000]
        cands = [re.sub(r'^\s*قوله\s*', '', re.sub(r'[()]', ' ', head[:70]))] + re.findall(r'\(([^()]{10,60})', head)
        found = None
        for qt in cands[:6]:
            qt = re.sub(r'(^|\s)ثنا(\s)', r'\1حدثنا\2', qt)
            qt = re.sub(r'^\s*(قوله|قال|فيه)\s+', '', qt)
            q = skel(qt)[:18]
            if len(q) < 10: continue
            for i in range(ptr, min(len(rows), ptr + win)):
                if q in rows[i][1]:
                    if found is None or i < found: found = i
                    break
        if found is not None:
            mapping[it['num']] = rows[found][0]; ptr = found; last = it['num']
    # كل الروايات بين حديثين مطابقين تتبع الأول (عبد الباقي يجمع الروايات تحت رقم واحد)
    nums = sorted(mapping)
    groups = {}
    for k, n in enumerate(nums):
        a = pos[mapping[n]]
        # إن كان الرقم التالي مباشرة مطابقاً فكل ما بينهما روايات لهذا الحديث، وإلا نكتفي بالمطابق تحرّزاً
        if k + 1 < len(nums) and nums[k + 1] == n + 1:
            b = pos[mapping[nums[k + 1]]]
            groups[n] = [rows[i][0] for i in range(a, max(a + 1, min(b, a + 40)))]
        else:
            groups[n] = [rows[a][0]]
    return groups

# ---------- الكتب ----------
BOOKS = [
    # (ملف، معرف، عنوان، مؤلف، نوع، طريقة، كتاب مرتبط)
    ('0852IbnHajarCasqalani.FathBari', 'fath', 'فتح الباري شرح صحيح البخاري', 'ابن حجر العسقلاني', 'sharh', 'sharh', 'bukhari'),
    ('0676Nawawi.MinhajFiSharhMuslim', 'sharh-nawawi', 'المنهاج شرح صحيح مسلم', 'النووي', 'sharh', 'sharh', 'muslim'),
    ('1329MuhammadAshrafCazimabadi.CawnMacbud', 'awn', 'عون المعبود شرح سنن أبي داود', 'العظيم آبادي', 'sharh', 'sharh', 'abudawud'),
    ('1353IbnCabdRahimMubarakfuri.TuhfatAhwadhi', 'tuhfa', 'تحفة الأحوذي بشرح جامع الترمذي', 'المباركفوري', 'sharh', 'sharh', 'tirmidhi'),
    ('1138IbnCabdHadiNurDinSindi.HashiyaCalaNasai', 'sindi-nasai', 'حاشية السندي على سنن النسائي', 'السندي', 'sharh', 'sharh', 'nasai'),
    ('1138IbnCabdHadiNurDinSindi.HashiyaCalaIbnMajah', 'sindi-ibnmajah', 'حاشية السندي على سنن ابن ماجه', 'السندي', 'sharh', 'sharh-dash', 'ibnmajah'),
    ('0774IbnKathir.TafsirQuran', 'tafsir-ibnkathir', 'تفسير القرآن العظيم', 'ابن كثير', 'tafsir', 'ibnkathir', 'quran'),
    ('0310Tabari.JamicBayan', 'tafsir-tabari', 'جامع البيان عن تأويل آي القرآن', 'ابن جرير الطبري', 'tafsir', 'tabari', 'quran'),
    ('0671AbuCabdAllahQurtubi.JamicLiAhkamQuran', 'tafsir-qurtubi', 'الجامع لأحكام القرآن', 'القرطبي', 'tafsir', 'qurtubi', 'quran'),
    ('0370IbnCaliJassas.AhkamQuran', 'ahkam-jassas', 'أحكام القرآن', 'الجصاص', 'fiqhbook', 'sections', None),
    ('0543IbnCarabiIshbili.AhkamQuran', 'ahkam-ibnalarabi', 'أحكام القرآن', 'ابن العربي', 'fiqhbook', 'sections', None),
    ('0595IbnRushdHafid.BidayatMujtahid', 'bidayat', 'بداية المجتهد ونهاية المقتصد', 'ابن رشد الحفيد', 'fiqhbook', 'sections', None),
    ('0620IbnQudamaMaqdisi.Mughni', 'mughni', 'المغني', 'ابن قدامة المقدسي', 'fiqhbook', 'sections', None),
    ('0456IbnHazm.MuhallaBiAthar', 'muhalla', 'المحلى بالآثار', 'ابن حزم', 'fiqhbook', 'sections', None),
    ('0213IbnHisham.SiraNabawiyya', 'ibnhisham', 'السيرة النبوية', 'ابن هشام', 'sirabook', 'sections', None),
    ('0751IbnQayyimJawziyya.ZadMacad', 'zad', 'زاد المعاد في هدي خير العباد', 'ابن قيم الجوزية', 'sirabook', 'sections', None),
    ('0774IbnKathir.Bidaya', 'bidaya-nihaya', 'البداية والنهاية', 'ابن كثير', 'sirabook', 'sections', None),
    ('0852IbnHajarCasqalani.IsabaFiTamyiz', 'isaba', 'الإصابة في تمييز الصحابة', 'ابن حجر العسقلاني', 'sirabook', 'sections', None),
    ('0852IbnHajarCasqalani.TaqribTahdhib', 'taqrib', 'تقريب التهذيب', 'ابن حجر العسقلاني', 'rijal', 'taqrib', None),
]

files = os.listdir(TXT)
manifest, muslim_groups = [], {}
for stem, bid, title, author, btype, method, linked in BOOKS:
    fn = next((f for f in files if f.startswith(stem + '.')), None)
    if not fn: print('!! غير موجود', stem); continue
    path = os.path.join(TXT, fn)
    blocks = parse(path)
    if method == 'sharh': items = sharh(bid, linked, blocks)
    elif method == 'sharh-dash': items = sharh(bid, linked, blocks, marker=r'^(\d{1,5})\s*-\s*')
    elif method in ('ibnkathir', 'tabari', 'qurtubi'): items = tafsir(bid, blocks, method)
    elif method == 'taqrib': items = taqrib(bid, blocks)
    else: items = sections(bid, blocks)
    md = meta(path)
    book = {'id': bid, 'title': title, 'type': btype, 'author': author, 'source': 'المكتبة الشاملة (' + md['shamela'].replace('Shamela_', 'رقم ').lstrip('0') + ') عبر مشروع OpenITI',
            'edition': md['publisher'], 'optional': True}
    if linked and linked != 'quran': book['linkedTo'] = linked
    if linked == 'quran': book['linkedTo'] = 'quran'
    if bid == 'sharh-nawawi':
        muslim_groups = muslim_map(items)
        for it in items:
            if it['type'] == 'sharh':
                g = muslim_groups.get(it['num'])
                it['hadithRef'] = f'muslim:{g[0]}' if g else ''
                it['ref'] = [f'muslim:{x}' for x in (g or [])]
                it['printedNum'] = it['num']
    size = write_pack('book-' + bid, book, items)
    kinds = {}
    for it in items: kinds[it['type']] = kinds.get(it['type'], 0) + 1
    extra = ''
    if btype == 'tafsir': extra = f" آيات مغطاة: {len({r for it in items for r in it.get('ref', [])})}"
    if btype == 'sharh': extra = f" أحاديث مشروحة: {kinds.get('sharh', 0)}"
    print(f'{title[:28]:<30} {len(items):>6} نص {size / 1e6:6.1f}MB {kinds}{extra}')
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': title, 'author': author, 'count': len(items), 'size': size, 'version': book['packVersion'], 'optional': True, 'type': btype})

json.dump(manifest, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data', '_books_manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
# ترقيم عبد الباقي لمسلم: {رقم sunnah.com: رقم عبد الباقي}
inv = {}
for abd, lst in muslim_groups.items():
    for x in lst: inv.setdefault(x, abd)
json.dump(inv, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data', '_muslim_abdulbaqi.json'), 'w'), indent=0)
print('مطابقة ترقيم مسلم:', len(muslim_groups), 'حديثاً بترقيم عبد الباقي، تغطي', len(inv), 'رواية')
