/**
 * Apply Database Schema
 * Applies the exported schema to the TEST database
 * 
 * Usage:
 *   deno run --allow-net --allow-env --allow-read scripts/db/apply-schema.ts
 */

import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load environment variables from .env.test
const env = await load({ envPath: ".env.test", export: true });

const TEST_DATABASE_URL = Deno.env.get("TEST_DATABASE_URL");

if (!TEST_DATABASE_URL) {
  console.error("\u274c TEST_DATABASE_URL not found in .env.test");
  console.error("\n\ud83d\udca1 Make sure your .env.test file contains:");
  console.error("   TEST_DATABASE_URL=postgresql://...");
  Deno.exit(1);
}

console.log("\n" + "=".repeat(70));
console.log("\ud83d\udce5 Applying Database Schema to TEST Database");
console.log("=".repeat(70));

// Parse connection string
const url = new URL(TEST_DATABASE_URL);
const client = new Client({
  hostname: url.hostname,
  port: parseInt(url.port || "5432"),
  user: url.username,
  password: url.password,
  database: url.pathname.split("/")[1],
  tls: { enabled: true, enforce: false },
});

try {
  console.log("\n\ud83d\udd0c Connecting to TEST database...");
  await client.connect();
  console.log("\u2705 Connected to:", url.hostname);

  // Read schema file
  console.log("\n\ud83d\udcdd Reading schema file...");
  const schemaFile = "scripts/db/schema.sql";
  let schemaSQL: string;
  
  try {
    schemaSQL = await Deno.readTextFile(schemaFile);
    console.log("\u2705 Schema file loaded");
  } catch (error) {
    console.error(`\u274c Schema file not found: ${schemaFile}`);
    console.error("\n\ud83d\udca1 First run: deno run --allow-net --allow-env --allow-read --allow-write scripts/db/export-schema.ts");
    Deno.exit(1);
  }

  // Apply schema
  console.log("\n\ud83d\udee0\ufe0f Applying schema to TEST database...");
  console.log("   This may take a few seconds...\n");

  // Split by semicolon and execute each statement
  const statements = schemaSQL
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  let successCount = 0;
  let skipCount = 0;

  for (const statement of statements) {
    try {
      await client.queryArray(statement);
      successCount++;
      
      // Log progress for major operations
      if (statement.includes("CREATE TABLE")) {
        const match = statement.match(/CREATE TABLE[^)]*\s+(\S+)\s+\(/i);
        if (match) {
          console.log(`   \u2705 Created table: ${match[1]}`);
        }
      } else if (statement.includes("CREATE SCHEMA")) {
        const match = statement.match(/CREATE SCHEMA[^)]*\s+(\S+)/i);
        if (match) {
          console.log(`   \u2705 Created schema: ${match[1]}`);
        }
      } else if (statement.includes("INSERT INTO public.roles")) {
        console.log(`   \u2705 Seeded default roles`);
      }
    } catch (error: any) {
      // Ignore "already exists" errors
      if (error.message?.includes("already exists")) {
        skipCount++;
      } else {
        console.error(`   \u26a0\ufe0f Warning: ${error.message}`);
      }
    }
  }

  console.log(`\n\u2705 Schema applied successfully!`);
  console.log(`   - ${successCount} statements executed`);
  if (skipCount > 0) {
    console.log(`   - ${skipCount} statements skipped (already exist)`);
  }

  // Verify tables exist
  console.log("\n\ud83d\udd0d Verifying schema...");
  
  const tables = [
    "public.roles",
    "auth.users",
    "auth.sessions",
    "auth.email_verifications",
    "auth.password_reset_tokens",
    "public.tenants",
    "public.user_tenants",
  ];

  for (const table of tables) {
    const [schema, tableName] = table.split(".");
    const result = await client.queryObject<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = $1 AND table_name = $2
       )`,
      [schema, tableName]
    );
    
    if (result.rows[0].exists) {
      console.log(`   \u2705 ${table}`);
    } else {
      console.log(`   \u274c ${table} - NOT FOUND`);
    }
  }

  console.log("\n\u2705 TEST database is ready for testing!");
  console.log("\n\ud83d\udca1 Next step: Run your tests");
  console.log("   deno test --allow-net --allow-env --allow-read tests/backend/emailVerification.test.ts");

} catch (error) {
  console.error("\u274c Error:", error.message);
  Deno.exit(1);
} finally {
  await client.end();
}

console.log("\n" + "=".repeat(70));
