ALTER TABLE IF EXISTS public.roles
  ADD COLUMN IF NOT EXISTS has_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dashboard_route TEXT;

UPDATE public.roles
SET has_dashboard = TRUE,
    dashboard_route = '/dashboard'
WHERE LOWER(name) = 'patient';

UPDATE public.roles
SET has_dashboard = TRUE,
    dashboard_route = '/doctor/dashboard'
WHERE LOWER(name) = 'doctor';

UPDATE public.roles
SET has_dashboard = TRUE,
    dashboard_route = '/pharmacy/dashboard'
WHERE LOWER(name) = 'pharmacist';

UPDATE public.roles
SET has_dashboard = TRUE,
    dashboard_route = '/superadmin/dashboard'
WHERE LOWER(name) = 'superadmin';
