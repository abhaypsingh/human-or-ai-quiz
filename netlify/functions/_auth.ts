import { extractTokenFromHeaders, verifyToken } from './middleware/auth';

export function getUser(event: any) {
  const token = extractTokenFromHeaders(event.headers || {});
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

export function requireUser(event: any) {
  const u = getUser(event);
  if (!u) {
    const e: any = new Error('unauthorized');
    (e.statusCode as any) = 401;
    throw e;
  }
  return u;
}

export function isAdmin(user: any): boolean {
  const roles: string[] = user?.app_metadata?.roles || [];
  return roles.includes('admin');
}