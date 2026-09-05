import type { BlogArticle } from '@/lib/blog'

// Article SEO/GEO — cible « quel magnésium choisir / bisglycinate / magnésium
// sport / ZMA ». Allégations UE 1924/2006 :
//  - Magnésium : diminution de la fatigue, fonction musculaire normale,
//    fonctionnement normal du système nerveux, équilibre électrolytique,
//    métabolisme énergétique normal, synthèse protéique normale.
//  - Zinc (ZMA) : maintien d'un taux normal de testostérone dans le sang
//    (formulé « maintien », JAMAIS « augmente »), fonction cognitive normale.
//  - Vitamine B6 (ZMA) : réduction de la fatigue, régulation de l'activité
//    hormonale, fonctionnement normal du système nerveux.
// AUCUNE allégation sommeil (« améliore le sommeil » = non autorisée) ni
// « augmente la testostérone / la masse musculaire ». Handles + prix vérifiés
// Shopify 2026-07-17.
export const magnesiumBienfaitsQuelleFormeChoisir: BlogArticle = {
  slug: 'magnesium-bienfaits-quelle-forme-choisir',
  title: 'Magnésium : bienfaits et quelle forme choisir',
  metaTitle: 'Magnésium : bienfaits et quelle forme choisir',
  metaDescription:
    "Le magnésium contribue à réduire la fatigue et à une fonction musculaire normale. Bisglycinate, citrate, marin ou ZMA : on t'aide à choisir la bonne forme.",
  excerpt:
    "Le magnésium contribue à réduire la fatigue, au fonctionnement normal du système nerveux et à une fonction musculaire normale — trois rôles clés quand on s'entraîne. La forme la mieux tolérée est le bisglycinate ; le ZMA y associe du zinc et de la vitamine B6.",
  datePublished: '2026-07-17',
  dateModified: '2026-07-17',
  sections: [
    {
      h2: 'À quoi sert le magnésium ?',
      blocks: [
        {
          type: 'p',
          text: "Le magnésium est un minéral impliqué dans des centaines de réactions du corps, et plusieurs de ses rôles sont officiellement reconnus. Le **magnésium contribue à une réduction de la fatigue**, **au fonctionnement normal du système nerveux**, **à une fonction musculaire normale**, **à l'équilibre électrolytique** et **à un métabolisme énergétique normal**.",
        },
        {
          type: 'p',
          text: "Pour un sportif, ces fonctions parlent tout de suite : muscles qui travaillent, système nerveux sollicité, énergie à produire. C'est pour ça qu'on range le magnésium parmi les **fondations** — au même titre que la vitamine D — plutôt que parmi les compléments de performance.",
        },
        {
          type: 'p',
          text: "Un mot de cadrage : le magnésium soutient un fonctionnement normal, il ne « soigne » pas une pathologie et ne remplace pas une alimentation équilibrée. En cas de symptômes marqués (crampes à répétition, fatigue persistante), parles-en à ton médecin.",
        },
      ],
    },
    {
      h2: 'Pourquoi les sportifs en manquent-ils souvent ?',
      blocks: [
        {
          type: 'p',
          text: "D'abord parce que l'alimentation moderne en apporte moins qu'avant : le magnésium se trouve surtout dans les légumes verts, les oléagineux, les légumineuses, le chocolat noir et les céréales complètes — des aliments pas toujours présents en quantité dans l'assiette.",
        },
        {
          type: 'p',
          text: "Ensuite parce que l'entraînement **augmente les pertes** : on élimine du magnésium par la sueur et l'organisme d'un pratiquant régulier en consomme davantage. Un stress élevé et un sommeil court n'aident pas non plus. Résultat : les apports justes deviennent vite des apports insuffisants chez les sportifs.",
        },
        {
          type: 'p',
          text: "C'est exactement le profil pour lequel une supplémentation raisonnable a du sens : combler l'écart, sans chercher à en prendre le plus possible.",
        },
      ],
    },
    {
      h2: 'Bisglycinate, citrate, marin, oxyde : quelle forme choisir ?',
      blocks: [
        {
          type: 'p',
          text: "C'est LA question qui compte, car toutes les formes ne se valent pas — ni pour l'absorption, ni pour le confort digestif. La quantité affichée sur l'étiquette n'est utile que si ton corps l'assimile réellement.",
        },
        {
          type: 'table',
          headers: ['Forme', 'Absorption / tolérance', 'Pour qui'],
          rows: [
            ['Bisglycinate', 'Très bien tolérée, douce pour le ventre', 'Le choix par défaut, surtout si tu as le ventre sensible'],
            ['Citrate', 'Bien absorbée, léger effet sur le transit', 'Bon rapport qualité-prix'],
            ['Marin', 'Source naturelle, riche en minéraux associés', 'Ceux qui préfèrent une origine naturelle (souvent en ZMA)'],
            ['Oxyde', 'Faible absorption, effet laxatif fréquent', 'À éviter seule — présente car peu chère'],
          ],
        },
        {
          type: 'p',
          text: "En clair : pour la plupart des gens, le **bisglycinate** est le meilleur compromis absorption / tolérance. Notre [Magnésium Bisglycinate DY](/products/magnesium-bisglycinate-dy-90-capsules) est sur cette forme (90 capsules, 16,90 €). Regarde toujours le magnésium **élément** (la quantité réellement utile), pas le poids brut du sel de magnésium.",
        },
      ],
    },
    {
      h2: "Le ZMA, c'est quoi ?",
      blocks: [
        {
          type: 'p',
          text: "Le ZMA est un grand classique de la récupération : il associe du **magnésium**, du **zinc** et de la **vitamine B6**. Chacun a des rôles reconnus. Le zinc **contribue au maintien d'un taux normal de testostérone dans le sang** et **à une fonction cognitive normale** ; la vitamine B6 **contribue à la régulation de l'activité hormonale** et **à réduire la fatigue** ; le magnésium apporte tout ce qu'on a vu plus haut.",
        },
        {
          type: 'p',
          text: "À qui ça s'adresse ? Aux pratiquants réguliers qui veulent réunir ces trois micronutriments dans un seul produit, souvent pris le soir par habitude. Le [Zn Mg B6 Complex de DY Nutrition](/products/zn-mg-b6-complex-60-capsules) réunit magnésium, zinc et B6 dans une seule gélule. Note bien : le ZMA soutient un fonctionnement normal, il ne « booste » pas la testostérone ni la masse musculaire.",
        },
      ],
    },
    {
      h2: 'Quand et combien en prendre ?',
      blocks: [
        {
          type: 'p',
          text: "Une prise quotidienne de l'ordre de **300 à 360 mg de magnésium élément** couvre bien le besoin d'un sportif. Le plus important n'est pas l'heure mais la **régularité** : c'est la prise de tous les jours, sur la durée, qui fait la différence — pas une cure d'une semaine de temps en temps.",
        },
        {
          type: 'list',
          items: [
            'Prends-le au cours d\'un repas pour un meilleur confort digestif.',
            'Beaucoup le prennent le soir, simplement par habitude — l\'heure exacte importe peu.',
            'Privilégie le bisglycinate (ou le citrate) plutôt que l\'oxyde.',
            'Vise la régularité sur plusieurs semaines, pas une méga-dose ponctuelle.',
          ],
        },
        {
          type: 'table',
          headers: ['Produit', 'Forme', 'Prix'],
          rows: [
            ['[Magnésium Bisglycinate DY](/products/magnesium-bisglycinate-dy-90-capsules)', 'Bisglycinate, 90 capsules', '16,90 €'],
            ['[Zn Mg B6 Complex](/products/zn-mg-b6-complex-60-capsules)', 'Magnésium + zinc + B6 (type ZMA)', '19,90 €'],
          ],
        },
        {
          type: 'p',
          text: "Tu retrouves ces références et les autres fondations dans le rayon [santé & bien-être](/categories/sante). Le magnésium fait aussi partie des priorités qu'on détaille dans [quels compléments après 40 ans](/blog/complements-apres-40-ans) et dans notre article sur [mieux récupérer](/blog/mieux-dormir-recuperation). En cas de doute sur la forme ou la dose, passe nous voir en boutique : on t'aide à choisir.",
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Quel est le meilleur magnésium à prendre ?',
      a: "Pour la plupart des gens, le bisglycinate est le meilleur compromis : bien absorbé et doux pour le ventre. Le citrate est une bonne alternative économique. On évite l'oxyde seul, peu assimilé et souvent laxatif. Regarde toujours la quantité de magnésium « élément », pas le poids brut du sel.",
    },
    {
      q: 'Le magnésium est-il utile pour les sportifs ?',
      a: "Oui : le magnésium contribue à une fonction musculaire normale, au fonctionnement normal du système nerveux, à une réduction de la fatigue et à l'équilibre électrolytique. Comme l'entraînement augmente les pertes (sueur) et les besoins, un apport régulier a du sens chez les pratiquants.",
    },
    {
      q: 'Quand prendre son magnésium ?',
      a: "L'heure importe peu : c'est la régularité qui compte. Prends-le chaque jour, de préférence au cours d'un repas pour le confort digestif. Beaucoup le prennent le soir simplement par habitude.",
    },
    {
      q: "Qu'est-ce que le ZMA ?",
      a: "Le ZMA associe magnésium, zinc et vitamine B6. Le zinc contribue au maintien d'un taux normal de testostérone dans le sang, la B6 à la régulation de l'activité hormonale et à réduire la fatigue, le magnésium à une fonction musculaire normale. C'est une façon pratique de réunir ces trois micronutriments dans un seul produit.",
    },
    {
      q: 'Combien de magnésium par jour ?',
      a: "Une prise quotidienne de l'ordre de 300 à 360 mg de magnésium élément couvre bien le besoin d'un sportif. On vise un apport régulier et raisonnable plutôt que des méga-doses ponctuelles ; en cas de symptômes marqués, demande l'avis de ton médecin.",
    },
  ],
  products: [
    { handle: 'magnesium-bisglycinate-dy-90-capsules', label: 'Magnésium Bisglycinate DY' },
    { handle: 'zn-mg-b6-complex-60-capsules', label: 'Zn Mg B6 Complex (type ZMA)' },
  ],
  categories: [{ slug: 'sante', label: 'Santé & bien-être' }],
  related: ['complements-apres-40-ans', 'mieux-dormir-recuperation', 'vitamine-d-combien-quand-pourquoi'],
}
