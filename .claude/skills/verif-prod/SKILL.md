---
name: verif-prod
description: "Vérification de la production bodystart-nutrition.fr après un push sur main : attend que Vercel serve le bon commit, lance la sonde mobile Playwright (390×844, pages clés, règles mobile first, perf médiane, ISR), relit les captures et rend un compte rendu court. À lancer à la main après chaque déploiement."
disable-model-invocation: true
argument-hint: "[handle-produit]"
allowed-tools: Bash, Read, Glob, Grep
---

# Vérifier la prod après un déploiement

Toujours dans cet ordre. Ne jamais dire « c'est en ligne » sans avoir passé l'étape 4.

## 1. Le commit est-il parti ?

```bash
git status --short && git log --oneline origin/main..HEAD
```

S'il reste des commits non poussés, s'arrêter et le dire : le déploiement n'a pas commencé.

## 2. Attendre que Vercel serve ce commit

```bash
node .claude/skills/verif-prod/scripts/wait-deploy.mjs
```

Le script interroge `/api/version` toutes les 15 s (10 min max). En cas de délai dépassé, regarder le déploiement sur Vercel (build en erreur ? preview au lieu de production ?) avant d'aller plus loin.

## 3. Sonde mobile

```bash
node .claude/skills/verif-prod/scripts/probe-mobile.mjs --product $ARGUMENTS
```

Sans argument, le script prend la première fiche produit du sitemap. Il produit `qa-shots/<horodatage>/report.md` et une capture pleine page par route (home, catalogue, fiche produit, boutiques, conseil, blog).

Ce qu'il contrôle, par page : HTTP 200, un seul h1, canonical, meta description, absence de débordement horizontal, cibles tactiles de 44 px minimum sur toute la page (après défilement complet, celles du premier écran sont signalées ; les liens au fil d'un paragraphe sont comptés à part), champs de saisie à 16 px minimum, JSON-LD valide, erreurs console. Puis la perf de la fiche produit (médiane de 3 chargements, 4G lent + CPU ×4) et le cache ISR (`x-vercel-cache` attendu HIT au second appel).

Prérequis une seule fois : `npx playwright install chromium`.

## 4. Relire les captures

Ouvrir avec l'outil Read chaque PNG de `qa-shots/<horodatage>/` et vérifier à l'œil : hero et premier écran, barre « Ajouter au panier » visible sur la fiche, pied de page, aucun texte tronqué, aucune image cassée, bandeau daté toujours d'actualité.

## 5. Erreurs à l'exécution

Si le connecteur Vercel est disponible, lister les erreurs runtime du projet sur les 30 dernières minutes. Sinon, le dire.

## 6. Compte rendu (5 lignes maximum)

1. Commit servi par la prod et heure.
2. Pages OK / KO avec le problème exact.
3. Perf fiche produit : LCP médian, comparé au dernier relevé connu (voir `CLAUDE.md`, section Performance mobile).
4. Chemin des captures.
5. Action à faire, ou « rien à faire ».

Seuils : LCP fiche produit sous 4 s en 4G lent + CPU ×4 est acceptable, sous 3 s est bon ; toute cible sous 44 px ou champ sous 16 px est à corriger avant de clore.
