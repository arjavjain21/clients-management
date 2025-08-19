import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, ExternalLink, Mail, Globe } from 'lucide-react';
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
  onClientClick?: (client: Client) => void;
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
  onClientClick,
}: ClientsTableProps) {
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
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Weekend</TableHead>
                <TableHead>AM</TableHead>
                <TableHead>IM</TableHead>
                <TableHead className="text-right">Target/Month</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow 
                  key={`${client.client_code}-${client.client_id}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onClientClick?.(client)}
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
                  <TableCell>
                    {getWeekendSendingBadge(client.weekend_sending_mode)}
                  </TableCell>
                  <TableCell>
                    {(client as any).assigned_account_manager ? (
                      <div className="text-sm">
                        {(client as any).assigned_account_manager.full_name}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(client as any).assigned_inbox_manager ? (
                      <div className="text-sm">
                        {(client as any).assigned_inbox_manager.full_name}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {client.avg_dollar_gen_pm ? (
                      <span className="font-mono text-sm">
                        ${client.avg_dollar_gen_pm.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
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
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
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