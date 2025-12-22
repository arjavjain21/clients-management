-- Insert PAUSED status into relationship_statuses
INSERT INTO public.relationship_statuses (name)
VALUES ('PAUSED')
ON CONFLICT (name) DO NOTHING;