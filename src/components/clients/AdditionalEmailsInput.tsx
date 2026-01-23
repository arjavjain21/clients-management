import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdditionalEmailsInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}

export function AdditionalEmailsInput({ emails, onChange, disabled }: AdditionalEmailsInputProps) {
  const [newEmail, setNewEmail] = useState('');

  const addEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (trimmed && !emails.includes(trimmed) && isValidEmail(trimmed)) {
      onChange([...emails, trimmed]);
      setNewEmail('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(emails.filter(e => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  };

  return (
    <div className="space-y-2">
      {/* Existing emails */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emails.map((email) => (
            <Badge key={email} variant="secondary" className="pr-1 flex items-center gap-1">
              {email}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeEmail(email)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Add new email */}
      {!disabled && (
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Add email address..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmail}
            disabled={!newEmail.trim() || !isValidEmail(newEmail.trim())}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {emails.length === 0 && disabled && (
        <span className="text-muted-foreground text-sm">No additional emails</span>
      )}
    </div>
  );
}
