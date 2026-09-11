-- ============================================================
-- 00018_stock_alerts.sql
-- BodyStart — Alerte « me prévenir quand c'est de retour » (2026-09-12).
--
-- Un visiteur laisse son email sur une variante épuisée (fiche produit).
-- Le webhook Shopify inventory_levels/update (POST /api/stock-alert/webhook)
-- réveille les alertes en attente sur l'inventory_item concerné dès que
-- `available` repasse > 0, envoie UN email (Resend) et marque notified_at.
--
-- Accès : service role uniquement (RLS activée sans policy) — jamais depuis
-- le navigateur.
-- ============================================================

create table if not exists public.stock_alerts (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  -- gid://shopify/ProductVariant/… (Storefront + Admin partagent l'id)
  variant_id        text not null,
  -- id numérique de l'InventoryItem (clé du payload webhook), résolu côté
  -- serveur à l'inscription via l'Admin API.
  inventory_item_id text,
  product_handle    text not null,
  product_title     text not null,
  variant_title     text,
  created_at        timestamptz not null default now(),
  notified_at       timestamptz,
  constraint stock_alerts_email_variant_key unique (email, variant_id)
);

-- Lookup du webhook : uniquement les alertes encore en attente.
create index if not exists stock_alerts_pending_idx
  on public.stock_alerts (inventory_item_id)
  where notified_at is null;

alter table public.stock_alerts enable row level security;

comment on table public.stock_alerts is
  'Alertes retour en stock (fiche produit). Réveillées par le webhook Shopify inventory_levels/update.';
