import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Depuis le 30/10/2026, Supabase n'accorde plus automatiquement les droits
// aux nouvelles tables, vues et séquences du schéma public (anon,
// authenticated, ni service_role) : sans GRANT explicite, le serveur reçoit
// une erreur 42501 « permission denied for table » à la première requête.
// Les tables existantes (migrations 00004 à 00018) gardent leurs droits.
// Toute migration à partir de 00019 doit donc accorder ses droits elle-même.

const DOSSIER = join(process.cwd(), 'supabase', 'migrations')
const PREMIERE_CONCERNEE = 19

const sansCommentaires = (sql: string) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '')

/** Tables et vues créées dans public sans GRANT à service_role dans le même fichier. */
function objetsSansGrant(sql: string): string[] {
  const propre = sansCommentaires(sql)
  const crees = [
    ...propre.matchAll(
      /create\s+(?:or\s+replace\s+)?(?:table|view|materialized\s+view)\s+(?:if\s+not\s+exists\s+)?public\."?(\w+)"?/gi
    ),
  ].map((m) => m[1].toLowerCase())
  const accordes = new Set<string>()
  for (const m of propre.matchAll(/grant\s+[^;]*?\s+on\s+(?:table\s+)?([^;]*?)\s+to\s+([^;]*);/gi)) {
    if (!/\bservice_role\b/i.test(m[2])) continue
    for (const objet of m[1].split(',')) {
      const nom = objet.trim().match(/^public\."?(\w+)"?$/i)?.[1]
      if (nom) accordes.add(nom.toLowerCase())
    }
  }
  return crees.filter((t) => !accordes.has(t))
}

describe('migrations Supabase : droits explicites des nouvelles tables (30/10/2026)', () => {
  it('chaque table ou vue créée dans public à partir de 00019 accorde ses droits à service_role', () => {
    const fautifs = readdirSync(DOSSIER)
      .filter((f) => /^\d+_.*\.sql$/.test(f) && Number(f.split('_')[0]) >= PREMIERE_CONCERNEE)
      .flatMap((f) => objetsSansGrant(readFileSync(join(DOSSIER, f), 'utf8')).map((t) => `${f} : public.${t}`))
    expect(fautifs, 'ajouter « grant select, insert, update, delete on public.<table> to service_role; »').toEqual([])
  })

  it('le contrôle repère une table sans GRANT et accepte les formes usuelles', () => {
    expect(objetsSansGrant('create table public.a (id uuid);\nalter table public.a enable row level security;')).toEqual(['a'])
    // Un GRANT à anon seul ne suffit pas, ni un GRANT commenté.
    expect(objetsSansGrant('create table public.a (id uuid);\ngrant select on public.a to anon;\n-- grant all on public.a to service_role;')).toEqual(['a'])
    expect(
      objetsSansGrant(
        'create table if not exists public.a (id uuid);\ncreate or replace view public.v as select 1;\n' +
          'grant select, insert, update, delete on table public.a to service_role;\ngrant select on public.v to authenticated, service_role;'
      )
    ).toEqual([])
    // Hors schéma public : non concerné.
    expect(objetsSansGrant('create table private.journal (id uuid);')).toEqual([])
  })
})
