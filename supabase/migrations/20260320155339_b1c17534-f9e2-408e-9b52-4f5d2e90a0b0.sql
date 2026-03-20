-- Backfill all denormalized SDR name/email fields from team_members
UPDATE public.clients c
SET 
  assigned_sdr_name = tm.full_name,
  assigned_sdr_email = tm.email
FROM public.team_members tm
WHERE c.assigned_sdr_id = tm.id
  AND c.assigned_sdr_id != '00000000-0000-0000-0000-000000000000'
  AND (c.assigned_sdr_name IS DISTINCT FROM tm.full_name OR c.assigned_sdr_email IS DISTINCT FROM tm.email);

-- Also backfill AM and IM fields just in case
UPDATE public.clients c
SET 
  assigned_account_manager_name = tm.full_name,
  assigned_account_manager_email = tm.email
FROM public.team_members tm
WHERE c.assigned_account_manager_id = tm.id
  AND (c.assigned_account_manager_name IS DISTINCT FROM tm.full_name OR c.assigned_account_manager_email IS DISTINCT FROM tm.email);

UPDATE public.clients c
SET 
  assigned_inbox_manager_name = tm.full_name,
  assigned_inbox_manager_email = tm.email
FROM public.team_members tm
WHERE c.assigned_inbox_manager_id = tm.id
  AND (c.assigned_inbox_manager_name IS DISTINCT FROM tm.full_name OR c.assigned_inbox_manager_email IS DISTINCT FROM tm.email);