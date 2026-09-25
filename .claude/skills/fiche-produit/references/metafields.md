# Fiche produit Shopify : champs, formats, sources

Boutique `bodystart-nutrition-2`, API Admin 2025-01. Le site lit ces champs tels quels : un format faux casse l'affichage (tableau nutritionnel, badge format).

## Champs standard

| Champ | Règle |
| --- | --- |
| `title` | « Nom produit Marque, format » tel que sur l'étiquette, sans tiret long. |
| `descriptionHtml` | HTML simple (`<p>`, `<ul>`, `<strong>`), 150 à 300 mots, structure « réponse d'abord » (skill `bodystart-seo-geo`), voix du skill `bodystart-voix`. Pas de `<h1>`. |
| `seo.title` | « Produit Marque : bénéfice », 60 caractères max (suffixe ajouté par le site). |
| `seo.description` | 155 caractères max, bénéfice + preuve + dispo locale. |
| `vendor` | Marque exacte (sert au filtre et au JSON-LD `brand`). |
| `productType` | Catégorie du tri `/products` : voir `src/lib/categories.ts` pour les valeurs attendues. |
| `tags` | Filtres et objectifs (`objectif:prise-de-masse`…), `tva-5.5` si applicable. Regarder les tags d'une fiche voisine avant d'en inventer. |
| Canaux | Publier sur les 4 canaux (Boutique en ligne, BodyStart Site, Point de vente, Shop) sauf les 26 boosters hardcore réservés à la boutique physique (jamais en ligne). |

## Metafields `custom.*`

| Clé | Type | Format attendu | Exemple |
| --- | --- | --- | --- |
| `composition` | multi_line_text_field | Texte FR, une ligne par ingrédient ou groupe, ordre décroissant de l'étiquette. | `Monohydrate de créatine (Creapure®) 100 %.` |
| `valeurs_nutritionnelles` | multi_line_text_field | Une ligne par nutriment : `Nutriment \| Pour 30 g (1 dose) \| Pour 100 g`. Les lignes sans `\|` sont des notes (par exemple `Valeurs pour le goût chocolat.`). Première ligne = en-tête. Le composant `NutritionTableV2.tsx` fait le rendu. | `Énergie \| 120 kcal \| 400 kcal` |
| `allergenes` | single_line_text_field | Une ligne : `Contient : lait, soja. Peut contenir : gluten, œuf.` ou `Sans allergène déclaré.` | |
| `format` | single_line_text_field | `Quantité, nombre de doses` : `300 g, 100 doses` / `120 gélules, 60 doses`. Virgule, jamais de tiret. | |
| `texte_reecrit` | boolean | `false` = texte officiel de la marque repris tel quel (à personnaliser en priorité) ; `true` = texte réécrit BodyStart. Posé par l'agent `marque-scraper` à l'import, à passer à `true` après réécriture. | |

Colonne « par dose » : reprendre la dose de l'étiquette (30 g, 5 g, 1 gélule…), et indiquer le goût de référence si les valeurs changent selon le goût.

## Images

- La galerie affiche les images en `object-contain` sur le fond végétal : les packshots doivent être des **PNG à fond transparent** (script `cutout.py`), 1 200 px de côté environ.
- `alt` = « Produit Marque format, BodyStart Nutrition ».
- Ordre : packshot face, puis dos (étiquette lisible), puis ambiance.

## Où trouver les données officielles

1. Sites de marque sous Shopify : `https://<site-marque>/products/<handle>.json` ou `https://<site-marque>/products.json?limit=250` renvoient titre, description HTML, images et variantes. Chercher le handle dans `/products.json` d'abord.
2. Sites non Shopify : page produit HTML (onglets « Composition », « Valeurs nutritionnelles », « Conseils d'utilisation ») ; si l'info est dans une image d'étiquette, la lire (outil Read sur l'image) et transcrire.
3. En dernier recours : étiquette physique en boutique (photo envoyée par Adam).
4. Ne jamais compléter une valeur manquante par une estimation : laisser vide et le signaler.

## Séquence d'écriture (toujours)

1. Export et inventaire : `shopify_export.py`.
2. Fichier `changes.json` (format dans l'en-tête de `shopify_apply.py`).
3. `shopify_apply.py changes.json` : plan et garde-fous (tirets, longueurs, handles).
4. Sauvegarde automatique `backups/fiches-avant-*.json`, puis écriture : `--apply` (jeton scripts) ou `--emit` (connecteur MCP) suivi de `--verify`.
5. `backups/fiches-apres-*.json` archivé, écarts listés (attendu : 0).
