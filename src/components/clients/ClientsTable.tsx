import React from 'react';
import { ChevronUp, ChevronDown, ExternalLink, Globe, CalendarIcon, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

  const getManagerName = (client: Client, role: 'account_manager' | 'inbox_manager' | 'sdr') => {
    const nameKey = `assigned_${role === 'account_manager' ? 'account_manager' : role === 'inbox_manager' ? 'inbox_manager' : 'sdr'}_name`;
    const idKey = `assigned_${role === 'account_manager' ? 'account_manager' : role === 'inbox_manager' ? 'inbox_manager' : 'sdr'}_id`;
    const name = (client as any)[nameKey] as string | undefined;
    if (name) return <span className="text-sm">{name}</span>;
    const id = (client as any)[idKey] as string | undefined;
    if (id) {
      const member = idToMember.get(id);
      if (member?.full_name) return <span className="text-sm">{member.full_name}</span>;
    }
    return <span className="text-muted-foreground text-sm">—</span>;
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
                <TableHead className="w-[48px] min-w-[48px] max-w-[48px] sticky left-0 z-20 bg-background">
                  <Checkbox
                    checked={selectedClients.length === clients.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all clients"
                  />
                </TableHead>
                <TableHead className="sticky left-[48px] z-20 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <SortableHeader column="client_code">Code</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="client_name">Name</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="relationship_status">Status</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="relationship_type">Type</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="assigned_account_manager_name">AM</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="assigned_inbox_manager_name">IM</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="assigned_sdr_name">SDR</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="weekly_target">Weekly Target</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="monthly_booking_goal">Monthly Goal</SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader column="bonus_pool_monthly">Bonus Pool</SortableHeader>
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
                  <TableCell className="w-[48px] min-w-[48px] max-w-[48px] sticky left-0 z-10 bg-background" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected(client)}
                      onCheckedChange={() => toggleSelection(client)}
                      aria-label={`Select ${client.client_name || client.client_code}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm sticky left-[48px] z-10 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {client.client_code}-{client.client_id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {client.client_name || <span className="text-muted-foreground">No name</span>}
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
                  <TableCell>{getManagerName(client, 'account_manager')}</TableCell>
                  <TableCell>{getManagerName(client, 'inbox_manager')}</TableCell>
                  <TableCell>{getManagerName(client, 'sdr')}</TableCell>
                  <TableCell>
                    {(() => {
                      const weeklyTarget = (client as any).weekly_target;
                      const launchDate = (client as any).weekly_target_launch_date;
                      if (launchDate) {
                        return (
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="h-3 w-3 text-primary" />
                            <span className="text-primary font-medium">{weeklyTarget || `Launch ${new Date(launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</span>
                          </div>
                        );
                      }
                      if (weeklyTarget != null && weeklyTarget !== '') {
                        const numVal = parseFloat(weeklyTarget);
                        if (!isNaN(numVal)) return <span className="text-sm font-medium">{numVal.toLocaleString()}</span>;
                        return <span className="text-sm">{weeklyTarget}</span>;
                      }
                      return <span className="text-muted-foreground text-sm">—</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    {(client as any).closelix ? (
                      <Badge variant="secondary" className="text-xs">Closelix</Badge>
                    ) : (client as any).monthly_booking_goal != null ? (
                      <span className="text-sm font-medium">{(client as any).monthly_booking_goal}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(client as any).bonus_pool_monthly != null ? (
                      <span className="text-sm font-medium">${(client as any).bonus_pool_monthly.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {client.updated_at ? (
                        <time dateTime={client.updated_at}>
                          {new Date(client.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                      ) : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {(client as any).notes && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <StickyNote className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <p className="text-sm line-clamp-3">{(client as any).notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
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
                        <Button asChild variant="ghost" size="sm">
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
