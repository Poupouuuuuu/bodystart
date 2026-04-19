-- ============================================================
-- 00002_rgpd_functions.sql
-- Body Start Coaching — Fonctions RGPD
-- - export_user_data : RGPD art. 20 (portabilité)
-- - anonymize_user   : RGPD art. 17 (droit à l'effacement)
-- ============================================================

-- ============================================================
-- export_user_data(user_id) — Export complet d'un utilisateur
-- ============================================================
-- Retourne un JSONB avec TOUTES les données associées au user.
-- Sécurité : SECURITY DEFINER + check explicit que le caller
-- est soit le user lui-même, soit un admin.
-- ============================================================
create or replace function public.export_user_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  -- Sécurité : caller doit être propriétaire OU admin
  if auth.uid() is null then
    raise exception 'Unauthorized: no authenticated user';
  end if;

  if auth.uid() != p_user_id and not public.is_current_user_admin() then
    raise exception 'Unauthorized: cannot export another user data';
  end if;

  select jsonb_build_object(
    'profile',       to_jsonb(p.*),
    'intakes',       coalesce((select jsonb_agg(to_jsonb(i.*)) from public.intakes i where i.user_id = p_user_id), '[]'::jsonb),
    'programs',      coalesce((select jsonb_agg(to_jsonb(pr.*)) from public.programs pr where pr.user_id = p_user_id), '[]'::jsonb),
    'subscriptions', coalesce((select jsonb_agg(to_jsonb(s.*)) from public.subscriptions s where s.user_id = p_user_id), '[]'::jsonb),
    'checkins',      coalesce((select jsonb_agg(to_jsonb(c.*)) from public.weekly_checkins c where c.user_id = p_user_id), '[]'::jsonb),
    'orders',        coalesce((select jsonb_agg(to_jsonb(o.*)) from public.coaching_orders o where o.user_id = p_user_id), '[]'::jsonb),
    'exported_at',   now(),
    'exported_by',   auth.uid()
  )
  into result
  from public.profiles p
  where p.id = p_user_id;

  if result is null then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  return result;
end;
$$;

comment on function public.export_user_data is 'RGPD art. 20 — Portabilité. Retourne toutes les données d''un utilisateur en JSON.';

-- ============================================================
-- anonymize_user(user_id) — Anonymisation RGPD art. 17
-- ============================================================
-- Stratégie : on conserve la structure (programs.content, coaching_orders)
-- pour responsabilité civile et obligations comptables (art. L102 B du LPF
-- en France : conservation 6 ans des pièces justificatives), mais on efface
-- toutes les PII et données santé sensibles.
--
-- Sécurité : seul un admin peut déclencher (un user qui demande la suppression
-- de son compte passe par l'admin coach pour vérification — peut être assoupli
-- en Sprint 4 avec un flow auto-validation après délai légal).
-- ============================================================
create or replace function public.anonymize_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sécurité : seul un admin peut déclencher
  if auth.uid() is null then
    raise exception 'Unauthorized: no authenticated user';
  end if;

  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: only admins can anonymize users';
  end if;

  -- 1. Profile : effacer PII
  update public.profiles set
    email = 'anonymized-' || id || '@deleted.local',
    first_name = 'Anonymized',
    last_name = 'User',
    shopify_customer_id = 'deleted-' || id,
    deleted_at = coalesce(deleted_at, now()),
    anonymized_at = now()
  where id = p_user_id;

  -- 2. Intakes : effacer données santé sensibles (art. 9)
  update public.intakes set
    blessures_antecedents = '[]'::jsonb,
    contraintes_alimentaires = '[]'::jsonb,
    notes_libres = null,
    poids_kg = null,
    taille_cm = null,
    age = null
  where user_id = p_user_id;

  -- 3. Weekly checkins : effacer données santé + correspondance
  update public.weekly_checkins set
    poids_kg = null,
    mesures = null,
    questions_client = null,
    reponse_coach = null
  where user_id = p_user_id;

  -- 4. Programs : on conserve content pour responsabilité civile
  --    (le coach a délivré ce programme, traçabilité légale nécessaire)
  --    Mais on efface les ajustements coach (peuvent contenir des notes perso)
  update public.programs set
    coach_adjustments = null,
    ai_raw_response = null
  where user_id = p_user_id;

  -- 5. Coaching orders : conservation totale (obligation comptable)
  --    Aucune PII directe dans cette table, le user_id pointe vers un profile anonymisé.
end;
$$;

comment on function public.anonymize_user is 'RGPD art. 17 — Droit à l''effacement. Anonymise PII + données santé. Conserve content programmes et orders pour obligations légales.';

-- ============================================================
-- Permissions : ces fonctions sont SECURITY DEFINER + check interne
-- donc on peut les exposer aux rôles authenticated.
-- ============================================================
grant execute on function public.export_user_data(uuid) to authenticated;
grant execute on function public.anonymize_user(uuid) to authenticated;
