import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'positives', label: 'Positives' },
] as const;

interface CorrespondenceCategoriesInputProps {
  categories: string[];
  onChange: (categories: string[]) => void;
}

export function CorrespondenceCategoriesInput({
  categories,
  onChange,
}: CorrespondenceCategoriesInputProps) {
  const handleToggle = (value: string) => {
    if (categories.includes(value)) {
      onChange(categories.filter((c) => c !== value));
    } else {
      onChange([...categories, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(categories.filter((c) => c !== value));
  };

  const selectedLabels = CATEGORIES.filter((cat) => categories.includes(cat.value));

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start font-normal h-auto min-h-10"
          >
            {selectedLabels.length === 0 ? (
              <span className="text-muted-foreground">Select categories...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedLabels.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant="secondary"
                    className="mr-1"
                  >
                    {cat.label}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(cat.value);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-3" align="start">
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${cat.value}`}
                  checked={categories.includes(cat.value)}
                  onCheckedChange={() => handleToggle(cat.value)}
                />
                <Label
                  htmlFor={`category-${cat.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {cat.label}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
