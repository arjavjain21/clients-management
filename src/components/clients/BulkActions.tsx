import React, { useState } from 'react';
import { Users, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { TeamMember, ClientUpdateData } from '@/types/database';

interface BulkActionsProps {
  selectedCount: number;
  onBulkUpdate: (updates: ClientUpdateData) => Promise<void>;
  onClearSelection: () => void;
  teamMembers: TeamMember[];
}

export function BulkActions({
  selectedCount,
  onBulkUpdate,
  onClearSelection,
  teamMembers,
}: BulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updates, setUpdates] = useState<ClientUpdateData>({});
  const [loading, setLoading] = useState(false);

  const accountManagers = teamMembers.filter(tm => tm.role === 'account_manager');
  const inboxManagers = teamMembers.filter(tm => tm.role === 'inbox_manager');

  const handleSubmit = async () => {
    if (Object.keys(updates).length === 0) {
      return;
    }

    setLoading(true);
    try {
      await onBulkUpdate(updates);
      setUpdates({});
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ClientUpdateData, value: string) => {
    const newUpdates = { ...updates };
    
    if (value === '' || value === 'no-change') {
      delete newUpdates[field];
    } else {
      const finalValue = value === 'unassigned' ? null : value;
      
      // Type-safe assignment based on field
      if (field === 'weekend_sending_mode') {
        (newUpdates as any).weekend_sending_mode = finalValue as 'true' | 'false' | 'inherit' | null;
      } else if (field === 'assigned_account_manager_id' || field === 'assigned_inbox_manager_id') {
        (newUpdates as any)[field] = finalValue as string | null;
      } else if (field === 'weekly_target') {
        const num = parseFloat(value);
        (newUpdates as any).weekly_target = Number.isFinite(num) ? num : null;
      } else {
        (newUpdates as any)[field] = finalValue;
      }
    }
    
    setUpdates(newUpdates);
  };

  const hasUpdates = Object.keys(updates).length > 0;

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedCount} client{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <Badge variant="secondary">{selectedCount}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                Bulk Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Update Clients</DialogTitle>
                <DialogDescription>
                  Update {selectedCount} selected client{selectedCount !== 1 ? 's' : ''}. 
                  Only fields you change will be updated.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* Weekend Sending Mode */}
                <div className="space-y-2">
                  <Label>Weekend Sending Mode</Label>
                  <Select
                    value={updates.weekend_sending_mode || 'no-change'}
                    onValueChange={(value) => updateField('weekend_sending_mode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="true">Enable</SelectItem>
                      <SelectItem value="false">Disable</SelectItem>
                      <SelectItem value="inherit">Inherit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Account Manager */}
                <div className="space-y-2">
                  <Label>Account Manager</Label>
                  <Select
                    value={updates.assigned_account_manager_id === null ? 'unassigned' : (updates.assigned_account_manager_id || 'no-change')}
                    onValueChange={(value) => updateField('assigned_account_manager_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
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
                    value={updates.assigned_inbox_manager_id === null ? 'unassigned' : (updates.assigned_inbox_manager_id || 'no-change')}
                    onValueChange={(value) => updateField('assigned_inbox_manager_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {inboxManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Weekly Target */}
                <div className="space-y-2">
                  <Label>Weekly Target</Label>
                  <Input
                    type="number"
                    placeholder="No change"
                    value={updates.weekly_target ?? ''}
                    onChange={(e) => updateField('weekly_target', e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setUpdates({});
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!hasUpdates || loading}
                >
                  {loading ? 'Updating...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update {selectedCount} Client{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}