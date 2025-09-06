import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';

export const handler: Handler = async (event) => {
  console.log('❓ [NEXT-QUESTION] Function entry with event:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    body: event.body,
    rawQuery: event.rawQuery,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('❓ [NEXT-QUESTION] Attempting user authentication...');
    const user = requireUser(event);
    console.log('❓ [NEXT-QUESTION] User authenticated successfully:', {
      userId: user.id,
      userEmail: user.email || 'no email',
      userProvider: user.provider || 'unknown'
    });

    console.log('❓ [NEXT-QUESTION] Parsing query parameters...');
    const qp = new URLSearchParams(event.rawQuery || '');
    const session_id = qp.get('session_id');
    console.log('❓ [NEXT-QUESTION] Extracted session_id from query:', session_id);

    if (!session_id) {
      console.log('❓ [NEXT-QUESTION] Missing session_id, returning 400 error');
      return { statusCode: 400, body: 'missing session_id' };
    }

    console.log('❓ [NEXT-QUESTION] Executing database query to load session and category filter with params:', {
      session_id,
      user_id: user.id
    });

    const sessionResult = await sql/*sql*/`SELECT category_filter FROM game_sessions WHERE id = ${session_id}::uuid AND user_id = ${user.id}::uuid AND status = 'open'`;
    console.log('❓ [NEXT-QUESTION] Session query completed, raw result:', sessionResult);

    const [sess] = sessionResult;
    console.log('❓ [NEXT-QUESTION] Extracted session data:', sess);

    if (!sess) {
      console.log('❓ [NEXT-QUESTION] Session not found, returning 404 error');
      return { statusCode: 404, body: 'session not found' };
    }

    const filter = sess.category_filter || [];
    console.log('❓ [NEXT-QUESTION] Category filter extracted:', filter);

    const passageQuery = `
      WITH r AS (SELECT random() AS k)
      (
        SELECT p.id, p.text, c.name AS category_name, c.css_category, c.theme_tokens
        FROM passages p
        JOIN categories c ON c.id = p.category_id, r
        WHERE (${filter.length} = 0 OR p.category_id = ANY(${filter}::int[]))
          AND NOT EXISTS (SELECT 1 FROM guesses g WHERE g.user_id = '${user.id}'::uuid AND g.passage_id = p.id)
          AND p.rand_key >= r.k
        ORDER BY p.rand_key ASC
        LIMIT 1
      )
      UNION ALL
      (
        SELECT p.id, p.text, c.name AS category_name, c.css_category, c.theme_tokens
        FROM passages p
        JOIN categories c ON c.id = p.category_id, r
        WHERE (${filter.length} = 0 OR p.category_id = ANY(${filter}::int[]))
          AND NOT EXISTS (SELECT 1 FROM guesses g WHERE g.user_id = '${user.id}'::uuid AND g.passage_id = p.id)
          AND p.rand_key < r.k
        ORDER BY p.rand_key ASC
        LIMIT 1
      )
      LIMIT 1;
    `;

    console.log('❓ [NEXT-QUESTION] Executing complex passage selection query with params:', {
      filterLength: filter.length,
      filter: filter,
      userId: user.id
    });
    console.log('❓ [NEXT-QUESTION] Full passage query SQL:', passageQuery);

    const rows = await sql(passageQuery);
    console.log('❓ [NEXT-QUESTION] Passage query completed, raw result:', rows);

    const row = rows[0] || null;
    console.log('❓ [NEXT-QUESTION] Selected passage (first row or null):', row);

    const response = { 
      statusCode: 200, 
      headers: { 'content-type': 'application/json' }, 
      body: JSON.stringify(row) 
    };
    console.log('❓ [NEXT-QUESTION] Sending successful response:', response);

    return response;
  } catch (err: any) {
    console.error('❓ [NEXT-QUESTION] ERROR CAUGHT:', {
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
    console.error('❓ [NEXT-QUESTION] Sending error response:', errorResponse);
    
    return errorResponse;
  }
};