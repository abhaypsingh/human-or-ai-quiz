import type { Handler } from '@netlify/functions';
import { sql } from './_db';

export const handler: Handler = async (event) => {
  console.log('📊 [SESSION-STATS] Function entry with event:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    rawQuery: event.rawQuery,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('📊 [SESSION-STATS] Parsing query parameters...');
    const qp = new URLSearchParams(event.rawQuery || '');
    const session_id = qp.get('session_id');
    console.log('📊 [SESSION-STATS] Extracted session_id from query:', session_id);

    if (!session_id) {
      console.log('📊 [SESSION-STATS] Missing session_id, returning 400 error');
      return { statusCode: 400, body: 'missing session_id' };
    }

    console.log('📊 [SESSION-STATS] Executing database query to get session stats with params:', {
      session_id
    });

    const statsResult = await sql/*sql*/`
      SELECT 
        questions_answered as total_questions,
        score as correct,
        streak as streak_best
      FROM game_sessions 
      WHERE id = ${session_id}::uuid
    `;
    console.log('📊 [SESSION-STATS] Stats query completed, raw result:', statsResult);

    const [stats] = statsResult;
    console.log('📊 [SESSION-STATS] Extracted stats data:', stats);

    if (!stats) {
      // Return default stats if session not found
      console.log('📊 [SESSION-STATS] Session not found, returning default stats');
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          total_questions: 0, 
          correct: 0, 
          streak_best: 0 
        }) 
      };
    }

    const response = { 
      statusCode: 200, 
      body: JSON.stringify(stats) 
    };
    console.log('📊 [SESSION-STATS] Sending successful response:', response);

    return response;
  } catch (err: any) {
    console.error('📊 [SESSION-STATS] ERROR CAUGHT:', {
      error: err,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return default stats on error
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        total_questions: 0, 
        correct: 0, 
        streak_best: 0 
      }) 
    };
  }
};