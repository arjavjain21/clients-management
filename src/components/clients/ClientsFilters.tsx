import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClientFilters, TeamMember, RelationshipStatus, RelationshipType } from '@/types/database';

interface ClientsFiltersProps {
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  teamMembers: TeamMember[];
  relationshipStatuses: RelationshipStatus[];
  relationshipTypes: RelationshipType[];
}

export function ClientsFilters({
  filters,
  onFiltersChange,
  teamMembers,
  relationshipStatuses,
  relationshipTypes,
}: ClientsFiltersProps) {
  const updateFilter = <K extends keyof ClientFilters>(key: K, value: ClientFilters[K] | undefined) => {
    const newFilters = { ...filters };
    if (value === '' || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const accountManagers = teamMembers.filter(tm => tm.role === 'account_manager');
  const inboxManagers = teamMembers.filter(tm => tm.role === 'inbox_manager');
  const sdrs = teamMembers.filter(tm => tm.role === 'sdr');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Name, email, or code..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        {/* Relationship Status */}
        <div className="space-y-2">
          <Label>Relationship Status</Label>
          <Select
            value={filters.relationship_status || ''}
            onValueChange={(value) => updateFilter('relationship_status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {relationshipStatuses.map((status) => (
                <SelectItem key={status.name} value={status.name}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Relationship Type */}
        <div className="space-y-2">
          <Label>Relationship Type</Label>
          <Select
            value={filters.relationship_type || ''}
            onValueChange={(value) => updateFilter('relationship_type', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {relationshipTypes.map((type) => (
                <SelectItem key={type.name} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekend Sending */}
        <div className="space-y-2">
          <Label>Weekend Sending</Label>
          <Select
            value={filters.weekend_sending_mode || ''}
            onValueChange={(value) => updateFilter('weekend_sending_mode', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="true">Enabled</SelectItem>
              <SelectItem value="false">Disabled</SelectItem>
              <SelectItem value="inherit">Inherit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account Manager */}
        <div className="space-y-2">
          <Label>Account Manager</Label>
          <Select
            value={filters.assigned_account_manager_id || ''}
            onValueChange={(value) => updateFilter('assigned_account_manager_id', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All AMs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Account Managers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {accountManagers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Inbox Manager */}
        <div className="space-y-2">
          <Label>Inbox Manager</Label>
          <Select
            value={filters.assigned_inbox_manager_id || ''}
            onValueChange={(value) => updateFilter('assigned_inbox_manager_id', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All IMs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inbox Managers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {inboxManagers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SDR */}
        <div className="space-y-2">
          <Label>SDR</Label>
          <Select
            value={filters.assigned_sdr_id || ''}
            onValueChange={(value) => updateFilter('assigned_sdr_id', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All SDRs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SDRs</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="00000000-0000-0000-0000-000000000000">No SDR</SelectItem>
              {sdrs.map((sdr) => (
                <SelectItem key={sdr.id} value={sdr.id}>
                  {sdr.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weekly Target Type */}
        <div className="space-y-2">
          <Label>Weekly Target Type</Label>
          <Select
            value={filters.weekly_target_type || ''}
            onValueChange={(value) => updateFilter('weekly_target_type', value === 'all' ? undefined : value as 'numeric' | 'launch' | 'none')}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="numeric">Numeric Target</SelectItem>
              <SelectItem value="launch">Future Launch</SelectItem>
              <SelectItem value="none">Not Set</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Emails Search */}
        <div className="space-y-2">
          <Label htmlFor="additional_emails_search">Additional Email</Label>
          <Input
            id="additional_emails_search"
            placeholder="Search secondary emails..."
            value={filters.additional_emails_search || ''}
            onChange={(e) => updateFilter('additional_emails_search', e.target.value || undefined)}
          />
        </div>
      </div>
    </Card>
  );
}