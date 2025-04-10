/**
 * Retry Manager for handling transient failures during build operations.
 * Provides configurable retry logic with delay between attempts.
 */

export class RetryManager {
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Creates a new RetryManager instance
   * 
   * @param maxRetries Maximum number of attempts to retry an operation
   * @param retryDelay Delay in milliseconds between retry attempts
   */
  constructor(maxRetries: number = 3, retryDelay: number = 5000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Executes an operation with configured retry logic
   * 
   * @param operation The async operation to execute
   * @param onRetry Optional callback that is invoked before each retry
   * @returns Promise resolving to the operation result
   * @throws The last error encountered if all retries fail
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        
        if (attempt < this.maxRetries) {
          console.log(`Retry attempt ${attempt}/${this.maxRetries} - waiting ${this.retryDelay}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    // If we get here, all retry attempts failed
    throw new Error(`Operation failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }
  
  /**
   * Sets the maximum number of retry attempts
   */
  setMaxRetries(maxRetries: number): void {
    this.maxRetries = maxRetries;
  }
  
  /**
   * Sets the delay between retry attempts
   */
  setRetryDelay(retryDelay: number): void {
    this.retryDelay = retryDelay;
  }
}