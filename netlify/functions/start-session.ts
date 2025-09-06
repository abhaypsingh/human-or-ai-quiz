import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';
import crypto from 'crypto';

export const handler: Handler = async (event) => {
  console.log('🚀 [START-SESSION] Function entry with event:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    body: event.body,
    rawQuery: event.rawQuery,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('🚀 [START-SESSION] Attempting user authentication...');
    const user = requireUser(event);
    console.log('🚀 [START-SESSION] User authenticated successfully:', {
      userId: user.id,
      userEmail: user.email || 'no email',
      userProvider: user.provider || 'unknown'
    });

    console.log('🚀 [START-SESSION] Parsing request body...');
    const bodyStr = event.body || '{}';
    console.log('🚀 [START-SESSION] Raw body string:', bodyStr);
    
    const { category_filter } = JSON.parse(bodyStr);
    console.log('🚀 [START-SESSION] Parsed category_filter:', category_filter);

    const session_id = crypto.randomUUID();
    console.log('🚀 [START-SESSION] Generated session_id:', session_id);

    const finalCategoryFilter = category_filter || [];
    console.log('🚀 [START-SESSION] Executing database INSERT query with params:', {
      session_id,
      user_id: user.id,
      status: 'open',
      category_filter: finalCategoryFilter
    });

    const insertResult = await sql/*sql*/`
      INSERT INTO game_sessions (id, user_id, status, category_filter)
      VALUES (${session_id}::uuid, ${user.id}::uuid, 'open', ${finalCategoryFilter}::int[])
    `;
    
    console.log('🚀 [START-SESSION] Database INSERT completed successfully:', insertResult);

    const responseData = { session_id };
    console.log('🚀 [START-SESSION] Sending successful response:', responseData);

    return { statusCode: 200, body: JSON.stringify(responseData) };
  } catch (err: any) {
    console.error('🚀 [START-SESSION] ERROR CAUGHT:', {
      error: err,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      name: err.name,
      code: err.code,
      timestamp: new Date().toISOString()
    });
    
    const errorResponse = { 
      statusCode: err.statusCode || 500, 
      body: err.message || 'error' 
    };
    console.error('🚀 [START-SESSION] Sending error response:', errorResponse);
    
    return errorResponse;
  }
};