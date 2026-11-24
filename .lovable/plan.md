# Internal notification setting

## What will change
- Add a `send_internal_notification` boolean to each client, stored on `public.clients`.
- Default it on for currently active clients whose relationship type is CLOSELIX or contains DFY or DWY; current labels include CLOSELIX, HYPERKE DFY, and PARTNERSHIP DWY.
- Apply the same default to newly inserted matching active clients in the database. Run this only on creation so a later manual opt-out is never switched back on by an edit.
- Add a clearly labeled switch in the existing client edit dialog’s Comms tab. Existing non-matching clients remain off by default.

## Implementation and verification
- Use a Supabase migration to add the field, backfill qualifying active clients, and install the insert-only default rule.
- Update the client types and edit form so the value loads, saves, and remains in sync with the table after edits.
- Verify the database values and trigger rule, then check the switch in the running dashboard.
