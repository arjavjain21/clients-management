

# Plan: Add Monthly Booking Goals Column

## Overview
Add a configurable "Monthly Booking Goal" field to each client, stored in the database and editable from the admin portal. The field supports two types of values:
- **Numeric targets** (e.g., 15, 25, 50 appointments per month)
- **Closelix** flag (already exists as a boolean column in the DB)

## Data Analysis

Looking at the provided data, the "Feb Target" column maps to either:
1. A number (the monthly goal) -- e.g., TTK: 15, EM: 25, MBM-sales: 35
2. "closelix" -- a special flag indicating the Closelix bonus criteria

The database already has a `closelix` boolean column on the `clients` table. We will **reuse** that column for the closelix flag and add a new `monthly_booking_goal` numeric column for the numeric targets.

## Database Changes

### New Column
- **Column:** `monthly_booking_goal` (numeric, nullable, default NULL) on `clients` table
- Stores the numeric monthly appointment/response target

### Initial Data Population

| Client Code | monthly_booking_goal | closelix |
|-------------|---------------------|----------|
| TTK | 15 | false |
| EM | 25 | false |
| MBM-sales | 35 | false |
| 270M | 12 | false |
| LN | 20 | false |
| BLAST | NULL | true |
| PDM | NULL | true |
| ATK | NULL | true |
| AIM | NULL | true |
| FMM | NULL | true |
| GS | 15 | false |
| PRS | 30 | false |
| ALM | 50 | false |
| V8 | 50 | false |
| INT | 20 | false |
| ECA | 15 | false |
| SEM | 75 | false |
| AMZ | 10 | false |
| RDIG | 5 | false |
| FD | 8 | false |
| HYPERKE | 150 | false |
| OYO | 20 | false |
| 4SPOT | 10 | false |
| QAD | NULL | true |
| HHK | 30 | false |
| MSP | 5 | false |
| TEA | NULL | true |

Note: Clients with "closelix" get their `closelix` boolean set to `true` and no numeric goal. Clients with numeric targets get the number stored and `closelix` set to `false`.

## Frontend Changes

### 1. Type Definitions (`src/types/database.ts`)
- Add `monthly_booking_goal?: number | null` to `Client` interface
- Add `monthly_booking_goal?: number | null` to `ClientUpdateData` interface

### 2. Clients Table (`src/components/clients/ClientsTable.tsx`)
- Add a new sortable "Monthly Goal" column
- Display: numeric value if set, "Closelix" badge if closelix=true, or dash if neither

### 3. Client Edit Dialog (`src/components/clients/ClientEditDialog.tsx`)
- Add a "Monthly Booking Goal" section with a toggle between "Numeric Target" and "Closelix"
- When "Numeric Target" is selected: show a number input
- When "Closelix" is selected: set the closelix boolean flag, clear the numeric goal
- Include `monthly_booking_goal` and `closelix` in form data, normalization, and save logic

### 4. Filters (`src/components/clients/ClientsFilters.tsx`)
- Not adding a filter for now (can be added later if needed)

## Technical Details

### Migration SQL
```text
-- Add monthly_booking_goal column
ALTER TABLE public.clients ADD COLUMN monthly_booking_goal numeric DEFAULT NULL;

-- Set numeric targets
UPDATE public.clients SET monthly_booking_goal = 15, closelix = false WHERE client_code = 'TTK';
UPDATE public.clients SET monthly_booking_goal = 25, closelix = false WHERE client_code = 'EM';
UPDATE public.clients SET monthly_booking_goal = 35, closelix = false WHERE client_code = 'MBM-sales';
UPDATE public.clients SET monthly_booking_goal = 12, closelix = false WHERE client_code = '270M';
UPDATE public.clients SET monthly_booking_goal = 20, closelix = false WHERE client_code = 'LN';
UPDATE public.clients SET monthly_booking_goal = 15, closelix = false WHERE client_code = 'GS';
UPDATE public.clients SET monthly_booking_goal = 30, closelix = false WHERE client_code = 'PRS';
UPDATE public.clients SET monthly_booking_goal = 50, closelix = false WHERE client_code = 'ALM';
UPDATE public.clients SET monthly_booking_goal = 50, closelix = false WHERE client_code = 'V8';
UPDATE public.clients SET monthly_booking_goal = 20, closelix = false WHERE client_code = 'INT';
UPDATE public.clients SET monthly_booking_goal = 15, closelix = false WHERE client_code = 'ECA';
UPDATE public.clients SET monthly_booking_goal = 75, closelix = false WHERE client_code = 'SEM';
UPDATE public.clients SET monthly_booking_goal = 10, closelix = false WHERE client_code = 'AMZ';
UPDATE public.clients SET monthly_booking_goal = 5, closelix = false WHERE client_code = 'RDIG';
UPDATE public.clients SET monthly_booking_goal = 8, closelix = false WHERE client_code = 'FD';
UPDATE public.clients SET monthly_booking_goal = 150, closelix = false WHERE client_code = 'HYPERKE';
UPDATE public.clients SET monthly_booking_goal = 20, closelix = false WHERE client_code = 'OYO';
UPDATE public.clients SET monthly_booking_goal = 10, closelix = false WHERE client_code = '4SPOT';
UPDATE public.clients SET monthly_booking_goal = 30, closelix = false WHERE client_code = 'HHK';
UPDATE public.clients SET monthly_booking_goal = 5, closelix = false WHERE client_code = 'MSP';

-- Set closelix clients (clear any numeric goal, set closelix flag)
UPDATE public.clients SET closelix = true, monthly_booking_goal = NULL WHERE client_code IN ('BLAST','PDM','ATK','AIM','FMM','QAD','TEA');
```

### Edit Dialog UI
The Monthly Booking Goal section will use a toggle pattern (similar to the existing Weekly Target):
- Two toggle buttons: "Numeric Target" and "Closelix"
- Numeric mode: shows a number input for the monthly goal
- Closelix mode: sets the closelix boolean, displays explanation text about the $25 bonus criteria

### Table Column Display
```text
-- If closelix is true: show a "Closelix" badge
-- If monthly_booking_goal has a value: show the number
-- Otherwise: show "—"
```

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add column + populate data |
| `src/types/database.ts` | Add `monthly_booking_goal` to interfaces |
| `src/components/clients/ClientsTable.tsx` | Add sortable "Monthly Goal" column |
| `src/components/clients/ClientEditDialog.tsx` | Add editable toggle + input field |

