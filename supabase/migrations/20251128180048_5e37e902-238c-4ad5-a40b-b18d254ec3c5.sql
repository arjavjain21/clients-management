-- Add SDR columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS assigned_sdr_id uuid REFERENCES public.team_members(id),
ADD COLUMN IF NOT EXISTS assigned_sdr_name text,
ADD COLUMN IF NOT EXISTS assigned_sdr_email text;

-- Update the trigger function to handle SDR fields
CREATE OR REPLACE FUNCTION public.clients_set_manager_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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

  -- SDR fields
  if new.assigned_sdr_id is distinct from old.assigned_sdr_id then
    if new.assigned_sdr_id is null then
      new.assigned_sdr_name := null;
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

-- Update propagate function to handle SDR
CREATE OR REPLACE FUNCTION public.propagate_team_member_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  update public.clients
     set assigned_account_manager_name  = new.full_name,
         assigned_account_manager_email = new.email
   where assigned_account_manager_id = new.id;

  update public.clients
     set assigned_inbox_manager_name  = new.full_name,
         assigned_inbox_manager_email = new.email
   where assigned_inbox_manager_id = new.id;

  update public.clients
     set assigned_sdr_name  = new.full_name,
         assigned_sdr_email = new.email
   where assigned_sdr_id = new.id;

  return null;
end
$function$;