-- Add weekly_target column to clients table (optional numeric field)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS weekly_target NUMERIC;