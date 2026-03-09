/**
 * Feature Service Tests
 *
 * TDD tests for Feature CRUD operations
 *
 * File: auth-backend/tests/services/featureService.test.ts
 *
 * Run: deno test --allow-env --allow-net auth-backend/tests/services/featureService.test.ts
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { Pool } from "postgres";
import { FeatureService } from "../../services/featureService.ts";
import { FeatureCategory } from "../../types/rateLimiting.ts";

// Test database connection
const getTestPool = (): Pool => {
  const databaseUrl =
    Deno.env.get("TEST_DATABASE_URL") || Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set");
  }

  return new Pool(databaseUrl, 3, true);
};

Deno.test("FeatureService - CRUD Operations", async (t) => {
  const pool = getTestPool();
  const featureService = new FeatureService(pool);
  let createdFeatureId: string;

  await t.step("should create a new feature", async () => {
    const feature = await featureService.createFeature({
      name: "Test Login Rate Limit",
      key: "rate_limit_test_login",
      category: FeatureCategory.RATE_LIMITING,
      description: "Rate limit for test login endpoint",
      default_value: JSON.stringify({
        max_requests: 5,
        window_seconds: 900,
      }),
      value_type: "json",
      metadata: { test: true },
    });

    assertExists(feature.id);
    assertEquals(feature.name, "Test Login Rate Limit");
    assertEquals(feature.key, "rate_limit_test_login");
    assertEquals(feature.category, FeatureCategory.RATE_LIMITING);
    assertEquals(feature.value_type, "json");

    createdFeatureId = feature.id;
  });

  await t.step("should get feature by ID", async () => {
    const feature = await featureService.getFeatureById(createdFeatureId);

    assertExists(feature);
    assertEquals(feature!.id, createdFeatureId);
    assertEquals(feature!.key, "rate_limit_test_login");
  });

  await t.step("should get feature by key", async () => {
    const feature = await featureService.getFeatureByKey(
      "rate_limit_test_login",
    );

    assertExists(feature);
    assertEquals(feature!.id, createdFeatureId);
  });

  await t.step("should get all features", async () => {
    const features = await featureService.getFeatures();

    assertExists(features);
    assertEquals(Array.isArray(features), true);
    assertEquals(features.length > 0, true);
  });

  await t.step("should get features by category", async () => {
    const features = await featureService.getFeatures(
      FeatureCategory.RATE_LIMITING,
    );

    assertExists(features);
    assertEquals(Array.isArray(features), true);
    assertEquals(
      features.every((f) => f.category === FeatureCategory.RATE_LIMITING),
      true,
    );
  });

  await t.step("should update feature", async () => {
    const updated = await featureService.updateFeature(createdFeatureId, {
      name: "Updated Test Login Rate Limit",
      description: "Updated description",
    });

    assertExists(updated);
    assertEquals(updated!.name, "Updated Test Login Rate Limit");
    assertEquals(updated!.description, "Updated description");
  });

  await t.step("should check if feature key exists", async () => {
    const exists = await featureService.featureKeyExists(
      "rate_limit_test_login",
    );
    assertEquals(exists, true);

    const notExists = await featureService.featureKeyExists("non_existent_key");
    assertEquals(notExists, false);
  });

  await t.step("should get features by keys", async () => {
    const features = await featureService.getFeaturesByKeys([
      "rate_limit_test_login",
    ]);

    assertEquals(features.length, 1);
    assertEquals(features[0].key, "rate_limit_test_login");
  });

  await t.step("should get features grouped by category", async () => {
    const grouped = await featureService.getFeaturesByCategory();

    assertExists(grouped);
    assertEquals(Array.isArray(grouped), true);
    assertEquals(grouped.length > 0, true);

    const rateLimitGroup = grouped.find(
      (g) => g.category === FeatureCategory.RATE_LIMITING,
    );
    assertExists(rateLimitGroup);
    assertEquals(rateLimitGroup!.count > 0, true);
  });

  await t.step("should delete feature", async () => {
    const deleted = await featureService.deleteFeature(createdFeatureId);
    assertEquals(deleted, true);

    const feature = await featureService.getFeatureById(createdFeatureId);
    assertEquals(feature, null);
  });

  await pool.end();
});

Deno.test("FeatureService - Value Types", async (t) => {
  const pool = getTestPool();
  const featureService = new FeatureService(pool);
  const createdIds: string[] = [];

  await t.step("should create integer feature", async () => {
    const feature = await featureService.createFeature({
      name: "Max Patients",
      key: "test_max_patients",
      category: FeatureCategory.CAPACITY,
      default_value: "100",
      value_type: "integer",
    });

    assertExists(feature.id);
    assertEquals(feature.value_type, "integer");
    createdIds.push(feature.id);
  });

  await t.step("should create boolean feature", async () => {
    const feature = await featureService.createFeature({
      name: "API Access",
      key: "test_api_access",
      category: FeatureCategory.API_ACCESS,
      default_value: "true",
      value_type: "boolean",
    });

    assertExists(feature.id);
    assertEquals(feature.value_type, "boolean");
    createdIds.push(feature.id);
  });

  await t.step("should create string feature", async () => {
    const feature = await featureService.createFeature({
      name: "Support Level",
      key: "test_support_level",
      category: FeatureCategory.API_ACCESS,
      default_value: "standard",
      value_type: "string",
    });

    assertExists(feature.id);
    assertEquals(feature.value_type, "string");
    createdIds.push(feature.id);
  });

  await t.step("should create JSON feature", async () => {
    const feature = await featureService.createFeature({
      name: "Custom Config",
      key: "test_custom_config",
      category: FeatureCategory.INTEGRATIONS,
      default_value: JSON.stringify({ enabled: true, timeout: 30 }),
      value_type: "json",
    });

    assertExists(feature.id);
    assertEquals(feature.value_type, "json");
    createdIds.push(feature.id);
  });

  // Cleanup
  await t.step("cleanup - delete test features", async () => {
    for (const id of createdIds) {
      await featureService.deleteFeature(id);
    }
  });

  await pool.end();
});

Deno.test("FeatureService - Error Handling", async (t) => {
  const pool = getTestPool();
  const featureService = new FeatureService(pool);

  await t.step("should return null for non-existent feature", async () => {
    const feature = await featureService.getFeatureById(
      "00000000-0000-0000-0000-000000000000",
    );
    assertEquals(feature, null);
  });

  await t.step("should return null for non-existent key", async () => {
    const feature = await featureService.getFeatureByKey("non_existent_key");
    assertEquals(feature, null);
  });

  await t.step("should handle duplicate key error", async () => {
    const feature = await featureService.createFeature({
      name: "Duplicate Test",
      key: "test_duplicate_feature",
      category: FeatureCategory.RATE_LIMITING,
      default_value: "10",
      value_type: "integer",
    });

    // Try to create another with same key
    await assertRejects(async () => {
      await featureService.createFeature({
        name: "Duplicate Test 2",
        key: "test_duplicate_feature",
        category: FeatureCategory.RATE_LIMITING,
        default_value: "20",
        value_type: "integer",
      });
    }, Error);

    // Cleanup
    await featureService.deleteFeature(feature.id);
  });

  await pool.end();
});
