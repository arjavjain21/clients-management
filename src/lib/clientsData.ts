import { supabase } from './supabase-client';
import { INACTIVE_STATUSES } from '@/config/statusBuckets';
import type { ClientFilters } from '@/types/database';

function applyFilters(query: any, filters?: ClientFilters) {
  if (!filters) return query;
  
  if (filters.search) {
    query = query.or(`client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%,client_code.ilike.%${filters.search}%`);
  }
  
  if (filters.relationship_status && filters.relationship_status.length > 0) {
    query = query.in('relationship_status', filters.relationship_status);
  }
  
  if (filters.relationship_type && filters.relationship_type.length > 0) {
    query = query.in('relationship_type', filters.relationship_type);
  }
  
  if (filters.weekend_sending_mode && filters.weekend_sending_mode.length > 0) {
    query = query.in('weekend_sending_mode', filters.weekend_sending_mode);
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
  
  return query;
}

// Global totals: unaffected by UI filters
export async function getGlobalTotals() {
  const totalQuery = supabase
    .from('clients')
    .select('client_id', { count: 'exact', head: true });
  
  const activeQuery = supabase
    .from('clients')
    .select('client_id', { count: 'exact', head: true })
    .is('exit_date', null)
    .not('relationship_status', 'in', `(${INACTIVE_STATUSES.map(s => `"${s}"`).join(',')})`);
  
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

export async function getClientsPage(
  filters: ClientFilters,
  page: number,
  pageSize: number,
  sortBy: string = 'client_name',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  let query = supabase
    .from('clients')
    .select(`
      client_code,
      client_id, 
      client_name,
      client_email,
      client_company_name,
      client_website,
      relationship_status,
      relationship_type,
      weekend_sending_mode,
      assigned_account_manager_id,
      assigned_inbox_manager_id,
      exit_date,
      updated_at,
      created_at,
      onboarding_activated,
      onboarding_date,
      recurring_cost_usd,
      booking_link,
      phone_number,
      avg_dollar_gen_pm
    `, { count: 'exact' });

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