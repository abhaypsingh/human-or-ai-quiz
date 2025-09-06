import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';

export const handler: Handler = async (event) => {
  console.log('✅ [SUBMIT-GUESS] Function entry with event:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    body: event.body,
    rawQuery: event.rawQuery,
    timestamp: new Date().toISOString()
  });

  try {
    console.log('✅ [SUBMIT-GUESS] Attempting user authentication...');
    const user = requireUser(event);
    console.log('✅ [SUBMIT-GUESS] User authenticated successfully:', {
      userId: user.id,
      userEmail: user.email || 'no email',
      userProvider: user.provider || 'unknown'
    });

    console.log('✅ [SUBMIT-GUESS] Parsing request body...');
    const bodyStr = event.body || '{}';
    console.log('✅ [SUBMIT-GUESS] Raw body string:', bodyStr);
    
    const { session_id, passage_id, guess_source, time_ms } = JSON.parse(bodyStr);
    console.log('✅ [SUBMIT-GUESS] Parsed request data:', {
      session_id,
      passage_id,
      guess_source,
      time_ms
    });

    if (!session_id || !passage_id || !guess_source) {
      console.log('✅ [SUBMIT-GUESS] Missing required parameters, returning 400 error');
      return { statusCode: 400, body: 'bad request' };
    }

    console.log('✅ [SUBMIT-GUESS] Executing database query to get passage truth with params:', {
      passage_id
    });

    const truthResult = await sql/*sql*/`SELECT source_type FROM passages WHERE id = ${passage_id}::bigint`;
    console.log('✅ [SUBMIT-GUESS] Truth query completed, raw result:', truthResult);

    const [truth] = truthResult;
    console.log('✅ [SUBMIT-GUESS] Extracted truth data:', truth);

    if (!truth) {
      console.log('✅ [SUBMIT-GUESS] Passage not found, returning 404 error');
      return { statusCode: 404, body: 'passage not found' };
    }

    const correct = truth.source_type === guess_source;
    console.log('✅ [SUBMIT-GUESS] Calculated correctness:', {
      truth_source_type: truth.source_type,
      guess_source,
      correct
    });

    const finalTimeMs = time_ms || 0;
    console.log('✅ [SUBMIT-GUESS] Executing complex database transaction with params:', {
      session_id,
      user_id: user.id,
      passage_id,
      guess_source,
      is_correct: correct,
      time_ms: finalTimeMs
    });

    const transactionResult = await sql/*sql*/`
      INSERT INTO guesses (session_id, user_id, passage_id, guess_source, is_correct, time_ms)
      VALUES (${session_id}::uuid, ${user.id}::uuid, ${passage_id}::bigint, ${guess_source}::source_type, ${correct}, ${finalTimeMs}::int);
      UPDATE game_sessions
        SET questions_answered = questions_answered + 1,
            score = score + ${correct ? 1 : 0},
            streak = CASE WHEN ${correct} THEN streak + 1 ELSE 0 END
        WHERE id = ${session_id}::uuid AND user_id = ${user.id}::uuid;
      INSERT INTO user_stats (user_id, games_played, total_questions, correct, streak_best, last_played_at)
      VALUES (${user.id}::uuid, 0, 1, ${correct ? 1 : 0}, ${correct ? 1 : 0}, now())
      ON CONFLICT (user_id) DO UPDATE
        SET total_questions = user_stats.total_questions + 1,
            correct = user_stats.correct + ${correct ? 1 : 0},
            streak_best = GREATEST(user_stats.streak_best, (SELECT streak FROM game_sessions WHERE id = ${session_id}::uuid)),
            last_played_at = now();
    `;
    
    console.log('✅ [SUBMIT-GUESS] Database transaction completed successfully:', transactionResult);

    console.log('✅ [SUBMIT-GUESS] Executing database query to get updated session data with params:', {
      session_id
    });

    const sessionResult = await sql/*sql*/`SELECT score, streak FROM game_sessions WHERE id = ${session_id}::uuid`;
    console.log('✅ [SUBMIT-GUESS] Session data query completed, raw result:', sessionResult);

    const [sess] = sessionResult;
    console.log('✅ [SUBMIT-GUESS] Extracted session data:', sess);

    const responseData = { 
      correct, 
      truth: truth.source_type, 
      score: sess?.score || 0, 
      streak: sess?.streak || 0 
    };
    console.log('✅ [SUBMIT-GUESS] Final response data:', responseData);

    const response = { 
      statusCode: 200, 
      headers: {'content-type':'application/json'},
      body: JSON.stringify(responseData) 
    };
    console.log('✅ [SUBMIT-GUESS] Sending successful response:', response);

    return response;
  } catch (err: any) {
    console.error('✅ [SUBMIT-GUESS] ERROR CAUGHT:', {
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
    console.error('✅ [SUBMIT-GUESS] Sending error response:', errorResponse);
    
    return errorResponse;
  }
};