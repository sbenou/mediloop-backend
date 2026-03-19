/**
 * Feature Service - Manages technical features (rate limits, storage, capacity)
 *
 * FIXED V2: Uses postgresService with proper type assertions via unknown
 */

import { postgresService } from "../../../shared/services/postgresService.ts";
import type {
  Feature,
  CreateFeatureDTO,
  UpdateFeatureDTO,
  FeatureCategory,
} from "../../../shared/types/index.ts";

export class FeatureService {
  // No constructor - uses singleton

  /**
   * Create a new feature
   */
  async createFeature(data: CreateFeatureDTO): Promise<Feature> {
    const result = await postgresService.query(
      `INSERT INTO features (
        name, key, category, description, default_value, value_type, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.name,
        data.key,
        data.category,
        data.description || null,
        data.default_value,
        data.value_type,
        data.metadata || null,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create feature");
    }

    return result.rows[0] as unknown as Feature;
  }

  /**
   * Get feature by ID
   */
  async getFeatureById(id: string): Promise<Feature | null> {
    const result = await postgresService.query(
      `SELECT * FROM features WHERE id = $1`,
      [id],
    );

    return (result.rows[0] as unknown as Feature) || null;
  }

  /**
   * Get feature by key
   */
  async getFeatureByKey(key: string): Promise<Feature | null> {
    const result = await postgresService.query(
      `SELECT * FROM features WHERE key = $1`,
      [key],
    );

    return (result.rows[0] as unknown as Feature) || null;
  }

  /**
   * Get all features, optionally filtered by category
   */
  async getFeatures(category?: FeatureCategory): Promise<Feature[]> {
    let query = `SELECT * FROM features`;
    const params: unknown[] = [];

    if (category) {
      query += ` WHERE category = $1`;
      params.push(category);
    }

    query += ` ORDER BY category, name`;

    const result = await postgresService.query(query, params);
    return result.rows as unknown as Feature[];
  }

  /**
   * Update feature
   */
  async updateFeature(
    id: string,
    data: UpdateFeatureDTO,
  ): Promise<Feature | null> {
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

    if (data.default_value !== undefined) {
      updates.push(`default_value = $${paramCount++}`);
      values.push(data.default_value);
    }

    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(data.metadata);
    }

    if (updates.length === 0) {
      return this.getFeatureById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await postgresService.query(
      `UPDATE features
       SET ${updates.join(", ")}
       WHERE id = $${paramCount}
       RETURNING *`,
      values,
    );

    return (result.rows[0] as unknown as Feature) || null;
  }

  /**
   * Delete feature (soft delete - check for dependencies first)
   */
  async deleteFeature(id: string): Promise<boolean> {
    // Check if feature is in use by any plans
    const usageCheck = await postgresService.query(
      `SELECT COUNT(*) as count FROM plan_features WHERE feature_id = $1`,
      [id],
    );

    const count = (usageCheck.rows[0] as { count: number })?.count || 0;
    if (count > 0) {
      throw new Error(
        "Cannot delete feature: it is currently assigned to one or more plans",
      );
    }

    const result = await postgresService.query(
      `DELETE FROM features WHERE id = $1`,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get features by category with count
   */
  async getFeaturesByCategory(): Promise<
    Array<{ category: FeatureCategory; count: number; features: Feature[] }>
  > {
    const features = await this.getFeatures();

    const grouped = features.reduce(
      (acc, feature) => {
        if (!acc[feature.category]) {
          acc[feature.category] = [];
        }
        acc[feature.category].push(feature);
        return acc;
      },
      {} as Record<FeatureCategory, Feature[]>,
    );

    return Object.entries(grouped).map(([category, features]) => ({
      category: category as FeatureCategory,
      count: features.length,
      features,
    }));
  }

  /**
   * Bulk get features by keys
   */
  async getFeaturesByKeys(keys: string[]): Promise<Feature[]> {
    if (keys.length === 0) return [];

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const result = await postgresService.query(
      `SELECT * FROM features WHERE key IN (${placeholders})`,
      keys,
    );

    return result.rows as unknown as Feature[];
  }

  /**
   * Check if feature key exists
   */
  async featureKeyExists(key: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM features WHERE key = $1`;
    const params: unknown[] = [key];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await postgresService.query(query, params);
    const count = (result.rows[0] as { count: number })?.count || 0;

    return count > 0;
  }
}
