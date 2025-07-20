import { retry, RetryOptions as DenoRetryOptions } from "https://deno.land/x/retry@v2.0.0/mod.ts"

// Extended retry options compatible with our existing API
export interface RetryOptions extends DenoRetryOptions {
  retryCondition?: (error: any) => boolean
}

export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: any
  attempts: number
}

export class RetryService {
  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      retryCondition = () => true,
      ...retryOpts
    } = options

    // Use the battle-tested retry library with our retry condition
    return await retry(async () => {
      try {
        return await operation()
      } catch (error) {
        // Check if we should retry based on the condition
        if (!retryCondition(error)) {
          // Don't retry - throw to stop retry loop
          throw new Error(`STOP_RETRY: ${error.message}`)
        }
        // Re-throw to continue retry loop
        throw error
      }
    }, {
      maxTry: (retryOpts.maxTry || 3) + 1, // +1 because deno retry counts initial attempt
      delay: retryOpts.delay || 1000,
      maxDelay: retryOpts.maxDelay || 30000,
      jitter: retryOpts.jitter || true,
      ...retryOpts
    })
  }

  static async executeWithResult<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    try {
      const result = await this.execute(operation, options)
      return {
        success: true,
        result,
        attempts: 1 // Deno retry doesn't expose attempt count easily
      }
    } catch (error) {
      return {
        success: false,
        error,
        attempts: (options.maxTry || 3) + 1
      }
    }
  }

  // Predefined retry conditions (kept for backward compatibility)
  static readonly conditions = {
    network: (error: any) => {
      const networkErrors = [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'connection_bad',
        'connection_failure'
      ]
      return networkErrors.some(code => 
        error.message?.includes(code) || error.code === code
      )
    },

    database: (error: any) => {
      const dbErrors = [
        'connection_bad',
        'connection_failure',
        'server_closed_unexpectedly',
        'connection terminated'
      ]
      return dbErrors.some(code => 
        error.message?.includes(code) || error.code === code
      )
    },

    temporary: (error: any) => {
      // Retry on temporary errors, not on permanent ones like syntax errors
      const permanentErrors = [
        'syntax_error',
        'undefined_table',
        'undefined_column',
        'permission_denied'
      ]
      return !permanentErrors.some(code => 
        error.message?.includes(code) || error.code === code
      )
    }
  }
}