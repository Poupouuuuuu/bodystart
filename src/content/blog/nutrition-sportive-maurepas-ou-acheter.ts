import type { BlogArticle } from '@/lib/blog'

// Article SEO/GEO local (02/11/2026) : « nutrition sportive Maurepas », après
// la fermeture du magasin FitnessBoutique de Pariwest. Faits relevés le
// 02/11/2026, tous vérifiables :
// - fermeture : registre des entreprises (recherche-entreprises.api.gouv.fr),
//   établissement FITNESSBOUTIQUE FRANCE, SIRET 452 454 440 00622, ZA Pariwest
//   lot 5, rond-point Laurent Schwartz, état fermé, date de fermeture 21/12/2023 ;
// - adresses : registre (FitnessBoutique Chambourcy SIRET 452 454 440 00614,
//   BioTech USA Montigny SIRET 827 517 277 00329, Decathlon Coignières SIRET
//   500 569 405 03163) et OpenStreetMap (Intersport Maurepas, absent du
//   registre sous ce nom) ;
// - trajets : OSRM (OpenStreetMap) depuis la mairie de Maurepas, sans trafic.
// Concurrents cités comme faits seulement (nom, adresse, statut, distance),
// jamais comparés. Pas de prix dans le texte. Superlatif « la plus proche »
// vérifié : aucune autre boutique de nutrition sportive plus proche (relevé
// Maps de l'Agent Digital du 31/10/2026, registre, OSM).
export const nutritionSportiveMaurepasOuAcheter: BlogArticle = {
  slug: 'nutrition-sportive-maurepas-ou-acheter',
  title: 'Nutrition sportive à Maurepas : où acheter depuis la fermeture du magasin',
  metaTitle: 'Nutrition sportive à Maurepas : où acheter aujourd’hui',
  metaDescription:
    'Le magasin FitnessBoutique de Maurepas est fermé depuis décembre 2023. La boutique spécialisée la plus proche : BodyStart Nutrition à Coignières, 4,4 km.',
  excerpt:
    "La boutique de nutrition sportive la plus proche de Maurepas est BodyStart Nutrition, à Coignières : 4,4 km par la N10 depuis la mairie, environ 7 minutes hors heures de pointe. Le magasin FitnessBoutique de Maurepas, dans la zone de Pariwest, est fermé depuis décembre 2023.",
  datePublished: '2026-11-02',
  dateModified: '2026-11-02',
  sections: [
    {
      h2: 'Le magasin FitnessBoutique de Maurepas est fermé',
      blocks: [
        {
          type: 'p',
          text: "L'établissement FitnessBoutique de la zone de Pariwest (rond-point Laurent Schwartz, à Maurepas) est enregistré comme **fermé au registre des entreprises depuis le 21 décembre 2023** (SIRET 452 454 440 00622). Si tu y achetais tes compléments, voici les options qui existent vraiment autour de Maurepas.",
        },
        {
          type: 'p',
          text: 'Les distances sont calculées en voiture depuis la mairie de Maurepas (place d’Auxois), hors heures de pointe, relevé du 2 novembre 2026.',
        },
      ],
    },
    {
      h2: 'Où acheter de la nutrition sportive près de Maurepas',
      blocks: [
        { type: 'h3', text: 'Les boutiques spécialisées' },
        {
          type: 'list',
          items: [
            '**BodyStart Nutrition, Coignières** (8 Rue du Pont des Landes) : 4,4 km, environ 7 minutes par la N10. Boutique spécialisée en nutrition sportive, avec du conseil au comptoir.',
            '**BioTech USA, Montigny-le-Bretonneux** (5 rue Colbert) : 10,4 km, environ 13 minutes. Boutique de la marque BioTech USA.',
            '**FitnessBoutique, Chambourcy** (centre commercial Les Vergers de la Plaine) : 23,1 km, environ 27 minutes. Le magasin de l’enseigne ouvert le plus proche de Maurepas.',
          ],
        },
        { type: 'h3', text: 'Les magasins de sport généralistes' },
        {
          type: 'list',
          items: [
            '**Decathlon, Coignières** (zone commerciale Le Forum) : 1,4 km, environ 3 minutes.',
            '**Intersport, Maurepas** (zone de Pariwest) : 3,3 km, environ 6 minutes.',
          ],
        },
        {
          type: 'p',
          text: "Dans un magasin de sport généraliste, le rayon nutrition varie d'un magasin à l'autre : vérifie avant de te déplacer si tu cherches un produit précis.",
        },
      ],
    },
    {
      h2: 'Ce qu’on trouve chez BodyStart, à Coignières',
      blocks: [
        {
          type: 'list',
          items: [
            '**Protéines** : whey, isolate, whey native, protéines végétales et gainers, dans notre rayon [protéines](/categories/proteines).',
            '**Créatine** : créatine monohydrate en poudre, neutre ou aromatisée, dans le rayon [créatine](/categories/creatine).',
            '**Glucides** : crème de riz et autres sources de glucides pour tes repas et collations, dans le rayon [glucides](/categories/glucides).',
            '**Santé** : magnésium, vitamine D, oméga 3 et autres compléments du quotidien, dans le rayon [santé et bien-être](/categories/sante).',
          ],
        },
        {
          type: 'p',
          text: "Tu hésites entre deux produits ? Passe au comptoir : le conseil est gratuit, et on t'oriente vers ce qui correspond à ton objectif et à ton budget. Tu peux aussi [demander un conseil en ligne](/conseil).",
        },
      ],
    },
    {
      h2: 'Depuis Maurepas : retrait, livraison et horaires',
      blocks: [
        {
          type: 'list',
          items: [
            '**Retrait en boutique** : gratuit, et immédiat pour les produits en stock, du lundi au samedi de 11 h à 19 h. Le site affiche le stock de la boutique en temps réel.',
            '**Livraison locale** : tout Maurepas est dans la zone, du lundi au samedi, le soir même si tu commandes avant 17 h.',
            '**Point relais ou domicile** : livraison partout en France, détails sur la page [livraison](/livraison).',
          ],
        },
        {
          type: 'p',
          text: 'Le trajet détaillé depuis Maurepas et les autres villes du secteur est sur notre page [compléments alimentaires dans les Yvelines](/complements-alimentaires-yvelines).',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Le magasin FitnessBoutique de Maurepas a-t-il rouvert ?',
      a: "Non. L'établissement de la zone de Pariwest est enregistré comme fermé au registre des entreprises depuis le 21 décembre 2023. Le magasin FitnessBoutique ouvert le plus proche est à Chambourcy, à environ 23 km de Maurepas. La boutique de nutrition sportive la plus proche de Maurepas est BodyStart Nutrition, à Coignières, à 4,4 km.",
    },
    {
      q: 'Où acheter de la whey près de Maurepas ?',
      a: "Chez BodyStart Nutrition, à Coignières, à 4,4 km de la mairie de Maurepas par la N10 (environ 7 minutes hors heures de pointe). Whey, isolate et whey native sont en rayon, en retrait immédiat quand elles sont en stock, du lundi au samedi de 11 h à 19 h.",
    },
    {
      q: 'Livrez-vous à Maurepas ?',
      a: "Oui. Tout Maurepas est dans la zone de livraison locale, du lundi au samedi, le soir même si tu commandes avant 17 h. Tu peux aussi choisir un point relais, la livraison à domicile, ou le retrait gratuit en boutique à Coignières.",
    },
  ],
  products: [
    { handle: 'whey-native-protimuscle', label: 'Whey Native Protimuscle (Nutrimuscle)' },
    { handle: 'dedicated-nutrition-micronized-creatine-monohydrate', label: 'Micronized Creatine Monohydrate (Dedicated)' },
  ],
  categories: [
    { slug: 'proteines', label: 'Protéines' },
    { slug: 'creatine', label: 'Créatine' },
  ],
  related: ['complements-debutant-musculation', 'quelle-whey-choisir-debutant', 'whey-francaise-laquelle-choisir'],
}
