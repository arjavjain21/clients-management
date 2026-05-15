-- Make the manager-field sync safe for both new and updated client rows.
CREATE OR REPLACE FUNCTION public.clients_set_manager_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  NO_SDR_SENTINEL uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- AM fields
  IF TG_OP = 'INSERT' OR NEW.assigned_account_manager_id IS DISTINCT FROM OLD.assigned_account_manager_id THEN
    IF NEW.assigned_account_manager_id IS NULL THEN
      NEW.assigned_account_manager_name := NULL;
      NEW.assigned_account_manager_email := NULL;
    ELSE
      SELECT tm.full_name, tm.email
      INTO NEW.assigned_account_manager_name, NEW.assigned_account_manager_email
      FROM public.team_members tm
      WHERE tm.id = NEW.assigned_account_manager_id;
    END IF;
  END IF;

  -- IM fields
  IF TG_OP = 'INSERT' OR NEW.assigned_inbox_manager_id IS DISTINCT FROM OLD.assigned_inbox_manager_id THEN
    IF NEW.assigned_inbox_manager_id IS NULL THEN
      NEW.assigned_inbox_manager_name := NULL;
      NEW.assigned_inbox_manager_email := NULL;
    ELSE
      SELECT tm.full_name, tm.email
      INTO NEW.assigned_inbox_manager_name, NEW.assigned_inbox_manager_email
      FROM public.team_members tm
      WHERE tm.id = NEW.assigned_inbox_manager_id;
    END IF;
  END IF;

  -- SDR fields, with special handling for explicit No SDR sentinel.
  IF TG_OP = 'INSERT' OR NEW.assigned_sdr_id IS DISTINCT FROM OLD.assigned_sdr_id THEN
    IF NEW.assigned_sdr_id IS NULL THEN
      NEW.assigned_sdr_name := NULL;
      NEW.assigned_sdr_email := NULL;
    ELSIF NEW.assigned_sdr_id = NO_SDR_SENTINEL THEN
      NEW.assigned_sdr_name := 'No SDR';
      NEW.assigned_sdr_email := NULL;
    ELSE
      SELECT tm.full_name, tm.email
      INTO NEW.assigned_sdr_name, NEW.assigned_sdr_email
      FROM public.team_members tm
      WHERE tm.id = NEW.assigned_sdr_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate client triggers idempotently.
DROP TRIGGER IF EXISTS trg_clients_set_manager_fields ON public.clients;
CREATE TRIGGER trg_clients_set_manager_fields
BEFORE INSERT OR UPDATE OF assigned_account_manager_id, assigned_inbox_manager_id, assigned_sdr_id
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.clients_set_manager_fields();

DROP TRIGGER IF EXISTS trg_clients_set_correspondence_emails ON public.clients;
CREATE TRIGGER trg_clients_set_correspondence_emails
BEFORE INSERT
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_correspondence_emails_from_client_email();

DROP TRIGGER IF EXISTS trg_clients_set_correspondence_categories ON public.clients;
CREATE TRIGGER trg_clients_set_correspondence_categories
BEFORE INSERT OR UPDATE OF relationship_type, correspondence_categories
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.clients_set_correspondence_categories();

DROP TRIGGER IF EXISTS trg_clients_set_updated_at ON public.clients;
CREATE TRIGGER trg_clients_set_updated_at
BEFORE UPDATE
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_clients_guard_pk_immutable ON public.clients;
CREATE TRIGGER trg_clients_guard_pk_immutable
BEFORE UPDATE OF client_code, client_id
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.guard_clients_pk_immutable();

DROP TRIGGER IF EXISTS trg_clients_audit_status ON public.clients;
CREATE TRIGGER trg_clients_audit_status
AFTER UPDATE OF relationship_status
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.audit_clients_status();

DROP TRIGGER IF EXISTS trg_clients_audit_type ON public.clients;
CREATE TRIGGER trg_clients_audit_type
AFTER UPDATE OF relationship_type
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.audit_clients_type();

DROP TRIGGER IF EXISTS trg_clients_audit_assignment ON public.clients;
CREATE TRIGGER trg_clients_audit_assignment
AFTER UPDATE OF assigned_account_manager_id, assigned_inbox_manager_id, assigned_sdr_id
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.audit_clients_assignment();

DROP TRIGGER IF EXISTS trg_clients_audit_pricing ON public.clients;
CREATE TRIGGER trg_clients_audit_pricing
AFTER UPDATE OF recurring_cost_usd, avg_dollar_gen_pm
ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.audit_clients_pricing();

DROP TRIGGER IF EXISTS trg_team_members_propagate_fields ON public.team_members;
CREATE TRIGGER trg_team_members_propagate_fields
AFTER UPDATE OF full_name, email
ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.propagate_team_member_fields();

-- Backfill currently stale denormalized display fields.
UPDATE public.clients c
SET
  assigned_account_manager_name = tm.full_name,
  assigned_account_manager_email = tm.email
FROM public.team_members tm
WHERE c.assigned_account_manager_id = tm.id
  AND (
    c.assigned_account_manager_name IS DISTINCT FROM tm.full_name
    OR c.assigned_account_manager_email IS DISTINCT FROM tm.email
  );

UPDATE public.clients c
SET
  assigned_inbox_manager_name = tm.full_name,
  assigned_inbox_manager_email = tm.email
FROM public.team_members tm
WHERE c.assigned_inbox_manager_id = tm.id
  AND (
    c.assigned_inbox_manager_name IS DISTINCT FROM tm.full_name
    OR c.assigned_inbox_manager_email IS DISTINCT FROM tm.email
  );

UPDATE public.clients c
SET
  assigned_sdr_name = CASE
    WHEN c.assigned_sdr_id = '00000000-0000-0000-0000-000000000000'::uuid THEN 'No SDR'
    ELSE tm.full_name
  END,
  assigned_sdr_email = CASE
    WHEN c.assigned_sdr_id = '00000000-0000-0000-0000-000000000000'::uuid THEN NULL
    ELSE tm.email
  END
FROM public.team_members tm
WHERE c.assigned_sdr_id = tm.id
  AND (
    c.assigned_sdr_name IS DISTINCT FROM tm.full_name
    OR c.assigned_sdr_email IS DISTINCT FROM tm.email
  );

UPDATE public.clients
SET assigned_sdr_name = 'No SDR', assigned_sdr_email = NULL
WHERE assigned_sdr_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND (assigned_sdr_name IS DISTINCT FROM 'No SDR' OR assigned_sdr_email IS NOT NULL);

UPDATE public.clients
SET assigned_sdr_name = NULL, assigned_sdr_email = NULL
WHERE assigned_sdr_id IS NULL
  AND (assigned_sdr_name IS NOT NULL OR assigned_sdr_email IS NOT NULL);

UPDATE public.clients
SET assigned_account_manager_name = NULL, assigned_account_manager_email = NULL
WHERE assigned_account_manager_id IS NULL
  AND (assigned_account_manager_name IS NOT NULL OR assigned_account_manager_email IS NOT NULL);

UPDATE public.clients
SET assigned_inbox_manager_name = NULL, assigned_inbox_manager_email = NULL
WHERE assigned_inbox_manager_id IS NULL
  AND (assigned_inbox_manager_name IS NOT NULL OR assigned_inbox_manager_email IS NOT NULL);