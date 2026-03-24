import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { config } from "../../config/env.ts";
import { RetryService } from "../../utils/retry.ts";

export class PostgresClient {
  private client: Client | null = null;
  private isConnecting = false;

  constructor() {
    // Lazy-connect on first query. Starting connect() from the constructor
    // (without await) races with the first ensureConnection() and can leave a
    // half-open TCP/TLS socket — Deno then throws "TCP stream is currently in use"
    // / BadResource on startTls when retries create a new Client.
  }

  /** Close and drop the current client (best-effort). */
  private async disposeClient(): Promise<void> {
    if (!this.client) return;
    const c = this.client;
    this.client = null;
    try {
      await c.end();
    } catch {
      // Ignore: socket may already be broken mid-handshake
    }
  }

  private async connect(): Promise<void> {
    // Wait until any in-flight connect attempt finishes
    while (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (this.client) {
      return;
    }

    this.isConnecting = true;
    console.log("Connecting to Neon PostgreSQL database...");

    try {
      await RetryService.execute(
        async () => {
          // Each retry must end the previous client or the TCP resource stays open
          await this.disposeClient();
          const client = new Client(config.DATABASE_URL);
          this.client = client;
          await client.connect();
          console.log("✓ Connected to Neon PostgreSQL database");
        },
        {
          maxAttempts: 3,
          delay: 1000,
          retryCondition: RetryService.conditions.network,
        },
      );
    } catch (error) {
      console.error("Failed to connect to database after retries:", error);
      await this.disposeClient();
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async ensureConnection() {
    if (!this.client) {
      await this.connect();
      return;
    }

    // Test the connection with a simple query
    try {
      await this.client.queryObject("SELECT 1");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("Connection test failed, reconnecting...", message);
      await this.disposeClient();
      await this.connect();
    }
  }

  async query(
    sql: string,
    params?: unknown[],
  ): Promise<{
    rows: Record<string, unknown>[];
    rowCount?: number;
  }> {
    await this.ensureConnection();

    return await RetryService.execute<{
      rows: Record<string, unknown>[];
      rowCount?: number;
    }>(
      async () => {
        if (!this.client) {
          throw new Error("Database client not connected");
        }

        console.log(
          "🔍 Executing query:",
          sql.slice(0, 100) + (sql.length > 100 ? "..." : ""),
        );
        if (params && params.length > 0) {
          console.log("📝 With parameters:", params);
        }

        const result = await this.client.queryObject(sql, params);
        console.log(
          "✅ Query executed successfully, rows returned:",
          result.rows?.length || 0,
        );
        return {
          rows: result.rows as Record<string, unknown>[],
          rowCount: result.rowCount,
        };
      },
      {
        maxAttempts: 2,
        delay: 500,
        retryCondition: RetryService.conditions.database,
      },
    );
  }

  async queryArray(
    sql: string,
    params?: unknown[],
  ): Promise<{
    rows: unknown[][];
    rowCount?: number;
  }> {
    await this.ensureConnection();

    return await RetryService.execute<{
      rows: unknown[][];
      rowCount?: number;
    }>(
      async () => {
        if (!this.client) {
          throw new Error("Database client not connected");
        }

        const result = await this.client.queryArray(sql, params);
        return {
          rows: result.rows as unknown[][],
          rowCount: result.rowCount,
        };
      },
      {
        maxAttempts: 2,
        delay: 500,
        retryCondition: RetryService.conditions.database,
      },
    );
  }

  async disconnect() {
    try {
      await this.disposeClient();
      console.log("✓ Disconnected from database");
    } catch (error) {
      console.error("Error disconnecting from database:", error);
      this.client = null;
    }
  }

  getClient(): Client | null {
    return this.client;
  }
}
