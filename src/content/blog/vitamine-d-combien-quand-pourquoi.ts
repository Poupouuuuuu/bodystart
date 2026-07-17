import type { BlogArticle } from '@/lib/blog'

// Article SEO/GEO — cible « vitamine D dosage / carence / quand prendre ».
// Allégations UE 1924/2006 (vitamine D) : absorption normale du calcium,
// maintien d'une ossature normale, fonction musculaire normale, système
// immunitaire normal. AUCUNE allégation de prévention de maladie. Dosage
// présenté prudemment (statut individuel + avis médical). Handles + prix
// vérifiés Shopify 2026-07-17.
export const vitamineDCombienQuandPourquoi: BlogArticle = {
  slug: 'vitamine-d-combien-quand-pourquoi',
  title: 'Vitamine D : combien, quand et pourquoi en prendre ?',
  metaTitle: 'Vitamine D : combien, quand et pourquoi en prendre ?',
  metaDescription:
    'La vitamine D : à quoi elle sert, pourquoi la carence est fréquente, quel dosage et quand la prendre. D3, gouttes ou softgels : on t\'explique tout.',
  excerpt:
    "La vitamine D contribue au fonctionnement normal du système immunitaire, au maintien d'une ossature normale et à une fonction musculaire normale. Sous nos latitudes, une supplémentation fait surtout sens d'octobre à mars, quand le soleil manque — sous forme de D3, de préférence avec un repas.",
  datePublished: '2026-07-17',
  dateModified: '2026-07-17',
  sections: [
    {
      h2: 'À quoi sert vraiment la vitamine D ?',
      blocks: [
        {
          type: 'p',
          text: "La vitamine D est un peu à part : le corps la fabrique surtout via la peau exposée au soleil, et l'alimentation en apporte peu. Elle joue plusieurs rôles officiellement reconnus. La **vitamine D contribue à l'absorption et à l'utilisation normales du calcium**, **au maintien d'une ossature normale**, **à une fonction musculaire normale** et **au fonctionnement normal du système immunitaire**.",
        },
        {
          type: 'p',
          text: "Autrement dit, elle est au carrefour des os, des muscles et de l'immunité — trois piliers qui parlent à tout le monde, sportif ou non. C'est pour ça qu'on la range parmi les fondations, avant même les compléments de performance.",
        },
        {
          type: 'p',
          text: 'Un point important : la vitamine D est une base, pas un remède. On la prend pour soutenir un fonctionnement normal, pas pour « soigner » quoi que ce soit. En cas de symptômes ou de doute médical, c\'est ton médecin qui tranche.',
        },
      ],
    },
    {
      h2: 'Pourquoi la carence est-elle si fréquente ?',
      blocks: [
        {
          type: 'p',
          text: "Parce qu'en France, le soleil ne suffit pas une bonne partie de l'année. La synthèse par la peau dépend de l'exposition aux UVB, faibles d'**octobre à mars** sous nos latitudes. Ajoute à ça une vie majoritairement en intérieur, la crème solaire l'été, une peau plus foncée qui synthétise moins vite… et le déficit devient courant, surtout en hiver.",
        },
        {
          type: 'p',
          text: "Côté alimentation, peu d'aliments en apportent réellement : essentiellement les poissons gras (saumon, maquereau, sardine), les œufs, et quelques produits enrichis. Difficile de couvrir ses besoins par l'assiette seule. C'est ce qui explique qu'une supplémentation hivernale soit si souvent conseillée.",
        },
      ],
    },
    {
      h2: 'Combien de vitamine D faut-il prendre ?',
      blocks: [
        {
          type: 'p',
          text: "La bonne dose dépend de ton **statut de départ**, qui varie d'une personne à l'autre. C'est pour ça qu'on évite les prescriptions à l'emporte-pièce : un **dosage sanguin** et l'avis de ton médecin ou pharmacien permettent d'ajuster précisément, notamment si tu penses être très carencé.",
        },
        {
          type: 'p',
          text: 'En entretien, les compléments grand public se présentent en doses quotidiennes (en gouttes ou softgels) à intégrer sur la période automne-hiver. L\'idée n\'est pas d\'en prendre le plus possible : la vitamine D est liposoluble et se stocke, donc on vise une supplémentation régulière et raisonnable plutôt que des méga-doses. En cas de doute, demande conseil.',
        },
      ],
    },
    {
      h2: 'Quand et comment la prendre ?',
      blocks: [
        {
          type: 'p',
          text: "La vitamine D est **liposoluble** : elle s'absorbe mieux avec un repas contenant un peu de matières grasses. Le déjeuner ou le dîner sont donc de bons moments. L'heure exacte compte peu ; la régularité, elle, fait tout — une prise quotidienne sur la saison est plus efficace qu'une prise irrégulière.",
        },
        {
          type: 'list',
          items: [
            'Prends-la de préférence pendant un repas contenant des lipides.',
            'Vise la régularité sur la période octobre-mars.',
            'Le format gouttes permet d\'ajuster finement la dose ; les softgels sont pratiques.',
            'La forme D3 (voir ci-dessous) est à privilégier.',
          ],
        },
      ],
    },
    {
      h2: 'D2 ou D3, gouttes ou softgels : quelle forme choisir ?',
      blocks: [
        {
          type: 'p',
          text: "Privilégie la **vitamine D3** (cholécalciférol) : c'est la forme la mieux utilisée par l'organisme, identique à celle que ta peau produit au soleil. La D2 (d'origine végétale) est moins efficace pour élever le statut. Certaines formules associent la **D3 à la K2**, appréciée pour son rôle dans la fixation du calcium sur l'os.",
        },
        {
          type: 'table',
          headers: ['Produit', 'Format', 'Prix'],
          rows: [
            [
              '[Vitamine D3 + K2](/products/vitamin-d3-k2)',
              'Softgels (duo D3-K2)',
              '17,90 €',
            ],
            [
              '[Vitamine D3 — Gouttes](/products/vitamine-d3-gouttes)',
              'Gouttes (dose ajustable)',
              '12,90 €',
            ],
          ],
        },
        {
          type: 'p',
          text: 'La [Vitamine D3 + K2](/products/vitamin-d3-k2) en softgels est simple et complète ; la [version en gouttes](/products/vitamine-d3-gouttes) permet d\'ajuster la dose et se glisse dans un repas. Tu retrouves ces références et les autres fondations dans le rayon [santé & bien-être](/categories/sante). La vitamine D fait aussi partie des priorités qu\'on détaille dans notre article [compléments après 40 ans](/blog/complements-apres-40-ans).',
        },
      ],
    },
  ],
  faq: [
    {
      q: 'Quand faut-il prendre de la vitamine D ?',
      a: 'Sous nos latitudes, la supplémentation fait surtout sens d\'octobre à mars, quand l\'exposition au soleil est faible. Prends-la de préférence pendant un repas contenant des matières grasses, chaque jour sur la saison : la régularité prime sur l\'heure exacte.',
    },
    {
      q: 'Quelle dose de vitamine D par jour ?',
      a: 'La dose dépend de ton statut de départ, qui varie d\'une personne à l\'autre. Un dosage sanguin et l\'avis de ton médecin ou pharmacien permettent de l\'ajuster, surtout en cas de carence marquée. La vitamine D se stockant, on vise une supplémentation régulière et raisonnable plutôt que des méga-doses.',
    },
    {
      q: 'Vaut-il mieux de la vitamine D2 ou D3 ?',
      a: 'La D3 (cholécalciférol) est à privilégier : c\'est la forme la mieux utilisée par l\'organisme, identique à celle produite par la peau au soleil. La D2 est moins efficace pour élever le statut en vitamine D.',
    },
    {
      q: 'À quoi sert d\'associer la vitamine D à la K2 ?',
      a: 'La vitamine K2 est appréciée pour son rôle dans la fixation du calcium sur l\'os, en complément de la vitamine D qui contribue à l\'absorption normale du calcium et au maintien d\'une ossature normale. Les formules D3 + K2 réunissent les deux dans un même produit.',
    },
    {
      q: 'La vitamine D est-elle utile pour les sportifs ?',
      a: 'Oui, comme pour tout le monde : elle contribue à une fonction musculaire normale, au maintien d\'une ossature normale et au fonctionnement normal du système immunitaire. C\'est une fondation à surveiller, surtout en hiver, avant même les compléments de performance.',
    },
  ],
  products: [
    { handle: 'vitamin-d3-k2', label: 'Vitamine D3 + K2' },
    { handle: 'vitamine-d3-gouttes', label: 'Vitamine D3 — Gouttes' },
  ],
  categories: [{ slug: 'sante', label: 'Santé & bien-être' }],
  related: ['complements-apres-40-ans', 'complements-debutant-musculation'],
}
