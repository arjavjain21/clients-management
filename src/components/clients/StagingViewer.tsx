import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';
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
import { stagingApi } from '@/lib/supabase-client';
import type { ClientStagingRow } from '@/types/database';

const STAGING_PER_PAGE = 50;

export function StagingViewer() {
  const [currentPage, setCurrentPage] = useState(0);

  const { data: stagingData, isLoading, error, refetch } = useQuery({
    queryKey: ['staging-data', currentPage],
    queryFn: async () => {
      const result = await stagingApi.getStagingData(currentPage, STAGING_PER_PAGE);
      if (result.error) throw result.error;
      return result;
    },
    staleTime: 60000, // 1 minute
  });

  const stagingRows = stagingData?.data as ClientStagingRow[] || [];
  const totalCount = stagingData?.count || 0;
  const totalPages = Math.ceil(totalCount / STAGING_PER_PAGE);

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading staging data</h3>
        <p className="text-muted-foreground mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (stagingRows.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No staging data</h3>
        <p className="text-muted-foreground">
          No import data found in the staging table.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Staging Data</h3>
          <p className="text-muted-foreground">
            Preview of imported client data before processing
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Total records: {totalCount}</span>
        <Badge variant="outline">{stagingRows.length} loaded</Badge>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Code</TableHead>
                <TableHead>Client ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Account Manager</TableHead>
                <TableHead>Inbox Manager</TableHead>
                <TableHead>Cost (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stagingRows.map((row, index) => (
                <TableRow key={`${row.client_code}-${row.client_id}-${index}`}>
                  <TableCell className="font-mono text-sm">
                    {row.client_code || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.client_id || <span className="text-muted-foreground">—</span>}
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
                    <div className="max-w-32 truncate">
                      {row.client_website || <span className="text-muted-foreground">No website</span>}
                    </div>
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
                    {row.onboarding_activated === 'true' ? (
                      <Badge variant="default" className="text-xs">Yes</Badge>
                    ) : row.onboarding_activated === 'false' ? (
                      <Badge variant="secondary" className="text-xs">No</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate text-sm">
                      {row.assigned_account_manager || <span className="text-muted-foreground">Unassigned</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate text-sm">
                      {row.assigned_inbox_manager || <span className="text-muted-foreground">Unassigned</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.recurring_cost_usd ? (
                      <span className="font-mono text-sm">
                        ${parseFloat(row.recurring_cost_usd).toLocaleString()}
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
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}