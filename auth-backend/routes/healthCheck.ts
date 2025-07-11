
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { postgresService } from "../services/postgresService.ts"
import { configService } from "../services/configService.ts"

const healthCheckRouter = new Router()

// Basic health check
healthCheckRouter.get('/health', (ctx) => {
  ctx.response.body = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-backend'
  }
})

// Database health check
healthCheckRouter.get('/health/db', async (ctx) => {
  try {
    // Test basic database connection
    const result = await postgresService.query('SELECT 1 as test')
    
    ctx.response.body = {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      test_query: result.rows[0]
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    ctx.response.status = 500
    ctx.response.body = {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})

// Detailed database health check with schema info
healthCheckRouter.get('/health/db/detailed', async (ctx) => {
  try {
    // Get current schema from config service
    const schema = configService.getCurrentSchema()
    
    // Test basic connection
    const basicTest = await postgresService.query('SELECT 1 as test')
    
    // Test schema-specific query - profiles table
    const profilesTest = await postgresService.query(
      `SELECT COUNT(*) as profile_count FROM "${schema}".profiles LIMIT 1`
    )
    
    // Test public schema access - roles table
    const rolesTest = await postgresService.query(
      'SELECT COUNT(*) as role_count FROM public.roles LIMIT 1'
    )
    
    // Get schema info from config service
    const schemaInfo = configService.getSchemaInfo()
    
    ctx.response.body = {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      schema_info: schemaInfo,
      tests: {
        basic_connection: basicTest.rows[0],
        profiles_table: profilesTest.rows[0],
        roles_table: rolesTest.rows[0]
      }
    }
  } catch (error) {
    console.error('Detailed database health check failed:', error)
    ctx.response.status = 500
    ctx.response.body = {
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      schema_info: configService.getSchemaInfo()
    }
  }
})

// Schema information endpoint
healthCheckRouter.get('/health/schema', (ctx) => {
  try {
    const schemaInfo = configService.getSchemaInfo()
    
    ctx.response.body = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      schema_info: schemaInfo
    }
  } catch (error) {
    console.error('Schema info retrieval failed:', error)
    ctx.response.status = 500
    ctx.response.body = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})

export default healthCheckRouter
