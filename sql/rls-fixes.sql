-- Enable RLS (idempotent)
alter table public.clients enable row level security;
alter table public.team_members enable row level security;
alter table public.relationship_statuses enable row level security;
alter table public.relationship_types enable row level security;

-- Read policies for anon (UI read-only OK without auth)
create policy if not exists anon_read_clients
  on public.clients for select to anon using (true);
create policy if not exists anon_read_team_members
  on public.team_members for select to anon using (true);
create policy if not exists anon_read_statuses
  on public.relationship_statuses for select to anon using (true);
create policy if not exists anon_read_types
  on public.relationship_types for select to anon using (true);

-- Guarded UPDATE on clients for anon via shared header
create policy if not exists anon_update_clients_with_header
  on public.clients for update to anon
  using ( current_setting('request.header.x-lovable-secret', true) = 'REPLACE_WITH_YOUR_SECRET' )
  with check ( current_setting('request.header.x-lovable-secret', true) = 'REPLACE_WITH_YOUR_SECRET' );

-- Optional INSERT/UPDATE/DELETE for team_members (for UI management)
create policy if not exists anon_insert_team_members_with_header
  on public.team_members for insert to anon
  with check ( current_setting('request.header.x-lovable-secret', true) = 'REPLACE_WITH_YOUR_SECRET' );
create policy if not exists anon_update_team_members_with_header
  on public.team_members for update to anon
  using ( current_setting('request.header.x-lovable-secret', true) = 'REPLACE_WITH_YOUR_SECRET' )
  with check ( current_setting('request.header.x-lovable-secret', true) = 'REPLACE_WITH_YOUR_SECRET' );
create policy if not exists anon_delete_team_members_with_header
  on public.team_members for delete to anon
  using ( current_setting('request.header.x-lovable-secret', true) = 'REPLACE_WITH_YOUR_SECRET' );

-- Column-level constraint via grants (prevent PK edits)
revoke update on table public.clients from anon;
grant update (
  client_name,
  client_email,
  client_company_name,
  client_website,
  relationship_status,
  relationship_type,
  onboarding_activated,
  onboarding_date,
  recurring_cost_usd,
  weekend_sending_mode,
  booking_link,
  phone_number,
  avg_dollar_gen_pm,
  exit_date,
  assigned_account_manager_id,
  assigned_inbox_manager_id
) on public.clients to anon;