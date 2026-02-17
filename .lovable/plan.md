

# Plan: Simplify UI and Add Notes Field

## Overview
Two changes: (1) Redesign the clients table and edit dialog for a cleaner, more spacious layout, and (2) add a "Notes" text field to the database and frontend.

---

## Part 1: UI Simplification

### Clients Table - Declutter Columns
The table currently has 16 columns, making it very wide and cramped. We will:

- **Remove from the table** (still viewable/editable in the edit dialog): Email, Company, Weekend Sending, Booking Link
- **Shorten AM/IM/SDR columns**: Show only the name (drop the inline email display)
- **Result**: ~11 columns instead of 16, much more breathing room

**Columns kept in table:** Checkbox | Code | Name | Status | Type | AM | IM | SDR | Weekly Target | Monthly Goal | Bonus Pool | Last Updated | Actions

### Edit Dialog - Organized Sections with Tabs
The edit dialog currently dumps ~20+ fields in a single scrolling list. We will reorganize into **tabbed sections**:

- **General** tab: Client Code (read-only), Name (read-only), Primary Email, Company Name, Website, Phone, Booking Link
- **Relationship** tab: Status, Type, Weekend Sending
- **Assignments** tab: Account Manager, Inbox Manager, SDR, Round Robin button
- **Targets & Financials** tab: Weekly Target (with mode toggle), Monthly Booking Goal (with Closelix toggle), Bonus Pool
- **Communications** tab: Correspondence Emails, Correspondence Categories
- **Notes** tab: Free-text notes field (new)

This uses the existing Radix `Tabs` component already installed in the project.

### Additional polish
- Increase dialog width from `max-w-2xl` to `max-w-3xl` for more space
- Add subtle section dividers and consistent spacing within each tab
- Use compact 2-column grids where fields are short (status/type, AM/IM)

---

## Part 2: Add Notes Field

### Database
- Add a `notes` column to `public.clients`: type `text`, nullable, no character limit
- Text type is appropriate here since this is admin-only and we do not need to enforce a hard limit. A soft limit of 5000 characters will be enforced on the frontend with a character counter, which is generous for operational notes.

### Frontend
- Add a `Textarea` component in the new **Notes** tab of the edit dialog
- Show a character counter (e.g., "245 / 5000") as a soft guide
- Include `notes` in form data initialization, normalization, and save logic
- Add `notes` to the `Client` and `ClientUpdateData` type interfaces

### Table
- Notes will NOT be shown as a table column (too long for a table cell)
- Instead, show a small icon/indicator in the Actions column if a note exists (e.g., a small note icon)

---

## Technical Details

### Migration SQL
```text
ALTER TABLE public.clients ADD COLUMN notes text DEFAULT NULL;
```

### Type Changes (`src/types/database.ts`)
- `Client` interface: add `notes?: string | null`
- `ClientUpdateData` interface: add `notes?: string | null`

### Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `notes` column |
| `src/types/database.ts` | Add `notes` to interfaces |
| `src/components/clients/ClientsTable.tsx` | Remove cramped columns (email, company, weekend), shorten AM/IM/SDR display, add note indicator icon |
| `src/components/clients/ClientEditDialog.tsx` | Reorganize into tabbed layout with 6 tabs, add Notes tab with Textarea + character counter, widen dialog |

### Edit Dialog Tab Structure
```text
+----------+---------------+-------------+---------------------+------------------+-------+
| General  | Relationship  | Assignments | Targets & Financials| Communications   | Notes |
+----------+---------------+-------------+---------------------+------------------+-------+
|                                                                                         |
|  (Tab content area -- only one tab visible at a time)                                   |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

### Notes Tab UI
- Full-width `Textarea` with 6 rows minimum height
- Placeholder: "Add notes about this client..."
- Character counter below: "0 / 5,000" in muted text
- No hard enforcement -- just a visual guide

