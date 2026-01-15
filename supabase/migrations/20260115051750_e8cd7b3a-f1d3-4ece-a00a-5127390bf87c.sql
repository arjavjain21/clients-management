-- Step 1: Alter weekly_target from NUMERIC to TEXT
ALTER TABLE public.clients
  ALTER COLUMN weekly_target TYPE TEXT USING weekly_target::TEXT;

-- Step 2: Add weekly_target_launch_date column for structured date storage
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS weekly_target_launch_date DATE;

-- Step 3: Import CSV data by matching client_code
-- Format: numeric values stored as text, launch dates parsed

-- 270M: 2500
UPDATE public.clients SET weekly_target = '2500' WHERE client_code = '270M';

-- AIM: Launch 14th Jan -> store text and parse date (2026-01-14)
UPDATE public.clients SET weekly_target = 'Launch 14th Jan', weekly_target_launch_date = '2026-01-14' WHERE client_code = 'AIM';

-- ALM: 10000
UPDATE public.clients SET weekly_target = '10000' WHERE client_code = 'ALM';

-- AMZ: 7000
UPDATE public.clients SET weekly_target = '7000' WHERE client_code = 'AMZ';

-- ATK: 1300
UPDATE public.clients SET weekly_target = '1300' WHERE client_code = 'ATK';

-- BLAST: 1250
UPDATE public.clients SET weekly_target = '1250' WHERE client_code = 'BLAST';

-- DG: 1250
UPDATE public.clients SET weekly_target = '1250' WHERE client_code = 'DG';

-- ECA: 11000
UPDATE public.clients SET weekly_target = '11000' WHERE client_code = 'ECA';

-- EM: 5000
UPDATE public.clients SET weekly_target = '5000' WHERE client_code = 'EM';

-- FD: 2700
UPDATE public.clients SET weekly_target = '2700' WHERE client_code = 'FD';

-- FMM: 1250
UPDATE public.clients SET weekly_target = '1250' WHERE client_code = 'FMM';

-- GS: 4000
UPDATE public.clients SET weekly_target = '4000' WHERE client_code = 'GS';

-- HB: Not in DB - skip

-- HHK: 1000
UPDATE public.clients SET weekly_target = '1000' WHERE client_code = 'HHK';

-- HYPERKE: 25000
UPDATE public.clients SET weekly_target = '25000' WHERE client_code = 'HYPERKE';

-- INT: 4000
UPDATE public.clients SET weekly_target = '4000' WHERE client_code = 'INT';

-- LN: 3500
UPDATE public.clients SET weekly_target = '3500' WHERE client_code = 'LN';

-- MBM-Sales(Closeshark): Not in DB - skip

-- MSP: 2500 (extract number, ignore note)
UPDATE public.clients SET weekly_target = '2500' WHERE client_code = 'MSP';

-- NAB: 3500
UPDATE public.clients SET weekly_target = '3500' WHERE client_code = 'NAB';

-- PDM: 1250
UPDATE public.clients SET weekly_target = '1250' WHERE client_code = 'PDM';

-- PRS: 10000
UPDATE public.clients SET weekly_target = '10000' WHERE client_code = 'PRS';

-- RDIG: Launch 15th Jan -> store text and parse date (2026-01-15)
UPDATE public.clients SET weekly_target = 'Launch 15th Jan', weekly_target_launch_date = '2026-01-15' WHERE client_code = 'RDIG';

-- SEM: 25000
UPDATE public.clients SET weekly_target = '25000' WHERE client_code = 'SEM';

-- TEA: 0
UPDATE public.clients SET weekly_target = '0' WHERE client_code = 'TEA';

-- TTK: 2500
UPDATE public.clients SET weekly_target = '2500' WHERE client_code = 'TTK';

-- V8-prohibited: Not in DB - skip