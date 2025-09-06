import { extractTokenFromHeaders, verifyToken } from './middleware/auth';

export function getUser(event: any) {
  console.log('🛡️ _AUTH: getUser() called');
  console.log('🛡️ _AUTH: Event headers present:', !!event.headers);
  console.log('🛡️ _AUTH: Event headers keys:', Object.keys(event.headers || {}));
  
  const token = extractTokenFromHeaders(event.headers || {});
  console.log('🛡️ _AUTH: Token extraction result:', !!token);
  
  if (!token) {
    console.log('🛡️ _AUTH: No token found - returning null');
    return null;
  }
  
  console.log('🛡️ _AUTH: Token found - proceeding to verify');
  const user = verifyToken(token);
  console.log('🛡️ _AUTH: Token verification result:', !!user);
  
  if (user) {
    console.log('🛡️ _AUTH: User verified - ID:', user.id, 'Email:', user.email);
  } else {
    console.log('🛡️ _AUTH: Token verification failed');
  }
  
  return user;
}

export function requireUser(event: any) {
  console.log('🛡️ _AUTH: requireUser() called');
  console.log('🛡️ _AUTH: Attempting to get user from event');
  
  const u = getUser(event);
  console.log('🛡️ _AUTH: getUser() result:', !!u);
  
  if (!u) {
    console.error('🛡️ _AUTH: User authentication REQUIRED but not found');
    console.error('🛡️ _AUTH: Throwing unauthorized error (401)');
    const e: any = new Error('unauthorized');
    (e.statusCode as any) = 401;
    throw e;
  }
  
  console.log('🛡️ _AUTH: User authentication SUCCESS');
  console.log('🛡️ _AUTH: Authenticated user - ID:', u.id, 'Email:', u.email);
  return u;
}

export function isAdmin(user: any): boolean {
  console.log('🛡️ _AUTH: isAdmin() called');
  console.log('🛡️ _AUTH: User provided:', !!user);
  console.log('🛡️ _AUTH: User ID:', user?.id);
  
  const roles: string[] = user?.app_metadata?.roles || [];
  console.log('🛡️ _AUTH: User app_metadata present:', !!user?.app_metadata);
  console.log('🛡️ _AUTH: User roles:', roles);
  
  const isUserAdmin = roles.includes('admin');
  console.log('🛡️ _AUTH: Admin check result:', isUserAdmin);
  
  return isUserAdmin;
}