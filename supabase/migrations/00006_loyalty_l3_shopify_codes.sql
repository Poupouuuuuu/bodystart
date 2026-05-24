-- ============================================================
-- 00006_loyalty_l3_shopify_codes.sql
-- BodyStart Loyalty — Sprint L3 : colonnes pour les codes Shopify
--
-- Spec V2 §5 (methode A) :
--   - Code parrain : pre-cree a l'inscription, persiste dans Shopify
--     avec endsAt = null (jamais d'expiration), usageLimit = null,
--     appliesOncePerCustomer = true.
--   - Code redemption cagnotte : cree au moment de /api/loyalty/redeem-online,
--     endsAt = now + 1h (Shopify rejette le code apres → anti-fuite).
--
-- On stocke l'ID Shopify du code dans 2 tables pour pouvoir :
--   - Verifier l'existence cote Shopify (audit, debug)
--   - Le supprimer plus tard (cleanup manuel mensuel hors L3)
--
-- Tracabilite des echecs (parrain en best-effort) :
--   - shopify_referral_discount_last_error : NULL si OK ou pas tente,
--     contient le message d'erreur Shopify sinon. Permet de retrouver
--     facilement les customers a reparer.
-- ============================================================

-- ─── loyalty_customers : tracking du code parrain Shopify ───
alter table public.loyalty_customers
  add column if not exists shopify_referral_discount_id text,
  add column if not exists shopify_referral_discount_last_error text,
  add column if not exists shopify_referral_discount_last_attempt_at timestamptz;

create index if not exists idx_loyalty_customers_referral_failed
  on public.loyalty_customers(shopify_referral_discount_last_attempt_at)
  where shopify_referral_discount_id is null
    and shopify_referral_discount_last_error is not null;

comment on column public.loyalty_customers.shopify_referral_discount_id is
  'GID Shopify du DiscountCodeBasic (parrainage). NULL = pas encore cree ou cree en echec (voir last_error).';
comment on column public.loyalty_customers.shopify_referral_discount_last_error is
  'Dernier message d''erreur Shopify rencontre lors de la creation du code parrain. Sert a identifier les customers a reparer manuellement.';
comment on column public.loyalty_customers.shopify_referral_discount_last_attempt_at is
  'Timestamp de la derniere tentative de creation. Permet de prioriser les retries (oldest first).';

-- ─── loyalty_redemptions : tracking du code cagnotte Shopify ───
alter table public.loyalty_redemptions
  add column if not exists shopify_discount_node_id text;

comment on column public.loyalty_redemptions.shopify_discount_node_id is
  'GID Shopify du DiscountCodeBasic (cagnotte). Sert au cleanup eventuel (suppression apres expiration prolongee).';

-- ─── View utilitaire : customers avec code parrain en echec (a reparer) ───
-- (Pas une fonction RPC, juste une view convenience accessible au service_role
-- pour un eventuel dashboard admin)
create or replace view public.loyalty_customers_with_failed_referral_code as
select
  id,
  phone,
  email,
  first_name,
  referral_code,
  shopify_referral_discount_last_error,
  shopify_referral_discount_last_attempt_at,
  created_at
from public.loyalty_customers
where shopify_referral_discount_id is null
  and shopify_referral_discount_last_error is not null
order by shopify_referral_discount_last_attempt_at desc;

comment on view public.loyalty_customers_with_failed_referral_code is
  'Customers dont la creation du code parrain Shopify a echoue. A reparer manuellement (ou via un script de retry futur).';

-- Aucune RLS supplementaire : la view herite des permissions des tables
-- (deny par defaut pour anon/authenticated, service_role bypass).
revoke all on public.loyalty_customers_with_failed_referral_code from anon, authenticated;
