import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';

export const handler: Handler = async (event) => {
  console.log('📊 [ME-STATS] Function entry with event:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    body: event.body,
    rawQuery: event.rawQuery,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('📊 [ME-STATS] Attempting user authentication...');
    const user = requireUser(event);
    console.log('📊 [ME-STATS] User authenticated successfully:', {
      userId: user.id,
      userEmail: user.email || 'no email',
      userProvider: user.provider || 'unknown'
    });

    console.log('📊 [ME-STATS] Executing database SELECT query for user stats with params:', {
      user_id: user.id
    });

    const statsResult = await sql/*sql*/`SELECT games_played, total_questions, correct, streak_best, last_played_at FROM user_stats WHERE user_id = ${user.id}::uuid`;
    console.log('📊 [ME-STATS] Database SELECT completed, raw result:', statsResult);

    const [s] = statsResult;
    console.log('📊 [ME-STATS] Extracted first row from result:', s);

    const responseData = s || { games_played: 0, total_questions: 0, correct: 0, streak_best: 0, last_played_at: null };
    console.log('📊 [ME-STATS] Final response data (with defaults if needed):', responseData);

    const response = { 
      statusCode: 200, 
      headers: {'content-type':'application/json'},
      body: JSON.stringify(responseData)
    };
    console.log('📊 [ME-STATS] Sending successful response:', response);

    return response;
  } catch (err: any) {
    console.error('📊 [ME-STATS] ERROR CAUGHT:', {
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
    console.error('📊 [ME-STATS] Sending error response:', errorResponse);
    
    return errorResponse;
  }
};