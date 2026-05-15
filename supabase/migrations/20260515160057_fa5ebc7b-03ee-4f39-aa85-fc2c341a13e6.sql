-- Add SDR assignment audit fields if they do not already exist.
ALTER TABLE public.clients_audit_assignment
ADD COLUMN IF NOT EXISTS old_sdr_id uuid,
ADD COLUMN IF NOT EXISTS new_sdr_id uuid;

-- Update assignment audit function to include SDR changes.
CREATE OR REPLACE FUNCTION public.audit_clients_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(OLD.assigned_account_manager_id::text,'') IS DISTINCT FROM coalesce(NEW.assigned_account_manager_id::text,'')
     OR coalesce(OLD.assigned_inbox_manager_id::text,'') IS DISTINCT FROM coalesce(NEW.assigned_inbox_manager_id::text,'')
     OR coalesce(OLD.assigned_sdr_id::text,'') IS DISTINCT FROM coalesce(NEW.assigned_sdr_id::text,'') THEN
    INSERT INTO public.clients_audit_assignment(
      client_code,
      client_id,
      changed_by,
      old_account_manager_id,
      new_account_manager_id,
      old_inbox_manager_id,
      new_inbox_manager_id,
      old_sdr_id,
      new_sdr_id
    ) VALUES (
      OLD.client_code,
      OLD.client_id,
      public.current_user_uid(),
      OLD.assigned_account_manager_id,
      NEW.assigned_account_manager_id,
      OLD.assigned_inbox_manager_id,
      NEW.assigned_inbox_manager_id,
      OLD.assigned_sdr_id,
      NEW.assigned_sdr_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Remove duplicate/legacy trigger names before creating the canonical set.
DROP TRIGGER IF EXISTS clients_set_correspondence_categories_trg ON public.clients;
DROP TRIGGER IF EXISTS clients_set_correspondence_emails_before_insert ON public.clients;
DROP TRIGGER IF EXISTS trg_clients_pk_guard ON public.clients;
DROP TRIGGER IF EXISTS trg_clients_set_updated ON public.clients;

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