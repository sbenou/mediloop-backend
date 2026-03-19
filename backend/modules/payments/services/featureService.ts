import { PostgresClient } from "../../../shared/services/postgres/PostgresClient.ts";

export class QueryHelper {
  constructor(private client: PostgresClient) {}

  async executeInSchema(
    schemaName: string,
    operation: () => Promise<unknown>,
  ): Promise<unknown> {
    // Set search path to the specific tenant schema
    await this.client.query(`SET search_path TO "${schemaName}", public`);

    try {
      const result = await operation();
      return result;
    } finally {
      // Reset search path to default
      await this.client.query("SET search_path TO public");
    }
  }

  async insertWithReturn(
    table: string,
    data: Record<string, unknown>,
    schema?: string,
  ): Promise<Record<string, unknown>> {
    const tableName = schema ? `"${schema}".${table}` : table;
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

    const sql = `
      INSERT INTO ${tableName} (${columns.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.client.query(sql, values);
    return result.rows[0] as Record<string, unknown>;
  }

  async updateById(
    table: string,
    id: string,
    data: Record<string, unknown>,
    schema?: string,
  ): Promise<Record<string, unknown>> {
    const tableName = schema ? `"${schema}".${table}` : table;
    const columns = Object.keys(data);
    const values = Object.values(data);

    const setClause = columns
      .map((col, index) => `${col} = $${index + 2}`)
      .join(", ");

    const sql = `
      UPDATE ${tableName}
      SET ${setClause}, updated_at = now()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.client.query(sql, [id, ...values]);
    return result.rows[0] as Record<string, unknown>;
  }

  async findById(
    table: string,
    id: string,
    schema?: string,
  ): Promise<Record<string, unknown> | null> {
    const tableName = schema ? `"${schema}".${table}` : table;
    const sql = `SELECT * FROM ${tableName} WHERE id = $1`;

    const result = await this.client.query(sql, [id]);
    return (result.rows[0] as Record<string, unknown>) || null;
  }

  async findByField(
    table: string,
    field: string,
    value: unknown,
    schema?: string,
  ): Promise<Record<string, unknown>[]> {
    const tableName = schema ? `"${schema}".${table}` : table;
    const sql = `SELECT * FROM ${tableName} WHERE ${field} = $1`;

    const result = await this.client.query(sql, [value]);
    return (result.rows as Record<string, unknown>[]) || [];
  }

  async deleteById(
    table: string,
    id: string,
    schema?: string,
  ): Promise<boolean> {
    const tableName = schema ? `"${schema}".${table}` : table;
    const sql = `DELETE FROM ${tableName} WHERE id = $1`;

    const result = await this.client.query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async exists(
    table: string,
    field: string,
    value: unknown,
    schema?: string,
  ): Promise<boolean> {
    const tableName = schema ? `"${schema}".${table}` : table;
    const sql = `SELECT 1 FROM ${tableName} WHERE ${field} = $1 LIMIT 1`;

    const result = await this.client.query(sql, [value]);
    return result.rows && result.rows.length > 0;
  }

  async count(
    table: string,
    whereClause?: string,
    params?: unknown[],
    schema?: string,
  ): Promise<number> {
    const tableName = schema ? `"${schema}".${table}` : table;
    let sql = `SELECT COUNT(*) as count FROM ${tableName}`;

    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }

    const result = await this.client.query(sql, params);
    const count = (result.rows[0] as { count: string }).count;
    return parseInt(count);
  }

  // Utility for building complex queries
  buildSelectQuery(options: {
    table: string;
    columns?: string[];
    where?: string;
    orderBy?: string;
    limit?: number;
    offset?: number;
    schema?: string;
  }): { sql: string; params: unknown[] } {
    const {
      table,
      columns = ["*"],
      where,
      orderBy,
      limit,
      offset,
      schema,
    } = options;

    const tableName = schema ? `"${schema}".${table}` : table;
    let sql = `SELECT ${columns.join(", ")} FROM ${tableName}`;
    const params: unknown[] = [];

    if (where) {
      sql += ` WHERE ${where}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(offset);
      sql += ` OFFSET $${params.length}`;
    }

    return { sql, params };
  }
}
