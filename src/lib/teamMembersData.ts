import { supabase } from '@/integrations/supabase/client';

export type TeamMember = {
  id?: string;
  full_name: string;
  email: string;
  role: 'account_manager' | 'inbox_manager' | 'other';
  active?: boolean;
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
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}