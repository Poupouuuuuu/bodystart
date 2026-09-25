# App Shopify « BodyStart Scripts » : marche à suivre

But : donner aux scripts (skill `fiche-produit`, agent `marque-scraper`, imports ponctuels) un accès en écriture au catalogue **sans** élargir les droits de l'app du site. L'app du site garde son jeton actuel (lecture produits, stock, codes promo) ; les scripts ont le leur, révocable à part.

Décision d'Adam (25/09/2026) : pas de `write_products` sur l'app du site.

## 1. Créer l'app (5 minutes, dans l'admin Shopify)

1. Admin `bodystart-nutrition-2` → **Paramètres** → **Applications et canaux de vente** → **Développer des applications** (activer le développement d'applications si demandé).
2. **Créer une application** → nom : `BodyStart Scripts`, développeur : Adam.
3. Onglet **Configuration** → **Configurer les portées de l'API Admin**. Cocher uniquement :

| Portée | Pourquoi |
| --- | --- |
| `read_products`, `write_products` | fiches, metafields, images, tags, statut |
| `read_files`, `write_files` | envoi des packshots (stagedUploadsCreate) |
| `read_inventory` | contrôle de stock avant une opération |
| `read_metaobjects`, `write_metaobjects` | seulement si un jour on stocke des blocs de contenu |

   Ne pas cocher : commandes, clients, paiements, thèmes, remises, boutique en ligne. Version d'API : la plus récente stable (le script utilise 2025-01, compatible).

4. **Enregistrer**, puis onglet **Aperçu de l'API** → **Installer l'application** → confirmer.
5. **Révéler le jeton une seule fois** (`shpat_…`). Il n'est affiché qu'une fois : le copier immédiatement.

## 2. Ranger le jeton

- Uniquement dans `.env.local` du poste qui lance les scripts :

```env
SHOPIFY_SCRIPTS_ADMIN_TOKEN=shpat_xxx
```

- **Jamais** sur Vercel (le site n'en a pas besoin), jamais dans le dépôt, jamais dans un message.
- Le hook `protect-files` empêche Claude d'éditer `.env.local` : Adam ajoute la ligne à la main.

## 3. Vérifier

```bash
python .claude/skills/fiche-produit/scripts/shopify_export.py vitamin-d3-k2 --out %TEMP%\test.json
```

puis un plan d'écriture à blanc (rien n'est écrit) :

```bash
python .claude/skills/fiche-produit/scripts/shopify_apply.py changes.json
```

Un `--apply` sur une fiche de test (metafield `format`) confirme les droits en écriture ; `--verify` relit.

## 4. Règles d'usage

- Le jeton scripts sert aux opérations de catalogue préparées et validées (sauvegarde avant, vérification après). Il ne sert pas au site, ni à des webhooks.
- Toute opération de masse : plan montré à Adam, puis écriture, puis compte rendu avec le chemin de la sauvegarde `backups/`.
- Les 26 boosters hardcore restent réservés au point de vente : aucune publication en ligne, même par script.

## 5. Révoquer ou renouveler

Admin → Applications et canaux de vente → Développer des applications → `BodyStart Scripts` → **Désinstaller** (révoque le jeton) ou **Aperçu de l'API → Faire pivoter le jeton**. Mettre à jour `.env.local`.

## Si le jeton n'existe pas encore

Les scripts fonctionnent en mode « connecteur » : `shopify_apply.py --emit DIR` produit les mutations GraphQL que Claude passe dans le connecteur Shopify (MCP) une par une, puis `--verify`. Plus lent, mais mêmes garde-fous.
