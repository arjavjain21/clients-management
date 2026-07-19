-- Point-in-time "active as of date" resolver using status audit history.
-- Returns client_codes that were ACTIVE on the given calendar date (UTC).
CREATE OR REPLACE FUNCTION public.clients_active_on(p_date date)
RETURNS TABLE(client_code text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH resolved AS (
    SELECT
      c.client_code,
      c.client_id,
      c.exit_date,
      c.created_at,
      -- Effective status on p_date:
      -- 1) latest audit with changed_at <= end-of-day(p_date)
      -- 2) else old_status of earliest audit AFTER p_date (the status it held before that change)
      -- 3) else current relationship_status (never changed)
      COALESCE(
        (SELECT a.new_status
           FROM public.clients_audit_status a
          WHERE a.client_code = c.client_code
            AND a.client_id   = c.client_id
            AND a.changed_at <= (p_date + INTERVAL '1 day')
          ORDER BY a.changed_at DESC
          LIMIT 1),
        (SELECT a.old_status
           FROM public.clients_audit_status a
          WHERE a.client_code = c.client_code
            AND a.client_id   = c.client_id
            AND a.changed_at >  (p_date + INTERVAL '1 day')
          ORDER BY a.changed_at ASC
          LIMIT 1),
        c.relationship_status
      ) AS status_on_date
    FROM public.clients c
  )
  SELECT r.client_code
  FROM resolved r
  WHERE r.created_at::date <= p_date
    AND (r.exit_date IS NULL OR r.exit_date > p_date)
    AND (
      r.status_on_date IS NULL
      OR upper(r.status_on_date) NOT IN ('PAUSED','CANCELLED','INACTIVE','CLOSED','EXITED','CHURNED')
    );
$$;

GRANT EXECUTE ON FUNCTION public.clients_active_on(date) TO authenticated, service_role;