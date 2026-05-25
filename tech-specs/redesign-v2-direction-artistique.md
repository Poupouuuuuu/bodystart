# Redesign V2 BodyStart — Direction artistique + structure des pages

> **But** : un site qui fait "wow", qui respire, qui inspire confiance et **donne envie d'acheter**. Premium et épuré, mais chaleureux (sport + santé, conseil de pote). Pas de muscu agressive, pas de site sombre et chargé.
> **Audience** : Claude Code (repo `Bodystart_protocole`). Ce doc est la DA de référence pour redesigner les pages une par une.
> **Méthode** : page par page, sur branche, déploiement preview, **revue du rendu réel** (Adam + tech-coordinator via l'extension Chrome), ajustements, puis merge. Jamais de merge à l'aveugle sur un changement visuel.

---

## A. DIRECTION ARTISTIQUE

### Principe directeur
Less is more. Chaque section respire (beaucoup de blanc), une seule idée par bloc, une hiérarchie évidente. Le luxe ici c'est l'**espace** et la **photo**, pas l'accumulation d'éléments. Référence mentale : une marque de compléments premium minimaliste, mais avec de la chaleur humaine (lumière naturelle, vrais gens, comptoir bois).

### Palette (validée, cf. brand.md)
- Fond principal : **crème `#FAF8F3`**. Cartes/surfaces : **blanc `#FFFFFF`**.
- Vert frais **`#3B7A3F`** : boutons / CTA (texte blanc dessus).
- Sapin **`#2D5A2D`** : titres, texte fort, accents verts.
- Texte courant : anthracite `#2A2A2A`. Texte secondaire : gris doux `#6B6B66`.
- Accents : **moutarde `#C9A227`** (best-seller, médaille) · **terracotta `#B85C3E`** (promo, stock bas, alerte).
- Règle : **le vert ne couvre JAMAIS de grandes surfaces**. Surfaces claires dominantes, vert en accent. Pas de bandeaux pleine largeur vert foncé.

### Typographie
- Titres : Montserrat ExtraBold (ou Inter Bold), gros, tracking serré (`letter-spacing:-0.01em`), **sentence case** (pas de ALL CAPS criard). Hero très grand (44-56px desktop), hiérarchie nette (H1 >> H2 >> H3).
- Body : Inter, 16px, `line-height:1.6-1.7`, gris doux pour le secondaire.
- Deux graisses max (regular + semibold). Pas de gras partout.

### Espacement & layout
- Conteneur max ~1200px, marges latérales généreuses.
- Rythme vertical large : sections espacées (80-120px desktop), padding interne aéré.
- Grilles propres (`auto-fit`), alignements stricts. Rien qui touche les bords.

### Composants
- **Boutons** : pill (radius full), vert frais `#3B7A3F` fond + blanc, hover légèrement plus foncé. Secondaire : contour sapin, fond transparent. Taille confortable (padding 12-14px vertical).
- **Cartes** : fond blanc, bordure très fine `0.5px` (vert très transparent), radius large (14-16px), padding généreux. **Pas d'ombres lourdes** ; au plus une ombre très subtile au survol (lift léger).
- **Badges** : best-seller = moutarde + texte brun foncé · stock bas = terracotta + blanc · santé = vert pâle + sapin. Petits, discrets, pill.
- **Pastilles bénéfices** : fond vert pâle `#eef4ec`, texte sapin, pour les faits clés (g de protéines, sans sucre, anti-dopage).
- **Inputs** : épurés, bordure fine, focus ring vert discret.

### Imagerie (crucial pour le wow)
- **Lifestyle naturel** : lumière matinale, fond flouté, comptoir bois, shaker, mains, vrais clients. **JAMAIS de fitness model huilé**.
- Macro produits sur fond clair pour montrer la qualité.
- Photos de la vraie boutique de Coignières (le différenciateur local).
- Cohérence : même traitement lumineux/chaud partout. (À sourcer côté Adam ; en attendant, placeholders propres, surtout pas de banque d'images cliché.)

### Micro-interactions
- Survol cartes : lift subtil + légère ombre. Apparition au scroll : fade/slide discret. Scroll fluide. CTA collant sur fiche produit. Tout doit rester **sobre** : on suggère la qualité, on ne clignote pas.

### Références à canaliser (le feel, pas le copier)
- **Form Nutrition** : premium minimal, énormément de blanc, photo produit superbe, typo forte.
- **Huel** : système clair, bold, lisible, cohérent.
- Une touche **chaleur artisanale FR** (lumière, bois, humain) pour ne pas être froid.

### Accessibilité & perf (standards à tenir)
- Contraste WCAG AA partout. Lighthouse ≥ 90 sur home, fiche produit, catalogue. Pas de CLS (réserver les tailles d'images).

---

## B. STRUCTURE & CRO PAR PAGE

### Home
1. Hero : promesse claire (H1 "Les bons compléments. Le bon conseil."), sous-titre, CTA vert + CTA conseil, micro-preuve réelle ("+2 600 clients · ouvert 7j/7 · testé en boutique"), grande photo lifestyle.
2. Bandeau réassurance (4 puces : conseil d'humain · ingrédients tracés · testé en boutique · bien dosé).
3. "Les plus pris en boutique" : 4 best-sellers, badge moutarde, **au moins 1 produit santé** (50/50), ajout rapide.
4. "Trouve ton objectif" : 4 cartes (Masse & force · Récup & énergie · Santé & bien-être · Vegan) → auto-segmentation.
5. "Le conseil qu'aucun site n'a" : section différenciante, photo boutique, expert humain + Click & Collect 2 min.
6. Bande parrainage : "Ton pote a 5 €, tu gagnes 5 % pendant 1 an" → CTA `/parrainage` (exploite la fidélité live).
7. Boutique & Click & Collect : adresse, horaires, itinéraire, "prêt en quelques minutes".
8. Avis : **vrais avis Google uniquement**, quand le volume existe. Pas de faux.

### Fiche produit (page de conversion n°1)
1. Buy box (2 colonnes) : galerie image à gauche ; à droite titre, pastilles bénéfices, prix lisible, sélecteur de saveur visuel, quantité, gros CTA vert, **réassurance juste sous le bouton** (livraison 85 €, retrait 2 min, paiement sécurisé), stock.
   - **Stock exact (décision Adam)** : si stock **≤ seuil (5)** → afficher le chiffre exact en accent terracotta ("Plus que 2 en stock") pour créer une urgence honnête. Si stock haut → "En stock" sans chiffre. Stock issu de Shopify (réel, jamais de fausse rareté).
2. Bloc "Le conseil BodyStart" : Pour qui · Comment · Le détail qui compte · **Tu n'en as PAS besoin si...** (anti-bullshit, crée la confiance, réduit les retours). Placé haut.
3. "À quoi ça sert" : 3 cartes (analysé en labo · récupération · ingrédients propres).
4. Valeurs nutritionnelles : tableau clair.
5. Description : copy réécrit, pédagogue, sans superlatif (cf. `site-rewrite-copy-v1.md`).
6. Avis réels.
7. Cross-sell "Pour compléter" + **nudge franco** ("plus que X € pour la livraison offerte") → panier moyen.
8. Barre d'achat collante au scroll (prix + Ajouter au panier).

### Catalogue
1. En-tête : titre + nombre de produits + tri.
2. Filtres par objectif (chips) + bouton "Filtres" pour le fin (catégorie, prix, saveur).
3. Grille de cartes : image, badge (best-seller / "Plus que X" / santé), titre, bénéfice court, prix, ajout "+".
4. "Voir plus" propre (pas de scroll infini).

### Packs (levier panier moyen)
1. Hero court : "Nos packs, pensés pour aller ensemble" + l'économie réalisée mise en avant.
2. Cartes de packs : composition visuelle (les produits inclus), prix barré → prix pack, **% ou € économisés en moutarde**, badge "économise X €". CTA ajouter le pack.
3. Mettre en avant des packs qui passent au-dessus de 85 € (franco) : "objectif prise de masse", "routine santé", "récup". Levier AOV direct.
4. Possibilité "compose ton pack" plus tard (hors V2 initial).

### Conseil (`/conseil`)
Déjà proche de la marque. Garder le formulaire objectif → boutique, l'épurer dans la nouvelle DA, corriger les accents. C'est un super outil de capture + différenciation (le conseil humain).

### La boutique (`/stores`)
SEO local fort (Coignières/78). Belle photo de la boutique, carte, horaires, itinéraire, le Click & Collect, "venez nous voir". Section humaine (l'équipe, le conseil).

### Parrainage (`/parrainage`)
Déjà refait en L4 et validé. Juste réaligner sur la nouvelle DA claire (surfaces, boutons) lors du re-theme.

### Compte (`/account`)
Onglets propres (cagnotte, parrainage, commandes, profil). Réaligner sur la DA. La cagnotte mise en valeur (solde en gros, dans la nouvelle palette).

### Pages légales (CGV, mentions, confidentialité, livraison)
Sobres, lisibles, dans la DA. Pas de fioritures, juste propres et clairs.

---

## C. WORKFLOW D'EXÉCUTION

1. Tokens de la palette dans `tailwind.config.ts` + `globals.css` (source de vérité). Pas de couleurs en dur dans les composants.
2. **Une page à la fois**, sur branche dédiée. Build + Lighthouse OK.
3. Déploiement **preview** → revue du rendu réel (Adam le regarde, tech-coordinator vérifie via l'extension Chrome) → ajustements → merge `main` seulement après validation visuelle.
4. **Ne touche à AUCUNE logique** (loyalty, panier, auth, checkout). C'est purement visuel + structure + copy déjà validé.
5. Ordre recommandé : home → fiche produit → catalogue → packs → conseil/boutique → compte → légales.

> Copy de référence : `site-rewrite-copy-v1.md`. Palette : `brand.md`. Re-theme tokens : `site-retheme-palette.md` (à fusionner avec ce doc, c'est le même chantier).
