import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts"
import { config } from "../../config/env.ts"
import { RetryService } from "../../utils/retry.ts"

export class PostgresClient {
  private client: Client | null = null
  private isConnecting = false

  constructor() {
    this.connect()
  }

  private async connect() {
    if (this.isConnecting) {
      // Wait for existing connection attempt
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    if (!this.client) {
      this.isConnecting = true
      console.log('Connecting to Neon PostgreSQL database...')
      
      try {
        await RetryService.execute(async () => {
          this.client = new Client(config.DATABASE_URL)
          await this.client.connect()
          console.log('✓ Connected to Neon PostgreSQL database')
        }, {
          maxTry: 3,
          delay: 1000,
          retryCondition: RetryService.conditions.network
        })
      } catch (error) {
        console.error('Failed to connect to database after retries:', error)
        this.client = null
        throw error
      } finally {
        this.isConnecting = false
      }
    }
  }

  async ensureConnection() {
    if (!this.client) {
      await this.connect()
      return
    }

    // Test the connection with a simple query
    try {
      await this.client.queryObject('SELECT 1')
    } catch (error) {
      console.log('Connection test failed, reconnecting...', error.message)
      this.client = null
      await this.connect()
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    await this.ensureConnection()
    
    return await RetryService.execute(async () => {
      if (!this.client) {
        throw new Error('Database client not connected')
      }
      
      console.log('🔍 Executing query:', sql.slice(0, 100) + (sql.length > 100 ? '...' : ''))
      if (params && params.length > 0) {
        console.log('📝 With parameters:', params)
      }
      
      const result = await this.client.queryObject(sql, params)
      console.log('✅ Query executed successfully, rows returned:', result.rows?.length || 0)
      return result
    }, {
      maxTry: 2,
      delay: 500,
      retryCondition: RetryService.conditions.database
    })
  }

  async queryArray(sql: string, params?: any[]): Promise<any> {
    await this.ensureConnection()
    
    return await RetryService.execute(async () => {
      if (!this.client) {
        throw new Error('Database client not connected')
      }
      
      const result = await this.client.queryArray(sql, params)
      return result
    }, {
      maxTry: 2,
      delay: 500,
      retryCondition: RetryService.conditions.database
    })
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.end()
        this.client = null
        console.log('✓ Disconnected from database')
      } catch (error) {
        console.error('Error disconnecting from database:', error)
        this.client = null
      }
    }
  }

  getClient(): Client | null {
    return this.client
  }
}