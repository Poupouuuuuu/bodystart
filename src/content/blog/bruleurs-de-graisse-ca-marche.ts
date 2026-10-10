import type { BlogArticle } from '@/lib/blog'

// Article SEO/GEO — cible « brûleur de graisse efficace / est-ce que ça marche ».
// ⚠️ COMPLIANCE UE 1924/2006 STRICTE : AUCUNE allégation « brûle les graisses »
// ou « fait maigrir ». La L-carnitine et le CLA n'ont PAS d'allégation santé
// autorisée (rejetées par l'EFSA), pas d'effet prêté (ni « transport des
// acides gras »). Caféine : allégations encore en attente au niveau UE, on cite
// la présence ou la teneur, jamais un effet (relecture CG du 10/10/2026). Angle
// honnête = le déficit calorique fait tout le travail, sans moquer le produit.
// Handles + prix vérifiés Shopify 2026-07-17.
export const bruleursDeGraisseCaMarche: BlogArticle = {
  slug: 'bruleurs-de-graisse-ca-marche',
  title: 'Brûleurs de graisse : est-ce que ça marche vraiment ?',
  metaTitle: 'Brûleurs de graisse : est-ce que ça marche vraiment ?',
  metaDescription:
    'Les brûleurs de graisse sont-ils efficaces ? La vérité : aucun ne fait maigrir sans déficit calorique. Ce qu\'ils font, pour qui, et notre avis honnête.',
  excerpt:
    "La vérité d'abord : aucun brûleur ne fait maigrir sans déficit calorique. La L-carnitine, le CLA ou les formules à la caféine s'utilisent en accompagnement d'une sèche déjà structurée, jamais à sa place. On t'explique ce qu'on peut en dire, et à quel moment ils ont leur place.",
  datePublished: '2026-07-17',
  dateModified: '2026-10-10',
  sections: [
    {
      h2: 'La vérité qui dérange : le déficit calorique fait tout le travail',
      blocks: [
        {
          type: 'p',
          text: "Commençons par la seule chose qui compte vraiment : on perd du gras quand on dépense plus d'énergie qu'on en consomme, c'est-à-dire en **déficit calorique**. Aucun complément ne contourne cette règle. Un « brûleur » ne fait pas fondre la graisse tout seul, et il ne compense pas une alimentation non maîtrisée.",
        },
        {
          type: 'p',
          text: "C'est le message qu'on donne au comptoir à Coignières : un brûleur s'ajoute à une alimentation et un entraînement déjà en place, il ne les remplace pas. Les produits de ce rayon sont des **accompagnements** d'une sèche structurée.",
        },
        {
          type: 'p',
          text: 'Dit autrement : les fondations, ce sont le déficit calorique, un apport en protéines suffisant pour préserver le muscle, l\'activité physique et le sommeil. Le complément vient en dernier, après ces piliers.',
        },
      ],
    },
    {
      h2: 'Que font vraiment les « brûleurs » ?',
      blocks: [
        {
          type: 'p',
          text: "Soyons précis, car la réglementation l'est aussi. La **L-carnitine** est un classique autour de l'entraînement, mais aucune allégation santé n'est autorisée à son sujet : on ne peut donc lui prêter aucun effet, minceur compris. Le **CLA** (un acide gras) est populaire en période de régime, là encore sans allégation reconnue. Ce sont des produits d'accompagnement, pas des actifs amaigrissants.",
        },
        {
          type: 'p',
          text: "La **caféine** est présente dans beaucoup de formules « thermogéniques » : chaque fiche indique sa teneur par dose. Ses allégations sont encore en attente au niveau européen, on ne lui prête donc aucun effet ici, et elle ne « brûle » pas la graisse pour autant.",
        },
        {
          type: 'list',
          items: [
            'L-carnitine : classique autour de l\'entraînement ; aucune allégation santé autorisée.',
            'CLA : acide gras populaire en régime ; pas d\'allégation reconnue.',
            'Caféine (formules thermogéniques) : teneur indiquée sur chaque fiche ; allégations encore en attente au niveau européen.',
            'Draineurs : formules à base de plantes, à ne pas confondre avec une perte de graisse.',
          ],
        },
      ],
    },
    {
      h2: 'Les grandes familles du rayon',
      blocks: [
        {
          type: 'p',
          text: 'Pour t\'y retrouver, voici les quatre grandes catégories. La **L-carnitine**, le grand classique autour de l\'entraînement, en poudre, en boisson prête ou en shot. Le **CLA**, en capsules, choisi pendant les périodes de régime. Les **formules thermogéniques** à base de caféine et de plantes, pour les pratiquants avancés qui tolèrent bien les stimulants. Et les **draineurs**, des formules à base de plantes, à ne pas confondre avec la perte de graisse.',
        },
        {
          type: 'p',
          text: 'Aucune de ces familles n\'est indispensable. Elles se choisissent selon ta préférence et ta tolérance, une fois que les bases sont solides. Si tu débutes une sèche, le plus utile n\'est pas dans ce rayon : c\'est de sécuriser ton apport en protéines pour ne pas perdre de muscle, un point qu\'on détaille dans [combien de protéines par jour](/blog/combien-de-proteines-par-jour).',
        },
      ],
    },
    {
      h2: 'Notre sélection (et à quoi la réserver)',
      blocks: [
        {
          type: 'table',
          headers: ['Produit', 'Famille', 'Prix'],
          rows: [
            [
              '[L-Carnitine 1500 Applied Nutrition](/products/l-carnitine-1500-120-gelules)',
              'Carnitine (le classique)',
              '{{prix:l-carnitine-1500-120-gelules|27,90 €}}',
            ],
            [
              '[CLA DY Nutrition](/products/cla-dy-90-softgels)',
              'CLA (période de régime)',
              '{{prix:cla-dy-90-softgels|19,90 €}}',
            ],
            [
              '[Iron Ultra Eric Favre](/products/iron-ultra-eric-favre)',
              'Formule complète (carnitine, thé vert)',
              '{{prix:iron-ultra-eric-favre|31,90 €}}',
            ],
          ],
        },
        {
          type: 'p',
          text: 'La [L-Carnitine 1500](/products/l-carnitine-1500-120-gelules) est l\'option la plus simple autour de l\'entraînement ; le [CLA de DY Nutrition](/products/cla-dy-90-softgels) est un acide gras souvent choisi en période de régime ; les formules complètes type [Iron Ultra](/products/iron-ultra-eric-favre) combinent plusieurs ingrédients pour les pratiquants avancés. Tu peux voir tout le rayon [brûleurs de graisse](/categories/bruleurs). Rappel : un produit ne remplace jamais le déficit.',
        },
      ],
    },
    {
      h2: 'Pour qui ça peut avoir un intérêt, et pour qui non',
      blocks: [
        {
          type: 'p',
          text: "Un brûleur peut avoir un petit intérêt pour quelqu'un dont la sèche est **déjà bien menée** : alimentation contrôlée, entraînement régulier, sommeil correct, et qui cherche un produit d'accompagnement ou un rituel qui l'aide à rester dans le cadre. C'est un confort, pas un moteur.",
        },
        {
          type: 'p',
          text: 'En revanche, il ne compensera pas une alimentation non maîtrisée, et si tu débutes ta démarche, ce n\'est pas la priorité : commence par les bases ci-dessous. Et il est à éviter le soir s\'il contient de la caféine, pour ne pas gêner ton sommeil, sujet qu\'on aborde dans [mieux dormir et récupérer](/blog/mieux-dormir-recuperation).',
        },
        {
          type: 'steps',
          items: [
            'Mets en place un déficit calorique raisonnable, sans excès.',
            'Sécurise ton apport en protéines pour préserver le muscle.',
            'Garde un entraînement régulier et un sommeil correct.',
            'Seulement ensuite, envisage un brûleur comme accompagnement, si tu le souhaites.',
            'Évite les formules caféinées en fin de journée.',
          ],
        },
        {
          type: 'p',
          text: 'Tu prépares une sèche ? Passe en boutique avec tes objectifs : on te dira honnêtement si un brûleur a sa place dans ton plan. Et parfois, la réponse est non. Le conseil est gratuit.',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Les brûleurs de graisse font-ils maigrir ?',
      a: 'Non, aucun brûleur ne fait maigrir à lui seul. La perte de gras vient du déficit calorique : dépenser plus d\'énergie qu\'on en consomme. Ces produits sont des accompagnements d\'une sèche déjà structurée (alimentation, entraînement, sommeil), pas des solutions minceur.',
    },
    {
      q: 'La L-carnitine fait-elle perdre du poids ?',
      a: 'Aucune allégation de perte de poids n\'est autorisée pour la L-carnitine : on ne peut donc pas lui prêter d\'effet minceur. C\'est un produit d\'accompagnement classique autour de l\'entraînement.',
    },
    {
      q: 'Quel est le brûleur de graisse le plus efficace ?',
      a: 'Aucun brûleur ne remplace un déficit calorique : le résultat vient de ton alimentation et de ton activité. Le choix dépend surtout de ta tolérance aux stimulants : sans caféine (L-carnitine, CLA) ou formule complète avec caféine, à éviter en fin de journée. En boutique, on t\'aide à choisir.',
    },
    {
      q: 'Faut-il prendre un brûleur quand on débute une sèche ?',
      a: 'Non, ce n\'est pas la priorité. Quand on débute une sèche, le plus utile est de mettre en place un déficit raisonnable et un apport en protéines suffisant pour préserver le muscle. Un brûleur n\'a d\'intérêt éventuel qu\'une fois ces bases solidement en place.',
    },
    {
      q: 'Les brûleurs sont-ils dangereux ?',
      a: 'Aux doses recommandées et chez une personne en bonne santé, les produits du rayon s\'utilisent sans problème particulier, mais les formules caféinées demandent de la prudence : évite de les cumuler avec beaucoup de café et de les prendre en fin de journée. En cas de pathologie, de traitement ou de doute, demande l\'avis de ton médecin.',
    },
  ],
  products: [
    { handle: 'l-carnitine-1500-120-gelules', label: 'L-Carnitine 1500 (Applied Nutrition)' },
    { handle: 'cla-dy-90-softgels', label: 'CLA (DY Nutrition)' },
    { handle: 'iron-ultra-eric-favre', label: 'Iron Ultra (Eric Favre)' },
  ],
  categories: [{ slug: 'bruleurs', label: 'Brûleurs de graisse' }],
  related: ['comment-faire-une-seche', 'combien-de-proteines-par-jour', 'complements-debutant-musculation'],
}
