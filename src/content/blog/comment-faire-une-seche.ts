import type { BlogArticle } from '@/lib/blog'

// Article pilier SEO/GEO — cible « comment faire une sèche / sèche musculation
// / programme sèche ». Pilier du cluster brûleurs (1 seul article avant).
// COMPLIANCE UE 1924/2006 : le moteur = déficit calorique (cohérent avec
// bruleurs-de-graisse-ca-marche : « aucun brûleur ne fait maigrir sans
// déficit ») ; protéines = « contribuent au maintien et au développement de la
// masse musculaire » (autorisée) ; caféine = vigilance (autorisée) ;
// L-carnitine/CLA présentés SANS allégation minceur. Chiffres cohérents avec
// combien-de-proteines-par-jour (1,6-2,2 g/kg → haut de fourchette en sèche).
// Handles + prix vérifiés Shopify 2026-08-05. Packs Sèche NON liés (DRAFT).
export const commentFaireUneSeche: BlogArticle = {
  slug: 'comment-faire-une-seche',
  title: 'Comment faire une sèche : le guide complet',
  metaTitle: 'Comment faire une sèche : le guide complet',
  metaDescription:
    'Déficit calorique modéré, protéines élevées, musculation maintenue : la méthode complète pour sécher sans perdre de muscle, étape par étape.',
  excerpt:
    "Une sèche réussie tient en trois piliers : un déficit calorique modéré (300 à 500 kcal sous ta maintenance), un apport en protéines élevé pour préserver le muscle, et une musculation maintenue lourde. Vise une perte de 0,5 à 1 % de ton poids par semaine — les compléments sont une aide, jamais le moteur.",
  datePublished: '2026-08-05',
  dateModified: '2026-08-05',
  sections: [
    {
      h2: "Une sèche, c'est quoi exactement ?",
      blocks: [
        {
          type: 'p',
          text: "Sécher, c'est perdre du gras **en gardant un maximum de muscle**. C'est ce qui distingue une sèche d'un simple régime : on ne cherche pas juste à voir la balance descendre, on cherche à ce que ce qui part soit du tissu adipeux, pas le muscle construit pendant des mois.",
        },
        {
          type: 'p',
          text: "La mécanique de base est simple et non négociable : pour perdre du gras, il faut un **déficit calorique** — dépenser plus que ce qu'on mange. Tout le reste (répartition des repas, choix des aliments, compléments, cardio) sert à rendre ce déficit tenable et à protéger le muscle pendant qu'il agit.",
        },
        {
          type: 'p',
          text: "Une sèche n'est pas non plus une course : les transformations express promises en 4 semaines finissent en perte de muscle, en fatigue et en reprise de poids. La bonne sèche est modérée, structurée, et dure le temps qu'il faut.",
        },
      ],
    },
    {
      h2: 'Étape 1 : créer un déficit calorique modéré',
      blocks: [
        {
          type: 'p',
          text: "Commence par estimer ta **maintenance** : le niveau de calories qui stabilise ton poids actuel (les calculateurs en ligne donnent un bon point de départ, à ajuster avec la balance sur 2 semaines). Puis retire **300 à 500 kcal par jour**. Pas plus.",
        },
        {
          type: 'p',
          text: "Pourquoi modéré ? Parce qu'un déficit agressif (−800, −1 000 kcal) fait perdre du muscle avec le gras, effondre l'énergie à l'entraînement et rend la diète intenable. Un déficit de 300 à 500 kcal produit une perte régulière tout en laissant assez de carburant pour t'entraîner correctement.",
        },
        {
          type: 'list',
          items: [
            'Pèse-toi 2 à 3 fois par semaine, le matin, et raisonne en **moyenne hebdomadaire** (le poids fluctue avec l\'eau).',
            'Si la moyenne ne bouge pas après 2 semaines, retire 100 à 200 kcal de plus.',
            'Si tu perds trop vite (voir étape 4), remonte légèrement les calories.',
          ],
        },
      ],
    },
    {
      h2: 'Étape 2 : monter les protéines pour préserver le muscle',
      blocks: [
        {
          type: 'p',
          text: "En déficit, le corps peut puiser dans le muscle. Ta meilleure protection : un apport en protéines **élevé** — vise le haut de la fourchette, autour de **2 à 2,2 g par kilo de poids de corps et par jour** (on détaille le calcul dans [combien de protéines par jour](/blog/combien-de-proteines-par-jour)). Les protéines contribuent au maintien et au développement de la masse musculaire — exactement ce qu'on veut défendre en sèche.",
        },
        {
          type: 'p',
          text: "C'est là qu'une protéine en poudre devient vraiment utile : atteindre 160 g de protéines par jour en mangeant moins de calories n'est pas simple. Une [isolate comme l'Iso Zero](/products/iso-zero-100-whey) apporte ~25 g de protéines par shaker avec très peu de glucides et de lipides — pratique quand chaque calorie compte. Petit budget ? Une [whey classique](/products/whey-native-protimuscle) fait très bien le travail. On compare les deux dans [whey ou isolate](/blog/whey-ou-isolate-quelle-difference).",
        },
      ],
    },
    {
      h2: 'Étape 3 : garder la musculation lourde, le cardio en appoint',
      blocks: [
        {
          type: 'p',
          text: "Erreur classique : basculer tout l'entraînement en cardio et en séries longues « pour sécher ». C'est l'inverse qu'il faut faire. Le muscle se maintient quand il reste **stimulé par des charges lourdes** : garde tes exercices de base et tes charges autant que possible, quitte à réduire un peu le volume total si la récupération suit moins.",
        },
        {
          type: 'p',
          text: "Le cardio est un **outil d'appoint** pour creuser la dépense sans retirer plus d'assiette : 2 à 3 sessions modérées par semaine suffisent largement. Et ne sous-estime pas l'activité quotidienne (marche, escaliers) — c'est souvent le levier de dépense le plus facile à augmenter sans fatigue supplémentaire.",
        },
      ],
    },
    {
      h2: 'Étape 4 : le bon rythme et la bonne durée',
      blocks: [
        {
          type: 'p',
          text: "Le rythme cible : perdre **0,5 à 1 % de ton poids par semaine** (pour 80 kg : 400 à 800 g). Plus vite, tu risques d'entamer le muscle ; plus lentement, la diète s'éternise et la motivation s'use.",
        },
        {
          type: 'p',
          text: "À ce rythme, une sèche complète dure généralement **8 à 16 semaines** selon le point de départ et l'objectif. Sur une sèche longue, une semaine de pause à maintenance toutes les 6 à 8 semaines aide à souffler mentalement et physiquement, puis on repart. Et le sommeil n'est pas une option : c'est pendant la nuit que la récupération se joue — une sèche avec 5 h de sommeil par nuit est une sèche sabotée.",
        },
      ],
    },
    {
      h2: 'Les erreurs qui ruinent une sèche',
      blocks: [
        {
          type: 'list',
          items: [
            '**Le déficit trop agressif** : perte de muscle, fatigue, craquages — et reprise derrière.',
            '**Sabrer les protéines avec le reste** : c\'est le seul macronutriment à protéger coûte que coûte.',
            '**Tout miser sur le cardio** en abandonnant les charges : le signal de maintien musculaire disparaît.',
            '**Compter sur un brûleur « magique »** : aucun complément ne fait perdre de gras sans déficit — on l\'explique en détail dans [notre article honnête sur les brûleurs](/blog/bruleurs-de-graisse-ca-marche).',
            '**Les week-ends « off »** : deux jours sans compter peuvent effacer le déficit de toute la semaine.',
            '**Se fier au poids d\'un seul jour** : l\'eau fait fluctuer la balance ; juge sur la moyenne de la semaine et sur le miroir.',
          ],
        },
      ],
    },
    {
      h2: 'Quels compléments pendant une sèche ?',
      blocks: [
        {
          type: 'p',
          text: "Soyons clairs comme au comptoir : les compléments **accompagnent** une sèche déjà structurée, ils ne la remplacent pas. Voici ce qui a du sens, par ordre d'utilité :",
        },
        {
          type: 'list',
          items: [
            "**Une protéine en poudre** (whey ou isolate) : le plus utile de tous — tenir son quota de protéines avec peu de calories.",
            "**Une multivitamine** : en déficit, on mange moins, donc moins de micronutriments — un [filet de sécurité pertinent](/blog/multivitamines-utile-comment-choisir) pendant la diète.",
            "**Les classiques de sèche** (L-carnitine, CLA, formules thermogéniques) : en accompagnement, pour les pratiquants qui veulent tout mettre de leur côté — sans leur prêter de pouvoirs magiques. Les formules à base de caféine aident à maintenir la vigilance quand l'énergie baisse en fin de diète.",
          ],
        },
        {
          type: 'table',
          headers: ['Produit', 'Rôle dans la sèche', 'Prix'],
          rows: [
            ['[Iso Zero 100% Whey](/products/iso-zero-100-whey)', 'Quota protéines, quasi zéro glucides/lipides', '74,90 €'],
            ['[L-Carnitine Pro Zero](/products/l-carnitine-pro-zero-liquide)', 'Le classique de sèche, liquide zéro sucre', '22,90 €'],
            ['[CLA 2400](/products/cla-2400)', "L'acide gras populaire en période de régime", '22,90 €'],
            ['[Iron Ultra Fat Burner](/products/iron-ultra-fat-burner)', 'La formule complète pour pratiquants avancés', '44,90 €'],
          ],
        },
        {
          type: 'p',
          text: "Tu retrouves tout le rayon dans [brûleurs et minceur](/categories/bruleurs) et les protéines dans [le rayon protéines](/categories/proteines). Et si tu ne sais pas par où commencer ta sèche, passe en boutique à Coignières : on regarde ton objectif et on te dit honnêtement ce qui est utile — et ce qui ne l'est pas.",
        },
      ],
    },
  ],
  howToSteps: [
    {
      name: 'Calculer son déficit calorique',
      text: "Estime ta maintenance (les calories qui stabilisent ton poids), puis retire 300 à 500 kcal par jour. Un déficit modéré fait perdre du gras en préservant l'énergie et le muscle.",
    },
    {
      name: 'Fixer un apport en protéines élevé',
      text: "Vise 2 à 2,2 g de protéines par kilo de poids de corps et par jour pour protéger la masse musculaire pendant le déficit. Une whey ou une isolate aide à tenir ce quota avec peu de calories.",
    },
    {
      name: 'Maintenir la musculation lourde',
      text: "Garde tes exercices de base et tes charges : c'est le signal qui dit au corps de conserver le muscle. Ajoute 2 à 3 sessions de cardio modéré en appoint si besoin.",
    },
    {
      name: 'Suivre le bon rythme',
      text: "Pèse-toi 2 à 3 fois par semaine et raisonne en moyenne : l'objectif est de perdre 0,5 à 1 % du poids de corps par semaine, sur 8 à 16 semaines selon l'objectif.",
    },
    {
      name: 'Ajuster toutes les deux semaines',
      text: "Si la moyenne ne descend plus, retire 100 à 200 kcal ou ajoute un peu d'activité. Si la perte est trop rapide, remonte légèrement les calories. Sur une sèche longue, fais une semaine à maintenance toutes les 6 à 8 semaines.",
    },
  ],
  faq: [
    {
      q: 'Combien de calories en moins pour faire une sèche ?',
      a: "Un déficit de 300 à 500 kcal par jour sous ta maintenance est le bon réglage : assez pour perdre du gras régulièrement, pas assez pour sacrifier le muscle et l'énergie à l'entraînement. Les déficits agressifs font perdre du muscle et finissent en reprise de poids.",
    },
    {
      q: 'Combien de protéines par jour pendant une sèche ?',
      a: "Vise le haut de la fourchette : environ 2 à 2,2 g de protéines par kilo de poids de corps et par jour. Les protéines contribuent au maintien de la masse musculaire — c'est ta meilleure protection contre la fonte musculaire en déficit.",
    },
    {
      q: 'Faut-il faire beaucoup de cardio pour sécher ?',
      a: "Non. Le moteur de la sèche est le déficit calorique, et la priorité à l'entraînement est de garder la musculation lourde pour maintenir le muscle. Le cardio est un appoint : 2 à 3 sessions modérées par semaine suffisent, complétées par de la marche quotidienne.",
    },
    {
      q: 'Combien de temps dure une sèche ?',
      a: "Au rythme recommandé de 0,5 à 1 % du poids de corps perdu par semaine, une sèche complète dure généralement 8 à 16 semaines. Sur une sèche longue, une semaine de pause à maintenance toutes les 6 à 8 semaines aide à tenir sur la durée.",
    },
    {
      q: 'Quels compléments prendre pendant une sèche ?',
      a: "Par ordre d'utilité : une protéine en poudre (whey ou isolate) pour tenir le quota de protéines avec peu de calories, une multivitamine pour couvrir les micronutriments en déficit, puis les classiques de sèche (L-carnitine, CLA, thermogéniques) en accompagnement. Aucun complément ne fait perdre de gras sans déficit calorique.",
    },
  ],
  products: [
    { handle: 'iso-zero-100-whey', label: 'Iso Zero 100% Whey' },
    { handle: 'l-carnitine-pro-zero-liquide', label: 'L-Carnitine Pro Zero' },
    { handle: 'cla-2400', label: 'CLA 2400' },
    { handle: 'iron-ultra-fat-burner', label: 'Iron Ultra Fat Burner' },
  ],
  categories: [
    { slug: 'bruleurs', label: 'Brûleurs & minceur' },
    { slug: 'proteines', label: 'Protéines' },
  ],
  related: ['bruleurs-de-graisse-ca-marche', 'combien-de-proteines-par-jour', 'whey-ou-isolate-quelle-difference'],
}
