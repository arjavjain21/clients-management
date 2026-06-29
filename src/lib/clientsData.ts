import { supabase } from '@/integrations/supabase/client';
import { INACTIVE_STATUSES } from '@/config/statusBuckets';
import type { ClientFilters } from '@/types/database';

function applyFilters(query: any, filters?: ClientFilters) {
  if (!filters) return query;
  
  if (filters.search) {
    const s = filters.search;
    query = query.or(`client_name.ilike.%${s}%,client_email.ilike.%${s}%,client_code.ilike.%${s}%`);
  }
  
  if (filters.relationship_status) {
    query = query.eq('relationship_status', filters.relationship_status);
  }
  
  if (filters.relationship_type) {
    query = query.eq('relationship_type', filters.relationship_type);
  }
  
  if (filters.weekend_sending_mode) {
    query = query.eq('weekend_sending_mode', filters.weekend_sending_mode);
  }
  
  if (filters.assigned_account_manager_id) {
    if (filters.assigned_account_manager_id === 'unassigned') {
      query = query.is('assigned_account_manager_id', null);
    } else {
      query = query.eq('assigned_account_manager_id', filters.assigned_account_manager_id);
    }
  }
  
  if (filters.assigned_inbox_manager_id) {
    if (filters.assigned_inbox_manager_id === 'unassigned') {
      query = query.is('assigned_inbox_manager_id', null);
    } else {
      query = query.eq('assigned_inbox_manager_id', filters.assigned_inbox_manager_id);
    }
  }
  
  if (filters.assigned_sdr_id) {
    if (filters.assigned_sdr_id === 'unassigned') {
      query = query.is('assigned_sdr_id', null);
    } else {
      query = query.eq('assigned_sdr_id', filters.assigned_sdr_id);
    }
  }
  
  if (filters.weekly_target_type) {
    if (filters.weekly_target_type === 'numeric') {
      // Has weekly_target but no launch date
      query = query.not('weekly_target', 'is', null).is('weekly_target_launch_date', null);
    } else if (filters.weekly_target_type === 'launch') {
      // Has a launch date set
      query = query.not('weekly_target_launch_date', 'is', null);
    } else if (filters.weekly_target_type === 'none') {
      // No weekly target set
      query = query.is('weekly_target', null).is('weekly_target_launch_date', null);
    }
  }
  
  if (filters.has_correspondence_emails !== undefined) {
    if (filters.has_correspondence_emails) {
      // Has at least one correspondence email - array is not empty
      query = query.not('correspondence_emails', 'eq', '{}');
    } else {
      // No correspondence emails - array is empty or null
      query = query.or('correspondence_emails.is.null,correspondence_emails.eq.{}');
    }
  }
  
  if (filters.correspondence_category) {
    // Filter clients that have this category in their correspondence_categories array
    query = query.contains('correspondence_categories', [filters.correspondence_category]);
  }
  
  return query;
}

// Global totals: unaffected by UI filters
export async function getGlobalTotals() {
  // Total count - simple query
  const totalQuery = supabase
    .from('clients')
    .select('client_id', { count: 'exact', head: true });
  
  // Active count: exit_date IS NULL AND relationship_status NOT IN inactive list (or is null)
  // We need to handle: (exit_date IS NULL) AND (relationship_status IS NULL OR relationship_status NOT IN (...))
  // Using PostgREST syntax properly
  const inactiveStatusList = INACTIVE_STATUSES.map(s => `"${s}"`).join(',');
  const activeQuery = supabase
    .from('clients')
    .select('client_id', { count: 'exact', head: true })
    .is('exit_date', null)
    .or(`relationship_status.is.null,relationship_status.not.in.(${inactiveStatusList})`);
  
  const [totalResult, activeResult] = await Promise.all([
    totalQuery,
    activeQuery
  ]);
  
  if (totalResult.error) throw totalResult.error;
  if (activeResult.error) throw activeResult.error;
  
  const total = totalResult.count ?? 0;
  const active = activeResult.count ?? 0;
  const inactive = total - active;
  
  return { total, active, inactive };
}

// Filtered totals: same predicate as the grid
export async function getFilteredTotals(filters: ClientFilters) {
  let query = supabase
    .from('clients')
    .select('client_id', { count: 'exact', head: true });
  
  query = applyFilters(query, filters);
  
  const result = await query;
  if (result.error) throw result.error;
  
  return { filteredTotal: result.count ?? 0 };
}

export interface CreateClientInput {
  client_code: string;
  client_id?: number | null;
  client_name?: string | null;
  client_email?: string | null;
  client_company_name?: string | null;
  client_website?: string | null;
  phone_number?: string | null;
  booking_link?: string | null;
  relationship_status?: string | null;
  relationship_type?: string | null;
  weekend_sending_mode?: 'inherit' | 'true' | 'false' | null;
  onboarding_activated?: boolean | null;
  onboarding_date?: string | null;
  exit_date?: string | null;
  recurring_cost_usd?: number | null;
  weekly_target?: string | null;
  weekly_target_launch_date?: string | null;
  monthly_booking_goal?: number | null;
  bonus_pool_monthly?: number | null;
  closelix?: boolean | null;
  assigned_account_manager_id?: string | null;
  assigned_inbox_manager_id?: string | null;
  assigned_sdr_id?: string | null;
  correspondence_emails?: string[] | null;
  correspondence_categories?: string[] | null;
  notes?: string | null;
}

export async function createClient(input: CreateClientInput) {
  const code = (input.client_code || '').trim();
  if (!code) throw new Error('Client code is required');

  // Auto-generate client_id when not provided: max(client_id)+1
  let clientId = input.client_id ?? null;
  if (clientId === null || clientId === undefined || Number.isNaN(Number(clientId))) {
    const { data: maxRow, error: maxErr } = await supabase
      .from('clients')
      .select('client_id')
      .order('client_id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxErr) throw maxErr;
    clientId = ((maxRow?.client_id as number | undefined) ?? 0) + 1;
  }

  // Check uniqueness of composite PK
  const { data: existing, error: existErr } = await supabase
    .from('clients')
    .select('client_code, client_id')
    .eq('client_code', code)
    .eq('client_id', clientId)
    .maybeSingle();
  if (existErr) throw existErr;
  if (existing) {
    throw new Error(`A client with code "${code}" and id ${clientId} already exists`);
  }

  const payload: any = { ...input, client_code: code, client_id: clientId };
  // Strip empty strings -> null for optional text fields
  Object.keys(payload).forEach((k) => {
    if (payload[k] === '' || payload[k] === undefined) payload[k] = null;
  });
  // Arrays default
  if (!Array.isArray(payload.correspondence_emails)) payload.correspondence_emails = [];
  if (!Array.isArray(payload.correspondence_categories)) payload.correspondence_categories = [];

  const { data, error } = await supabase
    .from('clients')
    .insert(payload as any)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getClientsPage(
  filters: ClientFilters,
  page: number,
  pageSize: number,
  sortBy: string = 'client_name',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' });

  // Apply filters using the same logic
  query = applyFilters(query, filters);
  
  // Apply sorting
  const ascending = sortOrder === 'asc';
  query = query.order(sortBy, { ascending });
  
  // Apply pagination
  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  
  const result = await query;
  if (result.error) throw result.error;
  
  return { 
    data: result.data ?? [], 
    count: result.count ?? 0,
    pageCount: (result.data ?? []).length 
  };
}