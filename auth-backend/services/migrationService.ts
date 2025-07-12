
import { postgresService } from './postgresService.ts';

export class MigrationService {
  
  async migrateExistingTenants() {
    console.log('🔄 Starting migration of existing tenant schemas...');
    
    try {
      // Get all existing tenant schemas
      const tenantSchemas = await postgresService.getAllTenantSchemas();
      console.log(`Found ${tenantSchemas.length} tenant schemas to migrate:`, tenantSchemas);
      
      if (tenantSchemas.length === 0) {
        console.log('⚠️ No tenant schemas found to migrate');
        return {
          success: true,
          total: 0,
          successful: 0,
          failed: 0,
          schemas: []
        };
      }
      
      let successCount = 0;
      let errorCount = 0;
      const processedSchemas: string[] = [];
      
      for (const schemaName of tenantSchemas) {
        try {
          console.log(`\n🔧 Migrating schema: ${schemaName}`);
          await this.addJwtTablesToSchema(schemaName);
          console.log(`✅ Successfully migrated schema: ${schemaName}`);
          successCount++;
          processedSchemas.push(schemaName);
        } catch (error) {
          console.error(`❌ Failed to migrate schema ${schemaName}:`, error.message);
          console.error('Error details:', error);
          errorCount++;
        }
      }
      
      console.log(`\n📊 Migration Summary:`);
      console.log(`  - Successfully migrated: ${successCount} schemas`);
      console.log(`  - Failed migrations: ${errorCount} schemas`);
      console.log(`  - Total processed: ${tenantSchemas.length} schemas`);
      console.log(`  - Processed schemas:`, processedSchemas);
      
      return {
        success: errorCount === 0,
        total: tenantSchemas.length,
        successful: successCount,
        failed: errorCount,
        schemas: processedSchemas
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      console.error('Error stack:', error.stack);
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
    
    try {
      // 1. jwt_sessions
      console.log(`  Creating jwt_sessions table in ${schemaName}...`);
      await postgresService.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".jwt_sessions (
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
      console.log(`  Creating jwt_blacklist table in ${schemaName}...`);
      await postgresService.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".jwt_blacklist (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          token_jti TEXT NOT NULL UNIQUE,
          user_id UUID NOT NULL,
          blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          reason TEXT
        )
      `);

      // 3. security_audit_log
      console.log(`  Creating security_audit_log table in ${schemaName}...`);
      await postgresService.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}".security_audit_log (
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

      // Create indexes with IF NOT EXISTS (using DROP IF EXISTS + CREATE approach since PostgreSQL doesn't have CREATE INDEX IF NOT EXISTS)
      console.log(`  Creating indexes for ${schemaName}...`);
      const sanitizedSchema = schemaName.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Drop existing indexes first, then create new ones
      const indexCommands = [
        `DROP INDEX IF EXISTS "${schemaName}".idx_jwt_sessions_${sanitizedSchema}_user_id`,
        `CREATE INDEX idx_jwt_sessions_${sanitizedSchema}_user_id ON "${schemaName}".jwt_sessions(user_id)`,
        
        `DROP INDEX IF EXISTS "${schemaName}".idx_jwt_sessions_${sanitizedSchema}_session_id`,
        `CREATE INDEX idx_jwt_sessions_${sanitizedSchema}_session_id ON "${schemaName}".jwt_sessions(session_id)`,
        
        `DROP INDEX IF EXISTS "${schemaName}".idx_jwt_sessions_${sanitizedSchema}_active`,
        `CREATE INDEX idx_jwt_sessions_${sanitizedSchema}_active ON "${schemaName}".jwt_sessions(user_id, is_active)`,
        
        `DROP INDEX IF EXISTS "${schemaName}".idx_jwt_blacklist_${sanitizedSchema}_token_jti`,
        `CREATE INDEX idx_jwt_blacklist_${sanitizedSchema}_token_jti ON "${schemaName}".jwt_blacklist(token_jti)`,
        
        `DROP INDEX IF EXISTS "${schemaName}".idx_jwt_blacklist_${sanitizedSchema}_expires`,
        `CREATE INDEX idx_jwt_blacklist_${sanitizedSchema}_expires ON "${schemaName}".jwt_blacklist(expires_at)`,
        
        `DROP INDEX IF EXISTS "${schemaName}".idx_security_audit_${sanitizedSchema}_user_event`,
        `CREATE INDEX idx_security_audit_${sanitizedSchema}_user_event ON "${schemaName}".security_audit_log(user_id, event_type)`,
        
        `DROP INDEX IF EXISTS "${schemaName}".idx_security_audit_${sanitizedSchema}_created`,
        `CREATE INDEX idx_security_audit_${sanitizedSchema}_created ON "${schemaName}".security_audit_log(created_at)`
      ];

      for (const command of indexCommands) {
        try {
          await postgresService.query(command);
        } catch (error) {
          // Log index errors but don't fail the migration
          console.log(`  Index command warning: ${error.message}`);
        }
      }

      // Enable RLS
      console.log(`  Enabling RLS for ${schemaName}...`);
      await postgresService.query(`ALTER TABLE "${schemaName}".jwt_sessions ENABLE ROW LEVEL SECURITY`);
      await postgresService.query(`ALTER TABLE "${schemaName}".jwt_blacklist ENABLE ROW LEVEL SECURITY`);
      await postgresService.query(`ALTER TABLE "${schemaName}".security_audit_log ENABLE ROW LEVEL SECURITY`);

      // Create RLS policies (with IF NOT EXISTS equivalent using DROP + CREATE)
      console.log(`  Creating RLS policies for ${schemaName}...`);
      
      // Drop existing policies first, then create new ones
      const policyCommands = [
        `DROP POLICY IF EXISTS "Users can manage own sessions" ON "${schemaName}".jwt_sessions`,
        `CREATE POLICY "Users can manage own sessions" ON "${schemaName}".jwt_sessions
          FOR ALL USING (user_id = auth.uid())`,

        `DROP POLICY IF EXISTS "Users can view own blacklisted tokens" ON "${schemaName}".jwt_blacklist`,
        `CREATE POLICY "Users can view own blacklisted tokens" ON "${schemaName}".jwt_blacklist
          FOR SELECT USING (user_id = auth.uid())`,

        `DROP POLICY IF EXISTS "Users can view own audit logs" ON "${schemaName}".security_audit_log`,
        `CREATE POLICY "Users can view own audit logs" ON "${schemaName}".security_audit_log
          FOR SELECT USING (user_id = auth.uid())`
      ];

      for (const command of policyCommands) {
        try {
          await postgresService.query(command);
        } catch (error) {
          // Log policy errors but don't fail the migration
          console.log(`  Policy command warning: ${error.message}`);
        }
      }
      
      console.log(`✅ JWT tables created successfully in ${schemaName}`);
    } catch (error) {
      console.error(`❌ Error creating tables in ${schemaName}:`, error.message);
      throw error;
    }
  }
  
  private async checkJwtTablesExist(schemaName: string): Promise<boolean> {
    try {
      console.log(`  Checking if JWT tables exist in ${schemaName}...`);
      const result = await postgresService.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name IN ('jwt_sessions', 'jwt_blacklist', 'security_audit_log')
      `, [schemaName]);
      
      const count = result.rows[0]?.table_count || 0;
      console.log(`  Found ${count}/3 JWT tables in ${schemaName}`);
      return count === 3;
    } catch (error) {
      console.error(`  Error checking tables in ${schemaName}:`, error.message);
      return false;
    }
  }
}

export const migrationService = new MigrationService();
