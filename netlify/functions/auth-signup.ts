import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const handler: Handler = async (event) => {
  console.log('✨ AUTH-SIGNUP: Function entry point');
  console.log('✨ AUTH-SIGNUP: HTTP Method:', event.httpMethod);
  console.log('✨ AUTH-SIGNUP: Headers received:', JSON.stringify(event.headers, null, 2));
  console.log('✨ AUTH-SIGNUP: Body length:', event.body?.length || 0);

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    console.log('✨ AUTH-SIGNUP: Handling OPTIONS request - returning CORS headers');
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    console.log('✨ AUTH-SIGNUP: Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    console.log('✨ AUTH-SIGNUP: Starting signup process');
    console.log('✨ AUTH-SIGNUP: Parsing request body...');
    const { email, password, name } = JSON.parse(event.body || '{}');
    console.log('✨ AUTH-SIGNUP: Request parsed - email:', email, 'name:', name, 'password length:', password?.length || 0);

    if (!email || !password) {
      console.log('✨ AUTH-SIGNUP: Validation failed - missing email or password');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' }),
      };
    }

    // Validate email format
    console.log('✨ AUTH-SIGNUP: Validating email format for:', email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    console.log('✨ AUTH-SIGNUP: Email format validation result:', isValidEmail);
    if (!isValidEmail) {
      console.log('✨ AUTH-SIGNUP: Invalid email format provided:', email);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid email format' }),
      };
    }

    // Validate password length
    console.log('✨ AUTH-SIGNUP: Validating password length - provided length:', password.length);
    if (password.length < 8) {
      console.log('✨ AUTH-SIGNUP: Password too short - minimum 8 characters required');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Password must be at least 8 characters long' }),
      };
    }
    console.log('✨ AUTH-SIGNUP: Password validation passed');

    console.log('✨ AUTH-SIGNUP: All validations passed - connecting to database');
    console.log('✨ AUTH-SIGNUP: Database URL configured:', !!process.env.DATABASE_URL);
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if user already exists
    console.log('✨ AUTH-SIGNUP: Checking for existing user with email:', email);
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    console.log('✨ AUTH-SIGNUP: Existing user check completed - found:', existingUsers.length, 'users');

    if (existingUsers.length > 0) {
      console.log('✨ AUTH-SIGNUP: User already exists with this email:', email);
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'Email already registered' }),
      };
    }
    console.log('✨ AUTH-SIGNUP: Email is available for registration');

    // Hash password
    console.log('✨ AUTH-SIGNUP: Starting password hashing process');
    console.log('✨ AUTH-SIGNUP: Using bcrypt salt rounds: 10');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✨ AUTH-SIGNUP: Password hashed successfully - hash length:', passwordHash.length);

    // Create user
    console.log('✨ AUTH-SIGNUP: Creating new user in database');
    console.log('✨ AUTH-SIGNUP: User data - email:', email, 'name:', name || 'null');
    const newUsers = await sql`
      INSERT INTO users (email, name, password_hash, created_at)
      VALUES (${email}, ${name || null}, ${passwordHash}, NOW())
      RETURNING id, email, name
    `;
    console.log('✨ AUTH-SIGNUP: User creation query completed - returned users:', newUsers.length);

    if (newUsers.length === 0) {
      console.error('✨ AUTH-SIGNUP: Failed to create user - no rows returned from INSERT');
      throw new Error('Failed to create user');
    }

    const newUser = newUsers[0];
    console.log('✨ AUTH-SIGNUP: User created successfully - ID:', newUser.id, 'Email:', newUser.email, 'Name:', newUser.name);

    // Generate JWT token
    console.log('✨ AUTH-SIGNUP: Generating JWT token for new user');
    console.log('✨ AUTH-SIGNUP: JWT Secret configured:', !!JWT_SECRET);
    console.log('✨ AUTH-SIGNUP: Token payload - ID:', newUser.id, 'Email:', newUser.email, 'Name:', newUser.name);
    
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email,
        name: newUser.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✨ AUTH-SIGNUP: JWT token generated successfully - length:', token.length);

    const response = {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      }),
    };
    
    console.log('✨ AUTH-SIGNUP: Successful signup response prepared for user:', newUser.id);
    console.log('✨ AUTH-SIGNUP: Response status:', response.statusCode);
    return response;
  } catch (error) {
    console.error('✨ AUTH-SIGNUP: ERROR occurred during signup process');
    console.error('✨ AUTH-SIGNUP: Error type:', error?.constructor?.name);
    console.error('✨ AUTH-SIGNUP: Error message:', error?.message);
    console.error('✨ AUTH-SIGNUP: Full error stack:', error?.stack);
    
    // Log additional context for debugging
    console.error('✨ AUTH-SIGNUP: Error context - Database URL configured:', !!process.env.DATABASE_URL);
    console.error('✨ AUTH-SIGNUP: Error context - JWT Secret configured:', !!JWT_SECRET);
    
    // Log more specific error context if it's a database error
    if (error?.code) {
      console.error('✨ AUTH-SIGNUP: Database error code:', error.code);
    }
    if (error?.detail) {
      console.error('✨ AUTH-SIGNUP: Database error detail:', error.detail);
    }
    
    const errorResponse = {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
    
    console.log('✨ AUTH-SIGNUP: Error response prepared - status:', errorResponse.statusCode);
    return errorResponse;
  }
};