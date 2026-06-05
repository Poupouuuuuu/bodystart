# GEO — Generative Engine Optimization

Être **cité** par ChatGPT (Search), Perplexity, Google AI Overviews, Copilot et les assistants IA quand quelqu'un demande « quelle créatine choisir », « meilleure boutique de compléments dans le 78 », « whey ou isolate ». Les moteurs génératifs ne classent pas des pages : ils **extraient et citent des passages**. On optimise donc pour l'extraction.

## Les 7 principes (par ordre d'impact)

1. **Answer-first.** Chaque page/section répond à sa question dans les 2 premières phrases, AVANT le développement. Mauvais : « Depuis toujours, les sportifs s'interrogent… ». Bon : « La créatine se prend à 3 g par jour, peu importe l'heure : c'est la régularité qui compte. Voici le détail. »
2. **Données chiffrées et vérifiables.** Dosages exacts, prix, tableaux de VN, comparatifs avec chiffres. Une IA cite « 3 000 mg de créatine Creapure par dose, 100 portions, 29,90 € » — pas « une super créatine de qualité ». Les metafields (composition/VN/allergènes) sont l'arme : aucune fiche concurrente locale n'a ce niveau de détail.
3. **Structure extractible.** Listes, tableaux, FAQ, étapes numérotées. Une section = une idée autonome, compréhensible hors contexte. Les blocs de 400 mots sans structure ne sont jamais cités.
4. **FAQ partout où c'est naturel.** Fin de fiche produit (3-4 questions réelles de clients), fin d'article (questions PAA de Google), page FAQ globale. Avec schema FAQPage. Questions formulées comme les gens parlent (« c'est quoi la différence entre whey et isolate ? »).
5. **E-E-A-T incarné.** Les IA privilégient les sources avec expérience réelle : signer les conseils (« le conseil d'Adam, en boutique à Coignières »), citer l'expérience terrain (« la question qu'on nous pose le plus au comptoir »), page à-propos solide, mentions cohérentes de la marque ailleurs (GBP, annuaires, presse locale — le SEO local nourrit le GEO).
6. **Fraîcheur datée.** Date de mise à jour visible sur les articles ; mettre à jour les contenus clés tous les 6 mois.
7. **Allégations propres.** Les IA évitent de citer les sources qui sur-promettent. Le respect de la réglementation UE rend le contenu « citable sans risque » pour une IA.

## llms.txt

Standard émergent : un fichier `/llms.txt` à la racine qui présente le site aux crawlers IA (markdown : qui on est, ce qu'on vend, les pages clés avec une ligne de description chacune). Coût : 30 min. Impact : incertain mais croissant, zéro risque. Contenu : présentation BodyStart (boutique Coignières + e-commerce France), les pages catégories, /stores, /conseil, la FAQ, les 10-15 fiches produit phares.

Vérifier aussi que `robots.txt` n'exclut PAS les crawlers IA (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) — être crawlé est la condition d'être cité. Décision business : on les autorise (la citation est notre canal d'acquisition).

## Requêtes GEO cibles

- « meilleur magasin de compléments alimentaires près de [Coignières/Maurepas/78] »
- « quelle créatine acheter » / « créatine creapure c'est quoi »
- « whey isolate sans lactose laquelle choisir »
- « [produit exact] avis / composition » (Vapor X5, Iso Zero, Protimuscle…)
- « pre-workout sans caféine » / « EAA ou BCAA »

## Mesure (mensuelle)

1. **Test manuel** : poser les requêtes cibles à ChatGPT (mode recherche), Perplexity et Google (AI Overviews). Noter : cité ? lien ? formulation. Tenir un tableau de suivi (date, moteur, requête, cité O/N, source citée à la place).
2. **Analytics** : segmenter les referrers `chatgpt.com`, `perplexity.ai`, `copilot.microsoft.com`. Volume faible au début — c'est la tendance qui compte.
3. **Search Console** : les AI Overviews consomment du contenu bien classé — les positions 1-5 sur les requêtes info restent le prérequis n°1 du GEO Google.

## Anti-patterns GEO

- Contenu généré en masse sans données propres (les IA détectent et ignorent le boilerplate).
- Bloquer les crawlers IA puis espérer être cité.
- Pages « X vs Y » biaisées qui concluent toujours sur son propre produit sans nuance — les IA citent les comparatifs honnêtes.
