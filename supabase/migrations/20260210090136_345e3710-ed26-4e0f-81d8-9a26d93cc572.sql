
ALTER TABLE public.clients ADD COLUMN monthly_booking_goal numeric DEFAULT NULL;

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

UPDATE public.clients SET closelix = true, monthly_booking_goal = NULL WHERE client_code IN ('BLAST','PDM','ATK','AIM','FMM','QAD','TEA');
