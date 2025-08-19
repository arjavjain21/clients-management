import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { clientsApi, lookupsApi, stagingApi, supabase } from '@/lib/supabase-client';
import { getGlobalTotals, getFilteredTotals, getClientsPage } from '@/lib/clientsData';
import { diagnostics } from '@/lib/diagnostics';
import type { Client, ClientFilters, TeamMember } from '@/types/database';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientsFilters } from '@/components/clients/ClientsFilters';
import { BulkActions } from '@/components/clients/BulkActions';
import { StagingViewer } from '@/components/clients/StagingViewer';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ClientEditDialog } from '@/components/clients/ClientEditDialog';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

const CLIENTS_PER_PAGE = 50;

export default function Clients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('clients');
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<ClientFilters>({});
  const [sortBy, setSortBy] = useState('client_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedClients, setSelectedClients] = useState<Array<{ client_code: string; client_id: number }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Enable realtime notifications
  useRealtimeNotifications();

  // Fetch clients data using centralized helpers
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['clients', filters, currentPage, sortBy, sortOrder],
    queryFn: async () => {
      return await getClientsPage(filters, currentPage, CLIENTS_PER_PAGE, sortBy, sortOrder);
    },
    staleTime: 30000, // 30 seconds
  });

  // Fetch global totals (unaffected by filters)
  const { data: globalTotals, isLoading: globalLoading } = useQuery({
    queryKey: ['metrics', 'global'],
    queryFn: getGlobalTotals,
    staleTime: 60000, // 1 minute
  });

  // Fetch filtered totals (affected by current filters)
  const { data: filteredTotals, isLoading: filteredLoading } = useQuery({
    queryKey: ['metrics', 'filtered', filters],
    queryFn: () => getFilteredTotals(filters),
    staleTime: 30000, // 30 seconds
  });

  // Fetch lookup data for filters
  const { data: teamMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const result = await lookupsApi.getTeamMembers();
      if (result.error) throw result.error;
      return result.data as TeamMember[];
    },
  });

  const { data: relationshipStatuses } = useQuery({
    queryKey: ['relationship-statuses'],
    queryFn: async () => {
      const result = await lookupsApi.getRelationshipStatuses();
      if (result.error) throw result.error;
      return result.data;
    },
  });

  const { data: relationshipTypes } = useQuery({
    queryKey: ['relationship-types'],
    queryFn: async () => {
      const result = await lookupsApi.getRelationshipTypes();
      if (result.error) throw result.error;
      return result.data;
    },
  });

  // Handle filter updates
  const handleFiltersChange = (newFilters: ClientFilters) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page when filters change
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(0);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle bulk actions
  const handleBulkUpdate = async (updates: any) => {
    if (selectedClients.length === 0) {
      toast({
        title: "No clients selected",
        description: "Please select clients to update.",
        variant: "destructive",
      });
      return;
    }

    try {
      await clientsApi.bulkUpdateClients({
        client_codes: selectedClients,
        updates
      });

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClients([]);
      
      toast({
        title: "Bulk update successful",
        description: `Updated ${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: "Bulk update failed",
        description: "There was an error updating the clients. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clients = clientsData?.data as Client[] || [];
  const totalCount = clientsData?.count || 0;
  const totalPages = Math.ceil(totalCount / CLIENTS_PER_PAGE);

  // Dev-only diagnostics
  useEffect(() => {
    if (globalTotals && clientsData) {
      diagnostics.checkArrayLengthUsage(
        clientsData.pageCount, 
        clients.length, 
        'clients table count'
      );
      diagnostics.checkPaginatedCount(
        totalCount, 
        CLIENTS_PER_PAGE, 
        'total count vs page size'
      );
      diagnostics.verifyQueryPredicates(
        filters, 
        filters, 
        'stats vs table filters'
      );
    }
  }, [globalTotals, clientsData, clients.length, totalCount, filters]);

  if (clientsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">Error loading clients</h2>
          <p className="text-muted-foreground">
            {clientsError.message || 'An unexpected error occurred'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        
        <div className="flex flex-col lg:pl-64">
          <AppHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Page Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Clients Admin</h1>
                  <p className="text-muted-foreground">
                    Manage client relationships, assignments, and settings
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Total Clients</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {globalLoading ? '...' : globalTotals?.total ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Global total</p>
                  {filteredTotals && Object.keys(filters).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {filteredTotals.filteredTotal} match filters
                    </p>
                  )}
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-success" />
                    <h3 className="font-medium">Active</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {globalLoading ? '...' : globalTotals?.active ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Global total</p>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-warning" />
                    <h3 className="font-medium">Inactive</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {globalLoading ? '...' : globalTotals?.inactive ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Global total</p>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-muted" />
                    <h3 className="font-medium">On This Page</h3>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {clientsLoading ? '...' : clientsData?.pageCount ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Current page</p>
                </Card>
              </div>

              {/* Main Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="staging">Staging Data</TabsTrigger>
                </TabsList>

                <TabsContent value="clients" className="space-y-4">
                  {/* Filters */}
                  {showFilters && (
                    <ClientsFilters
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      teamMembers={teamMembers || []}
                      relationshipStatuses={relationshipStatuses || []}
                      relationshipTypes={relationshipTypes || []}
                    />
                  )}

                  {/* Bulk Actions */}
                  {selectedClients.length > 0 && (
                    <BulkActions
                      selectedCount={selectedClients.length}
                      onBulkUpdate={handleBulkUpdate}
                      onClearSelection={() => setSelectedClients([])}
                      teamMembers={teamMembers || []}
                    />
                  )}

                  {/* Row Count Display */}
                  <div className="flex items-center justify-between py-2 px-4 bg-muted/50 rounded-md" role="status" aria-live="polite">
                    <span className="text-sm text-muted-foreground">
                      Showing {clientsLoading ? '...' : clientsData?.pageCount ?? 0} of{' '}
                      {clientsLoading ? '...' : totalCount} 
                      {Object.keys(filters).length > 0 && filteredTotals && (
                        <span> (filtered from {globalTotals?.total ?? 0} total)</span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                  </div>

                  {/* Clients Table */}
                  <ClientsTable
                    clients={clients}
                    loading={clientsLoading}
                    selectedClients={selectedClients}
                    onSelectedClientsChange={setSelectedClients}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    teamMembers={teamMembers || []}
                    onRowClick={setEditingClient}
                  />
                </TabsContent>

                <TabsContent value="staging" className="space-y-4">
                  <StagingViewer />
                </TabsContent>
              </Tabs>
              </div>
            </main>
          </div>
        </div>

        {/* Edit Dialog */}
        <ClientEditDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      </AuthGuard>
    );
  }