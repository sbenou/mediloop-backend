
import { postgresService } from './postgresService.ts';

export class MigrationService {
  
  async migrateExistingTenants() {
    console.log('🔄 Starting migration of existing tenant schemas...');
    
    try {
      // Get all existing tenant schemas
      const tenantSchemas = await postgresService.getAllTenantSchemas();
      console.log(`Found ${tenantSchemas.length} tenant schemas to migrate:`, tenantSchemas);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const schemaName of tenantSchemas) {
        try {
          console.log(`\n🔧 Migrating schema: ${schemaName}`);
          await this.addJwtTablesToSchema(schemaName);
          console.log(`✅ Successfully migrated schema: ${schemaName}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to migrate schema ${schemaName}:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`\n📊 Migration Summary:`);
      console.log(`  - Successfully migrated: ${successCount} schemas`);
      console.log(`  - Failed migrations: ${errorCount} schemas`);
      console.log(`  - Total processed: ${tenantSchemas.length} schemas`);
      
      return {
        success: errorCount === 0,
        total: tenantSchemas.length,
        successful: successCount,
        failed: errorCount
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  private async addJwtTablesToSchema(schemaName: string) {
    // Check if tables already exist
    const tablesExist = await this.checkJwtTablesExist(schemaName);
    if (tablesExist) {
      console.log(`⏭️  JWT tables already exist in ${schemaName}, skipping...`);
      return;
    }
    
    console.log(`📝 Creating JWT tables in ${schemaName}...`);
    
    // 1. jwt_sessions
    await postgresService.query(`
      CREATE TABLE "${schemaName}".jwt_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        session_id TEXT NOT NULL UNIQUE,
        refresh_token_hash TEXT NOT NULL,
        device_info JSONB,
        ip_address INET,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    // 2. jwt_blacklist
    await postgresService.query(`
      CREATE TABLE "${schemaName}".jwt_blacklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_jti TEXT NOT NULL UNIQUE,
        user_id UUID NOT NULL,
        blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        reason TEXT
      )
    `);

    // 3. security_audit_log
    await postgresService.query(`
      CREATE TABLE "${schemaName}".security_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        session_id TEXT,
        event_type TEXT NOT NULL,
        event_data JSONB,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        risk_score INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    // Create indexes
    const sanitizedSchema = schemaName.replace(/[^a-zA-Z0-9]/g, '_');
    await postgresService.query(`CREATE INDEX idx_jwt_sessions_${sanitizedSchema}_user_id ON "${schemaName}".jwt_sessions(user_id)`);
    await postgresService.query(`CREATE INDEX idx_jwt_sessions_${sanitizedSchema}_session_id ON "${schemaName}".jwt_sessions(session_id)`);
    await postgresService.query(`CREATE INDEX idx_jwt_sessions_${sanitizedSchema}_active ON "${schemaName}".jwt_sessions(user_id, is_active)`);
    await postgresService.query(`CREATE INDEX idx_jwt_blacklist_${sanitizedSchema}_token_jti ON "${schemaName}".jwt_blacklist(token_jti)`);
    await postgresService.query(`CREATE INDEX idx_jwt_blacklist_${sanitizedSchema}_expires ON "${schemaName}".jwt_blacklist(expires_at)`);
    await postgresService.query(`CREATE INDEX idx_security_audit_${sanitizedSchema}_user_event ON "${schemaName}".security_audit_log(user_id, event_type)`);
    await postgresService.query(`CREATE INDEX idx_security_audit_${sanitizedSchema}_created ON "${schemaName}".security_audit_log(created_at)`);

    // Enable RLS
    await postgresService.query(`ALTER TABLE "${schemaName}".jwt_sessions ENABLE ROW LEVEL SECURITY`);
    await postgresService.query(`ALTER TABLE "${schemaName}".jwt_blacklist ENABLE ROW LEVEL SECURITY`);
    await postgresService.query(`ALTER TABLE "${schemaName}".security_audit_log ENABLE ROW LEVEL SECURITY`);

    // Create RLS policies
    await postgresService.query(`
      CREATE POLICY "Users can manage own sessions" ON "${schemaName}".jwt_sessions
        FOR ALL USING (user_id = auth.uid())
    `);

    await postgresService.query(`
      CREATE POLICY "Users can view own blacklisted tokens" ON "${schemaName}".jwt_blacklist
        FOR SELECT USING (user_id = auth.uid())
    `);

    await postgresService.query(`
      CREATE POLICY "Users can view own audit logs" ON "${schemaName}".security_audit_log
        FOR SELECT USING (user_id = auth.uid())
    `);
    
    console.log(`✅ JWT tables created successfully in ${schemaName}`);
  }
  
  private async checkJwtTablesExist(schemaName: string): Promise<boolean> {
    try {
      const result = await postgresService.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name IN ('jwt_sessions', 'jwt_blacklist', 'security_audit_log')
      `, [schemaName]);
      
      return result.rows[0]?.table_count === 3;
    } catch (error) {
      return false;
    }
  }
}

export const migrationService = new MigrationService();
