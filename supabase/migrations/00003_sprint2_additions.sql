-- ============================================================
-- 00003_sprint2_additions.sql
-- Body Start Coaching — Sprint 2
-- Additions de colonnes + storage RLS policies pour le bucket coaching-pdfs
-- ============================================================

-- ─── Colonnes additionnelles ───
alter table public.intakes
  add column if not exists submitted_at timestamptz;
comment on column public.intakes.submitted_at is 'Timestamp de soumission du formulaire par le client (vs created_at qui est la création de la ligne par le webhook Stripe).';

alter table public.coaching_orders
  add column if not exists completed_at timestamptz;
comment on column public.coaching_orders.completed_at is 'Timestamp de delivery du programme final au client.';

alter table public.programs
  add column if not exists coach_email_sent_at timestamptz;
comment on column public.programs.coach_email_sent_at is 'Audit : timestamp d''envoi de l''email "intake reçu" au coach.';

alter table public.programs
  add column if not exists client_email_sent_at timestamptz;
comment on column public.programs.client_email_sent_at is 'Audit : timestamp d''envoi de l''email "ton programme est prêt" au client.';

-- ─── Storage RLS pour le bucket coaching-pdfs ───
-- Ces policies sont une defense-in-depth : nos routes API utilisent le
-- service_role qui bypass déjà la RLS. Mais si jamais une route faisait
-- un appel anonyme par erreur, ces policies empêchent toute fuite.

-- Le bucket doit exister (créé manuellement via UI Sprint 1, action A).
-- Si pas encore créé, ces policies seront sans effet (mais inoffensives).

-- Personne ne peut lire le bucket directement via l'API publique.
-- Les downloads se font UNIQUEMENT via signed URLs générées server-side
-- par notre route /api/coaching/pdf/[programId] (qui vérifie l'auth d'abord).
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'objects') then
    -- Drop si déjà existantes (idempotent)
    execute 'drop policy if exists "coaching_pdfs_no_public_read" on storage.objects';
    execute 'drop policy if exists "coaching_pdfs_no_public_insert" on storage.objects';
    execute 'drop policy if exists "coaching_pdfs_no_public_update" on storage.objects';
    execute 'drop policy if exists "coaching_pdfs_no_public_delete" on storage.objects';

    -- Bloquer toute opération anonyme/authenticated sur ce bucket
    execute $p$
      create policy "coaching_pdfs_no_public_read"
      on storage.objects for select
      using (bucket_id != 'coaching-pdfs')
    $p$;

    execute $p$
      create policy "coaching_pdfs_no_public_insert"
      on storage.objects for insert
      with check (bucket_id != 'coaching-pdfs')
    $p$;

    execute $p$
      create policy "coaching_pdfs_no_public_update"
      on storage.objects for update
      using (bucket_id != 'coaching-pdfs')
    $p$;

    execute $p$
      create policy "coaching_pdfs_no_public_delete"
      on storage.objects for delete
      using (bucket_id != 'coaching-pdfs')
    $p$;
  end if;
end $$;
