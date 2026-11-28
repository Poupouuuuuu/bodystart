#!/usr/bin/env node
/**
 * scripts/images-tailles.mjs
 *
 * Photos locales (public/) en tailles fixes, sans l'optimiseur Vercel.
 *
 * Depuis le 25/11/2026 (quota Vercel épuisé, /_next/image en 402), les images
 * locales étaient servies telles quelles : un téléphone téléchargeait la photo
 * entière (interieur.webp, 153 Ko, LCP de l'accueil à 5,3 s le 27/11).
 *
 * Ce script :
 *   1. repère les photos de public/ réellement référencées dans src/
 *      (WebP et JPEG ; les PNG sont des logos ou des pictos, laissés tels quels) ;
 *   2. écrit pour chacune des variantes WebP à largeurs fixes, sans dépasser
 *      l'original, dans public/tailles/ (même chemin, suffixe -<largeur>) :
 *      /boutique/rayon-isozero.webp -> /tailles/boutique/rayon-isozero-640.webp ;
 *   3. écrit le manifeste src/lib/images-locales.ts (largeurs par fichier), lu
 *      par le loader de components/ui/Image (lib/images, varianteLocale).
 *
 * public/tailles/ est entièrement régénéré à chaque passage (rien d'obsolète ne
 * reste). À relancer après l'ajout ou le remplacement d'une photo :
 *   node scripts/images-tailles.mjs
 * Une photo absente du manifeste reste servie telle quelle (aucune casse).
 */
import sharp from 'sharp'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(RACINE, 'public')
const SRC = join(RACINE, 'src')
const SORTIE = join(PUBLIC, 'tailles')
const MANIFESTE = join(SRC, 'lib', 'images-locales.ts')

/** Largeurs produites (px), plafonnées à la largeur de l'original. */
const LARGEURS = [384, 640, 828, 1080, 1440, 1920]
/** Qualité WebP : celle de l'optimiseur Next (75), mêmes poids qu'avant l'incident. */
const QUALITE = 75

/** Photos référencées mais volontairement laissées telles quelles. */
const EXCLUSIONS = [
  // Fond végétal : même URL pour le CSS des cartes et la galerie (un seul
  // téléchargement), déjà à 800 px et 20 Ko.
  /^\/bg-vegetal/,
  // Pages en standby (redirection 301 vers /products, middleware).
  /^\/assets\/images\//,
  // Logos : fichiers inchangés (image Open Graph, JSON-LD, en-tête).
  /^\/assets\/logos\//,
  // Les variantes elles-mêmes.
  /^\/tailles\//,
]

const EXT_PHOTO = new Set(['.webp', '.jpg', '.jpeg'])
const EXT_SOURCE = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css'])

function fichiers(dossier) {
  const out = []
  for (const nom of readdirSync(dossier)) {
    const p = join(dossier, nom)
    if (statSync(p).isDirectory()) out.push(...fichiers(p))
    else out.push(p)
  }
  return out
}

/** Chemins publics (/x/y.webp) cités dans src/, hors tests. */
function photosReferencees() {
  const trouvees = new Set()
  const motif = /["'`(]((?:\/[\w.%-]+)+\.(?:webp|jpe?g))\b/gi
  for (const f of fichiers(SRC)) {
    if (!EXT_SOURCE.has(extname(f)) || /\.test\.[jt]sx?$/.test(f)) continue
    if (f === MANIFESTE) continue
    for (const m of readFileSync(f, 'utf8').matchAll(motif)) trouvees.add(m[1])
  }
  return [...trouvees]
    .filter((p) => EXT_PHOTO.has(extname(p).toLowerCase()))
    .filter((p) => !EXCLUSIONS.some((re) => re.test(p)))
    .filter((p) => existsSync(join(PUBLIC, p)))
    .sort()
}

function cheminVariante(src, largeur) {
  return `/tailles${src.slice(0, -extname(src).length)}-${largeur}.webp`
}

async function main() {
  const photos = photosReferencees()
  rmSync(SORTIE, { recursive: true, force: true })

  const manifeste = {}
  let totalVariantes = 0
  let totalOriginaux = 0
  for (const src of photos) {
    const original = join(PUBLIC, src)
    const { width } = await sharp(original).metadata()
    let largeurs = LARGEURS.filter((l) => l <= width)
    // Original plus étroit que la plus petite largeur : une seule variante, à sa taille.
    if (largeurs.length === 0) largeurs = [width]
    const poids = []
    for (const l of largeurs) {
      const cible = join(PUBLIC, cheminVariante(src, l))
      mkdirSync(dirname(cible), { recursive: true })
      const info = await sharp(original)
        .rotate()
        .resize({ width: l, withoutEnlargement: true })
        .webp({ quality: QUALITE, effort: 6 })
        .toFile(cible)
      totalVariantes += info.size
      poids.push(`${l}:${(info.size / 1024).toFixed(0)}`)
    }
    totalOriginaux += statSync(original).size
    manifeste[src] = largeurs
    console.log(`${src} (${width} px, ${(statSync(original).size / 1024).toFixed(0)} Ko) -> ${poids.join(' ')} Ko`)
  }

  const lignes = Object.entries(manifeste).map(([src, l]) => `  '${src}': [${l.join(', ')}],`)
  writeFileSync(
    MANIFESTE,
    `// Généré par scripts/images-tailles.mjs : ne pas modifier à la main.
// Photos locales disponibles en variantes WebP à largeurs fixes
// (public/tailles/, suffixe -<largeur>.webp). Lu par lib/images (varianteLocale).
// Pour ajouter ou remplacer une photo : node scripts/images-tailles.mjs

export const IMAGES_LOCALES: Readonly<Record<string, readonly number[]>> = {
${lignes.join('\n')}
}
`
  )

  console.log(
    `\n${photos.length} photos, ${Object.values(manifeste).flat().length} variantes : ` +
      `${(totalVariantes / 1024).toFixed(0)} Ko ajoutés (originaux : ${(totalOriginaux / 1024).toFixed(0)} Ko).`
  )
  console.log(`Manifeste : ${relative(RACINE, MANIFESTE).split(sep).join('/')}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
