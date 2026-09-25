# -*- coding: utf-8 -*-
"""Écriture contrôlée de fiches produit : sauvegarde, contrôle, mutation, vérification.

Entrée : un JSON « changes » = liste d'objets
  {
    "handle": "creatine-creapure",
    "descriptionHtml": "<p>…</p>",                 (facultatif)
    "seo": {"title": "…", "description": "…"},      (facultatif, clés partielles ok)
    "metafields": {"composition": "…", "valeurs_nutritionnelles": "…",
                   "allergenes": "…", "format": "…", "texte_reecrit": false},  (facultatif)
    "tags_add": ["…"], "tags_remove": ["…"]         (facultatif)
    "productType": "Barres protéinées"                  (facultatif : type = rayon du site)
  }

Modes :
  python shopify_apply.py changes.json                 → contrôle + plan (rien n'est écrit)
  python shopify_apply.py changes.json --emit DIR      → écrit DIR/upd-NN.graphql et DIR/mf-NN.graphql
                                                         à passer un par un dans le connecteur Shopify MCP
                                                         (graphql_mutation), puis --verify
  python shopify_apply.py changes.json --apply         → écrit directement avec SHOPIFY_SCRIPTS_ADMIN_TOKEN
  python shopify_apply.py changes.json --verify        → relit la boutique et compare à l'attendu

Garde-fous : handles inconnus → arrêt ; tiret long dans un nouveau texte → arrêt ;
sauvegarde backups/fiches-avant-<horodatage>.json avant toute écriture ;
vérification octet par octet après écriture.
"""
import argparse
import json
import os
import sys
import time

from _shopify import METAFIELDS, J, backups_dir, fetch_products, find_dashes, flatten, gql, has_write_token, stamp

ap = argparse.ArgumentParser()
ap.add_argument('changes')
ap.add_argument('--emit', metavar='DIR')
ap.add_argument('--apply', action='store_true')
ap.add_argument('--verify', action='store_true')
a = ap.parse_args()

changes = json.load(open(a.changes, encoding='utf-8'))
if not isinstance(changes, list) or not changes:
    sys.exit('changes.json doit être une liste non vide')
handles = [c['handle'] for c in changes]
live = fetch_products(handles)
unknown = [h for h in handles if h not in live]
if unknown:
    sys.exit(f'handles introuvables : {unknown}')

TEXT_FIELDS = ('descriptionHtml', 'seo.title', 'seo.description')


def current(handle, field):
    f = flatten(live[handle])
    if field == 'descriptionHtml':
        return f['descriptionHtml']
    if field.startswith('seo.'):
        return f['seo'][field[4:]]
    if field.startswith('mf.'):
        v = f['metafields'][field[3:]]
        return v
    if field == 'tags':
        return f['tags']
    if field == 'productType':
        return f['productType']
    raise KeyError(field)


# ── 1. Contrôle et plan ───────────────────────────────────────────────────────
plan = []       # (handle, field, old, new)
problems = []
for c in changes:
    h = c['handle']
    if 'descriptionHtml' in c:
        plan.append((h, 'descriptionHtml', current(h, 'descriptionHtml'), c['descriptionHtml']))
    if 'productType' in c:
        plan.append((h, 'productType', current(h, 'productType'), c['productType']))
    for k in ('title', 'description'):
        if k in (c.get('seo') or {}):
            plan.append((h, f'seo.{k}', current(h, f'seo.{k}'), c['seo'][k]))
    for k, v in (c.get('metafields') or {}).items():
        if k not in METAFIELDS:
            problems.append(f'{h} : metafield inconnu « {k} » (attendus : {", ".join(METAFIELDS)})')
            continue
        if METAFIELDS[k] == 'boolean':
            if not isinstance(v, bool):
                problems.append(f'{h} : {k} doit être true/false')
                continue
            v = 'true' if v else 'false'
        plan.append((h, f'mf.{k}', current(h, f'mf.{k}'), v))
    if c.get('tags_add') or c.get('tags_remove'):
        old = current(h, 'tags')
        new = [t for t in old if t not in set(c.get('tags_remove') or [])]
        new += [t for t in (c.get('tags_add') or []) if t not in new]
        plan.append((h, 'tags', old, new))

for h, field, old, new in plan:
    if isinstance(new, str) and find_dashes(new):
        problems.append(f'{h} / {field} : tiret long « — » ou « – » dans le nouveau texte (règle du gérant)')
    if isinstance(new, str) and field in ('seo.title',) and len(new) > 70:
        problems.append(f'{h} / seo.title : {len(new)} caractères (60 max conseillé)')
    if isinstance(new, str) and field == 'seo.description' and len(new) > 160:
        problems.append(f'{h} / seo.description : {len(new)} caractères (155 max)')
unchanged = [(h, f) for h, f, o, n in plan if o == n]
plan = [x for x in plan if x[2] != x[3]]

print(f'{len(changes)} fiche(s), {len(plan)} champ(s) à modifier, {len(unchanged)} déjà à jour.')
for h, field, old, new in plan:
    o = len(old) if isinstance(old, str) else old
    n = len(new) if isinstance(new, str) else new
    print(f'  {h:40} {field:26} {o!s:>6} → {n!s}')
if problems:
    print('\nARRÊT, à corriger avant écriture :')
    for p in problems:
        print('  -', p)
    sys.exit(1)
if not plan and not a.verify:
    print('Rien à écrire.')
    sys.exit(0)

# ── 4. Vérification (relecture + comparaison) ────────────────────────────────
def verify(expected):
    fresh = fetch_products(sorted({e['handle'] for e in expected}))
    global live
    live = fresh
    bad = []
    for e in expected:
        got = current(e['handle'], e['field'])
        # Shopify trie les tags : on compare sans tenir compte de l'ordre.
        same = sorted(got) == sorted(e['new']) if e['field'] == 'tags' else got == e['new']
        if not same:
            bad.append((e['handle'], e['field'], got if not isinstance(got, str) else len(got), e['new'] if not isinstance(e['new'], str) else len(e['new'])))
    print(f'\nVérification : {len(expected)} champ(s) relus, {len(bad)} écart(s).')
    for b in bad:
        print('  ÉCART', b)
    after = os.path.join(backups_dir(), f'fiches-apres-{stamp()}.json')
    json.dump({h: flatten(p) for h, p in fresh.items()}, open(after, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('état après écriture archivé :', after)
    return not bad


expected_path = a.changes + '.expected.json'
if a.verify:
    exp = json.load(open(expected_path, encoding='utf-8'))
    sys.exit(0 if verify(exp) else 2)

if not (a.emit or a.apply):
    print('\nPlan seulement. Ajouter --emit DIR (connecteur MCP) ou --apply (jeton scripts) pour écrire.')
    sys.exit(0)

# ── 2. Sauvegarde avant écriture ─────────────────────────────────────────────
before = os.path.join(backups_dir(), f'fiches-avant-{stamp()}.json')
json.dump({h: flatten(live[h]) for h in handles}, open(before, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\nsauvegarde avant écriture :', before)
json.dump([{'handle': h, 'field': f, 'new': n} for h, f, o, n in plan], open(expected_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

# ── 3. Mutations ─────────────────────────────────────────────────────────────
by_product = {}
mf = []
for h, field, old, new in plan:
    pid = live[h]['id']
    if field.startswith('mf.'):
        k = field[3:]
        mf.append({'ownerId': pid, 'namespace': 'custom', 'key': k, 'type': METAFIELDS[k], 'value': new})
    else:
        d = by_product.setdefault(h, {'id': pid})
        if field == 'descriptionHtml':
            d['descriptionHtml'] = new
        elif field.startswith('seo.'):
            d.setdefault('seo', {})[field[4:]] = new
        elif field == 'tags':
            d['tags'] = new
        elif field == 'productType':
            d['productType'] = new


def product_update_alias(i, d):
    parts = [f'id:{J(d["id"])}']
    if 'descriptionHtml' in d:
        parts.append(f'descriptionHtml:{J(d["descriptionHtml"])}')
    if 'tags' in d:
        parts.append(f'tags:{J(d["tags"])}')
    if 'productType' in d:
        parts.append(f'productType:{J(d["productType"])}')
    if 'seo' in d:
        parts.append('seo:{' + ', '.join(f'{k}:{J(v)}' for k, v in d['seo'].items()) + '}')
    return f' u{i}: productUpdate(input:{{{", ".join(parts)}}}) {{ product {{ handle }} userErrors {{ field message }} }}'


mutations = []
batch, size = [], 0
for i, d in enumerate(by_product.values()):
    s = product_update_alias(i, d)
    if batch and size + len(s) > 18000:
        mutations.append(('upd', 'mutation {\n' + '\n'.join(batch) + '\n}'))
        batch, size = [], 0
    batch.append(s)
    size += len(s)
if batch:
    mutations.append(('upd', 'mutation {\n' + '\n'.join(batch) + '\n}'))
for i in range(0, len(mf), 25):
    entries = ',\n'.join('{' + ', '.join(f'{k}:{J(v)}' for k, v in m.items()) + '}' for m in mf[i:i + 25])
    mutations.append(('mf', 'mutation {\n metafieldsSet(metafields:[\n' + entries + '\n]) { metafields { key owner { ... on Product { handle } } } userErrors { field message } }\n}'))

if a.emit:
    os.makedirs(a.emit, exist_ok=True)
    n = {'upd': 0, 'mf': 0}
    for kind, text in mutations:
        n[kind] += 1
        p = os.path.join(a.emit, f'{kind}-{n[kind]:02d}.graphql')
        open(p, 'w', encoding='utf-8', newline='\n').write(text)
        print(f'  {p} ({len(text)} caractères)')
    print(f'\n{len(mutations)} mutation(s) à passer dans le connecteur Shopify MCP (graphql_mutation), dans l\'ordre.')
    print(f'Ensuite : python shopify_apply.py {a.changes} --verify')
    sys.exit(0)

if a.apply:
    if not has_write_token():
        sys.exit('SHOPIFY_SCRIPTS_ADMIN_TOKEN absent de .env.local : utiliser --emit (voir tech-specs/shopify-app-scripts.md)')
    errors = []
    for kind, text in mutations:
        d = gql(text, write=True)
        for alias, payload in d.items():
            for e in (payload or {}).get('userErrors') or []:
                errors.append((alias, e))
        time.sleep(0.5)
    if errors:
        print('userErrors :')
        for e in errors:
            print('  ', e)
    exp = json.load(open(expected_path, encoding='utf-8'))
    ok = verify(exp)
    print(f'\n{len(by_product)} fiche(s) mises à jour (productUpdate), {len(mf)} metafield(s) écrits.')
    sys.exit(0 if ok and not errors else 2)
