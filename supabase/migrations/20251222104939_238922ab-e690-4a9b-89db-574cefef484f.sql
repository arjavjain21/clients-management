-- Fix 1: Enable RLS on clients_staging and add authenticated-only policies
ALTER TABLE public.clients_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_staging"
  ON public.clients_staging FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_staging"
  ON public.clients_staging FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_staging"
  ON public.clients_staging FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_staging"
  ON public.clients_staging FOR DELETE
  TO authenticated
  USING (true);

-- Fix 2: Remove anonymous read policies on sensitive tables
DROP POLICY IF EXISTS "anon_read_clients" ON public.clients;
DROP POLICY IF EXISTS "anon_update_clients" ON public.clients;
DROP POLICY IF EXISTS "anon_read_team_members" ON public.team_members;
DROP POLICY IF EXISTS "anon_delete_team_members" ON public.team_members;
DROP POLICY IF EXISTS "anon_delete_team_members_with_header" ON public.team_members;
DROP POLICY IF EXISTS "anon_read_statuses" ON public.relationship_statuses;
DROP POLICY IF EXISTS "anon_read_types" ON public.relationship_types;

-- Enable RLS on round_robin tables if not already enabled
ALTER TABLE public.round_robin_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_robin_state ENABLE ROW LEVEL SECURITY;

-- Add authenticated policies for round_robin tables
CREATE POLICY "authenticated_read_round_robin_groups"
  ON public.round_robin_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_round_robin_groups"
  ON public.round_robin_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_round_robin_state"
  ON public.round_robin_state FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_write_round_robin_state"
  ON public.round_robin_state FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure team_members has authenticated update policy
CREATE POLICY "authenticated_update_team_members"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);