import type { BlogArticle } from '@/lib/blog'

// Article SEO/GEO — cible « collagène bienfaits / quel collagène choisir ».
// ⚠️ COMPLIANCE UE 1924/2006 : le collagène n'a AUCUNE allégation santé
// autorisée (peau/articulations), ni directe ni suggérée. L'allégation vitamine C
// (formation normale de collagène) est citée UNE seule fois, mot pour mot, sans
// conseil d'association ni « bonnes formules » : l'Osavi mis en avant n'en
// contient pas (arbitrage Claude Gestion du 10/10/2026). Handles + prix
// vérifiés Shopify 2026-07-17.
export const collageneBienfaitsCommentChoisir: BlogArticle = {
  slug: 'collagene-bienfaits-comment-choisir',
  title: 'Collagène : à quoi ça sert et comment bien le choisir ?',
  metaTitle: 'Collagène : à quoi ça sert et comment le choisir ?',
  metaDescription:
    'Le collagène en complément : ce qu\'on peut en dire, marin ou bovin, dose et format. Ce que permet la réglementation, et notre sélection.',
  excerpt:
    "Le collagène est la protéine structurelle de la peau, des tendons et des os. En complément, il n'a pas d'allégation santé autorisée : c'est un complément apprécié, qu'on choisit pour sa composition (origine, dose de peptides, format).",
  datePublished: '2026-07-17',
  dateModified: '2026-10-10',
  sections: [
    {
      h2: 'Le collagène, c\'est quoi exactement ?',
      blocks: [
        {
          type: 'p',
          text: "Le collagène est la protéine la plus abondante du corps : c'est la « charpente » de la peau, des tendons, des articulations, des os et des vaisseaux. Ton organisme le fabrique naturellement à partir des acides aminés de ton alimentation.",
        },
        {
          type: 'p',
          text: 'En complément, on le trouve sous forme **hydrolysée** (peptides de collagène), une forme plus facile à consommer et à mélanger. C\'est un complément apprécié : on le choisit d\'abord pour sa composition et sa praticité.',
        },
      ],
    },
    {
      h2: 'Que peut-on vraiment en attendre ?',
      blocks: [
        {
          type: 'p',
          text: "Soyons honnêtes et précis, car la réglementation encadre ce qu'on peut dire. Le **collagène en lui-même ne dispose pas d'allégation santé autorisée** en Europe : on ne peut donc pas affirmer qu'il « améliore la peau » ou « soigne les articulations ». L'allégation autorisée qui en parle porte sur un autre nutriment : **la vitamine C contribue à la formation normale de collagène pour assurer la fonction normale de la peau**.",
        },
        {
          type: 'p',
          text: "Considère donc le collagène comme un complément à choisir pour sa composition et à intégrer dans une hygiène de vie globale, pas comme un traitement.",
        },
      ],
    },
    {
      h2: 'Marin, bovin, hydrolysé : comment s\'y retrouver ?',
      blocks: [
        {
          type: 'list',
          items: [
            'Collagène marin : issu du poisson ; convient à ceux qui évitent le bœuf.',
            'Collagène bovin : issu de la vache, souvent plus économique.',
            'Hydrolysé (peptides) : la forme la plus courante en complément, facile à mélanger.',
            'Type I, II, III : des sous-types du collagène ; en pratique, regarde d\'abord la dose de peptides par portion.',
          ],
        },
        {
          type: 'p',
          text: 'Ne te perds pas dans les sous-types : regarde la dose de peptides par portion, l\'origine (marine ou bovine) et le format qui te convient. Le marin est souvent choisi par ceux qui veulent éviter le bœuf.',
        },
      ],
    },
    {
      h2: 'Comment le prendre : dose, durée, moment',
      blocks: [
        {
          type: 'p',
          text: "Le collagène se prend au quotidien, sur la durée, en respectant la dose indiquée sur l'étiquette. Le moment de la journée importe peu : choisis celui que tu tiendras.",
        },
        {
          type: 'p',
          text: 'Deux formats pratiques : la poudre à mélanger dans l\'eau ou une boisson, et les versions liquides prêtes à boire. Ne dépasse pas la dose indiquée.',
        },
      ],
    },
    {
      h2: 'Notre sélection collagène',
      blocks: [
        {
          type: 'table',
          headers: ['Produit', 'Format', 'Prix'],
          rows: [
            [
              '[Collagène Hydrolysé Osavi Type I & III](/products/collagene-hydrolyse-osavi-type-i-iii-poudre-660-g)',
              'Poudre de collagène bovin aromatisée, 20 g de peptides par dose de 22 g',
              '{{prix:collagene-hydrolyse-osavi-type-i-iii-poudre-660-g|44,90 €}}',
            ],
            [
              '[Collagène Marin Liquide](/products/pure-collagen-marin-liquide)',
              'Liquide prêt à boire',
              '{{prix:pure-collagen-marin-liquide|34,90 €}}',
            ],
            [
              '[Beauty & Shape - Protéine & Collagène](/products/beauty-shape-proteine-collagene)',
              'Protéine + collagène',
              '{{prix:beauty-shape-proteine-collagene|22,90 €}}',
            ],
          ],
        },
        {
          type: 'p',
          text: 'Le [Collagène Hydrolysé Osavi](/products/collagene-hydrolyse-osavi-type-i-iii-poudre-660-g) apporte 20 g de peptides de collagène bovin par dose de 22 g, sans vitamine C ; le [Collagène Marin Liquide](/products/pure-collagen-marin-liquide) mise sur la praticité ; le [Beauty & Shape](/products/beauty-shape-proteine-collagene) combine protéine et collagène pour celles et ceux qui veulent les deux en un. Tout le rayon est sur la page [santé & bien-être](/categories/sante).',
        },
      ],
    },
    {
      h2: 'Collagène et sport : pour qui ?',
      blocks: [
        {
          type: 'p',
          text: 'Chez le sportif, le collagène s\'inscrit dans une routine bien-être, comme complément apprécié. Il ne remplace pas les protéines « musculaires » : pour construire du muscle, ce sont la whey ou les protéines végétales qui comptent, car le collagène a un profil d\'acides aminés incomplet pour cet usage.',
        },
        {
          type: 'p',
          text: 'On le conseille souvent à celles et ceux qui structurent leur routine santé, notamment [après 40 ans](/blog/complements-apres-40-ans), en complément des fondations (protéines, vitamine D, magnésium). Un doute sur son intérêt pour toi ? On en parle sans langue de bois à la boutique de Coignières.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Le collagène est-il vraiment efficace pour la peau ?',
      a: "Le collagène ne bénéficie pas d'allégation santé autorisée en Europe : on ne peut pas affirmer qu'il « améliore la peau ». C'est un complément apprécié, à choisir pour sa composition (dose de peptides, origine, format).",
    },
    {
      q: 'Quel collagène choisir : marin ou bovin ?',
      a: 'Le collagène marin (issu du poisson) convient à ceux qui évitent le bœuf ; le bovin est souvent plus économique. Dans les deux cas, regarde d\'abord la dose de peptides par portion et préfère une forme hydrolysée, plus facile à mélanger.',
    },
    {
      q: 'Combien de temps faut-il prendre du collagène ?',
      a: "Le collagène se prend au quotidien, sur la durée, en respectant la dose indiquée. Le moment de la journée n'a pas d'importance.",
    },
    {
      q: 'Le collagène aide-t-il à prendre du muscle ?',
      a: "Non, le collagène n'est pas adapté à la construction musculaire : son profil d'acides aminés est incomplet pour cet usage. Pour le muscle, ce sont la whey ou les protéines végétales qui comptent. Le collagène se choisit pour sa composition, pas pour la masse musculaire.",
    },
    {
      q: 'Faut-il prendre du collagène avec de la vitamine C ?',
      a: "Ce sont deux choses différentes : le collagène n'a pas d'allégation santé autorisée, la vitamine C, apportée notamment par les fruits et légumes, en a plusieurs. Notre collagène Osavi n'en contient pas : il apporte 20 g de peptides de collagène par dose de 22 g.",
    },
  ],
  products: [
    { handle: 'collagene-hydrolyse-osavi-type-i-iii-poudre-660-g', label: 'Collagène Hydrolysé Osavi Type I & III' },
    { handle: 'pure-collagen-marin-liquide', label: 'Collagène Marin Liquide' },
    { handle: 'beauty-shape-proteine-collagene', label: 'Beauty & Shape - Protéine & Collagène' },
  ],
  categories: [{ slug: 'sante', label: 'Santé & bien-être' }],
  related: ['complements-apres-40-ans', 'creatine-pour-les-femmes'],
}
