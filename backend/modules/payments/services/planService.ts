/**
 * Plan Service - Manages subscription plans with features and services
 *
 * This is the core service that orchestrates the composition of plans
 * by combining features and services without requiring code changes.
 *
 * FIXED: Uses postgresService instead of Pool
 */

import { postgresService } from "../../../shared/services/postgresService.ts";
import type {
  Plan,
  PlanWithFeatures,
  CreatePlanDTO,
  UpdatePlanDTO,
  PlanFilters,
  Feature,
  Service,
} from "../../../shared/types/index.ts";

export class PlanError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "PlanError";
  }
}

export class PlanService {
  /**
   * Create a new plan with features and services
   */
  async createPlan(data: CreatePlanDTO): Promise<PlanWithFeatures> {
    const client = await postgresService.getClient();

    if (!client) {
      throw new PlanError("Failed to get database client", "DB_ERROR");
    }

    try {
      await client.queryObject("BEGIN");

      // 1. Create the plan
      const planResult = await client.queryObject<Plan>(
        `INSERT INTO plans (
          name, key, description, status, is_public,
          monthly_price_cents, annual_price_cents, display_order, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          data.name,
          data.key,
          data.description || null,
          data.status || "active",
          data.is_public ?? true,
          data.monthly_price_cents || null,
          data.annual_price_cents || null,
          data.display_order || 0,
          data.metadata || null,
        ],
      );

      const plan = planResult.rows[0];
      if (!plan) {
        throw new PlanError("Failed to create plan", "INVALID_PLAN");
      }

      // 2. Attach features if provided
      if (data.features && data.features.length > 0) {
        for (const featureData of data.features) {
          // Verify feature exists
          const featureCheck = await client.queryObject<Feature>(
            `SELECT id FROM features WHERE key = $1`,
            [featureData.feature_key],
          );

          if (featureCheck.rows.length === 0) {
            throw new PlanError(
              `Feature not found: ${featureData.feature_key}`,
              "INVALID_FEATURE",
            );
          }

          const featureId = featureCheck.rows[0].id;

          await client.queryObject(
            `INSERT INTO plan_features (plan_id, feature_id, value)
             VALUES ($1, $2, $3)`,
            [plan.id, featureId, featureData.value],
          );
        }
      }

      // 3. Attach services if provided
      if (data.services && data.services.length > 0) {
        for (const serviceData of data.services) {
          // Verify service exists
          const serviceCheck = await client.queryObject<Service>(
            `SELECT id FROM services WHERE key = $1`,
            [serviceData.service_key],
          );

          if (serviceCheck.rows.length === 0) {
            throw new PlanError(
              `Service not found: ${serviceData.service_key}`,
              "INVALID_SERVICE",
            );
          }

          const serviceId = serviceCheck.rows[0].id;

          await client.queryObject(
            `INSERT INTO plan_services (plan_id, service_id, quantity)
             VALUES ($1, $2, $3)`,
            [plan.id, serviceId, serviceData.quantity],
          );
        }
      }

      await client.queryObject("COMMIT");

      // Return the plan with all relations
      return await this.getPlanByIdWithRelations(plan.id);
    } catch (error) {
      await client.queryObject("ROLLBACK");
      throw error;
    } finally {
      postgresService.releaseClient(client);
    }
  }

  /**
   * Get plan by ID with all features and services
   */
  async getPlanByIdWithRelations(id: string): Promise<PlanWithFeatures> {
    const plan = await this.getPlanById(id);
    if (!plan) {
      throw new PlanError(`Plan not found: ${id}`, "NOT_FOUND");
    }

    return this.enrichPlanWithRelations(plan);
  }

  /**
   * Get plan by key with all features and services
   */
  async getPlanByKeyWithRelations(key: string): Promise<PlanWithFeatures> {
    const plan = await this.getPlanByKey(key);
    if (!plan) {
      throw new PlanError(`Plan not found: ${key}`, "NOT_FOUND");
    }

    return this.enrichPlanWithRelations(plan);
  }

  /**
   * Get plan by ID (without relations)
   */
  async getPlanById(id: string): Promise<Plan | null> {
    const result = await postgresService.query(
      `SELECT * FROM plans WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Get plan by key (without relations)
   */
  async getPlanByKey(key: string): Promise<Plan | null> {
    const result = await postgresService.query(
      `SELECT * FROM plans WHERE key = $1`,
      [key],
    );

    return result.rows[0] || null;
  }

  /**
   * Get all plans with optional filters
   */
  async getPlans(filters?: PlanFilters): Promise<Plan[]> {
    let query = `SELECT * FROM plans WHERE 1=1`;
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters?.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters?.is_public !== undefined) {
      query += ` AND is_public = $${paramCount++}`;
      params.push(filters.is_public);
    }

    if (filters?.search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY display_order, name`;

    const result = await postgresService.query(query, params);
    return result.rows;
  }

  /**
   * Update plan (basic info only, use separate methods for features/services)
   */
  async updatePlan(id: string, data: UpdatePlanDTO): Promise<Plan | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (data.is_public !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(data.is_public);
    }

    if (data.monthly_price_cents !== undefined) {
      updates.push(`monthly_price_cents = $${paramCount++}`);
      values.push(data.monthly_price_cents);
    }

    if (data.annual_price_cents !== undefined) {
      updates.push(`annual_price_cents = $${paramCount++}`);
      values.push(data.annual_price_cents);
    }

    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(data.display_order);
    }

    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(data.metadata);
    }

    if (updates.length === 0) {
      return this.getPlanById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await postgresService.query(
      `UPDATE plans
       SET ${updates.join(", ")}
       WHERE id = $${paramCount}
       RETURNING *`,
      values,
    );

    return result.rows[0] || null;
  }

  /**
   * Add or update a feature on a plan
   */
  async setPlanFeature(
    planId: string,
    featureKey: string,
    value: string,
  ): Promise<void> {
    // Get feature ID
    const featureResult = await postgresService.query(
      `SELECT id FROM features WHERE key = $1`,
      [featureKey],
    );

    if (featureResult.rows.length === 0) {
      throw new PlanError(
        `Feature not found: ${featureKey}`,
        "INVALID_FEATURE",
      );
    }

    const featureId = featureResult.rows[0].id;

    // Upsert the plan_feature
    await postgresService.query(
      `INSERT INTO plan_features (plan_id, feature_id, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (plan_id, feature_id)
       DO UPDATE SET value = $3`,
      [planId, featureId, value],
    );
  }

  /**
   * Remove a feature from a plan
   */
  async removePlanFeature(planId: string, featureKey: string): Promise<void> {
    await postgresService.query(
      `DELETE FROM plan_features
       WHERE plan_id = $1
       AND feature_id = (SELECT id FROM features WHERE key = $2)`,
      [planId, featureKey],
    );
  }

  /**
   * Add or update a service on a plan
   */
  async setPlanService(
    planId: string,
    serviceKey: string,
    quantity: number,
  ): Promise<void> {
    // Get service ID
    const serviceResult = await postgresService.query(
      `SELECT id FROM services WHERE key = $1`,
      [serviceKey],
    );

    if (serviceResult.rows.length === 0) {
      throw new PlanError(
        `Service not found: ${serviceKey}`,
        "INVALID_SERVICE",
      );
    }

    const serviceId = serviceResult.rows[0].id;

    // Upsert the plan_service
    await postgresService.query(
      `INSERT INTO plan_services (plan_id, service_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (plan_id, service_id)
       DO UPDATE SET quantity = $3`,
      [planId, serviceId, quantity],
    );
  }

  /**
   * Remove a service from a plan
   */
  async removePlanService(planId: string, serviceKey: string): Promise<void> {
    await postgresService.query(
      `DELETE FROM plan_services
       WHERE plan_id = $1
       AND service_id = (SELECT id FROM services WHERE key = $2)`,
      [planId, serviceKey],
    );
  }

  /**
   * Delete a plan (soft delete - check for active subscriptions first)
   */
  async deletePlan(id: string): Promise<boolean> {
    // Check if plan has active subscriptions
    const subCheck = await postgresService.query(
      `SELECT COUNT(*) as count
       FROM subscriptions
       WHERE plan_id = $1 AND status IN ('active', 'trial')`,
      [id],
    );

    if ((subCheck.rows[0]?.count || 0) > 0) {
      throw new PlanError(
        "Cannot delete plan: it has active subscriptions. Mark as deprecated instead.",
        "INVALID_PLAN",
      );
    }

    const result = await postgresService.query(
      `DELETE FROM plans WHERE id = $1`,
      [id],
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Helper: Enrich plan with features and services
   */
  private async enrichPlanWithRelations(plan: Plan): Promise<PlanWithFeatures> {
    // Get features
    const featuresResult = await postgresService.query(
      `SELECT f.*, pf.value as pivot_value
       FROM features f
       JOIN plan_features pf ON f.id = pf.feature_id
       WHERE pf.plan_id = $1
       ORDER BY f.category, f.name`,
      [plan.id],
    );

    // Get services
    const servicesResult = await postgresService.query(
      `SELECT s.*, ps.quantity as pivot_quantity
       FROM services s
       JOIN plan_services ps ON s.id = ps.service_id
       WHERE ps.plan_id = $1
       ORDER BY s.category, s.name`,
      [plan.id],
    );

    return {
      ...plan,
      features: featuresResult.rows,
      services: servicesResult.rows,
    };
  }

  /**
   * Check if plan key exists
   */
  async planKeyExists(key: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM plans WHERE key = $1`;
    const params: unknown[] = [key];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await postgresService.query(query, params);

    return (result.rows[0]?.count || 0) > 0;
  }
}
