import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const handler: Handler = async (event) => {
  console.log('🔐 AUTH-LOGIN: Function entry point');
  console.log('🔐 AUTH-LOGIN: HTTP Method:', event.httpMethod);
  console.log('🔐 AUTH-LOGIN: Headers received:', JSON.stringify(event.headers, null, 2));
  console.log('🔐 AUTH-LOGIN: Body length:', event.body?.length || 0);

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('🔐 AUTH-LOGIN: Handling OPTIONS request - returning CORS headers');
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    console.log('🔐 AUTH-LOGIN: Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    console.log('🔐 AUTH-LOGIN: Starting login process');
    console.log('🔐 AUTH-LOGIN: Parsing request body...');
    const { email, password } = JSON.parse(event.body || '{}');
    console.log('🔐 AUTH-LOGIN: Request parsed - email:', email, 'password length:', password?.length || 0);

    if (!email || !password) {
      console.log('🔐 AUTH-LOGIN: Validation failed - missing email or password');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' }),
      };
    }

    console.log('🔐 AUTH-LOGIN: Validation passed - connecting to database');
    console.log('🔐 AUTH-LOGIN: Database URL configured:', !!process.env.DATABASE_URL);
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get user from database
    console.log('🔐 AUTH-LOGIN: Executing database query to find user by email:', email);
    const users = await sql`
      SELECT id, email, name, password_hash 
      FROM users 
      WHERE email = ${email}
    `;
    console.log('🔐 AUTH-LOGIN: Database query completed - users found:', users.length);

    if (users.length === 0) {
      console.log('🔐 AUTH-LOGIN: User not found in database for email:', email);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid email or password' }),
      };
    }

    const user = users[0];
    console.log('🔐 AUTH-LOGIN: User found - ID:', user.id, 'Name:', user.name);

    // Verify password
    console.log('🔐 AUTH-LOGIN: Starting password verification');
    console.log('🔐 AUTH-LOGIN: Password hash length:', user.password_hash?.length || 0);
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 AUTH-LOGIN: Password verification result:', isValidPassword);

    if (!isValidPassword) {
      console.log('🔐 AUTH-LOGIN: Password verification failed for user:', user.id);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid email or password' }),
      };
    }

    // Generate JWT token
    console.log('🔐 AUTH-LOGIN: Password verified successfully - generating JWT token');
    console.log('🔐 AUTH-LOGIN: JWT Secret configured:', !!JWT_SECRET);
    console.log('🔐 AUTH-LOGIN: Token payload - ID:', user.id, 'Email:', user.email, 'Name:', user.name);
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('🔐 AUTH-LOGIN: JWT token generated successfully - length:', token.length);

    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }),
    };
    
    console.log('🔐 AUTH-LOGIN: Successful login response prepared for user:', user.id);
    console.log('🔐 AUTH-LOGIN: Response status:', response.statusCode);
    return response;
  } catch (error) {
    console.error('🔐 AUTH-LOGIN: ERROR occurred during login process');
    console.error('🔐 AUTH-LOGIN: Error type:', error?.constructor?.name);
    console.error('🔐 AUTH-LOGIN: Error message:', error?.message);
    console.error('🔐 AUTH-LOGIN: Full error stack:', error?.stack);
    
    // Log additional context for debugging
    console.error('🔐 AUTH-LOGIN: Error context - Database URL configured:', !!process.env.DATABASE_URL);
    console.error('🔐 AUTH-LOGIN: Error context - JWT Secret configured:', !!JWT_SECRET);
    
    const errorResponse = {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
    
    console.log('🔐 AUTH-LOGIN: Error response prepared - status:', errorResponse.statusCode);
    return errorResponse;
  }
};