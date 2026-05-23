# Site rewrite — Copy V1 (aligné brand.md)

> **Audience** : Claude Code (repo `Bodystart_protocole`) + Adam.
> **But** : remplacer tout le copy du site par une version alignée brand book V2 (décisions du 2026-05-20).
> **Règles non négociables appliquées dans ce doc** :
> - Naming **BodyStart** (un mot) partout — jamais "Body Start".
> - Ton **conseil de pote, anti-bullshit** — tutoiement, pas de "premium athlète exigeant".
> - Positionnement **50 % sport / 50 % santé & bien-être**.
> - Vêtements **retiré de la home** (gardé en "bientôt" seulement si une page dédiée existe déjà, mais hors home).
> - Voix de marque **"on/nous"** (pas "je"), client tutoyé (décision Adam 2026-05-22).
> - Lexique interdit : *premium, révolutionnaire, miracle, ultra-puissant, explosif, no excuses, transformation radicale, dépassez vos limites, beast mode, shredded, approche clinique, efficacité maximale*.

---

## 0. Règle de remplacement globale (à faire en premier, partout)

| Chercher | Remplacer par |
|---|---|
| `Body Start` | `BodyStart` |
| `Body Start Nutrition` | `BodyStart` (ou `BodyStart Nutrition` quand on parle de l'enseigne complète, ex. fiche Google/légal) |
| `compléments alimentaires premium` | `compléments sport et santé` |
| `sportifs exigeants` | `sportifs et gens qui veulent se sentir bien` |
| `L'expert en nutrition sportive et performances` | `L'expert compléments sport et santé à Coignières` |
| `premium` (adjectif marketing) | supprimer ou → `propre`, `bien dosé`, `sérieux` |

⚠️ Le naming touche aussi : `meta-author`, `meta-creator`, `og:site_name`, `og:title`, `twitter:title`, `<title>`, le `© 2026 Body Start`, et l'`alt` du logo. Tout doit passer en `BodyStart`.

---

## 1. SEO / Meta global (layout)

**Title (home)**
`BodyStart — Compléments sport & santé à Coignières (78)`

**Meta description (home)**
`BodyStart, ta boutique de compléments sport et santé à Coignières. Conseil d'humain en magasin, produits propres et bien dosés, livraison dans le 78, Click & Collect en 2h.`

**Meta keywords** (garder court, local)
`compléments alimentaires Coignières, whey, créatine, magnésium, oméga 3, collagène, nutrition sportive Yvelines, click and collect 78, BodyStart`

**OG / Twitter**
- `og:site_name` : `BodyStart`
- `og:title` : `BodyStart — Compléments sport & santé à Coignières`
- `og:description` : `Conseil d'humain, produits propres, livrés dans le 78. On consomme ce qu'on vend.`
- `twitter:description` : `Compléments sport et santé, conseillés à Coignières, livrés dans le 78.`

---

## 2. HEADER / Navigation

**Bandeau promo (top bar)**
Actuel : `Livraison offerte dès 85€ · Click & Collect disponible`
Nouveau : `Livraison offerte dès 85€ · Click & Collect gratuit · -10 % abonnés Insta (lancement)` *(promo Insta à retirer après ~1 mois)*

**Items de nav**
`Nutrition` · `Coaching` · `La boutique` · `Conseil gratuit` · `Mon compte`
→ **Retirer `Vêtements / Bientôt`** de la nav principale (brand.md : pas avant qu'une offre existe).

---

## 3. HOME — section par section

### 3.1 Hero

**Sur-titre** (petit, au-dessus du H1)
`Coignières · Yvelines`

**H1**
`Les bons compléments. Le bon conseil. Sans bullshit.`

**Sous-titre**
`Que tu veuilles prendre du muscle ou juste te sentir mieux au quotidien, on t'aide à choisir ce qui te sert vraiment — et à zapper le reste. Produits propres, bien dosés, testés par nous.`

**CTA primaire** : `Voir les produits`
**CTA secondaire** : `Demander conseil` (→ /conseil)

> Note image (brief visuel, pas du copy mais à transmettre) : remplacer `hero-runner.png` (athlète/fitness model) par un visuel lifestyle naturel — comptoir bois + produits + shaker, ou une vraie scène boutique. Cf. brand.md "Style photo".

### 3.2 Bandeau de réassurance (les 4 puces qui défilent)

Actuel : `Prouvé Scientifiquement · Ingrédients Traçables · Sélection d'experts · Efficacité Maximale`
Nouveau : `Conseil d'humain · Ingrédients tracés · On teste tout en boutique · Bien dosé, pas survendu`

### 3.3 Bestsellers

**Titre** : `Les plus pris en boutique`
**Lien** : `Voir tout le catalogue`
> Garder les 4 produits dynamiques. Important : la sélection bestsellers doit inclure **au moins 1 produit santé** (oméga 3, magnésium ou collagène) pour matérialiser le 50/50, pas seulement whey/créatine/EAA.

### 3.4 Bloc "Notre sélection"

**Sur-titre** : `Notre sélection`
**Titre** : `On garde le meilleur, on jette le reste`
**Texte** :
`On ne référence pas tout ce qui existe. On teste les marques, on lit les étiquettes, on vérifie les dosages — et on ne met en rayon que ce qu'on prendrait nous-mêmes. Si un produit ne sert à rien, on te le dira.`
**CTA** : `Voir nos marques`

### 3.5 Catégories

**Titre** : `Trouve ce qui correspond à ton objectif`

Passer de 3 à **4 entrées** pour incarner le 50/50 sport/santé :

| Label | Sous-titre | Lien |
|---|---|---|
| Prise de masse & force | Whey, créatine, gainer | `/products?obj=muscle` |
| Récupération & énergie | EAA, BCAA, magnésium | `/products?obj=recuperation` |
| Santé & bien-être | Oméga 3, vitamine D, collagène, immunité | `/products?obj=sante` |
| Vegan & protéines végétales | Pour élargir, sans compromis | `/products?obj=vegan` |

### 3.6 Avis clients — ❌ SECTION RETIRÉE (décision Adam 2026-05-23)

Les avis actuels (note 4.9/5, Thomas R., Julie M., Karim B.) sont du **placeholder générique**. Décision : **on retire entièrement la section avis + la note moyenne** tant qu'on n'a pas de vrais avis. Mentir sur les avis = exactement l'inverse de l'authenticité radicale du brand book.

> **À FAIRE (hors dev, côté Adam)** : collecter de vrais avis Google (lien dans les emails post-achat + QR en boutique). Dès qu'on a ~10 avis réels, on réintègre une section avis branchée sur la vraie source (widget Google ou verbatims sourcés). En attendant : pas de fausse preuve sociale.

### 3.7 Click & Collect / Boutique

**Titre** : `Passe nous voir en boutique`
**Texte** :
`Commande en ligne, récupère à Coignières — souvent prêt en quelques minutes, on te prévient dès que c'est bon. Et tant que t'es là, on prend 5 minutes pour t'aider à choisir. C'est gratuit, et c'est tout l'intérêt d'avoir une vraie boutique.`

**Encart boutique** (inchangé sur les infos, naming à corriger) :
`BodyStart — Coignières`
`8 Rue du Pont des Landes, 78310 Coignières`
`Lundi – Dimanche · 11h – 19h`
`07 61 84 75 80` · `Itinéraire`

**Boutique 2** : garder `Ouverture prochaine` mais alléger le ton :
`Une 2ᵉ boutique arrive en Île-de-France. Laisse ton mail, on te prévient à l'ouverture.`
CTA : `Me prévenir`

### 3.8 "Nos univers"

**Titre** : `Ce qu'on fait`
**Sous-titre** : `Deux choses, bien faites.`

→ **Retirer la carte Vêtements** de la home (brand.md). Garder 2 cartes :

**Carte 1 — Nutrition**
`NUTRITION`
`Compléments sport et santé, propres et bien dosés. Le cœur de notre métier.`
CTA : `Voir les produits`

**Carte 2 — Coaching**
`COACHING`
`Un coup de main pour structurer ton entraînement et ta nutrition, avec des coachs du coin.`
CTA : `En savoir plus`

### 3.9 Bandeau services (bas de page)

Actuel : `Paiement sécurisé · Livraison 48h offerte dès 85€ · Click & Collect · SAV réactif`
Nouveau :
`Paiement sécurisé (CB, Visa, Mastercard)` · `Livraison offerte dès 85€` · `Click & Collect gratuit` · `On répond 7j/7 au téléphone`

> ✅ **RÈGLE LIVRAISON OFFICIELLE (décision 2026-05-23)** — à appliquer partout (home, fiches, page /livraison, footer, bandeau promo) :
> - **Click & Collect** : gratuit, **souvent prêt en quelques minutes**, on prévient le client dès que c'est prêt. C'est le canal à pousser (avantage local n°1). On abandonne la formulation "sous 2h" (on fait mieux).
> - **Livraison à domicile / point relais** (Colissimo & Mondial Relay) : **48–72h**. **Offerte dès 85 €**. En dessous de 85 € : forfait fixe — *montant à déterminer ensemble (pas encore figé)*.
> - **On abandonne définitivement le "J+1 dans le 78"** : intenable avec Colissimo/Mondial Relay, donc on ne le promet pas.
>
> **Pourquoi 85 €** (décision Adam 2026-05-23) : ta whey est à 69,99 € → un seul pot ne déclenche pas le franco, ce qui pousse le client à prendre un 2ᵉ article (créatine, oméga, shaker) pour atteindre 85 €. Meilleur panier moyen, et marge protégée sur les petits envois.
>
> ⚠️ Seul point ouvert : le **montant du forfait** sous 85 € (à caler ensemble). Tout le reste est figé.

### 3.10 Footer

- Logo `alt` → `BodyStart`
- Tagline : `Compléments sport et santé, conseillés à Coignières, livrés dans le 78.`
- `© 2026 BodyStart. Tous droits réservés.`
- Liens sociaux : remplacer les `#` morts par les vrais (a minima Instagram `@bodystart_nutrition`). Si pas encore prêts, **masquer les icônes** plutôt que laisser des liens `#`.
- Colonne "Boutique" : retirer les catégories qui n'existent pas encore si la page renvoie du vide ; ajouter `Santé & bien-être` bien visible (pas en dernier).

---

## 4. PAGE PRODUIT — template

### 4.1 Structure recommandée (ordre)

1. Fil d'ariane + catégorie
2. Galerie (OK actuellement)
3. Titre + note avis *(voir flag avis ci-dessus)*
4. Choix offre : **Achat unique uniquement** (abonnement -10 % retiré — décision 2026-05-23)
5. Saveur / variante
6. Quantité + Ajouter au panier
7. Bloc réassurance court (stock boutique, Click & Collect 2h)
8. **NOUVEAU bloc "Le conseil BodyStart"** (cf. 4.3) — c'est notre différenciateur
9. Valeurs nutritionnelles
10. Description longue
11. Cross-sell "Complète ton objectif"

### 4.2 Labels de sections (réécriture)

| Actuel | Nouveau |
|---|---|
| `Scientifiquement Prouvé` | `Pourquoi on l'a sélectionné` |
| `Testé en laboratoire` | `Analysé en labo` (garder, c'est factuel et vrai) |
| `Soutien Musculaire` | `À quoi ça sert` |
| `Ingrédients Naturels` | `Ce qu'il y a dedans (et pas dedans)` |
| `Pour aller plus loin` / `Recommandations` | `Ça va bien avec` |
| `Complétez votre objectif` | `Pour compléter` |
| ~~`S'abonner & économiser -10%`~~ | **❌ RETIRÉ** — voir ci-dessous |

> ✅ **DÉCISION 2026-05-23 — Abonnement supprimé.** On retire entièrement le bloc "Sélectionner l'offre / Achat unique / S'abonner -10 %" des fiches produit. Une seule option d'achat : **achat unique**. Côté dev : retirer le sélecteur d'offre, le prix "abonné", et toute logique d'abonnement Shopify si elle existe. La rétention passera par la cagnotte parrainage (loyalty V2), pas par l'abonnement. Évite aussi l'empilement de remises sur la marge whey (30 %).

### 4.3 NOUVEAU bloc "Le conseil BodyStart" (à ajouter sur chaque fiche)

C'est le bloc qui matérialise "conseil de pote" et nous distingue d'un MyProtein. Format court, par produit :

```
LE CONSEIL BODYSTART

Pour qui : [ex. "Si tu t'entraînes 3-4x/semaine et que tu veux compléter tes apports en protéines."]
Comment : [ex. "1 dose (30 g) dans 250 ml d'eau ou de lait, après la séance ou en collation."]
Le détail qui compte : [ex. "85 % de protéines, sans acides aminés ajoutés pour gonfler le taux affiché. C'est rare."]
Tu n'en as PAS besoin si : [ex. "Tu manges déjà assez de protéines dans la journée. La whey est un complément, pas un miracle."]
```

Le 4ᵉ champ ("tu n'en as pas besoin si") est **l'anti-bullshit en action**. C'est contre-intuitif commercialement mais c'est exactement le positionnement brand.md. À garder.

### 4.4 Réécriture de la description produit (exemple : Iso Zero 100% Whey)

**Titre de section** : `Une whey vraiment pure (et on va t'expliquer pourquoi)`

`L'Iso Zero, c'est 85 % de protéines de whey (WPI + WPC) — une des sources les plus pures qu'on puisse trouver. Et surtout : ces 85 % viennent uniquement de la whey, sans acides aminés synthétiques ni collagène ajoutés pour gonfler le chiffre sur l'étiquette. C'est une astuce courante dans l'industrie ; ici, il n'y en a pas.`

`Concrètement : assimilation rapide (pratique en post-séance), protéine peu dénaturée donc digestion sans lourdeur — même si tu as l'estomac sensible. 25,4 g de protéines par dose de 30 g.`

`Certifiée anti-dopage (norme AFNOR NF V94-001) : si tu es en compétition, tu peux la prendre sans stress.`

> Garder les mentions factuelles vraies (labo, anti-dopage, indice chimique). **Supprimer** : `Une Pureté Inégalée` (→ trop superlatif), `propulsant directement` (→ jargon pub). On garde la pédagogie, on jette le marketing.

---

## 5. PAGE COACHING — réécriture (ton actuel = le plus hors-marque)

La page coaching est celle qui viole le plus le brand book (`DÉPASSEZ VOS LIMITES`, `transformation radicale`, `UNE APPROCHE CLINIQUE`, `NO EXCUSES`, `+8KG DE MUSCLE`). À reprendre intégralement.

**Hero H1** : `Un coach qui s'adapte à toi, pas l'inverse`
**Sous-titre** : `Que ton objectif soit la masse, la perte de poids ou juste reprendre le sport sans te blesser, on te met en relation avec un coach du coin et un programme qui tient compte de ton emploi du temps.`
**CTA** : `Voir les formules` · `Comment ça marche`

**Sur-titre "LA MÉTHODE"** → `Comment on bosse`
`UNE APPROCHE CLINIQUE` → `Simple et concret`

Blocs méthode :
- `PROGRAMMES SUR-MESURE` → `Un programme adapté` : `À ton niveau, ton matériel et le temps que tu as vraiment.`
- `SUIVI PERSONNALISÉ` → `Un coach qui suit` : `On ajuste ton programme chaque semaine selon ce qui marche pour toi.`
- `PROGRESSION GARANTIE` → `Des résultats concrets` : *(retirer "garantie" — promesse intenable, lexique interdit)* `Des objectifs mesurables, qu'on revoit ensemble régulièrement.`
- `DISPONIBLE 7J/7` → `Dispo quand tu veux` : `Ton espace coach accessible depuis ton mobile, à tout moment.`

**Témoignages** : retirer les claims chiffrés invérifiables (`+8KG`, `-12KG`, `PODIUM`) sauf s'ils sont réels et autorisés. → **À CONFIRMER ADAM**.

**Bandeau final** : `NO EXCUSES · DEVENEZ LA MEILLEURE VERSION DE VOUS-MÊME`
→ `Envie de t'y mettre sérieusement ? On en parle.`
CTA : `Choisir ma formule` · `Voir la nutrition`

> "PROGRESSION GARANTIE" et "-15 % sur les vêtements" : retirer la mention vêtements (pas d'offre). Le `-15 % permanent sur les compléments` pour les abonnés coaching → **à arbitrer** avec l'empilement des promos (cf. flag 4.2).

---

## 6. PAGE CONSEIL (/conseil)

Ton déjà correct et proche de la marque. Petits ajustements :

**H1** : `Conseil personnalisé` → `Dis-nous ton objectif, on prépare le reste`
**Sous-titre** : OK, tutoiement déjà présent. Corriger les accents manquants (`Coignieres` → `Coignières`, `Energie` → `Énergie`, `Recuperation` → `Récupération`, `Immunite` → `Immunité`, `coordonnees` → `coordonnées`, `defenses` → `défenses`). Bug d'encodage à régler.

Les 6 objectifs sont bons (ils couvrent sport ET santé → cohérent 50/50). Garder.

---

## 7. Arbitrages — statut

1. ✅ **Avis clients** : placeholder → **retirés** (note + verbatims) jusqu'à de vrais avis Google. Cf. §3.6.
2. ✅ **Règle de livraison** : **C&C gratuit (prêt en minutes) + livraison offerte dès 85 €, 48–72h, J+1 abandonné**. Cf. §3.9. Seul point ouvert : montant du forfait sous 85 € (à caler ensemble).
3. ✅ **Abonnement -10 %** : **retiré** des fiches. Achat unique only. Cf. §4.2.
4. ⏸️ **-15 % coaching** : sans objet — coaching en standby total (cf. `strategy/decisions/2026-05-23-coaching-standby.md`).
5. ⏸️ **Témoignages coaching chiffrés** : sans objet — coaching masqué.
6. ⏳ **Domaine définitif** (cf. `strategy/decisions/`) : impacte les liens canoniques/OG une fois tranché. **Encore ouvert.**

→ Le copy est **finalisable** : il ne reste qu'un chiffre (forfait livraison <60 €) et, à terme, le domaine.

---

## 8. Hors-scope de ce doc (copy uniquement)

Ce doc ne couvre PAS : le design visuel (couleurs, typo, images — voir brand.md §Identité visuelle), l'intégration loyalty/parrainage côté UI (voir `loyalty-system-spec.md` + sprints), ni les pages légales (mentions, CGV, confidentialité — à faire relire mais hors refonte ton).
