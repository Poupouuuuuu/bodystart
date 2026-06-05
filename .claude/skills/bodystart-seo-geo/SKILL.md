---
name: bodystart-seo-geo
description: "SEO + GEO (Generative Engine Optimization) pour BodyStart Nutrition (bodystart-nutrition.fr — Shopify headless + Next.js, compléments alimentaires, boutique à Coignières 78). Utiliser ce skill dès que la tâche touche au référencement au sens large — pas seulement quand on dit « SEO » : création ou modification d'une fiche produit, d'une page, d'un article de blog, d'une catégorie ou collection ; rédaction de titles/meta descriptions ; données structurées JSON-LD ; visibilité Google, fiche Google Business Profile, recherche locale (Coignières, 78, Yvelines) ; visibilité dans les IA (ChatGPT, Perplexity, AI Overviews, Copilot) ; audit de site, maillage interne, sitemap, redirections ; ou toute question « comment être mieux référencé / cité / trouvé ». S'applique au site ET aux fiches Shopify (metafields)."
---

# SEO + GEO — BodyStart Nutrition

Objectif : faire de bodystart-nutrition.fr LA réponse pour « compléments alimentaires + [intention] » sur Google (classique et local) **et** dans les moteurs génératifs (ChatGPT, Perplexity, Google AI Overviews, Copilot). Chaque page publiée doit être conçue pour être **classée** (SEO) et **citée** (GEO).

## Contexte technique (état au 05/06/2026 — ne pas refaire ce qui existe)

- **Stack** : Shopify (store `bodystart-nutrition-2`) en headless + Next.js App Router sur Vercel. Domaine canonique : `https://bodystart-nutrition.fr` (www → 308, .com → 301, myshopify → redirect JS).
- **Déjà en place et vérifié** : sitemap dynamique complet (98 produits + pages), robots.txt propre, canonicals, vrai 404 produit, H1 SSR sur /products, title template global `%s | BodyStart Nutrition`, title home optimisé Coignières, og:image (produit = image Shopify, défaut = logo), twitter:card, JSON-LD riche (Product+Offer+Brand+BreadcrumbList sur fiches ; LocalBusiness+Organization+horaires global ; Store+GeoCoordinates sur /stores), ISR 1 h sur la home, Search Console active avec sitemap soumis.
- **Metafields produits Shopify** (namespace `custom`) : `composition`, `valeurs_nutritionnelles` (format « Nutriment | valeur » multiligne), `allergenes` (single line), `format`. Ces données alimentent le site ET sont l'or du GEO — toujours remplies avec les valeurs officielles fabricant.
- **Boutique physique** : BodyStart Nutrition, 8 Rue du Pont des Landes, 78310 Coignières (ex-BodyFit). NAP (nom, adresse, téléphone) à garder STRICTEMENT identique partout.

## Règles de marque (s'appliquent à tout contenu)

- Voix : « on / nous » (jamais « je »), tutoiement client, direct, expert mais accessible.
- Interdits : « sans bullshit » et toute promo « -10 % abonnés Insta » en dur dans le contenu du site.
- Jamais d'allégation santé interdite (réglementation UE 1924/2006) : pas de « guérit », « brûle la graisse à coup sûr », « booste la testostérone » sans nuance. Utiliser les allégations autorisées (« contribue à… ») — c'est aussi ce que les IA considèrent comme fiable, donc citable.

## Workflow 1 — Nouvelle fiche produit (ou refonte)

Dérouler dans l'ordre, tout est obligatoire :

1. **Données officielles d'abord** : composition ligne par ligne, table VN exacte, allergènes — depuis le site fabricant ou l'étiquette (jamais inventées). Les remplir dans les metafields. Une fiche aux dosages précis (« 3 000 mg de créatine par dose ») est 10× plus citable par une IA qu'un texte vague.
2. **Title** : `[Nom produit] — [bénéfice/catégorie] | BodyStart Nutrition`, mot-clé principal en premier, ≤ 60 caractères avant le suffixe.
3. **Meta description** ≤ 155 car. : bénéfice + preuve (dosage, certif) + dispo locale quand pertinent (« en stock à Coignières, livraison France »).
4. **Description produit** : structure answer-first (voir references/geo.md) — 1re phrase = ce que c'est + pour qui ; puis pourquoi celui-là (dosages, labels) ; puis comment l'utiliser. 150-300 mots UNIQUES (jamais copier le fabricant mot à mot : duplicate content).
5. **Organisation Shopify** : productType (catégorie du tri /products), tags filtres, collection « Produits TVA 5,5 % », publication sur les 4 canaux (Boutique en ligne, BodyStart Site, Point de vente, Shop).
6. **Vérifier le rendu** : JSON-LD Product complet (prix, dispo, marque), image avec alt descriptif.

## Workflow 2 — Nouvelle page ou article de blog

1. **Une page = une intention de recherche.** Avant d'écrire : quelle requête exacte ? Quel niveau (info / comparaison / achat) ? Si deux intentions → deux pages.
2. Lire `references/seo-onpage.md` pour le gabarit complet (Hn, maillage, longueur).
3. Appliquer le gabarit GEO de `references/geo.md` : réponse directe en tête, FAQ en fin de page avec schema FAQPage, données chiffrées sourcées, date de mise à jour visible.
4. Maillage : chaque article pointe vers ≥ 2 fiches produit + 1 page catégorie ; chaque nouvelle page reçoit ≥ 1 lien depuis une page existante (pas de page orpheline).
5. Après publication : vérifier l'URL dans le sitemap, demander l'indexation dans Search Console.

## Workflow 3 — SEO local (le levier n°1 d'une boutique physique)

Lire `references/seo-local.md`. Priorités permanentes : fiche Google Business Profile complète et active (posts, photos, réponses aux avis sous 48 h), NAP identique partout, page /stores riche, avis clients sollicités systématiquement (QR code en caisse).

## Workflow 4 — Audit périodique (mensuel ou avant/après gros changement)

1. Search Console : couverture (pages exclues ?), requêtes en progression, CTR des pages clés (title/meta à retravailler si CTR < 2 % avec beaucoup d'impressions).
2. Technique : sitemap à jour, 404/redirects, vitesse (Core Web Vitals), schema sans erreur (validator.schema.org + test de résultats enrichis Google).
3. Contenu : pages zombies (0 clic en 90 j → enrichir, fusionner ou 301), fraîcheur (mettre à jour les articles datés).
4. GEO : tester 5-10 requêtes types dans ChatGPT/Perplexity (« meilleure whey isolate », « magasin compléments alimentaires Coignières »…) — noter si BodyStart est cité ; sinon analyser qui l'est et pourquoi (voir references/geo.md §mesure).
5. Restituer : 3 quick wins max + 1 chantier de fond. Pas de rapport de 40 pages.

## Références (charger selon le besoin)

- `references/seo-onpage.md` — gabarits title/meta/Hn, fiche produit parfaite, maillage, longueurs
- `references/seo-local.md` — GBP, NAP, avis, citations locales, contenu Coignières/78
- `references/geo.md` — être cité par ChatGPT/Perplexity/AI Overviews : answer-first, FAQ, llms.txt, E-E-A-T, mesure
- `references/schema-markup.md` — JSON-LD : Product, Offer, LocalBusiness, FAQPage, Article, BreadcrumbList (exemples prêts)

## Pièges à éviter (vécus sur ce projet)

- Ne JAMAIS créer de 2e fiche Google Business au même endroit (l'existante se renomme, les avis se gèrent par signalement + réponse).
- Ne pas supprimer le TXT `google-site-verification` de la zone DNS Infomaniak (propriété Search Console).
- Pages produit : le contenu vient de Shopify — optimiser LÀ-BAS (metafields/description), pas en dur dans le code Next.js.
- Toute nouvelle route doit sortir dans le sitemap dynamique et avoir un canonical — vérifier après deploy.
