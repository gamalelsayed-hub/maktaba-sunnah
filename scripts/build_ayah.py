#!/usr/bin/env python3
"""يبني ملفات data/ayah/<سورة>.js: ما يظهر تحت كل آية في المصحف.

لكل آية:
  m  التفسير الميسر (مجمع الملك فهد) — مع مقدمة السورة (mi)
  x  المختصر في تفسير القرآن (مركز تفسير)
  g  معاني الكلمات: الميسر في غريب القرآن
  t  أحكام التجويد بمواضعها (مُستخرجة بمصنّف cpfair/quran-tajweed — CC BY 4.0 — على نص المصحف في التطبيق)
  b  أحاديث مقبولة من كتب السنة في المكتبة تذكر نزول الآية (تُستخرج آلياً بمطابقة نص الآية مع لفظ «نزلت/فأنزل الله»)

المصادر (scripts/build-data/ayah/، لا تُرفع للمستودع):
  - مجلدات spa5k/tafsir_api: ar-tafsir-muyassar, ar-tafsir-al-mukhtasar, al-muyassar-fi-al-gharib
    (مصدرها qul.tarteel.ai)
  - tajweed-annotations.json: ناتج tajweed_classifier.py من cpfair/quran-tajweed على نص المصحف هنا
    بعد حذف البسملة من أول السور واستبدال «ـٰ» بـ«ٰ».
"""
import json, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'scripts', 'build-data', 'ayah')
OUT = os.path.join(ROOT, 'data', 'ayah')

def load_pack(name):
    s = open(os.path.join(ROOT, 'data', name), encoding='utf-8').read()
    s = s[s.index('=') + 1:].strip().rstrip(';')
    return json.loads(s)

RULES = ['hamzat_wasl', 'lam_shamsiyyah', 'silent', 'madd_2', 'madd_246', 'madd_munfasil', 'madd_muttasil', 'madd_6',
         'ghunnah', 'ikhfa', 'ikhfa_shafawi', 'idghaam_ghunnah', 'idghaam_no_ghunnah', 'idghaam_shafawi', 'iqlab',
         'qalqalah', 'idghaam_mutajanisayn', 'idghaam_mutaqaribayn']

def b36(n):
    d = '0123456789abcdefghijklmnopqrstuvwxyz'; s = ''
    while True:
        s = d[n % 36] + s; n //= 36
        if not n: return s

# ===== تطبيع للمطابقة بين الرسم العثماني ولفظ الحديث =====
DIAC = re.compile('[ؐ-ًؚ-ٰٟۖ-ۭـࣰ-ࣿ]')
def skel_words(t):
    t = DIAC.sub('', t)
    t = re.sub('[أإآٱءؤئ]', '', t).replace('ى', '').replace('ة', 'ه')
    t = re.sub('[^ء-ي ]', ' ', t)
    out = []
    for w in t.split():
        w = w.replace('ا', '').replace('و', '').replace('ي', '')
        if len(w) >= 2: out.append(w)
    return out

TRIG = re.compile(r'(نزلت|فنزلت|انزلت|فانزل الله|وانزل الله|انزل الله|نزل فيه|نزلت فيه|فيه نزلت|فيهم نزلت|نزلت في|فانزلت|نزلت هذه)')
def plain(t):
    t = DIAC.sub('', t); t = re.sub('[أإآٱ]', 'ا', t); return t.replace('ى', 'ي').replace('ة', 'ه')

def main():
    quran = load_pack('quran.js')['items']
    Q = {(x['surah'], x['ayah']): x['text'] for x in quran}
    counts = collections.Counter(s for s, a in Q)

    def per_surah(folder):
        res = {}
        for s in range(1, 115):
            arr = json.load(open(os.path.join(SRC, folder, f'{s}.json'), encoding='utf-8'))
            res[s] = {x['ayah']: x['text'].strip() for x in arr}
        return res
    MUY, MUK, GHR = per_surah('ar-tafsir-muyassar'), per_surah('ar-tafsir-al-mukhtasar'), per_surah('al-muyassar-fi-al-gharib')

    tj = {(x['surah'], x['ayah']): x['annotations'] for x in json.load(open(os.path.join(SRC, 'tajweed-annotations.json'), encoding='utf-8'))}

    # ===== أسباب النزول من الأحاديث =====
    ngram_ayat = collections.defaultdict(set)
    ay_sk = {}
    for k, t in Q.items():
        w = skel_words(t if not (k[1] == 1 and k[0] not in (1, 9) and t.startswith('بِسْمِ')) else ' '.join(t.split()[4:]))
        ay_sk[k] = w
        for i in range(len(w) - 3): ngram_ayat[tuple(w[i:i + 4])].add(k)
    BOOKS = ['bukhari', 'muslim', 'tirmidhi', 'abudawud', 'nasai', 'ibnmajah']
    asbab = collections.defaultdict(list)
    for b in BOOKS:
        try: items = load_pack(f'hadith-{b}.js')['items']
        except FileNotFoundError: continue
        for h in items:
            txt = (h.get('isnad') or '') + ' ' + (h.get('matn') or '')
            if not TRIG.search(plain(txt)): continue
            gs = h.get('grades') or []
            if b not in ('bukhari', 'muslim'):
                alb = [g for g in gs if 'الألباني' in g.get('grader', '') or 'الالباني' in g.get('grader', '')]
                g0 = (alb or gs or [{}])[0].get('grade', '')
                if not re.search('صحيح|حسن', g0) or re.search('ضعيف|منكر|موضوع', g0): continue
            w = skel_words(txt)
            hits = collections.Counter()
            for i in range(len(w) - 3):
                ks = ngram_ayat.get(tuple(w[i:i + 4]))
                if ks and len(ks) <= 3:
                    for k in ks: hits[k] += 1
            for k, c in hits.items():
                need = 1 if len(ay_sk[k]) <= 6 else 2
                if c >= need: asbab[k].append((0 if b in ('bukhari', 'muslim') else 1, -c, h['id']))
    for k in asbab: asbab[k] = [x[2] for x in sorted(asbab[k])[:4]]

    os.makedirs(OUT, exist_ok=True)
    total = 0
    for s in range(1, 115):
        n = counts[s]
        def dedup(src):
            arr, prev, start = [], None, 0
            for a in range(1, n + 1):
                t = src[s].get(a, '')
                if t and t == prev: arr.append(start)  # رقم الآية التي يبدأ بها التفسير المشترك
                else: arr.append(t); prev, start = t, a
            return arr
        m = dedup(MUY); intro = ''
        if isinstance(m[0], str) and '[التفسير]' in m[0]:
            intro, m[0] = [p.strip() for p in m[0].split('[التفسير]', 1)]
        g = {}
        for a in range(1, n + 1):
            t = GHR[s].get(a, '')
            if not t: continue
            pairs = []
            for part in re.split(r'\n\s*\n', t):
                mm = re.match(r'\s*﴿(.+?)﴾\s*:\s*(.+)', part.strip(), re.S)
                if mm: pairs.append([mm.group(1).strip(), mm.group(2).strip()])
            if pairs: g[a] = pairs
        t = {}
        for a in range(1, n + 1):
            an = tj.get((s, a)) or []
            if an: t[a] = ','.join(f"{b36(x['start'])}.{b36(x['end'] - x['start'])}.{b36(RULES.index(x['rule']))}" for x in an)
        data = {'mi': intro, 'm': m, 'x': dedup(MUK), 'g': g, 't': t, 'b': {a: asbab[(s, a)] for a in range(1, n + 1) if asbab.get((s, a))}}
        js = 'window.AYAH_DATA=window.AYAH_DATA||{};AYAH_DATA[%d]=%s;\n' % (s, json.dumps(data, ensure_ascii=False, separators=(',', ':')))
        open(os.path.join(OUT, f'{s}.js'), 'w', encoding='utf-8').write(js)
        total += len(js.encode())
    print('ayah data:', round(total / 1e6, 1), 'MB;', 'asbab ayat:', len(asbab), 'hadith links:', sum(len(v) for v in asbab.values()))

if __name__ == '__main__':
    main()
