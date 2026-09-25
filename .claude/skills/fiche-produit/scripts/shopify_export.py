# -*- coding: utf-8 -*-
"""Export lecture seule de fiches produit + inventaire des manques.

Usage :
  python shopify_export.py --all [--status ACTIVE DRAFT] --out fiches.json
  python shopify_export.py whey-native-protimuscle creatine-creapure --out fiches.json

Sortie : JSON {handle: fiche aplatie} + tableau console des trous
(composition, valeurs nutritionnelles, allergènes, format, images, longueur de
la description, drapeau texte_reecrit, tirets longs restants).
"""
import argparse
import json
import re
import sys

from _shopify import fetch_products, flatten, find_dashes

ap = argparse.ArgumentParser()
ap.add_argument('handles', nargs='*')
ap.add_argument('--all', action='store_true')
ap.add_argument('--status', nargs='*', default=None, help='filtre statut avec --all (ACTIVE, DRAFT, ARCHIVED)')
ap.add_argument('--out', default='fiches-export.json')
a = ap.parse_args()
if not a.all and not a.handles:
    ap.error('donner des handles ou --all')

raw = fetch_products(None if a.all else a.handles, a.status)
if not a.all:
    missing = [h for h in a.handles if h not in raw]
    if missing:
        print('handles introuvables :', missing, file=sys.stderr)
fiches = {h: flatten(p) for h, p in raw.items()}
json.dump(fiches, open(a.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{len(fiches)} fiche(s) exportée(s) → {a.out}\n')

strip = lambda s: re.sub(r'<[^>]+>', '', s or '')
print(f"{'handle':40} {'statut':8} {'compo':5} {'VN':5} {'allerg':6} {'format':6} {'img':3} {'desc':5} {'réécrit':7} {'tirets':6}")
holes = 0
for h, f in sorted(fiches.items()):
    m = f['metafields']
    ok = lambda v: 'oui' if v else 'NON'
    words = len(strip(f['descriptionHtml']).split())
    dashes = sum(len(find_dashes(v)) for v in [f['descriptionHtml'], f['seo']['title'], f['seo']['description'], m['composition'], m['valeurs_nutritionnelles'], m['allergenes'], m['format']])
    row_holes = sum(1 for v in (m['composition'], m['valeurs_nutritionnelles'], m['format']) if not v) + (0 if f['images'] else 1) + (1 if words < 80 else 0)
    holes += row_holes
    print(f"{h:40} {f['status']:8} {ok(m['composition']):5} {ok(m['valeurs_nutritionnelles']):5} {ok(m['allergenes']):6} {ok(m['format']):6} {len(f['images']):3} {words:5} {str(m['texte_reecrit'] or '-'):7} {dashes:6}")
print(f'\n{holes} manque(s) au total (composition, VN, format, image, description < 80 mots).')
