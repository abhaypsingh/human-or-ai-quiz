import type { Handler } from '@netlify/functions';
import { sql } from './_db';

export const handler: Handler = async () => {
  try {
    const rows = await sql/*sql*/`
      SELECT user_id, total_questions, correct,
             CASE WHEN total_questions > 0 THEN (correct::float / total_questions) ELSE 0 END AS accuracy,
             streak_best, last_played_at
      FROM user_stats
      WHERE total_questions >= 30
      ORDER BY accuracy DESC, total_questions DESC
      LIMIT 50
    `;
    return { statusCode: 200, headers: {'content-type':'application/json'}, body: JSON.stringify(rows) };
  } catch (err:any) {
    return { statusCode: 500, body: err.message || 'error' };
  }
};