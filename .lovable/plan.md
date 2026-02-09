
# Plan: Add Allocated Bonus Pool Column

## Overview
Add a new `bonus_pool_monthly` column to track the monthly reward pool allocation for each client. This will include database changes, initial data population, and frontend updates for viewing and editing.

---

## Database Changes

### 1. Add New Column
Add a `bonus_pool_monthly` column to the `clients` table:
- **Type:** `numeric` (to handle currency values)
- **Nullable:** Yes
- **Default:** `NULL`

### 2. Populate Initial Data
Insert the provided bonus pool values for existing clients:

| Client Code | Amount (USD) |
|-------------|--------------|
| V8 | $80 |
| MBM-sales | $40 |
| TEA | $80 |
| AMZ | $80 |
| PDM | $80 |
| DG | $80 |
| FMM | $80 |
| AIM | $80 |
| HB | $80 |
| NAB | $80 |
| BLAST | $80 |
| ECA | $80 |
| ATK | $100 |
| TTK | $150 |
| HHK | $180 |
| MSP | $200 |
| FD | $200 |
| 270M | $200 |
| INT | $250 |
| GS | $250 |
| PRS | $250 |
| EM | $250 |
| LN | $250 |
| RDIG | $250 |

---

## Frontend Changes

### 1. Type Definitions (`src/types/database.ts`)
- Add `bonus_pool_monthly?: number;` to the `Client` interface
- Add `bonus_pool_monthly?: number;` to the `ClientUpdateData` interface for editing

### 2. Clients Table (`src/components/clients/ClientsTable.tsx`)
- Add a new sortable "Bonus Pool" column
- Display the value formatted as currency (e.g., "$80")
- Show "—" for clients without a bonus pool set

### 3. Client Edit Dialog (`src/components/clients/ClientEditDialog.tsx`)
- Add a numeric input field for "Bonus Pool (Monthly)"
- Allow admin users to edit/update values
- Include in the form data initialization and save logic

### 4. Bulk Actions (Optional Enhancement)
- Add bulk update capability for bonus pool if multiple clients need the same value

---

## Technical Details

### Migration SQL
```text
-- Add the new column
ALTER TABLE public.clients 
ADD COLUMN bonus_pool_monthly numeric DEFAULT NULL;

-- Populate initial data
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'V8';
UPDATE public.clients SET bonus_pool_monthly = 40 WHERE client_code = 'MBM-sales';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'TEA';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'AMZ';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'PDM';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'DG';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'FMM';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'AIM';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'HB';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'NAB';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'BLAST';
UPDATE public.clients SET bonus_pool_monthly = 80 WHERE client_code = 'ECA';
UPDATE public.clients SET bonus_pool_monthly = 100 WHERE client_code = 'ATK';
UPDATE public.clients SET bonus_pool_monthly = 150 WHERE client_code = 'TTK';
UPDATE public.clients SET bonus_pool_monthly = 180 WHERE client_code = 'HHK';
UPDATE public.clients SET bonus_pool_monthly = 200 WHERE client_code = 'MSP';
UPDATE public.clients SET bonus_pool_monthly = 200 WHERE client_code = 'FD';
UPDATE public.clients SET bonus_pool_monthly = 200 WHERE client_code = '270M';
UPDATE public.clients SET bonus_pool_monthly = 250 WHERE client_code = 'INT';
UPDATE public.clients SET bonus_pool_monthly = 250 WHERE client_code = 'GS';
UPDATE public.clients SET bonus_pool_monthly = 250 WHERE client_code = 'PRS';
UPDATE public.clients SET bonus_pool_monthly = 250 WHERE client_code = 'EM';
UPDATE public.clients SET bonus_pool_monthly = 250 WHERE client_code = 'LN';
UPDATE public.clients SET bonus_pool_monthly = 250 WHERE client_code = 'RDIG';
```

### Edit Dialog Input Field
A numeric input will be added in the financial section:
```text
<div>
  <Label>Bonus Pool (Monthly)</Label>
  <Input
    type="number"
    placeholder="e.g. 80"
    value={formData.bonus_pool_monthly ?? ''}
    onChange={(e) => setFormData({ 
      ...formData, 
      bonus_pool_monthly: e.target.value ? parseFloat(e.target.value) : null 
    })}
  />
</div>
```

### Table Column Display
The bonus pool will be displayed as a formatted currency value:
```text
<TableCell>
  {client.bonus_pool_monthly != null 
    ? `$${client.bonus_pool_monthly.toLocaleString()}` 
    : <span className="text-muted-foreground">—</span>}
</TableCell>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add column + populate data |
| `src/types/database.ts` | Add `bonus_pool_monthly` to interfaces |
| `src/components/clients/ClientsTable.tsx` | Add sortable column |
| `src/components/clients/ClientEditDialog.tsx` | Add editable input field |

---

## Notes
- Client code "HB" doesn't currently exist in the database but the UPDATE statement will be harmless (0 rows affected) and will work when the client is added later
- The field is numeric to support decimal values if needed in the future
- Admins can freely edit/add values through the edit dialog
