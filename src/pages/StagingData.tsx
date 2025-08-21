import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, FileText, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useSidebarState } from '@/hooks/useSidebarState';
import { cn } from '@/lib/utils';
import { stagingApi } from '@/lib/supabase-client';

const STAGING_PER_PAGE = 50;

export default function StagingData() {
  const [currentPage, setCurrentPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarState();

  // Fetch staging data
  const { data: stagingData, isLoading, error } = useQuery({
    queryKey: ['staging-data', currentPage],
    queryFn: async () => {
      return await stagingApi.getStagingData(currentPage, STAGING_PER_PAGE);
    },
    staleTime: 30000,
  });

  const rows = stagingData?.data || [];

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Error loading staging data</h2>
            <p className="text-muted-foreground">
              {(error as Error).message || 'An unexpected error occurred'}
            </p>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppSidebar 
          open={sidebarOpen} 
          onOpenChange={setSidebarOpen}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
        
        <div className={cn(
          "flex flex-col transition-all duration-200 ease-in-out",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}>
          <AppHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Page Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Staging Data</h1>
                  <p className="text-muted-foreground">
                    View imported data before processing into the clients table
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Stats Card */}
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Staging Records</h3>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {isLoading ? '...' : rows.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Records awaiting processing
                </p>
                {rows.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <p className="text-sm text-muted-foreground">
                      Review and validate before importing
                    </p>
                  </div>
                )}
              </Card>

              {/* Staging Data Table */}
              <Card>
                <div className="p-6 border-b">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Raw Import Data</h2>
                    <Badge variant="secondary" className="ml-2">
                      Read-Only
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This data is imported from external sources and needs validation before processing.
                  </p>
                </div>

                {isLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : rows.length === 0 ? (
                  <div className="p-12 text-center">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No staging data</h3>
                    <p className="text-muted-foreground">
                      No records are currently in the staging area.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client Code</TableHead>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Website</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Account Manager</TableHead>
                          <TableHead>Inbox Manager</TableHead>
                          <TableHead className="text-right">Cost/Month</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">
                              {row.client_code || <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              {row.client_name || <span className="text-muted-foreground">No name</span>}
                            </TableCell>
                            <TableCell>
                              {row.client_email || <span className="text-muted-foreground">No email</span>}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-32 truncate">
                                {row.client_company_name || <span className="text-muted-foreground">No company</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {row.client_website ? (
                                <a
                                  href={row.client_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate block max-w-32"
                                >
                                  {row.client_website}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No website</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.relationship_status ? (
                                <Badge variant="outline" className="text-xs">
                                  {row.relationship_status}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.relationship_type ? (
                                <Badge variant="outline" className="text-xs">
                                  {row.relationship_type}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.assigned_account_manager || <span className="text-muted-foreground">Unassigned</span>}
                            </TableCell>
                            <TableCell>
                              {row.assigned_inbox_manager || <span className="text-muted-foreground">Unassigned</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.recurring_cost_usd ? (
                                <span className="font-mono text-sm">
                                  ${row.recurring_cost_usd}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}