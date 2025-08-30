import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import type { AuthenticatedUser, JWTPayload, SessionSecurityContext } from './types/index';

// JWT validation and parsing (for future enhancement)
// Note: This assumes you might want to add JWT token validation in the future
// Currently using Netlify Identity which handles this automatically

// Session security tracking
const activeSessions = new Map<string, SessionSecurityContext>();

// Clean up old sessions periodically (every 30 minutes)
setInterval(() => {
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  for (const [sessionId, context] of activeSessions.entries()) {
    if (new Date(context.last_activity).getTime() < thirtyMinutesAgo) {
      activeSessions.delete(sessionId);
    }
  }
}, 30 * 60 * 1000);

// Extract and validate user from Netlify context
export function getUser(context: HandlerContext): AuthenticatedUser | null {
  const user = context?.clientContext?.user;
  if (!user) return null;

  // Enhance user object with role information
  const roles = user.app_metadata?.roles || [];
  const permissions = extractPermissions(roles);
  
  return {
    ...user,
    roles,
    permissions,
    isAdmin: roles.includes('admin')
  };
}

// Require authenticated user with enhanced error information
export function requireUser(context: HandlerContext, requiredRoles: string[] = []): AuthenticatedUser {
  const user = getUser(context);
  
  if (!user) {
    const error: any = new Error('Authentication required');
    error.statusCode = 401;
    error.code = 'UNAUTHORIZED';
    error.details = {
      message: 'Valid authentication token required',
      timestamp: new Date().toISOString()
    };
    throw error;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasAnyRole(user, requiredRoles)) {
    const error: any = new Error('Insufficient permissions');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    error.details = {
      message: `Required roles: ${requiredRoles.join(', ')}`,
      userRoles: user.roles,
      timestamp: new Date().toISOString()
    };
    throw error;
  }

  return user;
}

// Check if user has admin role
export function isAdmin(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return user.roles.includes('admin') || user.roles.includes('super_admin');
}

// Check if user has any of the specified roles
export function hasAnyRole(user: AuthenticatedUser | null, roles: string[]): boolean {
  if (!user || !roles.length) return false;
  return roles.some(role => user.roles.includes(role));
}

// Check if user has all of the specified roles
export function hasAllRoles(user: AuthenticatedUser | null, roles: string[]): boolean {
  if (!user || !roles.length) return false;
  return roles.every(role => user.roles.includes(role));
}

// Check if user has specific permission
export function hasPermission(user: AuthenticatedUser | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission) || isAdmin(user);
}

// Extract permissions from roles
function extractPermissions(roles: string[]): string[] {
  const rolePermissions: Record<string, string[]> = {
    'admin': [
      'user:read',
      'user:write', 
      'user:delete',
      'passage:read',
      'passage:write',
      'passage:delete',
      'session:read',
      'session:write',
      'session:delete',
      'category:read',
      'category:write',
      'stats:read'
    ],
    'moderator': [
      'passage:read',
      'passage:write',
      'user:read',
      'session:read',
      'stats:read'
    ],
    'user': [
      'session:create',
      'guess:submit',
      'profile:read',
      'profile:write'
    ]
  };

  const permissions = new Set<string>();
  
  for (const role of roles) {
    const rolePerms = rolePermissions[role] || [];
    rolePerms.forEach(perm => permissions.add(perm));
  }

  // All authenticated users get basic permissions
  ['profile:read', 'session:create', 'guess:submit'].forEach(perm => permissions.add(perm));

  return Array.from(permissions);
}

// Rate limiting by user
const userActionCounts = new Map<string, { count: number; resetTime: number }>();

export function checkUserRateLimit(
  userId: string, 
  action: string, 
  maxActions: number = 100, 
  windowMinutes: number = 15
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  let userCount = userActionCounts.get(key);
  
  if (!userCount || now > userCount.resetTime) {
    userCount = { count: 1, resetTime: now + windowMs };
    userActionCounts.set(key, userCount);
    return { allowed: true, remaining: maxActions - 1, resetTime: userCount.resetTime };
  }
  
  if (userCount.count >= maxActions) {
    return { allowed: false, remaining: 0, resetTime: userCount.resetTime };
  }
  
  userCount.count++;
  return { 
    allowed: true, 
    remaining: maxActions - userCount.count, 
    resetTime: userCount.resetTime 
  };
}

// Session security tracking
export function trackUserSession(
  event: HandlerEvent,
  context: HandlerContext,
  sessionId?: string
): void {
  const user = getUser(context);
  if (!user || !sessionId) return;

  const securityContext: SessionSecurityContext = {
    user_id: user.sub,
    session_id: sessionId,
    ip_address: getClientIP(event),
    user_agent: event.headers['user-agent'] || 'unknown',
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    suspicious_activity: false
  };

  // Check for suspicious activity
  securityContext.suspicious_activity = detectSuspiciousActivity(user.sub, securityContext);
  
  activeSessions.set(sessionId, securityContext);
}

// Detect suspicious activity patterns
function detectSuspiciousActivity(userId: string, context: SessionSecurityContext): boolean {
  // Look for multiple sessions from different IPs
  const userSessions = Array.from(activeSessions.values())
    .filter(session => session.user_id === userId);
  
  if (userSessions.length > 3) {
    return true; // Too many concurrent sessions
  }
  
  const uniqueIPs = new Set(userSessions.map(session => session.ip_address));
  if (uniqueIPs.size > 2) {
    return true; // Sessions from too many different IPs
  }
  
  // Check for rapid session creation
  const recentSessions = userSessions.filter(session => {
    const sessionTime = new Date(session.created_at).getTime();
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return sessionTime > fiveMinutesAgo;
  });
  
  if (recentSessions.length > 5) {
    return true; // Too many sessions created recently
  }
  
  return false;
}

// Get client IP address
function getClientIP(event: HandlerEvent): string {
  const forwarded = event.headers['x-forwarded-for'];
  const realIP = event.headers['x-real-ip'];
  const clientIP = event.headers['x-client-ip'];

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  return 'unknown';
}

// Middleware for authentication
export function withAuth(requiredRoles: string[] = []) {
  return (handler: Function) => {
    return async (event: HandlerEvent, context: HandlerContext) => {
      try {
        // Get and validate user
        const user = requireUser(context, requiredRoles);
        
        // Track session if session_id is provided
        const sessionId = event.queryStringParameters?.session_id || 
                         (event.body ? JSON.parse(event.body).session_id : undefined);
        
        if (sessionId) {
          trackUserSession(event, context, sessionId);
        }
        
        // Check user rate limit for this action
        const action = event.path?.split('/').pop() || 'general';
        const rateLimitCheck = checkUserRateLimit(user.sub, action);
        
        if (!rateLimitCheck.allowed) {
          return {
            statusCode: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString()
            },
            body: JSON.stringify({
              error: 'Rate Limit Exceeded',
              message: 'Too many requests from this user',
              retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000),
              timestamp: new Date().toISOString()
            })
          };
        }
        
        // Add user to event context for handler use
        (event as any).user = user;
        (event as any).rateLimitInfo = rateLimitCheck;
        
        return await handler(event, context);
      } catch (error: any) {
        return {
          statusCode: error.statusCode || 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.code || 'Authentication Error',
            message: error.message || 'Authentication failed',
            details: error.details || null,
            timestamp: new Date().toISOString()
          })
        };
      }
    };
  };
}

// Middleware for admin-only access
export function withAdminAuth() {
  return withAuth(['admin']);
}

// Get session security information
export function getSessionSecurity(sessionId: string): SessionSecurityContext | null {
  return activeSessions.get(sessionId) || null;
}

// Clear user sessions (for logout)
export function clearUserSessions(userId: string): number {
  let cleared = 0;
  for (const [sessionId, context] of activeSessions.entries()) {
    if (context.user_id === userId) {
      activeSessions.delete(sessionId);
      cleared++;
    }
  }
  return cleared;
}

// Get active session count for user
export function getUserSessionCount(userId: string): number {
  return Array.from(activeSessions.values())
    .filter(session => session.user_id === userId).length;
}

// Validate session ownership
export function validateSessionOwnership(sessionId: string, userId: string): boolean {
  const sessionContext = activeSessions.get(sessionId);
  return sessionContext?.user_id === userId;
}

// Export enhanced functions that maintain backward compatibility
export { getUser as getBasicUser } from './_auth';
export { requireUser as requireBasicUser } from './_auth';
export { isAdmin as isBasicAdmin } from './_auth';