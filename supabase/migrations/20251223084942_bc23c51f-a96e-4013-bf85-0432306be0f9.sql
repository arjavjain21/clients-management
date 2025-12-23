-- Add DELETE policy for authenticated users on team_members
CREATE POLICY "authenticated_delete_team_members"
ON public.team_members
FOR DELETE
TO authenticated
USING (true);