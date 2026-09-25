---
name: bodystart-voix
description: "Voix et règles de rédaction BodyStart Nutrition. Chargé automatiquement dès qu'on écrit ou modifie un texte destiné aux clients : fiche produit Shopify (description, SEO, metafields), article de blog, email (marketing ou transactionnel), bandeau, notification, microcopy d'interface, JSON-LD. Contient le registre, le lexique interdit, la ponctuation (zéro tiret long), l'équité entre catégories et marques, et le cadre des allégations santé."
user-invocable: false
---

# Voix BodyStart

Un texte BodyStart se lit comme un conseil donné au comptoir de la boutique de Coignières : direct, concret, sans jargon inutile et sans promesse creuse. Avant publication d'une fiche, d'un article ou d'un email, passer le texte à l'agent `relecture-fiche` (conformité UE 1924/2006 + relecture de voix).

## 1. Identité et registre

- **Nom** : `BodyStart` en un mot. `BodyStart Nutrition` seulement pour l'enseigne complète (fiche Google, mentions légales, pied d'email). Jamais « Body Start ».
- **Qui parle** : « on » / « nous » (l'équipe de la boutique). Jamais « je ».
- **À qui** : le client est tutoyé, sur le site comme dans les emails. Vouvoiement uniquement dans les pages légales et les emails de facturation.
- **Ton** : conseil de pote qui connaît son sujet. Positionnement 50 % sport, 50 % santé et bien-être. On consomme ce qu'on vend.
- **Phrases courtes**, une idée par phrase. Chiffres précis plutôt qu'adjectifs : « 3 g de créatine par dose », pas « dosage puissant ».
- **Local** quand c'est utile : boutique à Coignières (78), retrait gratuit, livraison France, conseil gratuit sur place.

## 2. Lexique interdit

Mots et tournures à ne jamais écrire dans un texte client :

| Interdit | Pourquoi | À la place |
| --- | --- | --- |
| premium, haut de gamme (marketing) | vide de sens | propre, bien dosé, sérieux, transparent |
| révolutionnaire, miracle, ultra-puissant, explosif | promesse creuse | ce que le produit contient et fait, chiffré |
| no excuses, beast mode, shredded, dépassez vos limites, transformation radicale | registre « salle hardcore » | performance, progression, récupération |
| approche clinique, efficacité maximale | pseudo-scientifique | « étudié », « dosé selon les études » avec la dose |
| sans bullshit | interdit dans le contenu du site (décision Adam) | « franc », « clair », « sans blabla » |
| « -10 % abonnés Insta » en dur dans une page | promo périmée | bandeau daté ou code promo avec date de fin |
| Tournures IA : « plongez dans », « découvrez un monde de », « que vous soyez X ou Y », « n'hésitez pas à », « en somme » | style artificiel | dire la chose simplement |

## 3. Ponctuation et typographie (règle du gérant)

**Aucun tiret long** : ni « — » (cadratin) ni « – » (demi-cadratin), nulle part dans un texte client. Le trait d'union simple reste normal (pré-workout, bêta-alanine, Click & Collect en 2 h).

| Ce qu'on voulait dire avec le tiret | Remplacement |
| --- | --- |
| Titre SEO « Produit — bénéfice » | « Produit Marque : bénéfice » |
| Précision en fin de phrase | virgule ; ou point + majuscule si la suite est une phrase complète ou un impératif |
| Explication, reformulation | deux-points |
| Incise entre deux tirets | parenthèses |
| Plage « 20 – 30 min » | « 20 à 30 min » |
| Libellé format « 300 g — 100 doses » | « 300 g, 100 doses » |

Typographie française : espace insécable avant `:` `;` `!` `?` `€` `%` (`&nbsp;` en HTML). Guillemets « et ». Prix « 69,90 € », unités avec espace « 30 g », « 2 000 UI », « 500 mg ». Heures « 11 h à 19 h ».

## 4. Équité catalogue (retour Adam, 07/09/2026)

- **Jamais dénigrer une catégorie vendue** : brûleurs, boosters, BCAA, gainers, pré-workouts sont en rayon. On ne dit jamais « X est inutile » ni « ne prends pas de Y ». On dit pour qui et quand une catégorie est utile.
- **Jamais une seule marque ou un seul produit « référence »** dans un texte transversal (email, blog, bandeau). Parler en catégories : « une protéine en poudre : whey, isolate, native ou végétale, on t'aide à choisir ». Une fiche produit peut évidemment parler de son produit.
- **Priorités présentées en positif** : « les compléments qui aident quand tu débutes : … », jamais une liste de ce qu'il ne faut pas acheter.
- **Terminer par le conseil gratuit** (boutique, formulaire /conseil, téléphone) plutôt que par une injonction d'achat.

## 5. Allégations santé et mentions obligatoires

Cadre : règlement (CE) 1924/2006 et liste des allégations autorisées (règlement (UE) 432/2012 et suivants). Détail et liste de travail dans `.claude/agents/relecture-fiche.md` et `references/allegations-ue.md` de cet agent.

- Une allégation santé n'est possible que si elle est **autorisée** et formulée en « contribue à … » (ou équivalent proche). Exemples valides : « le magnésium contribue à réduire la fatigue », « la créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée » (avec 3 g par jour).
- **Interdit** : guérir, soigner, prévenir une maladie ; « brûle les graisses », « booste la testostérone », « anti-inflammatoire », « détox », « renforce l'immunité » sans nutriment porteur d'une allégation autorisée ; toute promesse chiffrée de perte de poids ou de gain musculaire.
- **Collagène, BCAA, L-carnitine, CLA, glutamine, citrulline, bêta-alanine, tribulus** : aucune allégation santé autorisée. On décrit la composition, le dosage et l'usage, sans bénéfice santé affirmé.
- **Caféine** : allégations en attente au niveau UE, rester descriptif (« 200 mg de caféine par dose »). Au-delà de 150 mg de caféine par jour : mention « Teneur élevée en caféine, déconseillé aux enfants et aux femmes enceintes ou allaitantes ».
- **Mentions obligatoires compléments alimentaires** (à citer sur la fiche ou dans le bloc « Conseils d'utilisation ») : ne pas dépasser la dose journalière recommandée ; ne se substitue pas à une alimentation variée et équilibrée et à un mode de vie sain ; tenir hors de portée des jeunes enfants.
- Ne jamais écrire « certifié antidopage » ou « norme AFNOR NF V94-001 » sans certificat fourni par la marque.

## 6. Formats par support

| Support | Règles |
| --- | --- |
| Fiche produit | Structure « réponse d'abord » du skill `bodystart-seo-geo` : 1re phrase = ce que c'est et pour qui ; puis pourquoi celui-là (dosages, labels) ; puis comment l'utiliser. 150 à 300 mots. Données officielles de la marque dans les metafields, jamais inventées. |
| Titre SEO | « Produit Marque : bénéfice ou catégorie », 60 caractères max avant le suffixe « \| BodyStart Nutrition » ajouté par le template. |
| Meta description | 155 caractères max : bénéfice + preuve (dosage, label) + dispo locale si pertinent. |
| Email marketing | Objet 50 caractères max, sans majuscules criardes ni emoji en série. Un seul CTA. Code promo avec date de fin. Signature : BodyStart Nutrition, 8 rue du Pont des Landes, 78310 Coignières, 07 61 84 75 80. Lien de désinscription obligatoire. |
| Email transactionnel | Aller à l'info en une phrase, puis le lien. Rappeler pourquoi le client reçoit ce message. |
| Bandeau | 60 caractères max, daté si promotion, jamais de vert en grande surface (design system). |
| Microcopy UI | Verbe à l'impératif court (« Ajouter au panier », « Me prévenir »). Messages d'erreur : ce qui s'est passé + quoi faire. |
| JSON-LD | Mêmes textes que la page (pas de version enjolivée). NAP identique partout. |

## 7. Vérification avant publication

1. Zéro « — » ou « – » dans le texte (le hook `no-dash` le vérifie sur les fichiers du repo ; pour Shopify, relire).
2. Aucun mot du lexique interdit, aucune tournure IA.
3. Aucune catégorie dénigrée, aucune marque unique érigée en référence dans un texte transversal.
4. Chaque allégation santé est dans la liste autorisée et son nutriment est présent en quantité suffisante (au moins « source de », 15 % des VNR par dose journalière).
5. Prix, dosages, formats, adresse et horaires vérifiés dans Shopify ou `src/lib/shopify/types.ts`.
6. Relecture par l'agent `relecture-fiche` pour tout texte qui contient une allégation.
