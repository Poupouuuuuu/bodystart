# Hooks Claude Code du projet

Scripts Node (pas de bash ni de jq : ils tournent tels quels sous Windows).
Ils sont branchés dans `.claude/settings.json` (section `hooks`), en forme « exec »
(`command` + `args`) pour ne dépendre d'aucun shell.

| Script | Événement | Rôle |
| --- | --- | --- |
| `protect-files.js` | PreToolUse (Edit, Write, MultiEdit, NotebookEdit) | Refuse l'écriture sur `.env*`, `backups/` et les migrations déjà commitées |

## Conventions

- Entrée : JSON du hook sur stdin. Sortie : exit 0 = OK, exit 2 + message sur stderr = refus ou retour à Claude.
- Un hook ne doit jamais faire échouer la session : toute erreur interne se traduit par un exit 0 silencieux.
- Tester à la main : `echo '{"tool_name":"Edit","tool_input":{"file_path":".env.local"}}' | node .claude/hooks/protect-files.js` puis `echo $?` (attendu : 2).

## Limites connues

- Les hooks ne voient que les outils Edit / Write / MultiEdit / NotebookEdit : une commande Bash (`sed -i`, `>>`) n'est pas interceptée.
