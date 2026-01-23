-- Add additional_emails column as a text array for storing multiple secondary emails
ALTER TABLE public.clients
ADD COLUMN additional_emails text[] DEFAULT '{}';

-- Add a comment explaining the column
COMMENT ON COLUMN public.clients.additional_emails IS 'Array of additional email addresses for other team members associated with this client';