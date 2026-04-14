-- Demo / QA seed for Neon: clinical rows + sample pharmacies/orders so
-- GET /api/clinical/platform-stats and local UI have non-zero counts.
--
-- Prerequisites: migrations 018–022 applied; auth.users populated.
--
-- Safety:
--   • Inserts clinical data ONLY if all three are empty: prescriptions,
--     teleconsultations, doctor_patient_connections (skips if any row exists).
--   • Inserts pharmacies ONLY if public.pharmacies has no rows.
--   • Inserts orders ONLY if public.orders has no rows.
--
-- Re-run: TRUNCATE the tables you want to refill (respect FKs), then execute again.
-- Example (dev only):
--   TRUNCATE public.prescriptions, public.teleconsultations, public.doctor_patient_connections RESTART IDENTITY CASCADE;
--   TRUNCATE public.orders RESTART IDENTITY CASCADE;
--   DELETE FROM public.pharmacies WHERE TRUE;  -- only if no FKs point here
--
-- Apply (Neon SQL editor or psql):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/seeds/seed_clinical_platform_demo.sql

BEGIN;

DO $$
DECLARE
  v_doctor   uuid;
  v_patient  uuid;
  v_tenant   uuid;
  v_member   uuid;
BEGIN
  SELECT u.id
    INTO v_doctor
  FROM auth.users u
  WHERE lower(trim(coalesce(u.role::text, ''))) = 'doctor'
  ORDER BY u.created_at NULLS LAST
  LIMIT 1;

  SELECT u.id
    INTO v_patient
  FROM auth.users u
  WHERE lower(trim(coalesce(u.role::text, ''))) = 'patient'
  ORDER BY u.created_at NULLS LAST
  LIMIT 1;

  IF v_patient IS NULL AND v_doctor IS NOT NULL THEN
    SELECT u.id
      INTO v_patient
    FROM auth.users u
    WHERE lower(trim(coalesce(u.role::text, ''))) = 'doctor'
      AND u.id <> v_doctor
    ORDER BY u.created_at NULLS LAST
    LIMIT 1;
  END IF;

  IF v_doctor IS NULL OR v_patient IS NULL THEN
    RAISE NOTICE 'seed_clinical_platform_demo: need at least one doctor and a second user (patient or another doctor). Skipping clinical inserts.';
  ELSIF EXISTS (SELECT 1 FROM public.prescriptions LIMIT 1)
     OR EXISTS (SELECT 1 FROM public.teleconsultations LIMIT 1)
     OR EXISTS (SELECT 1 FROM public.doctor_patient_connections LIMIT 1)
  THEN
    RAISE NOTICE 'seed_clinical_platform_demo: clinical tables already have rows — skipping clinical inserts. Truncate them to re-seed.';
  ELSE
    SELECT ut.tenant_id, ut.id
      INTO v_tenant, v_member
    FROM public.user_tenants ut
    WHERE ut.user_id = v_doctor
      AND coalesce(ut.is_active, true)
      AND lower(trim(coalesce(ut.status::text, ''))) = 'active'
    ORDER BY ut.is_primary DESC NULLS LAST, ut.created_at ASC NULLS LAST
    LIMIT 1;

    INSERT INTO public.doctor_patient_connections (
      doctor_id, patient_id, status, professional_tenant_id, created_by_membership_id
    ) VALUES (
      v_doctor, v_patient, 'accepted', v_tenant, v_member
    );

    INSERT INTO public.prescriptions (
      doctor_id, patient_id, medication_name, dosage, frequency, duration, notes, status,
      professional_tenant_id, created_by_membership_id
    ) VALUES
      (v_doctor, v_patient, 'Acetylsalicylic acid', '75 mg', 'once daily', 'ongoing',
       'Seed demo — hypertension prophylaxis', 'active', v_tenant, v_member),
      (v_doctor, v_patient, 'Vitamin D3', '1000 IU', 'once daily', '90 days',
       'Seed demo', 'draft', v_tenant, v_member);

    INSERT INTO public.teleconsultations (
      patient_id, doctor_id, start_time, end_time, status, reason, room_id,
      professional_tenant_id, created_by_membership_id
    ) VALUES
      (v_patient, v_doctor, now() + interval '2 days', now() + interval '2 days' + interval '45 minutes',
       'pending', 'Seed demo — follow-up', 'seed-room-1', v_tenant, v_member),
      (v_patient, v_doctor, now() + interval '5 days', now() + interval '5 days' + interval '30 minutes',
       'confirmed', 'Seed demo — annual check-in', 'seed-room-2', v_tenant, v_member);

    RAISE NOTICE 'seed_clinical_platform_demo: inserted connections, prescriptions, teleconsultations for doctor % and patient %.', v_doctor, v_patient;
  END IF;
END $$;

DO $$
DECLARE
  v_buyer            uuid;
  v_has_city         boolean;
  v_has_addr         boolean;
  v_addr_json        boolean;
  v_has_country_code boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM public.pharmacies LIMIT 1) THEN
    RAISE NOTICE 'seed_clinical_platform_demo: pharmacies not empty — skipping pharmacy seed.';
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = 'pharmacies' AND c.column_name = 'city'
    ) INTO v_has_city;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = 'pharmacies' AND c.column_name = 'address'
    ) INTO v_has_addr;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = 'pharmacies' AND c.column_name = 'address'
        AND (
          c.data_type IN ('json', 'jsonb')
          OR c.udt_name IN ('json', 'jsonb')
        )
    ) INTO v_addr_json;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = 'pharmacies' AND lower(c.column_name) = 'country_code'
    ) INTO v_has_country_code;

    -- public.pharmacies: legacy = flat TEXT address + city; some Neon schemas use JSON/JSONB for `address`.
    IF v_has_city AND v_has_addr AND v_addr_json THEN
      IF v_has_country_code THEN
        INSERT INTO public.pharmacies (name, address, city, postal_code, phone, hours, endorsed, country_code)
        VALUES
          (
            'Lëtzebuerg Demo Apdikt',
            jsonb_build_object(
              'line1', '12 Rue de la Gare',
              'city', 'Luxembourg',
              'postal_code', 'L-1234',
              'country_code', 'LU'
            ),
            'Luxembourg',
            'L-1234',
            '+352 0000 0001',
            '08:00–19:00',
            true,
            'LU'
          ),
          (
            'Seed Mediplus Pharmacy',
            jsonb_build_object(
              'line1', '1 Plateau Saint Esprit',
              'city', 'Luxembourg',
              'postal_code', 'L-2345',
              'country_code', 'LU'
            ),
            'Luxembourg',
            'L-2345',
            '+352 0000 0002',
            '09:00–20:00',
            true,
            'LU'
          ),
          (
            'Seed Local Pharmacy (not endorsed)',
            jsonb_build_object(
              'line1', '5 Main Street',
              'city', 'Differdange',
              'postal_code', 'L-3456',
              'country_code', 'LU'
            ),
            'Differdange',
            'L-3456',
            '+352 0000 0003',
            '09:00–18:00',
            false,
            'LU'
          );
      ELSE
        INSERT INTO public.pharmacies (name, address, city, postal_code, phone, hours, endorsed)
        VALUES
          (
            'Lëtzebuerg Demo Apdikt',
            jsonb_build_object(
              'line1', '12 Rue de la Gare',
              'city', 'Luxembourg',
              'postal_code', 'L-1234'
            ),
            'Luxembourg',
            'L-1234',
            '+352 0000 0001',
            '08:00–19:00',
            true
          ),
          (
            'Seed Mediplus Pharmacy',
            jsonb_build_object(
              'line1', '1 Plateau Saint Esprit',
              'city', 'Luxembourg',
              'postal_code', 'L-2345'
            ),
            'Luxembourg',
            'L-2345',
            '+352 0000 0002',
            '09:00–20:00',
            true
          ),
          (
            'Seed Local Pharmacy (not endorsed)',
            jsonb_build_object(
              'line1', '5 Main Street',
              'city', 'Differdange',
              'postal_code', 'L-3456'
            ),
            'Differdange',
            'L-3456',
            '+352 0000 0003',
            '09:00–18:00',
            false
          );
      END IF;
    ELSIF v_has_city AND v_has_addr AND NOT v_addr_json THEN
      IF v_has_country_code THEN
        INSERT INTO public.pharmacies (name, address, city, postal_code, phone, hours, endorsed, country_code)
        VALUES
          ('Lëtzebuerg Demo Apdikt', '12 Rue de la Gare', 'Luxembourg', 'L-1234', '+352 0000 0001', '08:00–19:00', true, 'LU'),
          ('Seed Mediplus Pharmacy', '1 Plateau Saint Esprit', 'Luxembourg', 'L-2345', '+352 0000 0002', '09:00–20:00', true, 'LU'),
          ('Seed Local Pharmacy (not endorsed)', '5 Main Street', 'Differdange', 'L-3456', '+352 0000 0003', '09:00–18:00', false, 'LU');
      ELSE
        INSERT INTO public.pharmacies (name, address, city, postal_code, phone, hours, endorsed)
        VALUES
          ('Lëtzebuerg Demo Apdikt', '12 Rue de la Gare', 'Luxembourg', 'L-1234', '+352 0000 0001', '08:00–19:00', true),
          ('Seed Mediplus Pharmacy', '1 Plateau Saint Esprit', 'Luxembourg', 'L-2345', '+352 0000 0002', '09:00–20:00', true),
          ('Seed Local Pharmacy (not endorsed)', '5 Main Street', 'Differdange', 'L-3456', '+352 0000 0003', '09:00–18:00', false);
      END IF;
    ELSIF v_has_addr AND v_addr_json AND NOT v_has_city THEN
      IF v_has_country_code THEN
        INSERT INTO public.pharmacies (name, address, endorsed, country_code)
        VALUES
          (
            'Lëtzebuerg Demo Apdikt',
            jsonb_build_object(
              'line1', '12 Rue de la Gare',
              'city', 'Luxembourg',
              'postal_code', 'L-1234',
              'country_code', 'LU'
            ),
            true,
            'LU'
          ),
          (
            'Seed Mediplus Pharmacy',
            jsonb_build_object(
              'line1', '1 Plateau Saint Esprit',
              'city', 'Luxembourg',
              'postal_code', 'L-2345',
              'country_code', 'LU'
            ),
            true,
            'LU'
          ),
          (
            'Seed Local Pharmacy (not endorsed)',
            jsonb_build_object(
              'line1', '5 Main Street',
              'city', 'Differdange',
              'postal_code', 'L-3456',
              'country_code', 'LU'
            ),
            false,
            'LU'
          );
      ELSE
        INSERT INTO public.pharmacies (name, address, endorsed)
        VALUES
          (
            'Lëtzebuerg Demo Apdikt',
            jsonb_build_object(
              'line1', '12 Rue de la Gare',
              'city', 'Luxembourg',
              'postal_code', 'L-1234'
            ),
            true
          ),
          (
            'Seed Mediplus Pharmacy',
            jsonb_build_object(
              'line1', '1 Plateau Saint Esprit',
              'city', 'Luxembourg',
              'postal_code', 'L-2345'
            ),
            true
          ),
          (
            'Seed Local Pharmacy (not endorsed)',
            jsonb_build_object(
              'line1', '5 Main Street',
              'city', 'Differdange',
              'postal_code', 'L-3456'
            ),
            false
          );
      END IF;
    ELSIF v_has_addr AND NOT v_addr_json AND NOT v_has_city THEN
      IF v_has_country_code THEN
        INSERT INTO public.pharmacies (name, address, endorsed, country_code)
        VALUES
          ('Lëtzebuerg Demo Apdikt', '12 Rue de la Gare, Luxembourg L-1234', true, 'LU'),
          ('Seed Mediplus Pharmacy', '1 Plateau Saint Esprit, Luxembourg L-2345', true, 'LU'),
          ('Seed Local Pharmacy (not endorsed)', '5 Main Street, Differdange L-3456', false, 'LU');
      ELSE
        INSERT INTO public.pharmacies (name, address, endorsed)
        VALUES
          ('Lëtzebuerg Demo Apdikt', '12 Rue de la Gare, Luxembourg L-1234', true),
          ('Seed Mediplus Pharmacy', '1 Plateau Saint Esprit, Luxembourg L-2345', true),
          ('Seed Local Pharmacy (not endorsed)', '5 Main Street, Differdange L-3456', false);
      END IF;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = 'pharmacies' AND c.column_name = 'endorsed'
    ) THEN
      IF v_has_country_code THEN
        INSERT INTO public.pharmacies (name, endorsed, country_code)
        VALUES
          ('Lëtzebuerg Demo Apdikt', true, 'LU'),
          ('Seed Mediplus Pharmacy', true, 'LU'),
          ('Seed Local Pharmacy (not endorsed)', false, 'LU');
      ELSE
        INSERT INTO public.pharmacies (name, endorsed)
        VALUES
          ('Lëtzebuerg Demo Apdikt', true),
          ('Seed Mediplus Pharmacy', true),
          ('Seed Local Pharmacy (not endorsed)', false);
      END IF;
    ELSE
      IF v_has_country_code THEN
        INSERT INTO public.pharmacies (name, country_code)
        VALUES
          ('Lëtzebuerg Demo Apdikt', 'LU'),
          ('Seed Mediplus Pharmacy', 'LU'),
          ('Seed Local Pharmacy (not endorsed)', 'LU');
      ELSE
        INSERT INTO public.pharmacies (name)
        VALUES
          ('Lëtzebuerg Demo Apdikt'),
          ('Seed Mediplus Pharmacy'),
          ('Seed Local Pharmacy (not endorsed)');
      END IF;
      RAISE NOTICE 'seed_clinical_platform_demo: pharmacies have no endorsed column — platform-stats pharmacies_count may stay 0.';
    END IF;
    RAISE NOTICE 'seed_clinical_platform_demo: inserted 3 demo pharmacies.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.orders LIMIT 1) THEN
    RAISE NOTICE 'seed_clinical_platform_demo: orders not empty — skipping order seed.';
  ELSE
    SELECT u.id
      INTO v_buyer
    FROM auth.users u
    WHERE lower(trim(coalesce(u.role::text, ''))) <> 'doctor'
    ORDER BY u.created_at NULLS LAST
    LIMIT 1;

    IF v_buyer IS NULL THEN
      SELECT u.id INTO v_buyer FROM auth.users u ORDER BY u.created_at NULLS LAST LIMIT 1;
    END IF;

    IF v_buyer IS NULL THEN
      RAISE NOTICE 'seed_clinical_platform_demo: no auth.users row for orders — skipping order seed.';
    ELSE
      INSERT INTO public.orders (user_id, status, total)
      VALUES
        (v_buyer, 'delivered', 42.90),
        (v_buyer, 'pending', 19.50),
        (v_buyer, 'pending', 8.00);
      RAISE NOTICE 'seed_clinical_platform_demo: inserted 3 demo orders for user %.', v_buyer;
    END IF;
  END IF;
END $$;

COMMIT;
