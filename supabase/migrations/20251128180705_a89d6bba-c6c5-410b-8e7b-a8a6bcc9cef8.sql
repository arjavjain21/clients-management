-- Drop the existing check constraint and recreate with 'sdr' included
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members ADD CONSTRAINT team_members_role_check 
  CHECK (role IN ('account_manager', 'inbox_manager', 'sdr', 'other'));