-- Backfill assigned_sdr_name and assigned_sdr_email for all rows where SDR is assigned but name/email is missing
UPDATE public.clients c
SET 
  assigned_sdr_name = tm.full_name,
  assigned_sdr_email = tm.email
FROM public.team_members tm
WHERE c.assigned_sdr_id = tm.id
  AND c.assigned_sdr_id IS NOT NULL
  AND (c.assigned_sdr_name IS NULL OR c.assigned_sdr_email IS NULL);

-- Also backfill AM and IM name/email for consistency
UPDATE public.clients c
SET 
  assigned_account_manager_name = tm.full_name,
  assigned_account_manager_email = tm.email
FROM public.team_members tm
WHERE c.assigned_account_manager_id = tm.id
  AND c.assigned_account_manager_id IS NOT NULL
  AND (c.assigned_account_manager_name IS NULL OR c.assigned_account_manager_email IS NULL);

UPDATE public.clients c
SET 
  assigned_inbox_manager_name = tm.full_name,
  assigned_inbox_manager_email = tm.email
FROM public.team_members tm
WHERE c.assigned_inbox_manager_id = tm.id
  AND c.assigned_inbox_manager_id IS NOT NULL
  AND (c.assigned_inbox_manager_name IS NULL OR c.assigned_inbox_manager_email IS NULL);