import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../services/postgresService.ts";
import { registrationService } from "../../modules/auth/services/registrationService.ts";

const router = new Router();

// Test concurrent registrations
router.post("/api/test/concurrent-registrations", async (ctx) => {
  console.log("🧪 === CONCURRENT REGISTRATION TEST ===");

  try {
    const body = await ctx.request.body().value;
    const { userCount = 5, role = "patient", testPrefix = "conctest" } = body;

    console.log(
      `🚀 Starting concurrent registration test with ${userCount} users`,
    );

    const startTime = performance.now();
    const promises = [];

    // Create multiple registration promises
    for (let i = 0; i < userCount; i++) {
      const email = `${testPrefix}_user_${i}_${Date.now()}@test.com`;
      const fullName = `Test User ${i}`;
      const password = "TestPassword123!";

      const registrationPromise = registrationService
        .registerUser(email, password, fullName, role)
        .then((result) => {
          return {
            userId: result.id,
            email: email,
            success: true,
            timestamp: new Date().toISOString(),
          };
        })
        .catch((error) => {
          return {
            email: email,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          };
        });

      promises.push(registrationPromise);
    }

    // Execute all registrations concurrently
    const results = await Promise.allSettled(promises);
    const endTime = performance.now();

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;
    const failed = results.length - successful;
    const totalDuration = endTime - startTime;

    console.log(
      `✅ Concurrent test completed: ${successful} successful, ${failed} failed in ${totalDuration}ms`,
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      testResults: {
        totalUsers: userCount,
        successful: successful,
        failed: failed,
        totalDurationMs: totalDuration,
        averageDurationMs: totalDuration / userCount,
        throughputUsersPerSecond: (userCount / totalDuration) * 1000,
      },
      detailedResults: results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: r.reason },
      ),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Concurrent registration test failed:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});

// Test tenant resolution speed
router.post("/api/test/tenant-resolution", async (ctx) => {
  console.log("🔍 === TENANT RESOLUTION SPEED TEST ===");

  try {
    const body = await ctx.request.body().value;
    const { iterations = 100 } = body;

    console.log(
      `🚀 Testing tenant resolution speed with ${iterations} iterations`,
    );

    // Get list of existing tenants
    const tenantsResult = await postgresService.query(
      "SELECT id, domain, schema FROM tenants LIMIT 10",
    );
    const tenants = tenantsResult.rows;

    if (tenants.length === 0) {
      throw new Error("No tenants found for testing");
    }

    const startTime = performance.now();
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const tenant = tenants[i % tenants.length];
      const iterationStart = performance.now();

      // Test tenant lookup by domain
      const lookupResult = await postgresService.query(
        "SELECT id, domain, schema FROM tenants WHERE domain = $1 LIMIT 1",
        [tenant.domain],
      );

      const iterationEnd = performance.now();

      results.push({
        iteration: i,
        tenantDomain: tenant.domain,
        found: lookupResult.rows.length > 0,
        durationMs: iterationEnd - iterationStart,
      });
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const averageDuration =
      results.reduce((sum, r) => sum + r.durationMs, 0) / results.length;

    console.log(
      `✅ Tenant resolution test completed in ${totalDuration}ms, avg: ${averageDuration}ms per lookup`,
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      testResults: {
        totalIterations: iterations,
        totalDurationMs: totalDuration,
        averageLookupTimeMs: averageDuration,
        lookupsPerSecond: (iterations / totalDuration) * 1000,
        tenantsUsed: tenants.length,
      },
      performanceBreakdown: {
        fastest: Math.min(...results.map((r) => r.durationMs)),
        slowest: Math.max(...results.map((r) => r.durationMs)),
        median: results.sort((a, b) => a.durationMs - b.durationMs)[
          Math.floor(results.length / 2)
        ].durationMs,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Tenant resolution test failed:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});

// Test schema creation performance
router.post("/api/test/schema-creation", async (ctx) => {
  console.log("🏗️ === SCHEMA CREATION PERFORMANCE TEST ===");

  try {
    const body = await ctx.request.body().value;
    const { testCount = 3 } = body;

    console.log(
      `🚀 Testing schema creation performance with ${testCount} schemas`,
    );

    const results = [];
    const startTime = performance.now();

    for (let i = 0; i < testCount; i++) {
      const testSchemaName = `test_schema_${Date.now()}_${i}`;
      const iterationStart = performance.now();

      try {
        // Create test schema
        await postgresService.query(
          `CREATE SCHEMA IF NOT EXISTS ${testSchemaName}`,
        );

        // Create a simple test table
        await postgresService.query(`
          CREATE TABLE IF NOT EXISTS ${testSchemaName}.test_table (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);

        const iterationEnd = performance.now();

        results.push({
          iteration: i,
          schemaName: testSchemaName,
          success: true,
          durationMs: iterationEnd - iterationStart,
        });

        // Clean up test schema
        await postgresService.query(
          `DROP SCHEMA IF EXISTS ${testSchemaName} CASCADE`,
        );
      } catch (error) {
        const iterationEnd = performance.now();
        results.push({
          iteration: i,
          schemaName: testSchemaName,
          success: false,
          error: error.message,
          durationMs: iterationEnd - iterationStart,
        });
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const successful = results.filter((r) => r.success).length;
    const averageDuration =
      results.reduce((sum, r) => sum + r.durationMs, 0) / results.length;

    console.log(
      `✅ Schema creation test completed: ${successful}/${testCount} successful in ${totalDuration}ms`,
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      testResults: {
        totalSchemas: testCount,
        successful: successful,
        failed: testCount - successful,
        totalDurationMs: totalDuration,
        averageCreationTimeMs: averageDuration,
        schemasPerSecond: (successful / totalDuration) * 1000,
      },
      detailedResults: results,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Schema creation test failed:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});

// Test database connection pool performance
router.post("/api/test/connection-pool", async (ctx) => {
  console.log("🔗 === CONNECTION POOL PERFORMANCE TEST ===");

  try {
    const body = await ctx.request.body().value;
    const { concurrentQueries = 20 } = body;

    console.log(
      `🚀 Testing connection pool with ${concurrentQueries} concurrent queries`,
    );

    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < concurrentQueries; i++) {
      const queryPromise = postgresService
        .query(
          "SELECT $1 as query_id, NOW() as timestamp, pg_backend_pid() as connection_pid",
          [i],
        )
        .then((result) => {
          return {
            queryId: i,
            success: true,
            connectionPid: result.rows[0]?.connection_pid,
            timestamp: result.rows[0]?.timestamp,
          };
        })
        .catch((error) => {
          return {
            queryId: i,
            success: false,
            error: error.message,
          };
        });

      promises.push(queryPromise);
    }

    const results = await Promise.allSettled(promises);
    const endTime = performance.now();

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;
    const totalDuration = endTime - startTime;

    // Analyze connection reuse
    const connectionPids = results
      .filter((r) => r.status === "fulfilled" && r.value.success)
      .map((r) => r.value.connectionPid);
    const uniqueConnections = new Set(connectionPids).size;

    console.log(
      `✅ Connection pool test completed: ${successful}/${concurrentQueries} successful, ${uniqueConnections} unique connections used`,
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      testResults: {
        totalQueries: concurrentQueries,
        successful: successful,
        failed: concurrentQueries - successful,
        totalDurationMs: totalDuration,
        queriesPerSecond: (successful / totalDuration) * 1000,
        uniqueConnections: uniqueConnections,
        connectionReuseRatio:
          (concurrentQueries - uniqueConnections) / concurrentQueries,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Connection pool test failed:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});

export default router;
