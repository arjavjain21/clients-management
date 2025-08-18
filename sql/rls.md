# Row Level Security Policies

This file contains the SQL statements needed to set up Row Level Security (RLS) policies for the Clients Admin application.

## Important Notes

- Run these commands in your Supabase SQL Editor
- These policies should be applied AFTER the database schema is set up
- Make sure to test each policy after applying
- Some policies may already be applied - you can safely run them again (use CREATE OR REPLACE)

## Core Table Policies

### Clients Table
The main clients table needs policies for SELECT, INSERT, and UPDATE operations:

```sql
-- Enable RLS on clients table (may already be enabled)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all client records
CREATE POLICY "Authenticated users can read clients" 
ON clients FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert new clients (for imports)
CREATE POLICY "Authenticated users can insert clients" 
ON clients FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update client records
CREATE POLICY "Authenticated users can update clients" 
ON clients FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Note: DELETE is intentionally not allowed to prevent accidental data loss
```

### Team Members Table
Team members need read access and limited insert access:

```sql
-- Enable RLS on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all team members
CREATE POLICY "Authenticated users can read team members" 
ON team_members FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert new team members
CREATE POLICY "Authenticated users can insert team members" 
ON team_members FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Note: Updates to team members should be handled by admins only
-- You may want to restrict this further based on user roles
```

### Lookup Tables (Read-Only)
Relationship statuses and types should be read-only for most users:

```sql
-- Relationship Statuses
ALTER TABLE relationship_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read relationship statuses" 
ON relationship_statuses FOR SELECT 
TO authenticated 
USING (true);

-- Relationship Types  
ALTER TABLE relationship_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read relationship types" 
ON relationship_types FOR SELECT 
TO authenticated 
USING (true);
```

### Audit Tables (Read-Only)
Audit tables should be read-only since they're populated by triggers:

```sql
-- Clients Audit Status
ALTER TABLE clients_audit_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read status audit" 
ON clients_audit_status FOR SELECT 
TO authenticated 
USING (true);

-- Clients Audit Type
ALTER TABLE clients_audit_type ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read type audit" 
ON clients_audit_type FOR SELECT 
TO authenticated 
USING (true);

-- Clients Audit Assignment
ALTER TABLE clients_audit_assignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read assignment audit" 
ON clients_audit_assignment FOR SELECT 
TO authenticated 
USING (true);

-- Clients Audit Pricing
ALTER TABLE clients_audit_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pricing audit" 
ON clients_audit_pricing FOR SELECT 
TO authenticated 
USING (true);
```

### Staging Table (Read-Only)
The staging table should be read-only for users:

```sql
-- Note: The staging table may not have RLS enabled by default
-- Only enable if you want to restrict access

ALTER TABLE clients_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read staging data" 
ON clients_staging FOR SELECT 
TO authenticated 
USING (true);

-- Staging data inserts should typically be handled by admin processes
-- Uncomment if you want to allow authenticated users to insert:
-- CREATE POLICY "Authenticated users can insert staging data" 
-- ON clients_staging FOR INSERT 
-- TO authenticated 
-- WITH CHECK (true);
```

## Advanced Policies (Optional)

### Role-Based Access
If you want to implement role-based access, you can create more restrictive policies:

```sql
-- Example: Only allow account managers to update client assignments
-- First, you'd need a function to get the current user's role:

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM team_members 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Then use it in a policy:
CREATE POLICY "Only managers can update assignments"
ON clients FOR UPDATE
TO authenticated
USING (get_current_user_role() IN ('account_manager', 'inbox_manager'))
WITH CHECK (get_current_user_role() IN ('account_manager', 'inbox_manager'));
```

### Time-Based Restrictions
Example of time-based access (business hours only):

```sql
-- Example: Only allow updates during business hours
CREATE POLICY "Business hours updates only"
ON clients FOR UPDATE
TO authenticated
USING (
  EXTRACT(hour FROM NOW() AT TIME ZONE 'America/New_York') BETWEEN 9 AND 17
  AND EXTRACT(dow FROM NOW() AT TIME ZONE 'America/New_York') BETWEEN 1 AND 5
)
WITH CHECK (
  EXTRACT(hour FROM NOW() AT TIME ZONE 'America/New_York') BETWEEN 9 AND 17
  AND EXTRACT(dow FROM NOW() AT TIME ZONE 'America/New_York') BETWEEN 1 AND 5
);
```

## Testing Your Policies

After applying the policies, test them by:

1. **Testing as an authenticated user**:
   - Try reading clients data
   - Try updating a client record
   - Try accessing audit records

2. **Testing as an anonymous user** (should fail):
   - Try accessing any protected resource
   - Should receive authentication errors

3. **Testing edge cases**:
   - Very large queries
   - Bulk operations
   - Complex joins

## Troubleshooting RLS Issues

### Common Problems:

1. **"new row violates row-level security policy"**:
   - Check your INSERT/UPDATE policies
   - Ensure WITH CHECK conditions are correct
   - Verify the user has the required permissions

2. **"permission denied for table"**:
   - User might not be authenticated
   - Check if RLS is enabled on the table
   - Verify the policy covers the required operation

3. **Infinite recursion in policy**:
   - Avoid self-referential queries in policies
   - Use SECURITY DEFINER functions for complex logic

### Useful Queries for Debugging:

```sql
-- Check which policies are active on a table
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Test policy behavior
SET ROLE authenticated;
SELECT * FROM clients LIMIT 1;
RESET ROLE;
```

## Production Notes

1. **Performance**: RLS policies add overhead to queries. Monitor performance and add indexes as needed.

2. **Backup**: Always backup your database before applying new policies.

3. **Gradual rollout**: Consider applying policies to one table at a time in production.

4. **Monitoring**: Set up alerts for RLS policy violations to catch access issues early.

---

**Important**: These policies provide a secure baseline. Review and adjust based on your specific business requirements and security needs.