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
  /** FAQ affichée sous la grille + JSON-LD FAQPage (texte brut, mot pour mot). */
  faq?: { q: string; a: string }[]
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
      "Une protéine en poudre sert à une chose simple : atteindre ton quota de protéines du jour quand l'assiette ne suffit pas. Les protéines contribuent au maintien et au développement de la masse musculaire. C'est le complément le plus utile en musculation, et le premier qu'on conseille au comptoir.",
      "Comment choisir ? Si tu débutes ou que tu cherches le meilleur rapport qualité-prix, une whey concentrée (~70-80 % de protéines) fait parfaitement le travail. Si tu digères mal le lactose ou que tu veux le produit le plus pur en sèche, passe sur une isolate (≥ 90 % de protéines, quasi sans lactose). Et si ton problème est de manger assez en prise de masse, un gainer ajoute des calories pratiques à ta journée.",
    ],
    featured: [
      { handle: 'whey-native-protimuscle', label: 'Whey Native Protimuscle, la valeur sûre à 21,90 €' },
      { handle: 'iso-fusion-protein', label: 'Iso Fusion Protein, pois, œuf et lait' },
      { handle: 'mutant-mass', label: 'Mutant Mass, le gainer prise de masse' },
    ],
    related: [
      { slug: 'creatine', label: 'Créatine' },
      { slug: 'glucides', label: 'Glucides' },
      { slug: 'acides-amines', label: 'Acides aminés' },
      { slug: 'barres-proteinees', label: 'Barres protéinées' },
    ],
    guides: [
      { slug: 'whey-ou-isolate-quelle-difference', label: 'Whey ou isolate : quelle différence ?' },
      { slug: 'quand-prendre-sa-whey', label: 'Quand prendre sa whey ?' },
      { slug: 'proteines-vegetales-musculation', label: 'Protéines végétales : bien les choisir' },
      { slug: 'gainer-prise-de-masse-comment-choisir', label: 'Gainer : pour qui et comment le choisir ?' },
      { slug: 'combien-de-proteines-par-jour', label: 'Combien de protéines par jour pour prendre du muscle ?' },
      { slug: 'quelle-whey-choisir-debutant', label: 'Quelle whey choisir quand on débute ?' },
    ],
  },
  {
    slug: 'creatine',
    productType: 'Créatine',
    label: 'Créatine',
    // Réécrits le 25/09/2026 pour le taux de clic (position 7, 0 clic dans Search Console).
    metaTitle: 'Créatine monohydrate : pure ou aromatisée, bien la choisir',
    metaDescription:
      "Créatine monohydrate pure ou aromatisée, des marques qu'on utilise nous-mêmes. 3 g par jour. Conseil gratuit à Coignières, livraison offerte dès 85 €.",
    h1: 'Créatine monohydrate : pure ou aromatisée',
    intro: [
      "La créatine est l'un des compléments les plus étudiés de la nutrition sportive. Prise à raison de 3 g par jour, elle améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée, comme les séries lourdes en musculation. La forme de référence est la créatine monohydrate, à prendre tous les jours, à l'heure qui t'arrange.",
      "Comment choisir ? Toutes nos créatines sont de la créatine monohydrate en poudre : la différence se joue sur le goût (neutre, à mélanger à ta boisson, ou aromatisée) et la finesse de mouture (micronisée, elle se dissout mieux). L'une des versions aromatisées ajoute aussi bêta-alanine, taurine et vitamines B. Pas besoin de phase de charge : la régularité fait tout. Comme tout complément, elle s'utilise dans le cadre d'une alimentation variée et équilibrée et d'un mode de vie sain. Elle s'adresse aux adultes qui s'entraînent de façon intense.",
    ],
    featured: [
      { handle: 'creatine-100-monohydrate-micronisee', label: 'Créatine 100 % Monohydrate Micronisée French Nutrition' },
      { handle: 'dedicated-nutrition-micronized-creatine-monohydrate', label: 'Micronized Creatine Monohydrate Dedicated, sans arôme' },
      { handle: 'clear-pro-creatine', label: 'Clear Pro Creatine Eric Favre, version aromatisée' },
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
    faq: [
      {
        q: "Combien de créatine prendre par jour ?",
        a:
          "3 g par jour, tous les jours : c'est la dose à laquelle la réglementation européenne reconnaît l'effet de la créatine sur les séries d'exercices très intenses de courte durée. La dose par mesure varie selon les marques : ne dépasse jamais la dose journalière indiquée sur l'étiquette.",
      },
      {
        q: "À quel moment prendre sa créatine ?",
        a:
          "Quand tu veux : ce qui compte, c'est la prise quotidienne, pas l'heure. Le plus simple est de l'associer à un geste que tu fais tous les jours, dans ton shaker de whey ou au petit-déjeuner, y compris les jours de repos.",
      },
      {
        q: "Faut-il faire une phase de charge ?",
        a:
          "Non, ce n'est pas nécessaire : l'effet bénéfique de la créatine est obtenu avec 3 g par jour, tous les jours. La phase de charge (plusieurs prises par jour pendant quelques jours) fait dépasser la dose journalière indiquée sur l'étiquette.",
      },
      {
        q: "Micronisée, neutre ou aromatisée : quelle différence ?",
        a:
          "C'est toujours de la créatine monohydrate. Micronisée veut dire moulue plus finement : elle se dissout mieux et laisse moins de dépôt au fond du shaker. Neutre, elle se mélange à n'importe quelle boisson ; aromatisée, elle se boit simplement dans de l'eau. Regarde aussi la composition : une version aromatisée ajoute bêta-alanine, taurine et vitamines B.",
      },
    ],
  },
  {
    slug: 'barres-proteinees',
    productType: 'Barres protéinées',
    label: 'Barres protéinées',
    // Créé le 25/09/2026 : Search Console montrait l’accueil sur « barre protéinée » (35 affichages, position 7).
    metaTitle: 'Barres protéinées : environ 20 g de protéines par barre',
    metaDescription:
      'Crunch Bar, Barre Délice, Flapjack : environ 20 g de protéines par barre, dès 2,90 €. Retrait gratuit à Coignières, livraison offerte dès 85 €.',
    h1: 'Barres protéinées : environ 20 g de protéines par barre',
    intro: [
      "Une barre protéinée, c'est l'en-cas pratique quand tu n'as pas de shaker sous la main : autour de 20 g de protéines dans une barre qui se glisse dans un sac de sport ou un tiroir de bureau. On en a trois styles en rayon : la Crunch Bar de Warrior qui croustille, la Barre Délice d'Eric Favre enrobée de chocolat, et le Flapjack de Warrior, moelleux, aux flocons d'avoine.",
      "Comment choisir ? Regarde d'abord la texture et le goût : c'est ce qui fait qu'on la finit. Puis la source de protéines (lait, collagène, soja, féverole ou gélatine selon la barre) et les édulcorants : les barres au maltitol peuvent avoir des effets laxatifs en cas de consommation excessive. Compte une à deux barres par jour, pas plus. Une barre reste un en-cas : elle ne remplace pas un repas.",
    ],
    featured: [
      { handle: 'crunch-bar-barre-proteinee', label: 'Crunch Bar Warrior, la croustillante' },
      { handle: 'barre-delice-needs-barre-proteinee', label: 'Barre Délice Eric Favre, 3 goûts' },
      { handle: 'warrior-raw-protein-flapjack-75-g', label: 'Flapjack Warrior, aux flocons d’avoine' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'creatine', label: 'Créatine' },
    ],
    guides: [
      { slug: 'combien-de-proteines-par-jour', label: 'Combien de protéines par jour ?' },
      { slug: 'complements-debutant-musculation', label: 'Par quoi commencer en musculation ?' },
    ],
    faq: [
      {
        q: 'Combien de protéines dans une barre protéinée ?',
        a:
          "Autour de 20 g : 20 g pour la Crunch Bar (64 g, goût Salted Caramel), 20 à 21 g pour la Barre Délice (58 g) selon le goût et 20,1 g pour le Flapjack (75 g, goût Double Chocolate). Les valeurs exactes de chaque goût sont sur l'emballage.",
      },
      {
        q: 'Combien de barres protéinées par jour ?',
        a:
          'Une à deux, en collation ou après la séance. Les barres au maltitol, comme la Crunch Bar et la Barre Délice, peuvent avoir des effets laxatifs en cas de consommation excessive. Une barre ne remplace pas un repas.',
      },
      {
        q: 'Barre protéinée ou shaker de whey ?',
        a:
          'Les deux apportent autour de 20 g de protéines. Le shaker revient moins cher par dose et se boit juste après la séance ; la barre se mange sans rien préparer, pratique en déplacement ou au bureau. Beaucoup gardent la whey à la maison et une barre dans le sac.',
      },
      {
        q: 'Crunch Bar, Barre Délice ou Flapjack : laquelle choisir ?',
        a:
          "La Crunch Bar pour le croustillant façon barre chocolatée (2,3 g de sucres pour le goût Salted Caramel). La Barre Délice pour un enrobage chocolat plus fondant, en trois goûts. Le Flapjack pour une barre moelleuse aux flocons d'avoine (7,6 g de fibres pour le goût Double Chocolate). Toutes sont aussi en boutique à Coignières.",
      },
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
      "Un pré-workout se prend 20 à 30 minutes avant la séance pour attaquer l'entraînement dans les meilleures conditions. Deux familles : les formules avec caféine (la caféine aide à augmenter la vigilance) pour l'énergie et le focus, et les formules « pump » sans stimulant, à base de citrulline ou de bêta-alanine, pour la congestion, idéales si tu t'entraînes le soir.",
      "Comment choisir ? Si tu t'entraînes le matin ou en journée et que tu tolères bien la caféine, un pré-workout stimulant classique fonctionne très bien. Séance après 18 h, sensibilité à la caféine ou envie de préserver ton sommeil : pars sur un pump sans caféine. En cas de doute, on t'aide à trancher en boutique.",
    ],
    featured: [
      { handle: 'french-pump-pre-workout', label: 'French Pump French Nutrition, avec caféine' },
      { handle: 'pump-nitric-oxide-booster', label: 'Pump Warrior, pré-workout sans stimulant' },
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
      { handle: 'hit-eaa', label: 'HIT EAA DY Nutrition, les essentiels à 26,90 €' },
      { handle: 'yeaah-eaa', label: 'YEAAH EAA Dedicated' },
      { handle: 'l-citrulline', label: 'L-Citrulline Dedicated, le pump à l’unité' },
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
      "Soyons clairs : aucun complément ne fait perdre de gras sans déficit calorique. Les produits de ce rayon (L-carnitine, CLA, formules thermogéniques, draineurs) s'utilisent en accompagnement d'une sèche déjà structurée : alimentation contrôlée, entraînement régulier, sommeil correct.",
      "Comment choisir ? La L-carnitine est le grand classique autour de l'entraînement, le CLA un acide gras populaire en période de régime, et les formules complètes combinent plusieurs ingrédients (caféine, plantes, vitamines) pour les pratiquants avancés. Si tu démarres ta sèche, viens en boutique avec tes objectifs : on te dira honnêtement si un brûleur a sa place dans ton plan. Et parfois, la réponse est non.",
    ],
    featured: [
      { handle: 'l-carnitine-pro-zero-liquide', label: 'L-Carnitine Pro Zero, le classique liquide' },
      { handle: 'cla-2400', label: 'CLA 2400 Eric Favre' },
      { handle: 'iron-ultra-fat-burner', label: 'Iron Ultra, la formule complète' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'sante', label: 'Santé & bien-être' },
    ],
    guides: [
      { slug: 'comment-faire-une-seche', label: 'Comment faire une sèche : le guide complet' },
      { slug: 'bruleurs-de-graisse-ca-marche', label: 'Brûleurs de graisse : est-ce que ça marche ?' },
      { slug: 'combien-de-proteines-par-jour', label: 'Combien de protéines par jour ?' },
    ],
  },
  {
    slug: 'boosters',
    productType: 'Boosters',
    label: 'Boosters',
    metaTitle: 'Boosters : formules à base de plantes et de zinc',
    metaDescription:
      'Fenugrec, tribulus, maca, ashwagandha, zinc : les formules du rayon boosters, en gélules ou en boisson. En boutique à Coignières (78), livraison France.',
    h1: 'Boosters : formules à base de plantes et de zinc',
    intro: [
      "Ce rayon regroupe des formules à base de plantes traditionnelles (fenugrec, tribulus, maca, ashwagandha) et de zinc, en gélules ou en boisson. Ce ne sont pas des médicaments : on les choisit pour leur composition et on les utilise dans le cadre d'une hygiène de vie globale.",
      "Comment choisir ? Regarde la composition et le format (gélules pour une cure, boisson prête à boire) plutôt que les promesses. Attention aux formules avec caféine, comme la Testorine en boisson (100 mg par bouteille). Ces formules s'adressent aux adultes et sont déconseillées aux femmes enceintes ou allaitantes. Si tu hésites, pose-nous la question en boutique : on connaît chaque référence du rayon.",
    ],
    featured: [
      { handle: 'alphatest-booster-de-testosterone', label: 'Alphatest MuscleTech, fenugrec, bore et zinc' },
      { handle: 'testorine-booster-boisson', label: 'Testorine, format boisson' },
      { handle: 'sex-bomb', label: 'Sex Bomb For Her Applied Nutrition, ashwagandha et maca' },
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
    metaTitle: "Glucides : crème de riz, Cluster Dextrin, boissons d'effort",
    metaDescription:
      "Crème de riz, Cluster Dextrin et boissons d'effort : des glucides pratiques pour la prise de masse et l'entraînement. Conseil gratuit à Coignières.",
    h1: "Glucides : crème de riz, Cluster Dextrin et boissons d'effort",
    intro: [
      "Les glucides en poudre servent deux objectifs : ajouter des calories en prise de masse sans manger plus de volume (crème de riz), et apporter des glucides pendant ou autour des séances longues (Cluster Dextrin, boissons d'effort glucidiques).",
      "Comment choisir ? Pour augmenter tes apports quotidiens, la crème de riz se mélange à la whey ou au lait en collation. Pour les séances longues, une dextrine cyclique comme le Cluster Dextrin se boit pendant l'effort. Le bon choix dépend surtout de ton volume d'entraînement : on en parle en boutique si besoin.",
    ],
    featured: [
      { handle: 'creme-de-riz-bio', label: 'Crème de Riz Nutrimuscle' },
      { handle: 'cluster-dextrin-dextrine-cyclique-1-2-kg', label: 'Cluster Dextrin Nutrimuscle, l’intra-training' },
      { handle: 'cream-of-rice-creme-de-riz-2-kg', label: 'Cream of Rice Trained by JP, sac de 2 kg' },
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
      'Vitamine D, magnésium, ZMA, oméga 3, collagène : le rayon santé et bien-être du sportif. En stock à Coignières, livraison partout en France.',
    h1: 'Santé & bien-être : vitamines, minéraux et essentiels',
    intro: [
      "Avant les compléments de performance, il y a les fondations : la vitamine D contribue au fonctionnement normal du système immunitaire, le magnésium contribue à réduire la fatigue et à une fonction musculaire normale, les oméga 3 EPA et DHA contribuent à une fonction cardiaque normale (effet obtenu avec 250 mg d'EPA et de DHA par jour). C'est le rayon qu'on recommande de regarder en premier, surtout l'hiver.",
      "Comment choisir ? Pars de ton besoin réel : coup de fatigue et entraînement intense → magnésium bisglycinate ou ZMA ; peu d'exposition au soleil d'octobre à mars → vitamine D3 ; peu de poisson gras dans l'assiette → oméga 3. Pour le collagène, prends une formule avec vitamine C : la vitamine C contribue à la formation normale de collagène pour assurer la fonction normale des cartilages et de la peau. Un produit à la fois, choisi pour une raison précise, en complément d'une alimentation variée et équilibrée et d'un mode de vie sain.",
    ],
    featured: [
      { handle: 'vitamin-d3-k2-dy-60-softgels', label: 'Vitamine D3 + K2 DY Nutrition' },
      { handle: 'magnesium-bisglycinate-dy-90-capsules', label: 'Magnésium Bisglycinate DY Nutrition' },
      { handle: 'collagen-complex-vitamine-c', label: 'Collagen Complex + Vitamine C Eric Favre' },
    ],
    related: [
      { slug: 'proteines', label: 'Protéines' },
      { slug: 'bruleurs', label: 'Brûleurs' },
    ],
    guides: [
      { slug: 'vitamine-d-combien-quand-pourquoi', label: 'Vitamine D : combien, quand, pourquoi ?' },
      { slug: 'magnesium-bienfaits-quelle-forme-choisir', label: 'Magnésium : quelle forme choisir ?' },
      { slug: 'multivitamines-utile-comment-choisir', label: 'Multivitamines : utiles et comment choisir ?' },
      { slug: 'complements-apres-40-ans', label: 'Quels compléments après 40 ans ?' },
      { slug: 'collagene-bienfaits-comment-choisir', label: 'Collagène : à quoi ça sert ?' },
      { slug: 'mieux-dormir-recuperation', label: 'Mieux dormir et récupérer' },
    ],
  },
]

export function getCategoryPage(slug: string): CategoryPage | undefined {
  return CATEGORY_PAGES.find((c) => c.slug === slug)
}
