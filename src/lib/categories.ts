/**
 * Registre des pages catégories SEO (/categories/[slug]).
 *
 * Les slugs sont VOLONTAIREMENT identiques aux filtres `?cat=` de /products
 * (mapping productType inchangé, cf. ProductsPageClient) : une seule taxonomie.
 * Chaque intro est UNIQUE, answer-first (c'est quoi / pour qui / comment
 * choisir), voix de marque, allégations UE 1924/2006 propres.
 *
 * Consommé par : /categories/[slug], le sitemap, le footer (maillage entrant),
 * et public/llms.txt (liens catégories).
 */

export interface CategoryPage {
  slug: string
  /** productType Shopify exact (filtre Storefront `product_type:'…'`). */
  productType: string
  label: string
  /** Title SEO sans le suffixe global (≤ 60 car.). */
  metaTitle: string
  /** ≤ 155 car. */
  metaDescription: string
  h1: string
  /** 100-200 mots, answer-first. Inline autorisé : aucun (texte brut). */
  intro: string[]
  /** Produits phares liés dans le bloc « Nos choix » (handles RÉELS). */
  featured: { handle: string; label: string }[]
  related: { slug: string; label: string }[]
  /** Article(s) de blog liés (slugs du registre blog). */
  guides: { slug: string; label: string }[]
}

export const CATEGORY_PAGES: CategoryPage[] = [
  {
    slug: 'proteines',
    productType: 'Protéines',
    label: 'Protéines',
    metaTitle: 'Protéines : whey, isolate, caséine et gainers',
    metaDescription:
      'Whey, isolate, caséine, gainer : des protéines sélectionnées, en stock à Coignières (78) et livrées partout en France. Conseil gratuit en boutique.',
    h1: 'Protéines en poudre : whey, isolate, caséine et gainers',
    intro: [
      "Une protéine en poudre sert à une chose simple : atteindre ton quota de protéines du jour quand l'assiette ne suffit pas. Les protéines contribuent au maintien et au développement de la masse musculaire — c'est le complément le plus utile en musculation, et le premier qu'on conseille au comptoir.",
      "Comment choisir ? Si tu débutes ou que tu cherches le meilleur rapport qualité-prix, une whey concentrée (~70-80 % de protéines) fait parfaitement le travail. Si tu digères mal le lactose ou que tu veux le produit le plus pur en sèche, passe sur une isolate (≥ 90 % de protéines, quasi sans lactose). Et si ton problème est de manger assez en prise de masse, un gainer ajoute des calories pratiques à ta journée.",
    ],
    featured: [
      { handle: 'whey-native-protimuscle', label: 'Whey Native Protimuscle — la valeur sûre à 19,95 €' },
      { handle: 'sub-zero-whey-isolate', label: 'Sub Zero Whey Isolate — l’isolate digestion facile' },
      { handle: 'mutant-mass', label: 'Mutant Mass — le gainer prise de masse' },
    ],
    related: [
      { slug: 'creatine', label: 'Créatine' },
      { slug: 'glucides', label: 'Glucides' },
      { slug: 'acides-amines', label: 'Acides aminés' },
    ],
    guides: [
      { slug: 'whey-ou-isolate-quelle-difference', label: 'Whey ou isolate : quelle différence ?' },
      { slug: 'combien-de-proteines-par-jour', label: 'Combien de protéines par jour pour prendre du muscle ?' },
      { slug: 'quelle-whey-choisir-debutant', label: 'Quelle whey choisir quand on débute ?' },
    ],
  },
  {
    slug: 'creatine',
    productType: 'Créatine',
    label: 'Créatine',
    metaTitle: 'Créatine monohydrate : le complément le plus prouvé',
    metaDescription:
      'Créatine monohydrate micronisée, en poudre ou gélules. 3 à 5 g/jour, le complément le plus étudié. En stock à Coignières, livraison France.',
    h1: 'Créatine monohydrate',
    intro: [
      "La créatine est le complément le plus étudié de la nutrition sportive : elle améliore les capacités physiques lors de séries successives d'exercices très intenses et de courte durée — exactement ce que tu fais à la salle. La forme de référence est la créatine monohydrate, à 3-5 g par jour, tous les jours, peu importe l'heure.",
      "Comment choisir ? Toutes nos créatines sont du monohydrate : la différence se joue sur le format (poudre neutre à mélanger, version aromatisée, gélules) et la finesse de mouture (micronisée = se dissout mieux). Pas besoin de phase de charge ni de formule exotique : la régularité fait tout.",
    ],
    featured: [
      { handle: 'creatine-100-monohydrate-micronisee', label: 'Créatine 100 % Monohydrate Micronisée French Nutrition' },
      { handle: 'one-raw-creatine', label: 'One Raw Creatine Zoomad — poudre brute' },
      { handle: 'clear-pro-creatine', label: 'Clear Pro Creatine Eric Favre — version aromatisée' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'pre-workout', label: 'Pré-workout' },
    ],
    guides: [
      { slug: 'creatine-avant-ou-apres-seance', label: 'Créatine : avant ou après la séance ?' },
      { slug: 'creatine-pour-les-femmes', label: 'La créatine pour les femmes' },
      { slug: 'complements-debutant-musculation', label: 'Par quoi commencer en musculation ?' },
    ],
  },
  {
    slug: 'pre-workout',
    productType: 'Pré-workout',
    label: 'Pré-workout',
    metaTitle: 'Pré-workout : énergie et focus, avec ou sans caféine',
    metaDescription:
      'Pré-workout avec caféine pour l’énergie ou formules pump sans stimulant pour les séances du soir. Conseil en boutique à Coignières, livraison France.',
    h1: 'Pré-workout : énergie, focus et congestion',
    intro: [
      "Un pré-workout se prend 20 à 30 minutes avant la séance pour attaquer l'entraînement dans les meilleures conditions. Deux familles : les formules avec caféine (la caféine aide à augmenter la vigilance) pour l'énergie et le focus, et les formules « pump » sans stimulant, à base de citrulline ou de bêta-alanine, pour la congestion — idéales si tu t'entraînes le soir.",
      "Comment choisir ? Si tu t'entraînes le matin ou en journée et que tu tolères bien la caféine, un pré-workout stimulant classique fonctionne très bien. Séance après 18 h, sensibilité à la caféine ou envie de préserver ton sommeil : pars sur un pump sans caféine. En cas de doute, on t'aide à trancher en boutique.",
    ],
    featured: [
      { handle: 'vapor-x5-pre-workout', label: 'Vapor X5 MuscleTech — le stimulant complet' },
      { handle: 'pump-nitric-oxide-booster', label: 'Pump Warrior — congestion sans stimulant' },
      { handle: 'french-pump-pre-workout', label: 'French Pump — le pré-workout made in France' },
    ],
    related: [
      { slug: 'creatine', label: 'Créatine' },
      { slug: 'acides-amines', label: 'Acides aminés' },
    ],
    guides: [{ slug: 'pre-workout-avec-ou-sans-cafeine', label: 'Pré-workout : avec ou sans caféine ?' }],
  },
  {
    slug: 'acides-amines',
    productType: 'Acides aminés',
    label: 'Acides aminés',
    metaTitle: 'Acides aminés : EAA, BCAA, glutamine, citrulline',
    metaDescription:
      'EAA complets, BCAA, glutamine, citrulline et bêta-alanine. Le rayon acides aminés au complet, à Coignières et en livraison partout en France.',
    h1: 'Acides aminés : EAA, BCAA, glutamine et citrulline',
    intro: [
      "Les acides aminés sont les briques des protéines. En complément, on les utilise de façon ciblée : les EAA (9 acides aminés essentiels) comme boisson d'entraînement complète, les BCAA pour le goût et le confort pendant la séance, la citrulline et la bêta-alanine en soutien de la performance, la glutamine en récupération.",
      "Comment choisir ? Si ton apport en protéines est déjà solide, les acides aminés sont un confort, pas une priorité. Si tu dois choisir un seul produit, la recherche récente donne l'avantage aux EAA, qui contiennent les BCAA plus les six autres essentiels. Entraînement à jeun ou alimentation végétarienne : c'est là qu'ils prennent le plus de sens.",
    ],
    featured: [
      { handle: 'hit-eaa', label: 'HIT EAA DY Nutrition — les essentiels à 24,90 €' },
      { handle: 'yeaah-eaa', label: 'YEAAH EAA Dedicated' },
      { handle: 'l-citrulline', label: 'L-Citrulline Dedicated — le pump à l’unité' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'pre-workout', label: 'Pré-workout' },
    ],
    guides: [{ slug: 'eaa-ou-bcaa-lequel-prendre', label: 'EAA ou BCAA : lequel prendre ?' }],
  },
  {
    slug: 'bruleurs',
    productType: 'Brûleur',
    label: 'Brûleurs',
    metaTitle: 'Brûleurs et minceur : carnitine, CLA, draineurs',
    metaDescription:
      'L-carnitine, CLA, formules thermogéniques et draineurs pour accompagner une sèche. À utiliser avec un déficit calorique. Conseil en boutique à Coignières.',
    h1: 'Brûleurs et compléments minceur',
    intro: [
      "Soyons clairs : aucun complément ne fait perdre de gras sans déficit calorique. Les produits de ce rayon — L-carnitine, CLA, formules thermogéniques, draineurs — s'utilisent en accompagnement d'une sèche déjà structurée : alimentation contrôlée, entraînement régulier, sommeil correct.",
      "Comment choisir ? La L-carnitine est le grand classique autour de l'entraînement, le CLA un acide gras populaire en période de régime, et les formules complètes combinent plusieurs ingrédients (caféine, plantes, vitamines) pour les pratiquants avancés. Si tu démarres ta sèche, viens en boutique avec tes objectifs : on te dira honnêtement si un brûleur a sa place dans ton plan — et parfois, la réponse est non.",
    ],
    featured: [
      { handle: 'l-carnitine-pro-zero-liquide', label: 'L-Carnitine Pro Zero — le classique liquide' },
      { handle: 'cla-2400', label: 'CLA 2400 Eric Favre' },
      { handle: 'iron-ultra-fat-burner', label: 'Iron Ultra — la formule complète' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'sante', label: 'Santé & bien-être' },
    ],
    guides: [{ slug: 'combien-de-proteines-par-jour', label: 'Combien de protéines par jour ?' }],
  },
  {
    slug: 'boosters',
    productType: 'Boosters',
    label: 'Boosters',
    metaTitle: 'Boosters : vitalité masculine et tonus',
    metaDescription:
      'Bois bandé et formules vitalité à base de plantes. Le rayon boosters, disponible en boutique à Coignières (78) et en livraison France.',
    h1: 'Boosters et vitalité',
    intro: [
      "Ce rayon regroupe les formules « vitalité » à base de plantes et d'ingrédients traditionnels, comme le bois bandé. Ce sont des produits plaisir et confort, pas des médicaments : on les choisit pour leur composition et on les utilise dans le cadre d'une hygiène de vie globale.",
      "Comment choisir ? Regarde la composition et le format (boisson, gélules) plutôt que les promesses. Si tu hésites, pose-nous la question en boutique : on connaît chaque référence du rayon et on te dira ce qui correspond — ou pas — à ce que tu cherches.",
    ],
    featured: [
      { handle: 'bois-bande', label: 'Bois Bandé Eric Favre' },
      { handle: 'testorine-booster-boisson', label: 'Testorine — format boisson' },
    ],
    related: [
      { slug: 'sante', label: 'Santé & bien-être' },
      { slug: 'pre-workout', label: 'Pré-workout' },
    ],
    guides: [{ slug: 'complements-debutant-musculation', label: 'Par quoi commencer en musculation ?' }],
  },
  {
    slug: 'glucides',
    productType: 'Glucides',
    label: 'Glucides',
    metaTitle: 'Glucides : crème de riz, avoine, vitargo',
    metaDescription:
      'Crème de riz, crème d’avoine, Vitargo et boissons d’effort : les glucides pratiques pour la prise de masse et l’énergie à l’entraînement.',
    h1: 'Glucides : crème de riz, avoine et boissons d’effort',
    intro: [
      "Les glucides en poudre servent deux objectifs : ajouter des calories propres et digestes en prise de masse (crème de riz, crème d'avoine), et fournir de l'énergie rapide autour de l'entraînement (Vitargo, boissons d'effort). Les glucides contribuent à la récupération d'une fonction musculaire normale après un effort intense.",
      "Comment choisir ? Pour augmenter tes apports quotidiens sans te forcer, la crème de riz ou d'avoine se mélange à la whey en collation. Pour l'intra ou le post-training des séances longues, un glucide à assimilation rapide type Vitargo fait la différence. Le bon choix dépend surtout de ton volume d'entraînement — on en parle en boutique si besoin.",
    ],
    featured: [
      { handle: 'creme-de-riz-bio', label: 'Crème de Riz Nutrimuscle' },
      { handle: 'pure-vitargo', label: 'Pure Vitargo — l’intra-training' },
      { handle: 'creme-davoine-avena-sativa', label: 'Crème d’Avoine à 11,90 €' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'creatine', label: 'Créatine' },
    ],
    guides: [{ slug: 'prise-de-masse-complements-et-organisation', label: 'Prise de masse : comment s’organiser ?' }],
  },
  {
    slug: 'sante',
    productType: 'Santé',
    label: 'Santé & bien-être',
    metaTitle: 'Santé : vitamines, magnésium, oméga 3, collagène',
    metaDescription:
      'Vitamine D, magnésium, ZMA, oméga 3, collagène, spiruline : les fondations santé du sportif. En stock à Coignières, livraison partout en France.',
    h1: 'Santé & bien-être : vitamines, minéraux et essentiels',
    intro: [
      "Avant les compléments de performance, il y a les fondations : la vitamine D contribue au fonctionnement normal du système immunitaire, le magnésium contribue à réduire la fatigue et à une fonction musculaire normale, les oméga 3 (EPA/DHA) contribuent à une fonction cardiaque normale. C'est le rayon qu'on recommande de regarder en premier, surtout l'hiver.",
      "Comment choisir ? Pars de ton besoin réel : fatigue persistante et entraînement intense → magnésium bisglycinate ou ZMA ; peu d'exposition au soleil d'octobre à mars → vitamine D3 ; peu de poisson gras dans l'assiette → oméga 3 ; articulations et peau → collagène. Un produit à la fois, choisi pour une raison précise.",
    ],
    featured: [
      { handle: 'vitamin-d3-k2', label: 'Vitamine D3 + K2 Evolite' },
      { handle: 'magnesium-bisglycinate-vitamine-b6-taurine', label: 'Magnésium Bisglycinate French Nutrition' },
      { handle: 'pure-collagen-marin-liquide', label: 'Collagène Marin Liquide Eric Favre' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'bruleurs', label: 'Brûleurs' },
    ],
    guides: [
      { slug: 'complements-apres-40-ans', label: 'Quels compléments après 40 ans ?' },
      { slug: 'mieux-dormir-recuperation', label: 'Mieux dormir et récupérer' },
      { slug: 'complements-debutant-musculation', label: 'Par quoi commencer en musculation ?' },
    ],
  },
]

export function getCategoryPage(slug: string): CategoryPage | undefined {
  return CATEGORY_PAGES.find((c) => c.slug === slug)
}
