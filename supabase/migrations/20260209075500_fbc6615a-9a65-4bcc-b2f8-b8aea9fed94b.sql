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