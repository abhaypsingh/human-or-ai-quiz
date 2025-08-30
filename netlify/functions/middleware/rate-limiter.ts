import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import type { RateLimitOptions, RateLimitState } from '../types/index';

// Simple in-memory store for rate limiting
// In production, you might want to use Redis or another distributed cache
const rateLimitStore = new Map<string, RateLimitState>();

// Clean up expired entries periodically
const cleanup = () => {
  const now = Date.now();
  for (const [key, state] of rateLimitStore.entries()) {
    if (now > state.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyGenerator = (event) => getClientIP(event),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too Many Requests'
  } = options;

  return {
    check: (event: HandlerEvent, context: HandlerContext): { allowed: boolean; state: RateLimitState; error?: any } => {
      const key = keyGenerator(event, context);
      const now = Date.now();
      const resetTime = now + windowMs;

      let state = rateLimitStore.get(key);

      // Initialize or reset if window has expired
      if (!state || now > state.resetTime) {
        state = {
          count: 1,
          resetTime,
          remaining: Math.max(0, max - 1)
        };
        rateLimitStore.set(key, state);
        return { allowed: true, state };
      }

      // Check if limit exceeded
      if (state.count >= max) {
        return {
          allowed: false,
          state,
          error: {
            statusCode: 429,
            message,
            headers: {
              'Retry-After': Math.ceil((state.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': max.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(state.resetTime).toISOString()
            }
          }
        };
      }

      // Increment count
      state.count += 1;
      state.remaining = Math.max(0, max - state.count);
      rateLimitStore.set(key, state);

      return { allowed: true, state };
    },

    getHeaders: (state: RateLimitState) => ({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': state.remaining.toString(),
      'X-RateLimit-Reset': new Date(state.resetTime).toISOString()
    }),

    handleResponse: (
      allowed: boolean, 
      state: RateLimitState, 
      error?: any, 
      response?: any
    ) => {
      const headers = {
        ...error?.headers,
        ...(!allowed ? {} : {
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': state.remaining.toString(),
          'X-RateLimit-Reset': new Date(state.resetTime).toISOString()
        })
      };

      if (!allowed) {
        return {
          statusCode: error.statusCode || 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: JSON.stringify({
            error: 'Too Many Requests',
            message: error.message || 'Rate limit exceeded',
            retryAfter: Math.ceil((state.resetTime - Date.now()) / 1000),
            timestamp: new Date().toISOString()
          })
        };
      }

      // Add rate limit headers to successful response
      if (response) {
        return {
          ...response,
          headers: {
            ...response.headers,
            ...headers
          }
        };
      }

      return response;
    }
  };
}

// Rate limiting presets for different endpoint types
export const rateLimitPresets = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts per 15 minutes
  },

  // Moderate limits for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
  },

  // Generous limits for read-only endpoints
  readonly: {
    windowMs: 60 * 1000, // 1 minute
    max: 200 // 200 requests per minute
  },

  // Tight limits for expensive operations
  expensive: {
    windowMs: 60 * 1000, // 1 minute
    max: 10 // 10 requests per minute
  },

  // Very strict limits for admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: 30 // 30 requests per minute
  }
};

// Utility function to extract client IP
function getClientIP(event: HandlerEvent): string {
  // Check various headers for the real IP
  const forwarded = event.headers['x-forwarded-for'];
  const realIP = event.headers['x-real-ip'];
  const clientIP = event.headers['x-client-ip'];

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  // Fallback to a default if no IP is found
  return 'unknown';
}

// Enhanced key generators for different use cases
export const keyGenerators = {
  // Rate limit by IP address
  ip: (event: HandlerEvent) => `ip:${getClientIP(event)}`,

  // Rate limit by user (requires user context)
  user: (event: HandlerEvent, context: HandlerContext) => {
    const user = context?.clientContext?.user;
    return user ? `user:${user.sub}` : `ip:${getClientIP(event)}`;
  },

  // Rate limit by IP and endpoint combination
  ipAndEndpoint: (event: HandlerEvent) => {
    const path = event.path || event.rawUrl?.split('?')[0] || 'unknown';
    return `ip:${getClientIP(event)}:path:${path}`;
  },

  // Rate limit by user and endpoint combination
  userAndEndpoint: (event: HandlerEvent, context: HandlerContext) => {
    const path = event.path || event.rawUrl?.split('?')[0] || 'unknown';
    const user = context?.clientContext?.user;
    return user ? `user:${user.sub}:path:${path}` : `ip:${getClientIP(event)}:path:${path}`;
  }
};

// Helper function to create middleware wrapper
export function withRateLimit(options: RateLimitOptions) {
  const rateLimit = createRateLimit(options);

  return (handler: Function) => {
    return async (event: HandlerEvent, context: HandlerContext) => {
      const { allowed, state, error } = rateLimit.check(event, context);

      if (!allowed) {
        return rateLimit.handleResponse(false, state, error);
      }

      try {
        const response = await handler(event, context);
        return rateLimit.handleResponse(true, state, undefined, response);
      } catch (err) {
        // Don't add rate limit headers to error responses
        throw err;
      }
    };
  };
}

// Export common rate limiters
export const authRateLimit = createRateLimit({
  ...rateLimitPresets.auth,
  keyGenerator: keyGenerators.ip
});

export const apiRateLimit = createRateLimit({
  ...rateLimitPresets.api,
  keyGenerator: keyGenerators.user
});

export const adminRateLimit = createRateLimit({
  ...rateLimitPresets.admin,
  keyGenerator: keyGenerators.user
});

export const expensiveRateLimit = createRateLimit({
  ...rateLimitPresets.expensive,
  keyGenerator: keyGenerators.userAndEndpoint
});