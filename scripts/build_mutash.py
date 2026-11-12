#!/usr/bin/env python3
"""كتب توجيه المتشابه اللفظي في القرآن → حزم مدمجة، كل موضع عنصر مربوط بسورته.
الاستعمال: python3 build_mutash.py <مجلد النصوص> <مجلد data>"""
import os, re, sys, json, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SRC, OUT = sys.argv[1], sys.argv[2]
SURAHS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data', '_surahs.json'), encoding='utf-8'))
def norm(s):
    s = re.sub(r'[ً-ٰٟـ]', '', s or '')
    for a, b in (('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ٱ', 'ا'), ('ى', 'ي'), ('ة', 'ه'), ('ؤ', 'و'), ('ئ', 'ي')): s = s.replace(a, b)
    return re.sub(r'\s+', ' ', re.sub(r'[^ء-ي0-9 ]', ' ', s)).strip()
SN = {norm(n): i + 1 for i, n in enumerate(SURAHS)}
SN.update({'ام': 1, 'براءه': 9, 'بني': 17, 'سبحان': 17, 'المومن': 40, 'حم': 41, 'تبارك': 67, 'عم': 78, 'الدهر': 76, 'هل': 76, 'تبت': 111, 'اقرا': 96, 'الم': 32})
def surah_in(t):
    m = re.search(r'سور[ةه]\s+([^\s\]\)\(:،.]+(?:\s+(?:عمران|الكهف))?)', t)
    if not m: return 0
    n = norm(m[1])
    if n in SN: return SN[n]
    for k, v in SN.items():
        if k.replace('ال', '', 1) == n.replace('ال', '', 1): return v
    return 0

BOOKS = [
    ('0505IbnHamzaTajQurraKirmani.AsrarTikrar.Shamela0003580-ara1', 'mutash-kirmani', 'البرهان في توجيه متشابه القرآن (أسرار التكرار)', 'تاج القراء الكرماني (ت 505هـ)'),
    ('0420IbnCabdAllahKhatibIskafi.DurratTanzil.Shamela0001340-ara1', 'mutash-iskafi', 'درة التنزيل وغرة التأويل', 'الخطيب الإسكافي (ت 420هـ)'),
    ('0926ZakariyyaAnsari.FathRahman.Shamela0009086-ara1', 'mutash-ansari', 'فتح الرحمن بكشف ما يلتبس في القرآن', 'زكريا الأنصاري (ت 926هـ)'),
    ('0708IbnIbrahimAbuJacfarGharnati.MalakTawilQatic.Shamela0001419-ara1', 'mutash-gharnati', 'ملاك التأويل في توجيه المتشابه اللفظ من آي التنزيل', 'ابن الزبير الغرناطي (ت 708هـ)'),
]

def clean(line):
    line = re.sub(r'#?\s*PageV\d+P\d+', ' ', line)
    line = re.sub(r'\bms\d+\b', '', line)
    return re.sub(r'</?span[^>]*>', '', line)

manifest = []
for stem, bid, title, author in BOOKS:
    raw = open(os.path.join(SRC, stem), encoding='utf-8').read().split('#META#Header#End#', 1)[-1]
    items, surah, head, buf, page = [], 0, '', [], ''
    def emit():
        text = re.sub(r'\s+', ' ', ' '.join(buf)).strip()
        if len(text) < 40 or not surah: return
        # تقسيم المواضع الطويلة جداً
        parts = [text] if len(text) < 5000 else re.findall(r'.{1,4000}(?:[.،]\s|$)', text)
        for k, p in enumerate(parts):
            n = len(items) + 1
            items.append({'id': f'{bid}:{n}', 'bookId': bid, 'type': 'section', 'surah': surah, 'num': n,
                          'title': f'سورة {SURAHS[surah - 1]}' + (f' — {head}' if head else '') + (f' ({k + 1})' if len(parts) > 1 else ''),
                          'page': page, 'text': p})
    for line in raw.split('\n'):
        m = re.search(r'PageV(\d+)P(\d+)', line)
        if m: page = f'ج{int(m[1])} ص{int(m[2])}' if int(m[1]) else f'ص{int(m[2])}'
        line = clean(line)
        if line.startswith('### '):
            emit(); buf = []
            h = re.sub(r'^### \|+\s?', '', line).strip()
            s = surah_in(h) if len(h) < 80 else 0
            if s: surah, head = s, ''
            else: head = re.sub(r'^[\d\s\-–:.]+$', '', h)[:60]
        elif line.startswith('~~'): buf.append(line[2:])
        elif line.startswith('# '):
            t = line[2:]
            # بعض الكتب تذكر «سورة كذا» سطراً مستقلاً
            if len(t) < 40 and re.match(r'^\s*(?:ومن\s+)?سور[ةه]\s', t) and surah_in(t): emit(); buf = []; surah = surah_in(t); head = ''; continue
            buf.append(t)
    emit()
    body = {'book': {'id': bid, 'title': title, 'type': 'mutash', 'author': author, 'linkedTo': 'quran', 'source': 'المكتبة الشاملة عبر مشروع OpenITI'}, 'items': items}
    js = json.dumps(body, ensure_ascii=False, separators=(',', ':'))
    ver = hashlib.sha1(js.encode()).hexdigest()[:12]; body['book']['packVersion'] = ver
    path = os.path.join(OUT, 'book-' + bid + '.js')
    open(path, 'w', encoding='utf-8').write('window.PACK=' + json.dumps(body, ensure_ascii=False, separators=(',', ':')) + ';')
    cov = len({i['surah'] for i in items})
    print(bid, len(items), 'مواضع، سور مغطاة:', cov, 'حجم', os.path.getsize(path))
    manifest.append({'file': 'book-' + bid, 'id': bid, 'title': title, 'author': author, 'count': len(items), 'size': os.path.getsize(path), 'version': ver, 'optional': True, 'type': 'mutash'})
json.dump(manifest, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-data', '_mutash_manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
