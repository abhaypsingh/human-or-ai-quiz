import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { email, password, name } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid email format' }),
      };
    }

    // Validate password length
    if (password.length < 8) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Password must be at least 8 characters long' }),
      };
    }

    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'Email already registered' }),
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUsers = await sql`
      INSERT INTO users (email, name, password_hash, created_at)
      VALUES (${email}, ${name || null}, ${passwordHash}, NOW())
      RETURNING id, email, name
    `;

    if (newUsers.length === 0) {
      throw new Error('Failed to create user');
    }

    const newUser = newUsers[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email,
        name: newUser.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
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
  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};