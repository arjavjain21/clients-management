ALTER TABLE public.clients
  ADD COLUMN send_internal_notification boolean NOT NULL DEFAULT false;

UPDATE public.clients
SET send_internal_notification = true
WHERE exit_date IS NULL
  AND (
    relationship_status IS NULL
    OR upper(trim(relationship_status)) NOT IN ('PAUSED', 'CANCELLED', 'INACTIVE', 'CLOSED', 'EXITED', 'CHURNED')
  )
  AND (
    upper(coalesce(trim(relationship_type), '')) = 'CLOSELIX'
    OR upper(coalesce(trim(relationship_type), '')) LIKE '%DFY%'
    OR upper(coalesce(trim(relationship_type), '')) LIKE '%DWY%'
  );

CREATE OR REPLACE FUNCTION public.clients_set_internal_notification_default()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- This default is insert-only so later manual opt-outs are preserved.
  NEW.send_internal_notification := (
    NEW.exit_date IS NULL
    AND (
      NEW.relationship_status IS NULL
      OR upper(trim(NEW.relationship_status)) NOT IN ('PAUSED', 'CANCELLED', 'INACTIVE', 'CLOSED', 'EXITED', 'CHURNED')
    )
    AND (
      upper(coalesce(trim(NEW.relationship_type), '')) = 'CLOSELIX'
      OR upper(coalesce(trim(NEW.relationship_type), '')) LIKE '%DFY%'
      OR upper(coalesce(trim(NEW.relationship_type), '')) LIKE '%DWY%'
    )
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_clients_set_internal_notification_default
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.clients_set_internal_notification_default();