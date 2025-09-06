import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export function verifyToken(token: string): AuthUser | null {
  console.log('🔒 MIDDLEWARE-AUTH: verifyToken() called');
  console.log('🔒 MIDDLEWARE-AUTH: Token received - length:', token?.length || 0);
  console.log('🔒 MIDDLEWARE-AUTH: JWT Secret configured:', !!JWT_SECRET);
  
  try {
    console.log('🔒 MIDDLEWARE-AUTH: Starting JWT verification process');
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    console.log('🔒 MIDDLEWARE-AUTH: Token verified successfully');
    console.log('🔒 MIDDLEWARE-AUTH: Decoded user - ID:', decoded.id, 'Email:', decoded.email, 'Name:', decoded.name);
    return decoded;
  } catch (error) {
    console.error('🔒 MIDDLEWARE-AUTH: Token verification FAILED');
    console.error('🔒 MIDDLEWARE-AUTH: Verification error type:', error?.constructor?.name);
    console.error('🔒 MIDDLEWARE-AUTH: Verification error message:', error?.message);
    console.error('🔒 MIDDLEWARE-AUTH: Token that failed (first 10 chars):', token?.substring(0, 10) + '...');
    return null;
  }
}

export function extractTokenFromHeaders(headers: { [key: string]: string }): string | null {
  console.log('🔒 MIDDLEWARE-AUTH: extractTokenFromHeaders() called');
  console.log('🔒 MIDDLEWARE-AUTH: Headers received - keys:', Object.keys(headers));
  
  const authHeader = headers['authorization'] || headers['Authorization'];
  console.log('🔒 MIDDLEWARE-AUTH: Authorization header found:', !!authHeader);
  
  if (!authHeader) {
    console.log('🔒 MIDDLEWARE-AUTH: No authorization header present');
    return null;
  }

  console.log('🔒 MIDDLEWARE-AUTH: Authorization header length:', authHeader.length);
  console.log('🔒 MIDDLEWARE-AUTH: Authorization header prefix:', authHeader.substring(0, 20) + '...');

  const parts = authHeader.split(' ');
  console.log('🔒 MIDDLEWARE-AUTH: Authorization header parts:', parts.length);
  console.log('🔒 MIDDLEWARE-AUTH: Authorization scheme:', parts[0]);
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('🔒 MIDDLEWARE-AUTH: Invalid authorization header format - expected "Bearer <token>"');
    console.log('🔒 MIDDLEWARE-AUTH: Parts length:', parts.length, 'Scheme:', parts[0]);
    return null;
  }

  const token = parts[1];
  console.log('🔒 MIDDLEWARE-AUTH: Token extracted successfully - length:', token.length);
  console.log('🔒 MIDDLEWARE-AUTH: Token prefix:', token.substring(0, 10) + '...');
  return token;
}