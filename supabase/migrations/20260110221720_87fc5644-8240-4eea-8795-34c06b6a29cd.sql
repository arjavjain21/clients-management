-- Add a constant sentinel UUID for "No SDR" - using a well-known UUID that won't conflict
-- We'll use '00000000-0000-0000-0000-000000000000' as the "No SDR" sentinel

-- Update the trigger function to handle "No SDR" case
CREATE OR REPLACE FUNCTION public.clients_set_manager_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  NO_SDR_SENTINEL uuid := '00000000-0000-0000-0000-000000000000';
begin
  -- AM fields
  if new.assigned_account_manager_id is distinct from old.assigned_account_manager_id then
    if new.assigned_account_manager_id is null then
      new.assigned_account_manager_name := null;
      new.assigned_account_manager_email := null;
    else
      select tm.full_name, tm.email
      into new.assigned_account_manager_name, new.assigned_account_manager_email
      from public.team_members tm
      where tm.id = new.assigned_account_manager_id;
    end if;
  end if;

  -- IM fields
  if new.assigned_inbox_manager_id is distinct from old.assigned_inbox_manager_id then
    if new.assigned_inbox_manager_id is null then
      new.assigned_inbox_manager_name := null;
      new.assigned_inbox_manager_email := null;
    else
      select tm.full_name, tm.email
      into new.assigned_inbox_manager_name, new.assigned_inbox_manager_email
      from public.team_members tm
      where tm.id = new.assigned_inbox_manager_id;
    end if;
  end if;

  -- SDR fields - with special handling for "No SDR" sentinel
  if new.assigned_sdr_id is distinct from old.assigned_sdr_id then
    if new.assigned_sdr_id is null then
      new.assigned_sdr_name := null;
      new.assigned_sdr_email := null;
    elsif new.assigned_sdr_id = NO_SDR_SENTINEL then
      -- Explicit "No SDR" - set name to indicate this, no email
      new.assigned_sdr_name := 'No SDR';
      new.assigned_sdr_email := null;
    else
      select tm.full_name, tm.email
      into new.assigned_sdr_name, new.assigned_sdr_email
      from public.team_members tm
      where tm.id = new.assigned_sdr_id;
    end if;
  end if;

  return new;
end
$function$;