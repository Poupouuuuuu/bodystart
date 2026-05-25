-- ============================================================
-- AUDIT MIGRATIONS LOYALTY
-- ============================================================
-- A executer dans Supabase SQL Editor (sur la base prod).
-- Compare l'etat reel de la DB avec ce que les migrations 00004 → 00007
-- du repo sont censees avoir cree.
--
-- Resultat attendu : TOUTES les lignes avec exists=true.
-- Si une seule ligne a exists=false, la migration correspondante est
-- partiellement ou totalement manquante en prod.
--
-- Lance + colle-moi le resultat (export CSV ou copie tableau).
-- ============================================================

with expected (migration, kind, name, qualifier) as (values
  -- ─── Migration 00004 : loyalty foundation ───
  ('00004_loyalty_foundation', 'table',    'loyalty_customers',                       null),
  ('00004_loyalty_foundation', 'table',    'loyalty_transactions',                    null),
  ('00004_loyalty_foundation', 'table',    'loyalty_processed_orders',                null),
  ('00004_loyalty_foundation', 'table',    'loyalty_redemptions',                     null),
  ('00004_loyalty_foundation', 'rls',      'loyalty_customers',                       null),
  ('00004_loyalty_foundation', 'rls',      'loyalty_transactions',                    null),
  ('00004_loyalty_foundation', 'rls',      'loyalty_processed_orders',                null),
  ('00004_loyalty_foundation', 'rls',      'loyalty_redemptions',                     null),
  ('00004_loyalty_foundation', 'function', 'set_updated_at',                          null),
  ('00004_loyalty_foundation', 'trigger',  'loyalty_customers_set_updated_at',        null),
  ('00004_loyalty_foundation', 'column',   'loyalty_customers.phone',                 null),
  ('00004_loyalty_foundation', 'column',   'loyalty_customers.referral_code',         null),
  ('00004_loyalty_foundation', 'column',   'loyalty_customers.loyalty_balance_cents', null),

  -- ─── Migration 00005 : finalize_order_loyalty ───
  ('00005_finalize_order_loyalty', 'function', 'finalize_order_loyalty', null),

  -- ─── Migration 00006 : Shopify codes ───
  ('00006_loyalty_l3_shopify_codes', 'column', 'loyalty_customers.shopify_referral_discount_id',          null),
  ('00006_loyalty_l3_shopify_codes', 'column', 'loyalty_customers.shopify_referral_discount_last_error',  null),
  ('00006_loyalty_l3_shopify_codes', 'column', 'loyalty_customers.shopify_referral_discount_last_attempt_at', null),
  ('00006_loyalty_l3_shopify_codes', 'column', 'loyalty_redemptions.shopify_discount_node_id',            null),
  ('00006_loyalty_l3_shopify_codes', 'view',   'loyalty_customers_with_failed_referral_code',             null),

  -- ─── Migration 00007 : loyalty_staff ───
  ('00007_loyalty_staff', 'table',    'loyalty_staff',                       null),
  ('00007_loyalty_staff', 'rls',      'loyalty_staff',                       null),
  ('00007_loyalty_staff', 'trigger',  'loyalty_staff_set_updated_at',        null),
  ('00007_loyalty_staff', 'function', 'is_current_user_loyalty_staff',       null),
  ('00007_loyalty_staff', 'policy',   'staff_can_read_self',                 'loyalty_staff'),
  ('00007_loyalty_staff', 'view',     'loyalty_active_staff',                null)
)
select
  e.migration,
  e.kind,
  e.name,
  case
    when e.kind = 'table' then exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = e.name
    )
    when e.kind = 'view' then exists (
      select 1 from information_schema.views
      where table_schema = 'public' and table_name = e.name
    )
    when e.kind = 'function' then exists (
      select 1 from information_schema.routines
      where routine_schema = 'public' and routine_name = e.name
    )
    when e.kind = 'column' then exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = split_part(e.name, '.', 1)
        and column_name = split_part(e.name, '.', 2)
    )
    when e.kind = 'rls' then exists (
      select 1 from pg_class c
      join pg_namespace n on c.relnamespace = n.oid
      where n.nspname = 'public' and c.relname = e.name and c.relrowsecurity = true
    )
    when e.kind = 'trigger' then exists (
      select 1 from information_schema.triggers
      where trigger_schema = 'public' and trigger_name = e.name
    )
    when e.kind = 'policy' then exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = e.qualifier and policyname = e.name
    )
    else null
  end as exists_in_db
from expected e
order by e.migration, e.kind, e.name;
