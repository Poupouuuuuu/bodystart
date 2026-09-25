# -*- coding: utf-8 -*-
"""Accès Admin API Shopify partagé par les scripts du skill fiche-produit.

Jetons (lus dans .env.local à la racine du projet) :
  - SHOPIFY_ADMIN_API_ACCESS_TOKEN : app du site, lecture seule sur les produits.
  - SHOPIFY_SCRIPTS_ADMIN_TOKEN    : app « BodyStart Scripts » (write_products,
    write_files…), voir tech-specs/shopify-app-scripts.md. Facultatif : sans lui,
    les scripts émettent des mutations à passer par le connecteur Shopify MCP.
"""
import json
import os
import re
import sys
import time
import urllib.request

# Console Windows en cp1252 : on force l'UTF-8 pour les accents et flèches.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        pass

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
ENV_PATH = os.path.join(ROOT, '.env.local')
API_VERSION = '2025-01'
DASH_RE = re.compile('[–—]')

METAFIELDS = {
    'composition': 'multi_line_text_field',
    'valeurs_nutritionnelles': 'multi_line_text_field',
    'allergenes': 'single_line_text_field',
    'format': 'single_line_text_field',
    'texte_reecrit': 'boolean',
}


def load_env():
    env = {}
    if not os.path.exists(ENV_PATH):
        sys.exit(f'.env.local introuvable : {ENV_PATH}')
    for line in open(ENV_PATH, encoding='utf-8'):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = load_env()
DOMAIN = ENV.get('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN')
READ_TOKEN = ENV.get('SHOPIFY_ADMIN_API_ACCESS_TOKEN')
WRITE_TOKEN = ENV.get('SHOPIFY_SCRIPTS_ADMIN_TOKEN')


def has_write_token():
    return bool(WRITE_TOKEN)


def gql(query, variables=None, write=False):
    """Exécute une requête GraphQL Admin. write=True impose le jeton de l'app scripts."""
    token = WRITE_TOKEN if write else (READ_TOKEN or WRITE_TOKEN)
    if not DOMAIN or not token:
        sys.exit('Domaine ou jeton Shopify manquant dans .env.local' + (' (SHOPIFY_SCRIPTS_ADMIN_TOKEN requis pour écrire)' if write else ''))
    body = json.dumps({'query': query, 'variables': variables or {}}).encode()
    for attempt in range(4):
        req = urllib.request.Request(
            f'https://{DOMAIN}/admin/api/{API_VERSION}/graphql.json',
            data=body,
            headers={'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
        )
        try:
            out = json.load(urllib.request.urlopen(req, timeout=90))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(2 * (attempt + 1))
                continue
            raise
        errors = out.get('errors')
        if errors:
            if any((e.get('extensions') or {}).get('code') == 'THROTTLED' for e in errors) and attempt < 3:
                time.sleep(2 * (attempt + 1))
                continue
            raise RuntimeError(json.dumps(errors, ensure_ascii=False))
        return out['data']
    raise RuntimeError('Shopify : trop de tentatives')


PRODUCT_FIELDS = '''
  id handle title status vendor productType tags descriptionHtml
  seo { title description }
  featuredImage { url }
  images(first: 20) { nodes { id url altText } }
  variants(first: 50) { nodes { id title sku price availableForSale inventoryItem { id } } }
  composition: metafield(namespace: "custom", key: "composition") { id value }
  valeurs_nutritionnelles: metafield(namespace: "custom", key: "valeurs_nutritionnelles") { id value }
  allergenes: metafield(namespace: "custom", key: "allergenes") { id value }
  format: metafield(namespace: "custom", key: "format") { id value }
  texte_reecrit: metafield(namespace: "custom", key: "texte_reecrit") { id value }
'''


def fetch_products(handles=None, statuses=None):
    """Retourne {handle: produit} pour les handles donnés, ou tout le catalogue."""
    out = {}
    if handles:
        for i in range(0, len(handles), 20):
            chunk = handles[i:i + 20]
            q = ' OR '.join(f'handle:{h}' for h in chunk)
            d = gql('query($q:String){ products(first: 50, query: $q){ nodes { %s } } }' % PRODUCT_FIELDS, {'q': q})
            for p in d['products']['nodes']:
                out[p['handle']] = p
        return out
    after = None
    while True:
        d = gql('query($after:String){ products(first: 100, after: $after){ pageInfo { hasNextPage endCursor } nodes { %s } } }' % PRODUCT_FIELDS, {'after': after})['products']
        for p in d['nodes']:
            if not statuses or p['status'] in statuses:
                out[p['handle']] = p
        if not d['pageInfo']['hasNextPage']:
            break
        after = d['pageInfo']['endCursor']
        time.sleep(0.3)
    return out


def flatten(p):
    """Produit Shopify → dict plat lisible (metafields en clair)."""
    f = {
        'id': p['id'], 'handle': p['handle'], 'title': p['title'], 'status': p['status'],
        'vendor': p.get('vendor'), 'productType': p.get('productType'), 'tags': p.get('tags') or [],
        'descriptionHtml': p.get('descriptionHtml') or '',
        'seo': {'title': (p.get('seo') or {}).get('title') or '', 'description': (p.get('seo') or {}).get('description') or ''},
        'images': [{'id': i['id'], 'url': i['url'], 'alt': i.get('altText')} for i in (p.get('images') or {}).get('nodes', [])],
        'variants': [{'id': v['id'], 'title': v['title'], 'sku': v.get('sku'), 'price': v.get('price'), 'inventoryItemId': (v.get('inventoryItem') or {}).get('id')} for v in (p.get('variants') or {}).get('nodes', [])],
        'metafields': {},
    }
    for k in METAFIELDS:
        m = p.get(k)
        f['metafields'][k] = (m or {}).get('value')
    return f


def find_dashes(text):
    """Positions des tirets longs dans un texte (liste vide = conforme)."""
    return [m.start() for m in DASH_RE.finditer(text or '')]


def J(v):
    return json.dumps(v, ensure_ascii=False)


def stamp():
    return time.strftime('%Y%m%d-%H%M')


def backups_dir():
    d = os.path.join(ROOT, 'backups')
    os.makedirs(d, exist_ok=True)
    return d
