import { INACTIVE_STATUSES } from '@/config/statusBuckets';
import { supabase } from '@/integrations/supabase/client';

export type TeamMemberRole = 'account_manager' | 'inbox_manager' | 'sdr' | 'other';

export type TeamMember = {
  id?: string;
  full_name: string;
  email: string;
  role: TeamMemberRole;
  active?: boolean;
  slack_uuid?: string | null;
  timezone?: string | null;
  capacity_clients?: number | null;
  round_robin_group?: string | null;
};

export async function listTeamMembers(params?: { search?: string; role?: string }) {
  let q = supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('full_name', { ascending: true });

  if (params?.role) {
    q = q.eq('role', params.role);
  }

  if (params?.search) {
    q = q.ilike('full_name', `%${params.search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createTeamMember(tm: TeamMember) {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      full_name: tm.full_name,
      email: tm.email,
      role: tm.role,
      active: true,
      slack_uuid: tm.slack_uuid?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamMember(id: string, patch: Partial<TeamMember>) {
  const payload: Record<string, any> = {};
  if (patch.full_name !== undefined) payload.full_name = patch.full_name;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.slack_uuid !== undefined) payload.slack_uuid = patch.slack_uuid?.toString().trim() || null;
  if (patch.timezone !== undefined) payload.timezone = patch.timezone || null;
  if (patch.capacity_clients !== undefined) payload.capacity_clients = patch.capacity_clients ?? null;
  if (patch.round_robin_group !== undefined) payload.round_robin_group = patch.round_robin_group || null;

  const { data, error } = await supabase
    .from('team_members')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeamMember(id: string) {
  const { data: memberBefore } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  await supabase.from("clients").update({ assigned_account_manager_id: null }).eq("assigned_account_manager_id", id);
  await supabase.from("clients").update({ assigned_inbox_manager_id: null }).eq("assigned_inbox_manager_id", id);
  await supabase.from("clients").update({ assigned_sdr_id: null }).eq("assigned_sdr_id", id);

  const { error: deleteError } = await supabase.from("team_members").delete().eq("id", id);

  if (deleteError) {
    console.warn('Hard delete failed, falling back to soft-delete:', deleteError.message);
    const { error: updateError } = await supabase
      .from("team_members")
      .update({ active: false })
      .eq("id", id);
    if (updateError) throw updateError;
  }

  return memberBefore ?? { id, full_name: '(removed)', email: '', role: 'other', active: false };
}

export async function getActiveClientAssignments(memberId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('client_name')
    .or(
      [
        `assigned_account_manager_id.eq.${memberId}`,
        `assigned_inbox_manager_id.eq.${memberId}`,
        `assigned_sdr_id.eq.${memberId}`,
      ].join(',')
    )
    .is('exit_date', null)
    .not('relationship_status', 'in', `(${INACTIVE_STATUSES.map((s) => `"${s}"`).join(',')})`);

  if (error) throw error;

  const names = (data ?? [])
    .map((c) => c.client_name)
    .filter((name): name is string => Boolean(name));

  return Array.from(new Set(names));
}

export type AssignedClient = {
  client_code: string | null;
  client_name: string | null;
  client_company_name: string | null;
  relationship_status: string | null;
  relationship_type: string | null;
  exit_date: string | null;
  roles: Array<'AM' | 'IM' | 'SDR'>;
};

export async function getMemberAssignedClients(memberId: string): Promise<AssignedClient[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('client_code, client_name, client_company_name, relationship_status, relationship_type, exit_date, assigned_account_manager_id, assigned_inbox_manager_id, assigned_sdr_id')
    .or(
      [
        `assigned_account_manager_id.eq.${memberId}`,
        `assigned_inbox_manager_id.eq.${memberId}`,
        `assigned_sdr_id.eq.${memberId}`,
      ].join(',')
    )
    .order('client_name', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((c: any) => {
    const roles: Array<'AM' | 'IM' | 'SDR'> = [];
    if (c.assigned_account_manager_id === memberId) roles.push('AM');
    if (c.assigned_inbox_manager_id === memberId) roles.push('IM');
    if (c.assigned_sdr_id === memberId) roles.push('SDR');
    return {
      client_code: c.client_code,
      client_name: c.client_name,
      client_company_name: c.client_company_name,
      relationship_status: c.relationship_status,
      relationship_type: c.relationship_type,
      exit_date: c.exit_date,
      roles,
    };
  });
}
