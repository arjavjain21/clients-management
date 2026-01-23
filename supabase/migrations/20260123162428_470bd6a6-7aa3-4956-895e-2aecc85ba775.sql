-- Rename additional_emails column to correspondence_emails
ALTER TABLE public.clients 
RENAME COLUMN additional_emails TO correspondence_emails;