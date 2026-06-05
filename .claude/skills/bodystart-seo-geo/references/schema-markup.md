# Données structurées JSON-LD — exemples prêts

Le site génère déjà : Product+Offer+Brand+BreadcrumbList (fiches), LocalBusiness+Organization+OpeningHours (global), Store+GeoCoordinates (/stores). Ce fichier sert pour : vérifier l'existant, et ajouter les types MANQUANTS (FAQPage, Article, HowTo) sur les nouveaux contenus.

Valider chaque ajout sur validator.schema.org + le test des résultats enrichis Google. Un schema en erreur est pire qu'aucun schema.

## FAQPage (fiches produit avec FAQ + articles + page FAQ)

{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "La créatine se prend avant ou après l'entraînement ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Peu importe le moment : c'est la prise quotidienne régulière de 3 g qui sature les stocks musculaires. Choisis un moment fixe pour ne pas oublier."
      }
    }
  ]
}

Règles : reprendre MOT POUR MOT les questions/réponses visibles sur la page (Google pénalise le schema invisible). 3-6 questions par page max.

## Article (blog)

{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Créatine avant ou après la séance : ce que dit la science",
  "datePublished": "2026-06-10",
  "dateModified": "2026-06-10",
  "author": { "@type": "Person", "name": "Adam — BodyStart Nutrition", "url": "https://bodystart-nutrition.fr/about" },
  "publisher": { "@type": "Organization", "name": "BodyStart Nutrition", "logo": { "@type": "ImageObject", "url": "https://bodystart-nutrition.fr/assets/logos/logo-nutrition.png" } },
  "image": "https://bodystart-nutrition.fr/...",
  "mainEntityOfPage": "https://bodystart-nutrition.fr/blog/creatine-avant-ou-apres"
}

dateModified doit changer quand le contenu change réellement — signal de fraîcheur pour Google ET les IA.

## Product (référence — déjà généré par le site)

Champs critiques : name, image, description, brand (Brand), offers (Offer avec price, priceCurrency EUR, availability InStock/OutOfStock, url). Dès qu'on a des avis produits : ajouter aggregateRating + review (étoiles dans les résultats = CTR +15-30 %).

## HowTo (guides, si pertinent)

Pour « comment faire sa sèche », « programme prise de masse » : HowTo avec étapes. Bon candidat aux résultats enrichis et à l'extraction IA.

## LocalBusiness (référence — déjà global)

Vérifier que les horaires OpeningHoursSpecification restent synchronisés avec les horaires réels et la fiche GBP. Une incohérence horaires site/GBP est un signal négatif local.

## Checklist nouveau contenu

1. Le type schema correspond au contenu réel (pas de FAQPage sans FAQ visible).
2. Tout ce qui est dans le schema est visible sur la page.
3. Validation : 0 erreur, warnings acceptables.
4. Après indexation : vérifier dans Search Console → Améliorations que le type est détecté.
