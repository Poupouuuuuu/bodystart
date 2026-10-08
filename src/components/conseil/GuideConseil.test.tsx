// @vitest-environment jsdom
/**
 * Parcours du guide /conseil dans le navigateur : écrans, URL, retour,
 * résultat, ajout au panier (attributs de retrait identiques au tiroir) et
 * rappel. Vérifie aussi que les contraintes alimentaires ne sortent jamais
 * (URL, requêtes, attributs panier).
 */
import { createElement } from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react'
import { construireCatalogue, guide, HANDLES, rupture } from '@/lib/conseil/test-utils'
import type { Catalogue } from '@/lib/conseil/types'

const addItems = vi.fn(async () => true)
vi.mock('@/hooks/useCart', () => ({ useCart: () => ({ addItems, isOpen: false }) }))
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string }) => createElement('img', { src: props.src, alt: props.alt }),
}))
vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) =>
    createElement('a', { href: props.href, className: props.className }, props.children),
}))

import GuideConseil from './GuideConseil'

const LOCATION = 'gid://shopify/Location/119350657366'
const fetchMock = vi.fn()
let stockRevérifié: (variantId: string) => number = () => 3

function afficher(url = '/conseil', catalogue: Catalogue = construireCatalogue()) {
  window.history.replaceState(null, '', url)
  return render(createElement(GuideConseil, { guide, catalogue }))
}

const cliquer = (nom: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nom }))
const etape = () => new URLSearchParams(window.location.search).get('etape')

function repondreMuscle(contraintes: string[] = [], budget = '40 à 90') {
  cliquer(/Prendre du muscle/)
  cliquer('2 à 3')
  cliquer('Non')
  for (const c of contraintes) fireEvent.click(screen.getByLabelText(c))
  cliquer('Continuer')
  cliquer(new RegExp(budget))
}

async function parcoursMuscle(contraintes: string[] = [], budget = '40 à 90') {
  repondreMuscle(contraintes, budget)
  await screen.findByRole('heading', { level: 1, name: 'Ta sélection' })
}

/** Éléments affichant exactement ce prix (Intl fr-FR : espace insécable avant €). */
const prix = (montant: string) =>
  screen.queryAllByText((_, el) => el?.children.length === 0 && el.textContent === `${montant} €`)

beforeEach(() => {
  sessionStorage.clear()
  addItems.mockClear()
  fetchMock.mockReset()
  stockRevérifié = () => 3
  fetchMock.mockImplementation(async (url: string) => {
    if (url.startsWith('/api/inventory')) {
      const ids = new URL(url, 'http://x').searchParams.get('variantIds')!.split(',')
      return new Response(JSON.stringify({ variants: ids.map((id) => ({ variantId: id, available: stockRevérifié(id) })) }))
    }
    return new Response(JSON.stringify({ success: true }))
  })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('écrans', () => {
  it('écran 1 rendu d’emblée : les 6 objectifs du guide, « Étape 1 » sans total', () => {
    afficher()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Trouve ton produit en 1 minute')
    expect(screen.getByText('Étape 1')).toBeTruthy()
    for (const o of guide.objectifs) expect(screen.getByRole('button', { name: new RegExp(o.libelle) })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Retour/ })).toBeNull()
  })

  it('« Prendre du muscle » : 5 étapes, la question supplémentaire, une entrée d’historique par écran', () => {
    afficher()
    const avant = window.history.length
    cliquer(/Prendre du muscle/)
    expect(screen.getByText('Étape 2/5')).toBeTruthy()
    expect(window.location.search).toBe('?objectif=muscle&etape=seances')
    cliquer('4 et plus')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Tu as du mal à prendre du poids ?')
    expect(screen.getByText('Étape 3/5')).toBeTruthy()
    cliquer('Oui')
    expect(etape()).toBe('contraintes')
    expect(screen.getByText('Étape 4/5')).toBeTruthy()
    expect(window.history.length).toBe(avant + 3)
  })

  it('autre objectif : 4 étapes, pas de question supplémentaire', () => {
    afficher()
    cliquer(/Mieux récupérer/)
    expect(screen.getByText('Étape 2/4')).toBeTruthy()
    cliquer('0 à 1')
    expect(etape()).toBe('contraintes')
    expect(screen.getByText('Étape 3/4')).toBeTruthy()
  })

  it('« Aucune » décoche les autres contraintes, et inversement', () => {
    afficher('/conseil?objectif=sante')
    cliquer('2 à 3')
    const vegan = screen.getByLabelText('Vegan') as HTMLInputElement
    const aucune = screen.getByLabelText('Aucune') as HTMLInputElement
    fireEvent.click(vegan)
    fireEvent.click(screen.getByLabelText('Sans lactose'))
    fireEvent.click(aucune)
    expect([vegan.checked, aucune.checked]).toEqual([false, true])
    fireEvent.click(vegan)
    expect([vegan.checked, aucune.checked]).toEqual([true, false])
  })

  it('?objectif= à l’arrivée : démarre à l’étape 2, « Retour » ramène à l’étape 1', async () => {
    afficher('/conseil?objectif=sante&utm_source=accueil')
    await screen.findByText('Étape 2/4')
    expect(window.location.search).toBe('?utm_source=accueil&objectif=sante&etape=seances')
    cliquer(/Retour/)
    expect(screen.getByText('Étape 1')).toBeTruthy()
    expect(window.location.search).toBe('?utm_source=accueil')
    expect(screen.getByRole('button', { name: /Santé et bien-être/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('bouton retour du téléphone (popstate) : revient à la question précédente', async () => {
    afficher()
    cliquer(/Énergie et endurance/)
    cliquer('2 à 3')
    expect(etape()).toBe('contraintes')
    window.history.back()
    await waitFor(() => expect(screen.getByText('Étape 2/4')).toBeTruthy())
    expect(etape()).toBe('seances')
    // Le bouton « Retour » de l'écran utilise aussi l'historique.
    cliquer(/Retour/)
    await waitFor(() => expect(screen.getByText('Étape 1')).toBeTruthy())
  })

  it('rechargement au milieu du parcours : réponses retrouvées (sessionStorage)', async () => {
    const vue = afficher()
    cliquer(/Prendre du muscle/)
    cliquer('2 à 3')
    cliquer('Non')
    vue.unmount()
    afficher(`/conseil${window.location.search}`)
    await screen.findByText('Étape 4/5')
    cliquer('Continuer')
    cliquer(/Moins de 40/)
    await screen.findByRole('heading', { level: 1, name: 'Ta sélection' })
  })

  it('URL forgée sur un écran inaccessible : premier écran sans réponse', async () => {
    afficher('/conseil?objectif=affiner&etape=budget')
    await screen.findByText('Étape 2/4')
    expect(etape()).toBe('seances')
  })
})

describe('résultat', () => {
  it('sélection, phrases « pourquoi », total, messages ; aucune contrainte dans l’URL', async () => {
    afficher()
    await parcoursMuscle(['Sans lactose'])
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Clear Whey Isolate - 500 g',
      'Micronized Creatine Monohydrate',
    ])
    expect(screen.getAllByText('En stock à Coignières')).toHaveLength(2)
    expect(screen.getByText(/Une whey isolat claire/)).toBeTruthy()
    expect(screen.getByText(/Intolérance avérée/)).toBeTruthy()
    expect(prix('71,80').length).toBeGreaterThan(0)
    // Mention obligatoire (CE 1924/2006, art. 10.2.a) dès que des allégations s'affichent
    expect(screen.getByText(/ne se substituent pas à une alimentation variée et équilibrée/)).toBeTruthy()
    expect(window.location.search).toBe('?objectif=muscle&etape=resultat')
    expect(window.location.href).not.toMatch(/lactose|vegan|cafeine/)
  })

  it('sélecteur des seuls parfums en stock, le plus stocké par défaut', async () => {
    const stocks: Record<string, number> = { 'Chocolat / 1 kg': 2, 'Vanille / 1 kg': 6 }
    afficher('/conseil', construireCatalogue({ stock: (h, t) => (h === HANDLES.whey ? stocks[t] ?? 0 : 5) }))
    await parcoursMuscle()
    const select = screen.getByLabelText('Parfum') as HTMLSelectElement
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(['Vanille', 'Chocolat'])
    expect(select.value).toBe('gid://shopify/ProductVariant/54095546515798')
  })

  it('shaker en option, hors total par défaut', async () => {
    afficher()
    await parcoursMuscle()
    expect(prix('81,80').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByLabelText(/En option : Shaker/))
    expect(prix('88,70').length).toBeGreaterThan(0)
  })

  it('« Je réserve » : stock revérifié, lignes ajoutées en une fois, attributs du retrait comme le tiroir', async () => {
    afficher()
    await parcoursMuscle(['Sans lactose', 'Vegan'], 'Plus de 90')
    cliquer('Je réserve, retrait immédiat en boutique')
    await waitFor(() => expect(addItems).toHaveBeenCalledTimes(1))

    const inventaire = fetchMock.mock.calls.find(([u]) => String(u).startsWith('/api/inventory'))![0] as string
    expect(new URL(inventaire, 'http://x').searchParams.get('locationId')).toBe(LOCATION)

    const [lignes, options] = addItems.mock.calls[0] as unknown as [
      { merchandiseId: string; quantity: number }[],
      { attributes: { key: string; value: string }[]; clearRelay: boolean },
    ]
    expect(lignes.every((l) => l.quantity === 1)).toBe(true)
    expect(options.clearRelay).toBe(true)
    expect(options.attributes).toEqual([
      { key: '__click_and_collect', value: 'true' },
      { key: 'pickup_location_id', value: LOCATION },
      { key: 'source', value: 'guide-conseil' },
      { key: 'objectif', value: 'muscle' },
      { key: 'budget', value: 'plus-90' },
    ])
    expect(JSON.stringify(addItems.mock.calls)).not.toMatch(/lactose|vegan|cafeine/i)
    expect(JSON.stringify(fetchMock.mock.calls)).not.toMatch(/lactose|vegan|cafeine/i)
  })

  it('produit parti entre-temps : rien n’est ajouté, la sélection est mise à jour', async () => {
    afficher('/conseil', construireCatalogue({ stock: rupture([HANDLES.musclewhey]) }))
    await parcoursMuscle()
    const creatine = 'gid://shopify/ProductVariant/53981935206742'
    stockRevérifié = (id) => (id === creatine ? 0 : 3)
    cliquer('Je réserve, retrait immédiat en boutique')
    await screen.findByRole('alert')
    expect(addItems).not.toHaveBeenCalled()
    expect(screen.getByText('Plus en stock à Coignières')).toBeTruthy()
    // Total = la whey seule.
    expect(prix('44,90').length).toBeGreaterThan(1)
  })

  it('revérification impossible : on réserve quand même avec le stock du chargement', async () => {
    afficher()
    await parcoursMuscle()
    fetchMock.mockRejectedValueOnce(new Error('réseau'))
    cliquer('Je réserve, retrait immédiat en boutique')
    await waitFor(() => expect(addItems).toHaveBeenCalledTimes(1))
  })

  it('« Ajouter au panier » : livraison, attributs du guide sans retrait', async () => {
    afficher()
    await parcoursMuscle()
    cliquer('Ajouter au panier')
    await waitFor(() => expect(addItems).toHaveBeenCalledTimes(1))
    const options = (addItems.mock.calls[0] as unknown as [unknown, { attributes: unknown; clearRelay?: boolean }])[1]
    expect(options.clearRelay).toBeUndefined()
    expect(options.attributes).toEqual([
      { key: '__click_and_collect', value: 'false' },
      { key: 'pickup_location_id', value: '' },
      { key: 'source', value: 'guide-conseil' },
      { key: 'objectif', value: 'muscle' },
      { key: 'budget', value: '40-90' },
    ])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('« Être rappelé » : objectif et sélection dans le message, jamais les contraintes', async () => {
    afficher()
    await parcoursMuscle(['Sans lactose', 'Sans caféine'])
    expect(screen.getByRole('link', { name: 'Confidentialité', hidden: true }).getAttribute('href')).toBe('/confidentialite')
    fireEvent.change(screen.getByLabelText('Ton prénom'), { target: { value: 'Léa' } })
    fireEvent.change(screen.getByLabelText('Ton téléphone'), { target: { value: '06 12 34 56 78' } })
    fireEvent.change(screen.getByLabelText(/Ton e-mail/), { target: { value: 'lea@exemple.fr' } })
    fireEvent.click(screen.getByRole('button', { name: 'Être rappelé', hidden: true }))
    await screen.findByText(/C.est noté/)
    const [url, init] = fetchMock.mock.calls.find(([u]) => u === '/api/contact')!
    expect(url).toBe('/api/contact')
    const body = JSON.parse((init as RequestInit).body as string)
    expect(body).toMatchObject({ name: 'Léa', email: 'lea@exemple.fr', phone: '06 12 34 56 78', objectif: 'Prendre du muscle' })
    expect(body.message).toContain('Clear Whey Isolate - 500 g')
    expect(body.message).toMatch(/Budget par mois : 40 à 90/)
    expect(JSON.stringify(body)).not.toMatch(/lactose|vegan|caf[ée]ine/i)
  })

  it('« Être rappelé » sans e-mail : prénom et téléphone suffisent', async () => {
    afficher()
    await parcoursMuscle()
    expect((screen.getByLabelText(/Ton e-mail/) as HTMLInputElement).required).toBe(false)
    fireEvent.change(screen.getByLabelText('Ton prénom'), { target: { value: 'Léa' } })
    fireEvent.change(screen.getByLabelText('Ton téléphone'), { target: { value: '06 12 34 56 78' } })
    fireEvent.click(screen.getByRole('button', { name: 'Être rappelé', hidden: true }))
    await screen.findByText(/C.est noté/)
    const [, init] = fetchMock.mock.calls.find(([u]) => u === '/api/contact')!
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({ name: 'Léa', email: '', phone: '06 12 34 56 78' })
  })

  it('« Je ne sais pas encore » : résultat boutique direct, texte du guide, suggestions, pas de panier', async () => {
    afficher()
    cliquer(/Je ne sais pas encore/)
    await screen.findByRole('heading', { level: 1, name: 'On en parle en boutique' })
    expect(etape()).toBe('resultat')
    expect(screen.getByText(/en 5 minutes, on fait le point ensemble/)).toBeTruthy()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(screen.getByText(/ne se substituent pas à une alimentation variée et équilibrée/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Je réserve/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Itinéraire/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Appeler/ }).getAttribute('href')).toBe('tel:+33761847580')
    // « Notre boutique » une seule fois (plus de titre en double au-dessus de la carte)
    expect(screen.getAllByText('Notre boutique')).toHaveLength(1)
  })

  it('« Je préfère en parler en boutique » : vrai bouton, amène le focus sur la carte boutique', async () => {
    afficher()
    await parcoursMuscle()
    fireEvent.click(screen.getByRole('button', { name: 'Je préfère en parler en boutique' }))
    const carte = screen.getByRole('region', { name: 'Notre boutique' })
    expect(document.activeElement).toBe(carte)
    expect(within(carte).getByRole('link', { name: /Itinéraire/ })).toBeTruthy()
    expect(within(carte).getByRole('link', { name: /Appeler/ })).toBeTruthy()
  })

  it('rien en stock pour les réponses : résultat boutique', async () => {
    afficher('/conseil', construireCatalogue({ stock: () => 0 }))
    repondreMuscle()
    await screen.findByRole('heading', { level: 1, name: 'On en parle en boutique' })
    expect(screen.getByText(/ne sont pas en stock à Coignières/)).toBeTruthy()
  })
})
