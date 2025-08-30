import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';

export const handler: Handler = async (event) => {
  try {
    const user = requireUser(event);
    const [s] = await sql/*sql*/`SELECT games_played, total_questions, correct, streak_best, last_played_at FROM user_stats WHERE user_id = ${user.id}::uuid`;
    return { statusCode: 200, headers: {'content-type':'application/json'},
      body: JSON.stringify(s || { games_played: 0, total_questions: 0, correct: 0, streak_best: 0, last_played_at: null })
    };
  } catch (err:any) {
    return { statusCode: err.statusCode || 500, body: err.message || 'error' };
  }
};