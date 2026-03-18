import { PostgresClient } from "./PostgresClient.ts";

export class SchemaManager {
  constructor(private client: PostgresClient) {}

  async createTenantSchema(schemaName: string): Promise<void> {
    console.log("Creating schema and tables for:", schemaName);

    // Create the schema
    await this.client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log("✅ Schema created:", schemaName);

    // Create all tenant tables
    await this.createTenantTables(schemaName);
    console.log("✅ All tables created for schema:", schemaName);
  }

  async dropTenantSchema(schemaName: string): Promise<void> {
    await this.client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    console.log("✅ Schema dropped:", schemaName);
  }

  async schemaExists(schemaName: string): Promise<boolean> {
    const result = await this.client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1",
      [schemaName],
    );
    return result.rows && result.rows.length > 0;
  }

  private async createTenantTables(schemaName: string) {
    console.log("Creating tables for tenant schema:", schemaName);

    // 1. activities
    await this.client.query(`
      CREATE TABLE "${schemaName}".activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        related_id UUID,
        related_type TEXT,
        meta JSONB,
        read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
        tenant_id UUID,
        team_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    // 2. addresses
    await this.client.query(`
      CREATE TABLE "${schemaName}".addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        street TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL,
        type TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    // 3. boosts
    await this.client.query(`
      CREATE TABLE "${schemaName}".boosts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inviter_id UUID NOT NULL,
        invitee_email TEXT NOT NULL,
        team_id UUID NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        team_id UUID NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        team_id UUID NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        related_id UUID,
        related_type TEXT,
        meta JSONB,
        read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        company TEXT,
        job_title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        team_id UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        task_id UUID NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".notifications_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        email BOOLEAN DEFAULT TRUE,
        push BOOLEAN DEFAULT TRUE,
        sms BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        resource TEXT NOT NULL,
        actions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        total NUMERIC NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL,
        discount NUMERIC NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        order_id UUID NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".wishlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    await this.client.query(`
      CREATE TABLE "${schemaName}".reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    // 26. qualifications (Professional Credentials)
    await this.client.query(`
      CREATE TABLE "${schemaName}".qualifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "${schemaName}".profiles(id) ON DELETE CASCADE,
        qualification_type TEXT NOT NULL CHECK (qualification_type IN ('medical_degree', 'pharmacy_degree', 'specialty_certification', 'license', 'other')),
        title TEXT NOT NULL,
        institution TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'LU',
        issue_date DATE NOT NULL,
        expiry_date DATE,
        qualification_number TEXT,
        document_url TEXT,
        verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
        verification_method TEXT CHECK (verification_method IN ('manual', 'luxtrust', 'franceconnect', 'automatic')),
        verified_by UUID,
        verified_at TIMESTAMP WITH TIME ZONE,
        verification_notes TEXT,
        is_primary BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    // Enable RLS and create policies for qualifications
    await this.client.query(
      `ALTER TABLE "${schemaName}".qualifications ENABLE ROW LEVEL SECURITY`,
    );

    await this.client.query(`
      CREATE POLICY "Users can view their own qualifications" 
      ON "${schemaName}".qualifications 
      FOR SELECT 
      USING (user_id = current_setting('app.current_user_id')::UUID)
    `);

    await this.client.query(`
      CREATE POLICY "Users can insert their own qualifications" 
      ON "${schemaName}".qualifications 
      FOR INSERT 
      WITH CHECK (user_id = current_setting('app.current_user_id')::UUID)
    `);

    await this.client.query(`
      CREATE POLICY "Users can update their own qualifications" 
      ON "${schemaName}".qualifications 
      FOR UPDATE 
      USING (user_id = current_setting('app.current_user_id')::UUID)
    `);

    await this.client.query(`
      CREATE POLICY "Users can delete their own qualifications" 
      ON "${schemaName}".qualifications 
      FOR DELETE 
      USING (user_id = current_setting('app.current_user_id')::UUID)
    `);

    await this.client.query(`
    CREATE POLICY "Superadmins can view all qualifications" 
    ON "${schemaName}".qualifications 
    FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = current_setting('app.current_user_id')::UUID 
      AND role = 'superadmin'
    ))
  `);

    await this.client.query(`
    CREATE POLICY "Superadmins can update all qualifications" 
    ON "${schemaName}".qualifications 
    FOR UPDATE 
    USING (EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = current_setting('app.current_user_id')::UUID 
      AND role = 'superadmin'
    ))
  `);
  }
}
