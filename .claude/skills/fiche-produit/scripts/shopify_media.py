# -*- coding: utf-8 -*-
"""Ajoute une image (PNG détouré) à un produit Shopify.

Avec SHOPIFY_SCRIPTS_ADMIN_TOKEN (write_products + write_files) :
  python shopify_media.py <handle> image.png --alt "Créatine Creapure 300 g, BodyStart Nutrition"
  → stagedUploadsCreate, envoi du fichier, productCreateMedia, attente du statut READY.

Sans jeton d'écriture : imprime les deux mutations à passer dans le connecteur
Shopify MCP et la commande d'envoi du fichier entre les deux.
"""
import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.request
import uuid

from _shopify import J, fetch_products, gql, has_write_token

ap = argparse.ArgumentParser()
ap.add_argument('handle')
ap.add_argument('image')
ap.add_argument('--alt', default='')
a = ap.parse_args()

products = fetch_products([a.handle])
if a.handle not in products:
    sys.exit(f'handle introuvable : {a.handle}')
pid = products[a.handle]['id']
filename = os.path.basename(a.image)
mime = mimetypes.guess_type(filename)[0] or 'image/png'
size = os.path.getsize(a.image)

STAGED = 'mutation { stagedUploadsCreate(input: [{resource: IMAGE, filename: %s, mimeType: %s, httpMethod: POST, fileSize: %s}]) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }' % (J(filename), J(mime), J(str(size)))


def create_media(resource_url):
    return 'mutation { productCreateMedia(productId: %s, media: [{originalSource: %s, alt: %s, mediaContentType: IMAGE}]) { media { id status ... on MediaImage { image { url } } } mediaUserErrors { field message } } }' % (J(pid), J(resource_url), J(a.alt))


if not has_write_token():
    print('Pas de SHOPIFY_SCRIPTS_ADMIN_TOKEN : passer par le connecteur Shopify MCP.\n')
    print('1) graphql_mutation :\n' + STAGED)
    print('\n2) Envoyer le fichier avec les paramètres renvoyés (multipart, champ « file » en dernier) :')
    print(f'   python shopify_media.py {a.handle} {a.image} --alt {J(a.alt)}  (relancer une fois le jeton en place)')
    print('\n3) graphql_mutation :\n' + create_media('<resourceUrl renvoyé à l\'étape 1>'))
    sys.exit(0)

d = gql(STAGED, write=True)['stagedUploadsCreate']
if d['userErrors']:
    sys.exit(f'stagedUploadsCreate : {d["userErrors"]}')
target = d['stagedTargets'][0]

# Envoi multipart : les paramètres Shopify d'abord, le fichier en dernier.
boundary = uuid.uuid4().hex
parts = []
for p in target['parameters']:
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{p["name"]}"\r\n\r\n{p["value"]}\r\n'.encode())
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode())
parts.append(open(a.image, 'rb').read())
parts.append(f'\r\n--{boundary}--\r\n'.encode())
body = b''.join(parts)
req = urllib.request.Request(target['url'], data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}', 'Content-Length': str(len(body))})
resp = urllib.request.urlopen(req, timeout=120)
if resp.status not in (200, 201, 204):
    sys.exit(f'envoi du fichier : HTTP {resp.status}')

m = gql(create_media(target['resourceUrl']), write=True)['productCreateMedia']
if m['mediaUserErrors']:
    sys.exit(f'productCreateMedia : {m["mediaUserErrors"]}')
media_id = m['media'][0]['id']
for _ in range(20):
    time.sleep(2)
    st = gql('query($id:ID!){ node(id:$id){ ... on MediaImage { status image { url } } } }', {'id': media_id})['node']
    if st['status'] == 'READY':
        print('image ajoutée :', st['image']['url'])
        break
    if st['status'] == 'FAILED':
        sys.exit('traitement de l\'image en échec côté Shopify')
else:
    print('image créée, statut encore en cours :', media_id)
