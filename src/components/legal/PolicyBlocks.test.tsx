import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import PolicyBlocks from './PolicyBlocks'
import { parsePolicyHtml } from '@/lib/legal/parsePolicyHtml'

const fixture = (name: string) =>
  parsePolicyHtml(fs.readFileSync(path.join(__dirname, '../../lib/legal/fixtures', name), 'utf8'))

const count = (html: string, needle: string) => html.split(needle).length - 1

describe('PolicyBlocks', () => {
  it('CGV (sans option) : un paragraphe simple par article, rien d’autre', () => {
    const cgv = fixture('cgv-shopify-2026-10-06.html')
    const html = renderToStaticMarkup(<PolicyBlocks blocks={cgv.sections[0].blocks} />)
    expect(html).toMatch(/^<div class="space-y-4"><p class="text-ink leading-relaxed text-base">Les présentes/)
    expect(html).not.toContain('<span')
    expect(html).not.toContain('<strong')
  })

  it('remboursement : intertitres h3, formulaire encadré avec un champ par ligne, email cliquable', () => {
    const refund = fixture('remboursement-shopify-2026-10-06.html')
    const html = renderToStaticMarkup(<PolicyBlocks blocks={refund.intro} leadHeadings linkEmails />)
    expect(count(html, '<h3')).toBe(6)
    expect(html).toContain('>Formulaire de rétractation</h3>')
    const form = html.slice(html.indexOf('>Formulaire de rétractation</h3>'))
    expect(form).toContain('border-dashed')
    // Chaque champ est sur sa propre ligne (span en display:block)
    for (const field of ['Numéro de commande', 'Nom du consommateur', 'Adresse du consommateur', 'Date :']) {
      expect(form).toMatch(new RegExp(`<span class="block[^"]*">${field}`))
    }
    expect(html).toContain('href="mailto:bodystartnutrition@gmail.com"')
  })

  it('mentions légales : libellés en gras, une ligne par information', () => {
    const notice = fixture('mentions-legales-shopify-2026-10-06.html')
    const html = renderToStaticMarkup(<PolicyBlocks blocks={notice.sections[0].blocks} boldLabels linkEmails />)
    expect(html).toContain('<strong class="font-semibold text-spruce">Raison sociale : </strong>')
    expect(count(html, '<span class="block')).toBe(9)
    expect(html).toContain('href="mailto:bodystartnutrition@gmail.com"')
  })
})
