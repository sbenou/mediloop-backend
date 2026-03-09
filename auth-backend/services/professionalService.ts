/**
 * Service Service - Manages professional services (onboarding, training, support)
 *
 * This service handles CRUD operations for Services that represent
 * professional offerings included in subscription plans.
 *
 * File: auth-backend/services/professionalService.ts
 */

import { Pool } from "postgres";
import type {
  Service,
  CreateServiceDTO,
  UpdateServiceDTO,
  ServiceCategory,
} from "../types/rateLimiting.ts";

export class ProfessionalService {
  constructor(private pool: Pool) {}

  /**
   * Create a new service
   */
  async createService(data: CreateServiceDTO): Promise<Service> {
    const result = await this.pool.queryObject<Service>(
      `INSERT INTO services (
        name, key, category, description, is_recurring, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.name,
        data.key,
        data.category,
        data.description || null,
        data.is_recurring,
        data.metadata || null,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create service");
    }

    return result.rows[0];
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    const result = await this.pool.queryObject<Service>(
      `SELECT * FROM services WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Get service by key
   */
  async getServiceByKey(key: string): Promise<Service | null> {
    const result = await this.pool.queryObject<Service>(
      `SELECT * FROM services WHERE key = $1`,
      [key],
    );

    return result.rows[0] || null;
  }

  /**
   * Get all services, optionally filtered by category
   */
  async getServices(category?: ServiceCategory): Promise<Service[]> {
    let query = `SELECT * FROM services`;
    const params: unknown[] = [];

    if (category) {
      query += ` WHERE category = $1`;
      params.push(category);
    }

    query += ` ORDER BY category, name`;

    const result = await this.pool.queryObject<Service>(query, params);
    return result.rows;
  }

  /**
   * Update service
   */
  async updateService(
    id: string,
    data: UpdateServiceDTO,
  ): Promise<Service | null> {
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

    if (data.is_recurring !== undefined) {
      updates.push(`is_recurring = $${paramCount++}`);
      values.push(data.is_recurring);
    }

    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(data.metadata);
    }

    if (updates.length === 0) {
      return this.getServiceById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.pool.queryObject<Service>(
      `UPDATE services
       SET ${updates.join(", ")}
       WHERE id = $${paramCount}
       RETURNING *`,
      values,
    );

    return result.rows[0] || null;
  }

  /**
   * Delete service (soft delete - check for dependencies first)
   */
  async deleteService(id: string): Promise<boolean> {
    // Check if service is in use by any plans
    const usageCheck = await this.pool.queryObject<{ count: number }>(
      `SELECT COUNT(*) as count FROM plan_services WHERE service_id = $1`,
      [id],
    );

    if (usageCheck.rows[0]?.count > 0) {
      throw new Error(
        "Cannot delete service: it is currently assigned to one or more plans",
      );
    }

    const result = await this.pool.queryObject(
      `DELETE FROM services WHERE id = $1`,
      [id],
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get services by category with count
   */
  async getServicesByCategory(): Promise<
    Array<{ category: ServiceCategory; count: number; services: Service[] }>
  > {
    const services = await this.getServices();

    const grouped = services.reduce(
      (acc, service) => {
        if (!acc[service.category]) {
          acc[service.category] = [];
        }
        acc[service.category].push(service);
        return acc;
      },
      {} as Record<ServiceCategory, Service[]>,
    );

    return Object.entries(grouped).map(([category, services]) => ({
      category: category as ServiceCategory,
      count: services.length,
      services,
    }));
  }

  /**
   * Bulk get services by keys
   */
  async getServicesByKeys(keys: string[]): Promise<Service[]> {
    if (keys.length === 0) return [];

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const result = await this.pool.queryObject<Service>(
      `SELECT * FROM services WHERE key IN (${placeholders})`,
      keys,
    );

    return result.rows;
  }

  /**
   * Check if service key exists
   */
  async serviceKeyExists(key: string, excludeId?: string): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM services WHERE key = $1`;
    const params: unknown[] = [key];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await this.pool.queryObject<{ count: number }>(
      query,
      params,
    );

    return (result.rows[0]?.count || 0) > 0;
  }

  /**
   * Get recurring vs one-time services breakdown
   */
  async getServicesBreakdown(): Promise<{
    recurring: Service[];
    oneTime: Service[];
    totalRecurring: number;
    totalOneTime: number;
  }> {
    const services = await this.getServices();

    const recurring = services.filter((s) => s.is_recurring);
    const oneTime = services.filter((s) => !s.is_recurring);

    return {
      recurring,
      oneTime,
      totalRecurring: recurring.length,
      totalOneTime: oneTime.length,
    };
  }
}
