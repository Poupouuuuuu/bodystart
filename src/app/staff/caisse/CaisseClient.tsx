'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Delete, LogOut, Loader2, X, Tag } from 'lucide-react'
import { getLoyaltyBrowserClient } from '@/lib/loyalty/supabase-browser'
import { maxRedeemableCents, REDEEM_MIN_BALANCE_CENTS } from '@/lib/loyalty/calculate'

interface StaffProp {
  id: string
  email: string
  fullName: string | null
  role: 'cashier' | 'admin'
}

interface CustomerLookupResult {
  id: string
  firstName: string
  lastName: string | null
  phoneE164: string
  loyaltyBalanceCents: number
  referralCode: string
  hasFirstPurchase: boolean
}

type Step = 'phone' | 'customer' | 'create' | 'sale' | 'success' | 'error'

const formatEuros = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export function CaisseClient({ staff }: { staff: StaffProp }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phoneInput, setPhoneInput] = useState('')
  const [customer, setCustomer] = useState<CustomerLookupResult | null>(null)
  const [amountCentsInput, setAmountCentsInput] = useState(0)
  const [useCagnotte, setUseCagnotte] = useState(false)
  const [redeemRequestedCents, setRedeemRequestedCents] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ paid: number; commission: number; referrerCredited: boolean } | null>(null)

  // Create customer form
  const [createFirstName, setCreateFirstName] = useState('')
  const [createReferralCode, setCreateReferralCode] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createEmailOptIn, setCreateEmailOptIn] = useState(false)

  // ─── Numpad helpers ───
  const onDigit = useCallback(
    (digit: string) => {
      if (step === 'phone' && phoneInput.length < 15) {
        setPhoneInput((p) => p + digit)
      } else if (step === 'sale') {
        // Saisie montant en centimes : chaque digit shift left ×10
        setAmountCentsInput((c) => Math.min(c * 10 + Number(digit), 9999999))
      }
    },
    [step, phoneInput.length]
  )

  const onBackspace = useCallback(() => {
    if (step === 'phone') {
      setPhoneInput((p) => p.slice(0, -1))
    } else if (step === 'sale') {
      setAmountCentsInput((c) => Math.floor(c / 10))
    }
  }, [step])

  const resetAll = useCallback(() => {
    setStep('phone')
    setPhoneInput('')
    setCustomer(null)
    setAmountCentsInput(0)
    setUseCagnotte(false)
    setRedeemRequestedCents(0)
    setErrorMsg(null)
    setSuccessData(null)
    setCreateFirstName('')
    setCreateReferralCode('')
    setCreateEmail('')
    setCreateEmailOptIn(false)
  }, [])

  async function handleLookup() {
    setErrorMsg(null)
    setLoading(true)
    try {
      const res = await fetch('/api/loyalty/staff/customer-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      })
      const json = await res.json()
      if (res.status === 401) {
        router.push('/staff/login?reason=not_staff')
        return
      }
      if (!res.ok) {
        if (res.status === 404) {
          // Customer pas trouvé → propose création
          setStep('create')
        } else {
          setErrorMsg(json.error ?? 'Erreur lookup')
        }
        return
      }
      setCustomer(json.customer)
      setStep('customer')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setErrorMsg(null)
    if (!createFirstName.trim()) {
      setErrorMsg('Prénom requis')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/loyalty/customers/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneInput,
          firstName: createFirstName.trim(),
          email: createEmail.trim() || null,
          referredByCode: createReferralCode.trim() || null,
          emailOptIn: createEmailOptIn,
          source: 'in_store',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? json.detail ?? 'Erreur création')
        return
      }
      setCustomer({
        id: json.customer.id,
        firstName: json.customer.firstName,
        lastName: null,
        phoneE164: json.customer.phone,
        loyaltyBalanceCents: json.customer.loyaltyBalanceCents,
        referralCode: json.customer.referralCode,
        hasFirstPurchase: false,
      })
      setStep('customer')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  function toggleUseCagnotte() {
    if (!customer) return
    const newValue = !useCagnotte
    setUseCagnotte(newValue)
    if (newValue) {
      const max = maxRedeemableCents(amountCentsInput, customer.loyaltyBalanceCents)
      setRedeemRequestedCents(max)
    } else {
      setRedeemRequestedCents(0)
    }
  }

  // Recalcule auto si le montant change pendant que le toggle est ON
  function setAmountAndRecalc(cents: number) {
    setAmountCentsInput(cents)
    if (useCagnotte && customer) {
      const max = maxRedeemableCents(cents, customer.loyaltyBalanceCents)
      setRedeemRequestedCents(max)
    }
  }

  async function handleValidate() {
    if (!customer) return
    setErrorMsg(null)
    setLoading(true)
    try {
      // Le total facture client = amountCentsInput (le vendeur saisit le total ENCAISSE,
      // la cagnotte reduit ce qu'on lui demande)
      // En centimes :
      //   paidItemsCents = amountCentsInput - redeemRequestedCents
      // Mais finalize_order_loyalty attend paidItemsCents = "ce que le client a paye",
      // qui sert de base au calcul commission parrain.
      // En boutique on n'a pas de produits vs livraison → le total saisi est tout produits.
      const spentCents = useCagnotte ? redeemRequestedCents : 0
      const paidItemsCents = amountCentsInput - spentCents

      if (paidItemsCents < 0) {
        setErrorMsg('Montant invalide (cagnotte > montant vente)')
        return
      }

      const orderRef = `caisse-${Date.now()}-${customer.id.slice(0, 8)}`
      const res = await fetch('/api/loyalty/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          orderRef,
          paidItemsCents,
          spentLoyaltyCents: spentCents,
        }),
      })
      const json = await res.json()
      if (res.status === 401) {
        router.push('/staff/login?reason=not_staff')
        return
      }
      if (!res.ok) {
        setErrorMsg(json.error ?? json.detail ?? 'Erreur finalize')
        return
      }
      const result = json.result ?? {}
      setSuccessData({
        paid: paidItemsCents,
        commission: result.commissionToReferrerCents ?? 0,
        referrerCredited: (result.commissionToReferrerCents ?? 0) > 0,
      })
      setStep('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    const supabase = getLoyaltyBrowserClient()
    await supabase.auth.signOut()
    router.push('/staff/login')
    router.refresh()
  }

  // ─── UI ───
  const maxRedeem = customer ? maxRedeemableCents(amountCentsInput, customer.loyaltyBalanceCents) : 0
  const cagnotteEligible =
    customer !== null &&
    customer.loyaltyBalanceCents >= REDEEM_MIN_BALANCE_CENTS &&
    amountCentsInput > 0
  const finalPaidCents = useCagnotte ? amountCentsInput - redeemRequestedCents : amountCentsInput

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Top bar ─── */}
      <header className="bg-[#1a2e23] border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white text-[#1a2e23] font-display font-black text-sm flex items-center justify-center">
            BS
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Caisse</p>
            <p className="text-sm font-bold text-white">BodyStart Coignières</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/50">Connecté</p>
            <p className="text-sm font-bold text-white">{staff.fullName ?? staff.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1 p-6 md:p-10 flex flex-col">
        {/* ETAPE PHONE */}
        {step === 'phone' && (
          <PhoneStep
            phoneInput={phoneInput}
            onDigit={onDigit}
            onBackspace={onBackspace}
            onLookup={handleLookup}
            loading={loading}
            errorMsg={errorMsg}
          />
        )}

        {/* ETAPE CREATE */}
        {step === 'create' && (
          <CreateStep
            phone={phoneInput}
            firstName={createFirstName}
            setFirstName={setCreateFirstName}
            referralCode={createReferralCode}
            setReferralCode={setCreateReferralCode}
            email={createEmail}
            setEmail={setCreateEmail}
            emailOptIn={createEmailOptIn}
            setEmailOptIn={setCreateEmailOptIn}
            onCreate={handleCreate}
            onBack={resetAll}
            loading={loading}
            errorMsg={errorMsg}
          />
        )}

        {/* ETAPES CUSTOMER + SALE (sur la même vue) */}
        {(step === 'customer' || step === 'sale') && customer && (
          <SaleStep
            customer={customer}
            amountCents={amountCentsInput}
            setAmountCents={setAmountAndRecalc}
            useCagnotte={useCagnotte}
            toggleUseCagnotte={toggleUseCagnotte}
            redeemRequestedCents={redeemRequestedCents}
            maxRedeemCents={maxRedeem}
            cagnotteEligible={cagnotteEligible}
            finalPaidCents={finalPaidCents}
            onDigit={onDigit}
            onBackspace={onBackspace}
            onValidate={handleValidate}
            onBack={resetAll}
            loading={loading}
            errorMsg={errorMsg}
            currentStep={step}
            setStep={setStep}
          />
        )}

        {/* ETAPE SUCCESS */}
        {step === 'success' && successData && customer && (
          <SuccessStep data={successData} customer={customer} onNewSale={resetAll} />
        )}
      </main>
    </div>
  )
}

// ============================================================
// ─── PhoneStep : saisie numéro + lookup ───
// ============================================================
function PhoneStep({
  phoneInput,
  onDigit,
  onBackspace,
  onLookup,
  loading,
  errorMsg,
}: {
  phoneInput: string
  onDigit: (d: string) => void
  onBackspace: () => void
  onLookup: () => void
  loading: boolean
  errorMsg: string | null
}) {
  return (
    <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Étape 1 sur 3</p>
        <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2">
          Numéro du client
        </h1>
        <p className="text-sm text-white/60">
          Demande son numéro de téléphone (sa carte fidélité)
        </p>
      </div>

      {/* Display */}
      <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 mb-6 text-center">
        <p className="text-4xl md:text-5xl font-mono text-white tracking-widest min-h-[60px]">
          {phoneInput || <span className="text-white/30">06 __ __ __ __</span>}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-100 text-sm text-center">
          {errorMsg}
        </div>
      )}

      <Numpad onDigit={onDigit} onBackspace={onBackspace} />

      <button
        onClick={onLookup}
        disabled={loading || phoneInput.length < 8}
        className="mt-6 w-full py-5 bg-emerald-600 text-white text-lg font-bold rounded-2xl hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Recherche…
          </>
        ) : (
          'Continuer'
        )}
      </button>
    </div>
  )
}

// ============================================================
// ─── CreateStep : créer compte rapide ───
// ============================================================
function CreateStep({
  phone,
  firstName,
  setFirstName,
  referralCode,
  setReferralCode,
  email,
  setEmail,
  emailOptIn,
  setEmailOptIn,
  onCreate,
  onBack,
  loading,
  errorMsg,
}: {
  phone: string
  firstName: string
  setFirstName: (v: string) => void
  referralCode: string
  setReferralCode: (v: string) => void
  email: string
  setEmail: (v: string) => void
  emailOptIn: boolean
  setEmailOptIn: (v: boolean) => void
  onCreate: () => void
  onBack: () => void
  loading: boolean
  errorMsg: string | null
}) {
  return (
    <div className="max-w-xl mx-auto w-full">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Recommencer
      </button>

      <div className="text-center mb-6">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white mb-2">
          Nouveau client
        </h1>
        <p className="text-sm text-white/60">Numéro : {phone}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
            Prénom <span className="text-rose-400">*</span>
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-4 text-lg bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white"
            placeholder="Marie"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
            Code parrain (optionnel)
          </label>
          <input
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-4 text-lg bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white font-mono"
            placeholder="BS-XXXXX"
            maxLength={8}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
            Email (optionnel)
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full px-4 py-4 text-lg bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white"
            placeholder="marie@example.com"
          />
        </div>

        {email && (
          <label className="flex items-center gap-3 text-sm text-white/80 cursor-pointer">
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
              className="w-5 h-5"
            />
            J&apos;accepte de recevoir les emails BodyStart
          </label>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-100 text-sm">
            {errorMsg}
          </div>
        )}

        <button
          onClick={onCreate}
          disabled={loading || !firstName.trim()}
          className="w-full py-5 bg-emerald-600 text-white text-lg font-bold rounded-2xl hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Création…
            </>
          ) : (
            'Créer et continuer'
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// ─── SaleStep : montant + cagnotte + valider ───
// ============================================================
function SaleStep({
  customer,
  amountCents,
  setAmountCents,
  useCagnotte,
  toggleUseCagnotte,
  redeemRequestedCents,
  maxRedeemCents,
  cagnotteEligible,
  finalPaidCents,
  onDigit,
  onBackspace,
  onValidate,
  onBack,
  loading,
  errorMsg,
  currentStep,
  setStep,
}: {
  customer: CustomerLookupResult
  amountCents: number
  setAmountCents: (cents: number) => void
  useCagnotte: boolean
  toggleUseCagnotte: () => void
  redeemRequestedCents: number
  maxRedeemCents: number
  cagnotteEligible: boolean
  finalPaidCents: number
  onDigit: (d: string) => void
  onBackspace: () => void
  onValidate: () => void
  onBack: () => void
  loading: boolean
  errorMsg: string | null
  currentStep: Step
  setStep: (s: Step) => void
}) {
  // Force passage en mode 'sale' pour activer le numpad sur amount
  if (currentStep === 'customer') {
    setStep('sale')
  }

  return (
    <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Colonne gauche : customer + montant */}
      <div>
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Recommencer
        </button>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Client</p>
          <p className="text-2xl font-bold text-white mb-1">{customer.firstName}</p>
          <p className="text-xs text-white/50 mb-3">{customer.phoneE164}</p>
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Cagnotte</p>
            <p className="text-3xl font-black text-emerald-400">{formatEuros(customer.loyaltyBalanceCents)}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Montant vente</p>
          <p className="text-5xl font-mono font-bold text-white text-right tabular-nums">
            {formatEuros(amountCents)}
          </p>
        </div>

        {cagnotteEligible && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
            <button
              onClick={toggleUseCagnotte}
              className="w-full flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded border-2 ${useCagnotte ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}
                >
                  {useCagnotte && <Check className="w-5 h-5 text-white" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Utiliser la cagnotte</p>
                  <p className="text-xs text-white/60">
                    Max : {formatEuros(maxRedeemCents)} (cap 50%)
                  </p>
                </div>
              </div>
              <Tag className="w-5 h-5 text-emerald-400" />
            </button>
            {useCagnotte && (
              <div className="mt-4 pt-4 border-t border-emerald-500/20">
                <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Cagnotte utilisée</p>
                <p className="text-2xl font-bold text-emerald-400">−{formatEuros(redeemRequestedCents)}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-white/50">Total à encaisser</p>
            <p className="text-4xl font-black text-white tabular-nums">{formatEuros(finalPaidCents)}</p>
          </div>
        </div>
      </div>

      {/* Colonne droite : numpad + valider */}
      <div className="flex flex-col">
        <Numpad onDigit={onDigit} onBackspace={onBackspace} />

        {errorMsg && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-100 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <button
          onClick={onValidate}
          disabled={loading || amountCents === 0 || finalPaidCents < 0}
          className="mt-6 w-full py-6 bg-emerald-600 text-white text-xl font-bold rounded-2xl hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Validation…
            </>
          ) : (
            <>
              <Check className="w-6 h-6" /> Valider la vente
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// ─── SuccessStep ───
// ============================================================
function SuccessStep({
  data,
  customer,
  onNewSale,
}: {
  data: { paid: number; commission: number; referrerCredited: boolean }
  customer: CustomerLookupResult
  onNewSale: () => void
}) {
  return (
    <div className="max-w-xl mx-auto w-full text-center">
      <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto mb-6 flex items-center justify-center">
        <Check className="w-12 h-12 text-emerald-400" />
      </div>
      <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white mb-2">
        Vente validée
      </h1>
      <p className="text-lg text-white/70 mb-8">
        {customer.firstName} · {formatEuros(data.paid)} encaissés
      </p>

      {data.referrerCredited && (
        <div className="mb-8 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left">
          <p className="text-xs uppercase tracking-widest text-emerald-400 mb-1">Bonus parrainage</p>
          <p className="text-sm text-white">
            Le parrain de {customer.firstName} a été crédité de{' '}
            <strong className="text-emerald-400">{formatEuros(data.commission)}</strong> sur sa cagnotte.
          </p>
        </div>
      )}

      <button
        onClick={onNewSale}
        className="w-full py-5 bg-white text-[#1a2e23] text-lg font-bold rounded-2xl hover:bg-white/90 transition-colors"
      >
        Nouvelle vente
      </button>
    </div>
  )
}

// ============================================================
// ─── Numpad partagé ───
// ============================================================
function Numpad({
  onDigit,
  onBackspace,
}: {
  onDigit: (d: string) => void
  onBackspace: () => void
}) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  return (
    <div className="grid grid-cols-3 gap-3">
      {digits.map((d) => (
        <button
          key={d}
          onClick={() => onDigit(d)}
          className="aspect-square bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-2xl text-3xl font-bold text-white transition-colors"
        >
          {d}
        </button>
      ))}
      <div /> {/* spacer */}
      <button
        onClick={() => onDigit('0')}
        className="aspect-square bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-2xl text-3xl font-bold text-white transition-colors"
      >
        0
      </button>
      <button
        onClick={onBackspace}
        className="aspect-square bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 rounded-2xl text-white transition-colors inline-flex items-center justify-center"
        aria-label="Effacer"
      >
        <Delete className="w-7 h-7" />
      </button>
    </div>
  )
}
