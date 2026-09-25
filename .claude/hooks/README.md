# Hooks Claude Code du projet

Scripts Node (pas de bash ni de jq : ils tournent tels quels sous Windows).
Ils sont branchés dans `.claude/settings.json` (section `hooks`), en forme « exec »
(`command` + `args`) pour ne dépendre d'aucun shell.

| Script | Événement | Rôle |
| --- | --- | --- |
| `protect-files.js` | PreToolUse (Edit, Write, MultiEdit, NotebookEdit) | Refuse l'écriture sur `.env*`, `backups/` et les migrations déjà commitées |
| `no-dash.js` | PostToolUse (Edit, Write, MultiEdit) | Signale les tirets longs « — » et « – » introduits dans du texte client : fichiers de contenu (.md, .json, .html…) et chaînes visibles du code (littéraux, gabarits, texte et attributs JSX), jamais les commentaires. `node .claude/hooks/no-dash.js --scan src` pour auditer tout le dépôt |
| `mark-dirty.js` | PostToolUse (Edit, Write, MultiEdit, NotebookEdit) | Note le fichier modifié dans un marqueur de session (dossier temporaire), lu par `stop-check.js` |
| `stop-check.js` | Stop | Si des fichiers de code ont été modifiés pendant le tour : `tsc --noEmit` + `vitest related` sur les sources touchées (suite complète si package.json / tsconfig / vitest.config). Échec = Claude ne s'arrête pas et corrige. Respecte `stop_hook_active` (pas de boucle). Doc ou contenu seuls = rien |

## Conventions

- Entrée : JSON du hook sur stdin.
- Sortie selon l'événement (doc hooks à jour) :
  - PreToolUse (`protect-files.js`) et Stop (`stop-check.js`) : exit 2 + message sur stderr. Bloque l'outil, ou empêche Claude de s'arrêter ; Claude reçoit le message.
  - PostToolUse (`no-dash.js`) : l'outil a déjà tourné, rien à bloquer. Sortie JSON `{"decision": "block", "reason": "…"}` sur stdout, exit 0 : la raison est ajoutée à côté du résultat de l'outil et Claude corrige.
- Un hook ne doit jamais faire échouer la session : toute erreur interne se traduit par un exit 0 silencieux.
- Tester à la main : `echo '{"tool_name":"Edit","tool_input":{"file_path":".env.local"}}' | node .claude/hooks/protect-files.js` puis `echo $?` (attendu : 2).

## Limites connues

- Les hooks ne voient que les outils Edit / Write / MultiEdit / NotebookEdit : une commande Bash (`sed -i`, `>>`) n'est pas interceptée.
- `no-dash.js` ne signale que les tirets introduits par l'édition en cours (le texte existant du site en contient encore : voir `--scan`). Une ligne contenant `tiret-ok` est ignorée (constante technique).
