# catalog.py: list Mixkit SFX (id, duration, title, category) for the categories given; writes catalog.tsv
import re, subprocess, sys
cats = sys.argv[1:]; rows = {}
for c in cats:
    for page in ('', '?page=2'):
        html = subprocess.run(['curl', '-s', '-m', '30', f'https://mixkit.co/free-sound-effects/{c}/{page}'], capture_output=True, text=True).stdout
        for m in re.finditer(r'item-id-value="(\d+)".*?item-grid-card__title">\s*(.*?)\s*</h2>.*?meta-time"[^>]*>\s*([\d:]+)', html, re.S):
            rows.setdefault(m.group(1), (m.group(3), m.group(2), c))
with open('catalog.tsv', 'w') as f:
    for i, (d, t, c) in sorted(rows.items(), key=lambda r: r[1][2]): f.write(f'{i}\t{d}\t{c}\t{t}\n')
print(len(rows))
