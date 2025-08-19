// Development-only diagnostics for detecting display/preview mismatches

const isDev = process.env.NODE_ENV === 'development';

export const diagnostics = {
  // Check if a stat is derived from array.length instead of exact count
  checkArrayLengthUsage: (value: number, arrayLength: number, label: string) => {
    if (!isDev) return;
    
    if (value === arrayLength && arrayLength > 0) {
      console.warn(`🔍 Potential array.length usage detected in ${label}:`, {
        value,
        arrayLength,
        suggestion: 'Use Supabase exact count instead of array.length for accurate totals'
      });
    }
  },

  // Check if UI metrics are derived from paginated responses
  checkPaginatedCount: (totalCount: number, pageSize: number, label: string) => {
    if (!isDev) return;
    
    if (totalCount <= pageSize) {
      console.warn(`🔍 Possible paginated count issue in ${label}:`, {
        totalCount,
        pageSize,
        suggestion: 'Ensure total counts come from separate count queries, not paginated data'
      });
    }
  },

  // Verify query predicates match between stats and table
  verifyQueryPredicates: (statsFilters: any, tableFilters: any, label: string) => {
    if (!isDev) return;
    
    const statsKeys = Object.keys(statsFilters || {}).sort();
    const tableKeys = Object.keys(tableFilters || {}).sort();
    
    const filtersMatch = JSON.stringify(statsKeys) === JSON.stringify(tableKeys);
    
    if (!filtersMatch) {
      console.warn(`🔍 Filter mismatch detected in ${label}:`, {
        statsFilters: statsKeys,
        tableFilters: tableKeys,
        suggestion: 'Ensure stats and table use identical filter predicates'
      });
    }
  },

  // Check for hydration differences (zero values that should have data)
  checkHydrationMismatch: (value: number, isLoading: boolean, hasData: boolean, label: string) => {
    if (!isDev) return;
    
    if (!isLoading && hasData && value === 0) {
      console.info(`🔍 Potential hydration issue in ${label}:`, {
        value,
        isLoading,
        hasData,
        suggestion: 'Consider adding loading states to prevent zero-flash during hydration'
      });
    }
  },

  // Log exact queries for debugging
  logQuery: (queryType: string, filters: any, result: any) => {
    if (!isDev) return;
    
    console.group(`🔍 Query Debug: ${queryType}`);
    console.log('Filters:', filters);
    console.log('Result:', result);
    console.groupEnd();
  }
};

// Development toggle for verbose query logging
export const enableQueryDebugging = () => {
  if (isDev) {
    (window as any).debugQueries = true;
    console.log('🔍 Query debugging enabled');
  }
};

export const shouldLogQueries = () => isDev && (window as any).debugQueries;