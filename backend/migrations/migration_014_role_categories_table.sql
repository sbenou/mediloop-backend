-- Migration: 014_role_categories_tables.sql
-- Description: Switch from categories array column to separate tables for flexible RBAC
-- Author: Mediloop Team
-- Date: 2026-03-18
-- Replaces: Simple categories column with full relational model

-- ============================================================================
-- STEP 1: Create role_categories table
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_role_category_name_lowercase CHECK (name = LOWER(name))
);

-- Add index for name lookups
CREATE INDEX IF NOT EXISTS idx_role_categories_name ON role_categories(name);

-- Add comment
COMMENT ON TABLE role_categories IS 'Role categories for flexible RBAC (e.g., healthcare_provider, administrative, clinical_staff)';

-- ============================================================================
-- STEP 2: Create junction table for many-to-many relationship
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_category_assignments (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES role_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (role_id, category_id)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_role_category_assignments_role ON role_category_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_role_category_assignments_category ON role_category_assignments(category_id);

-- Add comment
COMMENT ON TABLE role_category_assignments IS 'Junction table linking roles to their categories for RBAC';

-- ============================================================================
-- STEP 3: Insert standard categories
-- ============================================================================

INSERT INTO role_categories (name, description) VALUES
  ('healthcare_provider', 'Licensed healthcare providers (doctors, nurses, PAs, NPs, etc.)'),
  ('clinical_staff', 'Clinical support staff (medical assistants, lab techs, etc.)'),
  ('administrative', 'Administrative staff (admins, office managers, billing)'),
  ('compliance', 'Compliance and audit roles (compliance officers, auditors)'),
  ('patient', 'Patient and family member roles'),
  ('emergency_access', 'Emergency or break-glass access roles')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 4: Migrate existing data from categories column (if exists)
-- ============================================================================

DO $$
DECLARE
  role_record RECORD;
  category_name TEXT;
  category_id_var UUID;
BEGIN
  -- Check if categories column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'roles' 
    AND column_name = 'categories'
  ) THEN
    
    RAISE NOTICE 'Migrating data from roles.categories column to new tables...';
    
    -- Loop through all roles with categories
    FOR role_record IN 
      SELECT id, name, categories 
      FROM roles 
      WHERE categories IS NOT NULL AND array_length(categories, 1) > 0
    LOOP
      -- Loop through each category for this role
      FOREACH category_name IN ARRAY role_record.categories
      LOOP
        -- Get or create category
        INSERT INTO role_categories (name, description)
        VALUES (category_name, 'Migrated from categories column')
        ON CONFLICT (name) DO NOTHING;
        
        -- Get category ID
        SELECT id INTO category_id_var 
        FROM role_categories 
        WHERE name = category_name;
        
        -- Create assignment
        INSERT INTO role_category_assignments (role_id, category_id)
        VALUES (role_record.id, category_id_var)
        ON CONFLICT (role_id, category_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated: role=% category=%', role_record.name, category_name;
      END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migration from categories column completed!';
  ELSE
    RAISE NOTICE 'No categories column found, skipping data migration';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Assign categories to standard roles (if not already assigned)
-- ============================================================================

-- Helper function to assign category to role by name
CREATE OR REPLACE FUNCTION assign_role_category(role_name_param TEXT, category_name_param TEXT)
RETURNS VOID AS $$
DECLARE
  role_id_var UUID;
  category_id_var UUID;
BEGIN
  -- Get role ID
  SELECT id INTO role_id_var FROM roles WHERE name = role_name_param;
  
  -- Get category ID
  SELECT id INTO category_id_var FROM role_categories WHERE name = category_name_param;
  
  -- Create assignment if both exist
  IF role_id_var IS NOT NULL AND category_id_var IS NOT NULL THEN
    INSERT INTO role_category_assignments (role_id, category_id)
    VALUES (role_id_var, category_id_var)
    ON CONFLICT (role_id, category_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Assign healthcare_provider + clinical_staff to medical roles
DO $$
DECLARE
  role_name_var TEXT;
BEGIN
  FOREACH role_name_var IN ARRAY ARRAY[
    'doctor', 'physician', 'surgeon', 'nurse', 'registered_nurse', 
    'nurse_practitioner', 'physician_assistant', 'medical_resident', 
    'medical_fellow', 'therapist', 'psychologist', 'psychiatrist',
    'dentist', 'optometrist', 'podiatrist', 'chiropractor'
  ]
  LOOP
    PERFORM assign_role_category(role_name_var, 'healthcare_provider');
    PERFORM assign_role_category(role_name_var, 'clinical_staff');
  END LOOP;
END $$;

-- Assign administrative category
DO $$
DECLARE
  role_name_var TEXT;
BEGIN
  FOREACH role_name_var IN ARRAY ARRAY[
    'admin', 'super_admin', 'system_admin', 'billing_admin', 
    'office_manager', 'practice_manager'
  ]
  LOOP
    PERFORM assign_role_category(role_name_var, 'administrative');
  END LOOP;
END $$;

-- Assign compliance category
DO $$
DECLARE
  role_name_var TEXT;
BEGIN
  FOREACH role_name_var IN ARRAY ARRAY[
    'compliance', 'compliance_officer', 'auditor', 'privacy_officer', 
    'data_protection_officer', 'hipaa_officer'
  ]
  LOOP
    PERFORM assign_role_category(role_name_var, 'compliance');
    PERFORM assign_role_category(role_name_var, 'administrative');
  END LOOP;
END $$;

-- Assign clinical_staff category (non-provider staff)
DO $$
DECLARE
  role_name_var TEXT;
BEGIN
  FOREACH role_name_var IN ARRAY ARRAY[
    'medical_assistant', 'phlebotomist', 'lab_technician', 
    'radiology_tech', 'pharmacy_tech', 'receptionist',
    'medical_secretary', 'emt', 'paramedic'
  ]
  LOOP
    PERFORM assign_role_category(role_name_var, 'clinical_staff');
  END LOOP;
END $$;

-- Assign patient category
DO $$
DECLARE
  role_name_var TEXT;
BEGIN
  FOREACH role_name_var IN ARRAY ARRAY[
    'patient', 'family_member', 'caregiver', 'guardian'
  ]
  LOOP
    PERFORM assign_role_category(role_name_var, 'patient');
  END LOOP;
END $$;

-- Assign executive/leadership roles (multiple categories)
DO $$
DECLARE
  role_name_var TEXT;
BEGIN
  FOREACH role_name_var IN ARRAY ARRAY[
    'chief_medical_officer', 'medical_director', 'chief_nursing_officer', 
    'clinical_director', 'department_head'
  ]
  LOOP
    PERFORM assign_role_category(role_name_var, 'healthcare_provider');
    PERFORM assign_role_category(role_name_var, 'administrative');
    PERFORM assign_role_category(role_name_var, 'clinical_staff');
  END LOOP;
END $$;

-- Assign emergency access
DO $$
DECLARE
  role_name_var TEXT;
BEGIN
  FOREACH role_name_var IN ARRAY ARRAY[
    'emergency_physician', 'trauma_surgeon', 'critical_care_nurse'
  ]
  LOOP
    PERFORM assign_role_category(role_name_var, 'healthcare_provider');
    PERFORM assign_role_category(role_name_var, 'clinical_staff');
    PERFORM assign_role_category(role_name_var, 'emergency_access');
  END LOOP;
END $$;

-- Drop the helper function
DROP FUNCTION IF EXISTS assign_role_category(TEXT, TEXT);

-- ============================================================================
-- STEP 6: Drop the old categories column and index
-- ============================================================================

-- Drop the GIN index first (if exists)
DROP INDEX IF EXISTS idx_roles_categories;

-- Drop the categories column (if exists)
ALTER TABLE roles DROP COLUMN IF EXISTS categories;

-- ============================================================================
-- STEP 7: Create helpful views
-- ============================================================================

-- View to see roles with their categories (easier querying)
CREATE OR REPLACE VIEW role_categories_view AS
SELECT 
  r.id AS role_id,
  r.name AS role_name,
  r.description AS role_description,
  ARRAY_AGG(rc.name ORDER BY rc.name) AS categories,
  COUNT(rc.id) AS category_count
FROM roles r
LEFT JOIN role_category_assignments rca ON r.id = rca.role_id
LEFT JOIN role_categories rc ON rca.category_id = rc.id
GROUP BY r.id, r.name, r.description
ORDER BY r.name;

COMMENT ON VIEW role_categories_view IS 'Convenient view showing roles with their assigned categories';

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Verify migration
DO $$
DECLARE
  category_count INT;
  assignment_count INT;
BEGIN
  SELECT COUNT(*) INTO category_count FROM role_categories;
  SELECT COUNT(*) INTO assignment_count FROM role_category_assignments;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 014 completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Role categories created: %', category_count;
  RAISE NOTICE 'Role-category assignments: %', assignment_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback this migration, run:
/*
-- Add back the categories column
ALTER TABLE roles ADD COLUMN categories TEXT[] DEFAULT '{}';
CREATE INDEX idx_roles_categories ON roles USING GIN(categories);

-- Migrate data back to column
UPDATE roles r
SET categories = (
  SELECT ARRAY_AGG(rc.name)
  FROM role_category_assignments rca
  JOIN role_categories rc ON rca.category_id = rc.id
  WHERE rca.role_id = r.id
);

-- Drop new tables
DROP VIEW IF EXISTS role_categories_view;
DROP TABLE IF EXISTS role_category_assignments;
DROP TABLE IF EXISTS role_categories;
*/
