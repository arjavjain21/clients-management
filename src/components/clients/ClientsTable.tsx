import React from 'react';
// Note: No routing from row actions; edit opens overlay via onRowClick
import { ChevronUp, ChevronDown, ExternalLink, Mail, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

import type { Client, TeamMember } from '@/types/database';

interface ClientsTableProps {
  clients: Client[];
  loading: boolean;
  selectedClients: Array<{ client_code: string; client_id: number }>;
  onSelectedClientsChange: (selected: Array<{ client_code: string; client_id: number }>) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  teamMembers: TeamMember[];
  onRowClick?: (client: Client) => void;
}

export function ClientsTable({
  clients,
  loading,
  selectedClients,
  onSelectedClientsChange,
  sortBy,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  teamMembers,
  onRowClick,
}: ClientsTableProps) {
  const idToMember = React.useMemo(() => {
    const map = new Map<string, { full_name?: string; email?: string }>();
    teamMembers.forEach((tm) => {
      if (tm.id) map.set(tm.id, { full_name: (tm as any).full_name, email: (tm as any).email });
    });
    return map;
  }, [teamMembers]);
  const isSelected = (client: Client) =>
    selectedClients.some(
      (s) => s.client_code === client.client_code && s.client_id === client.client_id
    );

  const toggleSelection = (client: Client) => {
    const clientId = { client_code: client.client_code, client_id: client.client_id };
    
    if (isSelected(client)) {
      onSelectedClientsChange(
        selectedClients.filter(
          (s) => !(s.client_code === client.client_code && s.client_id === client.client_id)
        )
      );
    } else {
      onSelectedClientsChange([...selectedClients, clientId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      onSelectedClientsChange([]);
    } else {
      onSelectedClientsChange(
        clients.map((client) => ({
          client_code: client.client_code,
          client_id: client.client_id,
        }))
      );
    }
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => onSort(column)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </span>
    </Button>
  );

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'ACTIVE': 'default',
      'PENDING': 'secondary',
      'INACTIVE': 'outline',
      'CANCELLED': 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status}
      </Badge>
    );
  };

  const getWeekendSendingBadge = (mode?: string) => {
    if (!mode || mode === 'inherit') return null;
    
    return (
      <Badge variant={mode === 'true' ? 'default' : 'secondary'} className="text-xs">
        {mode === 'true' ? 'On' : 'Off'}
      </Badge>
    );
  };

  if (loading) {
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

  if (clients.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-medium mb-2">No clients found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search terms.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClients.length === clients.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all clients"
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader column="client_code">Code</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="client_name">Name</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="client_email">Email</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="client_company_name">Company</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="relationship_status">Status</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="relationship_type">Type</SortableHeader>
                </TableHead>
                <TableHead className="text-center">
                  <SortableHeader column="closelix">Closelix</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="weekend_sending_mode">Weekend</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="assigned_account_manager_name">AM</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="assigned_inbox_manager_name">IM</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="updated_at">Last Updated</SortableHeader>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow 
                  key={`${client.client_code}-${client.client_id}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick?.(client)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected(client)}
                      onCheckedChange={() => toggleSelection(client)}
                      aria-label={`Select ${client.client_name || client.client_code}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {client.client_code}-{client.client_id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {client.client_name || <span className="text-muted-foreground">No name</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.client_email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{client.client_email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No email</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate">
                      {client.client_company_name || (
                        <span className="text-muted-foreground">No company</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.relationship_status)}
                  </TableCell>
                  <TableCell>
                    {client.relationship_type ? (
                      <Badge variant="outline" className="text-xs">
                        {client.relationship_type}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center">
                    {client.closelix ? <Check className="h-4 w-4 mx-auto" /> : null}
                  </TableCell>
                  <TableCell>
                    {getWeekendSendingBadge(client.weekend_sending_mode)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const nameFromClient = (client as any).assigned_account_manager_name as string | undefined;
                      const emailFromClient = (client as any).assigned_account_manager_email as string | undefined;
                      const hasClientFields = !!(nameFromClient || emailFromClient);
                      if (hasClientFields) {
                        return (
                          <div className="text-sm">
                            {nameFromClient || '—'} {emailFromClient ? <span className="text-muted-foreground">· {emailFromClient}</span> : null}
                          </div>
                        );
                      }
                      const am = idToMember.get((client as any).assigned_account_manager_id);
                      if (am?.full_name || am?.email) {
                        return (
                          <div className="text-sm">
                            {am.full_name || '—'} {am.email ? <span className="text-muted-foreground">· {am.email}</span> : null}
                          </div>
                        );
                      }
                      return <span className="text-muted-foreground text-sm">Unassigned</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const nameFromClient = (client as any).assigned_inbox_manager_name as string | undefined;
                      const emailFromClient = (client as any).assigned_inbox_manager_email as string | undefined;
                      const hasClientFields = !!(nameFromClient || emailFromClient);
                      if (hasClientFields) {
                        return (
                          <div className="text-sm">
                            {nameFromClient || '—'} {emailFromClient ? <span className="text-muted-foreground">· {emailFromClient}</span> : null}
                          </div>
                        );
                      }
                      const im = idToMember.get((client as any).assigned_inbox_manager_id);
                      if (im?.full_name || im?.email) {
                        return (
                          <div className="text-sm">
                            {im.full_name || '—'} {im.email ? <span className="text-muted-foreground">· {im.email}</span> : null}
                          </div>
                        );
                      }
                      return <span className="text-muted-foreground text-sm">Unassigned</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {client.updated_at ? (
                        <time dateTime={client.updated_at}>
                          {new Date(client.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </time>
                      ) : (
                        '—'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick?.(client);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {client.client_website && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                      >
                        <a
                          href={client.client_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
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
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
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