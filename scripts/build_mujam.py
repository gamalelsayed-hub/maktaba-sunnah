"""يبني معجمين للبحث بالجذر: مختار الصحاح للرازي، ومفردات ألفاظ القرآن للراغب (من OpenITI).
الاستعمال: python3 -I build_mujam.py <mukhtar-file> <mufradat-file> <out-dir>"""
import json, re, sys
HZ = str.maketrans({'أ': 'ء', 'إ': 'ء', 'آ': 'ء', 'ؤ': 'ء', 'ئ': 'ء', 'ى': 'ي', 'ة': 'ت'})
def key(h):
    h = re.sub('[ً-ْـ]', '', h).translate(HZ)
    return re.sub(r'[^ء-ي]', '', h)
def clean(t):
    t = re.sub(r'PageV\d+P\d+|ms\d+', '', t); t = re.sub(r'\n~~', ' ', t); t = re.sub(r'^# ?', '', t, flags=re.M)
    return re.sub(r'[ \t]+', ' ', t).strip()
def parse(path, start):
    s = open(path, encoding='utf-8').read(); s = s[s.index('#META#Header#End'):]; s = s[s.index(start):]
    D = {}; order = []; cur = None
    for blk in re.split(r'\n(?=### )', s):
        head, _, body = blk.partition('\n'); h = head.lstrip('#| ').strip()
        h2 = re.sub(r'[ً-ْ]', '', h)
        is_root = bool(re.fullmatch(r'[ء-ي ]{2,12}', h2)) and not re.match(r'(حرف|باب|كتاب|فصل)', h2)
        if is_root:
            k = key(h2)
            if 2 <= len(k) <= 5: cur = k; D.setdefault(k, []); order.append(k) if k not in order else None
        if cur and body.strip(): D[cur].append(clean(body))
    return {k: '\n'.join(v)[:6000] for k, v in D.items() if v}
A = parse(sys.argv[1], '### | حرف الهمزة'); B = parse(sys.argv[2], '### | كتاب الألف')
out = sys.argv[3]
open(f'{out}/mujam-sihah.js', 'w', encoding='utf-8').write('window.MUJAM_SIHAH=' + json.dumps(A, ensure_ascii=False, separators=(',', ':')) + ';')
open(f'{out}/mujam-mufradat.js', 'w', encoding='utf-8').write('window.MUJAM_MUFRADAT=' + json.dumps(B, ensure_ascii=False, separators=(',', ':')) + ';')
print(len(A), len(B), list(A)[:8], list(B)[:8])
print(A.get('كتب', '')[:300]); print(B.get('كتب', '')[:300])
