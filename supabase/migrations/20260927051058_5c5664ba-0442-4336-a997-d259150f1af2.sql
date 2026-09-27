CREATE OR REPLACE FUNCTION public.clients_set_correspondence_categories()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
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

UPDATE public.clients SET correspondence_categories = ARRAY['positives']::text[]
WHERE relationship_type IN ('DTC','CLOSELIX')
  AND (correspondence_categories IS NULL OR cardinality(correspondence_categories) = 0);