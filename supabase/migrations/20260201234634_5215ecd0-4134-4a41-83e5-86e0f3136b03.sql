-- Add correspondence_categories column as text array
ALTER TABLE public.clients 
ADD COLUMN correspondence_categories text[] DEFAULT '{}';

-- Set 'positives' for CLOSELIX clients
UPDATE public.clients 
SET correspondence_categories = ARRAY['positives']
WHERE closelix = true AND client_code != 'PMG';

-- Set 'feedback' for DFY relationship type clients
UPDATE public.clients 
SET correspondence_categories = ARRAY['feedback']
WHERE relationship_type = 'DFY' AND closelix IS NOT TRUE AND client_code != 'PMG';

-- Set both for PMG client
UPDATE public.clients 
SET correspondence_categories = ARRAY['feedback', 'positives']
WHERE client_code = 'PMG';