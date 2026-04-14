-- =============================================================================
-- DEV / TEST RESET — keep subscription catalog (+ RBAC + bank holidays), wipe the rest
-- =============================================================================
-- Preserved (no TRUNCATE):
--   Subscription catalog: public.features, public.services, public.plans,
--     public.plan_features, public.plan_services
--   RBAC: public.roles, public.role_categories, public.role_category_assignments,
--     public.permissions, public.role_permissions
--   Reference: public.bank_holidays  (edit preserve[] in the procedure to clear)
--
-- Not preserved (user data; cleared with auth.users): public.user_permissions
--
-- Why chunked TRUNCATE … CASCADE still failed on Neon:
--   CASCADE expands inside ONE statement → hundreds of relation locks →
--   "out of shared memory" / max_locks_per_transaction.
--
-- Strategy:
--   1) COMMIT after each DROP SCHEMA tenant_* (many schemas in one txn also hoards locks).
--   2) Truncate only heap relations (pg_class.relkind = 'r'), one table per COMMIT,
--      WITHOUT CASCADE when possible, in an order safe for FKs among the truncate set.
--      Partitioned parents (relkind 'p') are skipped until the end; data lives in
--      partition children ('r' + relispartition), each truncated separately.
--   3) Retry with CASCADE only when plain TRUNCATE fails (self-FK, odd edge).
--   4) If the graph has a cycle, one table TRUNCATE … CASCADE (last resort).
--
-- Apply (psql; default autocommit ON — do not wrap the whole file in BEGIN):
--   cd backend && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/dev_reset_keep_subscription_catalog.sql
-- =============================================================================

CREATE OR REPLACE PROCEDURE dev_reset_keep_subscription_catalog_run()
LANGUAGE plpgsql
AS $$
DECLARE
  preserve CONSTANT TEXT[] := ARRAY[
    'public.features',
    'public.services',
    'public.plans',
    'public.plan_features',
    'public.plan_services',
    'public.roles',
    'public.role_categories',
    'public.role_category_assignments',
    'public.permissions',
    'public.role_permissions',
    'public.bank_holidays'
  ];
  r RECORD;
  pick_oid OID;
  pick_nsp NAME;
  pick_rel NAME;
  iter INT := 0;
  max_iter INT := 5000;
BEGIN
  -- -------------------------------------------------------------------------
  -- 1) One COMMIT per tenant schema
  -- -------------------------------------------------------------------------
  FOR r IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname ~ '^tenant_'
    ORDER BY nspname
  LOOP
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', r.nspname);
    RAISE NOTICE 'Dropped schema %', r.nspname;
    COMMIT;
  END LOOP;

  CREATE TEMP TABLE IF NOT EXISTS _dev_reset_targets (
    oid OID PRIMARY KEY,
    nsp NAME NOT NULL,
    rel NAME NOT NULL
  ) ON COMMIT PRESERVE ROWS;

  <<phases>>
  FOR phase IN 1..2 LOOP
    TRUNCATE _dev_reset_targets;

    IF phase = 1 THEN
      INSERT INTO _dev_reset_targets (oid, nsp, rel)
      SELECT c.oid, n.nspname, c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname IN ('public', 'auth')
        AND c.relkind = 'r'
        AND (n.nspname || '.' || c.relname) <> ALL (preserve);
    ELSE
      INSERT INTO _dev_reset_targets (oid, nsp, rel)
      SELECT c.oid, n.nspname, c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname IN ('public', 'auth')
        AND c.relkind = 'p'
        AND (n.nspname || '.' || c.relname) <> ALL (preserve);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM _dev_reset_targets) THEN
      CONTINUE;
    END IF;

    iter := 0;
    WHILE EXISTS (SELECT 1 FROM _dev_reset_targets) LOOP
      iter := iter + 1;
      IF iter > max_iter THEN
        RAISE EXCEPTION 'dev_reset phase %: exceeded % iterations (possible FK cycle)', phase, max_iter;
      END IF;

      SELECT t.oid, t.nsp, t.rel
      INTO pick_oid, pick_nsp, pick_rel
      FROM _dev_reset_targets t
      WHERE NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN _dev_reset_targets src ON src.oid = c.conrelid
        WHERE c.contype = 'f'
          AND c.confrelid = t.oid
          AND src.oid IS DISTINCT FROM t.oid
      )
      ORDER BY t.nsp, t.rel
      LIMIT 1;

      IF NOT FOUND THEN
        SELECT t.oid, t.nsp, t.rel
        INTO pick_oid, pick_nsp, pick_rel
        FROM _dev_reset_targets t
        ORDER BY t.nsp, t.rel
        LIMIT 1;

        IF NOT FOUND THEN
          EXIT;
        END IF;

        RAISE NOTICE 'Phase % cycle fallback: TRUNCATE %.% CASCADE', phase, pick_nsp, pick_rel;
        EXECUTE format(
          'TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE',
          pick_nsp,
          pick_rel
        );
        DELETE FROM _dev_reset_targets WHERE oid = pick_oid;
        COMMIT;
        CONTINUE;
      END IF;

      BEGIN
        EXECUTE format(
          'TRUNCATE TABLE %I.%I RESTART IDENTITY',
          pick_nsp,
          pick_rel
        );
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Phase %: CASCADE for %.% (%): %',
            phase, pick_nsp, pick_rel, SQLSTATE, SQLERRM;
          EXECUTE format(
            'TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE',
            pick_nsp,
            pick_rel
          );
      END;

      DELETE FROM _dev_reset_targets WHERE oid = pick_oid;
      RAISE NOTICE 'Phase %: truncated %.%', phase, pick_nsp, pick_rel;
      COMMIT;
    END LOOP;
  END LOOP phases;

  DROP TABLE IF EXISTS _dev_reset_targets;
END;
$$;

CALL dev_reset_keep_subscription_catalog_run();

DROP PROCEDURE IF EXISTS dev_reset_keep_subscription_catalog_run();

-- Next: create accounts, then optional seed-clinical-demo.
