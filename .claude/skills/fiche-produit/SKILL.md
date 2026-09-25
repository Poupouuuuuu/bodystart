---
name: fiche-produit
description: "Créer ou compléter une fiche produit Shopify BodyStart de bout en bout : export et inventaire des manques, données officielles de la marque (composition, valeurs nutritionnelles, allergènes, format), description dans la voix BodyStart, titre et meta SEO, visuel détouré, écriture contrôlée avec sauvegarde et vérification, relecture conformité. Lancer avec un ou plusieurs handles."
disable-model-invocation: true
argument-hint: "<handle> [handle…] | --all"
---

# Fiche produit : de la donnée officielle à la fiche publiée

Charger d'abord les skills `bodystart-voix` (registre, tirets, allégations) et `bodystart-seo-geo` (structure de la description, title, meta). Formats des champs : `references/metafields.md`. Scripts : `scripts/` (Python 3, lecture avec le jeton du site, écriture avec le jeton de l'app « BodyStart Scripts » ou via le connecteur Shopify MCP).

Handles demandés : `$ARGUMENTS`

## 1. Exporter et lister les manques

```bash
python .claude/skills/fiche-produit/scripts/shopify_export.py $ARGUMENTS --out <scratchpad>/export.json
```

Le tableau console montre, par fiche : composition, VN, allergènes, format, nombre d'images, longueur de la description, drapeau `texte_reecrit`, tirets restants. Décider avec ce tableau ce qu'il faut compléter.

## 2. Récupérer les données officielles

- Plusieurs fiches ou plusieurs marques : lancer l'agent `marque-scraper` (un par marque, en parallèle), qui rend un JSON par produit au format attendu par `shopify_apply.py` et pose `texte_reecrit = false`.
- Une seule fiche : suivre `references/metafields.md`, section « Où trouver les données officielles ». Jamais de valeur estimée.

## 3. Rédiger

- Description : structure « réponse d'abord », 150 à 300 mots, voix BodyStart, aucune allégation hors liste autorisée. Si le texte de la marque est repris tel quel : `texte_reecrit = false` ; si réécrit : `true`.
- Titre SEO « Produit Marque : bénéfice » (60 caractères max), meta description (155 max).
- Metafields aux formats exacts (VN en lignes `Nutriment | Par dose | Pour 100 g`).
- Écrire le tout dans `<scratchpad>/changes.json` (format dans l'en-tête de `shopify_apply.py`).

## 4. Montrer avant d'écrire

```bash
python .claude/skills/fiche-produit/scripts/shopify_apply.py <scratchpad>/changes.json
```

Le plan liste chaque champ modifié et s'arrête sur un tiret long, un handle inconnu ou un titre trop long. Pour une fiche : coller la description et les metafields proposés dans la réponse. Pour un lot : montrer 3 exemples complets et le décompte. Attendre le « OK » d'Adam sauf s'il a dit d'appliquer directement.

## 5. Écrire, puis vérifier

- Jeton scripts présent (`SHOPIFY_SCRIPTS_ADMIN_TOKEN` dans `.env.local`) : `--apply` (sauvegarde avant, écriture, relecture, sauvegarde après, écarts attendus : 0).
- Sinon : `--emit <scratchpad>/out`, passer chaque fichier `.graphql` dans le connecteur Shopify MCP (`graphql_mutation`) dans l'ordre, puis `--verify`.

## 6. Images

```bash
python .claude/skills/fiche-produit/scripts/cutout.py source.jpg <scratchpad>/<handle>.png --square
python .claude/skills/fiche-produit/scripts/shopify_media.py <handle> <scratchpad>/<handle>.png --alt "Produit Marque format, BodyStart Nutrition"
```

Vérifier le rendu du PNG (outil Read) avant l'envoi : pas de halo blanc, produit entier.

## 7. Relecture et contrôle final

1. Agent `relecture-fiche` sur la description finale et les metafields : verdict « Publiable » exigé.
2. Fiche en ligne : `https://bodystart-nutrition.fr/products/<handle>` (ISR 1 h : attendre ou vérifier après la prochaine revalidation), tableau VN correct, image sur fond végétal propre, JSON-LD Product complet.
3. Compte rendu : fiches modifiées, champs écrits, ce qui manque encore (et pourquoi), chemin des sauvegardes.

## Interdits

- Créer, archiver, supprimer ou publier un produit sans demande explicite d'Adam.
- Publier en ligne un des 26 boosters hardcore réservés à la boutique physique.
- Écrire une fiche sans sauvegarde `backups/fiches-avant-*.json` préalable.
- Inventer une composition, une valeur nutritionnelle ou un allergène.
