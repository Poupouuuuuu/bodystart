// Connexion et inscription : messages en français (27/11/2026).
//
// Avant : une exception (réseau, limite Shopify) laissait le bouton figé sur
// « Connexion… », et l'inscription affichait le texte brut de Shopify
// (anglais, ou phrase technique). Ici, la traduction des customerUserErrors
// à partir de leur `code` (CustomerErrorCode, Storefront 2026-10), testée
// dans erreurs-compte.test.ts.

export interface ErreurClientShopify {
  code?: string | null
  field?: string[] | null
  message?: string
}

const TELEPHONE = '07 61 84 75 80'

export const MESSAGES_COMPTE = {
  connexionImpossible: 'Connexion impossible pour le moment. Vérifie ta connexion et réessaie.',
  identifiantsIncorrects: 'E-mail ou mot de passe incorrect.',
  inscriptionImpossible: 'Inscription impossible pour le moment. Vérifie ta connexion et réessaie.',
  inscriptionGenerique: "L'inscription n'a pas marché. Vérifie tes informations et réessaie.",
  emailPris: "Un compte existe déjà avec cet e-mail. Connecte-toi, ou réinitialise ton mot de passe si tu l'as oublié.",
  emailInvalide: "Cette adresse e-mail n'est pas valide.",
  emailDomaine: "Cette adresse e-mail n'est pas valide. Vérifie ce qui suit le @.",
  emailVide: 'Entre ton adresse e-mail.',
  motDePasseCourt: 'Le mot de passe doit contenir au moins 5 caractères.',
  motDePasseLong: 'Le mot de passe est trop long.',
  motDePasseEspace: 'Le mot de passe ne doit pas commencer ni finir par une espace.',
  motDePasseVide: 'Choisis un mot de passe.',
  nomVide: 'Le prénom et le nom sont obligatoires.',
  champTropLong: 'Un des champs est trop long.',
  nomLien: 'Le prénom et le nom ne peuvent contenir ni lien ni balise.',
  activationEnvoyee:
    "Tu es déjà client chez nous : on vient de t'envoyer un e-mail pour activer ton compte. Ouvre-le pour choisir ton mot de passe.",
  compteDesactive: `Ce compte n'est pas encore activé. Ouvre l'e-mail d'activation qu'on t'a envoyé, ou appelle-nous au ${TELEPHONE}.`,
} as const

function champ(e: ErreurClientShopify): string {
  const f = e.field ?? []
  return f[f.length - 1] ?? ''
}

/** Une erreur d'inscription traduite (null si le code est inconnu). */
function messageInscription(e: ErreurClientShopify): string | null {
  const c = champ(e)
  const nom = c === 'firstName' || c === 'lastName'
  switch (e.code) {
    case 'TAKEN':
      return MESSAGES_COMPTE.emailPris
    case 'INVALID':
      return c === 'password' ? null : MESSAGES_COMPTE.emailInvalide
    case 'BAD_DOMAIN':
      return MESSAGES_COMPTE.emailDomaine
    case 'TOO_SHORT':
      return c === 'password' ? MESSAGES_COMPTE.motDePasseCourt : null
    case 'TOO_LONG':
      return c === 'password' ? MESSAGES_COMPTE.motDePasseLong : MESSAGES_COMPTE.champTropLong
    case 'PASSWORD_STARTS_OR_ENDS_WITH_WHITESPACE':
      return MESSAGES_COMPTE.motDePasseEspace
    case 'BLANK':
      if (c === 'email') return MESSAGES_COMPTE.emailVide
      if (c === 'password') return MESSAGES_COMPTE.motDePasseVide
      return nom ? MESSAGES_COMPTE.nomVide : null
    case 'CONTAINS_HTML_TAGS':
    case 'CONTAINS_URL':
      return MESSAGES_COMPTE.nomLien
    // Client déjà connu de la boutique (caisse, newsletter) sans compte en
    // ligne : Shopify envoie un e-mail d'activation et renvoie ce code.
    case 'CUSTOMER_DISABLED':
      return MESSAGES_COMPTE.activationEnvoyee
    default:
      return null
  }
}

/**
 * Messages à afficher pour les customerUserErrors d'une inscription : un par
 * erreur, sans doublon, jamais le texte brut de Shopify ; repli générique.
 */
export function messagesErreursInscription(errors: ErreurClientShopify[]): string[] {
  const messages = [...new Set(errors.map((e) => messageInscription(e) ?? MESSAGES_COMPTE.inscriptionGenerique))]
  // Le générique n'apporte rien à côté d'un message précis.
  const precis = messages.filter((m) => m !== MESSAGES_COMPTE.inscriptionGenerique)
  if (precis.length > 0) return precis
  return [MESSAGES_COMPTE.inscriptionGenerique]
}

/** Message d'une connexion refusée par Shopify (customerAccessTokenCreate). */
export function messageErreurConnexion(errors: ErreurClientShopify[]): string {
  if (errors.some((e) => e.code === 'CUSTOMER_DISABLED')) return MESSAGES_COMPTE.compteDesactive
  return MESSAGES_COMPTE.identifiantsIncorrects
}
