import React from 'react';
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

  return (
    <div className="flex flex-wrap gap-4">
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
  );
}
