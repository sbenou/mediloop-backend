/**
 * Retry utility with exponential backoff
 *
 * Simple, custom retry implementation to avoid library compatibility issues
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  maxDelay?: number;
  multiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: unknown;
  attempts: number;
}

export class RetryService {
  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      maxDelay = 30000,
      multiplier = 2,
      jitter = true,
      retryCondition = () => true,
    } = options;

    let lastError: unknown;
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if we should retry based on the condition
        if (!retryCondition(error)) {
          throw error;
        }

        // Don't delay after the last attempt
        if (attempt < maxAttempts) {
          // Calculate delay with exponential backoff
          let waitTime = Math.min(currentDelay, maxDelay);

          // Add jitter (randomize delay by ±25%)
          if (jitter) {
            const jitterAmount = waitTime * 0.25;
            waitTime =
              waitTime - jitterAmount + Math.random() * jitterAmount * 2;
          }

          await new Promise((resolve) => setTimeout(resolve, waitTime));

          // Increase delay for next attempt
          currentDelay *= multiplier;
        }
      }
    }

    // If we get here, all attempts failed
    throw lastError;
  }

  static async executeWithResult<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<RetryResult<T>> {
    const maxAttempts = options.maxAttempts || 3;
    let attempts = 0;

    try {
      // Track attempts by wrapping the operation
      const wrappedOperation = async () => {
        attempts++;
        return await operation();
      };

      const result = await this.execute(wrappedOperation, options);
      return {
        success: true,
        result,
        attempts,
      };
    } catch (error) {
      return {
        success: false,
        error,
        attempts: maxAttempts,
      };
    }
  }

  // Predefined retry conditions
  static readonly conditions = {
    network: (error: unknown) => {
      const networkErrors = [
        "ECONNRESET",
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "connection_bad",
        "connection_failure",
      ];

      const message = error instanceof Error ? error.message : String(error);
      const code = (error as { code?: string }).code;

      return networkErrors.some(
        (errCode) => message?.includes(errCode) || code === errCode,
      );
    },

    database: (error: unknown) => {
      const dbErrors = [
        "connection_bad",
        "connection_failure",
        "server_closed_unexpectedly",
        "connection terminated",
      ];

      const message = error instanceof Error ? error.message : String(error);
      const code = (error as { code?: string }).code;

      return dbErrors.some(
        (errCode) => message?.includes(errCode) || code === errCode,
      );
    },

    temporary: (error: unknown) => {
      // Retry on temporary errors, not on permanent ones like syntax errors
      const permanentErrors = [
        "syntax_error",
        "undefined_table",
        "undefined_column",
        "permission_denied",
      ];

      const message = error instanceof Error ? error.message : String(error);
      const code = (error as { code?: string }).code;

      return !permanentErrors.some(
        (errCode) => message?.includes(errCode) || code === errCode,
      );
    },
  };
}
