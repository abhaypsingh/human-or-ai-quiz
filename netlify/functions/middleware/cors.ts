import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import type { CorsOptions } from '../types/index';

// Default CORS options
const defaultOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export function createCors(options: CorsOptions = {}) {
  const corsOptions = { ...defaultOptions, ...options };

  return {
    // Handle CORS for the request
    handle: (event: HandlerEvent, context: HandlerContext): HandlerResponse | null => {
      const origin = event.headers.origin || event.headers.Origin || '';
      const method = event.httpMethod;

      // Check if origin is allowed
      const allowedOrigin = getAllowedOrigin(origin, corsOptions.origin);
      
      // Build CORS headers
      const headers: Record<string, string> = {};

      // Set Access-Control-Allow-Origin
      if (allowedOrigin !== null) {
        if (allowedOrigin === true || allowedOrigin === '*') {
          headers['Access-Control-Allow-Origin'] = origin || '*';
        } else {
          headers['Access-Control-Allow-Origin'] = allowedOrigin;
        }
      }

      // Set Access-Control-Allow-Credentials
      if (corsOptions.credentials && allowedOrigin !== '*') {
        headers['Access-Control-Allow-Credentials'] = 'true';
      }

      // Set Access-Control-Allow-Methods
      if (corsOptions.methods && corsOptions.methods.length > 0) {
        headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ');
      }

      // Set Access-Control-Allow-Headers
      if (corsOptions.allowedHeaders && corsOptions.allowedHeaders.length > 0) {
        headers['Access-Control-Allow-Headers'] = corsOptions.allowedHeaders.join(', ');
      }

      // Set Access-Control-Max-Age
      if (corsOptions.maxAge !== undefined) {
        headers['Access-Control-Max-Age'] = corsOptions.maxAge.toString();
      }

      // Handle preflight requests (OPTIONS)
      if (method === 'OPTIONS') {
        return {
          statusCode: corsOptions.optionsSuccessStatus || 204,
          headers,
          body: corsOptions.preflightContinue ? '' : 'OK'
        };
      }

      // Return headers to be merged with the actual response
      return { headers };
    },

    // Add CORS headers to a response
    addHeaders: (response: HandlerResponse, event: HandlerEvent): HandlerResponse => {
      const corsResponse = this.handle(event, {} as HandlerContext);
      
      if (!corsResponse || !corsResponse.headers) {
        return response;
      }

      return {
        ...response,
        headers: {
          ...response.headers,
          ...corsResponse.headers
        }
      };
    }
  };
}

// Helper function to determine if origin is allowed
function getAllowedOrigin(
  origin: string, 
  allowedOrigin: CorsOptions['origin']
): string | boolean | null {
  if (!allowedOrigin) {
    return null;
  }

  if (allowedOrigin === true) {
    return origin || '*';
  }

  if (allowedOrigin === false) {
    return null;
  }

  if (typeof allowedOrigin === 'string') {
    return allowedOrigin === origin ? origin : null;
  }

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin) ? origin : null;
  }

  if (typeof allowedOrigin === 'function') {
    return allowedOrigin(origin) ? origin : null;
  }

  return null;
}

// Create CORS middleware wrapper
export function withCors(options: CorsOptions = {}) {
  const cors = createCors(options);

  return (handler: Function) => {
    return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
      // Handle preflight requests immediately
      if (event.httpMethod === 'OPTIONS') {
        const corsResponse = cors.handle(event, context);
        if (corsResponse) {
          return corsResponse;
        }
      }

      try {
        // Call the actual handler
        const response = await handler(event, context);
        
        // Add CORS headers to the response
        return cors.addHeaders(response, event);
      } catch (error) {
        // Add CORS headers to error responses too
        const errorResponse: HandlerResponse = {
          statusCode: 500,
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        };

        return cors.addHeaders(errorResponse, event);
      }
    };
  };
}

// Predefined CORS configurations
export const corsPresets = {
  // Allow all origins (development only)
  permissive: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
  } as CorsOptions,

  // Production settings - restrict to specific domains
  production: {
    origin: [
      'https://your-app.netlify.app',
      'https://www.your-domain.com',
      'https://your-domain.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
  } as CorsOptions,

  // API-only settings
  api: {
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
    maxAge: 3600
  } as CorsOptions,

  // Webhook settings (minimal CORS)
  webhook: {
    origin: false,
    methods: ['POST'],
    allowedHeaders: ['Content-Type', 'User-Agent'],
    credentials: false
  } as CorsOptions,

  // Admin panel settings
  admin: {
    origin: [
      'https://admin.your-domain.com',
      process.env.ADMIN_URL
    ].filter(Boolean) as string[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
    maxAge: 600 // Shorter cache for admin
  } as CorsOptions
};

// Environment-based CORS configuration
export function getEnvironmentCors(): CorsOptions {
  const isDev = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isDev) {
    return corsPresets.permissive;
  }

  if (isProduction) {
    return corsPresets.production;
  }

  // Default to API settings for other environments
  return corsPresets.api;
}

// Export default CORS middleware
export const defaultCors = createCors(getEnvironmentCors());

// Quick access to common CORS handlers
export const handlePreflight = (event: HandlerEvent): HandlerResponse | null => {
  if (event.httpMethod === 'OPTIONS') {
    return defaultCors.handle(event, {} as HandlerContext);
  }
  return null;
};