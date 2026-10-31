// ============================================================
// Zone desservie par la boutique de Coignières (31/10/2026)
// ============================================================
// Source unique pour /complements-alimentaires-yvelines (un bloc par ville),
// le JSON-LD Store (areaServed) et llms.txt.
//
// - Trajets : itinéraire routier OSRM (données OpenStreetMap), de la mairie de
//   chaque commune à la boutique, relevé le 31/10/2026. Temps sans trafic :
//   toujours affiché « hors heures de pointe ».
// - Livraison locale : modes de livraison proposés par Shopify pour l'adresse
//   de la mairie (panier de test, sans commande), le 31/10/2026. Shopify
//   l'applique dans un rayon d'environ 10 km à vol d'oiseau : à Plaisir et à
//   Montigny-le-Bretonneux, seule une partie de la commune est dans la zone
//   (gare de Saint-Quentin et gare de Plaisir-Grignon hors zone). Si la zone
//   change dans Shopify, refaire le relevé avant de modifier ce fichier.
// - Coignières fait partie de la communauté d'agglomération de
//   Saint-Quentin-en-Yvelines (INSEE, intercommunalité 200058782).

import { STORE } from '@/lib/store-info'

export type LivraisonLocale = 'oui' | 'partielle' | 'non'

export interface VilleDesservie {
  nom: string
  codePostal: string
  /** Distance et temps de trajet en voiture depuis la mairie (OSRM, sans trafic). */
  km: number
  minutes: number
  /** Axes routiers principaux du trajet, dans l'ordre du parcours, avec l'article (« la N10 »). */
  axes: string[]
  livraisonLocale: LivraisonLocale
  /** Texte propre à la ville : accès réel, sans formule recopiée d'un bloc à l'autre. */
  acces: string
}

/** Communes du secteur, de la plus proche à la plus éloignée en temps de trajet. */
export const VILLES_DESSERVIES: VilleDesservie[] = [
  {
    nom: 'Les Essarts-le-Roi',
    codePostal: '78690',
    km: 3.1,
    minutes: 5,
    axes: ['la D202', 'la N10'],
    livraisonLocale: 'oui',
    acces:
      "La commune voisine, au sud-ouest : la D202 te mène à la N10, et la boutique arrive juste après, rue du Pont des Landes. C'est le trajet le plus court de toute la liste.",
  },
  {
    nom: 'Maurepas',
    codePostal: '78310',
    km: 4.4,
    minutes: 7,
    axes: ['la N10'],
    livraisonLocale: 'oui',
    acces:
      "La N10 relie directement les deux communes : depuis la place d'Auxois, tu la prends direction Rambouillet et tu la quittes à Coignières, environ 3 km plus loin.",
  },
  {
    nom: 'Élancourt',
    codePostal: '78990',
    km: 5.4,
    minutes: 8,
    axes: ['le boulevard du 19 Mars 1962', 'la N10'],
    livraisonLocale: 'oui',
    acces:
      'Depuis la place du Général de Gaulle, le boulevard du 19 Mars 1962 descend vers la N10, puis il reste un peu plus de 3 km de nationale.',
  },
  {
    nom: 'La Verrière',
    codePostal: '78320',
    km: 6.6,
    minutes: 10,
    axes: ["l'avenue de la Gare", 'la N10'],
    livraisonLocale: 'oui',
    acces:
      "Depuis l'avenue des Noës, l'avenue de la Gare te ramène sur la N10 vers le sud-ouest : quelques kilomètres de nationale et tu es devant la boutique.",
  },
  {
    nom: 'Le Mesnil-Saint-Denis',
    codePostal: '78320',
    km: 5.1,
    minutes: 10,
    axes: ['la route de Coignières', 'la N10'],
    livraisonLocale: 'oui',
    acces:
      "Pas besoin de faire le tour par la nationale : la route de Coignières descend vers la boutique, et la N10 ne sert que sur le dernier kilomètre et demi.",
  },
  {
    nom: 'Trappes',
    codePostal: '78190',
    km: 9.2,
    minutes: 12,
    axes: ['la N10'],
    livraisonLocale: 'oui',
    acces:
      'La N10 fait presque tout le trajet (7 km sur 9) : depuis la place de la République, tu la prends direction Rambouillet et tu sors à Coignières.',
  },
  {
    nom: 'Rambouillet',
    codePostal: '78120',
    km: 13.4,
    minutes: 15,
    axes: ['la N10'],
    livraisonLocale: 'non',
    acces:
      "Un trajet en ligne droite : près de 10 km de N10 vers le nord, direction Versailles. La boutique est d'ailleurs sur ta route si tu remontes vers Saint-Quentin-en-Yvelines.",
  },
  {
    nom: 'Montigny-le-Bretonneux',
    codePostal: '78180',
    km: 12,
    minutes: 16,
    axes: ['la D38', 'la route de Trappes', 'la N10'],
    livraisonLocale: 'partielle',
    acces:
      "Même agglomération que toi : Coignières fait partie de Saint-Quentin-en-Yvelines. Depuis la rue de la Mare aux Carats, la D38 et la route de Trappes rejoignent la N10, qui fait l'essentiel du trajet.",
  },
  {
    nom: 'Guyancourt',
    codePostal: '78280',
    km: 14.5,
    minutes: 19,
    axes: ["l'avenue de l'Europe", "l'avenue du Général Leclerc", 'la N10'],
    livraisonLocale: 'non',
    acces:
      "Tu traverses Saint-Quentin par l'avenue de l'Europe et l'avenue du Général Leclerc, puis la N10 prend le relais sur 8 km et demi.",
  },
  {
    nom: 'Plaisir',
    codePostal: '78370',
    km: 13.6,
    minutes: 20,
    axes: ['la D30', 'la D58', 'la N10'],
    livraisonLocale: 'partielle',
    acces:
      "Ici, la nationale n'arrive qu'à la fin : depuis la rue de la République, tu descends vers le sud par la D30 et la D58, et la N10 ne sert que pour les 3 derniers kilomètres.",
  },
  {
    nom: 'Chevreuse',
    codePostal: '78460',
    km: 12.9,
    minutes: 20,
    axes: ['la D13', 'la N10'],
    livraisonLocale: 'non',
    acces:
      'Depuis la rue de la Division Leclerc, la D13 fait le gros du chemin (près de 7 km), puis un court passage sur la N10 te dépose à la boutique.',
  },
  {
    nom: 'Magny-les-Hameaux',
    codePostal: '78114',
    km: 19.2,
    minutes: 27,
    axes: ['la D195', 'la D91', 'la D13', 'la N10'],
    livraisonLocale: 'non',
    acces:
      "La commune la plus éloignée de la liste : environ 27 minutes par la D195, la D91 puis la D13. Si le déplacement est trop long, le point relais ou la livraison à domicile t'évitent le trajet.",
  },
]

/** « 4,4 km » (espace insécable). */
export function formatKm(km: number): string {
  return `${String(km).replace('.', ',')} km`
}

/** Itinéraire Google Maps depuis la mairie de la ville jusqu'à la fiche Google de la boutique. */
export function itineraireDepuis(ville: Pick<VilleDesservie, 'nom' | 'codePostal'>): string {
  const params = new URLSearchParams({
    api: '1',
    origin: `Mairie ${ville.nom} ${ville.codePostal}`,
    destination: STORE.name,
    destination_place_id: STORE.googlePlaceId,
    travelmode: 'driving',
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** Communes où Shopify propose la livraison locale, sur tout ou partie du territoire. */
export function villesLivraisonLocale(niveau: Exclude<LivraisonLocale, 'non'>): string[] {
  return VILLES_DESSERVIES.filter((v) => v.livraisonLocale === niveau).map((v) => v.nom)
}

/** « A, B et C » */
export function listeFr(noms: string[]): string {
  if (noms.length <= 1) return noms.join('')
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`
}
