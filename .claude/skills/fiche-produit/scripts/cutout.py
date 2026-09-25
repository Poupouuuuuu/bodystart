# -*- coding: utf-8 -*-
"""Détourage d'un packshot sur fond uni → PNG transparent, recadré.

La galerie du site affiche les images en object-contain sur le fond végétal :
une image avec un fond blanc rectangulaire fait tache. Ce script rend le fond
transparent par remplissage depuis les quatre coins (tolérance --thresh),
recadre sur le produit avec une marge, et enregistre en PNG.

Usage : python cutout.py source.jpg sortie.png [--thresh 40] [--margin 0.05] [--square]
"""
import argparse
import sys

from PIL import Image, ImageDraw

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('dest')
ap.add_argument('--thresh', type=int, default=40, help='tolérance de couleur du fond (0-255)')
ap.add_argument('--margin', type=float, default=0.05, help='marge autour du produit, en fraction')
ap.add_argument('--square', action='store_true', help='toile carrée transparente')
a = ap.parse_args()

img = Image.open(a.src).convert('RGBA')
rgb = img.convert('RGB')
w, h = rgb.size
# couleur sentinelle absente de l'image
sentinel = (255, 0, 255)
if sentinel in {rgb.getpixel((x, y)) for x in range(0, w, max(1, w // 50)) for y in range(0, h, max(1, h // 50))}:
    sentinel = (0, 255, 255)
for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    if rgb.getpixel(seed) != sentinel:
        ImageDraw.floodfill(rgb, seed, sentinel, thresh=a.thresh)

px = rgb.load()
out = img.copy()
po = out.load()
for y in range(h):
    for x in range(w):
        if px[x, y] == sentinel:
            po[x, y] = (0, 0, 0, 0)

bbox = out.getbbox()
if not bbox:
    raise SystemExit('rien à détourer : le fond couvre toute l\'image (baisser --thresh ?)')
x0, y0, x1, y1 = bbox
mx, my = int((x1 - x0) * a.margin), int((y1 - y0) * a.margin)
crop = out.crop((max(0, x0 - mx), max(0, y0 - my), min(w, x1 + mx), min(h, y1 + my)))
if a.square:
    side = max(crop.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    crop = canvas
crop.save(a.dest, 'PNG', optimize=True)
print(f'{a.dest} : {crop.width}×{crop.height}, fond transparent (sentinelle {sentinel}, seuil {a.thresh})')
