import type { Handler } from '@netlify/functions';
import { healthCheck as dbHealthCheck } from './_db-enhanced';
import { withCors } from './middleware/cors';
import type { HealthCheckResponse } from './types/index';

const startTime = Date.now();

export const handler: Handler = withCors({
  origin: true,
  methods: ['GET', 'OPTIONS']
})(async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only GET requests are allowed',
        timestamp: new Date().toISOString()
      })
    };
  }

  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  try {
    // Check database health
    const dbStatus = await dbHealthCheck();
    
    // Check memory usage (if available)
    const memoryUsage = process.memoryUsage ? process.memoryUsage() : undefined;
    
    // Determine overall health status
    const services = {
      database: dbStatus.status === 'healthy' ? 'up' as const : 'down' as const,
      auth: 'up' as const // Netlify Identity is always assumed to be up
    };

    const overallStatus: 'healthy' | 'unhealthy' = 
      Object.values(services).every(status => status === 'up') ? 'healthy' : 'unhealthy';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      services,
      uptime,
      memory: memoryUsage ? {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
      } : undefined
    };

    // Include detailed database information if requested
    const includeDetails = event.queryStringParameters?.details === 'true';
    if (includeDetails) {
      (response as any).details = {
        database: dbStatus.details,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          region: process.env.AWS_REGION || 'unknown'
        },
        headers: {
          userAgent: event.headers['user-agent'],
          origin: event.headers.origin,
          'x-forwarded-for': event.headers['x-forwarded-for'],
          'x-netlify-id': event.headers['x-netlify-id']
        }
      };
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(response, null, includeDetails ? 2 : undefined)
    };

  } catch (error) {
    console.error('Health check failed:', error);

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'down',
        auth: 'up'
      },
      uptime,
      memory: undefined
    };

    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({
        ...errorResponse,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
});