CREATE OR REPLACE FUNCTION public.clients_set_correspondence_categories()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Apply defaults only when a client is created, or when its relationship type changes.
  -- A normal edit that clears categories must be respected (no re-adding).
  IF TG_OP = 'UPDATE' AND NEW.relationship_type IS NOT DISTINCT FROM OLD.relationship_type THEN
    RETURN NEW;
  END IF;

  IF (NEW.correspondence_categories IS NULL OR cardinality(NEW.correspondence_categories) = 0) THEN
    IF NEW.relationship_type IN ('CLOSELIX','DTC') THEN
      NEW.correspondence_categories := ARRAY['positives']::text[];
    ELSIF NEW.relationship_type = 'HYPERKE DFY' THEN
      NEW.correspondence_categories := ARRAY['feedback']::text[];
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;