import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { clientsApi } from '@/lib/supabase-client';
import type { Client, TeamMember } from '@/types/database';

interface ClientEditDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  relationshipStatuses: Array<{ name: string }>;
  relationshipTypes: Array<{ name: string }>;
}

export function ClientEditDialog({
  client,
  open,
  onOpenChange,
  teamMembers,
  relationshipStatuses,
  relationshipTypes,
}: ClientEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});

  React.useEffect(() => {
    if (client) {
      setFormData({
        client_company_name: client.client_company_name || '',
        client_email: client.client_email || '',
        client_website: client.client_website || '',
        relationship_status: client.relationship_status || '',
        relationship_type: client.relationship_type || '',
        weekend_sending_mode: client.weekend_sending_mode || 'inherit',
        avg_dollar_gen_pm: client.avg_dollar_gen_pm || 0,
        recurring_cost_usd: client.recurring_cost_usd || 0,
        phone_number: client.phone_number || '',
        booking_link: client.booking_link || '',
        assigned_account_manager_id: client.assigned_account_manager_id || '',
        assigned_inbox_manager_id: client.assigned_inbox_manager_id || '',
      });
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;

    setSaving(true);
    try {
      await clientsApi.updateClient(client.client_code, client.client_id, formData);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      
      toast({
        title: "Client updated",
        description: `${client.client_name || client.client_code} has been updated successfully.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating the client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!client) return null;

  const accountManagers = teamMembers.filter(tm => tm.role === 'account_manager');
  const inboxManagers = teamMembers.filter(tm => tm.role === 'inbox_manager');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Client: {client.client_name || client.client_code}
            <Badge variant="outline" className="font-mono text-xs">
              {client.client_code}-{client.client_id}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Update client information, assignments, and settings. Client code and name cannot be modified.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Fixed Fields Display */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Fixed Information</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Client Code</Label>
                <p className="font-mono">{client.client_code}-{client.client_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Client Name</Label>
                <p>{client.client_name || 'Not set'}</p>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.client_company_name || ''}
                  onChange={(e) => handleInputChange('client_company_name', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.client_email || ''}
                  onChange={(e) => handleInputChange('client_email', e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.client_website || ''}
                  onChange={(e) => handleInputChange('client_website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone_number || ''}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-link">Booking Link</Label>
              <Input
                id="booking-link"
                value={formData.booking_link || ''}
                onChange={(e) => handleInputChange('booking_link', e.target.value)}
                placeholder="https://calendly.com/client"
              />
            </div>
          </div>

          <Separator />

          {/* Relationship Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Relationship Settings</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Relationship Status</Label>
                <Select
                  value={formData.relationship_status || ''}
                  onValueChange={(value) => handleInputChange('relationship_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipStatuses.map((status) => (
                      <SelectItem key={status.name} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select
                  value={formData.relationship_type || ''}
                  onValueChange={(value) => handleInputChange('relationship_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map((type) => (
                      <SelectItem key={type.name} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weekend Sending</Label>
                <Select
                  value={formData.weekend_sending_mode || 'inherit'}
                  onValueChange={(value) => handleInputChange('weekend_sending_mode', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Inherit Default</SelectItem>
                    <SelectItem value="true">Enabled</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Financial Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target-monthly">Target Dollar Gen/Month</Label>
                <Input
                  id="target-monthly"
                  type="number"
                  value={formData.avg_dollar_gen_pm || ''}
                  onChange={(e) => handleInputChange('avg_dollar_gen_pm', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring-cost">Recurring Cost (USD)</Label>
                <Input
                  id="recurring-cost"
                  type="number"
                  value={formData.recurring_cost_usd || ''}
                  onChange={(e) => handleInputChange('recurring_cost_usd', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="50"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Team Assignments */}
          <div className="space-y-4">
            <h4 className="font-medium">Team Assignments</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Account Manager</Label>
                <Select
                  value={formData.assigned_account_manager_id || 'unassigned'}
                  onValueChange={(value) => handleInputChange('assigned_account_manager_id', value === 'unassigned' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {accountManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inbox Manager</Label>
                <Select
                  value={formData.assigned_inbox_manager_id || 'unassigned'}
                  onValueChange={(value) => handleInputChange('assigned_inbox_manager_id', value === 'unassigned' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select inbox manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {inboxManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}