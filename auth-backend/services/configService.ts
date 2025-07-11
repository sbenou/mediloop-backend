
// Centralized configuration service for managing application settings
export class ConfigService {
  private static instance: ConfigService;
  private currentSchema: string = 'public';
  private initialized: boolean = false;

  private constructor() {}

  // Singleton pattern to ensure single instance
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // Initialize the service (can be called multiple times safely)
  public initialize(): void {
    if (!this.initialized) {
      console.log('ConfigService initialized with schema:', this.currentSchema);
      this.initialized = true;
    }
  }

  // Get current tenant schema
  public getCurrentSchema(): string {
    return this.currentSchema;
  }

  // Set current tenant schema
  public setCurrentSchema(schema: string): void {
    console.log('ConfigService: Updating schema from', this.currentSchema, 'to', schema);
    this.currentSchema = schema;
  }

  // Reset to default schema
  public resetToDefaultSchema(): void {
    this.setCurrentSchema('public');
  }

  // Check if using default schema
  public isUsingDefaultSchema(): boolean {
    return this.currentSchema === 'public';
  }

  // Get schema for logging/debugging
  public getSchemaInfo(): { current: string; isDefault: boolean } {
    return {
      current: this.currentSchema,
      isDefault: this.isUsingDefaultSchema()
    };
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
