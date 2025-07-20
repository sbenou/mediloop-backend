// Reusable retry utility for critical operations
export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  exponentialBackoff?: boolean
  jitter?: boolean
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
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      exponentialBackoff = true,
      jitter = true,
      retryCondition = () => true
    } = options

    let lastError: any
    let attempts = 0

    while (attempts <= maxRetries) {
      try {
        const result = await operation()
        return result
      } catch (error) {
        lastError = error
        attempts++

        // Don't retry if we've exceeded max attempts
        if (attempts > maxRetries) {
          break
        }

        // Don't retry if condition is not met
        if (!retryCondition(error)) {
          break
        }

        // Calculate delay
        let delay = baseDelay
        if (exponentialBackoff) {
          delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay)
        }

        // Add jitter to prevent thundering herd
        if (jitter) {
          delay = delay + Math.random() * delay * 0.1
        }

        console.log(`Operation failed (attempt ${attempts}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`, error.message)
        await this.sleep(delay)
      }
    }

    throw lastError
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
        attempts: 1 // This would need to be tracked properly
      }
    } catch (error) {
      return {
        success: false,
        error,
        attempts: (options.maxRetries || 3) + 1
      }
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Predefined retry conditions
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