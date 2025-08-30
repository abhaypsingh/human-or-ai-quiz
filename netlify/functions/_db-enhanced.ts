import { neon, neonConfig } from '@neondatabase/serverless';
import type { DatabaseConfig, QueryContext, LogEntry } from './types/index';

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;
neonConfig.useSecureWebSocket = process.env.NODE_ENV === 'production';

// Database configuration
const dbConfig: DatabaseConfig = {
  url: process.env.DATABASE_URL,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
  retries: parseInt(process.env.DB_RETRIES || '3'),
  retryDelayMs: parseInt(process.env.DB_RETRY_DELAY_MS || '1000')
};

// Create the main SQL connection
export const sql = neon(dbConfig.url);

// Enhanced logging function
function logQuery(level: 'info' | 'warn' | 'error', message: string, context?: QueryContext, error?: Error) {
  const logEntry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      functionName: context?.functionName || 'database'
    }
  };

  if (error) {
    logEntry.context!.error = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
  }

  // In production, you might want to send this to a logging service like DataDog, Sentry, etc.
  if (process.env.NODE_ENV === 'development') {
    console.log(JSON.stringify(logEntry, null, 2));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// Retry logic with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  context?: QueryContext,
  maxRetries: number = dbConfig.retries || 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Log successful retry
      if (attempt > 0) {
        logQuery('info', `Query succeeded after ${attempt} retries`, {
          ...context,
          retryCount: attempt
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (shouldNotRetry(error as Error)) {
        logQuery('error', `Non-retryable database error: ${lastError.message}`, context, lastError);
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        logQuery('error', `Database query failed after ${maxRetries} retries: ${lastError.message}`, context, lastError);
        throw new DatabaseError(`Query failed after ${maxRetries} retries: ${lastError.message}`, lastError);
      }
      
      // Wait before retrying (exponential backoff with jitter)
      const baseDelay = (dbConfig.retryDelayMs || 1000) * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * baseDelay; // Add up to 10% jitter
      const delay = baseDelay + jitter;
      
      logQuery('warn', `Database query failed (attempt ${attempt + 1}), retrying in ${Math.round(delay)}ms`, {
        ...context,
        retryCount: attempt,
        delay: Math.round(delay)
      }, lastError);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Check if error should not be retried
function shouldNotRetry(error: Error): boolean {
  const nonRetryablePatterns = [
    /syntax error/i,
    /permission denied/i,
    /duplicate key/i,
    /foreign key constraint/i,
    /check constraint/i,
    /not null violation/i,
    /unique violation/i,
    /authentication failed/i,
    /relation .* does not exist/i,
    /column .* does not exist/i
  ];
  
  return nonRetryablePatterns.some(pattern => pattern.test(error.message));
}

// Custom database error class
export class DatabaseError extends Error {
  public originalError?: Error;
  public context?: QueryContext;
  public isRetryable: boolean;
  
  constructor(message: string, originalError?: Error, context?: QueryContext) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    this.context = context;
    this.isRetryable = originalError ? !shouldNotRetry(originalError) : false;
  }
}

// Enhanced query function with logging and retry logic
export async function query<T = any>(
  sqlQuery: string,
  params: any[] = [],
  context?: QueryContext
): Promise<T[]> {
  const startTime = Date.now();
  const queryText = sqlQuery.substring(0, 200) + (sqlQuery.length > 200 ? '...' : '');
  
  try {
    const result = await withRetry(async () => {
      return await sql(sqlQuery, params);
    }, context);
    
    const duration = Date.now() - startTime;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      logQuery('warn', `Slow query detected (${duration}ms)`, {
        ...context,
        duration,
        query: queryText
      });
    }
    
    // Log all queries in development for debugging
    if (process.env.NODE_ENV === 'development') {
      logQuery('info', `Query executed (${duration}ms)`, {
        ...context,
        duration,
        query: queryText,
        resultCount: Array.isArray(result) ? result.length : 1
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logQuery('error', `Query execution failed (${duration}ms)`, {
      ...context,
      duration,
      query: queryText
    }, error as Error);
    
    throw error;
  }
}

// Health check function
export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
  try {
    const startTime = Date.now();
    const result = await withRetry(async () => {
      return await sql`SELECT 1 as health_check, NOW() as server_time`;
    }, { functionName: 'healthCheck' }, 1); // Only try once for health checks
    
    const duration = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: {
        connectionTime: `${duration}ms`,
        serverTime: result[0]?.server_time,
        timestamp: new Date().toISOString(),
        config: {
          maxConnections: dbConfig.maxConnections,
          retries: dbConfig.retries,
          retryDelayMs: dbConfig.retryDelayMs
        }
      }
    };
  } catch (error) {
    logQuery('error', 'Database health check failed', { functionName: 'healthCheck' }, error as Error);
    return {
      status: 'unhealthy',
      details: {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Utility function to safely format SQL for logging
export function formatSqlForLogging(sql: string, maxLength: number = 200): string {
  const cleaned = sql.replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
}

// Export enhanced SQL function for backward compatibility with retry logic
const enhancedSql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const context: QueryContext = {
    functionName: 'enhancedSql',
    userId: undefined,
    sessionId: undefined
  };

  return await withRetry(async () => {
    return await sql(strings, ...values);
  }, context);
};

// Copy original properties to enhanced function
Object.setPrototypeOf(enhancedSql, sql);
Object.assign(enhancedSql, sql);

export default enhancedSql;